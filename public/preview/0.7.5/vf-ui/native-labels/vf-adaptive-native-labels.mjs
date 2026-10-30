import {createSpatialRanges} from './vf-spatial-ranges.mjs';
import {prepareNativeLabelGeometry} from './vf-native-plot-labels.mjs';
import {nativeOutlineCommands} from './vf-plot-pdf-commands.mjs';
import {nativeAccuracySourceOutlines} from './vf-native-accuracy-source.mjs';
const need=(v,c)=>{if(!v)throw Error(c);};
// Cubic Bezier curves stay within their control hull. These bounds include ink
// independent of tessellation, plus native logical metrics for selection.
export function nativeControlBounds(lease,vectors){
 const b=lease.box,out=[0,-b.height,b.width,b.depth];
 const add=(x,y)=>{out[0]=Math.min(out[0],x);out[1]=Math.min(out[1],y);out[2]=Math.max(out[2],x);out[3]=Math.max(out[3],y);};
 for(const item of b.items){need(!item.clip&&!item.crop,'ADAPTIVE_NATIVE_CLIP');
  if(item.kind==='rule'){add(item.x,item.y);add(item.x+item.width,item.y+item.height);continue;}
  need(item.kind==='glyph','ADAPTIVE_NATIVE_ITEM');const path=vectors.paths[vectors.keys[item.key]];need(path,'ADAPTIVE_NATIVE_PATH');
  for(const c of nativeOutlineCommands(path.operators))for(let j=1;j+1<c.length;j+=2)add(item.x+c[j]*(item.sx??1),item.y+c[j+1]*(item.sy??1));
 }return out;
}
function operatorNorm(c){const a=c[0]*c[0]+c[1]*c[1],b=c[2]*c[2]+c[3]*c[3],d=c[0]*c[2]+c[1]*c[3];return Math.sqrt((a+b+Math.hypot(a-b,2*d))/2);}
export async function createAdaptiveNativeLabelBatches({typography,specs,coordinates,pixelRatio=globalThis.devicePixelRatio||1,toleranceDevice=.04,maxMeshLevels=4,maxMeshBytes=134217728,onProgress=()=>{}}={}){
 need(typography?.prepare&&coordinates?.worldToScreen&&Array.isArray(specs)&&specs.length<=10000,'ADAPTIVE_NATIVE_INPUT');
 need(pixelRatio>0&&toleranceDevice>0&&toleranceDevice<=.05&&Number.isInteger(maxMeshLevels)&&maxMeshLevels>=1&&maxMeshLevels<=8&&Number.isSafeInteger(maxMeshBytes)&&maxMeshBytes>0&&maxMeshBytes<=268435456,'ADAPTIVE_NATIVE_LIMIT');
 const groups=new Map(),labels=[],byId=new Map();let closed=false,meshBuilds=0,meshBuildMs=0,meshCPUBytes=0,meshClock=0,last=null;
 try{
  for(const input of specs){need(input.kind==='math'&&typeof input.id==='string'&&input.id.length>0&&!byId.has(input.id)&&input.anchor?.length===2&&input.anchor.every(Number.isFinite)&&input.scale>0&&Number.isFinite(input.scale)&&(input.sizeSpace??'world')==='world','ADAPTIVE_NATIVE_SPEC');
   need(input.font_size===undefined,'ADAPTIVE_NATIVE_FONT_SIZE_PROFILE_UNQUALIFIED');
   need(!input.color||JSON.stringify(input.color)==='[0,0,0,1]','ADAPTIVE_NATIVE_COLOR_PROFILE');
   const spec=Object.freeze({...input,anchor:Object.freeze([...input.anchor])}),run={kind:spec.kind,source:spec.source,display:spec.display??false,...(spec.font_size===undefined?{}:{font_size:spec.font_size})},key=JSON.stringify([typography.engineIdentity,typography.resourceIdentity,run]);
   let g=groups.get(key);if(!g){const lease=await typography.prepare(run);g={id:groups.size,key,lease,labels:[],meshes:new Map(),maxScale:0,bounds:nativeControlBounds(lease,typography.vectors)};groups.set(key,g);}
   const label={spec,group:g,index:g.labels.length};g.labels.push(label);g.maxScale=Math.max(g.maxScale,spec.scale);labels.push(label);byId.set(spec.id,label);
   if(labels.length%1000===0)await onProgress({labels:labels.length,distinct:groups.size});
  }
  for(const g of groups.values()){g.instances=new Float32Array(g.labels.length*4);
   for(let i=0;i<g.labels.length;i++){const s=g.labels[i].spec;g.instances.set([s.anchor[0],s.anchor[1],s.scale,0],i*4);g.maxScale=Math.max(g.maxScale,g.instances[i*4+2]);}
   // Immutable float32 placements are the actual GPU source; bounds include its
   // rounding, native control hulls, and no reference supplied positions.
   g.tree=createSpatialRanges(g.labels.length,i=>{const a=g.instances.subarray(i*4,i*4+4),b=g.bounds,z=a[2];return [a[0]+b[0]*z,a[1]-b[3]*z,0,a[0]+b[2]*z,a[1]-b[1]*z,0];},{leafSize:1});
  }
  const active=[];
  function frame(c,width,height){need(!closed,'ADAPTIVE_NATIVE_CLOSED');const begin=performance.now(),scale=operatorNorm(c)*pixelRatio;active.length=0;const pinned=new Set();let submitted=0,triangles=0,visited=0,misses=0;
   for(const g of groups.values()){const q=g.tree.query([c[0],c[1],c[2],c[3],0,0,c[4],c[5]],width,height,1);visited+=q.visited;if(!q.submitted)continue;
    const projected=scale*g.maxScale,bound=2**Math.ceil(Math.log2(Math.max(projected,1/1024))),key=String(bound);let mesh=g.meshes.get(key);
    if(!mesh){const t=performance.now(),geometry=prepareNativeLabelGeometry(g.lease,typography.vectors,[1,0,0,1,0,0],{elementId:'adaptive-template:'+g.id,pixelRatio:1,tolerance:toleranceDevice/bound});
     const vertices=new Float32Array(geometry.triangles.length*18);let at=0;for(const triangle of geometry.triangles)for(const p of triangle.points){vertices.set([p[0],p[1],...triangle.color],at);at+=6;}
     mesh={key,vertices,projectedBoundDevice:bound,toleranceLocal:toleranceDevice/bound,triangles:geometry.triangles.length};
     if(g.meshes.size>=maxMeshLevels){const oldKey=g.meshes.keys().next().value;meshCPUBytes-=g.meshes.get(oldKey).vertices.byteLength;g.meshes.delete(oldKey);}
     while(meshCPUBytes+vertices.byteLength>maxMeshBytes){let victim=null;for(const source of groups.values())for(const [k,m] of source.meshes)if(!pinned.has(m)&&(!victim||m.used<victim.mesh.used))victim={source,k,mesh:m};need(victim,'ADAPTIVE_NATIVE_MESH_BUDGET');meshCPUBytes-=victim.mesh.vertices.byteLength;victim.source.meshes.delete(victim.k);}
     meshCPUBytes+=vertices.byteLength;g.meshes.set(key,mesh);meshBuilds++;misses++;meshBuildMs+=performance.now()-t;
    }
    mesh.used=++meshClock;pinned.add(mesh);active.push({group:g,mesh,...q});submitted+=q.submitted;triangles+=mesh.triangles*q.submitted;
   }
   last={resident:labels.length,submitted,triangles,visited,activeGroups:active.length,meshMisses:misses,cullAndMeshMs:performance.now()-begin};return active;
  }
  function camera(){const o=coordinates.worldToScreen([0,0]),x=coordinates.worldToScreen([1,0]),y=coordinates.worldToScreen([0,1]);return [x[0]-o[0],x[1]-o[1],y[0]-o[0],y[1]-o[1],...o];}
  function geometryFor(id){const l=byId.get(id);need(l,'ADAPTIVE_NATIVE_ELEMENT');const c=camera(),a=l.spec.anchor,z=l.spec.scale;return prepareNativeLabelGeometry(l.group.lease,typography.vectors,[c[0]*z,c[1]*z,-c[2]*z,-c[3]*z,c[0]*a[0]+c[2]*a[1]+c[4],c[1]*a[0]+c[3]*a[1]+c[5]],{elementId:id,pixelRatio,tolerance:toleranceDevice});}
  function receipt(){return {labels:labels.length,distinctSources:groups.size,glyphInstances:labels.reduce((n,l)=>n+l.group.lease.box.items.filter(i=>i.kind==='glyph').length,0),ruleInstances:labels.reduce((n,l)=>n+l.group.lease.box.items.filter(i=>i.kind==='rule').length,0),meshBuilds,meshBuildMs,maxMeshLevels,maxMeshBytes,meshCPUBytes,toleranceDevice,profile:'default-native9a86-inline10/7/5',font_size:'explicit unsupported until independent profile qualification',downsampling:false,last};}
  return {groups,labels,frame,camera,receipt,nativeSourceOutlines:(c,limits)=>{need(!closed,'ADAPTIVE_NATIVE_CLOSED');return nativeAccuracySourceOutlines(groups,typography.vectors,c,limits);},drawPlan:()=>active.map(b=>({groupId:b.group.id,ranges:Array.from(b.ranges.subarray(0,b.rangeCount*2)),vertexCount:b.mesh.vertices.length/6})),statistics:()=>({...last,meshBuilds,meshBuildMs,meshCPUBytes,maxMeshBytes}),geometryFor,
   selectionObjects:ids=>ids.flatMap(id=>geometryFor(id).objects),
   close(){if(closed)return;closed=true;for(const g of groups.values()){g.lease.release();g.meshes.clear();}groups.clear();labels.length=0;byId.clear();active.length=0;}};
 }catch(e){for(const g of groups.values())g.lease.release();throw e;}
}
