// ACTUAL only: saving this test does not authorize generator execution.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const root=fileURLToPath(new URL('../../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('paired package retains every current source and includes interpolation dependencies',async()=>{
  const output=await mkdtemp(path.join(tmpdir(),'vkf-interpolation-package-'));
  try{
    for(const check of [false,true]){
      const args=['tools/build-packaged-stdlib.mjs','--output='+output];
      if(check)args.push('--check');
      const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:30000});
      assert.equal(result.status,0,result.stderr||result.error?.message||result.stdout);
    }
    const manifest=JSON.parse(await readFile(path.join(output,'vkf_packaged_stdlib.manifest.json'),'utf8'));
    const baseline=JSON.parse(await readFile(path.join(root,'analysis/interpolation/BASELINE.json'),'utf8'));
    const sources=new Map(manifest.sources.map(source=>[source.path,source]));
    assert.equal(sources.size,baseline.sourceCount+3);
    for(const old of baseline.sourceFiles){
      const name=old.path.replace('compiler/self_hosted/stdlib/','');
      assert.equal(sources.get(name)?.sha256,old.sha256,'existing paired bytes: '+name);
    }
    for(const name of ['interpolation.vkf','interpolation/polynomial.vkf','interpolation/tensor.vkf']){
      const bytes=await readFile(path.join(root,'compiler/self_hosted/stdlib',name));
      assert.equal(sources.get(name)?.sha256,sha(bytes));
      assert.equal(sources.get(name)?.bytes,bytes.length);
      assert(!bytes.toString().includes(':.Morphing'),'stdlib must be independent of project Morphing');
    }
    assert.equal(manifest.headerSha256,sha(await readFile(path.join(output,'vkf_packaged_stdlib.generated.hpp'))));
    for(const module of ['interpolation','interpolation.polynomial','interpolation.tensor']){
      const entry=manifest.entries.find(entry=>entry.module===module);
      assert(entry?.native&&entry.implementation==='VkfSource',module);
    }
  }finally{await rm(output,{recursive:true,force:true});}
});
