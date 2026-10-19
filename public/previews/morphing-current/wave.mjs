import {TextWave,loadWaveAssets} from './wave-renderer.mjs?v=83e04fc6df3b';
const status=document.querySelector('#status');
const source=document.querySelector('#source');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const players=[];let revision=0;
try{
 const assets=await loadWaveAssets();
 for(const section of document.querySelectorAll('.demo')){
  const renderer=new TextWave(section.querySelector('canvas'),assets,section.dataset.mode);
  const player={section,renderer,time:section.querySelector('[data-time]'),k:section.querySelector('[data-k]'),velocity:section.querySelector('[data-velocity]'),overshoot:section.querySelector('[data-overshoot]'),growth:section.querySelector('[data-grow]'),play:section.querySelector('[data-play]'),loop:section.querySelector('[data-loop]'),position:reduced?1:0,running:!reduced,hold:0};players.push(player);
  player.draw=()=>{const timing=renderer.draw(player.position,Number(player.k.value),Number(player.velocity.value),player.growth.checked,Number(player.overshoot.value)/100);section.dataset.progress=player.position.toFixed(4);section.dataset.duration=timing.total;section.dataset.glyphs=renderer.count;section.querySelector('[data-duration]').value=Number.isFinite(timing.total)?`${timing.total.toFixed(2)} s`:'Held · v = 0';section.querySelector('[data-k-value]').value=Number(player.k.value).toFixed(1);section.querySelector('[data-velocity-value]').value=Number(player.velocity.value).toFixed(2);section.querySelector('[data-overshoot-value]').value=`${player.overshoot.value}%`;section.dataset.rampWidth=timing.width;section.dataset.front=player.position*timing.travel;section.dataset.lines=renderer.lineCount;player.time.value=player.position;player.play.textContent=player.running?'Pause':'Play';};
  player.time.addEventListener('input',()=>{player.position=Number(player.time.value);player.running=false;player.hold=0;player.draw();});
  player.overshoot.addEventListener('input',player.draw);player.k.addEventListener('input',player.draw);player.velocity.addEventListener('input',player.draw);player.growth.addEventListener('change',player.draw);
  player.play.addEventListener('click',()=>{if(!player.running&&player.position>=1)player.position=0;player.running=!player.running;player.hold=0;player.draw();});
  section.querySelector('[data-replay]').addEventListener('click',()=>{player.position=0;player.running=true;player.hold=0;player.draw();});
 }
 async function apply(){const token=++revision;status.textContent='Typesetting LaTeX…';status.dataset.error='false';try{await Promise.all(players.map(p=>p.renderer.layout(source.value)));if(token!==revision)return;for(const p of players){p.position=reduced?1:0;p.running=!reduced;p.hold=0;p.section.dataset.ready='true';p.draw();}status.textContent='';}catch(error){if(token!==revision)return;for(const p of players){p.position=0;p.running=false;p.draw();}status.textContent=error.message;status.dataset.error='true';}}
 document.querySelector('#apply').addEventListener('click',apply);
 await apply();
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='math-import'||typeof event.data.source!=='string')return;source.value=event.data.source;apply();});
 if(parent!==window)parent.postMessage({type:'math-ready'},location.origin);
 let last=performance.now();
 function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;for(const p of players){if(!p.running||Number(p.velocity.value)===0)continue;const timing=p.renderer.timing(Number(p.k.value),Number(p.velocity.value));if(p.position<1){p.position=Math.min(1,p.position+dt/timing.total);p.draw();}else if(p.loop.checked){p.hold+=dt;if(p.hold>1.1){p.position=0;p.hold=0;p.draw();}}else{p.running=false;p.draw();}}requestAnimationFrame(frame);}requestAnimationFrame(frame);
 let resizeTimer,lastWidth=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(!lastWidth){lastWidth=width;return;}if(Math.abs(width-lastWidth)<.5)return;lastWidth=width;clearTimeout(resizeTimer);resizeTimer=setTimeout(apply,100);}).observe(document.querySelector('main'));
 document.addEventListener('visibilitychange',()=>{last=performance.now();});
}catch(error){status.textContent=error.message;status.dataset.error='true';}
