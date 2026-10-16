import {loadMorphingDemo} from './runtime/morphing-demo.mjs';
let scene;
self.onmessage=async({data})=>{
 try{
  if(data.type==='prepare'){
   scene=await loadMorphingDemo(32,data.mode,data.start,data.end);
   self.postMessage({type:'ready'});
  }else if(data.type==='sample'){
   const start=performance.now();const frame=scene.sample(data.coordinate);
   self.postMessage({type:'frame',coordinate:data.coordinate,frame,resolution:scene.resolution,milliseconds:performance.now()-start});
  }
 }catch(error){self.postMessage({type:'error',message:error.message});}
};
