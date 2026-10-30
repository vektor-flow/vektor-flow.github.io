// Actual final Node compiler and emitted VM exports. Never imported by SOURCE tests.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {parse} from './bench-oracle-worker.mjs';
const req=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
assert.equal(fs.fstatSync(Number(process.env.VKF_HEAVY_LOCK_FD)).ino,8915659);
const require=createRequire(import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
function bytes(p){const b=fs.readFileSync(p.path);assert.equal(hash(b),p.sha256);assert.equal(b.length,p.bytes);return b;}
const {row,phase,component,host}=req;for(const p of component.files)bytes(p);for(const p of Object.values(host))bytes(p);
const {diagnosticBoundary}=await import(pathToFileURL(host.diagnostic.path));
const {decodeOutputStream}=await import(pathToFileURL(host.codec.path));
const {executeEmittedProgramV1}=await import(pathToFileURL(host.consumer.path));
const {mountImmutableHostDocuments}=await import(pathToFileURL(host.documents.path));
// Verify once; compiler FS and each separate guest receive the same original bytes.
const documents=!req.peer&&row.oracle.mount?[{path:row.oracle.mount.virtual_path,bytes:new Uint8Array(bytes(row.oracle.mount.input))}]:[];
const result={samples_ms:[],values:[],outputs:[],compile_samples_ms:[],full_program_samples_ms:[],node_version:process.version,v8_version:process.versions.v8,
 lifecycle:'one cold compiler owner per row; core independent correctness consumer then one fresh guest timer instance with exact transient heap rewind; extra one guest instance no rewind as original',engine:'Node-V8-WASM32',accepted_samples:0};
let program,wasm;
if(req.peer){wasm=fs.readFileSync(req.peer.wasm);}
else{
 const cjs=component.files.find(p=>p.path.endsWith('.cjs')),esm=component.files.find(p=>p.path.endsWith('/compiler.mjs')),w=component.files.find(p=>p.path.endsWith('/compiler.wasm')||p.path.endsWith('/vkf-0.7.5.wasm'));
 assert.ok((cjs||esm)&&w);const start=performance.now();
 const factory=esm?(await import(pathToFileURL(esm.path))).default:require(cjs.path);
 const data=component.files.find(p=>p.path.endsWith('/compiler.data'));
 const owner=await factory({wasmBinary:bytes(w),noInitialRun:true,...(data?{getPreloadedPackage:()=>{const b=bytes(data);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);}}:{})});result.owner_cold_ms=performance.now()-start;
 if(component.formatter_source_binding){assert.ok(owner.formatterOwner);assert.equal(owner.formatterOwner.ccall('vkf075_source_binding','string',[],[]),component.formatter_source_binding);}
 assert.equal(owner.ccall('vkf075_version','string',[],[]),'VKF 0.7.5');assert.equal(owner.ccall('vkf075_source_binding','string',[],[]),component.source_binding);
 for(const document of documents){owner.FS.mkdirTree(path.dirname(document.path));owner.FS.writeFile(document.path,document.bytes);}
 const source=bytes(row.source_pins[0]).toString();
 const runs=row.suite==='core'&&phase==='measure'?10:1,warmups=row.suite==='core'?1:0;
 for(let i=-warmups;i<runs;i++){
  const start=performance.now();program=JSON.parse(owner.ccall('vkf075_compile','string',['string','string'],[source,row.workload+'.vkf']));const elapsed=performance.now()-start;
  assert.equal(program.ok,true,program.error);assert.equal(program.source_binding,component.source_binding);if(i>=0)result.compile_samples_ms.push(elapsed);
 }
 wasm=Buffer.from(program.wasm_hex,'hex');fs.writeFileSync(path.join(req.run,'program.wasm'),wasm);fs.writeFileSync(path.join(req.run,'program.json'),JSON.stringify(program));
 result.program_sha256=hash(wasm);
}
let e,entry,invoke, timerHost;
const concurrent = host.concurrent ? (await import(pathToFileURL(host.concurrent.path))).createNodeConcurrent() : null;
result.concurrent = concurrent?.receipt;
const count=phase==='measure'?10:0;
let timerFailed = false, timerFailure;
try {
if(req.peer){const m=await WebAssembly.compile(wasm);assert.equal(WebAssembly.Module.imports(m).length,0,'missing genuine peer host import');const instance=await WebAssembly.instantiate(m);e=instance.exports;e._initialize?.();invoke=()=>e.vkf_benchmark();}
else{
 // Use actual final consumer for correctness/host-capability intake before timing.
 // No fabricated import handlers: concurrent/retained unavailable in Node stay UNRUN.
 entry=program.manifest.functions[row.suite==='core'&&row.workload!=='combined-kernels-parallel-large'?'vkf_benchmark_entry':'$vkf_main'];assert.ok(entry&&entry.parameters===0);
 const correctnessEntry=program.manifest.functions.$vkf_main;assert.ok(correctnessEntry&&correctnessEntry.parameters===0);
 const initial=await executeEmittedProgramV1(wasm,program.manifest,correctnessEntry,{diagnosticBoundary,decodeOutputStream,concurrent,...(documents.length?{documents}:{}),prerequisiteError:m=>new Error('UNRUN genuine host prerequisite: '+m),observe:({instance})=>{e=instance.exports;}});
 if(row.suite==='core'){
  const value=Array.isArray(initial.value)?initial.value[0]:initial.value;
  assert.ok(Number.isFinite(value));result.observation={value};result.correctness_observation={value};
  const m=await WebAssembly.compile(wasm), imports=WebAssembly.Module.imports(m);
  if(imports.length) {assert.ok(concurrent && imports.length===1 && imports[0].module==='vkf.concurrent' && imports[0].name==='invoke');timerHost=concurrent.create(m,()=>e);}
  e=(await WebAssembly.instantiate(m,timerHost??{})).exports;
  if(documents.length)mountImmutableHostDocuments(e,program.manifest,documents);
 }else{const stdout=initial.value.map(v=>String(v)).join('\n');await parse(row,'vkf',stdout);result.observation={stdout};}
 const boundary=diagnosticBoundary(e,program.manifest);
 invoke=()=>{
  const checkpoint=e.vkf_vm_heap_ptr();
  try{
   assert.equal(boundary.invoke(entry.index,0),0);
   if(row.suite!=='core'||entry===program.manifest.functions.$vkf_main){timerHost?.materializeOutput();const s=decodeOutputStream(e,program.manifest);assert.equal(s.effects.length,0);return s.value;}
   assert.equal(e.vkf_vm_value_slot_size(),24);const ptr=e.vkf_vm_results_ptr(),view=new DataView(e.memory.buffer);assert.equal(view.getUint32(ptr,true),2);return view.getFloat64(ptr+8,true);
  }finally{if(row.suite==='core')assert.equal(e.vkf_vm_rewind(checkpoint),checkpoint);}
 };
}
const warmups=req.peer||row.suite==='core'?(row.warmup_contract.runtime_warmups??1):0;
async function observe(measured){const start=performance.now(),value=invoke(),wall=performance.now()-start;
 if(row.suite==='core'){const v=Array.isArray(value)?value[0]:value;assert.ok(Number.isFinite(v));if(result.correctness_observation)assert.ok(Math.abs(v-result.correctness_observation.value)<=(row.oracle.original_definition?.tolerance??1e-9),'main stdout versus direct benchmark entry mismatch');if(measured){result.samples_ms.push(wall);result.values.push(v);}return {value:v};}
 const stdout=value.map(v=>String(v)).join('\n'),parsed=await parse(row,'vkf',stdout);if(measured){result.samples_ms.push(parsed.elapsed_ms);result.outputs.push(stdout);result.full_program_samples_ms.push(wall);if(row.oracle.kind==='e1201-exact-symbolic'){(result.first_operation_samples_ms??=[]).push(parsed.first_operation_ms);}}return {stdout};}
for(let i=0;i<warmups;i++){result.observation=await observe(false);result.runtime_warmups_completed=(result.runtime_warmups_completed??0)+1;}
for(let i=0;i<count;i++)await observe(true);
} catch (error) { timerFailed = true; timerFailure = error; throw error; }
finally {
  try { await timerHost?.close(); }
  catch (closeError) {
    if (!timerFailed) throw closeError;
    if (timerFailure && (typeof timerFailure === 'object' || typeof timerFailure === 'function')) {
      try { Object.defineProperty(timerFailure, 'ownedCloseErrors', {value: [closeError], configurable: true}); }
      catch { /* Preserve even a frozen primary error. */ }
    }
  }
}
if(row.parallel_contract){assert.ok(concurrent?.receipt.workers_created>0);assert.equal(concurrent.receipt.workers_created,concurrent.receipt.workers_closed);assert.ok(concurrent.receipt.operations[6]>0);assert.equal(concurrent.receipt.operations[6],concurrent.receipt.operations[7]);}
assert.equal(result.samples_ms.length,count);result.accepted_samples=count;
fs.writeFileSync(path.join(req.run,'node-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
