const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.VKF_PLAYWRIGHT||'/tmp/memuli-ux-review/node_modules/playwright');
const base=process.env.VKF_SITE_URL||'http://127.0.0.1:8886';
const evidence=process.env.VKF_TEXT_EVIDENCE||'/tmp/vkf-text-unfold-20261018/site';fs.mkdirSync(evidence,{recursive:true});
(async()=>{
 const report={passed:false,url:base,views:[]};
 for(const [name,engine,options,viewport]of [
  ['desktop',chromium,{executablePath:process.env.VKF_CHROMIUM||'/home/viktor/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--disable-gpu']},{width:1440,height:1100}],
  ['phone',webkit,{env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1'}},{width:390,height:844}],
 ]){
  const browser=await engine.launch({headless:true,...options});
  try{
   const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/coming-soon.html#text-unfold');
   assert.equal(await page.locator('video').count(),2);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const videos=[];
   for(let i=0;i<2;i++){
    const video=page.locator('video').nth(i);
    assert.equal(await video.getAttribute('autoplay'),null);assert.equal(await video.getAttribute('preload'),'none');
    await video.evaluate(async el=>{el.load();await new Promise((resolve,reject)=>{if(el.readyState>=1)return resolve();el.addEventListener('loadedmetadata',resolve,{once:true});el.addEventListener('error',()=>reject(Error('Video failed: '+el.error?.message)),{once:true});});});
    const metadata=await video.evaluate(el=>({width:el.videoWidth,height:el.videoHeight,duration:el.duration,source:el.currentSrc}));
    assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);assert(Math.abs(metadata.duration-12)<.05);
    await video.evaluate(async el=>{el.muted=true;await el.play();});
    await page.waitForFunction(i=>document.querySelectorAll('video')[i].currentTime>.15,i);
    await video.evaluate(el=>el.pause());
    await video.evaluate(el=>new Promise(resolve=>{el.addEventListener('seeked',resolve,{once:true});el.currentTime=6;}));
    await video.screenshot({path:path.join(evidence,name+'-'+i+'.png')});
    videos.push(metadata);
   }
   const archive=await page.request.get(base+'/previews/text-unfold/source.zip');assert.equal(archive.status(),200);assert((await archive.body()).length>10000);
   const proof=await page.request.get(base+'/previews/text-unfold/provenance.json');assert((await proof.json()).verification.passed);
   await page.screenshot({path:path.join(evidence,name+'.png'),fullPage:true});assert.deepEqual(errors,[]);
   report.views.push({name,viewport,videos,errors,noHorizontalOverflow:true});
  }finally{await browser.close();}
 }
 report.passed=true;fs.writeFileSync(path.join(evidence,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});
