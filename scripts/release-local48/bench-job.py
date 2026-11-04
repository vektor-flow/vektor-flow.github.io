#!/usr/bin/env python3
"""One future admitted job; inherited custody, never opens/flocks heavy lock."""
import sys
from pathlib import Path
from bench_protocol import *
from benchmark_jobs import validate_result

def main(manifest_path,job_id,queue):
    m=read(manifest_path)
    for p in m['inputs']:verify_pin(p)
    closure(read(m['selection']['path']));owner=m['actual_owner_chat'];admission(owner)
    j=next(j for j in m['jobs'] if j['id']==job_id);queue=Path(queue).resolve();work=queue/job_id
    for dependency in j['needs']:
        r=read(queue/(dependency+'.json'));require(r['status']=='PASS' and r['component_selection']==m['selection_identity'],'matching prerequisite '+dependency)
    require(not work.exists(),'append-only stage');work.mkdir(parents=True)
    request=work/'request.json';atomic(request,dict(expectation=j['expectation'],selection=m['selection'],actual_owner_chat=owner,run=str(work),queue_run=str(queue),corpus=m['corpus'],prepared=m['prepared']))
    # Use the existing correctness job caps, not the measurement-only 2400s
    # wrapper. execute still admits every complete nested normal command cap.
    driver_cap=(90 if j['phase']=='parity' else
                (1290 if j['id'].startswith('preflight.linux.') else 690)
                if j['phase']=='preflight' else 2400)
    try:execute(['/usr/bin/python3','-B',str(Path(__file__).with_name('bench-driver.py')),str(request)],work,'driver',owner,timeout=driver_cap)
    finally:
        if (work/'result.json').exists():
            receipt=read(work/'result.json')
            if receipt['status']=='PASS':validate_result(receipt,j['expectation'])
            atomic(queue/(job_id+'.json'),receipt)
if __name__=='__main__':main(*sys.argv[1:])
