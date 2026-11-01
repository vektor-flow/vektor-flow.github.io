import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {readBytes} from './host.mjs';
import {mountInputs} from './inputs.mjs';
import {prepareAddressProject} from './addresses.mjs';
import {fail} from './metadata.mjs';
import {prepareFormatterIr} from '../prepare-formatter-ir.mjs';

export async function createProjectCompiler({compilerModule, factory, compilerOptions = {}} = {}) {
  if (!factory) {
    if (!compilerModule) fail('compilerModule must name the maintained canonical compiler.mjs');
    ({default: factory} = await import(pathToFileURL(path.resolve(compilerModule))));
  }
  if (typeof factory !== 'function') fail('canonical compiler factory unavailable');
  if (compilerModule) {
    const folder = path.dirname(path.resolve(compilerModule));
    const wasmBinary = await readBytes(path.join(folder, 'compiler.wasm'), 256 * 1024 * 1024);
    const data = await readBytes(path.join(folder, 'compiler.data'), 64 * 1024 * 1024);
    compilerOptions = {wasmBinary, getPreloadedPackage: () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), ...compilerOptions};
  }
  const owner = await factory(compilerOptions);
  if (typeof owner?._vkf075_package_source_inputs_version !== 'function' || owner._vkf075_package_source_inputs_version() < 2) fail('compiler lacks the explicit package SourceProvider adapter; rebuild current source');
  const rawVersion = owner.ccall('vkf075_version', 'string', [], []);
  const compilerVersion = /^VKF ([0-9]+\.[0-9]+\.[0-9]+)$/.exec(rawVersion)?.[1];
  if (!compilerVersion) fail('compiler did not report a stable version');
  const sourceBinding = owner.ccall('vkf075_source_binding', 'string', [], []);
  if (!/^[a-f0-9]{64}$/.test(sourceBinding)) fail('compiler source binding unavailable');
  async function prepareSources(projectDir, options = {}) {
    const discover = async request => {
      if (typeof owner._vkf075_discover_source_addresses !== 'function') fail('compiler lacks static source-address discovery; integrate the compiler address-import source');
      // The allowed source graph can exceed the fixed C stack after JSON
      // escaping. Keep its complete UTF8+NUL bytes on this compiler's heap.
      const bytes = new TextEncoder().encode(JSON.stringify(request));
      const pointer = owner._malloc(bytes.byteLength + 1);
      if (!pointer) fail('source discovery transport allocation failed');
      try {
        owner.HEAPU8.set(bytes, pointer);
        owner.HEAPU8[pointer + bytes.byteLength] = 0;
        // ccall converts the borrowed response to a JS string before cleanup;
        // parsing and error handling stay inside the serialized transaction.
        const response = JSON.parse(owner.ccall('vkf075_discover_source_addresses', 'string', ['number'], [pointer]));
        if (!response.ok) fail(`source discovery: ${response.error ?? 'failed'}`);
        return response;
      } finally { owner._free(pointer); }
    };
    return prepareAddressProject(projectDir, {...options, discover, compilerVersion, target: 'wasm'});
  }
  async function execute(compiled) {
    const module = await WebAssembly.compile(compiled.wasm);
    if (WebAssembly.Module.imports(module).length) fail('this Node runner has no retained/concurrent host capability; use the existing canonical browser runner for those programs');
    const api = new WebAssembly.Instance(module, {}).exports;
    const entry = compiled.result.manifest.functions.$vkf_main;
    if (!entry || entry.parameters !== 0 || api.vkf_vm_invoke(entry.index, 0) !== 0) fail('canonical guest entry failed');
    const formatter = owner.formatterOwner;
    if (!formatter) fail('paired canonical formatter unavailable');
    if (prepareFormatterIr(formatter, JSON.stringify(compiled.result.ir)) !== 0) fail('canonical formatter IR preparation failed');
    const used = Math.max(api.vkf_vm_heap_ptr(), api.vkf_vm_results_ptr() + api.vkf_vm_value_slot_size());
    if (!Number.isSafeInteger(used) || used < 0 || used > api.memory.buffer.byteLength) fail('invalid canonical guest output extent');
    const pointer = formatter._malloc(used);
    if (!pointer) fail('canonical formatter output allocation failed');
    try {
      formatter.HEAPU8.set(new Uint8Array(api.memory.buffer, 0, used), pointer);
      if (formatter.ccall('vkf_browser_format_stdout', 'number', ['number', 'number', 'number'], [pointer, used, api.vkf_vm_results_ptr()]) !== 0) fail('canonical guest output formatting failed');
      return {...compiled, stdout: formatter.ccall('vkf_browser_stdout', 'string', [], [])};
    } finally { formatter._free(pointer); }
  }
  let pending = Promise.resolve();
  return Object.freeze({
    compilerVersion, sourceBinding,
    prepareProject(projectDir, options = {}) {
      const next = pending.then(() => prepareSources(projectDir, options));
      pending = next.catch(() => {}); return next;
    },
    compileProject(projectDir, options = {}, executeGuest = false) {
      // One compiler/formatter owns global response data and MEMFS. Serialize
      // the entire prepare/mount/compile transaction, including local edits.
      const next = pending.then(async () => {
        if (options.target !== undefined && options.target !== 'wasm') fail('this host compiles WASM only');
        const {lock, inputs} = await prepareSources(projectDir, options);
        const entry = mountInputs(owner, inputs);
        const text = owner.FS.readFile(entry, {encoding: 'utf8'});
        const response = owner.ccall('vkf075_compile', 'string', ['string', 'string'], [text, entry]);
        const result = JSON.parse(response);
        if (!result.ok) fail(`compile/${result.phase ?? 'unknown'}: ${result.error}`);
        if (result.source_binding !== sourceBinding || typeof result.wasm_hex !== 'string' ||
            !/^(?:[a-f0-9]{2})+$/.test(result.wasm_hex)) fail('invalid canonical compiler artifact');
        const compiled = {result, wasm: Buffer.from(result.wasm_hex, 'hex'), lock, inputs, inputDigest: inputs.inputDigest, sourceBinding};
        return executeGuest ? execute(compiled) : compiled;
      });
      pending = next.catch(() => {});
      return next;
    },
    runProject(projectDir, options = {}) { return this.compileProject(projectDir, options, true); },
  });
}

export async function compileProject(projectDir, options) {
  const compiler = await createProjectCompiler(options);
  return compiler.compileProject(projectDir, options);
}

export async function writeArtifact(compiled, out) {
  // Generated build outputs are deliberately separate from the source cache.
  await fs.mkdir(out, {recursive: true});
  await fs.writeFile(path.join(out, 'program.wasm'), compiled.wasm);
  await fs.writeFile(path.join(out, 'program.manifest.json'), JSON.stringify(compiled.result.manifest, null, 2) + '\n');
  await fs.writeFile(path.join(out, 'inputs.json'), JSON.stringify({schema: 1, inputDigest: compiled.inputDigest,
    sourceBinding: compiled.sourceBinding, target: 'wasm'}, null, 2) + '\n');
}
