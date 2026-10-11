// Keep editable sources and output together; only a reviewed package enables Run.
import {highlightVkf} from './editor/vkf-highlighter.mjs?asset=9a71063d8cf6357f';
import {createInlineRunner} from './inline-runner.mjs';
import {mountRetainedSceneResult} from './inline-retained-scene-view.mjs';
import {ensureInlineRenderer} from './inline-renderer-loader.mjs';

const release = await fetch(new URL('./current-compiler-release.json', import.meta.url),
  {cache:'no-store'}).then(response => response.ok ? response.json() : null).catch(() => null);
const runner = release?.status === 'verified-examples'
  ? createInlineRunner({wasmUrl:release.package.wasm, moduleURL:release.package.module,
      dataURL:release.package.data, timeoutMs:120000}) : null;

// Pages may reload once to establish shared memory. Restore drafts before a
// Run records its revision, so the first result cannot be mistaken for stale.
let ready = false;
if (runner && document.querySelector('.readme-example')) {
  try { await runner.prewarm(); ready = true; }
  catch (error) {
    for (const label of document.querySelectorAll('.readme-example-bar > span')) {
      label.textContent = error.message;
    }
  }
}

for (const example of document.querySelectorAll('.readme-example')) {
  const source = example.querySelector('.readme-example-source');
  const highlight = example.querySelector('.readme-example-highlight');
  const code = highlight?.querySelector('code');
  if (!source || !highlight || !code) continue;
  const button = example.querySelector('.readme-example-play');
  const output = example.querySelector('.readme-example-output');
  const workspace = example.querySelector('.readme-example-workspace');
  if (output && source.value !== source.defaultValue) output.textContent = '';
  let revision = 0, busy = false, dispose;
  const clearScene = () => { dispose?.(); dispose = undefined; };

  const refresh = () => {
    code.innerHTML = highlightVkf(source.value + '\n');
    highlight.scrollTop = source.scrollTop;
    highlight.scrollLeft = source.scrollLeft;
  };
  source.style.height = `${Math.min(420, Math.max(100, source.value.split('\n').length * 24 + 32))}px`;
  source.addEventListener('input', () => {
    revision++;
    clearScene();
    refresh();
    if (output) output.textContent = '';
  });
  source.addEventListener('scroll', refresh);
  source.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    source.setRangeText('    ', source.selectionStart, source.selectionEnd, 'end');
    source.dispatchEvent(new Event('input', {bubbles:true}));
  });
  if (ready && button && output && workspace) {
    example.dataset.compilerStatus = 'verified-examples';
    const label = example.querySelector('.readme-example-bar > span');
    if (label) label.textContent = 'Editable example';
    button.disabled = false;
    button.setAttribute('aria-disabled', 'false');
    button.title = 'Run with the browser compiler';
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      const runRevision = revision;
      button.disabled = true;
      button.textContent = 'Running…';
      example.setAttribute('aria-busy', 'true');
      clearScene();
      output.textContent = '';
      output.dataset.outputKind = 'stdout';
      try {
        const result = await runner.run(source.value);
        if (revision !== runRevision) return;
        output.textContent = result.output.stdout + (result.output.stderr ?? '');
        if (result.packets?.length) {
          await ensureInlineRenderer();
          if (revision === runRevision) dispose = mountRetainedSceneResult(workspace, result.packets);
        }
      } catch (error) {
        if (revision === runRevision) {
          output.dataset.outputKind = 'error';
          output.textContent = error.message;
        }
      } finally {
        busy = false;
        button.disabled = false;
        button.textContent = 'Run';
        example.removeAttribute('aria-busy');
      }
    });
  }
  window.addEventListener('pagehide', clearScene);
  refresh();
}
