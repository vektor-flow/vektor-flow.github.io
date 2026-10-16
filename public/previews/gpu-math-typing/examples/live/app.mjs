import {createGPUView} from './gpu-view.mjs';
import {createSceneMediaCapture,downloadCapturedMedia} from '/vf-ui/vf-media-capture.mjs';
const $=id=>document.getElementById(id),canvas=$('view');
const settings=()=>({mode:Number($('mode').value),start:$('start').checked,end:$('end').checked});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let renderer,scene,wanted=0,pumping=false,epoch=0,cache=new Map(),job=null,last=null,url=null;
function nativeScene(resolution,options){
 const worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'}),pending=new Map();let sequence=0;
 function fail(message){for(const {reject} of pending.values())reject(Error(message));pending.clear();}
 worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.type==='error'?p.reject(Error(data.message)):p.resolve(data);};
 worker.onerror=e=>fail(e.message);
 const call=(type,args={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,type,...args});});
 const ready=call('prepare',{resolution,...options});ready.catch(()=>{});
 return {resolution,ready,async sample(q){await ready;return call('sample',{coordinate:q});},dispose(){worker.terminate();fail('Calculation cancelled');}};
}
function show(data){
 renderer.draw(data.frame,data.resolution);last=data;$('position').value=data.coordinate.toFixed(2);$('coordinate').value=data.coordinate;
 window.morphingVerification={coordinate:data.coordinate,measure:data.frame.measure,resolution:data.resolution,...settings(),backend:renderer.backend};
}
async function pump(){
 if(pumping||job)return;pumping=true;const version=epoch;
 try{while(version===epoch&&!job){const q=wanted;$('status').textContent=`Calculating state ${q.toFixed(2)}…`;let data=cache.get(q);if(!data){data=await scene.sample(q);cache.set(q,data);}if(job)break;if(q!==wanted)continue;show(data);$('status').textContent=`State ${q.toFixed(2)} · area ${data.frame.measure.toFixed(4)}`;break;}}
 catch(e){if(version===epoch&&!job)$('status').textContent=e.message;}
 finally{pumping=false;if(version!==epoch)pump();}
}
function lock(active){for(const id of ['mode','start','end','quality','download'])$(id).disabled=active;$('cancel').hidden=!active;}
function stop(){if(!job)return;job.cancelled=true;job.exportScene?.dispose();job.capture?.cancel();$('play').textContent='Play';}
function check(current){if(current.cancelled||job!==current)throw Error('Cancelled');}
async function prepare(){stop();scene?.dispose();epoch++;cache=new Map();scene=nativeScene(32,settings());$('status').textContent='Preparing geometry…';pump();}
async function play({frameCount=97}={}){
 if(job){stop();return;}
 const current={cancelled:false};job=current;lock(true);$('play').textContent='Stop';
 try{
  const frames=[];for(let i=0;i<frameCount;i++){check(current);const q=2*i/(frameCount-1);$('status').textContent=`Preparing playback · ${i+1}/${frameCount} states`;let data=cache.get(q);if(!data){data=await scene.sample(q);cache.set(q,data);}frames.push(data);}
  check(current);$('status').textContent='Playing';const start=performance.now();
  for(let i=0;i<frames.length;i++){check(current);await pause(Math.max(0,start+i*1000/24-performance.now()));check(current);show(frames[i]);}
  $('status').textContent='Playback complete';wanted=2;window.morphingPlaybackVerification={frames:frames.length,backend:renderer.backend,native:true};
 }catch(e){$('status').textContent=current.cancelled?'Playback stopped':e.message;}
 finally{if(job===current){job=null;lock(false);$('play').textContent='Play';if(current.cancelled)pump();}}
}
async function exportMovie(overrides={}){
 if(job)return;
 const quality=$('quality').value==='1080'?{size:1080,resolution:192,fps:48,frames:193,bitrate:20000000}:{size:720,resolution:128,fps:30,frames:121,bitrate:12000000};
 const config={...quality,...overrides},current={cancelled:false};job=current;lock(true);$('coordinate').disabled=true;$('play').disabled=true;
 const saved=last,oldSize=canvas.width;let frames=[];
 try{
  current.exportScene=nativeScene(config.resolution,settings());await current.exportScene.ready;
  for(let i=0;i<config.frames;i++){check(current);$('status').textContent=`Preparing high-quality export · ${i+1}/${config.frames} states`;frames.push(await current.exportScene.sample(2*i/(config.frames-1)));}
  current.exportScene.dispose();current.exportScene=null;check(current);
  canvas.width=canvas.height=config.size;renderer.draw(frames[0].frame,config.resolution);
  class QualityRecorder extends MediaRecorder {constructor(stream,options){super(stream,{...options,videoBitsPerSecond:config.bitrate});}}
  current.capture=createSceneMediaCapture({fallbackCanvas:canvas,frameRate:config.fps,MediaRecorderClass:QualityRecorder});
  await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
  await current.capture.startMovie();check(current);$('status').textContent='Recording with VKF capture…';
  await pause(250);check(current);
  const start=performance.now();for(let i=0;i<frames.length;i++){check(current);await pause(Math.max(0,start+i*1000/config.fps-performance.now()));check(current);renderer.draw(frames[i].frame,config.resolution);await new Promise(requestAnimationFrame);}
  await pause(250);check(current);const blob=await current.capture.stopMovie();check(current);
  if(!blob?.size)throw Error('VKF capture returned no video frames. Please retry.');
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);const extension=blob.type.includes('mp4')?'mp4':'webm';
  downloadCapturedMedia({url,filename:`Morphing-${config.size}p-${config.fps}fps.${extension}`});
  window.morphingCaptureVerification={width:config.size,height:config.size,geometryResolution:config.resolution,fps:config.fps,preparedFrames:frames.length,bytes:blob.size,type:blob.type,api:'createSceneMediaCapture.startMovie/stopMovie',bitrate:config.bitrate};
  $('status').textContent='Video downloaded';
 }catch(e){$('status').textContent=current.cancelled?'Export cancelled':`Export failed: ${e.message}`;}
 finally{current.exportScene?.dispose();current.capture?.cancel();frames=[];canvas.width=canvas.height=oldSize;if(saved)show(saved);if(job===current)job=null;lock(false);$('coordinate').disabled=false;$('play').disabled=false;}
}
$('coordinate').oninput=()=>{stop();wanted=Number($('coordinate').value);pump();};
for(const id of ['mode','start','end'])$(id).onchange=prepare;
$('play').onclick=play;$('download').onclick=()=>exportMovie();$('cancel').onclick=()=>{stop();$('status').textContent='Cancelled';};
window.addEventListener('pagehide',()=>{stop();scene?.dispose();renderer?.destroy();if(url)URL.revokeObjectURL(url);});
// Local verification uses a short real capture; never enabled on the public site.
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('validation'))window.morphingTest={exportMovie,play,previewConfig:()=>({resolution:32}),exportConfig:()=>({resolution:192,size:1080,fps:48,frames:193})};
try{renderer=createGPUView(canvas);prepare();}catch(e){$('status').textContent=e.message;for(const id of ['play','download','coordinate'])$(id).disabled=true;}
