# Bounded native snap and explicit presentation policy

Runtime/controller source commit84ec0c0; numerical/text/font artifacts unchanged.

`createSymbolicPlotController(...).plot({...includeSnapGeometry:true})` retains
editor behavior by default. The result reports `snapGeometryStatus:'ready'`.
Explicit false disables optional CPU snap-geometry sampling and reports
`'disabled'`; the exact existing native GPU relation rendering and GPU analytic
picking remain active. Boolean type checks and controller compatibility keys
include the option. The caller must include policy in its own plot key and
request an editor replot after presentation ends. No errors are swallowed and
no old curve is reused as a fallback.

The existing scoped declaration-body constant expansion fix from PP was
canonicalized unchanged in behavior: preserve the declaration target, expand
its body, exclude bound parameter/target names. This serializes actual provided
native numeric definitions, without host arithmetic or extra typed-binding
claims. Source/context/clip and native compiler still own classification.

The reported frozen curve was a native snap trap before render commit. Native
ASTs and GPU shader keys changed correctly. Disassembly of the unchanged
129d2a183a4f73c4c56c9df50872bae21b5f2337e24a028a83609e620f2474dd kernel
shows function474 is the bump allocator and traps when next heap pointer exceeds
67381696 bytes. Native recursive `symbolic_sample_implicit` retains temporary
AST evaluations until all grid cells finish. The common combined finite curve
exhausts that arena; cos/exp/resonance component curves individually succeed.
This is not a domain or scope-cache error.

Single-variant implicit snap now uses the SAME unchanged kernel's public
symbolic_plot_capacity, symbolic_plot_builder, symbolic_sample_coordinate,
symbolic_relation_residual, symbolic_push_implicit_cell, builder_metadata and
symbolic_plot_result functions. JavaScript only orchestrates native calls and
caches identical native grid-vertex residuals; no evaluator, interpolation,
contouring or host numerical trajectory is introduced. Native x-major/y-minor
cell order and four-corner order are unchanged. Temporary tagged allocations
rewind between native calls. The native builder persists only for the plot;
its exact completed Float32 arena is copied before outer rewind. Handle owner
checks, required helper availability and finite bounded grid counts are guarded.
Other classifications/multiple variants retain their existing path.

NATIVE-QUALIFICATION.json records four exact successful old/new full native
Float32 buffers/metadata, unchanged-kernel hash, old common-curve trap and
successful repeated bounded common curves with restored heap checkpoints.
Bounded CPU snap costs about1.7s/common curve on this host; it is for editor
capability, not a low-latency claim.

BROWSER-QUALIFICATION.json uses the actual1280x720 root viewport, transform
[81,0,0,-81,640,360], unchanged17x17 native snap grid, same source/scope/revision
and first→second→seventh→first numeric definitions. Explicit false: native GPU
plot call/submission0.7–3.3ms and scoped compile10.8–32.4ms. These exclude GPU
completion/capture and are not60fps/hardware claims. Native analytic GPU pick
succeeds in every frame, encoded VP8 decodes distinct real curves, and returning
to the first state gives byte-identical accepted RGBA. Omitting the option then
restores ready/nonempty native snap geometry. Headless software Vulkan only.

Reproduce native A/B:

```sh
git show 618b30a:public/preview/0.7.5/vf-ui/vf-symbolic-kernel-runtime.mjs > /tmp/vkf-unbounded-symbolic-runtime.mjs
node tests/symbolic-snap/native.mjs
node tests/symbolic-snap/browser.cjs
```

Public intake is only vf-ui/vf-symbolic-kernel-runtime.mjs and
vf-ui/vf-symbolic-plot-controller.mjs from pinned075 (canonical public/vf-ui
copies also carry the change). No WASM/compiler or library pin replacement.
Current text-mode kernel/scalar tests and original renderer tests pass. Existing
physical font mappings/producer/certificates and72-label qualification pins
remain unchanged; six basic native coverage cases also pass. No synthetic fonts
or unproven glyph bindings were introduced.

WEBGL-BROWSER-QUALIFICATION.json repeats the same real scoped GPU/decoded
regression on software WebGL2: CPU plot/submission3.6–9.8ms, compile10.4–22.3ms,
GPU picks and default ready restoration pass. Font six-case basic coverage passes
263glyph instances with zero missing bindings. An auxiliary attempt to reuse
that basic-level test for72 full nested math layouts hit its test-only prohibition
on scriptscript keys; the overbroad extension was discarded, with no font/runtime
change or claim of a new72-layout rerun. Prior72-label source/physical font pins
and parent qualification remain unchanged.
