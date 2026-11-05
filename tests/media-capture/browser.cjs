const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require('/home/viktor/Projects/Cuvami/staging/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),mime={'.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm','.json':'application/json'};
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="icon" href="data:,">');return;}const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true,args:['--no-sandbox','--use-angle=vulkan','--use-vulkan=swiftshader','--enable-features=Vulkan','--enable-unsafe-swiftshader','--enable-unsafe-webgpu']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:'+server.address().port+'/');
const result=await page.evaluate(async()=>{
 const {createLayeredCanvasCaptureSource}=await import('/public/preview/0.7.5/vf-ui/vf-media-capture.mjs');const {createFrameMovieCapture}=await import('/public/preview/0.7.5/vf-ui/vf-frame-movie-capture.mjs');
 const make=()=>{const c=document.createElement('canvas');c.width=64;c.height=32;return c;},bottom=make(),top=make();let active=top,draws=0;
 bottom.getContext('2d').fillStyle='#113355';bottom.getContext('2d').fillRect(0,0,64,32);top.getContext('2d').fillStyle='#ff6600';top.getContext('2d').fillRect(0,0,16,16);
 const source=createLayeredCanvasCaptureSource({layers:[bottom,()=>active],beforeDraw:()=>draws++});if(draws!==0)throw Error('source drew automatically');source.drawFrame();const context=source.canvas.getContext('2d'),read=(x,y)=>[...context.getImageData(x,y,1,1).data];
 if(String(read(4,4))!=='255,102,0,255'||String(read(40,20))!=='17,51,85,255')throw Error('layer order pixels');active=null;source.drawFrame();if(String(read(4,4))!=='17,51,85,255')throw Error('dynamic layer pixels');
 await new Promise(r=>setTimeout(r,30));if(draws!==2)throw Error('manual source scheduled redraw');
 const encoder=await createFrameMovieCapture({width:64,height:32,frameRate:24,codec:'vp9',hardwareAcceleration:'prefer-software'});
 for(let i=0;i<4;i++){active=i%2?top:null;source.drawFrame();await encoder.addFrame(source.canvas,i);}
 const blob=await encoder.finish();if(encoder.frameCount!==4||draws!==6)throw Error('frame/draw count mismatch');
 bottom.width=96;bottom.height=48;source.drawFrame();if(source.canvas.width!==96||source.canvas.height!==48)throw Error('resize mismatch');source.close();let rejected=false;try{source.drawFrame();}catch{rejected=true;}if(!rejected||bottom.width!==96)throw Error('close ownership');
 return {frames:4,draws,sourceClosed:source.closed,bytes:[...new Uint8Array(await blob.arrayBuffer())],mime:blob.type};
});
assert.deepEqual(errors,[]);const file='/tmp/vkf-layered-manual.webm';fs.writeFileSync(file,Buffer.from(result.bytes));const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',file],{encoding:'utf8'}));assert.equal(probe.frames.length,4);probe.frames.forEach((f,i)=>assert(Math.abs(Number(f.best_effort_timestamp_time)-i/24)<.001));
const report={passed:true,frames:result.frames,draws:result.draws,bytes:result.bytes.length,mime:result.mime,decodedFrameTimes:probe.frames.map(f=>Number(f.best_effort_timestamp_time)),errors,scope:'real browser manual canvas composition plus existing VP9 CFR encoder; decoded with ffprobe; no native-scene or performance claim'};fs.writeFileSync('/tmp/vkf-layered-manual-qualification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
