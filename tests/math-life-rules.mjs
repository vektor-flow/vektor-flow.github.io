import assert from 'node:assert/strict';import fs from 'node:fs';
import{createSymbolicKernel}from'../public/vf-ui/vf-symbolic-kernel-runtime.mjs';import{createRules}from'../public/previews/math-life/rules.mjs';
const{instance}=await WebAssembly.instantiate(fs.readFileSync(new URL('../public/vf-ui/artifacts/vkf-symbolic-kernel.wasm',import.meta.url)));const rules=createRules(createSymbolicKernel({instance,manifest:JSON.parse(fs.readFileSync(new URL('../public/vf-ui/artifacts/vkf-symbolic-kernel.json',import.meta.url)))}));
let cases=0;for(let n=-12;n<=12;n++)for(const[op,v,expected]of[['add',2,n+2],['add',-1,n-1],['multiply',2,n*2],['divide',2,n/2],['root',0,Math.sqrt(n)]]){const a=rules.number(n),b=rules.operation(op,v);for(const[x,y]of[[a,b],[b,a]]){const r=rules.combine(x,y);const negativeSquare=op==='root'&&n<0&&Number.isSafeInteger(Math.sqrt(-n));assert.equal(r.ok,Number.isSafeInteger(expected)||negativeSquare);if(r.ok){assert.equal(r.result.value,negativeSquare?0:expected);assert.equal(r.result.imag,negativeSquare?Math.sqrt(-n):0);}cases++;}}
assert.equal(rules.combine(rules.operation('add',1),rules.operation('add',-1)).result,null);assert.equal(rules.combine(rules.operation('multiply',2),rules.operation('divide',2)).result,null);assert.equal(rules.combine(rules.operation('add',1),rules.operation('add',2)).result.value,3);assert.equal(rules.combine(rules.operation('add',2),rules.operation('root')).ok,false);assert.equal(rules.combine(rules.number(3),rules.number(4)).ok,false);assert.equal(rules.combine(rules.number(4),rules.operation('divide',0)).ok,false);
assert.equal(rules.combine(rules.number(4503599627370497),rules.operation('root')).ok,false,'A rounded floating-point square root must not masquerade as an integer');
for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++)assert.equal(rules.combine(rules.number(a),rules.number(b)).ok,false);
for(const[a,b,op,value]of[[4,2,'multiply',2],[2,4,'divide',2]]){const r=rules.combine(rules.operation('multiply',a),rules.operation('divide',b));assert(r.ok);assert.equal(r.result.op,op);assert.equal(r.result.value,value);}assert.equal(rules.combine(rules.operation('multiply',2),rules.operation('divide',3)).ok,false);
console.log('PASS',cases,'native symbolic compatibility cases, operation composition, cancellation and invalid domains');

const root=n=>rules.combine(n,rules.operation('root'));
assert.deepEqual(root(rules.number(-1)).result,rules.number(0,1));
assert.deepEqual(root(rules.number(-4)).result,rules.number(0,2));
assert.deepEqual(root(rules.number(3,4)).result,rules.number(2,1));
assert.deepEqual(root(rules.number(3,-4)).result,rules.number(2,-1));
assert.equal(root(rules.number(0,1)).ok,false);
assert.equal(root(rules.number(-2)).ok,false);
assert.deepEqual(rules.combine(rules.number(0,1),rules.operation('multiply',0,1)).result,rules.number(-1));
assert.deepEqual(rules.combine(rules.number(1,1),rules.operation('divide',1,-1)).result,rules.number(0,1));
assert.equal(rules.combine(rules.number(1),rules.operation('divide',1,1)).ok,false);
assert.deepEqual(rules.combine(rules.operation('add',0,1),rules.operation('add',0,-1)).result,null);
assert.equal(rules.latex(rules.number(0,1)),'i');
assert.equal(rules.label(rules.number(2,-3)),'2-3i');
// Exhaustive small Gaussian roots: independent exact integer squaring oracle.
let gaussianCases=0;for(let r=-15;r<=15;r++)for(let i=-15;i<=15;i++){const got=root(rules.number(r,i));const matches=[];for(let a=0;a<=6;a++)for(let b=-6;b<=6;b++)if(a*a-b*b===r&&2*a*b===i&&(a>0||b>=0))matches.push([a,b]);assert.equal(got.ok,matches.length>0);if(got.ok)assert.deepEqual([got.result.value,got.result.imag],matches[0]);gaussianCases++;}
console.log('PASS',gaussianCases,'Gaussian integer root cases, principal +i branch, arithmetic and exact rejection');
