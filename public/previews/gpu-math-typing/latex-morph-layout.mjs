import {typeset} from './typing-layout.mjs';
import {packLatexItem} from './latex-instances.mjs';

const canonical=value=>JSON.stringify(value,(_key,entry)=>entry&&typeof entry==='object'&&!Array.isArray(entry)?Object.fromEntries(Object.keys(entry).sort().map(key=>[key,entry[key]])):entry);
const same=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));

// Prepare correspondence once from actual LaTeX engine geometry. No frame
// interpolation occurs here. Explicit braces define rigid semantic groups.
// Return params ABI: header [example,q,mode,start,end,extent,N,G], then 16*N
// group-local engine packets, N group IDs, and 6*G GROUP-major origins
// [x0,y0,x1,y1,x2,y2]. Origins are centered in normalized [0,1] viewport units;
// one common fit scale preserves glyph dimensions across all three states.
// Header slots 0..5 are caller-controlled placeholders. Pass values=[0,1,2]
// to morphing.latex_motion.instance; the native kernel owns all interpolation.
// Rule rectangles omit the engine's 1px padding, which that kernel restores.
// Unsupported inventory, incomplete input, material or rigid-group changes throw.
export function prepareLatexStates(sources,data,{color=[.2627,.8274,.8784,1]}={}){
 if(!Array.isArray(sources)||sources.length!==3||sources.some(x=>typeof x!=='string'))throw Error('LaTeX morph requires three source states');
 if(color.length!==4||color.some(x=>!Number.isFinite(x)))throw Error('Invalid LaTeX morph color');
 const layouts=sources.map(source=>{
  const nodes=new WeakMap(),occurrences=new Map();
  const box=typeset(source,data.maps,{onStructure(group,structure){
   if(structure.length!==1)return;const node=structure[0];
   if(node.type!=='group'||!node.children?.length)return;
   let id=nodes.get(node);
   if(!id){const key=canonical(node),occurrence=occurrences.get(key)||0;occurrences.set(key,occurrence+1);id=`group:${key}:${occurrence}`;nodes.set(node,id);}
   // Parent callbacks run after descendants. Spreading engine items preserves
   // this tag through fractions, rows and matrix placement without grouping them.
   for(const item of group.items)item.morphGroup=id;
  }});
  if(!box.complete||box.diagnostics.length)throw Error('LaTeX state is incomplete: '+box.diagnostics.join('; '));
  const leafOccurrences=new Map(),members=new Map(),groups=new Map();
  for(const item of box.items){
   if(!['glyph','rule'].includes(item.kind))throw Error(`Unsupported LaTeX morph item: ${item.kind}`);
   const identity=item.kind==='glyph'?`glyph:${item.key}`:'rule';
   let group=item.morphGroup;
   if(!group){const ordinal=leafOccurrences.get(identity)||0;leafOccurrences.set(identity,ordinal+1);group=`leaf:${identity}:${ordinal}`;}
   const memberBase=group+'|'+identity,ordinal=members.get(memberBase)||0;members.set(memberBase,ordinal+1);
   const packet=packLatexItem(item,data,{scale:1,pixelAlign:false,ink:color});
   if(packet.length!==16||packet.some(x=>!Number.isFinite(x))||packet[2]<0||packet[3]<0)throw Error('Invalid engine instance packet');
   if(packet[12]===1){packet[0]+=1;packet[1]+=1;packet[2]-=2;packet[3]-=2;}
   const entry={id:memberBase+'|'+ordinal,identity,packet};
   if(!groups.has(group))groups.set(group,[]);groups.get(group).push(entry);
  }
  if(!groups.size)throw Error('Empty LaTeX morph state');
  const packets=[...groups.values()].flat().map(x=>x.packet);
  const bounds=[Math.min(...packets.map(p=>p[0])),Math.min(...packets.map(p=>p[1])),Math.max(...packets.map(p=>p[0]+p[2])),Math.max(...packets.map(p=>p[1]+p[3]))];
  return {groups,bounds,diagnostics:[...box.diagnostics]};
 });
 const groupKeys=[...layouts[0].groups.keys()];
 const maximum=Math.max(...layouts.map(({bounds:b})=>Math.max(b[2]-b[0],b[3]-b[1])));
 if(!(maximum>0))throw Error('Empty LaTeX morph bounds');
 const scale=.78/maximum;
 const reference=[],referenceById=new Map(),groupIds=[],origins=[],groups=[];
 for(let state=0;state<3;state++){
  const layout=layouts[state],b=layout.bounds,center=[(b[0]+b[2])/2,(b[1]+b[3])/2];
  if(layout.groups.size!==groupKeys.length||groupKeys.some(key=>!layout.groups.has(key)))throw Error('LaTeX states contain unmatched semantic groups');
  for(let g=0;g<groupKeys.length;g++){
   const key=groupKeys[g],entries=layout.groups.get(key),first=layouts[0].groups.get(key);
   const byId=new Map(entries.map(e=>[e.id,e]));
   if(entries.length!==first.length||first.some(e=>!byId.has(e.id)))throw Error('LaTeX states contain unmatched glyphs in '+key);
   const origin=[Math.min(...entries.map(e=>e.packet[0])),Math.min(...entries.map(e=>e.packet[1]))];
   origins[6*g+2*state]=.5+(origin[0]-center[0])*scale;
   origins[6*g+2*state+1]=.5+(origin[1]-center[1])*scale;
   for(const original of first){
    const packet=byId.get(original.id).packet;
    const local=[(packet[0]-origin[0])*scale,(packet[1]-origin[1])*scale,packet[2]*scale,packet[3]*scale,...packet.slice(4)];
    if(packet[12]===1){local[13]=packet[13]*scale;local[14]=packet[14]*scale;}
    if(state===0){reference.push({id:original.id,packet:local});referenceById.set(original.id,local);groupIds.push(g);}
    else{const expected=referenceById.get(original.id);if(local.some((x,i)=>!same(x,expected[i])))throw Error('LaTeX semantic group changes internal geometry or material: '+key);}
   }
   if(state===0)groups.push({id:g,key,rigid:true,explicit:key.startsWith('group:'),members:first.map(e=>e.identity),instanceCount:first.length});
  }
 }
 const instanceCount=reference.length,groupCount=groupKeys.length;
 const params=new Float32Array(8+16*instanceCount+instanceCount+6*groupCount);
 params.set([0,0,1,1,1,0,instanceCount,groupCount]);
 reference.forEach((entry,i)=>params.set(entry.packet,8+16*i));
 params.set(groupIds,8+16*instanceCount);params.set(origins,8+17*instanceCount);
 return {params,instanceCount,groupCount,groups,layoutDiagnostics:layouts.map(l=>l.diagnostics),transferBytes:params.byteLength,scale,bounds:layouts.map(l=>l.bounds)};
}
