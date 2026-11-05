import {takeNormalPhysicsProgram} from './vkf-normal-physics-program.mjs?sha256=96a6931d3215793bbbc1c5c23724e4145e25c11ca27b0c73b20020f701d43260';
let sequence=0;
export function executeRetainedViaWindow(wasm,manifest,{program,sourceBinding,signal}={}){
 if(typeof self.postMessage!=='function'||typeof document!=='undefined')throw new TypeError('Expected the compiler worker');
 signal?.throwIfAborted();
 // Only this actual compiler-returned object can enter the physics route.
 // Structured guest fields cannot enroll a program in the private WeakMap.
 const issued=manifest.physicsReplay?takeNormalPhysicsProgram(program,sourceBinding):null;
 if(issued){wasm=issued.wasm;manifest=issued.manifest;}
 const request=++sequence;
 return new Promise((resolve,reject)=>{
  const abort=()=>self.postMessage({type:'vkf-cancel-retained-request',request});
  const receive=({data})=>{
   if(data?.type!=='vkf-retained-result'||data.request!==request)return;
   self.removeEventListener('message',receive);signal?.removeEventListener('abort',abort);
   // Cancellation settles only AFTER the real window guest settles and its
   // owned host/resource cleanup finishes. No abandoned engine/VM waiter.
   if(signal?.aborted){reject(signal.reason);return;}
   data.status==='ok'?resolve({memory:data.memory,outputPointer:data.outputPointer,receipt:data.receipt}):reject(new Error(data.message));
  };
  self.addEventListener('message',receive);
  signal?.addEventListener('abort',abort,{once:true});
  try{
   self.postMessage({type:'vkf-execute-retained',request,wasm,manifest,
     compilerSourceBinding:issued?.binding});
  }catch(error){
   self.removeEventListener('message',receive);signal?.removeEventListener('abort',abort);reject(error);
  }
 });
}
