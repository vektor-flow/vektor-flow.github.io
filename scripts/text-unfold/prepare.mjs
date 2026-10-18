// Build offline motion with the installed compiler and unmodified Morphing core.
// Node lays out text using the existing LaTeX engine; it does not interpolate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {typesetText} from '../../public/previews/gpu-math-typing/text-flow.mjs';
import {packLatexItem} from '../../public/previews/gpu-math-typing/latex-instances.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.resolve(process.argv[2]||'/tmp/vkf-text-unfold');
const library=process.env.VKF_MORPHING_LIBRARY||'/home/viktor/Projects/Vektor Flow/.worktrees/morphology-review-20261015-libraries';
const compiler=process.env.VKF_COMPILER||'/home/viktor/.local/bin/vkf-cuvami';
fs.mkdirSync(output,{recursive:true});
const project=path.join(output,'source');fs.mkdirSync(project,{recursive:true});
fs.copyFileSync(path.join(library,'Morphing.vkf'),path.join(project,'Morphing.vkf'));
fs.cpSync(path.join(library,'morphing'),path.join(project,'morphing'),{recursive:true});
fs.copyFileSync(path.join(library,'LICENSE'),path.join(project,'LICENSE'));
const data=JSON.parse(fs.readFileSync(path.join(root,'public/previews/gpu-math-typing/typing-data.json')));
const lines=[
 {text:'Curiosity, unfolded.',size:82,y:245},
 {text:'Ask. Predict. Experiment.',size:58,y:385},
 {text:'Follow an idea as it changes.',size:58,y:495},
 {text:'Explore alone. Discover together.',size:58,y:605},
 {text:'An answer becomes the next question.',size:58,y:715},
];
const glyphs=[],wordGroups=[],characterGroups=[];
let word=0,character=0;
for(const line of lines){
 const box=typesetText(line.text,data.maps,{width:2000});
 if(!box.complete)throw Error(box.diagnostics.join('; '));
 let prior=null,anchor=null;
 const scale=line.size/data.maps.text.em;
 for(const item of box.items){
  if(item.kind!=='glyph')throw Error('Only real engine glyphs expected');
  const packet=packLatexItem(item,data,{pixelAlign:false,ink:[.94,.96,.97,1]});
  packet[0]=190+packet[0]*scale;packet[1]=line.y+packet[1]*scale;
  packet[2]*=scale;packet[3]*=scale;
  if(item.flowX!==prior){prior=item.flowX;anchor=[190+item.flowX*scale,line.y];wordGroups.push({anchor,em:line.size});word++;}
  characterGroups.push({anchor:[190+item.x*scale,line.y],em:line.size});
  glyphs.push({packet,character:character++,word:word-1});
 }
}
const modes={letters:characterGroups,words:wordGroups};
const frames=720,fps=60;
let source=fs.readFileSync(path.join(root,'scripts/text-unfold/entrance.vkf'),'utf8');
for(const groups of Object.values(modes))source+=`\n::animation(${groups.length},${frames})\n`;
fs.writeFileSync(path.join(project,'entrance.vkf'),source);
function run(args,name){const r=spawnSync(args[0],args.slice(1),{encoding:'utf8',maxBuffer:64*1024*1024,timeout:180000});fs.writeFileSync(path.join(output,name+'.log'),r.stdout+r.stderr);if(r.status!==0)throw Error(name+': '+r.stderr);return r.stdout;}
run([compiler,'-b',path.join(project,'entrance.vkf'),'-o',path.join(output,'entrance')],'build');
const rows=run([path.join(output,'entrance')],'native').trim().split('\n').map(line=>JSON.parse(line)).filter(Array.isArray);
if(rows.length!==frames*2)throw Error('Expected two native animation frame sequences');
const arrays=[rows.slice(0,frames).flat(),rows.slice(frames).flat()];
let index=0;
const proof={compiler:fs.realpathSync(compiler),compilerSHA256:sha(fs.realpathSync(compiler)),libraryCommit:run(['git','-C',library,'rev-parse','HEAD'],'library-commit').trim(),frames,fps,width:1920,height:1080,hostInterpolation:false,rendering:'Existing LaTeX engine and unchanged draw.wgsl',mode:'Natural cubic with explicit visibility/size constraints',materialConservation:false,lines:lines.map(l=>l.text),modes:{},sources:{}};
for(const [name,groups]of Object.entries(modes)){
 const values=arrays[index++],width=groups.length*4;
 if(values.length!==frames*width||!values.every(Number.isFinite))throw Error('Invalid native frames');
 for(let g=0;g<groups.length;g++){
  if(values[g*4+2]!==0||values[g*4+3]!==0)throw Error('First frame must be absent');
  const last=(frames-1)*width+g*4;
  if(values[last]!==0||values[last+1]!==0||values[last+2]!==1||values[last+3]!==1)throw Error('Final frame must match original layout');
 }
 fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify({name,frames,fps,groups,glyphs,values}));
 proof.modes[name]={groups:groups.length,firstFrameEmpty:true,lastFrameIdentity:true,bytes:fs.statSync(path.join(output,name+'.json')).size};
}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function collect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())collect(file);else proof.sources[path.relative(project,file)]=sha(file);}}
collect(project);proof.drawShaderSHA256=sha(path.join(root,'public/previews/gpu-math-typing/draw.wgsl'));
fs.writeFileSync(path.join(output,'provenance.json'),JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify({output,modes:proof.modes,frames,fps}));
