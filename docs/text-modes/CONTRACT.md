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
Maximum temperature is the only supported vapor temperature, exactly 1. The
pinned library's schema/descriptor remain authoritative, with no mode policy in PP.

Native defaults are k=4, velocity=.54, overshoot=.32, grow=true; vapor defaults are
temperature=1, spread=.35, lift=.65, seed=0. The browser invokes the native factory
with these version-matched defaults because the kernel call ABI has fixed arity.
Source pixels use normalized viewport coordinates x/width, 1-y/height; gas size is
in source pixel-footprint units. Spread and lift therefore refer to viewport
fractions. Native displacement and fade are never recomputed in JavaScript.

`sample(q,{front?,elapsed?})` takes an uneased fraction q in `[0,1]` and returns an
actual completion receipt after a compositor turn. The native shared quadratic
clock runs exactly once before the one-call native `text_frame` batch. By default
the reading front crosses the complete native travel over the normalized interval.
`durationSeconds` reports travel/velocity for the controller's duration; zero
velocity reports Infinity and holds the default front. `readingTravel` and
`revealFront(elapsed)` expose the prepared travel and existing native velocity
advance. Explicit `front` overrides elapsed, while explicit elapsed uses native
`reveal_advance` directly. The native batch forces exact final endpoints, so a
caller advancing q to 1 before its custom reading front completes can cause a
final reveal jump. Keep the duration/front policy consistent.

The outgoing source is rendered once using the actual exact native tile renderer
onto an otherwise transparent text-only surface. A deterministic bounded subset
of its nonzero coverage pixels supplies ink positions, coverage and original RGB.
The native batch computes all gas displacement, alpha and size plus target glyph
alpha/growth/spectral channels. The existing GPU screen-space simplex renderer
draws only those presentation carriers. The exact native tiled renderer draws
native target outlines with channel-driven affine scale and authored-color
modulation; source matrices/physical glyph paths are retained. Authored final
RGBA is exact at q=1. Gas/input sampling is not material-conserving thermodynamics.

The returned `canvas` is the accepted composite, suitable for existing capture.
Receipts identify canonical VKF WASM CPU compute separately from GPU rendering;
include measured compute and CPU-through-submit time, source alpha, target alpha,
carrier count, library commit and native renderer receipt. A compositor turn is
not a physical-display or hardware GPU completion certificate.

Limits: 128 specs/endpoint, 4096 physical source instances/endpoint, carrier cap
1–65536 (default4096), integer CSS dimensions 1–4096, total CSS area <=4,194,304,
and integer DPR1/2/3. Existing native tile and source certificate budgets still
apply and may reject expensive text. Input glyphs are prepared once; gas buffers
are bounded. Requests serialize and coalesce superseded queued generations.
Abort/close destroys owned GPU/render resources and removes the overlay. The
native batch is synchronous and cannot cooperatively cancel in-flight execution.
No worker/GPU-compute or 60fps performance qualification is claimed.

Build:

```sh
node scripts/text-modes/build.mjs LIBRARY_GIT 36124ab CANONICAL_COMPILER_DIR OUTPUT
```

Exact committed `Interp.vkf` bytes plus a two-function forwarding-only VKF
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
