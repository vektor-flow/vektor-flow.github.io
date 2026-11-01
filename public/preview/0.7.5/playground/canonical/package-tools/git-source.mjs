// Host-only Git object reads. Never extract tar/zip, run package code/hooks, or
// persist credentials/temporary download URLs. Cache bytes normalize source TEXT.
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {MAX_BYTES, MAX_FILES, FORMAT, SHA, fail, registryConfig, gitRef, relativeFile,
  canonical, bundle, decode, digest, record, manifest} from './metadata.mjs';
const exec = promisify(execFile);
const encoder = new TextEncoder();
const text = bytes => new TextDecoder('utf-8', {fatal: true}).decode(bytes);
const included = name => name === 'vkf.lock' || name === 'LICENSE' || name === 'README.md' || (name.startsWith('src/') && name.endsWith('.vkf'));
function blobIdentity(bytes) {
  return createHash('sha1').update(`blob ${bytes.byteLength}\0`).update(bytes).digest('hex');
}
function sha(value) { if (typeof value !== 'string' || !SHA.test(value)) fail('invalid Git object identity'); return value; }
export function createGitRegistry(config, projectDir, {offline = false, gh = 'gh', git = 'git'} = {}) {
  registryConfig(config);
  const root = config.kind === 'directory' ? path.resolve(projectDir, config.path) : undefined;
  const repo = config.repository, prepared = new Map();
  let approved;
  async function command(args) {
    try { return (await exec(git, ['-C', root, ...args], {encoding: 'buffer', timeout: 60000, maxBuffer: 2 * MAX_BYTES})).stdout; }
    catch { fail('Git source/ref unavailable or unapproved; check exact commit and repository'); }
  }
  async function api(endpoint) {
    if (offline) fail('offline cache missing; GitHub source reads refused');
    try {
      const {stdout} = await exec(gh, ['api', '--method', 'GET', '-H', 'Accept: application/vnd.github+json', endpoint],
        {encoding: 'buffer', timeout: 60000, maxBuffer: 2 * MAX_BYTES});
      return JSON.parse(text(stdout));
    } catch { fail('GitHub source/ref unavailable; check host gh access and exact repository/commit'); }
  }
  async function approvedTip() {
    if (approved) return approved;
    if (config.kind === 'directory') approved = text(await command(['rev-parse', '--verify', `${config.ref}^{commit}`])).trim();
    else {
      const meta = await api(`repos/${repo}`);
      if (config.ref !== meta.default_branch) fail('registry approval ref must be the repository default branch');
      approved = (await api(`repos/${repo}/commits/${encodeURIComponent(config.ref)}`)).sha;
    }
    return sha(approved);
  }
  async function selectedCommit(ref) {
    gitRef(ref);
    const tip = await approvedTip();
    const commit = config.kind === 'directory'
      ? text(await command(['rev-parse', '--verify', `${ref}^{commit}`])).trim()
      : (await api(`repos/${repo}/commits/${encodeURIComponent(ref)}`)).sha;
    sha(commit);
    if (SHA.test(ref) && commit !== ref) fail('exact commit resolution changed');
    if (commit !== tip) {
      if (config.kind === 'directory') await command(['merge-base', '--is-ancestor', commit, tip]);
      else {
        const comparison = await api(`repos/${repo}/compare/${commit}...${tip}`);
        if (!['ahead', 'identical'].includes(comparison.status) || comparison.merge_base_commit?.sha !== commit) fail('unmerged source commit is not an approved package version');
      }
    }
    return commit;
  }
  async function source(commit, subdirectory, plain = false) {
    sha(commit); if (subdirectory) relativeFile(subdirectory);
    let tree, entries;
    if (config.kind === 'directory') {
      tree = sha(text(await command(['rev-parse', '--verify', subdirectory ? `${commit}:${subdirectory}` : `${commit}^{tree}`])).trim());
      const listing = text(await command(['ls-tree', '-r', '-z', tree]));
      entries = listing.split('\0').filter(Boolean).map(line => {
        const m = /^(\d+) (\w+) ([0-9a-f]{40})\t(.+)$/.exec(line);
        if (!m) fail('invalid Git tree listing');
        return {mode: m[1], type: m[2], sha: m[3], path: m[4]};
      });
    } else {
      const committed = await api(`repos/${repo}/git/commits/${commit}`);
      if (committed.sha !== commit) fail('Git commit identity changed');
      tree = sha(committed.tree?.sha);
      for (const segment of subdirectory.split('/').filter(Boolean)) {
        const listing = await api(`repos/${repo}/git/trees/${tree}`);
        if (listing.sha !== tree || listing.truncated || !Array.isArray(listing.tree)) fail('incomplete Git directory tree');
        const entry = listing.tree.find(e => e.path === segment);
        if (entry?.type !== 'tree' || entry.mode !== '040000') fail('package directory missing or not a Git tree');
        tree = sha(entry.sha);
      }
      const listing = await api(`repos/${repo}/git/trees/${tree}?recursive=1`);
      if (listing.sha !== tree || listing.truncated || !Array.isArray(listing.tree)) fail('incomplete Git package tree');
      entries = listing.tree;
    }
    if (entries.length > 2 * MAX_FILES) fail('Git package tree exceeds entry limit');
    const files = Object.create(null); let total = 0, count = 0, m;
    const seen = new Set();
    for (const entry of entries) {
      if (typeof entry.path !== 'string' || entry.path.length > 240 || !/^[a-zA-Z0-9_./-]+$/.test(entry.path) || entry.path.split('/').some(s => !s || s === '.' || s === '..' || s === '.git')) fail('unsafe Git tree path');
      sha(entry.sha);
      if (seen.has(entry.path)) fail('duplicate Git tree path'); seen.add(entry.path);
      if (entry.type === 'tree' && entry.mode === '040000') continue;
      if (entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode)) fail(`source symlink/submodule refused: ${entry.path}`);
      if (!(plain ? (entry.path.endsWith('.vkf') || entry.path === 'vkf.lock') : included(entry.path))) {
        if (entry.path.startsWith('src/')) fail(`src contains non-VKF file ${entry.path}`);
        continue;
      }
      if (++count > MAX_FILES) fail('too many source files');
      let bytes;
      if (config.kind === 'directory') bytes = await command(['cat-file', 'blob', entry.sha]);
      else {
        const blob = await api(`repos/${repo}/git/blobs/${entry.sha}`);
        if (blob.sha !== entry.sha || blob.encoding !== 'base64' || !Number.isSafeInteger(blob.size) || blob.size > MAX_BYTES || typeof blob.content !== 'string') fail('invalid Git blob');
        bytes = Buffer.from(blob.content, 'base64');
        if (bytes.length !== blob.size) fail('Git blob size mismatch');
      }
      total += bytes.byteLength;
      if (total > MAX_BYTES || blobIdentity(bytes) !== entry.sha) fail('Git source size/content identity mismatch');
      if (entry.path === 'vkf.lock' && !plain) {
        const doc = decode(bytes);
        if (doc.schema !== 3 || !doc.settings) fail('package requires one schema-3 vkf.lock');
        m = manifest({schema: 2, ...doc.settings});
      } else files[entry.path] = text(bytes);
    }
    const value = plain ? {schema: 1, files} : bundle({schema: 1, manifest: m, files});
    const bytes = encoder.encode(canonical(value) + '\n');
    if (bytes.byteLength > MAX_BYTES) fail('normalized source exceeds byte limit');
    return {value, bytes, tree};
  }
  return {
    async readSource({ref, commit, subdirectory = ''}) {
      if (offline) fail('offline cache missing; Git source reads refused');
      if (!commit) {
        const requested = ref === 'HEAD' ? (config.kind === 'directory' ? 'HEAD' : (await api(`repos/${repo}`)).default_branch) : ref;
        gitRef(requested);
        commit = config.kind === 'directory' ? text(await command(['rev-parse', '--verify', `${requested}^{commit}`])).trim()
          : (await api(`repos/${repo}/commits/${encodeURIComponent(requested)}`)).sha;
        sha(commit);
        if (SHA.test(ref) && commit !== ref) fail('exact source commit changed');
      }
      const loaded = await source(commit, subdirectory, true);
      return {commit, subdirectory, tree: loaded.tree, bytes: loaded.bytes, files: loaded.value.files};
    },
    async resolve(id, q) {
      if (offline) fail('offline initial resolution/update needs a lock');
      const commit = await selectedCommit(q.ref), loaded = await source(commit, q.subdirectory);
      const r = record({schema: 2, package: loaded.value.manifest,
        source: {repository: repo, commit, subdirectory: q.subdirectory, tree: loaded.tree},
        archive: {format: FORMAT, size: loaded.bytes.byteLength, sha256: await digest(loaded.bytes)}}, id);
      prepared.set(r.archive.sha256, loaded.bytes);
      return r;
    },
    async archive(r) {
      record(r, r?.package?.name);
      if (offline) fail(`offline cache missing ${r.package.name}@${r.source.commit}`);
      if (r.source.repository !== repo) fail('locked repository differs from configured source');
      if (prepared.has(r.archive.sha256)) return prepared.get(r.archive.sha256);
      // Locked fetch reads ONLY exact object ids; no branch/index/discovery read.
      const loaded = await source(r.source.commit, r.source.subdirectory);
      if (loaded.tree !== r.source.tree) fail('locked Git tree identity changed');
      return loaded.bytes; // SourceCache rechecks exact normalized manifest+digest.
    },
  };
}
