// Sole actual browser control. e1877 source-only has NOT executed this file.
// Import the function in the existing actual driver and page.evaluate it.
export async function boundedRendererControl(){
 const need=(v,m)=>{if(!v)throw Error(m);};
 const {createSharedAreaRenderer}=await import('/preview/0.7.5/vf-ui/native-labels/vf-shared-area-renderer.mjs');
 const canvas=document.createElement('canvas');canvas.style.cssText='width:16px;height:12px';document.body.append(canvas);
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true});need(gl,'WEBGL2');
 const originals={},buffers=new Map();let bound=null,peakBuffers=0,peakGPUBytes=0,renderer,pixelRatio=1;
 for(const name of ['createBuffer','deleteBuffer','bindBuffer','bufferData'])originals[name]=gl[name].bind(gl);
 gl.createBuffer=()=>{const b=originals.createBuffer();buffers.set(b,0);peakBuffers=Math.max(peakBuffers,buffers.size);return b;};
 gl.deleteBuffer=b=>{buffers.delete(b);return originals.deleteBuffer(b);};
 gl.bindBuffer=(target,b)=>{if(target===gl.ARRAY_BUFFER)bound=b;return originals.bindBuffer(target,b);};
 gl.bufferData=(target,data,usage)=>{if(target===gl.ARRAY_BUFFER&&bound){buffers.set(bound,typeof data==='number'?data:data.byteLength);peakGPUBytes=Math.max(peakGPUBytes,[...buffers.values()].reduce((a,b)=>a+b,0));}return originals.bufferData(target,data,usage);};
 const input=(resource,tx)=>({commands:[['M',0,0],['L',1.2,0],['L',1.2,1.2],['L',0,1.2],['Z']],matrix:[1,0,0,1,tx,3],provenance:{engineIdentity:'actual-browser-control',resourceIdentity:resource,source:'square',elementId:resource}});
 const good=[input('first',3),input('second',5)];let current=good;
 const scene={groups:new Map(),frame(){throw Error('UNQUALIFIED_PATH_MUST_NOT_RUN');},nativeSourceOutlines(c){return current.map(o=>{const m=o.matrix;return {...o,matrix:[c[0]*m[0]+c[2]*m[1],c[1]*m[0]+c[3]*m[1],c[0]*m[2]+c[2]*m[3],c[1]*m[2]+c[3]*m[3],c[0]*m[4]+c[2]*m[5]+c[4],c[1]*m[4]+c[3]*m[5]+c[5]]};});}};
 const readback=()=>{gl.finish();const bytes=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,bytes);need(gl.getError()===gl.NO_ERROR,'GPU_ERROR');return bytes;};
 const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
 const originalCamera=[1,0,0,1,0,0],nextCamera=[1,0,0,1,1,0];let report;
 try{
  renderer=createSharedAreaRenderer(canvas,{pixelRatio:()=>pixelRatio,nativeAccuracy:'required',nativeAccuracyLimits:{maxEntries:3,maxNewPixels:64}});await renderer.initialize();renderer.resize(16,12);
  renderer.setNativeScene(scene,originalCamera);const accepted=JSON.stringify(renderer.nativeSourceSnapshot()),pixels=readback();need(pixels.some(v=>v),'NONBLANK');
  need(renderer.nativeStatistics().nativeAccuracy.pinnedEntries===0,'PINS_RELEASED');
  // Failure occurs AFTER the first current outline has submitted offscreen.
  const wide={...input('wide',3),commands:[['M',0,0],['L',100,0],['L',100,100],['L',0,100],['Z']]};current=[good[0],wide];
  let refused=false;try{renderer.setNativeCamera(nextCamera);}catch(e){refused=e.code==='NATIVE_SAMPLE_PIXEL_BUDGET';}need(refused,'LATE_PIXEL_BUDGET_REFUSAL');
  need(JSON.stringify(renderer.nativeSourceSnapshot())===accepted&&equal(readback(),pixels),'FAILED_SUBMISSION_RETAINS_FULL_RGBA_AND_SOURCE');
  need(JSON.stringify(renderer.nativeStatistics().camera)===JSON.stringify(originalCamera),'FAILED_SUBMISSION_RETAINS_CAMERA');
  refused=false;try{renderer.resize(18,14);}catch(e){refused=e.code==='NATIVE_SAMPLE_PIXEL_BUDGET';}need(refused,'LATE_RESIZE_REFUSAL');
  need(canvas.width===16&&canvas.height===12&&equal(readback(),pixels)&&JSON.stringify(renderer.nativeSourceSnapshot())===accepted,'FAILED_RESIZE_RETAINS_FRAME');
  current=good;renderer.setNativeCamera(nextCamera);need(JSON.stringify(renderer.nativeStatistics().camera)===JSON.stringify(nextCamera),'RECOVERY_CURRENT_CAMERA');need(!equal(readback(),pixels),'RECOVERY_CHANGED_RGBA');
  renderer.setNativeColor([.9,.1,.2,1]);need(renderer.nativeSourceSnapshot().sources.every(s=>JSON.stringify(s.color)==='[0.9,0.1,0.2,1]'),'CURRENT_COLOR_SNAPSHOT');readback();
  pixelRatio=2;renderer.resize(16,12);need(renderer.nativeSourceSnapshot().receipt.pixelRatio===2,'DPR_INVALIDATION');readback();
  need(peakBuffers===1&&peakGPUBytes<=134217728,'ONE_BOUNDED_GPU_BUFFER');
  report={status:'PASS_AFFECTED_ORDERED_STREAM_RENDERER',peakBuffers,peakGPUBytes,normalOriginal10000Qualified:false};
 }finally{renderer?.destroy();canvas.remove();for(const [name,fn]of Object.entries(originals))gl[name]=fn;need(buffers.size===0,'ALL_GPU_BUFFERS_DELETED');need(!canvas.isConnected,'CANVAS_REMOVED');}
 return report;
}
