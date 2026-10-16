import {createCompiledFieldKernel,createFieldBuffer} from '/vf-ui/vf-compiled-field-runtime.mjs';
import {prepareLatexStates} from '../../latex-morph-layout.mjs';
const kernels=new WeakMap(),layouts=new WeakMap();
async function motionKernel(device){
 if(!kernels.has(device))kernels.set(device,(async()=>{const base=new URL('./compiled/examples/',import.meta.url);const [source,manifest]=await Promise.all([fetch(new URL('latex-motion.wgsl',base)).then(r=>{if(!r.ok)throw Error('LaTeX motion shader unavailable');return r.text();}),fetch(new URL('latex-motion.wgsl.json',base)).then(r=>r.json())]);return createCompiledFieldKernel(device,source,manifest);})());
 return kernels.get(device);
}
export async function prepareLatexGPU(device,{example,resources,extent,mode=1,smoothStart=true,smoothEnd=true}){
 let cache=layouts.get(resources.data);if(!cache){cache=new Map();layouts.set(resources.data,cache);}
 const key=JSON.stringify(example.sources);let layout=cache.get(key);
 if(!layout){layout=prepareLatexStates(example.sources,resources.data);if(cache.size>=16)cache.delete(cache.keys().next().value);cache.set(key,layout);}
 const kernel=await motionKernel(device),count=layout.instanceCount,groups=layout.groupCount;
 const params=createFieldBuffer(device,layout.params),values=createFieldBuffer(device,new Float32Array([0,1,2]));
 const vertices=[0,1].map(()=>createFieldBuffer(device,count*16,GPUBufferUsage.VERTEX)),errors=createFieldBuffer(device,count+1);
 const readback=device.createBuffer({size:4,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),passes=vertices.map(result=>kernel.bind({params,values,result,errors,count}));
 let current=0,busy=false,dead=false;
 return {
  space:'latex',flat:true,resolution:null,instanceCount:count,vertexCount:count*6,groupCount:groups,get vertices(){return vertices[current];},
  async sample(coordinate){
   if(dead||busy)throw Error('LaTeX scene unavailable');if(!Number.isFinite(coordinate)||coordinate<0||coordinate>2)throw Error('Coordinate outside state domain');
   busy=true;const start=performance.now();
   try{
    // Only this 32-byte header changes per frame. Atlas, glyph packets and
    // three-state group origins remain resident, shared with the LaTeX engine.
    device.queue.writeBuffer(params,0,new Float32Array([example.variant,coordinate,mode,smoothStart?1:0,smoothEnd?1:0,extent,count,groups]));
    const next=1-current,encoder=device.createCommandEncoder();encoder.clearBuffer(errors,count*4,4);passes[next].encode(encoder);encoder.copyBufferToBuffer(errors,count*4,readback,0,4);device.queue.submit([encoder.finish()]);await readback.mapAsync(GPUMapMode.READ);let failed;try{failed=new Uint32Array(readback.getMappedRange())[0];}finally{readback.unmap();}if(failed)throw Error('Compiled LaTeX motion rejected the state');current=next;
    return {coordinate,milliseconds:performance.now()-start,geometryReadbackBytes:0,instanceCount:count,groupCount:groups,frameUploadBytes:32,frameReadbackBytes:4,layoutPassesPerFrame:0};
   }finally{busy=false;}
  },
  dispose(){if(busy)throw Error('LaTeX scene is sampling');if(dead)return;dead=true;[params,values,...vertices,errors,readback].forEach(b=>b.destroy());}
 };
}
