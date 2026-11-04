import {mountCurrentPlotToolbar} from './vf-ui/vf-current-plot-toolbar.mjs?sha256=3dd1d261d28757978f170be821cf088e42e580fe3346dda898c368b807b92971';

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
    const error = event.detail?.error ?? new Error(String(event.detail?.message ?? 'Current VKF plot rendering failed'));
    const message = String(error?.message ?? error);
    rejectPresented(error);
    container.dispatchEvent(new CustomEvent('vf-example-render-error',{bubbles:true,detail:{message,error}}));
    dispose(error);
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
    } catch (error) {renderError({detail:{error}});return;}
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
    toolbarCleanup.push(mountCurrentPlotToolbar(frame,scene,{document,VfDisplay,
      animation:{timed:scene.meshes?.some(mesh=>mesh._layer_time) === true,
        get playing(){return animationPlaying;},get rate(){return playbackRate;},toggle(){body.dispatchEvent(new CustomEvent('vf-view-command',{bubbles:true,detail:{command:'play-pause'}}));},
        setRate(rate){root.dispatchEvent(new CustomEvent('vf-view-playback-rate',{bubbles:true,detail:{rate}}));}},
    }));
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
    try {
      for (const packet of ownedPackets) {
        if (disposed) break;
        VfDisplay.renderRetainedSceneArena(packet, {
          signal: presentationAbort.signal,
          afterPresented: record => firstPresented(packet.metadata.scene.frame, record),
          onPresentationError: error => renderError({detail:{error}}),
        });
      }
    } catch (error) { renderError({detail:{error}}); }
  });
  function dispose(reason) {
    if (disposed) return;
    disposed = true;
    layer.removeEventListener("vf-inline-render-error",renderError);
    presentationAbort.abort(reason);
    resolvePresented(null);
    if (presentFrame) cancelAnimationFrame(presentFrame);
    for (const cleanup of toolbarCleanup) cleanup();
    for (const [index, frame] of frames.entries()) {
      VfDisplay.disposeGeomFrame?.(ownedPackets[index].metadata.scene.frame);
      frame?.root?.remove?.();
    }
    viewport.remove?.();
  }
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
