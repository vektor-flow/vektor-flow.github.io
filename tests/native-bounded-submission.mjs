// Durable affected regression. Source-only e1877 has NOT run this file.
import assert from 'node:assert/strict';
import {createCertifiedOutlineCache} from '../public/preview/0.7.5/vf-ui/native-labels/vf-native-outline-cache.mjs';
import {prepareNativeAccuracyScene} from '../public/preview/0.7.5/vf-ui/native-labels/vf-native-accuracy-scene.mjs';
import {certifiedNativeSampleMesh} from '../public/preview/0.7.5/vf-ui/native-labels/vf-native-certified-samples.mjs';
const commands=Object.freeze([['M',0,0],['L',1.2,0],['L',1.2,1.2],['L',0,1.2],['Z']].map(Object.freeze));
const outlines=[];
for(let resource=0;resource<1025;resource++)for(const [x,y] of [[0,0],[.1875,0],[0,.1875],[.1875,.1875]])outlines.push({commands,matrix:[1,0,0,1,2+x,2+y],color:resource%2?[1,0,0,.5]:[0,0,0,1],provenance:{engineIdentity:'bounded-regression',resourceIdentity:'resource-'+resource,source:'square',elementId:'outline-'+outlines.length}});
const viewport={width:8,height:8,resident:true};
// More than 4096 genuinely distinct sample meshes; same normal default caps.
// The retained predecessor path must refuse rather than hide its pins.
assert.throws(()=>prepareNativeAccuracyScene(outlines,viewport),/OUTLINE_CACHE_BYTES/);
const cache=createCertifiedOutlineCache();let submitted=0,peakEntries=0,peakBytes=0;
try{
 const plan=prepareNativeAccuracyScene(outlines,{...viewport,cache,submit(draw){
  const input=outlines[submitted],reference=certifiedNativeSampleMesh(input.commands,input.matrix,{width:8,height:8});
  const [dx,dy]=draw.translation.map(v=>v*4);
  const rows=draw.template.rows.map(({iy,runs})=>({iy:iy+dy,runs:runs.map(([a,b])=>[a+dx,b+dx])}));
  assert.deepEqual(rows,reference.rows,'independent old per-sample path, ordinal '+submitted);
  assert.deepEqual(draw.color,input.color,'authored opaque/half-opacity order');
  const stats=cache.statistics();peakEntries=Math.max(peakEntries,stats.entries);peakBytes=Math.max(peakBytes,stats.bytes);
  assert.ok(stats.entries<=4096&&stats.bytes<=134217728);submitted++;
 }});
 assert.equal(submitted,4100);assert.equal(plan.sources.length,4100);assert.equal(plan.draws.length,0);assert.equal(plan.primitives.length,0);
 assert.ok(plan.receipt.meshBuilds>=4100);assert.equal(plan.receipt.maxEntries,4096);assert.equal(plan.receipt.maxNewProofs,4096);assert.equal(plan.receipt.pinnedEntries,0);
 assert.ok(plan.receipt.queryNodes>=plan.receipt.newNodes&&plan.receipt.newPixels<=1048576);
 for(let i=0;i<outlines.length;i++){assert.deepEqual(plan.sources[i].commands,outlines[i].commands);assert.deepEqual(plan.sources[i].matrix,outlines[i].matrix);assert.equal(plan.sources[i].provenance.elementId,outlines[i].provenance.elementId);}
 // Callback refusal must release even the current borrow. A new request with
 // a different identity can then evict it without resetting the work counters.
 const small=createCertifiedOutlineCache({maxEntries:3});
 try{
  assert.throws(()=>prepareNativeAccuracyScene([outlines[0]],{...viewport,cache:small,submit(){throw Error('SINK_REFUSAL');}}),/SINK_REFUSAL/);
  const work=small.statistics();const entry=small.get(outlines[4]);small.release(entry);
  assert.equal(small.statistics().instances,work.instances+1);assert.ok(small.statistics().newPixels>work.newPixels);assert.ok(small.statistics().entries<=3);
 }finally{small.close();}
 // Async submission cannot retain a borrowed mesh after this stack unwinds.
 assert.throws(()=>prepareNativeAccuracyScene([outlines[0]],{...viewport,submit(){return Promise.resolve();}}),/NATIVE_ACCURACY_ASYNC_SUBMIT/);
 // Existing resource/mutation/phase/DPR and budget refusals remain required in
 // native-exact-source-sharing.mjs; no limits are relaxed here.
 console.log(JSON.stringify({status:'PASS_AFFECTED_BOUNDED_SUBMISSION',submitted,peakEntries,peakBytes,receipt:plan.receipt}));
}finally{cache.close();assert.equal(cache.statistics().bytes,0);assert.equal(cache.statistics().entries,0);}
