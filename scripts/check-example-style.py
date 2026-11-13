"""Bounded source lint for authored VKF website examples; never runs the compiler."""
from pathlib import Path
from html.parser import HTMLParser
import re,json,argparse,subprocess
ROOT=Path(__file__).resolve().parents[1]
PREVIEW=ROOT/'public/preview/0.7.5'
# Protect comments, literal strings/templates and attached derivative primes.
LEX=re.compile(r'''\#\#[\s\S]*?(?:\#\#|$)|\#[^\n]*|"""[\s\S]*?"""|\x27\x27\x27[\s\S]*?\x27\x27\x27|"(?:\\.|[^"\\])*"|(?<![\w)\]])\x27(?:\\.|[^\x27\\\n])*\x27|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z_0-9]*|\.\.\.|:::|::|\?\?>|\?>|\?\?|\?!|!\?|@::|@:|@>|@\||@!|>>|==|~=|!=|<=|>=|=>|->|//|\.\.|><|/\\|\\/|[^\s]''')
class Sources(HTMLParser):
 def __init__(self):super().__init__();self.on=False;self.items=[];self.keys=[];self.sections=[]
 def handle_starttag(self,t,a):
  attrs=dict(a)
  if t=='section':self.sections.append(attrs.get('id'))
  if t=='textarea':
   self.on=True;self.items.append('')
   key=attrs.get('data-example-id') or attrs.get('id')
   section=next((s for s in reversed(self.sections) if s),None)
   self.keys.append(('textarea',key) if key else ('section',section) if section else ('ordinal',len(self.items)-1))
 def handle_data(self,s):
  if self.on:self.items[-1]+=s
 def handle_endtag(self,t):
  if t=='textarea':self.on=False
  if t=='section' and self.sections:self.sections.pop()

def check(s,label):
 assert '\t' not in s,(label,'tab indentation')
 assert '\xa0' not in s,(label,'nonbreaking space')
 assert '\n\n\n' not in s,(label,'excess blank rows')
 ts=list(LEX.finditer(s))
 for i,m in enumerate(ts):
  t=m.group();n=ts[i+1] if i+1<len(ts) else None
  if t==',' and n and '\n' not in s[m.end():n.start()]:
   assert s[m.end():n.start()]==' ',(label,'comma must be followed by a space')
  # Arithmetic spacing depends on precedence; compact powers/products and
  # tighter divisions are deliberate. This bounded lint is not a VKF parser.
  if t in {'=','==','!=','~=','<','>','<=','>=','&','>>','/\\','\\/','><','=>'}:
   prev=ts[i-1] if i else None
   # Operators are also first-class values; suffixes bind to selected operators.
   value=(not prev or prev.group() in {'[','(',',',':'}) and (not n or n.group() in {']',')',',','['})
   if value:continue
   assert not prev or s[prev.end():m.start()].endswith((' ','\n')),(label,'binary operator left spacing',t)
   if n and not n.group().startswith('_'):
    assert s[m.end():n.start()].startswith((' ','\n')),(label,'binary operator right spacing',t)
 return True
def sources(text):
 parser=Sources();parser.feed(text);parser.close();return parser

def keyed(parser,label):
 # Ambiguous identities must not let a changed editor hide behind another one.
 assert len(parser.keys)==len(set(parser.keys)),(label,'duplicate textarea identity')
 return dict(zip(parser.keys,parser.items))

if __name__=='__main__':
 args=argparse.ArgumentParser(description=__doc__)
 args.add_argument('--changed-since',metavar='COMMIT',help='Check added/modified textarea sources against this Git commit across all preview HTML pages; unchanged sources are not qualified.')
 options=args.parse_args()
 base=None;baseline_pages=set()
 if options.changed_since is not None:
  def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True)
  base=git('rev-parse','--verify','--end-of-options',options.changed_since+'^{commit}').strip()
  baseline_pages=set(git('ls-tree','--name-only',base+':'+PREVIEW.relative_to(ROOT).as_posix()).splitlines())
 count=0;unchanged=0;unique=set();checked=[];pages=[]
 for p in PREVIEW.glob('*.html'):
  parser=sources(p.read_text());pages.append(p.name);old={}
  if base:
   keyed(parser,p.name)
   if p.name in baseline_pages:
    old=keyed(sources(git('show',base+':'+p.relative_to(ROOT).as_posix())),p.name+' at '+base)
  for i,s in enumerate(parser.items):
   if base and parser.keys[i] in old and s==old[parser.keys[i]]:
    unchanged+=1;continue
   label=f'{p.name}:{i}'
   check(s,label);count+=1;unique.add(s);checked.append(label)
 report={'static_style':'PASS','scope':'full-site-textareas','textarea_copies':count,'unique_textarea_programs':len(unique),'actual_parser_or_execution':False}
 if base:
  report.update(static_style='PASS_CHANGED_TEXTAREA_SOURCES' if count else 'NO_CHANGED_TEXTAREA_SOURCES',scope='changed-textarea-sources',base_commit=base,unchanged_textarea_copies=unchanged,pages_scanned=pages,checked_sources=checked,full_site_style='NOT_RUN',static_listings_and_prose='SEPARATE_SOURCE_AND_PRESENTATION_REVIEW_REQUIRED')
 print(json.dumps(report))
