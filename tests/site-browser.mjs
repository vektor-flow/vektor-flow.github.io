// Integration smoke: use the shipped compiler, verify a rerun and follow the public references.
const {chromium}=await import(process.env.VKF_PLAYWRIGHT_MODULE??'playwright');
import assert from 'node:assert/strict';
const base=process.env.VKF_SITE_URL??'http://127.0.0.1:8857';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-vulkan']});
try {
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();
 await page.goto(base+'/');
 await page.waitForFunction(()=>[...document.querySelectorAll('.readme-example-play')].some(x=>!x.disabled),null,{timeout:120000});
 assert((await page.locator('.release-version').innerText()).includes('0.7.2'));
 const example=page.locator('[data-vkf-example-id="scientific-spectrum"]');
 assert.equal(await example.locator('.readme-example-output').innerText(),'');
 await example.locator('button').click();
 await page.waitForFunction(()=>!document.querySelector('[data-vkf-example-id="scientific-spectrum"]').hasAttribute('aria-busy'),null,{timeout:120000});
 assert((await example.locator('.readme-example-output').innerText()).includes('[3, 8, 4]'));
 assert(await example.locator('canvas').count()>0);
 await page.getByRole('link',{name:'Syntax',exact:true}).first().click();
 await page.locator('#reference-search').fill('specialization');
 assert(await page.locator('.reference-group:not([hidden])').count()>0);
 await page.getByRole('link',{name:'Standard library',exact:true}).first().click();
 assert(await page.locator('#linalg').count());
 await page.getByRole('link',{name:'Experimental previews',exact:true}).click();
 await page.getByRole('link',{name:'Open GPU math lab',exact:true}).click();
 assert(page.url().endsWith('/previews/gpu-math-typing/document.html'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const url of ['/runtimes/v0.4.7/vkf-shared-compiler.wasm','/releases/0.4.7.html','/downloads/current/vkf-browser-compiler.zip','/previews/0.6.0/contact-core-1/']) assert.equal((await context.request.get(base+url)).status(),404,url);
 await page.goto(base+'/browser.html');
 await page.waitForURL('**/build.html#embed');
 console.log('PASS real motion program, phone layout, references, preview navigation and legacy documentation redirect');
} finally {await browser.close();}
