import {createCanonicalExecution} from './playground/vkf-canonical-execution.mjs';
let compilerPromise;
self.onmessage=async({data})=>{
  try{
    if(data?.type!=='run-canonical'||typeof data.source!=='string')throw new TypeError('Invalid compiler run request');
    compilerPromise??=createCanonicalExecution(data.packageDescriptor);
    const compiler=await compilerPromise;
    const result=await compiler.run(data.source,data.filename);
    self.postMessage({id:data.id,status:'ok',...result});
  }catch(error){self.postMessage({id:data?.id,status:'error',message:error.message});}
};
