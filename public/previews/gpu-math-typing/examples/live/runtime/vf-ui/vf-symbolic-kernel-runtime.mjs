import {captureValue, materializeValue} from "../playground/vkf-concurrent-values.mjs";

const TAG = Object.freeze({
  null: 0,
  boolean: 1,
  number: 2,
  string: 3,
  array: 4,
  record: 5,
  tuple: 6,
  nominal: 8,
  multiset: 9,
  unitView: 12,
  complex: 10,
});

// Live arena addresses are not ownership: later VM collection can reuse them.
// Keep retained handle payloads losslessly in the host, without expression evaluation.
const retainedGraphs = new WeakMap();
const SLOT_SIZE = 16;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });
// Retain copied compiler metadata without exposing or inferring element shapes.
const transportedArrayShapes = new WeakMap();

// A branded transport value keeps complex numbers distinct from ordinary
// records with real/imaginary fields. Arithmetic remains inside VKF/WASM.
export class SymbolicKernelComplex {
  constructor(real, imaginary) {
    if (typeof real !== "number" || typeof imaginary !== "number") {
      throw new TypeError("VKF complex components must be numbers");
    }
    this.real = real;
    this.imaginary = imaginary;
    Object.freeze(this);
  }
}

// These wrappers transport canonical tagged values. They do not merge keys,
// calculate multiplicities, or execute nominal methods in the host.
export class SymbolicKernelNominal {
  constructor(typeName, value) {
    if (typeof typeName !== "string") throw new TypeError("VKF nominal type name must be a string");
    this.typeName = typeName;
    this.value = value;
    Object.freeze(this);
  }
}

export class SymbolicKernelMultiset {
  constructor(entries) {
    if (!Array.isArray(entries) || entries.some(entry => !Array.isArray(entry) || entry.length !== 2)) {
      throw new TypeError("VKF multiset transport requires key/count pairs");
    }
    this.entries = Object.freeze(entries.map(entry => Object.freeze([...entry])));
    Object.freeze(this);
  }
}

export class SymbolicKernelHandle {
  constructor(kernel, pointer) {
    this.kernel = kernel;
    this.pointer = pointer;
    Object.freeze(this);
  }
}

function requireFunction(exportsObject, name) {
  if (typeof exportsObject[name] !== "function") {
    throw new TypeError(`VKF symbolic kernel export "${name}" is required`);
  }
  return exportsObject[name];
}

function validateManifest(manifest) {
  if (
    manifest?.schema !== "vektor-flow.symbolic-kernel"
    || !manifest.functions
    || typeof manifest.functions !== "object"
  ) {
    throw new TypeError("invalid VKF symbolic kernel manifest");
  }
  if (manifest.requiredHost?.importModule === 'vkf.concurrent') {
    throw new TypeError('persistent symbolic kernels do not own concurrent Worker lifetimes; use the concurrent browser runner');
  }
  return manifest;
}

async function responseJson(source) {
  if (
    source
    && typeof source === "object"
    && !(source instanceof Response)
    && !(source instanceof URL)
  ) {
    return source;
  }
  const response = typeof source === "string" || source instanceof URL
    ? await fetch(source)
    : source;
  if (!(response instanceof Response) || !response.ok) {
    throw new Error("could not load VKF symbolic kernel manifest");
  }
  return response.json();
}

async function instantiate(source, imports = {}) {
  if (source instanceof WebAssembly.Instance) return source;
  if (source instanceof WebAssembly.Module) {
    return WebAssembly.instantiate(source, imports);
  }
  let input = source;
  if (typeof input === "string" || input instanceof URL) input = await fetch(input);
  if (input instanceof Response) {
    try {
      const result = await WebAssembly.instantiateStreaming(input.clone(), imports);
      return result.instance;
    } catch {
      input = await input.arrayBuffer();
    }
  }
  const result = await WebAssembly.instantiate(input, imports);
  return result instanceof WebAssembly.Instance ? result : result.instance;
}

export function createSymbolicKernel({ instance, manifest }) {
  if (!(instance instanceof WebAssembly.Instance)) {
    throw new TypeError("VKF symbolic kernel requires a WebAssembly.Instance");
  }
  const metadata = validateManifest(manifest);
  const exportsObject = instance.exports;
  if (!(exportsObject.memory instanceof WebAssembly.Memory)) {
    throw new TypeError('VKF symbolic kernel export "memory" is required');
  }
  const argumentPointer = requireFunction(exportsObject, "vkf_vm_arguments_ptr");
  const argumentCapacity = requireFunction(exportsObject, "vkf_vm_arguments_capacity");
  const resultPointer = requireFunction(exportsObject, "vkf_vm_results_ptr");
  const allocate = requireFunction(exportsObject, "vkf_vm_alloc");
  const heapPointer = requireFunction(exportsObject, "vkf_vm_heap_ptr");
  const rewind = requireFunction(exportsObject, "vkf_vm_rewind");
  const invokeWasm = requireFunction(exportsObject, "vkf_vm_invoke");
  const slotSize = requireFunction(exportsObject, "vkf_vm_value_slot_size")();
  if (slotSize !== SLOT_SIZE && slotSize !== 24) {
    throw new RangeError(`unsupported VKF value slot size ${slotSize}`);
  }

  const dataView = () => new DataView(exportsObject.memory.buffer);
  const bytes = () => new Uint8Array(exportsObject.memory.buffer);

  function checkedRange(pointer, length, operation) {
    if (
      !Number.isInteger(pointer)
      || pointer < 0
      || !Number.isInteger(length)
      || length < 0
      || pointer + length > exportsObject.memory.buffer.byteLength
    ) {
      throw new RangeError(`${operation} addressed invalid WASM memory`);
    }
  }

  function allocateBytes(length) {
    const pointer = allocate(length);
    checkedRange(pointer, length, "VKF allocation");
    return pointer;
  }

  function writeValue(pointer, value) {
    checkedRange(pointer, slotSize, "VKF argument");
    const view = dataView();
    bytes().fill(0, pointer, pointer + slotSize);
    if (value instanceof SymbolicKernelHandle) {
      if (value.kernel !== kernel) {
        throw new TypeError("symbolic handles cannot cross kernel instances");
      }
      const source = retainedPointer(value);
      const width = dataView().getUint32(source, true) === TAG.complex ? 24 : SLOT_SIZE;
      checkedRange(source, width, "VKF handle");
      bytes().copyWithin(pointer, source, source + width);
      return;
    }
    if (value instanceof SymbolicKernelComplex) {
      if (slotSize < 24) throw new RangeError("VKF kernel does not support complex arguments");
      view.setUint32(pointer, TAG.complex, true);
      view.setFloat64(pointer + 8, value.real, true);
      view.setFloat64(pointer + 16, value.imaginary, true);
      return;
    }
    if (value instanceof SymbolicKernelNominal) {
      const name = allocateBytes(slotSize);
      const represented = allocateBytes(slotSize);
      writeValue(name, value.typeName);
      writeValue(represented, value.value);
      const current = dataView();
      current.setUint32(pointer, TAG.nominal, true);
      current.setUint32(pointer + 4, name, true);
      current.setUint32(pointer + 8, represented, true);
      return;
    }
    if (value instanceof SymbolicKernelMultiset) {
      const payload = allocateBytes(value.entries.length * 8);
      value.entries.forEach(([key, count], index) => {
        const keyPointer = allocateBytes(slotSize);
        const countPointer = allocateBytes(slotSize);
        writeValue(keyPointer, key);
        writeValue(countPointer, count);
        const current = dataView();
        current.setUint32(payload + index * 8, keyPointer, true);
        current.setUint32(payload + index * 8 + 4, countPointer, true);
      });
      const current = dataView();
      current.setUint32(pointer, TAG.multiset, true);
      current.setUint32(pointer + 4, value.entries.length, true);
      current.setUint32(pointer + 8, payload, true);
      return;
    }
    if (value == null) {
      view.setUint32(pointer, TAG.null, true);
      return;
    }
    if (typeof value === "boolean") {
      view.setUint32(pointer, TAG.boolean, true);
      view.setUint32(pointer + 8, value ? 1 : 0, true);
      return;
    }
    if (typeof value === "number") {
      view.setUint32(pointer, TAG.number, true);
      view.setFloat64(pointer + 8, value, true);
      return;
    }
    if (typeof value === "string") {
      const encoded = textEncoder.encode(value);
      const textPointer = allocateBytes(encoded.byteLength);
      bytes().set(encoded, textPointer);
      const current = dataView();
      current.setUint32(pointer, TAG.string, true);
      current.setUint32(pointer + 4, encoded.byteLength, true);
      current.setUint32(pointer + 8, textPointer, true);
      return;
    }
    if (Array.isArray(value)) {
      const entriesPointer = allocateBytes(value.length * 4);
      const current = dataView();
      current.setUint32(pointer, TAG.array, true);
      current.setUint32(pointer + 4, value.length, true);
      current.setUint32(pointer + 8, entriesPointer, true);
      value.forEach((entry, index) => {
        const entryPointer = allocateBytes(slotSize);
        writeValue(entryPointer, entry);
        dataView().setUint32(entriesPointer + index * 4, entryPointer, true);
      });
      const shape = transportedArrayShapes.get(value);
      // A caller may edit its decoded JS copy. Retain supplied compiler shape
      // only while the copied collection still satisfies those known extents;
      // a mismatch drops metadata rather than guessing replacement dimensions.
      const stillMatches = (array, depth) => Array.isArray(array)
        && array.length === shape[depth]
        && (depth + 1 === shape.length || array.every(child => stillMatches(child, depth + 1)));
      if (shape && shape.length && stillMatches(value, 0)) {
        const shapePointer = allocateBytes(slotSize);
        writeValue(shapePointer, shape);
        dataView().setUint32(pointer + 12, shapePointer, true);
      }
      return;
    }
    if (typeof value === "object") {
      const entries = Object.entries(value);
      const entriesPointer = allocateBytes(entries.length * 8);
      const current = dataView();
      current.setUint32(pointer, TAG.record, true);
      current.setUint32(pointer + 4, entries.length, true);
      current.setUint32(pointer + 8, entriesPointer, true);
      entries.forEach(([key, entry], index) => {
        const keyPointer = allocateBytes(slotSize);
        const valuePointer = allocateBytes(slotSize);
        writeValue(keyPointer, key);
        writeValue(valuePointer, entry);
        const entryPointer = entriesPointer + index * 8;
        dataView().setUint32(entryPointer, keyPointer, true);
        dataView().setUint32(entryPointer + 4, valuePointer, true);
      });
      return;
    }
    throw new TypeError(
      "VKF arguments must use the tagged scalar, array, record, or handle ABI",
    );
  }

  function decodeValue(pointer, active = new Set()) {
    checkedRange(pointer, slotSize, "VKF result");
    if (active.has(pointer)) {
      throw new TypeError("cyclic VKF values cannot cross the browser ABI");
    }
    const view = dataView();
    const tag = view.getUint32(pointer, true);
    const length = view.getUint32(pointer + 4, true);
    const payload = view.getUint32(pointer + 8, true);
    if (tag === TAG.null) return null;
    if (tag === TAG.boolean) {
      if (payload > 1 || view.getUint32(pointer + 12, true) !== 0) {
        throw new TypeError("invalid VKF Boolean result slot");
      }
      return payload !== 0;
    }
    if (tag === TAG.number) return view.getFloat64(pointer + 8, true);
    if (tag === TAG.complex) {
      checkedRange(pointer, 24, "VKF complex result");
      return new SymbolicKernelComplex(
        view.getFloat64(pointer + 8, true),
        view.getFloat64(pointer + 16, true),
      );
    }
    if (tag === TAG.string) {
      checkedRange(payload, length, "VKF UTF-8 result");
      return textDecoder.decode(bytes().subarray(payload, payload + length));
    }
    if (tag !== TAG.array && tag !== TAG.tuple && tag !== TAG.record && tag !== TAG.unitView
      && tag !== TAG.nominal && tag !== TAG.multiset) {
      throw new TypeError(`unknown VKF value tag ${tag}`);
    }
    active.add(pointer);
    try {
      if (tag === TAG.nominal) {
        const name = decodeValue(length, active);
        if (typeof name !== "string") throw new TypeError("VKF nominal name requires a string");
        return new SymbolicKernelNominal(name, decodeValue(payload, active));
      }
      if (tag === TAG.multiset) {
        checkedRange(payload, length * 8, "VKF multiset result");
        return new SymbolicKernelMultiset(Array.from({length}, (_, index) => [
          decodeValue(dataView().getUint32(payload + index * 8, true), active),
          decodeValue(dataView().getUint32(payload + index * 8 + 4, true), active),
        ]));
      }
      if (tag === TAG.unitView) {
        const unit = decodeValue(length, active);
        if (typeof unit !== "string") throw new TypeError("VKF unit view requires a unit string");
        return Object.freeze({ unit, value: decodeValue(payload, active) });
      }
      if (tag === TAG.array || tag === TAG.tuple) {
        checkedRange(payload, length * 4, "VKF array result");
        const result = Array.from({ length }, (_, index) =>
          decodeValue(view.getUint32(payload + index * 4, true), active)
        );
        const shapePointer = tag === TAG.array ? dataView().getUint32(pointer + 12, true) : 0;
        if (shapePointer) {
          const shape = decodeValue(shapePointer, active);
          if (!Array.isArray(shape) || shape.some(extent => !Number.isInteger(extent) || extent < 0)) {
            throw new TypeError("VKF array logical shape requires nonnegative integer extents");
          }
          transportedArrayShapes.set(result, shape);
        }
        return result;
      }
      checkedRange(payload, length * 8, "VKF record result");
      const record = Object.create(null);
      for (let index = 0; index < length; index += 1) {
        const entry = payload + index * 8;
        const key = decodeValue(view.getUint32(entry, true), active);
        if (typeof key !== "string") {
          throw new TypeError("VKF record keys must be strings");
        }
        record[key] = decodeValue(view.getUint32(entry + 4, true), active);
      }
      return Object.freeze(record);
    } finally {
      active.delete(pointer);
    }
  }

  function retainedPointer(handle) {
    const graph = retainedGraphs.get(handle);
    return graph ? materializeValue(exportsObject, graph) : handle.pointer;
  }

  function retain(pointer) {
    const graph = captureValue(exportsObject.memory, pointer, heapPointer());
    const retained = allocateBytes(slotSize);
    checkedRange(pointer, slotSize, "VKF retained result");
    bytes().copyWithin(retained, pointer, pointer + slotSize);
    const handle = new SymbolicKernelHandle(kernel, retained);
    retainedGraphs.set(handle, graph);
    return handle;
  }

  function recordFieldPointer(pointer, field) {
    checkedRange(pointer, slotSize, "VKF record handle");
    const view = dataView();
    if (view.getUint32(pointer, true) !== TAG.record) {
      throw new TypeError("VKF handle does not contain a record");
    }
    const length = view.getUint32(pointer + 4, true);
    const payload = view.getUint32(pointer + 8, true);
    checkedRange(payload, length * 8, "VKF record handle entries");
    for (let index = 0; index < length; index += 1) {
      const entry = payload + index * 8;
      const keyPointer = view.getUint32(entry, true);
      if (decodeValue(keyPointer) === field) {
        return view.getUint32(entry + 4, true);
      }
    }
    throw new RangeError(`VKF record does not contain field "${field}"`);
  }

  function retainField(handle, field) {
    if (!(handle instanceof SymbolicKernelHandle) || handle.kernel !== kernel) {
      throw new TypeError("retainField requires a handle from this kernel");
    }
    return retain(recordFieldPointer(retainedPointer(handle), field));
  }

  function invokePointer(name, args) {
    const signature = metadata.functions[name];
    if (!signature) throw new RangeError(`unknown VKF function "${name}"`);
    if (args.length !== signature.parameters) {
      throw new RangeError(
        `${name} expects ${signature.parameters} arguments, got ${args.length}`,
      );
    }
    if (args.length > argumentCapacity()) {
      throw new RangeError("VKF argument capacity exceeded");
    }
    const base = argumentPointer();
    args.forEach((value, index) => writeValue(base + index * slotSize, value));
    let status;
    try {
      status = invokeWasm(signature.index, args.length);
    } catch (cause) {
      // Only translate an explicitly raised VKF error. Ordinary WASM traps
      // without compiler-owned error metadata remain runtime failures.
      const control = exportsObject.vkf_vm_error_control_ptr;
      if (!(cause instanceof WebAssembly.RuntimeError)
          || !(control instanceof WebAssembly.Global)) throw cause;
      const pointer = control.value;
      checkedRange(pointer, 28, "VKF error control");
      const view = dataView();
      const mask = view.getUint32(pointer + 24, true);
      if (!mask) throw cause;
      const value = decodeValue(view.getUint32(pointer + 20, true));
      if (typeof value?.message !== "string") throw cause;
      // The host owns the completed diagnostic; its WASM payload may be
      // rewound by invokeTransient before the next independent invocation.
      view.setUint32(pointer + 20, 0, true);
      view.setUint32(pointer + 24, 0, true);
      const error = new Error(value.message, {cause});
      error.name = "VKFError";
      error.mask = mask;
      error.value = value;
      throw error;
    }
    if (status !== 0) {
      throw new Error(`VKF invocation "${name}" failed with status ${status}`);
    }
    return resultPointer();
  }

  function invoke(name, args = []) {
    const pointer = invokePointer(name, args);
    return Object.freeze({
      value: decodeValue(pointer),
      handle: retain(pointer),
    });
  }

  function invokeTransient(name, args, materialize) {
    const checkpoint = heapPointer();
    try {
      return materialize(decodeValue(invokePointer(name, args)));
    } finally {
      if (rewind(checkpoint) !== checkpoint) {
        throw new Error("VKF transient allocation checkpoint could not be restored");
      }
    }
  }

  function snapshotPlotArena(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError("VKF symbolic plot must return an arena record");
    }
    const pointer = Number(value.pointer);
    const count = Number(value.count);
    const stride = Number(value.stride);
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError("VKF symbolic plot count must be a non-negative safe integer");
    }
    if (!Number.isSafeInteger(stride) || stride <= 0 || stride % 4 !== 0) {
      throw new RangeError("VKF symbolic plot stride must be a positive Float32-aligned integer");
    }
    const byteLength = count * stride;
    if (!Number.isSafeInteger(byteLength)) {
      throw new RangeError("VKF symbolic plot arena exceeds the safe integer range");
    }
    checkedRange(pointer, byteLength, "VKF symbolic plot arena");
    const data = new Float32Array(
      new Float32Array(exportsObject.memory.buffer, pointer, byteLength / 4),
    );
    const { pointer: _transientPointer, ranges = [], ...metadata } = value;
    return Object.freeze({
      ...metadata,
      count,
      stride,
      data,
      ranges: Object.freeze(ranges.map((range) => Object.freeze({ ...range }))),
    });
  }

  const kernel = Object.freeze({
    invoke,
    invokeValue(name, args = []) {
      return invokeTransient(name, args, (value) => value);
    },
    compile(source) {
      return invoke("symbolic_compile", [source]);
    },
    compileDraft(source) {
      return invoke("symbolic_compile_draft", [source]);
    },
    compileDocument(source, profile = "default", context = null, clip = null) {
      const result = invoke(
        "symbolic_compile_document",
        [source, profile, context, clip],
      );
      return Object.freeze({
        ...result,
        program: result.value?.program == null
          ? null
          : retainField(result.handle, "program"),
      });
    },
    evaluate(program, x, y) {
      return invoke("symbolic_program_evaluate", [program, x, y]).value;
    },
    compileWithContext(source, context, clip = null) {
      return invoke("symbolic_compile_with_context", [source, context, clip]);
    },
    createWorkspace() {
      return invoke("symbolic_workspace", []);
    },
    workspaceCompile(workspace, source, context, clip = null) {
      const result = invoke(
        "symbolic_workspace_compile",
        [workspace, source, context, clip],
      );
      return Object.freeze({
        value: result.value,
        handle: result.handle,
        workspace: retainField(result.handle, "workspace"),
        program: retainField(result.handle, "program"),
      });
    },
    workspaceEvaluate(workspace, handle, x, y, z = 0, t = 0) {
      return invoke(
        "symbolic_workspace_evaluate",
        [workspace, handle, x, y, z, t],
      ).value;
    },
    evaluateAt(program, x, y, z, t, context, workspace) {
      return invoke(
        "symbolic_program_evaluate_at",
        [program, x, y, z, t, context, workspace],
      ).value;
    },
    plot(program, workspace, view, style, revision) {
      return invokeTransient(
        "symbolic_plot",
        [program, workspace, view, style, revision],
        snapshotPlotArena,
      );
    },
    plotVariant(program, workspace, view, style, revision, variantIndex) {
      return invokeTransient(
        "symbolic_plot_variant",
        [program, workspace, view, style, revision, variantIndex],
        snapshotPlotArena,
      );
    },
    get memory() {
      return exportsObject.memory;
    },
    decode(handle) {
      if (!(handle instanceof SymbolicKernelHandle) || handle.kernel !== kernel) {
        throw new TypeError("decode requires a handle from this kernel");
      }
      return decodeValue(retainedPointer(handle));
    },
  });
  return kernel;
}

export async function loadSymbolicKernel({
  wasm,
  manifest,
  imports = {},
}) {
  const [instance, metadata] = await Promise.all([
    instantiate(wasm, imports),
    responseJson(manifest),
  ]);
  return createSymbolicKernel({ instance, manifest: metadata });
}

export const PACKAGED_SYMBOLIC_KERNEL_URLS = Object.freeze({
  wasm: new URL("./artifacts/vkf-symbolic-kernel.wasm", import.meta.url),
  manifest: new URL("./artifacts/vkf-symbolic-kernel.json", import.meta.url),
});

export function loadPackagedSymbolicKernel(options = {}) {
  return loadSymbolicKernel({
    wasm: options.wasm ?? PACKAGED_SYMBOLIC_KERNEL_URLS.wasm,
    manifest: options.manifest ?? PACKAGED_SYMBOLIC_KERNEL_URLS.manifest,
    imports: options.imports ?? {},
  });
}

export const SYMBOLIC_KERNEL_VALUE_ABI = Object.freeze({
  tags: TAG,
  slotSize: SLOT_SIZE,
});
