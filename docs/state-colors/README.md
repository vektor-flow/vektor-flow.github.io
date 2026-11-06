# Authored mixed-color native state qualification

QUALIFICATION.json records the completed 29-view color/resource contract PASS
on source 86d5841, after explicit same-browser views 7/18 warmups. All three actual
authored groups passed full coordinates, exact endpoints/seek/headings, every
source color, and target RGBA. This does NOT qualify near-linear visible pixel
area: decoded intermediate contours appear thin/disconnected, and a separate
independent native area probe is RED: actual 27-cohort midpoint alpha is 60.4%
below its endpoint-linear value; zero-contour area 65.06px² differs from the
calibration desired 1148.32px². See docs/state-resources/RENDERED-AREA.json. Do not mark overall
visual quality or the owner's complete interpolation requirement ready from
these color checks alone.

Fixtures come from the actual Product exports authoredLabelSpecs and
presentationTextTransitions for its current 29-view examples/cubic-equation.vkf.
The generated actual-lesson.json records the input and helper hashes. Bound
numeric tables are excluded by the actual projected liveBinding marker, as in
Product. No test matcher, color rewrite or replacement glyph layout is used.

Commands, from this renderer worktree:

```sh
node tests/state-colors/fixtures.mjs /path/to/actual-product-worktree
VKF_STATE_COLORS_RED=1 node tests/state-colors/browser.cjs
node tests/state-colors/browser.cjs
```

The RED gate calls the actual public preparation API with the authentic
three-source colored group and the previous uniform-color implementation.
RED.json preserves its explicit nonuniform-ink rejection.

The current full gate tests the midpoint of all 29 transitions. All three
authored many-to-one groups receive 0/.25/.5/.75/1, independent genuine native
endpoint renders, and repeated .5→1→.5 seeking with exact RGBA byte hashes.
Every authored source color must occur in its native carrier channels; every
native target color must equal the actual target's authored RGBA. Per-carrier
RGB follows the same native state clock to 1e-12, with alpha exactly 1. Shared
headings retain exact pixel hashes. Native signed-field interiors must remain
positive. Smoke/carrier counts stay zero for this ordinary-state lesson.

The GPU resource gate retains 256 MiB for the native field buffers, and receipts
preserve actual backend, field count, peak values and reported memory. The
owned Chrome process tree is sampled each second for RSS. Process RSS sums can
count shared pages more than once; they are observed host measurements, not a
low-memory-device guarantee. KERNEL_OWNERSHIP.json separately records bounded
native preparation-arena evidence and its resident/external memory pressure.
NATIVE_ARENA_GAP.md preserves the minimal shared-arena GC failure and the exact
scope of the fresh-instance value-only boundary. Retained handle APIs are not
changed or qualified by that workaround boundary.

The proof movie is a short native VP9 capture of the two group transitions;
view 7 contains two actual groups and view 18 contains the three-source group.
The qualifier decodes selected frames with ffmpeg and stores native intermediate
PNGs. It does not record or publish the entire Product lesson.

Scope: this browser profile uses 2D finite-grid signed fields and calibrated area,
with exact physical native endpoint outlines. RGBA is an authored native linear
state channel on the shared clock. Each contour vertex uses its dominant native
material owner's RGBA. This is not optical mixing, 3D rendering qualification,
CFD or native Navier–Stokes. Field resolution/calibration and GPU/WASM precision
limits remain those of the canonical biological/field implementation.

Measured full gate: 45 maximum native fields, 30,363,960 maximum reported field
GPU bytes under 256 MiB; sourceRGBA interpolation error 0. Sampled owned Chrome RSS
sum peaked 2,296,893,440 B (renderer-process sum 1,410,842,624 B; GPU 511,070,208 B).
These process sums can count shared pages repeatedly. Diagnostic-enabled view 6
midpoint measured 7002 ms native/7869ms through composite and 51,524 ms preparation;
these are NOT production diagnostics:false timing estimates. The default-off
native peak/color diagnostics add substantial work. The explicit warmup movie
contains 10 VP9 frames at 1280×720, 4 fps, 2.5 s. Decoded view 7/view 18 midpoint PNGs
were inspected and prompted the visible-area concern above. Historical
DIAGNOSTIC.json belongs to source 32 and is not the current full-gate result.
