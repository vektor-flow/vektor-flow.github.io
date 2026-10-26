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
 assert manifest['preview'] is True and manifest['stable'] is False
 assert {str(p.relative_to(preview)) for p in preview.rglob('*') if p.is_file()}=={r['path'] for r in manifest['files']}|{'preview-manifest.json'}
 for row in manifest['files']:
  data=(preview/row['path']).read_bytes()
  assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],row['path']
 expected_preview={'compiler.mjs':'850c132341e6d18e8abd603f0d7761b3197c6cb573fe4f0f1f2c95cfc66d70fb','compiler.wasm':'9e26acdc161ebfa6c4795181e0c666d587a726d3b1221b8b9f859c5309a36ac4','compiler.data':'31083d2be1eb6eda1ecef036b0876d6d2d9e2588242521732fa67ea1dcc3c12f'}
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
