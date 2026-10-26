// Extend the retained editor with a source-copy control; Run/highlighting stay in their original module.
for (const example of document.querySelectorAll('.readme-example')) {
  const bar=example.querySelector('.readme-example-bar');
  const source=example.querySelector('textarea');
  if (!bar || !source) continue;
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
