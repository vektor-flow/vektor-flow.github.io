// Consumed by the EXISTING admitted actual browser job's page.evaluate.
// No browser/server/device launcher. SOURCE must never import/execute this file.
const need = (value, label) => { if (!value) throw Error(label); };
const near = (a, b, tolerance = 1e-8) => Math.abs(a - b) <= tolerance;
const sha = async raw => [...new Uint8Array(await crypto.subtle.digest('SHA-256', raw))]
  .map(v => v.toString(16).padStart(2, '0')).join('');
const bounded = async (promise, ms, label) => {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error(label)), ms);
  })]); } finally { clearTimeout(timer); }
};
const pauseUntil = async deadline => {
  const remaining = deadline - performance.now();
  if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
};

function domainOf(metrics) {
  const axes = metrics.presented.snapshot.axes;
  need(axes.length > 0, 'COMPLETED_AXIS_SNAPSHOT_REQUIRED');
  const first = axes[0].fields;
  const d = [first.x_min, first.x_max, first.y_min, first.y_max];
  for (const axis of axes) need(['x_min', 'x_max', 'y_min', 'y_max']
    .every((k, i) => near(axis.fields[k], d[i])), 'ONE_MATCHED_DATA_DOMAIN');
  return d;
}

function sameDomain(actual, expected) {
  need(actual.length === 4 && actual.every((v, i) => near(v, expected[i])), 'EXACT_CAMERA_DOMAIN');
}

function sameRect(a, b) {
  need(['left', 'right', 'top', 'bottom', 'width', 'height'].every(k => near(a[k], b[k], 0.05)), 'MATCHED_CSS_PLOT_RECTANGLE');
}

// Verify spread using one real point in EVERY occupied 16px cell, not a
// nonblank-canvas/first-visible oracle. Full vertex/index equality is separate.
function visibleGeometry({pixels, width, height, flipY = false}, xy, domain, rect, dpr, radius) {
  need(pixels.length === width * height * 4, 'COMPLETE_CAPTURE_SURFACE');
  const landmarks = new Map();
  for (let i = 0; i < xy.length; i += 2) {
    const px = rect.left + (xy[i] - domain[0]) / (domain[1] - domain[0]) * rect.width;
    const py = rect.bottom - (xy[i + 1] - domain[2]) / (domain[3] - domain[2]) * rect.height;
    if (px <= rect.left + radius || px >= rect.right - radius || py <= rect.top + radius || py >= rect.bottom - radius) continue;
    const key = Math.floor(px / 16) + ':' + Math.floor(py / 16);
    if (!landmarks.has(key)) landmarks.set(key, [px * dpr, py * dpr, i / 2]);
  }
  need(landmarks.size > 0, 'REAL_VISIBLE_LANDMARKS_REQUIRED');
  const blue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    const at = ((flipY ? height - 1 - y : y) * width + x) * 4;
    return pixels[at + 3] > 0 && pixels[at + 2] > pixels[at] + 12 && pixels[at + 2] > pixels[at + 1] + 8;
  };
  let found = 0;
  for (const [x, y] of landmarks.values()) {
    let hit = false;
    for (let dy = -2; dy <= 2 && !hit; dy++) for (let dx = -2; dx <= 2; dx++)
      if (blue(Math.round(x) + dx, Math.round(y) + dy)) { hit = true; break; }
    need(hit, 'VISIBLE_GEOMETRY_LANDMARK_MISSING:' + x + ':' + y);
    found++;
  }
  // No blue source geometry may leak beyond the data clip, including false
  // edge piles produced by the old per-point canvas clamp. Grey axes are OK.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (x < rect.left * dpr - 2 || x > rect.right * dpr + 2 ||
        y < rect.top * dpr - 2 || y > rect.bottom * dpr + 2)
      need(!blue(x, y), 'POINT_GEOMETRY_OUTSIDE_PLOT_CLIP');
  }
  return {occupiedCells: landmarks.size, visibleLandmarks: found, fullCapturePixels: width * height,
    completeness: 'All emitted input vertices/indices separately checked; spatial landmarks and outside-clip pixels checked. Occlusion prevents identifying every duplicate in a raster.'};
}

function completedGL(canvases) {
  const contexts = [];
  for (const canvas of canvases) {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && !contexts.includes(gl)) contexts.push(gl);
  }
  need(contexts.length > 0, 'GENUINE_PEER_GL_CONTEXT_REQUIRED');
  for (const gl of contexts) {
    need(!gl.isContextLost(), 'PEER_CONTEXT_LOST');
    gl.finish();
    need(gl.getError() === gl.NO_ERROR, 'PEER_COMPLETED_GL_ERROR');
  }
  return contexts;
}

function captureGL(gl) {
  const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  need(gl.getError() === gl.NO_ERROR, 'PEER_READBACK_FAILED');
  return {pixels, width, height, flipY: true};
}

// Blob module URLs are opaque bases. Resolve against the actual document's
// origin, never import.meta.url or a possibly overridden document <base>.
export function resolvePlottingRuntimeBase(base = '/preview/0.7.5/') {
  const origin = globalThis.location.origin;
  const resolved = new URL(base, origin + '/');
  need(['http:', 'https:'].includes(resolved.protocol) && resolved.origin === origin,
    'CURRENT_ORIGIN_RUNTIME_REQUIRED');
  need(resolved.pathname.endsWith('/') && !resolved.search && !resolved.hash &&
    !resolved.username && !resolved.password, 'RUNTIME_DIRECTORY_URL_REQUIRED');
  return resolved.href;
}

// Shared by the genuine adapter and the existing-job Blob startup oracle.
export async function importPlottingRuntime(base, name) {
  need(['inline-runner.mjs', 'inline-renderer-loader.mjs', 'inline-retained-scene-view.mjs'].includes(name),
    'MAINTAINED_RUNTIME_MODULE_REQUIRED');
  return import(new URL(name, resolvePlottingRuntimeBase(base)).href);
}

async function vkfAdapter(host, request, source, xy, base) {
  const release = await fetch(base + 'current-compiler-release.json', {cache: 'no-store'}).then(r => r.json());
  need(release.browser_binding === request.currentBinding, 'ACTUAL_CURRENT_COMPILER_BINDING_REQUIRED');
  const {createInlineRunner} = await importPlottingRuntime(base, 'inline-runner.mjs');
  const runner = createInlineRunner({moduleURL: base + release.package.module.replace(/^\.\//, ''),
    wasmUrl: base + release.package.wasm.replace(/^\.\//, ''), dataURL: base + release.package.data.replace(/^\.\//, ''),
    expectedSourceBinding: release.browser_binding, timeoutMs: 180000});
  let dispose;
  try {
    const compileAt = performance.now();
    const result = await runner.run(source, {guestArenaBytes: 1024 * 1024 * 1024});
    const packetAt = performance.now();
    need(result.sourceBinding === release.browser_binding && result.packets?.length === 1, 'GENUINE_CURRENT_COMPILE_ONE_PLOT');
    const packet = result.packets[0];
    need(packet.metadata.scene.meshes.length === 1, 'COMPLETE_SINGLE_POINT_POPULATION');
    const mesh = packet.metadata.scene.meshes[0];
    need(mesh.topology === 'point-list' && mesh.marker_space === 'pixel' && mesh.render_mode === 'marker_impostor', 'GENUINE_POINT_API_NOT_LINE_OR_FAKE');
    const ref = (r, storage, Type) => {
      need(r.storage === storage && r.byte_offset >= 0 && r.byte_offset + r.length * 4 <= packet.arena.byteLength, 'NATIVE_ARENA_REFERENCE');
      return new Type(packet.arena.buffer, packet.arena.byteOffset + r.byte_offset, r.length);
    };
    const vertices = ref(mesh.vertices, 'float32', Float32Array);
    const indices = ref(mesh.indices, 'uint32', Uint32Array);
    const count = xy.length / 2;
    need(vertices.length === count * 10 && indices.length === count, 'ENTIRE_REAL_POPULATION_OUTPUT');
    const bounds = [Infinity, -Infinity, Infinity, -Infinity];
    for (let i = 0; i < count; i++) {
      need(indices[i] === i, 'COMPLETE_ORDERED_INDEX:' + i);
      need(vertices[10 * i] === xy[2 * i] && vertices[10 * i + 1] === xy[2 * i + 1] && vertices[10 * i + 2] === 0,
        'INDEPENDENT_REAL_DATA_POSITION:' + i);
      for (let c = 0; c < 4; c++) need(near(vertices[10 * i + 6 + c], request.quality.rgba[c] / 255, 1e-6), 'FULL_POINT_RGBA:' + i);
      bounds[0] = Math.min(bounds[0], vertices[10 * i]); bounds[1] = Math.max(bounds[1], vertices[10 * i]);
      bounds[2] = Math.min(bounds[2], vertices[10 * i + 1]); bounds[3] = Math.max(bounds[3], vertices[10 * i + 1]);
    }
    sameDomain(bounds, request.dataset.bounds);
    need(near(mesh.vertex_size, request.quality.radiusCssPx, 1e-5), 'SAME_PIXEL_RADIUS');
    const {ensureInlineRenderer} = await importPlottingRuntime(base, 'inline-renderer-loader.mjs');
    await ensureInlineRenderer();
    const api = globalThis.VfDisplay;
    need(typeof api.updateGeomFrameDomains === 'function' && typeof api.getGeomFramePlotMetrics === 'function',
      'UNRUN_NORMAL_INTEGRATION_GAP:apply_reviewed_retained-domains-and-point-clip.patch_in_next_admitted_scope');
    const {mountRetainedSceneResult} = await importPlottingRuntime(base, 'inline-retained-scene-view.mjs');
    dispose = mountRetainedSceneResult(host, result.packets);
    await bounded(dispose.presented, 30000, 'NORMAL_COMPLETE_INITIAL_PRESENTATION');
    const frameId = dispose.frameIds[0];
    const root = host.querySelector('[data-vf-frame-id]');
    need(root && dispose.frameIds.length === 1, 'ACTUAL_MOUNTED_FRAME');
    // Normal embedding dimensions; preserve the mounted current frame/toolbar.
    root.style.height = request.viewport.height + 'px';
    root.style.width = request.viewport.width + 'px';
    const labels = async () => {
      let ready;
      do { ready = api.nativeLabelFrameStatus(frameId)?.ready; await ready; }
      while (ready !== api.nativeLabelFrameStatus(frameId)?.ready);
      need(api.nativeLabelFrameStatus(frameId)?.statistics?.status !== 'FAILED', 'COMPLETE_NATIVE_AXES_LABELS');
    };
    const update = async domain => {
      const before = api.getGeomFramePresentedView(frameId)?.serial ?? 0;
      const abort = new AbortController();
      try {
        const record = await bounded(new Promise((resolve, reject) => {
          if (!api.updateGeomFrameDomains(frameId, domain, {signal: abort.signal, afterPresented: resolve})) reject(Error('NORMAL_DOMAIN_UPDATE_REFUSED'));
        }), 7000, 'NORMAL_FULL_RENDER_TIMEOUT');
        need(record.serial > before && ['gpu-queue-completed', 'canvas-command-completed'].includes(record.endpoint), 'COMPLETED_ALL_RENDER_ENTRIES');
        await labels();
        const metrics = api.getGeomFramePlotMetrics(frameId);
        need(metrics, 'ACTUAL_PLOT_METRICS');
        sameDomain(domainOf(metrics), domain);
        const status = api.geomFrameStatus(frameId);
        need(!status.initFailures.length && !status.runtimeFailures.length && !status.viewTransitionActive, 'COMPLETE_VKF_RENDER_NO_FAILURE');
        return {endpoint: record.endpoint + '+native-labels-ready', serial: record.serial, metrics, population: indices.length};
      } finally { abort.abort(); }
    };
    await update(request.dataset.bounds);
    // Invalid public updates must leave the real completed view untouched.
    const beforeInvalid = JSON.stringify(api.getGeomFramePresentedView(frameId));
    need(api.updateGeomFrameDomains(frameId, [1, 0, 0, 1]) === false, 'INVALID_DOMAIN_REFUSAL');
    need(JSON.stringify(api.getGeomFramePresentedView(frameId)) === beforeInvalid, 'INVALID_DOMAIN_NO_PARTIAL_MUTATION');
    return {
      setup: {compileAndGuestMs: packetAt - compileAt, compilerTiming: result.timing,
        transferMs:null, transferBoundary:'Normal runner returns compile/guest/packet profile together; no invented split',
        throughResourceInitAndFirstCompleteMs: performance.now() - compileAt, count, bounds, binding: result.sourceBinding},
      update,
      async capture() {
        await labels();
        const canvas = api.captureGeomFrameCanvas(frameId);
        need(canvas, 'GENUINE_COMPLETE_2D_CAPTURE');
        return {pixels: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height};
      },
      checkPopulation() { need(indices.length === count && vertices.length === count * 10, 'VKF_FULL_RESIDENT_POPULATION'); return count; },
      async close() { dispose(); await runner.dispose(); },
    };
  } catch (error) { dispose?.(); await runner.dispose(); throw error; }
}

async function plotlyAdapter(host, request, xy, firstMetrics) {
  const Plotly = globalThis.Plotly;
  need(Plotly?.version === request.peerBuilds.plotly.version, 'PINNED_PLOTLY_BUILD');
  const x = new Float32Array(xy.length / 2), y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { x[i] = xy[2 * i]; y[i] = xy[2 * i + 1]; }
  const size = request.viewport;
  const margins = r => ({l:r.left, r:size.width-r.right, t:r.top, b:size.height-r.bottom, pad:0, autoexpand:false});
  const axis = (range, title) => ({range, autorange:false, title:{text:title}, showgrid:true, zeroline:false,
    showline:true, mirror:true, automargin:false, tickfont:{size:11}, gridcolor:'rgba(0,0,0,0.12)'});
  const started = performance.now();
  try {
    await Plotly.newPlot(host, [{type:'scattergl', mode:'markers', x, y, hoverinfo:'skip',
      marker:{symbol:'circle', size:2*request.quality.radiusCssPx, color:'rgb(70,130,180)', opacity:1, line:{width:0}}}],
    {width:size.width, height:size.height, margin:margins(firstMetrics.dataRect), showlegend:false,
      paper_bgcolor:'white', plot_bgcolor:'white',
      xaxis:axis([request.dataset.bounds[0],request.dataset.bounds[1]], 'Longitude (degrees)'),
      yaxis:axis([request.dataset.bounds[2],request.dataset.bounds[3]], 'Latitude (degrees)')},
    {responsive:false, displayModeBar:true, plotGlPixelRatio:size.dpr});
    const gls = () => completedGL(host.querySelectorAll('.gl-container canvas'));
    gls();
    return {
      setup:{throughResourceInitAndFirstCompleteMs:performance.now()-started, version:Plotly.version},
      async update(domain, metrics) {
        await Plotly.relayout(host, {'xaxis.range':[domain[0],domain[1]], 'yaxis.range':[domain[2],domain[3]], margin:margins(metrics.dataRect)});
        gls();
        sameDomain([...host._fullLayout.xaxis.range,...host._fullLayout.yaxis.range], domain);
        const observed = {left:host._fullLayout.xaxis._offset, top:host._fullLayout.yaxis._offset,
          width:host._fullLayout.xaxis._length, height:host._fullLayout.yaxis._length};
        observed.right=observed.left+observed.width; observed.bottom=observed.top+observed.height;
        sameRect(observed,metrics.dataRect);
        return {endpoint:'Plotly.relayout promise + all native GL contexts finish', metrics, population:x.length};
      },
      async capture({redraw=true}={}) {
        // Plotly uses multiple native GL canvases. Composite those actual native
        // surfaces (no geometry drawing) for the common geometry oracle.
        if(redraw) await Plotly.redraw(host); // Untimed checkpoint only; never an extra timed draw.
        gls();
        const canvas=document.createElement('canvas');canvas.width=size.width*size.dpr;canvas.height=size.height*size.dpr;
        const context=canvas.getContext('2d');
        for (const native of gls()) {
          const frame=captureGL(native),copy=document.createElement('canvas');copy.width=frame.width;copy.height=frame.height;
          const ctx=copy.getContext('2d'),image=ctx.createImageData(frame.width,frame.height);
          for(let y=0;y<frame.height;y++) image.data.set(frame.pixels.subarray((frame.height-1-y)*frame.width*4,(frame.height-y)*frame.width*4),y*frame.width*4);
          ctx.putImageData(image,0,0);context.drawImage(copy,0,0,canvas.width,canvas.height);
        }
        return {pixels:context.getImageData(0,0,canvas.width,canvas.height).data,width:canvas.width,height:canvas.height};
      },
      checkPopulation() {
        need(host.data.length===1 && host.data[0].type==='scattergl' && host.data[0].x.length===x.length &&
          host._fullData[0].x.length===x.length && host._fullData[0].y.length===y.length, 'FULL_PLOTLY_SCATTERGL_POPULATION');
        for(let i=0;i<x.length;i++) need(host._fullData[0].x[i]===xy[2*i] && host._fullData[0].y[i]===xy[2*i+1], 'FULL_PLOTLY_POSITION:'+i);
        return x.length;
      },
      async close() { Plotly.purge(host); },
    };
  } catch(error) { Plotly.purge(host); throw error; }
}

function deckAxes(deck, request, domain, rect) {
  const lines=[], texts=[];
  const x = value => rect.left+(value-domain[0])/(domain[1]-domain[0])*rect.width;
  const y = value => rect.bottom-(value-domain[2])/(domain[3]-domain[2])*rect.height;
  // Standard native LineLayer/TextLayer axes/grid. No custom canvas/shader.
  for(let i=0;i<=5;i++) {
    const xv=domain[0]+(domain[1]-domain[0])*i/5, yv=domain[2]+(domain[3]-domain[2])*i/5;
    lines.push({a:[x(xv),rect.top],b:[x(xv),rect.bottom]}, {a:[rect.left,y(yv)],b:[rect.right,y(yv)]});
    texts.push({p:[x(xv),rect.bottom+15],text:xv.toFixed(4)}, {p:[rect.left-25,y(yv)],text:yv.toFixed(4)});
  }
  const border=[{a:[rect.left,rect.top],b:[rect.right,rect.top]},{a:[rect.right,rect.top],b:[rect.right,rect.bottom]},
    {a:[rect.right,rect.bottom],b:[rect.left,rect.bottom]},{a:[rect.left,rect.bottom],b:[rect.left,rect.top]}];
  texts.push({p:[(rect.left+rect.right)/2,request.viewport.height-14],text:'Longitude (degrees)'},
    {p:[rect.left,rect.top-20],text:'Latitude (degrees)'});
  return [new deck.LineLayer({id:'axes-grid',data:lines,getSourcePosition:d=>d.a,getTargetPosition:d=>d.b,getColor:[0,0,0,31],getWidth:1,widthUnits:'pixels',pickable:false}),
    new deck.LineLayer({id:'axes-frame',data:border,getSourcePosition:d=>d.a,getTargetPosition:d=>d.b,getColor:[0,0,0,255],getWidth:1,widthUnits:'pixels',pickable:false}),
    new deck.TextLayer({id:'axes-labels',data:texts,getPosition:d=>d.p,getText:d=>d.text,getSize:11,sizeUnits:'pixels',getColor:[0,0,0,255],fontFamily:'sans-serif',pickable:false})];
}

async function deckAdapter(host, request, xy, firstMetrics) {
  const deck=globalThis.deck;
  need(deck?.VERSION===request.peerBuilds.deck.version, 'PINNED_DECK_BUILD');
  const started=performance.now(), size=request.viewport;
  let instance, gl, pending, renderError;
  const canvas=document.createElement('canvas');host.append(canvas);
  const pointLayer=new deck.ScatterplotLayer({id:'points', coordinateSystem:deck.COORDINATE_SYSTEM.CARTESIAN,
    data:{length:xy.length/2,attributes:{getPosition:{value:xy,size:2}}},getRadius:request.quality.radiusCssPx,
    radiusUnits:'pixels',getFillColor:request.quality.rgba,stroked:false,filled:true,antialiasing:true,pickable:false});
  const configure=(domain,metrics)=>({views:[
    new deck.OrthographicView({id:'points-view',x:metrics.dataRect.left,y:metrics.dataRect.top,width:metrics.dataRect.width,height:metrics.dataRect.height,flipY:false}),
    new deck.OrthographicView({id:'axes-view',flipY:true})],
    viewState:{'points-view':{target:[(domain[0]+domain[1])/2,(domain[2]+domain[3])/2,0],
      zoomX:Math.log2(metrics.dataRect.width/(domain[1]-domain[0])),zoomY:Math.log2(metrics.dataRect.height/(domain[3]-domain[2]))},
      'axes-view':{target:[size.width/2,size.height/2,0],zoom:0}},
    layers:[pointLayer.clone({parameters:{depthCompare:'always',depthWriteEnabled:false,
      scissorRect:[Math.round(metrics.dataRect.left*size.dpr),Math.round((size.height-metrics.dataRect.bottom)*size.dpr),
        Math.round(metrics.dataRect.width*size.dpr),Math.round(metrics.dataRect.height*size.dpr)]}}),
      ...deckAxes(deck,request,domain,metrics.dataRect)]});
  const afterRender=()=>{
    if (!pending || !instance?.isInitialized) return;
    const layers=instance.props.layers;
    if(!layers.every(layer=>layer.isLoaded)) return;
    try { completedGL([canvas]); const complete=pending;pending=null;complete.resolve(); }
    catch(error) {pending.reject(error);pending=null;}
  };
  const draw=async(domain,metrics)=>{
    need(!pending,'NO_OVERLAPPING_DECK_FRAME');
    let resolve,reject;
    const done=new Promise((a,b)=>{resolve=a;reject=b;});pending={resolve,reject};
    try {
      instance.setProps(configure(domain,metrics));
      instance.redraw('matched-panzoom');
      await bounded(done,7000,'COMPLETE_DECK_FRAME_TIMEOUT');
      need(!renderError && !gl.isContextLost(),'DECK_RENDER_OR_CONTEXT_FAILURE');
      const viewport=instance.getViewports().find(v=>v.id==='points-view');
      const corner=viewport.project([domain[0],domain[2],0]);
      const opposite=viewport.project([domain[1],domain[3],0]);
      // Viewport.project is local to the selected view, in CSS pixels.
      need(near(corner[0],0,0.05)&&near(corner[1],metrics.dataRect.height,0.05)&&
        near(opposite[0],metrics.dataRect.width,0.05)&&near(opposite[1],0,0.05),'DECK_ACTUAL_PROJECTED_CAMERA');
      return {endpoint:'deck.onAfterRender + all layers loaded + native GL finish',metrics,population:xy.length/2};
    } finally {pending=null;}
  };
  try {
    instance=new deck.Deck({canvas,width:size.width,height:size.height,useDevicePixels:size.dpr,controller:false,
      deviceProps:{type:'webgl'},getCursor:()=> 'default',
      onWebGLInitialized:context=>{gl=context;},onError:error=>{renderError=String(error);pending?.reject(error);},
      onAfterRender:afterRender,
      layerFilter:({layer,viewport})=>(layer.id==='points')===(viewport.id==='points-view'),
      ...configure(request.dataset.bounds,firstMetrics)});
    // Initialization's first callback is asynchronous. The normal animation
    // loop will draw pending work; RAF itself is never an output metric.
    await bounded(new Promise((resolve,reject)=>{pending={resolve,reject};}),30000,'DECK_RESOURCE_INITIALIZATION');
    await draw(request.dataset.bounds,firstMetrics);
    return {
      setup:{throughResourceInitAndFirstCompleteMs:performance.now()-started,version:deck.VERSION},update:draw,
      async capture(){return captureGL(completedGL([canvas])[0]);},
      checkPopulation(){
        const layer=instance.props.layers.find(l=>l.id==='points');
        need(layer.getNumInstances()===xy.length/2&&layer.props.data.attributes.getPosition.value===xy,'FULL_DECK_BINARY_POPULATION');
        return layer.getNumInstances();
      },
      async close(){instance.finalize();},
    };
  } catch(error){instance?.finalize();throw error;}
}

// One tool per existing browser context. The Node attachment runs all preflights
// and parity checks before allowing ANY comparative timing invocation.
export async function runPlottingTool({tool,phase,request,assetBase,base='/preview/0.7.5/',reference}) {
  base = resolvePlottingRuntimeBase(base);
  need(['vkf','plotly','deck'].includes(tool)&&['preflight','measure'].includes(phase),'EXPLICIT_TOOL_PHASE');
  need(request.schema===1&&request.dataset.count===1_000_000,'FROZEN_REAL_POPULATION');
  need(devicePixelRatio===request.viewport.dpr,'MATCHED_DPR');
  need(!document.hidden,'VISIBLE_BROWSER_CONTEXT_REQUIRED');
  const load=async key=>{
    const began=performance.now();
    const response=await fetch(assetBase+request.files[key].path,{cache:'no-store'});
    need(response.ok,'FROZEN_INPUT_AVAILABLE:'+key);
    const bytes=await response.arrayBuffer();
    need(bytes.byteLength===request.files[key].bytes&&await sha(bytes)===request.files[key].sha256,'FROZEN_INPUT_IDENTITY:'+key);
    inputTransfers[key]={fetchAndHashMs:performance.now()-began,bytes:bytes.byteLength};
    return bytes;
  };
  const inputTransfers={};
  const xy=new Float32Array(await load('xy'));
  const trace=JSON.parse(new TextDecoder().decode(await load('trace')));
  const source=tool==='vkf'?new TextDecoder().decode(await load('source')):null;
  need(xy.length===request.dataset.count*2&&trace.length>1,'COMPLETE_DATA_AND_MOVING_TRACE');
  if(tool!=='vkf'||phase==='measure') need(reference?.length===trace.length,'EXACT_SOURCE_MATCHED_VKF_PREFLIGHT_REFERENCE');
  const host=document.createElement('div');host.style.cssText=`position:relative;width:${request.viewport.width}px;height:${request.viewport.height}px;background:white;`;
  document.body.prepend(host);
  let adapter;
  const output={tool,phase,status:'UNRUN',presentationFps:null,comparativeSamples:0,setup:null,frames:[],checkpoints:[],environment:request.environment,
    metric:'Paced sequential full-chart application update + complete native surface readback cadence; observer overhead included; no compositor/display presentation proof',timeOrigin:performance.timeOrigin,
    inputTransfers,browser:{userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},dpr:devicePixelRatio}};
  try {
    adapter=tool==='vkf'?await vkfAdapter(host,request,source,xy,base):tool==='plotly'?await plotlyAdapter(host,request,xy,reference[0]):await deckAdapter(host,request,xy,reference[0]);
    output.setup=adapter.setup;
    const referenceOut=[], checkAt=new Set([Math.floor(trace.length/2),trace.length-1]);
    const initial=await adapter.update(trace[0].domain,reference?.[0]);
    referenceOut.push(initial.metrics);
    need(adapter.checkPopulation()===request.dataset.count,'INITIAL_FULL_OUTPUT_POPULATION');
    output.checkpoints.push({index:0,domain:trace[0].domain,metrics:initial.metrics,
      geometry:visibleGeometry(await adapter.capture(),xy,trace[0].domain,initial.metrics.dataRect,request.viewport.dpr,request.quality.radiusCssPx)});
    const began=performance.now();
    for(let i=1;i<trace.length;i++) {
      const step=trace[i];
      if(phase==='measure') await pauseUntil(began+step.atMs);
      const requestedAt=performance.now();
      const complete=await adapter.update(step.domain,reference?.[i]);
      const commandsAndQueueReadyAt=performance.now();
      // Canvas command completion alone does not prove raster completion. Use
      // actual full native surface readback for EVERY timed tool, not idle RAF
      // or an enqueued draw. Keep this observer cost explicit, never subtract
      // it to invent a pure-render or displayed-frame rate.
      if(phase==='measure') await adapter.capture({redraw:false});
      const completedAt=performance.now();
      need(complete.population===request.dataset.count,'COMPLETED_FULL_POPULATION');
      if(tool==='vkf') {
        need(near(complete.metrics.width,request.viewport.width,0.05)&&near(complete.metrics.height,request.viewport.height,0.05),'FULL_MATCHED_VIEWPORT');
        if(reference) sameRect(complete.metrics.dataRect,reference[i].dataRect);
      }
      referenceOut.push(complete.metrics);
      if(phase==='measure') output.frames.push({index:i,traceAtMs:step.atMs,requestedAt,completedAt,
        completedIntervalMs:completedAt-(output.frames.at(-1)?.completedAt??began),
        epochCompletedMs:performance.timeOrigin+completedAt,completionLatencyMs:completedAt-requestedAt,
        commandsAndQueueReadyAt,fullSurfaceReadbackMs:completedAt-commandsAndQueueReadyAt,
        lateByMs:Math.max(0,requestedAt-began-step.atMs),domain:step.domain,endpoint:complete.endpoint+' + full native surface readback; native SVG axes DOM complete for Plotly'});
      if(phase==='preflight'&&checkAt.has(i)) {
        need(adapter.checkPopulation()===request.dataset.count,'FULL_OUTPUT_POPULATION');
        const pixels=await adapter.capture();
        const geometry=visibleGeometry(pixels,xy,step.domain,complete.metrics.dataRect,request.viewport.dpr,request.quality.radiusCssPx);
        output.checkpoints.push({index:i,domain:step.domain,metrics:complete.metrics,geometry});
      }
    }
    output.elapsedMs=performance.now()-began;
    if(phase==='measure') {
      const last=trace.length-1,metrics=referenceOut[last];
      need(adapter.checkPopulation()===request.dataset.count,'FINAL_FULL_RESIDENT_POPULATION');
      output.checkpoints.push({index:last,domain:trace[last].domain,metrics,
        geometry:visibleGeometry(await adapter.capture(),xy,trace[last].domain,metrics.dataRect,request.viewport.dpr,request.quality.radiusCssPx)});
    }
    output.reference=tool==='vkf'?referenceOut:undefined;
    output.status=phase==='preflight'?'PASS_PREFLIGHT':'RAW_MEASURED_REQUIRES_INDEPENDENT_REVIEW';
    output.comparativeSamples=phase==='measure'?output.frames.length:0;
    output.lostFrames=null; // Closed-loop updates cannot establish lost display frames.
    output.missedInputDeadlines=output.frames.filter(row=>row.lateByMs>1000/request.traceMethod.inputHz).length;
    // No percentile/FPS publication here; raw samples remain authoritative.
    return output;
  } finally {await adapter?.close();host.remove();}
}
