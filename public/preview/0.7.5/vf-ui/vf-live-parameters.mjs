// Authored input bindings and clock sampling only. VKF evaluates the stable
// t-dependent plot program; this module never interpolates or renders states.
export function liveParameterValues(parameters=[],elapsedMs=0){
 if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw RangeError('Invalid live parameter time.');
 return Object.fromEntries(parameters.map(p=>{
  const count=Math.round((p.max-p.min)/p.step),offset=Math.round((p.initial-p.min)/p.step);
  const tick=Math.floor(elapsedMs/p.intervalMs+1e-7),phase=(tick+offset)%(2*count);
  return [p.variable,Number((p.min+p.step*(count-Math.abs(phase-count))).toFixed(12))];
 }));
}
export function liveParameterDefinitions(definitions,parameters=[]){
 if(!parameters.length)return definitions;
 const names=new Set(parameters.map(p=>p.variable));
 const result={...definitions,global:definitions.global.filter(source=>!names.has(source.match(/^\s*([A-Za-z_]\w*)\s*=/)?.[1]))};
 if(definitions.typedGlobal)result.typedGlobal=Object.fromEntries(Object.entries(definitions.typedGlobal).filter(([name])=>!names.has(name)));
 for(const p of parameters){
  const count=Math.round((p.max-p.min)/p.step),offset=Math.round((p.initial-p.min)/p.step);
  const tick=`(floor(t*${1000/p.intervalMs}+0.0000001)+${offset})`,phase=`(${tick}-${2*count}*floor(${tick}/${2*count}))`;
  result.global.push(`${p.variable}=(${p.min}+${p.step}*(${count}-abs(${phase}-${count})))`);
 }
 return result;
}
