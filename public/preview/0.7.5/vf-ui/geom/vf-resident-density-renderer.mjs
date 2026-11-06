// Native density composition transport. Colour laws execute only in supplied
// compiler-emitted VKF kernels. These shaders rasterize or copy channels.
export async function createResidentDensityRenderer(canvas,{device,densityKernels,maxResourceBytes=256*1024*1024}={}) {
 if(!device||!densityKernels||!['accumulate','resolve'].every(k=>typeof densityKernels[k]?.bind==='function'))throw Error('Native density kernels are required');
 if(!Number.isSafeInteger(maxResourceBytes)||maxResourceBytes<=0||maxResourceBytes>256*1024*1024)throw Error('Invalid density resource bound');
 const context=canvas.getContext('webgpu');if(!context)throw Error('WebGPU canvas unavailable');
 const format=navigator.gpu.getPreferredCanvasFormat(),uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 const raster=device.createShaderModule({code:`
 struct Camera { yaw:f32,pitch:f32,scale:f32,aspect:f32 }
 @group(0) @binding(0) var<uniform> camera:Camera;
 struct V { @builtin(position) position:vec4f,@location(0) color:vec4f }
 @vertex fn vertexMain(@location(0) point:vec3f,@location(1) color:vec4f)->V {
 var v:V;v.position=vec4f(point.x*camera.scale/camera.aspect,point.y*camera.scale,0.5,1);v.color=color;return v;
 }
 struct F { @location(0) density:vec4f,@location(1) coverage:vec4f }
 @fragment fn fragmentMain(v:V)->F {var f:F;f.density=v.color;f.coverage=vec4f(1);return f;}
 `});
 const maxBlend={operation:'max',srcFactor:'one',dstFactor:'one'};
 const rasterPipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:raster,entryPoint:'vertexMain',buffers:[{arrayStride:28,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x4'}]}]},fragment:{module:raster,entryPoint:'fragmentMain',targets:[{format:'rgba16float'},{format:'rgba8unorm',blend:{color:maxBlend,alpha:maxBlend}}]},primitive:{topology:'triangle-list',cullMode:'none'},multisample:{count:4}});
 const rasterGroup=device.createBindGroup({layout:rasterPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
 // Gather is deliberately a channel copy. No density/colour interpolation here.
 const gather=device.createShaderModule({code:`
 @group(0) @binding(0) var image:texture_2d<f32>;
 @group(0) @binding(1) var<storage,read> previous:array<vec4f>;
 @group(0) @binding(2) var<storage,read_write> values:array<f32>;
 @compute @workgroup_size(64) fn accumulateInput(@builtin(global_invocation_id) id:vec3u) {
 let size=textureDimensions(image);let i=id.x;if(i>=size.x*size.y){return;}
 let p=textureLoad(image,vec2i(vec2u(i%size.x,i/size.x)),0);let old=previous[i];
 for(var j=0u;j<4u;j++){values[8u*i+j]=old[j];values[8u*i+4u+j]=p[j];}
 }
 @compute @workgroup_size(64) fn resolveInput(@builtin(global_invocation_id) id:vec3u) {
 let size=textureDimensions(image);let i=id.x;if(i>=size.x*size.y){return;}
 let old=previous[i];for(var j=0u;j<4u;j++){values[5u*i+j]=old[j];}
 values[5u*i+4u]=textureLoad(image,vec2i(vec2u(i%size.x,i/size.x)),0).a;
 }
 `});
 const gatherPipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module:gather,entryPoint:'accumulateInput'}});
 const resolveGatherPipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module:gather,entryPoint:'resolveInput'}});
 const display=device.createShaderModule({code:`
 @group(0) @binding(0) var<storage,read> pixels:array<vec4f>;
 @group(0) @binding(1) var<uniform> size:vec4u;
 @vertex fn vertexMain(@builtin(vertex_index) i:u32)->@builtin(position) vec4f {
 let points=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));return vec4f(points[i],0,1);
 }
 @fragment fn fragmentMain(@builtin(position) p:vec4f)->@location(0) vec4f{return pixels[u32(p.y)*size.x+u32(p.x)];}
 `});
 const displayPipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:display,entryPoint:'vertexMain'},fragment:{module:display,entryPoint:'fragmentMain',targets:[{format}]},primitive:{topology:'triangle-list'}});
 const sizeUniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 const gpuErrors=[],onGpuError=e=>gpuErrors.push(e.error?.message??String(e));device.addEventListener('uncapturederror',onGpuError);
 let resources=[],layerMsaa,layer,coverageMsaa,coverage,sums,values,output,acceptedOutput,params,errors,diagnostics,accumulateJobs,resolveJob,width=0,height=0,dead=false,busy=false,scale=1,bytes=36,lineages=[];
 function alive(){if(dead)throw Error('Renderer disposed');}
 function release(){for(const r of resources)r.destroy();resources=[];}
 const texture=(w,h,fmt,samples)=>{const t=device.createTexture({size:[w,h],format:fmt,sampleCount:samples,usage:GPUTextureUsage.RENDER_ATTACHMENT|(samples===1?GPUTextureUsage.TEXTURE_BINDING:0)});resources.push(t);return t;};
 const storage=n=>{const b=device.createBuffer({size:n,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC});resources.push(b);return b;};
 function resize(w,h=w){
 alive();if(busy)throw Error('Density renderer is busy');
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>device.limits.maxTextureDimension2D||h>device.limits.maxTextureDimension2D)throw Error('Invalid density viewport');
 // 60 texture bytes + 32 sum + 32 gather + 32 candidate/accepted result + 4 errors per pixel.
 // Include diagnostics for at most 4096 lineages and final resolve.
 const required=w*h*160+36+4+4097*4;
 if(!Number.isSafeInteger(required)||required>maxResourceBytes||w*h*32>device.limits.maxStorageBufferBindingSize||w*h*32>device.limits.maxBufferSize)throw Error('Density renderer resource limit');
 release();width=w;height=h;bytes=required;canvas.width=w;canvas.height=h;
 context.configure({device,format,alphaMode:'premultiplied',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});
 layerMsaa=texture(w,h,'rgba16float',4);layer=texture(w,h,'rgba16float',1);
 coverageMsaa=texture(w,h,'rgba8unorm',4);coverage=texture(w,h,'rgba8unorm',1);
 sums=[storage(w*h*16),storage(w*h*16)];values=storage(w*h*32);output=storage(w*h*16);acceptedOutput=storage(w*h*16);
 params=storage(4);errors=storage((w*h+1)*4);
 diagnostics=device.createBuffer({size:4097*4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});resources.push(diagnostics);
 accumulateJobs=sums.map(result=>densityKernels.accumulate.bind({params,values,result,errors,count:w*h}));
 resolveJob=densityKernels.resolve.bind({params,values,result:output,errors,count:w*h});
 device.queue.writeBuffer(sizeUniform,0,new Uint32Array([w,h,0,0]));updateCamera();
 }
 function updateCamera(){if(width)device.queue.writeBuffer(uniform,0,new Float32Array([0,0,scale,width/height]));}
 function gatherInto(encoder,pipeline,image,previous){const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:image.createView()},{binding:1,resource:{buffer:previous}},{binding:2,resource:{buffer:values}}]});const pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(Math.ceil(width*height/64));pass.end();}
 async function renderLineages(next){
 alive();if(busy)throw Error('Density renderer is busy');if(!width)throw Error('Resize density renderer before drawing');
 if(!Array.isArray(next)||next.length>4096||next.some(x=>!x?.buffer||!Number.isInteger(x.count)||x.count<0||x.count%3||!Number.isSafeInteger(x.offset??0)||(x.offset??0)<0||(x.offset??0)%4||x.buffer.size<(x.offset??0)+x.count*28))throw Error('Invalid native density lineages');
 busy=true;try{
 const encoder=device.createCommandEncoder();encoder.clearBuffer(sums[0]);let current=0;
 // Even an empty packet clears coverage and displays a transparent frame.
 const packets=next.length?next:[{count:0}];
 for(let i=0;i<packets.length;i++){
 const packet=packets[i];const pass=encoder.beginRenderPass({colorAttachments:[{view:layerMsaa.createView(),resolveTarget:layer.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'discard'},{view:coverageMsaa.createView(),resolveTarget:coverage.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:i===0?'clear':'load',storeOp:'store'}]});
 if(packet.count){pass.setPipeline(rasterPipeline);pass.setBindGroup(0,rasterGroup);pass.setVertexBuffer(0,packet.buffer,packet.offset??0);pass.draw(packet.count);}pass.end();
 gatherInto(encoder,gatherPipeline,layer,sums[current]);encoder.clearBuffer(errors);accumulateJobs[1-current].encode(encoder);encoder.copyBufferToBuffer(errors,accumulateJobs[1-current].summaryOffset,diagnostics,i*4,4);current=1-current;
 }
 gatherInto(encoder,resolveGatherPipeline,coverage,sums[current]);encoder.clearBuffer(errors);resolveJob.encode(encoder);encoder.copyBufferToBuffer(errors,resolveJob.summaryOffset,diagnostics,packets.length*4,4);
 device.queue.submit([encoder.finish()]);await diagnostics.mapAsync(GPUMapMode.READ,0,(packets.length+1)*4);
 try{if(!new Uint32Array(diagnostics.getMappedRange(0,(packets.length+1)*4)).every(x=>x===0))throw Error('Native density kernel diagnostic');}finally{diagnostics.unmap();}
 alive();if(gpuErrors.length)throw Error('Native density WebGPU error: '+gpuErrors.join('; '));const acceptedEncoder=device.createCommandEncoder();acceptedEncoder.copyBufferToBuffer(output,0,acceptedOutput,0,width*height*16);device.queue.submit([acceptedEncoder.finish()]);displayAccepted();lineages=next;
 }finally{busy=false;}
 }
 function displayAccepted(){
 const displayEncoder=device.createCommandEncoder();
 const group=device.createBindGroup({layout:displayPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:acceptedOutput}},{binding:1,resource:{buffer:sizeUniform}}]});
 const pass=displayEncoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:'clear',storeOp:'store'}]});pass.setPipeline(displayPipeline);pass.setBindGroup(0,group);pass.draw(3);pass.end();device.queue.submit([displayEncoder.finish()]);
 }
 return{
 resize,setResidentLineages:renderLineages,
 clear(){return renderLineages([]);},
 setCamera(next,redraw=true){alive();if((next.yaw??0)!==0||(next.pitch??0)!==0||Object.entries(next).some(([k,v])=>!['yaw','pitch','scale'].includes(k)||!Number.isFinite(v))||(next.scale??scale)<=0)throw Error('Density material requires a finite orthographic camera');scale=next.scale??scale;updateCamera();if(redraw)return renderLineages(lineages);},
 captureBitmap(){alive();if(busy)throw Error('Density renderer is busy');if(!width)throw Error('Resize density renderer before capture');displayAccepted();return createImageBitmap(canvas);},
 statistics(){return{profile:'implicit-material-density-2d',width,height,explicitResourceBytes:bytes,maxResourceBytes,backend:'webgpu',layerFormat:'rgba16float',sumFormat:'native-f32',coverage:'MSAA4-union-max',colourLaw:'compiled-native-kernels'};},
 destroy(){if(dead)return;dead=true;device.removeEventListener('uncapturederror',onGpuError);release();uniform.destroy();sizeUniform.destroy();lineages=[];}
 };
}
