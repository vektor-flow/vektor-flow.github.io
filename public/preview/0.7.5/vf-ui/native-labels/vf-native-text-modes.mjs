import {createSymbolicKernel} from '../vf-symbolic-kernel-runtime.mjs';
import {createAdaptiveNativeLabelBatches} from './vf-adaptive-native-labels.mjs';
import {createTiledNativeLabelRenderer} from './vf-native-tiled-label-renderer.mjs';
import {createScreenSpaceSimplexRenderer} from '../geom/vf-screen-simplex-renderer.mjs';
const need=(ok,code)=>{if(!ok)throw Object.assign(Error(code),{code});};
const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
export const TEXT_INTERP_COMMIT='90bc5b404630b190e4d45d6a2ecb90863347775f';
const expected={'text.wasm':'45514da13cb4d50af9236c2312e82acc2d86d8780297cc4fdf96c0395cf62109','text.json':'58932d1e70cbab80b966da69587d34ed80a0137f8d587fa13d227a2c5c4c8641'};
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
 need(spec&&['spectral','vapor'].includes(spec.mode),'NATIVE_TEXT_MODE');
 const common=['mode','k','velocity','overshoot','grow'],vapor=['temperature','spread','lift','seed'];
 need(Object.keys(spec).every(k=>common.includes(k)||(spec.mode==='vapor'&&vapor.includes(k))),'NATIVE_TEXT_MODE_PARAMETER');
 const args=[spec.k??4,spec.velocity??.54,spec.overshoot??.32,spec.grow??true];
 need(args.slice(0,3).every(Number.isFinite)&&typeof args[3]==='boolean','NATIVE_TEXT_PARAMETER_TYPE');
 if(spec.mode==='spectral')return kernel.invokeValue('spectral',args);
 const v=[spec.temperature??1,spec.spread??.35,spec.lift??.65,spec.seed??0];
 need(v.every(Number.isFinite)&&Number.isInteger(v[3]),'NATIVE_TEXT_PARAMETER_TYPE');
 return kernel.invokeValue('evaporate',[...v,...args]);
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
 try{check();return scene.nativeSourceOutlines([1,0,0,-1,0,0],{maxInstances:4096});}finally{scene.close();}
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
/** Transparent same-document text overlay. The caller owns editor/UI/geometry.
 * All reveal/trajectory channels come from the pinned native Interp batch.
 */
export async function prepareNativeTextModes({fromSpecs=[],toSpecs=[],width,height,typography,interp={mode:'spectral'},signal,pixelRatio=globalThis.devicePixelRatio||1,maxCarriers=4096,document=globalThis.document,kernelOptions={}}={}){
 need(document?.createElement&&typography?.prepare&&typography?.vectors,'NATIVE_TEXT_TYPOGRAPHY');
 need(Number.isInteger(width)&&width>0&&width<=4096&&Number.isInteger(height)&&height>0&&height<=4096&&width*height<=4194304&&[1,2,3].includes(pixelRatio),'NATIVE_TEXT_VIEWPORT');
 need(Number.isInteger(maxCarriers)&&maxCarriers>=1&&maxCarriers<=65536,'NATIVE_TEXT_CARRIER_LIMIT');
 let closed=false,generation=0,tail=Promise.resolve(),last=null,nativeRenderer,gasRenderer,sourceRenderer;
 const element=document.createElement('div');element.className='vf-native-text-modes';element.style.cssText=`position:absolute;inset:0;width:${width}px;height:${height}px;pointer-events:none;background:transparent`;
 const canvas=document.createElement('canvas'),gasCanvas=document.createElement('canvas'),nativeCanvas=document.createElement('canvas'),sourceCanvas=document.createElement('canvas');
 for(const c of [canvas,gasCanvas,nativeCanvas]){c.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';element.append(c);}
 // Only the final accepted composite is displayed. Intermediate native/gas
 // surfaces stay detached, preserving previous accepted pixels on failure.
 gasCanvas.remove();nativeCanvas.remove();
 const check=()=>{if(closed||signal?.aborted)throw abort();};
 function close(){if(closed)return;closed=true;generation++;signal?.removeEventListener('abort',close);nativeRenderer?.destroy();sourceRenderer?.destroy();gasRenderer?.destroy();element.remove();for(const c of [canvas,gasCanvas,nativeCanvas,sourceCanvas])c.width=c.height=1;}
 signal?.addEventListener('abort',close,{once:true});
 try{
  check();const {kernel,provenance}=await loadNativeTextModeKernel({...kernelOptions,signal});check();
  const settings=nativeSettings(kernel,interp),from=await outlines(typography,fromSpecs,check,pixelRatio),to=await outlines(typography,toSpecs,check,pixelRatio);check();
  need(to.length<=4096,'NATIVE_TEXT_GLYPH_LIMIT');
  nativeRenderer=createTiledNativeLabelRenderer(nativeCanvas,{pixelRatio:()=>pixelRatio,nativeAccuracy:'required',samplesPerAxis:4});
  sourceRenderer=createTiledNativeLabelRenderer(sourceCanvas,{pixelRatio:()=>pixelRatio,nativeAccuracy:'required',samplesPerAxis:4});
  await nativeRenderer.initialize();check();await sourceRenderer.initialize();check();
  nativeRenderer.resize(width,height);sourceRenderer.resize(width,height);sourceRenderer.setNativeScene(sourceScene(from),[1,0,0,1,0,0]);
  const sourcePixels=sourceCanvas.getContext('2d').getImageData(0,0,sourceCanvas.width,sourceCanvas.height),ink=[],colors=[];
  // A deterministic bounded subset of actual native ink pixels, never graphs
  // or background. Preserve the unpremultiplied source RGB and AA coverage.
  let population=0;for(let at=3;at<sourcePixels.data.length;at+=4)if(sourcePixels.data[at])population++;
  const stride=Math.max(1,Math.ceil(population/maxCarriers));let seen=0;
  if(interp.mode==='vapor')for(let at=0;at<sourcePixels.data.length;at+=4){const a=sourcePixels.data[at+3];if(!a)continue;if(seen++%stride)continue;const p=at/4,x=(p%sourcePixels.width+.5)/pixelRatio,y=(Math.floor(p/sourcePixels.width)+.5)/pixelRatio;ink.push(x/width,1-y/height,a/255);colors.push(sourcePixels.data[at]/255,sourcePixels.data[at+1]/255,sourcePixels.data[at+2]/255);}
  gasRenderer=createScreenSpaceSimplexRenderer(gasCanvas,{pixelRatio:()=>pixelRatio,backend:'webgl2'});await gasRenderer.initialize();gasRenderer.resize(width,height);check();
  const k=interp.k??4,reading=readingCoordinates(to,toSpecs,k,kernel),ramp=kernel.invokeValue('ramp_width',[k]),travel=(reading.length?Math.max(...reading):0)+ramp;
  const velocity=interp.velocity??.54,durationSeconds=velocity===0?Infinity:travel/velocity;
  canvas.width=width*pixelRatio;canvas.height=height*pixelRatio;const ctx=canvas.getContext('2d',{alpha:true});need(ctx,'NATIVE_TEXT_COMPOSITOR');
  async function render(q,options,serial){
   check();if(serial!==generation)return {status:'SUPERSEDED'};need(Number.isFinite(q)&&q>=0&&q<=1,'NATIVE_TEXT_COORDINATE');
   const start=performance.now(),coordinate=kernel.invokeValue('time_coordinate',[q]),front=options.front??(options.elapsed===undefined?(velocity===0?0:coordinate*travel):kernel.invokeValue('reveal_advance',[settings,0,options.elapsed]));need(Number.isFinite(front),'NATIVE_TEXT_FRONT');
   const before=performance.now(),packet=kernel.invokeValue('text_frame',[settings,coordinate,ink,reading,front]),computeMs=performance.now()-before;check();
   let zeroAreaGlyphs=0;
   const sources=q===1?to:q===0?[]:to.flatMap((s,i)=>{const [a,g,r,b,c]=packet.target.slice(i*5,i*5+5);if(a<=0)return [];need(Number.isFinite(g),'NATIVE_TEXT_GROWTH');const m=s.matrix,color=s.color??[0,0,0,1],linear=[m[0]*g,m[1]*g,m[2]*g,m[3]*g];if(g<=0||linear.every(v=>v===0)){zeroAreaGlyphs++;return [];}return [{...s,matrix:[...linear,m[4],m[5]],color:[r*color[0],b*color[1],c*color[2],a*color[3]]}];});
   const points=new Float32Array(packet.gas.length/4*36);let at=0;
   for(let i=0;i<packet.gas.length/4;i++){const [x,y,a,size]=packet.gas.slice(i*4,i*4+4),cx=x*width,cy=(1-y)*height,radius=Math.sqrt(stride)/pixelRatio*size*.5,col=[...colors.slice(i*3,i*3+3),a];for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){points.set([cx+dx*radius,cy+dy*radius,...col],at);at+=6;}}
   gasRenderer.setPackedVertices(points);
   nativeRenderer.setNativeScene(sourceScene(sources),[1,0,0,1,0,0]);check();if(serial!==generation)return {status:'SUPERSEDED'};
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=packet.source_alpha;ctx.drawImage(sourceCanvas,0,0);ctx.globalAlpha=1;ctx.drawImage(gasCanvas,0,0);ctx.drawImage(nativeCanvas,0,0);
   await new Promise(resolve=>requestAnimationFrame(resolve));check();
   last={status:'PRESENTED_COMPOSITOR_TURN',coordinate:q,nativeCoordinate:coordinate,front,sourceAlpha:packet.source_alpha,carriers:ink.length/3,glyphs:to.length,gasAlphaMax:Math.max(0,...packet.gas.filter((_,i)=>i%4===2)),zeroAreaGlyphs,targetAlpha:packet.target.filter((_,i)=>i%5===0),nativeComputeMs:computeMs,cpuThroughSubmitMs:performance.now()-start,computeBackend:'canonical VKF WASM; CPU',gasRenderingBackend:gasRenderer.backend,nativeRenderer:nativeRenderer.nativeStatistics(),libraryCommit:provenance.libraryCommit,geometryReadback:false,inkReadback:'once during preparation, genuine source-text native raster only'};
   return last;
  }
  return Object.freeze({element,canvas,libraryCommit:provenance.libraryCommit,sourceCount:from.length,targetCount:to.length,durationSeconds,readingTravel:travel,revealFront(elapsed){check();return kernel.invokeValue('reveal_advance',[settings,0,elapsed]);},sample(q,options={}){const serial=++generation;const job=tail.then(()=>render(q,options,serial));tail=job.catch(()=>{});return job;},receipt:()=>last,close});
 }catch(error){close();throw error;}
}
