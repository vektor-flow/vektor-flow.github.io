import {takeNormalPhysicsProgram} from './vkf-normal-physics-program.mjs?sha256=96a6931d3215793bbbc1c5c23724e4145e25c11ca27b0c73b20020f701d43260';
import {prepareNormalPhysicsLifetime,classifyNormalImports} from './vkf-normal-physics-lifetime.mjs?sha256=7db652e4e100f1bba04f50fa35ee570762d8cb9dd1950d811e4b1f3afc0f4340';
import {prepareFormatterIr} from './prepare-formatter-ir.mjs';
import {copyCanonicalRetainedPackets} from './browser-copy-retained-packets.mjs';
import {executeRetainedViaWindow} from './vkf-retained-worker-execution.mjs?sha256=005e0af2270e715e32601bb13baeb03de47eb66024538ac44d069f003c84f30a';
import {createCanonicalBrowserCompiler} from './vkf-canonical-browser-compiler.mjs?sha256=8e6aefa73f34906e854999572c12eb75fb6931f0382858cc95b07b1bbf223e6f';
import {createBrowserConcurrentImport} from './vkf-concurrent-host.mjs';
import {prepareConcurrentWorkerType} from './vkf-prepared-workers.mjs';
const now=()=>performance.now();
export async function createCanonicalExecution(packageDescriptor,packageAssets,resolvedPackageInputs){
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
  let packageEntry;
  if(resolvedPackageInputs!==undefined){
    if(typeof owner._vkf075_package_source_inputs_version!=='function'||owner._vkf075_package_source_inputs_version()<(resolvedPackageInputs.addressInputs?2:1))
      throw new TypeError('Compiler lacks the explicit package SourceProvider adapter');
    const {mountInputs}=await import('./package-tools/inputs.mjs');
    packageEntry=mountInputs(owner,resolvedPackageInputs);
  }
  const formatter=owner.formatterOwner??owner;
  const checked=(operation,pointer,length,outputPointer)=>{
    const status=formatter.ccall(operation,'number',['number','number','number'],[pointer,length,outputPointer]);
    if(status!==0)throw new Error(formatter.ccall('vkf_browser_error','string',[],[]));
  };
  const sourceBinding=owner.ccall('vkf075_source_binding','string',[],[]);
  if(typeof sourceBinding!=='string'||!/^[a-f0-9]{64}$/.test(sourceBinding))throw new TypeError('Compiler source binding is unavailable');
  if(packageDescriptor.expectedSourceBinding!==undefined&&packageDescriptor.expectedSourceBinding!==sourceBinding)throw new TypeError('Compiler source binding mismatch');
  let pending=Promise.resolve();
  const execute=async(source,filename,options)=>{
      const trace=(phase)=>console.warn("[e2212-current-host-phase] "+phase+" ms="+now().toFixed(3));const began=now();trace("compileSource.entry");const program=compiler.compileSource(source,filename,options);trace("compileSource.return");
      trace("prepareFormatterIr.entry");if(owner.formatterOwner){const prepared=prepareFormatterIr(formatter,program.typedIRText);if(prepared!==0)throw new Error(formatter.ccall('vkf_browser_error','string',[],[]));}
      trace("prepareFormatterIr.return");const compiled=now();trace("WebAssembly.compile.entry");const module=await WebAssembly.compile(program.wasm);trace("WebAssembly.compile.return");
      const imports=WebAssembly.Module.imports(module),route=classifyNormalImports(imports);
      let prepared,host,api,retained,physics;
      try{
        options.signal?.throwIfAborted();
        if(route.physics!==Boolean(program.manifest.physicsReplay))
          throw new TypeError('Normal physics compiler/import association differs');
        if(route.retained){
          trace("executeRetainedViaWindow.entry");
          retained=await executeRetainedViaWindow(program.wasm,program.manifest,
            {program,sourceBinding,signal:options.signal});
          trace("executeRetainedViaWindow.return");
        }else{
          let issued;
          if(route.physics){
            issued=takeNormalPhysicsProgram(program,sourceBinding);
            physics=await prepareNormalPhysicsLifetime(issued.sourceOwner,issued.manifest,issued.binding,options.signal);
          }
          if(route.concurrent){
            prepared=await prepareConcurrentWorkerType();
            options.signal?.throwIfAborted();
            host=createBrowserConcurrentImport(module,()=>api,prepared.WorkerType);
          }
          options.signal?.throwIfAborted();
          api=new WebAssembly.Instance(module,{...(host??{}),...(physics?.imports??{})}).exports;
          physics?.bind(api);
        }
        const entry=program.manifest.functions.$vkf_main;
        if(!entry||entry.parameters!==0)throw new TypeError('Current program entry is unavailable');
        trace("vkf_vm_invoke.entry");const status=retained?0:api.vkf_vm_invoke(entry.index,0);trace("vkf_vm_invoke.return");
        if(status!==0)throw new Error('VKF program failed with status '+status);
        options.signal?.throwIfAborted();
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
          trace("formatter.stdout.entry");checked('vkf_browser_format_stdout',pointer,used,outputPointer);trace("formatter.stdout.return");
          const stdout=formatter.ccall('vkf_browser_stdout','string',[],[]);const stdoutAt=now();
          if(retained?.receipt?.liveWorld===true){
            // The real Frame owns this World. Formatting detached scene packets
            // would construct a second static presentation after guest return.
            return {output:{kind:'visual',stdout,stderr:''},retainedHost:retained.receipt,
              timing:{compileMs:compiled-began,executeMs:executed-compiled,formatMs:now()-executed}};
          }
          const binaryRetained=typeof formatter._vkf_browser_format_retained_ui_packets_binary==='function';
          trace("formatter.retained.entry");checked(binaryRetained?'vkf_browser_format_retained_ui_packets_binary':'vkf_browser_format_retained_ui_packets',pointer,used,outputPointer);
          trace("formatter.retained.return");const retainedFormatAt=now();const packetJSON=formatter.ccall('vkf_browser_retained_ui_packets','string',[],[]);const packetReadAt=now();
          trace("packetJSON.parse.entry");const packets=JSON.parse(packetJSON);trace("packetJSON.parse.return");const parsedAt=now();
          if(!Array.isArray(packets))throw new TypeError('Compiler returned malformed retained output');
          const output={kind:packets.length?'visual':'console',stdout,stderr:''};
          const ownedPackets=binaryRetained?copyCanonicalRetainedPackets(formatter,packets):packets.map(packet=>({...packet,arena:Uint8Array.from(packet.arena)}));
          if(ownedPackets.length)output.retained_scene_arenas=ownedPackets;
          const generation=typeof formatter._vkf_browser_retained_temporal_generation==='function'?formatter.ccall('vkf_browser_retained_temporal_generation','string',[],[]):'';
          return {output,temporal:generation?{generation}:undefined,retainedHost:retained?.receipt,timing:{formatProfile:{binaryRetained,usedBytes:used,packetJSONChars:packetJSON.length,allocateMs:allocatedAt-formatStart,heapCopyMs:copiedAt-allocatedAt,stdoutMs:stdoutAt-copiedAt,retainedFormatMs:retainedFormatAt-stdoutAt,packetReadMs:packetReadAt-retainedFormatAt,jsonParseMs:parsedAt-packetReadAt,arenaReconstructionMs:now()-parsedAt},compileProfile:program.compileProfile,compileMs:compiled-began,executeMs:executed-compiled,formatMs:now()-executed}};
        }finally{formatter._free(pointer);}
      }finally{
        try{physics?.close();}finally{try{host?.close();}finally{prepared?.close();}}
      }
  };
  return Object.freeze({
    sourceBinding,
    disposeTemporal(generation){
      const result=pending.then(()=>{
        if(typeof generation!=='string'||!generation)throw new TypeError('Invalid temporal source generation');
        if(typeof formatter._vkf_browser_dispose_retained_temporal==='function')
          formatter.ccall('vkf_browser_dispose_retained_temporal',null,['string'],[generation]);
        return {disposed:true,generation};
      });
      pending=result.catch(()=>{});return result;
    },
    sample(elapsed,generation){
      const result=pending.then(()=>{
        if(typeof generation!=='string'||!generation||typeof elapsed!=='number'||!Number.isFinite(elapsed)||elapsed<0)
          throw new TypeError('Invalid source-owned temporal sample request');
        if(typeof formatter._vkf_browser_sample_retained_ui_packets_binary!=='function')
          throw new TypeError('Compiled temporal sampler is unavailable');
        const status=formatter.ccall('vkf_browser_sample_retained_ui_packets_binary','number',['number','string'],[elapsed,generation]);
        if(status!==0)throw new Error(formatter.ccall('vkf_browser_error','string',[],[]));
        const packets=JSON.parse(formatter.ccall('vkf_browser_retained_ui_packets','string',[],[]));
        return {packets:copyCanonicalRetainedPackets(formatter,packets),generation};
      });
      pending=result.catch(()=>{});return result;
    },
    run(source,filename=packageEntry??'<browser>',options={}){
      // One compiler owner holds the typed IR used by both native formatters.
      // Keep that entire transaction exclusive, including asynchronous setup.
      const result=pending.then(()=>execute(source,filename,options));
      pending=result.catch(()=>{});
      return result;
    },
  });
}
