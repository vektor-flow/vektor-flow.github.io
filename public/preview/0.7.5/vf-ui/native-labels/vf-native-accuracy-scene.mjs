import {createCertifiedOutlineCache} from './vf-native-outline-cache.mjs';
const need=(v,code)=>{if(!v)throw Object.assign(Error(code),{code,status:'BLOCKED',action:'retain previous accepted frame; current scene is unqualified'});};

/** 4096 bounds new expensive proofs, never glyph placements. Every instance
 * needs a current physical-source, material, clip, source and placement check.
 * Contour certificates NEVER substitute for mandatory exact AA certificates.
 */
export function prepareNativeAccuracyScene(outlines,{width,height,pixelRatio=1,maxInstances=100000,maxInstanceBytes=134217728,cache,resident=false,submit,...limits}={}){
 need(Number.isSafeInteger(width)&&width>0&&Number.isSafeInteger(height)&&height>0&&Number.isInteger(pixelRatio)&&pixelRatio>=1&&pixelRatio<=3&&width*pixelRatio<=65536&&height*pixelRatio<=65536,'NATIVE_SAMPLE_VIEWPORT');
 need(Number.isSafeInteger(maxInstances)&&maxInstances>0&&Number.isSafeInteger(maxInstanceBytes)&&maxInstanceBytes>0,'NATIVE_ACCURACY_LIMIT');
 need(Array.isArray(outlines)&&outlines.length<=maxInstances,'NATIVE_ACCURACY_INSTANCE_BUDGET');
 need(submit===undefined||typeof submit==='function','NATIVE_ACCURACY_SUBMIT');
 const owned=!cache;cache??=createCertifiedOutlineCache(limits);cache.begin();
 const draws=[],sources=[],primitives=[],provenanceBases=new Map();let instanceBytes=0,triangles=0;
 try{
  for(const input of outlines){
   const entry=cache.get(input,{pixelRatio});
   try{
   // Current source/layout/font provenance is immutable and repeated across
   // label placements. Retain one base per exact content, plus each element's
   // own identity. This table is scene-owned and charged to the SAME bound.
   const {elementId,...rest}=entry.provenance,key=JSON.stringify(rest);let base=provenanceBases.get(key);
   if(!base){base=Object.freeze(rest);provenanceBases.set(key,base);instanceBytes+=1024+key.length*6;}
   instanceBytes+=2048+Object.keys(base).length*32+JSON.stringify(elementId??null).length*4;
   need(instanceBytes<=maxInstanceBytes,'NATIVE_ACCURACY_INSTANCE_BYTES');
   sources.push({commands:entry.commands,matrix:entry.matrix,provenance:Object.freeze({...base,elementId}),color:entry.color,displayOnly:false});
   const draw={template:entry.template,translation:entry.translation,color:entry.color};triangles+=entry.template.triangleCount;
   if(submit){
    // The sink owns no returned mesh references. A synchronous draw consumes
    // the cells before releasing the pin, so later outlines may evict them.
    const result=submit(draw);need(!result||typeof result.then!=='function','NATIVE_ACCURACY_ASYNC_SUBMIT');
   }else{
    draws.push(draw);
    if(!resident)for(const points of entry.template.triangles)primitives.push({kind:'face',points:points.map(p=>p.map((v,k)=>v+entry.translation[k])),color:entry.color});
   }
   }finally{if(submit)cache.release(entry);}
  }
  const stats=cache.statistics();
  return {primitives,sources,draws,receipt:{status:'SOURCE_CERTIFIED_DISPLAY_PLAN',profile:'exact physical M/L/C/Z; nonzero; AA16; viewport clip; DPR1/2/3',
   outlines:outlines.length,instances:outlines.length,triangles,width,height,pixelRatio,instanceBytes,...stats,nodes:stats.newNodes,pixels:stats.newPixels,
   cache:'full physical bytes/revision/config/scale-tier and exact affine/AA-phase; bounded LRU',submission:submit?'ordered synchronous consume/release':'retained pinned templates',displayOnly:true,
   hardwareQualification:'UNRUN_CHANGED_COMPONENT',indexed10kAccuracy:'OPEN',indexed10kPerformance:'UNRUN_CHANGED_COMPONENT',allFontsCertificate:false}};
 }finally{if(owned)cache.close();}
}
