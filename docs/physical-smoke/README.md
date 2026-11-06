# Native physical-fluid probe

This is a scoped numerical prototype, **not a ready physical-smoke session or
text-material integration**. No installed public runtime, Interp mode, native font
resource, Product source, or prior glyph rendering asset changes.

Library source455e67866bd21c1645d6c1f85af4420efdbde353 contains Fluid.vkf. The
accepted unforced baseline is24x16x8 periodic MAC, lengths1.6x1x0.4, nu0.0004,
RMS initial velocity0.055, MINMOD conservative scalars, constant viscosity,
Cs/diffusivity/buoyancy/loading/cooling/collector all0, fixed ticks1/60. The
reference source hashes are in the fixture and qualification reports. Temperature
is0, with declared thermal diffusivity0.0002. Initial fields are offline oracle
input, not a Product Python runtime or a qualified native initialization API.

The exact current075 compiler owns emitted typed IR; the existing hash-checked
GPU emitter owns all numerical WGSL. Host code only schedules dispatches/copies
and performs test comparisons. Native separable direct DFT solves the same
periodic discrete D/G pressure eigenproblem. No FFT performance claim.

Reproduce with the pinned compiler installed at the path in build-probe.mjs:

```sh
python3 tests/physical-smoke/reference.py
node scripts/physical-smoke/build-probe.mjs
node tests/physical-smoke/clock.mjs
node tests/physical-smoke/operators.cjs
node tests/physical-smoke/ssprk.cjs
```

OPERATORS.json records the first5-entry gate; SSPRK.json records the later7-entry
build. Both preserve their exact source hashes/build paths. A fresh reproduction
may update generated latest-build.json and reports. Cached /tmp files are local
qualification inputs, not published native artifacts.

The SSPRK gate compares1/6/18 ticks against accepted CPU fields; after0.3s at
24x16x8 max velocity/scalar errors1.104e-7/3.327e-7, species absolute mass drift
<=7.103e-10. Whole-tick observation partitions are byte-identical GPU states.
Native f64 nanosecond clock tests include ties-even, large absolute epochs and
invalid inputs. Native f32 is explicitly approximate; no CPU1e-9 divergence claim.

SwiftShader measured161ms median per physical1/60 tick, including native three
projections and per-tick diagnostics readback. Owned test buffers7.10MB. This is
not60Hz, complete browser RSS, a marker-render benchmark or low-memory claim.

Missing gates: native initial-condition preparation; stage/CFL acceptance and
rollback policy; full snapshots/public session; markers/shared-flow rendering;
SGS/variable viscosity; ports/lift/receiver; finite source reservoir; actual native
glyph mask coupling and moving first-creation materialization. Parent's coarse
averaged glyph-reaction closure is known false; its area conservation does not
qualify a sink. Accepted fine-pixel segment interception remains separate. No
prescribed vortices, particle destination trajectories, thermal phase change,
physical-air calibration, DNS or two-way material coupling is claimed.
