import {createAdaptiveNativeLabelBatches} from './vf-adaptive-native-labels.mjs';
import {createSharedAreaRenderer} from './vf-shared-area-renderer.mjs';
import {loadCurrentNativeTypography} from './vf-current-native-provider.mjs';

const need = (ok, message) => { if (!ok) throw new Error(message); };
const affine = m => Array.isArray(m) && m.length === 6 && m.every(Number.isFinite);
const compose = (a,b) => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],
  a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];

/** Application entry for live native labels. The application owns the native
 * engine/transport; this module never parses or typesets a formula in JS.
 * Byte-pinned seed layouts are reusable work, not the set of allowed sources:
 * every miss enters typeset(run, identity), then the existing provider checks
 * the returned source, engine/resources, diagnostics and physical font mapping.
 * A different engine/resource context requires a new installation/bundle.
 */
export async function installCurrentNativeLabelEngine({VfDisplay=globalThis.VfDisplay,
  bundle,typeset,fetch:fetcher=globalThis.fetch,renderingPolicy='required',rendererFactory=createSharedAreaRenderer}={}) {
  need(typeof typeset==='function','NATIVE_LABEL_LIVE_ENGINE_REQUIRED');
  const typography=await loadCurrentNativeTypography({files:bundle?.files,identity:bundle?.identity,fetch:fetcher,typeset});
  let uninstall;
  try{uninstall=installCurrentNativeLabels({VfDisplay,typography,renderingPolicy,rendererFactory});}
  catch(error){typography.close();throw error;}
  let closing;
  return Object.freeze({typography,
    close(){if(!closing)closing=(async()=>{await uninstall();await VfDisplay.joinNativeLabelCleanup?.();typography.close();return {joined:true};})();return closing;}
  });
}

/** Install into VfDisplay's ordinary text-overlay lifecycle. No new page,
 * synthetic retained packet, layout implementation or independent demo host.
 * Required accuracy is the default. Existing adaptive instancing can be
 * observed explicitly as an UNQUALIFIED candidate; it inherits no PASS.
 */
export function installCurrentNativeLabels({VfDisplay = globalThis.VfDisplay, typography,
  renderingPolicy = 'required', rendererFactory = createSharedAreaRenderer} = {}) {
  need(typeof VfDisplay?.setNativeLabelRendererFactory === 'function' && typography?.prepare, 'NATIVE_LABEL_DISPLAY_BRIDGE');
  need(['required', 'adaptive-candidate'].includes(renderingPolicy), 'NATIVE_LABEL_RENDERING_POLICY');
  const factory = ({container}) => {
    const canvas = container.ownerDocument.createElement('canvas');
    canvas.className = 'vf-native-label-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    container.appendChild(canvas);
    const renderer = rendererFactory(canvas, {pixelRatio: () => globalThis.devicePixelRatio || 1,
      nativeAccuracy: renderingPolicy === 'required' ? 'required' : 'diagnostic-uncertified', samplesPerAxis: 4});
    let closed = false, scene = null, census = null, signature = null, width = 0, height = 0, tail = Promise.resolve();
    let state = {status: 'PENDING', renderingPolicy, releaseQualified: false};
    let viewCamera = [1,0,0,1,0,0], frameTransform = [1,0,0,1,0,0];
    const initialized = Promise.resolve().then(() => renderer.initialize());
    initialized.catch(() => {});
    function update({specs, camera, width: w, height: h}) {
      const inputAt = performance.now();
      need(!closed, 'NATIVE_LABEL_LAYER_CLOSED');
      need(Array.isArray(camera) && camera.length === 6 && camera.every(Number.isFinite), 'NATIVE_LABEL_AFFINE_CAMERA');
      need(Array.isArray(specs) && specs.length <= 10000, 'NATIVE_LABEL_SPECS');
      // Snapshot at input time, including edits made in-place by the app.
      // Only actual camera changes can reuse a layout/instance population.
      const key = JSON.stringify(specs), snapshot = JSON.parse(key), nextCamera = [...camera];
      state = {...state, status: 'PENDING', inputAt};
      const job = tail.then(async () => {
        await initialized; if (closed) return {status: 'DISPOSED'};
        let next = scene;
        if (key !== signature) {
          next = await createAdaptiveNativeLabelBatches({typography, specs: snapshot,
            coordinates: {worldToScreen: ([x, y]) => [nextCamera[0]*x + nextCamera[2]*y + nextCamera[4], nextCamera[1]*x + nextCamera[3]*y + nextCamera[5]]}});
          if (closed) { next.close(); return {status: 'DISPOSED'}; }
        }
        try {
          if (width !== w || height !== h) { renderer.resize(w, h); width = w; height = h; }
          if (next !== scene) renderer.setNativeScene(next, compose(nextCamera,frameTransform));
          else renderer.setNativeCamera(compose(nextCamera,frameTransform));
        } catch (error) { if (next !== scene) next.close(); throw error; }
        if (next !== scene) { scene?.close(); scene = next; signature = key; census = scene.receipt(); }
        viewCamera = nextCamera;
        state = {status: 'SUBMITTED_COMPLETION_UNMEASURED', renderingPolicy, releaseQualified: false,
          inputAt, cpuThroughSubmitMs: performance.now() - inputAt, census: {...census, last: scene.statistics()}, renderer: renderer.nativeStatistics(),
          engineIdentity: typography.engineIdentity, resourceIdentity: typography.resourceIdentity};
        canvas.dataset.vfNativeLabelState = state.status;
        return state;
      });
      tail = job.catch(error => {
        state = {status: 'FAILED', renderingPolicy, releaseQualified: false, error: String(error.stack || error)};
        canvas.dataset.vfNativeLabelState = 'FAILED'; canvas.style.visibility = 'hidden';
      });
      job.then(() => { if (!closed && state.status !== 'FAILED') canvas.style.visibility = ''; }, () => {});
      return job;
    }
    // Explicit view command operates on the immutable accepted scene. Content
    // mutations still enter update(), snapshot and validate every source/spec.
    // This path cannot accept a replacement spec, layout or resource identity.
    function updateView({camera, width: w = width, height: h = height}) {
      const inputAt = performance.now();
      need(!closed && scene, 'NATIVE_LABEL_RESIDENT_SCENE_REQUIRED');
      need(Array.isArray(camera) && camera.length === 6 && camera.every(Number.isFinite), 'NATIVE_LABEL_AFFINE_CAMERA');
      const nextCamera = [...camera];
      const job = tail.then(() => {
        need(!closed && scene, 'NATIVE_LABEL_LAYER_CLOSED');
        if (w !== width || h !== height) { renderer.resize(w, h); width = w; height = h; }
        renderer.setNativeCamera(compose(nextCamera,frameTransform));
        viewCamera = nextCamera;
        state = {status:'SUBMITTED_COMPLETION_UNMEASURED', renderingPolicy, releaseQualified:false,
          inputAt, cpuThroughSubmitMs:performance.now()-inputAt, census:{...census,last:scene.statistics()},
          renderer:renderer.nativeStatistics(),engineIdentity:typography.engineIdentity,resourceIdentity:typography.resourceIdentity};
        canvas.dataset.vfNativeLabelState = state.status;
        canvas.style.visibility = '';
        return state;
      });
      tail = job.catch(error => {
        state = {status:'FAILED',renderingPolicy,releaseQualified:false,error:String(error.stack || error)};
        canvas.dataset.vfNativeLabelState = 'FAILED'; canvas.style.visibility = 'hidden';
      });
      return job;
    }
    function residentCommand(updateKind, action) {
      const inputAt = performance.now();
      need(!closed && scene, 'NATIVE_LABEL_RESIDENT_SCENE_REQUIRED');
      const job = tail.then(() => {
        need(!closed && scene, 'NATIVE_LABEL_LAYER_CLOSED'); action();
        state = {status:'SUBMITTED_COMPLETION_UNMEASURED',updateKind,renderingPolicy,releaseQualified:false,
          inputAt,cpuThroughSubmitMs:performance.now()-inputAt,census:{...census,last:scene.statistics()},
          renderer:renderer.nativeStatistics(),engineIdentity:typography.engineIdentity,resourceIdentity:typography.resourceIdentity,
          frameTransform:[...frameTransform],viewCamera:[...viewCamera]};
        canvas.dataset.vfNativeLabelState = state.status; canvas.style.visibility = ''; return state;
      });
      tail = job.catch(error => {
        state = {status:'FAILED',renderingPolicy,releaseQualified:false,error:String(error.stack || error)};
        canvas.dataset.vfNativeLabelState = 'FAILED'; canvas.style.visibility = 'hidden';
      });
      return job;
    }
    function updateAnimation(transform) {
      need(affine(transform), 'NATIVE_LABEL_EVALUATED_FRAME_TRANSFORM'); const next = [...transform];
      // Renderer consumes six already-evaluated values; it does not evaluate
      // an animation expression or replace VKF source with a host program.
      return residentCommand('evaluated-affine-animation-frame', () => {
        renderer.setNativeCamera(compose(viewCamera,next)); frameTransform = next;
      });
    }
    function updateColor(color) {
      need(Array.isArray(color)&&color.length===4&&color.every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&color[3]===1,'NATIVE_LABEL_OPAQUE_COLOR');
      const next = [...color];
      return residentCommand('opaque-color', () => renderer.setNativeColor(next));
    }
    return {update, updateView, updateAnimation, updateColor, statistics: () => state, canvas, renderer,
      destroy() {
        if (closed) return tail; closed = true;
        renderer.destroy(); scene?.close(); scene = null; canvas.remove();
        // An in-flight prepare owns its lease until it observes closed.
        return tail;
      },
      get ready() { return tail; }
    };
  };
  VfDisplay.setNativeLabelRendererFactory(factory);
  return () => VfDisplay.setNativeLabelRendererFactory(null);
}
