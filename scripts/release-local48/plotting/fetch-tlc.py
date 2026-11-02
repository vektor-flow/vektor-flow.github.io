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
import urllib.error
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
# Authentic attempt2 metadata, not cached column statistics or an eligible count.
EXPECTED_REVISION = {'rowsUpdatedAt': 1494466198, 'viewLastModified': 1702586741,
                     'tableId': 14191205}


def page_query(last_row, trailing_ties, count):
    """Seek by timestamp, retaining the server's opaque :id order within ties.

    The first returned row on continuation MUST equal last_row. OFFSET counts
    only the already accepted rows at that timestamp, not the whole prefix.
    The overlap occupies one response slot; it is never exported twice.
    """
    query = {'$select': SELECT, '$where': WHERE, '$order': ORDER,
             '$limit': min(PAGE, N - count + (last_row is not None)), '$offset': 0}
    if last_row is not None:
        # Validate/normalize before interpolation; never interpolate arbitrary
        # input or compare Socrata's opaque row-* identifiers lexicographically.
        stamp = last_row['tpep_pickup_datetime']
        date = datetime.datetime.fromisoformat(stamp)
        if date.tzinfo is not None:
            raise RuntimeError('floating timestamp required at continuation boundary')
        if not 1 <= trailing_ties <= count < N:
            raise RuntimeError('invalid ordered prefix boundary')
        query['$where'] = '(' + WHERE + ") AND tpep_pickup_datetime >= '" + date.isoformat() + "'"
        query['$offset'] = trailing_ties - 1
    elif count != 0 or trailing_ties != 0:
        raise RuntimeError('unverified prefix cannot be resumed')
    return query


def main():
    began = time.monotonic()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--transport', choices=['soda2-get', 'soda3-post'], default='soda2-get',
                        help='Explicit transport; SODA3 requires existing SOCRATA_APP_TOKEN. No fallback.')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    transferred = 0
    requests = []
    source_raw = Path(__file__).read_bytes()
    source_pin = {'path': 'scripts/release-local48/plotting/fetch-tlc.py',
                  'bytes': len(source_raw), 'sha256': hashlib.sha256(source_raw).hexdigest()}
    token = os.environ.get('SOCRATA_APP_TOKEN', '')
    # This integration supports the existing app-token input only. Current
    # vendor query docs explicitly allow an app token OR user authentication.
    # Do not guess user credentials, load stores or put any credential in data.
    if ((args.transport == 'soda3-post' and not token)
            or any(ord(c) < 33 or ord(c) > 126 for c in token)):
        (args.output / 'request-failure.json').write_text(json.dumps({
            'status': 'FAILED_PREREQUISITE', 'transport': args.transport,
            'error': 'SOCRATA_APP_TOKEN required for SODA3; only a nonempty visible-ASCII header token is supported',
            'networkRequests': 0, 'exporterSource': source_pin,
            'elapsedJobSeconds': time.monotonic() - began}, indent=2) + '\n')
        raise RuntimeError('missing or unsupported SOCRATA_APP_TOKEN; no network request made')

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            raise RuntimeError('export redirects are refused')

    opener = urllib.request.build_opener(NoRedirect())

    def remaining():
        seconds = 240 - (time.monotonic() - began)
        if seconds <= 0:
            raise RuntimeError('export exceeded admitted 240 second data cap; do not shrink N')
        return seconds

    def get(path, query=None, boundary=None):
        nonlocal transferred
        budget = min(25, remaining())
        method, body = 'GET', None
        if query is not None and args.transport == 'soda3-post':
            # Integer seconds round DOWN, never above the remaining job/socket
            # cap. Zero must not become an unbounded server timeout.
            if budget < 1:
                raise RuntimeError('insufficient whole-job budget for SODA3 request')
            method, path = 'POST', '/api/v3/views/' + DATASET + '/query.json'
            soql = ('SELECT ' + query['$select'] + ' WHERE ' + query['$where']
                    + ' ORDER BY ' + query['$order'] + ' LIMIT ' + str(query['$limit'])
                    + ' OFFSET ' + str(query['$offset']))
            body = json.dumps({'query': soql, 'includeSystem': True,
                               'includeSynthetic': False, 'orderingSpecifier': 'total',
                               'timeout': math.floor(budget)},
                              sort_keys=True, separators=(',', ':')).encode('utf-8')
        url = ORIGIN + path
        if query is not None and method == 'GET':
            url += '?' + urllib.parse.urlencode(query)
        headers = {'Accept': 'application/json', 'User-Agent': 'VKF-plotting-reproduction/1'}
        # Never put credentials in URLs, receipts or error messages.
        if token:
            headers['X-App-Token'] = token
        if body is not None:
            headers['Content-Type'] = 'application/json'
        record = {'method': method, 'url': url, 'endpoint': ORIGIN + path,
                  'query': query, 'body': body.decode('utf-8') if body is not None else None,
                  'bodySha256': hashlib.sha256(body or b'').hexdigest(),
                  'boundary': boundary, 'socketTimeoutSeconds': budget,
                  'requestIndex': len(requests), 'transport': args.transport}
        # Persist BEFORE waiting for headers: hard-deadline termination still
        # leaves the exact attempted query, not an inferred continuation URL.
        started = time.monotonic()
        (args.output / 'request-attempt.json').write_text(json.dumps({
            'status': 'ATTEMPTING_NOT_SUCCESS', 'request': record,
            'exporterSource': source_pin, 'elapsedJobSeconds': started - began}, indent=2) + '\n')
        phase = 'budget'
        try:
            remaining()
            phase = 'headers'
            with opener.open(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=budget) as response:
                if response.url != url:
                    raise RuntimeError('unexpected export redirect')
                phase = 'body'
                raw = response.read(MAX_RESPONSE + 1)
            remaining()
            transferred += len(raw)
            phase = 'limits'
            if len(raw) > MAX_RESPONSE or transferred > MAX_TOTAL:
                raise RuntimeError('export byte cap exceeded; do not truncate population')
            phase = 'json'
            obj = json.loads(raw)
            remaining()
        except Exception as error:
            # Do not serialize exception text, headers, HTTP error bodies or
            # chained exceptions: a service can echo credentials in any of them.
            failure = {'status': 'FAILED_NOT_EXPORTED', 'request': record,
                       'phase': phase, 'errorType': type(error).__name__[:80],
                       'reasonType': type(error.reason).__name__[:80] if isinstance(error, urllib.error.URLError) else None,
                       'httpStatus': error.code if isinstance(error, urllib.error.HTTPError) else None,
                       'elapsedRequestSeconds': time.monotonic() - started,
                       'elapsedJobSeconds': time.monotonic() - began,
                       'successfulRequests': requests, 'exporterSource': source_pin}
            if isinstance(error, urllib.error.HTTPError):
                error.close()
            (args.output / 'request-failure.json').write_text(json.dumps(failure, indent=2) + '\n')
            raise RuntimeError('export request failed during ' + phase + '; see request-failure.json') from None
        record.update(bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(),
                      elapsedRequestSeconds=time.monotonic() - started)
        requests.append(record)
        return obj, raw

    def metadata():
        obj, raw = get('/api/views/' + DATASET + '.json')
        if obj.get('id') != DATASET or obj.get('provenance') != 'official':
            raise RuntimeError('official TLC dataset identity missing')
        columns = {c['fieldName']: c['dataTypeName'] for c in obj['columns']}
        expected = {'tpep_pickup_datetime': 'calendar_date', 'pickup_longitude': 'number', 'pickup_latitude': 'number'}
        if any(columns.get(k) != v for k, v in expected.items()):
            raise RuntimeError('official coordinate/time schema changed')
        if any(obj.get(k) != v for k, v in EXPECTED_REVISION.items()):
            raise RuntimeError('official dataset revision differs from chosen authentic population')
        return obj, raw

    before, raw = metadata()
    (args.output / 'official-metadata.json').write_bytes(raw)
    # The month-wide aggregate is provenance only, not an input to this exact
    # ordered prefix. It timed out before any export. Do not scan the month to
    # learn a number unnecessary for selection, or infer it from cached metadata.
    # COMPLETE contiguous ordered responses below establish at least N rows.
    # No failed directory/cache can be adopted: exclusive creation above is
    # intentional. Binary positions or the former unreceipted 100k are not proof
    # of a complete, authenticated source prefix.
    rows_path = args.output / 'rows.ndjson'
    xy_path = args.output / 'xy.f32le'
    bounds = [math.inf, -math.inf, math.inf, -math.inf]
    last_time = None
    last_row = None
    trailing_ties = 0
    pages = []
    # IDs identify rows; repeated coordinates/timestamps remain separate rows.
    seen_ids = set()
    with rows_path.open('xb') as rows_file, xy_path.open('xb') as xy_file:
        while len(seen_ids) < N:
            count = len(seen_ids)
            query = page_query(last_row, trailing_ties, count)
            batch, _ = get('/resource/' + DATASET + '.json', query,
                           {'acceptedRows': count, 'lastRow': last_row, 'trailingTies': trailing_ties})
            if not isinstance(batch, list) or len(batch) != query['$limit']:
                raise RuntimeError('incomplete ordered export page; no partial dataset')
            overlap = last_row is not None
            if overlap:
                if batch[0] != last_row:
                    raise RuntimeError('ordered continuation boundary changed; reject prefix')
                batch = batch[1:]
            pages.append({'start': count, 'acceptedRows': len(batch),
                          'timestampOffset': query['$offset'], 'overlapRows': int(overlap),
                          'first': {k: batch[0][k] for k in ['source_row_id', 'tpep_pickup_datetime']},
                          'last': {k: batch[-1][k] for k in ['source_row_id', 'tpep_pickup_datetime']}})
            for row in batch:
                identity = row['source_row_id']
                stamp = row['tpep_pickup_datetime']
                date = datetime.datetime.fromisoformat(stamp)
                if (not isinstance(identity, str) or not identity or identity in seen_ids
                        or (last_time is not None and date < last_time)):
                    raise RuntimeError('unstable row ordering/duplicate identity')
                seen_ids.add(identity)
                x, y = float(row['pickup_longitude']), float(row['pickup_latitude'])
                if not (date.tzinfo is None and date.year == 2016 and date.month == 1 and math.isfinite(x) and math.isfinite(y)
                        and -74.3 <= x <= -73.65 and 40.45 <= y <= 40.95):
                    raise RuntimeError('server row violates frozen filter')
                trailing_ties = trailing_ties + 1 if date == last_time else 1
                last_time, last_row = date, row
                encoded = struct.pack('<ff', x, y)
                fx, fy = struct.unpack('<ff', encoded)
                bounds = [min(bounds[0], fx), max(bounds[1], fx), min(bounds[2], fy), max(bounds[3], fy)]
                xy_file.write(encoded)
                rows_file.write((json.dumps(row, sort_keys=True, separators=(',', ':')) + '\n').encode())
    after, after_raw = metadata()
    (args.output / 'official-metadata-after.json').write_bytes(after_raw)
    if len(seen_ids) != N or xy_path.stat().st_size != N * 8:
        raise RuntimeError('complete chosen 1M population required; no partial export')
    if any(before.get(k) is None or before.get(k) != after.get(k)
           for k in ['rowsUpdatedAt', 'viewLastModified', 'tableId']):
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
        'eligibleJanuaryRows': None,
        'eligibleJanuaryRowsStatus': 'UNKNOWN_NOT_QUERIED_PROVENANCE_ONLY',
        'eligibleJanuaryRowsLowerBound': N,
        'count': len(seen_ids), 'chosenRows': N,
        'completeness': {'pageSize': PAGE, 'completePages': len(pages),
                         'offsets': [page['start'] for page in pages], 'pages': pages,
                         'pagination': 'Timestamp suffix with :id ordered tie offset and exact one-row overlap',
                         'proof': 'Initial ordered page then contiguous ordered suffixes with verified boundary overlap; unique row IDs; every row filter checked; unchanged official revision; full response/file hashes'},
        'selection': 'First 1,000,000 matching January rows in timestamp,:id order; duplicates preserved',
        'coordinates': 'Unprojected longitude/latitude degrees; common IEEE754 float32 positions',
        'bounds': bounds, 'requests': requests,
        'transport': args.transport, 'exporterSource': source_pin,
        'files': {'rows': pin(rows_path), 'xy': pin(xy_path), 'metadata': pin(args.output / 'official-metadata.json'),
                  'metadataAfter': pin(args.output / 'official-metadata-after.json')},
        'resourceCaps': {'seconds': 240, 'responseBytes': MAX_RESPONSE, 'totalResponseBytes': MAX_TOTAL},
        'comparativeSamples': 0,
    }
    remaining()
    (args.output / 'export.json').write_text(json.dumps(receipt, indent=2) + '\n')


if __name__ == '__main__':
    main()
