// FUTURE OWNED EXECUTION ONLY. Corrected to actual current sourceSnapshot schema; original failedattempt controls2 remains immutable evidence. No execution/PASS claimed.
export async function originalLabels() {
 const base='/preview/0.7.5/',need=(v,m)=>{if(!v)throw Error(m)},report={status:'RUNNING',views:[],colors:[]};
 const phase=async x=>window.__saveScalePhase({...report,...x});
 const [dataset,cameraRows,oldBoxes]=await Promise.all(['dataset','cameras','boxes'].map(n=>fetch('/__e1874/'+n+'.json').then(r=>r.json())));
 const specs=dataset.specs,cameras=cameraRows.map(c=>c.cameraMatrix),sources=[...new Set(specs.map(s=>s.source))];
 need(specs.length===10000&&sources.length===200&&cameras.length===30,'EXACT_ORIGINAL_POPULATION');
 const loader=await import(base+'inline-renderer-loader.mjs');await loader.ensureInlineRenderer();
 const {installCurrentWasmMathLabels}=await import(base+'vf-ui/native-labels/vf-current-wasm-math-labels.mjs');
 const id='e1877-original10000';let engine,frame,container,primaryFailure;
 try {
  engine=await installCurrentWasmMathLabels();report.identity=engine.identity;
  container=document.createElement('div');container.style.cssText='position:relative;width:1280px;height:800px;background:white';document.body.prepend(container);
  frame=VfFrame.mount(container,{id,frameless:true,draggable:false,resizable:false,closable:false,containerKind:'viewport'});
  if(frame.root?.style)Object.assign(frame.root.style,{position:'relative',inset:'auto',width:'1280px',height:'800px'});
  await phase({phase:'BEFORE_ORIGINAL10000_REQUIRED_RENDER',labels:specs.length,distinctSources:sources.length,cameras:cameras.length});
  VfDisplay.renderFromJson({geom:{[id]:{meshes:[],texts:[],native_labels:{specs,camera:cameras[0]}}}});
  let status=VfDisplay.nativeLabelFrameStatus(id);need(status?.ready,'NORMAL_LABEL_READY');
  try {await status.ready;} finally {report.producerResults=engine.results;await phase({phase:'CURRENT_PRODUCER_AND_FIRST_RENDER_OBSERVED',statistics:VfDisplay.nativeLabelFrameStatus(id)?.statistics});}
  status=VfDisplay.nativeLabelFrameStatus(id);need(status.statistics.status==='SUBMITTED_COMPLETION_UNMEASURED','CURRENT_RENDER_SUBMISSION:'+JSON.stringify(status.statistics));
  need(engine.results.length===200&&sources.every(s=>engine.results.some(r=>r.source===s&&r.box.complete&&!r.box.diagnostics.length)),'ALL_200_CURRENT_GENUINE_WASM_LAYOUTS');
  const boxes=Object.fromEntries(engine.results.map(r=>[r.source,r.box]));
  const numeric=(a,b)=>typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
  const differences=[],structural=[];
  for(const source of sources){const a=boxes[source],b=oldBoxes[source].box;for(const key of ['width','height','depth'])if(!numeric(a[key],b[key]))differences.push({source,key,current:a[key],original:b[key]});
   if(a.items.length!==b.items.length)structural.push({source,key:'itemCount',current:a.items.length,original:b.items.length});
   for(let i=0;i<Math.min(a.items.length,b.items.length);i++){const x=a.items[i],y=b.items[i];for(const key of ['kind','key'])if(x[key]!==y[key])structural.push({source,item:i,key,current:x[key],original:y[key]});for(const key of ['x','y','sx','sy','width','height'])if((x[key]!==undefined||y[key]!==undefined)&&!numeric(x[key]??1,y[key]??1))differences.push({source,item:i,key,current:x[key],original:y[key]});}}
  report.originalLayoutComparison={sources:200,toleranceRelative:1e-10,structuralDifferences:structural,numericalDifferences:differences,note:'Oldnative catalog6b3f metrics differ from currentcatalog8227. Oldnumeric equality is recorded, never claimed; current full source certification and exact physical font bindings remain required.'};need(!structural.length,'ORIGINAL_SOURCE_GLYPH_STRUCTURE_CHANGED');
  const snapshot=status.sourceSnapshot(),expected=[],vectors=await fetch(base+'vf-ui/artifacts/current-labels/native-mapping/vectors.json').then(r=>r.json()),binding=await fetch(base+'vf-ui/artifacts/current-labels/native-mapping/binding.json').then(r=>r.json());const physicalCommands=operators=>operators.trim().split('\n').map(line=>{const t=line.trim().split(/\s+/),op=t.pop();return [{m:'M',l:'L',c:'C',h:'Z'}[op],...t.map(Number)];});for(const source of sources)for(const spec of specs.filter(s=>s.source===source))for(const [itemIndex,item]of boxes[source].items.entries())expected.push({source,spec,itemIndex,item});
  need(snapshot.sources.length===35100&&expected.length===35100,'ALL_ORIGINAL_35100_OUTLINES');let glyphs=0,rules=0;
  for(let i=0;i<expected.length;i++){const o=snapshot.sources[i],e=expected[i],p=o.provenance;
   need(p.source===e.source&&p.elementId===e.spec.id&&p.itemIndex===e.itemIndex,'SOURCE_ELEMENT_ORDER:'+i);
   need(p.programSha256===engine.identity.programSha256&&p.catalogSha256===engine.identity.catalogSha256,'CURRENT_PRODUCER_BINDING:'+i);
   const c=cameras[0],z=e.spec.scale,a=e.spec.anchor,x=e.item.x,y=e.item.y,sx=e.item.sx??1,sy=e.item.sy??1,b=[c[0]*z,c[1]*z,-c[2]*z,-c[3]*z,c[0]*a[0]+c[2]*a[1]+c[4],c[1]*a[0]+c[3]*a[1]+c[5]],matrix=[b[0]*sx,b[1]*sx,b[2]*sy,b[3]*sy,b[0]*x+b[2]*y+b[4],b[1]*x+b[3]*y+b[5]];need(JSON.stringify(o.matrix)===JSON.stringify(matrix),'ORIGINAL_SPEC_ITEM_CAMERA_PLACEMENT:'+i);
   need(o.displayOnly===false&&o.matrix.every(Number.isFinite)&&o.commands.length,'FINITE_PHYSICAL_OUTLINE:'+i);
   if(e.item.kind==='glyph'){glyphs++;need(p.nativeItemKey===e.item.key&&binding.entries[e.item.key]?.outlineDigest===vectors.keys[e.item.key]&&JSON.stringify(o.commands)===JSON.stringify(physicalCommands(vectors.paths[vectors.keys[e.item.key]].operators)),'PHYSICAL_FONT_BINDING:'+i);}else{rules++;need(JSON.stringify(o.commands)===JSON.stringify([['M',0,0],['L',e.item.width,0],['L',e.item.width,e.item.height],['L',0,e.item.height],['Z']]),'PHYSICAL_RULE:'+i);}}
  need(glyphs===34100&&rules===1000,'ORIGINAL_CENSUS');report.census={labels:10000,distinctSources:200,glyphs,rules,outlines:35100,allOrderedSourceElements:true,allOriginalSpecItemCameraMatrices:true,allPhysicalFontBindings:true};

  const {compileNativeSampleProof}=await import('/__e1874/reference.mjs');
  const expectedCommands=new Map();for(const e of expected){const k=e.item.kind==='glyph'?e.item.key:JSON.stringify([e.item.width,e.item.height]);if(!expectedCommands.has(k))expectedCommands.set(k,e.item.kind==='glyph'?physicalCommands(vectors.paths[vectors.keys[e.item.key]].operators):[['M',0,0],['L',e.item.width,0],['L',e.item.width,e.item.height],['L',0,e.item.height],['Z']]);e.commands=expectedCommands.get(k);}
  function verifyCurrent(camera,color){const snapshot=VfDisplay.nativeLabelFrameStatus(id).sourceSnapshot();need(snapshot.sources.length===35100,'FULL_CURRENT_SNAPSHOT');const originals=[];
   for(let i=0;i<expected.length;i++){const e=expected[i],o=snapshot.sources[i],c=camera,z=e.spec.scale,a=e.spec.anchor,x=e.item.x,y=e.item.y,sx=e.item.sx??1,sy=e.item.sy??1,b=[c[0]*z,c[1]*z,-c[2]*z,-c[3]*z,c[0]*a[0]+c[2]*a[1]+c[4],c[1]*a[0]+c[3]*a[1]+c[5]],m=[b[0]*sx,b[1]*sx,b[2]*sy,b[3]*sy,b[0]*x+b[2]*y+b[4],b[1]*x+b[3]*y+b[5]];
    need(JSON.stringify(o.matrix)===JSON.stringify(m)&&JSON.stringify(o.commands)===JSON.stringify(e.commands)&&o.provenance.elementId===e.spec.id&&o.provenance.itemIndex===e.itemIndex&&o.provenance.source===e.source,'ALL_VIEW_ORIGINAL_SOURCE_COMPOSITION:'+i);
    need(JSON.stringify(o.color)===JSON.stringify(color),'APPLIED_CURRENT_MATERIAL:'+i);
    const coords=e.commands.flatMap(q=>{const p=[];for(let j=1;j<q.length;j+=2)p.push([m[0]*q[j]+m[2]*q[j+1]+m[4],m[1]*q[j]+m[3]*q[j+1]+m[5]]);return p;});originals.push({commands:e.commands,matrix:m,bounds:[Math.min(...coords.map(p=>p[0]))-1,Math.min(...coords.map(p=>p[1]))-1,Math.max(...coords.map(p=>p[0]))+1,Math.max(...coords.map(p=>p[1]))+1]});
   }return originals;
  }
  let currentCamera=cameras[0],currentColor=[0,0,0,1];
  const readback=()=>{const s=VfDisplay.nativeLabelFrameStatus(id),gl=s.canvas.getContext('webgl2'),pixels=new Uint8Array(s.canvas.width*s.canvas.height*4);gl.finish();gl.readPixels(0,0,s.canvas.width,s.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);need(gl.getError()===gl.NO_ERROR&&!gl.isContextLost(),'GPU_READBACK');let hash=2166136261,ink=0,red=0,blue=0;for(let i=0;i<pixels.length;i+=4){for(let j=0;j<4;j++)hash=Math.imul(hash^pixels[i+j],16777619);if(pixels[i+3]&&pixels[i]+pixels[i+1]+pixels[i+2]<740)ink++;if(pixels[i]>pixels[i+2]*1.5&&pixels[i]>40)red++;if(pixels[i+2]>pixels[i]*1.5&&pixels[i+2]>40)blue++;}need(ink>0,'NONBLANK_FULL_RGBA');const originals=verifyCurrent(currentCamera,currentColor),probes=[];
   for(let i=0;i<24;i++){const r=originals[Math.floor(i*(originals.length-1)/23)],b=r.bounds,x=Math.floor((b[0]+b[2])/2),y=Math.floor((b[1]+b[3])/2);if(x<0||x>=s.canvas.width||y<0||y>=s.canvas.height)continue;let covered=0;const candidates=originals.filter(o=>o.bounds[0]<=x+1&&o.bounds[2]>=x&&o.bounds[1]<=y+1&&o.bounds[3]>=y).map(o=>compileNativeSampleProof(o.commands,o.matrix));
    for(let iy=y*4;iy<y*4+4;iy++)for(let ix=x*4;ix<x*4+4;ix++)if(candidates.some(p=>p.winding(ix,iy)!==0))covered++;
    const bytes=[...currentColor.slice(0,3).map(v=>Math.floor(v*255+.5)),255],expected=bytes.map(v=>Math.floor((v*covered+8)/16)),at=((s.canvas.height-1-y)*s.canvas.width+x)*4,actual=Array.from(pixels.slice(at,at+4));need(JSON.stringify(actual)===JSON.stringify(expected),'INDEPENDENT_ORIGINAL_EXACT_AA16_RGBA:'+JSON.stringify({x,y,expected,actual,covered}));probes.push({x,y,expected,actual,covered});
   }need(probes.length>0,'APPLICABLE_ORIGINAL_RASTER_PROBES');need(s.statistics.census.labels===10000&&s.statistics.renderer.nativeAccuracy.outlines===35100&&s.statistics.renderer.nativeAccuracy.status==='SOURCE_CERTIFIED_DISPLAY_PLAN','FULL_SOURCE_CERTIFIED_CENSUS');return {independentExactAA16RGBAProbes:probes,all35100CurrentSourceMatricesAndCommands:true,pixelHash:hash>>>0,nonblankPixels:ink,redPixels:red,bluePixels:blue,statistics:s.statistics};};
  // Re-submit the accepted camera so the full readback observes the same draw.
  for(const [index,camera]of cameras.entries()){currentCamera=camera;await VfDisplay.updateNativeLabelFrameView(id,camera);report.views.push({index,...readback()});await phase({phase:'ORIGINAL_VIEW_COMPLETE',completedViews:report.views.length});}
  need(new Set(report.views.map(v=>v.pixelHash)).size===30,'ALL_30_ORIGINAL_CHANGED_VIEWS');
  for(const color of [[.9,.1,.2,1],[.1,.2,.9,1]]){currentColor=color;await VfDisplay.updateNativeLabelFrameColor(id,color);report.colors.push({color,...readback()});}
  need(report.colors[0].redPixels>100&&report.colors[0].redPixels>report.colors[0].bluePixels&&report.colors[1].bluePixels>100&&report.colors[1].bluePixels>report.colors[1].redPixels,'ORIGINAL_OPAQUE_COLOR_OUTPUT');
  const retained=readback().pixelHash;let invalidRefused=false;try{await VfDisplay.updateNativeLabelFrameColor(id,[1,0,0,.5]);}catch(e){invalidRefused=String(e).includes('NATIVE_LABEL_OPAQUE_COLOR');}need(invalidRefused&&readback().pixelHash===retained,'INVALID_STYLE_RETAINS_CURRENT_FRAME');report.invalidStyleRefusalPreservedFrame=true;
  report.status='PASS_ORIGINAL10000_CURRENT_REQUIRED_PATH';return report;
 } catch(e){primaryFailure=e;report.status='FAIL_ORIGINAL10000_CURRENT_REQUIRED_PATH';report.error=String(e.stack??e);await phase({phase:'ORIGINAL_FAILURE_PRESERVED'});throw e;}
 finally {
  report.producerResults=engine?.results;const cleanupErrors=[];
  const attempt=async(name,action)=>{try{await action();return true;}catch(e){cleanupErrors.push({name,error:String(e.stack??e)});return false;}};
  const mountedCanvas=VfDisplay.nativeLabelFrameStatus(id)?.canvas;
  await attempt('display.disposeGeomFrame',()=>VfDisplay.disposeGeomFrame(id));
  await attempt('frame.destroy',()=>frame?.destroy());
  report.cleanupJoined=await attempt('native cleanup join',()=>VfDisplay.joinNativeLabelCleanup());
  await attempt('engine.close',()=>engine?.close());
  await attempt('container.remove',()=>container?.remove());
  await attempt('settle cancelled overlay callbacks',()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await attempt('settled native cleanup join',()=>VfDisplay.joinNativeLabelCleanup());
  await attempt('supported ownership contract',()=>{
   const final=VfDisplay.nativeLabelFrameStatus(id),stats=engine?.statistics();report.finalProducerStats=stats;
   // A frameRec may intentionally retain FAILED/error history after unmount.
   // Released fields and actual typography ownership establish this contract.
   need(!final||(!final.ready&&!final.canvas&&final.sourceSnapshot===null),'FRAME_NATIVE_RESOURCES_RELEASED');
   need(!mountedCanvas?.isConnected&&!container?.isConnected&&!document.querySelector('.vf-native-label-canvas'),'FRAME_NATIVE_DOM_RELEASED');
   if(engine)need(stats.leases===0&&stats.cachedFormulas===0&&stats.closed===true,'CURRENT_NATIVE_OWNER_RELEASED');
   report.ownership={released:true,retainedFrameStatus:final?.statistics??null,producer:stats};
  });
  report.cleanupErrors=cleanupErrors;
  if(cleanupErrors.length&&!primaryFailure)report.status='FAIL_ORIGINAL10000_CURRENT_REQUIRED_OWNERSHIP';
  await attempt('save cleanup phase',()=>phase({phase:'NORMAL_CLEANUP',producerStats:report.finalProducerStats}));
  // Preserve the first product/oracle failure. Cleanup remains independently
  // visible and may fail an otherwise successful run; it never erases history.
  if(cleanupErrors.length&&!primaryFailure)throw new AggregateError(cleanupErrors.map(e=>Error(e.name+': '+e.error)),'NORMAL_OWNERSHIP_CLEANUP_FAILED');
 }
}
