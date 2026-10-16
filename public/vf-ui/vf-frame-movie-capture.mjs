// Offline CFR encoding shared by VKF scene capture. No animation math here.
// Frame producers retain control of sampling/drawing; encode timestamps depend
// only on the consecutive frame index, never wall-clock render time.
export async function createFrameMovieCapture({
 width, height, frameRate = 48, bitrate = 12_000_000,
 codec = 'vp9', hardwareAcceleration = 'no-preference', signal,
 onClose = () => {}, loadMuxer = () => import('./vendor/mediabunny-1.61.6.min.mjs')
} = {}) {
 if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
     !Number.isFinite(frameRate) || frameRate <= 0 || frameRate > 240 ||
     !Number.isFinite(bitrate) || bitrate <= 0) throw new TypeError('Invalid frame movie dimensions/rate/bitrate');
 signal?.throwIfAborted();
 const {Output,WebMOutputFormat,BufferTarget,VideoSampleSource,VideoSample,Quality,canEncodeVideo} = await loadMuxer();
 signal?.throwIfAborted();
 if (!['vp9','vp8','av1'].includes(codec)) throw new TypeError('Frame movie requires a WebM video codec');
 const config = {codec,quality:new Quality({bitrate}),latencyMode:'quality',hardwareAcceleration};
 if (!await canEncodeVideo(codec,{width,height,bitrate,hardwareAcceleration})) throw new Error(`Offline ${codec} encoding is unavailable`);
 signal?.throwIfAborted();
 let output = new Output({format:new WebMOutputFormat(),target:new BufferTarget()});
 let source = new VideoSampleSource(config);
 output.addVideoTrack(source,{frameRate});
 let state='starting', count=0, busy=false, closed=false, cancelPromise=null;
 function release(){if(closed)return;closed=true;signal?.removeEventListener('abort',abort);onClose();}
 function check(){if(state!=='recording')throw new Error(`Frame movie is ${state}`);signal?.throwIfAborted();}
 async function cancel(){
  if(cancelPromise)return cancelPromise;
  if(state==='finished'||state==='canceled')return;
  state='canceled';const active=output;
  cancelPromise=(async()=>{try{await active?.cancel();}finally{source=null;output=null;release();}})();
  return cancelPromise;
 }
 function abort(){void cancel().catch(()=>{});}
 try{await output.start();state='recording';signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)await cancel();signal?.throwIfAborted();}
 catch(error){await cancel();throw error;}
 return Object.freeze({
  get state(){return state;},get frameCount(){return count;},frameRate,
  // Canvas or VideoFrame accepted. Caller keeps ownership of an input
  // VideoFrame; capture clones and closes only its own frame/sample.
  async addFrame(canvas,index=count){
   check();if(busy)throw new Error('Await the previous frame before adding another');
   if(index!==count)throw new RangeError('Frame indices must be consecutive starting at zero');
   const isFrame=typeof globalThis.VideoFrame==='function' && canvas instanceof globalThis.VideoFrame;
   if((isFrame?canvas.displayWidth:canvas?.width)!==width||(isFrame?canvas.displayHeight:canvas?.height)!==height)throw new RangeError('Frame dimensions changed during capture');
   busy=true;let sample,ownedFrame;
   try{if(isFrame)ownedFrame=canvas.clone();sample=new VideoSample(ownedFrame||canvas,{timestamp:index/frameRate,duration:1/frameRate});await source.add(sample);check();count++;}
   catch(error){await cancel();throw error;}finally{sample?.close();ownedFrame?.close();busy=false;}
  },
  async finish(){
   check();if(busy)throw new Error('Await the last frame before finishing');
   if(count===0)throw new Error('Cannot finish an empty frame movie');
   state='finishing';
   try{await output.finalize();if(state==='canceled')throw new DOMException('Capture canceled','AbortError');const blob=new Blob([output.target.buffer],{type:'video/webm'});state='finished';source=null;output=null;return blob;}
   catch(error){await cancel();throw error;}finally{release();}
  },cancel
 });
}
