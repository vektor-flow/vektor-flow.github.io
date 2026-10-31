"""Fail closed if a deployment resurrects obsolete compiler/site assets."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
from html.parser import HTMLParser
import json,hashlib,re
root=Path(__file__).resolve().parents[1]/'public'
for retired in ['previews/gpu-math-typing/examples/media/native-cell-division.mp4','previews/gpu-morph','previews/gpu-math-typing/motion','previews/gpu-math-typing/examples/downloads/math/quadratic-structure.mp4','previews/gpu-math-typing/examples/downloads/cat-dog-comparison.mp4','previews/gpu-math-typing/examples/media/cat-dog.mp4']:
 assert not (root/retired).exists(), 'Retired morphology must not be republished: '+retired
assert not (root/'previews/gpu-math-typing/examples/media/three-states.mp4').exists()
catalog=json.loads((root/'previews/gpu-math-typing/examples/catalog.json').read_text())
assert len(catalog)==1 and catalog[0]['id']=='current'
assert not (root/'previews/text-unfold').exists()
assert not (root/'previews/gpu-math-typing/examples/live/app.mjs').exists()
assert not (root/'previews/gpu-math-typing/examples/live/compiled').exists()
current=json.loads((root/'previews/morphing-current/SOURCE.json').read_text())
assert not any((root/'previews/morphing-current'/n).exists() for n in ['mitosis-renderer.mjs','mitosis-kernel.glsl','mitosis-kernel.wgsl','MITOSIS.json'])
assert (root/'previews/morphing-current/index.html').read_text().count('<section class="demo"')==1
assert current['entryPoint']=='wave-renderer.mjs:TextWave'
assert current['execution']=='real-time WebGL2' and current['videoPlayback'] is False
for name,digest in {**current['sourceFiles'],**current['latexEngineFiles']}.items():
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,name
assert not list((root/'previews/morphing-current').glob('*.mp4'))
assert not list((root/'previews/morphing-current').glob('*.webm'))
assert not (root/'previews/gpu-math-typing/examples/downloads/Morphing-source.zip').exists()

game=json.loads((root/'previews/math-life/SOURCE.json').read_text())
for name,digest in {**game['sourceFiles'],**game['dependencies']}.items():
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,name

release=json.loads((root/'current-compiler-release.json').read_text());assert release['release_version']=='0.7.2'
expected={'compiler.mjs':'42764129b194a05c08300cf0c464cab0e1e3bb449b8d297021fe164b828dc8b4','compiler.wasm':'2455d249026f0c9d1250920c52640a421e4d99746665ddbeb176102c2a1b07b5','compiler.data':'4eb831acbca4482cfce252d5a846c6de83bd322fd1c5b9b2a7206fbbff0ca995'}
for name,digest in expected.items():assert hashlib.sha256((root/'playground/canonical'/name).read_bytes()).hexdigest()==digest,name
preview=root/'preview/0.7.5'
if preview.exists():
 manifest=json.loads((preview/'preview-manifest.json').read_text())
 # Broad compiler/platform qualification stays false; only the named scope is stable.
 assert manifest['preview'] is True and manifest['stable'] is False
 current_release=json.loads((preview/'current-compiler-release.json').read_text())
 assert current_release['preview'] is True and current_release['complete'] is False
 assert all(current_release[k] is False for k in ['stable','stable_release','release_qualified'])
 # Both existing website consumers enable this status; package runtime bytes stay pinned.
 assert current_release['status']=='verified-examples'
 assert current_release['release_version']=='0.7.5'
 assert current_release['compiler_source_commit']=='ae0e200708a660b965a98e17e5ed8e1f2c5420a6'
 assert current_release['frontend_binding']=='4ea6273419611232ec481e6cc445faed2907d8538ca3ce4058e18aad79381fcf'
 assert current_release['formatter_binding']=='3a6a07dd411a94039577b4bc1dae08be6801b41c8fc272ec2252fdcded679e03'
 assert manifest['publication']==current_release['publication_status']=='PUBLISHED_SCOPED_STABLE_UI_PLOTTING_EMBEDDING'
 scope=current_release['scoped_release']
 assert scope['version']=='0.7.5' and scope['status']=='stable' and scope['stable'] is True
 assert scope['components']==['browser-WASM compiler and independent formatter','ordinary retained plotting','Node ESM compiler/guest/formatter embedding']
 assert all(scope[k] is False for k in ['linuxCompilerSDKQualified','crossTargetParityQualified','comparativeBenchmarksQualified','fullGpuWorldQualified'])
 assert scope['evidence']=='./verification/e1677-ordinary-ui-compiler-propagation.json'
 assert scope['additional_evidence']==['./verification/e1678-current-mutable5m-output.json']
 for name,digest in {
  'verification/e1677-ordinary-ui-compiler-propagation.json':'23e335aa91e9e3e94860d4b97d38c04262f2cae81058e2e6cd63f295d93f12b1',
  'verification/e1678-current-mutable5m-output.json':'2a13d8366f36d8a2c60d3db0b4eb21fb45b1a2bd0e974ca5c06ca66b94cf416c',
  'playground/canonical/formatter.mjs':'e5d971632b76c953149a6cd98688da1c5aa14f6b87825265d8fd6ff4a8e6d1b9',
  'playground/canonical/formatter.wasm':'14aa1029054807d073513ae98f0e7eef9fce0dbddacd9c0e232c6d6ce18edd39',
  'downloads/vkf-embedding-starter-0.7.5-candidate.tar.gz':'c67ad08e9f3a7840d33324f7ddddc523b35869d56e96678f267c1aa20e1500d6'
 }.items():assert hashlib.sha256((preview/name).read_bytes()).hexdigest()==digest,name
 assert {str(p.relative_to(preview)) for p in preview.rglob('*') if p.is_file()}=={r['path'] for r in manifest['files']}|{'preview-manifest.json'}
 for row in manifest['files']:
  data=(preview/row['path']).read_bytes()
  assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],row['path']
 expected_preview={'compiler.mjs': '22bca1ceecb13d001506dcb9b370f9463a10ed2f1e9df37305f8ca4e3155bfae', 'compiler.wasm': 'd453d6741d1a9813fe3456388c67ffc43e4ce54133a55004d0bfbfe88654340d', 'compiler.data': '529047d470a5a8147ab4276a6d48f757f0abcdd3adafe3681e1a84c099e9f1d7', 'compiler-base.mjs': '0b8f63438bc5a4ed74f16fefd711f1718a0b63c3596c50a7eda635079014559c'}
 for name,digest in expected_preview.items():assert hashlib.sha256((preview/'playground/canonical'/name).read_bytes()).hexdigest()==digest,name
for p in root.rglob('*'):
 if not p.is_file():continue
 rel=str(p.relative_to(root))
 if rel.startswith('preview/0.7.5/'):continue
 assert not rel.startswith(('runtimes/','previews/0.','releases/','generated/','reference/','downloads/current/','playground/artifacts/')),rel
 if p.suffix=='.wasm':assert rel in {'playground/canonical/compiler.wasm','vf-ui/artifacts/vkf-symbolic-kernel.wasm'},rel
 if p.suffix=='.html':
  s=p.read_text();assert not re.search(r'(?:Version |data-release-version=")[0-9]+\.[0-9]+\.[0-9]+',s),rel
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='link' and d.get('rel')=='canonical':return
  self.links.extend(d[k] for k in ['href','src'] if k in d)
for p in root.rglob('*.html'):
 parser=Links();parser.feed(p.read_text())
 for href in parser.links:
  u=urlsplit(href)
  if u.scheme or u.netloc or not u.path:continue
  dest=(root/u.path.lstrip('/') if u.path.startswith('/') else p.parent/unquote(u.path)).resolve()
  assert dest.is_relative_to(root.resolve()),(p,href)
  if dest.is_dir():dest/= 'index.html'
  assert dest.is_file(),(str(p.relative_to(root)),href)
# User-authorized main-address preview routing. Keep all binary/retirement guards above.
import importlib.util,sys
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('latest_preview',Path(__file__).with_name('update-latest-preview.py'))
routing=importlib.util.module_from_spec(spec);spec.loader.exec_module(routing)
for path,content in routing.generated().items():
 assert path.read_text()==content,'Run update-latest-preview.py: '+str(path)
 assert '/preview/' in content
assert 'noindex' in (root/'404.html').read_text()
print('PASS historical compiler bytes, asset retirement, latest-preview entry routing and local page dependencies')
