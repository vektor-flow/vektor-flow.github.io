# Existing GPU relation exponential support

Both canonical public/vf-ui/geom/vf-symbolic-relation-shader.mjs and its pinned
public/preview/0.7.5 copy now emit the GPU built-in exp for real scalar fields and
relations. Explicit curves use exp(a), exp(a)*a1, exp(a)*(a1*a1+a2) for value and
first/second jets. Exactly one argument is required; unsupported calls still refuse.
Existing complexExp implementation, parser, renderer, native kernel and transport
artifacts are unchanged. No host sampling or exp approximation is introduced.

PP intake: copy pinned shader into public/vkf-0.7.5/vf-ui/geom/. Import the EXISTING
createSymbolicPlotController from /vkf-0.7.5/vf-ui/vf-symbolic-plot-controller.mjs
instead of the separately installed package path. Its existing relative imports
resolve geom/vf-symbolic-plot-renderer.mjs then vf-symbolic-relation-shader.mjs.
Preserve that current075 controller/runtime/renderer closure and existing
vf-ui/artifacts/vkf-symbolic-kernel.{wasm,json}. No node_modules edits or package
publication is required. Controller and renderer themselves have no source changes.

Checks: node tests/symbolic-exp/shader.mjs, node tests/symbolic-exp/browser.cjs,
VKF_FORCE_WEBGL=1 node tests/symbolic-exp/browser.cjs; existing renderer tests.
Pure checks cover scalar/relation emission, chained first/second exp(x*x) jets at
five negative/zero/positive points and malformed calls. Browser tests use the
actual packaged native parser/controller and GPU relation rendering for
y=1.5*exp(-0.2*(x+4))*cos(2*(x+4)+0.3)-2.8; existing capture encodes three VP8
frames, ffmpeg decodes visible cyan curve pixels. Both software WebGPU and
WebGL2 pass without diagnostics/page errors. Qualification JSON records exact
source, native TeX/classification, backend, viewport and decoded pixel count.
Decoded /tmp/vkf-native-exp.png was visually checked.
