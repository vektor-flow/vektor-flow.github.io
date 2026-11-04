import {prepareExamplePresentation} from './example-presentation.mjs?sha256=62262c9f4423fb27437c8849921220de64b9f9ecbaccef4cf07862a291c0777e';
import {bindInlineSource, promoteVkfPrograms} from './editor/inline-source.mjs?sha256=8c332ba7d810ee29ed480970742b1ae0b5567c17a1749a8793c40c3acdeb9d9a';
import {restoreBrowserDrafts} from './vkf-browser-isolation.mjs?sha256=07f4803c17a1a66b917223d146d868c415fcc3b864002557c1bfab65dec5d029';
// Keep editable sources and output together; only a reviewed package enables Run.
import {createInlineRunner} from './inline-runner.mjs?sha256=f6b1de2c154ff21be75835261bfaeaea5eb3d90abafecacef7c4a1d0a63960fd';
import {mountRetainedSceneResult} from './inline-retained-scene-view.mjs?sha256=43588bb9e9cc14190a85f6b51c6d1f252b965952af4fbdf7ebeb022b94f2adc6';
import {ensureInlineRenderer} from './inline-renderer-loader.mjs?sha256=79a84ff45f0dfa426cc7bb32c9b7bb0af2fd939db44114a43f3ea7852298d061';

const release = await fetch(new URL('./current-compiler-release.json', import.meta.url),
  {cache:'no-store'}).then(response => response.ok ? response.json() : null).catch(() => null);
const runner = ((release?.current_distribution?.enabled === true && release.current_distribution.runEnabled === true) || (release?.site_review_iteration?.enabled === true && release.site_review_iteration.runEnabled === true))
  ? createInlineRunner({wasmUrl:release.package.wasm, moduleURL:release.package.module,
      dataURL:release.package.data, expectedSourceBinding:release.browser_binding??release.compiler_source, timeoutMs:360000}) : null;

// Pages may reload once to establish shared memory. Restore drafts before a
// Run records its revision, so the first result cannot be mistaken for stale.
// Browsing uses source-bound saved output. Package preparation belongs to Run;
// createInlineRunner.run already performs its normal prewarm when requested.
const ready = Boolean(runner);
if (!ready) {
  const status=document.querySelector('#execution-status');
  if(status)status.textContent='The browser compiler is unavailable. You can still edit and copy the source.';
}
// Continue only a Run the reader explicitly requested before isolation reloaded
// this page. Ordinary browsing still never initializes the compiler.
const RUN_STATE = 'vkf-requested-run:' + location.pathname;
let requestedRun;
try {
  requestedRun = JSON.parse(sessionStorage.getItem(RUN_STATE) ?? 'null');
  sessionStorage.removeItem(RUN_STATE);
} catch {}
promoteVkfPrograms();
for (const example of document.querySelectorAll('.readme-example')) prepareExamplePresentation(example);
// Saved text retains its actual execution binding. Explicit accepted unchanged
// bindings reuse that proof only for an exact source hash; edited source clears it.
// A draft or edited source never inherits a historical successful console.
const consoleSeeds = await fetch(new URL('./example-output-seeds.json',import.meta.url),{cache:'no-store'})
  .then(r=>r.ok?r.json():{seeds:[]}).catch(()=>({seeds:[]}));
for (const example of document.querySelectorAll('.readme-example')) {
  const source=example.querySelector('textarea'),output=example.querySelector('.readme-example-output');
  if (!source || !output || source.value!==source.defaultValue) continue;
  const bytes=new TextEncoder().encode(source.value);
  const sourceHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const page=location.pathname.split('/').at(-1)||'index.html';
  const row=consoleSeeds.seeds.find(r=>r.page===page&&r.id===example.dataset.vkfExampleId&&r.source_sha256===sourceHash&&(r.compiler_binding===release?.browser_binding||r.accepted_current_bindings?.includes(release?.browser_binding)));
  if (row) {output.textContent=row.stdout;output.dataset.outputOrigin=row.compiler_binding===release?.browser_binding?'saved-current-compiler':'saved-accepted-unchanged-source';}
}
if (crossOriginIsolated) restoreBrowserDrafts();


for (const example of document.querySelectorAll('.readme-example')) {
  prepareExamplePresentation(example);
  const source = example.querySelector('.readme-example-source');
  const highlight = example.querySelector('.readme-example-highlight');
  const code = highlight?.querySelector('code');
  if (!source || !highlight || !code) continue;
  const button = example.querySelector('.readme-example-play');
  const output = example.querySelector('.readme-example-output');
  const workspace = example.querySelector('.readme-example-workspace');
  const resultContainer = example.querySelector('[data-example-result]') ?? workspace;
  const resultHint = example.querySelector('[data-result-hint]');
  const savedVisual = example.querySelector('[data-saved-visual]');
  if (output && source.value !== source.defaultValue) {
    output.textContent = '';
    savedVisual?.remove();
    delete output.dataset.outputOrigin;
  }
  let revision = 0, busy = false, dispose;
  const clearScene = (clearSaved = true) => {
    dispose?.(); dispose = undefined;
    if (clearSaved) savedVisual?.remove();
    if (resultHint) resultHint.hidden = false;
  };

  const editor = bindInlineSource(source, highlight, code);
  const refresh = editor.refresh;
  source.addEventListener('input', () => {
    revision++;
    clearScene();
    refresh();
    if (output) output.textContent = '';
    if (output) delete output.dataset.outputOrigin;
  });
  if (!ready && button) {
    example.dataset.compilerStatus='unavailable';
    button.title='The browser compiler is unavailable';
  }
  if (ready && button && output && workspace) {
    example.dataset.compilerStatus = release.status==='private-candidate' ? 'private-candidate' : example.dataset.verification === 'pending'
      ? 'package-ready-example-unverified' : 'verified-examples';
    const label = example.querySelector('.readme-example-bar > span');
    if (label) label.textContent = 'Editable example';
    button.disabled = false;
    button.setAttribute('aria-disabled', 'false');
    button.title = 'Run with the browser compiler';
    button.addEventListener('click', async () => {
      if (busy) return;
      if (!crossOriginIsolated && !sessionStorage.getItem(RUN_STATE)) {
        sessionStorage.setItem(RUN_STATE, JSON.stringify({
          id: example.dataset.vkfExampleId, source: source.value, requestedAt: Date.now()
        }));
      }
      busy = true;
      const runRevision = revision;
      button.disabled = true;
      button.textContent = 'Running…';
      example.setAttribute('aria-busy', 'true');
      clearScene();
      output.textContent = '';
      output.dataset.outputOrigin = 'run';
      output.dataset.outputKind = 'stdout';
      try {
        const runSource = source.value;
        const result = await runner.run(runSource);
        if (revision !== runRevision) return;
        output.textContent = result.output.stdout + (result.output.stderr ?? '');
        if (result.packets?.length) {
          await ensureInlineRenderer();
          if (revision === runRevision) {
            dispose = mountRetainedSceneResult(resultContainer, result.packets);
            example.dispatchEvent(new CustomEvent('vf-example-compiled', {detail:{source:source.value, result}}));
            await dispose.presented;
            if (resultHint) resultHint.hidden = true;
          }
        }
      } catch (error) {
        if (revision === runRevision) {
          output.dataset.outputKind = 'error';
          output.textContent = error.message;
        }
      } finally {
        // pagehide closes the old runner during the isolation reload. Keep the
        // explicit request until the isolated replacement page consumes it.
        if (crossOriginIsolated || !sessionStorage.getItem('vkf-isolation-drafts:' + location.pathname)) {
          sessionStorage.removeItem(RUN_STATE);
        }
        busy = false;
        button.disabled = false;
        button.textContent = 'Run';
        example.removeAttribute('aria-busy');
      }
    });
  }
  window.addEventListener('pagehide', event => { if (!event.persisted) editor.dispose(); clearScene(false); });
  refresh();
}

window.addEventListener('pagehide',event=>{if(!event.persisted)void runner?.dispose();});

if (ready && crossOriginIsolated && requestedRun &&
    Number.isFinite(requestedRun.requestedAt) &&
    Date.now() - requestedRun.requestedAt >= 0 &&
    Date.now() - requestedRun.requestedAt < 60000) {
  const example = [...document.querySelectorAll('.readme-example')].find(
    item => item.dataset.vkfExampleId === requestedRun.id);
  if (example?.querySelector('textarea')?.value === requestedRun.source) {
    // Isolation replaces the document. Keep the explicitly requested example
    // visible when its Run resumes inside an otherwise collapsed disclosure.
    for (let parent = example.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    example.querySelector('.readme-example-play')?.click();
  }
}
