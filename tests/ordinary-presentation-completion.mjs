// UNRUN by SOURCE. Controlled completion/error/cancel of maintained ordinary UI
// functions, with DOM/device boundaries supplied below. No real geometry is
// rendered: these controls cannot qualify browser/native/fullscene/GPU output.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {mountRetainedSceneResult} from '../public/preview/0.7.5/inline-retained-scene-view.mjs';

class DetailEvent extends Event {
  constructor(type, options = {}) { super(type, options); this.detail = options.detail; }
}
globalThis.CustomEvent ??= DetailEvent;
class Element extends EventTarget {
  dataset = {}; style = {}; children = []; isConnected = true;
  classList = {add() {}};
  setAttribute() {}
  append(child) { this.children.push(child); }
  remove() { this.isConnected = false; this.removed = true; }
}
const roots = new Map();
const document = {currentScript:null, body:{getAttribute() {return null;}},
  createElement() {return new Element();}, addEventListener() {},
  querySelector(selector) {return roots.get(selector.match(/data-vf-frame-id="([^"]+)"/)?.[1]) ?? null;}};
const sandbox = {document, console:{log() {},warn() {},error() {}}, performance,
  AbortController, setTimeout() {return 0;}, clearTimeout() {},
  requestAnimationFrame() {return 0;}, cancelAnimationFrame() {},
  addEventListener() {}, removeEventListener() {}, VfRuntimeShell:{}};
sandbox.window = sandbox;
const context = vm.createContext(sandbox);
for (const file of ['geom/vf-geom-wgpu.js','vf-display.js']) {
  vm.runInContext(await readFile(new URL('../public/preview/0.7.5/vf-ui/'+file, import.meta.url),'utf8'), context, {filename:file});
}
const display = sandbox.VfDisplay.__test;
const submit = sandbox.VfGeomWgpuUtil.__test.markSubmittedGpuWork;
const controlled = () => {
  let resolve,reject;
  const promise = new Promise((a,b) => {resolve=a;reject=b;});
  return {promise,resolve,reject};
};
const flush = async () => {for (let i=0;i<12;i++) await Promise.resolve();};
const snapshot = {camera:null,axis3d:{},axes:[]};
const record = (serial=1, view=snapshot) => ({camera:null,view:{serial,snapshot:view}});
const original = new Error('CONTROLLED_ORDINARY_FRAME_FAILURE');

function mount({count=1, synchronousError=false} = {}) {
  const container = new Element(), raf = new Map(), entries = [], disposed = [];
  let nextRaf=0, calls=0;
  const packets = Array.from({length:count}, (_,i) => ({
    schema:'vektor-flow/retained-scene-arena',version:1,arena:new Uint8Array(),
    metadata:{schema:'vektor-flow/retained-scene-arena',version:1,
      scene:{frame:'control-'+i,toolbar:false}},
  }));
  const api = {
    renderRetainedSceneArena(packet, options) {
      calls++;
      if (synchronousError) throw original;
      const id=packet.metadata.scene.frame, completion=controlled();
      const renderer=Object.assign(Object.create(sandbox.VfGeomWgpu.prototype), {
        _running:true, _device:{queue:{onSubmittedWorkDone:() => completion.promise}},
        _markPresentedFirstFrame() {}, _renderContent() {throw original;},
      });
      const rec=display.frameViewRecord(id), entry={renderer};
      rec.entries.push(entry); display.observeFrameViewRenderer(id,rec,entry);
      display.watchFrameViewPresentation(rec,1,JSON.stringify(snapshot),options);
      entries.push({id,rec,entry,renderer,completion,options});
    },
    disposeGeomFrame(id) {disposed.push(id);},
  };
  const dispose=mountRetainedSceneResult(container,packets,{document,VfDisplay:api,
    VfFrame:{mount(layer,{id}) {
      const frame={root:new Element(),body:new Element()};
      roots.set(id,frame.root); layer.append(frame.root); return frame;
    }},
    requestAnimationFrame(callback) {raf.set(++nextRaf,callback);return nextRaf;},
    cancelAnimationFrame(id) {raf.delete(id);},
  });
  let settled=false,result;
  const outcome=dispose.presented.then(value => {settled=true;result={value};},error => {settled=true;result={error};});
  const layer=container.children[0];
  const run=() => {for (const [id,callback] of [...raf]) {raf.delete(id);callback(0);}};
  const detached=() => entries.every(({rec}) => rec.viewListeners.length===0 && rec.viewErrorListeners.length===0);
  return {container,layer,entries,disposed,dispose,outcome,run,detached,
    get calls() {return calls;}, get settled() {return settled;}, get result() {return result;}};
}

const failed=mount({count:2}); failed.run();
assert.equal(typeof failed.entries[0].options.onPresentationError,'function','ordinary mount must register failure, not only success');
assert.equal(failed.settled,false,'no acknowledgement before actual completion');
failed.entries[0].renderer._frame(0); // real queued-RAF exception route
await flush();
assert.equal(failed.result?.error,original,'original Error must reach ordinary await');
assert.equal(failed.layer.dataset.vfRenderState,'failed');
assert.equal(failed.disposed.length,2); assert.equal(failed.detached(),true,'sibling waits detach on abort');
assert.equal(failed.entries[1].options.signal.reason,original,'sibling cancellation retains the original failure');
failed.entries[0].renderer._onFramePresentationError(new Error('late'));
assert.equal(failed.disposed.length,2); failed.dispose(); assert.equal(failed.disposed.length,2);

const rejected=mount(); rejected.run();
submit(rejected.entries[0].renderer,record());
assert.equal(rejected.settled,false);
rejected.entries[0].completion.reject(original); await flush();
assert.equal(rejected.result?.error,original); assert.equal(rejected.detached(),true);
assert.equal(rejected.entries[0].renderer._gpuWorkPending,false);

const missingFence=mount(); missingFence.run();
delete missingFence.entries[0].renderer._device.queue.onSubmittedWorkDone;
submit(missingFence.entries[0].renderer,record()); await flush();
assert.match(String(missingFence.result?.error),/no GPU completion fence/);
assert.equal(missingFence.detached(),true);

const thrownFence=mount(); thrownFence.run();
thrownFence.entries[0].renderer._device.queue.onSubmittedWorkDone=() => {throw original;};
submit(thrownFence.entries[0].renderer,record()); await flush();
assert.equal(thrownFence.result?.error,original); assert.equal(thrownFence.detached(),true);
assert.equal(thrownFence.entries[0].renderer._gpuWorkPending,false);
assert.equal(thrownFence.entries[0].renderer._device._vfGpuFrameScheduler.pending,false);

const invalidFence=mount(); invalidFence.run();
invalidFence.entries[0].renderer._device.queue.onSubmittedWorkDone=() => undefined;
submit(invalidFence.entries[0].renderer,record()); await flush();
assert.match(String(invalidFence.result?.error),/fence did not return a promise/);
assert.equal(invalidFence.detached(),true);

const success=mount(); success.run();
submit(success.entries[0].renderer,record()); await flush();
assert.equal(success.settled,false,'submit alone never completes ordinary mount');
success.entries[0].completion.resolve(); await flush();
assert.equal(success.result?.value?.[0].endpoint,'gpu-queue-completed');
assert.equal(success.layer.dataset.vfRenderState,'visible'); assert.equal(success.detached(),true);
success.dispose();

const cancelled=mount(); cancelled.run(); cancelled.dispose(); await flush();
assert.equal(cancelled.result?.value,null,'disposed mount is cancellation, never a successful draw');
assert.notEqual(cancelled.layer.dataset.vfRenderState,'visible'); assert.equal(cancelled.detached(),true);

const superseded=mount(); superseded.run();
submit(superseded.entries[0].renderer,record(2,{...snapshot,camera:{pos:[1,2,3]}}));
superseded.entries[0].completion.resolve(); await flush();
assert.match(String(superseded.result?.error),/superseded/); assert.equal(superseded.detached(),true);

const synchronous=mount({synchronousError:true}); synchronous.run(); await flush();
assert.equal(synchronous.result?.error,original,'RAF materialization errors must reject instead of escaping the wait');
assert.equal(synchronous.layer.dataset.vfRenderState,'failed');

const event=mount(); event.run();
event.layer.dispatchEvent(new DetailEvent('vf-inline-render-error',{detail:{error:original}})); await flush();
assert.equal(event.result?.error,original); assert.equal(event.detached(),true);
console.log(JSON.stringify({status:'PASS_CONTROLLED_ORDINARY_COMPLETION_ONLY',originalErrorIdentity:true,
  failureSettled:true,successRequiresCompletedFence:true,cancelIsNotSuccess:true,pendingWaitsDetached:true,
  realBrowserFrame:false,physicalGpu:false,fullsceneQualified:false}));
