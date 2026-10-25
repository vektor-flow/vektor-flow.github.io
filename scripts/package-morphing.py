"""Verify the single current live example and its shared LaTeX dependencies."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]/'public'
receipt=json.loads((root/'previews/morphing-current/SOURCE.json').read_text())
for name,digest in {**receipt['sourceFiles'],**receipt['latexEngineFiles']}.items():
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,name
print('Verified current live wave source and unchanged LaTeX engine')
