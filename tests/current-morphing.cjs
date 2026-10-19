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
   await page.waitForFunction(()=>document.querySelectorAll('.demo[data-ready=true]').length===3,null,{timeout:60000});
   assert.equal(await page.locator('video').count(),0);assert.equal(await page.locator('canvas').count(),3);assert.deepEqual(media,[]);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.locator('#status').innerText(),'');
   const baseline=await page.evaluate(()=>window.bufferUploads),samples=[];
   for(const[i,mode]of[[0,'grow'],[1,'overshoot']]){
    const section=page.locator('.demo').nth(i),time=section.locator('[data-time]');await section.scrollIntoViewIfNeeded();
    assert(Number(await section.getAttribute('data-duration'))>5);
    const pixels=()=>section.locator('canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2');const a=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);let ink=0,sum=0,hash=2166136261,colored=0,chroma=0; for(let i=0;i<a.length;i+=4){if(a[i]>20)ink++;if(Math.max(a[i],a[i+1],a[i+2])>30&&Math.max(a[i],a[i+1],a[i+2])-Math.min(a[i],a[i+1],a[i+2])>25)chroma++;if(a[i]===255&&(a[i]!==a[i+1]||a[i]!==a[i+2]))colored++;sum+=a[i];hash=Math.imul(hash^a[i],16777619)}return{ink,sum,colored,chroma,hash:hash>>>0,error:gl.getError()}});
    await time.fill('0');await time.dispatchEvent('input');const empty=await pixels();assert.equal(empty.ink,0);
    await time.fill('0.35');await time.dispatchEvent('input');const partial=await pixels();assert(partial.ink>0);assert(partial.chroma>0,'Reveal must contain spectral color');assert.equal(partial.error,0);
    await page.screenshot({path:`${output}/${name}-${mode}-wave.png`,fullPage:true});
    await time.fill('1');await time.dispatchEvent('input');const full=await pixels();assert(full.ink>partial.ink);assert.notEqual(full.hash,partial.hash);
    const originalDuration=Number(await section.getAttribute('data-duration'));
    assert.equal(full.colored,0,'Settled ink must be white');
    await section.locator('[data-velocity]').fill('1');await section.locator('[data-velocity]').dispatchEvent('input');assert(Number(await section.getAttribute('data-duration'))<originalDuration);
    await time.fill('0.35');await time.dispatchEvent('input');const before=await pixels();
    await section.locator('[data-k]').fill('1');await section.locator('[data-k]').dispatchEvent('input');await time.fill('0.15');await time.dispatchEvent('input');const wider=await pixels();assert.notEqual(wider.hash,before.hash);assert(Math.abs(Number(await section.getAttribute('data-ramp-width'))-Math.PI/2)<1e-9);
    await section.locator('[data-grow]').uncheck();const noGrowth=await pixels();assert.notEqual(noGrowth.hash,wider.hash);
    await section.locator('[data-grow]').check();await section.locator('[data-k]').fill('10');await section.locator('[data-k]').dispatchEvent('input');
    await section.locator('[data-overshoot]').fill('50');await section.locator('[data-overshoot]').dispatchEvent('input');const bigger=await pixels();assert.notEqual(bigger.hash,noGrowth.hash);
    await section.locator('[data-velocity]').fill('0');await section.locator('[data-velocity]').dispatchEvent('input');
    await section.locator('[data-play]').click();const held=await section.getAttribute('data-progress');await page.waitForTimeout(200);assert.equal(await section.getAttribute('data-progress'),held,'v=0 holds the front');
    await section.locator('[data-velocity]').fill('1');await section.locator('[data-velocity]').dispatchEvent('input');
    await section.locator('[data-loop]').uncheck();await section.locator('[data-replay]').click();await page.waitForFunction(i=>Number(document.querySelectorAll('.demo')[i].dataset.progress)>.02&&Number(document.querySelectorAll('.demo')[i].dataset.progress)<1,i);await page.waitForFunction(i=>Number(document.querySelectorAll('.demo')[i].dataset.progress)===1,i);
    samples.push({mode,empty,partial,full,defaultDuration:originalDuration});
   }
   assert.equal(samples[0].full.hash,samples[1].full.hash,'Both size modes must settle to identical text');
   assert.notEqual(samples[0].partial.hash,samples[1].partial.hash,'Size modes must differ during reveal');
   const mitosis=page.locator('#mitosis'),mt=mitosis.locator('[data-time]');
   const capture=()=>mitosis.locator('canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),a=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);let ink=0,hash=2166136261;for(let i=0;i<a.length;i+=4){if(a[i]>20)ink++;hash=Math.imul(hash^a[i],16777619)}return{ink,hash:hash>>>0,error:gl.getError()}});
   await mt.fill('0');await mt.dispatchEvent('input');const first=await capture();assert(first.ink>0,'Mitosis must start with a visible parent');
   await mt.fill((.5/(Number(await mitosis.getAttribute('data-glyphs'))-1)).toFixed(3));await mt.dispatchEvent('input');const split=await capture();assert.notEqual(first.hash,split.hash);assert.equal(split.error,0);
   await mitosis.screenshot({path:`${output}/${name}-mitosis-split.png`});
   await mt.fill('1');await mt.dispatchEvent('input');assert.equal((await capture()).hash,samples[0].full.hash,'Mitosis must finish at the same native LaTeX');
   const parity=await page.evaluate(async fixture=>{
    const kernel=await fetch('./mitosis-kernel.glsl').then(r=>r.text());const canvas=document.createElement('canvas');canvas.width=64;canvas.height=1;const gl=canvas.getContext('webgl2');if(!gl.getExtension('EXT_color_buffer_float'))throw Error('Float framebuffer unavailable');
    function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
    const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,`#version 300 es
    void main(){vec2 c[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3));gl_Position=vec4(c[gl_VertexID],0,1);}`));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;uniform float testValues[320];out vec4 color;${kernel}
    void main(){int i=int(gl_FragCoord.x)*5;color=vec4(mitosisField(testValues[i],testValues[i+1],testValues[i+2],testValues[i+3],testValues[i+4]),0,0,1);}`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);gl.uniform1fv(gl.getUniformLocation(program,'testValues'),fixture.samples.flat());
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,64,1,0,gl.RGBA,gl.FLOAT,null);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Float framebuffer incomplete');gl.viewport(0,0,64,1);gl.drawArrays(gl.TRIANGLES,0,3);const pixels=new Float32Array(256);gl.readPixels(0,0,64,1,gl.RGBA,gl.FLOAT,pixels);const error=Math.max(...fixture.nativeValues.map((x,i)=>Math.abs(x-pixels[4*i])));gl.getExtension('WEBGL_lose_context')?.loseContext();return error;
   },JSON.parse(fs.readFileSync(__dirname+'/mitosis-oracle.json','utf8')));assert(parity<1e-5,'Generated WebGL kernel must agree with actual native VKF');
   assert.equal(await page.evaluate(()=>window.bufferUploads),baseline,'Time and shader controls must not reupload geometry');
   await page.locator('details').evaluate(e=>e.open=true);
   const oldCount=Number(await page.locator('.demo').first().getAttribute('data-glyphs'));
   await page.locator('#source').fill('\\int_0^1 x^2\\,dx=\\frac{1}{3}');await page.locator('#apply').click();
   await page.waitForFunction(old=>Number(document.querySelector('.demo').dataset.glyphs)!==old,oldCount);
   assert.equal(await page.locator('#status').innerText(),'');assert.deepEqual(errors,[]);
   results.push({name,errors,media,bufferUploads:baseline,mitosis:{first,split,nativeKernelMaxError:parity},samples});
  }finally{await browser.close()}
 }
 const result={passed:true,results};fs.writeFileSync(output+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1});
