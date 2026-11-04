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
