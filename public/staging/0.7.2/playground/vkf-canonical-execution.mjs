import {createCanonicalBrowserCompiler} from './vkf-canonical-browser-compiler.mjs';
import {createBrowserConcurrentImport} from './vkf-concurrent-host.mjs';
import {prepareConcurrentWorkerType} from './vkf-prepared-workers.mjs';
const now=()=>performance.now();
export async function createCanonicalExecution(packageDescriptor){
  if(!packageDescriptor||typeof packageDescriptor.moduleURL!=='string'||
     typeof packageDescriptor.wasmURL!=='string'||typeof packageDescriptor.dataURL!=='string'){
    throw new TypeError('Canonical compiler package descriptor is unavailable');
  }
  const [{default:factory},wasmResponse,dataResponse]=await Promise.all([
    import(packageDescriptor.moduleURL),fetch(packageDescriptor.wasmURL),fetch(packageDescriptor.dataURL),
  ]);
  if(!wasmResponse.ok||!dataResponse.ok)throw new Error('Current compiler package is unavailable');
  const [wasmBinary,data]=await Promise.all([wasmResponse.arrayBuffer(),dataResponse.arrayBuffer()]);
  let owner;
  const compiler=await createCanonicalBrowserCompiler({factory:async options=>owner=await factory(options),
    wasmBinary,getPreloadedPackage:()=>data});
  const checked=(operation,pointer,length,outputPointer)=>{
    const status=owner.ccall(operation,'number',['number','number','number'],[pointer,length,outputPointer]);
    if(status!==0)throw new Error(owner.ccall('vkf_browser_error','string',[],[]));
  };
  let pending=Promise.resolve();
  const execute=async(source,filename)=>{
      const began=now();const program=compiler.compileSource(source,filename);
      const compiled=now();const module=await WebAssembly.compile(program.wasm);
      const imports=WebAssembly.Module.imports(module);let prepared,host,api;
      try{
        if(imports.length){
          if(imports.length!==1||imports[0].module!=='vkf.concurrent'||imports[0].name!=='invoke'||imports[0].kind!=='function'){
            throw new TypeError('Compiled program requires an unavailable host capability');
          }
          prepared=await prepareConcurrentWorkerType();
          host=createBrowserConcurrentImport(module,()=>api,prepared.WorkerType);
        }
        api=new WebAssembly.Instance(module,host??{}).exports;
        const entry=program.manifest.functions.$vkf_main;
        if(!entry||entry.parameters!==0)throw new TypeError('Current program entry is unavailable');
        const status=api.vkf_vm_invoke(entry.index,0);
        if(status!==0)throw new Error('VKF program failed with status '+status);
        host?.materializeOutput();
        const executed=now();
        const used=Math.max(api.vkf_vm_heap_ptr(),api.vkf_vm_results_ptr()+api.vkf_vm_value_slot_size());
        if(!Number.isSafeInteger(used)||used<0||used>api.memory.buffer.byteLength)throw new RangeError('Invalid VM output extent');
        const memory=new Uint8Array(api.memory.buffer,0,used),pointer=owner._malloc(used);
        if(!pointer)throw new Error('Compiler output transport allocation failed');
        try{
          owner.HEAPU8.set(memory,pointer);
          checked('vkf_browser_format_stdout',pointer,used,api.vkf_vm_results_ptr());
          const stdout=owner.ccall('vkf_browser_stdout','string',[],[]);
          checked('vkf_browser_format_retained_ui_packets',pointer,used,api.vkf_vm_results_ptr());
          const packets=JSON.parse(owner.ccall('vkf_browser_retained_ui_packets','string',[],[]));
          if(!Array.isArray(packets))throw new TypeError('Compiler returned malformed retained output');
          const output={kind:packets.length?'visual':'console',stdout,stderr:''};
          if(packets.length)output.retained_scene_arenas=packets.map(packet=>({...packet,arena:Uint8Array.from(packet.arena)}));
          return {output,timing:{compileMs:compiled-began,executeMs:executed-compiled,formatMs:now()-executed}};
        }finally{owner._free(pointer);}
      }finally{host?.close();prepared?.close();}
  };
  return Object.freeze({
    run(source,filename='<browser>'){
      // One compiler owner holds the typed IR used by both native formatters.
      // Keep that entire transaction exclusive, including asynchronous setup.
      const result=pending.then(()=>execute(source,filename));
      pending=result.catch(()=>{});
      return result;
    },
  });
}
