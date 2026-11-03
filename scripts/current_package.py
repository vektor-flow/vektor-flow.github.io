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
    required_identity_mode = 'IDENTITY_ONLY_NOT_A_TEST_RECEIPT' if expected['schema'] == 2 else 'ASSEMBLED_UNQUALIFIED'
    need(composition['qualification'] == required_identity_mode, 'identity record must not be a qualification receipt')
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
        name = row['path'].removeprefix('playground/canonical/') if expected['schema'] == 2 else PurePosixPath(row['install']).name
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
    offers_pinned = mode.get('downloadsOffered') is True
    qualified_replacement = False
    need(mode['enabled'] is True and type(mode.get('downloadsOffered')) is bool, 'explicit review download policy required')
    need(release['download_packages_offered'] is offers_pinned and release['release_qualified'] is False, 'download availability cannot imply full release qualification')
    if offers_pinned:
        policy = read(Path(__file__).with_name('review-site-policy.json'))
        need(policy['mode'] == 'website-review-pinned-downloads' and policy['downloadsEnabled'] is True and policy['fullReleaseQualified'] is False, 'pinned download policy mismatch')
        offer = release['pinned_downloads']
        checksums = read(preview / offer['checksums'])
        need(checksums['fullReleaseQualified'] is False, 'archive full release remains unqualified')
        need(set(offer['archives']) == {row['path'] for row in checksums['archives']}, 'offered archive selection mismatch')
        for row in checksums['archives']:
            pinned(preview, row)
        if checksums.get('currentQualification'):
            current = read(pinned(preview, checksums['currentQualification']))
            need(current['status'] == 'PASS_SCOPED_CURRENT_ARCHIVES_EXTRACTED_NATIVE_NODE_INSTALL_RUN_COMPILE_SECURITY_INTEGRITY', 'current archive checks incomplete')
            record = current['record']
            native = components['native-linux-cli']['identity']
            host = compiler['identity']
            need(expected['schema'] == 2 and record['schema'] == 'vektor-flow.current075-qualified-scopes-package/1', 'current archive identity schema')
            need(checksums['compilerBinding'] == record['browserBinding'] == binding
                 and record['sourceCommit'] == source, 'current archive/compiler identities differ')
            need(record['pairedLibrarySourceCommit'] == checksums['pairedLibrarySourceCommit']
                 == native['pairedLibrarySourceCommit'] == host.get('pairedLibrarySourceCommit', source),
                 'current archive/library identities differ')
            need(checksums['nativeBinding'] == record['nativeBinding'] == native['sourceBinding']
                 and record['nativeBinarySourceCommit'] == native['sourceCommit'], 'native binary identity differs')
            need(record['pairedManifest']['sha256'] == native['pairedManifestSHA256'], 'native paired manifest differs')
            need(record['hostSourceCommit'] == checksums['nodePackageHostSourceCommit'] == host['nodePackageHostSourceCommit']
                 and current['durableHostSourceCommit'] == host['nodePackageHostDurableSourceCommit']
                 and ((host['nodePackageHostSourceCommit'] == '96d0ff9831a09740b30d05f3d3a64f4ab61a8c87' and current['all13ExtractedHostMembersEqualMaintained96d'] is True) or (current.get('maintainedHostSourceCommit') == host['nodePackageHostSourceCommit'] and current.get('all13ExtractedHostMembersEqualMaintainedSource') is True and current.get('all13ExtractedHostMembersEqualMaintained96d') is False)), 'qualified Node host differs')
            need(record['formatterBinding'] == expected['formatterBinding'], 'qualified independent formatter differs')
            need(all(record[key] is False for key in ('fullReleaseClaim', 'nativeSDKClaim', 'physicalGPUClaim', 'benchmarkClaim')),
                 'scoped archives cannot qualify a full release')
            need(checksums['archives'] == expected['archives']
                 and sorted(row['target'] for row in checksums['archives']) == ['canonical', 'native'],
                 'current archive target/selection mismatch')
            for archive in checksums['archives']:
                target = current[archive['target']]
                actual = target['archive']
                need(target['target'] == archive['target'] and target['safeExtraction'] is True
                     and target['allArchiveMembersMatchCheckedInputs'] is True, 'current archive member checks incomplete')
                need(PurePosixPath(archive['path']).name == PurePosixPath(actual['path']).name
                     and all(archive[k] == actual[k] for k in ('bytes', 'sha256')), 'current archive differs from qualification')
                entries = {row['path']: {k: row[k] for k in ('bytes', 'sha256')} for row in target['entries']}
                need(len(entries) == len(target['entries']), 'duplicate qualified archive member')
                if archive['target'] == 'native':
                    need(entries['bin/vkf']['sha256'] == native['binarySHA256']
                         and entries['PAIRED-STDLIB-MANIFEST.json'] == {k: record['pairedManifest'][k] for k in ('bytes', 'sha256')},
                         'qualified native binary/library members differ')
                else:
                    # The site adds only these three hash-addressed URLs to the
                    # ordinary Node wrapper; README/package.json are site metadata.
                    wrapper = (preview / 'playground/canonical/compiler.mjs').read_text()
                    for name in ('compiler-base.mjs', 'formatter.mjs', 'formatter.wasm'):
                        wrapper = wrapper.replace('./' + name + '?sha256=' + release['sha256'][name], './' + name)
                    wrapper = wrapper.encode()
                    need(entries['compiler.mjs'] == dict(bytes=len(wrapper), sha256=hashlib.sha256(wrapper).hexdigest()),
                         'qualified canonical wrapper differs beyond cache URLs')
                    for row in compiler['files']:
                        name = row['path'].removeprefix('playground/canonical/')
                        if name not in ('README.txt', 'package.json', 'compiler.mjs'):
                            need(entries[name] == {k: row[k] for k in ('bytes', 'sha256')}, 'qualified canonical member differs: ' + name)
            qualified_replacement = True
        else:
            need(checksums['compilerBinding'] != binding, 'earlier archive must not be relabeled as current website compiler')
    report = read(pinned(preview, release['current_review_site_evidence']))
    if mode.get('runEnabled') is False:
        need(mode.get('latestCompilerRequired') is True and mode.get('latestCompilerRunStatus') == 'UNRUN', 'latest compiler must remain deferred')
        need(report['status'] == 'PASS_FOCUSED_DISABLED_REVIEW_SITE_WEB_CHECKS', 'disabled review-site controls incomplete')
        need(report['browserClosed'] and report['serverClosed'] and report['noNewDownloads'], 'disabled review cleanup/download checks incomplete')
        need(report['latestCompilerRunStatus'] == 'UNRUN', 'disabled review cannot qualify compiler execution')
        need(all(report['disabledControls'][key] is True for key in ['nativeDisabled', 'keyboardAndSyntheticBlocked', 'pendingRunCleared', 'noWorkerOrCompilerInit', 'copyAndEdit', 'phoneMenuAndFlow', 'anchors']), 'disabled review controls incomplete')
        for row in report['sourceFreeze']['files']:
            pinned(preview, row)
        baseline = read(Path(__file__).with_name('review-site-download-baseline.json'))
        root = preview.parents[1]
        actual = {p.relative_to(root).as_posix(): identity(p) for p in root.rglob('*') if p.is_file() and 'downloads' in p.relative_to(root).parts}
        need(actual == baseline['files'], 'review iteration must preserve existing downloads without adding artifacts')
        return {(row['path'].removeprefix('playground/canonical/') if expected['schema'] == 2 else Path(row['install']).name): row['sha256'] for row in compiler['files']}
    need(report['status'] == 'PASS_FOCUSED_CURRENT_REVIEW_SITE_WEB_CHECKS', 'current focused review-site controls incomplete')
    need(report['frontendBinding'] == binding and report['sourceCommit'] == source, 'review evidence runtime mismatch')
    need(report['browserClosed'] and report['serverClosed'] and (report.get('noNewDownloads') is True or (report.get('qualifiedDownloadReplacement') is True and qualified_replacement)), 'review browser/download checks incomplete')
    need(report['changedSourceChecks'] and all(row['passed'] is True for row in report['changedSourceChecks']), 'changed source/full output controls incomplete')
    need(all(report['presentation'][key] is True for key in ['initialOutputs', 'runReplacesOutput', 'prismIndices', 'plainCopy', 'realEdit', 'mobileOneRowMenu', 'anchors', 'pinnedDownloads' if offers_pinned else 'noDownloads']), 'review presentation controls incomplete')
    for row in report['sourceFreeze']['files']:
        pinned(preview, row)
    baseline = read(Path(__file__).with_name('review-site-download-baseline.json'))
    root = preview.parents[1]
    actual = {p.relative_to(root).as_posix(): identity(p) for p in root.rglob('*') if p.is_file() and 'downloads' in p.relative_to(root).parts}
    need(actual == baseline['files'], 'review iteration must preserve existing downloads without adding artifacts')
    return {(row['path'].removeprefix('playground/canonical/') if expected['schema'] == 2 else Path(row['install']).name): row['sha256'] for row in compiler['files']}
