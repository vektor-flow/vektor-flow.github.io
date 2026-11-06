import {createCompiledFieldKernel} from './vf-compiled-field-runtime.mjs';
// Numeric capture is generated from FineReceiver.vkf. This adapter only loads,
// authenticates and binds its existing four-buffer ABI; no host trajectories.
const immutable=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')immutable(child);return Object.freeze(value);};
export async function createNativeFineReceiverKernel(device,{baseURL=new URL('./artifacts/fine-receiver/',import.meta.url),fetch:fetcher=globalThis.fetch,signal}={}){
 if(!device||typeof device.createShaderModule!=='function')throw Error('Native fine receiver requires an available WebGPU device.');
 const read=async name=>{const response=await fetcher(new URL(name,baseURL),{signal});if(!response.ok)throw Error('Native fine receiver artifact unavailable: '+name);return new Uint8Array(await response.arrayBuffer());};
 const provenance=immutable(JSON.parse(new TextDecoder().decode(await read('PROVENANCE.json'))));
 if(provenance.schema!=='native-fine-receiver/1'||provenance.inputStride!==20||provenance.outputStride!==25||provenance.compilerVersion!=='0.7.5')throw Error('Unsupported native fine receiver artifact');
 const load=async name=>{const data=await read(provenance.files[name].url),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');if(data.byteLength!==provenance.files[name].bytes||digest!==provenance.files[name].sha256)throw Error('Native fine receiver artifact identity mismatch: '+name);return new TextDecoder().decode(data);};
 const [code,description]=await Promise.all([load('capture.wgsl'),load('capture.wgsl.json')]);if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');
 const compiled=await createCompiledFieldKernel(device,code,JSON.parse(description));if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');
 return Object.freeze({inputStride:20,outputStride:25,provenance,bind(buffers){if(!Number.isSafeInteger(buffers.count)||buffers.count<1||buffers.count>131072||buffers.params.size<13*4||buffers.values.size<(buffers.count*20+1)*4)throw RangeError('Invalid native fine receiver buffers');return compiled.bind(buffers);},receipt(){return {scope:provenance.scope,libraryCommit:provenance.libraryCommit,sourceSha256:provenance.sourceSha256,capturedVelocityQualified:false,airDynamicsQualified:false,textFormationQualified:false};}});
}
