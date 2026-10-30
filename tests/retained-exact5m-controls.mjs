// Source-only oracle repair: actual owner runs with the unchanged genuine 5M VKF input.
export async function focusedControls({source,base='/preview/0.7.5/'}) {
 const m=await(await fetch(base+'current-compiler-release.json',{cache:'no-store'})).json();
 const {createInlineRunner}=await import(base+'inline-runner.mjs');
 const runner=createInlineRunner({wasmUrl:base+m.package.wasm.replace(/^\.\//,''),moduleURL:base+m.package.module.replace(/^\.\//,''),dataURL:base+m.package.data.replace(/^\.\//,''),expectedSourceBinding:m.browser_binding,timeoutMs:180000});
 let dispose,target,observedDevice,gpuErrorListener;const started=performance.now(),need=(v,s)=>{if(!v)throw Error(s);};
 try {
  const visual=await runner.run(source,{guestArenaBytes:1073741824}),packetAt=performance.now();need(visual.sourceBinding===m.browser_binding,'CURRENT_BINDING');
  let count=0,maxError=0;
  for(const p of visual.packets)for(const mesh of p.metadata.scene.meshes){const ref=mesh.vertices;need(ref?.storage==='float32','NATIVE_VERTEX_REFERENCE');const v=new Float32Array(p.arena.buffer,p.arena.byteOffset+ref.byte_offset,ref.length);need(v.length%10===0,'NATIVE_POINT_STRIDE');for(let i=0;i<v.length;i+=10){const x=(count%2500)/2499*2-1,y=Math.floor(count/2500)/1999*2-1;maxError=Math.max(maxError,Math.abs(v[i]-x),Math.abs(v[i+1]-y),Math.abs(v[i+2]));const fixed=[0,0,1,.1,.3,.7,.5];for(let c=3;c<10;c++){need(Number.isFinite(v[i+c]),'FINITE_POINT_CHANNEL:'+count+':'+c);maxError=Math.max(maxError,Math.abs(v[i+c]-fixed[c-3]));}count++;}}
  need(count===5000000&&maxError<1e-6,'EXACT_5M_NUMERICAL_OUTPUT:'+count+':'+maxError);
  await window.__saveScalePhase({phase:'GENUINE_EXACT_5M_PACKET',count,maxError,timing:visual.timing,requestToPacketMs:packetAt-started});
  const {ensureInlineRenderer}=await import(base+'inline-renderer-loader.mjs');await ensureInlineRenderer();const {mountRetainedSceneResult}=await import(base+'inline-retained-scene-view.mjs');target=document.createElement('div');target.style.cssText='width:1000px;height:800px;position:relative;background:white';document.body.prepend(target);
  dispose=mountRetainedSceneResult(target,visual.packets);
  need(dispose.presented && Array.isArray(dispose.frameIds),'NORMAL_RETAINED_PRESENTATION_API');
  let firstTimer;
  const firstRecords=await Promise.race([dispose.presented,new Promise((_,reject)=>{
   firstTimer=setTimeout(()=>reject(Error('FIRST_RETAINED_PRESENTATION_TIMEOUT')),30000);
  })]).finally(()=>clearTimeout(firstTimer));
  need(firstRecords?.length===1&&dispose.element,'ACTUAL_MOUNTED_FRAME_ID');
  const mountedId=dispose.frameIds[0];
  need(firstRecords[0].frameId===mountedId&&firstRecords[0].endpoint==='gpu-queue-completed','ACTUAL_INITIAL_GPU_PRESENTATION');
  const capture=async()=>{const renderer=globalThis.__vfFrameRenderers?.[mountedId];need(renderer&&typeof renderer._debugReadFrameTexture==='function','ACTUAL_FRAME_TEXTURE_READBACK_API');const frame=await renderer._debugReadFrameTexture();need(frame&&frame.width>0&&frame.height>0&&frame.pixels,'ACTUAL_FRAME_TEXTURE_READBACK');const pixels=frame.pixels;let hash=2166136261,nonblank=0,rSum=0,gSum=0,bSum=0,aSum=0;for(let i=0;i<pixels.length;i+=4){rSum+=pixels[i];gSum+=pixels[i+1];bSum+=pixels[i+2];aSum+=pixels[i+3];hash=Math.imul(hash^pixels[i],16777619);hash=Math.imul(hash^pixels[i+1],16777619);hash=Math.imul(hash^pixels[i+2],16777619);if(pixels[i+3]&&pixels[i]+pixels[i+1]+pixels[i+2]<740)nonblank++;}return {width:frame.width,height:frame.height,pixelHash:hash>>>0,nonblankPixels:nonblank,rSum,gSum,bSum,aSum,readback:'actual renderer._debugReadFrameTexture GPU copyTextureToBuffer/mapAsync'};};
  const renderer=globalThis.__vfFrameRenderers?.[mountedId],device=renderer?._device;need(renderer&&target.contains(renderer._canvas)&&device?.queue&&typeof device.queue.onSubmittedWorkDone==='function','ACTUAL_SELECTED_GPU_QUEUE_REQUIRED');const gpuErrors=[];let deviceLost=false;const onGpuError=e=>gpuErrors.push(String(e.error?.message??e));observedDevice=device;gpuErrorListener=onGpuError;device.addEventListener('uncapturederror',onGpuError);device.lost.then(info=>{deviceLost=true;gpuErrors.push('DEVICE_LOST:'+info.message);});await device.queue.onSubmittedWorkDone();need(!deviceLost&&gpuErrors.length===0,'INITIAL_GPU_QUEUE_FAILURE');const initial=await capture(),initializedAt=performance.now();need(initial.nonblankPixels>0,'INITIAL_5M_VISIBLE_OUTPUT');const updates=[];
  for(const shift of [.12,-.15,.03]){
   device.pushErrorScope('validation');const at=performance.now();let completed;const done=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('ACTUAL_SUBMITTED_COMPLETION_CALLBACK_TIMEOUT')),3000);completed=()=>{clearTimeout(timer);resolve(performance.now());};});
   const accepted=VfDisplay.updateGeomFrameCamera(mountedId,{pos:[shift,0,4],target:[shift,0,0],up:[0,1,0],projection:'orthographic',ortho_scale:1.05},{afterPresented:record=>{need(record.endpoint==='gpu-queue-completed','ACTUAL_UPDATE_GPU_PRESENTATION');completed();}});need(accepted===true,'ACTUAL_MOUNTED_UPDATE_REFUSED');
   const callbackAt=await done;await device.queue.onSubmittedWorkDone();const completeAt=performance.now(),validation=await device.popErrorScope();if(validation)gpuErrors.push(String(validation.message));const frameStatus=VfDisplay.geomFrameStatus(mountedId);need(!deviceLost&&gpuErrors.length===0&&frameStatus.runtimeFailures.length===0&&frameStatus.initFailures.length===0,'ACTUAL_GPU_COMPLETION_FAILURE:'+JSON.stringify({gpuErrors,frameStatus}));const pixels=await capture();updates.push({shift,accepted,completedUpdateMs:completeAt-at,throughFullReadbackMs:performance.now()-at,afterPresentedCallbackMs:callbackAt-at,completion:'actual selected renderer queue.onSubmittedWorkDone fulfilled; no validation/device loss/runtime errors',...pixels});await window.__saveScalePhase({phase:'ACTUAL_MOUNTED_5M_UPDATE',count,mountedId,initial,updates});
  }
  const changed=new Set([initial.pixelHash,...updates.map(v=>v.pixelHash)]).size>1;need(changed,'CAMERA_UPDATE_VISIBLE_PIXELS_UNCHANGED');
  const beforeColor=await capture(),colorAt=performance.now();
  device.pushErrorScope('validation');
  const beforeColorSerial=VfDisplay.getGeomFramePresentedView(mountedId)?.serial;
  // Observe the normal packet's OWN redraw, without a separate camera or
  // presentation request that could hide a missing ordinary packet update.
  let colorRaf=0,colorTimer;
  const colorDone=new Promise((resolve,reject)=>{
   colorTimer=setTimeout(()=>reject(Error('COLOR_PRESENTED_TIMEOUT')),3000);
   const poll=()=>{const record=VfDisplay.getGeomFramePresentedView(mountedId);
    if(record&&record.serial>beforeColorSerial){
     if(record.endpoint!=='gpu-queue-completed')reject(Error('ACTUAL_COLOR_GPU_PRESENTATION'));else resolve();
    }else colorRaf=requestAnimationFrame(poll);
   };colorRaf=requestAnimationFrame(poll);
  });
  try {
   VfDisplay.applyRuntimePacket({kind:'geom.color.patch',payload:{frame_id:mountedId,object_id:1,color:[.8,.15,.1,.5]}});
   await colorDone;
  } finally {clearTimeout(colorTimer);cancelAnimationFrame(colorRaf);}
  await device.queue.onSubmittedWorkDone();
  const colorComplete=performance.now(),colorValidation=await device.popErrorScope();need(!colorValidation&&!deviceLost&&gpuErrors.length===0,'COLOR_GPU_ERROR');
  const afterColor=await capture();need(afterColor.pixelHash!==beforeColor.pixelHash,'COLOR_VISIBLE_PIXELS_UNCHANGED');need(afterColor.rSum>afterColor.bSum,'ACTUAL_COLOR_VISIBLE_RED_OUTPUT');
  const colorUpdate={completedUpdateMs:colorComplete-colorAt,before:beforeColor,after:afterColor,actualRuntimePacket:true,packetOwnRedraw:true,actualQueueCompleted:true};
  await window.__saveScalePhase({phase:'ACTUAL_MOUNTED_5M_COLOR',count,mountedId,colorUpdate});
  return {actualBinding:visual.sourceBinding,population:count,maxCoordinateError:maxError,guestArenaBytes:1073741824,requestToPacketMs:packetAt-started,setupThroughInitialReadbackMs:initializedAt-started,originalFrameId:visual.packets[0].metadata.scene.frame,actualMountedFrameId:mountedId,mountedElementId:dispose.element.id,initial,updates,changedOutput:true,gpuErrors,deviceLost,viewUpdateTimesMs:updates.map(v=>v.completedUpdateMs),colorUpdate,colorCorrectness:true,animationAndColorQualified:false,releaseQualified:false,timing:visual.timing};
 } finally {if(observedDevice&&gpuErrorListener)observedDevice.removeEventListener('uncapturederror',gpuErrorListener);dispose?.();target?.remove();await runner.dispose();}
}
