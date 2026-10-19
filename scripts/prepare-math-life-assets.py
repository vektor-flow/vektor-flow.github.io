from pathlib import Path
import json,gzip,numpy as np,hashlib
root=Path(__file__).resolve().parents[1]/'public';src=root/'previews/gpu-math-typing';out=root/'previews/math-life';data=json.loads((src/'typing-data.json').read_text());w,h=data['atlasSize'];pixels=np.frombuffer(gzip.decompress((src/'atlas.rgba.gz').read_bytes()),np.uint8).reshape(h,w,4)
chosen={}
# Include all actual tiles selected by the current LaTeX layout for a broad palette.
extra=json.loads((out/'palette-keys.json').read_text())
for key in extra:chosen[key]=data['tiles'][key]
width=1024;x=y=row=0;placements=[]
for key,t in sorted(chosen.items()):
 a,b,c,d=np.rint(np.array(t['uv'])*[w,h,w,h]).astype(int);tw,th=c-a,d-b
 if x+tw+2>width:x=0;y+=row+2;row=0
 placements.append((key,a,b,c,d,x+1,y+1));x+=tw+2;row=max(row,th)
height=2**int(np.ceil(np.log2(y+row+2)));atlas=np.zeros((height,width,4),np.uint8);tiles={}
for key,a,b,c,d,x,y in placements:
 patch=pixels[b:d,a:c];atlas[y:y+d-b,x:x+c-a]=patch;assert np.array_equal(atlas[y:y+d-b,x:x+c-a],patch)
 tiles[key]={**chosen[key],'uv':[x/width,y/height,(x+c-a)/width,(y+d-b)/height]}
compact={'maps':data['maps'],'tiles':tiles,'atlasSize':[width,height],'range':data['range']}
(out/'wave-data.json.gz').write_bytes(gzip.compress(json.dumps(compact,separators=(',',':')).encode(),mtime=0))
(out/'wave-atlas.rgba.gz').write_bytes(gzip.compress(atlas.tobytes(),mtime=0))
receipt={'sourceMetadataSHA256':hashlib.sha256((src/'typing-data.json').read_bytes()).hexdigest(),'sourceAtlasSHA256':hashlib.sha256((src/'atlas.rgba.gz').read_bytes()).hexdigest(),'atlasSize':[width,height],'glyphTiles':len(tiles),'tilesCopiedWithoutResampling':True}
(out/'ASSETS.json').write_text(json.dumps(receipt,indent=2)+'\n');print(receipt)
