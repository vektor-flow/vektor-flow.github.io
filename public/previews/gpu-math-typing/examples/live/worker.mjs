import {loadMorphingDemo} from './runtime/morphing-demo.mjs';
let scene;
self.onmessage=async({data})=>{
 try{
  if(data.type==='prepare'){
   if(!Number.isInteger(data.resolution)||data.resolution<8||data.resolution>256)throw Error('Invalid geometry resolution');
   scene?.dispose();scene=await loadMorphingDemo(data.resolution,data.mode,data.start,data.end);
   self.postMessage({id:data.id,type:'ready'});
  }else if(data.type==='sample'){
   const start=performance.now(),value=scene.sample(data.coordinate);
   if(value.coverage.length!==scene.resolution*scene.resolution)throw Error('Invalid native frame dimensions');
   const frame={...value,coverage:Float32Array.from(value.coverage),vertices:Float32Array.from(value.vertices)};
   self.postMessage({id:data.id,type:'frame',coordinate:data.coordinate,frame,resolution:scene.resolution,milliseconds:performance.now()-start},[frame.coverage.buffer,frame.vertices.buffer]);
  }
 }catch(error){self.postMessage({id:data.id,type:'error',message:error.message});}
};
