import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadNativeTextModeKernel,TEXT_INTERP_COMMIT,prepareNumericStateTransition} from '../../public/preview/0.7.5/vf-ui/native-labels/vf-native-text-modes.mjs';
const fetch=async url=>new Response(await readFile(url)),{kernel,provenance}=await loadNativeTextModeKernel({fetch});assert.equal(provenance.libraryCommit,TEXT_INTERP_COMMIT);
const settings=kernel.invokeValue('evaporate',[1,.35,.65,17,4,.54,.32,false]),source=[.1,.4,1,0,0,1,2,.2,.4,1,0,0,.5,2],to=[.6,.2,0,1,1,1,2,.7,.2,0,1,1,1,2],glyphs=[.6,.2,0,0,1,1,1];
const plan=kernel.invokeValue('prepare_vapor_transport',[settings,source,to,glyphs]);
for(const q of [0,.25,.5,.75,1]){const front=kernel.invokeValue('vapor_front',[settings,q,1.5]),p=kernel.invokeValue('sample_vapor_transport',[plan,q,front]);assert.equal(p.gas.length,18);assert.equal(p.target.length,5);assert(Math.abs(p.ledger.reduce((a,b)=>a+b)-1)<1e-12);if(q===0||q===1){assert.equal(p.gas[2],0);assert.equal(p.source_alpha,q===0?1:0);}}
const numeric=await prepareNumericStateTransition({from:[0,2],to:[8,6],kernelOptions:{fetch}});assert.deepEqual(numeric.sample(.25).values,[1,2.5]);assert.deepEqual(numeric.sample(0).values,[0,2]);assert.deepEqual(numeric.sample(1).values,[8,6]);numeric.close();assert.throws(()=>numeric.sample(.5),/cancelled/);
await assert.rejects(loadNativeTextModeKernel({fetch:async url=>{const b=await readFile(url);if(String(url).endsWith('text.wasm'))b[100]^=1;return new Response(b);}}),/ARTIFACT_CHANGED/);
console.log('PASS current native material transport, same-artifact scalar bridge, endpoints/ledger and artifact integrity');
