import {managedProcessWorkerType} from './vkf-prepared-workers.mjs';
self.onmessage=async({data})=>{
  if(data?.type!=='vkf-process-init')return;
  try {
    globalThis.Worker=managedProcessWorkerType(data.managerPort);
    await import('./vkf-concurrent-worker.mjs');
    const execute=globalThis.onmessage;
    execute({data:data.payload});
  } catch(error) {
    const completion=data.payload?.completion;
    if(completion instanceof SharedArrayBuffer){
      const state=new Int32Array(completion,0,2);
      const bytes=new TextEncoder().encode(error.message);
      const count=Math.min(bytes.length,completion.byteLength-24);
      new Uint8Array(completion,24,count).set(bytes.subarray(0,count));
      Atomics.store(state,1,count);
      Atomics.compareExchange(state,0,0,-4);
      Atomics.notify(state,0);
    }
  } finally {data.managerPort.close();self.close();}
};
