import {createScreenSpaceSimplexRenderer} from '/vf-ui/geom/vf-screen-simplex-renderer.mjs';
// Native VKF supplies triangles in a fixed logical viewport. The existing VKF
// renderer owns GPU rasterization and antialiasing at the output pixel density.
export async function createGPUView(canvas){
 const extent=1024;
 const size=Math.max(1,Math.ceil(canvas.clientWidth*(globalThis.devicePixelRatio||1)));
 const renderer=createScreenSpaceSimplexRenderer(canvas,{pixelRatio:()=>1,backend:'webgl2'});
 await renderer.initialize();renderer.resize(size,size);
 const background=[];
 for(const [x,y] of [[0,0],[extent,0],[extent,extent],[0,0],[extent,extent],[0,extent]])background.push(x,y,9/255,17/255,22/255,1);
 return {
  draw(frame){
   if(!frame.vertices||frame.vertices.length%18)throw Error('Native VKF returned invalid triangles');
   const packed=new Float32Array(background.length+frame.vertices.length);
   packed.set(background);packed.set(frame.vertices,background.length);
   const size=canvas.width;for(let i=0;i<packed.length;i+=6){packed[i]*=size/extent;packed[i+1]*=size/extent;}
   renderer.resize(size,size);renderer.setPackedVertices(packed);
  },
  destroy(){renderer.destroy();},
  backend:renderer.backend==='webgl2'?'WebGL2':'WebGPU',
  presentation:'VKF screen-space simplex renderer'
 };
}
