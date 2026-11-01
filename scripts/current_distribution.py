"""Verify the exact canonical/retained/native distribution's named scope.

The former assembled root package verifier remains available for that different
artifact. These checks require actual current evidence and keep raw failures.
"""
import hashlib
import json
import tarfile
from pathlib import Path
from current_package import need, read, pinned


def verify_current_distribution(preview, release):
    expected = read(Path(__file__).with_name('current-package-selection.json'))
    composition = read(pinned(preview, release['current_package_composition']))
    need(expected['schema'] == 2 and composition['schema'] == 'vektor-flow.current-composition/1', 'distribution identity schema')
    need(composition['qualification'] == 'IDENTITY_ONLY_NOT_A_TEST_RECEIPT', 'composition is not test evidence')
    components = {r['id']: r for r in composition['components']}
    need(len(components) == len(composition['components']) and components == expected['components'], 'distribution component selection changed')
    digest = hashlib.sha256(json.dumps(composition['components'], sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    need(digest == composition['inputSha256'] == expected['inputSha256'], 'distribution composition checksum')
    for row in expected['installedFiles']:
        pinned(preview, row)
    compiler = components['browser-node-compiler']
    binding = compiler['identity']['sourceBinding']
    source = compiler['identity']['sourceCommit']
    need(source == release['compiler_source_commit'] and all(release[k] == binding for k in ['compiler_source', 'release_source', 'source', 'frontend_binding', 'browser_binding']), 'compiler source/binding selection')
    need(release['formatter_binding'] == expected['formatterBinding'], 'independent formatter identity')
    for row in compiler['files']:
        name = row['path'].removeprefix('playground/canonical/')
        need(release['sha256'][name] == row['sha256'] and release['files'][name] == {k: row[k] for k in ('bytes', 'sha256')}, 'compiler closure identity ' + name)
    need(len(compiler['files']) == 19, 'incomplete established canonical closure')
    for key, name in [('module', 'compiler.mjs'), ('wasm', 'compiler.wasm'), ('data', 'compiler.data')]:
        need(release['package'][key] == './playground/canonical/' + name + '?sha256=' + release['sha256'][name], 'package URL/cache identity')
    mode = release['current_distribution']
    need(mode['enabled'] and mode['runEnabled'] and mode['downloadsOffered'] and not mode['fullReleaseQualified'] and not mode['sharedUploadAvailable'], 'incoherent named distribution mode')
    need(release['download_packages_offered'] and not any(release[k] for k in ['complete', 'stable', 'stable_release', 'release_qualified']), 'overstated full release')
    checksums = read(pinned(preview, release['current_distribution_checksums']))
    need(checksums['archives'] == expected['archives'] and checksums['compilerBinding'] == binding and not checksums['fullReleaseQualified'], 'download checksum selection')
    for row in checksums['archives']:
        archive = pinned(preview, row)
        with tarfile.open(archive, 'r:gz') as tar:
            members = tar.getmembers()
            need(all(m.isfile() and not m.name.startswith('/') and '..' not in Path(m.name).parts for m in members), 'archive paths/type')
            if row['target'] == 'canonical':
                expected_members = {'vkf-canonical-0.7.5-current/' + f['path'].removeprefix('playground/canonical/'): f for f in compiler['files']}
                need(set(m.name for m in members) == set(expected_members) | {'vkf-canonical-0.7.5-current/README.txt', 'vkf-canonical-0.7.5-current/VERIFICATION.json'} | {'vkf-canonical-0.7.5-current/third-party/' + Path(n['path']).name for n in expected['notices']}, 'canonical archive closure')
                for name, pin in expected_members.items():
                    data = tar.extractfile(name).read()
                    need(len(data) == pin['bytes'] and hashlib.sha256(data).hexdigest() == pin['sha256'], 'archive member mismatch ' + name)
            else:
                need(row['target'] == 'native' and not any('.vkfbuild' in Path(m.name).parts for m in members), 'native clean archive caches')
                binary = tar.extractfile('vkf-native-linux-x86_64-0.7.5-current/bin/vkf').read()
                need(hashlib.sha256(binary).hexdigest() == components['native-linux-cli']['identity']['binarySHA256'], 'native binary/target identity')
    for row in checksums['archives']:
        prefix = 'vkf-canonical-0.7.5-current' if row['target'] == 'canonical' else 'vkf-native-linux-x86_64-0.7.5-current'
        with tarfile.open(pinned(preview, row), 'r:gz') as tar:
            for notice in expected['notices']:
                data = tar.extractfile(prefix + '/third-party/' + Path(notice['path']).name).read()
                need(len(data) == notice['bytes'] and hashlib.sha256(data).hexdigest() == notice['sha256'], 'existing third-party notice changed')
    policy = read(Path(__file__).with_name('review-site-policy.json'))
    need(policy['mode'] == 'current-named-distribution' and policy['downloadsEnabled'] and not policy['fullReleaseQualified'], 'current distribution policy mismatch')
    prior = read(pinned(preview, release['current_candidate_verification']))
    need(prior['browser']['binding'] == binding and prior['browser']['sourceCommit'] == source and prior['browser']['hostCommit'] == components['retained-browser-host']['identity']['sourceCommit'], 'accepted browser compiler/host differs')
    repair = read(pinned(preview, release['current_runtime_repair']))
    runtime = components['retained-ui-runtime']['identity']
    need(prior['browser']['runtimeSHA256'] == runtime['baseRuntimeSHA256'] == repair['baseSHA256'] and runtime['runtimeSHA256'] == repair['current']['sha256'] and runtime['repairSHA256'] == repair['patch']['sha256'], 'reviewed causal runtime repair differs')
    need(all(prior['browser'][k] for k in ['parameterFunctionalPASS', 'widgetLifecyclePASS', 'ordinaryEditorPlotPASS']), 'current named browser qualification')
    need(all(r['wholeCanvasPNGEqual'] and r['actualSHA256'] == r['referenceSHA256'] for r in prior['browser']['wholeCanvasPNGComparisons']), 'accepted complete raster oracles')
    need(prior['core']['browserBinding'] == binding and prior['core']['hostCommit'] == prior['browser']['hostCommit'] and prior['core']['status'] == 'ACCEPTED_EXACT_CANDIDATE_BY_REFERENCE', 'current core acceptance')
    native = prior['native']
    need(native['binding'] == components['native-linux-cli']['identity']['sourceBinding'] and native['sourceCommit'] == components['native-linux-cli']['identity']['sourceCommit'], 'native separate target binding')
    need(native['currentObjects'] == 240 and native['pairedSourcesInstalledAndByteVerified'] == 32 and native['programsPassed'] == 20 and native['oracleSamples'] == 83 and native['scalarOracleComparisons'] == 1050 and native['addressCLI']['status'] == 'PASS', 'accepted native scope')
    evidence = read(pinned(preview, release['current_distribution_evidence']))
    need(evidence['compositionInputSHA256'] == composition['inputSha256'] and evidence['binding'] == binding, 'affected checks used different source')
    frozen = {row['path']: row for row in evidence['sourceFreeze']}
    need(all(frozen.get(row['path']) == row for row in expected['installedFiles']), 'affected tests did not freeze installed current bytes')
    for row in evidence['sourceFreeze']:
        pinned(preview, row)
    site = read(pinned(preview, evidence['siteControls']))
    need(site['status'] == 'PASS_CURRENT_AFFECTED_SITE_RUN_EDIT_COPY_MOBILE_DOWNLOADS' and site['binding'] == binding and site['browserClosed'] and site['serverClosed'] and not site['pageErrors'], 'affected site controls failed')
    required = {'ordinary-browsing-no-compiler-init', 'existing-three-authored-numpy-comparisons-current-run-exact-stdout', 'real-editor-edit-invalidates-and-replaces-output-plain-copy-and-prism', 'current-home-run-retained-canvas', 'current-home-real-edit-disposes-and-rerenders', 'phone-menu-download-navigation-and-no-overflow', 'frozen-canonical-and-native-clean-download-size-sha-links'}
    need(required <= {r['name'] for r in site['checks'] if r['passed']}, 'affected site controls incomplete')
    need(len(site['executions']) == 3 and all(r['binding'] == binding and r['stdout'] == r['expected'] for r in site['executions']), 'authored current output mismatch')
    small = read(pinned(preview, evidence['originalSmallSin']))
    need(small['status'] == 'CURRENT_SMALL_SIN_COMPLETE' and small['browserClosed'] and small['serverClosed'], 'original 1025 control incomplete')
    rows = small['result']['rows']
    need([r['name'] for r in rows] == ['unprimed', 'initialized-repeat', 'real-source-edit'], 'original editor controls changed')
    need(all(r['actualBinding'] == binding and r['pointCount'] == 1025 and r['maxNumericalError'] <= 1e-5 and r['maxXError'] <= 1e-7 and any(o['nonblankPixels'] > 0 and o['draws'] > 0 for o in r['observations']) for r in rows), 'original complete numerical/raster oracle')
    need(rows[1]['arenaHashes'] != rows[2]['arenaHashes'] and rows[1]['rasterHashes'] != rows[2]['rasterHashes'], 'source edit output unchanged')
    scale = read(pinned(preview, evidence['current5m']))
    need(scale['sourceBinding'] == binding and scale['source']['sha256'] == '0da4371815759460a8b870d8c909c998c5dfd8b87973ca4726fd80973df9d6dc', 'original exact 5M input changed')
    need(scale['packet']['bytes'] == 220000000 and scale['packet']['sha256'] == '7b399599afa7e69ee508b0c6afe0fb9f0621e971c3d30a7d04a1c434fda00c24' and scale['metadataCompleteEqualToAcceptedInput'], 'current full output mismatch')
    render = read(pinned(preview, evidence['current5mRender']))
    result = render['result']
    need(render['browserClosed'] and render['serverClosed'] and result['status'] == 'COMPLETE_REAL_STATIC_RETAINED_RENDER_VIEW_COLOR' and result['actualBinding'] == binding and result['population'] == result['indexCount'] == 5000000 and result['allChannels'] == 50000000 and result['maxError'] < 1e-6, 'original 5M complete render/numeric control')
    need(len(result['updates']) == 3 and len({r['pixelHash'] for r in result['updates']}) > 1 and not result['gpuErrors'] and not result['deviceLost'], 'actual 5M view completion')
    need(result['colorUpdate']['after']['pixelHash'] != result['colorUpdate']['before']['pixelHash'] and result['colorUpdate']['after']['rSum'] > result['colorUpdate']['after']['bSum'] and result['colorUpdate']['actualRuntimePacket'], 'actual 5M color correctness')
    need(not render['pageErrors'], 'current renderer text/output errors')
    need(len(result['generatedAxisOverlayRows']) == 5 and all(all(any(n['text'] == name for n in labels) for name in ['$x$', '$y$', '$z$']) for labels in result['generatedAxisOverlayRows']), 'complete generated axis labels missing')
    authored = read(pinned(preview, evidence['authoredNativeMath']))
    need(authored['result']['status'] == 'PASS_SUPPORTED_AUTHORED_MATH_STILL_USES_CURRENT_NATIVE_PRODUCER' and authored['result']['binding'] == binding and authored['result']['labels'] == 3 and authored['result']['nonblankPixels'] > 0 and authored['browserClosed'] and authored['serverClosed'], 'supported authored native-math routing regression')
    need(evidence['limitations']['generated3dAxisRoutingFixed'] is True and evidence['limitations']['sharedOwnerPRQualified'] is False and evidence['limitations']['fullReleaseQualified'] is False, 'known limits must be explicit')
    for row in evidence['normalJoins']:
        need(row['childJoined'] and row.get('reserveRefusal') is None and (row['exit'] == 0 or row['name'] == 'current-exact5m' and row['exit'] == 124), 'unclosed or unexpected command failure')
    pages = read(pinned(preview, evidence['pagesMode']))
    need(pages['status'] == 'PASS_ACTUAL_PAGES_MODE_RUN_RELOAD_DRAFT_EDIT_COPY_MOBILE' and pages['binding'] == binding and pages['browserClosed'] and pages['serverClosed'] and not pages['pageErrors'], 'actual Pages isolation/Run/reload control')
    need(evidence['firstCaptureWrapperTimeoutPreserved'], 'first failure omitted')
    if release.get('current_source_progress'):
        from current_source_progress import verify_current_source_progress
        verify_current_source_progress(preview, release)
    return {Path(row['path']).name: row['sha256'] for row in compiler['files'] if '/' not in row['path'].removeprefix('playground/canonical/')}
