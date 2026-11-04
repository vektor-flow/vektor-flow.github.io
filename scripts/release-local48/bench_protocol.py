"""Exact LOCAL10x protocol; helpers here never execute products on import."""
import os, time, json, math, signal, subprocess, platform, re, ctypes, select
from pathlib import Path
from overnight import read, atomic, pin, verify_pin, fingerprint, Blocked

def require(ok, why):
    if not ok: raise Blocked(why)

def operation_deadline(chat):
    started=chat['started_monotonic'];deadline=started+3000
    for value in [chat.get('operationStopDeadlineMonotonic'),chat.get('operationStop'),
                  chat.get('operation_stop_monotonic'),(chat.get('scope') or {}).get('operationStop')]:
        if value is not None:
            require(type(value) in (int,float) and math.isfinite(value) and value>=started,'invalid explicit operation STOP')
            deadline=min(deadline,value)
    return deadline

def admission(owner):
    fd=int(os.environ['VKF_HEAVY_LOCK_FD'])
    require(os.fstat(fd).st_ino==8915659,'unchanged inherited heavy lock inode8915659 required')
    verify_pin(owner); chat=read(owner['path'])
    require(chat.get('executionAuthority') not in ['NO_PRODUCT_EXECUTION_NO_HEAVY_FD','READ_ONLY_NO_PRODUCT_EXECUTION'] and not any(x in chat.get('role','').upper() for x in ['SOURCE','REVIEW','READONLY']), 'source/reviewer cannot execute products')
    require(chat['name'] not in ['e1118','e1139','e1142','e1143','e1201'],'SOURCE owner cannot execute products')
    deadline=operation_deadline(chat)
    require(time.monotonic()+45<deadline,'original ACTUAL CHAT budget exhausted')
    require(os.environ.get('VKF_RUN_DIR'),'existing admitted owner run required')
    # The admitted controller owns cgroups, aggregate growth and final custody.
    require(os.environ.get('VKF_BENCH_ADMITTED_CGROUP')==Path('/proc/self/cgroup').read_text().strip(),'admitted ancestor/leaf binding absent')
    return fd,deadline

NORMAL_CLEANUP_SECONDS = 40
PARENT_DEADLINE_ENV = 'VKF_BENCH_PARENT_DEADLINE'

def command_deadline(deadline, timeout):
    require(type(timeout) in (int,float) and math.isfinite(timeout) and timeout>0,
            'UNRUN: invalid normal command cap; command not spawned')
    inherited=os.environ.get(PARENT_DEADLINE_ENV)
    if inherited is not None:
        inherited=float(inherited)
        require(math.isfinite(inherited), 'UNRUN: invalid inherited command deadline; command not spawned')
        deadline=min(deadline,inherited)
    now=time.monotonic()
    require(now+timeout+NORMAL_CLEANUP_SECONDS<deadline,
            'UNRUN: full normal command cap + normal cleanup does not fit; command not spawned'
            +f'; cap={timeout}s cleanup={NORMAL_CLEANUP_SECONDS}s available={deadline-now}s boundary={deadline}')
    return deadline

def _process_identity(pid):
    try:
        fields=Path('/proc',str(pid),'stat').read_text().rsplit(')',1)[1].split()
        return dict(pid=pid,ppid=int(fields[1]),startTicks=int(fields[19]),state=fields[0])
    except (FileNotFoundError,ProcessLookupError):
        return None

def _children(pid):
    result=set()
    for task in Path('/proc',str(pid),'task').glob('*'):
        try:result.update(map(int,(task/'children').read_text().split()))
        except (FileNotFoundError,ProcessLookupError):pass
    return result

class _OwnedJob:
    """Local serial execute child tree, not the ACTUAL controller or FD owner.

    Subreaping prevents a short-lived parent from losing descendants between
    observations. No other child/thread may share this local wait ownership.
    Only pidfds captured from this tree may receive cooperative SIGTERM.
    """
    def __init__(self):
        require(hasattr(os,'pidfd_open') and hasattr(signal,'pidfd_send_signal'),
                'UNRUN: owned normal cleanup requires Linux pidfds; command not spawned')
        require(len(list(Path('/proc/self/task').iterdir()))==1 and not _children(os.getpid()),
                'UNRUN: serial runner with no unrelated children required; command not spawned')
        require(signal.getsignal(signal.SIGCHLD)==signal.SIG_DFL,
                'UNRUN: exclusive default child wait ownership required; command not spawned')
        self.libc=ctypes.CDLL(None,use_errno=True);value=ctypes.c_int()
        require(self.libc.prctl(37,ctypes.byref(value),0,0,0)==0,
                'UNRUN: cannot read local subreaper state; command not spawned')
        self.previous=value.value;self.owned={};self.joins=[]
        require(self.libc.prctl(36,1,0,0,0)==0,
                'UNRUN: cannot retain owned descendants; command not spawned')

    def scan(self,p):
        parents=[(os.getpid(),None)];seen=set()
        while parents:
            parent,parent_start=parents.pop()
            if (parent,parent_start) in seen:continue
            seen.add((parent,parent_start))
            current_parent=_process_identity(parent)
            if current_parent is None or (parent_start is not None and current_parent['startTicks']!=parent_start):continue
            for pid in _children(parent):
                identity=_process_identity(pid)
                if identity is None or identity['ppid']!=parent:continue
                key=(pid,identity['startTicks'])
                if key not in self.owned:
                    try:handle=os.pidfd_open(pid,0)
                    except ProcessLookupError:continue
                    current=_process_identity(pid)
                    parent_after=_process_identity(parent)
                    if current is None or current['startTicks']!=identity['startTicks'] or current['ppid']!=parent or parent_after is None or parent_after['startTicks']!=current_parent['startTicks']:
                        os.close(handle);continue
                    self.owned[key]=dict(identity=identity,handle=handle,terminationRequested=False)
                parents.append((pid,identity['startTicks']))
        # Popen retains exclusive wait ownership of its direct child. Adopted
        # orphans are ours to wait, including children whose parent exited fast.
        p.poll()
        for row in self.owned.values():
            identity=_process_identity(row['identity']['pid'])
            if identity and identity['startTicks']==row['identity']['startTicks'] and identity['ppid']==os.getpid() and identity['pid']!=p.pid:
                try:pid,status=os.waitpid(identity['pid'],os.WNOHANG)
                except ChildProcessError:continue
                if pid:self.joins.append(dict(identity=row['identity'],waitStatus=status,adoptedWaited=True))

    def pending(self):
        result=[]
        for row in self.owned.values():
            current=_process_identity(row['identity']['pid'])
            if current and current['startTicks']==row['identity']['startTicks']:result.append(current)
        return result

    def stop(self):
        for row in self.owned.values():
            current=_process_identity(row['identity']['pid'])
            if not row['terminationRequested'] and current and current['startTicks']==row['identity']['startTicks'] and current['state']!='Z':
                try:signal.pidfd_send_signal(row['handle'],signal.SIGTERM)
                except ProcessLookupError:pass
                row['terminationRequested']=True

    def pause(self,end):
        # Wake on child exit rather than adding a fixed polling interval to
        # the existing complete-process timing endpoint.
        handles=[]
        for row in self.owned.values():
            current=_process_identity(row['identity']['pid'])
            if current and current['startTicks']==row['identity']['startTicks'] and current['state']!='Z':handles.append(row['handle'])
        select.select(handles,[],[],max(0,min(.01,end-time.monotonic())))

    def close(self):
        try:
            for row in self.owned.values():os.close(row['handle'])
        finally:
            require(self.libc.prctl(36,self.previous,0,0,0)==0,'cannot restore local subreaper state')

def execute(argv,directory,label,owner,env=None,timeout=600):
    fd,deadline=admission(owner);deadline=command_deadline(deadline,timeout)
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    out=directory/(label+'.stdout');err=directory/(label+'.stderr');join=directory/(label+'.join.json')
    require(not out.exists() and not join.exists(),'append-only command evidence')
    p=None;start=time.perf_counter_ns();rc=None;job=None;job_closed=False;error=None;pending=[];end=None;cleanup_errors=[]
    try:
        job=_OwnedJob()
        with out.open('xb') as stdout,err.open('xb') as stderr:
            # Recheck after local setup. Never shorten an admitted normal cap.
            command_deadline(deadline,timeout);end=time.monotonic()+timeout
            p=subprocess.Popen([str(x) for x in argv],cwd=directory,stdout=stdout,stderr=stderr,
                env=dict(os.environ,**(env or {}),**{PARENT_DEADLINE_ENV:str(end)}),pass_fds=(fd,),start_new_session=True)
            while True:
                job.scan(p)
                if p.returncode is not None and not job.pending() and not _children(os.getpid()):break
                if time.monotonic()>=end:raise subprocess.TimeoutExpired([str(x) for x in argv],timeout)
                job.pause(end)
            rc=p.wait()
        elapsed=(time.perf_counter_ns()-start)/1e6
    except BaseException as failure:
        error=failure
        raise
    finally:
        try:
            if job and p and error is not None:
                cleanup_end=min(deadline,time.monotonic()+NORMAL_CLEANUP_SECONDS)
                try:
                    while True:
                        job.scan(p);job.stop()
                        pending=job.pending()
                        if p.returncode is not None and not pending and not _children(os.getpid()):break
                        if time.monotonic()>=cleanup_end:break
                        job.pause(cleanup_end)
                    if p.returncode is not None:p.wait()
                except BaseException as cleanup_error:
                    cleanup_errors.append(repr(cleanup_error))
                    error.add_note('Owned normal cleanup error: '+repr(cleanup_error))
                # Include late adopted children even at the cleanup boundary.
                # Unknown ownership/observation must never become a clean claim.
                try:
                    pending=job.pending()
                    for pid in _children(os.getpid()):
                        identity=_process_identity(pid)
                        if identity and identity not in pending:pending.append(identity)
                except BaseException as cleanup_error:
                    cleanup_errors.append(repr(cleanup_error))
                if pending or p.returncode is None:
                    error.add_note('Owned normal cleanup unresolved; ACTUAL retains custody: '+str(join))
            if job:
                try:job.close()
                except BaseException as cleanup_error:
                    cleanup_errors.append(repr(cleanup_error))
                    if error is None:raise
                    error.add_note('Local ownership cleanup error: '+repr(cleanup_error))
                finally:job_closed=True
            atomic(join,dict(argv=[str(x) for x in argv],pid=p.pid if p else None,exit=p.returncode if p else None,
                             waited=p is not None and p.returncode is not None,normalCapSeconds=timeout,
                             executionEndMonotonic=end,admissionDeadlineMonotonic=deadline,
                             errorType=type(error).__name__ if error else None,error=str(error) if error else None,
                             timedOut=isinstance(error,subprocess.TimeoutExpired),
                             allOwnedJoined=p is not None and p.returncode is not None and not pending and not cleanup_errors,
                             pendingCleanup=pending,cleanupErrors=cleanup_errors,adoptedJoins=job.joins if job else [],
                             owned=[dict(identity=r['identity'],terminationRequested=r['terminationRequested']) for r in job.owned.values()] if job else [],
                             stdout=pin(out) if out.exists() else None,stderr=pin(err) if err.exists() else None))
        finally:
            if job and not job_closed:job.close()
    require(rc==0,'command failed: '+str(join))
    require(not any(row['waitStatus']!=0 for row in job.joins),
            'owned descendant failed: '+str(join))
    return out.read_text(),elapsed,pin(join)

def scalar(text):
    lines=[x.strip() for x in text.splitlines() if x.strip()]
    require(len(lines)==1,'scalar must contain exactly one numeric output, no ignored IO')
    v=float(lines[0]);require(math.isfinite(v),'nonfinite result');return v

def samples(values):
    require(len(values)==10 and all(type(v) in (int,float) and math.isfinite(v) and v>0 for v in values),'exact10 positive finite ms, no drops')
    return values

def architecture(row):
    cpu=next((x.split(':',1)[1].strip() for x in Path('/proc/cpuinfo').read_text().splitlines() if x.startswith('model name')),'unknown')
    return dict(os=platform.system(),host_arch=platform.machine(),cpu=cpu,engine=row['engine'],
                gpu='UNMEASURED',Windows='-',macOS='-',Safari='-')

def closure(selection):
    require(selection['schema']=='vkf-e1139-component-selection-v1','selection schema')
    require({'linux-cli','linux-helper','native-runtime','node','browser','site'}==set(selection['components']),'complete component inventory required')
    for name,c in selection['components'].items():
        require(c['source_binding'] and c['files'] and c['evidence'],'component provenance required')
        for p in c['evidence']+c['files']+[c['source_manifest'],c['config'],c['abi']]:verify_pin(p)
        source=read(c['source_manifest']['path']);abi=read(c['abi']['path'])
        require(source['component_source_binding']==c['source_binding'],'component source mismatch')
        expected={p['path']:p['sha256'] for p in c['files']}
        require(abi['files']==expected and abi['source_binding']==c['source_binding'],'exact ABI file closure')
        require(set(source['file_source_bindings'])==set(expected) and all(source['file_source_bindings'].values()),'per-file source dependencies required')
    compatibility=read(verify_pin(selection['compatibility']))
    require(compatibility['components']=={k:fingerprint(v) for k,v in selection['components'].items()},'source compatibility components mismatch')
    require(compatibility['dependencies'] and compatibility['global_pass_inherited'] is False,'explicit compatibility dependencies; no global pass')
    for p in compatibility['dependencies']+selection['driver_inputs']:verify_pin(p)
    for p in selection['node_host'].values():verify_pin(p)
    for key,p in selection['tools'].items():
        if isinstance(p,dict):
            verify_pin(p);require(p.get('version') and p.get('version_evidence'),'actual tool version prerequisite: '+key)
            verify_pin(p['version_evidence'])
    cli=Path(selection['native_package'])/'bin/vkf-0.7.5'
    require(pin(cli) in selection['components']['linux-cli']['files'],'exact packaged CLI binding')
    return fingerprint(selection)

def cell(row,language,raw,engine):
    return dict(samples_ms=samples(raw['samples_ms']),values=raw.get('values',[]),outputs=raw.get('outputs',[]),
      correctness_preflight='PASS',oracle_unchanged=True,units='ms',dropped_samples=0,boundary=row['runtime_boundary'],
      warmup_contract=row['warmup_contract'],execution_engine=engine,
      compile_samples_ms=raw.get('compile_samples_ms',[]),process_samples_ms=raw.get('process_samples_ms',[]),
      full_process_samples_ms=raw.get('full_process_samples_ms',[]),first_operation_samples_ms=raw.get('first_operation_samples_ms',[]),owner_cold_ms=raw.get('owner_cold_ms'),full_program_samples_ms=raw.get('full_program_samples_ms',[]),
      lifecycle=raw.get('lifecycle'),raw=raw)
