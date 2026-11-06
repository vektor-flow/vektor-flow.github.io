"""Offline oracle only; never imported by Product/native client runtime.
Uses the unchanged accepted CPU research operators and exact fluid-only profile.
"""
import sys,json,hashlib
from pathlib import Path
import numpy as np
reference=Path(sys.argv[1] if len(sys.argv)>1 else '/home/viktor/Projects/Tesseracs/.worktrees/platonic-phone-web-20261104/research/physical-smoke')
sys.path.insert(0,str(reference))
from ns_reference import Config,Smoke,project,divergence,momentum_advection,viscous_force,scalar_rhs

def flat(a):return a.transpose(2,1,0).ravel().tolist()
def velocity(a):return sum([flat(a[i]) for i in range(3)],[])
def case(shape):
    cfg=Config(shape=tuple(shape),nu=.0004,cs=0,diffusivity=0,buoyancy=0,loading=0,cooling=0,collector_flux=0)
    fluid=Smoke(cfg);X=fluid.centres;L=np.array(cfg.lengths);rng=np.random.default_rng(881);faces=fluid.face_coordinates()
    # Exact accepted make_visual_proof.py --fluid-only initial mode construction.
    for mode in range(10):
        wave=rng.integers(-2,3,size=3);wave[2]=rng.integers(-1,2)
        if not wave.any():wave[0]=1
        kphys=2*np.pi*wave/L;amplitude=rng.normal(size=3);amplitude-=kphys*np.dot(amplitude,kphys)/np.dot(kphys,kphys);phase=rng.uniform(0,2*np.pi)
        for j in range(3):fluid.u[j]+=amplitude[j]*np.cos(sum(kphys[d]*faces[j][d] for d in range(3))+phase)
    fluid.u,fluid.pressure=project(fluid.u,fluid.h,cfg.max_dt);fluid.u*=.055/np.sqrt(np.mean(np.sum(fluid.u**2,axis=0)))
    for k,centre in enumerate([[.28,.28,.5],[.54,.50,.5],[.28,.72,.5]]):
        mask=np.ones(fluid.shape,dtype=bool)
        for j in range(3):mask &= abs(X[j]-centre[j]*L[j])<([.075,.075,.16][j]*L[j])
        if not mask.any(): # Small operator test: positive periodic scalar, not the visual baseline.
            fluid.c[k]=.001/(np.prod(L))*(1+.1*np.cos(2*np.pi*X[0]/L[0]))
        else:fluid.c[k]=mask*.001/(mask.sum()*fluid.dv)
    nu=np.full(fluid.shape,cfg.nu);adv=momentum_advection(fluid.u,fluid.h);visc=viscous_force(fluid.u,fluid.h,nu);scalar=scalar_rhs(fluid.c[0],fluid.u,fluid.h,np.zeros(fluid.shape))
    channels=[divergence(fluid.u,fluid.h),*adv,*visc,scalar]
    expected=np.stack(channels,axis=-1).transpose(2,1,0,3).reshape(-1,8).tolist()
    # Independent pressure test: add a known gradient to the accepted initial u.
    potential=.03*np.sin(2*np.pi*X[0]/L[0])*np.cos(2*np.pi*X[1]/L[1])
    dirty=fluid.u+np.array([(potential-np.roll(potential,1,axis=i))/fluid.h[i] for i in range(3)])
    corrected,pressure=project(dirty,fluid.h,1)
    operator_input=velocity(fluid.u)+flat(fluid.c[0])
    initial_velocity=velocity(fluid.u);initial_temperature=flat(fluid.temperature);initial_species=[flat(fluid.c[k]) for k in range(3)]
    initial_state=velocity(fluid.u)+flat(fluid.temperature)+sum([flat(fluid.c[k]) for k in range(3)],[])
    checkpoints=[]
    for tick in range(1,19):
        fluid.step(cfg.max_dt)
        if tick in [1,6,18]:checkpoints.append({'tick':tick,'time':fluid.time,'state':velocity(fluid.u)+flat(fluid.temperature)+sum([flat(fluid.c[k]) for k in range(3)],[]),'pressure':flat(fluid.pressure),'divergence':float(np.max(np.abs(divergence(fluid.u,fluid.h))))})
    # Operator and projection fixtures above retain their original initial states.
    return {'initialState':initial_state,'checkpoints':checkpoints,'shape':list(shape),'lengths':list(cfg.lengths),'params':[*shape,*fluid.h.tolist(),cfg.nu,1,0,0,0,cfg.max_dt,cfg.cfl,0,0,0],
      'baseline':'exact accepted fluid-only initial u withRMS.055; smallgridscalarfallbackdeclared' if tuple(shape)!=(24,16,8) else 'exact accepted24x16x8 fluid-only initialcondition/profile',
      'operatorInput':operator_input,'operatorExpected':expected,'projectionInput':velocity(dirty),
      'projectionExpected':velocity(corrected),'pressureExpected':flat(pressure),'initialVelocity':initial_velocity,
      'initialTemperature':initial_temperature,'initialSpecies':initial_species,
      'referenceDivergence':float(np.max(np.abs(divergence(corrected,fluid.h))))}
provenance={n:hashlib.sha256((reference/n).read_bytes()).hexdigest() for n in ['ns_reference.py','parcels.py','make_visual_proof.py','PHYSICS.txt','receiver_reference.py']}
value={'schema':'native-fluid-operator-reference/1','runtime':'OFFLINE CPU reference only; no Python Product solver','provenance':provenance,'cases':[case((8,6,4)),case((24,16,8))]}
Path(__file__).with_name('reference.json').write_text(json.dumps(value,separators=(',',':'))+'\n');print(json.dumps({'passed':True,'cases':[c['shape'] for c in value['cases']],'provenance':provenance}))
