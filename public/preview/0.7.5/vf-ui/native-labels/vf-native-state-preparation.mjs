const need=(ok,code)=>{if(!ok)throw Object.assign(Error(code),{code});};
// A worker transports immutable native preparation results. It owns no field,
// matching, curve or event formulas; the verified current WASM module owns them.
export function createNativeStatePreparation({baseURL,signal}={}){
 need(typeof Worker==='function','STATE_PREPARATION_WORKER_UNAVAILABLE');
 const worker=new Worker(new URL('./vf-native-state-preparation-worker.mjs',import.meta.url),{type:'module'}),pending=new Map();let next=0,closed=false;
 const fail=error=>{for(const job of pending.values())job.reject(error);pending.clear();};
 const close=()=>{if(closed)return;closed=true;worker.terminate();fail(Object.assign(Error('STATE_PREPARATION_CLOSED'),{code:'STATE_PREPARATION_CLOSED'}));signal?.removeEventListener('abort',close);};
 worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;pending.delete(data.id);if(data.error)job.reject(Object.assign(Error(data.error.message),{code:data.error.code}));else job.resolve(data.result);};
 worker.onerror=event=>{fail(Error(event.message??'STATE_PREPARATION_WORKER_ERROR'));close();};
 signal?.addEventListener('abort',close,{once:true});if(signal?.aborted)close();
 return Object.freeze({prepareEventFields(plan,sourceCount,targetCount,weights=[]){need(!closed,'STATE_PREPARATION_CLOSED');const id=++next;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,baseURL:baseURL?String(baseURL):undefined,plan,sourceCount,targetCount,weights});});},close});
}
