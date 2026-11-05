import {bindNormalReplayOwner, bindNormalWorldOwner} from './normal-physics-owner.mjs?sha256=1f71919c1a2fd57aa69bdd8f703f789bb539885fdd3357ff75955f926322194f';
import {packNormalReplayInput, packNormalSessionInput} from './normal-physics-input.mjs?sha256=8a956386e769b7b2e00e0c068a311db6d8bbaaa3b56d00a6c3071b2a2ebce78c';

// Normal guest -> current package's actual compiled replay resource. This host
// marshals evaluated operands only; it performs no integration or rendering.
// Source admission/emission is a separate required compiler edge. This file is
// not installed or selected by the current fail-closed normal compiler yet.
export function createNormalReplayImport(owner, sourceOwner, manifest) {
  const wire = manifest?.physicsReplay;
  const replay = bindNormalReplayOwner(owner, sourceOwner, wire);
  const world = wire?.worldABI ? bindNormalWorldOwner(owner, sourceOwner, wire) : null;
  sourceOwner = null;
  let api = null, bounds = null, closed = false;
  let nextSession = 1;
  const issuedSessions = new Map();
  const decoder = new TextDecoder('utf-8', {fatal: true});
  const uint = (value, name) => {
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
      throw new RangeError('Invalid normal physics VM ' + name);
    return value;
  };
  const live = () => {
    if (closed || !api) throw new TypeError('Normal physics VM owner is unbound or closed');
  };
  const memory = () => { live(); return new DataView(api.memory.buffer); };
  const range = (pointer, size, alignment) => {
    uint(pointer, 'pointer'); uint(size, 'byte count');
    const view = memory(), end = pointer + size, heapEnd = uint(api.vkf_vm_heap_ptr(), 'heap end');
    if (heapEnd < bounds.heapBegin || heapEnd > bounds.heapLimit ||
        pointer === 0 || pointer % alignment || end > view.byteLength || end > 0x100000000 ||
        !((pointer >= bounds.staticBegin && end <= bounds.staticEnd) ||
          (pointer >= bounds.heapBegin && end <= heapEnd)))
      throw new RangeError('Normal physics operand is outside its current VM storage');
    return view;
  };
  const slot = pointer => range(pointer, 16, 8);
  const text = pointer => {
    const view = slot(pointer);
    if (view.getUint32(pointer, true) !== 3 || view.getUint32(pointer + 12, true) !== 0)
      throw new TypeError('Normal physics field key must be a UTF-8 string slot');
    const count = view.getUint32(pointer + 4, true), data = view.getUint32(pointer + 8, true);
    if (!count && !data) return '';
    range(data, count, 1);
    return decoder.decode(new Uint8Array(api.memory.buffer, data, count));
  };
  const read = (pointer, active = new Set(), budget = {count: 0}) => {
    if (++budget.count > Math.floor((bounds.heapLimit - bounds.heapBegin) / 4) ||
        active.size >= 32 || active.has(pointer))
      throw new RangeError('Normal physics operand graph is cyclic or exceeds its VM arena');
    const view = slot(pointer), kind = view.getUint32(pointer, true);
    // Booleans, quantities, complex values, erased values and all capabilities
    // are rejected. A numeric payload width never erases its source value tag.
    if (kind === 2) {
      if (view.getUint32(pointer + 4, true) !== 0)
        throw new TypeError('Malformed real numeric normal physics operand');
      return view.getFloat64(pointer + 8, true);
    }
    if (![4, 5, 6].includes(kind)) throw new TypeError('Normal physics requires real SI structural values');
    const count = view.getUint32(pointer + 4, true), data = view.getUint32(pointer + 8, true);
    const stride = kind === 5 ? 8 : 4;
    if (count > Math.floor((bounds.heapLimit - bounds.heapBegin) / stride))
      throw new RangeError('Normal physics collection exceeds its VM arena');
    if (count) range(data, count * stride, 4);
    active.add(pointer);
    try {
      const result = kind === 5 ? Object.create(null) : [];
      for (let index = 0; index < count; index++) {
        const entry = data + index * stride;
        if (kind === 5) {
          const key = text(memory().getUint32(entry, true));
          if (Object.hasOwn(result, key)) throw new TypeError('Duplicate normal physics input field');
          result[key] = read(memory().getUint32(entry + 4, true), active, budget);
        } else result.push(read(memory().getUint32(entry, true), active, budget));
      }
      return result;
    } finally { active.delete(pointer); }
  };
  const publish = values => {
    // vkf_vm_alloc does not collect: collection occurs only at compiler-owned
    // safepoints. Give EVERY value slot its actual arena header, as maintained
    // runtime constructors do. Inline child slots cannot outlive their parent
    // allocation under field selection and the nonmoving mark/sweep collector.
    const leaves = Array.from(values, number);
    const pointer = allocate(16 + leaves.length * 4), view = memory();
    view.setUint32(pointer, 4, true); view.setUint32(pointer + 4, leaves.length, true);
    view.setUint32(pointer + 8, pointer + 16, true);
    leaves.forEach((leaf, index) => view.setUint32(pointer + 16 + index * 4, leaf, true));
    return pointer;
  };
  const allocate = bytes => {
    const pointer = uint(api.vkf_vm_alloc(bytes), 'allocated persistent result');
    const view = range(pointer, bytes, 8);
    if (pointer < bounds.heapBegin) throw new RangeError('Normal session result is not VM heap owned');
    // Same issued-slot rule as the maintained retained VM capability bridge:
    // recycling storage invalidates an earlier issuance at that address.
    for (const address of issuedSessions.keys())
      if (address >= pointer && address < pointer + bytes) issuedSessions.delete(address);
    new Uint8Array(view.buffer, pointer, bytes).fill(0);
    return pointer;
  };
  const number = value => {
    const pointer = allocate(16), view = memory();
    view.setUint32(pointer, 2, true); view.setFloat64(pointer + 8, value, true);
    return pointer;
  };
  const publishState = values => {
    if (!(values instanceof Float64Array) || values.length !== 32)
      throw new TypeError('Complete accepted persistent state required');
    return publish(values);
  };
  const publishSession = result => {
    if (nextSession > 0xffffffff) throw new RangeError('Normal PhysicsSession issuance exhausted');
    const key = value => {
      const bytes = new TextEncoder().encode(value), at = allocate(16 + bytes.length), view = memory();
      view.setUint32(at, 3, true); view.setUint32(at + 4, bytes.length, true);
      view.setUint32(at + 8, at + 16, true);
      new Uint8Array(view.buffer, at + 16, bytes.length).set(bytes);
      return at;
    };
    const statusKey = key('status'), resourceKey = key('resource'), status = number(result.status);
    const handle = allocate(16);
    if (result.resource) {
      const record = {index: nextSession++, resource: result.resource};
      // Dedicated compiler-private leaf. No target address, source number or
      // serialized token can manufacture this actual issued VM occurrence.
      const view = memory();
      view.setUint32(handle, 19, true); view.setUint32(handle + 4, 1, true);
      view.setUint32(handle + 8, record.index, true);
      issuedSessions.set(handle, record);
    }
    const pointer = allocate(32), view = memory();
    view.setUint32(pointer, 5, true); view.setUint32(pointer + 4, 2, true);
    view.setUint32(pointer + 8, pointer + 16, true);
    view.setUint32(pointer + 16, statusKey, true); view.setUint32(pointer + 20, status, true);
    view.setUint32(pointer + 24, resourceKey, true); view.setUint32(pointer + 28, handle, true);
    return pointer;
  };
  const resource = pointer => {
    const view = slot(pointer), record = issuedSessions.get(pointer);
    if (!world || !record || view.getUint32(pointer, true) !== 19 ||
        view.getUint32(pointer + 4, true) !== 1 || view.getUint32(pointer + 8, true) !== record.index ||
        view.getUint32(pointer + 12, true) !== 0)
      throw new TypeError('Issued current VM PhysicsSession required');
    return record.resource;
  };
  const scalar = pointer => {
    const value = read(pointer);
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('Real finite session operand required');
    return value;
  };
  const imports = {replay_si_v1(description, history) {
    live();
    const input = packNormalReplayInput(read(description), read(history));
    return publish(replay(input.description, input.history));
  }};
  if (world) imports.session_si_v1 = (operation, first, second, third) => {
    live();
    // Only authenticated compiler operation bodies may emit this import.
    // Operand/root admission remains a separate compiler obligation; this
    // transport cannot turn an ordinary structural record into authority.
    if (operation === 0) return publishSession(world.open(packNormalSessionInput(read(first))));
    if (operation === 1) return publishState(world.advance(resource(first), scalar(second), scalar(third)));
    if (operation === 2) return publishState(world.snapshot(resource(first)));
    if (operation === 3) return number(world.closeSession(resource(first)));
    throw new TypeError('Unknown authenticated normal PhysicsSession operation');
  };
  return Object.freeze({
    imports: Object.freeze({'vkf.physics': Object.freeze(imports)}),
    // Trusted retained effect capture passes its actual executed resource
    // operand separately from ordinary packet data, as the native route does.
    bindWorld(resourcePointer, worldOwner, geometry, state) {
      live(); return world.bindWorld(resource(resourcePointer), worldOwner, geometry, state);
    },
    requestWorld(view, cause, tick) { live(); return world.request(view, cause, tick); },
    bind(exports) {
      if (api || closed) throw new TypeError('Normal physics VM generation cannot be rebound');
      if (!exports?.memory || ['vkf_vm_alloc', 'vkf_vm_heap_ptr', 'vkf_vm_heap_base',
          'vkf_vm_heap_limit', 'vkf_vm_results_ptr', 'vkf_vm_value_slot_size', 'vkf_vm_clock_arena_ptr']
          .some(name => typeof exports[name] !== 'function'))
        throw new TypeError('Current normal physics VM allocation exports are required');
      const [staticBegin, staticEnd, heapBegin, heapLimit] =
        ['staticBegin', 'staticEnd', 'heapBegin', 'heapLimit'].map(name => uint(wire[name], name));
      const slotBytes = uint(exports.vkf_vm_value_slot_size(), 'external slot size');
      if (!(slotBytes >= 16 && slotBytes % 8 === 0 && staticBegin > 0 && staticBegin < staticEnd &&
          staticEnd <= heapBegin && heapBegin < heapLimit && heapLimit <= exports.memory.buffer.byteLength) ||
          staticBegin !== exports.vkf_vm_results_ptr() + slotBytes || staticEnd !== exports.vkf_vm_clock_arena_ptr() ||
          heapBegin !== exports.vkf_vm_heap_base() || heapLimit !== exports.vkf_vm_heap_limit())
        throw new RangeError('Normal physics compiler/VM owned bounds differ');
      bounds = Object.freeze({staticBegin, staticEnd, heapBegin, heapLimit});
      api = exports;
    },
    get closed(){return closed;},
    close() {
      if (closed) return;
      // Preserve all transport authority on an active/reentry refusal. The
      // SAME owner exposes only whether its owned teardown actually invalidated
      // issuance, including a thrown target disposal attempt.
      try { owner.close(); }
      finally {
        if(owner.closed){
          closed=true;api=null;bounds=null;issuedSessions.clear();owner=null;
        }
      }
    },
  });
}
