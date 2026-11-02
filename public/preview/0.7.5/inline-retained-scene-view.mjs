import {mountPlotToolbar} from './vf-ui/vf-plot-toolbar.mjs';
import {createPlotDocking} from './vf-ui/vf-plot-docking.mjs';
import {createSceneMediaCapture,createLayeredCanvasCaptureStream} from './vf-ui/vf-media-capture.mjs';

function retainedPacket(packet) {
  return packet
    && packet.schema === "vektor-flow/retained-scene-arena"
    && packet.version === 1
    && packet.metadata?.schema === "vektor-flow/retained-scene-arena"
    && packet.metadata?.version === 1
    && typeof packet.metadata?.scene?.frame === "string"
    && packet.arena instanceof Uint8Array;
}

let nextRetainedSceneScope = 0;

function scopeFrameReferences(value, frameIds, property = "") {
  if (Array.isArray(value)) {
    return value.map((entry) => scopeFrameReferences(entry, frameIds));
  }
  if (!value || typeof value !== "object") {
    const isFrameReference = property === "frame"
      || property === "frame_id"
      || property.endsWith("_frame_id")
      || property === "frame_ref"
      || property.endsWith("_frame_ref");
    return isFrameReference && typeof value === "string" && frameIds.has(value)
      ? frameIds.get(value)
      : value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, entry]) =>
    [key, scopeFrameReferences(entry, frameIds, key)]));
}

function ownRetainedScenePackets(packets, plotLayers) {
  const scope = `vf-inline-result-${++nextRetainedSceneScope}--`;
  const frameIds = new Map(packets.map((packet) => [
    packet.metadata.scene.frame,
    `${scope}${packet.metadata.scene.frame}`,
  ]));
  return packets.map((packet) => ({
    ...packet,
    metadata: {...scopeFrameReferences(packet.metadata, frameIds),
      scene:{...scopeFrameReferences(packet.metadata.scene, frameIds),...plotLayers,native_plot_text:true}},
  }));
}

// Exact browser options (or scene metadata) axis_visible:false and
// coordinates_visible:false omit optional decorations, preserving domains,
// inverse projection, native navigation and the selected data clip policy.
export function mountRetainedSceneResult(container, packets, {
  axis_visible,
  coordinates_visible,
  document = globalThis.document,
  VfFrame = globalThis.VfFrame,
  VfDisplay = globalThis.VfDisplay,
  requestAnimationFrame = globalThis.requestAnimationFrame ?? ((callback) => { callback(0); return 0; }),
  cancelAnimationFrame = globalThis.cancelAnimationFrame ?? (() => {}),
} = {}) {
  if (!Array.isArray(packets) || packets.length === 0 ||
      !packets.every(retainedPacket)) {
    throw new TypeError("retained scene arena schema is missing or unsupported");
  }
  if (!container || typeof container.append !== "function" ||
      !document || typeof document.createElement !== "function" ||
      !VfFrame || typeof VfFrame.mount !== "function" ||
      !VfDisplay || typeof VfDisplay.renderRetainedSceneArena !== "function") {
    throw new Error("native VfFrame/VfDisplay retained renderer is unavailable");
  }
  const plotLayers=Object.fromEntries(Object.entries({axis_visible,coordinates_visible}).filter(([,value])=>value !== undefined));
  for (const key of Object.keys(plotLayers)) if (typeof plotLayers[key] !== 'boolean') throw new TypeError(key+' requires boolean');
  const ownedPackets = ownRetainedScenePackets(packets,plotLayers);
  container.hidden = false;
  const separateViewports = ownedPackets.length > 1 && ownedPackets.every(packet => {
    const scene=packet.metadata.scene;
    return (scene.container_kind ?? "viewport") === "viewport"
      && (!scene.pos || (scene.pos[0] === 0 && scene.pos[1] === 0))
      && (!scene.size || (scene.size[0] === 1 && scene.size[1] === 1));
  });
  const layer = document.createElement("div");
  layer.className = "readme-example-retained-layer";
  layer.dataset.vfRenderState = "pending";
  if (separateViewports) {
    layer.style.display = "grid";
    layer.style.gridTemplateColumns = "minmax(0,1fr)";
    layer.style.gap = "12px";
  }
  const frames = [];
  const animated = ownedPackets.some(packet=>packet.metadata.scene.meshes?.some(mesh=>mesh._layer_time));
  let animationLast=null, animationElapsed=0, animationPlaying=true, playbackRate=1;
  const showFrame = (frame, visible) => {
    if (!frame?.root) return;
    frame.root.hidden = !visible;
    frame.root.setAttribute?.("aria-hidden", visible ? "false" : "true");
    if (frame.root.style) frame.root.style.display = visible ? "" : "none";
  };
  for (const [index, packet] of ownedPackets.entries()) {
    const scene = packet.metadata.scene;
    const containerKind = scene.container_kind ?? "viewport";
    const isWindow = containerKind === "window";
    const frame = VfFrame.mount(layer, {
      id: scene.frame,
      containerKind,
      title: scene.title ?? "",
      frameless: !isWindow,
      draggable: isWindow,
      dockable: isWindow,
      resizable: isWindow,
      closable: isWindow,
      alpha: 1,
      toolbar: false,
    });
    frame?.body?.classList?.add("vf-frame__body--transparent");
    if (frame?.root?.style && Array.isArray(scene.pos) && scene.pos.length === 2 &&
        Array.isArray(scene.size) && scene.size.length === 2 &&
        [...scene.pos, ...scene.size].every(Number.isFinite)) {
      frame.root.style.left = `${scene.pos[0] * 100}%`;
      frame.root.style.top = `${scene.pos[1] * 100}%`;
      frame.root.style.right = "auto";
      frame.root.style.bottom = "auto";
      frame.root.style.width = `${scene.size[0] * 100}%`;
      frame.root.style.height = `${scene.size[1] * 100}%`;
    }
    if (separateViewports && frame?.root?.style) {
      Object.assign(frame.root.style, {position:"relative", inset:"auto", width:"100%", height:"328px"});
    }
    showFrame(frame,true);
    frames.push(frame);
  }
  const viewport = layer;
  container.append(viewport);
  let disposed = false;
  const presentationAbort = new AbortController();
  let resolvePresented, rejectPresented;
  const presented = new Promise((resolve,reject) => { resolvePresented = resolve; rejectPresented = reject; });
  presented.catch(() => {});
  const renderError = event => {
    if (disposed) return;
    layer.dataset.vfRenderState = 'failed';
    const message = String(event.detail?.message ?? 'Current VKF plot rendering failed');
    rejectPresented(new Error(message));
    container.dispatchEvent(new CustomEvent('vf-example-render-error',{bubbles:true,detail:{message}}));
    dispose();
  };
  layer.addEventListener('vf-inline-render-error',renderError);
  const firstPresentations = new Map();
  const firstPresented = async (frameId, record) => {
    if (disposed || firstPresentations.has(frameId)) return;
    try {
      let ready;
      do {
        ready = VfDisplay.nativeLabelFrameStatus?.(frameId)?.ready;
        await ready;
      } while (!disposed && ready !== VfDisplay.nativeLabelFrameStatus?.(frameId)?.ready);
      if (disposed) return;
      const status = VfDisplay.nativeLabelFrameStatus?.(frameId)?.statistics;
      if (status?.status === 'FAILED') throw new Error(status.error);
    } catch (error) {renderError({detail:{message:error.message}});return;}
    firstPresentations.set(frameId, record);
    if (firstPresentations.size !== ownedPackets.length) return;
    layer.dataset.vfRenderState = "visible";
    layer.dispatchEvent?.(new Event("vf-inline-result-visible"));
    resolvePresented(ownedPackets.map(packet => ({
      frameId: packet.metadata.scene.frame,
      ...firstPresentations.get(packet.metadata.scene.frame),
    })));
    if (animated) presentFrame = requestAnimationFrame(animate);
  };
  let presentFrame = 0;
  const animationStateEvent = () => {
    if (typeof globalThis.CustomEvent === "function") {
      return new globalThis.CustomEvent("vf-view-animation-state", {
        bubbles: true, detail: { animated, playing: animationPlaying },
      });
    }
    const event = new Event("vf-view-animation-state", { bubbles: true });
    Object.defineProperty(event, "detail", {
      value: { animated, playing: animationPlaying }, enumerable: true,
    });
    return event;
  };
  const publishAnimationState = () => frames.forEach((frame) =>
    frame?.root?.dispatchEvent?.(animationStateEvent()));
  const animationCommand = (event) => {
    const command = String(event?.detail?.command ?? "");
    if (command === "play-pause") animationPlaying = !animationPlaying;
    else if (command === "animation-reset") {
      animationElapsed = 0;
      animationLast = null;
      for (const packet of ownedPackets) updateRetainedSceneTime(packet, 0);
      for (const packet of ownedPackets) VfDisplay.renderRetainedSceneArena(packet);
    } else return;
    publishAnimationState();
  };
  const playbackRateChanged = (event) => {
    const next = Number(event?.detail?.rate);
    if (Number.isFinite(next) && next >= -4 && next <= 4) playbackRate = next;
  };
  const toolbarCleanup=[];
  frames.forEach((frame,index)=>{
    const root=frame?.root,body=frame?.body,packet=ownedPackets[index],scene=packet.metadata.scene;
    if (!root || !body) return;
    root.addEventListener("vf-view-command",animationCommand);
    root.addEventListener("vf-view-playback-rate",playbackRateChanged);
    toolbarCleanup.push(()=>{root.removeEventListener("vf-view-command",animationCommand);root.removeEventListener("vf-view-playback-rate",playbackRateChanged);});
    if (scene.toolbar === false) return;
    const dispatch=command=>body.dispatchEvent(new CustomEvent("vf-view-command",{bubbles:true,cancelable:true,detail:{command}}));
    const subscriptions=new Set();
    const historyState=()=>({canBack:body.__vfViewHistory?.canBack?.()===true,canForward:body.__vfViewHistory?.canForward?.()===true});
    // Reuse the existing bounded renderer history, including its restore path.
    // First/last never reset the data domain or create a second history.
    const move=command=>{dispatch(command);return body.__vfViewHistory?.current?.() ?? null;};
    const edge=command=>{let count=0,value=null;while(historyState()[command === 'back' ? 'canBack' : 'canForward']) {
      if (++count>100) throw new Error('PLOT_RENDERER_HISTORY_BOUND');value=move(command);
    }return value;};
    const history={state:historyState,current:()=>body.__vfViewHistory?.current?.() ?? null,
      back:()=>historyState().canBack ? move('back') : null,forward:()=>historyState().canForward ? move('forward') : null,
      first:()=>edge('back'),last:()=>edge('forward'),subscribe(fn){subscriptions.add(fn);return()=>subscriptions.delete(fn);}};
    const historyChanged=()=>{for (const fn of subscriptions) fn(historyState());};
    root.addEventListener('vf-view-history-state',historyChanged);
    toolbarCleanup.push(()=>root.removeEventListener('vf-view-history-state',historyChanged));
    const fid=scene.frame;
    const download=(bytes,type,name)=>{
      const url=URL.createObjectURL(new Blob([bytes],{type})),anchor=document.createElement('a');
      anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),0);
    };
    const media=createSceneMediaCapture({requestStream:()=>createLayeredCanvasCaptureStream({document,
      layers:[()=>VfDisplay.captureGeomFrameCanvas(fid)]})});
    const video={get recording(){return media.recording;},start:()=>media.startMovie(),async stop(){
      const blob=await media.stopMovie();if (!blob) throw new Error('PLOT_VIDEO_CAPTURE_EMPTY');
      download(new Uint8Array(await blob.arrayBuffer()),blob.type,'vektor-flow-view.webm');return blob;
    }};
    const canvasCapture=(scene.meshes || []).length>0 && (scene.meshes || []).every(mesh=>mesh.mode3d === false);
    const capture={formats:canvasCapture ? ['png'] : [],video:canvasCapture && typeof document.defaultView?.MediaRecorder === 'function' ? video : null,
      async frame(){
        const url=await VfDisplay.captureGeomFrameDataUrl(fid);if (!url) throw new Error('PLOT_PNG_CAPTURE_UNAVAILABLE');
        const bytes=new Uint8Array(await(await fetch(url)).arrayBuffer());
        return {formats:['png'],save(format){if(format !== 'png') throw new Error('PLOT_CAPTURE_FORMAT_UNAVAILABLE');return bytes;}};
      },save({format,bytes}){download(bytes,'image/png','vektor-flow-view.'+format);}};
    const originalClass=root.classList.contains('vf-plot-host');
    root.classList.add('vf-plot-host');body.classList.add('vf-plot-frame');
    const phone=document.defaultView?.matchMedia?.('(max-width:480px)');
    const docking=createPlotDocking({position:scene.toolbarPosition ?? (typeof scene.toolbar === 'string' ? scene.toolbar : 'top'),
      inset:scene.inset !== false,phone:phone?.matches === true,onChange:applyDock});
    function applyDock(state) {
      root.dataset.toolbarDock=state.dock;root.dataset.toolbarInset=String(state.inset);
      // Inset chrome overlays the existing complete plot viewport. Only the
      // explicit non-inset option may consume a layout row/column.
      body.style.position=state.inset ? 'absolute' : 'relative';
      body.style.inset=state.inset ? '0' : 'auto';
      VfDisplay.requestGeomFramePresentation?.(fid);
    }
    applyDock(docking.snapshot());
    const timed=scene.meshes?.some(mesh=>mesh._layer_time) === true;
    const toolbar=mountPlotToolbar(root,{history,docking,capture,
      animation:{timed,get playing(){return animationPlaying;},get rate(){return playbackRate;},toggle(){dispatch('play-pause');},
        setRate(rate){root.dispatchEvent(new CustomEvent('vf-view-playback-rate',{bubbles:true,detail:{rate}}));}},
      zoom:factor=>dispatch(factor<1 ? 'zoom-in' : 'zoom-out'),
      onDockPreview:edge=>{if(edge)root.dataset.dockPreview=edge;else delete root.dataset.dockPreview;},
      onError:error=>{root.dispatchEvent(new CustomEvent('vf-plot-toolbar-error',{bubbles:true,detail:{message:error.message}}));}
    });
    const refresh=()=>toolbar.refresh();root.addEventListener('vf-view-animation-state',refresh);
    const appearance=document.defaultView?.matchMedia?.('(prefers-color-scheme:dark)');
    const theme=()=>{const selected=document.documentElement.dataset.theme;toolbar.element.dataset.theme=['light','dark'].includes(selected) ? selected : appearance?.matches ? 'dark' : 'light';};
    theme();appearance?.addEventListener?.('change',theme);const themeObserver=typeof MutationObserver === 'function' ? new MutationObserver(theme) : null;
    themeObserver?.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    const phoneChanged=()=>docking.setPhone(phone.matches);phone?.addEventListener?.('change',phoneChanged);
    toolbarCleanup.push(()=>{root.removeEventListener('vf-view-animation-state',refresh);themeObserver?.disconnect();appearance?.removeEventListener?.('change',theme);phone?.removeEventListener?.('change',phoneChanged);
      media.cancel();void toolbar.close();body.classList.remove('vf-plot-frame');if(!originalClass)root.classList.remove('vf-plot-host');});
  });
  publishAnimationState();
  const animate = (timestamp) => {
    if (disposed) return;
    if (animationLast == null) animationLast = timestamp;
    if (animationPlaying) {
      animationElapsed += Math.max(0, timestamp - animationLast) / 1000 * playbackRate;
    }
    animationLast = timestamp;
    for (const packet of ownedPackets) {
      updateRetainedSceneTime(packet, animationElapsed);
      VfDisplay.renderRetainedSceneArena(packet);
    }
    presentFrame = requestAnimationFrame(animate);
  };
  presentFrame = requestAnimationFrame(() => {
    presentFrame = 0;
    if (disposed) return;
    layer.dataset.vfRenderState = "presenting";
    for (const packet of ownedPackets) {
      VfDisplay.renderRetainedSceneArena(packet, {
        signal: presentationAbort.signal,
        afterPresented: record => firstPresented(packet.metadata.scene.frame, record),
      });
    }
  });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    layer.removeEventListener("vf-inline-render-error",renderError);
    presentationAbort.abort();
    resolvePresented(null);
    if (presentFrame) cancelAnimationFrame(presentFrame);
    for (const cleanup of toolbarCleanup) cleanup();
    for (const [index, frame] of frames.entries()) {
      VfDisplay.disposeGeomFrame?.(ownedPackets[index].metadata.scene.frame);
      frame?.root?.remove?.();
    }
    viewport.remove?.();
  };
  // Scoped actual Frame identities and a real renderer completion endpoint.
  // Null means disposed before first presentation; never a successful draw.
  dispose.presented = presented;
  dispose.frameIds = Object.freeze(ownedPackets.map(packet => packet.metadata.scene.frame));
  dispose.element = frames.length === 1 ? frames[0]?.root ?? viewport : viewport;
  return dispose;
}

function temporalSample(descriptor, elapsed) {
  const coordinates = descriptor?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const start = Number(coordinates[0]);
  const end = Number(coordinates.at(-1));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  let time = start + elapsed;
  const duration = end - start;
  if (descriptor.mode === "repeat") time = start + (((time - start) % duration + duration) % duration);
  else if (descriptor.mode === "mirror") {
    const phase = (((time - start) % (duration * 2) + duration * 2) % (duration * 2)) / duration;
    time = phase <= 1 ? start + phase * duration : end - (phase - 1) * duration;
  } else if (descriptor.mode === "reset" && time >= end) time = start;
  else time = Math.max(start,Math.min(time, end));
  let upper = coordinates.findIndex((coordinate) => Number(coordinate) >= time);
  if (upper <= 0) upper = 1;
  const lower = upper - 1;
  const span = Number(coordinates[upper]) - Number(coordinates[lower]);
  return { lower, upper, alpha: span > 0 ? (time - Number(coordinates[lower])) / span : 0 };
}

export function updateRetainedSceneTime(packet, elapsedSeconds) {
  let changed = false;
  for (const mesh of packet?.metadata?.scene?.meshes ?? []) {
    const descriptor = mesh?._layer_time;
    const sample = temporalSample(descriptor, elapsedSeconds);
    if (!sample || !mesh.vertices || !(packet.arena instanceof Uint8Array)) continue;
    const view = new DataView(packet.arena.buffer,
      packet.arena.byteOffset + mesh.vertices.byte_offset,
      mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT);
    for (const channel of descriptor.channels ?? []) {
      const lower = channel.value?.[sample.lower];
      const upper = channel.value?.[sample.upper];
      if (lower == null || upper == null) continue;
      const values = Array.isArray(lower) ? lower.map((value, index) =>
        Number(value) + (Number(upper[index]) - Number(value)) * sample.alpha) :
        [Number(lower) + (Number(upper) - Number(lower)) * sample.alpha];
      const offset = channel.name === "p" ? 0 : channel.name === "c" ? 6 : -1;
      if (offset >= 0) values.forEach((value, index) =>
        view.setFloat32((offset + index) * 4, value, true));
      if (channel.name === "s") mesh.vertex_size = values[0];
      changed = true;
    }
  }
  return changed;
}
