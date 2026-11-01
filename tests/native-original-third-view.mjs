// Sole actual execution only: saved authentic producer data, affected source
// scene/cache regression. This is NOT a normal renderer/GPU/30-view PASS.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCurrentNativeTypography} from '../public/preview/0.7.5/vf-ui/native-labels/vf-current-native-provider.mjs';
import {createAdaptiveNativeLabelBatches} from '../public/preview/0.7.5/vf-ui/native-labels/vf-adaptive-native-labels.mjs';
import {createCertifiedOutlineCache} from '../public/preview/0.7.5/vf-ui/native-labels/vf-native-outline-cache.mjs';
import {prepareNativeAccuracyScene} from '../public/preview/0.7.5/vf-ui/native-labels/vf-native-accuracy-scene.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const manifest=read(process.argv[2]);
function pinned(path,expected){const bytes=fs.readFileSync(path);assert.equal(createHash('sha256').update(bytes).digest('hex'),expected);return JSON.parse(bytes);}
const dataset=pinned(manifest.dataset,'0c77927429dfd78ddd53e3854b04941663096d4e5599c0dc62400463baaa6ca5');
const cameras=pinned(manifest.cameras,'72d87a5c462956f9d9f06241ecccdb894c775b519c4d0975ef08b9c952726418');
const rows=read(manifest.producerRows),mapping=new URL('../public/preview/0.7.5/vf-ui/artifacts/current-labels/native-mapping/',import.meta.url);
const boxes=Object.fromEntries(rows.results.map(r=>[r.source,{kind:'fresh-current-vkf-label-output',source:r.source,box:r.box}]));
const typography=createCurrentNativeTypography({boxes,vectors:read(new URL('vectors.json',mapping)),binding:read(new URL('binding.json',mapping)),identity:rows.identity});
let scene,cache,submitted=0;const report={status:'UNRUN',scope:'Affected original third-view source/cache submission; NOT normal renderer or full30/color/ownership qualification',cameraIndex:2};
try{
 assert.equal(dataset.specs.length,10000);assert.equal(Object.keys(boxes).length,200);assert.equal(cameras.length,30);
 const camera=cameras[2].cameraMatrix;
 scene=await createAdaptiveNativeLabelBatches({typography,specs:dataset.specs,coordinates:{worldToScreen:([x,y])=>[camera[0]*x+camera[2]*y+camera[4],camera[1]*x+camera[3]*y+camera[5]]}});
 cache=createCertifiedOutlineCache();
 const plan=prepareNativeAccuracyScene(scene.nativeSourceOutlines(camera),{width:1280,height:800,cache,resident:true,submit(draw){
  assert.ok(draw.template.triangleCount*18*4<=134217728);submitted++;
 }});
 assert.equal(submitted,35100);assert.equal(plan.sources.length,35100);assert.equal(plan.draws.length,0);assert.equal(plan.receipt.pinnedEntries,0);
 assert.ok(plan.receipt.entries<=4096&&plan.receipt.bytes<=134217728&&plan.receipt.newNodes<=2000000&&plan.receipt.newPixels<=1048576&&plan.receipt.sampleBuilds<=4096);
 report.status='PASS_AFFECTED_ORIGINAL_THIRD_VIEW_SOURCE_SUBMISSION';report.receipt=plan.receipt;
}catch(error){report.status='FAIL_AFFECTED_ORIGINAL_THIRD_VIEW_SOURCE_SUBMISSION';report.error=String(error.stack??error);report.cache=cache?.statistics();process.exitCode=1;}
finally{report.submitted=submitted;cache?.close();scene?.close();typography.close();report.cleanupJoined=true;report.finalTypography=typography.stats();}
console.log(JSON.stringify(report));
