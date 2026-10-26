// Extend the retained editor with a source-copy control; Run/highlighting stay in their original module.
for (const example of document.querySelectorAll('.readme-example')) {
  const bar=example.querySelector('.readme-example-bar');
  const source=example.querySelector('textarea');
  if (!bar || !source) continue;
  const copy=document.createElement('button');
  copy.type='button'; copy.className='copy-button'; copy.textContent='Copy';
  copy.setAttribute('aria-label','Copy VKF source');
  bar.insertBefore(copy,bar.querySelector('.readme-example-play'));
  copy.addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(source.value);copy.textContent='Copied';}
    catch {source.focus();source.select();copy.textContent='Select source';}
    setTimeout(()=>{copy.textContent='Copy';},1800);
  });
}
