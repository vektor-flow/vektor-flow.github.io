from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1]/'public';p=root/'DEPLOYMENT-MANIFEST.json';m=json.loads(p.read_text());m['files']=[dict(path=str(f.relative_to(root)),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()) for f in sorted(root.rglob('*')) if f.is_file() and f.name not in ['DEPLOYMENT-MANIFEST.json','.vkf-site-generated']];m['totalBytes']=sum(r['bytes'] for r in m['files']);p.write_text(json.dumps(m,indent=2)+'\n')
