// Offline browser capture. Force the software adapter; never exercise host GPU.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.VKF_PLAYWRIGHT||'/tmp/memuli-ux-review/node_modules/playwright');
const output=process.argv[2]||'/tmp/vkf-text-unfold',url=process.env.VKF_CAPTURE_URL||'http://127.0.0.1:8886';
(async()=>{
 const swift='/tmp/cuvami-chromium-cold-1243';
 const browser=await chromium.launch({executablePath:process.env.VKF_CHROMIUM||'/home/viktor/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,env:{...process.env,VK_ICD_FILENAMES:swift+'/vk_swiftshader_icd.json',VK_DRIVER_FILES:swift+'/vk_swiftshader_icd.json'},args:['--enable-features=Vulkan','--use-vulkan=swiftshader','--disable-vulkan-surface','--no-sandbox','--use-angle=swiftshader','--use-webgpu-adapter=swiftshader','--enable-unsafe-webgpu','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({acceptDownloads:true,viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='log')console.log(m.text());});
  await page.goto(url+'/capture/render.html');await page.waitForFunction(()=>window.ready,null,{timeout:60000});
  const report={passed:false,softwareGPU:true,modes:{}};
  for(const name of ['letters','words']){
   const config=await page.evaluate(name=>window.loadClip(name),name),samples=[];
   for(const frame of [0,180,360,540,719]){
    await page.evaluate(frame=>window.drawFrame(frame),frame);const snapshot=await page.evaluate(()=>window.snapshot());
    fs.writeFileSync(path.join(output,`${name}-${frame}.png`),Buffer.from(snapshot.png.split(',')[1],'base64'));
    assert.equal(snapshot.edgeInk,0);assert(frame===0?snapshot.ink===0:snapshot.ink>0);
    samples.push({frame,ink:snapshot.ink,edgeInk:snapshot.edgeInk});
   }
   const downloadPromise=page.waitForEvent('download',{timeout:600000});
   const capturePromise=page.evaluate(()=>window.exportClip());
   const download=await downloadPromise;await download.saveAs(path.join(output,name+'.webm'));
   const capture=await capturePromise;report.modes[name]={config,samples,capture};
   fs.writeFileSync(path.join(output,'capture-verification.json'),JSON.stringify(report,null,2));
  }
  assert.deepEqual(errors,[]);assert.deepEqual(fs.readFileSync(path.join(output,'letters-719.png')),fs.readFileSync(path.join(output,'words-719.png')));
  report.passed=true;report.errors=errors;fs.writeFileSync(path.join(output,'capture-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
