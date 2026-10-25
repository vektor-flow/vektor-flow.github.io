const {chromium}=await import(process.env.VKF_PLAYWRIGHT_MODULE??'playwright');
import assert from 'node:assert/strict';
const base=process.env.VKF_SITE_URL??'http://127.0.0.1:8857';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-vulkan']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
 await page.goto(base+'/');
 await page.waitForFunction(()=>[...document.querySelectorAll('.readme-example-play')].some(x=>!x.disabled),{timeout:120000});
 assert((await page.locator('.release-version').innerText()).includes('0.7.2'));
 const example=page.locator('[data-vkf-example-id="example-1"]');await example.locator('button').click();await page.waitForFunction(()=>document.querySelector('[data-vkf-example-id="example-1"] .readme-example-output').textContent.includes('[3, 7]'),{timeout:120000});
 await page.getByRole('link',{name:'Coming soon',exact:true}).first().click();assert((await page.locator('.release-version').innerText()).includes('0.7.2'));
 await page.getByRole('link',{name:'Open GPU math preview',exact:true}).click();assert(page.url().endsWith('/previews/gpu-math-typing/'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const url of ['/runtimes/v0.4.7/vkf-shared-compiler.wasm','/releases/0.4.7.html','/browser.html','/downloads/current/vkf-browser-compiler.zip','/previews/0.6.0/contact-core-1/'])assert.equal((await context.request.get(base+url)).status(),404,url);
 console.log('PASS 0.7.2 live compiler example, Coming soon navigation, phone width and retired endpoints404');
}finally{await browser.close();}
