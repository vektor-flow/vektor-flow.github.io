// The game supplies compatibility policy; VKF's native symbolic kernel computes values.
export function createRules(kernel){
 const cache=new Map();
 function evaluate(source){if(cache.has(source))return cache.get(source);const p=kernel.invokeValue('symbolic_compile',[source]);if(p.diagnostics?.length)throw Error('Invalid expression');const value=kernel.invokeValue('symbolic_program_evaluate',[p,0,0]);cache.set(source,value);return value;}
 const number=value=>({kind:'number',value});
 const operation=(op,value=0)=>({kind:'operation',op,value});
 const valid=value=>Number.isSafeInteger(value);
 function source(n,op){return op.op==='add'?`(${n})+(${op.value})`:op.op==='multiply'?`(${n})*(${op.value})`:op.op==='divide'?`(${n})/(${op.value})`:`sqrt(${n})`;}
 function combine(a,b){
  if(a.kind==='number'&&b.kind==='number')return{ok:false,reason:'Two expressions stay separate. Apply an operation.'};
  if(a.kind!==b.kind){const n=a.kind==='number'?a:b,op=a.kind==='operation'?a:b;const value=evaluate(source(n.value,op));const exact=valid(value)&&(op.op!=='root'||evaluate(`(${value})*(${value})`)===n.value)&&(op.op!=='divide'||evaluate(`(${value})*(${op.value})`)===n.value);if(!exact)return{ok:false,reason:op.op==='root'?'A square root needs a perfect square.':op.op==='divide'?'That division does not make a whole number.':'Keep the result an exact whole number.'};return{ok:true,result:number(value),equation:`${label(n)} ${label(op)} → ${value}`};}
  if(a.op===b.op&&['add','multiply','divide'].includes(a.op)){
   const value=evaluate(`(${a.value})${a.op==='add'?'+':'*'}(${b.value})`);if(!valid(value))return{ok:false,reason:'Keep the operation exact.'};const vanish=a.op==='add'?value===0:value===1;
   return{ok:true,result:vanish?null:operation(a.op,value),equation:vanish?'The operations cancel.':`${label(a)} and ${label(b)} become ${label(operation(a.op,value))}`};
  }
  if(new Set([a.op,b.op]).size===2&&[a.op,b.op].every(x=>['multiply','divide'].includes(x))){const mul=a.op==='multiply'?a:b,div=a.op==='divide'?a:b;if(div.value!==0){const ratio=evaluate(`(${mul.value})/(${div.value})`);if(valid(ratio)&&evaluate(`(${ratio})*(${div.value})`)===mul.value)return{ok:true,result:ratio===1?null:operation('multiply',ratio),equation:ratio===1?'The operations cancel.':`Together: ${label(operation('multiply',ratio))}`};const inverse=evaluate(`(${div.value})/(${mul.value})`);if(valid(inverse)&&evaluate(`(${inverse})*(${mul.value})`)===div.value)return{ok:true,result:operation('divide',inverse),equation:`Together: ${label(operation('divide',inverse))}`};}}
  return{ok:false,reason:'These operations stay separate. Try one on a number.'};
 }
 function label(x){if(x.kind==='number')return String(x.value);return x.op==='root'?'√':x.op==='add'?(x.value>=0?'+':'')+x.value:x.op==='multiply'?'×'+x.value:'÷'+x.value;}
 function latex(x){if(x.kind==='number')return String(x.value);return x.op==='root'?'\\sqrt{\\phantom{0}}':x.op==='add'?(x.value>=0?'+':'')+x.value:x.op==='multiply'?'\\times '+x.value:'\\div '+x.value;}
 return{combine,label,latex,number,operation};
}
