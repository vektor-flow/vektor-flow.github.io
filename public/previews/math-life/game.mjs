import {loadPackagedSymbolicKernel} from '../../vf-ui/vf-symbolic-kernel-runtime.mjs';
import {createRules} from './rules.mjs?v=560ae2d667d2';
import {WorldRenderer,loadAssets} from './renderer.mjs?v=f1a9b3c604f1';
import {Contacts} from './contacts.mjs?v=c4651764fc54';
const world=document.querySelector('#world'),objectsElement=document.querySelector('#objects'),message=document.querySelector('#message'),loading=document.querySelector('#loading'),celebration=document.querySelector('#celebration');
const spawnButtons=[...document.querySelectorAll('[data-spawn]')],again=document.querySelector('#again');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let width=world.clientWidth,height=world.clientHeight,serial=0,drag=null,selected=null,won=false;
const objects=new Map();
function say(text,tone=''){message.textContent=text;message.dataset.tone=tone;}
try{
 const[kernel,assets]=await Promise.all([loadPackagedSymbolicKernel(),loadAssets()]);
 const rules=createRules(kernel),renderer=new WorldRenderer(document.querySelector('#view'),assets,rules);
 const presets={one:()=>rules.operation('add',1),two:()=>rules.operation('add',2),times:()=>rules.operation('multiply',2),divide:()=>rules.operation('divide',2),root:()=>rules.operation('root'),negative:()=>rules.operation('add',-1)};
 function radius(){return width<600?31:43;}
 function add(spec,x,y,seed=false){const id=++serial,r=seed?radius()*1.25:radius(),o={...spec,id,seed,r,x,y,vx:(Math.random()-.5)*9,vy:(Math.random()-.5)*9,highlight:0};
  contacts.constrain(o);const button=document.createElement('button');button.className='object';button.type='button';button.dataset.id=id;button.setAttribute('aria-label',(o.kind==='number'?'Value ':'Operation ')+rules.label(o)+(seed?', your organism':''));button.dataset.kind=o.kind;button.dataset.value=o.value;button.dataset.op=o.op??'';button.title=rules.label(o);o.element=button;objects.set(id,o);objectsElement.append(button);return o;
 }
 function remove(o){objects.delete(o.id);o.element.remove();if(selected===o.id)selected=null;}
 function outcome(a,b){try{return rules.combine(a,b);}catch{return{ok:false,reason:'These objects cannot combine. Try another pair.'};}}
 function bounce(a,b,result,now){a.reject=b.reject=now+300;if(now-(a.lastBounce??-Infinity)>700){say(result.reason,'reject');a.lastBounce=b.lastBounce=now;}if(selected===a.id||selected===b.id)selected=null;}
 function merge(a,b,result,now){const seed=a.seed||b.seed,x=seed?(a.seed?a.x:b.x):(a.x+b.x)/2,y=seed?(a.seed?a.y:b.y):(a.y+b.y)/2,vx=(a.vx+b.vx)/2,vy=(a.vy+b.vy)/2,held=drag&&(drag.id===a.id||drag.id===b.id);remove(a);remove(b);
  if(result.result){const o=add(result.result,x,y,seed);o.vx=vx;o.vy=vy;o.born=now;o.textScale=.55;if(held){drag.id=o.id;drag.offsetX=drag.pointerX-o.x;drag.offsetY=drag.pointerY-o.y;}if(seed&&o.value===12&&!won){won=true;celebration.hidden=false;again.focus();}}
  else if(held){const pointer=drag.pointer;drag=null;if(world.hasPointerCapture(pointer))world.releasePointerCapture(pointer);}
  say(result.equation,'success');
 }
 const contacts=new Contacts(objects,{combine:outcome,merge,bounce});contacts.resize(width,height);
 function present(now){for(const o of objects.values()){o.highlight=selected===o.id||drag?.id===o.id?1:0;if(o.reject&&now>o.reject)o.reject=false;if(o.born){const q=Math.min(1,(now-o.born)/(reduced?120:350));o.textScale=.55+.45*(1-(1-q)**3);if(q===1)o.born=null;}o.element.style.transform=`translate(${o.x-o.r}px,${o.y-o.r}px)`;o.element.style.width=o.element.style.height=`${o.r*2}px`;o.element.setAttribute('aria-pressed',String(selected===o.id));}
  world.dataset.overlaps=String(contacts.overlaps().length);renderer.frame([...objects.values()],width,height,now/1000);
 }
 function reset(){if(drag&&world.hasPointerCapture(drag.pointer))world.releasePointerCapture(drag.pointer);drag=null;selected=null;won=false;celebration.hidden=true;for(const o of objects.values())o.element.remove();objects.clear();
  const specs=[{...rules.number(0),seed:true},rules.operation('add',1),rules.operation('add',2),rules.operation('multiply',2),rules.operation('divide',2),rules.operation('root'),rules.number(3),rules.number(4),rules.operation('add',-1)];
  const places=width<600?[[.5,.48],[.2,.18],[.5,.15],[.8,.2],[.2,.48],[.8,.48],[.2,.78],[.5,.8],[.8,.77]]:[[.46,.5],[.14,.25],[.37,.2],[.65,.22],[.85,.47],[.68,.76],[.18,.73],[.42,.8],[.86,.77]];
  specs.forEach((s,i)=>add(s,width*places[i][0],height*places[i][1],s.seed));contacts.resolve(performance.now());say('Touch another object: merge if it fits, bounce if it does not.');world.dataset.ready='true';present(performance.now());
 }
 function pair(o){if(!celebration.hidden)return;if(selected&&selected!==o.id){const a=objects.get(selected),result=outcome(a,o);if(result.ok)merge(a,o,result,performance.now());else{bounce(a,o,result,performance.now());a.vx-=12;o.vx+=12;}selected=null;contacts.resolve(performance.now());present(performance.now());return;}selected=selected===o.id?null:o.id;say(selected?`${rules.label(o)} is selected. Tap another object.`:'Drag objects into contact.');}
 world.addEventListener('pointerdown',event=>{const element=event.target.closest('.object');if(!element||!celebration.hidden)return;const o=objects.get(Number(element.dataset.id));if(!o)return;const rect=world.getBoundingClientRect(),pointerX=event.clientX-rect.left,pointerY=event.clientY-rect.top;drag={id:o.id,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,pointerX,pointerY,offsetX:pointerX-o.x,offsetY:pointerY-o.y,distance:0};world.setPointerCapture(event.pointerId);o.vx=o.vy=0;event.preventDefault();});
 world.addEventListener('pointermove',event=>{if(!drag||drag.pointer!==event.pointerId)return;const rect=world.getBoundingClientRect();drag.pointerX=event.clientX-rect.left;drag.pointerY=event.clientY-rect.top;drag.distance=Math.max(drag.distance,Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY));if(drag.distance<5)return;contacts.move(drag.id,drag.pointerX-drag.offsetX,drag.pointerY-drag.offsetY,performance.now());present(performance.now());});
 function release(event,cancel=false){if(!drag||drag.pointer!==event.pointerId)return;const held=drag;drag=null;if(world.hasPointerCapture(event.pointerId))world.releasePointerCapture(event.pointerId);const o=objects.get(held.id);if(o){o.vx=o.vy=0;if(!cancel&&held.distance<5)pair(o);}contacts.resolve(performance.now());present(performance.now());}
 world.addEventListener('pointerup',event=>release(event));world.addEventListener('pointercancel',event=>release(event,true));world.addEventListener('lostpointercapture',event=>release(event,true));objectsElement.addEventListener('click',event=>{if(event.detail!==0)return;const o=objects.get(Number(event.target.closest('.object')?.dataset.id));if(o)pair(o);});
 function spawnPosition(){let best=null,score=-Infinity;for(let row=0;row<7;row++)for(let col=0;col<7;col++){const p={x:radius()+12+(width-2*radius()-24)*col/6,y:radius()+12+(height-2*radius()-50)*row/6};let clearance=Infinity;for(const o of objects.values())clearance=Math.min(clearance,Math.hypot(p.x-o.x,p.y-o.y)-o.r-radius());if(clearance>score){best=p;score=clearance;}}return score>=contacts.gap+1?best:null;}
 for(const button of spawnButtons)button.addEventListener('click',()=>{if(!celebration.hidden)return;const p=spawnPosition();if(objects.size>=24||!p){say('No room yet. Merge two objects to make space.');return;}add(presets[button.dataset.spawn](),p.x,p.y);contacts.resolve(performance.now());present(performance.now());});
 document.querySelector('#reset').addEventListener('click',reset);again.addEventListener('click',()=>{celebration.hidden=true;say('Keep growing. What else can you become?','success');});
 new ResizeObserver(()=>{const oldW=width,oldH=height;width=world.clientWidth;height=world.clientHeight;contacts.resize(width,height);for(const o of objects.values()){o.x*=width/oldW;o.y*=height/oldH;}contacts.resolve(performance.now());present(performance.now());}).observe(world);
 let last=performance.now();function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;for(const o of objects.values()){if(drag?.id===o.id||selected===o.id||!celebration.hidden)continue;if(!reduced){o.vx+=(Math.random()-.5)*5*dt;o.vy+=(Math.random()-.5)*5*dt;o.vx*=Math.exp(-.2*dt);o.vy*=Math.exp(-.2*dt);o.x+=o.vx*dt;o.y+=o.vy*dt;}if(o.x<o.r+8||o.x>width-o.r-8)o.vx*=-1;if(o.y<o.r+8||o.y>height-o.r-30)o.vy*=-1;}if(celebration.hidden)contacts.resolve(now);present(now);requestAnimationFrame(frame);}
 reset();loading.hidden=true;requestAnimationFrame(frame);document.addEventListener('visibilitychange',()=>last=performance.now());
}catch(error){loading.textContent='This world could not open. '+error.message;loading.dataset.error='true';console.error(error);}
