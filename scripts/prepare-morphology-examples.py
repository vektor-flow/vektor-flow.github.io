"""Curate verified local previews for publication; never publish machine-local receipts."""
from pathlib import Path
import json,hashlib,subprocess,shutil,zipfile,argparse
p=argparse.ArgumentParser();p.add_argument('--artifacts',type=Path,required=True);p.add_argument('--native-source',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1]/'public/previews/gpu-math-typing/examples'
entries=[
('material-split','Two image states · inferred split / merge','Images','morphology-object-images-20261016/video/material-split-merge.mp4','Revision r4: correspondence computed from two independently supplied masked images. Both endpoints stay visible. No angular wrapping or whole-image crossfade. Local RGB changes along moving paths; visible area preservation remains unfinished.','CPU research prototype'),
('scans','Bunny → armadillo','3D','morphology-vkf-20261016/scanned-meshes/bunny-to-armadillo.mp4','Current indexed scan morph. Grid resolution reduces fine detail; this is a field morph, not semantic feature matching.','Native VKF'),
('lava','Rounded two → five split','3D','morphology-vkf-20261016/lava-split/lava-split.mp4','Current rounded separating necks with one spherical light and reflections. Volume preservation remains unfinished.','Native VKF'),
('three-states','Three-state cubic morph','3D','morphology-vkf-20261016/three-states-3d/three-states-3d.mp4','Current sphere → rounded cube → ellipsoid using cubic state interpolation with smooth start and end.','Native VKF')]
# Check inputs before changing the current publication.
for _,_,_,relative,_,_ in entries:
 if not (a.artifacts/relative).is_file(): raise FileNotFoundError(relative)
for relative in ['video/report.json','video/split-report.json']:
 if not (a.artifacts/'morphology-object-images-20261016'/relative).is_file(): raise FileNotFoundError(relative)
# Publication contains only current selected examples; stale media must disappear.
keep={ident+suffix for ident,*_ in entries for suffix in ['.mp4','.jpg']}
for stale in (root/'media').iterdir():
 if stale.name not in keep: stale.unlink()

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
 for file in sorted(a.native_source.glob('*.vkf')):
  if file.name not in ['material.vkf','material_cli.vkf']:z.write(file,file.name)
 z.write(a.native_source/'THIRD_PARTY.txt','THIRD_PARTY.txt')
 z.write(a.native_source.parents[2]/'LICENSE','LICENSE')
 z.writestr('README.txt','Experimental CPU-native VKF morphology sources. Qualified with native compiler 0.7.2. Image modules are previous qualified numerical references. The current material-image experiments use the separate Python source download; their experimental native port is not included here. Includes state interpolation, solid primitives and indexed scan mesh extraction.\n')
experiment=a.artifacts/'morphology-object-images-20261016'
quality=dict(status='Research review, not a completed general split/merge solver',
 controlled_split=json.loads((experiment/'video/split-report.json').read_text()),
 perception=json.loads((experiment/'perception.json').read_text()))
(root/'downloads/material-experiments.json').write_text(json.dumps(quality,indent=2)+'\n')
stale_report=root/'downloads/image-benchmark.json'
if stale_report.exists():stale_report.unlink()
with zipfile.ZipFile(root/'downloads/material-image-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['material_morph.py','object_morph.py','prepare_object_features.py','photo_mesh.py','photo_transport.py','image_transport.py','pixel_transport.py','render_material_review.py','render_material_split.py','test_material_morph.py','endpoint_transport.py','make_endpoint_fixture.py','test_endpoint_transport.py']:
  z.write(a.native_source.parent/name,name)
 z.write(a.native_source.parents[2]/'LICENSE','LICENSE')
 z.write(a.native_source/'THIRD_PARTY.txt','THIRD_PARTY.txt')
 z.writestr('README.txt','Experimental CPU image material transport. Object perception uses torchvision Mask R-CNN COCO_V1 and Meta DINOv2 ViT-S/14 on CPU; model weights are not bundled. DINOv2: https://github.com/facebookresearch/dinov2 (Apache-2.0 for standard DINOv2). Torchvision: https://github.com/pytorch/vision (BSD-3-Clause). Cat/dog automatic correspondence remains imperfect. The split/merge movie uses global balanced assignment between two supplied RGBA images. Masks are supplied; automatic photo segmentation and constant visible area are not established. Native VKF material rendering is still under qualification.\n')
for r in records:
 if r['category']=='Images':
  r['algorithm']='endpoint-r4-experimental'
  r['downloads'].extend([dict(label='Experiment notes',url='downloads/material-experiments.json'),dict(label='Image source',url='downloads/material-image-source.zip')])
 if r['backend']=='Native VKF':r['downloads'].append(dict(label='VKF source',url='downloads/native-vkf-source.zip'))
 if r['id']=='scans':r['downloads'][:0]=[dict(label='Indexed OBJ meshes',url='downloads/indexed-scan-meshes.zip'),dict(label='Original PLY scans',url='downloads/original-scans.zip')]
 if r['category']=='Images':r['credits']='Procedural Cartesian-band endpoint fixtures; supplied masks, inferred correspondence.'
 if r['id']=='scans':r['credits']=source_note
for name in ['source','target']:
 shutil.copy2(experiment/'endpoints'/f'{name}.png',root/'downloads'/f'endpoint-{name}.png')
records[0]['downloads'].extend([dict(label='Source state PNG',url='downloads/endpoint-source.png'),dict(label='Target state PNG',url='downloads/endpoint-target.png')])
for record in records:
 for key in ['video','poster']:
  path=root/record[key];record[key]+='?v='+hashlib.sha256(path.read_bytes()).hexdigest()[:12]
 for download in record['downloads']:
  path=root/download['url'];download['url']+='?v='+hashlib.sha256(path.read_bytes()).hexdigest()[:12]
(root/'catalog.json').write_text(json.dumps(records,indent=2)+'\n')
print(f'{len(records)} examples, {sum(r["bytes"] for r in records)/1048576:.1f} MiB video')
