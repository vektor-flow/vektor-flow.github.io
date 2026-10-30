import {binary64Words,originalSegments} from './vf-native-residual.mjs';
import {snapshotOutline} from './vf-native-outline-cache.mjs';

export const CURVE_PROGRAM_ID='physical-cubic-certified-sparse-replay-AA16/e1176-v1';
export const CURVE_LIMITS=Object.freeze({maxInstances:100000,maxShapes:4096,maxSegments:4096,maxBytes:134217728,maxDepth:24,maxNodes:8192});
export const need=(v,code)=>{if(!v)throw Object.assign(Error(code),{code,status:'BLOCKED',action:'retain previous accepted frame; physical curve program remains unqualified for this view'});};
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
const scratch=new Float32Array(1),word=new Uint32Array(scratch.buffer);
export function nextFloat32(x,up){
 scratch[0]=x;if(x===0){word[0]=up?1:0x80000001;return scratch[0];}
 word[0]+=(x>0)===up?1:-1;return scratch[0];
}
// Exact enclosure of each input binary64, rather than pretending f32 copies
// are the physical font. Values are normal-range bounded before packing.
export function enclose32(x){need(Number.isFinite(x)&&Math.abs(x)<=65536,'CURVE_PROGRAM_NUMBER_RANGE');const f=Math.fround(x);return [f>x?nextFloat32(f,false):f,f<x?nextFloat32(f,true):f];}
const point=p=>[...enclose32(p[0]),...enclose32(p[1])];
export function compileCurveProgram(commands,{maxSegments=CURVE_LIMITS.maxSegments}={}){
 const segments=[];let current,origin,open=false;
 const add=p=>{need(segments.length<maxSegments,'CURVE_PROGRAM_SEGMENT_LIMIT');segments.push(p.map(point));};
 for(const c of commands){
  need(Array.isArray(c)&&c.length===({M:3,L:3,C:7,Z:1}[c[0]])&&c.slice(1).every(x=>Number.isFinite(x)&&Math.abs(x)<=65536),'CURVE_PROGRAM_COMMAND');
  if(c[0]==='M'){need(!open,'CURVE_PROGRAM_PATH');current=c.slice(1);origin=current;open=true;}
  else if(c[0]==='L'){need(open,'CURVE_PROGRAM_PATH');const end=c.slice(1);add([current,current,end,end]);current=end;}
  else if(c[0]==='C'){need(open,'CURVE_PROGRAM_PATH');const end=c.slice(5);add([current,c.slice(1,3),c.slice(3,5),end]);current=end;}
  else {need(open,'CURVE_PROGRAM_PATH');add([current,current,origin,origin]);open=false;current=origin;}
 }
 need(!open&&segments.length>0,'CURVE_PROGRAM_UNCLOSED');
 const p=segments.flat(),bounds=[Math.min(...p.map(v=>v[0])),Math.min(...p.map(v=>v[2])),Math.max(...p.map(v=>v[1])),Math.max(...p.map(v=>v[3]))];
 return freeze({id:CURVE_PROGRAM_ID,segments,bounds,commands:commands.map(c=>[...c]),certificate:'exact input binary64 enclosed by binary32 control hulls; no pose or AA phase baked; NOT an AA mask certificate'});
}

/** Compile physical programs once and keep complete instance order. Matrix
 * records are enclosures of source pose, not device AA phase keys. A new view
 * changes only camera uniforms. A changed physical path/revision/material/
 * pose requires a replacement packet, with old packet retained on rejection.
 */
export function prepareCurveProgramScene(outlines,limits={}){
 const cfg={...CURVE_LIMITS,...limits};for(const n of Object.values(cfg))need(Number.isSafeInteger(n)&&n>0,'CURVE_PROGRAM_LIMIT');
 need(cfg.maxSegments<=4096&&cfg.maxDepth<=24&&cfg.maxNodes<=2147483647,'CURVE_PROGRAM_SHADER_LIMIT');
 need(Array.isArray(outlines)&&outlines.length<=cfg.maxInstances,'CURVE_PROGRAM_INSTANCE_LIMIT');
 const keys=new Map(),programs=[],sources=[],instances=new Float32Array(outlines.length*28),exactInstances=new Uint32Array(outlines.length*32);let segmentOffset=0,instanceControlCount=0;
 for(const [i,input] of outlines.entries()){
  const s=snapshotOutline(input);let index=keys.get(s.shapeKey);
  if(index===undefined){need(programs.length<cfg.maxShapes,'CURVE_PROGRAM_SHAPE_LIMIT');index=programs.length;const program=compileCurveProgram(s.commands,cfg);keys.set(s.shapeKey,index);programs.push({program,shapeKey:s.shapeKey,offset:segmentOffset});segmentOffset+=program.segments.length*4;}
  const entry=programs[index],at=i*28;
  instances.set(s.matrix.flatMap(enclose32),at);instances.set(s.color,at+12);instances.set(entry.program.bounds,at+16);// Resident prefix table maps each derived control to its original instance.
  // Above the exact f32 index domain the renderer uses the original inline
  // interval path; it never drops controls or reduces accepted geometry.
  instances.set([entry.offset,entry.program.segments.length,instanceControlCount<2**24?instanceControlCount:0,0],at+20);
  instanceControlCount+=entry.program.segments.length*4;
  const magnitude=input.programRoundoffMagnitude??[0,0];need(Array.isArray(magnitude)&&magnitude.length===2&&magnitude.every(v=>Number.isFinite(v)&&v>=0&&v<=2**40),'CURVE_PROGRAM_ROUNDOFF_MAGNITUDE');
  const upper=magnitude.map(v=>nextFloat32(Math.fround(v),true));instances.set([upper[0],upper[1],0,0],at+24);
  const recipe=input.programTransformRecipe??null;
  need(recipe===null||(Array.isArray(recipe)&&recipe.length===7&&recipe.every(Number.isFinite)),'CURVE_PROGRAM_TRANSFORM_RECIPE');
  if(recipe){const [z,ax,ay,ix,iy,sx,sy]=recipe,expected=[z*sx,0*sx,-0*sy,-z*sy,z*ix+-0*iy+ax,0*ix+-z*iy+ay];need(expected.every((v,k)=>v===s.matrix[k]),'CURVE_PROGRAM_RECIPE_MATRIX');}
  exactInstances.set(s.matrix.flatMap(binary64Words),i*32);
  if(recipe)exactInstances.set(recipe.flatMap(binary64Words),i*32+12);
  exactInstances[i*32+30]=recipe?1:magnitude.some(v=>v!==0)?2:0;
  sources.push(freeze({programTransformRecipe:recipe?[...recipe]:null,commands:entry.program.commands,matrix:s.matrix,color:s.color,provenance:s.provenance,physicalIdentity:s.physicalIdentity,programRoundoffMagnitude:[...magnitude],displayOnly:false}));
 }
 need(segmentOffset<2**24,'CURVE_PROGRAM_EXACT_TEXTURE_INDEX');
 const controls=new Float32Array(segmentOffset*4);for(const p of programs){let at=p.offset*4;for(const s of p.program.segments)for(const q of s){controls.set(q,at);at+=4;}}
 const exactControls=new Uint32Array(segmentOffset*4);
 for(const entry of programs){let at=entry.offset*4;for(const segment of originalSegments(entry.program.commands))for(const q of segment.p){exactControls.set(q.flatMap(binary64Words),at);at+=4;}}
 const bytes=controls.byteLength+instances.byteLength+exactControls.byteLength+exactInstances.byteLength;need(bytes<=cfg.maxBytes,'CURVE_PROGRAM_BYTES');
 return {id:CURVE_PROGRAM_ID,programs,sources,controls,instances,exactControls,exactInstances,instanceControlCount,receipt:{status:'SOURCE_CURVE_PROGRAM_PLAN',programIdentity:CURVE_PROGRAM_ID,instances:outlines.length,outlines:outlines.length,physicalPrograms:programs.length,geometryProofs:programs.length,phaseProofs:0,segments:segmentOffset/4,programBytes:controls.byteLength,instanceBytes:instances.byteLength,exactControlBytes:exactControls.byteLength,exactInstanceBytes:exactInstances.byteLength,bytes,phaseKeys:0,derivedControlCount:instanceControlCount,sourceGeometry:'original M/L/C/Z control hulls, all source ordered instances',hardwareQualification:'UNRUN_CHANGED_COMPONENT',AAQualification:'interval filter then bounded256-bit uint residual proof; any unresolved sample blocks frame',indexed10kAccuracy:'OPEN',indexed10kPerformance:'UNRUN_CHANGED_COMPONENT'}};
}

const sameRecipe=(a,b)=>a===null&&b===null||Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,k)=>Object.is(v,b[k]));
export function curveProgramSceneMatches(packet,outlines){
 if(outlines.length!==packet.sources.length)return false;
 for(let i=0;i<outlines.length;i++){
  const s=snapshotOutline(outlines[i]),old=packet.sources[i],shape=packet.programs.find(p=>p.program.commands===old.commands);
  if(!sameRecipe(outlines[i].programTransformRecipe??null,old.programTransformRecipe)||s.shapeKey!==shape.shapeKey||!s.matrix.every((v,k)=>Object.is(v,old.matrix[k]))||!s.color.every((v,k)=>v===old.color[k])||JSON.stringify(outlines[i].programRoundoffMagnitude??[0,0])!==JSON.stringify(old.programRoundoffMagnitude)||JSON.stringify(s.provenance)!==JSON.stringify(old.provenance))return false;
 }
 return true;
}

// Binary32 interval model for SOURCE controls. Shader operations use the same
// formulas. Eight relative precision units plus a normal floor cover rounding
// of the primitive, error calculation and padded endpoints at precision>=23.
// This is deliberately wider than correctly rounded IEEE arithmetic. Driver
// adherence, shader lowering, coverage and timing require future real checks.
const f=Math.fround,u=2**-20,tiny=2**-100;
export function widen32(a,b=a){const e=f(Math.max(f(Math.max(Math.abs(a),Math.abs(b))*u),tiny));return [f(a-e),f(b+e)];}
export const add32=(a,b)=>widen32(f(a[0]+b[0]),f(a[1]+b[1]));
export function mul32(a,b){const p=[f(a[0]*b[0]),f(a[0]*b[1]),f(a[1]*b[0]),f(a[1]*b[1])];return widen32(Math.min(...p),Math.max(...p));}
const mid=(a,b)=>{const x=mul32(add32(a.slice(0,2),b.slice(0,2)),[.5,.5]),y=mul32(add32(a.slice(2),b.slice(2)),[.5,.5]);return [...x,...y];};
const transform=(p,m)=>[...add32(add32(mul32(m[0],p.slice(0,2)),mul32(m[2],p.slice(2))),m[4]),...add32(add32(mul32(m[1],p.slice(0,2)),mul32(m[3],p.slice(2))),m[5])];
export function composeCurveMatrix(camera,pose){return [camera[0]*pose[0]+camera[2]*pose[1],camera[1]*pose[0]+camera[3]*pose[1],camera[0]*pose[2]+camera[2]*pose[3],camera[1]*pose[2]+camera[3]*pose[3],camera[0]*pose[4]+camera[2]*pose[5]+camera[4],camera[1]*pose[4]+camera[3]*pose[5]+camera[5]];}
export function referenceCurveWinding(program,pose,camera,sample,{pixelRatio=1,maxDepth=24,maxNodes=8192,roundoffMagnitude=[0,0]}={}){
 need(Number.isInteger(pixelRatio)&&pixelRatio>=1&&pixelRatio<=3,'CURVE_PROGRAM_DPR');
 need(Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=24&&Number.isInteger(maxNodes)&&maxNodes>0,'CURVE_PROGRAM_WORK_LIMIT');
 const m=pose.map(enclose32),c=camera.map(enclose32);let nodes=0,winding=0;
 const envelope=[0,1].map(k=>f((Math.abs(camera[k])*roundoffMagnitude[0]+Math.abs(camera[k+2])*roundoffMagnitude[1]+Math.abs(camera[k+4]))*2**-46));
 const device=p=>{const t=transform(transform(p,m),c);return [...mul32(add32(t.slice(0,2),[-envelope[0],envelope[0]]),[pixelRatio,pixelRatio]),...mul32(add32(t.slice(2),[-envelope[1],envelope[1]]),[pixelRatio,pixelRatio])];};
 for(const raw of program.segments){const stack=[{p:raw.map(device),d:0}];
  while(stack.length){const {p,d}=stack.pop();if(++nodes>maxNodes)return {resolved:false,reason:'node-budget',nodes};
   if(Math.max(...p.map(v=>v[3]))<=sample[1]||Math.min(...p.map(v=>v[2]))>sample[1]||Math.max(...p.map(v=>v[1]))<=sample[0])continue;
   if(Math.min(...p.map(v=>v[0]))>sample[0]){
    const side=v=>v[3]<=sample[1]?1:v[2]>sample[1]?0:null,a=side(p[0]),b=side(p[3]);
    if(a!==null&&b!==null){winding+=a-b;continue;}
   }
   if(d===maxDepth)return {resolved:false,reason:'interval-boundary-or-depth',nodes};
   const ab=mid(p[0],p[1]),bc=mid(p[1],p[2]),cd=mid(p[2],p[3]),abc=mid(ab,bc),bcd=mid(bc,cd),q=mid(abc,bcd);
   stack.push({p:[q,bcd,cd,p[3]],d:d+1},{p:[p[0],ab,abc,q],d:d+1});
  }
 }
 return {resolved:true,winding,inside:winding!==0,nodes};
}
