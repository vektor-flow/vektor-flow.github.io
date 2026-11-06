import {createCompiledFieldKernel} from './vf-compiled-field-runtime.mjs';
// Artifact identity and buffer transport only. Every numerical operator is
// compiled from FluidPorts.vkf with the unchanged current075 compiler/emitter.
export async function createNativeFluidPortKernels(device,{baseURL=new URL('./artifacts/fluid-ports/',import.meta.url),fetch:fetcher=globalThis.fetch,signal}={}){
 const abort=()=>{if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');};abort();
 if(!device||typeof device.createShaderModule!=='function')throw Error('Native fluid ports require an available WebGPU device');
 const read=async name=>{abort();const response=await fetcher(new URL(name,baseURL),{signal});if(!response.ok)throw Error('Native fluid port artifact unavailable: '+name);return new Uint8Array(await response.arrayBuffer());};
 const provenance=JSON.parse(new TextDecoder().decode(await read('PROVENANCE.json')));
 if(provenance.schema!=='native-fluid-ports/1'||provenance.compilerVersion!=='0.7.5'||provenance.gpuEmitter!=='a5305eb01c6d36d5234402471750f0c4ed2f1c892fcec628649325bee315676f')throw Error('Unsupported native fluid port provenance');
 const load=async name=>{const spec=provenance.files[name];if(!spec||spec.url!==name)throw Error('Missing native fluid port identity');const data=await read(name),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');if(data.byteLength!==spec.bytes||digest!==spec.sha256)throw Error('Native fluid port identity mismatch: '+name);return new TextDecoder().decode(data);};
 const result={provenance};
 for(const [name,width] of [['normalize2',2],['unit_rhs2',2],['pack6',6],['boundary6',6],['add_lift',1],['remove_lift',1],['port_drag',1]]){
 const [code,raw]=await Promise.all([load(name+'.wgsl'),load(name+'.wgsl.json')]);abort();const manifest=JSON.parse(raw);if(manifest.output_width!==width)throw Error('Native fluid port output width mismatch');const compiled=await createCompiledFieldKernel(device,code,manifest);
 result[name]=Object.freeze({bind(buffers){abort();const count=buffers.count,maxCount=width===1?7*131072:131072,paramBytes=name==='boundary6'?124:name==='normalize2'?104:96;if(!Number.isSafeInteger(count)||count<1||count>maxCount||buffers.params.size!==paramBytes||buffers.values.size<4||buffers.values.size>64*1024*1024||buffers.result.size!==count*width*4||buffers.errors.size<(count+1)*4||buffers.errors.size>64*1024*1024)throw RangeError('Invalid native fluid port buffers/work budget');const bound=compiled.bind(buffers);return Object.freeze({...bound,encode(encoder){abort();return bound.encode(encoder);}});}});
 }
 abort();return Object.freeze(result);
}
