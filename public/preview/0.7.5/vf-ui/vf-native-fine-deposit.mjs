import {createCompiledFieldKernel} from './vf-compiled-field-runtime.mjs';
// Artifact authentication and four-buffer ABI transport only. Binning, native
// stored-pixel validation and material moments execute in FineDeposit.vkf.
const immutable=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')immutable(child);return Object.freeze(value);};
export async function createNativeFineDepositKernels(device,{baseURL=new URL('./artifacts/fine-deposit/',import.meta.url),fetch:fetcher=globalThis.fetch,signal}={}){
 if(!device||typeof device.createShaderModule!=='function')throw Error('Native fine deposit requires an available WebGPU device.');
 const read=async name=>{const response=await fetcher(new URL(name,baseURL),{signal});if(!response.ok)throw Error('Native fine deposit artifact unavailable: '+name);return new Uint8Array(await response.arrayBuffer());};
 const provenance=immutable(JSON.parse(new TextDecoder().decode(await read('PROVENANCE.json'))));
 if(provenance.schema!=='native-fine-deposit/1'||provenance.compilerVersion!=='0.7.5')throw Error('Unsupported native fine deposit artifact');
 const load=async name=>{const data=await read(provenance.files[name].url),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');if(data.byteLength!==provenance.files[name].bytes||digest!==provenance.files[name].sha256)throw Error('Native fine deposit identity mismatch: '+name);return new TextDecoder().decode(data);};
 const result={provenance};
 for(const[name,key,width]of[['capture_pixel','capturePixel',2],['support_check','supportCheck',1],['classify','classify',6],['tiled_moments','tiledMoments',5],['reduce_moments','reduceMoments',5]]){
 const[code,raw]=await Promise.all([load(name+'.wgsl'),load(name+'.wgsl.json')]);if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');
 const manifest=JSON.parse(raw);if(manifest.output_width!==width)throw Error('Native fine deposit output width mismatch');const compiled=await createCompiledFieldKernel(device,code,manifest);
 result[key]=Object.freeze({bind(buffers){const capture=name==='capture_pixel',count=buffers.count;if(!Number.isSafeInteger(count)||count<1||count>131072||buffers.params.size!==(capture?12:28)||buffers.values.size<4||buffers.values.size>64*1024*1024||buffers.result.size>64*1024*1024||buffers.errors.size>64*1024*1024)throw RangeError('Invalid native fine deposit buffers');return compiled.bind(buffers);}});
 }
 if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');return Object.freeze(result);
}
