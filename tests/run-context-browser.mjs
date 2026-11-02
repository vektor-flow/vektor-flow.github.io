import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.VKF_PLAYWRIGHT_MODULE??'playwright');
const site=process.env.VKF_SITE_ROOT, out=process.env.VKF_SITE_EVIDENCE;
assert(site&&out);fs.mkdirSync(out,{recursive:true});
const baseline=process.argv.includes('--expect-collapsed');
const report={owner:'e2040',status:'RUNNING',baseline,variants:[],errors:[],browserClosed:false,serverClosed:false};
const save=()=>fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify(report,null,2)+'\n');
const hash=s=>createHash('sha256').update(s).digest('hex');
let browser,server;
try{
 let base=process.env.VKF_SITE_URL;
 if(!base){
  const root=path.resolve(site,'public');
  server=http.createServer((req,res)=>{try{
   let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';
   const file=path.resolve(root,'.'+name);assert(file.startsWith(root+'/'));
   const type=/\.(mjs|js)$/.test(file)?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.wasm')?'application/wasm':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'application/octet-stream';
   // Deliberately ordinary first navigation: the product service worker establishes COI.
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(fs.readFileSync(file));
  }catch{res.writeHead(404);res.end();}});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));base=`http://127.0.0.1:${server.address().port}/preview/0.7.5/`;
 }
 report.base=base;save();
 browser=await chromium.launch({executablePath:process.env.VKF_BROWSER_EXECUTABLE??'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--js-flags=--max-old-space-size=1536']});
 for(const row of [
  {page:'syntax.html',id:'syntax-example-16',expected:'230 cm\n[100, 200, 300] cm',edited:'330 cm\n[100, 200, 300] cm'},
  {page:'stdlib.html',id:'stdlib-example-19',expected:'2.3 m\n230 cm\n[100, 200, 300] cm',edited:'3.3 m\n330 cm\n[100, 200, 300] cm'}
 ]){
  const context=await browser.newContext({viewport:{width:row.page==='stdlib.html'?390:1280,height:900},colorScheme:row.page==='stdlib.html'?'light':'dark'}),page=await context.newPage();
  page.setDefaultTimeout(20000);
  const v={...row,navigations:[]};report.variants.push(v);save();
  page.on('pageerror',e=>{report.errors.push(String(e));save();});
  page.on('framenavigated',f=>{if(f===page.mainFrame()){v.navigations.push(f.url());save();}});
  try{
   const url=new URL(row.page,base).href;await page.goto(url,{waitUntil:'networkidle'});
   const e=page.locator(`[data-vkf-example-id="${row.id}"]`);
   const ancestors=await e.evaluate(e=>{const ids=[];for(let n=e.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')ids.unshift(n.id);return ids;});assert(ancestors.length>0);
   for(const id of ancestors){const d=page.locator('#'+id);if(!await d.evaluate(n=>n.open))await d.locator(':scope > summary').click();}
   await e.locator('.readme-example-play').waitFor({state:'visible'});
   const original=await e.locator('textarea').inputValue();
   const source=baseline?original:original.replaceAll('2m','3m');assert(baseline||source!==original);
   if(!baseline)await e.locator('textarea').fill(source);
   const snapshot=()=>e.evaluate(e=>{const o=e.querySelector('.readme-example-output'),s=e.querySelector('textarea'),b=e.querySelector('.readme-example-play');const details=[];for(let n=e.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')details.push({id:n.id,open:n.open,hidden:n.hidden});return {url:location.href,isolated:crossOriginIsolated,source:s.value,raw:o.textContent,visible:o.innerText,origin:o.dataset.outputOrigin,kind:o.dataset.outputKind,busy:e.hasAttribute('aria-busy'),disabled:b.disabled,button:b.textContent,details};});
   v.before=await snapshot();v.sourceSha256=hash(source);save();assert.equal(v.before.isolated,false);assert.equal(v.before.url,url);assert(v.before.details.every(d=>d.open&&!d.hidden));
   await e.locator('.readme-example-play').click();
   const complete=()=>page.waitForFunction(id=>{const e=document.querySelector(`[data-vkf-example-id="${id}"]`),o=e?.querySelector('.readme-example-output');return crossOriginIsolated&&e&&!e.hasAttribute('aria-busy')&&!e.querySelector('.readme-example-play').disabled&&o?.dataset.outputOrigin==='run'&&(o.dataset.outputKind==='error'||o.textContent.length>0);},row.id,{timeout:60000});
   await complete();v.after=await snapshot();save();
   assert.equal(v.after.url,url);assert.equal(v.after.source,source);assert.equal(v.after.origin,'run');assert.equal(v.after.kind,'stdout');assert.equal(v.after.raw.trim(),baseline?row.expected:row.edited);assert.equal(v.after.button,'Run');
   assert(v.navigations.length>=2,'Genuine bootstrap reload required');
   if(baseline){assert.equal(v.after.visible,'');assert(v.after.details.some(d=>!d.open));v.status='OBSERVED_BASELINE_CONTEXT_LOSS_WITH_CORRECT_RAW_STDOUT';}
   else{
    assert.equal(v.after.visible.trim(),row.edited);assert(v.after.details.every(d=>d.open&&!d.hidden));
    const workers=page.workers();assert(workers.length>0);const added=[];page.on('worker',w=>added.push(w.url()));
    await e.locator('.readme-example-play').click();await complete();v.rerun=await snapshot();save();
    assert.equal(v.rerun.visible.trim(),row.edited);assert.equal(v.rerun.raw.trim(),row.edited);assert.equal(v.rerun.source,source);assert.equal(v.rerun.url,url);assert(v.rerun.details.every(d=>d.open&&!d.hidden));assert.equal(page.workers().length,workers.length);assert.equal(added.length,0);
    v.sameCurrentOwner=true;v.status='PASS_NONHASH_EDITED_FIRST_RUN_AND_RERUN';
    await e.screenshot({path:path.join(out,row.page+'.png')});
   }
  }finally{await context.close();v.contextClosed=true;save();}
 }
 assert.equal(report.errors.length,0);report.status=baseline?'OBSERVED_BASELINE_CONTEXT_LOSS':'PASS_NONHASH_CONTEXT_RESTORE_REAL_EDITED_RUN_RERUN';save();
}catch(e){report.status='FAIL';report.error=String(e.stack||e);save();throw e;}
finally{await browser?.close();report.browserClosed=true;if(server)await new Promise(ok=>server.close(ok));report.serverClosed=true;save();}
