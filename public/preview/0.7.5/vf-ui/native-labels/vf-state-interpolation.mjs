import {createSymbolicKernel} from '../vf-symbolic-kernel-runtime.mjs';
import {nativeOutlineRings} from './vf-native-plot-labels.mjs';
const need=(v,c)=>{if(!v)throw Object.assign(Error(c),{code:c});};
const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
export async function loadNativeStateKernel({baseURL=new URL('../artifacts/state-interpolation/',import.meta.url),fetch:fetcher=globalThis.fetch}={}){
 const get=async name=>{const r=await fetcher(new URL(name,baseURL));need(r.ok,'STATE_INTERPOLATION_RESOURCE');return r.arrayBuffer();};
 const provenance=JSON.parse(new TextDecoder().decode(await get('PROVENANCE.json')));
 const [wasm,json]=await Promise.all(['state.wasm','state.json'].map(get));
 need(await digest(wasm)===provenance.artifacts['state.wasm'].sha256&&await digest(json)===provenance.artifacts['state.json'].sha256,'STATE_INTERPOLATION_RESOURCE_CHANGED');
 const module=await WebAssembly.compile(wasm);need(!WebAssembly.Module.imports(module).length,'STATE_INTERPOLATION_HOST_IMPORTS');
 const manifest=JSON.parse(new TextDecoder().decode(json)),instance=new WebAssembly.Instance(module,{});
 return {kernel:createSymbolicKernel({instance,manifest,diagnostics:true}),provenance};
}
const bounds=rings=>{const p=rings.flat();need(p.length>2,'STATE_EMPTY_OUTLINE');return [Math.min(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[0])),Math.max(...p.map(p=>p[1]))];};
const enclosing=objects=>[Math.min(...objects.map(x=>x.bounds[0])),Math.min(...objects.map(x=>x.bounds[1])),Math.max(...objects.map(x=>x.bounds[2])),Math.max(...objects.map(x=>x.bounds[3]))];
const middle=b=>[(b[0]+b[2])/2,(b[1]+b[3])/2];
const signature=s=>JSON.stringify(s.physicalIdentity??s.commands);
function objects(sources){return sources.map(s=>{const rings=nativeOutlineRings(s.commands,s.matrix,{tolerance:.025});return {...s,rings,bounds:bounds(rings)};});}
const groupList=(sources,types)=>sources.flatMap((s,i)=>[types.get(signature(s)),i,1]);
function cohorts(from,to,kernel){
 const a=objects(from),b=objects(to),types=new Map();[...a,...b].forEach(s=>{const key=signature(s);if(!types.has(key))types.set(key,types.size+1);});
 const costs=a.flatMap(x=>b.map(y=>{const p=middle(x.bounds),q=middle(y.bounds);return (p[0]-q[0])**2+(p[1]-q[1])**2;}));
 const match=kernel.invokeValue('reserve_groups',[a.length,b.length,groupList(a,types),groupList(b,types),costs]);
 const used=new Set(match.filter(i=>i>=0)),left=a.map((_,i)=>i).filter(i=>match[i]<0),right=b.map((_,i)=>i).filter(i=>!used.has(i));
 if(left.length&&right.length){const m=kernel.invokeValue('reserve_groups',[left.length,right.length,left.flatMap((_,i)=>[1,i,1]),right.flatMap((_,i)=>[1,i,1]),left.flatMap(i=>right.map(j=>costs[i*b.length+j]))]);m.forEach((j,i)=>{if(j>=0){match[left[i]]=right[j];used.add(right[j]);}});}
 const edges=match.flatMap((j,i)=>j<0?[]:[[i,j]]);
 const nearest=(values)=>kernel.invokeValue('reserve_groups',[1,values.length,[1,0,1],values.flatMap((_,i)=>[1,i,1]),values])[0];
 a.forEach((_,i)=>{if(match[i]<0)edges.push([i,nearest(b.map((_,j)=>costs[i*b.length+j]))]);});
 b.forEach((_,j)=>{if(!used.has(j))edges.push([nearest(a.map((_,i)=>costs[i*b.length+j])),j]);});
 const remaining=new Set(edges),result=[];
 while(remaining.size){const seed=remaining.values().next().value,aa=new Set([seed[0]]),bb=new Set([seed[1]]),part=[];let changed=true;
  while(changed){changed=false;for(const edge of remaining)if(aa.has(edge[0])||bb.has(edge[1])){remaining.delete(edge);part.push(edge);aa.add(edge[0]);bb.add(edge[1]);changed=true;}}
  const ai=[...aa],bi=[...bb];result.push({a:ai.map(i=>a[i]),b:bi.map(j=>b[j]),edges:part.map(([i,j])=>[ai.indexOf(i),bi.indexOf(j)])});
 }return result;
}
function prepareCohort(c,kernel,number,provenance,computeBackend){
 if(c.a.length===1&&c.b.length===1&&JSON.stringify(c.a[0].commands)===JSON.stringify(c.b[0].commands)){
  const changed=c.a[0].matrix.flatMap((v,i)=>v===c.b[0].matrix[i]?[]:[i]);
  if(!changed.length)return ()=>c.a[0];
  const plan=kernel.invokeValue('prepare',[[0,1],[...changed.map(i=>c.a[0].matrix[i]),...changed.map(i=>c.b[0].matrix[i])],changed.length,0,false,false]);
  return q=>{const values=kernel.invokeValue('sample',[plan,q]).value,matrix=[...c.a[0].matrix];changed.forEach((i,j)=>matrix[i]=values[j]);return {...c.a[0],matrix,provenance:{...c.a[0].provenance,interpolation:{libraryCommit:provenance.libraryCommit,coordinate:q}}};};
 }
 const ab=enclosing(c.a),bb=enclosing(c.b),ac=middle(ab),bc=middle(bb),radius=Math.max(ab[2]-ab[0],ab[3]-ab[1],bb[2]-bb[0],bb[3]-bb[1])*.7;
 need(radius>0,'STATE_INTERPOLATION_EXTENT');const centers=[],extents=[],fields=[],size=65;
 for(const [list,center] of [[c.a,ac],[c.b,bc]])for(const item of list){
  const mid=middle(item.bounds),e=[(item.bounds[2]-item.bounds[0])*.6,(item.bounds[3]-item.bounds[1])*.6];need(e.every(v=>v>0),'STATE_INTERPOLATION_OUTLINE_EXTENT');
  centers.push((mid[0]-center[0])/radius,(mid[1]-center[1])/radius);extents.push(e[0]/radius,e[1]/radius);
  const rings=[0],vertices=[];for(const ring of item.rings){for(const p of ring)vertices.push((p[0]-mid[0])/e[0],(p[1]-mid[1])/e[1]);rings.push(vertices.length/2);}
  fields.push(...kernel.invokeValue('contour_field',[vertices,rings,size]));
 }
 const plan=kernel.invokeValue('prepare_geometry',[[0,1],[0,c.a.length,c.a.length+c.b.length],[...c.edges.map(e=>e[0]),...c.edges.map(e=>e[1])],c.edges.length,centers,extents,fields,size,2,0,false,false,0]);
 const translation=kernel.invokeValue('prepare',[[0,1],[...ac,...bc],2,0,false,false]);
 if(computeBackend==='gpu'){
  const id='state-cohort-'+number;let measure;
  const controls=(q,desired=1)=>{const p=kernel.invokeValue('sample',[translation,q]).value;return kernel.invokeValue('gpu_controls',[plan,q,desired,65,129,2*radius,p[0]-radius,p[1]-radius]);};
  const sample=q=>{need(measure,'STATE_GPU_MEASURE_NOT_PREPARED');const desired=kernel.invokeValue('sample',[measure,q]).value[0],p=kernel.invokeValue('sample',[translation,q]).value;
   return {gpuFieldId:id,controls:controls(q,desired),commands:[],matrix:[radius,0,0,radius,p[0]-radius,p[1]-radius],color:[0,0,0,1],provenance:{engineIdentity:'current-vkf-state:'+provenance.artifacts['state.wasm'].sha256,resourceIdentity:c.a[0].provenance.resourceIdentity,source:'native signed-field state interpolation',elementId:id,coordinate:q}};
  };
  sample.gpuPlan={id,plan,extent:2*radius};sample.gpuControls=controls;
  sample.gpuMeasures=values=>{need(values.length===2&&values.every(v=>Number.isFinite(v)&&v>0),'STATE_GPU_ENDPOINT_MEASURE');measure=kernel.invokeValue('prepare',[[0,1],values,1,0,false,false]);};
  return sample;
 }
 const measure=kernel.invokeValue('geometry_measure',[plan,65,[-1,-1],[1,1]]);
 return q=>{
  const frame=kernel.invokeValue('sample_geometry',[plan,measure,q,65,[-1,-1],[1,1],.0001]);
  const surface=kernel.invokeValue('prepare_surface',[plan,q,frame.scale]);
  const axis=Array.from({length:129},(_,i)=>-1+2*i/128);
  const grid=kernel.invokeValue('field_grid2',[surface.values,size,4+size*size,c.edges.length,axis,axis,frame.scale,surface.neck]);
  const fieldVertices=new Float32Array(kernel.invokeValue('contour_mesh',[grid,129,2,[0,0,0,1]]));
  need(fieldVertices.length>0&&fieldVertices.length<=1048576&&fieldVertices.length%18===0,'STATE_INTERPOLATION_CONTOUR_BUDGET');const p=kernel.invokeValue('sample',[translation,q]).value;
  return {fieldVertices,commands:[],matrix:[radius,0,0,radius,p[0]-radius,p[1]-radius],color:[0,0,0,1],fillRule:'nonzero',physicalIdentity:{kind:'native-state-field',libraryCommit:provenance.libraryCommit,cohort:number},provenance:{engineIdentity:'current-vkf-state:'+provenance.artifacts['state.wasm'].sha256,resourceIdentity:c.a[0].provenance.resourceIdentity,source:JSON.stringify([c.a.map(s=>s.provenance.source),c.b.map(s=>s.provenance.source)]),elementId:'state-cohort-'+number,coordinate:q,nativeStateMeasure:frame.measure}};
 };
}
/** Sources are original native glyph/rule outlines, never renderer triangles.
 * Native VKF chooses correspondence, samples scalar/field states and calibrates
 * ink measure. This adapter owns only stable label grouping and renderer data.
 */
export function prepareNativeLabelTransition({from,to,kernel,provenance,computeBackend='gpu'}){
 need(Array.isArray(from)&&Array.isArray(to)&&from.length<=256&&to.length<=256,'STATE_INTERPOLATION_LABEL_BUDGET');
 const labels=new Map();for(const [side,sources] of [['from',from],['to',to]])for(const s of sources){const id=String(s.provenance.elementId);if(!labels.has(id))labels.set(id,{from:[],to:[]});labels.get(id)[side].push(s);}
 const samples=[],reveals=[];let count=0;
 for(const label of labels.values()){
  if(!label.from.length||!label.to.length){reveals.push(label);continue;}
  for(const c of cohorts(label.from,label.to,kernel))samples.push(prepareCohort(c,kernel,count++,provenance,computeBackend));
 }
 const coefficient=kernel.invokeValue('unfold_coefficient',[.32]);
 return Object.freeze({cohorts:count,gpuPlans:samples.filter(s=>s.gpuPlan).map(s=>s.gpuPlan),gpuControls(id,q){const s=samples.find(s=>s.gpuPlan?.id===id);need(s,'STATE_GPU_PLAN');return s.gpuControls(q);},gpuMeasures(id,values){const s=samples.find(s=>s.gpuPlan?.id===id);need(s,'STATE_GPU_PLAN');s.gpuMeasures(values);},sample(q){need(Number.isFinite(q)&&q>=0&&q<=1,'STATE_INTERPOLATION_COORDINATE');if(q===0)return from;if(q===1)return to;const coordinate=kernel.invokeValue('time_coordinate',[q]),out=samples.map(sample=>sample(coordinate));
  for(const label of reveals){const list=label.to.length?label.to:label.from,t=label.to.length?q:1-q;for(const [i,s] of list.entries()){const alpha=kernel.invokeValue('unfold_alpha',[t*2-i/Math.max(1,list.length),4]);if(alpha<=0)continue;const grow=kernel.invokeValue('unfold_growth',[alpha,coefficient]),m=s.matrix,ink=kernel.invokeValue('unfold_ink_color',[alpha,0,0]);out.push({...s,matrix:[m[0]*grow,m[1]*grow,m[2]*grow,m[3]*grow,m[4],m[5]],color:[ink,kernel.invokeValue('unfold_ink_color',[alpha,1,0]),kernel.invokeValue('unfold_ink_color',[alpha,2,0]),alpha]});}}
  return out;
 }});
}
