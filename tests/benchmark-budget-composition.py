#!/usr/bin/env python3
"""ACTUAL-only focused dispatch regressions, not numerical benchmark evidence.

Use the COMPLETE driver with one coherent source overlay. Synthetic receipts
exercise orchestration only; no LOCAL48 input, oracle or timing is substituted.
The one real child-tree check runs a tiny Python process through real execute.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import time
import unittest
from unittest import mock

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--driver-dir', type=Path, required=True)
parser.add_argument('--chat', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
driver = args.driver_dir.resolve()
sys.path.insert(0, str(driver))
import bench_protocol as bp

owner = bp.pin(args.chat)
fd, owner_end = bp.admission(owner)
bp.require(os.environ.get(bp.PARENT_DEADLINE_ENV) is not None,
           'ACTUAL must export its original admitted job end for these selected-path tests')
bp.require(not args.output.exists(), 'fresh regression output required')
args.output.mkdir(parents=True)
real_execute = bp.execute


class BudgetComposition(unittest.TestCase):
    def setUp(self):
        self.root = args.output / self._testMethodName
        self.root.mkdir()
        self.queue = self.root / 'queue'
        self.queue.mkdir()
        self.selection = self.root / 'selection.json'
        bp.atomic(self.selection, {'regressionOnly': True})
        self.identity = 'synthetic-dispatch-regression-no-benchmark-credit'
        self.raw = self.root / 'plumbing-only.txt'
        self.raw.write_text('not a numerical observation\n')
        self.jobs = []
        rows = []
        for target in ('linux', 'wasm'):
            for index in range(24):
                row = dict(id=f'{target}.plumbing.{index}', target=target,
                           suite='symbolic', peers=[], source_pins=[],
                           fixture_pins=[], oracle_pins=[], peer_source_pins=[])
                rows.append(row)
                job = self.job('preflight.' + row['id'], 'preflight', [row], [])
                self.jobs.append(job)
                bp.atomic(self.queue / (job['id'] + '.json'), self.receipt(job))
        for index in range(24):
            pair = [rows[index], rows[24 + index]]
            self.jobs.append(self.job(f'parity.plumbing.{index}', 'parity', pair,
                                     ['preflight.' + row['id'] for row in pair]))
        for row in rows:
            self.jobs.append(self.job('measure.' + row['id'], 'measure', [row],
                                     [job['id'] for job in self.jobs[:72]]))
        self.key = 'parity.plumbing.0'
        self.manifest = self.root / 'bound.json'
        bp.atomic(self.manifest, dict(schema='vkf-peer32-operational-v1', rows=48,
                  jobs=self.jobs, actual_owner_chat=owner, inputs=[],
                  selection=bp.pin(self.selection), selection_identity=self.identity,
                  corpus=bp.pin(self.selection), prepared=bp.pin(self.selection)))
        self.closure = mock.patch.object(bp, 'closure', return_value=self.identity)
        self.closure.start()
        self.addCleanup(self.closure.stop)

    def job(self, key, phase, rows, needs):
        return dict(id=key, phase=phase, needs=needs,
                    argv=['/usr/bin/python3', '-B', str(driver / 'bench-job.py'),
                          '{bound_manifest}', key, '{queue}'],
                    expectation=dict(job=key, phase=phase, rows=rows,
                                     component_plan=self.identity))

    def receipt(self, job):
        return dict(expectation=job['expectation'], actual=True, harness_only=False,
                    status='PASS', oracle_unchanged=True, accepted_samples=0,
                    component_selection=self.identity,
                    observations=[dict(row_id=row['id'], language='vkf',
                                       stdout='plumbing only')
                                  for row in job['expectation']['rows']],
                    raw_evidence=[bp.pin(self.raw)])

    def dispatch(self):
        argv = ['regression', '--driver-dir', str(driver), '--manifest',
                str(self.manifest), '--queue', str(self.queue), '--only-job', self.key]
        with mock.patch.object(sys, 'argv', argv):
            return runpy.run_path(str(driver / 'run-required-correctness.py'))['main']()

    def result(self):
        return bp.read(self.queue / (self.key + '.json'))

    def test_selected_dispatch_keeps_full_leaf_cap_and_original_shared_boundary(self):
        before = os.environ.get(bp.PARENT_DEADLINE_ENV)
        inherited = min(float(before), time.monotonic() + 100)
        calls = []

        def oracle(argv, directory, label, actual_owner, env=None, timeout=600):
            # The sole external boundary is the original oracle, not another
            # Python bench-job/driver process. No numerical oracle is run here.
            self.assertEqual(Path(argv[1]), driver / 'benchmark-oracle.mjs')
            self.assertEqual(label, 'original-oracle')
            self.assertEqual(timeout, 600)
            self.assertEqual(actual_owner, owner)
            boundary = float(os.environ[bp.PARENT_DEADLINE_ENV])
            self.assertEqual(boundary, min(inherited, owner_end - 420))
            calls.append(boundary)
            return '', 1, bp.pin(self.raw)

        with mock.patch.dict(os.environ, {bp.PARENT_DEADLINE_ENV: str(inherited)}):
            with mock.patch.object(bp, 'execute', side_effect=oracle):
                self.assertEqual(self.dispatch(), 0)
            self.assertEqual(os.environ[bp.PARENT_DEADLINE_ENV], str(inherited))
        self.assertEqual(os.environ.get(bp.PARENT_DEADLINE_ENV), before)
        self.assertEqual(len(calls), 1)
        self.assertEqual(self.result()['status'], 'PASS')
        self.assertFalse((self.queue / ('dispatch.' + self.key)).exists())
        self.assertFalse((self.queue / self.key / 'driver.join.json').exists())

    def test_real_selected_path_refuses_unfit_oracle_before_any_spawn(self):
        inherited = time.monotonic() + 40.5
        with mock.patch.dict(os.environ, {bp.PARENT_DEADLINE_ENV: str(inherited)}):
            with mock.patch.object(bp.subprocess, 'Popen') as spawn:
                self.assertEqual(self.dispatch(), 2)
                spawn.assert_not_called()
            self.assertEqual(os.environ[bp.PARENT_DEADLINE_ENV], str(inherited))
        result = self.result()
        self.assertEqual(result['status'], 'UNRUN')
        self.assertIn('cap=600s cleanup=40s', result['reason'])
        summary = bp.read(self.root / ('CORRECTNESS-' + self.key + '.json'))
        self.assertEqual(summary['stopReason']['status'], 'UNRUN')
        self.assertEqual(summary['testsFailed'], 0)

    def test_missing_actual_job_boundary_refuses_before_any_spawn(self):
        with mock.patch.dict(os.environ):
            os.environ.pop(bp.PARENT_DEADLINE_ENV, None)
            with mock.patch.object(bp.subprocess, 'Popen') as spawn:
                with self.assertRaisesRegex(bp.Blocked, 'admitted actual job execution boundary required'):
                    self.dispatch()
                spawn.assert_not_called()
                with self.assertRaisesRegex(bp.Blocked, 'admitted actual job execution boundary required'):
                    runpy.run_path(str(driver / 'bench-job.py'))['main'](
                        self.manifest, self.key, self.queue)
                spawn.assert_not_called()
        self.assertFalse((self.queue / self.key).exists())

    def test_full_cap_boundary_is_strict_and_never_clipped(self):
        with mock.patch.object(bp.time, 'monotonic', return_value=1000):
            with mock.patch.dict(os.environ, {bp.PARENT_DEADLINE_ENV: '1041'}):
                with mock.patch.object(bp.subprocess, 'Popen') as spawn:
                    with self.assertRaisesRegex(bp.Blocked, 'command not spawned'):
                        real_execute(['never-spawn'], self.root / 'refused', 'child', owner,
                                     timeout=1)
                    spawn.assert_not_called()
            with mock.patch.dict(os.environ, {bp.PARENT_DEADLINE_ENV: '1041.001'}):
                self.assertEqual(bp.command_deadline(2000, 1), 1041.001)
        self.assertFalse((self.root / 'refused').exists())

    def test_driver_timeout_identity_survives_direct_dispatch(self):
        failure = subprocess.TimeoutExpired(['original-oracle'], 600)
        with mock.patch.object(bp, 'execute', side_effect=failure):
            self.assertEqual(self.dispatch(), 2)
        result = self.result()
        self.assertEqual(result['status'], 'FAIL')
        self.assertEqual(result['failure_type'], 'TimeoutExpired')
        self.assertEqual(result['normal_cap_seconds'], 600)
        self.assertEqual(result['reason'], str(failure))

    def test_invalid_receipt_cannot_hide_as_admission_unrun(self):
        atomic = bp.atomic

        def wrong_candidate(path, value):
            if Path(path) == self.queue / self.key / 'result.json':
                value = dict(value, component_selection='wrong-candidate')
            return atomic(path, value)

        with mock.patch.object(bp, 'atomic', side_effect=wrong_candidate):
            with mock.patch.object(bp, 'execute', side_effect=bp.Blocked('UNRUN: test refusal')):
                self.assertEqual(self.dispatch(), 2)
        summary = bp.read(self.root / ('CORRECTNESS-' + self.key + '.json'))
        self.assertEqual(summary['stopReason']['status'], 'FAIL')
        self.assertEqual(summary['testsFailed'], 1)
        self.assertIn('candidate/expectation mismatch', summary['stopReason']['error'])

    def test_real_nonzero_leaf_stays_failure_with_joined_exit7(self):
        joins = []

        def failed_oracle(argv, directory, label, actual_owner, env=None, timeout=600):
            self.assertEqual(timeout, 600)
            try:
                return real_execute([sys.executable, '-B', '-c',
                                     "import sys;print('kept-error');sys.exit(7)"],
                                    directory, label, actual_owner, timeout=1)
            finally:
                joins.append(bp.read(Path(directory) / (label + '.join.json')))

        with mock.patch.object(bp, 'execute', side_effect=failed_oracle):
            self.assertEqual(self.dispatch(), 2)
        result = self.result()
        self.assertEqual(result['status'], 'FAIL')
        self.assertNotIn('failure_type', result)
        self.assertEqual(joins[0]['exit'], 7)
        self.assertTrue(joins[0]['allOwnedJoined'])
        self.assertFalse(joins[0]['timedOut'])
        self.assertEqual(Path(joins[0]['stdout']['path']).read_text(), 'kept-error\n')

    def test_one_leaf_owns_nested_child_cleanup_without_dispatch_owner(self):
        # Adapt only the test oracle boundary to a tiny process with a test
        # cap. The benchmark's default600 request is asserted, never qualified.
        source = ("import os,time\nif os.fork():os._exit(0)\n"
                  "time.sleep(.05)\nos.write(1,b'complete-descendant-output\\n')\n")
        joins = []

        def tiny_oracle(argv, directory, label, actual_owner, env=None, timeout=600):
            self.assertEqual(timeout, 600)
            output, elapsed, joined = real_execute(
                [sys.executable, '-B', '-c', source], directory, label,
                actual_owner, timeout=1)
            self.assertEqual(output, 'complete-descendant-output\n')
            joins.append(bp.read(joined['path']))
            return output, elapsed, joined

        with mock.patch.object(bp, 'execute', side_effect=tiny_oracle):
            self.assertEqual(self.dispatch(), 0)
        self.assertEqual(len(joins), 1)
        self.assertTrue(joins[0]['allOwnedJoined'])
        self.assertEqual(joins[0]['pendingCleanup'], [])
        self.assertTrue(joins[0]['adoptedJoins'])
        self.assertFalse(any(row['terminationRequested'] for row in joins[0]['owned']))

    def test_numerical_driver_and_compile_clock_are_exact_final800(self):
        for name, expected in {
            'bench-driver.py': 'a839626a61fd7376f80a9fa9e2a4d821b85a5cdfd034f5d809dc10851dceb88d',
            'compile-clock.py': '6ea7948a988796ac2d1d4860d7f7f1f8e9e2a81213fa9717b651f6618c4a187f',
        }.items():
            self.assertEqual(hashlib.sha256((driver / name).read_bytes()).hexdigest(), expected)


if __name__ == '__main__':
    unittest.main(argv=[sys.argv[0]], verbosity=2)
