import {loadNativeStateKernel} from './vf-state-interpolation.mjs';
let loaded,base;
self.onmessage=async({data})=>{
 try{
  if(!loaded){base=data.baseURL;loaded=loadNativeStateKernel(base?{baseURL:new URL(base)}:{});}
  if(data.baseURL!==base)throw Error('STATE_PREPARATION_RESOURCE_CHANGED');
  const native=await loaded,start=performance.now(),prepared=native.preparationKernel.invokeValue('prepare_event_fields',[data.plan,data.sourceCount,data.targetCount,data.weights]);
  self.postMessage({id:data.id,result:{prepared,libraryCommit:native.provenance.libraryCommit,nativePreparationMs:performance.now()-start}});
 }catch(error){self.postMessage({id:data.id,error:{message:error.message,code:error.code??'STATE_NATIVE_PREPARATION_FAILED'}});}
};
