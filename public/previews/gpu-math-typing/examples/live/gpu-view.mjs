import {createScreenSpaceSimplexRenderer} from '/vf-ui/geom/vf-screen-simplex-renderer.mjs';
import {loadLatexResources,createLatexRenderer} from '../../latex-gpu-renderer.mjs';
import {createResidentMeshRenderer} from '/vf-ui/geom/vf-resident-mesh-renderer.mjs';
export async function createGPUView(canvas){
 const adapter=await navigator.gpu?.requestAdapter();
 if(!adapter)throw Error('This player requires WebGPU');
 const device=await adapter.requestDevice();
 const size=Math.max(1,Math.ceil(canvas.clientWidth*(globalThis.devicePixelRatio||1)));
 const renderer=createScreenSpaceSimplexRenderer(canvas,{device,alphaMode:'opaque',opaqueGeometry:true,pixelRatio:()=>1,backend:'webgpu',clearColor:{r:9/255,g:17/255,b:22/255,a:1}});
 try{await renderer.initialize();renderer.resize(size,size);}catch(error){device.destroy();throw error;}
 let mesh;try{mesh=await createResidentMeshRenderer(canvas,{device});}catch(error){renderer.destroy();device.destroy();throw error;}
 let latex=null,latexResources=null,latexPending=null;
 async function ensureLatex(){if(!latexPending)latexPending=(async()=>{const resource=await loadLatexResources(device);try{latex=await createLatexRenderer(canvas,{device,resources:resource});latexResources=resource;return resource;}catch(error){resource.release();latexPending=null;throw error;}})();return latexPending;}
 let active=renderer,space='screen',yaw=.5,pitch=-.55,drag=null,current=null;
 canvas.style.touchAction='none';
 const down=e=>{if(space!=='mesh'||current?.flat)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
 const move=e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.008;pitch=Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};mesh.setCamera({yaw,pitch});};
 const up=()=>{drag=null;};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 return {
  device,ensureLatex,get size(){return canvas.width;},
  resize(size){active.resize(size,size);},
  draw(scene){
   const next=scene.space||'screen';
   if(next!==space){space=next;active=next==='mesh'?mesh:next==='latex'?latex:renderer;active.resize(canvas.width,canvas.height);}
   if(next==='mesh'&&current!==scene)mesh.setCamera(scene.flat?{yaw:0,pitch:0,scale:.74}:{yaw,pitch,scale:scene.cameraScale||.6},false);
   current=scene;if(next==='latex')active.setResidentInstances(scene.vertices,scene.instanceCount);else active.setResidentVertices(scene.vertices,scene.vertexCount);
  },
  release(scene){if(current===scene){mesh.clear();latex?.clear();renderer.setPackedVertices(new Float32Array());current=null;}},
  captureFrame(options){return active.captureFrame(options);},
  destroy(){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);latex?.destroy();latexResources?.release();mesh.destroy();renderer.destroy();device.destroy();},
  backend:'WebGPU',presentation:'Compiled VKF GPU geometry'
 };
}
