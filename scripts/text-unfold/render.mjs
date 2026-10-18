import {loadLatexResources,createLatexRenderer} from '/previews/gpu-math-typing/latex-gpu-renderer.mjs';
import {createSceneMediaCapture} from '/vf-ui/vf-media-capture.mjs';
const adapter=await navigator.gpu.requestAdapter({forceFallbackAdapter:true});
if(!adapter?.info.isFallbackAdapter||adapter.info.architecture!=='swiftshader')throw Error('Only SwiftShader capture is authorized');
const device=await adapter.requestDevice(),gpuErrors=[];device.addEventListener('uncapturederror',e=>gpuErrors.push(e.error.message));
const canvas=document.querySelector('canvas'),resources=await loadLatexResources(device);
const renderer=await createLatexRenderer(canvas,{device,resources});renderer.resize(1920,1080);
let clip,buffer;
window.loadClip=async name=>{
 clip=await fetch('/capture-data/'+name+'.json').then(r=>r.json());buffer?.destroy();
 buffer=device.createBuffer({size:clip.glyphs.length*64,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
 window.drawFrame(0);return {frames:clip.frames,fps:clip.fps,glyphs:clip.glyphs.length,groups:clip.groups.length};
};
window.drawFrame=index=>{
 const output=new Float32Array(clip.glyphs.length*16),width=clip.groups.length*4;
 clip.glyphs.forEach((glyph,i)=>{
  const group=clip.name==='letters'?glyph.character:glyph.word;
  const {anchor:[ax,ay],em}=clip.groups[group],at=index*width+group*4;
  // Presentation of native VKF output only: affine placement, no interpolation.
  const [dx,dy,sx,sy]=clip.values.slice(at,at+4),packet=[...glyph.packet];
  packet[0]=ax+(packet[0]-ax)*sx+dx*em;
  packet[1]=ay+(packet[1]-ay)*sy+dy*em;
  packet[2]*=sx;packet[3]*=sy;
  output.set(packet,i*16);
 });
 device.queue.writeBuffer(buffer,0,output);renderer.setResidentInstances(buffer,clip.glyphs.length);
 return {frame:index,finite:output.every(Number.isFinite)};
};
window.snapshot=async()=>{
 renderer.draw();
 const frame=await renderer.captureFrame({timestamp:0,duration:1});
 try{const bitmap=await createImageBitmap(frame),target=document.createElement('canvas');target.width=1920;target.height=1080;const ctx=target.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();const pixels=ctx.getImageData(0,0,1920,1080).data;let ink=0,edgeInk=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>160){ink++;const p=i/4,x=p%1920,y=Math.floor(p/1920);if(x<8||x>1911||y<8||y>1071)edgeInk++;}return {png:target.toDataURL(),ink,edgeInk};}finally{frame.close();}
};
window.exportClip=async()=>{
 const capture=createSceneMediaCapture({fallbackCanvas:canvas});
 try{
  const movie=await capture.startFrameMovie({width:1920,height:1080,frameRate:clip.fps,bitrate:16000000,hardwareAcceleration:'prefer-software'});
  for(let i=0;i<clip.frames;i++){
   window.drawFrame(i);const frame=await renderer.captureFrame({timestamp:Math.round(i*1e6/clip.fps),duration:Math.round(1e6/clip.fps)});
   try{await movie.addFrame(frame,i);}finally{frame.close();}
   if(i%120===0)console.log('capture',clip.name,i);
  }
  const blob=await movie.finish(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=clip.name+'.webm';a.click();
  if(gpuErrors.length)throw Error(gpuErrors.join('; '));
  return {frames:clip.frames,fps:clip.fps,bytes:blob.size,gpuErrors,softwareGPU:true,api:'createSceneMediaCapture.startFrameMovie'};
 }finally{await capture.cancel();}
};
window.ready=true;
