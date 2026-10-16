"""Curate verified local previews for publication; never publish machine-local receipts."""
from pathlib import Path
import json,hashlib,subprocess,shutil,zipfile,argparse
p=argparse.ArgumentParser();p.add_argument('--artifacts',type=Path,required=True);p.add_argument('--native-source',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1]/'public/previews/gpu-math-typing/examples'
entries=[
('scans','Bunny → armadillo','3D','morphology-vkf-20261016/scanned-meshes/bunny-to-armadillo.mp4','Downloaded research scans rebuilt as shared-index triangle meshes. Grid resolution reduces fine detail; this is a field morph, not semantic feature matching.','Native VKF'),
('lava','Rounded two → five split','3D','morphology-vkf-20261016/lava-split/lava-split.mp4','Rounded separating necks with one spherical light and reflections. Final shapes include two tori and a tetrahedron. Volume preservation remains unfinished.','Native VKF'),
('spherical','Two → five · earlier split','3D','morphology-vkf-20261016/two-to-five-spherical/two-to-five-spherical-light.mp4','Earlier version for comparison: sharper split borders, spherical lighting and floor reflections.','Native VKF'),
('three-states','Three-state cubic morph','3D','morphology-vkf-20261016/three-states-3d/three-states-3d.mp4','Sphere → rounded cube → ellipsoid, using cubic state interpolation with smooth start and end.','Native VKF'),
('cat-walk','Walking cat · 48 fps','Images','morphology-vkf-20261016/native-video/cat-walking-native-vkf-48fps.mp4','Every second source frame retained; native VKF generates the intermediate frames. Fast-motion ghosting remains.','Native VKF'),
('cat-comparison','Walking cat · comparison','Images','morphology-cat-video-20261016/reconstruction-48fps/comparison-48fps.mp4','Original 24 fps, retained 12 fps, and reconstructed 48 fps. New timestamps are inferred, not recovered ground truth.','Python reference'),
('small-motion','Cat · small internal motion','Images','morphology-photo-motion-20261016/small-motion/cat-small-motion.mp4','Known small synthetic motion tests whether local image structure follows the deformation.','Python reference'),
('cat-dog','Cat → dog','Images','morphology-cat-dog-20261016/mesh/cat-to-dog.mp4','A connected texture mesh transforms one photo into another. Eye and muzzle correspondence remains imperfect.','Python reference'),
('rotation','Rotation and photo morph','Images','morphology-photo-motion-20261016/rotation-morph/cat-dog-rotation.mp4','The photo morph combines with a prescribed 25° rotation. Semantic correspondence limitations remain.','Python reference'),
('area','Area and thin geometry','Geometry','morphology-thickness-20261015/area-comparison.mp4','Comparison from the thin-stroke and cavity-timing review. This is recorded benchmark evidence.','CPU reference'),
('replicas','Morphology regression review','Geometry','morphology-replica-20261015/morphology-fixed-v3.mp4','Review of the corrected morphology corpus, including changing object counts and routing.','CPU reference'),
('branches','Branching objects','Geometry','morphology-branching-20261015/morphology-branching-review-v3.mp4','Branching and changing-cohort motion from the earlier geometry experiments.','CPU reference'),
('before-after','Geometry · before and after','Geometry','morphology-review-20261015/morphology-before-after.mp4','Earlier before/after comparison of shape transport and hole handling.','CPU reference')]
records=[]
for ident,title,category,relative,description,backend in entries:
 source=a.artifacts/relative;target=root/'media'/f'{ident}.mp4';shutil.copy2(source,target)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate:format=duration','-of','json',str(target)]))
 duration=float(info['format']['duration']);stream=info['streams'][0]
 poster=root/'media'/f'{ident}.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(min(duration*.25,2)),'-i',str(target),'-frames:v','1','-vf','scale=480:-2','-q:v','4',str(poster)],check=True)
 records.append(dict(id=ident,title=title,category=category,description=description,backend=backend,video=f'media/{ident}.mp4',poster=f'media/{ident}.jpg',duration=duration,width=stream['width'],height=stream['height'],fps=stream['avg_frame_rate'],bytes=target.stat().st_size,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),downloads=[]))
source_note='Stanford University Computer Graphics Laboratory. Research and free redistribution with attribution; commercial use requires permission. https://graphics.stanford.edu/data/3Dscanrep/'
scan=a.artifacts/'morphology-vkf-20261016/scanned-meshes'
with zipfile.ZipFile(root/'downloads/indexed-scan-meshes.zip','w',zipfile.ZIP_DEFLATED) as z:
 for file in sorted((scan/'indexed-meshes').glob('*.obj')):z.write(file,file.name)
 z.writestr('README.txt',source_note+'\nNative VKF remeshed bunny, midpoint and armadillo; these are reduced-detail reconstructions.\n')
with zipfile.ZipFile(root/'downloads/original-scans.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['bunny','armadillo']:z.write(scan/'models'/f'{name}.ply',f'{name}.ply')
 z.writestr('README.txt',source_note+'\nOriginal downloaded scan meshes, unchanged.\n')
with zipfile.ZipFile(root/'downloads/native-vkf-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for file in sorted(a.native_source.glob('*.vkf')):z.write(file,file.name)
 z.write(a.native_source/'THIRD_PARTY.txt','THIRD_PARTY.txt')
 z.write(a.native_source.parents[2]/'LICENSE','LICENSE')
 z.writestr('README.txt','Experimental CPU-native VKF morphology sources. Qualified with native compiler 0.7.2. Includes image flow/mesh, state interpolation, solid primitives and indexed scan mesh extraction.\n')
for r in records:
 if r['backend']=='Native VKF':r['downloads'].append(dict(label='VKF source',url='downloads/native-vkf-source.zip'))
 if r['id']=='scans':r['downloads'][:0]=[dict(label='Indexed OBJ meshes',url='downloads/indexed-scan-meshes.zip'),dict(label='Original PLY scans',url='downloads/original-scans.zip')]
 if r['category']=='Images':r['credits']='Cat photo: Anton Petrov; dog photo: Karen Arnold; walking-cat video: Dzkouslavia. CC0.'
 if r['id']=='scans':r['credits']=source_note
(root/'catalog.json').write_text(json.dumps(records,indent=2)+'\n')
print(f'{len(records)} examples, {sum(r["bytes"] for r in records)/1048576:.1f} MiB video')
