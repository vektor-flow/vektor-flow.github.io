#!/usr/bin/env python3
"""Later ACTUAL preparation, not a product run. Bind real rows, VKF source, trace.

Duration and input cadence come from the admitted job/display; no new size or
repetition matrix is introduced. The upstream 100-operation panzoom sequence is
deterministically interpolated, rather than replaying old Vega timing results.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct

UPSTREAM = '20ad5e85f829a4ccf29f2d92ea5d708c5c0a7c7e'


def pin(path):
    raw = path.read_bytes()
    return {'path': path.name, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('export', type=Path)
    p.add_argument('output', type=Path)
    p.add_argument('--duration-seconds', type=float, required=True)
    p.add_argument('--input-hz', type=float, required=True)
    p.add_argument('--environment', type=Path, required=True)
    args = p.parse_args()
    if not (1 <= args.duration_seconds <= 30 and 1 <= args.input_hz <= 240):
        raise ValueError('trace must fit normal bounded actual scope (1..30s,1..240Hz)')
    root = args.export.resolve()
    receipt = json.loads((root / 'export.json').read_text())
    if receipt['dataset'] != 'uacg-pexx' or receipt['count'] != 1_000_000:
        raise ValueError('complete official chosen 1M export required')
    for file in receipt['files'].values():
        actual = pin(root / file['path'])
        if actual != file:
            raise ValueError('export file hash/size mismatch')
    xy = (root / receipt['files']['xy']['path']).read_bytes()
    if len(xy) != receipt['count'] * 8:
        raise ValueError('full float32 XY population missing')
    xs, ys = [], []
    count = 0
    # Independent source rows -> common positions check, including tail and all
    # duplicate rows. A correct prefix or bounding box alone cannot pass.
    with (root / receipt['files']['rows']['path']).open() as rows:
        for count, line in enumerate(rows, 1):
            row = json.loads(line)
            expected = struct.pack('<ff', float(row['pickup_longitude']), float(row['pickup_latitude']))
            if xy[(count - 1) * 8:count * 8] != expected:
                raise ValueError('row-to-position mismatch at ' + str(count - 1))
            x, y = struct.unpack('<ff', expected)
            xs.append(format(x, '.9g'))
            ys.append(format(y, '.9g'))
    if count != receipt['count']:
        raise ValueError('raw row population mismatch')
    bounds = receipt['bounds']
    domain = [bounds[0], bounds[1], bounds[2], bounds[3]]
    if not (domain[0] < domain[1] and domain[2] < domain[3]):
        raise ValueError('nondegenerate real coordinate bounds required')
    radius = math.sqrt(40 / math.pi)  # upstream symbol area 40 square CSS pixels
    source = ('# Official TLC2016 ordered export; source/row hashes in request.json.\n'
              'longitude: [' + ', '.join(xs) + ']\n'
              'latitude: [' + ', '.join(ys) + ']\n\n'
              '# Indexed outer broadcasts construct the actual complete point population.\n'
              'positions: longitude_i * [1, 0]_c + latitude_i * [0, 1]_c\n'
              'view: .ui.viewport\n'
              'view.add(p: positions_ic, s: ' + repr(radius) + ', color: [0.27450980392156865, 0.5098039215686274, 0.7058823529411765, 1])\n'
              'view.push(axis_type: "Box", grid_mode: "Lines", x_lim: [' + repr(domain[0]) + ', ' + repr(domain[1]) + '], y_lim: [' + repr(domain[2]) + ', ' + repr(domain[3]) + '], x_label: "Longitude (degrees)", y_label: "Latitude (degrees)")\n'
              'view.show()\n')
    if len(source.encode()) > 64 * 1024 * 1024:
        raise ValueError('source representation exceeds 64MiB; no smaller fallback')
    # The upstream method has 100 operations in five-operation cycles:
    # down, alternating drag/up, centered wheel, down, opposite drag/up.
    # Freeze normalized cameras rather than depending on different wheel gains.
    keyframes = [domain[:]]
    for operation in range(100):
        lo, hi, bottom, top = keyframes[-1]
        if operation % 5 == 2:
            # Ten inward and ten outward centered zooms, reaching 4x magnification.
            factor = 4 ** (-1 / 10 if operation // 5 < 10 else 1 / 10)
            cx, cy = (lo + hi) / 2, (bottom + top) / 2
            halfx, halfy = (hi - lo) * factor / 2, (top - bottom) * factor / 2
            value = [cx - halfx, cx + halfx, cy - halfy, cy + halfy]
        elif operation % 5 in (1, 4):
            sign = 1 if operation % 5 == 1 else -1
            dx, dy = sign * (hi - lo) / 40, sign * (top - bottom) / 40
            value = [lo + dx, hi + dx, bottom + dy, top + dy]
        else:
            value = [lo, hi, bottom, top]
        keyframes.append(value)
    frame_count = math.ceil(args.duration_seconds * args.input_hz)
    trace = []
    for frame in range(frame_count + 1):
        progress = frame / frame_count * 100
        index = min(99, int(progress))
        fraction = progress - index
        value = [a + (b - a) * fraction for a, b in zip(keyframes[index], keyframes[index + 1])]
        # Do not count duplicate mousedown/hold frames as completed moving renders.
        if trace and value == trace[-1]['domain']:
            continue
        trace.append({'index': len(trace), 'atMs': args.duration_seconds * 1000 * frame / frame_count,
                      'upstreamOperation': index, 'domain': value})
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / 'program.vkf').write_text(source)
    (args.output / 'xy.f32le').write_bytes(xy)
    (args.output / 'trace.json').write_text(json.dumps(trace, separators=(',', ':')) + '\n')
    environment = json.loads(args.environment.read_text())
    required = ['os', 'cpu', 'ramBytes', 'gpu', 'driver', 'backend', 'displayHz', 'browserBuild', 'powerState', 'device']
    if any(environment.get(k) is None for k in required):
        raise ValueError('actual environment fields required, no invented hardware/version values')
    request = {
        'schema': 1, 'status': 'PREPARED_UNRUN', 'upstream': UPSTREAM,
        'dataset': receipt, 'exportReceipt': pin(root / 'export.json'),
        'files': {name: pin(args.output / file) for name, file in [('source', 'program.vkf'), ('xy', 'xy.f32le'), ('trace', 'trace.json')]},
        'environment': environment, 'viewport': {'width': 900, 'height': 600, 'dpr': 1},
        'quality': {'shape': 'circle', 'radiusCssPx': radius, 'rgba': [70, 130, 180, 255],
                    'axes': 'Box', 'grid': 'Lines', 'clip': 'plot rectangle',
                    'coordinates': 'raw degrees', 'precision': 'float32 positions; float64 camera domains',
                    'notes': 'Native axes/text and tool chrome retained; peer native tick placement/font rasterization may differ. No LOD, sampling or aggregation.'},
        'traceMethod': {'upstreamOperations': 100, 'durationSeconds': args.duration_seconds,
                        'inputHz': args.input_hz, 'zoomMagnification': 4,
                        'adaptation': 'Deterministic centered in/out zoom and alternating 2.5%-span pan; interpolate intended cameras; omit duplicate poses. Not unchanged historical input events.'},
        'scope': 'Full 2D scatter chart + native axes/grid/clip; existing current retained compiler route',
        'comparativeSamples': 0, 'presentationFps': None,
    }
    (args.output / 'request.json').write_text(json.dumps(request, indent=2) + '\n')


if __name__ == '__main__':
    main()
