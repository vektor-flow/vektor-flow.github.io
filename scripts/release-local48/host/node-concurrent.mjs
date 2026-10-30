import {Worker} from 'node:worker_threads';
import {createBrowserConcurrentImport} from './concurrent/vkf-concurrent-host.mjs';
export function createNodeConcurrent() {
  const workers = new Set(), exits = [], workerErrors = [], receipt = {workers_created:0, workers_closed:0, operations:{}};
  class OwnedWorker extends Worker {
    constructor(url, options) {
      super(url, options); workers.add(this);
      if (url.pathname.endsWith('/vkf-concurrent-worker.mjs')) receipt.workers_created++;
      exits.push(new Promise(resolve=>{this.once('exit',()=>{workers.delete(this); if(url.pathname.endsWith('/vkf-concurrent-worker.mjs'))receipt.workers_closed++;resolve();});}));
      // Error observation is separate from physical exit proof. The exit-only
      // promise never rejects early or creates an unhandled rejection.
      this.on('error',error=>workerErrors.push(error));
    }
  }
  return {receipt, create(module,exportsOf) {
    const host=createBrowserConcurrentImport(module,exportsOf,OwnedWorker);
    return {...host, 'vkf.concurrent':{invoke(...args) {
      receipt.operations[args[0]]=(receipt.operations[args[0]]??0)+1;
      return host['vkf.concurrent'].invoke(...args);
    }}, async close() {
      const errors = [], terminations = [];
      try { host.close(); } catch (error) { errors.push(error); }
      // The browser host uses synchronous close calls. Node termination is
      // asynchronous: attempt every owned worker and await physical exits even
      // if an earlier broker/resource close failed.
      for (const worker of workers) {
        try { terminations.push(Promise.resolve(worker.terminate())); }
        catch (error) { errors.push(error); }
      }
      for (const item of await Promise.allSettled([...exits, ...terminations])) {
        if (item.status === 'rejected') errors.push(item.reason);
      }
      errors.push(...workerErrors);
      if (workers.size) errors.push(new Error('Node workers remain alive'));
      if (errors.length) throw new AggregateError(errors, 'Node concurrent host close failed');
    }};
  }};
}
