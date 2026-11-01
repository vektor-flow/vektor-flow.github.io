import fs from 'node:fs';import assert from 'node:assert/strict';
const D=new URL('../public/preview/0.7.5/vf-ui/native-labels/',import.meta.url).pathname;

const {createNativeSampleAtlas,certifiedNativeAtlasMesh}=await import(D+'vf-native-certified-samples.mjs');
const {certifiedNativeSampleMesh}=await import(D+'vf-native-certified-samples.mjs');
const {createCertifiedOutlineCache,samplePhase}=await import(D+'vf-native-outline-cache.mjs');
const shapes=[[['M',0,0],['L',2,0],['L',2,2],['L',0,2],['Z']], [['M',0,0],['C',3,-1,-2,3,2,2],['L',0,2],['Z']], [['M',0,0],['C',4,0,-3,0,1,0],['L',1,2],['L',0,2],['Z']], [['M',0,0],['L',3,0],['L',3,3],['L',0,3],['Z'],['M',1,1],['L',1,2],['L',2,2],['L',2,1],['Z']]];
let cases=0,allocations=0,refusals=0;
for(const commands of shapes)for(const linear of [[1,0,0,1],[-.7,.2,.3,1.1],[.1,0,.2,.0001]])for(const pixelRatio of [1,2,3]){
 const atlas=createNativeSampleAtlas(commands,linear,{pixelRatio,onAllocate:n=>allocations+=n});
 for(const [tx,ty] of [[4,4],[4.125,4.125],[4.125000000001,4.124999999999],[4.1,4.2]]){
  const matrix=[...linear,tx,ty],opts={pixelRatio,width:12,height:12,maxNodes:2000000};
  let a,b,ea,eb;try{a=certifiedNativeAtlasMesh(atlas,commands,matrix,opts);}catch(e){ea=e;}try{b=certifiedNativeSampleMesh(commands,matrix,opts);}catch(e){eb=e;}
  if(ea||eb){assert.equal(ea?.code,eb?.code,JSON.stringify({commands,matrix,pixelRatio}));refusals++;}else{assert.deepEqual(a.rows,b.rows,JSON.stringify({commands,matrix,pixelRatio}));cases++;}
 }
}
const cache=createCertifiedOutlineCache(),input={commands:shapes[1],matrix:[1,0,0,1,4.125,4.125],provenance:{engineIdentity:'test-engine',resourceIdentity:'test-resource',source:'curve'}};
cache.begin();const a=cache.get(input);const first=cache.statistics();cache.get({...input,matrix:[1,0,0,1,5.125,4.125]});assert.equal(cache.statistics().newNodes,first.newNodes);assert.equal(cache.statistics().sampleBuilds,1);
cache.get({...input,matrix:[1,0,0,1,4.125000000001,4.125]});assert.equal(cache.statistics().sampleBuilds,1);
cache.get({...input,matrix:[2,0,0,2,4.125,4.125]});assert.equal(cache.statistics().sampleBuilds,2);
cache.get({...input,provenance:{...input.provenance,resourceIdentity:'changed'}});assert.equal(cache.statistics().sampleBuilds,3);
const mutable=structuredClone(input);cache.get(mutable);mutable.commands[1][1]=2.5;cache.get(mutable);assert.equal(cache.statistics().sampleBuilds,4);
const stats=cache.statistics();cache.begin();cache.get(input);assert.equal(cache.statistics().newNodes,0);
assert.throws(()=>cache.get({...input,matrix:[NaN,0,0,1,0,0]}));cache.close();assert.throws(()=>cache.get(input),/OUTLINE_CACHE_CLOSED/);
const other=createCertifiedOutlineCache();other.begin();other.get(input);assert.ok(other.statistics().newNodes>0);other.close();
for(const options of [{maxNewNodes:1},{maxBytes:1024},{maxNewPixels:1}]){const c=createCertifiedOutlineCache(options);assert.throws(()=>c.get(input));c.close();}
const atlas=createNativeSampleAtlas(shapes[0],[1,0,0,1]);assert.throws(()=>atlas.translated([1,0,0,2,0,0]));assert.throws(()=>certifiedNativeAtlasMesh(atlas,shapes[0],[1,0,0,1,0,0],{width:0,height:4}));
const result={status:'PASS',exactOldPerSampleComparisons:cases,matchedRefusals:refusals,allocations,cacheStats:stats,coverage:'cubic reversal, hole, shear/reflection/near singular, phase boundary, DPR1/2/3, translation, scale, source invalidation/mutation, nonfinite, node/pixel/byte bounds, independent ownership and close'};console.log(JSON.stringify(result));

const {prepareNativeAccuracyScene}=await import(D+'vf-native-accuracy-scene.mjs');
const tiny=createCertifiedOutlineCache({maxEntries:3});tiny.begin();tiny.get(input);assert.equal(tiny.statistics().entries,3);assert.equal(tiny.statistics().poseSkips,1);tiny.get({...input,matrix:[1,0,0,1,5.125,4.125]});assert.equal(tiny.statistics().entries,3);assert.ok(tiny.statistics().queryNodes>0);tiny.close();
const pa={...structuredClone(input),provenance:{...input.provenance,elementId:'a',size:[1,1],placement:[0,0],sourceBounds:[3,3,0]}},pb={...structuredClone(pa),provenance:{...structuredClone(pa.provenance),elementId:'b'}};
const plan=prepareNativeAccuracyScene([pa,pb],{width:12,height:12,resident:true});assert.equal(plan.sources.length,2);assert.equal(plan.sources[0].provenance.size,plan.sources[1].provenance.size);assert.equal(plan.sources[0].provenance.elementId,'a');assert.equal(plan.sources[1].provenance.elementId,'b');pa.provenance.size[0]=99;assert.equal(plan.sources[0].provenance.size[0],1);assert.throws(()=>prepareNativeAccuracyScene([pb],{width:12,height:12,maxInstanceBytes:1}));
console.log(JSON.stringify({status:'PASS_PROVENANCE_AND_OPTIONAL_POSE',actualQueryNodes:plan.receipt.queryNodes,instanceBytes:plan.receipt.instanceBytes}));
