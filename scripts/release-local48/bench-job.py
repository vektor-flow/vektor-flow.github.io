#!/usr/bin/env python3
"""One future admitted job; inherited custody, never opens/flocks heavy lock."""
import sys,runpy
from pathlib import Path
from bench_protocol import *
from benchmark_jobs import validate_result

def main(manifest_path,job_id,queue):
    m=read(manifest_path)
    for p in m['inputs']:verify_pin(p)
    closure(read(m['selection']['path']));owner=m['actual_owner_chat'];admission(owner)
    require(os.environ.get(PARENT_DEADLINE_ENV) is not None,
            'UNRUN: admitted actual job execution boundary required; command not spawned')
    j=next(j for j in m['jobs'] if j['id']==job_id);queue=Path(queue).resolve();work=queue/job_id
    for dependency in j['needs']:
        r=read(queue/(dependency+'.json'));require(r['status']=='PASS' and r['component_selection']==m['selection_identity'],'matching prerequisite '+dependency)
    require(not work.exists(),'append-only stage');work.mkdir(parents=True)
    request=work/'request.json';atomic(request,dict(expectation=j['expectation'],selection=m['selection'],actual_owner_chat=owner,run=str(work),queue_run=str(queue),corpus=m['corpus'],prepared=m['prepared']))
    # Dispatch is Python bookkeeping, not another timed product operation.
    # The existing driver owns each real command's full cap and normal cleanup;
    # an enclosing generic timer cannot safely duplicate that ownership.
    try:return runpy.run_path(str(Path(__file__).with_name('bench-driver.py')))['main'](request)
    finally:
        if (work/'result.json').exists():
            receipt=read(work/'result.json')
            if receipt['status']=='PASS':validate_result(receipt,j['expectation'])
            atomic(queue/(job_id+'.json'),receipt)
if __name__=='__main__':raise SystemExit(main(*sys.argv[1:]))
