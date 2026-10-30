// Source-only contract inspection. No compilation, instantiation or product execution.
export function programRequirements(manifest, requested, wasm = WebAssembly, host = null, concurrent = null) {
  if (!manifest || !Array.isArray(requested)) throw new TypeError('missing emitted manifest/import inventory');
  const wire = manifest.retainedOwner;
  const retained = requested.filter(i => i.module === 'vkf.retained');
  if (Boolean(wire) !== Boolean(retained.length) || retained.length > 1 ||
      retained.some(i => i.kind !== 'function' || i.name !== 'invoke_v1'))
    throw new TypeError('emitted retained import/manifest identity mismatch');
  if (wire && (wire.suspension !== 'jspi-v1' || wire.executionControl !== 'cooperative-branches-v1'))
    throw new TypeError('bac7 retained JSPI/cooperative execution-control contract mismatch');
  const needs = [];
  if (wire && (typeof wasm.Suspending !== 'function' || typeof wasm.promising !== 'function'))
    needs.push('actual JSPI WebAssembly.Suspending/promising for cooperative branches and Frame.load');
  if (wire && (!host || host.abi !== 'vkf-retained-owner-wire-v1' ||
      host.executionControl !== 'cooperative-branches-v1' || typeof host.poll !== 'function' ||
      typeof host.bind !== 'function' || typeof host.close !== 'function' ||
      typeof host.observe !== 'function' || typeof host.imports?.invoke_v1 !== 'function'))
    needs.push('genuine retained renderer/producer host with opcode7 polling and close/load joins');
  for (const i of requested) {
    if (i.kind === 'function' && ((i.module === 'vkf.retained' && i.name === 'invoke_v1') ||
        (i.module === 'vkf.concurrent' && i.name === 'invoke' && typeof concurrent?.create === 'function') ||
        (i.module === 'vkf.clock' && ['wall_seconds', 'monotonic_seconds'].includes(i.name)))) continue;
    needs.push(`genuine host for ${i.module}.${i.name} (${i.kind})`);
  }
  return {status: needs.length ? 'HOST_REQUIRED' : 'READY', reason: needs.join('; '),
    compilerModuleNeedsJSPI: false, emittedProgramNeedsJSPI: Boolean(wire),
    jspiDetected: typeof wasm.Suspending === 'function' && typeof wasm.promising === 'function'};
}
