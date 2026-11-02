// Normal existing-browser-job attachment, not a browser/FD/controller launcher.
// The sole admitted ACTUAL supplies a dedicated page from its EXISTING job and
// its normal admission/deadline check. No CLI entry point or fallback runner.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const digest=raw=>createHash('sha256').update(raw).digest('hex');
async function pin(file) {
  if(file instanceof URL) file=fileURLToPath(file);
  const raw=await fs.readFile(file);
  return {path:path.resolve(file),bytes:raw.length,sha256:digest(raw)};
}
async function verify(spec) {
  const actual=await pin(spec.path);
  assert.equal(actual.bytes,spec.bytes,'pinned byte extent');
  assert.equal(actual.sha256,spec.sha256,'pinned source/build bytes');
  return actual;
}
const write=async(file,value)=>fs.writeFile(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});

export async function runPlottingInExistingJob({page,siteRoot,runRoot,peerBuildsPath,phase,authorize}) {
  assert.equal(typeof authorize,'function','existing actual admission/deadline callback required');
  assert(['preflight','measure'].includes(phase),'explicit existing parity-first phase');
  siteRoot=path.resolve(siteRoot);runRoot=path.resolve(runRoot);
  const requestPath=path.join(runRoot,'request.json');
  const request=JSON.parse(await fs.readFile(requestPath,'utf8'));
  const peerBuilds=JSON.parse(await fs.readFile(peerBuildsPath,'utf8'));
  await verify(peerBuilds.lockfile);
  for(const tool of ['plotly','deck']) await verify(peerBuilds[tool].script);
  const peerPolicy=JSON.parse(await fs.readFile(new URL('./peers.json',import.meta.url),'utf8'));
  for(const tool of ['plotly','deck']) {
    assert.equal(peerBuilds[tool].version,peerPolicy[tool].version);
    assert.equal(peerBuilds[tool].integrity,peerPolicy[tool].integrity);
  }
  const baseURL=new URL(page.url()).origin;
  assert(/^https?:/.test(baseURL),'page from normal existing served-site job required');
  const releasePath=path.join(siteRoot,'public/preview/0.7.5/current-compiler-release.json');
  const release=JSON.parse(await fs.readFile(releasePath,'utf8'));
  request.currentBinding=release.browser_binding;
  request.peerBuilds=peerBuilds;
  const helperPath=path.join(siteRoot,'tests/plotting-comparison.mjs');
  const helper=await fs.readFile(helperPath,'utf8');
  const identity={request:await pin(requestPath),helper:await pin(helperPath),attachment:await pin(new URL(import.meta.url)),
    release:await pin(releasePath),selection:await pin(path.join(siteRoot,'scripts/current-package-selection.json')),
    renderer:await pin(path.join(siteRoot,'public/preview/0.7.5/vf-ui/vf-display.js')),
    runner:await pin(path.join(siteRoot,'public/preview/0.7.5/inline-runner.mjs')),
    mount:await pin(path.join(siteRoot,'public/preview/0.7.5/inline-retained-scene-view.mjs')),
    peerBuilds,environment:request.environment,files:{}};
  for(const [key,spec] of Object.entries(request.files)) {
    const file=path.resolve(runRoot,spec.path);
    assert(file.startsWith(runRoot+path.sep),'input must belong to exact prepared job');
    identity.files[key]=await verify({...spec,path:file});
  }
  const identitySha256=digest(JSON.stringify(identity));
  let preflight;
  if(phase==='measure') {
    preflight=JSON.parse(await fs.readFile(path.join(runRoot,'plotting-parity.json'),'utf8'));
    assert.equal(preflight.status,'PASS_PARITY_PREFLIGHT');
    assert.equal(preflight.identitySha256,identitySha256,'all current inputs/builds/environment must match preflight');
    for(const tool of ['vkf','plotly','deck']) {
      const proof=preflight.tools[tool];
      await verify(proof.pin);
      const raw=JSON.parse(await fs.readFile(proof.pin.path,'utf8'));
      assert.equal(raw.status,'PASS_PREFLIGHT');
      assert(raw.checkpoints.length>=3&&raw.checkpoints.every(c=>c.geometry.visibleLandmarks>0));
    }
  }
  // Caller must use its existing sole-owner admission, original clock, and
  // resource protocol here, including the whole setup + data + all tools fit.
  await authorize({scope:'additional-plotting-comparison',phase,identitySha256,
    requestedCaps:{compileSeconds:180,caseSeconds:240,traceSeconds:request.traceMethod.durationSeconds},
    noLocal48DenominatorChange:true});
  const prefix=baseURL+'/__vkf_plotting_e2025/';
  const files=new Map(Object.values(identity.files).map(spec=>[prefix+path.basename(spec.path),spec]));
  for(const tool of ['plotly','deck']) files.set(prefix+tool+'.js',peerBuilds[tool].script);
  const routePattern=prefix+'*';
  const route=async requestRoute=>{
    const spec=files.get(requestRoute.request().url());
    if(!spec) return requestRoute.abort('blockedbyclient');
    await verify(spec);
    return requestRoute.fulfill({status:200,path:spec.path,headers:{'Cross-Origin-Resource-Policy':'same-origin'},
      contentType:spec.path.endsWith('.json')?'application/json':spec.path.endsWith('.vkf')?'text/plain':spec.path.endsWith('.js')?'text/javascript':'application/octet-stream'});
  };
  const results={};
  let reference=preflight?.reference;
  await page.route(routePattern,route);
  try {
    for(const tool of ['vkf','plotly','deck']) {
      await authorize({scope:'additional-plotting-comparison',phase,tool,identitySha256});
      // A new document clears the previous tool's resources in the dedicated
      // actual-owned page. No new browser, software flag or GPU claim is made.
      await page.goto(baseURL+'/preview/0.7.5/performance.html',{waitUntil:'load'});
      await page.emulateMedia({colorScheme:'light'});
      if(tool!=='vkf') await page.addScriptTag({url:prefix+tool+'.js'});
      const outputFile=path.join(runRoot,'plotting-'+phase+'-'+tool+'.json');
      let caseTimer;
      try {
        const evaluation=page.evaluate(async({helper,options})=>{
          const url=URL.createObjectURL(new Blob([helper],{type:'text/javascript'}));
          try {
            const {runPlottingTool}=await import(url);
            return await runPlottingTool(options);
          } finally {URL.revokeObjectURL(url);}
        },{helper,options:{tool,phase,request,assetBase:prefix,reference}});
        const raw=await Promise.race([evaluation,new Promise((_,reject)=>{
          caseTimer=setTimeout(()=>reject(Error('NORMAL_PLOTTING_CASE_240S_CAP')),240000);
        })]);
        raw.identitySha256=identitySha256;
        await write(outputFile,raw);
        results[tool]={pin:await pin(outputFile),status:raw.status};
        if(tool==='vkf'&&phase==='preflight') reference=raw.reference;
      } catch(error) {
        // Preserve the genuine compiler/renderer/peer error without turning an
        // incomplete run into timing cells or reusing a historical PASS.
        await write(outputFile+'.error.json',{tool,phase,status:String(error).includes('UNRUN_')?'UNRUN':'FAIL',
          identitySha256,error:String(error),presentationFps:null,comparativeSamples:0});
        throw error;
      } finally {clearTimeout(caseTimer);}
    }
    if(phase==='preflight') {
      assert(Object.values(results).every(v=>v.status==='PASS_PREFLIGHT'));
      await write(path.join(runRoot,'plotting-parity.json'),{status:'PASS_PARITY_PREFLIGHT',identitySha256,identity,
        tools:results,reference,comparativeSamples:0,scope:request.scope,
        qualification:'Matched numerical/visible-geometry/camera preflight; no timing or display-presentation qualification.'});
    } else {
      await write(path.join(runRoot,'plotting-raw-results.json'),{status:'RAW_MEASURED_REQUIRES_INDEPENDENT_REVIEW',
        identitySha256,identity,tools:results,parity:await pin(path.join(runRoot,'plotting-parity.json')),
        presentationFps:null,priorLocal48:'Unchanged 48x10; accepted12/72 controls,60UNRUN,0comparative historical rows remain intact.'});
    }
    return {phase,identitySha256,tools:results};
  } finally {
    try {await page.goto('about:blank',{timeout:15000});}
    finally {await page.unroute(routePattern,route);}
  }
}
