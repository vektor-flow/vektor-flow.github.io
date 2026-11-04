// Rebuild the existing VKF dispatch kernels from the same current library tree.
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import os from 'node:os';import path from 'node:path';
const [library,revision,compilerDir,emitter,output]=process.argv.slice(2);
if(!library||!/^[a-f0-9]{7,40}$/.test(revision??'')||!compilerDir||!emitter||!output)throw Error('Expected library/revision, canonical compiler, GPU emitter, output');
const git=(...args)=>execFileSync('git',['-C',library,...args],{maxBuffer:4*1024*1024}),sha=b=>createHash('sha256').update(b).digest('hex');
const commit=git('rev-parse',revision).toString().trim(),root=await mkdtemp(path.join(os.tmpdir(),'vkf-current-gpu-')),sources={};
for(const name of git('ls-tree','-r','--name-only',commit,'morphing').toString().trim().split('\n').filter(x=>x.endsWith('.vkf'))){const bytes=git('show',commit+':'+name);sources[name]={sha256:sha(bytes),bytes:bytes.length};await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),bytes);}
const {createProjectCompiler}=await import(pathToFileURL(path.join(compilerDir,'package-tools/project.mjs'))),compiler=await createProjectCompiler({compilerModule:path.join(compilerDir,'compiler.mjs')});
await mkdir(output,{recursive:true});let artifacts={},entries={};const selected=process.argv.slice(7);
if(selected.length){const previous=JSON.parse(await readFile(path.join(output,'PROVENANCE.json'),'utf8'));if(previous.libraryCommit!==commit||previous.compilerSourceBinding!==compiler.sourceBinding||previous.gpuEmitter!==sha(await readFile(emitter))||JSON.stringify(previous.sources)!==JSON.stringify(sources))throw Error('Partial GPU build input identity changed');for(const [file,pin] of Object.entries(previous.artifacts))if(sha(await readFile(path.join(output,file)))!==pin.sha256)throw Error('Prior GPU artifact changed');artifacts={...previous.artifacts};entries={...previous.entries};}
for(const [name,width] of [['state',1],['field',1],['measure-chunk',1],['measure',1],['calibrate',1],['render-controls',1],['check-controls',1],['check-boundary',1],['presentation-contour',72]]){
 if(selected.length&&!selected.includes(name))continue;
 const source=name==='presentation-contour'?await readFile(new URL('./presentation-contour.vkf',import.meta.url)):git('show',commit+':tests/morphing/gpu-'+name+'.vkf');await writeFile(path.join(root,'main.vkf'),source);
 const result=await compiler.compileProject(root),typed=Buffer.from(JSON.stringify(result.result.ir));await writeFile(path.join(root,name+'.ir.json'),typed);
 execFileSync(emitter,['--source',path.join(root,'main.vkf'),'--typed-ir',path.join(root,name+'.ir.json'),'--emit-wgsl-real-f32-field',path.resolve(output,name+'.wgsl'),'--wgsl-field-entry','kernel','--wgsl-field-count','0','--wgsl-field-output-width',String(width)],{stdio:'inherit',timeout:120000});
 entries[name]={source:sha(source),typedIR:sha(typed)};
 for(const filename of [name+'.wgsl',name+'.wgsl.json']){const b=await readFile(path.join(output,filename));artifacts[filename]={sha256:sha(b),bytes:b.length};}
 console.log('CURRENT_NATIVE_GPU_KERNEL',name);
}
const provenance={libraryCommit:commit,sources,entries,artifacts,compilerSourceBinding:compiler.sourceBinding,compilerVersion:compiler.compilerVersion,gpuEmitter:sha(await readFile(emitter)),contract:'Same numerical VKF library and compiler-owned typed IR; explicit real-f32 GPU execution. Browser and native parity verified separately.'};
await writeFile(path.join(output,'PROVENANCE.json'),JSON.stringify(provenance,null,2)+'\n');console.log('CURRENT_STATE_GPU_BUILD_COMPLETE',output);
