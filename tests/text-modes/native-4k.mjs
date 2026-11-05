import {createSymbolicKernel} from '../../public/preview/0.7.5/vf-ui/vf-symbolic-kernel-runtime.mjs';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const load=async root=>createSymbolicKernel({instance:new WebAssembly.Instance(await WebAssembly.compile(await readFile(root+'/text.wasm')),{}),manifest:JSON.parse(await readFile(root+'/text.json')),diagnostics:true});
const before=await load(process.env.VKF_BEFORE_ARTIFACTS||'/tmp/vkf-material-before-hoist'),source=[],target=[],glyphs=[],n=4096;
const settings=before.invokeValue('evaporate',[1,.35,.65,17,4,.54,.32,true]);
for(let i=0;i<n;i++){source.push((i%128)/200,.5+Math.floor(i/128)/200,1,.7,.2,1,2);target.push(.2+(i%128)/200,.2+Math.floor(i/128)/200,.15,.85,1,1,2);}
for(let i=0;i<170;i++)glyphs.push(.2+(i%40)/80,.2+Math.floor(i/40)/10,i/80,.15,.85,1,1);
let start=performance.now();const oldPlan=before.invokeValue('prepare_vapor_transport',[settings,source,target,glyphs]),beforePrepareMs=performance.now()-start;console.log('BEFORE PREP',beforePrepareMs);await writeFile('/tmp/vkf-material-4096-plan.json',JSON.stringify(oldPlan));
const after=await load(process.env.VKF_AFTER_ARTIFACTS||'/tmp/vkf-material-final-hoists');start=performance.now();const newPlan=after.invokeValue('prepare_vapor_transport',[settings,source,target,glyphs]),afterPrepareMs=performance.now()-start;assert.deepEqual(newPlan,oldPlan);console.log('AFTER PREP',afterPrepareMs);
const frames=[];for(const q of [.25,.5,.75,1]){const front=before.invokeValue('vapor_front',[settings,q,3]);start=performance.now();const a=before.invokeValue('sample_vapor_transport',[oldPlan,q,front]),beforeMs=performance.now()-start;start=performance.now();const b=after.invokeValue('sample_vapor_transport',[oldPlan,q,front]),afterMs=performance.now()-start;assert.deepEqual(a,b);const sha=createHash('sha256').update(JSON.stringify(a)).digest('hex');frames.push({q,beforeMs,afterMs,sha});console.log(frames.at(-1));}
const report={passed:true,carriers:n,glyphs:170,beforePrepareMs,afterPrepareMs,preparedPlansExact:true,frames,scope:'4096 real native prepared carriers, exact full sampled packets; same algorithm/arithmetic/order; immutable aggregate projections hoisted only'};await writeFile('/tmp/vkf-material-4096-qualification.json',JSON.stringify(report,null,2));
