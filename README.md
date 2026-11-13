# Vektor Flow public site

The public compiler remains the reviewed 0.7.2 package, pinned byte for byte in
`public/current-compiler-release.json`. Do not promote compiler candidates through
website changes. Browser checks use explicit software rendering; preserve the
physical GPU stop.

The active 0.7.5 descriptor in
`public/preview/0.7.5/current-compiler-release.json` qualifies the tested ordinary
UI/plotting and Node ESM console scope as stable in `scoped_release`.
Its broad complete, stable, published and release qualification flags describe
the incomplete full language/platform release and remain false. Exact scope,
current runtime identities, local correctness, current hosted ordinary controls
and delivered bytes are pinned in `verification/e2630-scoped-stable-qualification.json`.
The current 5,127,174-byte Node/WASM archive has SHA-256
cffd102a00a45ae870eaf9c6e8d454ab121142947f67dd182bb024e650e33a67;
its external qualification is `verification/e2627-current-local-package.json`.
Its tested bytes and original pending internal metadata remain unchanged.
Earlier db807/ee417/3580 archive reports and dated sections below are historical.
Full platform/native SDK/ABI2, all-font/full LaTeX, phone EX06 legibility,
deployed full scenes, physical GPU and comparative timing remain unqualified.
PDF/fluid and the deferred features are outside this release scope; missing
matched timing inputs do not block the qualified ordinary UI/plotting release.

## Current text example

`public/previews/morphing-current/` contains one real-time LaTeX text-unfolding
example. The owner-selected defaults are k=4, v=0.54, 32% overshoot, Grow and Loop
on. All controls remain adjustable: k 1–10, v 0–1, overshoot 0–50%, and time.
The former comparison demos and their runtime files are removed.

Native `Morphing.unfold` owns the quarter-period sin² alpha ramp, back-ease size
and red-to-violet-to-white color. The compiler emits indexed scalar channels;
`compile-unfold.py` mechanically translates its scalar WGSL output to WebGL GLSL.
UNFOLD.json records library and compiler hashes. The public compiler stays 0.7.2.

The existing LaTeX engine supplies layout, native atlas glyphs and rule coverage.
Glyph instances, cumulative row offsets and row IDs are prepared once per layout;
GPU instance/vertex indexing handles playback. Control/output nodes are cached.
Changing time, k, v, overshoot or growth does not upload glyph geometry. Rows
finish sequentially, with one active front. No text is parsed during animation.

The compact atlas copies native tiles without resampling. ASSETS.json records
the build; SOURCE.json records engine and current source hashes. Extra glyphs
can load the existing full LaTeX resources. Old clips and inactive runtimes stay
retired; this page renders live and requests no videos.

`node tests/current-morphing.cjs` checks desktop SwiftShader and software WebKit,
selected defaults, live controls, editable LaTeX, stable GPU geometry buffers,
white endpoints, spectral ink and float GPU parity with 96 native kernel samples.
Set VKF_SITE_URL for hosted verification. No hardware performance is claimed.

## Publication

Run `python3 scripts/verify-current-site.py`,
`python3 scripts/package-morphing.py`, then `python3 scripts/update-manifest.py`.
CI checks exact compiler/source bytes, retired paths, local links and the complete
deployment manifest before GitHub Pages publication.

## Living mathematics demo

`public/previews/math-life/` is the Cuvami drag-to-merge game preview. Start with
zero and reach twelve. An operation applies to an expression if the result is a
Gaussian integer (a + bi, with integer a and b). The chosen root of −1 is +i.
Two expressions always bounce. Operations compose only into a
supported simple operation (including exact multiply/divide reduction) or cancel.
The existing packaged VKF symbolic WASM kernel evaluates the arithmetic; the game
supplies compatibility policy, with exact BigInt witnesses guarding floating-point arithmetic and Gaussian roots.

The page is a fixed visual-viewport shell. Touch/pointer panning is suppressed on
the surface. Controls and messages have stable layout; rules open in a dialog.
Pointer contact is swept and resolved before rendering. An indexed broad phase
selects mathematical contacts; VKF separates unrelated objects; a merging pair becomes one reserved collision cohort.

The body and native LaTeX strokes deform through a shared compiler-emitted native
Morphing `field.union` / `segment.value` kernel. The operation's stroke geometry
shrinks into the expression while the expression changes into the result. This
is signed-field interpolation, not a label crossfade or instant replacement.
Glyph packets are prepared once per merge and stay resident on the GPU. Sources,
compiler/library pins and source hashes are in MORPHING.json. This does not claim
semantic glyph matching, exact volume conservation or physical GPU performance.

The game calls the shared `createLatexRenderer`: WebGPU uses the original unchanged
`draw.wgsl`, with a transparent label surface over the morphing bodies. Browsers
without a usable WebGPU device use the shared renderer's WebGL2 material adapter.
Both consume the native 16-float (64-byte) glyph/rule ABI; TextWave is no longer
part of the game. Atlas resources can be shared per device and compact atlas.
The document renderer's full-atlas default remains supported.

Balls retain release velocity and free motion has no drag. Unequal-size contacts
use elastic area-weighted impulses; merges retain area-weighted incoming velocity.
Expression radii grow with magnitude, capped to keep the world usable. Native
body morphology changes smoothly to that radius. The palette includes +i, ×i
and a −1 expression so the imaginary direction can be explored directly.

An 18-tile native atlas is copied without resampling. Glyph layouts, object IDs and
contact-grid buckets are cached/indexed. Tap/keyboard pairing routes the operation
around other compatible objects when space permits; otherwise move them closer.
Reduced motion stops drift and shortens the geometric merge. Reset disposes active
morph packets. The pinned public compiler and selected text-wave demo are unchanged.

Run `node tests/math-life-rules.mjs`, `node tests/math-life-contacts.mjs`,
`node tests/math-life-motion.mjs`, `node tests/math-life-browser.cjs`,
`node tests/math-life-latex-browser.cjs` and `node tests/math-life-morph-browser.cjs`.
Checks include 250 numeric compatibility cases, expression-pair rejection, simple
operation composition, 1,800 crowded contact frames, page position while dragging,
held-pointer merge/bounce, touch and keyboard input, native LaTeX pixels and the
complete quest. Morph checks sample five actual GPU geometry states and compare
64 shared kernel values against compiled native VKF, on desktop SwiftShader and
software WebKit. `scripts/math-life/build-merge.py` reproduces the native kernel
and oracle; `compile-merge.py` mechanically translates its scalar WGSL to GLSL.

The LaTeX browser check uses explicit SwiftShader for ANGLE and Vulkan (physical
GPU stop preserved). It verifies the original WebGPU shader, pixel parity with
its WebGL2 adapter, the −1 → i → −1 interaction and changing sizes. Rules tests
include 961 independent Gaussian root cases. Browser release checks cover
persistent velocity on desktop and phone. Existing numerical merge-kernel
qualification is reused; that native source and generated shader are unchanged.

Throws use an indexed 32-sample pointer ring and the last 100 ms of real pointer
time, including coalesced touch samples. Release speed follows gesture speed;
holding before release stops the ball. Explicit throws also run with reduced
motion enabled. Free motion subdivides travel before contact resolution so fast
throws still merge or bounce without tunneling. `node tests/math-life-toss-browser.cjs`
checks slow/fast flicks and hold-to-stop with desktop mouse, native browser touch
input and software WebKit. `math-life-motion.mjs` checks timing/event-rate parity,
speed bounds and fast compatible/incompatible contacts independently.

The physics integration now calls the packaged VKF browser reference
`stepRigidPolygonWorld2D` for both time advancement and collision response.
`physics.mjs` maps stable IDs, analytic circles, area masses, authored walls and
kinematic grabs; it contains no impulse solver. `contacts.mjs` retains the indexed
compatibility/merge policy. PHYSICS.json pins exact runtime bytes, independently
matched to the canonical bootstrap and public-site copies. Tests include direct
runtime delegation, glancing impacts, walls, kinetic energy/momentum, kinematic
grabs and crowded no-overlap frames. The browser's actual engine identities and
native16 GPU label ABI are checked; object buttons contain no visible DOM math.

This uses the existing JavaScript browser physics reference. It does not complete
the native VKF physics/compiler port. LaTeX glyph drawing uses the GPU; its
existing layout/typesetting remains JavaScript. The native symbolic WASM and
compiled Morphing field kernels remain separate, unchanged components.

## Website remake (e1079)

The content entry points are Overview (`index.html`), Syntax, Standard library,
Build & embed, and Download. The homepage keeps one actual spectral-analysis program;
the matrix/derivative motion program is on Examples, and other programs are grouped in searchable, expandable references. All formerly
displayed source programs remain available. `stdlib-inventory.json` and
`stdlib-source/` are extracted from the exact 0.7.2 data archive, not a newer
compiler branch. Inventory presence does not qualify complete API support.

The public runtime remains pinned to the same incomplete 0.7.2 package.
`embed-example.html` connects a real HTML input to source compilation and
execution in the existing Web Worker. Package it reproducibly with
`python3 scripts/package-embedding-starter.py`; this performs no compiler build.
The starter keeps relative runtime paths and original third-party notices.

Run `python3 tests/site-remake-source.py` for source/provenance checks. After
all required optimization workers close, serve `public/` on localhost with
COOP/COEP headers and run `tests/site-remake-browser.mjs` using the existing
Playwright installation. `VKF_SITE_URL`, `VKF_PLAYWRIGHT_MODULE`, and
`VKF_SITE_EVIDENCE` configure the test. It serially executes each unique program,
binds displayed copies by source hash, checks real UI reruns, captures desktop
and phone layouts, checks copy/download/navigation, and runs the HTML form.
Software-rendered browser QA makes no physical GPU performance claim.

Before publication, run the existing current-site policy and manifest checks.
Use the existing Pages `main` workflow and `vektorflow.org` domain. Check the
remote parent immediately before a fast-forward push; preserve newer preview
assets and record the previous remote commit for rollback. Useful older
documentation paths redirect to the new guide sections; retired binaries remain
retired. Website publication does not promote a compiler release.

## VKF website example style

The authored examples in `public/preview/0.7.5/` use these conventions. Apply
changes to the editable source, displayed Prism code and canonical runnable
copy together; retain exact source hashes and require fresh qualification.

- Space the lowest-precedence operation to expose the expression’s structure;
  keep tighter operations compact: `2x + 4x^2`, `x*y + 2x`. Multiplication
  stays compact inside a sum. When an explicit product is the lowest-precedence
  operation in its own scope, space it: `sum_k(batches_ik * composition_kj)`.
  Implicit juxtaposition remains adjacent. Attach numeric coefficients to variables or function
  calls where supported and unambiguous (`2x`, `2sin(x)`); keep distinct
  variable products explicit (`x*y + 2x`). Do not merge identifiers or reinterpret
  multiplication as a call. This is documentation style, not a grammar ban.
  VKF binding and named-argument colons take no space before and one after:
  `x: 3`, `f[n: 3]`, `view.add(x: u_u, y: y_u)`.
- Bind ordinary names, and choose dimension indices at use when they are not
  reused: `totals: sum_k(batches_ik * composition_kj)`, then `:: totals`.
  Never put dimension notation on the left of the binding: `totals_ij` is a
  literal name, distinct from `totals`.
- Put a space after commas. Keep calls, indexing and member access compact:
  `f(x, y)`, `A.(1, :)`, `record.x`. Do not separate axis suffixes, derivative
  suffixes, unit literals or selected operators: `A_ii`, `f'x`, `2m`, `a &_i b`.
  Unary signs bind to their operand: `-1`, `a*-b + c`. Operator values stay
  intact: `[+, *]` and `reduce_i(+, A, 0)` where the grammar permits them.
- Indent bodies and continuation rows by four spaces. Add a blank row between
  imports, data/model definitions, computation and plot/output stages, where
  it helps reading. Do not add a blank row after every statement or align
  columns with padding. Preserve all statement boundaries and nesting.
- Keep helper variables in the narrowest valid lexical scope. When a helper
  only computes another binding, put it inside that binding’s indented
  computation block; its last expression supplies the result. Apply the same
  rule inside functions. Keep shared model inputs/axes and mutable UI/process
  state in the scope their consumers and lifetimes require. Preserve evaluation
  order; do not invent block syntax or shorten an escaping callable’s lifetime.
  The homepage spectral calculation and Examples motion solve demonstrate this.
- A one-line function stays on one line, with no return-channel notation.
  End a function with its meaningful final expression. Use @: for conditional or early returns and match arms. Indented value-binding
  blocks remain expressions: their last expression supplies the value.
  Preserve spill constructor semantics; a single spill body stays on one line.
- Treat VKF as VKF. Never run a Python formatter over it. Dots encode spacing
  metadata, primes depend on attachment, adjacency enables implicit products,
  and indentation creates scopes. Preserve strings, comments, LaTeX escapes,
  range bounds, suffixes and multi-character operators exactly. Token identity
  alone does not establish semantic equivalence; changed examples need actual
  parser/compiler review and execution before publication.
- Every inline/block/editor example uses Prism and monospace. Preserve source
  newlines and the existing horizontally scrolling editor on narrow screens.
  Formatting belongs in authored source, never letter spacing or HTML spaces.

Changed sources require fresh execution with the pinned compiler and actual
desktop/phone presentation checks before publication. Historical qualification
records keep their original source hashes. Namespace aliases stay in the import
scope supported by the compiler; computational helper values use the narrowest
qualified local block. Callable intermediates may share the enclosing value
computation when the compiler cannot return them from a tighter binding block.

### Documentation-only syntax publication (2026-11-13)

`python3 scripts/check-example-style.py` retains the full preview textarea
check and its existing diagnostics. The publication attempt on November 13
failed at `stdlib.html:4`, on `>` in the unchanged EX01 source
`abs(y)>0.5-0.0266666667`. That full-site failure remains unresolved; a focused
documentation check must not be reported as a full-site style PASS.

For a documentation update, record the current publication parent **before**
integrating the page and checker changes. Then use that exact commit:

```bash
python3 tests/check-example-style-selection.py
python3 scripts/check-example-style.py --changed-since "$syntax_publication_base"
git diff --check "$syntax_publication_base" HEAD
```

Set `syntax_publication_base` to the recorded parent, never the post-integration
HEAD. The focused command examines every preview HTML page in the working tree,
including new pages. It applies the same rules to each added or modified
textarea source, matched by its textarea/example section identity (ordinal for
anonymous editors). Duplicate identities fail rather than hiding a change.
Unchanged sources are counted separately and receive no new qualification.
The JSON names the exact base and checked sources; zero changed editors returns
`NO_CHANGED_TEXTAREA_SOURCES`, not PASS. This command does not rewrite source
or normalize meaningful juxtaposition/format-fill spaces.

The agreed syntax candidate retains all 32 editable sources byte for byte.
Its changed static listings and prose require their independent source review
and focused browser checks; the textarea lint has never checked those forms.
Preserve the browser's DOMParser/textContent comparison, highlighted text, Copy
and no-Run checks for `more-example-25`, `syntax-example-18` and
`syntax-extra-index-access-and-ranges-1`, together with existing runtime/download
and affected search, anchors, themes, scrolling and selection controls. These
listings describe agreed semantics without promoting the shipped compiler.

After genuine local checks, refresh current sourceFreeze/currentLocalWeb and
the existing descriptor/composition pins, retaining historical evidence. Run
`python3 scripts/update-manifest.py` and `python3 scripts/verify-current-site.py`
before the existing nonforce main/Pages publication and exact-head/served-byte
checks. The focused style mode changes none of those policy or CI guards.

## Current package preparation (2026-11-01, e1816)

The local release preparation branch selects the frozen 4ee3a748 / b459ecbc
compiler, baf21e1e WASM and independent formatter through
`scripts/current-package-selection.json`. The matching maintained assembly
recipe is bootstrap `compositions/current-0.7.5.json`; it preserves all 35 base
exports and 12 existing explicit component exports. The ba640 color fix and
original 53 mapping entries are retained; the existing actual math-page mapping
has 61 entries with the same physical font closure. No component identity
supplies a whole-package release receipt.

`scripts/current-release-draft.json` is nondeployable source data. The current
published descriptor and assets have not been promoted. The ordinary actual
owner must assemble a new root, run the existing archive/install/kernel/gallery,
current whole-root consumer and applicable native/WASM/browser/Node controls,
then supply real current evidence and archive pins to the existing verifier.
The previous 1677/1678 website proofs do not qualify this changed compiler.

The existing starter scripts accept `--preview 0.7.5`; the verifier also takes a
new extraction directory. They retain the normal example, runtime, worker, style,
editor and third-party files. The archive's internal runtime descriptor is an
unqualified snapshot; the final website descriptor carries qualification and
archive checksum separately, avoiding a checksum cycle. The extracted form
needs its existing browser check before any form usability claim. The form
remains outside the established scoped stable designation. Both scripts remain
unrun by source.

Use the existing main Pages workflow/domain after independent review and actual
checks, immediately verifying target permissions and current refs. Preserve newer
remote assets and exact unchanged qualified components. No tag, npm publication,
new hosting, general native SDK, full GPU world or comparative timing completion
is inferred from this preparation. The source checkout is sparse and contains
no assembled package/site or archive. The actual owner materializes its own
complete site before intake, rather than publishing this source checkout.

## Website review without downloads (2026-11-01)

The user requested a website review before a complete compiler release.
`scripts/review-site-policy.json` selects this explicit mode. The current-site
verifier retains runtime identities, all file manifests, retired-asset checks
and local dependencies. It requires actual affected web, output, copy/edit,
index-color, mobile and current-copy review evidence. Full package, archive,
starter, SDK and comparative benchmark qualification belongs to the later
release path, which remains intact. No download is offered by this review.

`example-output-seeds.json` binds saved output to each exact editable source.
Source preparation leaves current checks pending. The actual owner must check
those bytes through the normal compiler and formatter, preserve precision and
errors, and supply genuine renderer captures for visual output before publishing.
Browsing does not compile examples. Editing clears saved output; Run replaces it.

Three examples now compare pinned NumPy documentation with VKF. Their upstream
paths, adaptation notes and BSD license are in `example-sources.json` and
`numpy-examples-LICENSE.txt`. Other example provenance remains work in progress;
this first batch does not complete the all-example authoring goal.

## Current named distribution (2026-11-01, e1870)

The 0.7.5 preview now selects canonical compiler ffca / source 74cfd17c, host 63553cc and runtime 6d211126. Exact browser and Node/core qualification is reused from e1865/e1866 and e1868/e1867/e1869; native f376 / source 89f64c is a separate target. Current affected site controls and required-scale evidence must pass before publication. The current composition and selection record this named distribution, not the older b459 assembled root package. Its old 1500/210 whole-root bank is retained in the historical verifier, not relabeled as evidence for these artifacts. Shared uploads and full-release qualification remain unavailable.

The current renderer is 379714f7, a three-hunk generated-axis ownership fix over accepted base6d211126. The compiler/API/retained arena are unchanged. Current required5M point/view/color/generated-text checks use the saved genuine current220MB packet; authored native math keeps its original profile/producer. First capture124 and the pre-fix axis errors remain in evidence. Public archives add only the existing four third-party notice texts, with every frozen payload member byte verified.

## Current no-download website review (2026-11-02)

The current browser binding is 78bdbdf9, with the exact coalesced compiler and preserved current host security closure. The website reuses accepted 50-program / 51-occurrence and 16 semantic results, with actual native plot/editor/axis-grid/phone/coordinate and shared embedding checks. The current descriptor points to `verification/e1995-current-review-site.json`; current selection and composition identify bytes, not qualification. Existing archives remain unchanged and are not offered. Full-release, all-font, physical GPU and new optional Screen-layer architecture claims remain outside this deployment. Earlier dated distribution sections are historical.

## Current site structure and pinned downloads (2026-11-02, e2034 source candidate)

The maintained primary areas are Overview, Syntax, Std Lib, Compiler, Get Started and Performance. Overview tells the language story without keywords, with technical detail about scopes, expressions and named dimensions. Compiler (`compiler.html`) now holds the existing Python-to-C++ history, selected C++ module map, optimizations and staged bootstrapping plan formerly at `index.html#compiler`; compiler information stays out of the opening story. Authored code remains in Syntax and separate Std Lib, with unit imports updated to the existing `:.physics.units` path in both displayed and editable source. The library overview has one link per library; quantities and SI catalog references are grouped under Physics, color palettes under UI, and interpolation parts under Interpolation. Detailed APIs and examples remain available. Changed source hashes need fresh actual compiler runs and source-bound output seeds; earlier output hashes remain historical. Performance content, result tables and raw data are unchanged; only its primary navigation gains the Compiler link. Existing review receipts are historical evidence, not qualification of this source change. The actual owner must refresh derived manifests and perform scoped current navigation, canonical-route and desktop/phone presentation checks before publication.

The latest direct user download request supersedes earlier no-download presentation. Get Started offers only the two existing checksum-pinned Linux console and Node/WebAssembly archives, with their earlier bindings explicit. It does not promote their compiler to the newer website binding or extend full release/native SDK qualification. The existing review verifier now distinguishes availability from qualification and requires fresh actual `presentation.pinnedDownloads` evidence in the normal review report; no archive bytes changed. Prior no-download reports remain historical. Actual must refresh current composition/seed identities and derived manifests, run applicable current editor/Prism/both-theme/modern-toolbar/navigation/download checks and publish only after exact-source review and normal checks. This source worker ran no product commands.

## Current preview downloads (2026-11-06, e2614 source)

The existing review/pinned-download route selects the exact e2612 canonical archive,
SHA-256 db807a46c08e4801bb8d938f906549f7e457ab02bfb9e433e9456e9c3e5b083e.
External e2612 results qualify safe extraction, Node install/run/compile and local
import/security only. Preserve its pending metadata and tested archive bytes. The
df9 Linux archive retains its historical scope; ee417 archive and records stay intact.
This source patch still requires affected page/download checks and manifest refresh
before the existing Pages workflow; it supplies no current scale/stable UI PASS.

## Current UI correctness (2026-11-06, e2623)

The existing full small-sin and original-10000 controls passed on the current
renderer. The original 5,000,000-point request failed with `std::bad_alloc` before
a retained packet; no 5M GPU or rendering result is qualified. The maintained
10000-label control now requires the actual completed WebGL endpoint. Raw current
results and the preserved original helper failure are in
`public/preview/0.7.5/verification/e2623-current-ui-correctness.json`.
Full stable 0.7.5 qualification remains blocked. No matched current timing bundle
is available, so comparative benchmark numbers remain unpublished.

## Current point allocation investigation (2026-11-06, e2625)

The selected formatter expands point channels into JSON objects before binary
packing. Its required 50-million-entry vertex array exceeds its existing memory
ceiling. A maintained source candidate now packs all captured uniform point rows
directly into the existing arena. The patch is unbuilt and untested; the original
5M allocation failure remains a release blocker. Exact evidence, candidate, limits,
and next checks are in `public/preview/0.7.5/verification/e2625-allocation-causal-finding.json`.
The exact previous Pages run for 9b3d1040 finished with failure; delivery is unverified.
No stable qualification or new benchmark measurements are claimed.

## Maintained formatter correctness (2026-11-06, e2627)

The maintained79f incremental formatter compiled, linked and matched its fresh binding. Before/after ordinary point packet values and metadata agree, including repeated captures and view fallback. The original full5M program passes all50M finite attributes, ordered indices and GPU-completed readback/view/color controls. The fresh archive passes extraction, original271byte stdout, normal CLI install/run/compile and30 import/security checks. No full stable release, physical-GPU identity/performance or comparative benchmark claim. Exact evidence: `public/preview/0.7.5/verification/e2627-current-formatter-correctness.json`. Earlier source-only and failure records remain historical.
