import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the shipping scheduler, renderer and retained owner together.
// Only DOM/RAF are controlled; cancellation also tests an already dequeued RAF.
let nextRaf = 0;
const rafs = new Map(), cancelled = [], errors = [], roots = new Map();
class Element {
  children = []; style = {}; dataset = {}; isConnected = true;
  className = ''; attrs = {}; textContent = ''; innerHTML = '';
  classList = {contains: () => false, add() {}, remove() {}};
  appendChild(child) { child.parentNode = child.parentElement = this; this.children.push(child); return child; }
  contains(child) { return child === this || this.children.some(c => c.contains(child)); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  querySelector(selector) { return selector === '.vf-frame__body' ? this.body ?? null : null; }
  querySelectorAll(selector) {
    return this.children.flatMap(c => [...(selector === '.' + c.className ? [c] : []), ...c.querySelectorAll(selector)]);
  }
  getBoundingClientRect() { return {left:0,top:0,width:400,height:240}; }
  remove() { this.isConnected = false; }
}
const document = {currentScript:null, body:new Element(), addEventListener() {},
  createElement: () => new Element(),
  querySelector: s => roots.get(s.match(/data-vf-frame-id="([^"]+)"/)?.[1]) ?? null};
const sandbox = {document, Element, performance, console:{log() {},warn() {},error: s => errors.push(s)},
  requestAnimationFrame(fn) { rafs.set(++nextRaf, fn); return nextRaf; },
  cancelAnimationFrame(id) { cancelled.push(id); rafs.delete(id); },
  setTimeout() {return 0;}, clearTimeout() {}, addEventListener() {}, removeEventListener() {}, VfRuntimeShell:{}};
sandbox.window = sandbox;
// Expose existing internals in this test context without modifying product APIs.
let source = fs.readFileSync(new URL('../public/preview/0.7.5/vf-ui/vf-display.js', import.meta.url),'utf8');
source = source.replace('frameViewRecord: frameViewRecord,',
  'scheduleGeomTextOverlayRender: scheduleGeomTextOverlayRender, frameViewRecord: frameViewRecord,');
vm.runInNewContext(source, sandbox, {filename:'vf-display.js'});
const display = sandbox.VfDisplay, test = display.__test;
function frame(id) {
  const root = new Element(), body = new Element(); root.body = body;
  root.attrs['data-vf-frame-id'] = id; root.appendChild(body); roots.set(id, root);
  return {root,body};
}
function owner(frame, text) {
  const api = display.createRetainedFrameSceneV1(frame), scene = api.snapshot().scene;
  scene.texts = [{text,x:20,y:30,pixel:true,color:[0,0,0,1]}];
  return {api,scene};
}
function queue(id, frame, scene) {
  test.scheduleGeomTextOverlayRender(id, frame.root, scene);
  const rec = test.frameViewRecord(id), idRaf = rec.textOverlayRaf;
  return {rec,id:idRaf,callback:rafs.get(idRaf)};
}
function run(job) { rafs.delete(job.id); job.callback(); }

const firstFrame = frame('retained-overlay'), first = owner(firstFrame, 'first label');
const live = queue('retained-overlay', firstFrame, first.scene); run(live);
assert.equal(errors.length,0, errors.join('\n'));
assert.equal(live.rec.textOverlayPool[0].textContent,'first label','valid owner renders its real label');
const stale = queue('retained-overlay', firstFrame, first.scene);
first.api.dispose(); first.api.dispose();
assert.throws(() => first.scene.camera, /foreign or disposed/, 'strict disposed proxy guard remains');
assert.throws(() => first.api.snapshot(), /foreign or disposed/);
stale.callback();
assert.equal(errors.length,0,errors.join('\n'));
assert.equal(cancelled.includes(stale.id),true,'owner disposal cancels its queued overlay');
assert.equal(stale.rec.pendingTextGeomSpec,null,'disposed proxy is released');
assert.equal(stale.rec.pendingTextFrameEl,null,'disposed frame is released');

const replacement = owner(firstFrame,'replacement label');
const current = queue('retained-overlay',firstFrame,replacement.scene);
// A callback which was already dequeued before cancellation must neither read
// the old proxy nor reset/consume the replacement owner's queued RAF.
stale.callback();
assert.equal(current.rec.textOverlayRaf,current.id);
run(current);
assert.equal(errors.length,0,errors.join('\n'));
assert.equal(current.rec.textOverlayPool[0].textContent,'replacement label');
assert.equal(current.rec.textOverlayPool[0].style.display,'');

const otherFrame = frame('other-owner'), other = owner(otherFrame,'other label');
assert.equal(replacement.api.owns(other.scene),false,'foreign objects remain foreign');
const detached = queue('retained-overlay',firstFrame,replacement.scene);
roots.delete('retained-overlay'); firstFrame.root.isConnected = false;
run(detached);
assert.equal(errors.length,0,'detached owner never reaches a guarded camera');
replacement.api.dispose(); other.api.dispose();
await display.joinNativeLabelCleanup();
assert.equal(rafs.size,0);
console.log(JSON.stringify({status:'PASS_RETAINED_OVERLAY_LIFECYCLE',validLabels:true,
  cancelledAndReleased:true,dequeuedStaleCallbackInert:true,replacementOwnerLabels:true,
  detachedOwnerInert:true,strictDisposedForeignGuards:true,disposeIdempotent:true}));
