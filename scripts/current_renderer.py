"""Bound the current renderer qualification to its exact original normal run."""
from current_package import need, read, pinned


def verify_current_renderer(preview, release, selection, evidence):
    proof = read(pinned(preview, release['current_renderer_correctness']))
    need(proof['status'] == 'PASS_ORIGINAL10000_CURRENT_NORMAL_ALL30_COLOR_OWNERSHIP' and proof['sourceCommit'] == 'ff122a25493f6c8fca7995713116ac12387d735b', 'current reviewed renderer identity')
    paths = {'vf-native-accuracy-scene.mjs', 'vf-native-certified-samples.mjs', 'vf-native-outline-cache.mjs', 'vf-shared-area-renderer.mjs'}
    expected = {'vf-ui/native-labels/' + n for n in paths}
    need({r['path'] for r in proof['runtimeFiles']} == expected, 'renderer runtime closure')
    for row in proof['runtimeFiles']: pinned(preview, row)
    old = {r['path']: r for r in proof['priorSelection']['installedFiles']}
    new = {r['path']: r for r in selection['installedFiles']}
    need({k for k in old.keys() | new.keys() if old.get(k) != new.get(k)} == expected, 'renderer altered unrelated installed component')
    census = proof['sourceCensus']
    need([census[k] for k in ['labels', 'distinctSources', 'glyphs', 'rules', 'outlines']] == [10000, 200, 34100, 1000, 35100], 'original population changed')
    need(all(census[k] for k in ['allOrderedSourceElements', 'allOriginalSpecItemCameraMatrices', 'allPhysicalFontBindings']), 'original source oracle missing')
    need(len(proof['views']) == 30 and [v['index'] for v in proof['views']] == list(range(30)) and len({v['pixelHash'] for v in proof['views']}) == 30, 'all original view outputs incomplete')
    need([v['color'] for v in proof['colors']] == [[.9, .1, .2, 1], [.1, .2, .9, 1]], 'original opaque color controls incomplete')
    for row in proof['views'] + proof['colors']:
        need(row['all35100CurrentSourceMatricesAndCommands'] and row['nonblankPixels'] > 0, 'full physical source/output assertion absent')
        probes = row['independentExactAA16RGBAProbes']
        need(probes and all(p['actual'] == p['expected'] for p in probes), 'independent old-sampler sparse RGBA mismatch')
        receipt = row['statistics']['renderer']['nativeAccuracy']
        need(receipt['outlines'] == 35100 and receipt['status'] == 'SOURCE_CERTIFIED_DISPLAY_PLAN' and receipt['pinnedEntries'] == 0, 'full ordered renderer submission incomplete')
        need(receipt['entries'] <= 4096 and receipt['bytes'] <= 134217728 and receipt['instanceBytes'] <= 134217728 and receipt['residentGPUBytes'] <= 134217728 and receipt['newNodes'] <= 2000000 and receipt['newPixels'] <= 1048576 and receipt['sampleBuilds'] <= 4096, 'original renderer resource caps changed')
    stats = proof['ownership']['producer']
    need(proof['ownership']['released'] and stats['closed'] and stats['leases'] == stats['cachedFormulas'] == 0 and proof['cleanupJoined'] and not proof['cleanupErrors'], 'normal actual ownership cleanup incomplete')
    need(proof['invalidStyleRefusalPreservedFrame'] and proof['browserClosed'] and proof['serverClosed'] and not proof['pageErrors'] and proof['normalDriverJoin']['exit'] == 0 and proof['normalDriverJoin']['childJoined'], 'normal completion/refusal/join incomplete')
    need(proof['normalAdmission']['normalSeconds'] == 1200 and proof['normalAdmission']['cleanupSeconds'] == 600 and proof['normalAdmission']['inode'] == 8915659, 'original complete normal group policy changed')
    need(proof['affectedRenderer']['status'] == 'PASS_AFFECTED_ORDERED_STREAM_RENDERER' and proof['inheritedCapacityRefusal']['status'] == 'PASS_INHERITED_OVER_CAP_GPU_BUFFER_REFUSED', 'affected normal renderer controls incomplete')
    need(proof['remainingRendererCorrectness'] == [] and proof['rendererCorrectnessQualified'] is True, 'specific original renderer correctness not completed')
    return proof
