"""Regenerate the frozen shared-kernel oracle from actual native VKF execution."""
from pathlib import Path
import random,json,subprocess,tempfile,shutil,argparse
p=argparse.ArgumentParser();p.add_argument('--compiler',default='/home/viktor/.local/bin/vkf-cuvami');p.add_argument('--write',action='store_true');a=p.parse_args()
root=Path(__file__).resolve().parents[2];rng=random.Random(794)
samples=[[rng.random(),rng.uniform(-2,2),rng.uniform(-2,2),rng.uniform(-2,2),rng.random()*.5] for _ in range(64)]
with tempfile.TemporaryDirectory(prefix='vkf-mitosis-oracle-') as temp:
 out=Path(temp);shutil.copytree(root/'scripts/text-wave/mitosis',out/'source',ignore=shutil.ignore_patterns('.vkfbuild'))
 source=out/'source/oracle.vkf';source.write_text('m:.split\n'+'\n'.join('::m.kernel(0,['+','.join(str(x) for x in row)+'],[0])' for row in samples)+'\n')
 subprocess.run([a.compiler,'-b',str(source),'-o',str(out/'oracle')],check=True,capture_output=True)
 values=[float(x) for x in subprocess.check_output([str(out/'oracle')],text=True).splitlines()]
 assert len(values)==65 and values[0]==1.5
 result={'samples':samples,'nativeValues':values[1:],'source':'actual compiled VKF split.kernel importing unchanged Morphing field.union and segment.value'}
 path=root/'tests/mitosis-oracle.json'
 if a.write:path.write_text(json.dumps(result,indent=2)+'\n')
 else:assert json.loads(path.read_text())==result
print('PASS 64 native VKF kernel reference values')
