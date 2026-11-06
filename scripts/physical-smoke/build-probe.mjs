// Candidate exact-current075 native operators. No maintained/public bytes changed.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url))),library=process.argv[2]??'/home/viktor/Projects/Vektor Flow/.worktrees/native-physical-fluid-20261106',canonical=process.argv[3]??'/home/viktor/Projects/Tesseracs/.worktrees/platonic-phone-web-20261104/public/vkf-0.7.5/playground/canonical',emitter='/home/viktor/Projects/Cuvami/staging/artifacts/morphing-compiled-gpu-20261016/wgsl-integer-candidate/vkf_webgpu_artifact_candidate',hash=b=>createHash('sha256').update(b).digest('hex');
if(hash(await fs.readFile(emitter))!=='a5305eb01c6d36d5234402471750f0c4ed2f1c892fcec628649325bee315676f')throw Error('Exact qualified current GPU emitter required');
const output=await fs.mkdtemp(path.join(os.tmpdir(),'vkf-physical-fluid-probe-')),project=output+'/project';await fs.mkdir(project);const source=await fs.readFile(library+'/Fluid.vkf');await fs.writeFile(project+'/Fluid.vkf',source);
const {createProjectCompiler}=await import(pathToFileURL(canonical+'/package-tools/project.mjs')),compiler=await createProjectCompiler({compilerModule:canonical+'/compiler.mjs'}),common='f:.Fluid\nClock:(observation_ns:int,ticks:int,time:num,max_dt:num)\ncoefficients(p:[num])->[num]:f.coefficients(p)\nparameters(nx:int,ny:int,nz:int)->[num]:f.fluid_only_parameters(nx,ny,nz)\nstage_parameters(p:[num],stage:int)->[num]:f.ssprk_parameters(p,stage)\nclock(seconds:num)->Clock:f.clock(seconds)\nclock_absolute(seconds:num,epoch:num)->Clock:f.clock_absolute(seconds,epoch)\n';
const compilerFiles=Object.fromEntries(await Promise.all(['compiler.mjs','compiler.wasm','compiler.data'].map(async name=>[name,hash(await fs.readFile(canonical+'/'+name))])));
const report={compilerFiles,schema:'native-physical-fluid-probe-build/1',status:'UNQUALIFIED',output,sourceSha256:hash(source),libraryBase:execFileSync('git',['-C',library,'rev-parse','HEAD']).toString().trim(),compilerVersion:compiler.compilerVersion,compilerSourceBinding:compiler.sourceBinding,gpuEmitter:hash(await fs.readFile(emitter)),entries:{}};
for(const [name,fn,width]of[['operators','operator_packet',8],['pressure-rhs','pressure_rhs',2],['dft','dft_axis',2],['pressure-spectrum','pressure_spectrum',2],['project','project_velocity',1],['rhs','rhs_component',1],['ssprk-update','ssprk_update',1]]){
 const main=common+`kernel(index:int,params:[num],values:[num])->${width===1?'num':'[num]'}:f.${fn}(index,params,values)\n::kernel(0,[4,4,4,0.4,0.25,0.1,0.0004,1,0,0,0,0.0166666666666667,0.3,0,0,0,0.0002,0,0,0,0,0.000001,0.0001,0],[0:1792])\n`;
 await fs.writeFile(project+'/main.vkf',main);const compiled=await compiler.compileProject(project);await fs.writeFile(output+'/'+name+'.vkf',main);await fs.writeFile(output+'/'+name+'.wasm',compiled.wasm);await fs.writeFile(output+'/'+name+'.json',JSON.stringify(compiled.result.manifest));await fs.writeFile(output+'/'+name+'.ir.json',JSON.stringify(compiled.result.ir));
 execFileSync(emitter,['--source',project+'/main.vkf','--typed-ir',output+'/'+name+'.ir.json','--emit-wgsl-real-f32-field',output+'/'+name+'.wgsl','--wgsl-field-entry','kernel','--wgsl-field-count','0','--wgsl-field-output-width',String(width)],{timeout:120000,maxBuffer:4*1024*1024});
 report.entries[name]={width,wasmSha256:hash(compiled.wasm),irSha256:hash(await fs.readFile(output+'/'+name+'.ir.json')),shaderSha256:hash(await fs.readFile(output+'/'+name+'.wgsl')),sourceSha256:hash(Buffer.from(main))};console.log('FLUID_EMITTED',name);
 await fs.writeFile(output+'/PROVENANCE.json',JSON.stringify(report,null,2)+'\n');
}
report.status='EMITTED_NOT_EXECUTED';await fs.writeFile(output+'/PROVENANCE.json',JSON.stringify(report,null,2)+'\n');await fs.writeFile(root+'/docs/physical-smoke/latest-build.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
