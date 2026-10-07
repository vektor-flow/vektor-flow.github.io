const SW=new URL('./vkf-coep-sw.js',import.meta.url);
const STATE='vkf-isolation-drafts:'+location.pathname;
let pending;
function restoreDrafts(){
  const saved=sessionStorage.getItem(STATE);if(!saved)return;
  sessionStorage.removeItem(STATE);
  try{const fields=document.querySelectorAll('textarea,[contenteditable="true"]');for(const [index,text]of JSON.parse(saved)){const field=fields[index];if(!field)continue;if(field instanceof HTMLTextAreaElement)field.value=text;else field.textContent=text;field.dispatchEvent(new Event('input',{bubbles:true}));}}catch{}
}
export function ensureBrowserIsolation(){
  if(pending)return pending;
  pending=(async()=>{
    if(crossOriginIsolated&&typeof SharedArrayBuffer==='function'){restoreDrafts();return;}
    if(sessionStorage.getItem(STATE)){restoreDrafts();throw new Error('This browser did not enable isolated shared memory');}
    if(!isSecureContext||!navigator.serviceWorker)throw new Error('Concurrent programs require a secure isolated browser context');
    await navigator.serviceWorker.register(SW,{scope:new URL('./',SW).pathname});
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Browser isolation startup timed out')),15000);
      navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve();},{once:true});
    });
    const fields=Array.from(document.querySelectorAll('textarea,[contenteditable="true"]'));
    sessionStorage.setItem(STATE,JSON.stringify(fields.map((field,index)=>[index,field instanceof HTMLTextAreaElement?field.value:field.textContent])));
    location.reload();
    await new Promise(()=>{});
  })();
  return pending;
}
