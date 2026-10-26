let sequence=0;
export function executeRetainedViaWindow(wasm,manifest){
 if(typeof self.postMessage!=='function'||typeof document!=='undefined')throw new TypeError('Expected the compiler worker');
 const request=++sequence;
 return new Promise((resolve,reject)=>{
  const receive=({data})=>{
   if(data?.type!=='vkf-retained-result'||data.request!==request)return;
   self.removeEventListener('message',receive);
   data.status==='ok'?resolve({memory:data.memory,outputPointer:data.outputPointer,receipt:data.receipt}):reject(new Error(data.message));
  };
  self.addEventListener('message',receive);
  self.postMessage({type:'vkf-execute-retained',request,wasm,manifest});
 });
}
