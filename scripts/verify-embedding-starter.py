"""Verify the starter's archive, source pins and exact runtime; extract for browser QA."""
from pathlib import Path
import hashlib,json,sys,tarfile
root=Path(__file__).resolve().parents[1]/'public'
name='vkf-embedding-starter-0.7.2'
archive=root/'downloads'/(name+'.tar.gz')
actual=hashlib.sha256(archive.read_bytes()).hexdigest()
assert archive.with_suffix(archive.suffix+'.sha256').read_text().split()[0]==actual
out=Path(sys.argv[1]).resolve();out.mkdir(parents=True,exist_ok=True)
with tarfile.open(archive,'r:gz') as tar:
 for item in tar:
  assert item.name.startswith(name+'/') and not item.issym() and not item.islnk(),item.name
 tar.extractall(out,filter='data')
folder=out/name
manifest=json.loads((folder/'STARTER-MANIFEST.json').read_text())
assert manifest['release_version']=='0.7.2'
for row in manifest['files']:
 assert (folder/row['path']).resolve().is_relative_to(folder)
 data=(folder/row['path']).read_bytes()
 assert hashlib.sha256(data).hexdigest()==row['sha256'],row['path']
 assert data==(root/row['path']).read_bytes(),row['path']
expected={row['path'] for row in manifest['files']}|{'README.md','STARTER-MANIFEST.json'}
assert {str(p.relative_to(folder)) for p in folder.rglob('*') if p.is_file()}==expected
print(json.dumps({'archive':archive.name,'sha256':actual,'filesVerified':len(manifest['files']),'extractedTo':str(folder),'entryPoint':'embed-example.html'}))
