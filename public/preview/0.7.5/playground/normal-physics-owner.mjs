import createMaintainedReplay from './physics-replay-base.mjs?sha256=b1ad2ececf397549e846cb5afce9183b2c0b9a722140543bf170472316696767';
import {createNormalWorldTransport} from './normal-world-owner.mjs?sha256=030e0412b4ccc68dc2735dca2ad0cf15d2d7c2d9f8a91194b1199e2820de5e31';

// Filled only from an actual target build plus the current normal compiler
// release. Placeholder/empty identities cannot open a backend. These data pins
// select code, not source authority; sourceOwner is the current runtime's live
// per-input object and never arrives from a guest record or serialized token.
const identity = Object.freeze({
  abi: 'vkf-normal-physics-replay-si-v1',
  buildPhase: 'unqualified-build-only',
  compiler: '45da9f646f488500745f5a142c84843daae26ef46168802de00a2b9b714b7a94',
  source: 'ddf95831af5b989977c4b01b08d74d3595889137b9deb4eb0c49818c24c68909',
  engine: '7b59846928909e8cff4477244128e8cb8bbce199c97537447a2f2c9553874330',
  adapter: '9e3198853f68fb33dd42207a01cb11c8341107c082f0c0eb141a42085bb647cd',
  dependencies: '0e17fd2505985282bbce1935f7e7b08adce6775ad0c66f80357648839ac52c2b',
  wasm: 'd5e061d024f13e02a6a846dc043824ea510f92545302c33db8537dde3b43151a',
});
const owners = new WeakMap();
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

async function binary() {
  const url = new URL('./physics-replay-base.wasm?sha256=' + identity.wasm, import.meta.url);
  let bytes;
  if (url.protocol === 'file:') {
    const {readFile} = await import('node:fs/promises');
    bytes = new Uint8Array(await readFile(url));
  } else {
    // This is an existing normal package asset, never a caller-selected engine
    // service, URL, native plugin or host solver.
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== new URL(import.meta.url).origin)
      throw new TypeError('Normal physics resource is outside its package');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Normal physics target resource unavailable');
    bytes = new Uint8Array(await response.arrayBuffer());
  }
  const crypto = globalThis.crypto ?? (await import('node:crypto')).webcrypto;
  const observed = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
    value => value.toString(16).padStart(2, '0')).join('');
  if (observed !== identity.wasm) throw new TypeError('Normal physics resource identity changed');
  return bytes;
}

export async function createNormalReplayOwner(sourceOwner, compilerBinding, signal) {
  if (!sourceOwner || typeof sourceOwner !== 'object' ||
      !['unqualified-build-only', 'numerical-observation-attached'].includes(identity.buildPhase) ||
      Object.entries(identity).some(([key, value]) => !['abi', 'buildPhase'].includes(key) && !hash(value)) ||
      compilerBinding !== identity.compiler)
    throw new TypeError('Current normal source/runtime identity is unavailable');
  signal?.throwIfAborted();
  const bytes = await binary();
  signal?.throwIfAborted();
  let module = await createMaintainedReplay({wasmBinary: bytes});
  // No engine export is made available to guest code, another input or a
  // renderer. Compare actual compiled code identity before issuing this owner.
  for (const [name, expected] of [
    ['abi', identity.abi], ['build_phase', identity.buildPhase], ['source_sha256', identity.source],
    ['engine_sha256', identity.engine], ['adapter_sha256', identity.adapter],
    ['dependencies_sha256', identity.dependencies],
  ]) {
    if (module.ccall('vkf_normal_physics_' + name, 'string', [], []) !== expected)
      throw new TypeError('Normal physics compiled ABI/provenance mismatch');
  }
  signal?.throwIfAborted();
  let closed = false, inCall = false, closing = false, disposed = false;
  const requireLive = owner => {
    if (closed || closing || owner !== sourceOwner) throw new TypeError('Normal physics source owner is foreign or closed');
    signal?.throwIfAborted();
  };
  const replay = (owner, description, history) => {
    requireLive(owner);
    if (inCall) throw new TypeError('Normal physics replay is already active');
    if (!(description instanceof Float64Array) || description.length < 37 || description.length > 6000037 ||
        !(history instanceof Float64Array) || history.length > 1000000)
      throw new TypeError('Normal physics requires complete owned SI replay inputs');
    inCall = true;
    const allocations = [];
    const allocate = length => {
      const pointer = module._malloc(length);
      if (!Number.isInteger(pointer) || pointer <= 0 || pointer % 8 ||
          pointer + length > module.HEAPU8.byteLength)
        throw new RangeError('Normal physics allocation failed');
      allocations.push(pointer);
      return pointer;
    };
    try {
      const dp = allocate(description.byteLength), hp = history.length ? allocate(history.byteLength) : 0;
      const op = allocate(15 * 8);
      // Allocate first: memory growth may replace every previous HEAP view.
      module.HEAPF64.set(description, dp / 8);
      if (history.length) module.HEAPF64.set(history, hp / 8);
      module.ccall('vkf_normal_physics_replay_si', null,
        ['number', 'number', 'number', 'number', 'number'],
        [dp, description.length, hp, history.length, op]);
      requireLive(owner);
      const result = module.HEAPF64.slice(op / 8, op / 8 + 15);
      if (result.length !== 15 || result.some(value => !Number.isFinite(value)) ||
          ![0, 1, 2].includes(result[0]))
        throw new TypeError('Normal physics returned an invalid complete replay result');
      // Preserve status+time+all13 physical components. The existing VKF
      // _publish/_coherent wrappers retain their ordinary error/alias checks.
      return result;
    } finally {
      try { for (const pointer of allocations.reverse()) module._free(pointer); }
      finally { inCall = false; }
    }
  };
  const world = createNormalWorldTransport(call => {
    requireLive(sourceOwner);
    if (inCall) throw new TypeError('Normal physics resource is already active');
    inCall = true;
    try { return call(module); }
    finally { inCall = false; }
  }, invalidate => {
    // Cancellation forbids NEW operations, never destruction of this owned
    // module. Do not call requireLive/throwIfAborted on the teardown path.
    // There is no caller-selected module/source/callback here; retain the
    // original issuance and module until its exact-once dispose attempt ends.
    if (inCall) throw new TypeError('Cannot dispose an active normal physics resource');
    if (closed || !module || owners.get(owner) !== state || state.sourceOwner !== sourceOwner)
      throw new TypeError('Original normal physics teardown owner is unavailable');
    if (disposed) { invalidate(); return; }
    inCall = true; disposed = true;
    try { module.ccall('vkf_normal_physics_world_dispose', null, [], []); }
    finally { inCall = false; invalidate(); }
  });
  const state = {sourceOwner, replay, world};
  const owner = Object.freeze({get closed(){return closed;},close() {
    if (closed) return;
    if (inCall || closing) throw new TypeError('Cannot close an active normal physics resource');
    closing = true;
    try { world.close(); }
    finally {
      closed = true;
      closing = false;
      owners.delete(owner);
      module = null;
      sourceOwner = null;
      state.sourceOwner = null;
      state.replay = null;
      state.world = null;
    }
  }});
  owners.set(owner, state);
  return owner;
}

// Same issuance map and exact compiled identity as replay. A matching guest
// record cannot obtain either the target module or a persistent session.
export function bindNormalWorldOwner(owner, sourceOwner, contract) {
  bindNormalReplayOwner(owner, sourceOwner, contract);
  const state = owners.get(owner);
  if (contract.worldABI !== 'vkf-normal-physics-world-si-v1' || !state.world)
    throw new TypeError('Current persistent normal World contract is unavailable');
  return state.world;
}

// A record with matching spellings/hashes/methods is never an engine owner.
// The returned function retains the SAME live source generation; closing the
// owner invalidates all copies, without publishing a pointer or numeric token.
export function bindNormalReplayOwner(owner, sourceOwner, contract) {
  const state = owners.get(owner);
  if (!state || state.sourceOwner !== sourceOwner)
    throw new TypeError('An issued current normal physics owner is required');
  if (!contract || contract.abi !== identity.abi || contract.sourceSHA256 !== identity.source ||
      contract.runtimeSHA256 !== identity.wasm || contract.engineSHA256 !== identity.engine ||
      contract.adapterSHA256 !== identity.adapter || contract.dependenciesSHA256 !== identity.dependencies ||
      contract.compilerSourceBinding !== identity.compiler)
    throw new TypeError('Compiled normal physics import differs from its current resource');
  sourceOwner = null;
  return (description, history) => {
    if (!state.replay || !state.sourceOwner) throw new TypeError('Normal physics source owner is closed');
    return state.replay(state.sourceOwner, description, history);
  };
}
