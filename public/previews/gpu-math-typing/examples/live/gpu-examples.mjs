import {createCompiledFieldKernel,createFieldBuffer} from '/vf-ui/vf-compiled-field-runtime.mjs';

// This adapter schedules compiled VKF. Host code supplies input coordinates,
// selects a declared workload and presents the resulting resident triangles.
export async function prepareExampleGPU(device,{example,mode=1,smoothStart=true,smoothEnd=true,resolution=48}={}){
 if(!Number.isInteger(resolution)||resolution<8||resolution>128||![0,1].includes(mode)||!['surfaces','diagrams'].includes(example.kernel))throw Error('Invalid example configuration');
 const base=new URL('./compiled/examples/',import.meta.url),name=example.kernel;
 const [code,manifest]=await Promise.all([fetch(new URL(name+'.wgsl',base)).then(r=>{if(!r.ok)throw Error('Example shader unavailable');return r.text();}),fetch(new URL(name+'.wgsl.json',base)).then(r=>{if(!r.ok)throw Error('Example manifest unavailable');return r.json();})]);
 const kernel=await createCompiledFieldKernel(device,code,manifest);
 const count=example.kernel==='diagrams'?example.triangleCount.resolutionMultiplier*resolution+example.triangleCount.constant:2*resolution*resolution;
 if(!Number.isInteger(count)||count<1)throw Error('Invalid example geometry count');
 const params=createFieldBuffer(device,6),values=createFieldBuffer(device,new Float32Array([0,1,2]));
 const vertices=[0,1].map(()=>createFieldBuffer(device,count*21,GPUBufferUsage.VERTEX));
 const errors=createFieldBuffer(device,count+1),readback=device.createBuffer({size:4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
 const passes=vertices.map(result=>kernel.bind({params,values,result,errors,count}));
 let current=0,busy=false,dead=false;
 return {
  space:'mesh',flat:example.flat,cameraScale:example.kernel==='surfaces'?[.59,.48,.86,.80,.59,.84][example.variant]:.74,resolution,vertexCount:count*3,get vertices(){return vertices[current];},
  async sample(coordinate){
   if(dead||busy)throw Error('Example is unavailable');
   if(!Number.isFinite(coordinate)||coordinate<0||coordinate>2)throw Error('Coordinate outside state domain');
   busy=true;const start=performance.now();
   try{device.queue.writeBuffer(params,0,new Float32Array([example.variant,coordinate,mode,smoothStart?1:0,smoothEnd?1:0,resolution]));
    const next=1-current,encoder=device.createCommandEncoder();encoder.clearBuffer(errors,count*4,4);passes[next].encode(encoder);encoder.copyBufferToBuffer(errors,count*4,readback,0,4);device.queue.submit([encoder.finish()]);await readback.mapAsync(GPUMapMode.READ);
    let failed;try{failed=new Uint32Array(readback.getMappedRange())[0];}finally{readback.unmap();}
    if(failed)throw Error('Compiled VKF example rejected its geometry');current=next;
    return {coordinate,milliseconds:performance.now()-start,geometryReadbackBytes:0,vertexCount:count*3};
   }finally{busy=false;}
  },
  dispose(){if(busy)throw Error('Example is sampling');if(dead)return;dead=true;[params,values,...vertices,errors,readback].forEach(b=>b.destroy());}
 };
}
