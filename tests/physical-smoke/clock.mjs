import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createSymbolicKernel} from '../../public/preview/0.7.5/vf-ui/vf-symbolic-kernel-runtime.mjs';
const build=JSON.parse(await fs.readFile(new URL('../../docs/physical-smoke/latest-build.json',import.meta.url)));
const module=await WebAssembly.compile(await fs.readFile(build.output+'/operators.wasm')),manifest=JSON.parse(await fs.readFile(build.output+'/operators.json'));
const invoke=(name,args)=>createSymbolicKernel({instance:new WebAssembly.Instance(module,{}),manifest,diagnostics:true}).invokeValue(name,args);
for(const seconds of[0,.01,.013,.017,.1,.3,60,1000,1000000]){
 const clock=invoke('clock',[seconds]);assert.equal(clock.observation_ns,Math.round(seconds*1e9));assert.equal(clock.ticks,Math.floor(((clock.observation_ns+.5)/1e9)/(1/60)));assert.equal(clock.time,clock.ticks*(1/60));
}
for(const seconds of[-1,NaN,Infinity,1000001])assert.throws(()=>invoke('clock',[seconds]));
for(const epoch of[0,60,1000]){const c=invoke('clock_absolute',[epoch+.3,epoch]);assert.equal(c.ticks,18);assert.throws(()=>invoke('clock_absolute',[epoch-.1,epoch]));}
for(const [seconds,expected]of[[.0000000005,0],[.0000000015,2],[.0000000025,2]])assert.equal(invoke('clock',[seconds]).observation_ns,expected);
console.log(JSON.stringify({passed:true,scope:'native WASM/f64 whole tick clock, nanosecond ties-even, absolute epoch, bounded invalid rejection'}));
