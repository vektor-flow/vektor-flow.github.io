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


def verify_current_node_archive(preview, release, expected, compiler, binding, source, checksums, current):
    """Exact extracted Node preview scope; historical native proof stays separate."""
    import tarfile
    candidate = current['candidate']
    need(candidate['compilerBinding'] == checksums['compilerBinding'] == binding
         and candidate['formatterBinding'] == checksums['formatterBinding'] == release['formatter_binding']
         and candidate['sourceAssociation'] == source
         and candidate['sourceCompositionBinding'] == release['current_scene_source_composition']['sourceCompositionBinding'],
         'extracted preview candidate differs')
    need(current['safeExtraction'] and current['all29MembersUnchanged']
         and current['archiveMembers'] == 29 and current['unchangedSixExecutables']
         and current['pendingArchiveMetadataIntentionallyUnchanged'], 'extracted preview integrity incomplete')
    need(current['install'] == dict(status='SOURCES_READY', exit=0)
         and current['run']['exit'] == 0 and current['run']['all271BytesExact']
         and current['run']['stdout'] == current['oracle'] == dict(bytes=271, sha256='a585f5b0df27d2bb459ec2fc033b5ea38de50bce304a154160d46fc398804c28')
         and current['source'] == dict(bytes=660, sha256='f808342aac7636e13c65a70b4737d49d1badd2c2e953e9ce706eebdb204bf1e0')
         and current['compile'] == dict(status='COMPILED', exit=0, sourceBinding=binding)
         and current['lock'] == dict(stable=True, bytes=172, sha256='615c8e8d2f2943850bb9da30c2fbed1a7c9d17bfcf17978f3c16eda7cd78a39b'),
         'extracted preview install/run/compile/oracle/lock failed')
    security = current['security']
    need([security[k] for k in ('tests', 'passed', 'failed', 'skipped', 'cancelled')] == [30, 30, 0, 0, 0]
         and security['compilerImportMandatory'] is True
         and security['realCompilerGitImportExpected'] == [7, 9, 5, 7], 'extracted preview security incomplete')
    final = read(pinned(preview, checksums['finalArchiveIntegrity']))
    need(final['archiveAndAll29ExtractedMembersUnchanged'] and final['sixExecutablesUnchanged']
         and final['securityTestsAndExtractedHostHelperUnchanged']
         and final['entries'] == current['entries'], 'final extracted preview changed')
    archives = checksums['archives']
    need(len(archives) == 2 and [r['target'] for r in archives] == ['canonical', 'native'], 'preview target selection')
    canonical, native = archives
    for actual in (current['archive'], final['archive']):
        need(PurePosixPath(canonical['path']).name == PurePosixPath(actual['path']).name
             and all(canonical[k] == actual[k] for k in ('bytes', 'sha256')), 'archive differs from tested bytes')
    previous = read(pinned(preview, checksums['historicalChecksums']))
    historical = read(pinned(preview, checksums['historicalQualification']))
    need(native == historical['nativeArchive'] == next(r for r in expected['archives'] if r['target'] == 'native')
         and native == next(r for r in previous['archives'] if r['target'] == 'native')
         and checksums['nativeBinding'] == previous['nativeBinding'], 'historical native target changed')
    for row in previous['archives']:
        pinned(preview, row)
    entries = {r['path']: {k: r[k] for k in ('bytes', 'sha256')} for r in current['entries']}
    need(len(entries) == len(current['entries']) == 29, 'duplicate or missing preview member')
    archive = pinned(preview, canonical)
    with tarfile.open(archive, 'r:gz') as tar:
        members = tar.getmembers()
        # One common directory, 29 regular files, no links/traversal/duplicates.
        names = [PurePosixPath(m.name) for m in members]
        need(len(members) == len(set(str(n) for n in names)) == 29
             and all(m.isfile() and not n.is_absolute() and '..' not in n.parts and len(n.parts) >= 2 for m, n in zip(members, names))
             and len({n.parts[0] for n in names}) == 1, 'unsafe preview archive roster')
        need({'/'.join(n.parts[1:]) for n in names} == set(entries), 'preview archive members differ')
        for member, name in zip(members, names):
            name = '/'.join(name.parts[1:]); data = tar.extractfile(member).read()
            need(entries[name] == dict(bytes=len(data), sha256=hashlib.sha256(data).hexdigest()), 'preview archive member changed: ' + name)
            if name != 'LICENSE.txt':
                need(identity(preview / 'playground/canonical' / name) == entries[name], 'installed preview package differs: ' + name)
    for row in compiler['files']:
        need(entries[row['path'].removeprefix('playground/canonical/')] == {k: row[k] for k in ('bytes', 'sha256')}, 'current runtime/archive differs')


def verify_current_review_site(preview, release):
    expected, composition, components, compiler, binding, source = verify_current_runtime(preview, release)
    mode = release['site_review_iteration']
    offers_pinned = mode.get('downloadsOffered') is True
    qualified_replacement = False
    download_delta = {}
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
            if current['status'] == 'CURRENT_LOCAL_ARCHIVE_EXTRACTED_NODE_IMPORT_SECURITY_PASS':
                need(offer['checksums'] == release['current_distribution_checksums']['path'], 'download checksum path differs')
                pinned(preview, release['current_distribution_checksums'])
                verify_current_node_archive(preview, release, expected, compiler, binding, source, checksums, current)
                qualified_replacement = True
                download_delta = {'preview/0.7.5/' + row['path']: {k: row[k] for k in ('bytes', 'sha256')}
                                  for row in [release['current_distribution_checksums'], checksums['archives'][0]]}
            else:
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
    allowed = dict(baseline['files'])
    allowed.update(download_delta)
    need(actual == allowed, 'review iteration changed unqualified downloads')
    if release.get('scoped_release'):
        scope = release['scoped_release']
        need(scope['version'] == '0.7.5' and scope['status'] == 'stable'
             and scope['stable'] is True and scope['published'] is True, 'invalid scoped stable designation')
        need(scope['components'] == ['browser-WASM compiler and independent formatter', 'ordinary retained plotting', 'Node ESM compiler/guest/formatter embedding'], 'scoped components changed')
        need(all(scope[k] is False for k in ('linuxCompilerSDKQualified', 'crossTargetParityQualified', 'comparativeBenchmarksQualified', 'fullGpuWorldQualified', 'physicalGPUQualified', 'phoneEX06LegibilityQualified', 'fullPlatformReleaseQualified')), 'unsupported scoped release claim')
        qualified = read(pinned(preview, scope['evidence']))
        need(qualified['status'] == 'PASS_SCOPED_STABLE_075_UI_PLOTTING_AND_NODE_CONSOLE'
             and qualified['frontendBinding'] == binding and qualified['formatterBinding'] == expected['formatterBinding'], 'scoped qualification identity differs')
        need(qualified['currentLocalWeb'] == release['current_review_site_evidence'] and qualified_replacement, 'current web/package scope incomplete')
        checks = {name: read(pinned(preview, row)) for name, row in qualified['localControls'].items()}
        need(checks['formatter']['status'] == 'PASS_INCREMENTAL_FORMATTER_SMALL_PARITY_AND_ORIGINAL5M_FULL_CORRECTNESS'
             and checks['formatter']['browserBinding'] == binding and checks['formatter']['formatterBinding'] == expected['formatterBinding'], 'current formatter correctness incomplete')
        for name, status in [('smallSin', 'CURRENT_SMALL_SIN_COMPLETE'), ('original5M', 'CURRENT_EXACT5M_COMPLETE'), ('original10000', 'CURRENT_ORIGINAL10000_COMPLETE')]:
            need(checks[name]['status'] == status and checks[name]['browserClosed'] and checks[name]['serverClosed'], 'local plotting control incomplete: ' + name)
        need(qualified['localControls']['package'] == checksums['currentQualification'], 'scoped package reference differs')
        live = read(pinned(preview, qualified['hosted']))
        delivered = read(pinned(preview, qualified['delivery']))
        need(live['status'] == 'PASS_FOCUSED_CURRENT_REVIEW_SITE_WEB_CHECKS' and live['hosted']
             and live['browserClosed'] and live['serverClosed'] and not live['errors'], 'hosted ordinary controls incomplete')
        need([r['actual']['text'] for r in live['rows']] == ['Hello World\n', 'Hello World\n7\n'], 'hosted Run/edit output differs')
        need(delivered['status'] == 'PASS_EXACT_PUBLISHED_HEAD_PAGES_SERVED_CURRENT_BYTES_AND_EXISTING_ORDINARY_LIVE_WEB_CONTROLS'
             and delivered['head'] == delivered['remoteHead'] == delivered['localHead'] == qualified['qualifiedDeliveredHead']
             and delivered['pagesRun']['headSha'] == delivered['head'] and delivered['pagesRun']['conclusion'] == 'success', 'exact delivered base incomplete')
        need(len(delivered['oldMediaWithdrawal']) == 4 and all(r['absent'] and r['httpStatus'] in (404,410) for r in delivered['oldMediaWithdrawal']), 'withdrawn media absence incomplete')
        need(len(qualified['runtime']) == 11 and qualified['runtime'] == live['servedIdentity'] == delivered['servedCompilerFormatterRendererNativePlotMapping'], 'scoped runtime evidence differs')
        for row in qualified['runtime']:
            pinned(preview, row)
    return {(row['path'].removeprefix('playground/canonical/') if expected['schema'] == 2 else Path(row['install']).name): row['sha256'] for row in compiler['files']}
