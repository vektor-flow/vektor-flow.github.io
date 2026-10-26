"""Generate public entry routing from the single qualified preview pointer.
Before 1.0 the main address points to the latest qualified preview. Updating
this pointer requires qualification first; this script never publishes a release.
The 1.0 main-address policy is a separate decision.
"""
from pathlib import Path
import json,html
ROOT=Path(__file__).resolve().parents[1]/'public'
def generated():
 config=json.loads((ROOT/'latest-preview.json').read_text())
 target=config['path']
 assert config['policy']=='latest-qualified-preview-before-1.0'
 assert target.startswith('/preview/') and target.endswith('/') and '..' not in target
 preview=ROOT/target.lstrip('/')
 manifest=json.loads((preview/'preview-manifest.json').read_text())
 assert manifest['preview'] is True and manifest['stable'] is False
 entries={}
 for p in sorted(ROOT.glob('*.html')):
  dest=target+(p.name if p.name not in ['index.html','404.html'] and (preview/p.name).is_file() else '')
  canonical='https://vektorflow.org'+dest
  robots='<meta name="robots" content="noindex,follow">' if p.name=='404.html' else ''
  entries[p]='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vektor Flow — latest preview</title>
'''+robots+'\n<link rel="canonical" href="'+html.escape(canonical)+'">\n'+'''<script>
// Generated from latest-preview.json. Replace avoids a back-button redirect loop.
const destination = new URL('''+json.dumps(dest)+''', location.origin);
destination.search = location.search;
destination.hash = location.hash;
if (destination.href !== location.href) location.replace(destination.href);
</script>
<noscript><meta http-equiv="refresh" content="0;url='''+html.escape(dest)+'''"></noscript>
</head><body><p><a href="'''+html.escape(dest)+'''">Open the latest Vektor Flow preview</a></p></body></html>
'''
 entries[ROOT/'sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>https://vektorflow.org'+target+(p.name if p.name!='index.html' else '')+'</loc></url>' for p in sorted(preview.glob('*.html')) if p.name!='404.html')+'</urlset>\n'
 return entries
if __name__=='__main__':
 for p,s in generated().items():p.write_text(s)
