from pathlib import Path
import sys,json,hashlib
import numpy as np
research=Path(sys.argv[1] if len(sys.argv)>1 else '/home/viktor/Projects/Tesseracs/.worktrees/platonic-phone-web-20261104/research/physical-smoke');sys.path.insert(0,str(research));from fine_receiver_reference import capture_segments
out=Path(__file__).resolve().parents[2]/'tests/fine-receiver';out.mkdir(parents=True,exist_ok=True);cases=[];binary=bytearray();rng=np.random.default_rng(713)
def add(name,alpha,packets,lengths=(1,1,1),rate=20,front=None,limit=128):
 alpha=np.asarray(alpha,dtype=np.float32);packets=np.asarray(packets,dtype=np.float32).reshape(-1,20);n=len(packets);h,w=alpha.shape
 p=np.asarray([w,h,*lengths,rate,front is not None,*(front or(0,0,.1)),20*n,limit,n],dtype=np.float32)
 values=np.concatenate([packets.ravel(),alpha.ravel()]);expected=[]
 for row in packets.astype(float):
  result=np.concatenate([row,np.array([0,-1,-1,-1,0.])])
  if row[16]!=0:
   hit=capture_segments(alpha,row[None,:3],row[None,3:6],[row[15]-row[14]],float(p[5]),row[19],p[2:5].astype(float),max_segments=limit,front=p[7:10].astype(float)if p[6]else None)
   result[3:6]=hit['positions'][0];result[14]+=hit['exposure'][0];result[24]=hit['exposure'][0]
   if hit['captured'][0]:result[14]=row[15];result[16]=0;result[20]=1;result[21]=hit['fractions'][0];result[22]=hit['pixels'][0,1];result[23]=hit['pixels'][0,0]
  expected.extend(result.tolist())
 offset=len(binary);binary.extend(values.astype('<f4').tobytes());cases.append({'name':name,'params':p.tolist(),'count':n,'valuesOffsetBytes':offset,'valuesBytes':values.nbytes,'expected':expected})
def row(start=(0,.5,.2),end=(1,.5,.2),threshold=.25,alive=1,exposure=0,dt=1):return[*start,*end,1,0,0,2,.4,.2,.3,1,exposure,threshold,alive,2,37,dt]
a=np.zeros((10,40));a[:,3]=1
add('thin-stroke',a,[row()]);add('outside-stroke',a,[row(start=(.025,.5,.2),end=(.025,.5,.2),threshold=.01)],rate=100)
add('negative-direction',a,[row(start=(.2,.5,.2),end=(0,.5,.2))]);a=np.zeros((10,40));a[:,1]=1
add('periodic',a,[row(start=(.9,.5,.2),end=(1.2,.5,.2))]);add('moving-front',np.ones((10,40)),[row(start=(.5,.5,.2),end=(.5,.5,.2),threshold=.5)],rate=9,front=(.05,.95,.1))
add('front-not-arrived',np.ones((10,40)),[row(start=(.7,.5,.2),end=(.7,.5,.2),threshold=.01)],rate=100,front=(0,.2,.05))
add('front-periodic',np.ones((10,40)),[row(start=(.9,.5,.2),end=(1.2,.5,.2),threshold=.3)],front=(.03,.13,.08))
add('retained-identity-no-recapture',np.ones((10,40)),[row(alive=0)]);add('zero-hazard-still-advects',np.ones((10,40)),[row()],rate=0);add('zero-dt',np.ones((10,40)),[row(start=(.1,.5,.2),end=(.1,.5,.2),dt=0)])
mask=rng.integers(0,256,size=(17,31))/255
batch=[row(start=tuple(rng.random(3)),end=tuple(rng.random(3)*1.4-.2),threshold=float(rng.exponential()),alive=0 if i%9==0 else 1,exposure=0)for i in range(64)]
for i,record in enumerate(batch):
 record[6:9]=rng.normal(size=3).tolist();record[9]=.2+(i%7)*.1;record[10:14]=rng.random(4).tolist();record[17]=i%3;record[18]=i+713
add('64-probe-colour-lineage-batch',mask,batch,rate=5,front=(.1,.9,.2))
meta=json.loads((research/'glyph-mask-reference.json').read_text());raw=(research/'glyph-mask-reference.bin').read_bytes();assert hashlib.sha256(raw).hexdigest()==meta['dataSha256']
for case in meta['cases']:
 m=next(m for m in case['masks']if m['kind']=='receiver');alpha=np.frombuffer(raw,dtype=np.uint8,count=m['bytes'],offset=m['offsetBytes']).reshape(meta['height'],meta['width']).astype(float)/255;h,w=alpha.shape;lengths=(w/h,1,.4);n=64
 # Start near actual glyph pixels to qualify fine footprint, not bulk-flow realism.
 ys,xs=np.nonzero(alpha);ids=rng.choice(len(xs),size=n);packets=[]
 for j in ids:
  start=((xs[j]+.5)*lengths[0]/w,(h-ys[j]-.5)/h,.2);end=(start[0]+.02,start[1]+.01,.2);packets.append(row(start,end,threshold=float(rng.exponential()*.03)))
 add('actual-view-'+str(case['view']),alpha,packets,lengths=lengths,rate=30)
 left,_,right,_=m['bounds'];add('actual-front-view-'+str(case['view']),alpha,packets,lengths=lengths,rate=30,front=(left*lengths[0]/w,right*lengths[0]/w,3*lengths[0]/w))
(out/'fixture.bin').write_bytes(binary);report={'schema':'native-fine-receiver-fixtures/1','cases':cases,'bytes':len(binary),'sha256':hashlib.sha256(binary).hexdigest(),'seed':713,'researchSourceSha256':hashlib.sha256((research/'fine_receiver_reference.py').read_bytes()).hexdigest(),'nativeMaskDataSha256':meta['dataSha256']};(out/'fixture.json').write_text(json.dumps(report,indent=2)+'\n');print('FIXTURES',len(cases),'probes',sum(c['count']for c in cases),'bytes',len(binary))
