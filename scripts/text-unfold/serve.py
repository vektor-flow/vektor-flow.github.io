"""Local-only capture server: public assets, capture harness and generated data."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import sys
root=Path(__file__).resolve().parents[2]
data=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/vkf-text-unfold').resolve()
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, url):
        clean=url.split('?',1)[0].split('#',1)[0]
        if clean.startswith('/capture-data/'): base,rel=data,clean[len('/capture-data/'):]
        elif clean.startswith('/capture/'): base,rel=root/'scripts/text-unfold',clean[len('/capture/'):]
        else: base,rel=root/'public',clean.lstrip('/')
        target=(base/rel).resolve()
        return str(target if target.is_relative_to(base) else base/'not-found')
    def log_message(self,*args): pass
ThreadingHTTPServer(('127.0.0.1',8886),Handler).serve_forever()
