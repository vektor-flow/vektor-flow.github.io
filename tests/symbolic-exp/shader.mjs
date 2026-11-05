import assert from 'node:assert/strict';
import {compileSymbolicExplicitCurveShaderGroup,compileSymbolicRelationShader,compileSymbolicScalarFieldShader} from '../../public/preview/0.7.5/vf-ui/geom/vf-symbolic-relation-shader.mjs';
const x={kind:'variable',name:'x'},argument={kind:'binary',op:'*',left:x,right:x},expression={kind:'call',name:'exp',args:[argument]};
const relation={kind:'binary',op:'=',left:{kind:'variable',name:'y'},right:expression};
const compiled=compileSymbolicExplicitCurveShaderGroup([{ast:relation,explicitCurve:{parameter:'x',dependent:'y',expression}}]);
assert.equal(compiled.boundaryDistanceMode,'explicit');
for(const language of ['wgsl','glsl']){
 assert(compileSymbolicRelationShader(relation)[language+'BoundaryResidual'].includes('exp('));
 assert(compileSymbolicScalarFieldShader(expression)[language+'Value'].includes('exp('));
 const jets=compiled.explicitCurves[0][language];
 for(const x of [-2,-.5,0,.7,2]){
  const actual=jets.map(s=>Function('x','exp','return '+s)(x,Math.exp)),e=Math.exp(x*x),expected=[e,2*x*e,(2+4*x*x)*e];
  actual.forEach((v,i)=>assert(Math.abs(v-expected[i])<=1e-12*Math.max(1,Math.abs(expected[i]))));
 }
}
for(const args of [[],[x,x]])assert.equal(compileSymbolicScalarFieldShader({kind:'call',name:'exp',args}),null);
assert.equal(compileSymbolicScalarFieldShader({kind:'call',name:'unsupported',args:[x]}),null);
console.log('PASS exp GPU scalar/relation emission, chained first/second jets and malformed arity refusal');
