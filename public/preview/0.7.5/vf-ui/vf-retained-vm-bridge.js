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
    const ownerEvents = new Map();
    let eventSequence = 0;
    function eventNotice(phase) {
      if (typeof options.onRetainedEventState === "function")
        options.onRetainedEventState(Object.freeze({phase, delivered: eventSequence}));
    }
    function closeEvents(reason) {
      for (const queue of ownerEvents.values()) {
        for (const [type, listener] of queue.listeners) queue.owner.removeEventListener(type, listener);
        if (queue.waiter) { queue.waiter.reject(reason); queue.waiter = null; }
        queue.items.length = 0;
      }
      ownerEvents.clear();
    }
    const abortEvents = () => closeEvents(options.signal.reason || new TypeError("retained owner events aborted"));
    if (options.signal) options.signal.addEventListener("abort", abortEvents, {once: true});
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
    function eventPacket(packet) {
      // This is a fixed UI wire packet, never a general VKF-value conversion.
      const fields = [["event", text(packet.event)], ["widget_id", text(packet.widget_id)], ["frame_id", text(packet.frame_id)]];
      if (packet.event === "SliderValueChanged") fields.push(["value", writeScalar(packet.value)]);
      const named = fields.map(([name, value]) => [text(name), value]);
      const pointer = allocate(16 + named.length * 8), view = memory();
      view.setUint32(pointer, 5, true); view.setUint32(pointer + 4, named.length, true);
      view.setUint32(pointer + 8, pointer + 16, true);
      named.forEach(([name, value], index) => {
        view.setUint32(pointer + 16 + index * 8, name, true);
        view.setUint32(pointer + 20 + index * 8, value, true);
      });
      eventSequence++; eventNotice("delivered");
      return pointer;
    }
    function ownerEvent(pointer, wait, descriptor) {
      if (wireManifest.events !== "button-slider-v1" || (wait !== 0 && wait !== 1))
        throw new TypeError("compiled owner-event ABI is not declared");
      if (wait && wireManifest.suspension !== "jspi-v1")
        throw new TypeError("owner-event wait requires JSPI suspension");
      options.signal?.throwIfAborted();
      const record = requireHandle(pointer); ready(record);
      const kind = utf8(descriptor);
      if (kind !== record.kind || !["Button", "Input"].includes(kind) ||
          !(record.value instanceof global.Element) ||
          (kind === "Input" && record.value.type !== "range"))
        throw new TypeError("owner-event receiver must be the original Button or range Input");
      let queue = ownerEvents.get(record.value);
      if (!queue) {
        const owner = record.value;
        queue = {owner, items: [], waiter: null, error: null, listeners: []};
        const type = kind === "Button" ? "click" : "input";
        const listener = () => {
          if (closing || disposed || queue.error) return;
          const frame = owner.closest("[data-vf-frame-id]");
          const packet = {event: kind === "Button" ? "ButtonClicked" : "SliderValueChanged", widget_id: owner.id,
            frame_id: frame ? String(frame.dataset.vfFrameId || "") : ""};
          if (kind === "Input") packet.value = Number(owner.value);
          // No default cancellation or propagation changes. An asynchronous
          // consumer cannot undo a browser default that already happened.
          if (queue.waiter) {
            const waiter = queue.waiter; queue.waiter = null;
            try { waiter.resolve(eventPacket(packet)); } catch (error) { queue.error = error; waiter.reject(error); }
          } else if (queue.items.length < 4096) queue.items.push(packet);
          else queue.error = new RangeError("retained owner-event queue exceeded 4096 packets");
        };
        owner.addEventListener(type, listener); queue.listeners.push([type, listener]);
        ownerEvents.set(owner, queue);
      }
      if (queue.error) throw queue.error;
      if (queue.waiter) throw new TypeError("retained owner queue already has an active consumer");
      if (queue.items.length) return eventPacket(queue.items.shift());
      if (!wait) return scalar(0, 0); // existing events.get() remains nonblocking
      // Only the compiled explicit match-loop waits. Its genuine VM stack,
      // locals, delegate and state remain suspended in this same instance.
      return new Promise((resolve, reject) => {
        queue.waiter = {resolve, reject}; eventNotice("waiting");
        if (options.signal?.aborted) abortEvents();
      });
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
      if ((descriptor.concrete_type === "Layer" && !["direct-points-v1", "direct-lines-v1", "direct-points-v2", "direct-lines-v2", "grid-surface-v2", "indexed-mesh-v2"].includes(descriptor.render_packet_v1)) ||
          (descriptor.concrete_type !== "Layer" && descriptor.render_packet_v1 !== undefined))
        throw new TypeError("retained producer requires its concrete compiler graphics packet contract");
      const worldSource = descriptor.world_source;
      if (worldSource !== undefined &&
          (!worldSource || worldSource.kind !== "world_embedding" || !["add", "world_add"].includes(descriptor.effect_kind) ||
           descriptor.concrete_type !== "Layer" || descriptor.world_sequence === undefined ||
           !Number.isSafeInteger(worldSource.world_id) || worldSource.world_id < 0 ||
           !Number.isSafeInteger(worldSource.object_id) || worldSource.object_id < 0 ||
           typeof worldSource.object_type !== "string" || !worldSource.object_type ||
           typeof worldSource.embedding !== "string" || !worldSource.embedding))
        throw new TypeError("invalid compiled World embedding source descriptor");
      if (worldSource !== undefined) descriptor.world_source = Object.freeze({...worldSource});
      if (descriptor.world_sequence !== undefined &&
          (!Number.isSafeInteger(descriptor.world_sequence) || descriptor.world_sequence < 0 ||
           (descriptor.effect_kind !== "world_add" && descriptor.effect_kind !== "push" &&
            !(descriptor.effect_kind === "add" && worldSource !== undefined))))
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
        if (descriptor.temporal_coordinates !== undefined && descriptor.temporal_coordinates !== "coordinate-time-v1")
          throw new TypeError("unsupported compiled temporal Layer contract");
        if ((descriptor.temporal_coordinates !== undefined) !== (argumentsValue.__renderer_temporal_coordinates_v1 === true))
          throw new TypeError("compiled temporal Layer descriptor/packet mismatch");
        const v2 = descriptor.render_packet_v1.endsWith("-v2");
        const line = descriptor.render_packet_v1.startsWith("direct-lines-");
        const suffix = v2 ? "v2" : "v1";
        const surface = descriptor.render_packet_v1 === "grid-surface-v2" || descriptor.render_packet_v1 === "indexed-mesh-v2";
        const packetName = surface ? "__renderer_surface_packet_v2" :
          line ? "__renderer_line_packet_"+suffix : "__renderer_point_packet_"+suffix;
        if (!Object.hasOwn(argumentsValue, packetName) ||
            Object.keys(argumentsValue).some(name => /^__renderer_(?:point|line|surface)_packet_v[12]$/.test(name) && name !== packetName))
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
      if (operation === 9) {
        if (wireManifest?.physicsBinding !== "opaque-session-frame-v1" ||
            !options.physics || typeof options.physics.bindWorld !== "function" ||
            typeof options.physics.requestWorld !== "function" || typeof options.producer?.bindPhysics !== "function")
          throw new RetainedPrerequisiteError("actual normal World/Frame binding is unavailable");
        const frame = requireHandle(a); ready(frame);
        if (!["Frame<2>", "Frame<3>"].includes(frame.kind))
          throw new TypeError("World requires its actual retained Frame");
        const packet = readValue(c), args = Object.create(null);
        if (!Array.isArray(packet) || packet.length % 2)
          throw new TypeError("invalid evaluated World binding packet");
        for (let index=0;index<packet.length;index+=2) {
          const key=packet[index];
          if (typeof key!=="string" || Object.hasOwn(args,key))
            throw new TypeError("duplicate or invalid World binding field");
          args[key]=packet[index+1];
        }
        // b remains an opaque issued VM occurrence. readValue MUST NOT erase
        // it into a number/record; only the SAME normal host may validate it.
        options.producer.bindPhysics(frame.capability,b,Object.freeze(args),options.physics);
        return handle(frame);
      }
      if (operation === 8) return ownerEvent(a, b, c);
      if (operation === 3) return producerCall(a, b, c);
      if (operation === 4) {
        if (c !== 0 || !wireManifest || wireManifest.suspension !== "jspi-v1")
          throw new TypeError("Frame.load requires its explicit JSPI suspension ABI");
        const resourcePath = utf8(b);
        if (!resourcePath || resourcePath.startsWith("/") || /[\\:#?]/.test(resourcePath))
          throw new TypeError("Frame.load resource must stay source-relative inside its static bundle");
        const path = options.resourceBaseUrl === undefined ? resourcePath : new global.URL(resourcePath, options.resourceBaseUrl).href;
        if (options.resourceBaseUrl !== undefined && !path.startsWith(new global.URL(".", options.resourceBaseUrl).href))
          throw new TypeError("Frame.load resource escapes its source bundle directory");
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
          (wire.bytecodeVersion !== (wire.physicsBinding === "opaque-session-frame-v1" ? 9 : 6)) || wire.handleTag !== 18 || wire.slotBytes !== 16 ||
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
      if (wire.physicsBinding !== undefined && wire.physicsBinding !== "opaque-session-frame-v1")
        throw new TypeError("unsupported retained physical Frame ABI");
      if (wire.producerVersion !== undefined && wire.producerVersion !== 1)
        throw new TypeError("unsupported retained producer ABI version");
      if (wire.suspension !== undefined && wire.suspension !== "jspi-v1")
        throw new TypeError("unsupported retained suspension ABI");
      if (wire.events !== undefined && wire.events !== "button-slider-v1")
        throw new TypeError("unsupported retained owner-event packet ABI");
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
      closeEvents(new TypeError("retained execution disposed"));
      options.signal?.removeEventListener("abort", abortEvents);
      disposed = true; records.clear(); byCapability.clear(); issuedSlots.clear(); exports = null; wireManifest = null;
    }
    function quiesce() {
      closing = true;
      closeEvents(new TypeError("retained execution closing"));
      // Preserve exports, issued slots and original owners until the physical
      // owner has actually invalidated. Joining loads is not VM destruction.
      return Promise.allSettled([...pendingLoads]);
    }
    async function close() {
      const joined = await quiesce();
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
      bind, enrollOwner, completeFrameLoad, observe, resetVm, rewindVm, dispose, quiesce, close });
  }
  global.VfRetainedVmBridge = Object.freeze({createRetainedVmBridgeV1, RetainedPrerequisiteError});
})(typeof window !== "undefined" ? window : this);
