import {ensureInlineRenderer} from '../inline-renderer-loader.mjs';
import {createRetainedExecutionControl} from './vkf-retained-execution-control.mjs';
// Retained programs require genuine DOM/render owners. The compiler worker
// delegates only emitted WASM+manifest, then receives owned VM output bytes.
const loads=new Map();
function script(name,globalName){
 if(globalThis[globalName])return Promise.resolve();
 const url=new URL('../vf-ui/'+name,import.meta.url).href;
 if(!loads.has(url))loads.set(url,new Promise((resolve,reject)=>{
  const element=document.createElement('script');element.src=url;
  element.onload=()=>globalThis[globalName]?resolve():reject(new Error('Retained dependency did not register '+name));
  element.onerror=()=>reject(new Error('Retained dependency unavailable '+name));document.head.append(element);
 }));
 return loads.get(url);
}
export async function executeRetainedInWindow(wasm,manifest,{signal}={}){
 const scheduling=createRetainedExecutionControl(signal);scheduling.check();
 if(!globalThis.document)throw new TypeError('Retained execution requires the renderer window');
 await ensureInlineRenderer();scheduling.check();
 await script('vf-frame.js','VfFrame');await script('vf-display.js','VfDisplay');
 await script('vf-html-components.js','VfHtmlComponents');await script('vf-runtime-scene.js','VfRuntimeScene');
 await script('vf-retained-vm-bridge.js','VfRetainedVmBridge');
 const root=document.createElement('div');root.className='vkf-retained-execution';root.style.cssText='position:relative;width:900px;height:500px';document.body.append(root);
 const adapter=VfRuntimeScene.createAdapter({getLayer:()=>root,createRuntimeDependencies:()=>({frame:VfFrame})});
 const bridge=VfHtmlComponents.__internal.createOwnerLookupBridgeV1();
 const producer=adapter.createRetainedProducerSessionV1(bridge);
 const host=VfRetainedVmBridge.createRetainedVmBridgeV1(bridge,{producer});
 try{
  const module=await WebAssembly.compile(wasm),imports=WebAssembly.Module.imports(module);
  if(imports.length!==1||imports[0].kind!=='function'||imports[0].module!=='vkf.retained'||imports[0].name!=='invoke_v1')throw new TypeError('Unsupported retained execution imports');
  const cooperative=manifest.retainedOwner?.executionControl==='cooperative-branches-v1';
  if(cooperative&&(typeof WebAssembly.Suspending!=='function'||typeof WebAssembly.promising!=='function'))
    throw new Error('This retained program requires WebAssembly JSPI execution control');
  scheduling.check();
  const invoke=(op,a,b,c)=>op===7&&cooperative?scheduling.poll(a,b,c):host.imports.invoke_v1(op,a,b,c);
  const api=(await WebAssembly.instantiate(module,{'vkf.retained':{invoke_v1:cooperative?new WebAssembly.Suspending(invoke):invoke}})).exports;host.bind(api,manifest);
  const entry=manifest.functions?.$vkf_main;if(!entry||entry.parameters!==0)throw new TypeError('Missing retained program entry');
  scheduling.check();const status=cooperative?await WebAssembly.promising(api.vkf_vm_invoke)(entry.index,0):api.vkf_vm_invoke(entry.index,0);scheduling.check();if(status!==0)throw new Error('VKF retained program failed with status '+status);
  const used=Math.max(api.vkf_vm_heap_ptr(),api.vkf_vm_results_ptr()+api.vkf_vm_value_slot_size());
  if(!Number.isSafeInteger(used)||used<0||used>api.memory.buffer.byteLength)throw new RangeError('Invalid retained VM output extent');
  // Copy before closing the exact producer session. No VM owner or mutable
  // backing storage survives disposal or is reused by another source.
  const memory=new Uint8Array(api.memory.buffer,0,used).slice();
  const observed=host.observe();
  const receipt={abi:host.abi,frames:observed.map(o=>({connected:o.frame.isConnected,layers:(o.renderer?.layers??[]).map(l=>({mode3d:l.mode3d,topology:l.topology,vertexCount:l.vertices.length/10,indexCount:l.indices.length,first:l.vertices.slice(0,3),last:l.vertices.slice(-10,-7)}))}))};
  return {memory,outputPointer:api.vkf_vm_results_ptr(),receipt};
 }finally{scheduling.close();try{await host.close();}finally{producer.dispose();root.remove();}}
}
const scopes=new WeakMap();
function scopeFor(worker){let scope=scopes.get(worker);if(!scope){scope={closed:false,active:new Set(),reason:undefined};scopes.set(worker,scope);}return scope;}
export async function cancelRetainedExecutions(worker,reason=new DOMException('VKF execution cancelled','AbortError')){
 const scope=scopeFor(worker);scope.closed=true;scope.reason=reason;
 for(const execution of scope.active)execution.controller.abort(reason);
 // The real guest export must settle and its real host must finish disposal.
 await Promise.allSettled([...scope.active].map(execution=>execution.completion));
}
export async function dispatchRetainedExecution(worker,data){
 if(data?.type!=='vkf-execute-retained')return false;
 const scope=scopeFor(worker);if(scope.closed)return true;
 const execution={controller:new AbortController(),completion:null};scope.active.add(execution);
 execution.completion=(async()=>{
  try{
   const result=await executeRetainedInWindow(data.wasm,data.manifest,{signal:execution.controller.signal});
   if(!scope.closed)worker.postMessage({type:'vkf-retained-result',request:data.request,status:'ok',memory:result.memory,outputPointer:result.outputPointer,receipt:result.receipt},[result.memory.buffer]);
  }catch(error){if(!scope.closed)worker.postMessage({type:'vkf-retained-result',request:data.request,status:'error',message:error.message});}
  finally{scope.active.delete(execution);}
 })();
 await execution.completion;return true;
}
