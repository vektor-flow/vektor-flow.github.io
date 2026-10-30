// Keep editable sources and output together; only a reviewed package enables Run.
import {highlightVkf} from './code-highlight.mjs?v=26542dbe4b226163';
import {createInlineRunner} from './inline-runner.mjs?v=100ee98814b65a23';
import {mountRetainedSceneResult} from './inline-retained-scene-view.mjs';
import {ensureInlineRenderer} from './inline-renderer-loader.mjs';

const release = await fetch(new URL('./current-compiler-release.json', import.meta.url),
  {cache:'no-store'}).then(response => response.ok ? response.json() : null).catch(() => null);
const runner = ['verified-examples','private-candidate'].includes(release?.status)
  ? createInlineRunner({wasmUrl:release.package.wasm, moduleURL:release.package.module,
      dataURL:release.package.data, expectedSourceBinding:release.browser_binding??release.compiler_source, timeoutMs:360000}) : null;

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
  const resultContainer = example.querySelector('[data-example-result]') ?? workspace;
  const resultHint = example.querySelector('[data-result-hint]');
  if (output && source.value !== source.defaultValue) output.textContent = '';
  let revision = 0, busy = false, dispose;
  const clearScene = () => {
    dispose?.(); dispose = undefined;
    if (resultHint) resultHint.hidden = false;
  };

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
  if (ready && button && output && workspace) {
    example.dataset.compilerStatus = release.status==='private-candidate' ? 'private-candidate' : example.dataset.verification === 'pending'
      ? 'package-ready-example-unverified' : 'verified-examples';
    const label = example.querySelector('.readme-example-bar > span');
    if (label) label.textContent = release.status==='private-candidate' ? 'Candidate preview · verification in progress' : example.dataset.verification === 'pending'
      ? 'New example · interactive verification pending' : 'Editable example';
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
          if (revision === runRevision) {
            dispose = mountRetainedSceneResult(resultContainer, result.packets);
            if (resultHint) resultHint.hidden = true;
          }
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

window.addEventListener('pagehide',event=>{if(!event.persisted)void runner?.dispose();});
