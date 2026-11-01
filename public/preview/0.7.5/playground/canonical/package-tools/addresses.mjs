// Source-address host. The compiler supplies evaluated static addresses; this
// file never parses/evaluates VKF. All network completes before typed compile.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readBytes} from './host.mjs';
import {createGitRegistry} from './git-source.mjs';
import {prepareSourceAddressInputs, INPUT_ROOT} from './inputs.mjs';
import {fail, keys, object, relativeFile, canonical, digest, decode, range, version, SHA, MAX_BYTES, MAX_FILES, gitRef} from './metadata.mjs';
const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', {fatal: true});
const virtualProject = `${INPUT_ROOT}/project/`;
const slash = p => p.split(path.sep).join('/');
function safePath(name) { relativeFile(name); return name; }
async function optional(file) { try { return decode(await readBytes(file)); } catch (e) { if (e.code === 'ENOENT') return undefined; throw e; } }
async function atomic(file, bytes) {
  const temp = `${file}.tmp-${randomUUID()}`;
  try { await fs.writeFile(temp, bytes, {flag: 'wx', mode: 0o600}); await fs.rename(temp, file); }
  finally { await fs.rm(temp, {force: true}); }
}
export function buildDocument(doc) {
  keys(doc, ['schema', 'settings', 'lock'], 'vkf.lock');
  if (doc.schema !== 3) fail('vkf.lock requires schema 3; migrate old prerelease metadata explicitly');
  keys(doc.settings, ['entry', 'compiler', 'targets', 'name', 'version', 'exports', 'dependencies', 'overrides'], 'build settings');
  safePath(doc.settings.entry); if (!doc.settings.entry.endsWith('.vkf')) fail('entry must name a VKF source file');
  range(doc.settings.compiler);
  if (!Array.isArray(doc.settings.targets) || !doc.settings.targets.length || !doc.settings.targets.every(t => ['wasm', 'native'].includes(t))) fail('invalid build targets');
  if (doc.settings.overrides !== undefined) {
    object(doc.settings.overrides, 'source overrides');
    for (const [key, folder] of Object.entries(doc.settings.overrides)) {
      if (key.startsWith('https:')) { const u = new URL(key); if (u.username || u.password || u.hostname !== 'github.com' || u.hash || [...u.searchParams.keys()].some(k => !['ref', 'path', 'kind'].includes(k))) fail('credential-bearing override key'); }
      if (!key || typeof folder !== 'string' || !folder || path.isAbsolute(folder) || folder.includes('\0') || folder.includes(':') || folder.includes('\\')) fail('override locations must be credential-free project-relative paths');
    }
  }
  return doc;
}
async function readSources(root, includeMetadata = true) {
  const files = Object.create(null); let size = 0, count = 0, walked = 0;
  const stat = await fs.lstat(root); if (!stat.isDirectory() || stat.isSymbolicLink()) fail('source folder must be a real directory');
  async function walk(folder, relative = '') {
    for (const item of await fs.readdir(folder, {withFileTypes: true})) {
      if (++walked > 4 * MAX_FILES) fail('local source directory exceeds bounded scan limit');
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      const name = relative + item.name, full = path.join(folder, item.name);
      if (item.isSymbolicLink()) fail(`source symlink refused: ${name}`);
      if (item.isDirectory()) { safePath(name); await walk(full, name + '/'); }
      else if (item.name.endsWith('.vkf') || (includeMetadata && name === 'vkf.lock')) {
        safePath(name); if (!item.isFile()) fail('source entry must be a regular file');
        const bytes = await readBytes(full); size += bytes.length;
        if (size > MAX_BYTES || ++count > MAX_FILES) fail('source tree exceeds byte/file limit');
        files[name] = name === 'vkf.lock' ? canonical({schema: 3, settings: buildDocument(decode(bytes)).settings}) + '\n' : decoder.decode(bytes);
      }
    }
  }
  await walk(root); return files;
}
function folderEntry(files) {
  if (files['vkf.lock'] !== undefined) {
    const doc = buildDocument(JSON.parse(files['vkf.lock']));
    return doc.settings.entry;
  }
  const entries = ['main.vkf', 'src/main.vkf'].filter(n => Object.hasOwn(files, n));
  if (entries.length !== 1) fail('folder needs unambiguous main.vkf/src/main.vkf or entry in its single vkf.lock');
  return entries[0];
}
function checkFolderSettings(files, compiler, target) {
  if (files['vkf.lock'] === undefined) return;
  const doc = buildDocument(JSON.parse(files['vkf.lock']));
  if (!range(doc.settings.compiler)(compiler) || !doc.settings.targets.includes(target)) fail('address folder incompatible with compiler/target');
}
function githubAddress(value) {
  let u;
  try { u = new URL(value); } catch { fail('invalid source address'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.hash || [...u.searchParams.keys()].some(k => k !== 'ref') || u.searchParams.getAll('ref').length > 1) fail('unsupported or credential-bearing URL; only HTTPS GitHub source addresses with optional ref are supported');
  if (!['github.com', 'raw.githubusercontent.com'].includes(u.hostname) || u.port) fail(`unsupported source provider ${u.hostname}; no HTML/network guessing`);
  const parts = u.pathname.split('/').filter(Boolean).map(v => decodeURIComponent(v));
  const owner = parts.shift(), name = parts.shift()?.replace(/\.git$/, '');
  if (!owner || !name || !/^[a-zA-Z0-9_-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(name)) fail('invalid GitHub repository address');
  let ref = u.searchParams.get('ref') ?? 'HEAD', file = false;
  if (u.hostname === 'raw.githubusercontent.com') { ref = parts.shift(); file = true; }
  else if (parts[0] === 'blob' || parts[0] === 'tree') {
    file = parts.shift() === 'blob';
    const pathRef = parts.shift(); if (!u.searchParams.has('ref')) ref = pathRef;
  } else if (parts.length) fail('GitHub source address requires repository, tree, or blob path');
  gitRef(ref);
  const location = parts.join('/'); if (location) safePath(location);
  if (file && (!location || !location.endsWith('.vkf'))) fail('direct GitHub source file must end in .vkf');
  const repository = `${owner}/${name}`.toLowerCase();
  return {kind: 'git', repository, ref, location, file,
    key: `https://github.com/${repository}?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(location)}&kind=${file ? 'file' : 'folder'}`};
}
export function canonicalGitHubAddress(value) { return githubAddress(value); }
async function addressSpec(value, importer, origins, projectDir) {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.length > 2048) fail('invalid static source address');
  if (value.startsWith('https://') || value.startsWith('http://')) return githubAddress(value);
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) && !value.startsWith('file:')) fail('unsupported source-address protocol');
  const origin = origins.get(importer); if (!origin) fail('source address importer was not supplied by the host');
  if (origin.kind === 'git' && !path.isAbsolute(value) && !value.startsWith('file:')) {
    const location = path.posix.normalize(path.posix.join(origin.subdirectory, path.posix.dirname(origin.relative), value));
    safePath(location);
    return githubAddress(`https://github.com/${origin.repository}/${location.endsWith('.vkf') ? 'blob' : 'tree'}/${origin.commit}/${location}`);
  }
  let local;
  if (value.startsWith('file:')) { const u = new URL(value); if (u.hostname && u.hostname !== 'localhost') fail('remote file URL is unsupported'); if (u.search || u.hash) fail('file URL query/fragment refused'); local = fileURLToPath(u); }
  else local = path.resolve(origin.kind === 'local' ? path.dirname(origin.file) : projectDir, value);
  const stat = await fs.lstat(local); if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) fail('local address must be a real file/folder');
  if (stat.isFile() && !local.endsWith('.vkf')) fail('direct local source must end in .vkf');
  const actual = await fs.realpath(local), relative = slash(path.relative(projectDir, actual));
  // Explicit absolute source addresses are accepted at runtime, but persisted
  // identities use a project-relative path and never copy a machine root.
  return {kind: 'local', local: actual, file: stat.isFile(), key: `local:${relative || '.'}:${stat.isFile() ? 'file' : 'folder'}`, relative};
}
function validateRecord(r) {
  keys(r, ['kind', 'repository', 'requestedRef', 'commit', 'subdirectory', 'tree', 'entry', 'path', 'sha256', 'size'], 'address lock record');
  safePath(r.entry);
  if (typeof r.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(r.sha256) || !Number.isSafeInteger(r.size) || r.size <= 0 || r.size > MAX_BYTES) fail('invalid locked address content identity');
  if (r.kind === 'git') {
    if (!SHA.test(r.commit) || !SHA.test(r.tree)) fail('locked Git source requires full commit/tree');
    if (r.subdirectory) safePath(r.subdirectory); gitRef(r.requestedRef);
    if (typeof r.repository !== 'string' || !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(r.repository)) fail('invalid locked source repository');
  } else if (r.kind === 'local') {
    if (typeof r.path !== 'string' || path.isAbsolute(r.path) || r.path.includes('\0') || r.path.includes(':') || r.path.includes('\\')) fail('local lock path must be project-relative');
  } else fail('unsupported locked address kind');
  return r;
}
export function validateAddressLock(lock) {
  keys(lock, ['compiler', 'target', 'sources', 'requests'], 'derived address lock');
  version(lock.compiler); if (!['wasm', 'native'].includes(lock.target)) fail('invalid locked target');
  object(lock.sources, 'locked source addresses');
  if (!Array.isArray(lock.requests) || Object.keys(lock.sources).length > 256 || lock.requests.length > 4096) fail('invalid locked source graph');
  for (const [key, r] of Object.entries(lock.sources)) {
    validateRecord(r);
    if (key.startsWith('https:')) {
      const u = new URL(key);
      if (u.username || u.password || u.hostname !== 'github.com' || u.hash || [...u.searchParams.keys()].some(k => !['ref', 'path', 'kind'].includes(k))) fail('credential-bearing/invalid canonical source key');
    } else if (!key.startsWith('local:') || key.slice(6).startsWith('/') || key.includes('\\') || key.includes('\0')) fail('invalid portable local source key');
  }
  for (const edge of lock.requests) {
    keys(edge, ['importer', 'resolved'], 'locked source edge'); safePath(edge.importer); safePath(edge.resolved);
  }
  return lock;
}
function normalizedFiles(bytes) {
  const value = decode(bytes); keys(value, ['schema', 'files'], 'address source cache');
  if (value.schema !== 1) fail('invalid address source cache schema'); object(value.files, 'address source files');
  if (Object.keys(value.files).length > MAX_FILES) fail('address source file limit');
  for (const [name, text] of Object.entries(value.files)) {
    safePath(name); if ((!name.endsWith('.vkf') && name !== 'vkf.lock') || typeof text !== 'string' || text.includes('\0')) fail('invalid address source text/path');
  }
  return value.files;
}
export async function prepareAddressProject(projectDir, options = {}) {
  projectDir = await fs.realpath(path.resolve(projectDir));
  const {compilerVersion = '0.7.5', target = 'wasm', discover, update = false, locked = false, offline = false, frozen = false} = options;
  version(compilerVersion); if (typeof discover !== 'function') fail('source-address build requires the actual compiler static discovery API');
  if (update && (locked || offline || frozen)) fail('update conflicts with locked/offline/frozen mode');
  const documentFile = path.join(projectDir, 'vkf.lock'), previous = await optional(documentFile);
  if (!previous && (locked || frozen || offline)) fail('vkf.lock required in locked/offline/frozen mode');
  const projectFiles = await readSources(projectDir);
  const doc = buildDocument(previous ?? {schema: 3, settings: {entry: options.entry ?? folderEntry(projectFiles), compiler: '>=0.7.5 <0.8.0', targets: ['wasm', 'native']}});
  if (options.entry !== undefined && options.entry !== doc.settings.entry) fail('entry differs from authored vkf.lock settings');
  if (!range(doc.settings.compiler)(compilerVersion) || !doc.settings.targets.includes(target)) fail('project incompatible with compiler/target');
  if (!Object.hasOwn(projectFiles, doc.settings.entry)) fail('project entry missing');
  const old = doc.lock;
  if ((locked || frozen || offline) && !old) fail('derived source lock required in locked/offline/frozen mode');
  if (old !== undefined) {
    validateAddressLock(old);
    if ((locked || frozen) && (old.compiler !== compilerVersion || old.target !== target)) fail('locked compiler/target changed');
  }
  const files = Object.create(null), modules = Object.create(null), origins = new Map(), records = Object.create(null), addresses = [], edges = new Set(), identities = Object.create(null);
  for (const [name, text] of Object.entries(projectFiles)) if (name.endsWith('.vkf')) {
    files[virtualProject + name] = text; origins.set(virtualProject + name, {kind: 'local', file: path.join(projectDir, name)});
  }
  const entry = virtualProject + doc.settings.entry;
  let mountedBytes = Object.values(files).reduce((n, text) => n + encoder.encode(text).length, 0), mountedCount = Object.keys(files).length;
  const cacheRoot = path.resolve(options.cacheDir ?? path.join(os.homedir(), '.cache/vektor-flow'));
  const cacheDir = path.join(cacheRoot, 'sources', 'addresses-v1');
  for (const directory of [cacheRoot, path.join(cacheRoot, 'sources'), cacheDir]) {
    await fs.mkdir(directory, {recursive: true}); const stat = await fs.lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail('address cache directory must not be a symlink');
  }
  const overrides = {...(doc.settings.overrides ?? {}), ...(options.overrides ?? {})};
  if (frozen && Object.keys(overrides).length) fail('frozen mode refuses local overrides');
  const loadedSources = new Map();
  async function load(spec, inherited) {
    if (inherited !== undefined) { validateRecord(inherited); if (inherited.kind !== 'git') inherited = undefined; }
    if (loadedSources.has(spec.key)) {
      const loaded = loadedSources.get(spec.key);
      if (inherited && canonical(inherited) !== canonical(loaded.record)) fail('conflicting transitive locked Git sources');
      return loaded;
    }
    if (loadedSources.size >= 256) fail('source address graph exceeds 256 sources');
    let r = (!update ? old?.sources?.[spec.key] : undefined) ?? inherited, sourceFiles, localOrigin, bytes, cached = false, sourceConstraints;
    if (r && inherited && canonical(r) !== canonical(inherited)) fail('existing source lock conflicts with package dependency pin; use explicit update');
    if ((locked || frozen) && !old?.sources?.[spec.key]) fail('new source address differs from locked graph');
    const override = overrides[spec.key];
    if (override !== undefined) {
      if (typeof override !== 'string' || !override) fail('invalid source override');
      const location = path.resolve(projectDir, override), actual = await fs.realpath(location), actualCache = await fs.realpath(cacheRoot);
      if (actual === actualCache || actual.startsWith(actualCache + path.sep)) fail('override must be outside immutable source cache');
      spec = {...spec, local: location, file: (await fs.lstat(location)).isFile()};
    }
    if (spec.kind === 'local' || override !== undefined) {
      if (frozen) fail('frozen mode refuses mutable local source addresses');
      const folder = spec.file ? path.dirname(spec.local) : spec.local;
      sourceFiles = await readSources(folder, !spec.file);
      const nestedDocument = spec.file ? undefined : await optional(path.join(folder, 'vkf.lock'));
      if (nestedDocument?.lock) sourceConstraints = validateAddressLock(nestedDocument.lock).sources;
      const sourceEntry = spec.file ? path.basename(spec.local) : folderEntry(sourceFiles);
      bytes = encoder.encode(canonical({schema: 1, files: sourceFiles}) + '\n');
      const localRecord = {kind: 'local', path: slash(path.relative(projectDir, spec.local)), entry: sourceEntry, sha256: await digest(bytes), size: bytes.length};
      if (override === undefined) r = localRecord;
      else if (!r) fail('resolve the original source once before applying an override');
      localOrigin = folder; identities[spec.key] = {mutable: true, sha256: localRecord.sha256};
      if (override !== undefined && sourceEntry !== r.entry) fail('override entry differs from locked source');
    } else {
      const expectedDirectory = spec.file ? path.posix.dirname(spec.location) : spec.location;
      const expectedSubdirectory = expectedDirectory === '.' ? '' : expectedDirectory;
      if (r && (r.kind !== 'git' || r.repository !== spec.repository || r.requestedRef !== spec.ref || r.subdirectory !== expectedSubdirectory || (spec.file && r.entry !== path.posix.basename(spec.location)))) fail('locked source address identity changed');
      const reader = options.gitReader ?? createGitRegistry({kind: 'github', repository: spec.repository, ref: spec.ref}, projectDir, options);
      if (r) {
        const filename = path.join(cacheDir, r.sha256 + '.json');
        try { bytes = await readBytes(filename); cached = true; }
        catch (e) { if (e.code !== 'ENOENT') throw e; }
        if (!bytes) {
          if (offline) fail(`offline address cache missing ${spec.key}`);
          const loaded = await reader.readSource({commit: r.commit, subdirectory: r.subdirectory});
          if (loaded.commit !== r.commit || loaded.tree !== r.tree) fail('locked Git source identity mismatch'); bytes = loaded.bytes;
        }
      } else {
        if (offline) fail('offline source address requires an existing exact lock/cache');
        const directory = spec.file ? path.posix.dirname(spec.location) : spec.location;
        const subdirectory = directory === '.' ? '' : directory;
        const loaded = await reader.readSource({ref: spec.ref, subdirectory}); bytes = loaded.bytes;
        sourceFiles = normalizedFiles(bytes);
        r = {kind: 'git', repository: spec.repository, requestedRef: spec.ref, commit: loaded.commit, subdirectory, tree: loaded.tree,
          entry: spec.file ? path.posix.basename(spec.location) : folderEntry(sourceFiles), sha256: await digest(bytes), size: bytes.length};
      }
      validateRecord(r);
      if (bytes.length !== r.size || await digest(bytes) !== r.sha256) fail('address source checksum/size mismatch');
      sourceFiles = normalizedFiles(bytes);
      if (!cached) await atomic(path.join(cacheDir, r.sha256 + '.json'), bytes);
      identities[spec.key] = {mutable: false, sha256: r.sha256, commit: r.commit};
    }
    const previously = old?.sources?.[spec.key];
    if (previously?.kind === 'git' && r.kind === 'git' && previously.commit === r.commit && previously.subdirectory === r.subdirectory && canonical(previously) !== canonical(r)) fail('same Git commit acquired different address source content');
    validateRecord(r); if (!spec.file) checkFolderSettings(sourceFiles, compilerVersion, target);
    if (!spec.file && !sourceConstraints && sourceFiles['vkf.lock'] !== undefined) {
      const nestedDocument = JSON.parse(sourceFiles['vkf.lock']);
      if (nestedDocument.lock) sourceConstraints = validateAddressLock(nestedDocument.lock).sources;
    }
    if (!Object.hasOwn(sourceFiles, r.entry)) fail('source address entry missing');
    const mount = `${INPUT_ROOT}/addresses/${await digest(encoder.encode(spec.key))}/`;
    for (const [name, text] of Object.entries(sourceFiles)) if (name.endsWith('.vkf')) {
      if (!Object.hasOwn(files, mount + name)) {
        mountedBytes += encoder.encode(text).length;
        if (mountedBytes > MAX_BYTES || ++mountedCount > MAX_FILES) fail('combined source-address graph exceeds byte/file limit');
      }
      files[mount + name] = text;
      origins.set(mount + name, localOrigin ? {kind: 'local', file: path.join(localOrigin, name), constraints: sourceConstraints} : {...r, relative: name, constraints: sourceConstraints});
    }
    records[spec.key] = r;
    const result = {record: r, resolved: mount + r.entry}; loadedSources.set(spec.key, result); return result;
  }
  let finished = false;
  for (let pass = 0; pass < 257; pass++) {
    const discovered = await discover({entry, files: {...files}, modules: {...modules}, addresses: [...addresses]});
    if (!discovered || !Array.isArray(discovered.imports) || discovered.imports.length > 4096) fail('invalid compiler source-address discovery response');
    let added = 0;
    for (const request of discovered.imports) {
      keys(request, ['importer', 'address', 'source_location'], 'compiler discovered address');
      if (!Object.hasOwn(files, request.importer)) fail('compiler discovered an unknown source importer');
      const edge = canonical([request.importer, request.address]); if (edges.has(edge)) continue;
      if (edges.size >= 4096) fail('address import edge limit exceeded');
      const spec = await addressSpec(request.address, request.importer, origins, projectDir);
      const inherited = origins.get(request.importer)?.constraints?.[spec.key];
      const loaded = await load(spec, inherited);
      addresses.push({importer: request.importer, address: request.address, resolved: loaded.resolved});
      edges.add(edge); added++;
    }
    if (!added) { if (discovered.complete === false) fail('compiler static discovery stalled; address expression must be compile-time known'); finished = true; break; }
  }
  if (!finished) fail('source address discovery exceeded fixed point limit');
  const requests = addresses.map(({importer, address, resolved}) => ({importer: importer.slice(INPUT_ROOT.length + 1), address, resolved: resolved.slice(INPUT_ROOT.length + 1)}));
  // Raw absolute file addresses are source syntax, but lock persists canonical
  // portable resolved edges instead of copying those machine-specific strings.
  const portableRequests = [...new Map(requests.map(r => [canonical([r.importer, r.resolved]), {importer: r.importer, resolved: r.resolved}])).entries()]
    .sort(([a], [b]) => a.localeCompare(b)).map(([, edge]) => edge);
  const next = {compiler: compilerVersion, target, sources: records, requests: portableRequests};
  if ((locked || frozen) && canonical(old) !== canonical(next)) fail('source graph differs from locked graph');
  const inputs = await prepareSourceAddressInputs({files, entry, modules, addresses, compiler: compilerVersion, target, identities});
  if (!previous || canonical(old) !== canonical(next)) await atomic(documentFile, encoder.encode(canonical({...doc, lock: next}) + '\n'));
  return {lock: {...doc, lock: next}, inputs};
}
