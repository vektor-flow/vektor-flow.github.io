import {nativeOutlineCommands} from './vf-plot-pdf-commands.mjs';
const physicalMemo=new WeakMap();
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
const need=(v,c)=>{if(!v)throw Object.assign(Error(c),{code:c,status:'BLOCKED'});};
/** Read physical paths and CURRENT native item placements, never flattened
 * meshes, cached control bounds or inferred character names. Group draw order
 * matches the retained renderer. Changed text must obtain a current native
 * lease; changed time/coordinates/placement is read again on every request.
 */
export function nativeAccuracySourceOutlines(groups,vectors,camera,{maxInstances=100000}={}){
 need(camera?.length===6&&camera.every(Number.isFinite),'NATIVE_ACCURACY_CAMERA');
 const c=camera,out=[],paths=new Map();let memo=physicalMemo.get(vectors);if(!memo){memo={entries:new Map(),bytes:0};physicalMemo.set(vectors,memo);}
 need(Number.isSafeInteger(maxInstances)&&maxInstances>0,'NATIVE_ACCURACY_INSTANCE_LIMIT');
 for(const group of groups.values())for(const label of group.labels){
  const {lease}=group,s=label.spec,a=s.anchor,z=s.scale;
  need(a?.length===2&&a.every(Number.isFinite)&&Number.isFinite(z)&&z>0,'NATIVE_ACCURACY_INSTANCE_PLACEMENT');
  need(lease?.box&&[lease.box.width,lease.box.height,lease.box.depth].every(Number.isFinite)&&lease.box.width>=0&&Array.isArray(lease.box.items),'NATIVE_ACCURACY_SOURCE_METRICS');
  const base=[c[0]*z,c[1]*z,-c[2]*z,-c[3]*z,c[0]*a[0]+c[2]*a[1]+c[4],c[1]*a[0]+c[3]*a[1]+c[5]];
  for(const [itemIndex,item] of lease.box.items.entries()){
   need(out.length<maxInstances,'NATIVE_ACCURACY_INSTANCE_BUDGET');
   need(!item.clip&&!item.crop,'NATIVE_ACCURACY_ITEM_CLIP_PROFILE');need([item.x,item.y,item.sx??1,item.sy??1].every(Number.isFinite),'NATIVE_ACCURACY_ITEM_PLACEMENT');let commands,glyphKey,physicalIdentity;
   if(item.kind==='glyph'){
    glyphKey=vectors.keys?.[item.key];const path=vectors.paths?.[glyphKey];need(path,'NATIVE_ACCURACY_PHYSICAL_GLYPH');let physical=paths.get(glyphKey);if(!physical||physical.operators!==path.operators){physical=memo.entries.get(glyphKey);if(!physical||physical.operators!==path.operators){const commands=freeze(nativeOutlineCommands(path.operators)),bytes=path.operators.length*8+commands.length*256;need(bytes<=16777216,'NATIVE_ACCURACY_PHYSICAL_CACHE_BYTES');if(physical){memo.bytes-=physical.bytes;memo.entries.delete(glyphKey);}while(memo.entries.size>=4096||memo.bytes+bytes>16777216){const key=memo.entries.keys().next().value;memo.bytes-=memo.entries.get(key).bytes;memo.entries.delete(key);}physical={operators:path.operators,commands,bytes};memo.entries.set(glyphKey,physical);memo.bytes+=bytes;}paths.set(glyphKey,physical);}commands=physical.commands;physicalIdentity={mappingSha256:vectors.mappingSha256??null,glyphKey,operators:path.operators,metrics:path.bounds??null,fontBinding:vectors.fontBindings?.[item.key]??null,resourceClosure:vectors.resourceClosureSha256??null};
   }else {need(item.kind==='rule'&&[item.width,item.height].every(n=>Number.isFinite(n)&&n>=0),'NATIVE_ACCURACY_ITEM_PROFILE');commands=[['M',0,0],['L',item.width,0],['L',item.width,item.height],['L',0,item.height],['Z']];glyphKey=null;}
   const sx=item.sx??1,sy=item.sy??1;
   const controlMagnitude=[0,0];for(const command of commands)for(let j=1;j+1<command.length;j+=2){controlMagnitude[0]=Math.max(controlMagnitude[0],Math.abs(command[j]));controlMagnitude[1]=Math.max(controlMagnitude[1],Math.abs(command[j+1]));}
   // Lost low terms in an identity-camera binary64 pose must not disappear
   // when the shader later composes another camera. Bound both CPU evaluation
   // orders by gamma32 times these UNcancelled physical term magnitudes.
   const programRoundoffMagnitude=[Math.abs(z*sx)*controlMagnitude[0]+Math.abs(z*item.x)+Math.abs(a[0]),Math.abs(z*sy)*controlMagnitude[1]+Math.abs(z*item.y)+Math.abs(a[1])].map(v=>v*(1+64*Number.EPSILON));
   out.push({commands,programRoundoffMagnitude,programTransformRecipe:[z,a[0],a[1],item.x,item.y,sx,sy],matrix:[base[0]*sx,base[1]*sx,base[2]*sy,base[3]*sy,base[0]*item.x+base[2]*item.y+base[4],base[1]*item.x+base[3]*item.y+base[5]],
    physicalIdentity:physicalIdentity??{kind:'native-rule',width:item.width,height:item.height},color:item.color??s.color??[0,0,0,1],fillRule:'nonzero',provenance:{...lease.prepared.provenance,
     engineIdentity:lease.prepared.provenance.engineIdentity,resourceIdentity:lease.prepared.provenance.resourceIdentity,
     source:lease.run.source??lease.run.text,elementId:s.id,itemIndex,glyphKey,nativeItemKey:item.key??null,
     sourceGeneration:lease.prepared.provenance.sourceGeneration??null,size:[sx,sy],placement:[item.x,item.y],sourceBounds:[lease.box.width,lease.box.height,lease.box.depth]}});
  }
 }
 return out;
}
