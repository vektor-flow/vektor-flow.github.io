"""Curate verified local previews for publication; never publish machine-local receipts."""
from pathlib import Path
import json,hashlib,subprocess,shutil,zipfile,argparse
p=argparse.ArgumentParser();p.add_argument('--artifacts',type=Path,required=True);p.add_argument('--native-source',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1]/'public/previews/gpu-math-typing/examples'
entries=[
('scans','Bunny → armadillo','3D','morphology-vkf-20261016/scanned-meshes/bunny-to-armadillo.mp4','Current indexed scan morph. Grid resolution reduces fine detail; this is a field morph, not semantic feature matching.','Native VKF'),
('lava','Rounded two → five split','3D','morphology-vkf-20261016/lava-split/lava-split.mp4','Current rounded separating necks with one spherical light and reflections. Volume preservation remains unfinished.','Native VKF'),
('three-states','Three-state cubic morph','3D','morphology-vkf-20261016/three-states-3d/three-states-3d.mp4','Current sphere → rounded cube → ellipsoid using cubic state interpolation with smooth start and end.','Native VKF')]
entries.sort(key=lambda entry: entry[0]!='lava')
# Check inputs before changing the current publication.
for _,_,_,relative,_,_ in entries:
 if not (a.artifacts/relative).is_file(): raise FileNotFoundError(relative)
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
  if file.name in ['state.vkf','numeric.vkf','geometry3d.vkf','solid3d.vkf','scan_mesh.vkf','lit_scene.vkf','lit_volume.vkf','protocol.vkf','state_cli.vkf','scan_cli.vkf','lit_cli.vkf']:z.write(file,file.name)
 z.write(a.native_source/'THIRD_PARTY.txt','THIRD_PARTY.txt')
 z.write(a.native_source.parents[2]/'LICENSE','LICENSE')
 z.writestr('README.txt','Experimental CPU-native VKF morphology sources. Qualified with native compiler 0.7.2. Includes state interpolation, solid primitives and indexed scan mesh extraction.\n')
for r in records:
 r['downloads'].append(dict(label='VKF source',url='downloads/native-vkf-source.zip'))
 if r['id']=='scans':
  r['downloads'][:0]=[dict(label='Indexed OBJ meshes',url='downloads/indexed-scan-meshes.zip'),dict(label='Original PLY scans',url='downloads/original-scans.zip')]
  r['credits']=source_note
 for key in ['video','poster']:
  file=root/r[key];r[key]+='?v='+hashlib.sha256(file.read_bytes()).hexdigest()[:12]
 for item in r['downloads']:
  item['url']+='?v='+hashlib.sha256((root/item['url']).read_bytes()).hexdigest()[:12]
(root/'catalog.json').write_text(json.dumps(records,indent=2)+'\n')
