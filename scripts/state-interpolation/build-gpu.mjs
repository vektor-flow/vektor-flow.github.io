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
await mkdir(output,{recursive:true});const artifacts={},entries={},source=await readFile(new URL('./gpu-dispatch.vkf',import.meta.url));
await writeFile(path.join(root,'main.vkf'),source);
const result=await compiler.compileProject(root),typed=Buffer.from(JSON.stringify(result.result.ir));await writeFile(path.join(root,'bundle.ir.json'),typed);
for(const[name,width,entry]of[['state',1,'state_job'],['carrier',84,'carrier_job'],['first',1,'first_job'],['area',1,'area_job'],['density',1,'density_job'],['accumulate',4,'accumulate_job'],['resolve',4,'resolve_job'],['calibrate',1,'calibrate_job']]){
 execFileSync(emitter,['--source',path.join(root,'main.vkf'),'--typed-ir',path.join(root,'bundle.ir.json'),'--emit-wgsl-real-f32-field',path.resolve(output,name+'.wgsl'),'--wgsl-field-entry',entry,'--wgsl-field-count','0','--wgsl-field-output-width',String(width)],{stdio:'inherit',timeout:120000});
 entries[name]={source:sha(source),typedIR:sha(typed),entry,outputWidth:width};
 for(const filename of[name+'.wgsl',name+'.wgsl.json']){const bytes=await readFile(path.join(output,filename));artifacts[filename]={sha256:sha(bytes),bytes:bytes.length};}
}
const provenance={libraryCommit:commit,sources,entries,artifacts,compilerSourceBinding:compiler.sourceBinding,compilerVersion:compiler.compilerVersion,gpuEmitter:sha(await readFile(emitter)),contract:'Canonical native sparse state/local contour/material density; one unchanged compiler-owned typed IR, explicit real-f32 visualization. Qualification is separate.'};
await writeFile(path.join(output,'PROVENANCE.json'),JSON.stringify(provenance,null,2)+'\n');console.log('CURRENT_STATE_GPU_BUILD_COMPLETE',output,root);
