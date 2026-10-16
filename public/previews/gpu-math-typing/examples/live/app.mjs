import {createGPUView} from './gpu-view.mjs';
import {prepareMorphingGPU} from './gpu-morphing.mjs';
import {createSceneMediaCapture,downloadCapturedMedia} from '/vf-ui/vf-media-capture.mjs';
const $=id=>document.getElementById(id),canvas=$('view');
const settings=()=>({mode:Number($('mode').value),smoothStart:$('start').checked,smoothEnd:$('end').checked});
let renderer,scene,wanted=0,pumping=false,epoch=0,job=null,last=null,url=null,closed=false;
let serial=Promise.resolve();
function exclusive(fn){const next=serial.then(fn);serial=next.catch(()=>{});return next;}
const createScene=(resolution,extent)=>prepareMorphingGPU(renderer.device,{sceneURL:'./compiled/',shaderURL:'./compiled/shaders/',resolution,lattice:129,extent,...settings()});
function show(data,source=scene){
 renderer.draw(source);last=data;$('position').value=data.coordinate.toFixed(2);$('coordinate').value=data.coordinate;
 window.morphingVerification={...data,resolution:source.resolution,...settings(),backend:renderer.backend,presentation:renderer.presentation};
}
async function pump(){
 if(pumping||job||closed)return;pumping=true;let failed=false;
 try{await exclusive(async()=>{
  if(!scene||job||closed)return;
  const version=epoch;
  while(version===epoch&&!job&&!closed){const q=wanted;const data=await scene.sample(q);if(version!==epoch||job||closed)return;if(q!==wanted)continue;
   show(data);$('status').textContent=`State ${q.toFixed(2)} · area ${data.measure.toFixed(4)}`;break;}
 });}catch(e){failed=true;$('status').textContent=e.message;}
 finally{pumping=false;if(!failed&&!job&&!closed&&scene&&last?.coordinate!==wanted)pump();}
}
function lock(active){for(const id of ['mode','start','end','quality','download'])$(id).disabled=active;$('cancel').hidden=!active;}
function stop(){if(job){job.cancelled=true;void job.capture?.cancel();} }
function check(current){if(closed||current.cancelled||job!==current)throw Error('Cancelled');}
async function prepare(){
 stop();const version=++epoch;$('status').textContent='Preparing GPU geometry…';
 try{await exclusive(async()=>{if(version!==epoch||closed)return;scene?.dispose();scene=null;scene=await createScene(32,renderer.size);last=null;});if(version===epoch)pump();}
 catch(e){$('status').textContent=e.message;}
}
async function play({duration=4000}={}){
 if(job){stop();return;}
 const current={cancelled:false};job=current;lock(true);$('play').textContent='Stop';
 try{await exclusive(async()=>{
  check(current);if(!scene)throw Error('Scene is still preparing');let count=0;const start=performance.now();
  for(;;){check(current);const q=Math.min(2,2*(performance.now()-start)/duration);const data=await scene.sample(q);check(current);wanted=q;show(data);count++;
   if(q===2)break;await new Promise(requestAnimationFrame);}
  wanted=2;$('status').textContent='Playback complete';window.morphingPlaybackVerification={frames:count,backend:renderer.backend,geometryReadbackBytes:0};
 });}catch(e){$('status').textContent=current.cancelled?'Playback stopped':e.message;}
 finally{if(job===current){job=null;lock(false);$('play').textContent='Play';pump();}}
}
async function exportMovie(overrides={}){
 if(job||!scene||!last)return;
 const quality=$('quality').value==='1080'?{size:1080,resolution:192,fps:48,frames:193,bitrate:20000000}:{size:720,resolution:128,fps:30,frames:121,bitrate:12000000};
 const config={...quality,...overrides},current={cancelled:false};job=current;lock(true);$('coordinate').disabled=true;$('play').disabled=true;
 try{await exclusive(async()=>{
  const oldSize=renderer.size;let exportScene;
  try{
   check(current);$('status').textContent='Preparing export…';exportScene=await createScene(config.resolution,config.size);check(current);
   renderer.resize(config.size);current.capture=createSceneMediaCapture({fallbackCanvas:canvas});
   const movie=await current.capture.startFrameMovie({width:config.size,height:config.size,frameRate:config.fps,bitrate:config.bitrate});
   for(let i=0;i<config.frames;i++){
    check(current);$('status').textContent=`Exporting frame ${i+1}/${config.frames}`;
    await exportScene.sample(2*i/(config.frames-1));check(current);renderer.draw(exportScene);
    const frame=await renderer.captureFrame({timestamp:Math.round(i*1e6/config.fps),duration:Math.round(1e6/config.fps)});
    try{check(current);await movie.addFrame(frame,i);}finally{frame.close();}
   }
   check(current);const blob=await movie.finish();check(current);if(!blob.size)throw Error('Capture returned an empty video');
   if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);
   downloadCapturedMedia({url,filename:`Morphing-${config.size}p-${config.fps}fps.webm`});
   window.morphingCaptureVerification={width:config.size,height:config.size,geometryResolution:config.resolution,fps:config.fps,preparedFrames:config.frames,bytes:blob.size,type:blob.type,api:'createSceneMediaCapture.startFrameMovie',bitrate:config.bitrate};
   $('status').textContent='Video downloaded';
  }finally{await current.capture?.cancel();if(scene&&last)renderer.draw(scene);renderer.resize(oldSize);exportScene?.dispose();}
 });}catch(e){$('status').textContent=current.cancelled?'Export cancelled':`Export failed: ${e.message}`;}
 finally{if(job===current)job=null;lock(false);$('coordinate').disabled=false;$('play').disabled=false;}
}
$('coordinate').oninput=()=>{stop();wanted=Number($('coordinate').value);pump();};
for(const id of ['mode','start','end'])$(id).onchange=prepare;
$('play').onclick=()=>play();$('download').onclick=()=>exportMovie();$('cancel').onclick=stop;
window.addEventListener('pagehide',()=>{closed=true;stop();void exclusive(()=>{scene?.dispose();renderer?.destroy();if(url)URL.revokeObjectURL(url);});});
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('validation'))window.morphingTest={exportMovie,play,sampleFrame:()=>last,previewConfig:()=>({resolution:32}),exportConfig:()=>({resolution:192,size:1080,fps:48,frames:193})};
try{renderer=await createGPUView(canvas);await prepare();}catch(e){$('status').textContent=e.message;for(const id of ['play','download','coordinate'])$(id).disabled=true;}
