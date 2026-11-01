// Browser-safe: accepts explicit locked archives, verifies them, builds only
// source data, and mounts MEMFS. No fetch, credentials, resolution or evaluation.
import {MAX_BYTES, MAX_FILES, fail, relativeFile, canonical, bundle, digest, verifiedBundle, validateGraph} from './metadata.mjs';

export const INPUT_ROOT = '/vkf-package-inputs';
const prepared = new WeakSet();
const encoder = new TextEncoder();
function textFiles(files) {
  if (!files || typeof files !== 'object' || Array.isArray(files) || Object.keys(files).length > MAX_FILES) fail('invalid project source files');
  let total = 0;
  for (const [name, text] of Object.entries(files)) {
    relativeFile(name);
    if (!name.startsWith('src/') || !name.endsWith('.vkf') || typeof text !== 'string' || text.includes('\0')) fail(`invalid project source ${name}`);
    total += encoder.encode(text).byteLength;
  }
  if (total > MAX_BYTES) fail('project source exceeds byte limit');
}
export async function prepareInputs(lock, archives, projectFiles, {overrides = {}} = {}) {
  // A structured clone prevents callers editing trusted metadata while awaiting
  // digest computation. Archive bytes are copied for the same reason.
  lock = structuredClone(lock); projectFiles = structuredClone(projectFiles); overrides = structuredClone(overrides);
  validateGraph(lock, lock.project, lock.compiler, lock.target);
  textFiles(projectFiles);
  if (!Object.hasOwn(projectFiles, lock.project.entry)) fail('project entry is missing');
  for (const id of [...Object.keys(archives), ...Object.keys(overrides)]) if (!Object.hasOwn(lock.packages, id)) fail(`unexpected package input ${id}`);
  const files = Object.create(null), modules = Object.create(null), identities = Object.create(null);
  for (const [name, text] of Object.entries(projectFiles)) files[`project/${name}`] = text;
  for (const [id, r] of Object.entries(lock.packages)) {
    let value;
    if (Object.hasOwn(overrides, id)) {
      if (Object.hasOwn(archives, id)) fail(`duplicate archive/override ${id}`);
      value = bundle(overrides[id].value, r.package);
      identities[id] = {mutable: true, sha256: await digest(encoder.encode(canonical(value) + '\n'))};
    } else {
      if (!(archives[id] instanceof Uint8Array)) fail(`missing locked archive ${id}`);
      const bytes = Uint8Array.from(archives[id]);
      value = await verifiedBundle(bytes, r);
      identities[id] = {mutable: false, sha256: r.archive.sha256};
    }
    for (const [name, text] of Object.entries(value.files)) if (name.endsWith('.vkf')) files[`packages/${id}/${name}`] = text;
    for (const [name, file] of Object.entries(r.package.exports)) modules[name] = `${INPUT_ROOT}/packages/${id}/${file}`;
  }
  const moduleMap = canonical({schema: 1, compiler: lock.compiler, target: lock.target, modules});
  // This is an input identity, not a persisted artifact cache. Any future build
  // cache MUST additionally key exact compiler binding, target and all options.
  const inputDigest = await digest(encoder.encode(canonical({files, moduleMap, identities})));
  Object.freeze(files); Object.freeze(modules);
  const result = Object.freeze({schema: 1, files, modules, moduleMap, inputDigest,
    entry: `${INPUT_ROOT}/project/${lock.project.entry}`, compiler: lock.compiler, target: lock.target});
  prepared.add(result);
  return result;
}

function clearTree(FS, root) {
  if (!FS.analyzePath(root).exists) return;
  if (!FS.isDir(FS.lstat(root).mode)) { FS.unlink(root); return; }
  for (const name of FS.readdir(root)) if (name !== '.' && name !== '..') {
    const file = `${root}/${name}`, stat = FS.lstat(file);
    if (FS.isDir(stat.mode)) clearTree(FS, file);
    else FS.unlink(file); // A symlink is removed, never followed.
  }
  FS.rmdir(root);
}
export function mountInputs(owner, inputs) {
  assertPrepared(inputs);
  if (inputs.target !== 'wasm') fail('MEMFS compiler requires a wasm-target package graph');
  if (typeof owner?._vkf075_package_source_inputs_version !== 'function' || owner._vkf075_package_source_inputs_version() < (inputs.addressInputs ? 2 : 1)) fail('compiler lacks explicit package SourceProvider adapter');
  if (owner.ccall('vkf075_version', 'string', [], []) !== `VKF ${inputs.compiler}`) fail('prepared graph does not match actual compiler version');
  const FS = owner?.FS;
  if (!FS || typeof FS.writeFile !== 'function') fail('canonical compiler MEMFS is unavailable');
  // Compiler transactions must be serialized by their owner. Clearing the
  // dedicated workspace prevents stale files/exports from a previous graph.
  clearTree(FS, INPUT_ROOT); FS.mkdirTree(INPUT_ROOT);
  for (const [relative, text] of Object.entries(inputs.files)) {
    const filename = `${INPUT_ROOT}/${relative}`;
    FS.mkdirTree(filename.slice(0, filename.lastIndexOf('/')));
    FS.writeFile(filename, text);
  }
  FS.writeFile(`${INPUT_ROOT}/modules.json`, inputs.moduleMap);
  return inputs.entry;
}
export function assertPrepared(inputs) {
  if (!prepared.has(inputs)) fail('mount/materialize requires verified prepareInputs result');
}

// Host prepares verified source data; compiler discovery owns VKF semantics.
// This boundary only validates data/containment, hashes inputs and mounts them.
export async function prepareSourceAddressInputs({files, entry, modules = {}, addresses = [], compiler, target, identities = {}}) {
  files = structuredClone(files); modules = structuredClone(modules); addresses = structuredClone(addresses); identities = structuredClone(identities);
  if (!['wasm', 'native'].includes(target) || typeof compiler !== 'string' || !Object.hasOwn(files, entry)) fail('invalid address input compiler/target/entry');
  const relative = Object.create(null); let total = 0;
  if (Object.keys(files).length > MAX_FILES || addresses.length > 4096) fail('source-address input count limit');
  for (const [name, text] of Object.entries(files)) {
    if (!name.startsWith(INPUT_ROOT + '/') || typeof text !== 'string' || text.includes('\0')) fail('invalid mounted source address');
    const local = name.slice(INPUT_ROOT.length + 1); relativeFile(local);
    if (!local.endsWith('.vkf')) fail('source-address mount contains non-VKF data');
    total += encoder.encode(text).byteLength; if (total > MAX_BYTES) fail('source-address inputs exceed byte limit'); relative[local] = text;
  }
  for (const file of Object.values(modules)) if (!Object.hasOwn(files, file)) fail('ordinary module export missing');
  for (const edge of addresses) if (!Object.hasOwn(files, edge.importer) || !Object.hasOwn(files, edge.resolved) || typeof edge.address !== 'string') fail('invalid source-address edge');
  const moduleMap = canonical({schema: 1, compiler, target, modules, addresses});
  const inputDigest = await digest(encoder.encode(canonical({files: relative, moduleMap, identities})));
  const result = Object.freeze({schema: 1, files: Object.freeze(relative), entry, modules: Object.freeze(modules),
    addresses: Object.freeze(addresses.map(Object.freeze)), identities: Object.freeze(Object.fromEntries(Object.entries(identities).map(([key, value]) => [key, Object.freeze(value)]))), moduleMap, inputDigest, compiler, target, addressInputs: true});
  prepared.add(result); return result;
}
