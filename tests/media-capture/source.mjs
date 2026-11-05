import assert from 'node:assert/strict';
import {createLayeredCanvasCaptureSource,createLayeredCanvasCaptureStream} from '../../public/preview/0.7.5/vf-ui/vf-media-capture.mjs';
function boundary(){const calls=[],output={width:0,height:0,getContext:()=>({clearRect:(...args)=>calls.push(['clear',...args]),drawImage:(...args)=>calls.push(['draw',...args]),getImageData:(...args)=>calls.push(['read',...args])})};return {calls,output,document:{createElement:name=>{assert.equal(name,'canvas');return output;}}};}
const b=boundary(),first={width:20,height:10},last={width:20,height:10},replacement={width:20,height:10};let overlay=last,before=0,layers=[first,()=>overlay,null];
const source=createLayeredCanvasCaptureSource({document:b.document,layers:()=>layers,beforeDraw:()=>before++,requestFrame:()=>{throw Error('manual source must not schedule');}});
assert.deepEqual(b.calls,[]);assert.equal(source.canvas,b.output);assert.equal(source.drawFrame(),b.output);assert.equal(before,1);
assert.deepEqual(b.calls.map(c=>c[0]),['clear','draw','draw']);assert.equal(b.calls[1][1],first);assert.equal(b.calls[2][1],last);
overlay=replacement;first.width=40;first.height=30;source.drawFrame();assert.equal(b.output.width,40);assert.equal(b.output.height,30);assert.equal(b.calls.at(-1)[1],replacement);assert.deepEqual(b.calls.at(-1).slice(2),[0,0,40,30]);
layers=[];source.drawFrame();assert.equal(b.calls.at(-1)[0],'clear');assert.equal(before,3);
layers=[first];source.drawFrame({readback:true});assert.equal(before,4);assert.deepEqual(b.calls.at(-1),['read',0,0,40,30]);assert.equal(b.calls.at(-2)[0],'draw');
source.close();source.close();assert(source.closed);assert.equal(first.width,40);assert.equal(b.output.width,1);assert.throws(()=>source.drawFrame(),/closed/);
const s=boundary(),queue=[];let requested=0,stopped=0;const track={readyState:'live',requestFrame:()=>requested++,stop(){this.readyState='ended';stopped++;}},stream={getVideoTracks:()=>[track],getTracks:()=>[track]};s.output.captureStream=rate=>{assert.equal(rate,24);return stream;};
assert.equal(createLayeredCanvasCaptureStream({document:s.document,layers:[first],frameRate:24,requestFrame:cb=>queue.push(cb)}),stream);assert.equal(requested,1);queue.shift()();assert.equal(requested,2);track.stop();queue.shift()();assert.equal(queue.length,0);assert.equal(s.output.width,1);assert.equal(stopped,1);
assert.throws(()=>createLayeredCanvasCaptureSource({document:boundary().document,layers:[]}),/requires a canvas layer/);
console.log('PASS manual source order/dynamic layers/resize/beforeDraw/no scheduling/close; existing stream loop compatibility and release');
