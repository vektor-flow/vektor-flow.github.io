"""Concrete commands for the existing matching peers. No downloads or installs."""
from pathlib import Path
from bench_protocol import require, verify_pin, pin

def commands(row,language,tools,work,source_variants=None):
    w=Path(work);out=w/(language+('.wasm' if row['target']=='wasm' else '.program'))
    suite=row['suite'];id=row['workload'];compile_argv=None;library_argv=None
    def tool(k):
        p=tools.get(k);require(p is not None,'UNRUN unavailable installed peer '+k);verify_pin(p);return p['path']
    if row.get('oracle',{}).get('kind')=='e1201-exact-symbolic':
        source=Path(__file__).with_name('symbolic_'+language+{'symengine':'.cpp','sympy':'.py','symbolics':'.jl'}[language])
        actual_source=pin(source)
        if actual_source not in row['peer_source_pins']:
            variant=(source_variants or {}).get(language)
            require(variant and variant['original'] in row['peer_source_pins'] and variant['adapted']==actual_source,
                    'new peer source identity without explicit original/adapted binding')
            verify_pin(variant['original']);verify_pin(variant['adapted'])
            # Only identifier alpha-renaming is admitted for the existing SymEngine collision repair.
            import re
            original=Path(variant['original']['path']).read_text()
            expected=re.sub(r'\bE\b','BenchmarkExpr',original)
            expected=re.sub(r'\bI\b','benchmarkInteger',expected)
            require(language=='symengine' and source.read_text()==expected,'adapter semantic/source delta')
        if language=='symengine':
            receipt=tools.get('symengine-e1201')
            require(receipt and receipt.get('source')==pin(source),'UNRUN matching expanded SymEngine adapter build receipt missing')
            argv=[tool('symengine-e1201'),id]
        elif language=='sympy':argv=[tool('python-peer-e1201'),str(source),id]
        else:
            require(tools.get('julia_project') and tools.get('julia_depot'),'UNRUN installed Symbolics environment missing')
            argv=[tool('symbolics-e1201'),'--project='+tools['julia_project'],'--startup-file=no','--history-file=no',str(source),id]
        return dict(run=argv,engine='Linux-native-peer-operation-timer',env={'JULIA_DEPOT_PATH':tools.get('julia_depot',''),'JULIA_PKG_OFFLINE':'true'})
    if suite=='core':
        extension={'cpp':'cpp','rust':'rs','zig':'zig'}[language]
        src=next(p['path'] for p in row['peer_source_pins'] if Path(p['path']).name==language+'.'+extension)
        original=next(p for p in row['peer_source_pins'] if p['path']==src);verify_pin(original)
        if language=='cpp':
            source=Path(src).read_text();needle='BENCH_EXPORT double vkf_benchmark'
            require(source.count(needle)==1,'C export boundary')
            if 'extern "C" '+needle not in source:source=source.replace(needle,'extern "C" '+needle)
            adapted=w/'cpp-library.cpp';adapted.write_text(source);src=str(adapted)
        if row['target']=='linux':
            if language=='cpp':
                flags=['-O3','-march=native','-std=c++17','-ffp-contract=off','-fno-fast-math'];compile_argv=[tool('cpp'),*flags,src,'-o',str(out),'-lm'];library_argv=[tool('cpp'),*flags,'-shared','-fPIC',src,'-o',str(out)+'.so','-lm']
            elif language=='rust':
                flags=['-O','-C','target-cpu=native'];compile_argv=[tool('rust'),*flags,src,'-o',str(out)];library_argv=[tool('rust'),*flags,'--crate-type','cdylib',src,'-o',str(out)+'.so']
            else:
                flags=[src,'-O','ReleaseFast','-mcpu','native','-lc','-j1'];compile_argv=[tool('zig'),'build-exe',*flags,'-femit-bin='+str(out)];library_argv=[tool('zig'),'build-lib',*flags,'-dynamic','-femit-bin='+str(out)+'.so']
            return dict(compile=compile_argv,library_compile=library_argv,run=[str(out)],runtime=[tool('library_timer'),str(out)+'.so','{warmups}','{runs}'],source=src,original_source=original,adapted_source=pin(src),engine='native-peer-shared-library')
        # Exact reviewed adapters change only host stdio/main/C linkage.
        if language=='cpp':
            source=Path(src).read_text();needle='BENCH_EXPORT double vkf_benchmark';require(source.count(needle)==1,'C export boundary')
            if 'extern "C" '+needle not in source:source=source.replace(needle,'extern "C" '+needle)
            adapted=w/'cpp-library.cpp';adapted.write_text(source)
            compile_argv=[tool('em++'),'-O3','-ffp-contract=off','-fno-fast-math',str(adapted),'-sSTANDALONE_WASM=1','--no-entry','-sEXPORTED_FUNCTIONS=["_vkf_benchmark"]','-sSTACK_SIZE=1048576','-o',str(out)]
        elif language=='rust':compile_argv=[tool('rust-wasm'),'--sysroot',str(Path(tool('rust-wasm')).parent.parent),'--target','wasm32-unknown-unknown','-C','opt-level=3','-C','panic=abort','--crate-type=cdylib',src,'-o',str(out)]
        else:
            source=Path(src).read_text();parts=source.split('pub fn main() void {');require(len(parts)==2 and parts[1].replace(' ','').replace('\n','').strip()=='_=c.printf("%.17g\\n",vkf_benchmark());}','reviewed Zig main adapter')
            adapted=w/'zig-library.zig';adapted.write_text(parts[0].replace('const c = @cImport(@cInclude("stdio.h"));\n',''))
            compile_argv=[tool('zig'),'build-exe','-j1',str(adapted),'-target','wasm32-freestanding','-O','ReleaseFast','-fno-entry','--export=vkf_benchmark','-femit-bin='+str(out)]
        return dict(compile=compile_argv,wasm=str(out),engine='Node-V8-WASM32-peer')
    if suite=='linalg':
        fixtures=str(Path(row['oracle_pins'][0]['path']).parent/'fixtures')
        # Derive frozen fixture root from the original manifest pin, not ambient cwd.
        fixtures=str(Path(next(p['path'] for p in row['oracle_pins'] if p['path'].endswith('/run.mjs'))).parent/'fixtures')
        args=[id,fixtures,row['oracle']['fixture_sha256']]
        if language=='scipy':
            src=next(p['path'] for p in row['peer_source_pins'] if p['path'].endswith('/scipy_runner.py'));argv=[tool('python-peer'),src,*args]
        else:argv=[tool(language),*args]
    else:
        if language=='symengine':argv=[tool(language),id]
        elif language=='sympy':argv=[tool('python-peer'),next(p['path'] for p in row['peer_source_pins'] if p['path'].endswith('/sympy_runner.py')),id]
        else:
            tool('julia');require(tools.get('julia_project') and tools.get('julia_depot'),'UNRUN unavailable installed Symbolics project')
            project=tools['julia_project'];argv=[tool('julia'),'--project='+project,'--startup-file=no','--history-file=no',next(p['path'] for p in row['peer_source_pins'] if p['path'].endswith('/symbolics_runner.jl')),id]
    return dict(run=argv,engine='Linux-native-peer-operation-timer',env={'JULIA_DEPOT_PATH':tools.get('julia_depot',''),'JULIA_PKG_OFFLINE':'true'})
