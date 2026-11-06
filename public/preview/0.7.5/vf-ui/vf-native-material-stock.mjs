import {createCompiledFieldKernel} from './vf-compiled-field-runtime.mjs';
// Authenticated loading/ABI transport only. Stock selection, capture ownership
// and current-air velocity sampling execute in compiled MaterialStock.vkf.
const immutable=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')immutable(child);return Object.freeze(value);};
export async function createNativeMaterialStockKernels(device,{baseURL=new URL('./artifacts/material-stock/',import.meta.url),fetch:fetcher=globalThis.fetch,signal}={}){
 if(!device||typeof device.createShaderModule!=='function')throw Error('Native material stock requires an available WebGPU device.');
 const read=async name=>{const response=await fetcher(new URL(name,baseURL),{signal});if(!response.ok)throw Error('Native material stock artifact unavailable: '+name);return new Uint8Array(await response.arrayBuffer());};
 const provenance=immutable(JSON.parse(new TextDecoder().decode(await read('PROVENANCE.json'))));
 if(provenance.schema!=='native-material-stock/1'||provenance.compilerVersion!=='0.7.5')throw Error('Unsupported native material stock artifact');
 const load=async name=>{const data=await read(provenance.files[name].url),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');if(data.byteLength!==provenance.files[name].bytes||digest!==provenance.files[name].sha256)throw Error('Native material stock identity mismatch: '+name);return new TextDecoder().decode(data);};
 const result={provenance};
 for(const[name,key]of[['reemit','reemit'],['owners','owners'],['capture_owner','captureOwner']]){
 const[code,manifest]=await Promise.all([load(name+'.wgsl'),load(name+'.wgsl.json')]);if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');
 const compiled=await createCompiledFieldKernel(device,code,JSON.parse(manifest));
 result[key]=Object.freeze({bind(buffers){const count=buffers.count,capture=name==='capture_owner';if(!Number.isSafeInteger(count)||count<1||count>131072||buffers.params.size!==(capture?8:104)||buffers.values.size<(capture?26*count:22*count+448)*4)throw RangeError('Invalid native material stock buffers');return compiled.bind(buffers);}});
 }
 if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');
 return Object.freeze(result);
}
