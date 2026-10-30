import {programRequirements} from '../../program-capabilities.mjs';
// Actual emitted-program consumer, shared by qualification and the live shell.
// No source evaluator, fixture loader, record-as-owner path or VM simulation.
export async function executeEmittedProgramV1(bytes, manifest, entry, options) {
  const {diagnosticBoundary, decodeOutputStream, prerequisiteError} = options;
  const need = message => { throw prerequisiteError(message); };
  const retained = options.retainedHost || null;
  let failure = null, failed = false, concurrentHost = null;
  let api;
  try {
    const module = await WebAssembly.compile(bytes), imports = {};
    const requested = WebAssembly.Module.imports(module);
    const retainedImports = requested.filter(i => i.module === 'vkf.retained');
    const wire = manifest && manifest.retainedOwner;
    const requirement = programRequirements(manifest, requested, WebAssembly, retained, options.concurrent);
    if (requirement.status !== 'READY') need(requirement.reason);
    if (Boolean(wire) !== Boolean(retainedImports.length) || retainedImports.length > 1 ||
        retainedImports.some(i => i.kind !== 'function' || i.name !== 'invoke_v1'))
      throw new TypeError('emitted retained import/manifest identity mismatch');
    const suspension = wire?.suspension;
    if (suspension !== undefined && suspension !== 'jspi-v1')
      throw new TypeError('unsupported emitted retained suspension contract');
    if (wire && (!retained || retained.abi !== 'vkf-retained-owner-wire-v1' ||
        typeof retained.bind !== 'function' || typeof retained.close !== 'function' ||
        typeof retained.imports?.invoke_v1 !== 'function'))
      need('actual retained renderer/producer host is unavailable for this instance');
    if (suspension && (typeof WebAssembly.Suspending !== 'function' || typeof WebAssembly.promising !== 'function'))
      need('actual JSPI suspension/promising support is required for retained cooperative branches and Frame.load');
    for (const i of requested) {
      if (i.kind !== 'function') need(`missing genuine host prerequisite ${i.module}.${i.name} (${i.kind})`);
      if (i.module === 'vkf.clock' && i.name === 'wall_seconds') {
        (imports[i.module] ??= {})[i.name] = () => Date.now()/1000; continue;
      }
      if (i.module === 'vkf.clock' && i.name === 'monotonic_seconds') {
        (imports[i.module] ??= {})[i.name] = () => performance.now()/1000; continue;
      }
      if (i.module === 'vkf.concurrent' && i.name === 'invoke') {
        concurrentHost ??= options.concurrent.create(module, () => api);
        imports[i.module] = concurrentHost['vkf.concurrent']; continue;
      }
      if (i.module === 'vkf.retained' && i.name === 'invoke_v1') {
        const invoke = (op,a,b,c) => op === 7 ? retained.poll(a,b,c) : retained.imports.invoke_v1(op,a,b,c);
        (imports[i.module] ??= {})[i.name] = suspension ? new WebAssembly.Suspending(invoke) : invoke;
        continue;
      }
      need(`missing genuine host prerequisite ${i.module}.${i.name} (${i.kind})`);
    }
    const instance = await WebAssembly.instantiate(module, imports), e = instance.exports;
    api = e;
    if (wire) { retained.bind(e, manifest); }
    // The same964 decoder validates the exact bound instance, and the same968
    // decoder consumes the original ordered output nodes. No import error is
    // converted into a language Error or a positive test result.
    const boundary = diagnosticBoundary(e, manifest);
    const code = suspension ? await boundary.invokeAsync(entry.index, 0,
      WebAssembly.promising(e[manifest.runtimeDiagnostic.invokeExport])) : boundary.invoke(entry.index, 0);
    if (code !== 0) throw new Error(`emitted program returned VM status ${code}`);
    concurrentHost?.materializeOutput();
    const stream = decodeOutputStream(e, manifest);
    if (options.observe) await options.observe({instance, manifest, stream,
      retainedScene: wire ? retained.observe() : null});
    return {...stream, exports: Object.keys(e), imports: requested, slotSize: e.vkf_vm_value_slot_size()};
  } catch (error) { failed = true; failure = error; throw error; }
  finally {
    // Once instantiated, this context is never reused/re-entered/reset while a
    // JSPI stack/load is live. close joins all real loads before invalidation.
    // Start every independent owned close before awaiting either one.
    const closeResults = await Promise.allSettled([concurrentHost, retained]
      .filter(Boolean).map(owned => Promise.resolve().then(() => owned.close())));
    const closeErrors = closeResults.filter(item => item.status === 'rejected')
      .map(item => item.reason);
    if (closeErrors.length) {
      if (!failed) throw new AggregateError(closeErrors, 'emitted program host close failed');
      if (failure && (typeof failure === 'object' || typeof failure === 'function')) {
        try { Object.defineProperty(failure, 'ownedCloseErrors', {value: closeErrors, configurable: true}); }
        catch { /* Preserve even a frozen primary error. */ }
      }
    }
  }
}
