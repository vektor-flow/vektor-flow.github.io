// Frozen946 values::Tag layout (396.hpp), CaptureUiEffect (422.cpp),
// snapshot (425.cpp), and stage3172 (442.cpp). This is an output decoder,
// never a UI handle registry or an evaluator. No source/expected values enter it.
export class RuntimeValueCodecError extends Error {
 constructor(message){super(message);this.name='RuntimeValueCodecError';}
}
const bad=m=>{throw new RuntimeValueCodecError(m);};
export function decodeOutputStream(e,manifest) {
 const memory=e.memory,a=manifest?.runtimeDiagnostic,m=manifest?.memory;
 if(manifest?.schema!=='vektor-flow.symbolic-kernel'||manifest.version!==1||
    a?.schema!=='vektor-flow.vm-runtime-diagnostic'||a.version!==1||
    a.slotBytes!==16||a.slotAlignment!==8||a.recordTag!==5||a.stringTag!==3)
  bad('unsupported producer value layout/version');
 if(!memory?.buffer)bad('missing producer memory');
 const integer=(x)=>{if(!Number.isSafeInteger(x)||x<0||x>0xffffffff)bad('invalid u32 value boundary');return x;};
 const range=(p,n,align=1)=>{
  integer(p);integer(n);
  if(p%align||p>memory.buffer.byteLength||n>memory.buffer.byteLength-p)bad('value byte range/alignment');
 };
 const getter=name=>{if(typeof e[name]!=='function')bad('missing producer '+name);return integer(e[name]());};
 if(getter('vkf_vm_value_slot_size')!==24)bad('external result slot size mismatch');
 const root=getter('vkf_vm_results_ptr'),capacity=getter('vkf_vm_results_capacity');
 if(root!==m?.resultsPointer||capacity!==m.resultsCapacity||capacity!==1)bad('result export/manifest mismatch');
 range(root,24,8);
 const staticBegin=integer(a.staticBegin),staticEnd=integer(a.staticEnd);
 const heapBegin=getter('vkf_vm_heap_base'),heapEnd=getter('vkf_vm_heap_ptr'),heapLimit=getter('vkf_vm_heap_limit');
 if(staticBegin!==root+24||staticBegin>=staticEnd||staticEnd>heapBegin||
    heapBegin!==a.heapBegin||heapLimit!==a.heapLimit||heapBegin>heapEnd||heapEnd>heapLimit)
  bad('producer value region mismatch');
 range(staticBegin,staticEnd-staticBegin);range(heapBegin,heapLimit-heapBegin);
 const owned=(p,n,align=1)=>{
  range(p,n,align);
  if(!((p>=staticBegin&&p<=staticEnd&&n<=staticEnd-p)||
       (p>=heapBegin&&p<=heapEnd&&n<=heapEnd-p)))bad('pointer outside producer static/active heap');
 };
 const u32=p=>{range(p,4,4);return new DataView(memory.buffer).getUint32(p,true);};
 const td=new TextDecoder('utf-8',{fatal:true}),active=new Set(),memo=new Map();
 let slots=0,bytes=0;
 const charge=(n)=>{bytes+=n;if(bytes>8*1024*1024)bad('value decode byte budget');};
 const pointers=(p,stride)=>{
  const n=u32(p+4),q=u32(p+8);
  if(n>65536)bad('collection decode budget');owned(q,n*stride,4);charge(n*stride);
  return Array.from({length:n},(_,i)=>q+i*stride);
 };
 function decode(p,depth=0) {
  if(depth>256||++slots>65536)bad('value decode depth/slot budget');
  if(!p)bad('null slot pointer');owned(p,16,8);
  if(active.has(p))bad('cyclic runtime value');
  if(memo.has(p))return memo.get(p);
  const tag=u32(p),n=u32(p+4),q=u32(p+8);
  if(tag===7)bad('UI effect outside output stream root');
  active.add(p);let out;
  try {
   if(tag===0)out=null;
   else if(tag===1){if(q>1)bad('invalid Boolean payload');out=q===1;}
   else if(tag===2)out=new DataView(memory.buffer).getFloat64(p+8,true);
   else if(tag===3){owned(q,n);charge(n);try{out=td.decode(new Uint8Array(memory.buffer,q,n));}catch{bad('malformed value UTF-8');}}
   else if(tag===10){owned(p,24,8);out=Object.freeze({complex:Object.freeze([new DataView(memory.buffer).getFloat64(p+8,true),new DataView(memory.buffer).getFloat64(p+16,true)])});}
   else if(tag===4||tag===6){
    const values=Object.freeze(pointers(p,4).map(at=>decode(u32(at),depth+1)));
    const shape=tag===4?u32(p+12):0;
    out=shape?Object.freeze({values,shape:decode(shape,depth+1)}):values;
   }else if(tag===5){
    out=Object.create(null);
    for(const at of pointers(p,8)){
     const key=decode(u32(at),depth+1);
     if(typeof key!=='string'||Object.hasOwn(out,key))bad('invalid/duplicate record key');
     out[key]=decode(u32(at+4),depth+1);
    }
    Object.freeze(out);
   }else bad(`unsupported runtime ABI value tag ${tag}`);
   memo.set(p,out);return out;
  }finally{active.delete(p);}
 }
 function effect(p) {
  owned(p,16,8);
  if(u32(p+12)!==0)bad('unexpected UI effect shape/reserved field');
  const entries=pointers(p,4);
  if(!entries.length||entries.length%2!==1)bad('malformed UI effect operands');
  const kind=decode(u32(entries[0]));
  if(typeof kind!=='string'||!kind)bad('invalid UI effect kind');
  const operands=Object.create(null);
  for(let i=1;i<entries.length;i+=2){
   const name=decode(u32(entries[i]));
   if(typeof name!=='string'||!name||Object.hasOwn(operands,name))bad('invalid/duplicate UI effect operand name');
   const value=decode(u32(entries[i+1]));
   if((name==='display_id'||name==='operation_index')&&(!Number.isSafeInteger(value)||value<0))bad('invalid compiler routing identity');
   operands[name]=value;
  }
  // Routing IDs remain exactly producer-owned metadata. They are never
  // promoted to Window/View identities or resolved through an invented registry.
  return Object.freeze({kind,operands:Object.freeze(operands)});
 }
 if(u32(root)!==4||u32(root+12)!==0)bad('output stream root is not an unshaped Array');
 const value=[],effects=[],outputOrder=[];
 for(const at of pointers(root,4)){
  const p=u32(at);owned(p,16,8);
  if(u32(p)===7){outputOrder.push(Object.freeze({kind:'effect',index:effects.length}));effects.push(effect(p));}
  else {outputOrder.push(Object.freeze({kind:'value',index:value.length}));value.push(decode(p));}
 }
 if(getter('vkf_vm_heap_ptr')!==heapEnd)bad('producer heap changed during output snapshot');
 return Object.freeze({value:Object.freeze(value),effects:Object.freeze(effects),outputOrder:Object.freeze(outputOrder),
  valueCodec:Object.freeze({schema:'vektor-flow.vm-output-stream',version:1,producerKernelVersion:1,internalSlotBytes:16,externalSlotBytes:24})});
}
