# Ordinary native glyph material state — 2026-11-06

The public `prepareNativeTextModes` state route now uses the existing
`prepareNativeLabelTransition` / canonical Morphing biological signed-field
backend. The old glyph-pose route assigned new symbols alpha zero and faded them
at their final shape. `RED.json` records that actual public native failure.
The pose-only native helper now rejects different physical identity sequences.
It is not an active fallback in the player.

Unchanged native glyphs preserve their exact original object and affine recipe.
Same physical outlines use an internal canonical native affine/RGBA shortcut.
Different outlines and unequal counts use persistent split/merge cohorts, native
signed-distance-grid interpolation, native ink-area calibration and generated GPU
contours. Renderer triangles are only output; they are never interpolation input.
Native authored RGBA is interpolated with the same coordinate, with no lifecycle
opacity and no rainbow. A source-only explicit state removal shrinks geometric
ink area to zero. A target-only addition uses the existing native plain wave.
Material pool and wave semantics remain unchanged.

The actual physical Type1 M/L/C/Z paths remain authoritative. Existing native
outline-ring adaptation uses .025 CSS-pixel tolerance and local 65x65 fields.
Cohort bounds are twice the previous size; 129x129 measurement and 257x257
contouring preserve previous physical sampling precision. This is approximate
implicit geometry, not an exact cubic-distance certificate or physical fluid.
Native nonzero contour signing matches the physical glyph fill rule.

The old fixed scale-four upper bracket could clip hollow glyphs out of the
sampling domain. Native CPU and GPU calibration now find an actual sign-changing
bracket before bisection. The retained hollow-ring regression fails on the old
artifact and passes now, residual 2.31e-6 against tolerance1e-4. The digit6→7
midpoint also passes actual GPU sampling with positive native field interior.

## Public caller contract

Existing `interp:{mode:'state',path:0}` and ordered
`rowTransitions:[{fromIds:['row-a','row-b'],toId:'row-a',interp:{mode:'state'}}]`
continue unchanged. `path` accepts0/1 or `linear`/`natural-cubic`. With two
endpoints their natural-cubic and linear values coincide; both use the canonical
native state preparation. A top-level `easing:'quadratic'|'linear'` selects the
shared clock independently of path. Defaultquadratic preserves the existing
once-only two-piece clock; linear passes the uneased coordinate to native state
and wave sampling. No host interpolation formulas exist.

Receipts expose `stateKernel` provenance, `stateGpu` memory/backend and
`stateFields` measured/desired normalized area, residual, authored color and zero
geometry-buffer readback. `diagnostics:true` additionally reports native field
peak. Identity-only frames have no field dispatch. Exact endpoints use the
original native outline scene.

Strict failures remain explicit: ≤256glyphs per paired/group endpoint,
256MiB GPU buffer budget, WebGPU required for changed geometry, finite source
fields, and uniform authored ink within each connected split/merge cohort.
Mixed-color cohorts require per-carrier color fields, currently unsupported.
The explicit CPU reference route rejects zero-measure removals; the public text
player uses GPU. No silent crossfade or quality fallback exists.

Ink area and RGB are prescribed per cohort, linear in the selected native
coordinate, within the reported numerical tolerance. Overlapping independent
cohorts can change their visible union area. Discrete glyph/component count is
not a real-valued conserved quantity; no general count/3D-volume law is claimed.
Finite qualification does not establish universal shape interpolation.

## Evidence

- `node tests/glyph-material-state/native.mjs --red`: native hollow-ring failure
  before / calibrated geometry after; actual existing canonical WASM.
- `node tests/glyph-material-state/browser.cjs`: unequal counts, ordered grouped
  expressions, positive field interior, full authored alpha, fixed heading,
  unchanged digit suffix, exact endpoints and same-player seek, both clocks,
  digit6→7, geometric removal, zero gas/carriers.
- `proof.webm`: six actual GPU frames, native VP9 encoder, 640x240 at2fps.
  `decoded-middle.png` is actual decoded frame3. No DOM fonts.
- Material reference parity16cases: worst carrier5.96e-8, capture4.47e-8;
  existing material WGSL is unchanged. Numerical source pins are in INTAKE.json.

Measured small-fixture software GPU compute144–200ms/intermediate frame,
counted native GPU buffers≈39MB. This is not a100Hz or general real-time claim.
Research basis: interpolation-exploration/research/core_contract/round_1 and
morphing/biological.vkf persistent lineage/implicit geometry/measure policy.
Full Navier–Stokes integration remains deferred; no analytic smoke relabeling.
