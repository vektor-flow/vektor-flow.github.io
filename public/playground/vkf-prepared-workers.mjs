// Worker startup is asynchronous. A nonblocking, ready broker owns process
// creation so a VKF worker may wait in Atomics.wait without blocking startup.
const BROKER = new URL('./vkf-ready-broker.mjs', import.meta.url);
export function managedProcessWorkerType(port) {
  let next = 0;
  return class ManagedProcessWorker {
    constructor(url) {
      if (!String(url).endsWith('/vkf-concurrent-worker.mjs')) {
        throw new TypeError('Unsupported VKF process worker module');
      }
      this.id = ++next;
      this.closed = false;
      this.started = false;
    }
    postMessage(payload, transfers = []) {
      if (this.closed || this.started) throw new TypeError('Process worker launch is already consumed');
      this.started = true;
      port.postMessage({type:'vkf-process-start', id:this.id, payload}, transfers);
    }
    terminate() {
      if (this.closed) return;
      this.closed = true;
      port.postMessage({type:'vkf-process-kill', id:this.id});
    }
  };
}
export async function prepareConcurrentWorkerType({WorkerClass = globalThis.Worker,
  maximumProcesses = 64, startupTimeoutMs = 15000} = {}) {
  if (!Number.isSafeInteger(maximumProcesses) || maximumProcesses < 1 || maximumProcesses > 256) {
    throw new RangeError('Invalid concurrent process capacity');
  }
  if (typeof SharedArrayBuffer !== 'function' || typeof WorkerClass !== 'function') {
    throw new TypeError('Concurrent workers require an isolated browser context');
  }
  const broker = new WorkerClass(BROKER, {type:'module',name:'vkf-concurrent-supervisor'});
  try {
    await new Promise((resolve,reject) => {
      const timer=setTimeout(()=>reject(new Error('Concurrent broker startup timed out')),startupTimeoutMs);
      broker.onmessage=({data})=>{if(data?.type==='vkf-broker-loaded')broker.postMessage({type:'vkf-supervisor-init',maximumProcesses});if(data?.type==='vkf-broker-ready'){clearTimeout(timer);resolve();}};
      broker.onerror=()=>{clearTimeout(timer);reject(new Error('Concurrent broker startup failed'));};
    });
    broker.onmessage=null;
    broker.onerror=null;
  } catch(error) {broker.terminate();throw error;}
  const ProcessWorker = managedProcessWorkerType(broker);
  let brokerAssigned = false;
  const WorkerType = function(url, options) {
    if (String(url).endsWith('/vkf-concurrent-broker.mjs')) {
      if (brokerAssigned) throw new TypeError('Concurrent broker is already attached');
      brokerAssigned=true;
      return broker;
    }
    return new ProcessWorker(url,options);
  };
  return Object.freeze({WorkerType,close:()=>broker.terminate()});
}
