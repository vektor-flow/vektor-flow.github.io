"""Bounded source lint for authored VKF website examples; never runs the compiler."""
from pathlib import Path
from html.parser import HTMLParser
import re,json
ROOT=Path(__file__).resolve().parents[1]
PREVIEW=ROOT/'public/preview/0.7.5'
# Protect comments, literal strings/templates and attached derivative primes.
LEX=re.compile(r'''\#\#[\s\S]*?(?:\#\#|$)|\#[^\n]*|"""[\s\S]*?"""|\x27\x27\x27[\s\S]*?\x27\x27\x27|"(?:\\.|[^"\\])*"|(?<![\w)\]])\x27(?:\\.|[^\x27\\\n])*\x27|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z_0-9]*|\.\.\.|:::|::|\?\?>|\?>|\?\?|\?!|!\?|@::|@:|@>|@\||@!|>>|==|~=|!=|<=|>=|=>|->|//|\.\.|><|/\\|\\/|[^\s]''')
class Sources(HTMLParser):
 def __init__(self):super().__init__();self.on=False;self.items=[]
 def handle_starttag(self,t,a):
  if t=='textarea':self.on=True;self.items.append('')
 def handle_data(self,s):
  if self.on:self.items[-1]+=s
 def handle_endtag(self,t):
  if t=='textarea':self.on=False

def check(s,label):
 assert '\t' not in s,(label,'tab indentation')
 assert '\xa0' not in s,(label,'nonbreaking space')
 assert '\n\n\n' not in s,(label,'excess blank rows')
 ts=list(LEX.finditer(s))
 for i,m in enumerate(ts):
  t=m.group();n=ts[i+1] if i+1<len(ts) else None
  if t==',' and n and '\n' not in s[m.end():n.start()]:
   assert s[m.end():n.start()]==' ',(label,'comma must be followed by a space')
  if t in {'=','==','!=','~=','<','>','<=','>=','^','/','//','%','&','>>','/\\','\\/','><','=>'}:
   prev=ts[i-1] if i else None
   # Operators are also first-class values; suffixes bind to selected operators.
   value=(not prev or prev.group() in {'[','(',',',':'}) and (not n or n.group() in {']',')',',','['})
   if value:continue
   assert not prev or s[prev.end():m.start()].endswith((' ','\n')),(label,'binary operator left spacing',t)
   if n and not n.group().startswith('_'):
    assert s[m.end():n.start()].startswith((' ','\n')),(label,'binary operator right spacing',t)
 return True
if __name__=='__main__':
 count=0;unique=set()
 for p in PREVIEW.glob('*.html'):
  parser=Sources();parser.feed(p.read_text())
  for i,s in enumerate(parser.items):check(s,f'{p.name}:{i}');count+=1;unique.add(s)
 print(json.dumps({'static_style':'PASS','textarea_copies':count,'unique_textarea_programs':len(unique),'actual_parser_or_execution':False}))
