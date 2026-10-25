const input=document.getElementById('document'),key='vkf-math-document-v1';
try{const saved=sessionStorage.getItem(key);if(saved)input.value=saved;}catch{}
input.addEventListener('input',()=>{try{sessionStorage.setItem(key,input.value);}catch{}});
window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='math-import'||typeof e.data.source!=='string')return;input.value=e.data.source;try{sessionStorage.setItem(key,input.value);}catch{}document.getElementById('render').click();});
document.getElementById('morph-steps').onclick=()=>{parent.postMessage({type:'math-morph',source:input.value},location.origin);document.getElementById('navigation').open=false;};
const timer=setInterval(()=>{if(window.documentReady||window.documentInitError){clearInterval(timer);parent.postMessage({type:'math-ready'},location.origin);}},100);
window.addEventListener('pagehide',()=>clearInterval(timer));

window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='math-get-source')parent.postMessage({type:'math-morph',source:input.value},location.origin);});
