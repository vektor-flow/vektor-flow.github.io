# Vektor Flow public site

Only the reviewed0.7.2 compiler is published. `public/current-compiler-release.json`
pins the module, WASM and data hashes. The reviewed release was restored from
feb5150 after later preview publication inadvertently restored0.7.1 content.
The GPU math typing preview includes modular LaTeX documents and the full PDF
spatial accuracy report and 1–64x distance-field zoom from source9b44ef8;
full-document acceptance remains failing. Phone editor/preview controls use
source bb60444; Render collapses controls and fits content width on phones.
Document cameras support pinch/wheel zoom and direct touch/mouse dragging.
Rule shader ccaeb08 keeps radical/fraction/table edges sharp under zoom; the
comparison report retains its original pre-correction captures and pixel scores.

Legacy0.4.7 pages, runtimes and downloads,0.6 previews and superseded0.7.1
packages are retired from the deployment tree. Git history retains them; do not
copy them back into public assets. Old URLs return404 using a noindex error page.
The sitemap contains current pages only. Existing search-engine caches can take
time to disappear after recrawling; removing files does not instantly erase them.

Before publication run `python3 scripts/verify-current-site.py`, update reviewed
hashes with `python3 scripts/update-manifest.py`, and review the full asset diff.
CI checks both current-release policy and all manifest bytes before Pages deploys.
For browser verification, serve public on localhost8857 and run
`VKF_PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/site-browser.mjs`.
Set VKF_SITE_URL for hosted checks. The local test uses software rendering and
makes no physical GPU performance claim. Do not reset or bypass GPU stop markers.

The existing GPU math typing transitions use CPU glyph matching/interpolation
and crossfades; they are not a GPU morphology solver or performance benchmark.

Full-document zoom grids cover all49 GPU/46 reference pages at1/2/4x
(source a396b39). Original failures and affected-case image rescans remain
separate; overall document acceptance still fails.

Renderer UI source c0be0ab keeps pan/pinch/wheel inside a fixed document
viewport, switches pages in place and removes report links from its controls.

## Unified GPU math lab — 2026-10-15

Public entry: /previews/gpu-math-typing/document.html, linked from Coming soon.
One shell offers Document and Morph modes, .tex upload, native editing and26
prepared examples/108steps including10geometry-heavy sequences up to466objects.
The existing native document renderer remains document-view.html; the shell
loads only the selected mode. Switching to Morph extracts display/align rows;
it does not solve equations or translate arbitrary TikZ into geometry.
Unsupported syntax retains diagnostics. The original font/layout modules,
full atlas, document shader and document-demo runtime remain unchanged.

Rendering and morphing are separate responsibilities. Rendering supplies native
layout, glyph fields/UVs and endpoint packets; morph/engine.mjs owns GPU matching,
transport and drawing. CPU typesetting is still used; no CPU morph fallback.
Morphology is experimental and does not inherit document accuracy guarantees,
monotonic topology/count guarantees or physical frame-rate claims.

First-load optimization: scripts/prepare-morph-fields.py losslessly partitions
the existing atlas into128compressed512px tiles, retaining native UV coordinates.
Morph mode requests only resident endpoint fields; subsequent steps load missing
tiles and keep them on the GPU. The slim math-only mapping is454510compressed
bytes. Default scene software check:2,599,738total transferred bytes,
8MiB field upload versus128MiB full upload (93.75% less). Local cold first frame
3934.5ms, including software shader compilation; NOT physical GPU/phone timing.
The texture still reserves128MiB; sparse allocation/atlas repacking remains future
work. Document mode still uses the full native atlas and original document loader.

Checks: node tests/math-workbench.mjs verifies108endpoint scenes, nested equation
imports and every byte of all128atlas chunks. Browser evidence covers every
endpoint/midpoint, upload, native document rendering, document-to-morph, edit,
keyboard layout and actual video export. Software-only evidence is in Cuvami
staging/artifacts/math-workbench-20261015. Physical NVIDIA STOP remains active.
Existing0.7.2compiler policy/current navigation checks pass; retired0.4.7 stays404.

### Saved follow-up: renderer timing comparison

Owner requested this for later use on2026-10-15:
https://bourne2learn.com/math/svgmath/comparison-svgmath-katex-mathjax.php
Reference compares611equations under hard refresh, SVGMath/KaTeX/MathJax.
Build a reproducible comparison adding our native GPU renderer and a visible
elapsed clock. Separate cold transfer/decompression/device/pipeline/first render,
warm layout/upload/GPU completion, and morph timing. Use identical source and
viewport; report unsupported expressions instead of omitting them. Record versions,
device/backend, actual rendered coverage and cached/uncached runs. SVGMath's
precomputed output is a different preparation boundary; report its preparation
cost separately. Reference timings are not our measurements. This comparison
is recorded for later; it is not implemented or claimed by this publication.

## Morphology review restoration — 2026-10-16

The owner rejected r4's literal cut into halves. That clip and its endpoint PNGs
are removed. The gallery opens on the earlier native rounded lava-like two→five
separation. The cat/dog experiment now refines coarse semantic alignment with local optical
flow and broader feature coverage. A before/after MP4 is downloadable. Fine-detail
appearance still interpolates along material paths; complete automatic photo
merge/separation is not claimed.
The scan and three-state examples remain. Rejected blotchy contour and ink-density candidates remain local. The published
image update preserves photographic detail; numerical tests alone are not acceptance.
The preparation recipe now contains only the restored photo and existing 3D clips.

## Worked derivation library — 2026-10-16

Examples → Math derivations adds24 original multi-step derivations,146 states,
search, assumptions, annotated steps, individual LaTeX and combined JSON downloads.
Every entry deep-links into the existing live math morph player. The full player
catalog now has50 examples and254 states. Canonical shared data lives in the
libraries repository at examples/math-derivations/derivations.mjs; run
scripts/prepare-math-derivations.mjs to sync it and generate downloads.
Renderer checks cover all states; explicit SwiftShader browser checks cover the
new endpoints/midpoints and phone layout. These are worked inputs, not a symbolic
solver or a new physical GPU qualification. Existing photo/3D recordings remain.

## Unchanged expression preservation — 2026-10-16

The quadratic completing-square transition previously reassigned `4ac` character
by character, allowing other copies of `4` and `a` to steal its target glyphs.
The math renderer now emits optional nested syntax/product groups; native glyph
placement and atlas bytes are unchanged. A GPU pass reserves maximal unchanged
groups before residual matching, keeping the whole unchanged fraction together
and preserving `4ac` through the radical steps. Repeated occurrences use whole
group cost. This applies to edited math as well as examples; it does not infer
algebraic equivalence between differently written expressions.

`node tests/math-structure-browser.cjs` reproduces eight old-matcher failures and
checks32 grouped matching cases at five phases, forward/reverse and both GPU
reduction variants, then records the actual quadratic player. Use VKF_CHROMIUM
for the explicit SwiftShader executable. The broader browser test now visits all
50 examples/254 endpoints and their midpoints. Physical GPU STOP is unchanged;
this update has software correctness evidence, not new hardware timings.

## Current Morphing library — supersedes earlier player checkpoints

The owner rejected the JS/WGSL glyph player because it bypassed the biological
split/merge solver. Both standalone GPU-morph and math-motion implementations,
the quadratic movie, photo fade example and before/after downloads are removed.
The build gate rejects their reintroduction. The gallery retains the three
current native 3D examples. All50 authored math examples/254 states are retained
as inputs, with24 derivation downloads; they no longer link to obsolete playback.

Morphing is now an optional VKF library in the libraries repository. Its compiled
core handles multiple states, linear/cubic interpolation, independent endpoint
easing, state/embedding derivatives, retained identity channel bindings and
conserved material lineage. General biological boundaries and direct native
Layer/View integration remain unfinished; no legacy runtime substitutes for them.

## Native Morphing geometry checkpoint — 2026-10-16

examples/live/index.html executes the current VKF library through canonical WASM
in a worker, retaining a prepared scene and forwarding arbitrary coordinates.
Linear/cubic and independent smooth endpoints execute in VKF. Browser code only
transports values and presents coverage; no old matcher or interpolation fallback.
Phone controls, mode-dependent native output, latest-request handling and video
metadata pass. The browser geometry path is explicitly slow, not realtime.

The 97-frame native split/recombine recording uses geometric area calibration.
Sampled topology is 1→2→1 with no holes or reversals; native area error <1e-5.
Generic matching, thin strokes, hole scheduling, cohort routing and live Linux
View handles remain unfinished. The page and source README retain these limits.
