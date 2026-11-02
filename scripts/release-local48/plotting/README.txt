CURRENT TRANSPORT DISPOSITION (e2037, 2026-11-02 UTC): BLOCKED, NOT EXECUTOR-READY
----------------------------------------------------------------------------
This section supersedes the older next-attempt directions below. fetch-tlc.py
is unchanged exact240fade source (SHA256
411c6fee5a99ed8f21a5688e77a8c0aae43bccdab4bc4c507d839e0f5ab0d6dd).
Do not run it again unchanged. Source investigation did not establish a repair
that completes the exact population within the original normal240 data job.
This child records the missing prerequisite and a concrete documented transport
alternative as data, as requested when bounded source evidence is insufficient.
It supplies no data execution grant, new launcher, report gate or site change.

Actual2032's changed timestamp/tie-overlap attempt exited1 normally after
151.67363757s. It retained149998 rows/1199984 XY bytes, then waited25s for HTTP
response HEADERS. There is no complete1M/export.json/finalmetadata/accepted hash.
Last timestamp2016-01-01T10:45:49.000, IDrow-89rd~9bzs-mmqw, trailing ties1.
The next timestamp>=2016-01-01T10:45:49, OFFSET0/LIMIT50000 request is INFERRED
from frozen source and accepted-as-failure status, not a captured transport URL.
Both old100k and new149998 prefixes remain untouched failure evidence only.
No resume, receipt reconstruction, cache adoption or qualification of a prefix.

What the narrow official documentation establishes
------------------------------------------------
LIMIT controls returned rows; it is not an index hint or bound on rows examined.
Smaller limits/CSV could reduce response bytes, but the failure precedes a
response body. Neither is evidence of a fix for these header delays. The saved
official metadata exposes no composite-index definition or execution plan;
indexUpdatedAt is not such a definition. Scan/sort, service load, network delay
and throttling remain hypotheses. No429 response was established by this read.
Do not claim an index defect, throttling diagnosis or a measured improvement.
  https://dev.socrata.com/docs/queries/limit.html
  https://dev.socrata.com/docs/formats/
  https://dev.socrata.com/docs/app-tokens.html

SODA3 is the documented current machine-query transport. It accepts a complete
SoQL query and recommends POST. A valid application token or user authentication
is required. The source environment has NO SOCRATA_APP_TOKEN; no credential
store was searched, no token was created/copied, and a future actual's credential
availability/validity is UNKNOWN. Obtain an authorized existing credential in
that actual's environment before considering this route. Its existence alone
does not establish latency or full240 feasibility.
  https://dev.socrata.com/docs/endpoints.html
  https://dev.socrata.com/docs/queries/
  https://support.socrata.com/hc/en-us/articles/43491231777047-Using-the-SODA3-API

Concrete identical-population alternative, ASDATA ONLY, NOT IMPLEMENTED
--------------------------------------------------------------------
Within the existing fetcher's normal job, retain metadata() and its exact
authentic revision check before ANY row and after ALL rows. For each existing
page_query result q, a future minimal transport adaptation can POST JSON to:
  https://data.cityofnewyork.us/api/v3/views/uacg-pexx/query.json
with Accept:application/json, Content-Type:application/json and X-App-Token
from the environment ONLY (never URLs/logs/files). The body is constructed as:
  query = 'SELECT ' + q['$select'] + ' WHERE ' + q['$where'] + ' ORDER BY ' + q['$order'] + ' LIMIT ' + str(q['$limit']) + ' OFFSET ' + str(q['$offset'])
  body = {"query": query, "includeSystem": true, "includeSynthetic": false,
          "orderingSpecifier": "total", "timeout": min(25, remaining())}
This is a request description, not a command executed or an accepted export.
No pageNumber option: retain timestamp suffix/tie offset/exact boundary overlap.
Only explicitly selected fields are wanted; :id AS source_row_id stays explicit.
Never use orderingSpecifier=discard: it discards the requested ordering too.
Do not replace server :id ordering with a guessed lexical row-ID comparison.
  https://dev.socrata.com/docs/queries/query
  https://dev.socrata.com/docs/queries/includesynthetic
  https://dev.socrata.com/docs/queries/orderingspecifier
  https://dev.socrata.com/docs/system-fields.html
  https://dev.socrata.com/docs/queries/timeout

The initial query must remain EXACTLY:
  SELECT :id AS source_row_id,tpep_pickup_datetime,pickup_longitude,pickup_latitude WHERE tpep_pickup_datetime >= '2016-01-01T00:00:00' AND tpep_pickup_datetime < '2016-02-01T00:00:00' AND pickup_longitude BETWEEN -74.3 AND -73.65 AND pickup_latitude BETWEEN 40.45 AND 40.95 ORDER BY tpep_pickup_datetime ASC,:id ASC LIMIT 50000 OFFSET 0
Every continuation retains the full original filter and server order; only the
existing normalized timestamp suffix, tie offset and final limit vary. If the
same semantics hold, the unchanged induction below selects the identical first
1M rows, not a different subset. Endpoint-specific :id identity/order, returned
field/number representation and exact boundary behavior still need genuine
current evidence. Source has NOT established that equivalence or completion.

Do not use an unauthenticated whole-dataset /export.csv: it changes the fetched
population/transport budget. A single1M JSON response would exceed the existing
16MiB bound at observed row sizes. Do not use human-formatted export numbers as
machine positions. No cap raise, automatic fallback, tokenless retry, microjobs,
new timing quota or hidden query/setup cost is supplied. Keep21 finite response
pages,23 successful request records including two metadata snapshots,25s socket
operation caps/min remaining240,16MiB per response and256MiB total. Explicit
server timeout cannot replace the existing external HARD240 whole-job cap.

Future minimal compatibility delta, never a current site/recovery gate
------------------------------------------------------------------
The frozen2033 three report files remain untouched and source-accepted/UNRUN.
For the proposed POST transport, their later owner must deliberately validate
the new exact exporter pin, endpoint/method and credential-free full request
body/hash in addition to genuine response hashes. Preserve21-page logical
extents/tie offsets/overlaps, all23 successful request records, original WHERE/
SELECT/ORDER, every-row1M unique IDs/filter/order/float32/bounds and both authentic
metadata snapshots. Do not weaken old URL validation or forge old-shaped URLs.
The actual failed-request query must be captured as such, not retrofitted into
the old failure. No new report format/bank or implementation is created here.

Later actual commands already used, ASDATA ONLY, CONDITIONAL ON A REAL REPAIR
-----------------------------------------------------------------------
  export PATH=/home/viktor/.local/bin:$PATH
  python3 "$SITE/scripts/release-local48/plotting/fetch-tlc.py" "$RUN/tlc" > "$RUN/export.stdout" 2> "$RUN/export.stderr"
  python3 "$SITE/scripts/release-local48/plotting/prepare.py" "$RUN/tlc" "$RUN/prepared" --duration-seconds 6 --input-hz "$ACTUAL_INPUT_HZ" --environment "$RUN/environment.json"
These literal existing commands are NOT a recommendation to retry unchanged
source. A separately scoped actual may use them only after a concrete repair,
independent source review, prior safe closure, current admission/newFIRSTFD and
the Coordinator's fresh data scope, with all setup/hash/transfer costs charged.
Actual2035 has only site publication in scope. It must continue independently.

The existing causal-oracles.json dataTransportDisposition describes missing-token,
exact query/order/body, full-completion/failure and cap oracles ASDATA. Existing
prepare.py still checks all genuine raw-row-to-float32 bytes; missing final
metadata/export receipt is failure even if raw files reach1M/8M bytes. All
matched native/peer preflights, parity/full geometry/native ink precede ANY
comparative timing. All numeric report fields remain null until genuine complete
data and current tool evidence exist. HistoricalLOCAL48x10/12of72accepted60UNRUN
are separate. Source has run no product imports/syntax/tests/data fetch/timing.

HISTORICAL SOURCE DIRECTIONS BELOW — NOT AN UNCHANGED RETRY AUTHORIZATION
======================================================================
SOURCE ONLY, UNRUN — additive next benchmark scope, not a website ship gate.

Base: b2b50a2f66fa92621562d37d75792bfe1f8e9bb1. All maintained changes are
NEW files below this directory plus tests/plotting-comparison.mjs. No selected
product/compiler/helper/metadata/manifest bytes changed. Published SITE4ddb397
has a later ad6 Copy helper: retain that helper and all current qualification
when integrating these additive files. Do not replay b2b's site tree over it.
Actual2023 is finished/normalclosed. Fresh2026 is preparing the next benchmark
scope; separate actual execution authorization/admission is still required.

e2027 child repair of frozen fd96cbbb: attachment passes an absolute runtime
base; the Blob helper also resolves relative/default bases against the current
HTTP(S) document origin before imports and package URL construction. Both paths
retain the maintained runner, renderer and native compiler. This child changes
only attachment/helper/oracle documentation; integrate only its delta after fd96.
The b2-parent tree must never replace the current published4ddb/ad6 site tree.

e2028 child of exact e1ac602: removes only the provenance-count dependency from
the exporter, sizes the normal frame for a900x600 INNER viewport, and uses the
same lowercase longitude/latitude degree labels in all three native adapters.
Apply only this child delta to actual2026's current integrated4ddb/ad6 tree.
All execution/real-data completeness/geometry/native label acceptance is UNRUN
by SOURCE; no prior parity result transfers to changed source/request identities.

Method and scope
---------------
Vega panzoom at 20ad5e85f829a4ccf29f2d92ea5d708c5c0a7c7e is the established
workload: 800x500 scene, padding50, axes/grid/clipping, centered zoom and
alternating pan, upstream100 operations. Our deterministic camera adaptation
reaches4x magnification and returns, preserving alternate pan and complete data.
It is not an unchanged historical event recording or a historical timing score.
Input cadence/duration are explicit actual-job parameters, not a new quota.

The official Plotly WebGL example independently establishes a1M-point workload.
fetch-tlc.py chooses exactly the first1M VALID January2016 TLC pickup rows in
timestamp,:id order, not an undisclosed sample or an entire-month claim. It
preserves all duplicates. Query/filter, revision, every response hash and final
files are recorded. The eligible MONTH total is honestly null/unknown, with an
explicit provenance-only status: its count(*) query timed out at25s before any
export. That aggregate is unnecessary to select the same first1M. The SAME WHERE/ORDER/SELECT, unique row identities, every-row eligibility
checks and unchanged before/after revision remain mandatory. e2031 replaces
global offset paging with timestamp-suffix continuation and exact boundary overlap
as detailed below; the chosen population is unchanged. Successful full export establishes a1M lower bound,
not an invented month total. No aggregate retry or broader timeout is added.
Missing/incomplete data fails; N is
never silently reduced. No source worker fetched bulk rows. Exact N/export SHA
and all actual machine/browser/compiler-build observations remain pending.

Positions are shared little-endian float32 raw longitude/latitude degrees, not
geographic distances. prepare.py independently checks every raw row against
that array, then constructs p_ic by actual VKF indexed outer broadcasts of the
two data arrays. Current createInlineRunner -> guest compiler -> native arena
-> mountRetainedSceneResult is used. No source evaluator, cached packet, custom
renderer/shader, handwritten geometry generator or synthetic fallback exists.
Source-array parsing cost belongs to setup, not the warm trace. If the1M source
does not fit the normal compiler/guest/time cap, retain its genuine error and
identify that ingestion gap; do not substitute a small-component comparison.

Plotly4.2.0 uses native scattergl/newPlot/relayout and native full chart axes.
deck.gl9.4.1 uses OrthographicView, binary full-population ScatterplotLayer, plus
standard LineLayer/TextLayer axes/grid in a second view. Its circles use native
scissoring at the identical data rectangle. Both official npm metadata integrity
pins are in peers.json; later actual installation creates a normal lockfile and
pin-peer-builds.py freezes the actual shipped scripts. No installed dependency
or measured SDK/build version is claimed by source. No optional peer bank.

All tools share real point positions/count/order, raw-degree domains,900x600
INNER plot viewport/DPR1, native circular markers (upstream area40 -> radius
sqrt(40/pi)), opaque steelblue, linear axes/grid and data-box clipping. Native
tick algorithms/font rasterization/chrome differ and are explicit. Deck uses
six linear grid positions with standard native text/layers. Peer standard
implementations do not need identical internals. Actual reviewer must reject
semantic/visible mismatch, rather than hiding axes, dropping points or relabeling
a renderer-only case as a full chart. Complete positions/indices/RGBA and full
spatial occupied-cell landmark captures are independent of timing.

Concrete data/host/native-label prerequisites — ASDATA, UNRUN by SOURCE
-------------------------------------------------------------------
The actual raw aggregate TimeoutError is retained in actual2026's
official-tlc2016-complete-ordered-first1M-export.stderr (27.247747s normal240
job, metadata only, no export.json). This child does NOT prescribe an unchanged
retry. Later admitted actual uses the changed exact exporter in a FRESH output
directory under its original normal240 cap. Per-request25s is retained and
bounded by the remaining full240 budget; no whole-job/owner clock extension.

Official schema metadata authenticates uacg-pexx/provenance=official,
calendar_date pickup time and number longitude/latitude, rowsUpdatedAt1494466198,
viewLastModified1702586741/tableId14191205. It does not expose a usable composite
index or query plan. Its cached time-column statistics even contain1/2/3, not
reliable eligible timestamps/counts. Do not use cached statistics as a count.
The documented SODA2 $order provides stable pagination with :id tie-breaking.
e2031 uses a timestamp suffix plus offset within that timestamp, described below.
No unverified :id collation, index claim, SODA3/auth migration or network scan.
Primary semantics (read-only research; no data queries by SOURCE):
  https://dev.socrata.com/docs/queries/order.html
  https://dev.socrata.com/docs/queries/offset.html
  https://dev.socrata.com/docs/queries/limit.html
  https://dev.socrata.com/docs/system-fields.html
Actual full export MUST prove contiguous complete responses/exact1M unique IDs,
original filter/order, unchanged revision,8,000,000 XY bytes and every response/file
hash. Transport page count is no longer the population acceptance criterion.
Any row-page timeout remains an authentic unresolved export failure, not PASS.

e2031: bounded same-population ordered continuation (SOURCE ONLY, UNRUN)
---------------------------------------------------------------------
Actual attempt2 reached100,000 rows/800,000 XY bytes, then timed out25s waiting
for a later row response's headers. The third offset100000 is inferred from the
exact loop and two complete written batches; it was not logged as a raw URL.
Normal240 job exited1 after196.373578s. All original artifacts/errors remain in
actual2026/plotting-attempt2/tlc; no final export.json or final revision exists.
Those files are NOT accepted data or a cache this child may resume.

Small causal correction: first response remains original ORDER/LIMIT50000/
OFFSET0. Thereafter add AND tpep_pickup_datetime >= lastAcceptedTimestamp to
parenthesized ORIGINAL WHERE, keep the SAME SELECT and timestamp ASC,:id ASC,
and OFFSET(trailingAcceptedRowsAtThatTimestamp - 1). Require the first returned
row to equal the prior last row in ALL selected fields, then discard that one
overlap. Request min(50000, remainingPopulation + 1). This excludes earlier
timestamps before sorting/skipping; offset counts only ties at the boundary.

Induction: the first response is the earliest prefix. Filtering >= its last time
removes only already consumed earlier times. Skipping exactly the preceding ties
and checking the unchanged last row leaves precisely the next ordered rows.
If a timestamp spans multiple pages, accumulate its trailing count across pages;
reset to1 only when time changes. Never skip by coordinates or timestamp alone,
never sort opaque row-* strings in Python, and never discard distinct IDs with
identical time/XY. Server :id ordering is authenticated by the exact ordered
requests/responses and overlap, not independently decoded as a host collation.

Default transport is21 responses:50000 accepted first, nineteen49999, then19;
last response20 includes overlap. The receipt records actual response pages,
logical accepted starts/counts/boundaries and request hashes, not a false claim
of20 full network pages. Final count is still exactly1,000,000/8,000,000 XY bytes.
Expected revision is pinned to authentic attempt2 rowsUpdatedAt1494466198,
viewLastModified1702586741/tableId14191205. Both authenticated metadata snapshots
must match; the final snapshot is retained and hashed as metadataAfter. Existing
prepare.py's generic file-pin loop consumes it without a code change.

No persisted checkpoint feature or import/adoption path is introduced. ONLY the
uninterrupted process's just-validated ordered prefix continues. Existing output
directories (even a purported compatible cache) are refused before any network
request; --resume is unsupported. A failed prefix stays intact and unaccepted.
Never fabricate request hashes or a final revision for old100k. No microjobs,
unchanged retry, synthetic population, smaller N, raised cap or clock reset.
All requests remain <=50000 rows/16MiB each/256MiB total;25s socket timeout is
bounded by remaining240. The normal actual job's hard240 cap remains required:
Python socket timeouts are per blocking operation, not a wall-clock job timer.
No internal retries. Entire fetch/hash/transfer/preparation costs stay separately
recorded by actual's existing job, including failure and all setup overhead.

Performance improvement is an inference from the supported filter/offset
semantics. No exposed composite index or query plan proves latency; same-time
ties may still be large, and even the first response may time out. Genuine final
failure remains a valid outcome, with no full-population comparison. Official
SODA3 supports filtered exports/queries but requires auth; unauthenticated full
export would fetch a different broad population. No endpoint/auth switch here.

Exact later actual commands, ASDATA ONLY, inside its separately granted sole
normal job and original clock/resource checks (current2026 is closed; source
cannot grant execution). SITE is current b78/4c6-or-newer integrated clone and
RUN is a fresh actual-owned attempt. Cherry-pick ONLY e2031's child delta; never
replace that current tree with this source clone's older site ancestry:

  export PATH=/home/viktor/.local/bin:$PATH
  python3 "$SITE/scripts/release-local48/plotting/fetch-tlc.py" "$RUN/tlc" > "$RUN/export.stdout" 2> "$RUN/export.stderr"
  python3 "$SITE/scripts/release-local48/plotting/prepare.py" "$RUN/tlc" "$RUN/prepared" --duration-seconds 6 --input-hz "$ACTUAL_INPUT_HZ" --environment "$RUN/environment.json"

Retain existing normal240 supervisor/resource admission around the first command;
this text does not launch/replace a controller or grant a new clock. On failure,
keep raw stderr/partial bytes; do not run prepare/parity/timing on the prefix.
After genuine complete export and every-row prepare validation, the existing
matched native/Plotly/deck full preflight/parity and only then measure workflow
below still applies. Native full degree labels/content-box900x600 and absolute
Blob repair are unchanged. LOCAL48/historical scopes remain separate.

Important future consumer: source2030 report.py currently hardcodes20 pages/
offsets0..950000. It must later be taught the genuine continuation receipt by
its owner during report intake, not used as a data recovery gate or made to pass
by lying about transport. This child does not edit its three owned files.

Concrete causal oracles, ASDATA ONLY (no source execution)
--------------------------------------------------------
Use existing causal-oracles.json dataContinuation cases. Exact lightweight helper
invocation for a later granted actual source check (does no network/main call):

  python3 - "$SITE/scripts/release-local48/plotting/fetch-tlc.py" <<'PY_ORACLE'
  import runpy, sys
  api = runpy.run_path(sys.argv[1], run_name='exporter_source_oracle')
  q = api['page_query']
  first = q(None, 0, 0)
  assert first == {'$select': api['SELECT'], '$where': api['WHERE'], '$order': api['ORDER'], '$limit': 50000, '$offset': 0}
  boundary = {'source_row_id': 'TEST_ONLY_OPAQUE_ID', 'tpep_pickup_datetime': '2016-01-01T04:03:04.000'}
  resumed = q(boundary, 3, 100000)
  assert resumed['$offset'] == 2 and resumed['$limit'] == 50000
  assert resumed['$where'] == '(' + api['WHERE'] + ") AND tpep_pickup_datetime >= '2016-01-01T04:03:04'"
  assert resumed['$select'] == api['SELECT'] and resumed['$order'] == api['ORDER']
  assert q(boundary, 7, 999981)['$limit'] == 20
  for args in [(None, 0, 100000), (boundary, 0, 100000)]:
      try: q(*args)
      except RuntimeError: pass
      else: raise AssertionError('unverified prefix accepted')
  PY_ORACLE

This helper check alone cannot qualify prefix provenance or data completeness.
Actual's normal test harness may inject a finite mocked urlopen responder solely
for the listed failure/boundary cases; test-only fixture rows are never a dataset
or benchmark substitute and N/PAGE must remain unchanged in the genuine job.
Required final real-data oracle is export count=chosenRows=1000000, null unknown
eligible total/lowerBound1M, exact original WHERE/SELECT/ORDER, pinned unchanged
before/after official revision, contiguous accepted extents summing1M, every
source row eligibility/uniqueID/timestamp order, exact boundary overlap for every
continuation,8M XY and all raw-row-to-float32 bytes via existing prepare.py, full
response/file/export hashes, successful final receipt. No earlier partial/PASS
qualifies this changed source. Genuine timeout/mismatch/truncation -> nonzero and
no final success receipt; missing receipt -> prepare refuses. Primary references:
  https://dev.socrata.com/docs/queries/page
  https://dev.socrata.com/docs/datatypes/floating_timestamp.html
  https://dev.socrata.com/docs/row-identifiers
  https://dev.socrata.com/docs/queries/offset.html
  https://dev.socrata.com/docs/queries/where.html

The selected normal .vf-frame is border-box with1px per side. Setting its outer
dimensions900x600 produced actual898x598 canvas. sizePlottingFrame now explicitly
uses content-box900x600, preserving that border and the inset normal toolbar;
the containing layer/host fit the measured outer shell (normally902x602).
It never resizes captured output, removes axes/chrome or edits the renderer.
FULL_MATCHED_VIEWPORT/sameRect/domain/DPR/full capture oracles remain intact.
In actual's existing normal-domain-clip-control.mjs source, the literal existing
control commands are ASDATA:
  node "$ACTUAL_ROOT/normal-domain-clip-control.mjs" baseline
  node "$ACTUAL_ROOT/normal-domain-clip-control.mjs" fixed
Do not repeat or interfere with the already running/completed causal job.
For the later meaningful existing control, actual may replace ONLY its host
sizing statement with this SAME imported helper's sizePlottingFrame(host,frame,
{width:900,height:600}), then request normal completed presentation/native labels.
Require native getGeomFramePlotMetrics width900/height600/dpr1, complete captured
canvas900x600, full5-point output and existing domain/clip/history assertions.
This finite host check cannot qualify real1M or the peer comparison. The normal
full-population preflight below still requires every native metric/dataRect to
match the genuine peers; it must not accept898x598 or a resized readback.

The CURRENT_NATIVE_FONT_MAPPING error comes from exact native provider validation
of physical.paths[physical.keys[item.key]] AND physical.fontBindings[item.key].
Current nativePlotTextSource wraps ordinary labels in \\text{...}; $...$ keeps
native mathematical source. The selected same-catalog mapping lacks
text/@roman:X, text/@roman:Y and text/@roman:L. It has all mapped paths AND bound
physical font entries for lowercase longitude (degrees)/latitude (degrees),
including parentheses; letter glyphs remain the selected CMR10. Changing only
initial case preserves the complete names/units without a font/style alias.
prepare.py emits these lowercase native labels and request.quality.axisLabels;
Plotly/deck consume those identical strings. Exact producer/catalog/resource,
vector/binding and missing-key evidence is in e2028 NATIVE-LABEL-SOURCE-CONTRACT.
This is source-contract evidence, not proof of current engine output keys.
Actual alone must compile/mount the same required labels with the ordinary point
control (replace Energy/Intensity labels ONLY, retain point/domain workload),
record raw native failures/pending source, require native-label status notFAILED
and real ink for BOTH complete labels/units plus ticks. Then exact real1M normal
preflight remains required. If a current engine key differs/misses, record that
exact authentic key/resource; no unrelated label, missing-glyph drop, axes
removal, host typesetter, substitution font or standalone font/PDF campaign.

Causal current integration gaps — do not apply to the active site
----------------------------------------------------------------
integration-gap.json and retained-domains-and-point-clip.patch bind the exact
unchanged renderer preimage. The ordinary2D route stores domains in axis_ticks;
updateGeomFrameCamera only changes camera. It lacks an exact public domain
setter/data-rectangle observer. The existing point branch also clamps off-view
points to canvas edges and omits unbound Box clipping. The proposed small normal
fix reuses the current retained meshes, draw/fence and axisBoxRect. It does not
change the compiler or introduce a new rendering path. The helper fails UNRUN
if the normal API is absent. Fresh actual must reproduce the defects, independently
review/apply the causal fix in its own baseline, and update current renderer
component/loader/descriptor pins by the ordinary workflow. Source did not apply
this patch or claim its behavior. Keep current history/control tests meaningful.

Actual commands AS DATA ONLY
---------------------------
Run only inside the later admitted sole-owner normal job, after2023 closure and
its own model/clock/resource checks. Existing LOCAL48 driver/48x10 gates and
accepted12/72 controls,60UNRUN,0comparative rows stay unchanged. This attachment
uses the existing browser job; do not launch another browser/FD/controller or
materialize historical0.7.3 sources. The current site may remain published with
pending plotting rows. No additional publication gate or release is created.

Use actual-owned absolute paths for SITE (current integrated clone), RUN (fresh
empty attempt root), and an actual environment JSON with non-null os,cpu,
ramBytes,gpu,driver,backend,displayHz,browserBuild,powerState,device. Do not put
credentials in those files. SOCRATA_APP_TOKEN is an optional existing secret
environment value; fetch code never logs headers or puts it in URLs.

  export PATH=/home/viktor/.local/bin:$PATH
  python3 "$SITE/scripts/release-local48/plotting/fetch-tlc.py" "$RUN/tlc"
  npm install --prefix "$RUN/peers" --ignore-scripts --no-audit --no-fund --save-exact plotly.js-dist-min@4.2.0 deck.gl@9.4.1
  python3 "$SITE/scripts/release-local48/plotting/pin-peer-builds.py" "$RUN/peers" "$RUN/peer-builds.json"
  python3 "$SITE/scripts/release-local48/plotting/prepare.py" "$RUN/tlc" "$RUN/prepared" --duration-seconds 6 --input-hz "$ACTUAL_INPUT_HZ" --environment "$RUN/environment.json"

The6s trace is one bounded method adaptation, not a mandatory timing matrix;
input Hz is the actual admitted offered cadence (record display Hz separately).
Data cap240s/256MiB response total/16MiB per page, chosen1M rows; compiler180s,
1GiB guest arena, source64MiB maximum, per-tool case240s. Existing actual whole
job admission must include download/install/setup/preflight/all tools/cleanup,
not only warm frames. Resource/cap failure keeps full-population status UNRUN or
FAIL and raw error. Do not reduce N, extend a clock or reuse an old PASS.

In the existing normal site-flow-browser.mjs job (same page.evaluate pattern as
tests/retained-exact5m-controls.mjs), supply a DEDICATED page from its existing
browser/context and existing local COOP/COEP server. No new launcher is supplied:

  const {runPlottingInExistingJob} = await import(pathToFileURL(path.join(siteRoot, 'scripts/release-local48/plotting/attach.mjs')));
  const options = {page, siteRoot, runRoot: path.join(runRoot, 'prepared'), peerBuildsPath: path.join(runRoot, 'peer-builds.json'), authorize: existingActualAdmissionAndOriginalDeadlineCheck};
  await runPlottingInExistingJob({...options, phase: 'preflight'});
  await runPlottingInExistingJob({...options, phase: 'measure'});

The authorize callback is the existing actual job's own admission/deadline
check, explicitly injected; there is no default grant/no-op fallback. The
attachment owns only page routes and tool resources, navigates its dedicated
page to blank afterward, and leaves normal browser/server/FD closure to that
existing actual owner. Outputs use exclusive creation in the fresh attempt.
Caller imports are Node standard library only plus existing Playwright methods.

Blob startup regression ASDATA — UNRUN by SOURCE
------------------------------------------------
In that SAME admitted existing actual browser job, before the data-dependent
comparison, use its dedicated page, existing server and original deadline callback.
This probes maintained module startup only; it does not instantiate a runner,
compile, mount, time a plot, authorize itself or qualify renderer parity. No bulk
data or installed peers are needed for this startup oracle. The attachment's
normal preflight/measure commands above remain required for a real comparison.
Use the existing Node fs/path/pathToFileURL imports from that job:

  await existingActualAdmissionAndOriginalDeadlineCheck({scope: 'plotting-blob-startup-regression'});
  const origin = new URL(page.url()).origin;
  const helper = await fs.readFile(path.join(siteRoot, 'tests/plotting-comparison.mjs'), 'utf8');
  let startup;
  try {
    await page.goto(origin + '/preview/0.7.5/performance.html', {waitUntil: 'load'});
    startup = await page.evaluate(async ({helper, origin}) => {
      if (location.origin !== origin) throw Error('EXACT_SERVED_ORIGIN_REQUIRED');
      const expectedBase = origin + '/preview/0.7.5/';
      const names = ['inline-runner.mjs', 'inline-renderer-loader.mjs', 'inline-retained-scene-view.mjs'];
      const exports = ['createInlineRunner', 'ensureInlineRenderer', 'mountRetainedSceneResult'];
      const cases = [];
      for (const base of [undefined, '/preview/0.7.5/', expectedBase]) {
        // A fresh Blob module per case exercises the actual opaque referrer.
        const url = URL.createObjectURL(new Blob([helper], {type: 'text/javascript'}));
        try {
          if (!url.startsWith('blob:' + origin + '/')) throw Error('CURRENT_ORIGIN_BLOB_REQUIRED');
          const api = await import(url);
          const resolved = api.resolvePlottingRuntimeBase(base);
          if (resolved !== expectedBase) throw Error('EXACT_RUNTIME_BASE_REQUIRED:' + resolved);
          const modules = [];
          for (let i = 0; i < names.length; i++) {
            const href = new URL(names[i], resolved).href;
            if (href !== expectedBase + names[i]) throw Error('EXACT_MODULE_PATH_REQUIRED');
            const loaded = await api.importPlottingRuntime(base, names[i]);
            if (typeof loaded[exports[i]] !== 'function') throw Error('REAL_RUNTIME_EXPORT_REQUIRED:' + names[i]);
            modules.push({href, export: exports[i]});
          }
          cases.push({input: base ?? 'DEFAULT', resolved, blobURL: url, modules});
        } finally { URL.revokeObjectURL(url); }
      }
      return {scope: 'Blob module startup only; no compiler/parity/timing qualification', cases};
    }, {helper, origin});
  } finally { await page.goto('about:blank', {timeout: 15000}); }
  // Persist startup or the genuine thrown error using the existing job's normal
  // report/error handling. SOURCE supplies no PASS record; actual verifies it.

Expected: default, root-relative and already absolute cases each report the exact
served origin + /preview/0.7.5/ directory and the three exact maintained module
URLs. Imports execute inside the fresh Blob helper via the SAME import function
used by vkfAdapter, rather than merely checking URL strings in Node. No mocked
module, substitute compiler or host evaluator is accepted. A genuine failed
import remains FAIL; preflight/measure remain UNRUN until separately completed.

Preflight writes plotting-preflight-{vkf,plotly,deck}.json and plotting-parity.json.
All three must pass current source/data/build/environment identity and meaningful
visible geometry/clip checks before ANY measure invocation. Measurement writes
plotting-measure-{vkf,plotly,deck}.json and plotting-raw-results.json; errors get
separate .error.json. These are raw candidate observations, not published scores.
Changing helper/data/trace/peers/renderer/selection/descriptor invalidates parity.

Metric boundary and honest limits
--------------------------------
One paced sequential moving-camera update at a time; no idle RAF counts, async
enqueue counts, omitted camera updates or first-visible-only samples. Each timed
endpoint includes the real completed tool update/queue/native-label readiness
AND full native surface readback, including observer overhead for EVERY tool.
Canvas command completion alone is not accepted as raster completion. Plotly's
native SVG axis DOM is complete after its update promise; compositor raster/
display presentation is NOT established. The raw record identifies each endpoint,
request/completion epoch timestamps, readback cost, intervals, camera and lateness.
Setup/profile/input transfer are separate; inseparable normal compiler/guest/
packet-transfer phases remain explicitly null or combined, not invented splits.
Full native readback changes workload cost: this is instrumented complete-output
update cadence, not peak interaction FPS or proven visible presentation FPS.
Source/no current display trace cannot establish the user's final displayed-FPS
claim. A later actual browser/compositor presentation trace is required for that
claim; otherwise use the explicit application metric and leave presentationFps
null. No percentile/ratio or hardware score is generated here. Lost display frames
remain null; missed offered-input deadlines are actual trace lateness only.
SwiftShader/software results must retain their backend identity and can never
qualify physical-GPU performance. No cross-hardware published score is a ratio.

Primary sources
---------------
https://github.com/vega/vega-benchmarks/blob/20ad5e85f829a4ccf29f2d92ea5d708c5c0a7c7e/interaction/benchmarks.js
https://github.com/vega/vega-benchmarks/blob/20ad5e85f829a4ccf29f2d92ea5d708c5c0a7c7e/interaction/panzoom/vg2.html
https://github.com/vega/vega-benchmarks/blob/20ad5e85f829a4ccf29f2d92ea5d708c5c0a7c7e/interaction.sh
https://data.cityofnewyork.us/api/views/uacg-pexx.json
https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page
https://www.nyc.gov/main/terms-of-use
https://dev.socrata.com/docs/queries/order.html
https://dev.socrata.com/docs/queries/limit.html
https://dev.socrata.com/docs/system-fields.html
https://plotly.com/javascript/webgl-vs-svg/
https://raw.githubusercontent.com/plotly/plotly.js/v4.2.0/src/plot_api/plot_api.js
https://raw.githubusercontent.com/visgl/deck.gl/v9.4.1/modules/core/src/lib/deck.ts
https://raw.githubusercontent.com/visgl/deck.gl/v9.4.1/modules/core/src/viewports/viewport.ts
https://raw.githubusercontent.com/visgl/deck.gl/v9.4.1/modules/layers/src/scatterplot-layer/scatterplot-layer.ts
https://deck.gl/docs/api-reference/core/orthographic-view
https://deck.gl/docs/api-reference/core/layer
https://deck.gl/docs/api-reference/layers/scatterplot-layer
Vega redistribution notice retained in UPSTREAM-LICENSE.txt. TLC metadata supplies
no explicit SPDX license; official attribution/terms are retained, no inventedCC0.
