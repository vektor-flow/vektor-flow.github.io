from pathlib import Path
import json,hashlib
preview=Path(__file__).resolve().parents[1]/'public/preview/0.7.5'
if preview.exists():
 p=preview/'preview-manifest.json';m=json.loads(p.read_text())
 compiler=json.loads((preview/'current-compiler-release.json').read_text())
 m['publication']=compiler['publication_status']
 m['source']='Scoped stable 0.7.5 UI, ordinary retained plotting and browser/Node ESM embedding; selected compiler source '+str(compiler.get('browser_binding') or compiler.get('compiler_source'))+'. Stable qualification is limited to scoped_release in current-compiler-release.json and its named current evidence, including explicitly accepted unchanged components. Broad preview/stable flags describe the incomplete full compiler/platform release; this inventory does not extend qualification.'
 m['source_sha256_meaning']='Retained per-row source_sha256 values describe historical source inputs; sha256 describes the current deployed bytes.'
 previous={r['path']:r for r in m['files']};rows=[]
 for f in sorted(preview.rglob('*')):
  if not f.is_file() or f==p:continue
  name=str(f.relative_to(preview));data=f.read_bytes();digest=hashlib.sha256(data).hexdigest();row=dict(previous.get(name,{}));row.update(path=name,bytes=len(data),sha256=digest)
  if name in previous:row['previous_sha256']=previous[name]['sha256']
  rows.append(row)
 m['files']=rows;p.write_text(json.dumps(m,indent=2)+'\n')
root=Path(__file__).resolve().parents[1]/'public';p=root/'DEPLOYMENT-MANIFEST.json';m=json.loads(p.read_text());m['files']=[dict(path=str(f.relative_to(root)),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()) for f in sorted(root.rglob('*')) if f.is_file() and str(f.relative_to(root)) not in ['DEPLOYMENT-MANIFEST.json','.vkf-site-generated']];m['totalBytes']=sum(r['bytes'] for r in m['files']);p.write_text(json.dumps(m,indent=2)+'\n')
