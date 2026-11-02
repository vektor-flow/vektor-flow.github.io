// Presentation adapter only. Every source enters the installed current VKF
// LaTeX SCENE producer; the existing required-accuracy native renderer owns ink.
// Rotation uses its affine camera, never CSS scaling or a replacement shader.
const need = (value, code) => { if (!value) throw new Error(code); };
const plainMathSource = value => '\\text{' + String(value).replace(/[\\{}$%&#_^~]/g, c => ({
  '\\':'\\textbackslash{}', '{':'\\{', '}':'\\}', '$':'\\$', '%':'\\%',
  '&':'\\&', '#':'\\#', '_':'\\_', '^':'\\textasciicircum{}', '~':'\\textasciitilde{}'
}[c])) + '}';
export function nativePlotTextSource(text) {
  const source = String(text ?? '');
  let result = '', offset = 0;
  while (offset < source.length) {
    let start = source.indexOf('$',offset);
    while (start > 0 && source[start-1] === '\\') start=source.indexOf('$',start+1);
    if (start < 0) {result += plainMathSource(source.slice(offset));break;}
    const marker = source.slice(start,start+2) === '$$' ? '$$' : '$';
    const end = source.indexOf(marker,start+marker.length);
    if (end < 0) {result += plainMathSource(source.slice(offset));break;}
    if (start > offset) result += plainMathSource(source.slice(offset,start));
    result += source.slice(start+marker.length,end);
    offset = end+marker.length;
  }
  return result;
}

export function createNativePlotTextLayer({container, createLayer, measure}) {
  need(container?.ownerDocument && typeof createLayer === 'function', 'NATIVE_PLOT_TEXT_FACTORY');
  const groups = new Map();
  let closed = false, next = null, running = null, generation = 0, accepted = 0;
  let state = {status:'PENDING', route:'current-vkf-latex-scene'};
  const waiters = [];
  const settle = (through, result, error) => {
    for (let i = waiters.length - 1; i >= 0; --i) {
      if (waiters[i].generation > through) continue;
      const waiter = waiters.splice(i, 1)[0];
      if (error) waiter.reject(error);
      else waiter.resolve({...result, superseded:waiter.generation !== through});
    }
  };
  async function draw(input) {
    const batches = new Map();
    for (const row of input.rows) {
      need(row.point?.length === 2 && row.point.every(Number.isFinite), 'NATIVE_PLOT_TEXT_POSITION');
      const rotation = Number(row.rotation) || 0;
      const color = row.color ?? input.foreground;
      // The installed renderer's certified style API accepts opaque ink.
      // Transparency remains source-visible and fails explicitly, never flattened.
      need(Array.isArray(color) && color.length === 4 && color[3] === 1 &&
        color.every(v => Number.isFinite(v) && v >= 0 && v <= 1), 'NATIVE_PLOT_TEXT_OPAQUE_STYLE_REQUIRED');
      const key = JSON.stringify([rotation, color, row.role ?? 'plot']);
      let batch = batches.get(key);
      if (!batch) {
        const theta = rotation * Math.PI / 180, c = Math.cos(theta), s = Math.sin(theta);
        batch = {color, camera:[c,s,s,-c,0,0], specs:[]};
        batches.set(key, batch);
      }
      const source = nativePlotTextSource(row.text), scale=(row.fontSize ?? 12)/(10*7200/7227);
      const [a,b,c,d] = batch.camera;
      let [x,y] = row.point;
      if (row.keepInViewport) {
        need(typeof measure === 'function','NATIVE_PLOT_TEXT_NATIVE_METRICS_REQUIRED');
        state={...state,phase:'native-metrics',pendingSource:source};
        const box=await measure(source), width=box.width*scale,height=(box.height+box.depth)*scale;
        state={...state,phase:'native-metrics-complete',pendingSource:source};
        const [ax,ay]=row.anchor ?? [0.5,0.5],theta=rotation*Math.PI/180,cos=Math.cos(theta),sin=Math.sin(theta);
        const offsets=[[-ax*width,-ay*height],[(1-ax)*width,-ay*height],[-ax*width,(1-ay)*height],[(1-ax)*width,(1-ay)*height]]
          .map(([u,v])=>[cos*u-sin*v,sin*u+cos*v]);
        const inset=4,minX=Math.min(...offsets.map(p=>p[0])),maxX=Math.max(...offsets.map(p=>p[0]));
        const minY=Math.min(...offsets.map(p=>p[1])),maxY=Math.max(...offsets.map(p=>p[1]));
        x=Math.max(inset-minX,Math.min(input.width-inset-maxX,x));
        y=Math.max(inset-minY,Math.min(input.height-28-inset-maxY,y));
      }
      batch.specs.push({id:row.id, kind:'math', source,
        anchor:[a*x+b*y,c*x+d*y], scale,
        sizeSpace:'world', anchorFraction:row.anchor ?? [0.5,0.5]});
    }
    for (const [key, group] of groups) if (!batches.has(key)) {
      await group.layer.destroy(); group.host.remove(); groups.delete(key);
    }
    for (const [key, batch] of batches) {
      if (closed) return;
      let group = groups.get(key);
      if (!group) {
        const host = container.ownerDocument.createElement('div');
        host.style.cssText = 'position:absolute;inset:0;pointer-events:none';
        container.append(host);
        group = {host, layer:createLayer({container:host}), signature:null};
        groups.set(key, group);
      }
      const signature = JSON.stringify([batch.specs,batch.camera,input.width,input.height,input.pixelRatio]);
      if (signature === group.signature) continue;
      group.layer.canvas.style.visibility = 'hidden';
      await group.layer.update({specs:batch.specs,camera:batch.camera,width:input.width,height:input.height});
      if (closed) return;
      // The same native geometry is re-rasterized with the existing opaque
      // style API. The black native source and its certificates stay intact.
      await group.layer.updateColor(batch.color);
      if (closed) return;
      group.signature = signature;
    }
  }
  async function drain() {
    try {
      while (next && !closed) {
        const input = next; next = null;
        await draw(input);
        if (closed) break;
        accepted = input.generation;
        if (next) continue; // Never report a superseded coordinate/view as current.
        state = {status:'SUBMITTED_COMPLETION_UNMEASURED',route:'current-vkf-latex-scene',
          generation:accepted, rows:input.rows.length, pixelRatio:input.pixelRatio,
          groups:[...groups.values()].map(g => g.layer.statistics())};
        settle(accepted,state);
      }
    } catch (error) {
      next = null;
      state = {status:'FAILED',route:'current-vkf-latex-scene',error:String(error.stack ?? error)};
      for (const group of groups.values()) group.layer.canvas.style.visibility = 'hidden';
      settle(generation,null,error);
      throw error;
    }
  }
  function launch() {
    running=Promise.resolve().then(drain).finally(()=>{
      running=null;
      // A consumer may request its next view when the preceding ready promise
      // settles, before this drain's final microtask. Do not strand that input.
      if (next && !closed) launch();
    });
    running.catch(()=>{});
  }
  return {
    update(input) {
      need(!closed, 'NATIVE_PLOT_TEXT_CLOSED');
      next = {...input, rows:structuredClone(input.rows), generation:++generation};
      state = {...state,status:'PENDING',generation};
      const ready = new Promise((resolve,reject) => waiters.push({generation,resolve,reject}));
      if (!running) launch();
      return ready;
    },
    statistics:() => ({...state,groups:[...groups.values()].map(g=>g.layer.statistics())}),
    canvases:() => [...groups.values()].map(g=>g.layer.canvas),
    sourceSnapshots:() => [...groups.values()].map(g=>g.layer.renderer.nativeSourceSnapshot()),
    async destroy() {
      if (closed) return running;
      closed = true; next = null;
      settle(generation,{status:'DISPOSED'});
      await running?.catch(() => {});
      await Promise.all([...groups.values()].map(async group => {await group.layer.destroy();group.host.remove();}));
      groups.clear();
    }
  };
}
