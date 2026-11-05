import {createNormalPhysicsProgramIssuer} from './vkf-normal-physics-program.mjs?sha256=96a6931d3215793bbbc1c5c23724e4145e25c11ca27b0c73b20020f701d43260';
import { createSymbolicKernel } from "../vf-ui/vf-symbolic-kernel-runtime.mjs";

// The factory is the cross-compiled canonical C++ compiler. Callers supply its
// pinned JS/WASM/stdlib package; compilation and evaluation stay inside WASM.
export async function createCanonicalBrowserCompiler({ factory, ...options }) {
  const compiler = await factory(options);
  const issueNormalPhysicsProgram=createNormalPhysicsProgramIssuer(compiler);
  function mountSourceFiles(filename, sourceFiles) {
    if (sourceFiles === undefined) return () => {};
    if (!Array.isArray(sourceFiles)) throw new TypeError('VKF sourceFiles must be an array');
    const localPath = value => typeof value === 'string' && value.startsWith('/') && value.endsWith('.vkf') &&
      !/[\\\0]/.test(value) && value.slice(1).split('/').every(part => part && part !== '.' && part !== '..');
    if (!localPath(filename)) throw new TypeError('Imported VKF source requires an absolute local entry filename');
    const directory = filename.slice(0, filename.lastIndexOf('/') + 1);
    if (directory === '/' || filename.startsWith('/compiler/') || filename.startsWith('/vkf/'))
      throw new TypeError('Imported VKF source must use its own local source directory');
    const inputs = [], names = new Set();
    for (const file of sourceFiles) {
      if (!file || !localPath(file.filename) || !file.filename.startsWith(directory) ||
          file.filename === filename || typeof file.source !== 'string' || names.has(file.filename))
        throw new TypeError('Invalid or duplicate source-relative VKF input');
      names.add(file.filename); inputs.push({filename:file.filename, source:file.source});
    }
    if (!inputs.length) return () => {};
    const FS = compiler.FS;
    if (!FS || typeof FS.writeFile !== 'function' || typeof FS.analyzePath !== 'function')
      throw new TypeError('Compiler local source filesystem is unavailable');
    for (const file of inputs) if (FS.analyzePath(file.filename).exists)
      throw new TypeError('Local VKF input would replace an existing compiler file');
    const files = [], directories = [];
    const cleanup = () => {
      // Only paths created by this compile are owned here. Removing them also
      // prevents a later Run with fewer inputs from resolving a stale import.
      let failure;
      for (const path of files.slice().reverse()) {
        try { if (FS.analyzePath(path).exists) FS.unlink(path); }
        catch (error) { failure ??= error; }
      }
      for (const path of directories.slice().reverse()) {
        try { FS.rmdir(path); }
        catch (error) { failure ??= error; }
      }
      if (failure) throw failure;
    };
    try {
      for (const file of inputs) {
        const parts = file.filename.slice(1).split('/'); parts.pop();
        let path = '';
        for (const part of parts) {
          path += '/' + part;
          if (!FS.analyzePath(path).exists) { FS.mkdir(path); directories.push(path); }
        }
        // SourceLinker reads ordinary mutable local .vkf files. No registry,
        // immutable package mount or compiler cache identity is manufactured.
        files.push(file.filename); FS.writeFile(file.filename, file.source);
      }
      return cleanup;
    } catch (error) {
      try { cleanup(); } catch (cleanupError) { throw new AggregateError([error, cleanupError], 'VKF source input mount and cleanup failed'); }
      throw error;
    }
  }
  return Object.freeze({
    compileSource(source, filename = "/browser/program.vkf", {guestArenaBytes, sourceFiles} = {}) {
      if (typeof source !== "string" || typeof filename !== "string") {
        throw new TypeError("VKF source and filename must be strings");
      }
      if (filename.includes("\0")) throw new TypeError("VKF filename contains NUL");
      const size = new TextEncoder().encode(source).length;
      if (guestArenaBytes !== undefined && (!Number.isSafeInteger(guestArenaBytes) || guestArenaBytes < 64*1024*1024 || guestArenaBytes > 1024*1024*1024 || guestArenaBytes % 65536))
        throw new TypeError('guestArenaBytes must be a64KiB-aligned integer in[64MiB,1024MiB]');
      if (guestArenaBytes !== undefined && typeof compiler._vkf_browser_compile_with_arena !== 'function')
        throw new TypeError('Selected compiler does not support requested guest arena capacity');
      const unmountSourceFiles = mountSourceFiles(filename, sourceFiles);
      try {
      const profileStart=performance.now();
      const status = guestArenaBytes === undefined
        ? compiler.ccall("vkf_browser_compile", "number", ["string", "number", "string"], [source, size, filename])
        : compiler.ccall("vkf_browser_compile_with_arena", "number", ["string", "number", "string", "number"], [source, size, filename, guestArenaBytes]);
      if (status !== 0) {
        throw new Error(compiler.ccall("vkf_browser_error", "string", [], []));
      }
      const compilerCallEnd=performance.now();
      const typedIRText = compiler.ccall("vkf_browser_ir", "string", [], []);
      const manifestText = compiler.ccall("vkf_browser_manifest", "string", [], []);
      const pointer = compiler.ccall("vkf_browser_wasm", "number", [], []);
      const length = compiler.ccall("vkf_browser_wasm_size", "number", [], []);
      const transportReadEnd=performance.now();
      const typedIR=JSON.parse(typedIRText),manifest=JSON.parse(manifestText);
      const parseEnd=performance.now();
      const wasm=compiler.HEAPU8.slice(pointer,pointer+length);
      const wasmCopiedAt=performance.now();
      const nativeProfile=typeof compiler._vkf_browser_compile_profile==='function'?JSON.parse(compiler.ccall('vkf_browser_compile_profile','string',[],[])):undefined;
      const compileProfile={native:nativeProfile,compilerCallMs:compilerCallEnd-profileStart,transportReadMs:transportReadEnd-compilerCallEnd,jsParseMs:parseEnd-transportReadEnd,wasmCopyMs:wasmCopiedAt-parseEnd,profileReadMs:performance.now()-wasmCopiedAt,typedIRChars:typedIRText.length,manifestChars:manifestText.length,guestWasmBytes:length};
      // Copy before the next compiler call reuses its result buffers.
      return issueNormalPhysicsProgram(Object.freeze({ typedIR, typedIRText,
        manifest, manifestText,
        wasm,compileProfile }));
      } finally { unmountSourceFiles(); }
    },
    async runSource(source, filename, options) {
      const program = this.compileSource(source, filename, options);
      const { instance } = await WebAssembly.instantiate(program.wasm);
      const kernel = createSymbolicKernel({ instance, manifest: program.manifest });
      return Object.freeze({ ...program, outputs: kernel.invokeValue("$vkf_main", []) });
    },
  });
}

export async function loadCanonicalBrowserCompiler({ moduleURL, wasmURL, dataURL }) {
  const [{ default: factory }, wasmResponse, dataResponse] = await Promise.all([
    import(moduleURL), fetch(wasmURL), fetch(dataURL),
  ]);
  if (!wasmResponse.ok || !dataResponse.ok) throw new Error("could not load canonical VKF compiler package");
  const [wasmBinary, data] = await Promise.all([wasmResponse.arrayBuffer(), dataResponse.arrayBuffer()]);
  return createCanonicalBrowserCompiler({ factory, wasmBinary,
    getPreloadedPackage: () => data });
}
