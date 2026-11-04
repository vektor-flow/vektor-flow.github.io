#!/usr/bin/env python3
"""Focused real-process execute regressions; ACTUAL only, inherited admission.

Run against the COMPLETE existing driver with the frozen source overlay, not
this repository's partial release-local48 directory. No benchmark row is run.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import unittest
from unittest import mock

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--driver-dir',type=Path,required=True)
parser.add_argument('--chat',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
sys.path.insert(0,str(args.driver_dir.resolve()))
import bench_protocol as bp
owner=bp.pin(args.chat)
fd,deadline=bp.admission(owner)
bp.require(not args.output.exists(),'fresh regression output required')
args.output.mkdir(parents=True)


class ExecuteCleanup(unittest.TestCase):
    def run_command(self,source,cap=2):
        directory=args.output/self._testMethodName
        return bp.execute([sys.executable,'-B','-c',source],directory,'child',owner,timeout=cap)

    def receipt(self):
        return json.loads((args.output/self._testMethodName/'child.join.json').read_text())

    def test_success_preserves_whole_output_without_termination(self):
        output,elapsed,joined=self.run_command(
            "import sys;sys.stdout.write('whole-output\\n'*20000);sys.stderr.write('whole-error\\n'*20000)")
        self.assertEqual(output,'whole-output\n'*20000)
        receipt=self.receipt()
        self.assertEqual(Path(receipt['stderr']['path']).read_text(),'whole-error\n'*20000)
        self.assertEqual(receipt['exit'],0)
        self.assertTrue(receipt['waited'] and receipt['allOwnedJoined'])
        self.assertEqual(receipt['pendingCleanup'],[])
        self.assertFalse(any(row['terminationRequested'] for row in receipt['owned']))

    def test_nonzero_preserves_exit_and_output(self):
        with self.assertRaises(bp.Blocked):
            self.run_command("import sys;print('kept');print('failure',file=sys.stderr);sys.exit(7)")
        receipt=self.receipt()
        self.assertEqual(receipt['exit'],7)
        self.assertTrue(receipt['waited'] and receipt['allOwnedJoined'])
        self.assertFalse(receipt['timedOut'])
        self.assertEqual(Path(receipt['stdout']['path']).read_text(),'kept\n')
        self.assertEqual(Path(receipt['stderr']['path']).read_text(),'failure\n')

    def test_timeout_preserves_identity_and_cooperatively_joins(self):
        source="""import signal,sys,time
def stop(sig,frame):
    print('cooperative-stop',flush=True)
    sys.exit(0)
signal.signal(signal.SIGTERM,stop)
print('ready',flush=True)
time.sleep(30)
"""
        with self.assertRaises(subprocess.TimeoutExpired) as caught:
            self.run_command(source,cap=.5)
        self.assertEqual(caught.exception.timeout,.5)
        receipt=self.receipt()
        self.assertTrue(receipt['timedOut'])
        self.assertEqual(receipt['errorType'],'TimeoutExpired')
        self.assertEqual(receipt['normalCapSeconds'],.5)
        self.assertTrue(receipt['waited'] and receipt['allOwnedJoined'])
        self.assertEqual(receipt['pendingCleanup'],[])
        self.assertIn('cooperative-stop',Path(receipt['stdout']['path']).read_text())

    def test_leader_exit_waits_for_descendant_and_final_output(self):
        source="""import os,time
if os.fork():os._exit(0)
time.sleep(.15)
os.write(1,b'descendant-complete\\n')
os._exit(0)
"""
        output,elapsed,joined=self.run_command(source)
        self.assertEqual(output,'descendant-complete\n')
        receipt=self.receipt()
        self.assertTrue(receipt['allOwnedJoined'])
        self.assertTrue(receipt['adoptedJoins'])
        self.assertFalse(any(row['terminationRequested'] for row in receipt['owned']))

    def test_compile_clock_cancellation_drains_owned_cli_pipes(self):
        source="""import signal,sys,time
def stop(sig,frame):
    sys.stdout.write('cli-final-output\\n');sys.stdout.flush()
    sys.stderr.write('cli-final-error\\n');sys.stderr.flush()
    sys.exit(0)
signal.signal(signal.SIGTERM,stop)
sys.stdout.write('cli-before-stop\\n');sys.stdout.flush()
time.sleep(30)
"""
        directory=args.output/self._testMethodName
        with self.assertRaises(subprocess.TimeoutExpired):
            bp.execute([sys.executable,'-B',str(args.driver_dir/'compile-clock.py'),
                        sys.executable,'-B','-c',source],directory,'child',owner,timeout=.5)
        receipt=self.receipt()
        self.assertTrue(receipt['timedOut'] and receipt['allOwnedJoined'])
        self.assertEqual(receipt['pendingCleanup'],[])
        self.assertEqual(Path(receipt['stdout']['path']).read_text(),
                         'cli-before-stop\ncli-final-output\n')
        self.assertIn('cli-final-error\n',Path(receipt['stderr']['path']).read_text())

    def test_orphan_failure_is_not_hidden_by_successful_leader(self):
        with self.assertRaisesRegex(bp.Blocked,'owned descendant failed'):
            self.run_command("import os,time\nif os.fork():os._exit(0)\ntime.sleep(.05)\nos._exit(7)")
        receipt=self.receipt()
        self.assertEqual(receipt['exit'],0)
        self.assertTrue(receipt['allOwnedJoined'])
        self.assertTrue(any(os.waitstatus_to_exitcode(row['waitStatus'])==7
                            for row in receipt['adoptedJoins']))

    def test_insufficient_full_budget_refuses_before_spawn(self):
        # Only substitute a near deadline, never a shortened requested cap.
        with mock.patch.object(bp,'admission',return_value=(fd,time.monotonic()+40.5)):
            with mock.patch.object(bp.subprocess,'Popen') as spawn:
                with self.assertRaisesRegex(bp.Blocked,'full normal command cap'):
                    self.run_command("raise AssertionError('must never start')",cap=1)
                spawn.assert_not_called()
        with mock.patch.dict(os.environ,{bp.PARENT_DEADLINE_ENV:str(time.monotonic()+40.5)}):
            with mock.patch.object(bp.subprocess,'Popen') as spawn:
                with self.assertRaisesRegex(bp.Blocked,'UNRUN: full normal command cap'):
                    self.run_command("raise AssertionError('must never start')",cap=1)
                spawn.assert_not_called()

    def test_unrelated_child_is_not_signalled_or_adopted(self):
        other=subprocess.Popen([sys.executable,'-B','-c','import sys;sys.stdin.read()'],stdin=subprocess.PIPE)
        try:
            with self.assertRaisesRegex(bp.Blocked,'unrelated children'):
                self.run_command("raise AssertionError('must never start')")
            self.assertIsNone(other.poll())
        finally:
            other.communicate(timeout=2)
        self.assertEqual(other.returncode,0)

    def test_reused_or_absent_identity_never_receives_signal(self):
        job=object.__new__(bp._OwnedJob)
        job.owned={(123,10):dict(identity=dict(pid=123,startTicks=10),handle=456,terminationRequested=False)}
        for current in [None,dict(pid=123,startTicks=11,state='S')]:
            with mock.patch.object(bp,'_process_identity',return_value=current):
                with mock.patch.object(bp.signal,'pidfd_send_signal') as send:
                    job.stop()
                    send.assert_not_called()


if __name__=='__main__':
    unittest.main(argv=[sys.argv[0]],verbosity=2)
