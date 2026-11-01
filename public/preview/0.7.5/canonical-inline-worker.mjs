import {createCanonicalExecution} from './playground/vkf-canonical-execution.mjs?sha256=f56592e3eb727d87ebc954575d33022910407dc25d5c2bea55dbced60ac894ee';
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
