#!/usr/bin/env node
import path from 'node:path';
import {realpathSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {pack} from './host.mjs';
import {createProjectCompiler, writeArtifact} from './project.mjs';
import {fail} from './metadata.mjs';
import {publishPackage} from './publish.mjs';

export const HELP = `VKF runner (Node >=22, canonical compiler 0.7.5)
  vkf run [PROJECT] --compiler FILE [--locked|--frozen] [--offline] [--cache DIR]
  vkf compile [PROJECT] --compiler FILE --out DIR [--locked|--frozen] [--offline] [--cache DIR]
  vkf install [PROJECT] --compiler FILE [--locked|--frozen] [--offline] [--cache DIR]
  vkf update [PROJECT] --compiler FILE [--cache DIR]
  vkf publish PACKAGE [--repository OWNER/REPO]
  vkf pack PACKAGE --out CACHE_EXPORT_DIR

PROJECT defaults to cwd; builds/maintains the single vkf.lock (schema 3).
No second manifest or URL alias config. The current compiler discovers static addresses.
install adds new source requests while preserving existing pins; update resolves requested Git
refs again. Personal repositories need no shared-registry approval. Ordinary compile/run/install never follows a moving ref once locked.
--locked requires an unchanged lock; --offline only reads verified cached sources.
--frozen additionally rejects mutable local source addresses and overrides within vkf.lock.
compile emits WASM through the maintained canonical compiler/paired formatter;
run executes console-only canonical WASM and prints canonical formatted output.
Programs needing retained/concurrent host capabilities use the existing browser.
publish sends actual source commit + branch + PR to the existing private repo;
authenticated actor must own the package in the trusted default-branch policy.
Registration/ownership transfer is a separate maintainer-controlled change.
Required branch enforcement must be enabled; no direct main write/auto-merge.
An open PR is not yet a published Git version. No secrets enter the lock.
pack exports normalized source cache data only, no version index/release asset.
Compatibility alias: vkf-package invokes these same maintained commands.
`;
export async function main(args = process.argv.slice(2)) {
  const {positionals, values} = parseArgs({args, allowPositionals: true, options: {
    help: {type: 'boolean'}, locked: {type: 'boolean'}, frozen: {type: 'boolean'}, offline: {type: 'boolean'},
    cache: {type: 'string'}, compiler: {type: 'string'}, out: {type: 'string'}, repository: {type: 'string'},
  }});
  if (values.help || !positionals.length) { process.stdout.write(HELP); return; }
  if (positionals.length > 2) fail('unexpected positional arguments');
  const [command, directory = '.'] = positionals;
  const options = {locked: values.locked, frozen: values.frozen, offline: values.offline, cacheDir: values.cache};
  if (command === 'publish') {
    process.stdout.write(JSON.stringify(await publishPackage(directory, {repository: values.repository}), null, 2) + '\n'); return;
  }
  if (command === 'pack') {
    if (!values.out) fail('pack requires --out');
    process.stdout.write(JSON.stringify(await pack(directory, path.resolve(values.out)), null, 2) + '\n'); return;
  }
  if (command === 'compile' || command === 'run') {
    if (!values.compiler || (command === 'compile' && !values.out)) fail(`${command} requires --compiler${command === 'compile' ? ' and --out' : ''}`);
    const compiler = await createProjectCompiler({compilerModule: values.compiler});
    if (command === 'run') { process.stdout.write((await compiler.runProject(directory, options)).stdout); return; }
    const compiled = await compiler.compileProject(directory, options);
    await writeArtifact(compiled, path.resolve(values.out));
    process.stdout.write(JSON.stringify({status: 'COMPILED', sourceBinding: compiled.sourceBinding, inputDigest: compiled.inputDigest,
      packages: Object.fromEntries(Object.entries(compiled.lock.lock.sources).map(([id, r]) => [id, r.commit ?? r.sha256]))}) + '\n'); return;
  }
  if (!['install', 'update'].includes(command)) fail(`unknown command ${command}`);
  if (!values.compiler) fail(`${command} requires --compiler for static source-address discovery`);
  const compiler = await createProjectCompiler({compilerModule: values.compiler});
  const {lock, inputs} = await compiler.prepareProject(directory, {...options, update: command === 'update'});
  process.stdout.write(JSON.stringify({status: 'SOURCES_READY', compiler: lock.lock.compiler, target: lock.lock.target, inputDigest: inputs.inputDigest,
    packages: Object.fromEntries(Object.entries(lock.lock.sources).map(([id, r]) => [id, r.commit ?? r.sha256]))}) + '\n');
}
if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
