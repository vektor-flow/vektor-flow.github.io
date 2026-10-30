import {certifiedNativeRegionMesh} from './vf-native-certified-samples.mjs';

const need=(v,code)=>{if(!v)throw Object.assign(Error(code),{code,status:'BLOCKED'});};
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
const numberKey=n=>Object.is(n,-0)?'-0':String(n);
const exactKey=v=>JSON.stringify(v,(_,x)=>typeof x==='number'?{binary64:numberKey(x)}:x);
const immutableCommands=new WeakMap();
function commandSnapshot(input){
 let known=immutableCommands.get(input);if(known)return known;
 const commands=input.map(c=>{need(Array.isArray(c)&&['M','L','C','Z'].includes(c[0])&&c.length===({M:3,L:3,C:7,Z:1}[c[0]])&&c.slice(1).every(Number.isFinite),'OUTLINE_CACHE_COMMAND');return [...c];});
 freeze(commands);known={commands,key:exactKey(commands)};
 // Shallow frozen containers do not establish immutable physical paths.
 if(Object.isFrozen(input)&&input.every(Object.isFrozen))immutableCommands.set(input,known);
 immutableCommands.set(commands,known);return known;
}
function estimate(value){let bytes=0;const seen=new WeakSet(),pending=[value];while(pending.length){const v=pending.pop();if(v&&typeof v==='object'){if(seen.has(v))continue;seen.add(v);bytes+=128;if(Array.isArray(v)){bytes+=v.length*16;for(const x of v)pending.push(x);}else for(const [k,x] of Object.entries(v)){bytes+=128+k.length*2;pending.push(x);}}else bytes+=typeof v==='string'?64+v.length*2:16;}return bytes;}
const data=new DataView(new ArrayBuffer(8));
function dyad(x){
 need(Number.isFinite(x),'OUTLINE_CACHE_NONFINITE');data.setFloat64(0,x);
 const hi=data.getUint32(0),lo=data.getUint32(4),e=(hi>>>20)&2047;
 return {n:((BigInt(hi&1048575)<<32n)|BigInt(lo)|(e?1n<<52n:0n))*(hi>>>31?-1n:1n),e:e?e-1075:-1074};
}
function differenceIs(a,b,c){const x=dyad(a),y=dyad(b),z=dyad(c),e=Math.min(x.e,y.e,z.e);return (x.n<<BigInt(x.e-e))-(y.n<<BigInt(y.e-e))===(z.n<<BigInt(z.e-e));}

/** Exact translation equivalence, never rounded/quantized phase equality.
 * A quarter CSS pixel is an integer AA-sample translation at DPR 1, 2 AND 3.
 * Subtraction must be exact over the original binary64 inputs. Failure does
 * not round a phase into another cache entry: it uses the complete matrix.
 */
export function samplePhase(matrix){
 need(Array.isArray(matrix)&&matrix.length===6&&matrix.every(Number.isFinite),'OUTLINE_CACHE_MATRIX');
 const shifts=matrix.slice(4).map(x=>Math.floor(x*4)/4),phase=matrix.slice(4).map((x,i)=>x-shifts[i]);
 if(!shifts.every(Number.isFinite)||!phase.every((x,i)=>differenceIs(matrix[i+4],shifts[i],x)))return {matrix:[...matrix],shift:[0,0],normalized:false};
 return {matrix:[...matrix.slice(0,4),...phase],shift:shifts,normalized:true};
}

/** Identity is a collision-free full physical-content key, not a glyph ID or
 * supplied digest. The caller's sealed resource closure additionally binds the
 * actual font program/metrics bytes. Current commands and metrics are copied
 * before admission. A changed revision, program, metrics, or outline cannot
 * hit a previous entry even if its public glyph ID is unchanged.
 */
export function snapshotOutline(input){
 need(input&&Array.isArray(input.commands)&&input.commands.length>0&&input.commands.length<=8192,'OUTLINE_CACHE_COMMANDS');
 const physicalCommands=commandSnapshot(input.commands),commands=physicalCommands.commands;
 const p=input.provenance;
 need(typeof p?.engineIdentity==='string'&&p.engineIdentity.length>0&&typeof p.resourceIdentity==='string'&&p.resourceIdentity.length>0&&typeof p.source==='string','NATIVE_ACCURACY_PROVENANCE');
 need((input.clips===undefined||(Array.isArray(input.clips)&&input.clips.length===0))&&(input.fillRule===undefined||input.fillRule==='nonzero'),'NATIVE_ACCURACY_CLIP_OR_FILL_PROFILE');
 const color=[...(input.color??[0,0,0,1])];need(['[0,0,0,1]','[1,0,0,0.5]'].includes(JSON.stringify(color)),'NATIVE_ACCURACY_COLOR_PROFILE');
 need(Array.isArray(input.matrix)&&input.matrix.length===6&&input.matrix.every(Number.isFinite),'OUTLINE_CACHE_MATRIX');
 const provenance=structuredClone(p),physical=structuredClone(input.physicalIdentity??null);
 const shapeKey=exactKey([physicalCommands.key,p.engineIdentity,p.resourceIdentity,p.fontProgramSha256??null,p.fontMetricsSha256??null,p.fontRevision??null,physical]);
 return {commands,matrix:[...input.matrix],color,provenance,physicalIdentity:physical,shapeKey};
}

// An upper bound for the cubic's distance to the chord AT THE SAME PARAMETER.
// Unlike distance to the infinite chord line, this catches collinear overshoot
// and reversals. No inverse transform or fitted reference outline is used.
function bound(p){
 const a=p[0],d=p[3];let result=0;
 for(let k=0;k<2;k++)result+=Math.max(Math.abs(p[1][k]-(2*a[k]+d[k])/3),Math.abs(p[2][k]-(a[k]+2*d[k])/3));
 // Conservative arithmetic envelope for finite bounded source coordinates.
 const magnitude=Math.max(1,...p.flat().map(Math.abs));return result+128*Number.EPSILON*magnitude;
}
const midpoint=(a,b)=>a.map((v,k)=>v/2+b[k]/2);
function split(p){const [a,b,c,d]=p,ab=midpoint(a,b),bc=midpoint(b,c),cd=midpoint(c,d),abc=midpoint(ab,bc),bcd=midpoint(bc,cd),m=midpoint(abc,bcd);return [[a,ab,abc,m],[m,bcd,cd,d]];}

/** Physical-space contour certificate, reusable within a conservative device
 * scale tier. This certificate ALONE does not authorize a draw or an AA PASS.
 * Exact device-space winding/sample certification below remains compulsory.
 */
export function certifyOutlineGeometry(commands,{scaleBound=1,toleranceDevice=.04,maxSegments=65536,maxDepth=24}={}){
 need(Number.isFinite(scaleBound)&&scaleBound>0&&Number.isFinite(toleranceDevice)&&toleranceDevice>0&&toleranceDevice<=.1&&Number.isSafeInteger(maxSegments)&&maxSegments>0&&Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=40,'OUTLINE_CACHE_GEOMETRY_CONFIG');
 const rings=[],segments=[];let ring,current,origin,maxError=0,nodes=0;
 function curve(p,depth,rounding=0){
  need(++nodes<=maxSegments*2,'OUTLINE_CACHE_GEOMETRY_WORK');
  const error=(bound(p)+rounding)*scaleBound;
  if(error<=toleranceDevice){need(segments.length<maxSegments,'OUTLINE_CACHE_SEGMENTS');segments.push({controls:p.map(q=>[...q]),errorDevice:error});maxError=Math.max(maxError,error);ring.push([...p[3]]);return;}
  need(depth<maxDepth,'OUTLINE_CACHE_GEOMETRY_DEPTH');
  const next=rounding+32*Number.EPSILON*Math.max(1,...p.flat().map(Math.abs));
  for(const q of split(p))curve(q,depth+1,next);
 }
 for(const c of commands){
  need(Array.isArray(c)&&c.slice(1).every(v=>Number.isFinite(v)&&Math.abs(v)<=65536),'OUTLINE_CACHE_GEOMETRY_RANGE');
  if(c[0]==='M'){need(!ring&&c.length===3,'NATIVE_SAMPLE_PATH');current=c.slice(1);origin=current;ring=[[...current]];}
  else if(c[0]==='L'){need(ring&&c.length===3,'NATIVE_SAMPLE_PATH');current=c.slice(1);ring.push([...current]);}
  else if(c[0]==='C'){need(ring&&c.length===7,'NATIVE_SAMPLE_PATH');const end=c.slice(5);curve([current,c.slice(1,3),c.slice(3,5),end],0);current=end;}
  else if(c[0]==='Z'){need(ring&&c.length===1,'NATIVE_SAMPLE_PATH');rings.push(ring);ring=null;current=origin;}
  else need(false,'NATIVE_SAMPLE_OPERATOR');
 }
 need(!ring&&rings.length>0,'NATIVE_SAMPLE_UNCLOSED_OR_LIMIT');
 return freeze({rings,segments,nodes,scaleBound,maxErrorDevice:maxError,toleranceDevice,AAQualification:'NONE; exact device sample proof required',algorithm:'same-parameter-control-hull/L1/roundoff-envelope-v1'});
}

export function deviceScaleBound(matrix,pixelRatio){
 need(matrix?.length===6&&matrix.every(Number.isFinite)&&Number.isInteger(pixelRatio)&&pixelRatio>=1&&pixelRatio<=3,'OUTLINE_CACHE_MATRIX');
 // Frobenius norm bounds every affine orientation including shears and
 // near-singular maps. No division by determinant or minimum singular value.
 const v=Math.hypot(...matrix.slice(0,4))*pixelRatio*(1+32*Number.EPSILON);
 need(Number.isFinite(v)&&v>0,'OUTLINE_CACHE_DEGENERATE');return 2**Math.ceil(Math.log2(v));
}

/** Per-owner LRU. Unique geometry/proof work and resident bytes have separate
 * budgets from O(N) instance validation. All current-view sample data includes
 * exact linear map, exact phase, DPR, and algorithm/depth identities.
 * Public entries are frozen and the internal maps never escape the owner.
 */
export function createCertifiedOutlineCache({maxEntries=4096,maxBytes=134217728,maxNewProofs=4096,maxNewNodes=2000000,maxNewPixels=1048576,maxGeometryNodes=2000000,maxTriangles=131072,maxDepth=48,toleranceDevice=.04}={}){
 for(const n of [maxEntries,maxBytes,maxNewProofs,maxNewNodes,maxNewPixels,maxGeometryNodes,maxTriangles])need(Number.isSafeInteger(n)&&n>0,'OUTLINE_CACHE_LIMIT');
 need(Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=64,'NATIVE_SAMPLE_LIMIT');
 const geometry=new Map(),samples=new Map(),pinned=new Set();let bytes=0,closed=false,clock=0,stats={};
 function reset(){stats={instances:0,geometryBuilds:0,sampleBuilds:0,hits:0,newNodes:0,newPixels:0,newGeometryNodes:0};}
 reset();
 function live(){need(!closed,'OUTLINE_CACHE_CLOSED');}
 function insert(map,key,value,size){
  need(size<=maxBytes,'OUTLINE_CACHE_BYTES');
  while(geometry.size+samples.size>=maxEntries||bytes+size>maxBytes){
   let victim;for(const m of [geometry,samples])for(const [k,v] of m)if(!pinned.has(v.value)&&(!victim||v.used<victim.value.used))victim={m,k,value:v};
   need(victim,'OUTLINE_CACHE_BYTES');victim.m.delete(victim.k);bytes-=victim.value.bytes;
  }
  map.set(key,{value,bytes:size,used:++clock});bytes+=size;pinned.add(value);return value;
 }
 function hit(map,key){const v=map.get(key);if(v){v.used=++clock;stats.hits++;pinned.add(v.value);return v.value;}}
 function get(input,{pixelRatio=1}={}){
  live();const s=snapshotOutline(input),scaleBound=deviceScaleBound(s.matrix,pixelRatio);
  // Each request snapshots and validates placement/source/material, including
  // cache hits; no authority follows a spelling, mutable object, or glyph ID.
  stats.instances++;
  const gKey=exactKey([s.shapeKey,scaleBound,toleranceDevice,'outline-cache/1']);let contour=hit(geometry,gKey);
  if(!contour){
   const remaining=maxGeometryNodes-stats.newGeometryNodes;need(remaining>0,'OUTLINE_CACHE_GEOMETRY_WORK');
   contour=certifyOutlineGeometry(s.commands,{scaleBound,toleranceDevice,maxSegments:Math.max(1,Math.floor(remaining/2))});
   stats.newGeometryNodes+=contour.nodes;need(stats.newGeometryNodes<=maxGeometryNodes,'OUTLINE_CACHE_GEOMETRY_WORK');stats.geometryBuilds++;
   insert(geometry,gKey,contour,estimate(contour)+gKey.length*2+256);
  }
  const phase=samplePhase(s.matrix),key=exactKey([s.shapeKey,phase.matrix,pixelRatio,maxDepth,'exact-dyadic-AA16-region/1']);let template=hit(samples,key);
  if(!template){
   need(stats.sampleBuilds<maxNewProofs,'OUTLINE_CACHE_NEW_PROOF_BUDGET');
   // Shift the canonical physical curve into a positive viewport, certify the
   // ENTIRE hull, and let the real GPU viewport clip translated sample cells.
   // No cache key depends on which part happened to be visible last frame.
   const points=s.commands.flatMap(c=>{const out=[];for(let k=1;k<c.length;k+=2)out.push([c[k],c[k+1]]);return out;});
   const coords=points.map(p=>[phase.matrix[0]*p[0]+phase.matrix[2]*p[1]+phase.matrix[4],phase.matrix[1]*p[0]+phase.matrix[3]*p[1]+phase.matrix[5]]);
   const pad=[0,1].map(k=>2-Math.floor(Math.min(...coords.map(p=>p[k]))));
   const canonical=[...phase.matrix.slice(0,4),phase.matrix[4]+pad[0],phase.matrix[5]+pad[1]];
   need(canonical.slice(4).every((v,i)=>differenceIs(v,pad[i],phase.matrix[i+4])),'OUTLINE_CACHE_TRANSLATION_EXACTNESS');
   const extent=[0,1].map(k=>Math.ceil(Math.max(...coords.map(p=>p[k]))+pad[k])+2);
   const nodes=maxNewNodes-stats.newNodes,pixels=maxNewPixels-stats.newPixels;need(nodes>0&&pixels>0,'OUTLINE_CACHE_NEW_WORK_BUDGET');
   const mesh=certifiedNativeRegionMesh(s.commands,canonical,{width:extent[0],height:extent[1],pixelRatio,maxPixels:pixels,maxNodes:nodes,maxDepth,maxTriangles:Math.min(maxTriangles,Math.max(1,Math.floor((maxBytes-bytes)/1024)))});
   const [x0,y0,x1,y1]=mesh.bounds;need(x0>0&&y0>0&&x1<extent[0]*pixelRatio&&y1<extent[1]*pixelRatio,'OUTLINE_CACHE_UNCLIPPED_PROOF');
   need(mesh.triangles.length<=maxTriangles,'OUTLINE_CACHE_TRIANGLES');
   stats.newNodes+=mesh.stats.nodes;stats.newPixels+=(x1-x0)*(y1-y0);stats.sampleBuilds++;
   template=freeze({commands:s.commands,shapeKey:s.shapeKey,triangles:mesh.triangles,rows:mesh.rows,pad,canonical,pixelRatio,bounds:mesh.bounds,stats:mesh.stats,contour,proof:'exact original cubic/nonzero/AA16'});
   insert(samples,key,template,estimate(template)+key.length*2+256);
  }
  const translation=phase.shift.map((v,k)=>v-template.pad[k]);
  need(translation.every((v,k)=>differenceIs(s.matrix[k+4],v,template.canonical[k+4])),'OUTLINE_CACHE_TRANSLATION_EXACTNESS');
  return freeze({template,translation,color:s.color,provenance:s.provenance,commands:template.commands,matrix:s.matrix,shapeKey:template.shapeKey,contour});
 }
 return Object.freeze({get,begin(){live();reset();pinned.clear();},statistics(){return {...stats,entries:geometry.size+samples.size,bytes,maxEntries,maxBytes,maxNewProofs,maxNewNodes,maxNewPixels};},clear(){live();geometry.clear();samples.clear();pinned.clear();bytes=0;},close(){geometry.clear();samples.clear();pinned.clear();bytes=0;closed=true;}});
}
