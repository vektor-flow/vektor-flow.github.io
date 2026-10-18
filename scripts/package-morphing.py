"""The sole Morphing source archive is pinned by previews/morphing-current/SOURCE.json.
Package changes require a reviewed source receipt; never select a moving branch.
"""
from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1]/'public'
receipt=json.loads((root/'previews/morphing-current/SOURCE.json').read_text())
with zipfile.ZipFile(root/'previews/gpu-math-typing/examples/downloads/Morphing-source.zip') as z:
 for name,digest in receipt['sourceFiles'].items():
  assert hashlib.sha256(z.read('morphing/'+name)).hexdigest()==digest,name
print('Verified single authoritative Morphing source archive')
