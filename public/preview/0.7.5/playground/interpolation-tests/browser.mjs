// ACTUAL only. Call with the real current createCanonicalExecution instance
// in its normal retained-owner browser page. No numerical or renderer mock.
const sameNumbers=(got,wanted,label)=>{
  const numbers=got.trim().split(/\r?\n/u).map(Number);
  if(numbers.length!==wanted.length||numbers.some((value,index)=>value!==wanted[index]))
    throw new Error(label+': complete scalar stdout differs: '+got);
};
const curveMesh=output=>{
  if(!Array.isArray(output.retained_scene_arenas)||!output.retained_scene_arenas.length)
    throw new Error('Shared curve has no complete retained output');
  let found;
  const visit=value=>{
    if(!value||typeof value!=='object')return;
    if(value.id==='shared-curve'&&value.vertices&&value.indices)found=value;
    for(const child of Object.values(value))visit(child);
  };
  for(const packet of output.retained_scene_arenas){
    if(!(packet.arena instanceof Uint8Array)||packet.arena.length===0)
      throw new Error('Shared curve arena bytes missing');
    visit(packet.metadata);
  }
  if(!found)throw new Error('Shared curve mesh missing');
  // All five authored samples and four line segments must survive transport.
  if(found.vertices.length!==50||found.indices.length!==8||found.topology!=='line-list')
    throw new Error('Shared curve output population/topology changed');
  return found;
};
const completeEqual=(actual,reference)=>{
  if(actual.stdout!==reference.stdout||actual.stderr!==reference.stderr)
    throw new Error('Shared and literal-reference console output differs');
  const a=actual.retained_scene_arenas,b=reference.retained_scene_arenas;
  if(a.length!==b.length)throw new Error('Complete retained packet count differs');
  for(let p=0;p<a.length;p++){
    if(JSON.stringify({...a[p],arena:null})!==JSON.stringify({...b[p],arena:null}))
      throw new Error('Complete retained packet metadata differs');
    if(a[p].arena.length!==b[p].arena.length||a[p].arena.some((value,index)=>value!==b[p].arena[index]))
      throw new Error('Complete retained arena bytes differ');
  }
};
// Independent analytic samples at t=0,1/4,1/2,3/4,1. No test-side solver.
const literalReference=edited=>`viewport:.ui.viewport
viewport.add(x:[0,0.75,1.5,2.25,3]_u,y:${edited?'[0,2.25,3,2.25,0]':'[0,1.125,1.5,1.125,0]'}_u,id:"shared-curve",interp:true,color:[0.2,0.7,1,1])
viewport.show()
::0
::0.75
::1.5
::2.25
::3
::0
::${edited?'2.25':'1.125'}
::${edited?'3':'1.5'}
::${edited?'2.25':'1.125'}
::0
`;
export async function verifyInterpolation(execution,plotSource){
  const witness=`i:.interpolation
p:i.prepare_bezier([0,0,1,2,2,2,3,0],2)
s:i.sample_polynomial(p,0.5)
::i.lerp(0,4,0.25)
::s.value.(0)
::s.value.(1)
::s.first.(0)
::s.second.(1)
`;
  const numeric=await execution.run(witness,'<paired-interpolation-witness>');
  sameNumbers(numeric.output.stdout,[1,1.5,1.5,3,-12],'analytic cubic witness');
  const edited=plotSource.replace('height:2','height:4');
  if(edited===plotSource)throw new Error('Ordinary plot edit did not apply');
  const original=await execution.run(plotSource,'<shared-interpolation-plot>');
  sameNumbers(original.output.stdout,[0,0.75,1.5,2.25,3,0,1.125,1.5,1.125,0],'original shared plot');
  curveMesh(original.output);
  const originalReference=await execution.run(literalReference(false),'<analytic-literal-plot>');
  curveMesh(originalReference.output);
  completeEqual(original.output,originalReference.output);
  const changed=await execution.run(edited,'<shared-interpolation-plot>');
  sameNumbers(changed.output.stdout,[0,0.75,1.5,2.25,3,0,2.25,3,2.25,0],'edited shared plot');
  curveMesh(changed.output);
  const changedReference=await execution.run(literalReference(true),'<analytic-literal-plot-edit>');
  curveMesh(changedReference.output);
  completeEqual(changed.output,changedReference.output);
  return {status:'PASS_PAIRED_NUMERICS_AND_EXPLICIT_PLOT_CALLER',
    sourceBinding:execution.sourceBinding,
    limits:['This older explicit-coordinate check does not exercise the new PlotCurve parameter route; use verifyPlotParameter.',
      'No GPU or raster quality claim from this guest/output test.']};
}


// Actual new parameter route. Unlike the earlier explicit-coordinate fixture,
// the input source has no x/y/p operands; Frame.add consumes the descriptor.
export async function verifyPlotParameter(execution,source){
  if(source.includes('viewport.add(x:')||!source.includes('interp:plot_value(height)'))
    throw new Error('Actual interpolation parameter fixture required');
  const reference=(heightEdited,scheduleEdited)=>`viewport:.ui.viewport
::11
::17
::23
viewport.add(color:[0.2,0.7,1,1],x:${scheduleEdited?'[0,0.375,1.5,2.625,3]':'[0,0.75,1.5,2.25,3]'}_u,y:${scheduleEdited?'[0,0.65625,1.5,0.65625,0]':heightEdited?'[0,2.25,3,2.25,0]':'[0,1.125,1.5,1.125,0]'}_u,w:1,id:"shared-curve",interpolation:true)
viewport.show()
`;
  const heightEdit=source.replace('height:2','height:4');
  const scheduleEdit=source.replace('[0,0.25,0.5,0.75,1]','[0,0.125,0.5,0.875,1]');
  if(heightEdit===source||scheduleEdit===source)throw new Error('Real parameter edits did not apply');
  const rows=[];
  for(const [name,text,literal] of [
    ['original',source,reference(false,false)],
    ['control-edit',heightEdit,reference(true,false)],
    ['parameter-schedule-edit',scheduleEdit,reference(false,true)]]){
    const actual=await execution.run(text,'<plot-interpolation-parameter>');
    sameNumbers(actual.output.stdout,[11,17,23],name+': argument order and exactly-once constructor');
    const mesh=curveMesh(actual.output);
    if(mesh.interpolation!==true)throw new Error('Legacy mesh-normal interpolation flag changed');
    const expected=await execution.run(literal,'<analytic-literal-reference>');
    curveMesh(expected.output);
    completeEqual(actual.output,expected.output);
    rows.push({name,completeMetadataAndArenaEqual:true,vertices:5,segments:4});
  }
  // Legacy interp bits still use the existing path; this does not reinterpret
  // true/false as a new curve method or conflate it with normal interpolation.
  for(const flag of ['false','true']){
    const text=reference(false,false).replace('interpolation:true','interp:'+flag+',interpolation:true');
    const legacy=await execution.run(text,'<legacy-interp-bit>');
    const expected=await execution.run(reference(false,false),'<legacy-interp-reference>');
    completeEqual(legacy.output,expected.output);
  }
  const conflict=source.replace('interp:plot_value(height)','x:[0,1]_u,y:[0,1]_u,interp:plot_value(height)');
  let conflictRejected=false;
  try{await execution.run(conflict,'<conflicting-plot-interpolation-input>');}
  catch(error){
    if(!String(error.message??error).includes('interp PlotCurve cannot mix explicit p/x/y/z coordinates'))throw error;
    conflictRejected=true;
  }
  if(!conflictRejected)throw new Error('PlotCurve must not silently replace explicit coordinates');
  return {status:'PASS_REAL_PLOT_INTERPOLATION_PARAMETER_COMPLETE_OUTPUT',sourceBinding:execution.sourceBinding,rows,
    limits:['Source implementation is UNRUN until this test executes on the newly matched package.',
      'No raster/GPU quality or release acceptance claim from the guest/output checker.']};
}
