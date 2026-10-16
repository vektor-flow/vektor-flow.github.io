const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('/tmp/memuli-ux-review/node_modules/playwright');
(async()=>{const out=process.env.VKF_CAPTURE_EVIDENCE||'/tmp/morphing-gpu-capture';fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/tmp/cuvami-chromium-cold-1243/chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-vulkan']});
try{const page=await browser.newPage({acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8881/previews/gpu-math-typing/examples/live/index.html?validation');await page.waitForFunction(()=>window.morphingVerification?.backend==='WebGL2',{},{timeout:45000});
assert.deepEqual(await page.evaluate(()=>window.morphingTest.exportConfig()),{resolution:192,size:1080,fps:48,frames:193});
// Exercise actual high-resolution geometry and 1080p/48fps capture, with only
// three key states so verification does not take a full production export.
const downloadPromise=page.waitForEvent('download',{timeout:240000});
const run=page.evaluate(()=>window.morphingTest.exportMovie({frames:3}));const download=await downloadPromise;await run;await download.saveAs(path.join(out,'capture.webm'));
const report=await page.evaluate(()=>window.morphingCaptureVerification);assert.equal(report.width,1080);assert.equal(report.height,1080);assert.equal(report.geometryResolution,192);assert.equal(report.fps,48);assert.equal(report.preparedFrames,3);assert(report.bytes>1000);assert.equal(report.api,'createSceneMediaCapture.startMovie/stopMovie');
// Cancellation must terminate an expensive computation without a download and
// leave the player available for another native sample.
await page.click('#download');await page.waitForFunction(()=>!document.querySelector('#cancel').hidden);await page.click('#cancel');await page.waitForFunction(()=>!document.querySelector('#download').disabled,{},{timeout:15000});
await page.locator('#coordinate').evaluate(el=>{el.value='.5';el.dispatchEvent(new Event('input'));});await page.waitForFunction(()=>window.morphingVerification?.coordinate===.5,{},{timeout:45000});assert.deepEqual(errors,[]);
const evidence={passed:true,softwareGPU:true,capture:report,productionFrames:193,verifiedFrames:3,cancellationRecovery:true,errors};fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(evidence,null,2));console.log(evidence);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
