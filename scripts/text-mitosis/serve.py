from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
site=Path('/home/viktor/Projects/Vektor Flow/.worktrees/text-unfold-site-20261018/public');proof=Path('/tmp/vkf-mitosis-check-20261018')
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,url):
        clean=url.split('?',1)[0]
        base,rel=(proof,clean[9:]) if clean.startswith('/mitosis/') else (Path('/tmp/vkf-word-mitosis-check-20261018'),clean[len('/word-mitosis/'):]) if clean.startswith('/word-mitosis/') else (site,clean.lstrip('/'))
        p=(base/rel).resolve()
        return str(p if p.is_relative_to(base) else base/'not-found')
    def log_message(self,*args):pass
ThreadingHTTPServer(('127.0.0.1',8887),Handler).serve_forever()
