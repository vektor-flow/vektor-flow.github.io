import {highlightVkf} from './code-highlight.mjs?v=e04597c91a14531f';
const message = "Run is disabled before release. The latest compiler is required before execution is enabled.";
for (const key of ['vkf-requested-run:', 'vkf-isolation-drafts:']) {
  sessionStorage.removeItem(key + location.pathname);
}
for (const example of document.querySelectorAll('.readme-example')) {
  const source = example.querySelector('textarea');
  const code = example.querySelector('.readme-example-highlight code');
  const button = example.querySelector('.readme-example-play');
  const output = example.querySelector('.readme-example-output');
  if (button) { button.disabled = true; button.setAttribute('aria-disabled', 'true'); button.title = message; }
  example.dataset.compilerStatus = 'disabled-before-release';
  if (!source || !code) continue;
  const refresh = () => { code.innerHTML = highlightVkf(source.value + '\n'); };
  source.style.height = `${Math.min(420, Math.max(100, source.value.split('\n').length * 24 + 32))}px`;
  source.addEventListener('input', () => {
    refresh();
    if (output) { output.textContent = ''; delete output.dataset.outputOrigin; }
    example.querySelector('[data-saved-visual]')?.remove();
  });
  source.addEventListener('scroll', () => {
    const pre = example.querySelector('.readme-example-highlight');
    pre.scrollTop = source.scrollTop; pre.scrollLeft = source.scrollLeft;
  });
  refresh();
}
