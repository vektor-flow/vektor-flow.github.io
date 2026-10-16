import {createGPUView} from './gpu-view.mjs';
import {prepareMorphingGPU} from './gpu-morphing.mjs';
import {prepareExampleGPU} from './gpu-examples.mjs';
import {prepareLatexGPU} from './gpu-latex.mjs';
import {createSceneMediaCapture,downloadCapturedMedia} from '/vf-ui/vf-media-capture.mjs';
const $=id=>document.getElementById(id),canvas=$('view');
const settings=()=>({mode:Number($('mode').value),smoothStart:$('start').checked,smoothEnd:$('end').checked});
let renderer,scene,wanted=0,pumping=false,epoch=0,job=null,last=null,url=null,closed=false;
let serial=Promise.resolve();
function exclusive(fn){const next=serial.then(fn);serial=next.catch(()=>{});return next;}
let examples=[];
const selected=()=>examples.find(e=>e.id===$('example').value);
const createScene=async(resolution,extent)=>{const example=selected();if(example.kernel==='latex')return prepareLatexGPU(renderer.device,{example,resources:await renderer.ensureLatex(),extent,...settings()});return example.kernel==='biological'?prepareMorphingGPU(renderer.device,{sceneURL:'./compiled/',shaderURL:'./compiled/shaders/',resolution,lattice:129,extent,example:example.variant,...settings()}):prepareExampleGPU(renderer.device,{example,resolution:resolution>32?64:40,...settings()});};
function show(data,source=scene){
 renderer.draw(source);last=data;$('position').value=data.coordinate.toFixed(2);$('coordinate').value=data.coordinate;
 window.morphingVerification={example:selected().id,...data,resolution:source.resolution,...settings(),backend:renderer.backend,presentation:renderer.presentation};
}
async function pump(){
 if(pumping||job||closed)return;pumping=true;let failed=false;
 try{await exclusive(async()=>{
  if(!scene||job||closed)return;
  const version=epoch;
  while(version===epoch&&!job&&!closed){const q=wanted;const data=await scene.sample(q);if(version!==epoch||job||closed)return;if(q!==wanted)continue;
   show(data);$('status').textContent=`State ${q.toFixed(2)}`+(data.measure===undefined?'':` · area ${data.measure.toFixed(4)}`);break;}
 });}catch(e){failed=true;$('status').textContent=e.message;}
 finally{pumping=false;if(!failed&&!job&&!closed&&scene&&last?.coordinate!==wanted)pump();}
}
function lock(active){for(const id of ['example','mode','start','end','quality','download'])$(id).disabled=active;$('cancel').hidden=!active;}
function stop(){if(job){job.cancelled=true;void job.capture?.cancel();} }
function check(current){if(closed||current.cancelled||job!==current)throw Error('Cancelled');}
async function prepare(){
 stop();window.morphingVerification=null;const example=selected();$('description').textContent=example.description;$('interaction').textContent=example.flat?'Choose a state or play the transition.':'Drag the view to rotate. Choose a state or play the transition.';const version=++epoch;$('status').textContent='Preparing GPU geometry…';
 try{await exclusive(async()=>{if(version!==epoch||closed)return;if(scene)renderer.release(scene);scene?.dispose();scene=null;scene=await createScene(32,renderer.size);last=null;});if(version===epoch)pump();}
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
   downloadCapturedMedia({url,filename:`Morphing-${selected().id}-${config.size}p-${config.fps}fps.webm`});
   window.morphingCaptureVerification={width:config.size,height:config.size,geometryResolution:exportScene.resolution,fps:config.fps,preparedFrames:config.frames,bytes:blob.size,type:blob.type,api:'createSceneMediaCapture.startFrameMovie',bitrate:config.bitrate};
   $('status').textContent='Video downloaded';
  }finally{await current.capture?.cancel();renderer.resize(oldSize);if(scene&&last)renderer.draw(scene);exportScene?.dispose();}
 });}catch(e){$('status').textContent=current.cancelled?'Export cancelled':`Export failed: ${e.message}`;}
 finally{if(job===current)job=null;lock(false);$('coordinate').disabled=false;$('play').disabled=false;}
}
$('coordinate').oninput=()=>{stop();wanted=Number($('coordinate').value);pump();};
for(const id of ['example','mode','start','end'])$(id).onchange=prepare;
$('play').onclick=()=>play();$('download').onclick=()=>exportMovie();$('cancel').onclick=stop;
window.addEventListener('pagehide',()=>{closed=true;stop();void exclusive(()=>{scene?.dispose();renderer?.destroy();if(url)URL.revokeObjectURL(url);});});
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('validation'))window.morphingTest={snapshot:async()=>{renderer.draw(scene);const frame=await renderer.captureFrame({timestamp:0,duration:1});try{const bitmap=await createImageBitmap(frame),target=document.createElement("canvas");target.width=frame.displayWidth;target.height=frame.displayHeight;target.getContext("2d").drawImage(bitmap,0,0);bitmap.close();const pixels=target.getContext("2d").getImageData(0,0,target.width,target.height).data;let ink=0,edgeInk=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i]+pixels[i+1]+pixels[i+2]>160){ink++;const pixel=i/4,x=pixel%target.width,y=Math.floor(pixel/target.width);if(x<2||y<2||x>=target.width-2||y>=target.height-2)edgeInk++;}}return {png:target.toDataURL(),ink,edgeInk};}finally{frame.close();}},exportMovie,play,sampleFrame:()=>last,previewConfig:()=>({resolution:32}),exportConfig:()=>({resolution:192,size:1080,fps:48,frames:193})};
try{examples=await fetch('../catalog.json').then(r=>{if(!r.ok)throw Error('Example library unavailable');return r.json();});for(const example of examples){const option=document.createElement('option');option.value=example.id;option.textContent=example.category+' · '+example.title;$('example').append(option);}const requested=new URLSearchParams(location.search).get('example');if(examples.some(e=>e.id===requested))$('example').value=requested;renderer=await createGPUView(canvas);await prepare();}catch(e){$('status').textContent=e.message;for(const id of ['play','download','coordinate'])$(id).disabled=true;}
