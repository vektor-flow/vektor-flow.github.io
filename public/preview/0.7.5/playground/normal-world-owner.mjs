// Private package transport for the SAME maintained PersistentResource and
// AcceptedFrameBinding. No JS integration, trajectory replay or renderer here.
const worldABI = 'vkf-normal-physics-world-si-v1';
const integer = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('Invalid normal World ' + name);
  return value;
};
const geometryIds = values => {
  if (!Array.isArray(values) || !values.length || values.some(value => typeof value !== 'string' || !value.length) ||
      new Set(values).size !== values.length) throw new TypeError('Complete unique normal World geometry IDs required');
  return Object.freeze(values.slice());
};
const coherent = (state, current) => {
  if (!state || state.world_generation !== current[1] || state.world_time !== current[2])
    throw new TypeError('Normal World generation/time is stale or edited');
  const equal = (name, offset, count) => {
    const values = state[name];
    if ((!Array.isArray(values) && !(values instanceof Float64Array)) || values.length !== count ||
        values.some((value, index) => !Number.isFinite(value) || value !== current[offset + index]))
      throw new TypeError('Normal World ' + name + ' differs from its accepted state');
  };
  equal('world_snapshot', 0, 32); equal('world_transform', 16, 16);
  equal('world_position', 3, 3); equal('world_principal_orientation', 6, 4);
  equal('world_velocity', 10, 3); equal('world_omega', 13, 3);
};

// invoke is owned by the issued package resource: it checks the SAME source
// lifetime and prevents reentry across replay/session/frame operations.
export function createNormalWorldTransport(invoke, dispose) {
  if (typeof invoke !== 'function' || typeof dispose !== 'function')
    throw new TypeError('Owned normal World operation and teardown paths required');
  let sessions = new WeakMap(), worlds = new WeakMap(), views = new WeakMap(), closed = false;
  const live = () => { if (closed) throw new TypeError('Normal World transport is closed'); };
  const session = (value, allowClosed = false) => {
    live(); const result = sessions.get(value);
    if (!result || (result.closed && !allowClosed)) throw new TypeError('Issued live normal PhysicsSession required');
    return result;
  };
  const call = (name, inputs, width, argumentsFor) => invoke(module => {
    live();
    if (module.ccall('vkf_normal_physics_world_abi', 'string', [], []) !== worldABI)
      throw new TypeError('Current persistent normal World target is unavailable');
    const allocations = [];
    const allocate = bytes => {
      const pointer = module._malloc(bytes);
      if (!Number.isInteger(pointer) || pointer <= 0 || pointer % 8 || pointer + bytes > module.HEAPU8.byteLength)
        throw new RangeError('Normal World transport allocation failed');
      allocations.push(pointer); return pointer;
    };
    try {
      const pointers = inputs.map(value => allocate(value.byteLength));
      const output = allocate(width * 8);
      // Allocate before copying: any malloc may grow/rebind the target memory.
      inputs.forEach((value, index) => module.HEAPU8.set(
        new Uint8Array(value.buffer, value.byteOffset, value.byteLength), pointers[index]));
      const args = argumentsFor(pointers, output);
      module.ccall('vkf_normal_physics_' + name, null, args.map(() => 'number'), args);
      const result = module.HEAPF64.slice(output / 8, output / 8 + width);
      if (result.length !== width || result.some(value => !Number.isFinite(value)) || ![0, 1, 2].includes(result[0]))
        throw new TypeError('Invalid complete normal World target result');
      return result;
    } finally { for (const pointer of allocations.reverse()) module._free(pointer); }
  });
  const requireAccepted = result => {
    if (result[0] !== 0) throw new TypeError('Normal World target rejected current state or failed');
    return result;
  };
  const snapshot = resource => {
    const value = session(resource);
    return requireAccepted(call('session_state', [], 32, (_, output) => [value.id, 0, 0, 0, output]));
  };
  return Object.freeze({
    open(words) {
      live();
      if (!(words instanceof Float64Array) || words.length < 76 || words.length > 12000076)
        throw new TypeError('Complete maintained persistent body/environment input required');
      const result = call('session_open', [words], 2, ([input], output) => [input, words.length, output]);
      // Preserve ordinary _open_si status semantics. Failed preparation issues
      // no capability; a numeric result can never mint a session.
      if (result[0] !== 0) return Object.freeze({status: result[0], resource: null});
      const id = integer(result[1], 'resource identity');
      if (!id || id > 0xffffffff) throw new TypeError('Invalid normal target resource identity');
      const resource = Object.freeze({});
      sessions.set(resource, {id, closed: false, world: null});
      return Object.freeze({status: 0, resource});
    },
    snapshot,
    advance(resource, generation, duration) {
      const value = session(resource);
      integer(generation, 'generation');
      if (!Number.isFinite(duration) || duration < 0) throw new TypeError('Finite nonnegative duration required');
      return call('session_state', [], 32, (_, output) => [value.id, 1, generation, duration, output]);
    },
    closeSession(resource) {
      const value = session(resource, true);
      if (value.closed) return 0;
      const status = invoke(module => module.ccall('vkf_normal_physics_session_close', 'number', ['number'], [value.id]));
      value.closed = true;
      return status;
    },
    bindWorld(resource, world, geometry, state) {
      const value = session(resource);
      if (!world || typeof world !== 'object') throw new TypeError('Live source World owner required');
      const ids = geometryIds(geometry), step = state?.world_time_step;
      if (!Number.isFinite(step) || step <= 0) throw new TypeError('Positive authored World time_step required');
      const current = snapshot(resource);
      coherent(state, current);
      let original = worlds.get(world);
      if (original) {
        if (original.resource !== resource || original.step !== step)
          throw new TypeError('World aliases require the SAME PhysicsSession and authored timestep');
      } else {
        if (value.world) throw new TypeError('PhysicsSession already has an authoritative World');
        const names = new TextEncoder().encode(JSON.stringify(ids));
        requireAccepted(call('world_bind', [current, names], 32, ([input, geometry], output) =>
          [value.id, input, geometry, names.length, step, output]));
        original = Object.freeze({resource, step});
        worlds.set(world, original); value.world = world;
      }
      const view = Object.freeze({});
      views.set(view, {original, geometry: ids});
      return view;
    },
    request(view, cause, tick = 0) {
      live(); const binding = views.get(view);
      if (!binding) throw new TypeError('Current normal World Frame owner required');
      const value = session(binding.original.resource);
      const causes = {main: 1, reset: 2, camera: 0, reflectedCamera: 0, screen: 0, repaint: 0};
      if (!Object.hasOwn(causes, cause)) throw new TypeError('Unknown normal World Frame cause');
      integer(tick, 'main tick');
      const duration = cause === 'main' ? binding.original.step : 0;
      const accepted = requireAccepted(call('world_frame', [], 32, (_, output) =>
        [value.id, causes[cause], tick, duration, output]));
      // Detached real state; every geometry child consumes the ONE transform.
      // Camera/mirror/screen requests cannot trigger source physics stepping.
      return Object.freeze({generation: accepted[1], time: accepted[2],
        snapshot: Object.freeze(Array.from(accepted)),
        transform: Object.freeze(Array.from(accepted.subarray(16))), geometry: binding.geometry});
    },
    close() {
      if (closed) return;
      // Teardown is owned by the SAME issued module, separate from operation
      // abort checks. It runs this invalidation only AFTER the target dispose
      // attempt; a reentry/precondition rejection must not discard ownership.
      dispose(() => {
        closed = true; sessions = new WeakMap(); worlds = new WeakMap(); views = new WeakMap();
      });
    },
  });
}
