import './vendor/prism/prism-core-1.30.0.min.js';
import {registerVektorFlowPrism} from './editor/prism-vektorflow.mjs';
const Prism=globalThis.Prism;
registerVektorFlowPrism(Prism);
await Promise.all(['python','javascript','bash'].map(async name=>{
  // Vendored official grammars; no runtime network dependency.
  if(name==='javascript') await import('./vendor/prism/prism-clike.min.js');
  await import(`./vendor/prism/prism-${name}.min.js`);
}));
export function highlightVkf(source) { return Prism.highlight(source,Prism.languages.vkf,'vkf'); }
export function highlightDocument(root=document) {
 for(const code of root.querySelectorAll('code')) {
  if(code.closest('.readme-example-highlight')) continue;
  const language=code.dataset.language ?? code.closest('[data-language]')?.dataset.language ?? [...code.classList,...(code.parentElement?.classList??[])].map(c=>c.match(/^language-(.+)$/)?.[1]).find(Boolean) ?? 'vkf';
  code.classList.add(`language-${language}`);
  code.innerHTML=Prism.highlight(code.textContent,Prism.languages[language]??Prism.languages.vkf,language);
 }
}
if(typeof document!=='undefined') highlightDocument();
