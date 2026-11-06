from pathlib import Path
import json,hashlib
preview=Path(__file__).resolve().parents[1]/'public/preview/0.7.5'
if preview.exists():
 p=preview/'preview-manifest.json';m=json.loads(p.read_text())
 compiler=json.loads((preview/'current-compiler-release.json').read_text())
 m['publication']=compiler['publication_status']
 m['source']='Scoped stable 0.7.5 UI, ordinary retained plotting and browser/Node ESM embedding; selected compiler source '+str(compiler.get('browser_binding') or compiler.get('compiler_source'))+'. Stable qualification is limited to scoped_release in current-compiler-release.json and its named current evidence, including explicitly accepted unchanged components. Broad preview/stable flags describe the incomplete full compiler/platform release; this inventory does not extend qualification.'
 if compiler.get('site_review_iteration', {}).get('enabled'):
  m['source']='Website review without downloads; current compiler binding '+str(compiler.get('browser_binding') or compiler.get('compiler_source'))+'. Source-bound affected web/output checks are in current_review_site_evidence. Full compiler/platform release remains unqualified.'
 if compiler.get('site_review_iteration', {}).get('downloadsOffered') is True:
  m['source']='Website review with separately qualified preview Node/WASM console and historical Linux console downloads. Exact external qualification and scope are in downloads/current075-checksums.json. Current browser compiler binding '+str(compiler.get('browser_binding') or compiler.get('compiler_source'))+'. Availability does not extend archive or full compiler/platform qualification.'
 if compiler.get('site_review_iteration', {}).get('runEnabled') is False:
  m['source']='Pre-release website review with Run disabled. Stored compiler assets are inactive historical bytes. Latest compiler execution and enabled release qualification remain UNRUN; current disabled-mode evidence is in current_review_site_evidence.'
  if compiler.get('current_candidate_verification'):
   m['source']='Pre-release website review with Run disabled. Stored runtime assets retain their existing reviewed identity. Separate current candidate browser/native verification is pinned in current_candidate_verification; its declared scopes do not qualify the public runtime or complete release.'
 if compiler.get('current_distribution', {}).get('enabled'):
  m['source']='Current exact canonical compiler, retained browser host/runtime and separately checked Linux CLI downloads. Named correctness evidence is in current_distribution_evidence; owner-source PR publication is verified separately in current_owner_host when present; original10k renderer, broad 3D text, complete SDK/platform and comparative timing remain unqualified.'
 if compiler.get('current_renderer_correctness'):
  m['source']='Current exact compiler downloads, owner-source PR route and original10k current renderer correctness are qualified in their named evidence. The original renderer completes all30 views, two opaque colors and supported ownership cleanup under unchanged limits. Broad 3D text, all-font coverage, full SDK/platform and comparative timing remain unqualified.'
 if compiler.get('current_focused_distribution'):
  m['source']='Current named integer capture, retained overlay ownership, colored3x2 output/edit/navigation and extracted Node/native CLI package controls only. Full authored EX01 execution, native ABI2 scenes, all requested features and physical GPU/fullframe timing remain open. Exact scope is current_focused_distribution; this inventory supplies no additional qualification.'
 if compiler.get('current_normal_ex01'):
  m['source']='Current named full3035 numerical/local geometry, shared renderer lighting component, focused required-label normal UI and extracted Node/package checks. Native/deployed fullscene, newf35, full SDK/ABI2/allfeatures and physicalGPU/fullframe timing remain explicitly unqualified in current_normal_ex01.'
 m['source_sha256_meaning']='Retained per-row source_sha256 values describe historical source inputs; sha256 describes the current deployed bytes.'
 previous={r['path']:r for r in m['files']};rows=[]
 for f in sorted(preview.rglob('*')):
  if not f.is_file() or f==p:continue
  name=str(f.relative_to(preview));data=f.read_bytes();digest=hashlib.sha256(data).hexdigest();row=dict(previous.get(name,{}));row.update(path=name,bytes=len(data),sha256=digest)
  if name in previous:row['previous_sha256']=previous[name]['sha256']
  rows.append(row)
 m['files']=rows;m['totalBytes']=sum(r['bytes'] for r in rows);p.write_text(json.dumps(m,indent=2)+'\n')
root=Path(__file__).resolve().parents[1]/'public';p=root/'DEPLOYMENT-MANIFEST.json';m=json.loads(p.read_text());m['files']=[dict(path=str(f.relative_to(root)),bytes=f.stat().st_size,sha256=hashlib.sha256(f.read_bytes()).hexdigest()) for f in sorted(root.rglob('*')) if f.is_file() and str(f.relative_to(root)) not in ['DEPLOYMENT-MANIFEST.json','.vkf-site-generated']];m['totalBytes']=sum(r['bytes'] for r in m['files']);p.write_text(json.dumps(m,indent=2)+'\n')
