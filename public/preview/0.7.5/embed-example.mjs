import {highlightVkf} from './code-highlight.mjs?v=26542dbe4b226163';
import {createInlineRunner} from './inline-runner.mjs?v=100ee98814b65a23';
const form = document.querySelector('#calculation');
const input = document.querySelector('#number');
const button = document.querySelector('#run');
const output = document.querySelector('#result');
const status = document.querySelector('#status');
const sourceView = document.querySelector('#source');
try {
  const response = await fetch('./current-compiler-release.json');
  if (!response.ok) throw new Error('The compiler manifest could not be loaded');
  const release = await response.json();
  if (!release.release_version || !['verified-examples','private-candidate'].includes(release.status)) throw new Error('The selected compiler is unavailable');
  const runner = createInlineRunner({moduleURL:release.package.module,wasmUrl:release.package.wasm,dataURL:release.package.data,expectedSourceBinding:release.browser_binding??release.compiler_source,timeoutMs:120000});
  window.addEventListener('pagehide',event=>{if(!event.persisted)void runner.dispose();});
  await runner.prewarm();
  button.disabled = false; button.textContent = 'Calculate';
  status.textContent = `Ready · ${release.release_version} ${release.status==='private-candidate'?'candidate preview':release.preview?'preview':'release'} · runs locally`;
  let revision = 0, busy = false;
  input.addEventListener('input', () => { revision++; output.textContent = ''; status.textContent = 'Input changed · calculate to update the result'; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    const runRevision = revision;
    busy = true;
    const source = `square(x): x ^ 2\n\n:: square(${value})`;
    sourceView.querySelector('code').innerHTML = highlightVkf(source);
    button.disabled = true; output.textContent = ''; status.textContent = 'Compiling and running…';
    try {
      const result = await runner.run(source);
      if (revision === runRevision) { output.textContent = result.output.stdout; status.textContent = 'Completed in the local WebAssembly worker'; }
    } catch (error) {
      if (revision === runRevision) { output.textContent = error.message; status.textContent = 'Execution failed'; }
    }
    finally { busy = false; button.disabled = false; }
  });
} catch (error) { status.textContent = error.message; button.textContent = 'Compiler unavailable'; }
