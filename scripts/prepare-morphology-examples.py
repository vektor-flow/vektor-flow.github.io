"""Validate the live VKF catalog. Recorded-video publication is retired."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'public/previews/gpu-math-typing/examples'
catalog=json.loads((root/'catalog.json').read_text())
assert catalog and len({e['id'] for e in catalog})==len(catalog)
for example in catalog:
    assert example['backend']=='Native VKF'
    assert example['kernel'] in {'biological','surfaces','diagrams','latex'}
    assert example['url']=='live/index.html?example='+example['id']
    assert 'video' not in example and example['id']!='three-states'
print('Validated',len(catalog),'live VKF examples; no video publication')
