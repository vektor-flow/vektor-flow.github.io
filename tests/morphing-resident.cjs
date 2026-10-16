// Software-only WebGPU verification of borrowed compute buffers and MSAA.
const assert=require('node:assert/strict');
const {chromium}=require('/tmp/memuli-ux-review/node_modules/playwright');
(async()=>{
 const root='/tmp/cuvami-chromium-cold-1243';
 const browser=await chromium.launch({executablePath:root+'/chrome',headless:true,env:{...process.env,VK_ICD_FILENAMES:root+'/vk_swiftshader_icd.json',VK_DRIVER_FILES:root+'/vk_swiftshader_icd.json'},args:['--enable-features=Vulkan','--use-vulkan=swiftshader','--disable-vulkan-surface','--no-sandbox','--use-angle=swiftshader','--use-webgpu-adapter=swiftshader','--enable-unsafe-webgpu','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage();await page.route('**/resident-test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><canvas id="c" width="128" height="128" style="width:128px;height:128px"></canvas>'}));
  await page.goto((process.env.VKF_SITE_URL||'http://127.0.0.1:8881')+'/resident-test');
  const report=await page.evaluate(async()=>{
   const adapter=await navigator.gpu.requestAdapter({forceFallbackAdapter:true});
   if(!adapter||adapter.info.architecture!=='swiftshader'||!adapter.info.isFallbackAdapter)throw Error('Software adapter required');
   const device=await adapter.requestDevice();const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
   const {createScreenSpaceSimplexRenderer}=await import('/vf-ui/geom/vf-screen-simplex-renderer.mjs');
   const renderer=createScreenSpaceSimplexRenderer(document.querySelector('canvas'),{device,backend:'webgpu',pixelRatio:()=>1});
   await renderer.initialize();renderer.resize(128,128);
   const vertices=new Float32Array([8,8,1,0,0,1,120,18,1,0,0,1,24,120,1,0,0,1]);
   renderer.setPackedVertices(vertices);await device.queue.onSubmittedWorkDone();const uploaded=document.querySelector('canvas').toDataURL();
   const buffer=device.createBuffer({size:vertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE});device.queue.writeBuffer(buffer,0,vertices);
   renderer.setResidentVertices(buffer,3);await device.queue.onSubmittedWorkDone();const resident=document.querySelector('canvas').toDataURL();
   renderer.resize(256,256);await device.queue.onSubmittedWorkDone();const resized=document.querySelector('canvas').toDataURL();
   let rejected=false;try{renderer.setResidentVertices(buffer,6);}catch{rejected=true;}
   renderer.destroy();device.queue.writeBuffer(buffer,0,vertices);await device.queue.onSubmittedWorkDone();buffer.destroy();device.destroy();
   return {samePixels:uploaded===resident,resized:resized!==resident,invalidCountRejected:rejected,errors,backend:'swiftshader'};
  });
  assert(report.samePixels);assert(report.resized);assert(report.invalidCountRejected);assert.deepEqual(report.errors,[]);console.log(JSON.stringify({passed:true,...report}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
