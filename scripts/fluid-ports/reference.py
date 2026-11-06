"""Independent accepted CPU oracle; verification fixture only, never runtime."""
import sys,json,hashlib,importlib.util
from pathlib import Path
import numpy as np
source=Path(sys.argv[1] if len(sys.argv)>1 else '/home/viktor/Projects/Tesseracs/.worktrees/platonic-phone-web-20261104/research/physical-smoke/ns_reference.py')
spec=importlib.util.spec_from_file_location('accepted_ports_reference',source);r=importlib.util.module_from_spec(spec);sys.modules[spec.name]=r;spec.loader.exec_module(r)
def flat(x):return np.asarray(x).flatten(order='F').tolist()
def fields(*xs):return sum([flat(x) for x in xs],[])
cases=[]
for shape in [(8,6,4),(24,16,8)]:
 cfg=r.Config(shape=shape,nu=.0004,cs=0,diffusivity=0,thermal_diffusivity=0,buoyancy=0,loading=0,cooling=.25,collector_start=1.,collector_flux=.05)
 s=r.Smoke(cfg)
 x,y,z=np.meshgrid(*[np.arange(n)/n for n in shape],indexing='ij')
 raw=[1+.5*np.cos(2*np.pi*x)*np.cos(2*np.pi*y),1+.4*np.sin(2*np.pi*z),1+.3*np.sin(2*np.pi*x),1+.6*np.cos(2*np.pi*y)*np.cos(2*np.pi*z)]
 raw=[a.astype(np.float32).astype(float) for a in raw]
 old=s.normalised_ports(*raw[:2]);new=s.normalised_ports(*raw[2:]);s.collector_mask,s.supply_mask,s.port_lift,s.port_pressure=old;s.next_ports=new;s.mask_start=1.1;s.mask_duration=.8
 p=[*shape,*s.h,.0004,1,0,0,0,1/60,.3,0,0,0,.0002,0,0,0,0,.000001,.0001,0]
 unpack=lambda a:np.stack([np.asarray(v).flatten(order='F') for v in [a[0],a[1],*a[2],a[3]]],axis=1).ravel().tolist()
 boundaries=[]
 for t in [.9,1,1.0001,1.1,1.25,1.5,1.7,1.9,2,2.0001]:
  b=s.boundary(t);bsoa=np.array([b['sink'],b['source'],*b['lift'],b['pressureRate']]);packet=np.stack([np.asarray(a).flatten(order='F') for a in bsoa],axis=1).ravel().tolist()
  # independent accepted rhs difference isolates drag, including face averaging
  u=np.array([.03+.01*np.sin(2*np.pi*x),.02*np.cos(2*np.pi*y),.01*np.sin(2*np.pi*z)])
  T=.2+.03*x;c=np.array([.01+.002*y,.02+.001*z,.03+.002*x]);state=(u,T,c,np.zeros(3))
  rawrhs=s.rhs(state,np.zeros(shape));dragged=s.rhs(state,b['sink'])
  boundaries.append(dict(time=t,expected=packet,actual=fields(*u,T,*c),rawRhs=fields(*rawrhs[0],rawrhs[1],*rawrhs[2]),dragExpected=fields(*dragged[0],dragged[1],*dragged[2])))
 cases.append(dict(shape=shape,params=p,dv=s.dv,raw=fields(*raw[:2]),rawSums=[float(a.sum()) for a in raw[:2]],normalized=fields(*old[:2]),unitRhs=[v for a,b in zip(flat(old[0]),flat(old[1])) for v in [a-b,0]],old=unpack(old),next=unpack(new),unitLift=fields(*old[2]),unitPotential=flat(old[3]),boundaries=boundaries))
output=Path(__file__).resolve().parents[2]/'tests/fluid-ports/reference.json';output.write_text(json.dumps(dict(schema='accepted-fluid-ports-reference/1',source=str(source),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),cases=cases),separators=(',',':'))+'\n')
print(output)
