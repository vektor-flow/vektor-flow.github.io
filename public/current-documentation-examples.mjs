// Preserve the original editor/console UI without loading an unverified compiler.
import {highlightVkf} from './editor/vkf-highlighter.mjs';

for (const example of document.querySelectorAll('.readme-example')) {
  const source = example.querySelector('.readme-example-source');
  const highlight = example.querySelector('.readme-example-highlight');
  const code = highlight?.querySelector('code');
  if (!source || !highlight || !code) continue;

  const refresh = () => {
    code.innerHTML = highlightVkf(source.value + '\n');
    highlight.scrollTop = source.scrollTop;
    highlight.scrollLeft = source.scrollLeft;
  };
  source.style.height = `${Math.min(420, Math.max(100, source.value.split('\n').length * 24 + 32))}px`;
  source.addEventListener('input', () => {
    refresh();
    const output = example.querySelector('.readme-example-output');
    if (output) output.textContent = '';
  });
  source.addEventListener('scroll', refresh);
  source.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    source.setRangeText('    ', source.selectionStart, source.selectionEnd, 'end');
    source.dispatchEvent(new Event('input', {bubbles:true}));
  });
  refresh();
}

// Run controls stay natively disabled. Enabling them requires an explicitly
// verified current compiler and its ordinary output/visualization integration.
