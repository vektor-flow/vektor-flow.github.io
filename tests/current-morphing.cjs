const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit}=require('/tmp/memuli-ux-review/node_modules/playwright');
const base=process.env.VKF_SITE_URL||'http://127.0.0.1:8889';
const output=process.env.VKF_TEST_OUTPUT||'/tmp/text-wave-review';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const results=[];
 for(const[name,engine,options,viewport]of[
  ['desktop',chromium,{executablePath:'/home/viktor/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']},{width:1440,height:1000}],
  ['phone',webkit,{env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1'}},{width:390,height:844}],
 ]){
  const browser=await engine.launch({headless:true,...options});
  try{
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[],media=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\.(mp4|webm)(\?|$)/.test(r.url()))media.push(r.url())});
   await page.addInitScript(()=>{window.bufferUploads=0;const upload=WebGL2RenderingContext.prototype.bufferData;WebGL2RenderingContext.prototype.bufferData=function(...args){window.bufferUploads++;return upload.apply(this,args)}});
   await page.goto(base+'/previews/morphing-current/');
   await page.waitForFunction(()=>document.querySelectorAll('.demo[data-ready=true]').length===2,null,{timeout:60000});
   assert.equal(await page.locator('video').count(),0);assert.equal(await page.locator('canvas').count(),2);assert.deepEqual(media,[]);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.locator('#status').innerText(),'');
   const baseline=await page.evaluate(()=>window.bufferUploads),samples=[];
   for(const[i,mode]of[[0,'letters'],[1,'words']]){
    const section=page.locator('.demo').nth(i),time=section.locator('[data-time]');await section.scrollIntoViewIfNeeded();
    assert(Number(await section.getAttribute('data-duration'))<2);
    const pixels=()=>section.locator('canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2');const a=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);let ink=0,sum=0,hash=2166136261;for(let i=0;i<a.length;i+=4){if(a[i]>20)ink++;sum+=a[i];hash=Math.imul(hash^a[i],16777619)}return{ink,sum,hash:hash>>>0,error:gl.getError()}});
    await time.fill('0');await time.dispatchEvent('input');const empty=await pixels();assert.equal(empty.ink,0);
    await time.fill('0.35');await time.dispatchEvent('input');const partial=await pixels();assert(partial.ink>0);assert.equal(partial.error,0);
    await page.screenshot({path:`${output}/${name}-${mode}-wave.png`,fullPage:true});
    await time.fill('1');await time.dispatchEvent('input');const full=await pixels();assert(full.ink>partial.ink);assert.notEqual(full.hash,partial.hash);
    const originalDuration=Number(await section.getAttribute('data-duration'));
    await section.locator('[data-speed]').fill('6');await section.locator('[data-speed]').dispatchEvent('input');assert(Number(await section.getAttribute('data-duration'))<originalDuration);
    await time.fill('0.35');await time.dispatchEvent('input');const before=await pixels();await section.locator('[data-spread]').fill('0.6');await section.locator('[data-spread]').dispatchEvent('input');const spread=await pixels();assert.notEqual(spread.hash,before.hash);
    await section.locator('[data-loop]').uncheck();await section.locator('[data-replay]').click();await page.waitForFunction(i=>Number(document.querySelectorAll('.demo')[i].dataset.progress)>.02&&Number(document.querySelectorAll('.demo')[i].dataset.progress)<1,i);await page.waitForFunction(i=>Number(document.querySelectorAll('.demo')[i].dataset.progress)===1,i);
    samples.push({mode,empty,partial,full,defaultDuration:originalDuration});
   }
   assert.equal(await page.evaluate(()=>window.bufferUploads),baseline,'Time and shader controls must not reupload geometry');
   await page.locator('details').evaluate(e=>e.open=true);
   const oldCount=Number(await page.locator('.demo').first().getAttribute('data-glyphs'));
   await page.locator('#source').fill('\\int_0^1 x^2\\,dx=\\frac{1}{3}');await page.locator('#apply').click();
   await page.waitForFunction(old=>Number(document.querySelector('.demo').dataset.glyphs)!==old,oldCount);
   assert.equal(await page.locator('#status').innerText(),'');assert.deepEqual(errors,[]);
   results.push({name,errors,media,bufferUploads:baseline,samples});
  }finally{await browser.close()}
 }
 const result={passed:true,results};fs.writeFileSync(output+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1});
