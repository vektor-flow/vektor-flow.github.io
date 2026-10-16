import {createSymbolicKernel} from './vf-ui/vf-symbolic-kernel-runtime.mjs';
// No host interpolation. Coordinate is forwarded unchanged to compiled VKF.
export async function loadMorphingDemo(resolution=24,mode=1,smoothStart=true,smoothEnd=true){
 const [m,w]=await Promise.all([fetch(new URL('./biological-wasm.json',import.meta.url)),fetch(new URL('./biological.wasm',import.meta.url))]);
 if(!m.ok||!w.ok)throw Error('Morphing artifact unavailable');
 const manifest=await m.json();let result=await WebAssembly.instantiate(await w.arrayBuffer());
 let kernel=createSymbolicKernel({instance:result.instance,manifest});result=null;
 let scene=kernel.invoke('demo_prepare',[resolution,mode,smoothStart,smoothEnd]).handle;
 return Object.freeze({resolution,mode,smoothStart,smoothEnd,
 sample(coordinate){if(!kernel)throw Error('Morphing scene disposed');return kernel.invokeValue('demo_sample',[scene,coordinate]);},
 // Canonical ABI has no explicit release. Drop all retained references for GC.
 dispose(){scene=null;kernel=null;}});
}
