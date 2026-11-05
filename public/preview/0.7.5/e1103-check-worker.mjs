import {createCanonicalExecution} from './playground/vkf-canonical-execution.mjs?sha256=ab586f2649122a8e47500c3ccf354414eb8327ab45804ad3369b00c0390b84e8';
let compilerPromise;
self.onmessage=async({data})=>{
  if(data?.type==='vkf-retained-result')return;
  try{
    if(data?.type!=='run-canonical'||typeof data.source!=='string')throw new TypeError('Invalid compiler run request');
    compilerPromise??=createCanonicalExecution(data.packageDescriptor);
    const compiler=await compilerPromise;
    const result=await compiler.run(data.source,data.filename);
    self.postMessage({id:data.id,status:'ok',compilerSourceBinding:compiler.sourceBinding,...result});
  }catch(error){self.postMessage({id:data?.id,status:'error',message:error.message});}
};
