// ABI-v1 decoder for the genuine emitted VM exception boundary. No source input,
// test ID, expected value, trap text or permissive regex enters this decoder.
// Canonical class masks are generated from terminal946 freeze/260.hpp.
import fs from 'node:fs';
const classes=JSON.parse(fs.readFileSync(new URL('./canonical-error-classes.json',import.meta.url),'utf8'));
export class DiagnosticCodecError extends Error { constructor(message){super(message);this.name='DiagnosticCodecError';} }
export class DiagnosticPrerequisiteError extends Error { constructor(message){super(message);this.name='DiagnosticPrerequisiteError';} }
export class LanguageRuntimeError extends Error {
 constructor(diagnostic){super(`${diagnostic.languageClass}: ${diagnostic.message}`);this.name='LanguageRuntimeError';this.diagnostic=diagnostic;}
}
const bad=m=>{throw new DiagnosticCodecError(m);};
const need=m=>{throw new DiagnosticPrerequisiteError(m);};
export function diagnosticBoundary(exports,manifest) {
 const a=manifest?.runtimeDiagnostic;
 if(!a)need('producer runtimeDiagnostic ABI metadata absent; rebuild required');
 const fixed={schema:'vektor-flow.vm-runtime-diagnostic',version:1,invokeExport:'vkf_vm_invoke_diagnostic',errorStatus:4,versionExport:'vkf_vm_diagnostic_abi_version',controlExport:'vkf_vm_error_control_ptr',controlBytes:32,valueOffset:20,maskOffset:24,slotBytes:16,slotAlignment:8,recordTag:5,stringTag:3,payloadSchema:'record{message:str,type?:str,mask?:num}|str',phase:'runtime',lifetime:'until-reset-or-next-invoke'};
 for(const [k,value] of Object.entries(fixed))if(a[k]!==value)bad(`runtimeDiagnostic ABI mismatch: ${k}`);
 if(JSON.stringify(a.classes)!==JSON.stringify(classes)) {
  // JSON object key order is immaterial, descriptor sequence and values are not.
  if(!Array.isArray(a.classes)||a.classes.length!==classes.length||a.classes.some((c,i)=>c?.name!==classes[i].name||c?.mask!==classes[i].mask||Object.keys(c).sort().join(',')!=='mask,name'))bad('noncanonical diagnostic class table');
 }
 const integer=(x,name)=>{if(!Number.isSafeInteger(x)||x<0||x>0xffffffff)bad(`invalid ${name}`);return x;};
 const globalValue=(name)=>{
  const g=exports[name];
  if(!g||!Number.isInteger(g.value))need(`missing producer global ${name}`);
  return integer(g.value, name);
 };
 if(globalValue(a.versionExport)!==1)bad('diagnostic version export mismatch');
 if(typeof exports[a.invokeExport]!=='function')need('missing genuine diagnostic invoke export');
 const memory=exports.memory;
 if(!memory?.buffer||typeof memory.buffer.byteLength!=='number')bad('missing VM memory');
 const control=globalValue(a.controlExport);
 const range=(p,n,alignment=1)=>{
  integer(p,'runtime pointer');integer(n,'runtime length');
  if(p%alignment||p>memory.buffer.byteLength||n>memory.buffer.byteLength-p)bad('diagnostic byte range/alignment');
 };
 range(control,32,8);
 const staticBegin=integer(a.staticBegin,'staticBegin'),staticEnd=integer(a.staticEnd,'staticEnd');
 const heapBegin=integer(a.heapBegin,'heapBegin'),heapLimit=integer(a.heapLimit,'heapLimit');
 if(staticBegin>=staticEnd||staticEnd>control||control+32>heapBegin||heapBegin>=heapLimit)bad('diagnostic value regions overlap or are empty');
 range(staticBegin,staticEnd-staticBegin);range(heapBegin,heapLimit-heapBegin);
 for(const name of ['vkf_vm_heap_base','vkf_vm_heap_ptr','vkf_vm_heap_limit'])if(typeof exports[name]!=='function')need('missing producer '+name);
 if(exports.vkf_vm_heap_base()!==heapBegin||exports.vkf_vm_heap_limit()!==heapLimit)bad('diagnostic heap export/manifest mismatch');
 const owned=(p,n,alignment=1)=>{
  range(p,n,alignment);
  const heapPointer=integer(exports.vkf_vm_heap_ptr(),'heap pointer');
  if(heapPointer<heapBegin||heapPointer>heapLimit)bad('invalid active VM heap bound');
  if(!((p>=staticBegin&&p<=staticEnd&&n<=staticEnd-p)||(p>=heapBegin&&p<=heapPointer&&n<=heapPointer-p)))bad('diagnostic pointer outside producer value regions');
 };
 const u32=(p)=>{range(p,4,4);return new DataView(memory.buffer).getUint32(p,true);};
 const slot=(p,tag)=>{if(p===0)bad('null diagnostic value pointer');owned(p,16,8);if(u32(p)!==tag)bad('diagnostic value tag mismatch');};
 const td=new TextDecoder('utf-8',{fatal:true});
 // Bound both dereferences and host work, independently of untrusted lengths.
 const string=(p)=>{
  slot(p,3);const n=u32(p+4),q=u32(p+8);
  if(n>65536)bad('diagnostic string exceeds ABI decoder budget');
  owned(q,n);try{return td.decode(new Uint8Array(memory.buffer,q,n));}catch{bad('diagnostic malformed UTF-8');}
 };
 const pending=()=>({mask:u32(control+24),pointer:u32(control+20)});
 const before=pending();if(before.mask||before.pointer)bad('stale pending diagnostic before invoke');
 let used=false;
 function finish(status) {
   const {mask,pointer}=pending();
   if(status!==4){if(mask||pointer)bad('pending exception with non-diagnostic status');return status;}
   if(mask===0||pointer===0)bad('diagnostic status without pending owned exception');
   const descriptor=classes.find(c=>c.mask===mask);if(!descriptor)bad('unknown canonical exception mask');
   owned(pointer,16,8);const tag=u32(pointer);let message,payload;
   if(tag===3){message=string(pointer);payload={message};}
   else {
    slot(pointer,5);const n=u32(pointer+4),q=u32(pointer+8);
    if(n<1||n>32)bad('diagnostic record field count');owned(q,n*8,4);
    payload=Object.create(null);
    for(let i=0;i<n;i++){
     const key=string(u32(q+i*8)),value=u32(q+i*8+4);
     if(Object.hasOwn(payload,key))bad('duplicate diagnostic record key');
     // Unknown fields are unsupported codec data, never silently discarded.
     if(key==='message'||key==='type')payload[key]=string(value);
     else if(key==='mask'){
      slot(value,2);const v=new DataView(memory.buffer).getFloat64(value+8,true);
      if(!Number.isSafeInteger(v)||v!==mask)bad('error payload mask mismatch');payload.mask=v;
     }else bad('unsupported diagnostic record field');
    }
    message=payload.message;
    if(typeof message!=='string')bad('missing diagnostic message');
    if(Object.hasOwn(payload,'type')&&payload.type!==descriptor.name)bad('error payload class mismatch');
   }
   if(message.length===0)bad('empty diagnostic message');
   throw new LanguageRuntimeError({schema:fixed.schema,version:1,phase:'runtime',languageClass:descriptor.name,mask,message,payload:{...payload},status:4});
 }
 function claim(){if(used)bad('diagnostic boundary is single invocation');used=true;}
 return {
  invoke(index,argc){claim();return finish(exports[a.invokeExport](index,argc));},
  async invokeAsync(index,argc,promisingInvoke){
   claim();
   if(typeof promisingInvoke!=='function')need('missing genuine JSPI promising diagnostic export');
   // A trap/rejected host import escapes unchanged; never relabel it as Error.
   return finish(await promisingInvoke(index,argc));
  }
 };
}
