const groups = [...document.querySelectorAll('.reference-group')];
const input = document.querySelector('#reference-search');
const count = document.querySelector('[data-search-count]');
const originals = new Map(groups.map(group => [group, group.open]));
if (input) input.addEventListener('input', () => {
  const query = input.value.trim().toLocaleLowerCase();
  for (const group of groups) {
    const match = !query || group.textContent.toLocaleLowerCase().includes(query);
    group.hidden = !match;
    group.open = query ? match : originals.get(group);
  }
  if (count) count.textContent = query ? `${groups.filter(group => !group.hidden).length} of ${groups.length} groups` : `${groups.length} groups`;
});
document.querySelector('[data-expand-all]')?.addEventListener('click', () => {
  for (const group of groups) if (!group.hidden) group.open = true;
});
document.querySelector('[data-collapse-all]')?.addEventListener('click', () => {
  for (const group of groups) group.open = false;
});
function openAnchor() {
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
  if (!target) return;
  const group = target.closest('.reference-group');
  if (group) { group.hidden = false; group.open = true; }
  requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange', openAnchor);
if (location.hash) openAnchor();
for (const snippet of document.querySelectorAll('.code-snippet')) {
  const code = snippet.querySelector('pre');
  const button = snippet.querySelector('[data-copy]');
  button?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent); button.textContent = 'Copied'; }
    catch { button.textContent = 'Select text'; const range = document.createRange(); range.selectNodeContents(code); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); }
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  });
}
