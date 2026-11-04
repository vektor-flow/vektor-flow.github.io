import './current-documentation-examples.mjs?sha256=d69afb5538eac61a2fdea2835c2f1ff272cd6c5904f6f2b6eed99d59cfb7c98b';
const form=document.querySelector('#calculation');
const input=document.querySelector('#number');
const example=document.querySelector('[data-vkf-example-id="embed-panel-area"]');
const source=example?.querySelector('textarea');
const button=document.querySelector('#run');
const status=document.querySelector('#status');
button.disabled=!source;
button.setAttribute('aria-disabled',String(!source));
form.addEventListener('submit',event=>{
  event.preventDefault();
  if (!form.reportValidity()) return;
  example?.querySelector('.readme-example-play')?.click();
});
input.addEventListener('input',()=>{
  if(!source || !input.validity.valid)return;
  const value=Number(input.value);
  if(!Number.isFinite(value)||value<0)return;
  const binding=/^side:\s*[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/m.exec(source.value);
  if(!binding){status.textContent='Edit the source below; the form updates its side binding when present.';return;}
  source.setRangeText(`side: ${value}`,binding.index,binding.index+binding[0].length,'preserve');
  source.dispatchEvent(new Event('input',{bubbles:true}));
});
status.textContent='The form updates the same editable source used by Run.';
