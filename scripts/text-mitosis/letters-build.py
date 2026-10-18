from pathlib import Path
import json,shutil,subprocess,gzip,hashlib
import numpy as np
from scipy.ndimage import map_coordinates,distance_transform_edt
root=Path('/tmp/vkf-mitosis-check-20261018');lib=Path('/home/viktor/Projects/Vektor Flow/.worktrees/morphology-review-20261015-libraries');site=Path('/home/viktor/Projects/Vektor Flow/.worktrees/text-unfold-site-20261018/public/previews/gpu-math-typing')
layout=json.loads((root/'layout.json').read_text());packets=layout['packets'];aw,ah=layout['atlasSize'];atlas=np.frombuffer(gzip.decompress((site/'atlas.rgba.gz').read_bytes()),np.uint8).reshape(ah,aw,4)[:,:,3]
size=129
# A literal two-glyph input: one parent, then that same parent plus its child.
# Endpoint glyphs come from the existing LaTeX engine, not substitute fonts.
assert len(packets)==2
rect=np.array([p[:4] for p in packets]);lo=rect[:,:2].min(0);hi=(rect[:,:2]+rect[:,2:]).max(0)
fit=2.8/(hi-lo).max();offset=-(lo+hi)/2
fields=[];centers=[];extents=[]
for packet in [packets[0],packets[0],packets[1]]:
    x,y,w,h,u0,v0,u1,v1=packet[:8]
    center=(np.array([x+w/2,y+h/2])+offset)*fit
    extent=np.array([w/2,h/2])*fit*1.2
    gx=np.linspace(-1,1,size);xx,yy=np.meshgrid(center[0]+gx*extent[0],center[1]+gx*extent[1])
    px=xx/fit-offset[0];py=yy/fit-offset[1]
    uu=u0+(px-x)/w*(u1-u0);vv=v0+(py-y)/h*(v1-v0)
    samples=map_coordinates(atlas.astype(float),[vv*ah-.5,uu*aw-.5],order=1,mode='constant',cval=0)
    inside=(samples>=128)&(px>=x)&(px<=x+w)&(py>=y)&(py<=y+h)
    spacing=2*extent/(size-1)
    distance=distance_transform_edt(inside,sampling=spacing[::-1])-distance_transform_edt(~inside,sampling=spacing[::-1])
    texel=(w*fit)/((u1-u0)*aw)
    exact=(samples/255-.5)*layout['range']*texel
    near=(samples>3)&(samples<252)&(px>=x)&(px<=x+w)&(py>=y)&(py<=y+h)
    field=np.where(near,exact,distance)/extent.min()
    assert np.any(field>0) and np.all(field[[0,-1],:]<0) and np.all(field[:,[0,-1]]<0)
    fields.extend(field.ravel().tolist());centers.extend(center);extents.extend(extent)
def vec(xs):return '['+','.join(format(float(x),'.15f') for x in xs)+']'
project=root/'source';project.mkdir(exist_ok=True);shutil.copytree(lib/'morphing',project/'morphing',dirs_exist_ok=True)
source='''b:.morphing.biological
s:.morphing.state
Curve:(knots:[num],values:[num],second:[num],count:int,width:int,mode:int)
Plan:(curve:Curve,dimension:int,size:int,cells:int,carriers:int,stride:int,smooth_start:bit,smooth_end:bit,join:num)
Scene:(plan:Plan,measure:Curve,resolution:int)
make_example(dimension:int,mode:int,smooth_start:bit,smooth_end:bit,example:int)->Plan:
'''
source+=f'    fields:{vec(fields)}\n    centers:{vec(centers)}\n    extents:{vec(extents)}\n    @:b.prepare([0,1],[0,1,3],[0,0,0,1],2,centers,extents,fields,{size},2,mode,smooth_start,smooth_end,0.12)\n'
controls=(lib/'tests/morphing/gpu-controls.vkf').read_text().replace('[1,1,1]','[1,1]')
source+=controls;(project/'scene.vkf').write_text(source)
package=root/'package';package.mkdir(exist_ok=True)
def run(args,name):
    result=subprocess.run(list(map(str,args)),capture_output=True,text=True,timeout=180);(root/(name+'.log')).write_text(result.stdout+result.stderr)
    if result.returncode:raise RuntimeError(name+': '+result.stderr[-3000:])
    return result.stdout
compiler=Path('/home/viktor/.local/bin/vkf-cuvami');emitter=Path('/tmp/vkf-shared-compiler-0135-04/native/bin/vkf_symbolic_kernel_artifact')
result=json.loads(run([compiler,'-b',project/'scene.vkf','-o',root/'scene','--diagnostics'],'native-build'))
run([emitter,'--typed-ir',result['typed_ir_path'],'--wasm',package/'scene.wasm','--manifest',package/'scene.json','--entry','gpu_entry','--prune-to-entry'],'wasm-build')
for name in ['vf-ui','playground']:
    shutil.copytree(site/'examples/live/compiled'/name,package/name,dirs_exist_ok=True)
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
proof={'solverChanged':False,'gpuShadersChanged':False,'text':layout['text'],'input':'Real LaTeX glyph coverage converted to anonymous distance fields; explicit one-to-two lineage','sourceLibraryCommit':'9bdee82','unchangedLibraryFiles':{str(p.relative_to(lib)):sha(p) for p in (lib/'morphing').glob('*.vkf')}}
(root/'provenance.json').write_text(json.dumps(proof,indent=2))
print('Built existing biological Morphing with supplied glyph inputs')
