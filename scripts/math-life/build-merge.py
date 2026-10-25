"""Build the shared native Morphing signed-field merge and its numeric oracle."""
from pathlib import Path
import argparse,hashlib,json,random,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('--library',type=Path,required=True);p.add_argument('--compiler',type=Path,required=True);p.add_argument('--gpu-compiler',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--oracle-output',type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[2];out=a.output.resolve();out.mkdir(parents=True,exist_ok=False)
shutil.copytree(a.library/'morphing',out/'morphing');source=out/'merge.vkf';shutil.copy2(root/'public/previews/math-life/merge.vkf',source)
def run(args):
 r=subprocess.run([str(x) for x in args],capture_output=True,text=True);assert r.returncode==0,r.stderr;return r.stdout
info=json.loads(run([a.compiler,'-b',source,'-o',out/'native','--diagnostics']));run([a.gpu_compiler,'--source',source,'--typed-ir',info['typed_ir_path'],'--emit-wgsl-real-f32-field',out/'merge.wgsl','--wgsl-field-entry','kernel','--wgsl-field-count','0','--wgsl-field-output-width','1'])
rng=random.Random(401);samples=[[rng.random(),rng.uniform(-4,4),rng.uniform(-4,4),rng.uniform(-4,4),rng.random()*2] for _ in range(64)];oracle=out/'oracle.vkf';oracle.write_text('m:.merge\n'+'\n'.join('::m.kernel(0,['+','.join(format(x,'.17f') for x in row)+'],[0])' for row in samples)+'\n');run([a.compiler,'-b',oracle,'-o',out/'oracle']);values=list(map(float,run([out/'oracle']).splitlines()))[1:];assert len(values)==64
for value,(q,left,right,target,neck) in zip(values,samples):
 radius=neck*4*q*(1-q);h=max(radius-abs(left-right),0)/radius;expected=(1-q)*(max(left,right)+radius*h*h/4)+q*target;assert abs(value-expected)<1e-12
if a.oracle_output:a.oracle_output.write_text(json.dumps({'samples':samples,'nativeValues':values,'source':'actual native Morphing field.union and segment.value'},indent=2)+'\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();report={'sourceSha256':sha(source),'librarySources':{n:sha(a.library/n) for n in ['morphing/field.vkf','morphing/segment.vkf']},'compilerSha256':sha(a.compiler),'gpuCompilerSha256':sha(a.gpu_compiler),'wgslSha256':sha(out/'merge.wgsl'),'nativeOracleSamples':64,'independentOraclePassed':True};(out/'SOURCE.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
