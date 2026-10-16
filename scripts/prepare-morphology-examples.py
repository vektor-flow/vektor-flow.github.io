"""Curate verified local previews for publication; never publish machine-local receipts."""
from pathlib import Path
import json,hashlib,subprocess,shutil,zipfile,argparse
p=argparse.ArgumentParser();p.add_argument('--artifacts',type=Path,required=True);p.add_argument('--native-source',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1]/'public/previews/gpu-math-typing/examples'
entries=[
('material-split','One form → two → one','Images','morphology-object-images-20261016/video/material-split-merge.mp4','Controlled split/merge test: fixed texture material moves and deforms without recoloring. This uses a prescribed map, not automatically inferred photo correspondence.','CPU research prototype'),
('cat-dog','Cat → dog · material experiment','Images','morphology-object-images-20261016/video/cat-dog-material-review.mp4','Work in progress: automatic object detection and semantic feature matching guide a fixed-mass material transport. RGB changes along material paths. Correspondence remains imperfect; automatic object split/merge is not yet established.','CPU research prototype'),
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
 automatic_cat_dog=json.loads((experiment/'video/report.json').read_text()),
 controlled_split=json.loads((experiment/'video/split-report.json').read_text()),
 perception=json.loads((experiment/'perception.json').read_text()))
(root/'downloads/material-experiments.json').write_text(json.dumps(quality,indent=2)+'\n')
stale_report=root/'downloads/image-benchmark.json'
if stale_report.exists():stale_report.unlink()
with zipfile.ZipFile(root/'downloads/material-image-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['material_morph.py','object_morph.py','prepare_object_features.py','photo_mesh.py','photo_transport.py','image_transport.py','pixel_transport.py','render_material_review.py','render_material_split.py','test_material_morph.py']:
  z.write(a.native_source.parent/name,name)
 z.write(a.native_source.parents[2]/'LICENSE','LICENSE')
 z.write(a.native_source/'THIRD_PARTY.txt','THIRD_PARTY.txt')
 z.writestr('README.txt','Experimental CPU image material transport. Object perception uses torchvision Mask R-CNN COCO_V1 and Meta DINOv2 ViT-S/14 on CPU; model weights are not bundled. DINOv2: https://github.com/facebookresearch/dinov2 (Apache-2.0 for standard DINOv2). Torchvision: https://github.com/pytorch/vision (BSD-3-Clause). Cat/dog automatic correspondence remains imperfect. The split/merge movie is a prescribed-map mechanism test, not an inferred photo pair. Native VKF material rendering is still under qualification.\n')
for r in records:
 if r['category']=='Images':
  r['algorithm']='material-v3-experimental'
  r['downloads'].extend([dict(label='Experiment notes',url='downloads/material-experiments.json'),dict(label='Image source',url='downloads/material-image-source.zip')])
 if r['backend']=='Native VKF':r['downloads'].append(dict(label='VKF source',url='downloads/native-vkf-source.zip'))
 if r['id']=='scans':r['downloads'][:0]=[dict(label='Indexed OBJ meshes',url='downloads/indexed-scan-meshes.zip'),dict(label='Original PLY scans',url='downloads/original-scans.zip')]
 if r['category']=='Images':r['credits']='Cat photo: Anton Petrov (CC0).'+(' Dog photo: Karen Arnold (CC0).' if r['id']=='cat-dog' else '')
 if r['id']=='scans':r['credits']=source_note
(root/'catalog.json').write_text(json.dumps(records,indent=2)+'\n')
print(f'{len(records)} examples, {sum(r["bytes"] for r in records)/1048576:.1f} MiB video')
