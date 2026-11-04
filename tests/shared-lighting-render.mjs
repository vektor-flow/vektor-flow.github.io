// ACTUAL only. Small ordinary-renderer regression, never the full EX01 scene.
// Uses real mesh geometry/materials and GPU-completed pixels; no custom shader.
export async function exerciseSharedLightingRender(){
 const need=(v,s)=>{if(!v)throw Error(s);};
 const {ensureInlineRenderer}=await import('/preview/0.7.5/inline-renderer-loader.mjs');await ensureInlineRenderer();
 const {mountCurrentPlotToolbar}=await import('/preview/0.7.5/vf-ui/vf-current-plot-toolbar.mjs');
 const Original=VfGeomWgpu,renderers=[],frames=[],host=document.createElement('div');
 host.style.cssText='position:relative;width:400px;height:400px';document.body.prepend(host);
 function Wrapped(canvas,getMesh){const value=new Original(canvas,getMesh);renderers.push(value);return value;}
 Wrapped.prototype=Original.prototype;Object.assign(Wrapped,Original);window.VfGeomWgpu=Wrapped;
 const errors=[],rows=[],deviceListeners=new Map(),toolbarDisposers=[];
 function quad(id,x0,x1,y0,y1,z,mode3d,color,emission){return {id,type:'field_mesh',kind:'field_mesh',mode3d,
  vertices:new Float32Array([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]].flatMap(p=>[...p,0,0,1,...color])),
  indices:new Uint32Array([0,1,2,0,2,3]),topology:'triangle-list',color,emission,
  receives_lighting:true,receives_shadow:true,casts_shadow:true,depth_write:true};}
 async function waitFor(predicate,message){const end=performance.now()+10000;while(!predicate()&&performance.now()<end)await new Promise(ok=>requestAnimationFrame(ok));need(predicate(),message);}
 function sampleNdc(image,x,y){const px=Math.round((x+1)*.5*(image.width-1)),py=Math.round((1-y)*.5*(image.height-1));let sum=0,n=0;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const at=((py+dy)*image.width+px+dx)*4;sum+=image.pixels[at]+image.pixels[at+1]+image.pixels[at+2];n++;}return sum/n;}
 try{
  for(const mode3d of [false,true]){
   // The normal auto-sized frame is 400x58, not the requested square host.
   // For authored orthographic scale1, world x projects to x/aspect.
   // Sample the SAME world points in actual render-target pixels in 3D.
   const sample=(image,x,y)=>sampleNdc(image,mode3d?x*image.height/image.width:x,y);
   const id='shared-light-'+String(mode3d),frame=VfFrame.mount(host,{id,containerKind:'viewport',frameless:true});frames.push(frame);
   Object.assign(frame.root.style,{position:'relative',inset:'auto',width:'400px',height:'400px'});
   // Match ordinary retained UI ordering: toolbar mounts BEFORE initial draw.
   // An API-only recorder test would miss the permanently disabled button bug.
   const closeToolbar=mountCurrentPlotToolbar(frame,{frame:id,meshes:[{mode3d}]});toolbarDisposers.push(closeToolbar);
   const videoButton=frame.root.querySelector('[data-vf-toolbar-action="capture-video"]');
   const captureButton=frame.root.querySelector('[data-vf-toolbar-action="capture"]');
   const toolbarElement=frame.root.querySelector('.vf-plot-toolbar');
   need(videoButton?.disabled===true,'capture was enabled before an owned renderer existed');
   frame.root.addEventListener('vf-plot-toolbar-error',event=>errors.push(event.detail.message));
   function videoClick(){captureButton.click();need(!videoButton.disabled,'normal video control stayed disabled');videoButton.click();}

   let renderer;
   async function draw({emission=[1,.7,.3],ambient=0,wallZ=-.4,wallY=0,sourceX=-.7,sourceKind='quad',visible=true,parentX=0}={}){
    const before=renderer?Number(renderer._presentedFrameSequence||0):0;
    const floor=quad('floor',-.9,.9,-.9,.9,-.8,mode3d,[.5,.5,.5,1]);
    const wall=quad('wall',-.15,.05,-.3+wallY,.3+wallY,wallZ,mode3d,[.5,.5,.5,1]);
    const emitter=sourceKind==='quad'
      ?quad('emitter',sourceX-.04,sourceX+.04,-.04,.04,-.1,mode3d,[0,0,0,1],emission)
      :{id:'emitter',type:'field_mesh',kind:'field_mesh',mode3d,
        topology:sourceKind==='point'?'point-list':'line-list',render_mode:'marker_impostor',marker_space:'world',
        vertices:new Float32Array((sourceKind==='point'?[[sourceX,0,-.1]]:[[sourceX,-.05,-.1],[sourceX,.05,-.1]]).flatMap(p=>[...p,0,0,1,1,.7,.3,1])),
        indices:new Uint32Array(sourceKind==='point'?[0]:[0,1]),vertex_size:.04,edge_width:.04,
        emission,no_lighting:true,receives_lighting:false,casts_shadow:false,depth_write:true};
    emitter.visible=visible;
    if(parentX)emitter._modelMatrix=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,parentX,0,0,1]);
    VfDisplay.renderFromJson({geom:{[id]:{meshes:[floor,wall,emitter],lights:[],unified_renderer:true,background:[0,0,0,1],render_options:{ambient_level:ambient},
      camera:mode3d?{pos:[0,0,4],target:[0,0,-.8],up:[0,1,0],projection:'orthographic',ortho_scale:1}:null}}});
    await waitFor(()=>{
     renderer=renderers.find(r=>r._frameId===id&&r._running);
     const wanted=VfDisplay.__test.frameViewRecord(id)?.entries?.[0]?.ref?.mesh?.__vfFrameView;
     const presented=VfDisplay.getGeomFramePresentedView(id);
     return renderer?._device&&Number(renderer._presentedFrameSequence||0)>before&&wanted&&presented?.endpoint==='gpu-queue-completed'&&presented.serial>=wanted.serial&&JSON.stringify(presented.snapshot)===JSON.stringify(wanted.snapshot);
    },'current actual GPU frame did not complete');
    need(!renderer._runtimeError,String(renderer._runtimeError));
    if(!deviceListeners.has(renderer._device)){const listener=event=>errors.push(String(event.error?.message||event));deviceListeners.set(renderer._device,listener);renderer._device.addEventListener('uncapturederror',listener);}
    const image=await renderer._debugReadFrameTexture();
    if(mode3d){const c=renderer._getMesh().camera;need(c?.projection==='orthographic'&&c.ortho_scale===1&&c.pos[0]===0&&c.target[0]===0,'independent world-pixel oracle requires unchanged authored orthographic camera');}
    const current=renderer._getMesh(),part=current.parts.find(p=>p._authored_id==='emitter');
    const contributor=VfGeomWgpuUtil.resolveSceneLights([],current,0).find(l=>l.emission_owner===VfGeomWgpuUtil.lightingOwnerKey(part));
    return {behind:sample(image,.7,0),wall:sample(image,-.05,0),sourcePixel:sample(image,sourceX+parentX,0),
      instanceKind:part.instance_kind,visible:part.visible,contributor:contributor?{pos:contributor.pos,intensity:contributor.intensity}:null,
      imageSequence:renderer._presentedFrameSequence};
   }
   const dark=await draw({emission:[0,0,0]});
   await waitFor(()=>!videoButton.disabled,'first presentation did not refresh normal toolbar capability');
   videoClick();await waitFor(()=>toolbarElement.dataset.recording==='true','normal toolbar did not start recorder');
   const blocked=await draw();
   const allocatedShadowTexture=renderer._shadowDepthTex0;
   videoClick();await waitFor(()=>toolbarElement.dataset.recording==='false','normal toolbar did not stop/download recorder');
   need(errors.length===0,'normal toolbar recording error');
   const clear=await draw({wallY:.7});
   const below=await draw({wallZ:-.9});
   const moved=await draw({sourceX:.2});
   const ambientLow=await draw({emission:[0,0,0],ambient:.1});
   const ambientHigh=await draw({emission:[0,0,0],ambient:.4});
   // Reuse this renderer AND its allocated target: a zero-light frame detaches
   // the active view; the next emissive frame must restore a real shadow map.
   need(allocatedShadowTexture&&renderer._shadowDepthTex0===allocatedShadowTexture&&!renderer._shadowDepthView0,
     'inactive lighting did not retain texture and detach active shadow view');
   const reactivated=await draw({wallY:.7});
   need(renderer._shadowDepthTex0===allocatedShadowTexture&&renderer._shadowDepthView0,
     'reactivated lighting lost its reused active shadow target');
   need(reactivated.behind>dark.behind+4&&Math.abs(reactivated.behind-clear.behind)<3,
     'zero-to-emissive reactivation did not restore incident pixels');
   const reblocked=await draw();
   need(reblocked.wall>dark.wall+4&&reblocked.behind<reactivated.behind-4,
     'reactivated shadow target did not retain facing wall illumination and blocking');
   need(dark.behind<3,'ambient0/emission0 receiver is not dark');
   need(blocked.wall>dark.wall+4,'wall below light did not receive emitted incident light');
   need(clear.behind>blocked.behind+4,'finite wall did not block the receiver behind it');
   need(below.behind>blocked.behind+4,'wall layer-depth movement did not clear its shadow');
   need(moved.behind>blocked.behind+4,'emitter movement did not update lit receiver');
   need(ambientLow.behind>dark.behind+4&&ambientHigh.behind>ambientLow.behind+4,'ambient zero/low/high did not change unlit fill');
   const instanceRows=[];
   for(const sourceKind of ['point','line']){
    const hidden=await draw({sourceKind,visible:false,wallY:.7});
    const shown=await draw({sourceKind,wallY:.7});
    const movedObject=await draw({sourceKind,sourceX:.2,wallY:.7});
    const movedParent=await draw({sourceKind,parentX:.9,wallY:.7});
    const zero=await draw({sourceKind,emission:[0,0,0],wallY:.7});
    need(shown.instanceKind===sourceKind+'-impostor','normal field ADD did not use point/line instances');
    need(hidden.visible===false&&!hidden.contributor&&hidden.behind<3,'hidden normal ADD source still illuminates/draws');
    need(shown.contributor&&Math.abs(shown.contributor.pos[0]+.7)<2e-6&&Math.abs(shown.contributor.pos[2]+.1)<2e-6,'normal ADD contributor used template geometry');
    need(shown.sourcePixel>hidden.sourcePixel+4&&shown.behind>hidden.behind+4,'normal visible false->true did not update geometry and incident pixels');
    need(movedObject.contributor&&Math.abs(movedObject.contributor.pos[0]-.2)<2e-6&&movedObject.behind>shown.behind+4,'normal object movement did not move actual contributor/pixels');
    need(movedParent.contributor&&Math.abs(movedParent.contributor.pos[0]-.2)<2e-6&&Math.abs(movedParent.behind-movedObject.behind)<3,'normal parent movement lost/doubled on geometry or source');
    need(!zero.contributor&&zero.behind<3,'normal zero material kept incident power');
    instanceRows.push({sourceKind,hidden,shown,movedObject,movedParent,zero});
   }
   async function legacyVariation(gain){
    const before=Number(renderer._presentedFrameSequence||0);
    const material=quad('legacy-base',-.9,.9,-.9,.9,-.8,mode3d,[1,1,1,1]);
    material.no_lighting=true;material.receives_lighting=false;material.emissivity=gain;
    for(let i=0;i<4;i++){const c=(i===0||i===3)?.2:.6;for(let k=0;k<3;k++)material.vertices[i*10+6+k]=c;}
    VfDisplay.renderFromJson({geom:{[id]:{meshes:[material],lights:[],unified_renderer:true,background:[0,0,0,1],render_options:{ambient_level:0},
      camera:mode3d?{pos:[0,0,4],target:[0,0,-.8],up:[0,1,0],projection:'orthographic',ortho_scale:1}:null}}});
    await waitFor(()=>{
     const wanted=VfDisplay.__test.frameViewRecord(id)?.entries?.[0]?.ref?.mesh?.__vfFrameView,presented=VfDisplay.getGeomFramePresentedView(id);
     return Number(renderer._presentedFrameSequence||0)>before&&wanted&&presented?.endpoint==='gpu-queue-completed'&&presented.serial>=wanted.serial&&JSON.stringify(presented.snapshot)===JSON.stringify(wanted.snapshot);
    },'legacy material frame did not complete');
    const image=await renderer._debugReadFrameTexture();return {left:sample(image,-.6,0),right:sample(image,.6,0)};
   }
   const legacyBase=await legacyVariation(0),legacyGain=await legacyVariation(.5);
   const leftRatio=legacyGain.left/legacyBase.left,rightRatio=legacyGain.right/legacyBase.right;
   need(Math.abs(leftRatio-1.5)<.05&&Math.abs(rightRatio-1.5)<.05,'scalar emissivity no longer multiplies each actual fragment base colour');
   // Same current unified renderer, captured through the product recorder's
   // frame API. This small control is not the requested authored proof video.
   function canvasImage(canvas){return {width:canvas.width,height:canvas.height,pixels:canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data};}
   function imageHash(image){let h=2166136261;for(const byte of image.pixels)h=Math.imul(h^byte,16777619);return h>>>0;}
   need(VfDisplay.canCaptureGeomFrame(id),'owned unified capture capability missing');
   const captured=await VfDisplay.captureGeomFrameCanvasAsync(id),direct=await renderer._debugReadFrameTexture();
   need(captured&&captured.width===direct.width&&captured.height===direct.height,'capture lost current entry dimensions/DPR');
   need(captured.__vfCaptureView?.endpoint==='gpu-queue-completed','capture has no completed view identity');
   const capturedImage=canvasImage(captured);
   need(Math.abs(sample(capturedImage,-.6,0)-sample(direct,-.6,0))<3&&Math.abs(sample(capturedImage,.6,0)-sample(direct,.6,0))<3,'product capture did not copy current renderer pixels');
   const captureRow={width:captured.width,height:captured.height,view:captured.__vfCaptureView,hash:imageHash(capturedImage)};
   if(mode3d){
    let navigated=null;
    need(VfDisplay.updateGeomFrameCamera(id,{pos:[.4,0,4],target:[.4,0,-.8],up:[0,1,0],projection:'orthographic',ortho_scale:.8},{afterPresented:view=>{navigated=view;}}),'real camera update rejected');
    await waitFor(()=>navigated,'navigation did not complete');
    const movedCapture=await VfDisplay.captureGeomFrameCanvasAsync(id);
    need(movedCapture&&movedCapture.__vfCaptureView.serial>=navigated.serial,'capture reused old navigation view');
    captureRow.navigationHash=imageHash(canvasImage(movedCapture));
    need(captureRow.navigationHash!==captureRow.hash,'actual navigation did not change product capture pixels');
   }
   rows.push({mode3d,dark,blocked,clear,below,moved,ambientLow,ambientHigh,reactivated,reblocked,instanceRows,legacyBase,legacyGain,leftRatio,rightRatio,captureRow});
   closeToolbar();VfDisplay.disposeGeomFrame(id);frame.root.remove();
  }
  need(errors.length===0,'GPU errors');
  return {status:'PASS_NORMAL_SHARED_EMISSION_LAYER_WALL_AMBIENT_PIXELS_ONLY',rows,scope:'Small current normal renderer only; VKF/formatter compilation, EX01 population, native/deployed and frame<10ms remain separate'};
 }finally{
  for(const close of toolbarDisposers)close();
  for(const frame of frames)VfDisplay.disposeGeomFrame(frame.root.getAttribute('data-vf-frame-id'));
  for(const renderer of renderers)renderer.destroy();
  for(const [device,listener] of deviceListeners)device.removeEventListener('uncapturederror',listener);
  host.remove();window.VfGeomWgpu=Original;
 }
}
