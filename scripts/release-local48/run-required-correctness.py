#!/usr/bin/env python3
"""Batch existing correctness jobs inside a fresh admitted owner's session.

Uses the unchanged bench-job pipeline and an already prepared, same-candidate
queue. Acquires no lock, creates no controller, builds no compiler and publishes
nothing. Actual execution belongs to the future assigned owner after Math closes.
"""
import argparse
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
    from bench_protocol import (admission, atomic, closure, execute, pin, read,
                                require, verify_pin)
    from benchmark_jobs import validate_result

    manifest = args.manifest.resolve()
    queue = args.queue.resolve()
    bound = read(manifest)
    require(bound['schema'] == 'vkf-peer32-operational-v1', 'normal manifest')
    require(bound['rows'] == 48 and len(bound['jobs']) == 120,
            'preserve existing inventory; timing is separate')
    owner = bound['actual_owner_chat']
    admission(owner)
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
        native = key.startswith('preflight.linux.')
        outer = 90 if comparison else 1380 if native else 780
        reserve = 120 + 300 + (0 if comparison else 90)
        _, deadline = admission(owner)
        if time.monotonic() + outer + reserve >= deadline:
            stopped = 'Original clock: next full test cap + review/cleanup does not fit'
            summary()
            return 2
        require(all(states[dependency] == 'PASS' for dependency in job['needs']),
                'both target prerequisites must pass: ' + key)
        argv = [part.replace('{bound_manifest}', str(manifest))
                    .replace('{queue}', str(queue)) for part in job['argv']]
        require(Path(argv[2]).resolve() == driver / 'bench-job.py',
                'unchanged normal job runner required')
        active = key
        summary()
        error = None
        try:
            # The dispatch has the original outer cap. bench-job owns the
            # original 1290/690/90 driver cap; nested full-cap admission must
            # refuse an incoherent budget instead of truncating any timeout.
            execute(argv, queue / ('dispatch.' + key), 'stage', owner,
                    timeout=outer)
        except Exception as failure:
            error = str(failure)
        join = queue / ('dispatch.' + key) / 'stage.join.json'
        if join.exists():
            dispatch_joins[key] = pin(join)
        path = queue / (key + '.json')
        try:
            if path.exists():
                receipts[key] = pin(path)
                receipt = read(path)
                require(receipt['component_selection'] == identity and
                        receipt['expectation'] == job['expectation'],
                        'new receipt candidate/expectation mismatch: ' + key)
                states[key] = receipt['status']
                if receipt['status'] == 'PASS':
                    validate_result(receipt, job['expectation'])
        except Exception as failure:
            error = (error + '; ' if error else '') + 'receipt validation: ' + str(failure)
        active = None
        if error or states[key] != 'PASS':
            failures[key] = dict(kind='dispatch' if error or not path.exists() else 'receipt',
                                 error=error, receiptStatus=states[key],
                                 dispatchJoin=dispatch_joins.get(key))
            states[key] = 'FAIL'
            stopped = dict(job=key, error=error, status='FAIL',
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
