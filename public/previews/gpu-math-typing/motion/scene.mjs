import {geometry} from './geometry.mjs';
import {typeset} from '../typing-layout.mjs?v=structure-1';
export function buildScene(step,data){
 if(typeof step.math!=='string'||step.math.length>12000)throw Error('This step is too long.');
 const b=typeset(step.math,data.maps,{onStructure(box,nodes){
  if(!box.items.length)return;
  const group={key:JSON.stringify(nodes)};
  for(const item of box.items)item.structures=[...(item.structures??[]),group];
 }});if(!b.complete||b.diagnostics.length)throw Error(b.diagnostics[0]||'Finish the expression to preview it.');
 const items=[],hasGeometry=!!step.geometry;
 const scale=Math.min(1050/Math.max(1,b.width),(hasGeometry?180:400)/Math.max(1,b.height+b.depth),26);
 const x=(1200-b.width*scale)/2,y=(hasGeometry?160:380)+(b.height-b.depth)*scale/2;
 const color=[.38,.86,.92,1];
 const shape=(x,y,w,h,col,kind=1)=>items.push(x,y,w,h,0,0,0,0,...col,kind,0,0,0);
 for(const item of b.items){
  const col=item.color??color;
  if(item.kind==='glyph'){
   const t=data.tiles[item.key];if(!t)throw Error('Missing symbol field.');const p=t.plane,sx=item.sx??1,sy=item.sy??1;
   const l=Math.max(p[0],item.cropX?.[0]??p[0]),r=Math.min(p[2],item.cropX?.[1]??p[2]),lo=Math.max(p[1],item.crop?.[0]??p[1]),hi=Math.min(p[3],item.crop?.[1]??p[3]);
   const uv=[t.uv[0]+(l-p[0])/(p[2]-p[0])*(t.uv[2]-t.uv[0]),t.uv[1]+(lo-p[1])/(p[3]-p[1])*(t.uv[3]-t.uv[1]),t.uv[0]+(r-p[0])/(p[2]-p[0])*(t.uv[2]-t.uv[0]),t.uv[1]+(hi-p[1])/(p[3]-p[1])*(t.uv[3]-t.uv[1])];
   items.push(x+(item.x+l*sx)*scale,y+(item.y+lo*sy)*scale,(r-l)*sx*scale,(hi-lo)*sy*scale,...uv,...col,0,0,0,0);
  }else if(item.kind!=='placeholder')shape(x+item.x*scale,y+item.y*scale,item.width*scale,item.height*scale,col,item.kind==='root'?6:1);
 }
 const structural=new Map();
 for(let i=0;i<b.items.length;i++)for(const group of b.items[i].structures??[]){if(!structural.has(group))structural.set(group,[]);structural.get(group).push(i);}
 const seen=new Set(),groups=[];
 for(const [group,indices]of structural){const start=indices[0],count=indices.length,key=group.key;
  const signature=JSON.stringify([key,start,count]);
  if(count>=1&&indices.every((v,i)=>v===start+i)&&!seen.has(signature)){seen.add(signature);groups.push({key,start,count});}}
 groups.sort((a,b)=>b.count-a.count||a.start-b.start);
 const mathCount=items.length/16,g=step.geometry,palette=[[.43,.82,.96,1],[.99,.64,.39,1],[.70,.58,.96,1]];
 if(g?.kind==='tiles')for(let room=0;room<3;room++)for(let iy=0;iy<g.rows;iy++)for(let ix=0;ix<g.cols;ix++){const cell=300/g.cols;shape(90+room*350+ix*cell,370+iy*cell,cell-2,cell-2,palette[room]);}
 if(g?.kind==='power'||g?.kind==='rational'){
  const rational=g.kind==='rational',N=rational?144:g.count;
  const X=rational?730:600,Y=535;
  shape(90,Y,1020,2,[.3,.38,.43,1]);shape(X,315,2,400,[.3,.38,.43,1]);
  for(let i=0;i<N;i++){
   const x=rational?(i<N/2?-5+3.65*i/(N/2-1):-.65+3.65*(i-N/2)/(N/2-1)):-2+4*i/(N-1);
   const y=rational?(x+2)/(x+1):x**g.power+(g.linear??0)*x;
   shape(X+x*(rational?125:240)-4,Y-y*(rational?45:21)-4,8,8,palette[rational?0:g.power-2],4);
  }
  if(rational)shape(X-375-9,Y-.5*45-9,18,18,[1,.8,.4,1],4);
 }
 if(g?.kind==='ring')shape(410,310,380,380,palette[1],4);
 geometry(g,shape);
 if(!items.length)throw Error('Enter an expression.');if(items.length/16>512)throw Error('This step exceeds the 512-object preview limit.');
 return {groups,items:new Float32Array(items),count:items.length/16,mathCount,geometryCount:items.length/16-mathCount};
}
export function pair(a,b){const n=Math.max(a.count,b.count),pad=s=>{const out=new Float32Array(n*16);out.set(s.items);for(let i=s.count;i<n;i++)out.set([600,380,12,12,0,0,0,0,0,0,0,0,2,0,0,0],i*16);return out;};// Intern endpoint syntax, without selecting any correspondence on the CPU.
 const keys=new Map(),encode=s=>(s.groups??[]).flatMap(g=>{if(!keys.has(g.key))keys.set(g.key,keys.size+1);return[keys.get(g.key),g.start,g.count];});
 const ga=encode(a),gb=encode(b),groups=new Uint32Array([ga.length/3,gb.length/3,...ga,...gb]);
 return {a:pad(a),b:pad(b),n,groups};}
