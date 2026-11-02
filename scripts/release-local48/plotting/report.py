#!/usr/bin/env python3
"""ACTUAL-only adapter from attach.mjs outputs to the existing Performance tables.

No benchmark execution, dependency imports, browser, hosting or release gate.
Without --write this prints a reviewable fragment (or --format json oracle data).
"""
import argparse
import datetime
import hashlib
import html
import json
import math
from pathlib import Path
import re
import shutil
import struct
import urllib.parse

TOOLS = {'vkf': 'VKF · current retained plot',
         'plotly': 'Plotly.js · scattergl',
         'deck': 'deck.gl · ScatterplotLayer + OrthographicView'}
MEASURED = 'RAW_MEASURED_REQUIRES_INDEPENDENT_REVIEW'
UPSTREAM = '20ad5e85f829a4ccf29f2d92ea5d708c5c0a7c7e'
BOUNDARY = ('Paced sequential full-chart application update + complete native surface readback cadence; '
            'observer overhead included; no compositor/display presentation proof')
SITE_INPUTS = {'helper': 'tests/plotting-comparison.mjs',
               'attachment': 'scripts/release-local48/plotting/attach.mjs',
               'release': 'public/preview/0.7.5/current-compiler-release.json',
               'selection': 'scripts/current-package-selection.json',
               'renderer': 'public/preview/0.7.5/vf-ui/vf-display.js',
               'runner': 'public/preview/0.7.5/inline-runner.mjs',
               'mount': 'public/preview/0.7.5/inline-retained-scene-view.mjs'}
EXPORTER_PATH = 'scripts/release-local48/plotting/fetch-tlc.py'
CURRENT_EXPORTER = {'path': EXPORTER_PATH, 'bytes': 16165, 'sha256':
    '6ab69fe83ccc5163094bb8c6e540c85089f11f8cc10cd924c1a2825cc79c4fc4'}
LEGACY_EXPORTER = {'path': EXPORTER_PATH, 'bytes': 11088, 'sha256':
    '411c6fee5a99ed8f21a5688e77a8c0aae43bccdab4bc4c507d839e0f5ab0d6dd'}
ORIGIN = 'https://data.cityofnewyork.us'
WHERE = ("tpep_pickup_datetime >= '2016-01-01T00:00:00' AND "
         "tpep_pickup_datetime < '2016-02-01T00:00:00' AND "
         'pickup_longitude BETWEEN -74.3 AND -73.65 AND pickup_latitude BETWEEN 40.45 AND 40.95')
SELECT = ':id AS source_row_id,tpep_pickup_datetime,pickup_longitude,pickup_latitude'
ORDER = 'tpep_pickup_datetime ASC,:id ASC'


class ReportValidationError(ValueError):
    """Only locally authored validation labels are safe to display."""


def require(condition, label):
    if not condition:
        raise ReportValidationError(label)


def validation_reason(error):
    # Parser/OS exceptions can contain source strings or a service response.
    return str(error) if isinstance(error, ReportValidationError) else 'Invalid input record (' + type(error).__name__ + ')'


def finite(value):
    return type(value) in (int, float) and math.isfinite(value)


def pin_matches(spec, file):
    # Hash incrementally: genuine source/XY inputs are not loaded as a new corpus.
    require(file.is_file(), 'missing current input: ' + str(file))
    h = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    require(spec['bytes'] == file.stat().st_size and spec['sha256'] == h.hexdigest(),
            'changed input bytes: ' + str(file))


def same_rect(a, b):
    return all(finite(a.get(k)) and finite(b.get(k)) and abs(a[k] - b[k]) <= .05
               for k in ('left', 'right', 'top', 'bottom', 'width', 'height'))


def same_domain(a, b):
    return (isinstance(a, list) and len(a) == len(b) == 4 and
            all(finite(x) and finite(y) and abs(x-y) <= 1e-8 for x, y in zip(a, b)))


def export_contract(dataset):
    if 'transport' not in dataset and 'exporterSource' not in dataset:
        # Legacy source really emitted only GET URL/response extent/hash. It
        # cannot impersonate the new POST contract; production checks its file.
        return 'legacy-get', LEGACY_EXPORTER
    require(dataset['transport'] in ('soda2-get', 'soda3-post') and
            dataset['exporterSource'] == CURRENT_EXPORTER, 'unreviewed exporter source/transport')
    return dataset['transport'], CURRENT_EXPORTER


def query_at_boundary(boundary):
    require(isinstance(boundary, dict) and set(boundary) == {'acceptedRows', 'lastRow', 'trailingTies'},
            'missing exact request boundary diagnostic')
    count, last, ties = (boundary[k] for k in ('acceptedRows', 'lastRow', 'trailingTies'))
    require(type(count) is int and 0 <= count < 1_000_000 and type(ties) is int,
            'invalid request prefix boundary')
    where = WHERE
    if last is None:
        require(count == ties == 0, 'unverified request prefix')
    else:
        require(set(last) == {'source_row_id', 'tpep_pickup_datetime', 'pickup_longitude', 'pickup_latitude'} and
                isinstance(last['source_row_id'], str) and last['source_row_id'] and 1 <= ties <= count,
                'invalid full selected boundary row')
        stamp = datetime.datetime.fromisoformat(last['tpep_pickup_datetime'])
        x, y = float(last['pickup_longitude']), float(last['pickup_latitude'])
        require(stamp.tzinfo is None and stamp.year == 2016 and stamp.month == 1 and
                math.isfinite(x) and math.isfinite(y) and -74.3 <= x <= -73.65 and 40.45 <= y <= 40.95,
                'request boundary outside original eligibility')
        where = '(' + WHERE + ") AND tpep_pickup_datetime >= '" + stamp.isoformat() + "'"
    return {'$select': SELECT, '$where': where, '$order': ORDER,
            '$limit': min(50_000, 1_000_000-count+int(last is not None)), '$offset': ties-1 if last else 0}


def check_export_request(record, transport, query, index, completed=True):
    """Credential-free request identity; never treat an attempt as a response."""
    response_keys = {'bytes', 'sha256', 'elapsedRequestSeconds'} if completed else set()
    require(set(record) == {'method', 'url', 'endpoint', 'query', 'body', 'bodySha256',
            'boundary', 'socketTimeoutSeconds', 'requestIndex', 'transport'} | response_keys,
            'unexpected/missing request diagnostic fields')
    require(type(record['requestIndex']) is int and record['requestIndex'] == index and
            record['transport'] == transport and record['query'] == query,
            'request method/query/index identity mismatch')
    budget = record['socketTimeoutSeconds']
    require(finite(budget) and 0 < budget <= 25, 'invalid remaining socket budget')
    metadata = query is None
    if metadata:
        endpoint = ORIGIN+'/api/views/uacg-pexx.json'
        require(record['boundary'] is None, 'metadata must not carry row boundary')
    else:
        require(query_at_boundary(record['boundary']) == query and
                type(query['$limit']) is int and type(query['$offset']) is int,
                'request full query/boundary mismatch')
        endpoint = ORIGIN+('/api/v3/views/uacg-pexx/query.json' if transport == 'soda3-post'
                           else '/resource/uacg-pexx.json')
    method = 'POST' if transport == 'soda3-post' and not metadata else 'GET'
    require(record['method'] == method and record['endpoint'] == endpoint and record['url'] ==
            endpoint+('?' + urllib.parse.urlencode(query) if query is not None and method == 'GET' else ''),
            'unverified official request method/URL')
    if method == 'POST':
        require(isinstance(record['body'], str) and len(record['body']) < 2048, 'missing bounded POST body')
        body = json.loads(record['body'])
        timeout = body['timeout']
        require(type(timeout) is int and 1 <= timeout <= 25 and timeout == math.floor(budget),
                'POST timeout must be positive floor of remaining socket budget')
        soql = ('SELECT '+query['$select']+' WHERE '+query['$where']+' ORDER BY '+query['$order']+
                ' LIMIT '+str(query['$limit'])+' OFFSET '+str(query['$offset']))
        expected = json.dumps({'query': soql, 'includeSystem': True, 'includeSynthetic': False,
                              'orderingSpecifier': 'total', 'timeout': timeout},
                             sort_keys=True, separators=(',', ':'))
        require(record['body'] == expected, 'different canonical full SoQL/system/order POST body')
    else:
        require(record['body'] is None, 'GET must not carry a POST body')
    require(record['bodySha256'] == hashlib.sha256((record['body'] or '').encode('utf-8')).hexdigest(),
            'request canonical body hash mismatch')
    if completed:
        require(type(record['bytes']) is int and 0 < record['bytes'] <= 16*1024*1024 and
                re.fullmatch(r'[0-9a-f]{64}', record['sha256']) and
                finite(record['elapsedRequestSeconds']) and record['elapsedRequestSeconds'] >= 0,
                'invalid completed response hash/extent/elapsed')


def check_export_diagnostic(record, site):
    """Return a bounded failure reason, with no service body/exception text."""
    require(record['exporterSource'] == CURRENT_EXPORTER and
            finite(record['elapsedJobSeconds']) and record['elapsedJobSeconds'] >= 0,
            'unreviewed export diagnostic source/clock')
    pin_matches(CURRENT_EXPORTER, site/EXPORTER_PATH)
    status = record['status']
    if status == 'FAILED_PREREQUISITE':
        require(set(record) == {'status', 'transport', 'error', 'networkRequests', 'exporterSource',
                'elapsedJobSeconds'} and record['transport'] in ('soda2-get', 'soda3-post') and
                type(record['networkRequests']) is int and record['networkRequests'] == 0 and
                record['error'] == 'SOCRATA_APP_TOKEN required for SODA3; only a nonempty visible-ASCII header token is supported',
                'invalid credential prerequisite diagnostic')
        return 'FAILED export prerequisite: missing/unsupported app-token input; zero network requests; no completed export'
    require(status in ('ATTEMPTING_NOT_SUCCESS', 'FAILED_NOT_EXPORTED'), 'diagnostic is not export success')
    expected = {'status', 'request', 'exporterSource', 'elapsedJobSeconds'}
    completed = []
    if status == 'FAILED_NOT_EXPORTED':
        expected |= {'phase', 'errorType', 'reasonType', 'httpStatus', 'elapsedRequestSeconds', 'successfulRequests'}
        completed = record['successfulRequests']
        types = {'TimeoutError', 'URLError', 'HTTPError', 'RuntimeError', 'JSONDecodeError', 'UnicodeDecodeError',
                 'OSError', 'SSLError', 'SSLCertVerificationError', 'ConnectionError', 'ConnectionResetError',
                 'ConnectionRefusedError', 'BrokenPipeError', 'IncompleteRead', 'RemoteDisconnected', 'str', 'gaierror'}
        require(record['phase'] in ('budget', 'headers', 'body', 'limits', 'json') and
                record['errorType'] in types and (record['reasonType'] is None or record['reasonType'] in types) and
                (record['httpStatus'] is None or type(record['httpStatus']) is int and 100 <= record['httpStatus'] <= 599) and
                finite(record['elapsedRequestSeconds']) and record['elapsedRequestSeconds'] >= 0 and
                isinstance(completed, list) and len(completed) <= 22,
                'invalid bounded request failure diagnostic')
    require(set(record) == expected, 'unexpected/missing export diagnostic fields')
    r = record['request']
    transport = r['transport']
    require(transport in ('soda2-get', 'soda3-post') and type(r['requestIndex']) is int and
            0 <= r['requestIndex'] <= 22 and (not completed or r['requestIndex'] == len(completed)),
            'invalid diagnostic request sequence')
    if status == 'FAILED_NOT_EXPORTED':
        require(r['requestIndex'] == len(completed), 'failed request is not next after completed responses')
    for index, request in [(i, v) for i, v in enumerate(completed)] + [(r['requestIndex'], r)]:
        query = None if index in (0, 22) else query_at_boundary(request['boundary'])
        if query is not None:
            start = 0 if index == 1 else 50_000+(index-2)*49_999
            require(request['boundary']['acceptedRows'] == start, 'diagnostic accepted-prefix gap')
        check_export_request(request, transport, query, index, completed=request is not r)
    require(sum(v['bytes'] for v in completed) <= 256*1024*1024, 'diagnostic response cap exceeded')
    started = record['elapsedJobSeconds'] - (record['elapsedRequestSeconds'] if status == 'FAILED_NOT_EXPORTED' else 0)
    require(0 <= started < 240, 'request attempt outside original 240 budget')
    # The snapshot clock follows construction of the socket budget; it cannot
    # reconstruct that earlier instant exactly. The pinned source enforces
    # min(25, remaining240); POST timeout must equal its positive integer floor.
    if status == 'ATTEMPTING_NOT_SUCCESS':
        return 'PENDING export request attempt only; no completed export'
    http = ' HTTP '+str(record['httpStatus']) if record['httpStatus'] is not None else ''
    return 'FAILED export request during '+record['phase']+http+' ('+record['errorType']+'); no completed export'


def check_export_protocol(dataset):
    """Check the current exporter receipt, not transport rows as population.

    Raw response bodies are not retained by fetch-tlc.py. Their hashes remain
    provenance; the file-backed check below and normal independent review are
    still required. This helper alone cannot qualify data or report numbers.
    """
    require(dataset['schema'] == 1 and dataset['status'] == 'EXPORTED_NOT_BENCHMARKED' and
            dataset['dataset'] == 'uacg-pexx' and dataset['count'] == dataset['chosenRows'] == 1_000_000,
            'complete official first1M export missing')
    transport, _ = export_contract(dataset)
    where = WHERE
    require(dataset['order'] == 'tpep_pickup_datetime ASC,:id ASC' and
            dataset['select'] == ':id AS source_row_id,tpep_pickup_datetime,pickup_longitude,pickup_latitude' and
            dataset['where'] == where, 'different population/filter/order')
    require(dataset['sourceRevision'] == {'rowsUpdatedAt': 1494466198,
            'viewLastModified': 1702586741, 'tableId': 14191205}, 'unverified chosen dataset revision')
    require(dataset['eligibleJanuaryRows'] is None and
            dataset['eligibleJanuaryRowsStatus'] == 'UNKNOWN_NOT_QUERIED_PROVENANCE_ONLY' and
            dataset['eligibleJanuaryRowsLowerBound'] == 1_000_000, 'unsupported month total provenance')
    c = dataset['completeness']
    starts = [0] + [50_000 + i*49_999 for i in range(20)]
    require(c['pageSize'] == 50_000 and c['completePages'] == len(c['pages']) == 21 and
            c['offsets'] == starts and
            c['pagination'] == 'Timestamp suffix with :id ordered tie offset and exact one-row overlap',
            'incomplete ordered continuation protocol')
    requests = dataset['requests']
    require(len(requests) == 23 and dataset['resourceCaps'] ==
            {'seconds': 240, 'responseBytes': 16*1024*1024, 'totalResponseBytes': 256*1024*1024},
            'missing export responses or changed caps')
    for r in requests:
        require(type(r['bytes']) is int and 0 < r['bytes'] <= 16*1024*1024 and
                re.fullmatch(r'[0-9a-f]{64}', r['sha256']), 'invalid response hash/extent')
        if transport == 'legacy-get':
            require(set(r) == {'url', 'bytes', 'sha256'}, 'legacy GET response contract changed')
    require(sum(r['bytes'] for r in requests) <= 256*1024*1024, 'export response cap exceeded')
    for r, key in [(requests[0], 'metadata'), (requests[-1], 'metadataAfter')]:
        require(r['url'] == 'https://data.cityofnewyork.us/api/views/uacg-pexx.json' and
                all(r[k] == dataset['files'][key][k] for k in ('bytes', 'sha256')),
                'missing final/before metadata response identity')
        if transport != 'legacy-get':
            check_export_request(r, transport, None, 0 if key == 'metadata' else 22)
    previous = None
    for i, (page, r) in enumerate(zip(c['pages'], requests[1:-1])):
        accepted = 50_000 if i == 0 else 19 if i == 20 else 49_999
        require(page['start'] == starts[i] and page['acceptedRows'] == accepted and
                type(page['overlapRows']) is int and page['overlapRows'] == int(i > 0) and
                type(page['timestampOffset']) is int and 0 <= page['timestampOffset'] < max(1, starts[i]),
                'page gap/count/overlap mismatch')
        for boundary in (page['first'], page['last']):
            require(set(boundary) == {'source_row_id', 'tpep_pickup_datetime'} and
                    isinstance(boundary['source_row_id'], str) and boundary['source_row_id'],
                    'missing source page boundary')
            stamp = datetime.datetime.fromisoformat(boundary['tpep_pickup_datetime'])
            require(stamp.tzinfo is None and stamp.year == 2016 and stamp.month == 1,
                    'page boundary outside eligibility')
        first = datetime.datetime.fromisoformat(page['first']['tpep_pickup_datetime'])
        last = datetime.datetime.fromisoformat(page['last']['tpep_pickup_datetime'])
        require(first <= last and (previous is None or previous <= first), 'page order regression')
        expected_where = where if i == 0 else ('(' + where +
            ") AND tpep_pickup_datetime >= '" + previous.isoformat() + "'")
        query = {'$select': dataset['select'], '$where': expected_where, '$order': dataset['order'],
                 '$limit': accepted + int(i > 0), '$offset': page['timestampOffset']}
        require(i > 0 or page['timestampOffset'] == 0, 'initial timestamp offset must be zero')
        if transport == 'legacy-get':
            parsed = urllib.parse.urlsplit(r['url'])
            params = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True)
            require(parsed.scheme == 'https' and parsed.netloc == 'data.cityofnewyork.us' and
                    parsed.path == '/resource/uacg-pexx.json' and not parsed.fragment and
                    len(params) == 5 and dict(params) == {k: str(v) for k, v in query.items()},
                    'unverified continuation query/order/boundary')
        else:
            check_export_request(r, transport, query, i+1)
            b = r['boundary']
            require(b['acceptedRows'] == starts[i] and
                    (i == 0 or {k:b['lastRow'][k] for k in ('source_row_id', 'tpep_pickup_datetime')} ==
                     c['pages'][i-1]['last']), 'request/previous accepted boundary mismatch')
        previous = last
    require(sum(p['acceptedRows'] for p in c['pages']) == 1_000_000, 'incomplete accepted population')


def check_export_files(dataset, root):
    """Recheck ordinary retained source/XY/metadata files, including every row."""
    files = dataset['files']
    expected = {'rows': 'rows.ndjson', 'xy': 'xy.f32le', 'metadata': 'official-metadata.json',
                'metadataAfter': 'official-metadata-after.json'}
    require(set(files) == set(expected), 'complete export files missing')
    for key, name in expected.items():
        require(files[key]['path'] == name, 'different export file path')
        pin_matches(files[key], root/name)
    for key in ('metadata', 'metadataAfter'):
        metadata = json.loads((root/expected[key]).read_text())
        require(metadata['id'] == 'uacg-pexx' and metadata['provenance'] == 'official' and
                all(metadata.get(k) == v for k, v in dataset['sourceRevision'].items()),
                'official metadata revision/identity mismatch')
        columns = {c['fieldName']: c['dataTypeName'] for c in metadata['columns']}
        require(all(columns.get(k) == v for k, v in {'tpep_pickup_datetime': 'calendar_date',
                'pickup_longitude': 'number', 'pickup_latitude': 'number'}.items()), 'official schema changed')
    require(files['xy']['bytes'] == 8_000_000, 'incomplete full float32 population')
    transport, _ = export_contract(dataset)
    seen, previous, ties, last_row = set(), None, 0, None
    bounds = [math.inf, -math.inf, math.inf, -math.inf]
    with (root/'rows.ndjson').open() as rows, (root/'xy.f32le').open('rb') as xy:
        for page_index, page in enumerate(dataset['completeness']['pages']):
            require(page['timestampOffset'] == (ties-1 if previous is not None else 0),
                    'continuation tie offset differs from accepted source prefix')
            if transport != 'legacy-get':
                require(dataset['requests'][page_index+1]['boundary'] ==
                        {'acceptedRows': len(seen), 'lastRow': last_row, 'trailingTies': ties},
                        'full selected request boundary differs from accepted source prefix')
            for i in range(page['acceptedRows']):
                line = rows.readline()
                require(line, 'truncated source population/prefix')
                row = json.loads(line)
                require(set(row) == {'source_row_id', 'tpep_pickup_datetime', 'pickup_longitude',
                        'pickup_latitude'}, 'different selected source fields')
                identity = row['source_row_id']
                stamp = datetime.datetime.fromisoformat(row['tpep_pickup_datetime'])
                require(isinstance(identity, str) and identity and identity not in seen and
                        stamp.tzinfo is None and stamp.year == 2016 and stamp.month == 1 and
                        (previous is None or previous <= stamp), 'duplicate ID/eligibility/order regression')
                x, y = float(row['pickup_longitude']), float(row['pickup_latitude'])
                require(math.isfinite(x) and math.isfinite(y) and -74.3 <= x <= -73.65 and
                        40.45 <= y <= 40.95, 'source coordinate eligibility mismatch')
                encoded = struct.pack('<ff', x, y)
                require(xy.read(8) == encoded, 'all-row source/float32 XY mismatch')
                fx, fy = struct.unpack('<ff', encoded)
                bounds = [min(bounds[0], fx), max(bounds[1], fx), min(bounds[2], fy), max(bounds[3], fy)]
                if i == 0 or i == page['acceptedRows']-1:
                    boundary = {k: row[k] for k in ('source_row_id', 'tpep_pickup_datetime')}
                    require(boundary == page['first' if i == 0 else 'last'], 'source/page boundary mismatch')
                seen.add(identity)
                ties = ties+1 if stamp == previous else 1
                previous = stamp
                last_row = row
        require(len(seen) == 1_000_000 and not rows.read(1) and not xy.read(1),
                'incomplete/extra accepted source population')
    require(bounds == dataset['bounds'], 'all-row float32 bounds mismatch')


def check_output(raw, tool, phase, request, trace, reference):
    require(raw['tool'] == tool and raw['phase'] == phase, 'tool/phase mismatch')
    require(raw['status'] == ('PASS_PREFLIGHT' if phase == 'preflight' else MEASURED),
            'output is not a completed ' + phase)
    require(raw['environment'] == request['environment'], 'environment mismatch')
    require(raw['browser']['dpr'] == 1 and raw['browser']['userAgent'], 'browser/DPR missing')
    checkpoints = raw['checkpoints']
    # Match the maintained helper's actual checkpoints, not an additional quota.
    expected = {0, len(trace)//2, len(trace)-1} if phase == 'preflight' else {0, len(trace)-1}
    require({c['index'] for c in checkpoints} == expected, 'incomplete output checkpoints')
    for c in checkpoints:
        i = c['index']
        require(same_domain(c['domain'], trace[i]['domain']), 'checkpoint camera mismatch')
        metrics = c['metrics']
        require(metrics['width'] == 900 and metrics['height'] == 600 and metrics['dpr'] == 1,
                'inner viewport mismatch')
        require(same_rect(metrics['dataRect'], reference[i]['dataRect']), 'data rectangle mismatch')
        g = c['geometry']
        require(g['visibleLandmarks'] == g['occupiedCells'] and g['occupiedCells'] > 0 and
                g['fullCapturePixels'] == 900*600, 'incomplete geometry/clip proof')
    if phase == 'measure':
        require(raw['metric'] == BOUNDARY, 'unsupported measurement boundary')
        frames = raw['frames']
        require(len(frames) == len(trace)-1 == raw['comparativeSamples'], 'incomplete moving trace')
        require(finite(raw['setup']['throughResourceInitAndFirstCompleteMs']) and
                raw['setup']['throughResourceInitAndFirstCompleteMs'] >= 0, 'setup boundary missing')
        for value in raw['inputTransfers'].values():
            require(finite(value['fetchAndHashMs']) and value['fetchAndHashMs'] >= 0 and value['bytes'] > 0,
                    'invalid input transfer cost')
        previous = None
        began = frames[0]['completedAt'] - frames[0]['completedIntervalMs']
        for i, f in enumerate(frames, 1):
            require(f['index'] == i and f['traceAtMs'] == trace[i]['atMs'] and
                    same_domain(f['domain'], trace[i]['domain']), 'frame trace/order mismatch')
            require(all(finite(f[k]) for k in ('requestedAt', 'completedAt', 'commandsAndQueueReadyAt',
                    'completedIntervalMs', 'completionLatencyMs', 'fullSurfaceReadbackMs', 'lateByMs')),
                    'missing completion/readback observation')
            require(f['requestedAt'] <= f['commandsAndQueueReadyAt'] <= f['completedAt'] and
                    f['requestedAt'] >= began and f['completedIntervalMs'] > 0 and f['lateByMs'] >= 0,
                    'invalid completed endpoint')
            require(abs(f['completionLatencyMs'] - (f['completedAt']-f['requestedAt'])) <= .001 and
                    abs(f['fullSurfaceReadbackMs'] - (f['completedAt']-f['commandsAndQueueReadyAt'])) <= .001,
                    'inconsistent observer costs')
            require(abs(f['lateByMs'] - max(0, f['requestedAt']-began-f['traceAtMs'])) <= .001 and
                    finite(raw['timeOrigin']) and finite(f['epochCompletedMs']) and
                    abs(f['epochCompletedMs']-(raw['timeOrigin']+f['completedAt'])) <= .001,
                    'inconsistent pacing/clock observation')
            if previous is not None:
                require(f['requestedAt'] >= previous and
                        abs(f['completedIntervalMs']-(f['completedAt']-previous)) <= .001,
                        'not sequential complete updates')
            endpoint = f['endpoint']
            prefix = {'vkf': ('gpu-queue-completed+native-labels-ready',
                              'canvas-command-completed+native-labels-ready'),
                      'plotly': ('Plotly.relayout promise + all native GL contexts finish',),
                      'deck': ('deck.onAfterRender + all layers loaded + native GL finish',)}[tool]
            require(any(endpoint == p + ' + full native surface readback; native SVG axes DOM complete for Plotly'
                        for p in prefix), 'unsupported full-output endpoint')
            previous = f['completedAt']


def make_rows(request, trace, parity, summary, preflights, measurements, review, problems, errors):
    """Pure report decision/cells; file integrity is supplied by load_attempt below.

    report-oracles.json is ASDATA for later ACTUAL tests of these decisions.
    There is no fixture/synthetic bypass in the CLI or normal loading path.
    """
    rows = []
    for tool, label in TOOLS.items():
        reasons = list(problems)
        raw = measurements.get(tool)
        row = dict(tool=tool, label=label, status='PENDING', completedUpdates=None,
                   pacedCompletedUpdatesPerSecond=None, completedIntervalMs=None,
                   presentationFps=None, repetitions=None, ratio=None, setup=None,
                   inputTransfers=None, readbackTotalMs=None, endpoints=[], limits=[])
        if errors.get(tool):
            reasons.extend(errors[tool])
            row['status'] = 'FAILED' if any('FAIL' in e for e in errors[tool]) else 'PENDING'
        if raw and raw.get('status') in ('FAIL', 'UNRUN'):
            reasons.append(str(raw.get('status'))+': '+str(raw.get('error', 'incomplete measurement')))
            row['status'] = 'FAILED' if raw['status'] == 'FAIL' else 'PENDING'
        if not reasons:
            try:
                require(request and trace and parity and summary, 'matched result bundle missing')
                identity = summary['identitySha256']
                require(parity['status'] == 'PASS_PARITY_PREFLIGHT' and parity['identitySha256'] == identity,
                        'current parity missing or mismatched')
                require(summary['status'] == MEASURED, 'source-only or unqualified raw index')
                require(review and review['status'] == 'PASS' and review['identitySha256'] == identity,
                        'independent matched review pending/mismatched')
                require(review['fullOutputMatched'] is True and review['nativeAxesLabelsComplete'] is True,
                        'complete matched output / actual native axis ink review pending')
                require(review['tools'][tool]['status'] == 'PASS', 'tool review not qualified')
                require(raw is not None, 'measurement missing')
                for phase, record in [('preflight', preflights.get(tool)), ('measure', raw)]:
                    require(record and record['identitySha256'] == identity, 'tool identity mismatch')
                    check_output(record, tool, phase, request, trace, parity['reference'])
                require(raw['browser'] == preflights[tool]['browser'], 'browser changed after preflight')
                if tool == 'vkf':
                    require(raw['setup']['binding'] == request['currentBinding'], 'compiler binding mismatch')
                else:
                    require(raw['setup']['version'] == summary['identity']['peerBuilds'][tool]['version'],
                            'installed tool version mismatch')
                frames = raw['frames']
                intervals = [f['completedIntervalMs'] for f in frames]
                row.update(status='MEASURED_APPLICATION_UPDATES', completedUpdates=len(frames),
                           pacedCompletedUpdatesPerSecond=len(frames)*1000/sum(intervals),
                           completedIntervalMs=intervals, setup=raw['setup'],
                           inputTransfers=raw['inputTransfers'],
                           readbackTotalMs=sum(f['fullSurfaceReadbackMs'] for f in frames),
                           endpoints=list(dict.fromkeys(f['endpoint'] for f in frames)),
                           limits=list(review['tools'][tool].get('limits', [])))
                if raw.get('presentationFps') is not None or summary.get('presentationFps') is not None:
                    row['limits'].append('Unsupported presentationFps ignored: current output has no compositor presentation evidence.')
            except (KeyError, TypeError, ValueError, IndexError, ZeroDivisionError) as e:
                reasons.append(validation_reason(e))
        row['reasons'] = reasons
        rows.append(row)
    # A missing/failed peer never becomes a complete comparative table. Genuine
    # independently qualified partial observations retain their own exact limits.
    return rows


def load_attempt(site, run, review_path, export_root, error_paths=()):
    artifacts = {}
    issues = []
    for i, file in enumerate(error_paths):
        require(file.is_file(), 'explicit attempt error log missing: '+str(file))
        artifacts['attempt-error-'+str(i)] = file
        issues.append('Failed attempt; retained error log: '+file.name)

    def read(file, key, required=False):
        if not file.is_file():
            if required:
                issues.append('Missing ' + key)
            return None
        artifacts[key] = file
        try:
            value = json.loads(file.read_text())
            require(isinstance(value, list if key == 'trace' else dict), 'wrong JSON record shape')
            return value
        except (ValueError, UnicodeError, OSError) as e:
            issues.append('Invalid ' + key + ': ' + validation_reason(e))
            return None

    # A completed export leaves its final attempt snapshot behind. That file
    # alone is never success; do not misclassify it when export.json exists.
    diagnostic = export_root/'request-failure.json'
    if not diagnostic.is_file() and not (export_root/'export.json').is_file():
        diagnostic = export_root/'request-attempt.json'
    if diagnostic.is_file():
        try:
            require(diagnostic.stat().st_size <= 128*1024, 'oversized export diagnostic')
            value = json.loads(diagnostic.read_text())
            reason = check_export_diagnostic(value, site)
            artifacts['export-diagnostic'] = diagnostic
            issues.append(reason)
        except (KeyError, TypeError, ValueError, OSError, IndexError, AttributeError, OverflowError) as e:
            # No raw link/copy for a diagnostic with an unverified body/URL or
            # extra headers/message fields. Never echo parsed exception text.
            issues.append('Rejected export diagnostic: ' + validation_reason(e))

    request = read(run/'request.json', 'request', True)
    parity = read(run/'plotting-parity.json', 'parity', True)
    summary = read(run/'plotting-raw-results.json', 'raw-results', True)
    normal_review = read(review_path, 'normal-review') if review_path else None
    review = normal_review.get('plotting') if isinstance(normal_review, dict) else None
    trace = None
    preflights, measurements, errors = {}, {}, {}
    for tool in TOOLS:
        preflights[tool] = read(run/('plotting-preflight-'+tool+'.json'), 'preflight-'+tool)
        measurements[tool] = read(run/('plotting-measure-'+tool+'.json'), 'measure-'+tool)
        errors[tool] = []
        for phase in ('preflight', 'measure'):
            error = read(run/('plotting-'+phase+'-'+tool+'.json.error.json'), phase+'-'+tool+'-error')
            if error:
                errors[tool].append(str(error.get('status', 'FAIL')) + ': ' + str(error.get('error', 'unknown error')))
    export_validated = False
    try:
        require(request and parity and summary, 'complete current result bundle unavailable')
        identity = summary['identity']
        require(identity == parity['identity'], 'raw/parity input identity differs')
        require(request['schema'] == 1 and request['status'] == 'PREPARED_UNRUN' and
                request['upstream'] == UPSTREAM, 'unrecognized source/method')
        dataset = request['dataset']
        export = read(export_root/'export.json', 'export', True)
        require(export == dataset, 'prepared/export receipt differs')
        pin_matches(request['exportReceipt'], export_root/'export.json')
        # The exact selected source contract supplies the overlap proof; discarded
        # HTTP bodies cannot be rehashed or compared from this ordinary bundle.
        _, source = export_contract(dataset)
        pin_matches(source, site/EXPORTER_PATH)
        check_export_protocol(dataset)
        check_export_files(dataset, export_root)
        export_validated = True
        for key, name in [('metadata', 'official-metadata.json'),
                          ('metadata-after', 'official-metadata-after.json')]:
            artifacts[key] = export_root/name
        require(request['viewport'] == {'width': 900, 'height': 600, 'dpr': 1}, 'unmatched inner viewport')
        q = request['quality']
        require(q['shape'] == 'circle' and abs(q['radiusCssPx']-math.sqrt(40/math.pi)) < 1e-8 and
                q['rgba'] == [70,130,180,255] and q['axes'] == 'Box' and q['grid'] == 'Lines' and
                q['clip'] == 'plot rectangle' and q['coordinates'] == 'raw degrees' and
                q['axisLabels'] == {'x': 'longitude (degrees)', 'y': 'latitude (degrees)'},
                'unmatched appearance/axes/clip')
        require(identity['environment'] == request['environment'] and all(request['environment'].get(k) is not None
                for k in ('os','cpu','ramBytes','gpu','driver','backend','displayHz','browserBuild','powerState','device')),
                'environment identity missing/mismatched')
        pin_matches(identity['request'], run/'request.json')
        require(Path(identity['request']['path']).resolve() == run/'request.json', 'different prepared attempt')
        for key, relative in SITE_INPUTS.items():
            pin_matches(identity[key], site/relative)
        for key, spec in request['files'].items():
            file = (run/spec['path']).resolve()
            require(file.is_relative_to(run), 'prepared input outside attempt')
            pin_matches(spec, file)
            pin_matches(identity['files'][key], file)
        require(request['files']['xy']['bytes'] == 8_000_000 and
                request['dataset']['files']['xy']['sha256'] == request['files']['xy']['sha256'],
                'export/position identity mismatch')
        trace_file = run/request['files']['trace']['path']
        trace = read(trace_file, 'trace', True)
        require(isinstance(trace, list) and len(trace) > 1 and
                len(parity['reference']) == len(trace), 'complete camera trace missing')
        require(all(t['index'] == i and finite(t['atMs']) and
                    (i == 0 or t['atMs'] > trace[i-1]['atMs']) and
                    len(t['domain']) == 4 and all(finite(v) for v in t['domain'])
                    for i, t in enumerate(trace)), 'invalid camera order/domain')
        policy = json.loads((site/'scripts/release-local48/plotting/peers.json').read_text())
        builds = identity['peerBuilds']
        pin_matches(builds['lockfile'], Path(builds['lockfile']['path']))
        for tool in ('plotly','deck'):
            require(all(builds[tool][k] == policy[tool][k] for k in ('package','version','integrity')),
                    'wrong peer build policy')
            pin_matches(builds[tool]['script'], Path(builds[tool]['script']['path']))
        pin_matches(summary['parity'], run/'plotting-parity.json')
        for tool in TOOLS:
            for phase, index in [('preflight', parity), ('measure', summary)]:
                spec = index['tools'][tool]
                require(spec['status'] == ('PASS_PREFLIGHT' if phase == 'preflight' else MEASURED),
                        'incomplete ' + tool + ' ' + phase)
                pin_matches(spec['pin'], run/('plotting-'+phase+'-'+tool+'.json'))
                if review:
                    require(spec['pin']['sha256'] == review['tools'][tool][phase]['sha256'] and
                            spec['pin']['bytes'] == review['tools'][tool][phase]['bytes'],
                            'independent review does not bind exact '+tool+' '+phase+' output')
        release = json.loads((site/SITE_INPUTS['release']).read_text())
        request['currentBinding'] = release['browser_binding']
    except (KeyError, TypeError, ValueError, OSError, IndexError, AttributeError) as e:
        issues.append(validation_reason(e))
    if not export_validated:
        # Do not echo or publish rejected, potentially credential-bearing query
        # bodies through JSON output or the ordinary raw artifact links.
        request = None
        artifacts.pop('request', None)
        artifacts.pop('export', None)
    rows = make_rows(request, trace, parity, summary, preflights, measurements, review, issues, errors)
    return dict(rows=rows, request=request, identitySha256=(summary or {}).get('identitySha256'),
                problems=issues, artifacts=artifacts)


def number(value):
    return format(value, '.3f') if finite(value) else 'Unavailable'


def render(report, prefix):
    esc = lambda v: html.escape(str(v), quote=True)
    link = lambda key, label: ('<a href="'+esc(prefix+'/'+report['artifacts'][key].name)+'">'+esc(label)+'</a>'
                               if key in report['artifacts'] else esc(label+' unavailable'))
    tables = ['<table id="plotting"><caption>Plotting · paced completed application updates; full output readback included</caption>'
              '<thead><tr><th scope="col">Tool / route</th><th scope="col">Status / limits</th>'
              '<th scope="col">Completed moving updates</th><th scope="col">Paced completed updates/s · includes readback</th>'
              '<th scope="col">Displayed / presentation FPS</th><th scope="col">Raw output / errors</th></tr></thead><tbody>']
    for row in report['rows']:
        status = '; '.join([row['status']]+row['reasons']+row['limits'])
        tool = row['tool']
        evidence = [link('preflight-'+tool,'Preflight'),link('measure-'+tool,'Raw updates')]
        for phase in ('preflight','measure'):
            key = phase+'-'+tool+'-error'
            if key in report['artifacts']:
                evidence.append(link(key,phase+' error'))
        tables.append('<tr><th scope="row">'+esc(row['label'])+'</th><td>'+esc(status)+'</td><td>'+
                      (str(row['completedUpdates']) if row['completedUpdates'] is not None else 'Pending')+
                      '</td><td>'+number(row['pacedCompletedUpdatesPerSecond'])+'</td><td>Unavailable</td><td>'+
                      ' · '.join(evidence)+'</td></tr>')
    tables.append('</tbody></table>')
    method = [('Method', 'Vega '+UPSTREAM+' centered zoom / alternating pan adaptation; one recorded moving trace. No peak-FPS, repetition, percentile or local ratio inferred.'),
              ('Dataset / positions', json.dumps((report['request'] or {}).get('dataset', {}), ensure_ascii=False) if report['request'] else 'Pending exact official TLC2016 first1M export.'),
              ('Viewport / quality', json.dumps({k:(report['request'] or {}).get(k) for k in ('viewport','quality')}, ensure_ascii=False)),
              ('Environment', json.dumps((report['request'] or {}).get('environment'), ensure_ascii=False)),
              ('Boundary / limits', BOUNDARY+'. Plotly SVG axis DOM completion does not prove compositor raster/presentation. Native tick/font/chrome differences retained. Software/SwiftShader is software, never physical GPU. Cross-hardware historical scores are not local ratios.'),
              ('Qualification / historical scope', 'Additional plotting scope only. Existing LOCAL48x10 and its separately scoped 12/72 accepted, 60 UNRUN, 0 comparative historical rows are unchanged. Missing/failed peers remain visible; partial application observations are not a complete comparison.'),
              ('Input / runtime identity', report.get('identitySha256') or 'Pending'),
              ('Unmeasured costs', 'Dispatch, synchronization, output encoding and separate compiler/transfer splits: null unless explicitly recorded. Setup totals include overlapping subphases; never sum them as disjoint costs.')]
    # Concise identity cells, full export requests/hashes remain in linked request.
    if report['request']:
        d = report['request'].get('dataset', {})
        method[1] = ('Candidate export receipt · qualification above', 'TLC2016 uacg-pexx; ordered first '+str(d.get('count'))+
                     '; duplicate preservation required; recorded month total '+
                     (str(d['eligibleJanuaryRows']) if d.get('eligibleJanuaryRows') is not None else 'unknown (not queried)')+
                     '; revision '+json.dumps(d.get('sourceRevision'))+'; XY SHA256 '+
                     str(d.get('files',{}).get('xy',{}).get('sha256')))
    method_html = ['<table id="plotting-method"><caption>Plotting method, environment and measured boundaries</caption><tbody>']
    for title, value in method:
        method_html.append('<tr><th scope="row">'+esc(title)+'</th><td>'+esc(value)+'</td></tr>')
    method_html.append('<tr><th scope="row">Source / raw records</th><td>'+ ' · '.join([
        '<a href="https://github.com/vega/vega-benchmarks/tree/'+UPSTREAM+'/interaction/panzoom">Vega source</a>',
        '<a href="https://plotly.com/javascript/webgl-vs-svg/">Plotly scattergl</a>',
        '<a href="https://deck.gl/docs/api-reference/core/orthographic-view">deck OrthographicView</a>',
        link('method','Adapter method'), link('request','Exact export / filter / order / quality'), link('export','Export receipt'),
        link('export-diagnostic','Export attempt / failure (not success)'),
        link('metadata','Official metadata before'), link('metadata-after','Official metadata after'),
        link('trace','Camera trace'), link('parity','Parity and source/build/runtime pins'),
        link('raw-results','Raw result index'), link('normal-review','Independent normal review')])+'</td></tr>')
    attempt_errors = [link(k, 'Attempt error: '+v.name) for k,v in report['artifacts'].items()
                      if k.startswith('attempt-error-')]
    if attempt_errors:
        method_html.append('<tr><th scope="row">Attempt errors</th><td>'+' · '.join(attempt_errors)+'</td></tr>')
    for row in report['rows']:
        setup = row['setup'] or {}
        costs = {'setupThroughFirstCompleteMs': setup.get('throughResourceInitAndFirstCompleteMs'),
                 'toolVersion': setup.get('version'), 'compilerBinding': setup.get('binding'),
                 'compileAndGuestMs': setup.get('compileAndGuestMs'), 'compilerTiming': setup.get('compilerTiming'),
                 'transferMs': setup.get('transferMs'), 'inputFetchAndHash': row['inputTransfers'],
                 'dispatchMs': None, 'synchronizationMs': None, 'outputEncodingMs': None,
                 'fullSurfaceReadbackTotalMs': row['readbackTotalMs']}
        method_html.append('<tr><th scope="row">'+esc(row['label']+' · setup / costs / endpoint')+'</th><td>'+
                           esc(json.dumps(costs, ensure_ascii=False))+'; '+esc('; '.join(row['endpoints']) or 'Endpoint pending')+'</td></tr>')
    method_html.append('</tbody></table>')
    return ''.join(tables), ''.join(method_html)


def replace_tables(page, plotting, method):
    page, n = re.subn(r'<table\b[^>]*\bid="plotting"[^>]*>.*?</table>', lambda _: plotting, page, flags=re.S)
    require(n == 1, 'exact existing plotting table required')
    page, n = re.subn(r'<table(?: id="plotting-method")?><caption>Plotting (?:method and primary sources|method, environment and measured boundaries)</caption>.*?</table>',
                      lambda _: method, page, flags=re.S)
    require(n == 1, 'exact existing plotting method table required')
    # Keep the separately scoped LOCAL48 numbers and every other table byte.
    page = page.replace('Current qualification: 12 of 72 checks passed, 60 unrun, zero comparative timing samples.',
                        'LOCAL48 qualification: 12 of 72 checks passed, 60 unrun, zero comparative timing samples.')
    page = page.replace('Plotting pan/zoom comparisons are pending; no FPS or speedup is claimed.',
                        'Additional plotting observations and qualification are tabulated below; display presentation and speedup are unmeasured.')
    return page


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--site', type=Path, required=True)
    p.add_argument('--run', type=Path, required=True, help='exact existing prepared attempt directory')
    p.add_argument('--export', type=Path, required=True, help='exact existing TLC export directory')
    p.add_argument('--review', type=Path, help='existing normal independent review JSON, optional plotting member')
    p.add_argument('--error', type=Path, action='append', default=[], help='retain an authentic export/setup error log')
    p.add_argument('--attempt', required=True, help='new raw-result directory label, no overwrite')
    p.add_argument('--format', choices=('html','json'), default='html')
    p.add_argument('--write', action='store_true', help='ACTUAL only: update existing plotting tables and retain raw links')
    args = p.parse_args()
    require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,63}', args.attempt), 'simple attempt label required')
    site, run = args.site.resolve(), args.run.resolve()
    report = load_attempt(site, run, args.review, args.export.resolve(), args.error)
    report['artifacts']['method'] = Path(__file__).with_name('REPORT.txt')
    prefix = 'benchmarks/plotting/results/'+args.attempt
    plotting, method = render(report, prefix)
    if args.write:
        page = site/'public/preview/0.7.5/performance.html'
        updated = replace_tables(page.read_text(), plotting, method)
        destination = page.parent/prefix
        destination.mkdir(parents=True, exist_ok=False)
        for file in report['artifacts'].values():
            require(not (destination/file.name).exists(), 'raw artifact basename collision')
            shutil.copyfile(file, destination/file.name)
        page.write_text(updated)
    if args.format == 'json':
        print(json.dumps({k:v for k,v in report.items() if k != 'artifacts'}, indent=2, ensure_ascii=False))
    else:
        print(plotting+'\n'+method)


if __name__ == '__main__':
    main()
