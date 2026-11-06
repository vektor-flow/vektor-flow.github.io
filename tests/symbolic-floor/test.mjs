import assert from 'node:assert/strict';
import {
  compileSymbolicExplicitCurveShaderGroup,
  compileSymbolicRelationShader,
  compileSymbolicScalarFieldShader
} from '../../public/preview/0.7.5/vf-ui/geom/vf-symbolic-relation-shader.mjs';

const variable = name => ({kind: 'variable', name});
const number = value => ({kind: 'number', value});
const floor = argument => ({kind: 'call', name: 'floor', args: [argument]});
const binary = (op, left, right) => ({kind: 'binary', op, left, right});
let cases = 0;

for (const parameter of ['x', 'y']) {
  const dependent = parameter === 'x' ? 'y' : 'x';
  const expression = floor(binary('+', binary('*', variable(parameter), number(100)), number(.000001)));
  const ast = binary('=', variable(dependent), expression);
  const compiled = compileSymbolicExplicitCurveShaderGroup([
    {ast, explicitCurve: {parameter, dependent, expression}}
  ]);
  assert(compiled);
  for (const language of ['wgsl', 'glsl']) {
    assert(compileSymbolicScalarFieldShader(expression)[language + 'Value'].includes('floor('));
    assert(compileSymbolicRelationShader(ast)[language + 'BoundaryResidual'].includes('floor('));
    for (const value of [-1.013, -.002, .002, .013, 1.013]) {
      const actual = compiled.explicitCurves[0][language].map(source =>
        Function(parameter, 'floor', 'return ' + source)(value, Math.floor));
      assert.deepEqual(actual, [Math.floor(value * 100 + .000001), 0, 0]);
      cases++;
    }
  }
}

// The production use is time-only: spatial jets must remain exactly zero.
const timed = compileSymbolicExplicitCurveShaderGroup([
  {explicitCurve: {parameter: 'x', dependent: 'y', expression: floor(variable('t'))}}
]);
assert(timed);
for (const language of ['wgsl', 'glsl'])
  assert.deepEqual(timed.explicitCurves[0][language], ['floor(t)', '0.0', '0.0']);

for (const args of [[], [variable('x'), variable('y')]]) {
  const expression = {kind: 'call', name: 'floor', args};
  assert.equal(compileSymbolicScalarFieldShader(expression), null);
  assert.equal(compileSymbolicExplicitCurveShaderGroup([
    {explicitCurve: {parameter: 'x', dependent: 'y', expression}}
  ]), null);
}
assert.equal(compileSymbolicScalarFieldShader(floor(variable('unsupported'))), null);
console.log(JSON.stringify({passed: true, cases, coverage: 'GLSL/WGSL scalar, relation and explicit jets; x/y; negative values; time-only floor; invalid arity/input', limitation: 'Spatial jets are piecewise derivatives; derivatives at integer jumps are undefined.'}));
