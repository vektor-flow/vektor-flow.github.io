import {createNativeDenseMaterialGpu} from './vf-native-dense-material-gpu.mjs';
import {createSymbolicKernel} from '../vf-symbolic-kernel-runtime.mjs';
import {createAdaptiveNativeLabelBatches} from './vf-adaptive-native-labels.mjs';
import {createTiledNativeLabelRenderer} from './vf-native-tiled-label-renderer.mjs';
import {createScreenSpaceSimplexRenderer} from '../geom/vf-screen-simplex-renderer.mjs';
import {createScreenSpacePointCloudRenderer} from '../geom/vf-screen-point-cloud-renderer.mjs';
const need=(ok,code)=>{if(!ok)throw Object.assign(Error(code),{code});};
const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
export const TEXT_INTERP_COMMIT='31decf43176a2739d8e5efb309b9e8d83780f611';
const expected={"text.wasm": "591d1b376c936ef03286d41234e2b237713e0cc270866554964677ca9bcbcb2e", "text.json": "b9f4836d670b371cb58fddaa8f14ecae13457ab5df6e6ae237d290b0351b35d1"};
export async function loadNativeTextModeKernel({baseURL=new URL('../artifacts/text-modes/',import.meta.url),fetch:fetcher=globalThis.fetch,signal}={}){
 const get=async n=>{const r=await fetcher(new URL(n,baseURL),{signal});need(r.ok,'NATIVE_TEXT_RESOURCE');return r.arrayBuffer();};
 const [bytes,json,p]=await Promise.all(['text.wasm','text.json','PROVENANCE.json'].map(get)),provenance=JSON.parse(new TextDecoder().decode(p));
 need(provenance.kind==='vkf-native-interp-text/1'&&provenance.libraryCommit===TEXT_INTERP_COMMIT&&provenance.compilerVersion==='0.7.5','NATIVE_TEXT_PROVENANCE');
 for(const [n,b] of [['text.wasm',bytes],['text.json',json]])need(await sha(b)===expected[n]&&provenance.artifacts[n].sha256===expected[n],'NATIVE_TEXT_ARTIFACT_CHANGED');
 const module=await WebAssembly.compile(bytes);need(!WebAssembly.Module.imports(module).length,'NATIVE_TEXT_HOST_IMPORTS');
 return {kernel:createSymbolicKernel({instance:new WebAssembly.Instance(module,{}),manifest:JSON.parse(new TextDecoder().decode(json)),diagnostics:true}),provenance};
}
const abort=()=>new DOMException('Native text playback cancelled','AbortError');
const rgba=c=>Array.isArray(c)&&c.length===4&&c.every(x=>Number.isFinite(x)&&x>=0&&x<=1);
const compose=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const sourceScene=sources=>({groups:new Map(),frame(){return [];},nativeSourceOutlines(camera){return sources.map(s=>({...s,matrix:compose(camera,s.matrix)}));}});
function nativeSettings(kernel,spec){
 need(spec&&['state','spectral','vapor'].includes(spec.mode),'NATIVE_TEXT_MODE');
 if(spec.mode==='state'){
  need(Object.keys(spec).every(k=>['mode','path'].includes(k)),'NATIVE_TEXT_MODE_PARAMETER');
  const path=spec.path==='natural-cubic'?1:spec.path==='linear'?0:(spec.path??0);need([0,1].includes(path),'NATIVE_TEXT_PARAMETER_TYPE');return kernel.invokeValue('state',[path]);
 }
 if(spec.mode==='spectral'){
  need(Object.keys(spec).every(k=>['mode','k','velocity','overshoot','grow'].includes(k)),'NATIVE_TEXT_MODE_PARAMETER');
  const args=[spec.k??4,spec.velocity??.54,spec.overshoot??.32,spec.grow??true];need(args.slice(0,3).every(Number.isFinite)&&typeof args[3]==='boolean','NATIVE_TEXT_PARAMETER_TYPE');return kernel.invokeValue('spectral',args);
 }
 need(Object.keys(spec).every(k=>['mode','temperature','spread','lift','seed','footprint','captureWidth','velocity','boundary','captureStart','captureEnd'].includes(k)),'NATIVE_TEXT_MODE_PARAMETER');
 const boundary={closed:0,emit:1,exit:2,exchange:3}[spec.boundary??'exchange'];
 const args=[spec.temperature??1,spec.spread??.35,spec.lift??.65,spec.seed??0,spec.footprint??.45,spec.captureWidth??.45,spec.velocity??.54,boundary,spec.captureStart??.35,spec.captureEnd??.85];need(args.every(Number.isFinite)&&Number.isInteger(args[3])&&boundary!==undefined,'NATIVE_TEXT_PARAMETER_TYPE');return kernel.invokeValue('evaporate',args);
}

function checkSpecs(specs){
 need(Array.isArray(specs)&&specs.length<=128,'NATIVE_TEXT_SPEC_LIMIT');
 const ids=new Set();for(const s of specs){need(s&&typeof s.id==='string'&&!ids.has(s.id)&&s.kind==='math'&&typeof s.source==='string'&&s.anchor?.length===2&&s.anchor.every(Number.isFinite)&&Number.isFinite(s.scale)&&s.scale>0&&(s.sizeSpace??'css')==='css'&&(s.color===undefined||rgba(s.color))&&(s.itemIndex===undefined||(Number.isInteger(s.itemIndex)&&s.itemIndex>=0)),'NATIVE_TEXT_SPEC');ids.add(s.id);}
}
// CSS-baseline anchors, original native physical glyphs. Flip only the host
// coordinate chart; the physical source and native item geometry never change.
async function outlines(typography,specs,check,pixelRatio){
 checkSpecs(specs);if(!specs.length)return [];
 const scene=await createAdaptiveNativeLabelBatches({typography,specs:specs.map(s=>({...s,sizeSpace:'world',anchor:[s.anchor[0],-s.anchor[1]]})),coordinates:{worldToScreen:([x,y])=>[x,-y]},pixelRatio});
 try{check();return scene.nativeSourceOutlines([1,0,0,-1,0,0],{maxInstances:4096}).map(s=>({...s,color:[...s.color]}));}finally{scene.close();}
}
function readingCoordinates(sources,specs,k,kernel){
 const byId=new Map(specs.map((s,i)=>[s.id,{spec:s,order:i}])),offsets=new Map();let previous=0;
 // Explicit input order / itemIndex is reading order. Positions only establish
 // within-row native glyph advances; semantic row membership is caller data.
 for(const spec of specs){const row=sources.filter(s=>s.provenance.elementId===spec.id);if(!row.length)continue;
  const left=Math.min(...row.map(s=>s.matrix[4])),right=Math.max(...row.map(s=>s.matrix[4]));
  const rowIndex=Number.isInteger(spec.itemIndex)?spec.itemIndex:byId.get(spec.id).order;
  offsets.set(spec.id,{left,width:Math.max(1,right-left),offset:previous,row:rowIndex});previous+=1;
 }
 const values=sources.map(s=>{const row=offsets.get(s.provenance.elementId),local=(s.matrix[4]-row.left)/row.width;return kernel.invokeValue('reading_coordinate',[row.offset,row.row,local,k]);});
 return values;
}
// Bounded raster intake only: no trajectory, correspondence, easing or glyph
// rendering is implemented here. Equal dyadic sample counts make native
// persistent material cuts exactly representable; coverage remains observable.
function sampleInk(pixels,height,limit){
 let population=0;for(let at=3;at<pixels.data.length;at+=4)if(pixels.data[at])population++;
 if(!population)return {values:[],count:0,population:0};
 let count=1;while(count*2<=Math.min(population,limit))count*=2;
 const values=[],ratio=pixels.height/height,footprint=Math.sqrt(population/count)/ratio;
 let ordinal=0,taken=0;
 for(let at=0;at<pixels.data.length&&taken<count;at+=4){const a=pixels.data[at+3];if(!a)continue;
  if(ordinal++<Math.floor(taken*population/count))continue;
  const index=at/4,x=(index%pixels.width+.5)/ratio,y=(Math.floor(index/pixels.width)+.5)/ratio;
  values.push(x/height,1-y/height,pixels.data[at]/255,pixels.data[at+1]/255,pixels.data[at+2]/255,a/255,footprint);taken++;
 }need(taken===count,'NATIVE_INK_SAMPLE_COUNT');return {values,count,population};
}
// Dense intake retains EVERY covered native raster pixel. Equal dyadic endpoint
// sizes preserve exact existing material cuts; extra slots partition pixel alpha.
// This is raster data intake, never a trajectory/reveal or glyph implementation.
function inkPopulation(pixels){let count=0,coverage=0;for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]){count++;coverage+=pixels.data[i]/255;}return {count,coverage};}
function retainInkPixels(pixels,height,population){
 const indices=new Uint32Array(population.count),colors=new Uint32Array(population.count);let i=0;for(let at=0;at<pixels.data.length;at+=4)if(pixels.data[at+3]){indices[i]=at/4;colors[i]=(pixels.data[at]|pixels.data[at+1]<<8|pixels.data[at+2]<<16|pixels.data[at+3]<<24)>>>0;i++;}
 return {...population,indices,colors,width:pixels.width,ratio:pixels.height/height};
}
function denseInk(pixels,height,count){
 const values=[];if(!pixels.count)return {values,count:0,population:0,coverage:0};const ratio=pixels.ratio;need(count>=pixels.count&&count<=65536,'NATIVE_INK_PIXEL_BUDGET');
 for(let ordinal=0;ordinal<pixels.count;ordinal++){const repeats=Math.floor((ordinal+1)*count/pixels.count)-Math.floor(ordinal*count/pixels.count),index=pixels.indices[ordinal],color=pixels.colors[ordinal],x=(index%pixels.width+.5)/ratio,y=(Math.floor(index/pixels.width)+.5)/ratio;
  const columns=Math.ceil(Math.sqrt(repeats)),rows=Math.ceil(repeats/columns),size=1/(ratio*Math.sqrt(repeats));for(let j=0;j<repeats;j++){const dx=((j%columns+.5)/columns-.5)/ratio,dy=((Math.floor(j/columns)+.5)/rows-.5)/ratio;values.push((x+dx)/height,1-(y+dy)/height,(color&255)/255,((color>>>8)&255)/255,((color>>>16)&255)/255,(color>>>24)/255,size);}
 }need(values.length===7*count,'NATIVE_INK_DENSE_COUNT');return {values,count,population:pixels.count,coverage:pixels.coverage/(ratio*ratio)};
}
const stableSpec=s=>JSON.stringify([s.id,s.kind,s.source,s.anchor,s.scale,s.color??[0,0,0,1],s.sizeSpace??'css',s.display??false]);
/** Same-document native material transport/reveal. Geometry and capture belong
 * to their existing owners. Existing physical font paths remain authoritative.
 */
async function prepareSpectralTextModes({fromSpecs=[],toSpecs=[],width,height,typography,interp={mode:'spectral'},signal,pixelRatio=globalThis.devicePixelRatio||1,maxCarriers=4096,document=globalThis.document,kernelOptions={}}={}){
 need(document?.createElement&&typography?.prepare&&typography?.vectors,'NATIVE_TEXT_TYPOGRAPHY');
 need(Number.isInteger(width)&&width>0&&width<=4096&&Number.isInteger(height)&&height>0&&height<=4096&&width*height<=4194304&&[1,2,3].includes(pixelRatio),'NATIVE_TEXT_VIEWPORT');
 need(Number.isInteger(maxCarriers)&&maxCarriers>=1&&maxCarriers<=4096,'NATIVE_TEXT_CARRIER_LIMIT');
 checkSpecs(fromSpecs);checkSpecs(toSpecs);
 let closed=false,generation=0,tail=Promise.resolve(),last=null,nativeRenderer,gasRenderer,sourceRenderer,transport=null;
 const element=document.createElement('div');element.className='vf-native-text-modes';element.style.cssText=`position:absolute;inset:0;width:${width}px;height:${height}px;pointer-events:none;background:transparent`;
 const canvas=document.createElement('canvas'),gasCanvas=document.createElement('canvas'),nativeCanvas=document.createElement('canvas'),sourceCanvas=document.createElement('canvas'),firstCanvas=document.createElement('canvas');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';element.append(canvas);
 const check=()=>{if(closed||signal?.aborted)throw abort();};
 function close(){if(closed)return;closed=true;generation++;transport=null;signal?.removeEventListener('abort',close);nativeRenderer?.destroy();sourceRenderer?.destroy();gasRenderer?.destroy();element.remove();for(const c of [canvas,gasCanvas,nativeCanvas,sourceCanvas,firstCanvas])c.width=c.height=1;}
 signal?.addEventListener('abort',close,{once:true});
 try{
  check();const {kernel,provenance}=await loadNativeTextModeKernel({...kernelOptions,signal});check();const settings=nativeSettings(kernel,interp);
  const from=await outlines(typography,fromSpecs,check,pixelRatio),to=await outlines(typography,toSpecs,check,pixelRatio);check();
  const before=new Map(fromSpecs.map(s=>[s.id,stableSpec(s)])),stable=new Set(toSpecs.filter(s=>before.get(s.id)===stableSpec(s)).map(s=>s.id)),changedFrom=from.filter(s=>!stable.has(s.provenance.elementId)),changedTo=to.filter(s=>!stable.has(s.provenance.elementId));
  nativeRenderer=createTiledNativeLabelRenderer(nativeCanvas,{pixelRatio:()=>pixelRatio,nativeAccuracy:'required',samplesPerAxis:4});sourceRenderer=createTiledNativeLabelRenderer(sourceCanvas,{pixelRatio:()=>pixelRatio,nativeAccuracy:'required',samplesPerAxis:4});
  await nativeRenderer.initialize();check();await sourceRenderer.initialize();check();nativeRenderer.resize(width,height);sourceRenderer.resize(width,height);
  sourceRenderer.setNativeScene(sourceScene(from),[1,0,0,1,0,0]);
  firstCanvas.width=sourceCanvas.width;firstCanvas.height=sourceCanvas.height;firstCanvas.getContext('2d').putImageData(sourceCanvas.getContext('2d').getImageData(0,0,firstCanvas.width,firstCanvas.height),0,0);
  sourceRenderer.setNativeScene(sourceScene(changedFrom),[1,0,0,1,0,0]);
  const sourcePixels=sourceCanvas.getContext('2d').getImageData(0,0,sourceCanvas.width,sourceCanvas.height),sourceInk=sampleInk(sourcePixels,height,maxCarriers);
  const reading=readingCoordinates(changedTo,toSpecs.filter(s=>!stable.has(s.id)),interp.k??4,kernel),ramp=kernel.invokeValue('ramp_width',[interp.k??4]),travel=(reading.length?Math.max(...reading):0)+ramp;
  let targetInk={values:[],count:0,population:0},transportPrepareMs=0;
  if(interp.mode==='vapor'&&(changedFrom.length||changedTo.length)){
   nativeRenderer.setNativeScene(sourceScene(changedTo),[1,0,0,1,0,0]);const targetPixels=nativeCanvas.getContext('2d').getImageData(0,0,nativeCanvas.width,nativeCanvas.height);targetInk=sampleInk(targetPixels,height,maxCarriers);
   need(sourceInk.count>0&&targetInk.count>0,'MATERIAL_VAPOR_EMPTY_ENDPOINT: conserved transport needs changed ink at both endpoints; use spectral for appearance/removal');
   const glyphs=changedTo.flatMap((s,i)=>[s.matrix[4]/height,1-s.matrix[5]/height,reading[i],...(s.color??[0,0,0,1])]);
   const started=performance.now();transport=kernel.invokeValue('prepare_vapor_transport',[settings,sourceInk.values,targetInk.values,glyphs]);transportPrepareMs=performance.now()-started;
  }
  gasRenderer=createScreenSpaceSimplexRenderer(gasCanvas,{pixelRatio:()=>pixelRatio,backend:'webgl2'});await gasRenderer.initialize();gasRenderer.resize(width,height);check();
  canvas.width=width*pixelRatio;canvas.height=height*pixelRatio;const ctx=canvas.getContext('2d',{alpha:true});need(ctx,'NATIVE_TEXT_COMPOSITOR');
  const velocity=interp.velocity??.54,durationSeconds=velocity===0?Infinity:travel/velocity;
  async function render(q,options,serial){
   check();if(serial!==generation)return {status:'SUPERSEDED'};need(Number.isFinite(q)&&q>=0&&q<=1,'NATIVE_TEXT_COORDINATE');const start=performance.now(),coordinate=kernel.invokeValue('time_coordinate',[q]);
   const defaultFront=transport?kernel.invokeValue('vapor_front',[settings,coordinate,travel]):(velocity===0?0:coordinate*travel),front=options.front??(options.elapsed===undefined?defaultFront:kernel.invokeValue('reveal_advance',[settings,0,options.elapsed]));need(Number.isFinite(front),'NATIVE_TEXT_FRONT');
   if(last&&last.coordinate===q&&last.front===front){last={...last,status:'REUSED_ACCEPTED_FRAME',reusedAcceptedFrame:true,nativeComputeMs:0,cpuThroughSubmitMs:performance.now()-start};return last;}
   const began=performance.now();let packet;
   if(transport)packet=kernel.invokeValue('sample_vapor_transport',[transport,coordinate,front]);
   else if(interp.mode==='spectral')packet=kernel.invokeValue('text_frame',[settings,coordinate,[],reading,front]);
   else packet={source_alpha:0,gas:[],target:[],ledger:[0,0,0]};
   const computeMs=performance.now()-began;check();let zeroAreaGlyphs=0,index=0;
   const sources=q===1?to:q===0?[]:to.flatMap(s=>{
    if(stable.has(s.provenance.elementId))return [s];const i=index++,[a,g,r,b,c]=packet.target.slice(i*5,i*5+5);if(!(a>0))return [];need(Number.isFinite(g),'NATIVE_TEXT_GROWTH');const m=s.matrix,color=s.color??[0,0,0,1],linear=[m[0]*g,m[1]*g,m[2]*g,m[3]*g];if(g<=0||linear.every(v=>v===0)){zeroAreaGlyphs++;return [];}
    return [{...s,matrix:[...linear,m[4],m[5]],color:transport?[r,b,c,a]:[r*color[0],b*color[1],c*color[2],a*color[3]]}];
   });
   const gas=transport?packet.gas:[];let visible=0;for(let i=2;i<gas.length;i+=9)if(gas[i]>0)visible++;const points=new Float32Array(visible*36);let at=0;
   for(let i=0;i<gas.length/9;i++){const [x,y,a,size,r,g,b]=gas.slice(i*9,i*9+7);if(a<=0)continue;const cx=x*height,cy=(1-y)*height,radius=size*.5;for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){points.set([cx+dx*radius,cy+dy*radius,r,g,b,a],at);at+=6;}}
   gasRenderer.setPackedVertices(points);nativeRenderer.setNativeScene(sourceScene(sources),[1,0,0,1,0,0]);check();if(serial!==generation)return {status:'SUPERSEDED'};
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=q===0?1:packet.source_alpha;ctx.drawImage(q===0?firstCanvas:sourceCanvas,0,0);ctx.globalAlpha=1;ctx.drawImage(gasCanvas,0,0);ctx.drawImage(nativeCanvas,0,0);
   await new Promise(resolve=>requestAnimationFrame(resolve));check();
   last={status:'PRESENTED_COMPOSITOR_TURN',coordinate:q,nativeCoordinate:coordinate,front,sourceAlpha:q===0?1:packet.source_alpha,carriers:transport?.material.carriers??0,glyphs:to.length,stableGlyphs:to.length-changedTo.length,gasAlphaMax:Math.max(0,...gas.filter((_,i)=>i%9===2)),zeroAreaGlyphs,targetAlpha:packet.target.filter((_,i)=>i%5===0),nativeComputeMs:computeMs,cpuThroughSubmitMs:performance.now()-start,computeBackend:'canonical VKF WASM; CPU',gasRenderingBackend:gasRenderer.backend,nativeRenderer:nativeRenderer.nativeStatistics(),libraryCommit:provenance.libraryCommit,geometryReadback:false,inkReadback:'actual native source and target ink once during preparation',transport:transport?{backend:'Morphing.prepare_material + shared state segment',ledger:packet.ledger,sourceSamples:sourceInk.count,targetSamples:targetInk.count,prepareMs:transportPrepareMs,correspondence:'ordered equal dyadic material; nearest native anchor capture control',noise:'seeded finite cubic field; not a physical Brownian solver'}:{status:changedTo.length?'spectral':'unchanged'}};
   return last;
  }
  return Object.freeze({element,canvas,libraryCommit:provenance.libraryCommit,sourceCount:from.length,targetCount:to.length,durationSeconds,readingTravel:travel,revealFront(elapsed){check();return kernel.invokeValue('reveal_advance',[settings,0,elapsed]);},sample(q,options={}){const serial=++generation;const job=tail.then(()=>render(q,options,serial));tail=job.catch(()=>{});return job;},receipt:()=>last,close});
 }catch(error){close();throw error;}
}

/** Collect/apply channels in the host; all interpolation and clock math is
 * the existing native state backend in this SAME pinned kernel artifact. */
export async function prepareNumericStateTransition({from,to,path=0,signal,kernelOptions={}}={}){
 need([0,1].includes(path)&&Array.isArray(from)&&Array.isArray(to)&&from.length>0&&from.length===to.length&&from.length<=65536&&from.every(Number.isFinite)&&to.every(Number.isFinite),'NATIVE_NUMERIC_STATE_CHANNELS');
 const loaded=await loadNativeTextModeKernel({...kernelOptions,signal});let kernel=loaded.kernel,plan=kernel.invokeValue('prepare',[kernel.invokeValue('state',[path]),[0,1],[...from,...to],from.length]),closed=false;
 function close(){if(closed)return;closed=true;kernel=null;plan=null;signal?.removeEventListener('abort',close);}signal?.addEventListener('abort',close,{once:true});if(signal?.aborted){close();throw abort();}
 return Object.freeze({sample(q){if(closed||signal?.aborted)throw abort();need(Number.isFinite(q)&&q>=0&&q<=1,'NATIVE_NUMERIC_STATE_COORDINATE');const nativeCoordinate=kernel.invokeValue('time_coordinate',[q]),sample=kernel.invokeValue('sample_state',[plan,nativeCoordinate]);return {values:sample.value,coordinate:q,nativeCoordinate,libraryCommit:loaded.provenance.libraryCommit};},close});
}

/** Native row policy is authored data. The adapter never classifies equations
 * semantically or computes correspondence, trajectories, easing or color waves. */
export async function prepareNativeTextModes(options={}){
 if(options.interp?.mode==='spectral')return prepareSpectralTextModes(options);
 const {fromSpecs=[],toSpecs=[],width,height,typography,interp={mode:'state'},rowTransitions=[],signal,pixelRatio=globalThis.devicePixelRatio||1,maxCarriers=131072,document=globalThis.document,kernelOptions={}}=options;
 need(document?.createElement&&typography?.prepare&&typography?.vectors,'NATIVE_TEXT_TYPOGRAPHY');
 need(Number.isInteger(width)&&width>0&&width<=4096&&Number.isInteger(height)&&height>0&&height<=4096&&width*height<=4194304&&[1,2,3].includes(pixelRatio),'NATIVE_TEXT_VIEWPORT');
 need(Number.isInteger(maxCarriers)&&maxCarriers>=1&&maxCarriers<=131072,'NATIVE_TEXT_CARRIER_LIMIT');checkSpecs(fromSpecs);checkSpecs(toSpecs);need(Array.isArray(rowTransitions)&&rowTransitions.length<=128,'NATIVE_TEXT_ROW_LIMIT');
 let closed=false,generation=0,tail=Promise.resolve(),last=null,nativeRenderer,sourceRenderer,gasRenderer,denseGpu;let preparedRows=[];
 const element=document.createElement('div');element.className='vf-native-text-modes';element.style.cssText=`position:absolute;inset:0;width:${width}px;height:${height}px;pointer-events:none;background:transparent`;
 const canvas=document.createElement('canvas'),nativeCanvas=document.createElement('canvas'),sourceCanvas=document.createElement('canvas'),firstCanvas=document.createElement('canvas'),gasCanvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';element.append(canvas);
 const check=()=>{if(closed||signal?.aborted)throw abort();};function close(){if(closed)return;closed=true;generation++;preparedRows=[];signal?.removeEventListener('abort',close);nativeRenderer?.destroy();sourceRenderer?.destroy();gasRenderer?.destroy();denseGpu?.close();element.remove();for(const c of [canvas,nativeCanvas,sourceCanvas,firstCanvas,gasCanvas])c.width=c.height=1;}
 signal?.addEventListener('abort',close,{once:true});
 try{
  check();const {kernel,provenance}=await loadNativeTextModeKernel({...kernelOptions,signal});nativeSettings(kernel,interp);check();const from=await outlines(typography,fromSpecs,check,pixelRatio),to=await outlines(typography,toSpecs,check,pixelRatio),fromMap=new Map(fromSpecs.map(s=>[s.id,s])),toMap=new Map(toSpecs.map(s=>[s.id,s]));
  const stable=new Set(toSpecs.filter(s=>fromMap.has(s.id)&&stableSpec(fromMap.get(s.id))===stableSpec(s)).map(s=>s.id)),fixed=to.filter(s=>stable.has(s.provenance.elementId)),usedFrom=new Set(stable),usedTo=new Set(stable),descriptors=[];
  function row(fromId,toId,settings){need((fromId===null||fromMap.has(fromId))&&(toId===null||toMap.has(toId))&&(fromId!==null||toId!==null),'NATIVE_TEXT_ROW_ADDRESS');if(fromId===toId&&stable.has(toId))return;need((fromId===null||!usedFrom.has(fromId))&&(toId===null||!usedTo.has(toId)),'NATIVE_TEXT_ROW_DUPLICATE');if(fromId!==null)usedFrom.add(fromId);if(toId!==null)usedTo.add(toId);need(settings&&['state','vapor'].includes(settings.mode),'NATIVE_TEXT_ROW_MODE');descriptors.push({fromId,toId,interp:{...settings},source:from.filter(s=>s.provenance.elementId===fromId),target:to.filter(s=>s.provenance.elementId===toId)});}
  for(const r of rowTransitions){need(r&&Object.keys(r).every(k=>['fromId','toId','interp'].includes(k))&&('fromId'in r)&&('toId'in r),'NATIVE_TEXT_ROW_DESCRIPTOR');row(r.fromId,r.toId,r.interp??(r.fromId===null||r.toId===null?{mode:'vapor'}:interp));}
  for(const spec of toSpecs){if(usedTo.has(spec.id))continue;const fromId=fromMap.has(spec.id)&&!usedFrom.has(spec.id)?spec.id:null;row(fromId,spec.id,fromId===null?{mode:'vapor',...(spec.interp?.mode==='vapor'?spec.interp:{})}:(spec.interp??interp));}
  for(const spec of fromSpecs)if(!usedFrom.has(spec.id))row(spec.id,null,{mode:'vapor',...(spec.interp?.mode==='vapor'?spec.interp:{})});need(descriptors.length<=128,'NATIVE_TEXT_ROW_LIMIT');
  nativeRenderer=createTiledNativeLabelRenderer(nativeCanvas,{pixelRatio:()=>pixelRatio,nativeAccuracy:'required',samplesPerAxis:4});sourceRenderer=createTiledNativeLabelRenderer(sourceCanvas,{pixelRatio:()=>pixelRatio,nativeAccuracy:'required',samplesPerAxis:4});await nativeRenderer.initialize();check();await sourceRenderer.initialize();check();nativeRenderer.resize(width,height);sourceRenderer.resize(width,height);
  sourceRenderer.setNativeScene(sourceScene(from),[1,0,0,1,0,0]);firstCanvas.width=sourceCanvas.width;firstCanvas.height=sourceCanvas.height;firstCanvas.getContext('2d').putImageData(sourceCanvas.getContext('2d').getImageData(0,0,firstCanvas.width,firstCanvas.height),0,0);
  const identities=new Map();function physicalIdentity(s){const key=JSON.stringify(s.physicalIdentity??[s.provenance.engineIdentity,s.provenance.resourceIdentity,s.provenance.glyphKey,s.commands],(k,v)=>typeof v==='number'&&Object.is(v,-0)?{nativeNegativeZero:true}:v);if(!identities.has(key))identities.set(key,identities.size+1);return identities.get(key);}
  const endpoint=sources=>({identity:sources.map(physicalIdentity),matrix:sources.flatMap(s=>s.matrix),color:sources.flatMap(s=>s.color??[0,0,0,1])});
  const activeVapor=descriptors.filter(r=>r.interp.mode==='vapor');
  const materialSpecs=activeVapor.filter(r=>r.toId!==null).map(r=>({...toMap.get(r.toId),itemIndex:0})),materialSources=activeVapor.flatMap(r=>r.target),materialReading=readingCoordinates(materialSources,materialSpecs,4,kernel),readingBySource=new Map(materialSources.map((s,i)=>[s,materialReading[i]])),materialTravel=(materialReading.length?Math.max(...materialReading):0)+Math.max(.05,...activeVapor.map(r=>r.interp.captureWidth??.45));
  const pixelRows=new Map(),rowRequirements=[];let requiredCarriers=0,overBudget=false;
  for(const row of activeVapor){check();nativeSettings(kernel,row.interp);const endpoints=[];for(const sources of [row.source,row.target]){sourceRenderer.setNativeScene(sourceScene(sources),[1,0,0,1,0,0]);const image=sourceCanvas.getContext('2d').getImageData(0,0,sourceCanvas.width,sourceCanvas.height),population=inkPopulation(image);endpoints.push(overBudget?population:retainInkPixels(image,height,population));}
   const subdivision=Math.ceil(1/((pixelRatio*(row.interp.footprint??.45))**2)),pixels=Math.max(endpoints[0].count,endpoints[1].count);let count=pixels?1:0;while(count&&count<Math.max(pixels,row.target.length)*subdivision)count*=2;requiredCarriers+=count;rowRequirements.push({fromId:row.fromId,toId:row.toId,sourcePixels:endpoints[0].count,targetPixels:endpoints[1].count,requiredCarriers:count,subdivision});
   if(count>65536||requiredCarriers>maxCarriers){overBudget=true;pixelRows.clear();}if(!overBudget)pixelRows.set(row,{source:endpoints[0],target:endpoints[1],count});
  }
  if(overBudget)throw Object.assign(Error(`Native ink needs ${requiredCarriers} carriers; ceiling ${maxCarriers}, per-row ceiling65536`),{code:'NATIVE_INK_PIXEL_BUDGET',requiredCarriers,maxCarriers,perRowLimit:65536,rows:rowRequirements});
  denseGpu=activeVapor.length?await createNativeDenseMaterialGpu({libraryCommit:provenance.libraryCommit,signal}):null;check();
  const startPreparation=performance.now();for(const descriptor of descriptors){check();const settings=nativeSettings(kernel,descriptor.interp);if(descriptor.interp.mode==='state'){
    const state=kernel.invokeValue('prepare_glyph_state',[settings,endpoint(descriptor.source),endpoint(descriptor.target)]);preparedRows.push({...descriptor,state,native:{mode:0,state:[state],vapor:[],travel:0}});
   }else{
    const pixels=pixelRows.get(descriptor),count=pixels.count,source=denseInk(pixels.source,height,count),target=denseInk(pixels.target,height,count);pixelRows.delete(descriptor);
    const reading=descriptor.target.map(s=>readingBySource.get(s)),travel=materialTravel,glyphs=descriptor.target.flatMap((s,i)=>[s.matrix[4]/height,1-s.matrix[5]/height,reading[i],...(s.color??[0,0,0,1])]);
    if(!source.count&&!target.count){const state=kernel.invokeValue('prepare_glyph_state',[nativeSettings(kernel,{mode:'state'}),endpoint(descriptor.source),endpoint(descriptor.target)]);preparedRows.push({...descriptor,state,native:{mode:0,state:[state],vapor:[],travel:0}});continue;}
    const nativeGlyphs=glyphs.length?glyphs:[0,1.2,0,0,0,0,0],vapor=kernel.invokeValue('prepare_dense_vapor',[settings,count,source.count>0,target.count>0,nativeGlyphs]),gpu=denseGpu.prepare({source:source.count?source.values:target.values,target:target.count?target.values:source.values,glyphs:nativeGlyphs,count});preparedRows.push({...descriptor,vapor,gpu,travel,sourceSamples:source.count,targetSamples:target.count,sourcePixels:source.population,targetPixels:target.population,sourceCoverage:source.coverage,targetCoverage:target.coverage});
   }}const preparationMs=performance.now()-startPreparation;need(fixed.length+preparedRows.reduce((n,r)=>n+(r.state?r.state.count:r.source.length+r.target.length),0)<=4096,'NATIVE_TEXT_INTERMEDIATE_GLYPH_LIMIT');
  gasRenderer=createScreenSpacePointCloudRenderer(gasCanvas,{premultipliedAlpha:true});await gasRenderer.initialize();gasRenderer.resize(width*pixelRatio,height*pixelRatio);canvas.width=width*pixelRatio;canvas.height=height*pixelRatio;const ctx=canvas.getContext('2d',{alpha:true});need(ctx,'NATIVE_TEXT_COMPOSITOR');const nativeRows=preparedRows.filter(r=>r.state).map(r=>r.native);
  const posed=(s,matrix,color)=>{const {programTransformRecipe,programRoundoffMagnitude,...base}=s;return {...base,matrix,color};};
  async function render(q,opts,serial){check();need(Number.isFinite(q)&&q>=0&&q<=1,'NATIVE_TEXT_COORDINATE');if(serial!==generation)return {status:'SUPERSEDED'};const start=performance.now(),fronts=opts.front===undefined?[]:preparedRows.map(()=>opts.front);need(fronts.every(Number.isFinite),'NATIVE_TEXT_FRONT');if(last?.coordinate===q&&last.requestedFront===opts.front)return {...last,status:'REUSED_ACCEPTED_FRAME',reusedAcceptedFrame:true,nativeComputeMs:0};
   const began=performance.now(),packet=kernel.invokeValue('sample_text_rows',[nativeRows,q,[]]);check();const sources=[...fixed],gas=[],rowReceipts=[];let matchedGlyphs=0,carriers=0,stateIndex=0,gpuThroughReadbackMs=0,readbackBytes=0;
   for(let r=0;r<preparedRows.length;r++){const prepared=preparedRows[r];let frame;if(prepared.state)frame=packet.rows[stateIndex++];else{const controls=kernel.invokeValue('dense_vapor_frame',[prepared.vapor,packet.coordinate,prepared.travel,opts.front===undefined?[]:[opts.front]]),computed=await prepared.gpu.sample(controls.params);gpuThroughReadbackMs+=computed.gpuThroughReadbackMs;readbackBytes+=computed.readbackBytes;frame={...kernel.invokeValue('finish_dense_capture',[prepared.vapor,controls,Array.from(computed.summary)]),gas:computed.gas};check();}if(prepared.state){for(let i=0;i<prepared.state.count;i++){const ti=prepared.state.target_indices[i],fi=prepared.state.source_indices[i],s=ti>=0?prepared.target[ti]:prepared.source[fi],pose=frame.poses.slice(10*i,10*i+10);if(fi>=0&&ti>=0)matchedGlyphs++;if(pose[9]>0&&!pose.slice(0,4).every(v=>v===0))sources.push(posed(s,pose.slice(0,6),pose.slice(6,10)));}}else{
    if(frame.source_alpha>0)for(const s of prepared.source){const c=s.color??[0,0,0,1];sources.push({...s,color:[c[0],c[1],c[2],c[3]*frame.source_alpha]});}
    for(let i=0;i<prepared.target.length;i++){const s=prepared.target[i],[a,size,red,green,blue]=frame.target.slice(5*i,5*i+5);if(a>0)sources.push({...s,color:[red,green,blue,a]});}
    carriers+=prepared.vapor.count;for(let i=0;i<frame.gas.length;i+=11){const [x,y,a,size,red,green,blue]=frame.gas.slice(i,i+7);if(a>0)gas.push(x*height*pixelRatio,(1-y)*height*pixelRatio,size*pixelRatio,red,green,blue,a);}
   }rowReceipts.push({fromId:prepared.fromId,toId:prepared.toId,mode:prepared.interp.mode,targetAlpha:frame.target.filter((_,i)=>i%5===0),ledger:frame.ledger,sourceSamples:prepared.sourceSamples??0,targetSamples:prepared.targetSamples??0,dispatchedCarriers:prepared.vapor?.count??0,sourcePixels:prepared.sourcePixels??0,targetPixels:prepared.targetPixels??0,sourceCoverage:prepared.sourceCoverage??0,targetCoverage:prepared.targetCoverage??0,massResidual:frame.mass_residual??0,assignedMass:frame.assigned_mass??0,opticalGasCoverage:frame.optical_gas_coverage??0,rawCoverage:frame.raw_coverage??0});}
   const nativeComputeMs=performance.now()-began;gasRenderer.setInkCarriers(Float32Array.from(gas));nativeRenderer.setNativeScene(sourceScene(q===1?to:q===0?[]:sources),[1,0,0,1,0,0]);check();if(serial!==generation)return {status:'SUPERSEDED'};ctx.clearRect(0,0,canvas.width,canvas.height);if(q===0)ctx.drawImage(firstCanvas,0,0);else{ctx.drawImage(gasCanvas,0,0);ctx.drawImage(nativeCanvas,0,0);}await new Promise(resolve=>requestAnimationFrame(resolve));check();
   last={status:'PRESENTED_COMPOSITOR_TURN',coordinate:q,nativeCoordinate:packet.coordinate,requestedFront:opts.front,libraryCommit:provenance.libraryCommit,sourceAlpha:q===0?1:q===1?0:undefined,glyphs:to.length,stableGlyphs:fixed.length,matchedGlyphs,carriers,gasAlphaMax:Math.max(0,...gas.filter((_,i)=>i%7===6)),nativeComputeMs,cpuThroughSubmitMs:performance.now()-start,preparationMs,computeBackend:'canonical VKF WASM clock/state + compiled native real-f32 WebGPU material',gpuThroughReadbackMs,readbackBytes,gpu:denseGpu?.statistics(),gasRenderingBackend:gasRenderer.backend,nativeRenderer:nativeRenderer.nativeStatistics(),transport:{rows:rowReceipts,inkBudget:{requiredCarriers,maxCarriers,perRowLimit:65536,rows:rowRequirements},flow:'native coherent convection + mild shared cubic variation',coverage:'GPU exact square/pixel overlap; native subpixel footprint',spectralColor:false},geometryReadback:false};return last;
  }
  return Object.freeze({element,canvas,libraryCommit:provenance.libraryCommit,sourceCount:from.length,targetCount:to.length,durationSeconds:Math.max(0,...preparedRows.filter(r=>r.vapor).map(r=>r.interp.velocity===0?Infinity:r.travel/(r.interp.velocity??.54))),readingTravel:Math.max(0,...preparedRows.map(r=>r.travel??0)),sample(q,opts={}){const serial=++generation,job=tail.then(()=>render(q,opts,serial));tail=job.catch(()=>{});return job;},receipt:()=>last,close});
 }catch(error){close();throw error;}
}
