import {ensureBrowserIsolation} from './vkf-browser-isolation.mjs';
const DEFAULT_WASM_URL=new URL('./playground/canonical/compiler.wasm',import.meta.url);
const WORKER_URL=new URL('./canonical-inline-worker.mjs',import.meta.url);
export const DEFAULT_EXECUTION_TIMEOUT_MS=30000;
export function createInlineRunner({wasmUrl=DEFAULT_WASM_URL,moduleURL,dataURL,
  fetchImpl=globalThis.fetch,WorkerClass=globalThis.Worker,
  timeoutMs=DEFAULT_EXECUTION_TIMEOUT_MS}={}){
  const wasmURL=new URL(wasmUrl,import.meta.url).href;
  const packageDescriptor={wasmURL,moduleURL:new URL(moduleURL??wasmURL.replace(/\.wasm$/,'.mjs'),import.meta.url).href,
    dataURL:new URL(dataURL??wasmURL.replace(/\.wasm$/,'.data'),import.meta.url).href};
  let sequence=0,prewarmed;
  const prewarm=()=>prewarmed??=(async()=>{
    await ensureBrowserIsolation();
    const responses=await Promise.all(Object.values(packageDescriptor).map(url=>fetchImpl(url)));
    if(responses.some(response=>!response.ok))throw new Error('Current VKF browser compiler is unavailable');
    await Promise.all(responses.map(response=>response.arrayBuffer()));
    return Object.freeze({packageDescriptor});
  })();
  return Object.freeze({
    prewarm,
    async run(source){
      if(typeof source!=='string')throw new TypeError('VKF source must be a string');
      await prewarm();
      const worker=new WorkerClass(WORKER_URL,{type:'module',name:'vkf-current-compiler'}),id=++sequence;
      try{
        const response=await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('VKF execution timed out; worker terminated')),timeoutMs);
          worker.onerror=()=>{clearTimeout(timer);reject(new Error('VKF compiler worker failed'));};
          worker.onmessage=({data})=>{if(data?.id!==id)return;clearTimeout(timer);data.status==='ok'?resolve(data):reject(new Error(data.message));};
          worker.postMessage({type:'run-canonical',id,source,filename:'/browser/example.vkf',packageDescriptor});
        });
        const packets=response.output?.retained_scene_arenas??null;
        return Object.freeze({output:response.output,packets,timing:response.timing});
      }finally{worker.terminate();}
    },
    async compileApplication(){throw new Error('Current compiler application dispatch is not available');},
  });
}
