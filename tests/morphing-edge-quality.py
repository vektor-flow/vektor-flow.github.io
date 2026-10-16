"""Check presentation softness on the paired renders from morphing-edge-quality.cjs."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(sys.argv[1]);counts={}
for name in ['coverage','triangles']:
    rgb=np.asarray(Image.open(root/(name+'.png')).convert('RGB'))[20:-20,20:-20].astype(float)
    coverage=(rgb[:,:,1]-17)/(211-17)
    counts[name]=int(((coverage>.05)&(coverage<.95)).sum())
report={'passed':counts['triangles']<counts['coverage']/5,'partialPixels':counts,
        'reduction':counts['coverage']/max(1,counts['triangles']),
        'scope':'Same native state at 720px; 5–95% coverage pixels. Software GPU. Presentation softness, not geometric accuracy.'}
(root/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));assert report['passed']
