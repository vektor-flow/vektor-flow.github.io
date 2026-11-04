"""Verify current named candidate scopes, keeping full release gates explicit.

Target-specific source inventories are deliberate: native35/28 and browser34/27
are not a shared-library or native ABI2 equivalence claim.
"""
import hashlib,json,tarfile
from pathlib import Path,PurePosixPath
from current_package import need,read,pinned,verify_current_runtime

def verify_current_focused_distribution(preview,release):
 expected,composition,components,compiler,binding,source=verify_current_runtime(preview,release)
 evidence=read(pinned(preview,release['current_focused_distribution']))
 need(hashlib.sha256(json.dumps(composition['components'],sort_keys=True,separators=(',',':')).encode()).hexdigest()==composition['inputSha256'],'composition digest mismatch')
 need(evidence['schema']=='vektor-flow.current-focused-distribution/1','wrong focused distribution schema')
 need(evidence['compilerBinding']==binding and evidence['formatterBinding']==release['formatter_binding'] and evidence['sourceCommit']==source,'changed candidate cannot inherit old checks')
 need(evidence['status']=='PASS_NAMED_CURRENT_MATCHED_SCOPES_FULL_RELEASE_UNQUALIFIED','current checks incomplete')
 need(all(release[k] is False for k in ['complete','stable','stable_release','release_qualified','full_requested_075_requirements_complete']),'full qualification remains open')
 need(evidence['fullReleaseQualified'] is False and evidence['nativeABI2Qualified'] is False and evidence['physicalGPUQualified'] is False,'qualification boundaries changed')
 need(evidence['fullEX01']['completed'] is False and evidence['fullEX01']['normalPriorFailure']=='ORDINARY_UI_OUTPUT_TIMEOUT_240S','full authored failure must remain visible')
 need(evidence['nativeLibrarySources']==35 and evidence['nativeRegistryEntries']==28 and evidence['browserLibrarySources']==34 and evidence['browserRegistryEntries']==27,'distinct target libraries changed')
 need(evidence['tests']['originalIntegerWholeStdoutBytes']==271 and evidence['tests']['originalIntegerSourceSHA256']=='f808342aac7636e13c65a70b4737d49d1badd2c2e953e9ce706eebdb204bf1e0','original gain5 regression changed')
 need(evidence['tests']['strictNodeWholeOutputPassed']==7 and evidence['tests']['packageSecurityPassed']==30 and evidence['tests']['packageSecurityFailed']==0 and evidence['tests']['packageSecuritySkipped']==0,'affected Node/security checks incomplete')
 browser=evidence['browser']
 need(browser['compilerBinding']==binding and browser['liveAndFormattedChannels']==240 and browser['distinctEntryCanvases']==2 and browser['allEntryCurrentGPUFences'] and all(browser['navigation'][k] for k in ['zoomOut','zoomIn','drag','currentViewFenceMatched']),'current real browser output/navigation incomplete')
 need(browser['labelReadiness']=='SUBMITTED_COMPLETION_UNMEASURED' and not browser['pageErrors'] and not browser['productConsoleErrors'] and browser['browserClosed'] and browser['serverClosed'],'browser errors/readiness/cleanup')
 need(all(evidence['realEdit'][k] for k in ['authoredHeightIncrementOne','all240LiveAndFormatterValues','oldOwnerReplacedWithoutErrors','requiredLabelsReady','currentAllEntryGPUFences']),'normal real editor reentry incomplete')
 need(all(evidence['extractedUsage'][m]['status']=='PASS' and evidence['extractedUsage'][m]['allExit0Joined'] for m in ['node','native','security']),'extracted package checks incomplete')
 checksums=read(pinned(preview,release['current_distribution_checksums']))
 need(checksums['compilerBinding']==binding and checksums['formatterBinding']==release['formatter_binding'] and checksums['fullReleaseQualified'] is False,'archive current identity')
 need(checksums['archives']==expected['archives'] and {x['target'] for x in checksums['archives']}=={'canonical','native'},'archive target selection')
 for row in checksums['archives']:
  archive=pinned(preview,row);target=evidence['archives'][row['target']]
  need(target['safeExtraction'] and target['allArchiveMembersMatchCheckedInputs'] and target['onlyMetadataChangedAfterUsage'],'archive executable bytes changed after checks')
  need(all(row[k]==target['archive'][k] for k in ['bytes','sha256']),'archive differs from tested finalization')
  entries={x['path']:x for x in target['entries']};need(len(entries)==len(target['entries']),'duplicate archive path')
  with tarfile.open(archive,'r:gz') as tar:
   members=tar.getmembers();need(len(members)==len(entries) and all(m.isfile() and not PurePosixPath(m.name).is_absolute() and '..' not in PurePosixPath(m.name).parts for m in members),'unsafe archive member')
   need({m.name for m in members}=={target['root']+'/'+n for n in entries},'archive member roster')
   for n,pin in entries.items():
    b=tar.extractfile(target['root']+'/'+n).read();need(len(b)==pin['bytes'] and hashlib.sha256(b).hexdigest()==pin['sha256'],'archive member changed '+n)
  if row['target']=='canonical':
   for item in compiler['files']:
    n=item['path'].removeprefix('playground/canonical/');need(all(entries[n][k]==item[k] for k in ['bytes','sha256']),'installed canonical/archive mismatch '+n)
  else:need(entries['bin/vkf']['sha256']==components['native-linux-cli']['identity']['binarySHA256'],'native binary identity differs')
 pages=evidence['pagesMode']
 need(pages['status']=='PASS_NORMAL_RUN_SERVICEWORKER_ISOLATION_CURRENT_COLOR_NAV_LABELS' and pages['compilerBinding']==binding and not pages['pageErrors'] and not pages['productConsoleErrors'] and pages['browserClosed'] and pages['serverClosed'],'normal Pages mode incomplete')
 need(release['download_packages_offered'] and release['current_distribution']['runEnabled'] and not release['current_distribution']['fullReleaseQualified'],'named distribution flags')
 return {row['path'].removeprefix('playground/canonical/'):row['sha256'] for row in compiler['files']}


def verify_current_normal_ex01(preview, release):
    expected,composition,components,compiler,binding,source=verify_current_runtime(preview,release)
    e=read(pinned(preview,release['current_normal_ex01']))
    need(e['schema']=='vektor-flow.current-normal-ex01/1' and e['status']=='PASS_NAMED_CURRENT_COMPONENTS_NATIVE_DEPLOYED_FULL_RELEASE_OPEN','named current EX01 scope')
    need(e['compilerBinding']==binding and e['formatterBinding']==release['formatter_binding'] and e['sourceCommit']==source,'exact tested compiler/formatter/source')
    need(hashlib.sha256(json.dumps(composition['components'],sort_keys=True,separators=(',',':')).encode()).hexdigest()==composition['inputSha256'],'current component digest')
    need(all(release[k] is False for k in ['complete','stable','stable_release','release_qualified','full_requested_075_requirements_complete']),'full qualification overclaim')
    need(all(e[k] is False for k in ['fullReleaseQualified','nativeSceneQualified','deployedSceneQualified','physicalGPUQualified','newF35SceneQualified']) and e['fullFrame10ms']=='UNMEASURED','target/feature qualification boundary')
    raw={k:pinned(preview,v) for k,v in e['raw'].items()}
    numeric=read(raw['numeric'])
    need(numeric['sourceSHA256']==e['sourceSHA256'] and numeric['release']['browser_binding']==binding and numeric['release']['formatter_binding']==release['formatter_binding'],'accepted numerical candidate identity')
    rows=numeric['fullOutputOracle']
    need([r['representation'] for r in rows]==['live-f64','formatter-f32'] and all(r['vertices']==152776 and r['indices']==911250 and r['checkedVertexChannels']==1527760 and r['allXYZNormalRGBA'] and r['allIndices'] and r['maxError']==0 for r in rows),'full authored output oracle')
    geometry=read(raw['localGeometry'])
    need(geometry['sourceSHA256']==e['sourceSHA256'] and geometry['release']['browser_binding']==binding and geometry['release']['formatter_binding']==release['formatter_binding'] and set(geometry['realGeometryNavigation'])=={'initial','zoomOut','zoomIn','scope'},'accepted local geometric navigation scope')
    g=geometry['realGeometryNavigation'];separations=[]
    for phase in ['initial','zoomOut','zoomIn']:
        row=g[phase];need(row['view']['endpoint']=='gpu-queue-completed' and len(row['walls'])==2 and all(w['live']==w['captured'] and max(w['live'][:3])>100 for w in row['walls']),'real wall pixels/current capture identity')
        separations.append(row['walls'][1]['pixel'][0]-row['walls'][0]['pixel'][0])
    need(abs(separations[1]/separations[0]-.8)<1e-8 and abs(separations[2]-separations[0])<1e-8,'actual wall zoom contraction/restoration')
    light=read(raw['lighting']);need(light['status']=='PASS_EXISTING_NORMAL_LIGHTING_STATE_AND_GPU_PIXELS' and light['browserClosed'] and light['serverClosed'] and not light['errors'] and not light['consoleErrors'],'current lighting pixel test failed')
    lightrows=light['pixels']['rows'];need([r['mode3d'] for r in lightrows]==[False,True],'both normal dimensions required')
    for r in lightrows:
        need(r['dark']['behind']<3 and r['blocked']['wall']>r['dark']['wall']+4 and r['clear']['behind']>r['blocked']['behind']+4 and r['below']['behind']>r['blocked']['behind']+4 and r['moved']['behind']>r['blocked']['behind']+4,'wall layer/movement illumination and occlusion')
        need(r['ambientLow']['behind']>r['dark']['behind']+4 and r['ambientHigh']['behind']>r['ambientLow']['behind']+4 and r['reactivated']['behind']>r['dark']['behind']+4 and abs(r['reactivated']['behind']-r['clear']['behind'])<3 and r['reblocked']['behind']<r['reactivated']['behind']-4,'ambient/reactivation/reblocking')
        need([x['sourceKind'] for x in r['instanceRows']]==['point','line'],'normal point and line retained')
        for x in r['instanceRows']:
            need(x['hidden']['visible'] is False and not x['hidden']['contributor'] and x['hidden']['behind']<3 and x['shown']['sourcePixel']>x['hidden']['sourcePixel']+4 and x['shown']['behind']>x['hidden']['behind']+4 and x['movedObject']['behind']>x['shown']['behind']+4 and abs(x['movedParent']['behind']-x['movedObject']['behind'])<3 and not x['zero']['contributor'] and x['zero']['behind']<3,'emitter visibility/source/movement/parent/zero pixels')
        need(abs(r['leftRatio']-1.5)<.05 and abs(r['rightRatio']-1.5)<.05 and r['captureRow']['view']['endpoint']=='gpu-queue-completed','legacy material/current capture')
    ui=read(raw['normalUI']);need(ui['status']=='FOCUSED_NINE_VERTEX_CURRENT_NORMAL_UI_NAVIGATION_PASS' and ui['sourceSHA256']=='2310bf52141a7bb94bc74be16564a712fa9edbebff3cfb8e7fd86e835d402faa' and ui['fullAuthoredEX01'] is False,'focused UI must not become full scene evidence')
    need(ui['release']['browser_binding']==binding and ui['release']['formatter_binding']==release['formatter_binding'] and all(ui['navigationAssertions'].values()) and not ui['errors'] and not ui['productConsoleErrors'] and ui['browserClosed'] and ui['serverClosed'] and ui['normalRetainedDisposed'],'normal UI required labels/navigation/error/cleanup')
    need(set(ui['nativeLabelReadiness'])=={'initial','zoomOut','zoomIn','drag'} and all(not x['missingGlyphKeys'] for x in ui['nativeAfterZoomIn']),'required current glyph mappings/readiness')
    for mode,n in [('node',3),('security',1)]:
        usage=read(raw[mode]);need(usage['status']=='PASS' and usage['compiler']==binding and usage['formatter']==release['formatter_binding'] and len(usage['jobs'])==n and all(x['exit']==0 and x['joined'] for x in usage['jobs']),'extracted current usage/security')
    need(raw['nodeStdout'].read_bytes()==raw['nodeExpected'].read_bytes() and read(raw['nodeCompile'])['sourceBinding']==binding,'whole Node output/current compile identity')
    tap=raw['securityTap'].read_text();need('# tests 30\n' in tap and '# pass 30\n' in tap and '# fail 0\n' in tap and '# skipped 0\n' in tap,'existing package security tests')
    need(set(e['onlyMetadataChangedAfterExtractedUsage'])=={'README.txt','VERIFICATION.json','package.json'},'executable inputs changed after extracted usage')
    checksums=read(pinned(preview,release['current_distribution_checksums']));need(checksums['archives']==expected['archives']==[e['canonicalArchive'],e['nativeArchive']] and checksums['compilerBinding']==binding and checksums['formatterBinding']==release['formatter_binding'] and checksums['fullReleaseQualified'] is False,'current selected downloads')
    archive=pinned(preview,e['canonicalArchive']);entries={x['path']:x for x in e['canonicalEntries']}
    with tarfile.open(archive,'r:gz') as tar:
        ms=tar.getmembers();need(len(ms)==len(entries) and {m.name for m in ms}=={e['canonicalRoot']+'/'+n for n in entries} and all(m.isfile() and not PurePosixPath(m.name).is_absolute() and '..' not in PurePosixPath(m.name).parts for m in ms),'archive safe exact member roster')
        for n,row in entries.items():
            b=tar.extractfile(e['canonicalRoot']+'/'+n).read();need(len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256'],'archive member integrity '+n)
    for row in compiler['files']:
        n=row['path'].removeprefix('playground/canonical/');need(all(entries[n][k]==row[k] for k in ['bytes','sha256']),'canonical installation/archive mismatch')
    old=read(pinned(preview,e['nativeUnchangedAcceptedEvidence']));need(old['archives']['native']['archive']['sha256']==e['nativeArchive']['sha256'],'native changed without current qualification');pinned(preview,e['nativeArchive'])
    return {row['path'].removeprefix('playground/canonical/'):row['sha256'] for row in compiler['files']}
