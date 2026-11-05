import {dispatchRetainedExecution,cancelRetainedExecutions,registerRetainedCompilerRun,retainedPresentationFor,closeRetainedPresentations,retainedExecutionsSettled} from './playground/vkf-retained-window-execution.mjs?sha256=bb4dd5920b0018be1d8a74284476c825cfd6db44d1d6534846894c0e7e71240c';
import {ensureBrowserIsolation} from './vkf-browser-isolation.mjs?sha256=07f4803c17a1a66b917223d146d868c415fcc3b864002557c1bfab65dec5d029';
const DEFAULT_WASM_URL=new URL('./playground/canonical/compiler.wasm',import.meta.url);
const WORKER_URL=new URL('./canonical-inline-worker.mjs?sha256=1526034687dec406b9399fb329acd68fbb2cb40116c71c36604c658852434bec',import.meta.url);
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
  let sequence=0,prewarmed,packageAssets,worker,retiringWorker,sourceRun,pending=Promise.resolve(),disposed=false,activeReject,prewarmController,disposePromise,closing;
  const closedReason=()=>new DOMException('VKF execution owner closed','AbortError');
  const closeWorker=(reason)=>{
    if(closing)return closing;
    prewarmed=undefined;packageAssets=undefined;
    const owned=worker;if(!owned)return Promise.resolve();
    retiringWorker=owned;
    closing=Promise.resolve().then(async()=>{
      let failure;
      try{await cancelRetainedExecutions(owned,reason);}catch(error){failure=error;}
      // Refusal keeps this exact Worker, source registration and retained scope
      // reachable. An attempted disposal error can instead leave them settled;
      // finish ordinary host cleanup in that case, then propagate that error.
      if(!retainedExecutionsSettled(owned))throw failure??new Error('Retained ownership remains open');
      sourceRun?.close();sourceRun=undefined;
      owned.onmessage=null;owned.onerror=null;owned.terminate();
      if(worker===owned)worker=undefined;
      if(retiringWorker===owned)retiringWorker=undefined;
      if(failure)throw failure;
    }).finally(()=>{closing=undefined;});
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
  const temporalRequest=(type,payload)=>{
      if(disposed)return Promise.reject(closedReason());
      const execute=async()=>{
        if(disposed||closing||!worker||retiringWorker===worker)throw closedReason();
        const owned=worker,id=++sequence;let timer;
        try {
          return await new Promise((resolve,reject)=>{
            activeReject=reject;
            timer=setTimeout(()=>reject(new Error('VKF temporal sampling timed out')),timeoutMs);
            owned.onerror=()=>reject(new Error('VKF temporal worker failed'));
            owned.onmessage=({data})=>{
              if(data?.id!==id)return;
              data.status==='ok'?resolve(data):reject(new Error(data.message));
            };
            owned.postMessage({type,id,...payload});
          });
        }finally{clearTimeout(timer);activeReject=undefined;owned.onmessage=null;owned.onerror=null;}
      };
      const result=pending.then(execute);pending=result.catch(()=>{});return result;
  };
  return Object.freeze({
    prewarm,
    run(source,{signal,guestArenaBytes,retained,filename='/browser/example.vkf',sourceFiles}={}){
      if(disposed)return Promise.reject(closedReason());
      if(typeof source!=='string')return Promise.reject(new TypeError('VKF source must be a string'));
      if(typeof filename!=='string')return Promise.reject(new TypeError('VKF filename must be a string'));
      if(sourceFiles!==undefined&&(!Array.isArray(sourceFiles)||sourceFiles.some(file=>!file||typeof file.filename!=='string'||typeof file.source!=='string')))
        return Promise.reject(new TypeError('VKF sourceFiles must contain filename/source text records'));
      // Snapshot imported source at Run, before this execution enters the queue.
      const inputFiles=sourceFiles?.map(file=>Object.freeze({filename:file.filename,source:file.source}));
      if(guestArenaBytes!==undefined&&(!Number.isSafeInteger(guestArenaBytes)||guestArenaBytes<64*1024*1024||guestArenaBytes>1024*1024*1024||guestArenaBytes%65536))return Promise.reject(new TypeError('guestArenaBytes must be a64KiB-aligned integer in[64MiB,1024MiB]'));
      let queued=true;
      const execute=async()=>{
        queued=false;if(disposed)throw closedReason();signal?.throwIfAborted();
        let owned,timer,abort,success=false;
        const deadline=Date.now()+timeoutMs;
        try{
          if(retiringWorker)await closeWorker(closedReason());
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
          if(worker)await closeRetainedPresentations(worker);
          sourceRun?.close();sourceRun=undefined;
          if(disposed)throw closedReason();signal?.throwIfAborted();
          const initialization=worker?undefined:packageAssets;
          worker??=new WorkerClass(WORKER_URL,{type:'module',name:'vkf-current-compiler'});
          owned=worker;const id=++sequence;
          sourceRun=registerRetainedCompilerRun(owned,source,filename,inputFiles,packageDescriptor.expectedSourceBinding);
          const response=await new Promise((resolve,reject)=>{
            activeReject=reject;
            timer=setTimeout(()=>reject(new Error('VKF execution timed out')),Math.max(0,deadline-Date.now()));
            abort=()=>reject(signal.reason??new DOMException('VKF execution cancelled','AbortError'));
            signal?.addEventListener('abort',abort,{once:true});
            if(signal?.aborted){abort();return;}
            owned.onerror=()=>reject(new Error('VKF compiler worker failed'));
            owned.onmessage=async({data})=>{
              if(data?.type==='vkf-execute-retained'||data?.type==='vkf-cancel-retained-request'){
                try{await dispatchRetainedExecution(owned,data,retained);}catch(error){reject(error);}return;
              }
              if(data?.id!==id)return;
              data.status==='ok'?resolve(data):reject(new Error(data.message));
            };
            owned.postMessage({type:'run-canonical',id,source,filename,sourceFiles:inputFiles,packageDescriptor,packageAssets:initialization,guestArenaBytes},initialization?[initialization.wasmBinary,initialization.data]:[]);
            if(initialization)packageAssets=undefined;
          });
          const packets=response.output?.retained_scene_arenas??null;
          const presentation=retainedPresentationFor(owned);
          if(Boolean(presentation)!==(response.retainedHost?.liveWorld===true))
            throw new TypeError('Actual retained World presentation/worker completion differs');
          let liveRetained;
          if(presentation){
            let completion;
            const abortPresentation=()=>{void close().catch(error=>{
              retained?.mountTarget?.dispatchEvent(new CustomEvent('vf-example-render-error',{bubbles:true,detail:{error,message:error.message}}));
              retained?.onPhysicsError?.(error);
            });};
            const close=()=>completion??=presentation.close().then(()=>{
              signal?.removeEventListener('abort',abortPresentation);
            }).catch(error=>{completion=undefined;throw error;});
            signal?.addEventListener('abort',abortPresentation,{once:true});
            liveRetained=Object.freeze({close,
              get frameCompletion(){return presentation.frameCompletion;}});
          }
          success=true;
          return Object.freeze({output:response.output,packets,liveRetained,timing:response.timing,temporal:response.temporal,sourceBinding:response.sourceBinding,
            get frameCompletion(){return liveRetained?.frameCompletion ?? null;}});
        }finally{
          clearTimeout(timer);signal?.removeEventListener('abort',abort);activeReject=undefined;
          if(owned){owned.onmessage=null;owned.onerror=null;}
          try{
            if(!success||disposed)await closeWorker(signal?.aborted?signal.reason:closedReason());
          }finally{
            if(owned)sourceRun?.finish();
            if(owned&&retainedExecutionsSettled(owned)){sourceRun?.close();sourceRun=undefined;}
          }
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
    sample(elapsed,generation){return temporalRequest('sample-canonical',{elapsed,generation});},
    disposeTemporal(generation){return temporalRequest('dispose-temporal',{generation});},
    dispose(){
      return disposePromise??=(async()=>{
        disposed=true;const reason=closedReason();prewarmController?.abort(reason);
        activeReject?.(reason);await pending;await closeWorker(reason);
      })().catch(error=>{disposePromise=undefined;throw error;});
    },
    async compileApplication(){throw new Error('Current compiler application dispatch is not available');},
  });
}
