import fs from 'node:fs';import assert from 'node:assert/strict';
import {examples,splitSteps} from '../public/previews/gpu-math-typing/examples/math-inputs.mjs';
import {typeset} from '../public/previews/gpu-math-typing/typing-layout.mjs';
const data=JSON.parse(fs.readFileSync('public/previews/gpu-math-typing/typing-data.json'));let count=0;
for(const e of examples)for(const step of e.steps){const b=typeset(step.math,data.maps);assert.ok(b.complete,e.id);assert.deepEqual(b.diagnostics,[]);assert.ok(b.items.length);count++;}
assert.equal(count,254);assert.equal(examples.length,50);assert.equal(new Set(examples.map(e=>e.id)).size,50);
assert.deepEqual(splitSteps('x=1\nx+1=2'),['x=1','x+1=2']);
console.log('PASS all 50 authored examples / 254 states retained and typeset without the retired morph player');
