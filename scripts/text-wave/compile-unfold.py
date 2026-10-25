"""Translate the scalar subset emitted by the VKF WGSL candidate to WebGL2.

No unfolding math is implemented here. Unsupported emitted syntax fails the build.
The VKF source is Morphing.unfold.
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
  for v,t in re.findall(r'(v\d+):(f32|i32|bool)',m[2]):types[v]={'f32':'float','i32':'int','bool':'bool'}[t];params.append(types[v]+' '+v)
  line='float '+m[1]+'('+','.join(params)+') {'
 m=re.match(r'(?:let|var) (v\d+)(?:: (f32|i32|bool))? = (.*);',line)
 if m:
  v,explicit,expr=m.groups()
  if explicit:t={'f32':'float','i32':'int','bool':'bool'}[explicit]
  elif re.search(r'[<>=!]=|[<>]|&&|\|\|',expr):t='bool'
  elif re.search(r'\bf32\(|\bread_params\(|\bfn\d+\(|\bvkf_powi\(|\d+\.\d',expr):t='float'
  else:t='float' if any(types[x]=='float' for x in re.findall(r'\bv\d+\b',expr)) else 'int'
  types[v]=t;line=t+' '+v+' = '+expr+';'
 line=re.sub(r'\bf32\(', 'float(',line);line=re.sub(r'(\d)i\b',r'\1',line);line=re.sub(r'(\d(?:\.\d+)?(?:e[+-]?\d+)?)f\b',r'\1',line)
 if re.search(r'\b(fn|let|var|f32|i32)\b|->',line):raise ValueError('Unsupported emitted statement: '+line)
 out.append(line)
header='// Generated from VKF typed IR. Do not edit numerical functions.\nbool vkf_failed;\nfloat unfoldParams[2];\nfloat read_params(int i){return unfoldParams[i];}\n'
footer='\nfloat unfoldAlpha(float distance,float k){unfoldParams[0]=distance;unfoldParams[1]=k;vkf_failed=false;return fn0(0); }\nfloat unfoldGrowth(float a,float coefficient){unfoldParams[0]=a;unfoldParams[1]=coefficient;vkf_failed=false;return fn0(1); }\nvec3 unfoldColor(float a){unfoldParams[0]=a;unfoldParams[1]=0.0;vkf_failed=false;return vec3(fn0(2),fn0(3),fn0(4));}\n'
r=Path('public/previews/morphing-current');(r/'unfold-kernel.glsl').write_text(header+'\n'.join(out)+footer)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(r/'unfold-kernel.wgsl').write_text(a.wgsl.read_text())
