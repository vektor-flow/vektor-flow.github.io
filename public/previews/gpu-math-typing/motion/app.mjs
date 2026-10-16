import {bytes,residentFields} from './field-assets.mjs';
import {MorphEngine} from './engine.mjs';
import {examples,splitSteps} from './examples.mjs?v=derivations-24';
import {buildScene,pair} from './scene.mjs';
const $=id=>document.getElementById(id),canvas=$('canvas'),local=['localhost','127.0.0.1'].includes(location.hostname);
const validation=local&&new URLSearchParams(location.search).has('validation');
const startup=performance.now();let fields;
const requested=new URLSearchParams(location.search).get('example');
let engine,data,selected=examples.find(e=>e.id===requested)??examples[0],position=0,revision=0,prepared='',pending=null,pumping=null,playing=false,raf=0,playStart=0,playOrigin=0,editing=null,draft=null,debounce=0,recording=null,downloadURL=null,dead=false;
const stats={frames:0,errors:[],software:false,ready:false,recordings:0};
window.mathMotion={stats,get engine(){return engine},get selected(){return selected},get position(){return position},seek:value=>seek(value),examples};
const say=s=>$('status').textContent=s;
function persisted(){try{const stored=JSON.parse(localStorage.getItem('cuvami-math-steps-v1')||'{}');for(const [id,edit] of Object.entries(stored).slice(0,40)){if(id.startsWith('custom-')&&!examples.some(x=>x.id===id)&&Array.isArray(edit)&&edit.length>0&&edit.length<=24&&edit.every(x=>typeof x==='string'&&x.length<12000))examples.push({id,title:'My calculation',group:'My calculations',steps:edit.map(math=>({math,note:'Saved on this device.',geometry:null}))});}for(const example of examples){const edit=stored[example.id];if(Array.isArray(edit)&&edit.length>0&&edit.length<=24&&edit.every(x=>typeof x==='string'&&x.length<12000))example.steps=edit.map(math=>({math,note:'Edited on this device.',geometry:null}));}}catch{}}
function saveEdits(){try{const saved=JSON.parse(localStorage.getItem('cuvami-math-steps-v1')||'{}');saved[selected.id]=selected.steps.map(x=>x.math);localStorage.setItem('cuvami-math-steps-v1',JSON.stringify(saved));}catch{say('Edits work now, but this browser could not save them.');}}
function options(){const menu=$('examples');menu.replaceChildren();const groups=new Map();for(const e of examples){if(!groups.has(e.group)){const group=document.createElement('optgroup');group.label=e.group;groups.set(e.group,group);menu.append(group);}const o=document.createElement('option');o.value=e.id;o.textContent=e.title;groups.get(e.group).append(o);}menu.value=selected.id;}
function controls(){const locked=!stats.ready||!!editing||!!recording||dead;for(const id of ['examples','paste','previous','next','edit','play','timeline'])$(id).disabled=locked;const canRecord=typeof MediaRecorder!=='undefined'&&typeof canvas.captureStream==='function';$('download').disabled=!stats.ready||!!editing||dead||!canRecord;$('download').textContent=recording?'Cancel download':'Download video';$('download').title=canRecord?'Record this calculation using the live GPU canvas':'This browser does not support canvas video recording';$('play').textContent=playing?'Pause':'Play';$('timeline').max=Math.max(0,selected.steps.length-1);$('previous').disabled=locked||position<=0;$('next').disabled=locked||position>=selected.steps.length-1;}
function viewport(){document.documentElement.style.setProperty('--height',(visualViewport?.height??innerHeight)+'px');}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);const w=Math.max(2,Math.round(r.width*dpr/2)*2),h=Math.max(2,Math.round(r.height*dpr/2)*2);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
function stop(){playing=false;cancelAnimationFrame(raf);controls();}
function fatal(error){dead=true;stats.errors.push(String(error.message??error));stop();if(recording)finishRecording(true);$('loading').hidden=false;$('loading').textContent='GPU playback stopped. '+String(error.message??error);say('Reload to try again. No CPU fallback was used.');controls();}
async function render(intent){
 const {pos,rev,example,preview}=intent;if(rev!==revision)return;
 resize();const steps=example.steps,n=steps.length,at=Math.min(n-1,Math.floor(pos)),next=Math.min(n-1,at+1),phase=pos-at;
 const key=rev+':'+at+':'+(preview?'draft':'main');
 if(prepared!==key){const a=buildScene(preview??steps[at],data),b=preview?a:buildScene(steps[next],data),packet=pair(a,b);await fields.ensure(packet.a,packet.b);await engine.generate(packet.a,packet.b,{grid:32,iterations:12});if(rev!==revision)return;prepared=key;stats.objects=[a.count,b.count];}
 await engine.draw(preview?0:phase,{measure:false});if(engine.errors.length)throw Error(engine.errors.at(-1));if(rev!==revision)return;
 stats.frames++;position=pos;$('timeline').value=pos;$('step-label').textContent=`Step ${at+1} of ${n}`;$('note').textContent=[selected.assumptions,steps[at].note||'Double-tap the expression to edit this step.'].filter(Boolean).join(' — ');$('counter').textContent=stats.objects.join(' → ')+' objects';controls();
}
function seek(pos,preview=null){if(!engine||dead)return Promise.resolve();const max=selected.steps.length-1;pending={pos:Math.max(0,Math.min(max,Number(pos)||0)),rev:revision,example:selected,preview};
 if(!pumping)pumping=(async()=>{try{while(pending){const intent=pending;pending=null;await render(intent);}}catch(e){fatal(e);}finally{pumping=null;}})();return pumping;
}
async function tick(now){if(!playing)return;const p=Math.min(selected.steps.length-1,playOrigin+(now-playStart)/1500);await seek(p);if(!playing)return;if(p>=selected.steps.length-1){stop();if(recording){await new Promise(r=>setTimeout(r,500));finishRecording(false);}return;}raf=requestAnimationFrame(tick);}
async function play(){if(playing){stop();return;}if(dead||editing||!engine)return;if(position>=selected.steps.length-1)await seek(0);if(selected.steps.length<2)return;playing=true;playOrigin=position;playStart=performance.now();controls();raf=requestAnimationFrame(tick);}
async function choose(id){stop();selected=examples.find(e=>e.id===id)??examples[0];revision++;prepared='';position=0;$('examples').value=selected.id;const source=selected.source;$('source').hidden=!source;if(source){$('source').href=source.url;$('source').textContent=source.title;$('source').title=source.note;}await seek(0);say(validation?'Software validation · not hardware performance':'Live GPU · double-tap to edit');controls();}
function openEditor(mode='step'){
 if(!stats.ready||dead||recording)return;stop();const at=Math.min(selected.steps.length-1,Math.round(position));editing={mode,at};draft=null;document.body.classList.add('editing');$('editor').hidden=false;$('editor-label').textContent=mode==='paste'?'Paste a calculation · one step per line':'Edit step '+(at+1)+' · rendered preview above';$('input').value=mode==='paste'?'':selected.steps[at].math;$('edit-error').textContent='';$('apply').disabled=mode==='paste';$('input').focus();parent.postMessage({type:'math-editing',editing:true},location.origin);controls();revision++;prepared='';seek(at);viewport();
}
async function previewInput(){
 if(!editing)return;const current=editing,source=$('input').value;try{
 const texts=current.mode==='paste'?splitSteps(source):[source.trim().replace(/^\$\$?|\$\$?$/g,'')];const steps=texts.map(math=>({math,note:'Edited on this device.',geometry:null}));for(const s of steps)buildScene(s,data);
 if(editing!==current||$('input').value!==source)return;draft=steps;$('apply').disabled=false;$('edit-error').textContent=current.mode==='paste'?`${steps.length} steps · previewing the first`:selected.steps[current.at].geometry?'Diagram is hidden for this edited step.':'';revision++;prepared='';await seek(current.at,steps[0]);
 }catch(e){draft=null;$('apply').disabled=true;$('edit-error').textContent=String(e.message??e);}
}
async function closeEditor(apply){clearTimeout(debounce);if(!editing)return;if(apply){await previewInput();if(!draft)return;if(editing.mode==='paste'){const example={id:'custom-'+Date.now(),title:'My calculation',group:'My calculations',steps:draft};examples.push(example);selected=example;position=0;options();}else{selected.steps[editing.at]=draft[0];position=editing.at;}saveEdits();}const restore=position;editing=null;draft=null;parent.postMessage({type:'math-editing',editing:false},location.origin);document.body.classList.remove('editing');$('editor').hidden=true;$('input').blur();revision++;prepared='';await choose(selected.id);await seek(restore);controls();viewport();}
function finishRecording(cancel){const r=recording;if(!r)return;r.cancel=cancel;stop();if(r.rec.state!=='inactive')r.rec.stop();}
async function download(){
 if(recording){finishRecording(true);return;}if(dead||editing)return;stop();await seek(0);if(dead)return;
 const mime=['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm;codecs=vp8','video/mp4','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime){say('Video recording is unavailable in this browser.');return;}
 try{const stream=canvas.captureStream(30),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000}),chunks=[];recording={rec,stream,cancel:false};const r=recording;rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onerror=()=>{r.cancel=true;if(rec.state!=='inactive')rec.stop();else{stream.getTracks().forEach(t=>t.stop());recording=null;controls();}say('The browser could not record this video.');};rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());recording=null;controls();if(r.cancel){say('Recording cancelled.');return;}const blob=new Blob(chunks,{type:rec.mimeType});if(!blob.size){say('The browser produced an empty recording.');return;}if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(blob);const a=$('save-video');a.href=downloadURL;a.download='cuvami-'+selected.id+(mime.includes('mp4')?'.mp4':'.webm');a.hidden=false;a.textContent='Save video';a.click();stats.recordings++;stats.lastRecording={bytes:blob.size,type:rec.mimeType};say('Video ready. Tap Save video if the download did not open.');};rec.start(250);controls();say('Recording on your GPU…');if(selected.steps.length===1){await new Promise(r=>setTimeout(r,1500));finishRecording(false);}else await play();
 }catch(e){recording?.stream.getTracks().forEach(t=>t.stop());recording=null;controls();say('Video recording failed: '+e.message);}
}
$('examples').onchange=()=>choose($('examples').value);$('play').onclick=play;$('previous').onclick=()=>{stop();seek(Math.max(0,Math.ceil(position)-1));};$('next').onclick=()=>{stop();seek(Math.min(selected.steps.length-1,Math.floor(position)+1));};$('timeline').oninput=()=>{stop();seek($('timeline').value);};$('edit').onclick=()=>openEditor();$('paste').onclick=()=>openEditor('paste');$('cancel').onclick=()=>closeEditor(false);$('apply').onclick=()=>closeEditor(true);$('input').oninput=()=>{clearTimeout(debounce);$('apply').disabled=true;debounce=setTimeout(previewInput,160);};$('download').onclick=download;$('stage').ondblclick=()=>openEditor();
let lastTap=-Infinity;$('stage').addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const now=performance.now();if(now-lastTap<320){lastTap=0;openEditor();}else lastTap=now;});
$('stage').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();openEditor();}if(e.key===' '){e.preventDefault();play();}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(recording)finishRecording(true);}});
window.addEventListener('pagehide',()=>{stop();if(recording)finishRecording(true);if(downloadURL)URL.revokeObjectURL(downloadURL);engine?.device.destroy();});
visualViewport?.addEventListener('resize',()=>{viewport();if(engine)seek(position,draft?.[0]);});window.addEventListener('resize',viewport);new ResizeObserver(()=>{if(engine&&!recording)seek(position,draft?.[0]);}).observe($('stage'));
viewport();persisted();options();
try{
 if(!navigator.gpu)throw Error('This browser does not provide WebGPU. Try a browser/device with WebGPU support.');
 const base=new URL('.',import.meta.url);
 const [mapping,shader]=await Promise.all([bytes(new URL('math-data.json.gz',base)).then(raw=>JSON.parse(new TextDecoder().decode(raw))),fetch(new URL('morph.wgsl',base)).then(r=>{if(!r.ok)throw Error('Shader could not load.');return r.text();})]);data=mapping;stats.assetReadyMs=performance.now()-startup;
 resize();engine=await MorphEngine.create(canvas,data,null,shader,{validation,timing:false});stats.software=engine.software;engine.onError=fatal;stats.gpuReadyMs=performance.now()-startup;fields=residentFields(engine.device,engine.atlas,data.atlasSize,base);stats.fields=fields.stats;

 for(const example of examples)for(const step of example.steps)buildScene(step,data);
 stats.ready=true;$('loading').hidden=true;await choose(selected.id);stats.firstFrameMs=performance.now()-startup;controls();
}catch(e){fatal(e);}

window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='math-import'||typeof e.data.source!=='string')return;openEditor('paste');$('input').value=e.data.source;await previewInput();if(draft)await closeEditor(true);});
parent.postMessage({type:'math-ready'},location.origin);
