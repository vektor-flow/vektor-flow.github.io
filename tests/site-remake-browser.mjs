// Serial real-browser qualification of the published programs, layout and embedding bundle.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.VKF_PLAYWRIGHT_MODULE??'playwright');
const base=process.env.VKF_SITE_URL??'http://127.0.0.1:8857';
const out=process.env.VKF_SITE_EVIDENCE??'/tmp/vkf-site-remake';
fs.mkdirSync(out,{recursive:true});
const rows=[],checks=[],errors=[];
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-vulkan','--renderer-process-limit=2','--disable-dev-shm-usage']});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
let failure;
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,colorScheme:'light',permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const sources=new Map();
 for(const route of ['index.html','syntax.html','stdlib.html','build.html']) {
  await page.goto(base+'/'+route,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.readme-example-play')].some(x=>!x.disabled),null,{timeout:120000});
  assert.equal(await page.locator('.readme-example-output').evaluateAll(es=>es.every(e=>e.textContent==='')),true,route+' initially empty outputs');
  const examples=await page.locator('.readme-example').evaluateAll(es=>es.map(e=>({id:e.dataset.vkfExampleId,source:e.querySelector('textarea').value,expected:e.nextElementSibling?.classList.contains('expected-result')?e.nextElementSibling.querySelector('pre')?.textContent:null})));
  for(const example of examples) {
   const key=hash(example.source);
   if(!sources.has(key)) sources.set(key,{...example,route,occurrences:[]});
   sources.get(key).occurrences.push({route,id:example.id});
  }
  checks.push({check:'route-ready-and-output-empty',route,passed:true,examples:examples.length});
 }
 // Each source is compiled/executed once through the actual worker API; route/source hashes bind all displayed copies.
 await page.goto(base+'/index.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!document.querySelector('.readme-example-play').disabled,null,{timeout:120000});
 for(const [source_sha256,example] of sources) {
  const result=await page.evaluate(async source=>{
   const {createInlineRunner}=await import('./inline-runner.mjs');
   const release=await fetch('./current-compiler-release.json').then(r=>r.json());
   const runner=createInlineRunner({moduleURL:release.package.module,wasmUrl:release.package.wasm,dataURL:release.package.data,timeoutMs:90000});
   try {const r=await runner.run(source);return {stdout:r.output.stdout,stderr:r.output.stderr??'',packets:r.packets?.length??0};}
   catch(error){return {error:error.message};}
  },example.source);
  const passed=!result.error && (!example.expected || result.stdout===example.expected) && (!example.source.includes('.show()') || result.packets>0);
  const row={source_sha256,route:example.route,id:example.id,occurrences:example.occurrences,expected:example.expected,...result,passed};
  rows.push(row);console.log(JSON.stringify({id:example.id,route:example.route,passed,error:result.error}));
  fs.writeFileSync(path.join(out,'example-checks.json'),JSON.stringify(rows,null,2));
 }
 assert(rows.every(r=>r.passed),'one or more examples failed; see example-checks.json');
 // Run the actual homepage UI and inspect both plots; change a parameter and check invalidation/rerun.
 const motion=page.locator('[data-vkf-example-id="motion-design"]');
 await motion.locator('.readme-example-play').click();
 await page.waitForFunction(()=>!document.querySelector('[data-vkf-example-id="motion-design"]').hasAttribute('aria-busy'),null,{timeout:120000});
 assert.equal(await motion.locator('.readme-example-output').getAttribute('data-output-kind'),'stdout');
 assert((await motion.locator('.readme-example-output').innerText()).includes('1.5'));
 assert(await motion.locator('canvas').count()>0);
 await page.screenshot({path:path.join(out,'desktop-home.png'),fullPage:true});
 await motion.screenshot({path:path.join(out,'desktop-motion.png')});
 const textarea=motion.locator('textarea');const original=await textarea.inputValue();
 await textarea.fill(original.replace('exit_slope:0','exit_slope:-2'));
 assert.equal(await motion.locator('.readme-example-output').innerText(),'');
 assert.equal(await motion.locator('canvas').count(),0);
 await motion.locator('.readme-example-play').click();
 await page.waitForFunction(()=>!document.querySelector('[data-vkf-example-id="motion-design"]').hasAttribute('aria-busy'),null,{timeout:120000});
 assert((await motion.locator('.readme-example-output').innerText()).includes('0.75'));
 checks.push({check:'motion-real-UI-two-runs-and-invalidation',passed:true});
 // Search, disclosure and keyboard-accessible controls.
 await page.goto(base+'/syntax.html');
 await page.locator('#reference-search').fill('recurrence');
 assert(await page.locator('.reference-group:not([hidden])').count()>0);
 assert(await page.locator('.reference-group[hidden]').count()>0);
 await page.locator('#reference-search').fill('');
 await page.locator('[data-expand-all]').click();
 assert.equal(await page.locator('.reference-group:not([open])').count(),0);
 await page.locator('[data-collapse-all]').click();
 assert.equal(await page.locator('.reference-group[open]').count(),0);
 await page.goto(base+'/syntax.html#symbolic-domains-and-calculus');
 assert(await page.locator('#symbolic-domains-and-calculus').getAttribute('open')!==null);
 checks.push({check:'search-expand-collapse-and-deep-link',passed:true});
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:width===1440?1000:844});
  for(const route of ['index.html','syntax.html','stdlib.html','build.html','install.html']) {
   await page.goto(base+'/'+route,{waitUntil:'networkidle'});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} width ${width}`);
   assert.equal(await page.locator('h1').count(),1);
   const nav=page.locator('nav[aria-label="Main navigation"]');
   assert(await nav.getByRole('link',{name:'Standard library',exact:true}).isVisible());
   const targets=await nav.locator('a').evaluateAll(es=>es.map(e=>({text:e.textContent,box:e.getBoundingClientRect().toJSON()})));
   assert(targets.every(t=>t.box.x>=0&&t.box.x+t.box.width<=width),route+' visible nav');
   await page.screenshot({path:path.join(out,`${width}-${route}.png`),fullPage:true});
   checks.push({check:'responsive-navigation-and-no-page-overflow',route,width,passed:true});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto(base+'/');await page.screenshot({path:path.join(out,'dark-home.png'),fullPage:true});
 checks.push({check:'dark-layout-captured',passed:true});
 await page.emulateMedia({colorScheme:'light'});
 await page.goto(base+'/build.html');
 await page.locator('[data-copy]').first().click();
 assert((await page.evaluate(()=>navigator.clipboard.readText())).startsWith('vkf -v'));
 checks.push({check:'CLI-copy-exact',passed:true});
 await page.goto((process.env.VKF_STARTER_URL??base)+'/embed-example.html');
 await page.getByRole('button',{name:'Calculate',exact:true}).waitFor({timeout:120000});
 await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('output').textContent.trim()==='25',null,{timeout:120000});
 await page.locator('#number').fill('7');assert.equal(await page.locator('output').innerText(),'');
 await page.getByRole('button',{name:'Calculate',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('output').textContent.trim()==='49',null,{timeout:120000});
 await page.screenshot({path:path.join(out,'embedded-calculation.png')});
 checks.push({check:'actual-HTML-embedding-two-inputs',origin:process.env.VKF_STARTER_URL??base,passed:true});
 for(const url of ['downloads/vkf-browser-preview-0.7.2.tar.gz','downloads/vkf-browser-preview-0.7.2.tar.gz.sha256','downloads/vkf-embedding-starter-0.7.2.tar.gz','downloads/vkf-embedding-starter-0.7.2.tar.gz.sha256']) assert.equal((await context.request.get(base+'/'+url)).status(),200,url);
 for(const [old,current] of [['guide.html','syntax.html'],['reference.html','stdlib.html'],['browser.html','build.html#embed'],['testing.html','build.html#tests']]) {await page.goto(base+'/'+old);await page.waitForURL('**/'+current);}
 checks.push({check:'download-links-and-legacy-redirects',passed:true});
 assert.equal(errors.length,0,'browser errors: '+JSON.stringify(errors));
} catch(error) {failure=String(error);console.error(error);}
finally {
 await browser.close();
 const report={schema:1,verified_utc:new Date().toISOString(),compiler_version:'0.7.2',physical_gpu_tested:false,renderer:'SwiftShader',source_examples:rows.length,passed_examples:rows.filter(r=>r.passed).length,checks,errors,failure,passed:!failure};
 fs.writeFileSync(path.join(out,'site-remake-report.json'),JSON.stringify(report,null,2));
 if(failure) process.exitCode=1;
}
