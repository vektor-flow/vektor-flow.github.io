import {ensureInlineRenderer} from './inline-renderer-loader.mjs?sha256=e01af63580a929257c906f4c177f146231d7be4f1a38342cf99188d64450b62c';
import {mountRetainedSceneResult} from './inline-retained-scene-view.mjs?sha256=fc8a280e71523744c6e437b609aca095a7639a5a2f10eccf4808724af3039221';

const presentations = new WeakMap();
const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
  .map(value=>value.toString(16).padStart(2,'0')).join('');
let sceneSeeds;
const seeds = () => sceneSeeds ??= fetch(new URL('./example-scene-seeds.json',import.meta.url),{cache:'no-store'})
  .then(response=>response.ok ? response.json() : {schema:1,examples:[]});

// This rearranges existing nodes; explanation, executable source and console
// bytes remain authored content. The runner always receives a dedicated mount.
export function prepareExamplePresentation(example) {
  if (presentations.has(example)) return presentations.get(example);
  const source = example.querySelector('.readme-example-source');
  const workspace = example.querySelector('.readme-example-workspace');
  const layout = example.querySelector('.readme-example-layout');
  if (!source || !workspace || !layout) return null;
  const explanation = document.createElement('div');
  explanation.className = 'readme-example-explanation';
  for (const previous of example.querySelectorAll('.readme-example-result')) {
    previous.removeAttribute('data-example-result');
    for (const hint of previous.querySelectorAll('[data-result-hint]')) hint.removeAttribute('data-result-hint');
    while (previous.firstChild) explanation.append(previous.firstChild);
    previous.remove();
  }
  const legacyImages = [...example.querySelectorAll('[data-saved-visual]')];
  const hadVisual = legacyImages.length > 0 || explanation.childNodes.length > 0;
  legacyImages.forEach(image=>image.remove());
  const viewport = document.createElement('section');
  viewport.className = 'readme-example-viewport';
  viewport.dataset.exampleResult = '';
  viewport.setAttribute('aria-label','Interactive plot viewport');
  viewport.hidden = !hadVisual;
  const hint = document.createElement('p');
  hint.className = 'readme-example-viewport-hint';
  hint.dataset.resultHint = '';
  hint.textContent = 'Run to draw this example.';
  viewport.append(hint);
  const terminals = [...workspace.querySelectorAll('.readme-example-terminal')];
  for (const terminal of terminals) terminal.setAttribute('aria-label','Text console');
  layout.replaceChildren(explanation,workspace,viewport,...terminals);
  example.dataset.vkfPresentation = 'stacked';
  let savedDispose, generation = 0, closed = false;
  const clearSaved = () => {
    generation++;
    savedDispose?.(); savedDispose = undefined;
    viewport.removeAttribute('data-scene-origin');
    hint.hidden = false;
  };
  source.addEventListener('input',clearSaved);
  example.querySelector('.readme-example-play')?.addEventListener('click',clearSaved,{capture:true});
  example.addEventListener('vf-example-render-error',event=>{
    const output = example.querySelector('.readme-example-output');
    if (output) {output.dataset.outputKind='error';output.textContent=event.detail.message;}
    hint.hidden = false;
    hint.textContent = 'The plot could not be rendered. See the text console.';
  });
  const presentation = {viewport,clearSaved,close(){closed=true;clearSaved();}};
  presentations.set(example,presentation);

  // Default plots are source/compiler-bound engine packets, never screenshots.
  // No compiler initialization/Run occurs while merely reading a page.
  const token = generation;
  void (async()=>{
    if (source.value !== source.defaultValue) return;
    const manifest = await seeds();
    if (manifest.schema !== 1) throw new Error('Unsupported saved scene manifest');
    const row = manifest.examples.find(row=>row.page===location.pathname.split('/').at(-1) &&
      row.id===example.dataset.vkfExampleId) ?? manifest.examples.find(row=>
      row.page==='index.html' && location.pathname.endsWith('/') && row.id===example.dataset.vkfExampleId);
    if (!row) return;
    const sourceHash = await digest(new TextEncoder().encode(source.value));
    const release = await fetch(new URL('./current-compiler-release.json',import.meta.url),{cache:'no-store'}).then(r=>r.json());
    if (row.source_sha256 !== sourceHash || (row.compiler_binding !== release.browser_binding && !row.accepted_current_bindings?.includes(release.browser_binding))) return;
    const packets = await Promise.all(row.packets.map(async descriptor=>{
      const url = new URL(descriptor.url,import.meta.url);
      if (url.origin !== location.origin) throw new Error('Saved scene must be local');
      const response = await fetch(url,{cache:'no-store'});
      if (!response.ok) throw new Error('Saved scene bytes unavailable');
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength!==descriptor.bytes || await digest(bytes)!==descriptor.sha256)
        throw new Error('Saved scene bytes changed');
      return {...descriptor.packet,arena:new Uint8Array(bytes)};
    }));
    if (closed || token!==generation || source.value!==source.defaultValue) return;
    await ensureInlineRenderer();
    if (closed || token!==generation || source.value!==source.defaultValue) return;
    savedDispose = mountRetainedSceneResult(viewport,packets);
    viewport.dataset.sceneOrigin='saved-engine-packets';
    hint.hidden=true;
    await savedDispose.presented;
  })().catch(error=>{
    if (!closed && token===generation) example.dispatchEvent(new CustomEvent('vf-example-render-error',
      {detail:{message:error.message}}));
  });
  return presentation;
}

window.addEventListener('pagehide',()=>{
  for (const example of document.querySelectorAll('.readme-example')) presentations.get(example)?.clearSaved();
});
