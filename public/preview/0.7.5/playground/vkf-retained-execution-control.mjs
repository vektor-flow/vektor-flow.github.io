// Trusted execution scheduling only. All retained operations still use the
// original real renderer bridge and the same live VM instance and memory.
export function createRetainedExecutionControl(signal,{sliceMs=8,checkInterval=64}={}) {
  if (!Number.isFinite(sliceMs)||sliceMs<=0||!Number.isInteger(checkInterval)||checkInterval<1)
    throw new RangeError('Invalid retained execution scheduling policy');
  let calls=0,last=performance.now(),closed=false;
  const abortReason=()=>signal?.reason??new DOMException('VKF execution cancelled','AbortError');
  const check=()=>{if(closed||signal?.aborted)throw abortReason();};
  return Object.freeze({
    poll(a,b,c){
      if(a!==0||b!==0||c!==0)throw new TypeError('Malformed retained execution poll');
      check();
      if(++calls%checkInterval!==0||performance.now()-last<sliceMs)return 0;
      return new Promise((resolve,reject)=>{
        let timer;
        const clean=()=>signal?.removeEventListener('abort',abort);
        const abort=()=>{clearTimeout(timer);clean();reject(abortReason());};
        timer=setTimeout(()=>{clean();try{check();last=performance.now();resolve(0);}catch(error){reject(error);}},0);
        signal?.addEventListener('abort',abort,{once:true});
        if(signal?.aborted)abort();
      });
    },
    check,
    close(){closed=true;},
  });
}
