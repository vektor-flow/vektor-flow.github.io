import { mountRetainedSceneResult } from './inline-retained-scene-view.mjs';
let dispose;
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'platonic-vkf-render') return;
  try {
    document.documentElement.dataset.theme = event.data.theme === 'light' ? 'light' : 'dark';
    dispose?.();
    const view = document.getElementById('view');
    view.replaceChildren();
    dispose = undefined;
    if (Array.isArray(event.data.packets) && event.data.packets.length === 0) return;
    dispose = mountRetainedSceneResult(view, event.data.packets, {
      VfFrame: { mount: (container, options) => VfFrame.mount(container, { ...options, toolbar: 'top' }) }
    });
  } catch (error) { parent.postMessage({ type: 'platonic-vkf-view-error', error: error.message }, location.origin); }
});
window.addEventListener('pagehide', () => dispose?.());
parent.postMessage({ type: 'platonic-vkf-view-ready' }, location.origin);
