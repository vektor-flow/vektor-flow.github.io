import fs from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url))),base=root+'/public/preview/0.7.5/vf-ui/',{createSymbolicKernel}=await import(pathToFileURL(base+'vf-symbolic-kernel-runtime.mjs')),wasm=await fs.readFile(base+'artifacts/state-interpolation/state.wasm'),manifest=JSON.parse(await fs.readFile(base+'artifacts/state-interpolation/state.json')),module=await WebAssembly.compile(wasm),calls=(await fs.readFile(process.argv[2]??'/tmp/vkf-state-color-native-calls.jsonl','utf8')).trim().split('\n').map(JSON.parse),hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expectedGeometry=new Set(calls.filter(c=>c.name==='prepare_geometry_attributes').map(c=>hash(c.args[0]))),expectedAttributes=new Set(calls.filter(c=>c.name==='gpu_ink_controls').map(c=>hash(c.args[0]))),expectedFields=new Set();for(const c of calls.filter(c=>c.name==='prepare_geometry')){const fields=c.args[6],cells=c.args[7]**c.args[8];for(let i=0;i<fields.length;i+=cells)expectedFields.add(hash(fields.slice(i,i+cells)));}
const memory=[],records=[],creation=[];let geometryChecks=0,attributeChecks=0,fieldChecks=0;
for(let i=0;i<calls.length;i++){
 const {name,args}=calls[i];if(!manifest.functions[name])continue;
 const before=process.memoryUsage(),start=performance.now();
 let instance=new WebAssembly.Instance(module,{});creation.push(performance.now()-start);
 let kernel=createSymbolicKernel({instance,manifest,diagnostics:true});
 let value=kernel.invokeValue(name,args),h=hash(value);
 if(name==='prepare_geometry'&&expectedGeometry.has(h))geometryChecks++;
 if(name==='prepare_geometry_attributes'&&expectedAttributes.has(h))attributeChecks++;
 if(name==='contour_field'){assert(expectedFields.has(h),'Native physical field differs from actual preparation input');fieldChecks++;}
 records.push({i,name,hash:h,ms:performance.now()-start,heapAfter:instance.exports.vkf_vm_heap_ptr()});
 assert.equal(instance.exports.vkf_vm_heap_ptr(),manifest.runtimeDiagnostic.heapBegin);
 value=null;kernel=null;instance=null;
 const after=process.memoryUsage();memory.push({i,before,after});
 if(name==='prepare_geometry')console.log(JSON.stringify({geometry:i,carriers:args[3],ms:records.at(-1).ms,memory:after}));
}
assert.equal(geometryChecks,calls.filter(c=>c.name==='prepare_geometry_attributes').length);
assert.equal(attributeChecks,expectedAttributes.size);
const sorted=[...creation].sort((a,b)=>a-b),peak=Object.fromEntries(['rss','heapUsed','external','arrayBuffers'].map(k=>[k,Math.max(...memory.flatMap(m=>[m.before[k],m.after[k]]))]));
const result={passed:true,mode:'Fresh WebAssembly.Instance per detached value operation; one cached exact module; no host math, reset, forcedGC, or retained native handles',wasmSha256:createHash('sha256').update(wasm).digest('hex'),traceSha256:createHash('sha256').update(await fs.readFile(process.argv[2]??'/tmp/vkf-state-color-native-calls.jsonl')).digest('hex'),calls:records.length,originalTraceCalls:calls.length,geometryChecks,attributeChecks,fieldChecks,creationMs:{min:sorted[0],median:sorted[Math.floor(sorted.length/2)],max:sorted.at(-1)},peakProcessBytes:peak,finalProcessBytes:process.memoryUsage(),records};await fs.writeFile(new URL('../../docs/state-colors/KERNEL_OWNERSHIP.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,records:undefined}));
