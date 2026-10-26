// Generic VKF presentation of resident xyz/RGBA triangle buffers.
// Geometry and interpolation belong to compiled VKF kernels, not this renderer.
export async function createResidentMeshRenderer(canvas,{device}={}) {
 if(!device)throw Error('A shared WebGPU device is required');
 const context=canvas.getContext('webgpu'),format=navigator.gpu.getPreferredCanvasFormat();
 const uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 const module=device.createShaderModule({code:`
 struct Camera { yaw:f32, pitch:f32, scale:f32, aspect:f32 }
 @group(0) @binding(0) var<uniform> camera:Camera;
 struct Output { @builtin(position) position:vec4f, @location(0) color:vec4f }
 @vertex fn vertexMain(@location(0) point:vec3f,@location(1) color:vec4f)->Output {
   let c=cos(camera.yaw);let s=sin(camera.yaw);
   let p=vec3f(c*point.x+s*point.z,point.y,-s*point.x+c*point.z);
   let cp=cos(camera.pitch);let sp=sin(camera.pitch);
   let q=vec3f(p.x,cp*p.y-sp*p.z,sp*p.y+cp*p.z);
   var output:Output;
   output.position=vec4f(q.x*camera.scale/camera.aspect,q.y*camera.scale,0.5-q.z*0.12,1.0);
   output.color=color;return output;
 }
 @fragment fn fragmentMain(input:Output)->@location(0) vec4f { return input.color; }
 `});
 const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vertexMain',buffers:[{arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x4'}]}]},fragment:{module,entryPoint:'fragmentMain',targets:[{format}]},primitive:{topology:'triangle-list',cullMode:'none'},multisample:{count:4},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});
 const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
 let color,depth,buffer=null,count=0,width=0,height=0,dead=false;
 let camera={yaw:.5,pitch:-.55,scale:.7};
 function updateCamera(){device.queue.writeBuffer(uniform,0,new Float32Array([camera.yaw,camera.pitch,camera.scale,width/height]));}
 function draw(){
  if(dead)throw Error('Renderer disposed');
  const encoder=device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:[{view:color.createView(),resolveTarget:context.getCurrentTexture().createView(),clearValue:{r:9/255,g:17/255,b:22/255,a:1},loadOp:'clear',storeOp:'discard'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'discard'}});
  if(buffer&&count){pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.setVertexBuffer(0,buffer);pass.draw(count);}
  pass.end();device.queue.submit([encoder.finish()]);
 }
 function resize(w,h=w){
  if(dead)throw Error('Renderer disposed');
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)throw Error('Invalid viewport');
  width=w;height=h;canvas.width=w;canvas.height=h;
  context.configure({device,format,alphaMode:'opaque',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});
  color?.destroy();depth?.destroy();
  color=device.createTexture({size:[w,h],format,sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT});
  depth=device.createTexture({size:[w,h],format:'depth24plus',sampleCount:4,usage:GPUTextureUsage.RENDER_ATTACHMENT});
  updateCamera();
 }
 return {
  resize,
  clear(){buffer=null;count=0;},
  setCamera(next,redraw=true){if(Object.values(next).some(x=>!Number.isFinite(x)))throw Error('Invalid camera');camera={...camera,...next};updateCamera();if(redraw)draw();},
  setResidentVertices(next,n){if(!next||!Number.isInteger(n)||n<0||n%3||next.size<n*28)throw Error('Invalid resident mesh');buffer=next;count=n;draw();},
  async captureFrame({timestamp,duration}){
   if(!Number.isSafeInteger(timestamp)||timestamp<0||!Number.isSafeInteger(duration)||duration<=0)throw Error('Invalid capture timing');
   const frameWidth=width,frameHeight=height;
   const stride=Math.ceil(frameWidth*4/256)*256,readback=device.createBuffer({size:stride*frameHeight,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
   try{const encoder=device.createCommandEncoder();encoder.copyTextureToBuffer({texture:context.getCurrentTexture()},{buffer:readback,bytesPerRow:stride,rowsPerImage:frameHeight},[frameWidth,frameHeight]);device.queue.submit([encoder.finish()]);await readback.mapAsync(GPUMapMode.READ);const frame=new VideoFrame(readback.getMappedRange(),{format:format.startsWith('bgra')?'BGRA':'RGBA',codedWidth:frameWidth,codedHeight:frameHeight,layout:[{offset:0,stride}],timestamp,duration});readback.unmap();return frame;}finally{readback.destroy();}
  },
  destroy(){if(dead)return;dead=true;color?.destroy();depth?.destroy();uniform.destroy();buffer=null;}
 };
}
