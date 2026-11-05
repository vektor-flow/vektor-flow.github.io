> The current mixed calculation/material presentation contract is [Refined native rows](../text-modes-refined/CONTRACT.md). The earlier spectral/material description below is historical.

# Native Interp text mode browser adapter

Import `prepareNativeTextModes` from
`vf-ui/native-labels/vf-native-text-modes.mjs`. This is a same-document transparent
canvas overlay. It supplies no default content, editor, background, navigation,
geometry motion or rigid-body entities. Mount `player.element` above the existing
plot canvas; hide only the participating original text while this overlay owns it.
Do not hide graphs, lines, arrows, arcs, selection/editor UI or other geometry.

```js
const player = await prepareNativeTextModes({
  fromSpecs, toSpecs, width, height, typography,
  interp: {mode: 'vapor', seed: 17}, signal,
  maxCarriers: 4096, pixelRatio: devicePixelRatio,
});
container.append(player.element);
await player.sample(0.5);
player.close();
```

`typography` is the existing actual current075 native typography object with
`prepare` and physical `vectors`; the caller retains ownership and closes it
only after players close. No DOM/browser fonts, handwritten glyphs, triangle
morphing, background sampling or graph rasterization is used.

Each spec is `{id,kind:'math',source,anchor:[cssX,cssY],scale,color:[r,g,b,a],
sizeSpace:'css',itemIndex?}`. Anchors are native baselines in CSS pixels, y down.
The adapter changes coordinate chart once while extracting actual physical native
font commands. Native TeX `\\text{...}` remains the way to request ordinary text.
Input order establishes row order; optional nonnegative integer `itemIndex`
overrides its row index. Glyph order/advances come from actual native layout.
Duplicate IDs within one endpoint, invalid RGBA and nonfinite coordinates reject.
Only text passed to this adapter participates; caller filters its authored elements.

`interp.mode` is `spectral` or `vapor`. Optional named settings are the exact
native Interp factories' settings: k, velocity, overshoot, grow, and in vapor mode
only, temperature, spread, lift and seed. Inappropriate mode fields reject.
Temperature is a bounded activation parameter in [0,1], not physical energy. The
pinned library's schema/descriptor remain authoritative, with no mode policy in PP.

Native defaults are k=4, velocity=.54, overshoot=.32, grow=true; vapor defaults are
temperature=1, spread=.35, lift=.65, seed=0. The browser invokes the native factory
with these version-matched defaults because the kernel call ABI has fixed arity.
Source pixels use the common height-normalized chart x/height, 1-y/height; gas size is
in source pixel-footprint units. Spread and lift therefore refer to viewport
fractions. Native displacement and fade are never recomputed in JavaScript.

`sample(q,{front?,elapsed?})` takes an uneased fraction q in `[0,1]` and returns an
actual completion receipt after a compositor turn. The native shared quadratic
clock runs exactly once before the one-call native prepared material sampler (spectral uses `text_frame`). By default
the reading front crosses the complete native travel over the normalized interval.
`durationSeconds` reports travel/velocity for the controller's duration; zero
velocity reports Infinity and holds the default front. `readingTravel` and
`revealFront(elapsed)` expose the prepared travel and existing native velocity
advance. Explicit `front` overrides elapsed, while explicit elapsed uses native
`reveal_advance` directly. The native batch forces exact final endpoints, so a
caller advancing q to 1 before its custom reading front completes can cause a
final reveal jump. Keep the duration/front policy consistent.

Both changed endpoints are rendered once using the actual exact native tile renderer
onto otherwise transparent text-only surfaces. Deterministic dyadic bounded
subsets of their nonzero coverage pixels supply actual positions, coverage and RGB.
The native batch computes all gas displacement, alpha and size plus target glyph
alpha/growth/spectral channels. The existing GPU screen-space simplex renderer
draws only those presentation carriers. The exact native tiled renderer draws
native target outlines with channel-driven affine scale and color; source matrices/physical glyph paths are retained. Authored final
RGBA is exact at q=1. Gas/input sampling is not material-conserving thermodynamics.

The returned `canvas` is the accepted composite, suitable for existing capture.
Receipts identify canonical VKF WASM CPU compute separately from GPU rendering;
include measured compute and CPU-through-submit time, source alpha, target alpha,
carrier count, library commit and native renderer receipt. A compositor turn is
not a physical-display or hardware GPU completion certificate.

Limits: 128 specs/endpoint, 4096 physical source instances/endpoint, carrier cap
1–4096 (default4096), integer CSS dimensions 1–4096, total CSS area <=4,194,304,
and integer DPR1/2/3. Existing native tile and source certificate budgets still
apply and may reject expensive text. Input glyphs are prepared once; gas buffers
are bounded. Requests serialize and coalesce superseded queued generations.
Abort/close destroys owned GPU/render resources and removes the overlay. The
native batch is synchronous and cannot cooperatively cancel in-flight execution.
No worker/GPU-compute or 60fps performance qualification is claimed.

Build:

```sh
node scripts/text-modes/build.mjs LIBRARY_GIT b29b588 CANONICAL_COMPILER_DIR OUTPUT
```

Exact committed `Interp.vkf` bytes plus a small forwarding-only VKF
adapter compile to a host-import-free WASM artifact. Runtime validates the exact
library identity and source-code-pinned WASM/manifest hashes. Regenerating a
changed artifact requires reviewing and updating those pins. No compiler release,
main descriptor, Product package or production deployment changes here.

Checks: `node tests/text-modes/kernel.mjs`,
`node tests/text-modes/browser.cjs`. The browser test uses genuine current native
WASM typography and consistent headless Vulkan/SwiftShader flags. It checks exact
alpha endpoints, live gas, colored light native text on black, list-only spectral
reveal, inappropriate-mode rejection, existing underlay retention and close/abort
cleanup. Screenshots /tmp/vkf-text-modes-{0,.25,.5,.75,1}.png were visually inspected.
The initial browser attempt failed solely on a favicon404; adding an empty favicon
removed it. Final checks record no console/page errors. Initial wrapper omission
for native reading helpers was fixed before browser execution.

The current artifact uses public native Interp record ABI2: applicable optional
groups contain zero/one named typed record (native boolean grow, integer seed).
Opaque numeric settings payloads reject. Public named factory arguments remain
unchanged; both factory-settings and native-record JSON schemas ship with pins.

Native growth now evaluates the identical back-ease polynomial in positive-factor
form to avoid cancellation of tiny positive alpha. The adapter also omits actual
nonpositive/zero-linear-area packets before strict outline admission, with
zeroAreaGlyphs diagnostics; no arbitrary small-size threshold is used. Genuine
153-glyph driven-oscillator regression covers all49 normal playback coordinates,
tiny positive q and the formerly failing23/48 neighbourhood.

## Identified rendering work removed

The native tiled path prepares each tile size with `resize(...,{redraw:false})`,
then certifies/presents only the intended next scene/camera. The shared renderer's
default `resize` still redraws and retains its existing late-refusal behavior.
Tile receipts expose resize/sourceDraw/tileCopy timings. No target, AA policy,
font outline, bounds, mesh precision or sampling resolution is reduced.

Exact pose certificates now use complete semantic source/pose keys independent
of mutable proof-accelerator allocation IDs. Every request still snapshots and
validates actual physical content, material, matrix/phase and exact translation.
The same owner cap applies to all entries. Unpinned mutable decision DAGs are
preferred eviction victims before the small immutable certificates they produced;
LRU applies within that tier, with original LRU among other entries. Pose hits
renew the underlying sample's ownership/recency and require its presence.

Repeated identical accepted q/front samples reuse the owned completed canvas
without resampling or drawing. Captured source colors are copied on preparation,
so the accepted immutable scene is independent of later input-array mutation.
The caller treats the returned canvas as capture output, not a writable input.

`PERFORMANCE-QUALIFICATION.json` records before/after actual170-glyph frame hashes
and timings. All8 complete RGBA hashes match. With mint Displacement/Phase
legends, completed-frame sample cost changed from2189–2248ms to100–117ms;
warm q.5 changed1199ms to97ms. First-use q.25 remains about265ms; this is not a
universal latency/60fps claim. Same134,217,728-byte cap; observed peak133,531,238.
Tests include142 independent original exact-sampling comparisons,2 matching
refusals, mutation/limits/ownership,4100 bounded submissions, accelerator eviction
reuse and changed-phase reproof, default resize/late-refusal browser control, and
full153-glyph reveal regression. No numerical artifact or font changes.

## Material vapor contract (supersedes historical outward-only receipts)

The source and destination use genuine native font raster ink, never background
or geometry samples. The canonical native `prepare_vapor_transport` calls the
existing `Morphing.prepare_material`: normalized positive dyadic material weights
produce ordered split/merge correspondence bounded by maxCarriers. This conserves
a normalized material ledger, not raster coverage/optical area or physical mass.
Nearest actual native glyph anchor assigns each destination sample a capture
front; this explicit timing control is not semantic glyph matching.

Native `vapor_front` delays the spectral front until dissolution. Native
`sample_vapor_transport` supplies lifted seeded finite cubic turbulent offsets
around source-to-target transport, source-to-target RGB interpolation, target
growth/ink color, and synchronized capture. Offsets vanish before capture; each
carrier converges onto its actual destination ink (including current glyph growth).
This is seekable finite colored noise, not a Wiener process or thermodynamic
solver. The temperature activation shapes dissolution and offset amplitude.

The renderer compares exact id/source/anchor/scale/color/style specs. Identical
specs remain fixed; changed specs participate. Empty changed source or target
rejects `MATERIAL_VAPOR_EMPTY_ENDPOINT`; conserved material has no invented
reservoir. Use separate spectral appearance/removal for those operations. Both
unchanged/empty scenes need no transport. Receipts expose positive ledger
[source,gas,captured], sample counts and preparation/compute timings. Exact q0
uses accepted original native source; exact q1 uses original native destination.

`prepareNumericStateTransition({from:[...],to:[...],path:0,signal,kernelOptions?})`
returns a Promise of `{sample(q),close()}` from this SAME artifact. sample is
synchronous and returns `{values,coordinate:q,nativeCoordinate,libraryCommit}`.
It invokes one native shared `time_coordinate` and existing state `sample`; the
host only collects and applies authored numeric channels. Path 0/1 is the native
linear/natural-cubic selector (two endpoints naturally give a line). Finite equal
nonempty vectors, up to65536 channels; invalid inputs/closed handles reject.

Checks additionally include `node tests/text-modes/material-clip.cjs`: 49 actual
native-font frames encoded through existing VP8 capture, decoded pixel inspection
of gold source and cyan target, fixed caption hashes, conserved ledger and256cap.
Current evidence is MATERIAL-CLIP-QUALIFICATION.json; earlier browser/performance
receipts remain explicitly tied to their earlier source pins.
