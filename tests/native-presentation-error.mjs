// Deterministic error-path control of maintained functions. UNRUN by SOURCE.
// No GPU/device/window/render qualification: only the completion promise is controlled.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const ui = new URL('../public/preview/0.7.5/vf-ui/', import.meta.url);
const owner = {isConnected:true};
const sandbox = {console:{log(){},warn(){},error(){}},performance,AbortController,
  setTimeout(){return 0;},clearTimeout(){},requestAnimationFrame(){return 0;},cancelAnimationFrame(){},
  addEventListener(){},removeEventListener(){},VfRuntimeShell:{},
  document:{currentScript:null,addEventListener(){},body:{getAttribute(){return null;}},querySelector(selector){
    return selector.startsWith('.vf-frame[') ? owner : null;
  }}};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
for (const path of ['geom/vf-geom-wgpu.js','vf-display.js'])
  vm.runInContext(await readFile(new URL(path,ui),'utf8'),context,{filename:path});
const display = sandbox.VfDisplay.__test;
const submit = sandbox.VfGeomWgpuUtil.__test.markSubmittedGpuWork;
const controlled = () => {let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function frame(id) {
  const completion=controlled();
  const renderer={_device:{queue:{onSubmittedWorkDone:()=>completion.promise}},_markPresentedFirstFrame(){},requestFrame(){}};
  const rec=display.frameViewRecord(id),entry={renderer};rec.entries.push(entry);
  display.observeFrameViewRenderer(id,rec,entry);
  return {id,rec,entry,renderer,completion};
}
function wait(rec,options={}) {
  let settled=false,callbacks=0;
  const promise=new Promise((resolve,reject)=>display.watchFrameViewPresentation(rec,1,'original-view',{
    physicsGeneration:8,...options,afterPresented:value=>{settled=true;callbacks++;resolve(value);},
    onPresentationError:error=>{settled=true;callbacks++;reject(error);}
  }));
  // Observe rejection immediately so this control cannot manufacture an unhandled rejection.
  const outcome=promise.then(value=>({value}),error=>({error}));
  return {outcome,get settled(){return settled;},get callbacks(){return callbacks;}};
}
const record=(serial,generation)=>({camera:{pos:[serial,0,4]},view:{serial,snapshot:{physicsGeneration:generation}},endpoint:'gpu-queue-completed'});
const broken=frame('broken'),a=wait(broken.rec),b=wait(broken.rec);
submit(broken.renderer,record(1,8));
assert.equal(a.settled,false,'no success before completion');
const original=new Error('CONTROLLED_ORIGINAL_GPU_COMPLETION_FAILURE');
broken.completion.reject(original);
assert.equal((await a.outcome).error,original);assert.equal((await b.outcome).error,original);
assert.equal(a.callbacks,1);assert.equal(b.callbacks,1);
assert.equal(broken.rec.viewListeners.length,0);assert.equal(broken.rec.viewErrorListeners.length,0);
assert.equal(broken.renderer._gpuWorkPending,false);assert.equal(broken.renderer._device._vfGpuFrameScheduler.pending,false);
// Repeated error delivery cannot settle a detached request twice.
broken.renderer._onFramePresentationError(original);assert.equal(a.callbacks,1);
const camera=frame('camera'),same=wait(camera.rec);
submit(camera.renderer,record(2,8));assert.equal(same.settled,false);
camera.completion.resolve();const presented=(await same.outcome).value;
assert.equal(presented.serial,2);assert.equal(presented.endpoint,'gpu-queue-completed');
assert.equal(presented.snapshot.physicsGeneration,8);assert.equal(camera.rec.viewListeners.length,0);
const newer=frame('newer'),wrong=wait(newer.rec);
submit(newer.renderer,record(2,9));newer.completion.resolve();
assert.match(String((await wrong.outcome).error),/superseded/,'a future generation cannot acknowledge the old tick');
const stale=frame('stale'),staleWait=wait(stale.rec);stale.rec.entries.length=0;
stale.renderer._onFramePresentationError(original);assert.equal(staleWait.settled,false,'removed renderer cannot poison current requests');
// Cancellation rejects an opted-in waiter with the original reason and detaches both listeners.
const abort=new AbortController(),cancelled=wait(stale.rec,{signal:abort.signal});abort.abort(original);
assert.equal((await cancelled.outcome).error,original);
// Clear the deliberately pending stale control through its original live entry.
stale.rec.entries.push(stale.entry);stale.renderer._onFramePresentationError(original);
assert.equal((await staleWait.outcome).error,original);
assert.equal(stale.rec.viewListeners.length,0);assert.equal(stale.rec.viewErrorListeners.length,0);

// Run the ACTUAL raw bootstrap scripts as JS, with controlled asset/host boundaries.
// This checks the real native tick's onPresentationError wiring and once-only close.
const windowSource=process.argv[2];
assert.ok(windowSource,'argv[2] must name matched compiler/native/linux-shared-renderer/shared_window.cpp');
const cpp=await readFile(windowSource,'utf8');
const html=cpp.split('R"HTML(')[1]?.split(')HTML";')[0];assert.ok(html,'actual native bootstrap missing');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(Boolean);
assert.equal(scripts.length,2);
const native=frame('native'),notices=[],counts={publish:0,close:0,dispose:0},events={};
const accepted={generation:7,time_s:.125,principal:[],transform:[]};
const packet={metadata:{scene:{frame:'frame_probe',physics_binding:{source_frame_id:'source'}}},arena:{storage:'compiler-binary',index:0,byte_length:0}};
const nativeSandbox={console,AbortController,Uint8Array,Map,Set,Error,
  isSecureContext:true,navigator:{userAgent:'DETERMINISTIC_CONTROL',gpu:{requestAdapter:async()=>({info:{}})}},
  webkit:{messageHandlers:{vkfNative:{postMessage:text=>notices.push(JSON.parse(text))}}},
  addEventListener(name,callback){events[name]=callback;},
  fetch:async path=>({ok:true,json:async()=>({source_sha256:'control',physics:[{frame:'source',geometry:['body'],accepted}],packets:[packet]}),arrayBuffer:async()=>new ArrayBuffer(0)}),
  VfRuntimeShell:{ensureSceneDependencies:async()=>{},ensureSceneHostStyles(){},ensureShellDom(){},mountLaunchFrames(){}},
  VfNativePhysicsAccepted:{register(){},publish(){counts.publish++;},close(){counts.close++;}},
  VfDisplay:{renderRetainedSceneArena(_packet,options){options.afterPresented({endpoint:'CONTROL_INITIAL_BOUNDARY'});},
    requestGeomFramePresentation(_id,options){display.watchFrameViewPresentation(native.rec,1,'original-view',options);return true;},
    disposeGeomFrame(){counts.dispose++;}}
};
nativeSandbox.window=nativeSandbox;const nativeContext=vm.createContext(nativeSandbox);
vm.runInContext(scripts[0],nativeContext);await vm.runInContext(scripts[1],nativeContext);
assert.equal(nativeSandbox.__vfNativeSharedWindow.phase,'presented');
const tick=nativeSandbox.__vfNativeApplyAccepted([{frame:'source',accepted:{...accepted,generation:8,time_s:.14}}],1);
submit(native.renderer,record(3,8));native.completion.reject(original);await tick;
const state=nativeSandbox.__vfNativeSharedWindow;
assert.equal(state.failure,original);assert.equal(state.closed,true);assert.equal(state.abort.signal.reason,original);
assert.equal(notices.filter(n=>n.type==='fatal').length,1);
assert.equal(notices.find(n=>n.type==='fatal').message,original.message);
assert.equal(notices.filter(n=>n.type==='physics-presented').length,0);
assert.equal(counts.close,1);assert.equal(counts.dispose,1);
assert.equal(native.rec.viewListeners.length,0);assert.equal(native.rec.viewErrorListeners.length,0);
// Late error/pagehide and another invocation cannot close or advance again.
nativeSandbox.nativeFatal(original);events.pagehide();await nativeSandbox.__vfNativeApplyAccepted([],2);
assert.equal(counts.close,1);assert.equal(counts.dispose,1);assert.equal(counts.publish,2);
assert.equal(notices.filter(n=>n.type==='fatal').length,1);
console.log(JSON.stringify({status:'PASS_DETERMINISTIC_PRESENTATION_ERROR_CONTROL_ONLY',originalErrorIdentity:true,pendingWaitsSettled:true,cleanupOnce:true,physicalGpu:false,nativeFrameQualified:false}));
