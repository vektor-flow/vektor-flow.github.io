import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadNativeTextModeKernel,TEXT_INTERP_COMMIT} from '../../public/preview/0.7.5/vf-ui/native-labels/vf-native-text-modes.mjs';
const fetch=async url=>new Response(await readFile(url));
const {kernel,provenance}=await loadNativeTextModeKernel({fetch});
assert.equal(provenance.libraryCommit,TEXT_INTERP_COMMIT);
const value=kernel.invokeValue('evaporate',[1,.35,.65,17,4,.54,.32,true]);
for(const q of [0,.25,.5,.75,1]){
 const p=kernel.invokeValue('text_frame',[value,q,[.2,.3,1,.4,.5,.5],[0,1],q*3]);assert.equal(p.gas.length,8);assert.equal(p.target.length,10);
 if(q===0||q===1){assert.equal(p.gas[2],0);assert.equal(p.source_alpha,q===0?1:0);assert.equal(p.target[0],q);}
}
await assert.rejects(loadNativeTextModeKernel({fetch:async url=>{const bytes=await readFile(url);if(String(url).endsWith('text.wasm'))bytes[100]^=1;return new Response(bytes);}}),/ARTIFACT_CHANGED/);
console.log('PASS pinned real WASM endpoints, packed batch, and artifact tamper rejection');
