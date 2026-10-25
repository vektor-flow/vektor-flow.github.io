"""Package the checked HTML example with its exact 0.7.2 runtime; no compiler build."""
from pathlib import Path
import gzip, hashlib, io, json, tarfile
root = Path(__file__).resolve().parents[1] / 'public'
name = 'vkf-embedding-starter-0.7.2'
files = [root / n for n in ['embed-example.html', 'embed-example.mjs',
    'inline-runner.mjs', 'canonical-inline-worker.mjs', 'vkf-browser-isolation.mjs',
    'vkf-coep-sw.js', 'current-compiler-release.json',
    'verification/site-remake-e1079.json', 'verification/website-examples.json']]
for folder in ['playground', 'vf-ui', 'vendor']:
    files.extend(p for p in (root / folder).rglob('*') if p.is_file())
files = sorted(set(files))
manifest = {'release_version':'0.7.2','entry':'embed-example.html','files':[
    {'path':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    for p in files]}
readme = b'''# Vektor Flow 0.7.2 HTML embedding starter\n\nRun python3 -m http.server 8000 in this folder, then open\nhttp://localhost:8000/embed-example.html. Use HTTPS on a public host.\nKeep all relative paths and third-party notices. The service worker can\nreload once to establish browser isolation. This package uses the\npublished incomplete 0.7.2 compiler, not a stable 0.7.5 release.\nThe form compiles and runs VKF in a local Web Worker; it does not use\na calculation server. See STARTER-MANIFEST.json for file hashes.\n'''
output = root / 'downloads' / (name + '.tar.gz')
with output.open('wb') as raw:
 with gzip.GzipFile(filename='',mode='wb',fileobj=raw,mtime=0,compresslevel=6) as gz:
  with tarfile.open(fileobj=gz, mode='w') as archive:
   def add(rel, data):
    item=tarfile.TarInfo(name+'/'+rel);item.size=len(data);item.mtime=0
    item.uid=item.gid=0;item.uname=item.gname='';item.mode=0o644
    archive.addfile(item,io.BytesIO(data))
   for p in files:add(str(p.relative_to(root)),p.read_bytes())
   add('README.md',readme)
   add('STARTER-MANIFEST.json',(json.dumps(manifest,indent=2)+'\n').encode())
digest=hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix(output.suffix+'.sha256').write_text(digest+'  '+output.name+'\n')
print(json.dumps({'archive':str(output.relative_to(root)),'sha256':digest,'files':len(files),'bytes':output.stat().st_size}))
