#!/usr/bin/env python3
"""ACTUAL-only adapter from attach.mjs outputs to the existing Performance tables.

No benchmark execution, dependency imports, browser, hosting or release gate.
Without --write this prints a reviewable fragment (or --format json oracle data).
"""
import argparse
import hashlib
import html
import json
import math
from pathlib import Path
import re
import shutil

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


def require(condition, label):
    if not condition:
        raise ValueError(label)


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
                reasons.append(str(e))
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
            issues.append('Invalid ' + key + ': ' + str(e))
            return None

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
        require(dataset['status'] == 'EXPORTED_NOT_BENCHMARKED' and dataset['dataset'] == 'uacg-pexx' and
                dataset['count'] == dataset['chosenRows'] == 1_000_000,
                'complete official first1M export missing')
        require(dataset['completeness']['pageSize'] == 50_000 and
                dataset['completeness']['completePages'] == 20 and
                dataset['completeness']['offsets'] == list(range(0, 1_000_000, 50_000)),
                'incomplete ordered export')
        # Use the existing exporter method constants, without importing/running it.
        require(dataset['order'] == 'tpep_pickup_datetime ASC,:id ASC' and
                dataset['select'] == ':id AS source_row_id,tpep_pickup_datetime,pickup_longitude,pickup_latitude' and
                dataset['where'] == ("tpep_pickup_datetime >= '2016-01-01T00:00:00' AND "
                "tpep_pickup_datetime < '2016-02-01T00:00:00' AND "
                'pickup_longitude BETWEEN -74.3 AND -73.65 AND pickup_latitude BETWEEN 40.45 AND 40.95'),
                'different population/filter/order')
        require(all(dataset['sourceRevision'].get(k) is not None for k in
                    ('rowsUpdatedAt', 'viewLastModified', 'tableId')), 'dataset revision missing')
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
    except (KeyError, TypeError, ValueError, OSError) as e:
        issues.append(str(e))
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
