(function (global) {
  "use strict";
  // This is the trusted host side of the emitted VM import. Enrollment is
  // deliberately absent from the guest import surface. Never enroll source ids.
  let nextGeneration = 1;
  class RetainedPrerequisiteError extends Error {}
  function createRetainedVmBridgeV1(capabilityBridge, options) {
    options = options || {};
    if (!capabilityBridge || capabilityBridge.abi !== "vkf-retained-owner-lookup-js-v1" ||
        ["get", "kind", "resolve"].some(name => typeof capabilityBridge[name] !== "function")) {
      throw new RetainedPrerequisiteError("actual retained capability bridge v1 is required");
    }
    const internal = global.VfHtmlComponents && global.VfHtmlComponents.__internal;
    if (!internal || !Array.isArray(internal.catalog))
      throw new RetainedPrerequisiteError("actual retained kind catalog is required");
    const knownKinds = new Set(["Display<2>", "Frame<2>", "Frame<3>", "View", "Layer"]);
    for (const entry of internal.catalog) knownKinds.add(entry.identity);
    const maximumEntries = options.maximumEntries === undefined ? 65536 : options.maximumEntries;
    if (!Number.isSafeInteger(maximumEntries) || maximumEntries < 1 || maximumEntries > 65536)
      throw new RangeError("invalid retained capability table bound");
    if (nextGeneration > 0xffffffff) throw new RangeError("retained generation space exhausted");
    const generation = nextGeneration++;
    const records = new Map(), byCapability = new Map(), issuedSlots = new Map();
    let exports = null, bounds = null, disposed = false, closing = false, wireManifest = null;
    const pendingLoads = new Set();
    const decoder = new global.TextDecoder("utf-8", { fatal: true });
    const encoder = new global.TextEncoder();
    function live() {
      if (disposed) throw new TypeError("retained execution has been disposed");
      if (!exports) throw new RetainedPrerequisiteError("retained import is not bound to its VM");
    }
    function uint(value, name) {
      if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
        throw new RangeError("invalid retained " + name);
      return value;
    }
    function memory() { live(); return new DataView(exports.memory.buffer); }
    function range(pointer, size, alignment) {
      uint(pointer, "pointer"); uint(size, "byte count");
      const view = memory(), end = pointer + size;
      const heapEnd = uint(exports.vkf_vm_heap_ptr(), "heap end");
      if (heapEnd < bounds.heapBegin || heapEnd > bounds.heapLimit ||
          pointer === 0 || pointer % alignment || end > view.byteLength || end > 0x100000000 ||
          !((pointer >= bounds.staticBegin && end <= bounds.staticEnd) ||
            (pointer >= bounds.heapBegin && end <= heapEnd)))
        throw new RangeError("retained value is outside owned VM storage");
      return view;
    }
    function slot(pointer) { return range(pointer, 16, 8); }
    function tag(pointer) { return slot(pointer).getUint32(pointer, true); }
    function utf8(pointer) {
      const view = slot(pointer);
      if (view.getUint32(pointer, true) !== 3 || view.getUint32(pointer + 12, true) !== 0)
        throw new TypeError("retained lookup requires a UTF-8 string slot");
      const length = view.getUint32(pointer + 4, true), data = view.getUint32(pointer + 8, true);
      if (length > 1024 * 1024) throw new RangeError("retained string exceeds wire bound");
      if (length === 0 && data === 0) return "";
      range(data, length, 1);
      return decoder.decode(new Uint8Array(exports.memory.buffer, data, length));
    }
    function allocate(bytes) {
      live();
      const pointer = uint(exports.vkf_vm_alloc(bytes), "allocated pointer");
      const view = range(pointer, bytes, 8);
      if (pointer < bounds.heapBegin) throw new RangeError("retained allocation is not heap owned");
      new Uint8Array(view.buffer, pointer, bytes).fill(0);
      // The VM may have recycled an unreachable slot; stale issuance is never
      // authority for a newly produced value in the same storage.
      for (const address of issuedSlots.keys())
        if (address >= pointer && address < pointer + bytes) issuedSlots.delete(address);
      return pointer;
    }
    function scalar(tagValue, payload) {
      const pointer = allocate(16), view = memory();
      view.setUint32(pointer, tagValue, true);
      view.setUint32(pointer + 8, payload, true);
      return pointer;
    }
    function text(value) {
      const bytes = encoder.encode(value);
      if (bytes.length > 1024 * 1024) throw new RangeError("retained string exceeds wire bound");
      const pointer = allocate(16 + bytes.length), view = memory();
      view.setUint32(pointer, 3, true); view.setUint32(pointer + 4, bytes.length, true);
      view.setUint32(pointer + 8, pointer + 16, true);
      new Uint8Array(view.buffer, pointer + 16, bytes.length).set(bytes);
      return pointer;
    }
    function recordForCapability(capability) {
      // These calls validate actual e982 provenance, including foreign tokens.
      const kind = capabilityBridge.kind(capability);
      const value = capabilityBridge.resolve(capability);
      if (!knownKinds.has(kind) || !value || (typeof value !== "object" && typeof value !== "function"))
        throw new TypeError("retained producer lacks an actual concrete resource");
      let record = byCapability.get(capability);
      if (record) {
        if (record.kind !== kind || record.value !== value)
          throw new TypeError("retained producer identity or kind changed");
        return record;
      }
      if (records.size >= maximumEntries) throw new RangeError("retained capability table is full");
      record = { index: records.size + 1, capability, kind, value, load: "ready", error: null };
      records.set(record.index, record); byCapability.set(capability, record);
      return record;
    }
    function handle(record) {
      if (issuedSlots.size >= 65536)
        throw new RangeError("retained issued-slot table is full");
      const pointer = allocate(16), view = memory();
      view.setUint32(pointer, 18, true); view.setUint32(pointer + 4, 1, true);
      view.setUint32(pointer + 8, record.index, true); view.setUint32(pointer + 12, generation, true);
      issuedSlots.set(pointer, record);
      return pointer;
    }
    function requireHandle(pointer) {
      const view = slot(pointer), record = issuedSlots.get(pointer);
      if (view.getUint32(pointer, true) !== 18 || view.getUint32(pointer + 4, true) !== 1 ||
          view.getUint32(pointer + 12, true) !== generation || !record ||
          view.getUint32(pointer + 8, true) !== record.index || records.get(record.index) !== record)
        throw new TypeError("retained handle is unissued, unavailable, altered or foreign");
      // Strong records preserve actual aliases after detach, not after disposal.
      if (capabilityBridge.kind(record.capability) !== record.kind ||
          capabilityBridge.resolve(record.capability) !== record.value)
        throw new TypeError("retained capability no longer resolves to its original resource");
      return record;
    }
    function key(pointer, surface) {
      if (surface === "str") {
        const value = utf8(pointer);
        if (!value) throw new TypeError("retained string id must be nonempty");
        return value;
      }
      const view = slot(pointer);
      if (view.getUint32(pointer, true) !== 2 || view.getUint32(pointer + 4, true) !== 0)
        throw new TypeError("retained integer id requires a Number slot");
      const value = view.getFloat64(pointer + 8, true);
      if (!Number.isSafeInteger(value) || value < 0)
        throw new RangeError("retained integer id is outside exact browser transport");
      return value;
    }
    function contract(pointer) {
      const fields = utf8(pointer).split("\n");
      if (fields.length !== 3 || !fields[0] || (fields[1] !== "str" && fields[1] !== "int"))
        throw new TypeError("invalid retained lookup wire contract");
      const ownerKind = fields[0] === "Frame" ? "Frame<2>" :
        fields[0] === "Display" ? "Display<2>" : fields[0];
      const members = fields[2].split("|");
      if (!knownKinds.has(ownerKind) || !members.length || !members.includes("null") ||
          new Set(members).size !== members.length ||
          members.some(kind => kind !== "null" && !knownKinds.has(kind)))
        throw new TypeError("retained lookup requires its declared concrete nullable union");
      return { ownerKind, keySurface: fields[1], members };
    }
    function ready(record) {
      if (record.load === "loading") throw new RetainedPrerequisiteError("retained resource load is not complete");
      if (record.load === "failed") throw record.error;
    }
    function nullValue(pointer) {
      const view = slot(pointer);
      if (view.getUint32(pointer, true) !== 0 || view.getUint32(pointer + 4, true) !== 0 ||
          view.getUint32(pointer + 8, true) !== 0 || view.getUint32(pointer + 12, true) !== 0)
        throw new TypeError("retained operation requires canonical Null");
      return null;
    }
    // Read evaluated VM operands, never source JSON, expected values or fixture
    // metadata. Bounds and work limits apply to every recursive dereference.
    function readValue(pointer, active = new Set(), budget = {count: 0}) {
      if (++budget.count > Math.floor((bounds.heapLimit-bounds.heapBegin)/4) || active.size >= 32 || active.has(pointer))
        throw new RangeError("retained operand graph is cyclic or exceeds its bound");
      const view = slot(pointer), kind = view.getUint32(pointer, true);
      if (kind === 0) return nullValue(pointer);
      if (kind === 3) return utf8(pointer);
      if (kind === 18) return requireHandle(pointer).value;
      if (kind === 1 || kind === 2) {
        if (view.getUint32(pointer + 4, true) !== 0 ||
            (kind === 1 && (view.getUint32(pointer + 12, true) !== 0 || view.getUint32(pointer + 8, true) > 1)))
          throw new TypeError("malformed retained scalar operand");
        return kind === 1 ? view.getUint32(pointer + 8, true) === 1 : view.getFloat64(pointer + 8, true);
      }
      if (kind !== 4 && kind !== 6 && kind !== 5)
        throw new TypeError("unsupported retained operand value kind");
      const count = view.getUint32(pointer + 4, true), data = view.getUint32(pointer + 8, true);
      if (count > Math.floor((bounds.heapLimit-bounds.heapBegin)/(kind === 5 ? 8 : 4))) throw new RangeError("retained operand collection exceeds its owned arena");
      if (count) range(data, count * (kind === 5 ? 8 : 4), 4);
      active.add(pointer);
      try {
        const result = kind === 5 ? Object.create(null) : [];
        for (let index = 0; index < count; index++) {
          const entry = data + index * (kind === 5 ? 8 : 4);
          if (kind === 5) {
            const name = utf8(memory().getUint32(entry, true));
            if (Object.hasOwn(result, name)) throw new TypeError("duplicate retained operand field");
            result[name] = readValue(memory().getUint32(entry + 4, true), active, budget);
          } else result.push(readValue(memory().getUint32(entry, true), active, budget));
        }
        return result;
      } finally { active.delete(pointer); }
    }
    function writeScalar(value) {
      if (value === null) return scalar(0, 0);
      if (typeof value === "boolean") return scalar(1, value ? 1 : 0);
      if (typeof value === "string") return text(value);
      if (typeof value === "number") {
        const pointer = allocate(16); memory().setUint32(pointer, 2, true);
        memory().setFloat64(pointer + 8, value, true); return pointer;
      }
      throw new TypeError("unsupported retained property result");
    }
    function producerCall(parentPointer, operandsPointer, descriptorPointer) {
      if (!wireManifest || wireManifest.producerVersion !== 1)
        throw new TypeError("retained producer ABI is not declared by this instance");
      const descriptor = JSON.parse(utf8(descriptorPointer));
      if (!descriptor || descriptor.schema !== "vektor-flow.retained-producer-origin" || descriptor.version !== 1 ||
          !["Display<2>", "Frame<2>", "Frame<3>", "View", "Layer"].includes(descriptor.concrete_type) ||
          !["add_frame", "add", "world_add", "push"].includes(descriptor.effect_kind) ||
          !["display_id", "operation_index"].includes(descriptor.origin_field) ||
          !Number.isSafeInteger(descriptor.origin_index) || descriptor.origin_index < 0 ||
          Object.hasOwn(descriptor, "declaration_json"))
        throw new TypeError("malformed retained producer call descriptor");
      if ((descriptor.concrete_type === "Layer" && !["direct-points-v1", "direct-lines-v1", "direct-points-v2", "direct-lines-v2"].includes(descriptor.render_packet_v1)) ||
          (descriptor.concrete_type !== "Layer" && descriptor.render_packet_v1 !== undefined))
        throw new TypeError("retained producer requires its concrete compiler graphics packet contract");
      if (descriptor.world_sequence !== undefined &&
          (!Number.isSafeInteger(descriptor.world_sequence) || descriptor.world_sequence < 0 ||
           (descriptor.effect_kind !== "world_add" && descriptor.effect_kind !== "push")))
        throw new TypeError("invalid compiled World embedding sequence descriptor");
      const operands = readValue(operandsPointer);
      if (!Array.isArray(operands) || operands.length < 3 || operands.length % 2 !== 1 ||
          operands[0] !== descriptor.effect_kind || operands[1] !== descriptor.origin_field ||
          operands[2] !== descriptor.origin_index)
        throw new TypeError("retained producer operand/descriptor mismatch");
      const argumentsValue = Object.create(null);
      for (let index = 3; index < operands.length; index += 2) {
        const name = operands[index];
        if (typeof name !== "string" || !name || Object.hasOwn(argumentsValue, name) ||
            name === "display_id" || name === "operation_index")
          throw new TypeError("malformed retained producer named argument");
        argumentsValue[name] = operands[index + 1];
      }
      if (descriptor.concrete_type === "Layer") {
        const v2 = descriptor.render_packet_v1.endsWith("-v2");
        const line = descriptor.render_packet_v1.startsWith("direct-lines-");
        const suffix = v2 ? "v2" : "v1";
        if (!Object.hasOwn(argumentsValue, line ? "__renderer_line_packet_"+suffix : "__renderer_point_packet_"+suffix) ||
            Object.hasOwn(argumentsValue, line ? "__renderer_point_packet_"+suffix : "__renderer_line_packet_"+suffix))
          throw new TypeError("retained Layer descriptor/graphics packet mismatch");
      }
      const parent = tag(parentPointer) === 0 ? nullValue(parentPointer) : requireHandle(parentPointer);
      if (parent) ready(parent);
      const producer = options.producer;
      if (!producer || producer.abi !== "vkf-retained-renderer-producer-v1" || typeof producer.produce !== "function")
        throw new RetainedPrerequisiteError("actual renderer retained producer v1 is required");
      const capability = producer.produce(Object.freeze({...descriptor}), parent && parent.capability,
        Object.freeze(argumentsValue));
      if (capability && typeof capability.then === "function")
        throw new TypeError("synchronous retained creation cannot acknowledge a Promise");
      // No static correlation id enters the capability table. The actual
      // renderer must return an e982 capability for the original mounted object.
      if (byCapability.has(capability)) throw new TypeError("producer reused an existing instance acknowledgement");
      if (capabilityBridge.kind(capability) !== descriptor.concrete_type)
        throw new TypeError("retained producer acknowledged the wrong concrete kind");
      if (typeof producer.parentOf !== "function")
        throw new RetainedPrerequisiteError("actual producer parent acknowledgement is required");
      const parentCapability = producer.parentOf(capability);
      if (!parentCapability || parentCapability === capability ||
          (parent && parentCapability !== parent.capability))
        throw new TypeError("producer acknowledged a different actual parent");
      const parentRecord = recordForCapability(parentCapability);
      const record = recordForCapability(capability);
      record.parent = parentRecord; // actual owner, including implicit Display
      return handle(record); // final allocation, published by VM before safepoint
    }
    function invoke(operation, a, b, c) {
      live();
      if (closing) throw new TypeError("retained execution is closing");
      if (operation === 3) return producerCall(a, b, c);
      if (operation === 4) {
        if (c !== 0 || !wireManifest || wireManifest.suspension !== "jspi-v1")
          throw new TypeError("Frame.load requires its explicit JSPI suspension ABI");
        const resourcePath = utf8(b);
        const path = options.resourceBaseUrl === undefined ? resourcePath : new global.URL(resourcePath, options.resourceBaseUrl).href;
        // Package admission supplies exact reviewed URLs, never a source-id map.
        // A load outside that inventory is an execution failure, not missing/null.
        if (options.resourceUrls !== undefined &&
            (!Array.isArray(options.resourceUrls) || !options.resourceUrls.includes(path)))
          throw new TypeError("retained resource is outside the admitted package: " + resourcePath);
        return completeFrameLoad(a, path, options.loader).then(() => scalar(0, 0));
      }
      if (operation === 5 || operation === 6) {
        const record = requireHandle(a); ready(record);
        const name = utf8(b), producer = options.producer;
        if (!producer || typeof producer.property !== "function")
          throw new RetainedPrerequisiteError("actual concrete retained property dispatcher is required");
        if (operation === 5 && c !== 0) throw new TypeError("unexpected retained read operand");
        const value = producer.property(record.capability, name,
          operation === 6 ? {value: readValue(c)} : null);
        if (value && typeof value.then === "function")
          throw new TypeError("retained property effects must complete synchronously");
        return operation === 6 ? a : writeScalar(value);
      }
      if (operation === 0) {
        const declared = contract(c), owner = requireHandle(a);
        if (owner.kind !== declared.ownerKind) throw new TypeError("retained receiver kind/provenance mismatch");
        const id = key(b, declared.keySurface); ready(owner);
        if (options.producer && typeof options.producer.beforeLookup === "function") {
          const completion = options.producer.beforeLookup(owner.capability);
          if (completion && typeof completion.then === "function")
            throw new TypeError("retained tree reconciliation must complete synchronously");
        }
        // null has exactly one source: the actual owner-local registry reports
        // a valid missing key. All dispatch, loading and provenance errors escape.
        const capability = capabilityBridge.get(owner.capability, id);
        const found = capability === null ? null : recordForCapability(capability);
        if (found && !declared.members.includes(found.kind))
          throw new TypeError("actual retained lookup result violates its concrete union");
        if (typeof options.onRetainedLookup === "function")
          options.onRetainedLookup(Object.freeze({owner: owner.value, ownerKind: owner.kind,
            key: id, value: found && found.value, kind: found && found.kind}));
        return found ? handle(found) : scalar(0, 0);
      }
      if (operation === 1) {
        if (c !== 0) throw new TypeError("unexpected retained equality operand");
        const aTag = tag(a), bTag = tag(b);
        const left = aTag === 18 ? requireHandle(a) : null;
        const right = bTag === 18 ? requireHandle(b) : null;
        for (const pointer of [a, b]) {
          const view = slot(pointer);
          if (view.getUint32(pointer, true) === 0 &&
              (view.getUint32(pointer + 4, true) !== 0 || view.getUint32(pointer + 8, true) !== 0 ||
               view.getUint32(pointer + 12, true) !== 0))
            throw new TypeError("retained equality received a malformed null");
        }
        const ordinary = kind => kind <= 6 || kind === 9 || kind === 10 || kind === 11;
        if ((!left && !ordinary(aTag)) || (!right && !ordinary(bTag)) || (!left && !right))
          throw new TypeError("retained equality received an invalid language value");
        return scalar(1, left !== null && right !== null && left.capability === right.capability ? 1 : 0);
      }
      if (operation === 2) {
        if (b !== 0 || c !== 0) throw new TypeError("unexpected retained kind operand");
        return text(requireHandle(a).kind);
      }
      throw new TypeError("unknown retained VM operation");
    }
    function bind(vmExports, manifest) {
      if (disposed || exports) throw new TypeError("retained bridge can bind exactly one live VM");
      const wire = manifest && manifest.retainedOwner;
      if (!wire || wire.schema !== "vektor-flow.retained-owner-wire" || wire.version !== 1 ||
          wire.bytecodeVersion !== 6 || wire.handleTag !== 18 || wire.slotBytes !== 16 ||
          wire.slotAlignment !== 8 || wire.abiOffset !== 4 || wire.indexOffset !== 8 ||
          wire.generationOffset !== 12 || wire.importModule !== "vkf.retained" ||
          wire.importName !== "invoke_v1" || wire.parameters !== 4 || wire.result !== "i32-slot-pointer")
        throw new TypeError("retained compiler/host wire ABI mismatch");
      if (!vmExports || !vmExports.memory || !vmExports.memory.buffer ||
          ["vkf_vm_alloc", "vkf_vm_heap_ptr", "vkf_vm_heap_base", "vkf_vm_heap_limit",
           "vkf_vm_results_ptr", "vkf_vm_value_slot_size", "vkf_vm_clock_arena_ptr"].some(
            name => typeof vmExports[name] !== "function"))
        throw new RetainedPrerequisiteError("actual emitted VM allocation exports are required");
      const values = ["staticBegin", "staticEnd", "heapBegin", "heapLimit"].map(name => uint(wire[name], name));
      const externalSlotBytes = uint(vmExports.vkf_vm_value_slot_size(), "external slot size");
      if (!(values[0] > 0 && values[0] < values[1] && values[1] <= values[2] &&
            values[2] < values[3] && values[3] <= vmExports.memory.buffer.byteLength) ||
          externalSlotBytes < 16 || externalSlotBytes % 8 ||
          values[0] !== uint(vmExports.vkf_vm_results_ptr(), "result pointer") + externalSlotBytes ||
          values[1] !== uint(vmExports.vkf_vm_clock_arena_ptr(), "static end") ||
          values[2] !== vmExports.vkf_vm_heap_base() || values[3] !== vmExports.vkf_vm_heap_limit())
        throw new RangeError("retained compiler/VM owned bounds mismatch");
      bounds = Object.freeze({staticBegin: values[0], staticEnd: values[1], heapBegin: values[2], heapLimit: values[3]});
      if (wire.producerVersion !== undefined && wire.producerVersion !== 1)
        throw new TypeError("unsupported retained producer ABI version");
      if (wire.suspension !== undefined && wire.suspension !== "jspi-v1")
        throw new TypeError("unsupported retained suspension ABI");
      wireManifest = Object.freeze({...wire});
      exports = vmExports;
    }
    function observe() {
      live();
      if (closing || pendingLoads.size) throw new TypeError("retained observation requires completed source loads before close");
      if (!options.producer || typeof options.producer.observe !== "function")
        throw new RetainedPrerequisiteError("actual matched live scene observer is unavailable");
      return options.producer.observe();
    }
    function enrollOwner(capability) { live(); return handle(recordForCapability(capability)); }
    function completeFrameLoad(pointer, resourcePath, loader) {
      live();
      if (closing) throw new TypeError("retained execution is closing");
      const record = requireHandle(pointer);
      if (record.kind !== "Frame<2>" || !loader || typeof loader.mountFrameHtmlForOwnerV1 !== "function")
        return Promise.reject(new RetainedPrerequisiteError("actual Frame static resource loader v1 is required"));
      ready(record); record.load = "loading";
      const completion = Promise.resolve().then(async () => {
        try {
          if (typeof options.onRetainedLoad === "function")
            options.onRetainedLoad(Object.freeze({phase: "start", owner: record.value, url: resourcePath}));
          const capability = await loader.mountFrameHtmlForOwnerV1(record.value, resourcePath, capabilityBridge);
          live();
          if (capability !== record.capability) throw new TypeError("resource loader changed the original Frame identity");
          record.load = "ready";
          if (typeof options.onRetainedLoad === "function")
            options.onRetainedLoad(Object.freeze({phase: "complete", owner: record.value, url: resourcePath}));
        } catch (error) { record.load = "failed"; record.error = error; throw error; }
      });
      pendingLoads.add(completion);
      completion.then(() => pendingLoads.delete(completion), () => pendingLoads.delete(completion));
      return completion;
    }
    function dispose() {
      if (pendingLoads.size) throw new TypeError("join pending retained loads before disposal/reset/rewind");
      disposed = true; records.clear(); byCapability.clear(); issuedSlots.clear(); exports = null; wireManifest = null;
    }
    async function close() {
      closing = true;
      const joined = await Promise.allSettled([...pendingLoads]);
      dispose();
      if (options.producer && typeof options.producer.dispose === "function") options.producer.dispose();
      return joined;
    }
    function resetVm() {
      live(); const vmExports = exports;
      if (typeof vmExports.vkf_vm_reset !== "function")
        throw new RetainedPrerequisiteError("actual VM reset export is unavailable");
      // Old capabilities are invalid before any reset memory can be reused.
      // Every reset/rewind in the future consumer must go through this hook
      // (or dispose first). Raw exported memory/lifecycle is trusted host only.
      dispose();
      if (options.producer && typeof options.producer.dispose === "function") options.producer.dispose();
      return vmExports.vkf_vm_reset();
    }
    function rewindVm(mark) {
      live(); const vmExports = exports;
      if (typeof vmExports.vkf_vm_rewind !== "function")
        throw new RetainedPrerequisiteError("actual VM rewind export is unavailable");
      uint(mark, "rewind mark");
      dispose();
      if (options.producer && typeof options.producer.dispose === "function") options.producer.dispose();
      return vmExports.vkf_vm_rewind(mark);
    }
    return Object.freeze({ abi: "vkf-retained-owner-wire-v1", imports: Object.freeze({invoke_v1: invoke}),
      // Trusted real producer hooks. The generated VM cannot call these.
      bind, enrollOwner, completeFrameLoad, observe, resetVm, rewindVm, dispose, close });
  }
  global.VfRetainedVmBridge = Object.freeze({createRetainedVmBridgeV1, RetainedPrerequisiteError});
})(typeof window !== "undefined" ? window : this);
