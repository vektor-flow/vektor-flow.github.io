"""Verify the narrow Node owner-route overlay against preserved prior evidence."""
from current_package import need, read, pinned


def verify_current_owner_host(preview, release, selection, evidence):
    owner = read(pinned(preview, release['current_owner_host']))
    need(owner['status'] == 'PASS_LIVE_OWNER_ROUTE_NORMAL_MERGED_IMPORT_EXACT_HOST_RUNTIME', 'owner host proof unavailable')
    need(owner['sourceCommit'] == '96d0ff9831a09740b30d05f3d3a64f4ab61a8c87' and owner['baseCommit'] == '63553cc03124469cb29c73c04b99d7ce65b7a335', 'unreviewed host delta')
    expected = {'playground/canonical/package-tools/' + n for n in ['cli.mjs', 'publish.mjs', 'owner-protection.mjs']}
    need({r['path'] for r in owner['runtimeFiles']} == expected, 'owner runtime closure incomplete')
    for r in owner['runtimeFiles']: pinned(preview, r)
    old = {r['path']: r for r in owner['priorInstalledFiles']}
    new = {r['path']: r for r in selection['installedFiles']}
    changed = {k for k in old.keys() | new.keys() if old.get(k) != new.get(k)}
    need(changed == expected, 'owner delta altered unrelated installed assets')
    prior = read(pinned(preview, evidence['priorDistributionEvidence']))
    need(prior['compositionInputSHA256'] == owner['priorCompositionInputSHA256'], 'prior acceptance identity')
    before = {r['path']: r for r in prior['sourceFreeze']}
    after = {r['path']: r for r in evidence['sourceFreeze']}
    allowed = expected | {'CURRENT-COMPOSITION.json', 'downloads/current075-checksums.json', 'install.html', 'release-status.html'}
    need({k for k in before.keys() | after.keys() if before.get(k) != after.get(k)} == allowed, 'unrelated historical evidence was rebound')
    need(all(evidence[k] == prior[k] for k in ['siteControls', 'originalSmallSin', 'current5m', 'current5mRender', 'authoredNativeMath', 'pagesMode', 'normalJoins']), 'historical accepted results changed')
    proof = owner['liveProof']
    need(proof['status'] == 'PASS_PROTECTED_MAIN_EXACT_CURRENT_HEAD_OWNER_PR_AND_NORMAL_MERGED_IMPORT' and proof['guestStdout'] == '7\n', 'normal merged import failed')
    need(all(proof[k] for k in ['directPushRefused', 'bootstrapWrongSHARefused', 'laterHeadStaleSHARefused', 'oneMaintainedPackageFolder', 'gitCommitIsVersion']), 'live route proof incomplete')
    need(proof['oldReviewedHead'] != proof['currentReviewedHead'] and len(proof['mergedCommit']) == 40, 'head-bound owner route incomplete')
    need(len(proof['singleLock']['lock']['sources']) == len(proof['singleLock']['lock']['requests']) == 1 and proof['record']['commit'] == proof['mergedCommit'], 'merged source single-lock identity')
    need(owner['fullRequested075Done'] is False and owner['requiredRemaining'] == ['Original10000 current normal required renderer fulloutput/all30 original views/current color/ownership correctness'], 'renderer remainder omitted')
    need(owner['archive'] == {k: selection['archives'][0][k] for k in ['path', 'bytes', 'sha256']}, 'owner archive selection')
