"""Lossless, demand-loaded tiles of the reviewed renderer atlas; no new font mapping."""
from pathlib import Path
import gzip,json,hashlib
root=Path(__file__).resolve().parents[1]/'public/previews/gpu-math-typing'
d=json.loads((root/'typing-data.json').read_text());w,h=d['atlasSize'];raw=gzip.decompress((root/'atlas.rgba.gz').read_bytes());size=512
out=root/'motion/fields';out.mkdir(exist_ok=True);entries=[]
for y in range(0,h,size):
 for x in range(0,w,size):
  tile=b''.join(raw[((y+j)*w+x)*4:((y+j)*w+x+size)*4] for j in range(size));name=f'{x//size}-{y//size}.rgba.gz';compressed=gzip.compress(tile,mtime=0);(out/name).write_bytes(compressed)
  entries.append({'file':name,'sha256':hashlib.sha256(tile).hexdigest(),'bytes':len(compressed)})
# The morph renderer does not consume document metrics or diagnostic coverage.
math={k:d[k] for k in ['maps','atlasSize','range']};math['tiles']={k:v for k,v in d['tiles'].items() if '@document:' not in k}
(root/'motion/math-data.json.gz').write_bytes(gzip.compress(json.dumps(math,separators=(',',':')).encode(),mtime=0))
(out/'manifest.json').write_text(json.dumps({'sourceAtlasSHA256':hashlib.sha256((root/'atlas.rgba.gz').read_bytes()).hexdigest(),'sourceMappingSHA256':hashlib.sha256((root/'typing-data.json').read_bytes()).hexdigest(),'tileSize':size,'atlasSize':[w,h],'tiles':entries},indent=2)+'\n')
print('Prepared',len(entries),'lossless field tiles; mapping compressed bytes:',(root/'motion/math-data.json.gz').stat().st_size)
