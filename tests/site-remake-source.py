"""Validate documentation provenance and preserve all previously displayed source programs."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re,subprocess
root=Path(__file__).resolve().parents[1]
public=root/'public'
class Sources(HTMLParser):
 def __init__(self):super().__init__();self.on=False;self.sources=[];self.ids=[];self.h1=0
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='textarea':self.on=True;self.sources.append('')
  if 'id' in d:self.ids.append(d['id'])
  if tag=='h1':self.h1+=1
 def handle_data(self,s):
  if self.on:self.sources[-1]+=s
 def handle_endtag(self,tag):
  if tag=='textarea':self.on=False
old=[]
for name in ['index.html','syntax.html']:
 p=Sources();p.feed(subprocess.check_output(['git','show','6472d2a:public/'+name],cwd=root,text=True));old+=p.sources
new=[]
for name in ['index.html','syntax.html','stdlib.html','build.html','install.html','examples.html']:
 p=Sources();p.feed((public/name).read_text());new+=p.sources
 assert p.h1==1,name
 assert len(p.ids)==len(set(p.ids)),name+' duplicate IDs'
assert set(old).issubset(set(new)), 'Previously displayed programs missing'
s=(public/'playground/canonical/compiler.mjs').read_text()
metadata=json.loads(re.search(r'loadPackage\((\{"files":.*?\})\);',s).group(1))
data=(public/'playground/canonical/compiler.data').read_bytes()
inventory=json.loads((public/'stdlib-inventory.json').read_text())
assert len(inventory['modules'])==len(metadata['files'])
packaged={r['filename'].split('/stdlib/')[1]:data[r['start']:r['end']] for r in metadata['files']}
for row in inventory['modules']:
 rel=row['source'].removeprefix('stdlib-source/')
 source=(public/row['source']).read_bytes()
 assert source==packaged[rel],rel
 assert hashlib.sha256(source).hexdigest()==row['source_sha256'],rel
assert inventory['compiler_data_sha256']==hashlib.sha256(data).hexdigest()
release=json.loads((public/'current-compiler-release.json').read_text())
assert release['release_version']=='0.7.2' and not release['stable_release']
print(json.dumps({'oldUniqueProgramsPreserved':len(set(old)),'displayedUniquePrograms':len(set(new)),'packagedSourcesVerified':len(packaged),'oneH1AndUniqueIDs':True,'compilerVersion':'0.7.2'}))
