await import('./vkf-concurrent-broker.mjs');
const brokerMessage=globalThis.onmessage;
const PROCESS=new URL('./vkf-ready-process.mjs',import.meta.url);
const processes=new Map();let maximumProcesses=64;
const failure=(payload,error)=>{
  const completion=payload?.completion;
  if(!(completion instanceof SharedArrayBuffer))return;
  const state=new Int32Array(completion,0,2), bytes=new TextEncoder().encode(error.message);
  const count=Math.min(bytes.length,completion.byteLength-24);
  new Uint8Array(completion,24,count).set(bytes.subarray(0,count));
  Atomics.store(state,1,count);Atomics.compareExchange(state,0,0,-4);Atomics.notify(state,0);
};
const kill=(key)=>{
  const process=processes.get(key);if(!process)return;
  for(const [childKey,child] of processes)if(child.parent===key)kill(childKey);
  process.worker.terminate();process.port.close();processes.delete(key);
};
const management=(data,owner='root')=>{
  const key=owner+':'+data.id;
  if(data.type==='vkf-process-kill'){kill(key);return;}
  if(data.type!=='vkf-process-start')return;
  let worker, port;
  try {
    if(!Number.isSafeInteger(data.id)||data.id<1||processes.has(key))throw new TypeError('Invalid process launch identifier');
    if(processes.size>=maximumProcesses)throw new RangeError('Concurrent process capacity exceeded');
    const channel=new MessageChannel();port=channel.port1;
    const childOwner=key;
    port.onmessage=({data})=>management(data,childOwner);
    worker=new Worker(PROCESS,{type:'module',name:'vkf-process'});
    processes.set(key,{worker,port,parent:owner==='root'?null:owner});
    worker.onerror=()=>{failure(data.payload,new Error('Concurrent process startup failed'));kill(key);};
    worker.postMessage({type:'vkf-process-init',managerPort:channel.port2,payload:data.payload},
      [channel.port2,...(data.payload.brokerPort?[data.payload.brokerPort]:[])]);
  }catch(error){worker?.terminate();port?.close();failure(data.payload,error);}
};
self.onmessage=(event)=>{
  const data=event.data;
  if(data?.type==='vkf-supervisor-init'){
    maximumProcesses=data.maximumProcesses;
    self.postMessage({type:'vkf-broker-ready'});
  }else if(data?.type?.startsWith('vkf-process-'))management(data);
  else brokerMessage(event);
};

self.postMessage({type:'vkf-broker-loaded'});
