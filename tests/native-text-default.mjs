// Renderer boundary unit: arbitrary add(text:) sources must enter native VKF.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const window={console:{log(){},warn(){},error(){}},addEventListener(){},__vfInlineRetainedScene:true};
const document={addEventListener(){},currentScript:null};
const scope={window,document,setTimeout(){},clearTimeout(){},URL,Map,Set,WeakMap,WeakSet,Float32Array,Uint8Array};
vm.runInNewContext(readFileSync(new URL('../public/preview/0.7.5/vf-ui/vf-display.js',import.meta.url),'utf8'),scope);
const source=window.VfDisplay.__test.nativeTextSource;
assert.equal(typeof source,'function','native text entry is required for ordinary add(text:)');
assert.equal(source('A new argument'),'\\text{A new argument}');
assert.equal(source('Find $x+1=3$ now'),'\\text{Find }x+1=3\\text{ now}');
assert.equal(source('$a^2+b^2=c^2$'),'a^2+b^2=c^2');
assert.throws(()=>source('Unclosed $x'),/dollar/);
console.log('PASS arbitrary plain/mixed/math text enters one native source path');
