import {createStateInterpolationGpu} from './native-labels/vf-state-interpolation-gpu.mjs';
import {createScreenSpaceSimplexRenderer} from './geom/vf-screen-simplex-renderer.mjs';
import {createTiledNativeLabelRenderer} from './native-labels/vf-native-tiled-label-renderer.mjs';
const need=(v,c)=>{if(!v)throw Object.assign(Error(c),{code:c});};
const compose=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const visible=m=>Array.from(m.vertices).some((v,i)=>i%10===9&&v>0);
/** Marshal original evaluated channels into the native state library. There is
 * no numerical interpolation, source parsing or geometry reconstruction here.
 */
export function retainedSceneChannels(from,to){
 const first=from.meshes.filter(visible),last=to.meshes.filter(visible),start=[],finish=[],bindings=[];
 need(first.length===last.length,'VKF transition requires corresponding authored layers');
 const source=new Map(first.map(m=>[m.id,m]));
 for(const mesh of last){
  const prior=source.get(mesh.id);
  need(mesh.id!==undefined&&prior&&!mesh.mode3d&&!prior.mode3d&&mesh.topology===prior.topology&&mesh.vertices.length===prior.vertices.length&&JSON.stringify(Array.from(mesh.indices))===JSON.stringify(Array.from(prior.indices)),'VKF transition requires stable layer IDs and corresponding topology');
  const push=(a,b,set)=>{need(a.length===b.length&&a.every(Number.isFinite)&&b.every(Number.isFinite),'VKF state channel dimensions');const indices=a.flatMap((v,i)=>v===b[i]?[]:[i]);if(!indices.length)return;const offset=start.length;start.push(...indices.map(i=>a[i]));finish.push(...indices.map(i=>b[i]));bindings.push({offset,length:indices.length,set(scene,values){const all=[...a];indices.forEach((i,j)=>all[i]=values[j]);set(scene,all);}});};
  push(Array.from(prior.vertices),Array.from(mesh.vertices),(scene,v)=>{scene.meshes.find(m=>m.id===mesh.id).vertices=new Float32Array(v);});
  if(typeof prior.edge_width==='number'&&typeof mesh.edge_width==='number')push([prior.edge_width],[mesh.edge_width],(scene,v)=>{scene.meshes.find(m=>m.id===mesh.id).edge_width=v[0];});
  for(const key of ['x_min','x_max','y_min','y_max'])if(Number.isFinite(prior.axis_ticks?.[key])&&Number.isFinite(mesh.axis_ticks?.[key]))push([prior.axis_ticks[key]],[mesh.axis_ticks[key]],(scene,v)=>{scene.meshes.find(m=>m.id===mesh.id).axis_ticks[key]=v[0];});
 }
 return {start,finish,scene(values){need(values.length===start.length,'Native state sample width changed');const scene=structuredClone(to);scene.texts=[];scene.meshes=scene.meshes.filter(visible);for(const b of bindings)b.set(scene,values.slice(b.offset,b.offset+b.length));return scene;}};
}
let next=0;
export async function prepareRetainedViewTransition({container,fromPackets,toPackets,fromFrameIds,toFrameIds,fromSources,toSources,axisVisible=false,VfDisplay=globalThis.VfDisplay,VfFrame=globalThis.VfFrame,WorkerClass=globalThis.Worker,signal}={}){
 need(fromPackets?.length===1&&toPackets?.length===1,'VKF state transition currently requires one panel in each authored view');
 const from=Object.values(VfDisplay.materializeRetainedSceneArena(fromPackets[0]).geom)[0],to=Object.values(VfDisplay.materializeRetainedSceneArena(toPackets[0]).geom)[0];
 const ownedLabels=(scene,id)=>{const ids=new Set((scene.texts||[]).map((t,i)=>String(t.id??'native-text-'+i)));return VfDisplay.nativeLabelFrameSources(id).filter(s=>ids.has(s.provenance.elementId));};
 const channels=retainedSceneChannels(from,to),worker=new WorkerClass(new URL('./native-labels/vf-state-interpolation-worker.mjs',import.meta.url),{type:'module'}),pending=new Map();let sequence=0,closed=false,frame,renderer,gpu,device;const gpuPlans=new Map(),fieldRenderers=[],fieldCanvases=[];let frameBuffers,front=0;
 const request=(type,data,timeoutMs=30000)=>new Promise((resolve,reject)=>{need(!closed,'VKF transition is closed');const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('VKF state interpolation exceeded its execution limit'));close();},timeoutMs);pending.set(id,{resolve,reject,timer});worker.postMessage({id,type,...data});});
 worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;clearTimeout(p.timer);pending.delete(data.id);data.status==='ok'?p.resolve(data):p.reject(Error(data.error));};
 worker.onerror=e=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error(e.message));}pending.clear();close();};
 function close(){if(closed)return;closed=true;signal?.removeEventListener('abort',close);for(const p of pending.values()){clearTimeout(p.timer);p.reject(new DOMException('Cancelled','AbortError'));}pending.clear();worker.terminate();renderer?.destroy();fieldRenderers.forEach(r=>r.destroy());gpu?.close();device?.destroy();if(frame){VfDisplay.disposeGeomFrame(frame.id??frame.root.getAttribute('data-vf-frame-id'));frame.destroy?.();frame.root.remove();}}
 signal?.addEventListener('abort',close,{once:true});
 try{
  const prepared=await request('initialize',{from:fromSources??ownedLabels(from,fromFrameIds[0]),to:toSources??ownedLabels(to,toFrameIds[0]),start:channels.start,finish:channels.finish});
  if(signal?.aborted){close();throw new DOMException('Cancelled','AbortError');}
  const id='vkf-state-view-'+ ++next;frame=VfFrame.mount(container,{id,containerKind:'viewport',title:to.title??'',frameless:true,draggable:false,dockable:false,resizable:false,closable:false,alpha:1,toolbar:to.toolbar??null});Object.assign(frame.root.style,{position:'absolute',inset:'0',width:'100%',height:'100%',background:'#fff',zIndex:'2',opacity:'0'});
  frame.body.classList.add('vf-frame__body--transparent');
  if(prepared.gpuPlans.length){
   need(globalThis.navigator?.gpu,'VKF signed-field state interpolation requires WebGPU');
   const adapter=await navigator.gpu.requestAdapter();need(adapter,'VKF could not obtain a GPU adapter for state interpolation');device=await adapter.requestDevice();
   gpu=await createStateInterpolationGpu({device,libraryCommit:prepared.libraryCommit});const measures=[];
   for(const description of prepared.gpuPlans){const plan=await gpu.createPlan(description);gpuPlans.set(plan.id,plan);const endpoints=[];for(const coordinate of [0,1]){const {params}=await request('gpu-controls',{planId:plan.id,coordinate});endpoints.push(await plan.measureEndpoint(params));}measures.push({id:plan.id,values:endpoints});}
   await request('gpu-measures',{measures});
   frameBuffers=gpu.allocateFrameBuffers(prepared.gpuPlans.length*128*128*12);
   for(let i=0;i<2;i++){const canvas=container.ownerDocument.createElement('canvas');canvas.className='vf-native-state-field-canvas';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;visibility:hidden';frame.body.append(canvas);const r=createScreenSpaceSimplexRenderer(canvas,{device});need(await r.initialize()==='webgpu','VKF resident state fields require the WebGPU renderer');fieldCanvases.push(canvas);fieldRenderers.push(r);}
  }
  const canvas=container.ownerDocument.createElement('canvas');canvas.className='vf-native-state-canvas';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';frame.body.append(canvas);
  renderer=createTiledNativeLabelRenderer(canvas,{pixelRatio:()=>globalThis.devicePixelRatio||1,nativeAccuracy:'required',samplesPerAxis:4});await renderer.initialize();
  return {element:frame.root,libraryCommit:prepared.libraryCommit,cohorts:prepared.cohorts,async sample(q){
   const state=await request('sample',{coordinate:q});if(closed)return false;
   const scene=channels.scene(state.values);scene.frame=id;for(const m of scene.meshes)if(m.axis_ticks)m.axis_ticks.enabled=axisVisible;
   const width=Math.round(frame.body.clientWidth),height=Math.round(frame.body.clientHeight),fields=state.sources.filter(s=>s.gpuFieldId);
   let candidate,fieldReceipts=[];
   if(gpu){const samples=await Promise.all(fields.map(source=>gpuPlans.get(source.gpuFieldId).sample(source.controls)));fieldReceipts=samples;candidate=1-front;const count=await gpu.copyFrame(samples,frameBuffers[candidate]);const r=fieldRenderers[candidate];r.resize(width,height);if(count)r.setResidentVertices(frameBuffers[candidate],count);else r.setPackedVertices(new Float32Array());await device.queue.onSubmittedWorkDone();}
   let geometryPresented;
   if(scene.meshes.length)geometryPresented=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('VKF geometry did not present')),7000);VfDisplay.presentStateFrameScene(id,scene,{afterPresented(){clearTimeout(timer);resolve();}});});
   renderer.resize(width,height);
   const nativeScene={frame(){return [];},groups:new Map(),nativeSourceOutlines(camera){return state.sources.filter(s=>!s.gpuFieldId).map(s=>({...s,matrix:compose(camera,s.matrix)}));}};
   renderer.setNativeScene(nativeScene,[1,0,0,1,0,0]);
   if(gpu){fieldCanvases[candidate].style.visibility='';fieldCanvases[front].style.visibility='hidden';front=candidate;}
   await geometryPresented;
   if(axisVisible&&scene.meshes.length)await VfDisplay.waitForNativeLabelFrame(id);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   frame.root.style.opacity='1';
   return {libraryCommit:prepared.libraryCommit,coordinate:q,objects:state.sources.length,cohorts:prepared.cohorts,renderer:renderer.nativeStatistics(),compute:gpu?{...gpu.statistics(),fields:fieldReceipts.length,geometryReadbackBytes:0,controlReadbackBytes:fieldReceipts.reduce((n,r)=>n+r.controlReadbackBytes,0),maxMeasureResidual:Math.max(0,...fieldReceipts.map(r=>Math.abs(r.measuredArea-r.desiredArea)))}:{backend:'native VKF scalar state'}};
  },close};
 }catch(error){close();throw error;}
}
