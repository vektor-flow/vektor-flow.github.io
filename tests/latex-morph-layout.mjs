import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../public/previews/gpu-math-typing/',import.meta.url));
const{prepareLatexStates}=await import(root+'latex-morph-layout.mjs');const{typeset}=await import(root+'typing-layout.mjs');const{packLatexItem}=await import(root+'latex-instances.mjs');
const data=JSON.parse(fs.readFileSync(root+'typing-data.json'));const catalog=JSON.parse(fs.readFileSync(root+'examples/catalog.json')).filter(e=>e.kernel==='latex');const color=[.2627,.8274,.8784,1],results=[];
for(const example of catalog){
 const sourceBefore=JSON.stringify(example.sources),p=prepareLatexStates(example.sources,data),N=p.instanceCount,G=p.groupCount;
 assert.equal(JSON.stringify(example.sources),sourceBefore);const again=prepareLatexStates(example.sources,data);assert.deepEqual(p.params,again.params);assert.equal(p.params.length,8+17*N+6*G);assert.equal(p.transferBytes,p.params.byteLength);
 let maximumError=0;
 for(let state=0;state<3;state++){
  const b=p.bounds[state],cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
  const expected=typeset(example.sources[state],data.maps).items.map(item=>{const row=packLatexItem(item,data,{scale:1,pixelAlign:false,ink:color});if(row[12]===1){row[0]+=1;row[1]+=1;row[2]-=2;row[3]-=2;row[13]*=p.scale;row[14]*=p.scale;}row[0]=.5+(row[0]-cx)*p.scale;row[1]=.5+(row[1]-cy)*p.scale;row[2]*=p.scale;row[3]*=p.scale;return row;});
  assert.equal(expected.length,N);
  for(let i=0;i<N;i++){
   const row=Array.from(p.params.slice(8+16*i,8+16*(i+1))),group=p.params[8+16*N+i];assert(Number.isInteger(group)&&group>=0&&group<G);
   row[0]+=p.params[8+17*N+6*group+2*state];row[1]+=p.params[8+17*N+6*group+2*state+1];
   const index=expected.findIndex(target=>row.every((x,j)=>Math.abs(x-target[j])<2e-7));assert(index>=0,example.id+': endpoint differs from actual engine packet');const target=expected.splice(index,1)[0];maximumError=Math.max(maximumError,...row.map((x,j)=>Math.abs(x-target[j])));
  }
  assert.equal(expected.length,0);
 }
 if(example.id==='discriminant'){const rigid=p.groups.find(g=>g.members.join('|')==='glyph:display/4|glyph:display/a|glyph:display/c');assert(rigid?.explicit&&rigid.instanceCount===3);}
 results.push({id:example.id,instances:N,groups:G,explicitGroups:p.groups.filter(g=>g.explicit).length,transferBytes:p.transferBytes,maximumError});
}
const repeated=prepareLatexStates(['{ab}+{ab}','\\begin{gathered}{ab}\\\\+{ab}\\end{gathered}','{ab}\\qquad+{ab}'],data);assert.equal(repeated.groups.filter(g=>g.explicit).length,2);
const negative=[['unmatched',['a','b','a']],['incomplete',['a','a+','a']],['material-change',['{ab}','\\color{red}{ab}','{ab}']],['geometry-change',['\\frac{a}{a}','\\frac{a\\quad}{a}','\\frac{a}{a}']]];
const rejected=[];for(const[name,sources]of negative){assert.throws(()=>prepareLatexStates(sources,data));rejected.push(name);}
const report={passed:true,results,endpointStates:results.length*3,duplicateExplicitGroups:true,rejected,physicalGPU:false,files:Object.fromEntries(['latex-morph-layout.mjs','latex-instances.mjs','typing-layout.mjs','typing-data.json','examples/catalog.json'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(root+file)).digest('hex')]))};
console.log(JSON.stringify(report,null,2));
