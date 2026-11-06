import {createFieldBuffer} from '../vf-compiled-field-runtime.mjs';
const requireValue=(ok,code)=>{if(!ok)throw Object.assign(Error(code),{code});};
// Immutable chunks are produced by EventFields.vkf. This only validates their
// storage coverage and transports them; it never builds or resamples a field.
export function uploadNativeStateChunks(device,prepared,{allocate=count=>createFieldBuffer(device,count),maxBytes=268435456}={}){
 const count=prepared?.input_width;
 requireValue(Number.isSafeInteger(count)&&count>0&&count<16777216&&count*4<=maxBytes,'STATE_NATIVE_INPUT_BUDGET');
 requireValue(Array.isArray(prepared.chunks)&&prepared.chunks.length>0,'STATE_NATIVE_CHUNKS');
 const chunks=prepared.chunks.map(chunk=>({offset:chunk.offset,values:chunk.values})).sort((a,b)=>a.offset-b.offset);
 let end=0;
 for(const chunk of chunks){
  requireValue(Number.isSafeInteger(chunk.offset)&&chunk.offset===end&&Array.isArray(chunk.values)&&chunk.values.length>0,'STATE_NATIVE_CHUNK_COVERAGE');
  end+=chunk.values.length;
  requireValue(end<=count&&chunk.values.every(value=>typeof value==='number'&&Number.isFinite(value)&&Number.isFinite(Math.fround(value))),'STATE_NATIVE_CHUNK_VALUE');
 }
 requireValue(end===count,'STATE_NATIVE_CHUNK_COVERAGE');
 const buffer=allocate(count);
 try{
  requireValue(buffer?.size===count*4,'STATE_NATIVE_INPUT_SIZE');
  for(const chunk of chunks)device.queue.writeBuffer(buffer,chunk.offset*4,Float32Array.from(chunk.values));
  return buffer;
 }catch(error){buffer?.destroy();throw error;}
}
