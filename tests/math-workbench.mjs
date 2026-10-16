import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';
import {examples,splitSteps} from '../public/previews/gpu-math-typing/motion/examples.mjs';
import {buildScene,pair} from '../public/previews/gpu-math-typing/motion/scene.mjs';
const base=new URL('../public/previews/gpu-math-typing/',import.meta.url),data=JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('motion/math-data.json.gz',base))));let steps=0,max=0;
for(const e of examples)for(let i=0;i<e.steps.length;i++){const a=buildScene(e.steps[i],data),b=buildScene(e.steps[Math.min(i+1,e.steps.length-1)],data);assert(a.items.every(Number.isFinite));assert(a.count<=512);const p=pair(a,b);assert.equal(p.a.length,p.b.length);max=Math.max(max,a.count);steps++;}
assert.equal(new Set(examples.map(e=>e.id)).size,examples.length);for(const e of examples.filter(e=>e.id.startsWith('derive-'))){assert.ok(e.assumptions);assert.ok(e.steps.length>=5);assert.ok(e.steps.every(s=>s.note));}
assert.equal(examples.length,50);assert.equal(steps,254);
assert.deepEqual(splitSteps('x+2=5\nx=3'),['x+2=5','x=3']);
assert.deepEqual(splitSteps(String.raw`\documentclass{article}\begin{document}Text\begin{align}x&=1\\x+1&=2\end{align}\end{document}`),['x=1','x+1=2']);
assert.deepEqual(splitSteps(String.raw`\begin{align}A&=\begin{pmatrix}1&0\\0&1\end{pmatrix}\\A^2&=I\end{align}`),[String.raw`A=\begin{pmatrix}1&0\\0&1\end{pmatrix}`,'A^2=I']);
assert.deepEqual(splitSteps(String.raw`\[ x+2=5 \] Prose \[ x=3 \]`),['x+2=5','x=3']);
assert.throws(()=>splitSteps(String.raw`\documentclass{article}\begin{document}No equations\end{document}`),/No math/);
assert.throws(()=>splitSteps('x'.repeat(12001)),/12,000/);
// Reassemble every chunk, proving every field sample and native atlas coordinate unchanged.
const original=zlib.gunzipSync(fs.readFileSync(new URL('atlas.rgba.gz',base))),[w,h]=data.atlasSize;
for(let y=0;y<h;y+=512)for(let x=0;x<w;x+=512){const tile=zlib.gunzipSync(fs.readFileSync(new URL(`motion/fields/${x/512}-${y/512}.rgba.gz`,base)));for(let row=0;row<512;row++)assert(tile.subarray(row*2048,(row+1)*2048).equals(original.subarray(((y+row)*w+x)*4,((y+row)*w+x+512)*4)));}
console.log(`PASS ${examples.length} examples, ${steps} steps, max ${max} objects, nested uploads, all 128 field tiles losslessly verified`);
