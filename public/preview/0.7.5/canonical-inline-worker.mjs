import {createCanonicalExecution} from './playground/vkf-canonical-execution.mjs?sha256=cd209871296ac7b67f55fd0dbcda0a0403679ebceeceeb76f82714bd4df1b94c';
let compilerPromise;
self.onmessage=async({data})=>{
  if(data?.type==='vkf-retained-result')return;
  try{
    if(data?.type!=='run-canonical'||typeof data.source!=='string')throw new TypeError('Invalid compiler run request');
    compilerPromise??=createCanonicalExecution(data.packageDescriptor,data.packageAssets);
    const compiler=await compilerPromise;
    const result=await compiler.run(data.source,data.filename,{guestArenaBytes:data.guestArenaBytes});
    self.postMessage({id:data.id,status:'ok',...result,sourceBinding:compiler.sourceBinding});
  }catch(error){self.postMessage({id:data?.id,status:'error',message:error.message});}
};
