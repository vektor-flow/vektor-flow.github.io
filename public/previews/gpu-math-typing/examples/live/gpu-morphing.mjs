import {createCompiledFieldKernel,createFieldBuffer} from '/vf-ui/vf-compiled-field-runtime.mjs';

export async function prepareMorphingGPU(device, {sceneURL,shaderURL,resolution=32,lattice=129,
  mode=1,smoothStart=true,smoothEnd=true,extent=1024,profile=false}={}) {
  if(!Number.isInteger(resolution)||resolution<8||resolution>256||
     !Number.isInteger(lattice)||lattice<3||lattice>241)throw Error('Invalid morphing resolution');
  const sceneBase=new URL(sceneURL,location.href),shaderBase=new URL(shaderURL,location.href);
  const {createSymbolicKernel}=await import(new URL('vf-ui/vf-symbolic-kernel-runtime.mjs',sceneBase));
  const fetchJSON=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Morphing artifact unavailable');return r.json();};
  const manifest=await fetchJSON(new URL('scene.json',sceneBase));
  const wasm=await fetch(new URL('scene.wasm',sceneBase));if(!wasm.ok)throw Error('Morphing artifact unavailable');
  const {instance}=await WebAssembly.instantiate(await wasm.arrayBuffer());
  let native=createSymbolicKernel({instance,manifest});
  let scene=native.invokeValue('gpu_prepare',[resolution,mode,smoothStart,smoothEnd]);
  let controls=native.invokeValue('gpu_control_scene',[scene]);
  const names=['state','field','reduce','measure','calibrate','check-controls','render-controls','triangle-packet'];
  const kernels=Object.fromEntries(await Promise.all(names.map(async name=>{
    const [r,m]=await Promise.all([fetch(new URL(name+'.wgsl',shaderBase)),fetchJSON(new URL(name+'.wgsl.json',shaderBase))]);
    if(!r.ok)throw Error('Morphing shader unavailable');
    return [name,await createCompiledFieldKernel(device,await r.text(),m)];
  })));
  const owned=[];
  try {
  function buffer(data,usage=0){const b=createFieldBuffer(device,data,usage);owned.push(b);return b;}
  const width=scene.plan.curve.width;
  const tableData=Float32Array.from([...scene.plan.curve.values,...scene.plan.curve.second]);
  if(tableData.some(x=>!Number.isFinite(x)))throw Error('Morphing state exceeds supported GPU precision');
  const table=buffer(tableData);
  scene=null;
  const a=buffer(34),b=buffer(34),renderParams=buffer(34),checkParams=buffer(34),state=buffer(width);
  const measures=buffer(resolution*resolution),rows=buffer(resolution),field=buffer(lattice*lattice);
  const cells=(lattice-1)*(lattice-1);
  const vertexFloats=cells*72;
  const vertices=[buffer(vertexFloats,GPUBufferUsage.VERTEX),buffer(vertexFloats,GPUBufferUsage.VERTEX)];
  let currentVertex=0;
  const errorCounts=[width,resolution*resolution,resolution,34,lattice*lattice,cells];
  const errors=errorCounts.map(n=>buffer(n+1));
  const bind=(name,params,values,result,error,count)=>kernels[name].bind({params,values,result,errors:error,count});
  const interpolate=bind('state',a,table,state,errors[0],width);
  const rounds=[[a,b],[b,a]].map(([current,next])=>[
    bind('field',current,state,measures,errors[1],resolution*resolution),
    bind('reduce',current,measures,rows,errors[2],resolution),
    bind('calibrate',current,rows,next,errors[3],34)
  ]);
  const finish=[bind('check-controls',a,table,checkParams,errors[3],34),
    bind('field',checkParams,state,measures,errors[1],resolution*resolution),
    bind('render-controls',a,table,renderParams,errors[3],34),
    bind('field',renderParams,state,field,errors[4],lattice*lattice)];
  const trianglePasses=vertices.map(v=>bind('triangle-packet',renderParams,field,v,errors[5],cells));
  const queries=profile&&device.features.has('timestamp-query')?device.createQuerySet({type:'timestamp',count:8}):null;
  if(queries)owned.push(queries);
  const queryResult=queries?device.createBuffer({size:64,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}):null;
  if(queryResult)owned.push(queryResult);
  const stamp=(begin,end)=>queries&&(begin!==undefined||end!==undefined)?{querySet:queries,...(begin===undefined?{}:{beginningOfPassWriteIndex:begin}),...(end===undefined?{}:{endOfPassWriteIndex:end})}:undefined;
  const readback=device.createBuffer({size:(6+34)*4+(queries?64:0),usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
  owned.push(readback);
  // Compute endpoint measures on the same GPU grid, once. Preparation no
  // longer sends large raster jobs through WASM at export resolution.
  const endpoint=buffer(1),endpointErrors=buffer(2);
  const endpointMeasure=bind('measure',a,rows,endpoint,endpointErrors,1);
  const endpointRead=device.createBuffer({size:20,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
  owned.push(endpointRead);
  const endpointMeasures=[];
  for(const coordinate of controls.knots){
    device.queue.writeBuffer(a,0,Float32Array.from(native.invokeValue('gpu_controls',[controls,coordinate,extent,lattice])));
    const encoder=device.createCommandEncoder();
    [errors[0],errors[1],errors[2],endpointErrors].forEach(e=>encoder.clearBuffer(e));
    interpolate.encode(encoder);rounds[0][0].encode(encoder);rounds[0][1].encode(encoder);endpointMeasure.encode(encoder);
    [errors[0],errors[1],errors[2],endpointErrors].forEach((e,i)=>encoder.copyBufferToBuffer(e,
      (i<3?errorCounts[i]:1)*4,endpointRead,i*4,4));
    encoder.copyBufferToBuffer(endpoint,0,endpointRead,16,4);
    device.queue.submit([encoder.finish()]);await endpointRead.mapAsync(GPUMapMode.READ);
    try{
      const bytes=endpointRead.getMappedRange();
      if(new Uint32Array(bytes,0,4).some(x=>x!==0))throw Error('GPU endpoint measure failed');
      endpointMeasures.push(new Float32Array(bytes,16,1)[0]);
    }finally{endpointRead.unmap();}
  }
  controls=native.invokeValue('gpu_measures',[controls,endpointMeasures]);
  let alive=true,busy=false;
  return Object.freeze({get vertices(){return vertices[currentVertex];},vertexCount:vertexFloats/6,resolution,lattice,
    async sample(coordinate){
      if(!alive)throw Error('Morphing GPU scene disposed');
      if(busy)throw Error('Morphing GPU scene already sampling');
      busy=true;
      try{
        const start=performance.now();
        const params=Float32Array.from(native.invokeValue('gpu_controls',[controls,coordinate,extent,lattice]));
        if(params.length!==34||params.some(x=>!Number.isFinite(x)))throw Error('Invalid native controls');
        device.queue.writeBuffer(a,0,params);
        const encoder=device.createCommandEncoder();
        errors.forEach(e=>encoder.clearBuffer(e));
        interpolate.encode(encoder,stamp(0,1));
        const calibration=encoder.beginComputePass(queries?{timestampWrites:stamp(2,3)}:{});
        for(let i=0;i<40;i++)rounds[i%2].forEach(kernel=>kernel.dispatch(calibration));
        calibration.end();
        const geometry=encoder.beginComputePass(queries?{timestampWrites:stamp(4,5)}:{});
        finish.forEach(kernel=>kernel.dispatch(geometry));geometry.end();
        const nextVertex=1-currentVertex;
        trianglePasses[nextVertex].encode(encoder,stamp(6,7));
        if(queries){encoder.resolveQuerySet(queries,0,8,queryResult,0);encoder.copyBufferToBuffer(queryResult,0,readback,160,64);}
        errors.forEach((e,i)=>encoder.copyBufferToBuffer(e,errorCounts[i]*4,readback,i*4,4));
        encoder.copyBufferToBuffer(a,0,readback,6*4,34*4);
        device.queue.submit([encoder.finish()]);
        await readback.mapAsync(GPUMapMode.READ);
        let completed,timing=null;
        try{
          const bytes=readback.getMappedRange();
          const flags=new Uint32Array(bytes,0,6);
          if(flags.some(x=>x!==0))throw Error('Compiled Morphing field failed: '+Array.from(flags).join(','));
          completed=Array.from(new Float32Array(bytes,6*4,34));
          if(queries){const ns=new BigUint64Array(bytes,160,8);timing=Object.fromEntries(
            ['state','calibration','fieldAndChecks','triangles'].map((name,i)=>[name,Number(ns[i*2+1]-ns[i*2])/1e6]));}
        }finally{readback.unmap();}
        if(completed[30]!==1)throw Error('Morphing calibration did not converge');
        currentVertex=nextVertex;
        return {coordinate,scale:completed[11],measure:completed[32],desired:completed[15],
          milliseconds:performance.now()-start,timing,vertexCount:vertexFloats/6,geometryReadbackBytes:0};
      }finally{busy=false;}
    },
    dispose(){if(busy)throw Error('Cannot dispose an in-flight Morphing scene');if(!alive)return;alive=false;
      owned.forEach(b=>b.destroy());native=null;controls=null;}
  });
  } catch(error) { owned.forEach(buffer=>buffer.destroy());native=null;controls=null;throw error; }
}
