import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {FORMAT, MAX_BYTES, MAX_FILES, fail, keys, project, manifest, registryConfig, relativeFile,
  canonical, bundle, decode, digest, verifiedBundle, validateGraph, record} from './metadata.mjs';
import {resolve} from './resolve.mjs';
import {createGitRegistry} from './git-source.mjs';
import {prepareInputs, assertPrepared, INPUT_ROOT} from './inputs.mjs';

const exec = promisify(execFile);
const utf8 = new TextEncoder();
export async function readBytes(filename, limit = MAX_BYTES) {
  // Open the final component without following symlinks. Ancestor directories
  // are checked separately when walking sources and the cache.
  const handle = await fs.open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) fail(`not a bounded regular file: ${filename}`);
    const chunks = []; let total = 0;
    for (;;) {
      const bytes = Buffer.alloc(Math.min(65536, limit + 1 - total));
      const {bytesRead} = await handle.read(bytes, 0, bytes.length, null);
      if (!bytesRead) break;
      total += bytesRead;
      if (total > limit) fail(`file grew past byte limit: ${filename}`);
      chunks.push(bytes.subarray(0, bytesRead));
    }
    return Buffer.concat(chunks, total);
  } finally { await handle.close(); }
}
async function readJSON(filename) { return decode(await readBytes(filename)); }
async function optionalJSON(filename) {
  try { return await readJSON(filename); } catch (e) { if (e.code === 'ENOENT') return undefined; throw e; }
}
async function directory(filename) {
  await fs.mkdir(filename, {recursive: true});
  if (!(await fs.lstat(filename)).isDirectory() || (await fs.lstat(filename)).isSymbolicLink()) fail(`unsafe directory ${filename}`);
  return filename;
}
async function atomic(filename, bytes) {
  const temporary = filename + '.tmp-' + randomUUID();
  try {
    const handle = await fs.open(temporary, 'wx', 0o600);
    try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temporary, filename);
  } finally { await fs.rm(temporary, {force: true}); }
}
export const createRegistry = createGitRegistry;
export class SourceCache {
  constructor(root = path.join(os.homedir(), '.cache', 'vektor-flow')) { this.root = path.resolve(root); }
  async sourceDirectory() {
    await directory(this.root);
    await directory(path.join(this.root, 'sources'));
    return directory(path.join(this.root, 'sources', 'v1'));
  }
  async get(r, registry) {
    record(r, r?.package?.name);
    const folder = await this.sourceDirectory(), filename = path.join(folder, r.archive.sha256 + '.vkfpkg');
    try {
      const bytes = await readBytes(filename);
      await verifiedBundle(bytes, r); // Reverify on EVERY read, including offline.
      return bytes;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const bytes = await registry.archive(r);
    await verifiedBundle(bytes, r);
    // Only complete verified blobs become visible. Concurrent writers of the
    // same digest write identical bytes; a crash leaves an ignored temp file.
    await atomic(filename, bytes);
    const stored = await readBytes(filename); await verifiedBundle(stored, r);
    return stored;
  }
}

async function sourceFiles(root) {
  const files = Object.create(null);
  const realRoot = await fs.realpath(root);
  let total = 0;
  async function walk(relative) {
    relativeFile(relative);
    const full = path.join(realRoot, relative), stat = await fs.lstat(full);
    if (stat.isSymbolicLink()) fail(`source symlink refused: ${relative}`);
    if (stat.isDirectory()) {
      for (const name of (await fs.readdir(full)).sort()) await walk(`${relative}/${name}`);
    } else {
      relativeFile(relative);
      if (!stat.isFile() || !relative.endsWith('.vkf')) fail(`src contains non-VKF file ${relative}`);
      const bytes = await readBytes(full);
      total += bytes.byteLength;
      if (total > MAX_BYTES) fail('source tree exceeds byte limit');
      files[relative] = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
      if (Object.keys(files).length > MAX_FILES) fail('too many source files');
    }
  }
  await walk('src');
  return files;
}
export async function packageBundle(packageDir) {
  const doc = await readJSON(path.join(packageDir, 'vkf.lock'));
  const {buildDocument, validateAddressLock} = await import('./addresses.mjs');
  buildDocument(doc);
  if (doc.lock !== undefined) validateAddressLock(doc.lock);
  if (Object.keys(doc.settings.overrides ?? {}).length) fail('remove local overrides before package upload/export');
  const {overrides, ...settings} = doc.settings;
  const m = manifest({schema: 2, dependencies: {}, exports: {[settings.name?.split('/')[1]?.replaceAll('-', '_') ?? 'module']: settings.entry}, ...settings});
  const files = await sourceFiles(packageDir);
  for (const name of ['LICENSE', 'README.md']) {
    try { files[name] = new TextDecoder('utf-8', {fatal: true}).decode(await readBytes(path.join(packageDir, name))); }
    catch (e) { if (name === 'LICENSE' || e.code !== 'ENOENT') throw e; }
  }
  const value = bundle({schema: 1, manifest: m, files});
  const bytes = utf8.encode(canonical(value) + '\n');
  if (bytes.length > MAX_BYTES) fail('package exceeds source archive byte limit');
  return {value, bytes, document: doc};
}
// Internal normalized cache export only; publication uses publish.mjs source PRs.
export async function pack(packageDir, outputDir) {
  const {value, bytes} = await packageBundle(path.resolve(packageDir));
  const sha256 = await digest(bytes);
  await directory(path.resolve(outputDir));
  const assetFile = path.join(path.resolve(outputDir), sha256 + '.vkfpkg');
  await atomic(assetFile, bytes);
  return {package: value.manifest.name, sha256, size: bytes.length, assetFile, published: false};
}

// Explicit prerelease compatibility helper; normal runner uses the one-file address API.
export async function prepareLegacyProject(projectDir, options = {}) {
  projectDir = path.resolve(projectDir);
  const {compilerVersion = '0.7.5', target = 'wasm', update = false, locked = false, frozen = false, offline = false} = options;
  if (!['wasm', 'native'].includes(target)) fail('unsupported target');
  if (update && (locked || frozen || offline)) fail('update conflicts with locked/frozen/offline mode');
  const p = project(await readJSON(path.join(projectDir, 'vkf.json')));
  const lockFile = path.join(projectDir, 'vkf.lock');
  let lock = await optionalJSON(lockFile);
  if (lock) validateGraph(lock, lock.project, lock.compiler, lock.target);
  const previousLock = lock;
  const registry = options.registry ?? createRegistry(p.registry, projectDir, options);
  if (!lock || update) {
    if (locked || frozen || offline) fail('lock required in locked/frozen/offline mode');
    lock = await resolve(p, registry, compilerVersion, target);
    for (const [id, r] of Object.entries(lock.packages)) {
      const previous = previousLock?.packages?.[id];
      if (previous && previous.source?.commit === r.source.commit && previous.source?.subdirectory === r.source.subdirectory) {
        // The same Git source identity must reproduce exactly the same normalized bytes.
        const immutable = value => ({package: value.package, source: value.source,
          archive: {format: value.archive.format, sha256: value.archive.sha256, size: value.archive.size}});
        if (canonical(immutable(previous)) !== canonical(immutable(r))) fail(`published Git source changed for ${id}@${r.source.commit}`);
      }
    }
  }
  validateGraph(lock, p, compilerVersion, target);
  const local = await optionalJSON(path.join(projectDir, 'vkf.local.json')) ?? {schema: 1, overrides: {}};
  keys(local, ['schema', 'overrides'], 'local overrides');
  if (local.schema !== 1 || !local.overrides || typeof local.overrides !== 'object' || Array.isArray(local.overrides)) fail('invalid local overrides');
  if (frozen && Object.keys(local.overrides).length) fail('frozen mode refuses mutable local overrides');
  for (const [id, folder] of Object.entries(local.overrides)) if (!Object.hasOwn(lock.packages, id) || typeof folder !== 'string' || !folder || folder.includes('\0')) fail(`invalid local override ${id}`);
  const cache = new SourceCache(options.cacheDir), archives = Object.create(null), overrides = Object.create(null);
  const cacheRoot = path.resolve(cache.root);
  for (const [id, r] of Object.entries(lock.packages)) {
    if (Object.hasOwn(local.overrides, id)) {
      const folder = await fs.realpath(path.resolve(projectDir, local.overrides[id]));
      const realCache = await fs.realpath(await directory(cacheRoot));
      if (folder === realCache || folder.startsWith(realCache + path.sep)) fail('override must be outside immutable source cache');
      const {value, bytes} = await packageBundle(folder);
      if (canonical(value.manifest) !== canonical(r.package)) fail(`override metadata differs from locked ${id}; only source edits are supported`);
      overrides[id] = {value, digest: await digest(bytes)};
    } else archives[id] = await cache.get(r, registry);
  }
  const files = await sourceFiles(projectDir);
  const inputs = await prepareInputs(lock, archives, files, {overrides});
  // Write the lock only after all archives/project inputs are valid and complete.
  // No overrides, cache paths, credentials, or generated build paths enter it.
  if (!await optionalJSON(lockFile) || update) await atomic(lockFile, utf8.encode(canonical(lock) + '\n'));
  return {lock, inputs};
}

export async function materializeNativeInputs(inputs, parent = os.tmpdir()) {
  assertPrepared(inputs);
  // Fresh private directory, never extraction over an existing working tree.
  const root = await fs.mkdtemp(path.join(await fs.realpath(parent), 'vkf-package-inputs-'));
  try {
    for (const [name, text] of Object.entries(inputs.files)) {
      const filename = path.join(root, name);
      await fs.mkdir(path.dirname(filename), {recursive: true});
      await fs.writeFile(filename, text, {flag: 'wx', mode: 0o600});
    }
    const modules = Object.fromEntries(Object.entries(inputs.modules).map(([name, filename]) => [name, root + filename.slice(INPUT_ROOT.length)]));
    const addresses = inputs.addresses?.map(edge => ({...edge, importer: root + edge.importer.slice(INPUT_ROOT.length), resolved: root + edge.resolved.slice(INPUT_ROOT.length)}));
    await fs.writeFile(path.join(root, 'modules.json'), canonical({schema: 1, compiler: inputs.compiler, target: inputs.target, modules, ...(addresses ? {addresses} : {})}) + '\n', {flag: 'wx', mode: 0o600});
    return {root, entry: root + inputs.entry.slice(INPUT_ROOT.length), environment: {VKF_PACKAGE_INPUT_ROOT: root},
      dispose: () => fs.rm(root, {recursive: true, force: true})};
  } catch (e) { await fs.rm(root, {recursive: true, force: true}); throw e; }
}

// Public default: one build-maintained vkf.lock; discovery is supplied by the compiler.
export async function prepareProject(projectDir, options = {}) {
  const {prepareAddressProject} = await import('./addresses.mjs');
  return prepareAddressProject(projectDir, options);
}
