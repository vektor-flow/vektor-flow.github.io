import {createInlineRunner} from './inline-runner.mjs';
import {ensureInlineRenderer,closeInlineMathLabels} from './inline-renderer-loader.mjs';
import {mountRetainedSceneResult} from './inline-retained-scene-view.mjs';
const source=document.querySelector('#source'),button=document.querySelector('#run'),status=document.querySelector('#status'),output=document.querySelector('#output');
const [text,configuration]=await Promise.all([fetch('./workflow-source/few-math-labels.vkf').then(r=>{if(!r.ok)throw Error('Source unavailable');return r.text();}),fetch('./current-compiler-release.json').then(r=>{if(!r.ok)throw Error('Compiler unavailable');return r.json();})]);
source.value=text;status.textContent='Ready';
const runner=createInlineRunner({moduleURL:configuration.package.module,wasmUrl:configuration.package.wasm,dataURL:configuration.package.data,expectedSourceBinding:configuration.frontend_binding,timeoutMs:360000});let dispose,busy=false,revision=0;
source.addEventListener('input',()=>{revision++;status.textContent='Source changed';});
button.addEventListener('click',async()=>{
 if(busy)return;busy=true;button.disabled=true;const current=revision;
 try{status.textContent='Running…';const result=await runner.run(source.value);await ensureInlineRenderer();dispose?.();await globalThis.VfDisplay?.joinNativeLabelCleanup?.();output.textContent='';if(current!==revision){status.textContent='Source changed';return;}dispose=mountRetainedSceneResult(output,result.packets);await dispose.presented;status.textContent=current===revision?'Rendered':'Source changed';}
 catch(error){status.textContent=error.message;}
 finally{busy=false;button.disabled=false;}
});
window.addEventListener('pagehide',()=>{void(async()=>{dispose?.();await globalThis.VfDisplay?.joinNativeLabelCleanup?.();await runner.dispose();await closeInlineMathLabels();})();});
