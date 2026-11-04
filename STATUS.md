# Native presentation integration — 2026-11-04

Owner task: Platonic Play must delegate plotting, text/math and state interpolation
through VKF, keeping fixed authored text coordinates and a fixed view. Base d60a0db
is byte-identical to the installed075 vf-display.js (SHA256379714f7a2ed5b4e4a8a056b88ae2f9b0eb537b79b17a6344683e373e058c68b).
Branch codex/platonic-native-presentation-20261104 changes that shared renderer.

- Honor the compiler's already-authored font_size on retained text; native math
  uses the native label scale, not another typesetter. Black, unrotated2D and
  finite (0,256] CSS-pixel bounds remain explicit. No alpha/color support claim.
- Retained2D plots default to equal aspect. The central axisViewport fits both
  ranges using one pixels-per-unit scale, preserving their center. Portrait,
  landscape and square measured units match exactly; shared inverse/view paths
  use the same mapper. 3D and explicitly authored aspect are preserved.
- waitForNativeLabelFrame joins actual lazy native label work and a compositor
  turn, rejecting disposed/failed frames. Geometry presentation previously
  preceded native font installation, so a consumer could capture missing math.

Consumer is the existing Platonic Play compiler/program-view interface. Its
Pythagoras source calls current compiler-paired .interpolation.blend on four
rigid translations and ordinary view.add for every shape/text/math item.
No Product glyph or triangle interpolation adapter is used. Consumer source:
/home/viktor/Projects/Tesseracs/.worktrees/platonic-phone-web-20261104.

Observed bounded evidence: native compiler65 translation samples; native view
unit tests1280x675,360x720,800x800 preserve centers and equal units; actual browser
source authoring/Copy3views and native font-size40 math; exact equation pixel hash
before versus midpoint matches after waiting for native text (failed capture
before readiness fix retained in consumer attempt2 logs). Native export recording
is pending; attempt3 passed pixel/unit checks then hit a Product YUV crop alignment
error, not a VKF rendering failure. No full-suite, physical GPU/phone, full glyph
state-transition, spectral reveal integration or broad release claim. The current
spectral unfolding source remains VKF-owned; no replacement is implemented here.

Public/compiler promotion is separate. This branch is a bounded integration fix,
not a replacement compiler, release descriptor update, or production publication.
