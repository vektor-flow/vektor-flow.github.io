import { createSymbolicKernel } from "../vf-ui/vf-symbolic-kernel-runtime.mjs";

// The factory is the cross-compiled canonical C++ compiler. Callers supply its
// pinned JS/WASM/stdlib package; compilation and evaluation stay inside WASM.
export async function createCanonicalBrowserCompiler({ factory, ...options }) {
  const compiler = await factory(options);
  return Object.freeze({
    compileSource(source, filename = "/browser/program.vkf") {
      if (typeof source !== "string" || typeof filename !== "string") {
        throw new TypeError("VKF source and filename must be strings");
      }
      if (filename.includes("\0")) throw new TypeError("VKF filename contains NUL");
      const size = new TextEncoder().encode(source).length;
      const status = compiler.ccall("vkf_browser_compile", "number", ["string", "number", "string"], [source, size, filename]);
      if (status !== 0) {
        throw new Error(compiler.ccall("vkf_browser_error", "string", [], []));
      }
      const typedIRText = compiler.ccall("vkf_browser_ir", "string", [], []);
      const manifestText = compiler.ccall("vkf_browser_manifest", "string", [], []);
      const pointer = compiler.ccall("vkf_browser_wasm", "number", [], []);
      const length = compiler.ccall("vkf_browser_wasm_size", "number", [], []);
      // Copy before the next compiler call reuses its result buffers.
      return Object.freeze({ typedIR: JSON.parse(typedIRText), typedIRText,
        manifest: JSON.parse(manifestText), manifestText,
        wasm: compiler.HEAPU8.slice(pointer, pointer + length) });
    },
    async runSource(source, filename) {
      const program = this.compileSource(source, filename);
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
