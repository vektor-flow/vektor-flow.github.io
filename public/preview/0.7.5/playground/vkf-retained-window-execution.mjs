import {mountCurrentPlotToolbar} from '../vf-ui/vf-current-plot-toolbar.mjs?sha256=58ece8a17754b30c97b0d8764dd99681244518ccb5c0af885ead9f3f7f511f5c';
import {prepareNormalPhysicsLifetime,classifyNormalImports} from './vkf-normal-physics-lifetime.mjs?sha256=7db652e4e100f1bba04f50fa35ee570762d8cb9dd1950d811e4b1f3afc0f4340';
import {ensureInlineRenderer} from '../inline-renderer-loader.mjs?sha256=74ff15e8210e3433af40b3bf7aa4ae7211ff91000d8e1f9c5d07be96e3eb116a';
import {createRetainedExecutionControl} from './vkf-retained-execution-control.mjs';
// Retained programs require genuine DOM/render owners. The compiler worker
// delegates only emitted WASM+manifest, then receives owned VM output bytes.
const loads=new Map();
// Tickets exist only inside the actual compiler-worker dispatch closure. A
// manifest, bytes, worker id or guest-supplied field cannot create one.
const physicsTickets=new WeakMap();
const scriptVersions={"vf-display.js": "a63e5e93d7fc001c06b534d35b0a9879ee27921775efff2a846e751ae1504026", "vf-runtime-scene.js": "1b3fd49c45b020dab4cad23ac4e34daddf1fb22f404499b7fe8504da81e9b568", "vf-retained-vm-bridge.js": "6573003b4094abd3eccc915df32c4209aa40db9fe50e99ed51c7433a7ab2eb72"};
function script(name,globalName){
 if(globalThis[globalName])return Promise.resolve();
 const url=new URL('../vf-ui/'+name+(scriptVersions[name]?'?sha256='+scriptVersions[name]:''),import.meta.url).href;
 if(!loads.has(url))loads.set(url,new Promise((resolve,reject)=>{
  const element=document.createElement('script');element.src=url;
  element.onload=()=>globalThis[globalName]?resolve():reject(new Error('Retained dependency did not register '+name));
  element.onerror=()=>reject(new Error('Retained dependency unavailable '+name));document.head.append(element);
 }));
 return loads.get(url);
}
export async function executeRetainedInWindow(wasm,manifest,{signal,resourceBaseUrl,resourceUrls,mountTarget,onRetainedEventState,normalPhysicsTicket,onFrameClose,onPhysicsError,onLifetime}={}){
 const scheduling=createRetainedExecutionControl(signal);
 let root,producer,host,physics,transferred=false,closing,closed=false;
 const close=()=>{
  if(closed)return Promise.resolve();
  // Install the shared close promise before callbacks can reenter teardown.
  return closing??=Promise.resolve().then(async()=>{
   scheduling.close();const failures=[];
   try{producer?.quiesce();}catch(error){failures.push(error);}
   try{await host?.quiesce();}catch(error){failures.push(error);}
   try{physics?.close();}catch(error){failures.push(error);}
   // A precondition refusal preserves the same VM/resource authority, and the
   // retained scope keeps this entry available for a later safe close.
   if(physics&&!physics.closed)
     throw new AggregateError(failures,'Retained physical teardown refused before invalidation');
   try{producer?.dispose();}catch(error){failures.push(error);}
   try{await host?.close();}catch(error){failures.push(error);}
   finally{root?.remove();closed=true;}
   if(failures.length)throw new AggregateError(failures,'Retained physical cleanup failed');
  }).catch(error=>{if(!closed)closing=undefined;throw error;});
 };
 const lifetime=Object.freeze({get root(){return root;},close,get closed(){return closed;},
   get frameCompletion(){return closed ? null : producer?.frameCompletion ?? null;}});
 try{
 onLifetime?.(lifetime);
 scheduling.check();
 if(!globalThis.document)throw new TypeError('Retained execution requires the renderer window');
 await ensureInlineRenderer();scheduling.check();
 await script('vf-frame.js','VfFrame');await script('vf-display.js','VfDisplay');
 await script('vf-html-components.js','VfHtmlComponents');await script('vf-runtime-scene.js','VfRuntimeScene');
 await script('vf-retained-vm-bridge.js','VfRetainedVmBridge');
 await script('vf-static-html-loader.js','VfStaticHtmlLoader');
 if(resourceBaseUrl!==undefined){
  const base=new URL(resourceBaseUrl,document.baseURI);
  if(base.origin!==location.origin||!Array.isArray(resourceUrls)||!resourceUrls.length||
     resourceUrls.some(url=>typeof url!=='string'||new URL(url).origin!==base.origin))
   throw new TypeError('Retained static resources require an admitted same-origin inventory');
  resourceBaseUrl=base.href;resourceUrls=Object.freeze([...resourceUrls]);
 }
 if(mountTarget!==undefined&&(!(mountTarget instanceof Element)||!mountTarget.isConnected))
  throw new TypeError('Retained execution mount target must be an owned connected Element');
 root=document.createElement('div');root.className='vkf-retained-execution';root.style.cssText='position:relative;width:900px;height:500px';(mountTarget??document.body).append(root);
 const adapter=VfRuntimeScene.createAdapter({getLayer:()=>root,createRuntimeDependencies:()=>({frame:VfFrame})});
 const bridge=VfHtmlComponents.__internal.createOwnerLookupBridgeV1();
 producer=adapter.createRetainedProducerSessionV1(bridge,{onPhysicsError,onFrameClose:()=>{
   scheduling.close();
   if(onFrameClose)return onFrameClose();
   if(transferred)void close().catch(error=>{
     root?.dispatchEvent(new CustomEvent('vf-example-render-error',{bubbles:true,detail:{error,message:error.message}}));
     onPhysicsError?.(error);
   });
 }});
 const loader={mountFrameHtmlForOwnerV1:(frame,url,capabilities)=>{
  if(resourceBaseUrl===undefined||!Array.isArray(resourceUrls))
   throw new TypeError('Frame.load requires its source-relative static bundle inventory');
  return VfStaticHtmlLoader.mountFrameHtmlForOwnerV1(frame,url,capabilities,{resourceUrls,signal,compiledOwnerEvents:true});
 }};
 host=VfRetainedVmBridge.createRetainedVmBridgeV1(bridge,{producer,loader,resourceBaseUrl,resourceUrls,signal,onRetainedEventState,
   physics:{
     bindWorld:(...args)=>{if(!physics)throw new TypeError('Actual physics lifetime unavailable');return physics.bindWorld(...args);},
     requestWorld:(...args)=>{if(!physics)throw new TypeError('Actual physics lifetime unavailable');return physics.requestWorld(...args);}
   }});
  const module=await WebAssembly.compile(wasm),imports=WebAssembly.Module.imports(module);
  const route=classifyNormalImports(imports);
  if(!route.retained||route.concurrent||route.physics!==Boolean(manifest.physicsReplay))
    throw new TypeError('Unsupported retained execution imports');
  if(route.physics){
    const ticket=physicsTickets.get(normalPhysicsTicket);physicsTickets.delete(normalPhysicsTicket);
    if(!ticket||ticket.wasm!==wasm||ticket.manifest!==manifest||ticket.closed)
      throw new TypeError('Actual current compiler-worker source owner is required');
    scheduling.check();
    physics=await prepareNormalPhysicsLifetime(ticket.sourceOwner,manifest,ticket.binding,signal);
    scheduling.check();
  }
  const cooperative=manifest.retainedOwner?.executionControl==='cooperative-branches-v1';
  if(cooperative&&(typeof WebAssembly.Suspending!=='function'||typeof WebAssembly.promising!=='function'))
    throw new Error('This retained program requires WebAssembly JSPI execution control');
  scheduling.check();
  const invoke=(op,a,b,c)=>op===7&&cooperative?scheduling.poll(a,b,c):host.imports.invoke_v1(op,a,b,c);
  const api=(await WebAssembly.instantiate(module,{
    'vkf.retained':{invoke_v1:cooperative?new WebAssembly.Suspending(invoke):invoke},
    ...(physics?.imports??{}),
  })).exports;
  physics?.bind(api);host.bind(api,manifest);
  const entry=manifest.functions?.$vkf_main;if(!entry||entry.parameters!==0)throw new TypeError('Missing retained program entry');
  scheduling.check();const status=cooperative?await WebAssembly.promising(api.vkf_vm_invoke)(entry.index,0):api.vkf_vm_invoke(entry.index,0);scheduling.check();if(status!==0)throw new Error('VKF retained program failed with status '+status);
  const used=Math.max(api.vkf_vm_heap_ptr(),api.vkf_vm_results_ptr()+api.vkf_vm_value_slot_size());
  if(!Number.isSafeInteger(used)||used<0||used>api.memory.buffer.byteLength)throw new RangeError('Invalid retained VM output extent');
  // Formatter receives detached output bytes. Live physical presentation keeps
  // the SAME VM/source/resource/producer separately, never a remounted packet.
  const memory=new Uint8Array(api.memory.buffer,0,used).slice();
  const observed=host.observe();
  const receipt={abi:host.abi,frames:observed.map(o=>({connected:o.frame.isConnected,layers:(o.renderer?.layers??[]).map(l=>({mode3d:l.mode3d,topology:l.topology,vertexCount:l.vertices.length/10,indexCount:l.indices.length,first:l.vertices.slice(0,3),last:l.vertices.slice(-10,-7)}))}))};
  if(manifest.retainedOwner?.physicsBinding==='opaque-session-frame-v1'){
    if(!physics)throw new TypeError('Physical retained program has no actual resource');
    scheduling.check();producer.startPhysics(mountCurrentPlotToolbar);
    receipt.liveWorld=true;
    transferred=true;return {memory,outputPointer:api.vkf_vm_results_ptr(),receipt,lifetime};
  }
  return {memory,outputPointer:api.vkf_vm_results_ptr(),receipt};
 }finally{
  physicsTickets.delete(normalPhysicsTicket);
  if(!transferred)await close();
 }
}
const scopes=new WeakMap();
function scopeFor(worker){let scope=scopes.get(worker);if(!scope){scope={closed:false,active:new Set(),retained:new Set(),reason:undefined};scopes.set(worker,scope);}return scope;}
// The existing inline runner registers its original Source Run BEFORE posting
// source to its actual compiler Worker. This private live object remains in the
// renderer realm; serialized worker fields never create a source enrollment.
export function registerRetainedCompilerRun(worker,source,filename,sourceFiles,expectedBinding){
 if(!worker||typeof worker.postMessage!=='function'||typeof source!=='string'||typeof filename!=='string')
  throw new TypeError('Actual compiler Worker and original source input required');
 const scope=scopeFor(worker);
 if(scope.closed||scope.input||scope.active.size)throw new TypeError('Compiler source Run is already owned or closed');
 const input=Object.freeze({source,filename,sourceFiles:sourceFiles?.map(file=>Object.freeze({...file}))});
 scope.input=input;scope.expectedBinding=expectedBinding;scope.runFinished=false;
 let closed=false;
 const registration=Object.freeze({close(){
  if(closed)return;
  if(scope.active.size||scope.retained.size)throw new TypeError('Cannot close source Run before actual retained ownership closes');
  closed=true;if(scope.input===input){scope.input=null;scope.expectedBinding=undefined;scope.registration=null;}
 },finish(){
  if(closed)return;
  // The Worker may make several retained requests before its whole Run reply.
  // Release source only after that transaction AND all retained owners settle.
  scope.runFinished=true;
  if(!scope.active.size&&!scope.retained.size)registration.close();
 }});
 scope.registration=registration;return registration;
}
// A trusted renderer-realm owner, never a serialized ticket or a new World.
export function retainedPresentationFor(worker){
 const scope=scopes.get(worker);
 if(!scope||scope.closed||!scope.retained.size)return null;
 const current=[...scope.retained];
 return Object.freeze({get frameCompletion(){return current.filter(entry=>!entry.closed).flatMap(entry=>entry.frameCompletion??[]);},close:async()=>{
   const results=await Promise.allSettled(current.map(entry=>entry.close()));
   const errors=results.filter(result=>result.status==='rejected').map(result=>result.reason);
   if(errors.length)throw new AggregateError(errors,'Retained World close failed');
 }});
}
export async function closeRetainedPresentations(worker){
 const presentation=retainedPresentationFor(worker);await presentation?.close();
}
// Trusted runner cleanup boundary. A rejected close may mean either refusal
// (owners remain) or an attempted disposal error after invalidation (settled).
export function retainedExecutionsSettled(worker){
 const scope=scopes.get(worker);
 return !scope||(!scope.active.size&&!scope.retained.size);
}
export async function cancelRetainedExecutions(worker,reason=new DOMException('VKF execution cancelled','AbortError')){
 const scope=scopeFor(worker);scope.closed=true;scope.reason=reason;
 for(const execution of scope.active)execution.controller.abort(reason);
 // The real guest export must settle and its real host must finish disposal.
 const results=await Promise.allSettled([...scope.active].map(execution=>execution.completion));
 const retained=await Promise.allSettled([...scope.retained].map(entry=>entry.close()));
 const failures=[...results,...retained].filter(item=>item.status==='rejected').map(item=>item.reason);
 if(failures.length)throw new AggregateError(failures,'Actual retained source cleanup failed');
}
export async function dispatchRetainedExecution(worker,data,options={}){
 if(data?.type==='vkf-cancel-retained-request'){
  const scope=scopes.get(worker);
  for(const execution of [...(scope?.active??[]),...(scope?.retained??[])])if(execution.request===data.request)execution.controller.abort();
  return true;
 }
 if(data?.type!=='vkf-execute-retained')return false;
 const scope=scopeFor(worker);if(scope.closed)return true;
 if(!Number.isSafeInteger(data.request)||data.request<=0||
    [...scope.active].some(execution=>execution.request===data.request))
   throw new TypeError('Invalid or duplicate current retained source request');
 if(data.manifest?.physicsReplay&&(!scope.input||typeof data.compilerSourceBinding!=='string'||
    data.compilerSourceBinding!==data.manifest.physicsReplay.compilerSourceBinding||
    (scope.expectedBinding!==undefined&&scope.expectedBinding!==data.compilerSourceBinding)))
   throw new TypeError('Current registered source/compiler-worker association differs');
 const execution={request:data.request,controller:new AbortController(),completion:null};scope.active.add(execution);
 const ticket=Object.freeze({});
 if(data.manifest?.physicsReplay){
  // Identity comes from this live actual worker/request dispatch, never the
  // serialized request number or manifest alone. The guest cannot call JS.
  physicsTickets.set(ticket,{wasm:data.wasm,manifest:data.manifest,binding:data.compilerSourceBinding,
    sourceOwner:scope.input,closed:false});
 }
 execution.completion=(async()=>{
  let retainedEntry,guestSettled=false;
  try{
   const reportCleanup=error=>{
     options.mountTarget?.dispatchEvent(new CustomEvent('vf-example-render-error',{bubbles:true,detail:{error,message:error.message}}));
     options.onPhysicsError?.(error);
   };
   const closeFromFrame=reason=>{
     const aborted=execution.controller.signal.aborted;
     execution.controller.abort(reason);
     // The successful lifetime's abort listener owns its first close. A later
     // explicit Frame close may retry a previously refused, still-held owner.
     if(aborted&&guestSettled)void retainedEntry?.close().catch(reportCleanup);
   };
   const failFromPhysics=error=>{
     try{reportCleanup(error);}finally{closeFromFrame(error);}
   };
   const retainLifetime=lifetime=>{
     let completion;
     const workerError=event=>failFromPhysics(event.error??new Error(event.message||'VKF compiler worker failed'));
     retainedEntry={request:data.request,controller:execution.controller,get closed(){return lifetime.closed;},
       get frameCompletion(){return lifetime.frameCompletion;},close:()=>{
       const release=()=>{
         scope.retained.delete(retainedEntry);worker.removeEventListener('error',workerError);
         if(scope.runFinished&&!scope.active.size&&!scope.retained.size)scope.registration?.close();
       };
       if(lifetime.closed){release();return Promise.resolve();}
       return completion??=Promise.resolve().then(async()=>{
         try{await lifetime.close();}finally{if(lifetime.closed)release();}
       }).catch(error=>{if(!lifetime.closed)completion=undefined;throw error;});
     }};
     scope.retained.add(retainedEntry);
     worker.addEventListener('error',workerError);
   };
   const result=await executeRetainedInWindow(data.wasm,data.manifest,{...options,signal:execution.controller.signal,
     normalPhysicsTicket:ticket,onFrameClose:closeFromFrame,onPhysicsError:failFromPhysics,onLifetime:retainLifetime});
   guestSettled=true;
   if(result.lifetime){
     execution.controller.signal.addEventListener('abort',()=>{void retainedEntry.close().catch(reportCleanup);},{once:true});
     if(scope.closed||execution.controller.signal.aborted){await retainedEntry.close();throw execution.controller.signal.reason??new Error('Retained source closed');}
   }
   if(!scope.closed)worker.postMessage({type:'vkf-retained-result',request:data.request,status:'ok',memory:result.memory,outputPointer:result.outputPointer,receipt:result.receipt},[result.memory.buffer]);
  }catch(error){
   guestSettled=true;
   // execute's finally already tried cleanup on guest failure. Keep any refused
   // owner reachable; do not immediately retry or consume its only failure.
   if(retainedEntry&&scope.retained.has(retainedEntry)&&!execution.controller.signal.aborted)
     execution.controller.abort(error);
   if(!scope.closed)worker.postMessage({type:'vkf-retained-result',request:data.request,status:'error',message:error.message});
  }
  finally{
   physicsTickets.delete(ticket);scope.active.delete(execution);
   // Also release the listener/entry when a failed or nonphysical guest's own
   // finally completed cleanup, without another target attempt.
   if(retainedEntry?.closed)await retainedEntry.close();
  }
 })();
 await execution.completion;return true;
}
