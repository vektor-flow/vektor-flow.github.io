import assert from 'node:assert/strict';
import {uploadNativeStateChunks} from '../../public/preview/0.7.5/vf-ui/native-labels/vf-native-state-chunks.mjs';
let allocations=0,destroyed=0;const copies=[],device={queue:{writeBuffer(buffer,offset,values){copies.push([offset,...values]);}}},allocate=n=>{allocations++;return{size:n*4,destroy(){destroyed++;}}};
const good={input_width:4,chunks:[{offset:2,values:[3,4]},{offset:0,values:[1,2]}]};
assert.equal(uploadNativeStateChunks(device,good,{allocate}).size,16);assert.deepEqual(copies,[[0,1,2],[8,3,4]]);
for(const bad of[{...good,input_width:5},{...good,chunks:[{offset:0,values:[1,2]},{offset:1,values:[3,4]}]},{...good,chunks:[{offset:0,values:[1,2,NaN,4]}]},{...good,chunks:[{offset:0,values:[1,2,1e100,4]}]}])assert.throws(()=>uploadNativeStateChunks(device,bad,{allocate}),/STATE_NATIVE_/);
assert.throws(()=>uploadNativeStateChunks(device,good,{allocate,maxBytes:15}),/BUDGET/);assert.equal(allocations,1);assert.equal(destroyed,0);console.log('Native chunk transport PASS: exact offsets; malformed coverage/non-finite/overflow/budget rejected before allocation');
