// Ordinary supported layout: two entries in one Frame and a separate continuous Frame.
export const exerciseNormalMultiRenderer = async()=>{
  const need=(v,s)=>{if(!v)throw Error(s);};let adapterInfo;const requestAdapter=navigator.gpu.requestAdapter.bind(navigator.gpu);navigator.gpu.requestAdapter=async(...args)=>{const adapter=await requestAdapter(...args);adapterInfo=adapter?.info;need(adapter&&!adapterInfo?.isFallbackAdapter,'PHYSICAL_GPU_REQUIRED');return adapter;};const {ensureInlineRenderer}=await import('/preview/0.7.5/inline-renderer-loader.mjs');await ensureInlineRenderer();
  const original=window.VfGeomWgpu,renderers=[],frames=[],host=document.createElement('div');host.style.cssText='width:1000px;height:400px;position:relative;display:flex';document.body.prepend(host);
  window.VfGeomWgpu=function(canvas,getMesh){const r=new original(canvas,getMesh);renderers.push(r);return r;};window.VfGeomWgpu.prototype=original.prototype;
  const camera={pos:[0,0,4],target:[0,0,0],up:[0,1,0],projection:'orthographic',ortho_scale:1.5};
  const scene=meshes=>({meshes,camera:structuredClone(camera),lights:[],texts:[]});const box=(id,x,color)=>({type:'box',id,center:[x,0,0],scale:[.7,.7,.7],color});
  let device;const gpuErrors=[];
  try{
   for(const id of ['queue-two','queue-continuous']){const frame=VfFrame.mount(host,{id,containerKind:'viewport',frameless:true});Object.assign(frame.root.style,{position:'relative',inset:'auto',width:'480px',height:'360px'});frames.push(frame);}
   VfDisplay.renderFromJson({geom:{'queue-two':scene([box('left',-.5,[.9,.1,.1,1]),box('right',.5,[.1,.2,.9,1])]),'queue-continuous':scene([box('other',0,[.1,.8,.2,1])])}});
   const deadline=performance.now()+8000;while((renderers.length!==3||renderers.some(r=>!r._device))&&performance.now()<deadline)await new Promise(ok=>requestAnimationFrame(ok));need(renderers.length===3,'THREE_ORDINARY_RENDERERS');need(renderers[0]._frameId===renderers[1]._frameId&&renderers[0]!==renderers[1],'SAME_FRAME_DISTINCT_ENTRIES');need(renderers.every(r=>r._running&&r._renderOnDemand!==true),'NORMAL_CONTINUOUS_MODE');device=renderers[0]._device;need(renderers.every(r=>r._device===device),'SHARED_DEVICE');const info=device.adapterInfo;device.addEventListener('uncapturederror',e=>gpuErrors.push(String(e.error?.message||e)));
   // Normal public view updates require completed records from both entries.
   const rows=[];
   for(const shift of [.12,-.15]){
    let callback=null;const callbacks=renderers.map(()=>null),prior=renderers.map(r=>Number(r._presentedFrameSequence||0));
    renderers.forEach((r,i)=>{(r._afterSubmittedWorkDoneCallbacks||(r._afterSubmittedWorkDoneCallbacks=[])).push(record=>callbacks[i]={sequence:record.sequence,endpoint:record.endpoint,camera:record.camera});});
    const accepted=VfDisplay.updateGeomFrameCamera('queue-two',{...camera,pos:[shift,0,4],target:[shift,0,0]},{afterPresented:r=>callback=r});need(accepted,'CAMERA_ACCEPTED');
    const until=performance.now()+3000;while((!callback||callbacks.some(c=>!c))&&performance.now()<until)await new Promise(ok=>requestAnimationFrame(ok));
    if(callback&&callbacks.every(Boolean)){need(callback.endpoint==='gpu-queue-completed'&&callback.renderCameras.length===2,'BOTH_ENTRY_VIEW_COMPLETION');need(callbacks.every((c,i)=>c.endpoint==='gpu-queue-completed'&&c.sequence>prior[i]),'EVERY_ENTRY_COMPLETED_PROGRESS');need(callback.renderCameras.every(c=>c.pos[0]===shift),'COMPLETED_CURRENT_CAMERA');}
    rows.push({shift,callback,callbacks,prior,completed:renderers.map(r=>Number(r._presentedFrameSequence||0)),queued:renderers.map(r=>r._renderQueuedWhileGpuPending)});
    if(!callback||callbacks.some(c=>!c))return {status:'FAIL_MISSING_ACTUAL_COMPLETION',rows,gpuErrors,rendererCount:renderers.length,continuous:true};
   }
   const captures=[];
   for(const r of renderers){const frame=await r._debugReadFrameTexture();let hash=2166136261,nonblank=0;for(let i=0;i<frame.pixels.length;i+=4){const p=frame.pixels;hash=Math.imul(hash^p[i],16777619);hash=Math.imul(hash^p[i+1],16777619);hash=Math.imul(hash^p[i+2],16777619);if(p[i+3]&&p[i]+p[i+1]+p[i+2]<740)nonblank++;}need(nonblank>0,'VISIBLE_ENTRY_PIXELS');captures.push({frameId:r._frameId,objectId:r._objectId,sequence:r._presentedFrameSequence,width:frame.width,height:frame.height,nonblank,hash:hash>>>0});}
   // A queued entry is removed safely when stopped/disposed; survivors still progress.
   const stopped=renderers[1];stopped.stop();const stoppedSequence=stopped._presentedFrameSequence;await device.queue.onSubmittedWorkDone();const settled=stopped._presentedFrameSequence;const before=renderers[0]._presentedFrameSequence;renderers[0].requestFrame();const until=performance.now()+3000;while(renderers[0]._presentedFrameSequence<=before&&performance.now()<until)await new Promise(ok=>requestAnimationFrame(ok));need(renderers[0]._presentedFrameSequence>before,'SURVIVOR_PROGRESS');await new Promise(ok=>requestAnimationFrame(ok));need(stopped._presentedFrameSequence===settled,'STOPPED_RENDERER_RESUBMITTED');
   need(gpuErrors.length===0,'GPU_ERRORS');return {status:'PASS_REAL_GPU_MULTI_RENDERER_COMPLETION',adapter:{vendor:adapterInfo?.vendor,architecture:adapterInfo?.architecture,isFallbackAdapter:adapterInfo?.isFallbackAdapter},rows,captures,gpuErrors,rendererCount:3,continuous:true,stop:{before:stoppedSequence,settled,final:stopped._presentedFrameSequence,survivorProgress:true}};
  }finally{for(const f of frames)VfDisplay.disposeGeomFrame(f.root.getAttribute('data-vf-frame-id'));for(const r of renderers)r.destroy();host.remove();window.VfGeomWgpu=original;}
};
