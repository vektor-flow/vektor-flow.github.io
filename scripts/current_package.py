"""Current package identity checks for the existing 0.7.5 publication workflow.

No receipt is generated here. The actual worker must supply the normal package,
whole-root consumer and existing UI/Node evidence before changing the descriptor.
Incomplete benchmark timing is disclosed separately and is not a release gate.
"""
import hashlib
import json
from pathlib import Path, PurePosixPath


def need(ok, message):
    if not ok:
        raise ValueError(message)


def read(path):
    return json.loads(path.read_bytes())


def identity(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return dict(bytes=path.stat().st_size, sha256=digest.hexdigest())


def pinned(root, row):
    name = row['path'].removeprefix('./')
    relative = PurePosixPath(name)
    need(not relative.is_absolute() and '..' not in relative.parts, 'invalid publication path')
    path = (root / relative).resolve(strict=True)
    need(path.is_relative_to(root.resolve()), 'publication path escapes preview')
    need(identity(path) == {k: row[k] for k in ('bytes', 'sha256')}, 'changed publication bytes: ' + name)
    return path


def verify_current_runtime(preview, release):
    expected = read(Path(__file__).with_name('current-package-selection.json'))
    composition = read(pinned(preview, release['current_package_composition']))
    need(composition['schema'] == 'vektor-flow.current-composition/1', 'wrong package composition')
    need(composition['inputSha256'] == expected['inputSha256'], 'wrong composition input')
    need(composition['qualification'] == 'ASSEMBLED_UNQUALIFIED', 'identity record must not be a qualification receipt')
    components = {row['id']: row for row in composition['components']}
    need(len(components) == len(composition['components']), 'duplicate component identity')
    need(components == expected['components'], 'component identity or installation changed')
    compiler = components['browser-node-compiler']
    binding = compiler['identity']['sourceBinding']
    source = compiler['identity']['sourceCommit']
    need(release['compiler_source_commit'] == source, 'wrong current compiler source')
    need(all(release[key] == binding for key in ('compiler_source', 'release_source', 'source',
                                                'frontend_binding', 'browser_binding')),
         'wrong current compiler binding')
    need(release['formatter_binding'] == expected['formatterBinding'], 'independent formatter changed')
    for row in expected['installedFiles']:
        pinned(preview, row)
    for row in compiler['files']:
        name = PurePosixPath(row['install']).name
        need(release['sha256'][name] == row['sha256'], 'descriptor compiler checksum mismatch')
        need(release['files'][name] == {k: row[k] for k in ('bytes', 'sha256')},
             'descriptor compiler file identity mismatch')
    for key, name in [('module', 'compiler.mjs'), ('wasm', 'compiler.wasm'), ('data', 'compiler.data')]:
        need(release['package'][key] == './playground/canonical/' + name + '?sha256=' + release['sha256'][name],
             'compiler URL/cache identity mismatch')
    return expected, composition, components, compiler, binding, source


def verify_current_package(preview, release):
    expected, composition, components, compiler, binding, source = verify_current_runtime(preview, release)
    scope = release['scoped_release']
    need(scope['evidence'] == release['verification']['evidence'], 'scope/evidence mismatch')
    evidence = read(pinned(preview, release['current_package_evidence']))
    need(release['current_package_evidence']['path'] == scope['evidence'], 'wrong current scope report')
    need(evidence['status'] == 'PASS_NAMED_CURRENT_ORDINARY_UI_SOURCE_EDIT_RASTER_AND_NODE_TRANSPORT',
         'existing UI/Node controls have not passed')
    need(evidence['sourceCommit'] == source and evidence['frontendBinding'] == binding
         and evidence['formatterBinding'] == expected['formatterBinding'], 'old evidence cannot qualify new compiler')
    freeze = evidence['sourceReviewFreeze']['files']
    for row in expected['installedFiles']:
        need(freeze[row['path']] == {k: row[k] for k in ('bytes', 'sha256')},
             'publication input was not frozen for affected checks: ' + row['path'])
    browser = evidence['normalUiSourceEdit']
    need(browser['status'] == 'CURRENT_SMALL_SIN_COMPLETE' and browser['browserClosed']
         and browser['serverClosed'], 'existing browser control incomplete')
    rows = browser['result']['rows']
    need([row['name'] for row in rows] == ['unprimed', 'initialized-repeat', 'real-source-edit'],
         'original source-edit controls changed')
    for row in rows:
        need(row['actualBinding'] == binding and row['pointCount'] == 1025
             and row['maxNumericalError'] <= 1e-5 and row['maxXError'] <= 1e-7
             and any(o['nonblankPixels'] > 0 and o['draws'] > 0 for o in row['observations']),
             'original complete numerical/raster oracle failed')
    need(rows[1]['arenaHashes'] != rows[2]['arenaHashes']
         and rows[1]['rasterHashes'] != rows[2]['rasterHashes'], 'source edit did not change output')
    node = evidence['normalNodeESM']
    need(node['status'] == 'PASS_NORMAL_NODE_ESM_PACKAGE_COMPILE_EXECUTE_STDOUT'
         and node['stdout'] == '7\n' and node['frontendBinding'] == binding
         and node['formatterBinding'] == expected['formatterBinding'], 'normal Node transport failed')
    package = evidence['packageComposition']
    need(package['inputSha256'] == composition['inputSha256'], 'package checks used another composition')
    need(len(package['sourceInventorySha256']) == 64, 'whole-root source identity missing')
    # References point to actual joined commands and the normal Vitest JSON,
    # rather than interpreting an assembly/readiness flag as a test result.
    joined = read(pinned(preview, package['packageTestJoin']))
    need(joined['exit'] == 0 and joined['childJoined'] is True
         and joined.get('reserveRefusal') is None, 'normal test:package incomplete')
    need(joined['command'] == ['npm', 'run', 'test:package'], 'normal package oracle replaced')
    bank = read(pinned(preview, package['consumerBank']))
    need(bank['success'] is True and bank['numFailedTests'] == 0
         and bank['numPendingTests'] == 0 and bank['numPassedTests'] >= 1500
         and len(bank['testResults']) == 210, 'changed whole-root consumer bank incomplete')
    need(package['consumerSourceInventorySha256'] == package['sourceInventorySha256'],
         'consumer checked another root')
    seam_join = read(pinned(preview, package['nativePublicWasmJoin']))
    need(seam_join['exit'] == 0 and seam_join['childJoined'] is True
         and seam_join.get('reserveRefusal') is None, 'native/public-WASM seam incomplete')
    seam = read(pinned(preview, package['nativePublicWasmResults']))
    need(seam['native_setup']['sha256'] == expected['nativeCliSha256']
         and seam['wasm_setup']['sha256'] == expected['symbolicGuestSha256'],
         'native/public-WASM identities were pooled')
    need([row['id'] for row in seam['rows']] ==
         ['inverse-distance', 'sine', 'source-original', 'source-edit']
         and all(row['status'] == 'PASS' and row['agreement'] == 'PASS' for row in seam['rows']),
         'existing authored native/public-WASM oracle failed')
    archive = package['archive']
    need(len(archive['sha256']) == 64 and archive['integrity'].startswith('sha512-'), 'npm archive integrity missing')
    # Timings remain descriptive. Preserve all missing/failed current rows;
    # do not require 48+24 or any comparative sample quota for scoped shipping.
    for key, total in [('matchedPreflights', 48), ('nativeWasmParity', 24)]:
        counts = scope[key]
        need(all(type(counts[k]) is int and counts[k] >= 0 for k in ('passed', 'failed', 'unrun'))
             and sum(counts[k] for k in ('passed', 'failed', 'unrun')) == total
             and counts['total'] == total, 'incorrect benchmark disclosure')
    need(scope['comparativeBenchmarksQualified'] is False, 'unqualified timing claim')
    starter = release['current_package_starter']
    pinned(preview, starter)
    return {PurePosixPath(row['install']).name: row['sha256'] for row in compiler['files']}


def verify_current_review_site(preview, release):
    expected, composition, components, compiler, binding, source = verify_current_runtime(preview, release)
    mode = release['site_review_iteration']
    need(mode['enabled'] is True and mode['downloadsOffered'] is False, 'explicit no-download review mode required')
    need(release['download_packages_offered'] is False and release['release_qualified'] is False, 'review mode cannot claim release/download qualification')
    report = read(pinned(preview, release['current_review_site_evidence']))
    need(report['status'] == 'PASS_FOCUSED_CURRENT_REVIEW_SITE_WEB_CHECKS', 'current focused review-site controls incomplete')
    need(report['frontendBinding'] == binding and report['sourceCommit'] == source, 'review evidence runtime mismatch')
    need(report['browserClosed'] and report['serverClosed'] and report['noNewDownloads'], 'review browser/download checks incomplete')
    need(report['changedSourceChecks'] and all(row['passed'] is True for row in report['changedSourceChecks']), 'changed source/full output controls incomplete')
    need(all(report['presentation'][key] is True for key in ['initialOutputs', 'runReplacesOutput', 'prismIndices', 'plainCopy', 'realEdit', 'mobileOneRowMenu', 'anchors', 'noDownloads']), 'review presentation controls incomplete')
    for row in report['sourceFreeze']['files']:
        pinned(preview, row)
    baseline = read(Path(__file__).with_name('review-site-download-baseline.json'))
    root = preview.parents[1]
    actual = {p.relative_to(root).as_posix(): identity(p) for p in root.rglob('*') if p.is_file() and 'downloads' in p.relative_to(root).parts}
    need(actual == baseline['files'], 'review iteration must preserve existing downloads without adding artifacts')
    return {Path(row['install']).name: row['sha256'] for row in compiler['files']}
