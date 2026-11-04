// VKF's ordinary text-block source authoring helper. All visible content uses
// add(text:); the actual VKF parser/layout/provider owns typography and glyphs.
const literal=value=>JSON.stringify(value).replace(/\$/g,'\\$');
export function nativeTextPanelSource(blocks,{margin=60,top=64,gap=28}={}){
 if(!Array.isArray(blocks))throw TypeError('Text blocks are required');
 let y=top;
 const lines=['view:.ui.viewport'];
 for(const [index,block] of blocks.entries()){
  const text=block.kind==='math'?`$${block.tex}$`:block.kind==='list'?block.items.map((s,i)=>`${i+1}. ${s}`).join('\n'):block.text;
  if(typeof text!=='string')throw TypeError('A native text block requires text');
  if(!text||text==='$$')continue;
  const size=block.fontSize??30;if(!(size>0&&size<=256))throw RangeError('Native text size must be in (0,256]');
  const id=block.id??`text-${index}`;
  lines.push(`view.add(p:[[${margin},${y}],[${margin+1},${y}]]_ic,text:${literal(text)},color:[0,0,0,0],label_color:[0,0,0,1],anchor:[0,0],font_size:${size},id:${literal(id)})`);
  y+=size*1.4+gap;
 }
 lines.push('view.push()','view.show()');return lines.join('\n');
}
