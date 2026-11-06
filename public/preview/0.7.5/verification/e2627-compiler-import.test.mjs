import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fixture} from './fixtures.mjs';
import {createRegistry} from '../../package-tools/host.mjs';
import {prepareFormatterIr} from '../../prepare-formatter-ir.mjs';

// Mandatory ACTUAL compiler with e1860's real parser/linker/discovery/API +
// e1859 host. No mock discovery, skip or product PASS supplied by this source.
test('real compiler inline/string-binding/optional module aliases; Git imports/local edits/cache restoration', async t => {
  const compilerModule = process.env.VKF_PACKAGE_COMPILER;
  assert(compilerModule, 'set VKF_PACKAGE_COMPILER to the actual paired address-capable compiler.mjs');
  const {default: factory, createProjectCompiler} = await import(pathToFileURL(path.resolve(compilerModule)));
  let owner;
  const compiler = await createProjectCompiler({compilerModule, factory: async o => owner = await factory(o)});
  assert(owner._vkf075_package_source_inputs_version() >= 2);
  const formatter = owner.formatterOwner, originalCall = formatter.ccall.bind(formatter);
  let preparedIRCalls = 0;
  formatter.ccall = (name, result, types, values) => {
    if (name === 'vkf_formatter_prepare_ir') {
      assert.deepEqual(types, ['number']);
      assert.equal(typeof values[0], 'number');
      const start = values[0], end = formatter.HEAPU8.indexOf(0, start);
      assert(end > start, 'complete NUL-terminated IR must be on its formatter owner heap');
      const ir = JSON.parse(new TextDecoder().decode(formatter.HEAPU8.subarray(start, end)));
      assert(ir && typeof ir === 'object');
      preparedIRCalls++;
    }
    return originalCall(name, result, types, values);
  };
  const f = await fixture(t);
  const leaf = await f.publish('acme/leaf', 'optional-label', {files: {'src/module.vkf': 'helper:.internal\nvalue()->int:helper.value()\n', 'src/internal.vkf': 'value()->int:7\n'}});
  const leafAddress = `https://github.com/personal/geometry/tree/${leaf.commit}/packages/acme/leaf`;
  const root = await f.publish('acme/root', 'optional-label', {files: {'src/module.vkf': `leaf:.(${JSON.stringify(leafAddress)})\nvalue()->int:leaf.value()\n`}});
  const rootAddress = `https://github.com/personal/geometry/tree/${root.commit}/packages/acme/root`;
  const source = `address:${JSON.stringify(rootAddress)}\nroot:.(address)\n::root.value()\n`;
  await fs.writeFile(path.join(f.project, 'src/main.vkf'), source);
  // This adapter reads REAL local Git commits as deterministic remote fixture
  // bytes. It proves compiler/Git integration, not live personal GitHub access.
  const options = {...f.options, gitReader: createRegistry(f.config, f.project)};
  async function stdout(compiled) {
    const {instance} = await WebAssembly.instantiate(compiled.wasm, {}), api = instance.exports;
    assert.equal(api.vkf_vm_invoke(compiled.result.manifest.functions.$vkf_main.index, 0), 0);
    const formatter = owner.formatterOwner; assert(formatter);
    assert.equal(prepareFormatterIr(formatter, JSON.stringify(compiled.result.ir)), 0);
    const used = Math.max(api.vkf_vm_heap_ptr(), api.vkf_vm_results_ptr() + api.vkf_vm_value_slot_size()), ptr = formatter._malloc(used); assert(ptr);
    try { formatter.HEAPU8.set(new Uint8Array(api.memory.buffer, 0, used), ptr);
      assert.equal(formatter.ccall('vkf_browser_format_stdout', 'number', ['number','number','number'], [ptr, used, api.vkf_vm_results_ptr()]), 0);
      return formatter.ccall('vkf_browser_stdout', 'string', [], []);
    } finally { formatter._free(ptr); }
  }
  const first = await compiler.compileProject(f.project, options); assert.equal(await stdout(first), '7\n');
  const callsBeforeRunner = preparedIRCalls;
  assert.equal((await compiler.runProject(f.project, options)).stdout, '7\n');
  assert.equal(preparedIRCalls, callsBeforeRunner + 1, 'same runner must prepare IR through numeric heap transport');
  const oneFile = path.join(f.project, 'vkf.lock'), original = await fs.readFile(oneFile), doc = JSON.parse(original);
  const leafKey = Object.keys(doc.lock.sources).find(k => k.includes('packages%2Facme%2Fleaf')); assert(leafKey);
  doc.settings.overrides = {[leafKey]: path.relative(f.project, leaf.folder)};
  await fs.writeFile(oneFile, JSON.stringify(doc)); const locked = await fs.readFile(oneFile);
  await fs.writeFile(path.join(leaf.folder, 'src/internal.vkf'), 'value()->int:9\n');
  const edited = await compiler.compileProject(f.project, {...options, locked: true, offline: true});
  assert.equal(await stdout(edited), '9\n'); assert.notEqual(first.inputDigest, edited.inputDigest); assert.notDeepEqual(first.wasm, edited.wasm);
  assert.deepEqual(await fs.readFile(oneFile), locked); assert.equal(await fs.readFile(path.join(f.project, 'src/main.vkf'), 'utf8'), source);
  const entry = edited.inputs.entry, text = owner.FS.readFile(entry, {encoding: 'utf8'});
  const cached = () => {
    const result = JSON.parse(owner.ccall('vkf075_compile_with_arena', 'string', ['string','string','number'], [text,entry,64*1024*1024]));
    return {result, profile: JSON.parse(owner.ccall('vkf075_compile_profile', 'string', [], []))};
  };
  for (let i=0;i<2;i++) { const r=cached(); assert(r.result.ok); assert.equal(r.profile.sizes.artifact_cache_hit,0); assert.equal(r.profile.sizes.mutable_compile_input,1); }
  const leafEntry = edited.inputs.addresses.find(e => e.address === leafAddress).resolved;
  const internal = leafEntry.slice(0,leafEntry.lastIndexOf('/')+1)+'internal.vkf';
  owner.FS.unlink(internal); assert.equal(cached().result.ok,false);
  owner.FS.writeFile(internal,'value()->int:5\n'); const restoredResponse=cached(); assert(restoredResponse.result.ok);
  assert.equal(await stdout({wasm:Buffer.from(restoredResponse.result.wasm_hex,'hex'),result:restoredResponse.result}),'5\n');
  await fs.writeFile(oneFile,original);
  const restored=await compiler.compileProject(f.project,{...options,frozen:true,offline:true});
  assert.equal(await stdout(restored),'7\n'); assert.equal(restored.inputDigest,first.inputDigest); assert.deepEqual(await fs.readFile(oneFile),original);

  // Optional ordinary VKF alias file, using REAL compiler semantics.
  await fs.writeFile(path.join(f.project,'src/dependencies.vkf'),`root:.(${JSON.stringify(rootAddress)})\n`);
  await fs.writeFile(path.join(f.project,'src/main.vkf'),'d:.dependencies\n::d.root.value()\n');
  const aliases=await compiler.compileProject(f.project,{...options,offline:true}); assert.equal(await stdout(aliases),'7\n');
  assert.deepEqual(aliases.lock.lock.sources,first.lock.lock.sources);

  // Same ordinary bare import uses local file/folder; no mandatory publisher root.
  await fs.writeFile(path.join(f.project,'src/foo.vkf'),'value()->int:7\n');
  await fs.writeFile(path.join(f.project,'src/main.vkf'),'foo:.foo\n::foo.value()\n');
  assert.equal(await stdout(await compiler.compileProject(f.project,options)),'7\n');
  await fs.mkdir(path.join(f.project,'src/folder')); await fs.writeFile(path.join(f.project,'src/folder/foo.vkf'),'value()->int:7\n');
  await fs.writeFile(path.join(f.project,'src/main.vkf'),'foo:.folder.foo\n::foo.value()\n');
  assert.equal(await stdout(await compiler.compileProject(f.project,options)),'7\n');

  // Installed SAME runner path: actual CLI install, run and compile from one
  // generated vkf.lock, no manual project/package/local manifest.
  const cliProject=path.join(f.root,'runner-project'); await fs.mkdir(cliProject);
  const local=path.join(f.root,'runner-module'); await fs.mkdir(local);
  await fs.writeFile(path.join(local,'main.vkf'),'value()->int:7\n');
  const originalSource=await fs.readFile("/mnt/development/VektorFlow-e2240-integer-module-scalar-carrier-source-20261104/compiler/tests/fixtures/named-call-runtime-cartesian.vkf",'utf8'), originalExpected=await fs.readFile("/mnt/development/VektorFlow-e2240-integer-module-scalar-carrier-source-20261104/compiler/tests/fixtures/named-call-runtime-cartesian.expected.txt",'utf8');
  await fs.writeFile(path.join(cliProject,'main.vkf'),originalSource);
  const bin=path.join(f.root,'vkf'); await fs.symlink(fileURLToPath(new URL('../../package-tools/cli.mjs',import.meta.url)),bin);
  const exec=promisify(execFile), args=[cliProject,'--compiler',compilerModule,'--cache',f.cache];
  const installed=await exec(process.execPath,[bin,'install',...args]); assert.equal(JSON.parse(installed.stdout).status,'SOURCES_READY');
  const lockBefore=await fs.readFile(path.join(cliProject,'vkf.lock')); const ran=await exec(process.execPath,[bin,'run',...args,'--locked']); assert.equal(ran.stdout,originalExpected);
  const out=path.join(f.root,'artifact'); const compiledCLI=await exec(process.execPath,[bin,'compile',...args,'--out',out,'--locked']);
  assert((await fs.stat(path.join(out,'program.wasm'))).size>0); assert.deepEqual(await fs.readFile(path.join(cliProject,'vkf.lock')),lockBefore); const crypto=await import('node:crypto'); console.log('ORIGINAL_NODE_REGRESSION '+JSON.stringify({install:JSON.parse(installed.stdout),stdout:ran.stdout,stdoutHex:Buffer.from(ran.stdout).toString('hex'),compile:JSON.parse(compiledCLI.stdout),lockHex:lockBefore.toString('hex')}));
  console.log(JSON.stringify({status:'ADDRESS_IMPORT_REAL_GUEST_VERIFIED',sourceBinding:compiler.sourceBinding,outputs:['7','9','5','7'],optionalAliases:'7',bareLocal:['7','7'],runner:'7'}));
});
