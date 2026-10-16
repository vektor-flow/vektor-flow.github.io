const {chromium}=require('/tmp/memuli-ux-review/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const out=process.env.VKF_STRUCTURE_EVIDENCE||'/tmp/math-structure-review';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.VKF_CHROMIUM||'/tmp/cuvami-chromium-cold-1243/chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-unsafe-webgpu','--use-vulkan=swiftshader','--enable-features=Vulkan']});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:850},acceptDownloads:true});
  await page.goto('http://127.0.0.1:8881/previews/gpu-math-typing/motion/index.html?validation&example=derive-quadratic');
  await page.waitForFunction(()=>window.mathMotion?.stats.ready||window.mathMotion?.stats.errors.length);
  assert.deepEqual(await page.evaluate(()=>window.mathMotion.stats.errors),[]);
  assert.equal(await page.evaluate(()=>window.mathMotion.stats.software),true);
  const report=await page.evaluate(async()=>{
   const {buildScene,pair}=await import('./scene.mjs');const {bytes,residentFields}=await import('./field-assets.mjs');const {parseDraft}=await import('../draft-parser.mjs');
   const data=JSON.parse(new TextDecoder().decode(await bytes('./math-data.json.gz'))),engine=window.mathMotion.engine,fields=residentFields(engine.device,engine.atlas,data.atlasSize,location.href),supportsSubgroups=engine.subgroups;
   const key=math=>JSON.stringify(parseDraft(math,data.maps.display).nodes.filter(n=>n.type!=='hole'));
   const quadratic=window.mathMotion.selected.steps;
   const cases=[
    {a:quadratic[2].math,b:quadratic[3].math,unit:'='},
    {a:quadratic[2].math,b:quadratic[3].math,unit:String.raw`\frac{b^2-4ac}{4a^2}`},
    ...[2,3,4].map(i=>({a:quadratic[i].math,b:quadratic[i+1].math,unit:'4ac'})),
    {a:'4a+4ac=4ac+4c',b:'4ac+4c=4a+4ac',unit:'4ac'},
    {a:'7pq+7p+q=0',b:String.raw`\frac{7pq}{2}=7p-q`,unit:'7pq'},
    {a:String.raw`x+\frac{r+s}{t}=0`,b:String.raw`0=\frac{r+s}{t}-x`,unit:String.raw`\frac{r+s}{t}`},
   ];
   const results=[];let baselineFailures=0;
   for(const c of cases)for(const reverse of [false,true]){
    const a=buildScene({math:reverse?c.b:c.a},data),b=buildScene({math:reverse?c.a:c.b},data),packet=pair(a,b);
    const sources=a.groups.filter(g=>g.key===key(c.unit)),destinations=b.groups.filter(g=>g.key===key(c.unit));
    if(!sources.length||!destinations.length)throw Error('Missing syntax group: '+c.unit);
    await fields.ensure(packet.a,packet.b);
    const valid=matches=>sources.every(g=>destinations.some(h=>h.count===g.count&&Array.from({length:g.count},(_,k)=>matches[g.start+k]===h.start+k).every(Boolean)));
    await engine.generate(packet.a,packet.b,{grid:8,iterations:1});if(!valid(await engine.inspectAssignment()))baselineFailures++;
    const variants=supportsSubgroups?[true,false]:[false];
    for(const subgroup of variants){engine.subgroups=subgroup;await engine.generate(packet.a,packet.b,{grid:8,iterations:1,groups:packet.groups});
     for(const phase of [0,.25,.5,.75,1]){await engine.draw(phase);const matches=await engine.inspectAssignment();
      if(new Set(matches).size!==packet.n||matches.some(j=>j>=packet.n))throw Error('Non-bijective assignment');
      if(!valid(matches))throw Error(`Broken ${c.unit}, reverse=${reverse}, phase=${phase}, subgroup=${subgroup}: ${matches}`);
     }
     results.push({unit:c.unit,reverse,subgroup,phases:5});
    }
   }
   // No matching group must leave all items available to ordinary matching.
   const packet=pair(buildScene({math:'4ac'},data),buildScene({math:'7pq'},data));
   await fields.ensure(packet.a,packet.b);await engine.generate(packet.a,packet.b,{grid:8,iterations:1,groups:packet.groups});
   if(new Set(await engine.inspectAssignment()).size!==packet.n)throw Error('Fallback matching failed');
   if(!baselineFailures)throw Error('Regression does not reproduce the original failure');
   return {baselineFailures,results,errors:engine.errors};
  });
  assert.deepEqual(report.errors,[]);
  // Reload to inspect and record the actual player, with its full 32x32 solver.
  await page.reload();await page.waitForFunction(()=>window.mathMotion?.stats.frames>0);
  for(const phase of [2,2.25,2.5,2.75,3,3.5,4.5]){await page.evaluate(p=>window.mathMotion.seek(p),phase);await page.screenshot({path:`${out}/quadratic-${phase}.png`});}
  const [movie]=await Promise.all([page.waitForEvent('download',{timeout:45000}),page.locator('#download').click()]);await movie.saveAs(out+'/'+movie.suggestedFilename());
  assert.deepEqual(await page.evaluate(()=>window.mathMotion.stats.errors),[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));console.log(`PASS ${report.results.length} GPU structural matching cases at five phases; ${report.baselineFailures} original failures reproduced; live player video exported`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
