import {createCanonicalExecution} from './playground/vkf-canonical-execution.mjs?sha256=ab586f2649122a8e47500c3ccf354414eb8327ab45804ad3369b00c0390b84e8';
let compilerPromise;
self.onmessage=async({data})=>{
  if(data?.type==='vkf-retained-result')return;
  try{
    if(data?.type==='dispose-temporal'){
      if(!compilerPromise)throw new TypeError('No current temporal source owner');
      const compiler=await compilerPromise;
      const result=await compiler.disposeTemporal(data.generation);
      self.postMessage({id:data.id,status:'ok',...result});return;
    }
    if(data?.type==='sample-canonical'){
      if(!compilerPromise)throw new TypeError('No current temporal source owner');
      const compiler=await compilerPromise;
      const result=await compiler.sample(data.elapsed,data.generation);
      self.postMessage({id:data.id,status:'ok',...result});return;
    }
    if(data?.type!=='run-canonical'||typeof data.source!=='string')throw new TypeError('Invalid compiler run request');
    compilerPromise??=createCanonicalExecution(data.packageDescriptor,data.packageAssets);
    const compiler=await compilerPromise;
    const result=await compiler.run(data.source,data.filename,{guestArenaBytes:data.guestArenaBytes,sourceFiles:data.sourceFiles});
    self.postMessage({id:data.id,status:'ok',...result,sourceBinding:compiler.sourceBinding});
  }catch(error){self.postMessage({id:data?.id,status:'error',message:error.message});}
};
