// Native disclosure keeps the phone header in one row and its links reachable.
for (const menu of document.querySelectorAll('.site-menu')) {
  const compact = matchMedia('(max-width: 1024px)');
  const setMode = () => { menu.open = !compact.matches; };
  setMode();
  compact.addEventListener('change', setMode);
  document.addEventListener('click', event => {
    if (compact.matches && menu.open && !menu.contains(event.target)) menu.open = false;
  });
  menu.addEventListener('click', event => {
    if (compact.matches && event.target.closest('nav a')) menu.open = false;
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && compact.matches && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
}
// Extend the retained editor with a source-copy control; Run/highlighting stay in their original module.
function attachExampleCopy(example) {
  const bar=example.querySelector('.readme-example-bar');
  const source=example.querySelector('textarea');
  if (!bar || !source || bar.querySelector('.copy-button')) return;
  const copy=document.createElement('button');
  copy.type='button'; copy.className='copy-button'; copy.textContent='Copy';
  copy.setAttribute('aria-label','Copy VKF source');
  bar.insertBefore(copy,bar.querySelector('.readme-example-play'));
  const status=document.createElement('span');
  status.className='copy-status';
  status.setAttribute('role','status');
  status.setAttribute('aria-atomic','true');
  bar.appendChild(status);
  let resetFeedback;
  const feedback=(text,label,message)=>{
    copy.textContent=text;
    copy.setAttribute('aria-label',label);
    status.textContent=message;
  };
  copy.addEventListener('click',async()=>{
    clearTimeout(resetFeedback);
    status.textContent='';
    try {
      await navigator.clipboard.writeText(source.value);
      feedback('Copied','Copied VKF source','VKF source copied.');
    } catch {
      source.focus();source.select();
      feedback('Select source','Select VKF source','Copy unavailable. Source selected; use your device’s copy command.');
    }
    resetFeedback=setTimeout(()=>{
      copy.textContent='Copy';
      copy.setAttribute('aria-label','Copy VKF source');
    },1800);
  });
}

// Observe only editor DOM readiness. The documentation owner initializes itself.
for (const example of document.querySelectorAll('.readme-example')) attachExampleCopy(example);
const copyObserver=new MutationObserver(records=>{
  for (const record of records) for (const node of record.addedNodes) {
    if (node.nodeType!==1) continue;
    if (node.matches('.readme-example')) attachExampleCopy(node);
    for (const example of node.querySelectorAll('.readme-example')) attachExampleCopy(example);
  }
});
copyObserver.observe(document.querySelector('main')??document.body,{childList:true,subtree:true});
window.addEventListener('pagehide',()=>copyObserver.disconnect(),{once:true});
