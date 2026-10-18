const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium, webkit} = require('/tmp/memuli-ux-review/node_modules/playwright');
const base = process.env.VKF_SITE_URL || 'http://127.0.0.1:8889';
const output = process.env.VKF_TEST_OUTPUT || '/tmp/vkf-sentence-morph-fix-20261018';
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/previews/morphing-current/SOURCE.json')));
(async () => {
  const results = [];
  for (const [name, engine, options, viewport] of [
    ['desktop', chromium, {executablePath:'/home/viktor/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', args:['--no-sandbox','--disable-gpu']}, {width:1440,height:1000}],
    ['phone', webkit, {env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1',WEBKIT_DISABLE_DMABUF_RENDERER:'1'}}, {width:390,height:844}],
  ]) {
    const browser = await engine.launch({headless:true,...options});
    try {
      const page = await browser.newPage({viewport});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/previews/gpu-math-typing/examples/live/index.html');
      await page.waitForURL('**/previews/morphing-current/');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const identity = await (await page.request.get(base + '/previews/morphing-current/SOURCE.json')).json();
      assert.equal(identity.sourceCommit, expected.sourceCommit);
      assert.deepEqual(identity.sourceFiles, expected.sourceFiles);
      assert.equal(identity.entryPoint, 'state_sequence.StateSequence');
      assert.equal(identity.compiledVKFIntegration, false);
      assert.equal(identity.textPreview.status, 'available');
      assert.equal(identity.textPreview.letterStep, 1);
      assert.equal(identity.textPreview.wordStep, 1);
      assert.equal((await page.request.get(base + '/previews/text-unfold/letters-mitosis.mp4')).status(), 404);
      const videos = page.locator('video');
      assert.equal(await videos.count(), 2);
      await page.waitForFunction(()=>document.querySelectorAll('.demo[data-ready=true]').length===2);
      let sentence;
      const captures = [];
      for (const [i,mode,unit] of [[0,'letters','letter'],[1,'words','word']]) {
        const report = await (await page.request.get(base + `/previews/morphing-current/${mode}-verification.json`)).json();
        assert.equal(report.step, 1);
        assert.equal(report.unit, unit);
        assert(report.decodedEveryFrame && report.decodedRGBExact);
        assert(report.states.length > (i === 0 ? 10 : 2));
        assert.equal(report.states.at(-1), report.sentence);
        if (sentence) assert.equal(report.sentence, sentence);
        sentence = report.sentence;
        assert(!(await page.locator('body').innerText()).includes(sentence));
        for (let j=1;j<report.states.length;j++) {
          assert(report.states[j].startsWith(report.states[j-1]));
          const count = value => i === 0 ? [...value.replace(/\s/g,'')].length : value.split(/\s+/).length;
          assert.equal(count(report.states[j])-count(report.states[j-1]), 1);
        }
        const video = videos.nth(i);
        assert.equal(await video.getAttribute('data-unit'), unit);
        assert.equal(await video.getAttribute('autoplay'), null);
        await video.scrollIntoViewIfNeeded();
        await page.locator('.demo').nth(i).locator('[data-play]').click();
        await page.waitForFunction(i => document.querySelectorAll('video')[i].currentTime > .2, i);
        await video.evaluate(v => v.pause());
        const slider = page.locator('.demo').nth(i).locator('[data-time]');
        await slider.fill('1.5');
        await slider.dispatchEvent('input');
        await page.waitForFunction(({i,target}) => Math.abs(document.querySelectorAll('video')[i].currentTime-target)<.06, {i,target:report.motionStart+1.5*report.secondsPerState});
        const speed = page.locator('.demo').nth(i).locator('[data-speed]');
        await speed.fill('1.5');
        await speed.dispatchEvent('input');
        assert.equal(await video.evaluate(v => v.playbackRate),1.5);
        const details = await video.evaluate(async v => {
          await new Promise((resolve,reject) => {v.addEventListener('seeked',resolve,{once:true});v.addEventListener('error',()=>reject(Error(v.error.message)),{once:true});v.currentTime=v.duration-1;});
          await new Promise(resolve => requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const canvas = document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;
          canvas.getContext('2d').drawImage(v,0,0);
          return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,error:v.error?.message,png:canvas.toDataURL('image/png').split(',')[1]};
        });
        assert.equal(details.width, 1280);
        assert.equal(details.height, 720);
        assert.equal(details.error, undefined);
        assert(Math.abs(details.duration-report.durationSeconds) < .15);
        fs.writeFileSync(path.join(output,`${name}-${mode}-browser-final.png`),Buffer.from(details.png,'base64'));
        captures.push({mode,duration:details.duration,width:details.width,height:details.height});
      }
      assert.deepEqual(errors, []);
      results.push({name,errors,captures});
    } finally {await browser.close();}
  }
  const result = {passed:true,results};
  fs.writeFileSync(path.join(output,'browser-verification.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
})().catch(e => {console.error(e);process.exitCode=1;});
