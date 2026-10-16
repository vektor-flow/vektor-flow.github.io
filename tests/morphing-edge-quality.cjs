const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{chromium}=require('/tmp/memuli-ux-review/node_modules/playwright');
(async()=>{const out=process.env.VKF_EDGE_EVIDENCE||'/tmp/morphing-edge-quality';fs.mkdirSync(out,{recursive:true});
const legacy=cp.execFileSync('git',['show','1385ab6:public/previews/gpu-math-typing/examples/live/gpu-view.mjs'],{encoding:'utf8'});
const browser=await chromium.launch({executablePath:'/tmp/cuvami-chromium-cold-1243/chrome',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-vulkan']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('**/__baseline.mjs',r=>r.fulfill({contentType:'text/javascript',body:legacy}));
 await page.goto('http://127.0.0.1:8881/previews/gpu-math-typing/examples/live/index.html?validation');await page.waitForFunction(()=>window.morphingVerification?.coordinate===0,{},{timeout:90000});
 const metadata=await page.evaluate(async()=>{const data=window.morphingTest.sampleFrame(),{createGPUView}=await import('/previews/gpu-math-typing/examples/live/gpu-view.mjs'),old=await import('/__baseline.mjs');
 document.body.innerHTML='<div style="display:flex"><canvas id="sharp" style="width:720px;height:720px"></canvas><canvas id="baseline" style="width:720px;height:720px"></canvas></div>';
 for(const id of ['sharp','baseline']){const c=document.getElementById(id);c.width=c.height=720;}
 const a=await createGPUView(document.getElementById('sharp')),b=old.createGPUView(document.getElementById('baseline'));a.draw(data.frame,data.resolution);b.draw(data.frame,data.resolution);
 window.testRenderers=[a,b];return{triangles:data.frame.vertices.length/18,backend:a.backend,presentation:a.presentation};});
 assert(metadata.triangles>0);assert.equal(metadata.presentation,'VKF screen-space simplex renderer');
 await page.locator('#sharp').screenshot({path:path.join(out,'triangles.png')});await page.locator('#baseline').screenshot({path:path.join(out,'coverage.png')});fs.writeFileSync(path.join(out,'renderer.json'),JSON.stringify(metadata,null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
