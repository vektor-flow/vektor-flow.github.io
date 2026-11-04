"""Pure pinned-font resource join; no VKF/native execution or network.

Uses the existing genuine Type1 outline conversion. CPU/time and output bounds
replace task-specific historical clock/inode checks; no shared execution is run.
"""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
from decimal import Decimal
import argparse,hashlib,json,math,os,resource as limits
from fontTools.t1Lib import T1Font
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.boundsPen import BoundsPen
C=lambda v:json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False)
H=lambda b:hashlib.sha256(b).hexdigest()
def need(ok,message):
    if not ok:raise ValueError(message)
def pin(p):
    b=Path(p).read_bytes();return dict(bytes=len(b),sha256=H(b))
held={};cache={};reused={}
def read(p):
    key=p['path']
    if key not in held:
        fd=os.open(key,os.O_RDONLY|os.O_NOFOLLOW);stat=os.fstat(fd);raw=os.pread(fd,stat.st_size,0);held[key]=(fd,stat,raw)
    fd,stat,raw=held[key]
    need(len(raw)==p['bytes'] and H(raw)==p['sha256'] and stat==os.fstat(fd),'PINNED_FONT_CHANGED')
    return raw

def catalogue_lookup(raw):
    need(len(raw) >= 68 and raw[:32] == b'VKF-FONT-CATALOG/1              ', 'CATALOGUE_HEADER')

    def fixed(at):
        text = raw[at:at + 12]
        need(len(text) == 12 and all((48 <= c <= 57 for c in text)), 'CATALOGUE_INTEGER')
        return int(text)
    capacity, count = (fixed(32), fixed(44))
    payload = 68 + capacity * 36
    need(0 < capacity <= 2097152 and 0 <= count < capacity and (payload <= len(raw)) and (fixed(56) == len(raw) - payload), 'CATALOGUE_LENGTH')

    def lookup(key):
        encoded = key.encode('utf8')
        hash_value = 0
        for char in key:
            hash_value = (hash_value * 131 + ord(char)) % 2147483647
        slot = hash_value % capacity
        for _ in range(capacity):
            at = 68 + slot * 36
            start, nk, nv = (fixed(at), fixed(at + 12), fixed(at + 24))
            if not start:
                return None
            need(start >= payload and nk > 0 and (nv > 0) and (start + nk + nv <= len(raw)), 'CATALOGUE_SLOT')
            if raw[start:start + nk] == encoded:
                return json.loads(raw[start + nk:start + nk + nv])
            slot = (slot + 1) % capacity
        raise ValueError('CATALOGUE_NO_EMPTY_SLOT')
    return lookup

def physical(q):
    p = q['physicalFont']
    key = p['id']
    if key not in cache:
        read(p['program'])
        read(p['metrics'])
        f = T1Font('/proc/self/fd/' + str(held[p['program']['path']][0]), kind='PFB')
        f.parse()
        assert f['FontName'] == p['postScriptName'] and list(f['FontMatrix']) == p['fontMatrix'] == [0.001, 0, 0, 0.001, 0, 0]
        assert H((C(list(f['Encoding'])) + '\n').encode()) == p['encodingSha256']
        identity = {k: v for k, v in p.items() if k != 'id'}
        identity = {**identity, **{k: {n: v for n, v in p[k].items() if n != 'path'} for k in ['program', 'metrics']}}
        assert key == 'physical-font:' + H(C(identity).encode())
        cache[key] = f
    f = cache[key]
    assert isinstance(q['code'], int) and 0 <= q['code'] <= 255
    assert f['Encoding'][q['code']] == q['glyphName'] and q['glyphName'] != '.notdef'
    char = f['CharStrings'][q['glyphName']]
    char.decompile()
    assert H(C(char.program).encode()) == q['charStringSha256']
    if C(q) in reused:
        return reused[C(q)]
    gs = f.getGlyphSet()
    pen = DecomposingRecordingPen(gs)
    bounds = BoundsPen(gs)
    gs[q['glyphName']].draw(pen)
    gs[q['glyphName']].draw(bounds)
    assert bounds.bounds is not None, 'ACTUAL_EMPTY_GLYPH_UNSUPPORTED'
    scale = q['sizeSp'] * (7200 / (7227 * 65536)) * 0.001
    assert isinstance(q['sizeSp'], int) and q['sizeSp'] > 0
    lines = []
    moves = closes = 0
    for op, points in pen.value:
        assert op in ['moveTo', 'lineTo', 'curveTo', 'closePath']
        assert len(points) == dict(moveTo=1, lineTo=1, curveTo=3, closePath=0)[op]
        values = [v for x, y in points for v in [x * scale, -y * scale]]
        assert all((math.isfinite(v) for v in values))
        encoded = [format(Decimal(repr(v)), 'f') if v else '0' for v in values]
        assert all((float(s) == v for s, v in zip(encoded, values)))
        lines.append((' '.join(encoded) + ' ' + dict(moveTo='m', lineTo='l', curveTo='c', closePath='h')[op]).strip())
        moves += op == 'moveTo'
        closes += op == 'closePath'
    assert moves == closes and moves > 0, 'ACTUAL_OPEN_OR_EMPTY_CONTOUR_UNSUPPORTED'
    left, bottom, right, top = bounds.bounds
    path = dict(bounds=[left * scale, -top * scale, right * scale, -bottom * scale], operators='\n'.join(lines))
    return dict(query=q, path=path, pathDigest=H(C(path).encode()), pathCanonical=C(path))

def main(a):
    limits.setrlimit(limits.RLIMIT_CPU,(10,10))
    limits.setrlimit(limits.RLIMIT_AS,(512*1024*1024,512*1024*1024))
    root=Path(a.mapping);output=Path(a.output);need(not output.exists(),'NEW_OUTPUT_REQUIRED')
    bundle=json.loads((root/'bundle.json').read_bytes());files={}
    for name,entry in bundle['files'].items():
        need(Path(entry['url']).name==entry['url'],'LOCAL_RESOURCE_REQUIRED')
        raw=(root/entry['url']).read_bytes();need(H(raw)==entry['sha256'],'MAPPING_RESOURCE_CHANGED');files[name]=raw
    vectors=json.loads(files['vectors']);binding=json.loads(files['binding']);closure=json.loads(files['fontClosure']);catalog=Path(a.catalog).read_bytes()
    need(H(catalog)==bundle['identity']['catalogSha256'] and H(files['fontClosure'])==bundle['identity']['resourceClosureSha256'],'NATIVE_RESOURCE_IDENTITY_CHANGED')
    lookup=catalogue_lookup(catalog)
    def query(key):
        q=lookup('physical/'+key);need(isinstance(q,dict),'NATIVE_PHYSICAL_QUERY_MISSING')
        need(all(q['physicalFont'][name] in closure['files'] for name in ['program','metrics']),'FONT_CLOSURE_EXPANSION_REFUSED');return q
    for key,outline in vectors['keys'].items():
        need(binding['entries'][key]==dict(query=query(key),atlasKey=key,outlineDigest=outline) and outline in vectors['paths'],'EXISTING_MAPPING_CHANGED')
    used=set();rows=json.loads(Path(a.native_result).read_bytes());need(isinstance(rows,list) and len(rows)<=512,'BOUNDED_NATIVE_RESULTS_REQUIRED')
    for row in rows:
        identity=row['identity'];box=row['box'];need(identity['catalogSha256']==bundle['identity']['catalogSha256'] and identity['resourceClosureSha256']==bundle['identity']['resourceClosureSha256'],'NATIVE_LAYOUT_IDENTITY_CHANGED')
        need(box['complete'] and not box['diagnostics'],'COMPLETE_NATIVE_LAYOUT_REQUIRED')
        used.update(i['key'] for i in box['items'] if i['kind']=='glyph')
    need(len(used)<=4096,'NATIVE_GLYPH_BUDGET');added=sorted(used-vectors['keys'].keys())
    for key in added:
        q=query(key);row=physical(q);digest=row['pathDigest']
        need(digest not in vectors['paths'] or vectors['paths'][digest]==row['path'],'PHYSICAL_OUTLINE_COLLISION')
        vectors['keys'][key]=digest;vectors['paths'][digest]=row['path'];binding['entries'][key]=dict(query=q,atlasKey=key,outlineDigest=digest)
    for fd,stat,raw in held.values():need(os.fstat(fd)==stat,'FONT_CHANGED_BEFORE_JOIN')
    output.mkdir()
    for name,raw in files.items():(output/(name+'.json')).write_bytes(raw);bundle['files'][name]['url']=name+'.json'
    receipt=dict(status='EXACT_NATIVE_QUERY_TO_AUTHENTIC_TYPE1_OUTLINE_JOIN',addedKeys=added,fontClosureUnchanged=True,nativeResults=pin(a.native_result),catalogue=pin(a.catalog),generator=pin(__file__),nativeExecution=False)
    for name,value in [('vectors',vectors),('binding',binding)]:
        p=output/(name+'.json');p.write_text(json.dumps(value,indent=2)+'\n');bundle['files'][name]['sha256']=pin(p)['sha256']
    bundle.setdefault('provenance',{})['usedResourceCoverageExtension']=receipt
    (output/'EXTENSION.json').write_text(json.dumps(receipt,indent=2)+'\n');(output/'bundle.json').write_text(json.dumps(bundle,indent=2)+'\n')
    print(json.dumps(receipt))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ['mapping','catalog','native-result','output']:p.add_argument('--'+name,required=True)
    try:main(p.parse_args())
    finally:
        for fd,_,_ in held.values():os.close(fd)
