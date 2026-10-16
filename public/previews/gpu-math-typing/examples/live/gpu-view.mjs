import {createScreenSpaceSimplexRenderer} from '/vf-ui/geom/vf-screen-simplex-renderer.mjs';
export async function createGPUView(canvas){
 const adapter=await navigator.gpu?.requestAdapter();
 if(!adapter)throw Error('This player requires WebGPU');
 const device=await adapter.requestDevice();
 const size=Math.max(1,Math.ceil(canvas.clientWidth*(globalThis.devicePixelRatio||1)));
 const renderer=createScreenSpaceSimplexRenderer(canvas,{device,alphaMode:'opaque',opaqueGeometry:true,pixelRatio:()=>1,backend:'webgpu',clearColor:{r:9/255,g:17/255,b:22/255,a:1}});
 try{await renderer.initialize();renderer.resize(size,size);}catch(error){device.destroy();throw error;}
 return {
  device,get size(){return canvas.width;},
  resize(size){renderer.resize(size,size);},
  draw(scene){renderer.setResidentVertices(scene.vertices,scene.vertexCount);},
  captureFrame(options){return renderer.captureFrame(options);},
  destroy(){renderer.destroy();device.destroy();},
  backend:'WebGPU',presentation:'Compiled VKF GPU geometry'
 };
}
