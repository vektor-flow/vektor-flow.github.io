import {highlightVkf} from './code-highlight.mjs?v=e04597c91a14531f';
const form = document.querySelector('#calculation');
const button = document.querySelector('#run');
const input = document.querySelector('#number');
const status = document.querySelector('#status');
button.disabled = true; button.setAttribute('aria-disabled', 'true');
status.textContent = 'This separate demo is not qualified for the current package.';
form.addEventListener('submit', event => event.preventDefault());
input.addEventListener('input', () => {
  document.querySelector('#result').textContent = '';
  const value = Number(input.value);
  if (Number.isFinite(value)) document.querySelector('#source code').innerHTML = highlightVkf(`square(x): x ^ 2\n\n:: square(${value})`);
});
