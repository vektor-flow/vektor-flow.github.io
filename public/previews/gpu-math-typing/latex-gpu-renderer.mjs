import {createWebGLLatexRenderer} from './latex-webgl-renderer.mjs?v=153f3d554f83';
// Shared presentation of the LaTeX engine's existing 16-float glyph/rule ABI.
// Layout, matching and motion remain upstream; instance buffers are borrowed.
const resourceCache=new WeakMap();
const assetURL=name=>new URL(name,import.meta.url);
async function response(name){const r=await fetch(assetURL(name));if(!r.ok)throw Error(`LaTeX asset unavailable: ${name}`);return r;}

export async function loadLatexResources(device,{assets}={}){
 if(!device)throw Error('A shared WebGPU device is required');
 let variants=resourceCache.get(device);if(!variants){variants=new Map();resourceCache.set(device,variants);}
 const key=assets??null;let entry=variants.get(key);
 if(!entry){
  entry={references:0,promise:null};variants.set(key,entry);
  entry.promise=(async()=>{
   const [data,packed,shader]=await Promise.all([assets?Promise.resolve(assets.data):response('typing-data.json').then(r=>r.json()),assets?Promise.resolve(assets.pixels):response('atlas.rgba.gz').then(r=>r.arrayBuffer()),response('draw.wgsl').then(r=>r.text())]);
   const header=new Uint8Array(packed),pixels=header[0]===31&&header[1]===139?await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():packed;
   const [width,height]=data.atlasSize||[];
   if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||pixels.byteLength!==width*height*4)throw Error('LaTeX atlas dimensions do not match its pixels');
   let atlas;
   try{
    atlas=device.createTexture({label:'LaTeX engine atlas',size:[width,height],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
    device.queue.writeTexture({texture:atlas},pixels,{bytesPerRow:width*4},[width,height]);
    const sampler=device.createSampler({minFilter:'linear',magFilter:'linear'});
    return {device,data,shader,atlas,sampler};
   }catch(error){atlas?.destroy();throw error;}
  })();
 }
 let shared;
 try{shared=await entry.promise;}catch(error){if(variants.get(key)===entry)variants.delete(key);throw error;}
 entry.references++;
 let released=false;
 const release=()=>{if(released)return;released=true;if(--entry.references===0){shared.atlas.destroy();if(variants.get(key)===entry)variants.delete(key);}};
 return Object.freeze({...shared,get released(){return released;},release,destroy:release});
}

export async function createLatexRenderer(canvas,{device,resources,gl,assets,texture,composite=false,transparent=false}={}){
 if(gl)return createWebGLLatexRenderer(canvas,{gl,assets,texture,composite});
 if(!device||resources?.device!==device||resources.released)throw Error('Live LaTeX resources on the renderer device are required');
 const context=canvas.getContext('webgpu');if(!context)throw Error('WebGPU canvas unavailable');
 const format=navigator.gpu.getPreferredCanvasFormat();
 const module=device.createShaderModule({label:'Unmodified LaTeX engine draw.wgsl',code:resources.shader});
 // Keep the engine's shader, vertex interpretation and premultiplied blending.
 const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs',buffers:[{arrayStride:64,stepMode:'instance',attributes:[0,1,2,3].map(i=>({shaderLocation:i,offset:i*16,format:'float32x4'}))}]},fragment:{module,entryPoint:'fs',targets:[{format,blend:{color:{srcFactor:'one',dstFactor:'one-minus-src-alpha'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha'}}}]},primitive:{topology:'triangle-list'}});
 const uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 let group;
 try{group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}},{binding:1,resource:resources.atlas.createView()},{binding:2,resource:resources.sampler}]});}catch(error){uniform.destroy();throw error;}
 let width=0,height=0,buffer=null,count=0,dead=false;
 const alive=()=>{if(dead||resources.released)throw Error('LaTeX renderer or resources disposed');};
 function resize(w,h=w){
  alive();if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)throw Error('Invalid LaTeX viewport');
  width=w;height=h;canvas.width=w;canvas.height=h;
  context.configure({device,format,alphaMode:transparent?'premultiplied':'opaque',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});
  device.queue.writeBuffer(uniform,0,new Float32Array([w,h,0,0]));
 }
 function draw(){
  alive();if(!width||!height)throw Error('Resize the LaTeX renderer before drawing');
  const encoder=device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:transparent?{r:0,g:0,b:0,a:0}:{r:9/255,g:17/255,b:22/255,a:1},loadOp:'clear',storeOp:'store'}]});
  if(buffer&&count){pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.setVertexBuffer(0,buffer);pass.draw(6,count);}
  pass.end();device.queue.submit([encoder.finish()]);
 }
 return {
  backend:'webgpu',shaderIdentity:'draw.wgsl',instanceStride:64,resize,draw,
  clear(){alive();buffer=null;count=0;},
  setResidentInstances(next,n){alive();if(!next||!Number.isInteger(n)||n<0||next.size<n*64)throw Error('Invalid resident LaTeX instances');buffer=next;count=n;draw();},
  async captureFrame({timestamp,duration}){
   alive();if(!Number.isSafeInteger(timestamp)||timestamp<0||!Number.isSafeInteger(duration)||duration<=0)throw Error('Invalid capture timing');
   const frameWidth=width,frameHeight=height;
   if(!frameWidth||!frameHeight)throw Error('Resize the LaTeX renderer before capture');
   const stride=Math.ceil(frameWidth*4/256)*256;
   const readback=device.createBuffer({size:stride*frameHeight,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
   try{
    const encoder=device.createCommandEncoder();encoder.copyTextureToBuffer({texture:context.getCurrentTexture()},{buffer:readback,bytesPerRow:stride,rowsPerImage:frameHeight},[frameWidth,frameHeight]);device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const frame=new VideoFrame(readback.getMappedRange(),{format:format.startsWith('bgra')?'BGRA':'RGBA',codedWidth:frameWidth,codedHeight:frameHeight,layout:[{offset:0,stride}],timestamp,duration});
    readback.unmap();return frame;
   }finally{readback.destroy();}
  },
  destroy(){if(dead)return;dead=true;buffer=null;count=0;uniform.destroy();context.unconfigure();}
 };
}
