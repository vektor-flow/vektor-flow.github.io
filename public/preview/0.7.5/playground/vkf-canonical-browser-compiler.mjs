import { createSymbolicKernel } from "../vf-ui/vf-symbolic-kernel-runtime.mjs";

// The factory is the cross-compiled canonical C++ compiler. Callers supply its
// pinned JS/WASM/stdlib package; compilation and evaluation stay inside WASM.
export async function createCanonicalBrowserCompiler({ factory, ...options }) {
  const compiler = await factory(options);
  return Object.freeze({
    compileSource(source, filename = "/browser/program.vkf", {guestArenaBytes} = {}) {
      if (typeof source !== "string" || typeof filename !== "string") {
        throw new TypeError("VKF source and filename must be strings");
      }
      if (filename.includes("\0")) throw new TypeError("VKF filename contains NUL");
      const size = new TextEncoder().encode(source).length;
      if (guestArenaBytes !== undefined && (!Number.isSafeInteger(guestArenaBytes) || guestArenaBytes < 64*1024*1024 || guestArenaBytes > 1024*1024*1024 || guestArenaBytes % 65536))
        throw new TypeError('guestArenaBytes must be a64KiB-aligned integer in[64MiB,1024MiB]');
      if (guestArenaBytes !== undefined && typeof compiler._vkf_browser_compile_with_arena !== 'function')
        throw new TypeError('Selected compiler does not support requested guest arena capacity');
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
      return Object.freeze({ typedIR, typedIRText,
        manifest, manifestText,
        wasm,compileProfile });
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
