// VKF's symbolic kernel evaluates real components. Exact integer witnesses guard
// Gaussian arithmetic against floating-point rounding and invalid domains.
export function createRules(kernel){
 const cache=new Map();
 function evaluate(source){if(cache.has(source))return cache.get(source);const p=kernel.invokeValue('symbolic_compile',[source]);if(p.diagnostics?.length)throw Error('Invalid expression');const value=kernel.invokeValue('symbolic_program_evaluate',[p,0,0]);cache.set(source,value);return value;}
 const number=(value,imag=0)=>({kind:'number',value,imag});
 const operation=(op,value=0,imag=0)=>({kind:'operation',op,value,imag});
 const valid=x=>Number.isSafeInteger(x.value)&&Number.isSafeInteger(x.imag??0);
 const parts=x=>[BigInt(x.value),BigInt(x.imag??0)];
 function exact(source,witness){const value=evaluate(source);return Number.isSafeInteger(value)&&BigInt(value)===witness?value:null;}
 function arithmetic(a,b,op){if(!valid(a)||!valid(b))return null;const[ar,ai]=parts(a),[br,bi]=parts(b),r=String(a.value),i=String(a.imag??0),s=String(b.value),j=String(b.imag??0);let re,im;
  if(op==='add'){re=exact(`(${r})+(${s})`,ar+br);im=exact(`(${i})+(${j})`,ai+bi);}
  else if(op==='multiply'){re=exact(`(${r})*(${s})-(${i})*(${j})`,ar*br-ai*bi);im=exact(`(${r})*(${j})+(${i})*(${s})`,ar*bi+ai*br);}
  else{const den=br*br+bi*bi,nr=ar*br+ai*bi,ni=ai*br-ar*bi;if(den===0n||nr%den!==0n||ni%den!==0n)return null;re=exact(`((${r})*(${s})+(${i})*(${j}))/((${s})*(${s})+(${j})*(${j}))`,nr/den);im=exact(`((${i})*(${s})-(${r})*(${j}))/((${s})*(${s})+(${j})*(${j}))`,ni/den);}
  return re===null||im===null?null:number(re,im);
 }
 function isqrt(n){if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));while(true){const y=(x+n/x)/2n;if(y>=x)return x;x=y;}}
 function root(a){if(!valid(a))return null;const[r,i]=parts(a),normSquared=r*r+i*i,norm=isqrt(normSquared);if(norm*norm!==normSquared||(norm+r)%2n!==0n)return null;const rr=(norm+r)/2n,ii=(norm-r)/2n,real=isqrt(rr),imag=isqrt(ii);if(real*real!==rr||imag*imag!==ii)return null;
  // Principal root: positive real part; on the negative real axis choose +i.
  const re=exact(`sqrt(${rr})`,real),im=exact(`sqrt(${ii})`,imag);if(re===null||im===null)return null;return number(re,i<0n?-im:im);
 }
 const zero=x=>x.value===0&&(x.imag??0)===0,one=x=>x.value===1&&(x.imag??0)===0;
 function combine(a,b){
  if(a.kind==='number'&&b.kind==='number')return{ok:false,reason:'Two expressions stay separate. Apply an operation.'};
  if(a.kind!==b.kind){const n=a.kind==='number'?a:b,op=a.kind==='operation'?a:b,value=op.op==='root'?root(n):arithmetic(n,op,op.op);if(!value)return{ok:false,reason:op.op==='root'?'That root is not a Gaussian integer.':op.op==='divide'?'That division leaves the Gaussian integers.':'Keep both components exact integers.'};return{ok:true,result:value,equation:`${label(n)} ${label(op)} → ${label(value)}`};}
  if(a.op===b.op&&['add','multiply','divide'].includes(a.op)){const value=arithmetic(a,b,a.op==='add'?'add':'multiply');if(!value||a.op==='divide'&&zero(value))return{ok:false,reason:'Keep the operation exact and defined.'};const vanish=a.op==='add'?zero(value):one(value),result=vanish?null:operation(a.op,value.value,value.imag);return{ok:true,result,equation:vanish?'The operations cancel.':`${label(a)} and ${label(b)} become ${label(result)}`};}
  if(new Set([a.op,b.op]).size===2&&[a.op,b.op].every(x=>['multiply','divide'].includes(x))){const mul=a.op==='multiply'?a:b,div=a.op==='divide'?a:b;if(!zero(div)){const ratio=arithmetic(mul,div,'divide');if(ratio){const result=one(ratio)?null:operation('multiply',ratio.value,ratio.imag);return{ok:true,result,equation:result?`Together: ${label(result)}`:'The operations cancel.'};}const inverse=arithmetic(div,mul,'divide');if(inverse){const result=operation('divide',inverse.value,inverse.imag);return{ok:true,result,equation:`Together: ${label(result)}`};}}}
  return{ok:false,reason:'These operations stay separate. Try one on an expression.'};
 }
 function scalar(x){const r=x.value,i=x.imag??0;if(!i)return String(r);const tail=(Math.abs(i)===1?'':Math.abs(i))+'i';return r?`${r}${i<0?'-':'+'}${tail}`:(i<0?'-':'')+tail;}
 function operand(x){const value=scalar(x);return x.value&&(x.imag??0)?`(${value})`:value;}
 function label(x){if(x.kind==='number')return scalar(x);return x.op==='root'?'√':x.op==='add'?((x.value||x.imag||0)>=0?'+':'')+operand(x):x.op==='multiply'?'×'+operand(x):'÷'+operand(x);}
 function latex(x){if(x.kind==='number')return scalar(x);return x.op==='root'?'\\sqrt{\\phantom{0}}':x.op==='add'?((x.value||x.imag||0)>=0?'+':'')+operand(x):x.op==='multiply'?'\\times '+operand(x):'\\div '+operand(x);}
 return{combine,label,latex,number,operation};
}
