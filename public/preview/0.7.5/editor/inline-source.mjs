import {highlightVkf} from '../code-highlight.mjs?sha256=2c470e1811e017a0d6748fc183de7a320f74dce1adf8ee4cf1fbce3ae94bfebd';
const stylesheet = new URL('./inline-source.css',import.meta.url).href;
if (!document.querySelector(`link[href="${stylesheet}"]`)) {
  const link=document.createElement('link'); link.rel='stylesheet';link.href=stylesheet;document.head.append(link);
}

export function bindInlineSource(source, highlight, code) {
  source.readOnly=false;
  source.disabled=false;
  source.removeAttribute('readonly');
  source.setAttribute('wrap','off');
  source.setAttribute('autocapitalize','off');
  source.setAttribute('autocomplete','off');
  source.spellcheck=false;
  source.style.height=`${Math.min(420,Math.max(100,source.value.split('\n').length*24+32))}px`;
  const sync=()=>{
    highlight.style.width=`${source.clientWidth}px`;
    highlight.style.height=`${source.clientHeight}px`;
    highlight.scrollTop=source.scrollTop;
    highlight.scrollLeft=source.scrollLeft;
  };
  const refresh=()=>{code.innerHTML=highlightVkf(source.value+'\n');sync();};
  source.addEventListener('scroll',sync,{passive:true});
  const observer=new ResizeObserver(sync);observer.observe(source);
  document.fonts?.ready.then(sync);
  refresh();
  return {refresh,dispose(){observer.disconnect();source.removeEventListener('scroll',sync);}};
}

// Complete comparison programs use exactly the retained editor and runner.
// API signatures are explicitly reference listings and never submitted as code.
export function promoteVkfPrograms(root=document) {
  let sequence=0;
  for (const snippet of root.querySelectorAll('.code-snippet[data-language="vkf"]')) {
    if(snippet.closest('.readme-example'))continue;
    const original=snippet.querySelector('pre code');if(!original)continue;
    const sourceText=original.textContent;
    const example=document.createElement('section');example.className='readme-example';
    example.dataset.vkfExampleId=snippet.dataset.vkfExampleId??`comparison-${++sequence}`;
    example.dataset.verification='pending';
    example.innerHTML='<div class="readme-example-bar"><span>Editable example</span><button class="readme-example-play" type="button" disabled>Run</button></div><div class="readme-example-layout"><div class="readme-example-workspace"><div class="readme-example-editor"><pre class="readme-example-highlight" aria-hidden="true"><code class="language-vkf"></code></pre><textarea class="readme-example-source" spellcheck="false" wrap="off"></textarea></div><section class="readme-example-terminal" aria-label="Compiler console"><span>Console</span><pre class="readme-example-output" aria-live="polite"></pre></section></div></div>';
    const source=example.querySelector('textarea');source.defaultValue=sourceText;source.value=sourceText;
    source.setAttribute('aria-label','Editable VKF source: '+(snippet.parentElement.querySelector('h3')?.textContent??'comparison program'));
    snippet.replaceWith(example);
  }
}
