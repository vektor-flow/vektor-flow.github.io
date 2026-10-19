"""Translate the scalar subset emitted by the VKF WGSL candidate to WebGL2.

No morphology is implemented here. Unsupported emitted syntax fails the build.
The VKF sources import unchanged segment.value and field.union library kernels.
"""
from pathlib import Path
import re,json,hashlib,argparse
p=argparse.ArgumentParser();p.add_argument('wgsl',type=Path);a=p.parse_args()
s=a.wgsl.read_text();start=s.index('fn vkf_powi');end=s.index('@compute');s=s[start:end]
s=s[:s.index('fn fn1')].replace('fn vkf_powi(x:f32,n:i32)->f32','float vkf_powi(float x,int n)').replace('var r=','float r=').replace('var i=','int i=')+s[s.index('fn fn1'):]
types={};out=[]
for line in s.splitlines():
 m=re.match(r'fn (fn\d+)\((.*?)\)->f32 \{',line)
 if m:
  params=[]
  for v,t in re.findall(r'(v\d+):(f32|i32)',m[2]):types[v]='float' if t=='f32' else 'int';params.append(types[v]+' '+v)
  line='float '+m[1]+'('+','.join(params)+') {'
 m=re.match(r'(?:let|var) (v\d+)(?:: (f32|i32))? = (.*);',line)
 if m:
  v,explicit,expr=m.groups()
  if explicit:t='float' if explicit=='f32' else 'int'
  elif re.search(r'\bf32\(|\bread_params\(|\bfn\d+\(|\bvkf_powi\(|\d+\.\d',expr):t='float'
  else:t='float' if any(types[x]=='float' for x in re.findall(r'\bv\d+\b',expr)) else 'int'
  types[v]=t;line=t+' '+v+' = '+expr+';'
 line=re.sub(r'\bf32\(', 'float(',line);line=re.sub(r'(\d)i\b',r'\1',line);line=re.sub(r'(\d(?:\.\d+)?(?:e[+-]?\d+)?)f\b',r'\1',line)
 if re.search(r'\b(fn|let|var|f32|i32)\b|->',line):raise ValueError('Unsupported emitted statement: '+line)
 out.append(line)
header='// Generated from VKF typed IR. Do not edit numerical functions.\nbool vkf_failed;\nfloat splitParams[5];\nfloat read_params(int i){return splitParams[i];}\n'
footer='\nfloat mitosisField(float q,float parent,float source,float target,float neck){splitParams[0]=q;splitParams[1]=parent;splitParams[2]=source;splitParams[3]=target;splitParams[4]=neck;vkf_failed=false;return fn0(0);}\n'
r=Path('public/previews/morphing-current');(r/'mitosis-kernel.glsl').write_text(header+'\n'.join(out)+footer)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
receipt={'source':'native Morphing segment.value and field.union, with a two-carrier LaTeX adapter','libraryCommit':'436b6eb','compilerOutputSha256':sha(a.wgsl),'glslSha256':sha(r/'mitosis-kernel.glsl'),'sources':{str(x):sha(x) for x in Path('scripts/text-wave/mitosis').glob('*.vkf')},'adapter':'mechanical scalar WGSL-to-GLSL translation; no hand-authored morphology'}
(r/'MITOSIS.json').write_text(json.dumps(receipt,indent=2)+'\n')
