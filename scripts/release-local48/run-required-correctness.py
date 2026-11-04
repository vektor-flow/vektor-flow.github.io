#!/usr/bin/env python3
"""Batch existing correctness jobs inside a fresh admitted owner's session.

Uses the unchanged bench-job pipeline and an already prepared, same-candidate
queue. Acquires no lock, creates no controller, builds no compiler and publishes
nothing. Actual execution belongs to the future assigned owner after Math closes.
"""
import argparse
import math
import os
import runpy
import sys
import time
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--driver-dir', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--queue', type=Path, required=True)
    parser.add_argument('--only-job', help='One existing correctness ID; retain all72 states and full normal cap')
    args = parser.parse_args()
    driver = args.driver_dir.resolve()
    sys.path.insert(0, str(driver))
    from bench_protocol import (PARENT_DEADLINE_ENV, admission, atomic, closure,
                                pin, read, require, verify_pin)
    from benchmark_jobs import validate_result

    manifest = args.manifest.resolve()
    queue = args.queue.resolve()
    bound = read(manifest)
    require(bound['schema'] == 'vkf-peer32-operational-v1', 'normal manifest')
    require(bound['rows'] == 48 and len(bound['jobs']) == 120,
            'preserve existing inventory; timing is separate')
    owner = bound['actual_owner_chat']
    admission(owner)
    # The ACTUAL controller can have a shorter admitted job cap than CHAT STOP.
    # Its caller must export that original absolute end, never now+another cap.
    require(os.environ.get(PARENT_DEADLINE_ENV) is not None,
            'UNRUN: admitted actual job execution boundary required; command not spawned')
    for source in bound['inputs']:
        verify_pin(source)
    identity = bound['selection_identity']
    require(closure(read(verify_pin(bound['selection']))) == identity,
            'changed candidate')
    require(queue.is_dir(), 'normal fresh-owner intake queue required')
    summary_path = queue.parent / (('CORRECTNESS-' + args.only_job + '.json')
                                   if args.only_job else 'CORRECTNESS-BATCH.json')
    require(not summary_path.exists(), 'batch already attempted; no unchanged retry')
    jobs = {job['id']: job for job in bound['jobs']
            if job['phase'] in ('preflight', 'parity')}
    require(len(jobs) == 72, 'preserve all existing correctness identities')
    require(args.only_job is None or args.only_job in jobs,
            'selected job must be an existing correctness identity')
    ordered = []
    for job in bound['jobs']:
        if job['phase'] == 'parity':
            for key in job['needs'] + [job['id']]:
                if key not in ordered:
                    ordered.append(key)
    require(set(ordered) == set(jobs), 'both targets and comparison required')
    states = {key: 'UNRUN' for key in ordered}
    receipts = {}
    failures = {}
    dispatch_joins = {}
    active = None
    stopped = None

    def summary():
        atomic(summary_path, dict(
            selectionIdentity=identity, actualOwner=owner, currentJob=active,
            stopReason=stopped, testsPassed=sum(v == 'PASS' for v in states.values()),
            testsFailed=sum(v == 'FAIL' for v in states.values()),
            testsNotYetRun=sum(v not in ('PASS', 'FAIL') for v in states.values()),
            totalExistingTests=72,
            jobs=[dict(id=key, status=states[key], receipt=receipts.get(key),
                       failure=failures.get(key), dispatchJoin=dispatch_joins.get(key))
                  for key in ordered],
            observedMonotonic=time.monotonic(), performanceClaim=False))

    # Intake has already retained the independently accepted receipts. Verify
    # applicability once, without replaying any accepted test or changing owner.
    for key in ordered:
        path = queue / (key + '.json')
        if not path.exists():
            require(not (queue / key).exists() and
                    not (queue / ('dispatch.' + key)).exists(),
                    'existing incomplete attempt; no unchanged retry: ' + key)
            continue
        receipt = read(path)
        require(receipt['component_selection'] == identity and
                receipt['expectation'] == jobs[key]['expectation'],
                'receipt candidate/expectation mismatch: ' + key)
        states[key] = receipt['status']
        receipts[key] = pin(path)
        if receipt['status'] == 'PASS':
            validate_result(receipt, jobs[key]['expectation'])
    summary()
    if any(key in receipts and states[key] != 'PASS' for key in ordered):
        stopped = 'Existing failure requires causal repair, no unchanged retry'
        summary()
        return 2

    for key in ordered:
        if args.only_job is not None and key != args.only_job:
            continue
        if states[key] == 'PASS':
            continue
        job = jobs[key]
        comparison = job['phase'] == 'parity'
        reserve = 120 + 300 + (0 if comparison else 90)
        _, deadline = admission(owner)
        # One absolute owner boundary, shared by every serial operation. The
        # driver admits each actual 1200/600s command plus its own 40s cleanup;
        # Python dispatch must not add 1380/780/90 and 1290/690/90 timers around
        # those same children. Removing these aggregate envelopes changes the
        # row timeout contract; it does not shorten or reset a leaf timeout.
        previous_deadline = os.environ.get(PARENT_DEADLINE_ENV)
        operation_end = deadline - reserve
        if previous_deadline is not None:
            inherited_end = float(previous_deadline)
            require(math.isfinite(inherited_end), 'UNRUN: invalid inherited operation boundary; no dispatch')
            operation_end = min(operation_end, inherited_end)
        if time.monotonic() >= operation_end:
            stopped = 'UNRUN: original clock review/cleanup reserve does not fit; no dispatch'
            summary()
            return 2
        require(all(states[dependency] == 'PASS' for dependency in job['needs']),
                'both target prerequisites must pass: ' + key)
        argv = [part.replace('{bound_manifest}', str(manifest))
                    .replace('{queue}', str(queue)) for part in job['argv']]
        require(Path(argv[2]).resolve() == driver / 'bench-job.py',
                'unchanged normal job runner required')
        require(argv[:2] == ['/usr/bin/python3', '-B'] and
                argv[3:] == [str(manifest), key, str(queue)],
                'unsupported normal job dispatch arguments')
        active = key
        summary()
        error = None
        try:
            os.environ[PARENT_DEADLINE_ENV] = str(operation_end)
            status = runpy.run_path(str(driver / 'bench-job.py'))['main'](
                manifest, key, queue)
            require(status == 0, 'normal job did not pass: ' + key)
        except Exception as failure:
            error = str(failure)
        finally:
            if previous_deadline is None:
                os.environ.pop(PARENT_DEADLINE_ENV, None)
            else:
                os.environ[PARENT_DEADLINE_ENV] = previous_deadline
        path = queue / (key + '.json')
        receipt_valid = False
        receipt_error = False
        try:
            if path.exists():
                receipts[key] = pin(path)
                receipt = read(path)
                require(receipt['component_selection'] == identity and
                        receipt['expectation'] == job['expectation'],
                        'new receipt candidate/expectation mismatch: ' + key)
                receipt_valid = True
                states[key] = receipt['status']
                if receipt['status'] == 'PASS':
                    validate_result(receipt, job['expectation'])
        except Exception as failure:
            receipt_error = True
            error = (error + '; ' if error else '') + 'receipt validation: ' + str(failure)
        active = None
        if error or states[key] != 'PASS':
            failures[key] = dict(kind='dispatch' if error or not path.exists() else 'receipt',
                                 error=error, receiptStatus=states[key],
                                 dispatchJoin=dispatch_joins.get(key))
            # A refused full-cap command has not run. Preserve the driver's
            # UNRUN receipt instead of turning admission into a product FAIL.
            status = ('UNRUN' if states[key] == 'UNRUN' and not receipt_error and
                      (receipt_valid or (error and 'UNRUN' in error)) else 'FAIL')
            states[key] = status
            stopped = dict(job=key, error=error, status=status,
                           action='Preserve diagnostics; repair causal failure in this session')
            summary()
            return 2
        summary()
    stopped = ('Selected existing correctness job passed; remaining controls retain their states; no timing/publication run'
               if args.only_job else 'All existing correctness tests passed; no timing/publication run')
    summary()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
