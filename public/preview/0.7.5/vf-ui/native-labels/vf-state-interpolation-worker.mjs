import {loadNativeStateKernel,prepareNativeLabelTransition} from './vf-state-interpolation.mjs';
let engine,labels,numeric,provenance,closed=false;
self.onmessage=async({data})=>{
 try{
  if(data.type==='initialize'){
   if(engine)throw Error('State interpolation worker already initialized');
   const loaded=await loadNativeStateKernel();engine=loaded.kernel;provenance=loaded.provenance;
   labels=prepareNativeLabelTransition({from:data.from,to:data.to,kernel:engine,provenance});
   if(data.start.length)numeric=engine.invokeValue('prepare',[[0,1],[...data.start,...data.finish],data.start.length,0,false,false]);
   self.postMessage({id:data.id,status:'ok',cohorts:labels.cohorts,gpuPlans:labels.gpuPlans,libraryCommit:provenance.libraryCommit});
  }else if(data.type==='gpu-controls'){
   self.postMessage({id:data.id,status:'ok',params:labels.gpuControls(data.planId,data.coordinate)});
  }else if(data.type==='gpu-measures'){
   for(const row of data.measures)labels.gpuMeasures(row.id,row.values);
   self.postMessage({id:data.id,status:'ok'});
  }else if(data.type==='sample'){
   if(!engine)throw Error('State interpolation is not prepared');
   const q=data.coordinate,coordinate=engine.invokeValue('time_coordinate',[q]);
   self.postMessage({id:data.id,status:'ok',coordinate:q,sources:labels.sample(q),values:numeric?engine.invokeValue('sample',[numeric,coordinate]).value:[]});
  }else throw Error('Unknown state interpolation request');
 }catch(error){self.postMessage({id:data.id,status:'error',error:error.message});}
};
