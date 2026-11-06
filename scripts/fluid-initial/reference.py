"""Independent accepted CPU oracle only; no Product/runtime Python dependency."""
import sys,json,hashlib
from pathlib import Path
import numpy as np
reference=Path(sys.argv[1] if len(sys.argv)>1 else '/home/viktor/Projects/Tesseracs/.worktrees/platonic-phone-web-20261104/research/physical-smoke');sys.path.insert(0,str(reference))
from ns_reference import Smoke,Config,project,divergence
flat=lambda a:np.asarray(a).flatten(order='F').tolist()
fields=lambda a:sum([flat(u) for u in a],[])
cases=[]
for shape in [(8,6,4),(24,16,8)]:
 cfg=Config(shape=shape,nu=.0004,cs=0,diffusivity=0,buoyancy=0,loading=0,cooling=0,collector_flux=0);s=Smoke(cfg);L=np.array(cfg.lengths);rng=np.random.default_rng(881);faces=s.face_coordinates()
 for mode in range(10):
  wave=rng.integers(-2,3,size=3);wave[2]=rng.integers(-1,2)
  if not wave.any():wave[0]=1
  kphys=2*np.pi*wave/L;amplitude=rng.normal(size=3);amplitude-=kphys*np.dot(amplitude,kphys)/np.dot(kphys,kphys);phase=rng.uniform(0,2*np.pi)
  for j in range(3):s.u[j]+=amplitude[j]*np.cos(sum(kphys[d]*faces[j][d] for d in range(3))+phase)
 raw=s.u.copy();s.u,s.pressure=project(s.u,s.h,cfg.max_dt);projected=s.u.copy();scale=.055/np.sqrt(np.mean(np.sum(s.u**2,axis=0)));s.u*=scale
 cases.append(dict(shape=shape,rawVelocity=fields(raw),projectedVelocity=fields(projected),pressure2N=sum([[x,0] for x in flat(s.pressure)],[]),expectedState7N=fields(s.u)+[0.]*(4*np.prod(shape)),scale=float(scale),rms=float(np.sqrt(np.mean(np.sum(s.u**2,axis=0)))),divergence=float(np.abs(divergence(s.u,s.h)).max())))
result=dict(schema='accepted-fluid-initial-reference/1',seed=881,targetRms=.055,referenceSha256={n:hashlib.sha256((reference/n).read_bytes()).hexdigest() for n in ['make_visual_proof.py','ns_reference.py']},numpyVersion=np.__version__,cases=cases)
output=Path(__file__).resolve().parents[2]/'tests/fluid-initial/reference.json';output.write_text(json.dumps(result,separators=(',',':'))+'\n');print(output)
