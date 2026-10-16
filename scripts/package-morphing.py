"""Package only the qualified native Morphing source; no legacy runtime fallback."""
from pathlib import Path
import argparse,hashlib,json,zipfile
p=argparse.ArgumentParser();p.add_argument('--library',type=Path,required=True);p.add_argument('--verification',type=Path,required=True);a=p.parse_args()
r=json.loads(a.verification.read_text());assert r['passed'], 'Native qualification must pass'
for name,digest in r['sources'].items():
 assert hashlib.sha256((a.library/name).read_bytes()).hexdigest()==digest, 'Requalify changed source: '+name
out=Path(__file__).resolve().parents[1]/'public/previews/gpu-math-typing/examples/downloads/Morphing-source.zip'
receipt={k:v for k,v in r.items() if k!='compiler'}
receipt['scope']='Native state/embedding interpolation, connected biological cohorts, parametric surfaces, diagrams and motion of existing LaTeX instances. LaTeX layout remains in the existing site engine. Arbitrary glyph/image/mesh correspondence and native View handles remain unfinished.'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 names=set(r['sources'])|{'morphing/README.md','LICENSE'}
 names.update(str(f.relative_to(a.library)) for f in (a.library/'tests/morphing').rglob('*') if f.is_file() and f.suffix in {'.vkf','.py','.md'} and not any(part.startswith('.') for part in f.relative_to(a.library).parts))
 for name in sorted(names):
  info=zipfile.ZipInfo(name,date_time=(2026,10,16,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,(a.library/name).read_bytes())
 info=zipfile.ZipInfo('qualification.json',date_time=(2026,10,16,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,json.dumps(receipt,indent=2)+'\n')
print('Packaged qualified VKF sources:',out.name)
