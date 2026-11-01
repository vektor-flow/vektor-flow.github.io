import {createSymbolicKernel} from '../vf-symbolic-kernel-runtime.mjs';

// The guest owns parsing, font lookup, layout and box serialization. This worker
// only transports values through the maintained tagged-value ABI. No host
// imports are admitted, so terminating it also ends all execution it owns.
let module, manifest, catalog, identity;
self.onmessage = async ({data}) => {
  try {
    if (data?.type === 'initialize') {
      if (module) throw new Error('WASM_LABEL_ALREADY_INITIALIZED');
      const compiled = await WebAssembly.compile(data.wasm);
      if (WebAssembly.Module.imports(compiled).length)
        throw new Error('WASM_LABEL_HOST_IMPORTS_UNSUPPORTED');
      if (data.manifest?.functions?.math_layout?.parameters !== 6)
        throw new Error('WASM_LABEL_ENTRY_UNAVAILABLE');
      module = compiled; manifest = data.manifest;
      catalog = data.catalog; identity = data.identity;
      self.postMessage({id: data.id, identity});
      return;
    }
    if (data?.type !== 'typeset' || !module || typeof data.source !== 'string')
      throw new Error('WASM_LABEL_REQUEST_UNAVAILABLE');
    // A fresh instance prevents one label's heap/state/diagnostics from leaking
    // into the next. The immutable compiled module is the only reused code.
    const started = performance.now();
    const instance = new WebAssembly.Instance(module, {});
    const instantiated = performance.now();
    const kernel = createSymbolicKernel({instance, manifest});
    const kernelReady = performance.now();
    const json = kernel.invokeValue('math_layout', [data.source, catalog, true, true, false, 1]);
    if (typeof json !== 'string') throw new Error('WASM_LABEL_OUTPUT_NOT_STRING');
    const invoked = performance.now(), box = JSON.parse(json), decoded = performance.now();
    self.postMessage({id: data.id, source: data.source, identity, box, timing: {instanceMs:instantiated-started,kernelSetupMs:kernelReady-instantiated,argumentTransferGuestInvokeAndOutputDecodeMs:invoked-kernelReady,jsonParseMs:decoded-invoked,totalWorkerMs:decoded-started}});
  } catch (error) {
    self.postMessage({id: data?.id, error: String(error?.message || error)});
  }
};
