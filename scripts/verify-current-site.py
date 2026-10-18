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
assert current['sourceCommit']=='436b6eb542f04740ec0b77119138305d57e2aea7'
assert current['entryPoint']=='state_sequence.StateSequence'
import zipfile
with zipfile.ZipFile(root/'previews/gpu-math-typing/examples/downloads/Morphing-source.zip') as archive:
 for name,digest in current['sourceFiles'].items():
  assert hashlib.sha256(archive.read('morphing/'+name)).hexdigest()==digest,name

release=json.loads((root/'current-compiler-release.json').read_text());assert release['release_version']=='0.7.2'
expected={'compiler.mjs':'42764129b194a05c08300cf0c464cab0e1e3bb449b8d297021fe164b828dc8b4','compiler.wasm':'2455d249026f0c9d1250920c52640a421e4d99746665ddbeb176102c2a1b07b5','compiler.data':'4eb831acbca4482cfce252d5a846c6de83bd322fd1c5b9b2a7206fbbff0ca995'}
for name,digest in expected.items():assert hashlib.sha256((root/'playground/canonical'/name).read_bytes()).hexdigest()==digest,name
for p in root.rglob('*'):
 if not p.is_file():continue
 rel=str(p.relative_to(root))
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
for name in ['index.html','syntax.html','features.html','install.html','performance.html','coming-soon.html']:
 assert '0.7.2' in (root/name).read_text(),name
assert 'noindex' in (root/'404.html').read_text()
print('PASS current0.7.2 bytes, public asset retirement, current navigation and local page dependencies')
