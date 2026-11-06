import {createCompiledFieldKernel,createFieldBuffer} from '../vf-compiled-field-runtime.mjs';
const need=(v,c)=>{if(!v)throw Object.assign(Error(c),{code:c});};
const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
export async function createStateInterpolationGpu({device,libraryCommit,fetch:fetcher=globalThis.fetch,baseURL=new URL('../artifacts/state-interpolation/gpu/',import.meta.url),maxBytes=268435456,streaming=false}={}){
 need(device,'Native state interpolation requires WebGPU');
 const response=await fetcher(new URL('PROVENANCE.json',baseURL));need(response.ok,'STATE_GPU_PROVENANCE');const provenance=await response.json();need(provenance.libraryCommit===libraryCommit,'STATE_GPU_LIBRARY_CHANGED');
 const kernels={};
 for(const name of ['state','field','measure-chunk','measure','calibrate','render-controls','check-controls','check-boundary','presentation-contour']){
  const [code,json]=await Promise.all([name+'.wgsl',name+'.wgsl.json'].map(async file=>{const r=await fetcher(new URL(file,baseURL));need(r.ok,'STATE_GPU_RESOURCE');const bytes=await r.arrayBuffer();need(await digest(bytes)===provenance.artifacts[file].sha256,'STATE_GPU_RESOURCE_CHANGED');return new TextDecoder().decode(bytes);}));
  kernels[name]=await createCompiledFieldKernel(device,code,JSON.parse(json));
 }
 let bytes=0,closed=false;const buffers=new Set(),plans=new Set(),profiles=new Map(),errors=[];let computeTail=Promise.resolve();const serial=job=>{const next=computeTail.then(job);computeTail=next.catch(()=>{});return next;};
 const errorListener=e=>errors.push(e.error?.message??String(e));device.addEventListener('uncapturederror',errorListener);
 const allocate=(data,extra=0)=>{const n=typeof data==='number'?data*4:data.byteLength;need(Number.isSafeInteger(n)&&n>0&&bytes+n<=maxBytes,'STATE_GPU_MEMORY_BUDGET');const b=createFieldBuffer(device,data,extra);buffers.add(b);bytes+=b.size;return b;};
 const release=b=>{if(buffers.delete(b)){bytes-=b.size;b.destroy();}};
 const stage=n=>{need(n>0&&n<=16384,'STATE_GPU_READBACK_BOUND');return device.createBuffer({size:n,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});};
 async function read(b){await b.mapAsync(GPUMapMode.READ);try{return new Uint8Array(b.getMappedRange()).slice();}finally{b.unmap();b.destroy();}}
 function scratchFor(res,lattice,width,own){
  const key=res+':'+lattice,allocateScratch=streaming?allocate:own;let r=streaming?profiles.get(key):null;
  if(!r){const chunks=Math.ceil(res*res/8),cells=(lattice-1)**2;r={params:[allocateScratch(36),allocateScratch(36)],controlError:allocateScratch(37),measureResult:allocateScratch(chunks),measureError:allocateScratch(chunks+1),scalar:allocateScratch(1),scalarError:allocateScratch(2),field:allocateScratch(lattice*lattice),fieldError:allocateScratch(lattice*lattice+1),renderParams:allocateScratch(36),checkedParams:allocateScratch(36),boundaryError:allocateScratch(4*res+1),boundary:allocateScratch(4*res),vertices:allocateScratch(cells*72,GPUBufferUsage.VERTEX),vertexError:allocateScratch(cells+1)};if(streaming)profiles.set(key,r);}
  const required=(lattice*lattice+width)*4;if(!r.contourInput||r.contourInput.size<required){if(r.contourInput)release(r.contourInput);r.contourInput=allocateScratch(required/4);}return r;
 }
 async function createPlan(description){
  if(streaming)await computeTail;need(!closed,'STATE_GPU_CLOSED');const plan=description.plan,width=plan.curve.width;
  need(plan.dimension===2&&plan.size===65&&[4229,4233].includes(plan.stride)&&plan.curve.count===2&&(plan.curve.mode===0||(plan.curve.mode===1&&plan.curve.second.every(x=>x===0)))&&width===plan.carriers*plan.stride&&plan.curve.values.length===2*width&&plan.curve.second.length===2*width,'STATE_GPU_PLAN_PROFILE');
  const owned=[],own=(...args)=>{const b=allocate(...args);owned.push(b);return b;},res=description.resolution??65,lattice=description.lattice??129,chunks=Math.ceil(res*res/8),cells=(lattice-1)**2;
  need([65,129,257].includes(res)&&lattice===2*res-1,'STATE_GPU_RASTER_PROFILE');
  const input=own(new Float32Array([...plan.curve.values,...plan.curve.second])),values=own(width),stateError=own(width+1),scratch=scratchFor(res,lattice,width,own);
  let disposed=false;const live=()=>need(!closed&&!disposed,'STATE_GPU_PLAN_CLOSED');
  function dispatch(encoder,name,p,v,out,err,count,trace,offset){
   encoder.clearBuffer(err);
   const bound=kernels[name].bind({params:p,values:v,result:out,errors:err,count});bound.encode(encoder);
   encoder.copyBufferToBuffer(err,bound.summaryOffset,trace,offset,4);
  }
  function validate(raw){const words=new Uint32Array(raw.buffer,raw.byteOffset,raw.byteLength/4);if(!words.every(v=>v===0))throw Object.assign(Error('STATE_GPU_NATIVE_DIAGNOSTIC '+Array.from(words,(value,pass)=>value?{pass,value}:null).filter(Boolean).map(x=>JSON.stringify(x)).join(',')),{code:'STATE_GPU_NATIVE_DIAGNOSTIC'});need(!errors.length,'STATE_GPU_DEVICE_ERROR: '+errors.join('; '));}
  async function measureEndpoint(controls){
   const {params,controlError,measureResult,measureError,scalar,scalarError,field,contourInput,fieldError,renderParams,checkedParams,boundaryError,boundary,vertices,vertexError}=scratch;
   live();need(controls.length===36&&controls.every(Number.isFinite),'STATE_GPU_CONTROLS');device.queue.writeBuffer(params[0],0,new Float32Array(controls));
   const trace=stage(12),result=stage(4),encoder=device.createCommandEncoder();
   dispatch(encoder,'state',params[0],input,values,stateError,width,trace,0);
   dispatch(encoder,'measure-chunk',params[0],values,measureResult,measureError,chunks,trace,4);
   dispatch(encoder,'measure',params[0],measureResult,scalar,scalarError,1,trace,8);
   encoder.copyBufferToBuffer(scalar,0,result,0,4);device.queue.submit([encoder.finish()]);
   const [checks,raw]=await Promise.all([read(trace),read(result)]);validate(checks);const area=new Float32Array(raw.buffer)[0];need(Number.isFinite(area)&&area>0,'STATE_GPU_EMPTY_ENDPOINT');return area;
  }
  async function sample(controls){
   const {params,controlError,measureResult,measureError,scalar,scalarError,field,contourInput,fieldError,renderParams,checkedParams,boundaryError,boundary,vertices,vertexError}=scratch;
   live();need(controls.length===36&&controls.every(Number.isFinite),'STATE_GPU_CONTROLS');device.queue.writeBuffer(params[0],0,new Float32Array(controls));
   // Preserve every dispatch's native error summary, including early passes.
   const traceCount=1+48*2+4,trace=stage(traceCount*4),finalControls=stage(36*4),encoder=device.createCommandEncoder();let at=0,p=0;
   const run=(...args)=>{dispatch(encoder,...args,trace,at);at+=4;};
   run('state',params[0],input,values,stateError,width);
   for(let i=0;i<48;i++){
    run('measure-chunk',params[p],values,measureResult,measureError,chunks);
    run('calibrate',params[p],measureResult,params[1-p],controlError,36);p=1-p;
   }
   run('check-controls',params[p],input,checkedParams,controlError,36);
   run('check-boundary',checkedParams,values,boundary,boundaryError,4*res);
   run('render-controls',params[p],input,renderParams,controlError,36);
   run('field',renderParams,values,field,fieldError,lattice*lattice);
   
   // Grid and native carrier attributes share one read-only input binding.
   // These are GPU buffer copies, never geometry/color computation in the host.
   encoder.copyBufferToBuffer(field,0,contourInput,0,lattice*lattice*4);
   encoder.copyBufferToBuffer(values,0,contourInput,lattice*lattice*4,width*4);
   // The final summary is separate because the contour output is resident.
   const contourTrace=stage(4);
   dispatch(encoder,'presentation-contour',renderParams,contourInput,vertices,vertexError,cells,contourTrace,0);
   encoder.copyBufferToBuffer(params[p],0,finalControls,0,36*4);device.queue.submit([encoder.finish()]);
   const [checks,controlBytes,contourChecks]=await Promise.all([read(trace),read(finalControls),read(contourTrace)]);try{validate(checks);validate(contourChecks);}catch(error){error.message+=' controls='+JSON.stringify(Array.from(new Float32Array(controlBytes.buffer)));throw error;}
   const controlsOut=new Float32Array(controlBytes.buffer);need(controlsOut[30]===1,'STATE_GPU_CALIBRATION_NOT_CONVERGED');
   return {buffer:vertices,vertexCount:cells*12,measuredArea:controlsOut[32],desiredArea:controlsOut[15],scale:controlsOut[11],backend:'current-vkf-compiled-gpu-real-f32',geometryReadbackBytes:0,borrowedUntilNextSample:streaming,controlReadbackBytes:checks.byteLength+controlBytes.byteLength+contourChecks.byteLength};
  }
  const api={id:description.id,extent:description.extent,measureEndpoint:controls=>streaming?serial(()=>measureEndpoint(controls)):measureEndpoint(controls),sample:controls=>streaming?serial(()=>sample(controls)):sample(controls),destroy(){if(disposed)return;disposed=true;plans.delete(api);owned.forEach(release);}};plans.add(api);return api;
 }
 return {device,createPlan,allocateFrameBuffer(vertexCount){need(Number.isSafeInteger(vertexCount)&&vertexCount>0,'STATE_GPU_VERTEX_COUNT');return allocate(vertexCount*6,GPUBufferUsage.VERTEX);},allocateFrameBuffers(vertexCount){need(Number.isSafeInteger(vertexCount)&&vertexCount>0,'STATE_GPU_VERTEX_COUNT');return [allocate(vertexCount*6,GPUBufferUsage.VERTEX),allocate(vertexCount*6,GPUBufferUsage.VERTEX)];},async copyFrame(fields,output){need(!streaming,'STATE_GPU_STREAMING_PACKET_REQUIRES_IMMEDIATE_DRAW');need(buffers.has(output),'STATE_GPU_FRAME_BUFFER');const encoder=device.createCommandEncoder();let offset=0;for(const f of fields){const size=f.vertexCount*24;need(buffers.has(f.buffer)&&size<=f.buffer.size&&offset+size<=output.size,'STATE_GPU_RESIDENT_COPY');encoder.copyBufferToBuffer(f.buffer,0,output,offset,size);offset+=size;}device.queue.submit([encoder.finish()]);await device.queue.onSubmittedWorkDone();return offset/24;},statistics:()=>({bytes,maxBytes,bufferPolicy:streaming?'serialized shared contour/field scratch; immediate native draw':'retained packets',sharedProfiles:profiles.size,plans:plans.size,libraryCommit:provenance.libraryCommit,backend:'current-vkf-compiled-gpu-real-f32'}),close(){if(closed)return;closed=true;plans.forEach(p=>p.destroy());for(const b of buffers)release(b);device.removeEventListener('uncapturederror',errorListener);}};
}
