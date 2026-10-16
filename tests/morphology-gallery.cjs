const {chromium}=require('/tmp/memuli-ux-review/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const base=process.env.VKF_SITE_URL||'http://127.0.0.1:8879';
 const evidence=process.env.VKF_GALLERY_EVIDENCE||'/tmp/vkf-gallery-evidence';fs.mkdirSync(evidence,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.VKF_CHROMIUM||'/tmp/cuvami-chromium-cold-1243/chrome',headless:true,args:['--disable-gpu']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/previews/gpu-math-typing/examples/index.html');await page.waitForFunction(()=>!document.querySelector('#play').disabled);
 const catalog=await page.evaluate(async()=>await (await fetch('./catalog.json')).json());assert.equal(catalog.length,3);assert.ok(catalog.every(e=>e.backend==='Native VKF'));for(const id of ['material-split','spherical','cat-walk','cat-comparison','small-motion','rotation','area','replicas','branches','before-after'])assert.ok(!catalog.some(e=>e.id===id));
 const checks=[];
 for(const e of catalog){const response=await page.request.get(new URL(e.video,base+'/previews/gpu-math-typing/examples/').href);assert.ok(response.ok());assert.equal(require('crypto').createHash('sha256').update(await response.body()).digest('hex'),e.sha256,e.id+' served bytes');}
 for(const e of catalog){
  await page.locator(`[data-example="${e.id}"]`).click();await page.waitForFunction(()=>!document.querySelector('#play').disabled);
  await page.locator('#timeline').fill('0.5');await page.waitForFunction(()=>!document.querySelector('video').seeking);
  const result=await page.locator('video').evaluate(v=>({time:v.currentTime,duration:v.duration,width:v.videoWidth,error:v.error?.code}));
  assert.ok(result.width>0&&!result.error,e.id);assert.ok(Math.abs(result.duration-e.duration)<.05,e.id+' current duration');assert.ok(e.video.includes('?v='+e.sha256.slice(0,12)));assert.ok(Math.abs(result.time-result.duration/2)<.1,e.id);checks.push({id:e.id,...result});
 }
 await page.locator('[data-example="lava"]').click();await page.waitForFunction(()=>!document.querySelector('#play').disabled);await page.locator('#play').click();await page.waitForTimeout(500);assert.ok(await page.locator('video').evaluate(v=>v.currentTime>0&&!v.paused));await page.locator('#play').click();assert.ok(await page.locator('video').evaluate(v=>v.paused));
 await page.locator('[data-example="scans"]').click();await page.waitForFunction(()=>!document.querySelector('#play').disabled);
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:'Indexed OBJ meshes'}).click()]);await download.saveAs(path.join(evidence,'indexed-scan-meshes.zip'));assert.ok(fs.statSync(path.join(evidence,'indexed-scan-meshes.zip')).size>100000);
 const [videoDownload]=await Promise.all([page.waitForEvent('download'),page.getByRole('link',{name:/Download MP4/}).click()]);await videoDownload.saveAs(path.join(evidence,'scan-example.mp4'));
 await page.screenshot({path:path.join(evidence,'desktop.png'),fullPage:true});
 await page.getByRole('button',{name:'3D',exact:true}).click();assert.equal(await page.locator('[data-example]').count(),3);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'All',exact:true}).click();await page.screenshot({path:path.join(evidence,'mobile.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(base+'/previews/gpu-math-typing/document.html#examples');await page.waitForFunction(()=>document.querySelector('#examples').getAttribute('aria-pressed')==='true');assert.ok((await page.locator('#view').getAttribute('src')).includes('examples/index.html'));assert.equal(await page.locator('.upload').isVisible(),false);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const retired of ['/previews/gpu-morph/index.html','/previews/gpu-math-typing/motion/engine.mjs','/previews/gpu-math-typing/examples/downloads/math/quadratic-structure.mp4','/previews/gpu-math-typing/examples/downloads/cat-dog-comparison.mp4'])assert.equal((await page.request.get(base+retired)).status(),404,retired);
 await page.goto(base+'/previews/gpu-math-typing/examples/derivations.html');await page.waitForSelector('.derivation');assert.equal(await page.locator('.derivation').count(),24);assert.equal(await page.locator('a[href*="motion/"]').count(),0);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(evidence,'verification.json'),JSON.stringify({base,examples:checks,playPause:true,downloadedMeshZip:true,downloadedVideo:true,mobileOverflow:false,workspaceExamplesMode:true,pageErrors:errors},null,2));console.log(`PASS ${checks.length} clips, seeking, play/pause, video+mesh downloads, mobile and renderer integration`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
