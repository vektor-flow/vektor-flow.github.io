const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('/tmp/memuli-ux-review/node_modules/playwright');
(async()=>{
 const artifacts='/home/viktor/Projects/Cuvami/staging/artifacts/morphing-compiled-gpu-20261016';
 const out=process.argv[2];if(!out)throw Error('Output directory required');fs.mkdirSync(out,{recursive:true});
 const root='/tmp/cuvami-chromium-cold-1243';
 const browser=await chromium.launch({executablePath:'/home/viktor/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:!process.env.VKF_HEADFUL,env:{...process.env,VK_ICD_FILENAMES:root+'/vk_swiftshader_icd.json',VK_DRIVER_FILES:root+'/vk_swiftshader_icd.json'},args:['--disable-gpu-compositing','--enable-features=Vulkan','--use-vulkan=swiftshader','--no-sandbox','--use-angle=vulkan','--use-webgpu-adapter=swiftshader','--enable-unsafe-webgpu','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage();if(process.env.VKF_PIPELINE_MODULE)await page.route('**/live/gpu-morphing.mjs',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.VKF_PIPELINE_MODULE)}));page.on('console',m=>console.error(m.text()));
  for(const [route,dir] of [['scene','gpu-scene-02'],['shaders',process.env.GPU_PACKAGE||'gpu-package-06']]){
   await page.route('**/test-'+route+'/**',async r=>{const name=new URL(r.request().url()).pathname.split('/test-'+route+'/')[1];const file=path.join(artifacts,dir,'package',name);const type=name.endsWith('.mjs')?'text/javascript':name.endsWith('.wasm')?'application/wasm':name.endsWith('.json')?'application/json':'text/plain';await r.fulfill({contentType:type,body:fs.readFileSync(file)});});
  }
  await page.route('**/pipeline-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><canvas width="512" height="512" style="width:512px;height:512px"></canvas>'}));
  await page.goto((process.env.VKF_SITE_URL||'http://127.0.0.1:8881')+'/pipeline-test');
  const prep=await page.evaluate(async()=>{
   const adapter=await navigator.gpu.requestAdapter({forceFallbackAdapter:true});if(adapter.info.architecture!=='swiftshader'||!adapter.info.isFallbackAdapter)throw Error('Software adapter required');
   const device=await adapter.requestDevice({requiredFeatures:adapter.features.has('timestamp-query')?['timestamp-query']:[]});window.gpuDevice=device;window.gpuErrors=[];device.addEventListener('uncapturederror',e=>window.gpuErrors.push(e.error.message));
   const {createScreenSpaceSimplexRenderer}=await import('/vf-ui/geom/vf-screen-simplex-renderer.mjs');
   const renderer=createScreenSpaceSimplexRenderer(document.querySelector('canvas'),{device,continuous:false,backend:'webgpu',pixelRatio:()=>1,clearColor:{r:9/255,g:17/255,b:22/255,a:1}});await renderer.initialize();renderer.resize(512,512);window.renderer=renderer;
   const {prepareMorphingGPU}=await import('/previews/gpu-math-typing/examples/live/gpu-morphing.mjs');
   const start=performance.now();window.scene=await prepareMorphingGPU(device,{sceneURL:'/test-scene/',shaderURL:'/test-shaders/',resolution:24,lattice:129,extent:512,profile:true});return {milliseconds:performance.now()-start,backend:adapter.info.architecture};
  });
  const frames=[];
  for(const q of [0,.5,1,1.5,2]){
   const f=await page.evaluate(async q=>{const frame=await window.scene.sample(q);window.renderer.setResidentVertices(window.scene.vertices,window.scene.vertexCount);const pixels=document.querySelector('canvas').toDataURL();await window.gpuDevice.queue.onSubmittedWorkDone();return {...frame,pixels};},q);
   fs.writeFileSync(path.join(out,'capture-'+q+'.png'),Buffer.from(f.pixels.split(',')[1],'base64'));delete f.pixels;assert(Math.abs(f.measure-f.desired)<=.00011);assert.equal(f.geometryReadbackBytes,0);frames.push(f);
   await page.locator('canvas').screenshot({path:path.join(out,'frame-'+q+'.png')});console.log(JSON.stringify(f));
  }
  const benchmark=process.env.VKF_BENCHMARK?await page.evaluate(async()=>{
   const samples=[];
   for(let i=0;i<40;i++){
    const start=performance.now();const frame=await window.scene.sample((i%19)/9);
    window.renderer.setResidentVertices(window.scene.vertices,window.scene.vertexCount);
    await window.gpuDevice.queue.onSubmittedWorkDone();
    if(i>=5)samples.push({...frame,frameMilliseconds:performance.now()-start});
   }
   return samples;
  }):null;
  const tail=await page.evaluate(async()=>{let rejected=false;try{await window.scene.sample(-1);}catch{rejected=true;}const recovered=await window.scene.sample(0);window.renderer.destroy();window.scene.dispose();window.gpuDevice.destroy();return {rejected,recovered:recovered.coordinate===0,errors:window.gpuErrors};});
  assert(tail.rejected&&tail.recovered);assert.deepEqual(tail.errors,[]);
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed:true,softwareOnly:true,prep,frames,benchmark,...tail},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
