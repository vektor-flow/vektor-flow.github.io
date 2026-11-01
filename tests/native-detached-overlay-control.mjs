export async function lateDetachedOverlayControl(){
 const need=(v,m)=>{if(!v)throw Error(m)};
 const loader=await import('/preview/0.7.5/inline-renderer-loader.mjs');await loader.ensureInlineRenderer();
 const {installCurrentWasmMathLabels}=await import('/preview/0.7.5/vf-ui/native-labels/vf-current-wasm-math-labels.mjs');
 const [dataset,cameras]=await Promise.all(['dataset','cameras'].map(n=>fetch('/__e1878/'+n+'.json').then(r=>r.json())));
 const raf=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),queued=new Map();let next=-1,engine,frame,container;
 window.requestAnimationFrame=fn=>{if(String(fn).includes('updateGeomTextOverlayRect')){const id=next--;queued.set(id,fn);return id;}return raf(fn);};
 window.cancelAnimationFrame=id=>{if(queued.delete(id))return;return cancel(id);};
 const id='e1878-detached-overlay-control';
 try{
  engine=await installCurrentWasmMathLabels();container=document.createElement('div');container.style.cssText='position:relative;width:1280px;height:800px';document.body.prepend(container);
  frame=VfFrame.mount(container,{id,frameless:true,draggable:false,resizable:false,closable:false,containerKind:'viewport'});
  if(frame.root?.style)Object.assign(frame.root.style,{position:'relative',inset:'auto',width:'1280px',height:'800px'});
  VfDisplay.renderFromJson({geom:{[id]:{meshes:[],texts:[],native_labels:{specs:[dataset.specs[0]],camera:cameras[0].cameraMatrix}}}});
  await VfDisplay.nativeLabelFrameStatus(id).ready;
  await new Promise(resolve=>setTimeout(resolve,40));need(queued.size>0,'ACTUAL_RESIZE_OBSERVER_QUEUED_OVERLAY_RAF');
  const queuedCount=queued.size,pending=[...queued.values()];VfDisplay.disposeGeomFrame(id);frame.destroy();await VfDisplay.joinNativeLabelCleanup();await engine.close();container.remove();
  need(queued.size===0,'EXPORTED_DISPOSE_CANCELLED_TRACKED_RESIZE_RAF');for(const fn of pending)fn(performance.now());
  await new Promise(resolve=>raf(()=>raf(resolve)));await VfDisplay.joinNativeLabelCleanup();
  const status=VfDisplay.nativeLabelFrameStatus(id),stats=engine.statistics();
  need(!status||(!status.ready&&!status.canvas&&status.sourceSnapshot===null),'NO_NATIVE_RESURRECTION_AFTER_DETACHED_RESIZE');
  need(stats.closed&&stats.leases===0&&stats.cachedFormulas===0&&!container.isConnected,'ACTUAL_PROVIDER_AND_DOM_RELEASED');
  return {status:'PASS_SUPPORTED_DISPLAY_DISPOSAL_CANCELS_LATE_OVERLAY_AND_RELEASES_OWNERSHIP',queuedCount,producerStats:stats,retainedFrameStatus:status?.statistics??null,fullOriginalNormalQualified:false};
 }finally{
  VfDisplay.disposeGeomFrame(id);frame?.destroy();await VfDisplay.joinNativeLabelCleanup();await engine?.close();container?.remove();queued.clear();window.requestAnimationFrame=raf;window.cancelAnimationFrame=cancel;
 }
}
