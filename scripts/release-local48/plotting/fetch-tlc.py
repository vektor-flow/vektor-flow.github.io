#!/usr/bin/env python3
"""Later admitted ACTUAL only. Freeze an official real-data export; no fallback.

One million points follows Plotly's official WebGL example, not a new LOCAL48
denominator. This is an explicit ordered slice of January 2016, not the month.
The output receipt binds the complete chosen population, including duplicates.
"""
import argparse
import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import struct
import time
import urllib.parse
import urllib.request

DATASET = 'uacg-pexx'
ORIGIN = 'https://data.cityofnewyork.us'
N = 1_000_000
PAGE = 50_000
MAX_RESPONSE = 16 * 1024 * 1024
MAX_TOTAL = 256 * 1024 * 1024
WHERE = ("tpep_pickup_datetime >= '2016-01-01T00:00:00' AND "
         "tpep_pickup_datetime < '2016-02-01T00:00:00' AND "
         'pickup_longitude BETWEEN -74.3 AND -73.65 AND '
         'pickup_latitude BETWEEN 40.45 AND 40.95')
SELECT = ':id AS source_row_id,tpep_pickup_datetime,pickup_longitude,pickup_latitude'
ORDER = 'tpep_pickup_datetime ASC,:id ASC'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    began = time.monotonic()
    transferred = 0
    requests = []

    def get(path, query=None):
        nonlocal transferred
        if time.monotonic() - began > 240:
            raise RuntimeError('export exceeded admitted 240 second data cap; do not shrink N')
        url = ORIGIN + path + ('?' + urllib.parse.urlencode(query) if query else '')
        headers = {'Accept': 'application/json', 'User-Agent': 'VKF-plotting-reproduction/1'}
        # Never put credentials in URLs, receipts or error messages.
        if os.environ.get('SOCRATA_APP_TOKEN'):
            headers['X-App-Token'] = os.environ['SOCRATA_APP_TOKEN']
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as response:
            if response.url.split('?', 1)[0] != url.split('?', 1)[0]:
                raise RuntimeError('unexpected export redirect')
            raw = response.read(MAX_RESPONSE + 1)
        transferred += len(raw)
        if len(raw) > MAX_RESPONSE or transferred > MAX_TOTAL:
            raise RuntimeError('export byte cap exceeded; do not truncate population')
        requests.append({'url': url, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
        return json.loads(raw), raw

    def metadata():
        obj, raw = get('/api/views/' + DATASET + '.json')
        if obj.get('id') != DATASET or obj.get('provenance') != 'official':
            raise RuntimeError('official TLC dataset identity missing')
        columns = {c['fieldName']: c['dataTypeName'] for c in obj['columns']}
        expected = {'tpep_pickup_datetime': 'calendar_date', 'pickup_longitude': 'number', 'pickup_latitude': 'number'}
        if any(columns.get(k) != v for k, v in expected.items()):
            raise RuntimeError('official coordinate/time schema changed')
        return obj, raw

    before, raw = metadata()
    (args.output / 'official-metadata.json').write_bytes(raw)
    total, _ = get('/resource/' + DATASET + '.json', {'$select': 'count(*) AS n', '$where': WHERE})
    eligible = int(total[0]['n'])
    if eligible < N:
        raise RuntimeError('official valid January population below chosen 1M; no reduced fallback')
    rows_path = args.output / 'rows.ndjson'
    xy_path = args.output / 'xy.f32le'
    bounds = [math.inf, -math.inf, math.inf, -math.inf]
    last_time = None
    # IDs identify rows; repeated coordinates/timestamps remain separate rows.
    seen_ids = set()
    with rows_path.open('xb') as rows_file, xy_path.open('xb') as xy_file:
        for offset in range(0, N, PAGE):
            batch, _ = get('/resource/' + DATASET + '.json', {
                '$select': SELECT, '$where': WHERE, '$order': ORDER,
                '$limit': PAGE, '$offset': offset})
            if len(batch) != PAGE:
                raise RuntimeError('incomplete ordered export page; no partial dataset')
            for row in batch:
                identity = str(row['source_row_id'])
                stamp = row['tpep_pickup_datetime']
                if identity in seen_ids or (last_time is not None and stamp < last_time):
                    raise RuntimeError('unstable row ordering/duplicate identity')
                seen_ids.add(identity)
                last_time = stamp
                date = datetime.datetime.fromisoformat(stamp)
                x, y = float(row['pickup_longitude']), float(row['pickup_latitude'])
                if not (date.year == 2016 and date.month == 1 and math.isfinite(x) and math.isfinite(y)
                        and -74.3 <= x <= -73.65 and 40.45 <= y <= 40.95):
                    raise RuntimeError('server row violates frozen filter')
                encoded = struct.pack('<ff', x, y)
                fx, fy = struct.unpack('<ff', encoded)
                bounds = [min(bounds[0], fx), max(bounds[1], fx), min(bounds[2], fy), max(bounds[3], fy)]
                xy_file.write(encoded)
                rows_file.write((json.dumps(row, sort_keys=True, separators=(',', ':')) + '\n').encode())
    after, _ = metadata()
    if any(before.get(k) != after.get(k) for k in ['rowsUpdatedAt', 'viewLastModified', 'tableId']):
        raise RuntimeError('official dataset changed during export; reject entire attempt')

    def pin(file):
        digest = hashlib.sha256()
        with file.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
        return {'path': file.name, 'bytes': file.stat().st_size, 'sha256': digest.hexdigest()}

    receipt = {
        'schema': 1, 'status': 'EXPORTED_NOT_BENCHMARKED', 'dataset': DATASET,
        'catalog': ORIGIN + '/Transportation/2016-Yellow-Taxi-Trip-Data/' + DATASET,
        'attribution': 'New York City Taxi and Limousine Commission',
        'license': {'spdx': None, 'datasetLicenseId': before.get('licenseId'),
                    'terms': 'https://www.nyc.gov/main/terms-of-use',
                    'note': 'Official metadata snapshot has no SPDX license; do not invent CC0.'},
        'sourceRevision': {k: before.get(k) for k in ['rowsUpdatedAt', 'viewLastModified', 'tableId']},
        'where': WHERE, 'select': SELECT, 'order': ORDER,
        'eligibleJanuaryRows': eligible, 'count': len(seen_ids), 'chosenRows': N,
        'selection': 'First 1,000,000 matching January rows in timestamp,:id order; duplicates preserved',
        'coordinates': 'Unprojected longitude/latitude degrees; common IEEE754 float32 positions',
        'bounds': bounds, 'requests': requests,
        'files': {'rows': pin(rows_path), 'xy': pin(xy_path), 'metadata': pin(args.output / 'official-metadata.json')},
        'resourceCaps': {'seconds': 240, 'responseBytes': MAX_RESPONSE, 'totalResponseBytes': MAX_TOTAL},
        'comparativeSamples': 0,
    }
    (args.output / 'export.json').write_text(json.dumps(receipt, indent=2) + '\n')


if __name__ == '__main__':
    main()
