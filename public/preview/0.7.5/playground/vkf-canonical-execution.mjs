import {copyCanonicalRetainedPackets} from './browser-copy-retained-packets.mjs';
import {executeRetainedViaWindow} from './vkf-retained-worker-execution.mjs';
import {createCanonicalBrowserCompiler} from './vkf-canonical-browser-compiler.mjs';
import {createBrowserConcurrentImport} from './vkf-concurrent-host.mjs';
import {prepareConcurrentWorkerType} from './vkf-prepared-workers.mjs';
const now=()=>performance.now();
export async function createCanonicalExecution(packageDescriptor,packageAssets){
  if(!packageDescriptor||typeof packageDescriptor.moduleURL!=='string'||
     typeof packageDescriptor.wasmURL!=='string'||typeof packageDescriptor.dataURL!=='string'){
    throw new TypeError('Canonical compiler package descriptor is unavailable');
  }
  if(packageAssets!==undefined&&(!(packageAssets.wasmBinary instanceof ArrayBuffer)||!(packageAssets.data instanceof ArrayBuffer)))throw new TypeError('Invalid compiler package assets');
  const load=async url=>{const response=await fetch(url);if(!response.ok)throw new Error('Current compiler package is unavailable');return response.arrayBuffer();};
  const [{default:factory},wasmBinary,data]=await Promise.all([
    import(packageDescriptor.moduleURL),packageAssets?.wasmBinary??load(packageDescriptor.wasmURL),packageAssets?.data??load(packageDescriptor.dataURL),
  ]);
  let owner;
  const compiler=await createCanonicalBrowserCompiler({factory:async options=>owner=await factory(options),
    wasmBinary,getPreloadedPackage:()=>data});
  const formatter=owner.formatterOwner??owner;
  const checked=(operation,pointer,length,outputPointer)=>{
    const status=formatter.ccall(operation,'number',['number','number','number'],[pointer,length,outputPointer]);
    if(status!==0)throw new Error(formatter.ccall('vkf_browser_error','string',[],[]));
  };
  const sourceBinding=formatter.ccall('vkf075_source_binding','string',[],[]);
  if(typeof sourceBinding!=='string'||!/^[a-f0-9]{64}$/.test(sourceBinding))throw new TypeError('Compiler source binding is unavailable');
  if(packageDescriptor.expectedSourceBinding!==undefined&&packageDescriptor.expectedSourceBinding!==sourceBinding)throw new TypeError('Compiler source binding mismatch');
  let pending=Promise.resolve();
  const execute=async(source,filename,options)=>{
      const began=now();const program=compiler.compileSource(source,filename,options);
      if(owner.formatterOwner){const prepared=formatter.ccall('vkf_formatter_prepare_ir','number',['string'],[program.typedIRText]);if(prepared!==0)throw new Error(formatter.ccall('vkf_browser_error','string',[],[]));}
      const compiled=now();const module=await WebAssembly.compile(program.wasm);
      const imports=WebAssembly.Module.imports(module);let prepared,host,api,retained;
      try{
        if(imports.length===1&&imports[0].module==='vkf.retained'&&imports[0].name==='invoke_v1'&&imports[0].kind==='function'){
          retained=await executeRetainedViaWindow(program.wasm,program.manifest);
        }else if(imports.length){
          if(imports.length!==1||imports[0].module!=='vkf.concurrent'||imports[0].name!=='invoke'||imports[0].kind!=='function'){
            throw new TypeError('Compiled program requires an unavailable host capability');
          }
          prepared=await prepareConcurrentWorkerType();
          host=createBrowserConcurrentImport(module,()=>api,prepared.WorkerType);
        }
        if(!retained) api=new WebAssembly.Instance(module,host??{}).exports;
        const entry=program.manifest.functions.$vkf_main;
        if(!entry||entry.parameters!==0)throw new TypeError('Current program entry is unavailable');
        const status=retained?0:api.vkf_vm_invoke(entry.index,0);
        if(status!==0)throw new Error('VKF program failed with status '+status);
        host?.materializeOutput();
        const executed=now();
        const used=retained?retained.memory.byteLength:Math.max(api.vkf_vm_heap_ptr(),api.vkf_vm_results_ptr()+api.vkf_vm_value_slot_size());
        if(!Number.isSafeInteger(used)||used<0||used>(retained?retained.memory.byteLength:api.memory.buffer.byteLength))throw new RangeError('Invalid VM output extent');
        const formatStart=now();
        const memory=retained?retained.memory:new Uint8Array(api.memory.buffer,0,used),pointer=formatter._malloc(used);
        const outputPointer=retained?retained.outputPointer:api.vkf_vm_results_ptr();
        if(!pointer)throw new Error('Compiler output transport allocation failed');
        try{
          const allocatedAt=now();
          formatter.HEAPU8.set(memory,pointer);const copiedAt=now();
          checked('vkf_browser_format_stdout',pointer,used,outputPointer);
          const stdout=formatter.ccall('vkf_browser_stdout','string',[],[]);const stdoutAt=now();
          const binaryRetained=typeof formatter._vkf_browser_format_retained_ui_packets_binary==='function';
          checked(binaryRetained?'vkf_browser_format_retained_ui_packets_binary':'vkf_browser_format_retained_ui_packets',pointer,used,outputPointer);
          const retainedFormatAt=now();const packetJSON=formatter.ccall('vkf_browser_retained_ui_packets','string',[],[]);const packetReadAt=now();
          const packets=JSON.parse(packetJSON);const parsedAt=now();
          if(!Array.isArray(packets))throw new TypeError('Compiler returned malformed retained output');
          const output={kind:packets.length?'visual':'console',stdout,stderr:''};
          const ownedPackets=binaryRetained?copyCanonicalRetainedPackets(formatter,packets):packets.map(packet=>({...packet,arena:Uint8Array.from(packet.arena)}));
          if(ownedPackets.length)output.retained_scene_arenas=ownedPackets;
          return {output,retainedHost:retained?.receipt,timing:{formatProfile:{binaryRetained,usedBytes:used,packetJSONChars:packetJSON.length,allocateMs:allocatedAt-formatStart,heapCopyMs:copiedAt-allocatedAt,stdoutMs:stdoutAt-copiedAt,retainedFormatMs:retainedFormatAt-stdoutAt,packetReadMs:packetReadAt-retainedFormatAt,jsonParseMs:parsedAt-packetReadAt,arenaReconstructionMs:now()-parsedAt},compileProfile:program.compileProfile,compileMs:compiled-began,executeMs:executed-compiled,formatMs:now()-executed}};
        }finally{formatter._free(pointer);}
      }finally{host?.close();prepared?.close();}
  };
  return Object.freeze({
    sourceBinding,
    run(source,filename='<browser>',options={}){
      // One compiler owner holds the typed IR used by both native formatters.
      // Keep that entire transaction exclusive, including asynchronous setup.
      const result=pending.then(()=>execute(source,filename,options));
      pending=result.catch(()=>{});
      return result;
    },
  });
}
