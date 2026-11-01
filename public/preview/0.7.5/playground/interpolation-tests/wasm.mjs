import {prepareFormatterIr} from '../../prepare-formatter-ir.mjs';
// ACTUAL only. Existing canonical compiler/guest/formatter boundaries, no mocks.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const [packageDir,bridgeFile,oracleFile,outputFile,expectedBinding]=process.argv.slice(2);
assert(packageDir&&bridgeFile&&oracleFile&&outputFile&&expectedBinding,
  'Usage: node wasm.mjs PACKAGE BRIDGE ORACLE_VKF NEW_RESULT_JSON EXPECTED_BINDING');
assert(!fs.existsSync(outputFile),'new owned result required');
const {default:factory}=await import(pathToFileURL(path.resolve(packageDir,'compiler.mjs')));
const {createCanonicalBrowserCompiler}=await import(pathToFileURL(path.resolve(bridgeFile)));
const data=fs.readFileSync(path.join(packageDir,'compiler.data'));
let owner;
const compiler=await createCanonicalBrowserCompiler({factory:async options=>owner=await factory(options),
  wasmBinary:fs.readFileSync(path.join(packageDir,'compiler.wasm')),
  getPreloadedPackage:()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)});
const binding=owner.ccall('vkf075_source_binding','string',[],[]);
assert.equal(binding,expectedBinding,'current paired compiler binding');
const report={status:'IN_PROGRESS',binding,rows:[]};
const save=()=>fs.writeFileSync(outputFile,JSON.stringify(report,null,2)+'\n');
save();
async function run(name,source,wanted){
  const row={name,status:'COMPILING'};report.rows.push(row);save();
  try{
    const program=compiler.compileSource(source,'<paired-interpolation-'+name+'>');
    row.status='EXECUTING';row.typedIRChars=program.typedIRText.length;row.typedIRUTF8Bytes=Buffer.byteLength(program.typedIRText);save();
    assert.deepEqual(WebAssembly.Module.imports(await WebAssembly.compile(program.wasm)),[],
      'pure interpolation must not use a host numerical replacement');
    const {instance}=await WebAssembly.instantiate(program.wasm,{});
    const api=instance.exports;
    assert.equal(api.vkf_vm_invoke(program.manifest.functions.$vkf_main.index,0),0,'actual guest status');
    const used=Math.max(api.vkf_vm_heap_ptr(),api.vkf_vm_results_ptr()+api.vkf_vm_value_slot_size());
    assert(used<=api.memory.buffer.byteLength,'complete output extent');
    const formatter=owner.formatterOwner??owner;
    if(owner.formatterOwner)
      assert.equal(prepareFormatterIr(formatter,program.typedIRText),0);
    const pointer=formatter._malloc(used);
    assert(pointer,'formatter transport allocation');
    try{
      formatter.HEAPU8.set(new Uint8Array(api.memory.buffer,0,used),pointer);
      assert.equal(formatter.ccall('vkf_browser_format_stdout','number',
        ['number','number','number'],[pointer,used,api.vkf_vm_results_ptr()]),0);
      row.stdout=formatter.ccall('vkf_browser_stdout','string',[],[]);
      assert.equal(row.stdout,wanted,'complete current guest output');
    }finally{formatter._free(pointer);}
    row.status='PASS';row.profile=program.compileProfile;
  }catch(error){row.status='FAIL';row.error=String(error.stack??error);throw error;}
  finally{save();}
}
try{
  const source=fs.readFileSync(oracleFile,'utf8');
  assert(source.startsWith('i:.interpolation\n'),'oracle must use paired root import');
  await run('independent-rational-oracles',source,'true\n');
  await run('same-prepared-api-again',source,'true\n');
  report.status='PASS_PAIRED_INTERPOLATION_WASM_ORACLES';
  report.limits=['Numerical guest check; not native/WASM agreement until native suite also passes.',
    'No browser rendering, plotting-parameter routing, GPU or release qualification.'];
}catch(error){report.status='FAIL';report.error=String(error.stack??error);throw error;}
finally{save();}
