import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url))),base='public/preview/0.7.5/vf-ui/',qualification=JSON.parse(await fs.readFile(root+'/docs/state-colors/QUALIFICATION.json'));
assert.equal(qualification.passed,true);assert.equal(qualification.chain.length,29);assert.equal(qualification.groups.reduce((n,g)=>n+g.authoredGroups.length,0),3);
const pins={};async function pin(file){const b=await fs.readFile(root+'/'+file);pins[file]={sha256:createHash('sha256').update(b).digest('hex'),bytes:b.length};}async function directory(dir){for(const ent of await fs.readdir(root+'/'+dir,{withFileTypes:true})){const f=dir+'/'+ent.name;if(ent.isDirectory())await directory(f);else await pin(f);}}
await directory(base+'artifacts/state-interpolation');await directory(base+'artifacts/text-modes');
for(const name of['native-labels/vf-state-interpolation.mjs','native-labels/vf-state-interpolation-gpu.mjs','native-labels/vf-native-text-modes.mjs','native-labels/vf-native-dense-material-gpu.mjs','geom/vf-screen-simplex-renderer.mjs','vf-symbolic-kernel-runtime.mjs'])await pin(base+name);
for(const f of['tests/state-colors/browser.html','tests/state-colors/browser.cjs','tests/state-colors/fixtures.mjs','tests/state-colors/actual-lesson.json'])await pin(f);
const state=JSON.parse(await fs.readFile(root+'/'+base+'artifacts/state-interpolation/PROVENANCE.json')),text=JSON.parse(await fs.readFile(root+'/'+base+'artifacts/text-modes/PROVENANCE.json'));
assert.equal(state.libraryCommit,text.libraryCommit);assert(qualification.chain.every(c=>c.frame.receipt.libraryCommit===state.libraryCommit));
for(const [name,entry]of Object.entries(state.artifacts)){const key=base+'artifacts/state-interpolation/'+name;if(pins[key])assert.equal(pins[key].sha256,entry.sha256);}
const warmup=JSON.parse(await fs.readFile(root+'/docs/state-colors/WARMUP.json'));qualification.cacheReplay=warmup.groups.map(w=>{const f=qualification.groups.find(g=>g.view===w.view);assert(f&&f.frames.length===w.frames.length);assert(w.frames.every((v,i)=>v.hash===f.frames[i].hash));return{view:w.view,allFiveCoordinatesByteExact:true};});
qualification.nativeArtifacts={libraryCommit:state.libraryCommit,stateWasmSha256:pins[base+'artifacts/state-interpolation/state.wasm'].sha256,pins,scope:'Exact bytes present during the recorded completed browser gate; closure compile/cache provenance is separately preserved by native build manifests.'};
qualification.qualificationScope={colorAndResourceContracts:'PASS',visibleNearLinearPixelArea:'RED on source86d5841: actual27 cohort midpoint alpha60.4% below endpoint-linear value; contour area65.06px² versus calibrated desired1148.32px²; see docs/state-resources/RENDERED-AREA.json; color/resource pass does not establish full interpolation readiness',physicalFluid:'Not implemented or claimed; this lesson ordinary state/wave has zero gas'};
await fs.writeFile(root+'/docs/state-colors/QUALIFICATION.json',JSON.stringify(qualification,null,2)+'\n');console.log(JSON.stringify({passed:true,libraryCommit:state.libraryCommit,pins:Object.keys(pins).length}));
