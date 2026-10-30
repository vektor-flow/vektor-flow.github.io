import {dispatchRetainedExecution,cancelRetainedExecutions} from './playground/vkf-retained-window-execution.mjs';
import {ensureBrowserIsolation} from './vkf-browser-isolation.mjs';
const DEFAULT_WASM_URL=new URL('./playground/canonical/compiler.wasm',import.meta.url);
const WORKER_URL=new URL('./canonical-inline-worker.mjs?v=8fceec29debf9a40',import.meta.url);
export const DEFAULT_EXECUTION_TIMEOUT_MS=30000;
export function createInlineRunner({wasmUrl=DEFAULT_WASM_URL,moduleURL,dataURL,expectedSourceBinding,
  fetchImpl=globalThis.fetch,WorkerClass=globalThis.Worker,
  timeoutMs=DEFAULT_EXECUTION_TIMEOUT_MS}={}){
  const wasmURL=new URL(wasmUrl,import.meta.url).href;
  const packageDescriptor={wasmURL,moduleURL:new URL(moduleURL??wasmURL.replace(/\.wasm$/,'.mjs'),import.meta.url).href,
    dataURL:new URL(dataURL??wasmURL.replace(/\.wasm$/,'.data'),import.meta.url).href};
  if(expectedSourceBinding!==undefined){
    if(typeof expectedSourceBinding!=='string'||!/^[a-f0-9]{64}$/.test(expectedSourceBinding))throw new TypeError('Expected compiler source binding is invalid');
    packageDescriptor.expectedSourceBinding=expectedSourceBinding;
  }
  let sequence=0,prewarmed,packageAssets,worker,pending=Promise.resolve(),disposed=false,activeReject,prewarmController,disposePromise,closing;
  const closedReason=()=>new DOMException('VKF execution owner closed','AbortError');
  const closeWorker=(reason)=>{
    if(closing)return closing;
    prewarmed=undefined;packageAssets=undefined;
    const owned=worker;if(!owned)return Promise.resolve();worker=undefined;
    closing=(async()=>{
      try{await cancelRetainedExecutions(owned,reason);}finally{
        owned.onmessage=null;owned.onerror=null;owned.terminate();closing=undefined;
      }
    })();
    return closing;
  };
  const prewarm=()=>{
    if(disposed)return Promise.reject(closedReason());
    if(prewarmed)return prewarmed;
    const preparation=(async()=>{
      await ensureBrowserIsolation();if(disposed)throw closedReason();
      const controller=new AbortController();prewarmController=controller;
      try{
        const responses=await Promise.all([packageDescriptor.moduleURL,packageDescriptor.wasmURL,packageDescriptor.dataURL].map(url=>fetchImpl(url,{signal:controller.signal})));
        if(responses.some(response=>!response.ok))throw new Error('Current VKF browser compiler is unavailable');
        const [,wasmBinary,data]=await Promise.all(responses.map(response=>response.arrayBuffer()));
        controller.signal.throwIfAborted();if(disposed)throw closedReason();
        // Keep owned package bytes private until the fresh worker takes them.
        packageAssets={wasmBinary,data};
        return Object.freeze({packageDescriptor});
      }catch(error){controller.abort(error);throw error;}finally{if(prewarmController===controller)prewarmController=undefined;}
    })().catch(error=>{if(prewarmed===preparation){prewarmed=undefined;packageAssets=undefined;}throw error;});
    prewarmed=preparation;return preparation;
  };
  return Object.freeze({
    prewarm,
    run(source,{signal,guestArenaBytes}={}){
      if(disposed)return Promise.reject(closedReason());
      if(typeof source!=='string')return Promise.reject(new TypeError('VKF source must be a string'));
      if(guestArenaBytes!==undefined&&(!Number.isSafeInteger(guestArenaBytes)||guestArenaBytes<64*1024*1024||guestArenaBytes>1024*1024*1024||guestArenaBytes%65536))return Promise.reject(new TypeError('guestArenaBytes must be a64KiB-aligned integer in[64MiB,1024MiB]'));
      let queued=true;
      const execute=async()=>{
        queued=false;if(disposed)throw closedReason();signal?.throwIfAborted();
        let owned,timer,abort,success=false;
        const deadline=Date.now()+timeoutMs;
        try{
          await new Promise((resolve,reject)=>{
            activeReject=reject;
            const fail=reason=>{prewarmController?.abort(reason);reject(reason);};
            timer=setTimeout(()=>fail(new Error('VKF execution timed out')),timeoutMs);
            abort=()=>fail(signal.reason??new DOMException('VKF execution cancelled','AbortError'));
            signal?.addEventListener('abort',abort,{once:true});
            prewarm().then(resolve,reject);if(signal?.aborted)abort();
          });
          clearTimeout(timer);signal?.removeEventListener('abort',abort);
          if(disposed)throw closedReason();signal?.throwIfAborted();
          const initialization=worker?undefined:packageAssets;
          worker??=new WorkerClass(WORKER_URL,{type:'module',name:'vkf-current-compiler'});
          owned=worker;const id=++sequence;
          const response=await new Promise((resolve,reject)=>{
            activeReject=reject;
            timer=setTimeout(()=>reject(new Error('VKF execution timed out')),Math.max(0,deadline-Date.now()));
            abort=()=>reject(signal.reason??new DOMException('VKF execution cancelled','AbortError'));
            signal?.addEventListener('abort',abort,{once:true});
            if(signal?.aborted){abort();return;}
            owned.onerror=()=>reject(new Error('VKF compiler worker failed'));
            owned.onmessage=async({data})=>{
              if(data?.type==='vkf-execute-retained'){
                try{await dispatchRetainedExecution(owned,data);}catch(error){reject(error);}return;
              }
              if(data?.id!==id)return;
              data.status==='ok'?resolve(data):reject(new Error(data.message));
            };
            owned.postMessage({type:'run-canonical',id,source,filename:'/browser/example.vkf',packageDescriptor,packageAssets:initialization,guestArenaBytes},initialization?[initialization.wasmBinary,initialization.data]:[]);
            if(initialization)packageAssets=undefined;
          });
          const packets=response.output?.retained_scene_arenas??null;
          success=true;
          return Object.freeze({output:response.output,packets,timing:response.timing,sourceBinding:response.sourceBinding});
        }finally{
          clearTimeout(timer);signal?.removeEventListener('abort',abort);activeReject=undefined;
          if(owned){owned.onmessage=null;owned.onerror=null;}
          if(!success||disposed)await closeWorker(signal?.aborted?signal.reason:closedReason());
        }
      };
      // The compiler's native formatters consume its most recently accepted IR.
      // Keep the full compile/async guest/both-formatter transaction exclusive.
      const result=pending.then(execute);pending=result.catch(()=>{});
      if(!signal)return result;
      return new Promise((resolve,reject)=>{
        const abort=()=>{if(queued)reject(signal.reason??closedReason());};
        signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
        result.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
      });
    },
    dispose(){
      return disposePromise??=(async()=>{
        disposed=true;const reason=closedReason();prewarmController?.abort(reason);
        activeReject?.(reason);await pending;await closeWorker(reason);
      })();
    },
    async compileApplication(){throw new Error('Current compiler application dispatch is not available');},
  });
}
