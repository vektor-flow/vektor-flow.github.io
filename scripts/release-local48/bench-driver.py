#!/usr/bin/env python3
"""Future admitted exact32/48 benchmark driver. No execution during SOURCE work."""
import sys,os,shutil,math,re
from pathlib import Path
from bench_protocol import *
from peer_commands import commands
D=Path(__file__).resolve().parent
THREAD_ENV={k:'1' for k in ['OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS','BLIS_NUM_THREADS','VECLIB_MAXIMUM_THREADS','NUMEXPR_NUM_THREADS','VKF_LINALG_THREADS']}

def parse_output(row,language,text,run,owner,label):
    p=run/(label+'.oracle-request.json');atomic(p,dict(row=row,language=language,stdout=text))
    out,_,_=execute(['/usr/bin/node',D/'bench-oracle-worker.mjs',p],run,label+'.parse',owner)
    return __import__('json').loads(out)

def native_namespace(row,selection,run):
    package=Path(selection['native_package'])
    argv=['/usr/bin/bwrap','--unshare-all','--die-with-parent','--new-session']
    for p in ['/usr','/lib','/lib64','/etc/ld.so.cache','/etc/alternatives']:
        if Path(p).exists():argv+=['--ro-bind',p,p]
    argv+=['--symlink','usr/bin','/bin','--proc','/proc','--dev','/dev','--tmpfs','/tmp','--ro-bind',str(package),str(package),'--bind',str(run),str(run),'--chdir',str(run),
           '--clearenv','--setenv','PATH','/usr/bin:/bin','--setenv','HOME','/tmp','--setenv','LC_ALL','C','--setenv','LD_LIBRARY_PATH',str(package/'lib/linux-ui')]
    made=set()
    for mount in [row['oracle']['mount']] if row['oracle'].get('mount') else []:
        for parent in reversed(Path(mount['virtual_path']).parents):
            if parent!=Path('/') and str(parent) not in made:argv+=['--dir',str(parent)];made.add(str(parent))
        argv+=['--ro-bind',str(verify_pin(mount['input'])),mount['virtual_path']]
    return argv

def native_compile(row,selection,run,owner,label):
    run.mkdir(parents=True,exist_ok=False);package=Path(selection['native_package']);cli=package/'bin/vkf-0.7.5'
    shutil.copyfile(verify_pin(row['source_pins'][0]),run/'program.vkf')
    shutil.copyfile(D/'compile-clock.py',run/'compile-clock.py')
    argv=native_namespace(row,selection,run)+['/usr/bin/python3','-B',str(run/'compile-clock.py'),str(cli),'-b',str(run/'program.vkf'),'-o',str(run/'program'),'--diagnostics']
    out,elapsed,j=execute(argv,run,label,owner,timeout=1200);clock=__import__('json').loads(out);require(clock['waited'] and clock['exit']==0,'CLI child join');elapsed=clock['compile_ms'];summary=__import__('json').loads(clock['stdout'])
    require(summary.get('artifact_fallback') is False and summary.get('ran') is False,'fallback or implicit run')
    require((run/'program').read_bytes()[:4]==b'\x7fELF','native ELF required')
    manifest=read(summary['manifest_path']);code=Path(manifest['code_path']);data=Path(manifest['data_path'])
    require(code.resolve().is_relative_to(run) and data.resolve().is_relative_to(run),'generated native buffers must belong to exact compile')
    return dict(program=str(run/'program'),code=pin(code),data=pin(data),manifest=pin(summary['manifest_path']),compile_ms=elapsed,summary=summary,join=j)

def node_run(row,phase,selection,run,owner,peer=None):
    run.mkdir(parents=True,exist_ok=True);request=run/'node-request.json'
    atomic(request,dict(row=row,phase=phase,component=selection['components']['node'],host=selection['node_host'],run=str(run),peer=peer))
    out,_,j=execute(['/usr/bin/node',D/'bench-node.mjs',request],run,'node',owner,THREAD_ENV)
    raw=__import__('json').loads(out);raw['join']=j;return raw

def peer_run(row,language,phase,selection,run,owner):
    run.mkdir(parents=True,exist_ok=False);c=commands(row,language,selection['tools'],run,selection.get('peer_source_variants'));compiles=[];raw=dict(samples_ms=[],values=[],outputs=[],compile_samples_ms=[],process_samples_ms=[])
    runs=10 if phase=='measure' else 0
    if row['suite']=='core':
        for i in range(-1,10 if phase=='measure' else 1):
            _,ms,j=execute(c['compile'],run,'compile.'+str(i),owner)
            if i>=0:compiles.append(ms)
        if row['target']=='wasm':
            raw=node_run(row,phase,selection,run/'runtime',owner,peer=c);raw['compile_samples_ms']=compiles;return raw,c['engine']
        execute(c['library_compile'],run,'compile-library',owner)
        stdout,_,_=execute(c['run'],run,'correctness',owner);observation=dict(value=scalar(stdout))
        argv=[a.replace('{warmups}','5').replace('{runs}',str(runs or 2)) for a in c['runtime']]
        stdout,_,j=execute(argv,run,'runtime-timer',owner);timer=__import__('json').loads(stdout)
        if runs:raw.update(samples_ms=timer['samples_ms'],values=timer['sample_values'])
        require(all(v==observation['value'] for v in timer['sample_values']),'entry versus process correctness mismatch')
        for i in range(-1,10 if runs else 0):
            out,ms,_=execute(c['run'],run,'process.'+str(i),owner)
            require(scalar(out)==observation['value'],'process output changed')
            if i>=0:raw['process_samples_ms'].append(ms)
        raw.update(compile_samples_ms=compiles,observation=observation,timer=timer,command_provenance=c);return raw,c['engine']
    stdout,_,_=execute(c['run'],run,'correctness',owner,dict(THREAD_ENV,**c.get('env',{})))
    parse_output(row,language,stdout,run,owner,'correctness');raw['observation']=dict(stdout=stdout)
    for i in range(runs):
        stdout,process_ms,_=execute(c['run'],run,'sample.'+str(i),owner,dict(THREAD_ENV,**c.get('env',{})))
        parsed=parse_output(row,language,stdout,run,owner,'sample.'+str(i));raw['samples_ms'].append(parsed['elapsed_ms']);raw['outputs'].append(stdout)
        if row['oracle'].get('kind')=='e1201-exact-symbolic':raw.setdefault('first_operation_samples_ms',[]).append(parsed['first_operation_ms']);raw.setdefault('full_process_samples_ms',[]).append(process_ms)
    return raw,c['engine']

def native_run(row,phase,selection,run,owner):
    run.mkdir(parents=True,exist_ok=False);runs=10 if phase=='measure' else 0;compiles=[];build=None
    for i in range(-1 if row['suite']=='core' else 0,10 if runs and row['suite']=='core' else 1):
        build=native_compile(row,selection,run/('compile.'+str(i)),owner,'compile')
        if i>=0:compiles.append(build['compile_ms'])
    raw=dict(samples_ms=[],values=[],outputs=[],compile_samples_ms=compiles,process_samples_ms=[],artifact=pin(build['program']),code=build['code'],data=build['data'],manifest=build['manifest'])
    env=dict(THREAD_ENV,LD_LIBRARY_PATH=str(Path(selection['native_package'])/'lib/linux-ui')+':'+str(Path(selection['native_package'])/'bin'))
    # Runtime fixture paths remain exact; compile-time data is embedded by compiler.
    stdout,_,_=execute(native_namespace(row,selection,run)+[build['program']],run,'correctness',owner,env)
    if row['suite']=='core':
        value=scalar(stdout);raw['observation']=dict(value=value)
        width=2 if row['parallel_contract'] else 1
        timer=selection['tools']['entry_timer'];verify_pin(timer)
        argv=[timer['path'],build['code']['path'],build['data']['path'],'5',str(runs or 2),str(width)]
        stdout,_,_=execute(argv,run,'runtime-timer',owner,env);measured=__import__('json').loads(stdout)
        require(measured['result']==value and all(v==value for v in measured['sample_values']),'native timer ABI/output mismatch')
        if width==2:require(measured['parallel_width']==2 and all(measured[k]==1 for k in ['threads_created','threads_joined','thread_handles_closed']),'actual two-thread receipt missing')
        if runs:raw.update(samples_ms=measured['samples_ms'],values=measured['sample_values'])
        raw['timer']=measured
        for i in range(-1,10 if runs else 0):
            out,elapsed,_=execute(native_namespace(row,selection,run)+[build['program']],run,'process.'+str(i),owner,env);require(scalar(out)==value,'process oracle changed')
            if i>=0:raw['process_samples_ms'].append(elapsed)
    else:
        parse_output(row,'vkf',stdout,run,owner,'correctness');raw['observation']=dict(stdout=stdout)
        for i in range(runs):
            stdout,process_ms,_=execute(native_namespace(row,selection,run)+[build['program']],run,'sample.'+str(i),owner,env);parsed=parse_output(row,'vkf',stdout,run,owner,'sample.'+str(i));raw['samples_ms'].append(parsed['elapsed_ms']);raw['outputs'].append(stdout)
            if row['oracle'].get('kind')=='e1201-exact-symbolic':raw.setdefault('first_operation_samples_ms',[]).append(parsed['first_operation_ms']);raw.setdefault('full_process_samples_ms',[]).append(process_ms)
    return raw

def main(request_path):
    req=read(request_path);expectation=req['expectation'];selection=read(req['selection']['path']);verify_pin(req['selection']);identity=closure(selection)
    require(expectation['component_plan']==identity,'row selection mismatch')
    for row in expectation['rows']:
        for p in row['source_pins']+row['fixture_pins']+row['oracle_pins']+row['peer_source_pins']:verify_pin(p)
    owner=req['actual_owner_chat'];admission(owner);work=Path(req['run']);work.mkdir(parents=True,exist_ok=True)
    phase=expectation['phase'];rows=expectation['rows'];result=dict(expectation=expectation,actual=True,harness_only=False,status='UNRUN',source_only=False,oracle_unchanged=True,accepted_samples=0,observations=[],raw_evidence=[],component_selection=identity)
    try:
        if phase in ['parity','measure']:
            for row in (rows if phase=='parity' else read(req['corpus']['path'])['rows']):
                receipt=read(Path(req['queue_run'])/('preflight.'+row['id']+'.json'))
                require(receipt['status']=='PASS' and receipt['component_selection']==identity and receipt['expectation']['rows']==[row],'all source-matched corpus preflights required')
                if phase=='parity':result['observations']+=receipt['observations'];result['raw_evidence']+=receipt['raw_evidence']
            if phase=='measure':
                for j in read(req['prepared']['path'])['jobs']:
                    if j['phase']=='parity':
                        r=read(Path(req['queue_run'])/(j['id']+'.json'));require(r['status']=='PASS' and r['component_selection']==identity,'all source-matched parity gates required')
        if phase!='parity':
            row=rows[0];raw=native_run(row,phase,selection,work/'vkf',owner) if row['target']=='linux' else node_run(row,phase,selection,work/'vkf',owner)
            records={'vkf':(raw,row['engine'])}
            for language in row['peers']:records[language]=peer_run(row,language,phase,selection,work/language,owner)
            if phase=='measure':
                result['cells']={name:cell(row,name,raw,engine) for name,(raw,engine) in records.items()};result['architecture']=architecture(row)
                if row['target']=='wasm':result['architecture'].update(node_version=records['vkf'][0]['node_version'],v8_version=records['vkf'][0]['v8_version'],wasm_address_bits=32)
                else:
                    abi_rows=[];versions=[]
                    for component in ['linux-cli','linux-helper','native-runtime']:
                        for artifact in selection['components'][component]['files']:
                            path=verify_pin(artifact)
                            with path.open('rb') as stream:is_elf=stream.read(4)==b'\x7fELF'
                            if not is_elf:continue
                            text,_,joined=execute(['/usr/bin/readelf','--version-info','--file-header',str(path)],work,'abi-readelf.'+str(len(abi_rows)),owner)
                            found=re.findall(r'GLIBC_([0-9.]+)',text);versions+=found
                            abi_rows.append(dict(artifact=artifact,component=component,versions=found,readelf_join=joined))
                    require(versions,'ELF GLIBC evidence missing')
                    result['architecture'].update(glibc_scope='selected CLI, helper and native runtime ELF closure',glibc_floor=max(versions,key=lambda x:tuple(map(int,x.split('.')))),elf_abi=abi_rows,isa='x86_64 generated code; peer flags -march=native/-mcpu native recorded; no cross-host portability claim')
            else:
                result['observations']=[dict(row_id=row['id'],language=name,**raw['observation']) for name,(raw,_) in records.items()]
                for name,(raw,_) in records.items():
                    p=work/(name+'.raw.json');atomic(p,raw);result['raw_evidence'].append(pin(p))
        atomic(work/'oracle-input-result.json',result)
        oracle=work/'original-oracle-request.json';atomic(oracle,dict(result=str(work/'oracle-input-result.json'),expectation=expectation))
        _,_,j=execute(['/usr/bin/node',D/'benchmark-oracle.mjs',oracle],work,'original-oracle',owner)
        result.update(status='PASS',original_oracle_join=j);closure(selection)
    except (Blocked,OSError,KeyError,ValueError,AssertionError) as error:
        result.update(status='UNRUN' if 'UNRUN' in str(error) or isinstance(error,(FileNotFoundError,KeyError)) else 'FAIL',reason=str(error),new_timing_cell='-')
    finally:atomic(work/'result.json',result)
    return 0 if result['status']=='PASS' else 2
if __name__=='__main__':raise SystemExit(main(sys.argv[1]))
