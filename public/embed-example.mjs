import {createInlineRunner} from './inline-runner.mjs';
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
  if (release.release_version !== '0.7.2' || release.status !== 'verified-examples') throw new Error('The expected 0.7.2 preview is unavailable');
  const runner = createInlineRunner({moduleURL:release.package.module,wasmUrl:release.package.wasm,dataURL:release.package.data,timeoutMs:120000});
  await runner.prewarm();
  button.disabled = false; button.textContent = 'Calculate';
  status.textContent = 'Ready · pinned 0.7.2 preview · runs locally';
  input.addEventListener('input', () => { output.textContent = ''; status.textContent = 'Input changed · calculate to update the result'; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    const source = `square(x):x^2\n::square(${value})`;
    sourceView.textContent = source;
    button.disabled = true; output.textContent = ''; status.textContent = 'Compiling and running…';
    try {
      const result = await runner.run(source);
      if (Number(input.value) === value) { output.textContent = result.output.stdout; status.textContent = 'Completed in the local WebAssembly worker'; }
    } catch (error) { output.textContent = error.message; status.textContent = 'Execution failed'; }
    finally { button.disabled = false; }
  });
} catch (error) { status.textContent = error.message; button.textContent = 'Compiler unavailable'; }
