import {createInlineRunner} from './inline-runner.mjs?sha256=06bed72fad96cce356c12601548ef18a17f3e2e5675a677cea7abf9eca08b546';
import {ensureInlineRenderer} from './inline-renderer-loader.mjs?sha256=b6ad1f3939d5a8559d413e04b5b96adaf035de8ade92486fd71ed87cbd9d16e0';
import {mountRetainedSceneResult} from './inline-retained-scene-view.mjs';
import {restoreBrowserDrafts} from './vkf-browser-isolation.mjs';

// Per embed: the source field and these four output/control elements.
const source = document.querySelector('#embed-source');
const run = document.querySelector('#embed-run');
const viewport = document.querySelector('#embed-viewport');
const consoleOutput = document.querySelector('#embed-console');
const status = document.querySelector('#embed-status');
let runner, scene, active, revision = 0, closed = false;
const events = new AbortController();
const clearScene = () => { scene?.(); scene = undefined; };
const report = error => {
  consoleOutput.textContent += `${consoleOutput.textContent ? '\n' : ''}${error.message}`;
  status.textContent = 'Could not complete. See the console.';
};

// The included isolation helper can reload once on the first requested Run.
// Resume only that explicit request, with its exact restored source.
const requestKey = 'vkf-embedding-run:' + location.pathname;
let requested;
try {
  requested = JSON.parse(sessionStorage.getItem(requestKey) ?? 'null');
  sessionStorage.removeItem(requestKey);
} catch {}
if (crossOriginIsolated) restoreBrowserDrafts();

source.addEventListener('input', () => {
  revision++;
  active?.abort();
  clearScene();
  consoleOutput.textContent = '';
  status.textContent = 'Source changed. Run to update the result.';
}, {signal: events.signal});
viewport.addEventListener('vf-example-render-error', event => {
  clearScene();
  // During the first presentation the rejected promise reports this error.
  if (!active) report(new Error(event.detail.message));
}, {signal: events.signal});
run.addEventListener('click', async () => {
  if (!runner || active || closed) return;
  const controller = new AbortController();
  active = controller;
  const runRevision = revision, runSource = source.value;
  if (!crossOriginIsolated) {
    try { sessionStorage.setItem(requestKey,
      JSON.stringify({source: runSource, requestedAt: Date.now()})); } catch {}
  }
  run.disabled = true;
  clearScene();
  consoleOutput.textContent = '';
  status.textContent = 'Compiling and running…';
  try {
    viewport.hidden=false;
    const result = await runner.run(runSource, {signal: controller.signal,retained:{mountTarget:viewport}});
    if (closed || revision !== runRevision) {await result.liveRetained?.close();return;}
    consoleOutput.textContent = result.output.stdout + (result.output.stderr ?? '');
    if(result.liveRetained)scene=()=>{void result.liveRetained.close().catch(report);};
    if (result.packets?.length) {
      await ensureInlineRenderer();
      if (closed || revision !== runRevision) return;
      const mounted = mountRetainedSceneResult(viewport, result.packets, {sampleTemporal:result.temporal?elapsed=>runner.sample(elapsed,result.temporal.generation):undefined,disposeTemporal:result.temporal?()=>runner.disposeTemporal(result.temporal.generation):undefined});
      scene = mounted;
      // This resolves after real rendering and native scene labels are ready.
      // null means this mount was disposed before it presented.
      const presented = await mounted.presented;
      if (!presented || closed || revision !== runRevision) return;
    }
    status.textContent = 'Completed.';
  } catch (error) {
    if (!closed && revision === runRevision) { clearScene(); report(error); }
  } finally {
    if (crossOriginIsolated) { try { sessionStorage.removeItem(requestKey); } catch {} }
    active = undefined;
    run.disabled = closed || !runner;
  }
}, {signal: events.signal});

// Call the same cleanup when a client application removes this embed.
export async function close() {
  closed = true;
  revision++;
  active?.abort();
  events.abort();
  clearScene();
  run.disabled = true;
  await runner?.dispose();
}
window.addEventListener('pagehide', () => { void close(); }, {signal: events.signal});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

try {
  const response = await fetch(new URL('./current-compiler-release.json', import.meta.url), {cache: 'no-store'});
  if (!response.ok) throw new Error('The current compiler manifest is unavailable');
  const release = await response.json();
  const enabled = [release.current_distribution, release.site_review_iteration]
    .some(policy => policy?.enabled && policy.runEnabled);
  if (!enabled) throw new Error('This compiler is not enabled for browser examples');
  if (closed) throw new Error('This embed is closed');
  runner = createInlineRunner({
    moduleURL: release.package.module, wasmUrl: release.package.wasm,
    dataURL: release.package.data,
    expectedSourceBinding: release.browser_binding ?? release.compiler_source,
    timeoutMs: 360000,
  });
  run.disabled = false;
  status.textContent = 'Ready. Run the source to calculate and draw.';
  if (crossOriginIsolated && requested?.source === source.value &&
      Date.now() >= requested.requestedAt && Date.now() - requested.requestedAt < 60000) run.click();
} catch (error) { if (!closed) report(error); }
