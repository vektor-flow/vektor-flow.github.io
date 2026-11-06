# Result-only label compilation exhausts retained native arena

Repeated expression-capability refresh calls compiler.compileScoped(), which called the retained kernel.compileWithContext() twice (semantic and display forms), then returned copied public metadata without exposing either native handle. The discarded allocations accumulated until the canonical VM arena exhausted. A later compiler.setDefinitions call then trapped before new plot definitions were prepared, leaving the old displayed curve. The old four/six-waypoint test and216 raw compileScopedProgram plots missed this distinct public-label route.

RED:2000 identical setDefinitions updates alone retain exactly272872 heap bytes and a subsequent cosine compiles. Adding one public compileScoped of the actual cubic product each iteration traps at index44, heap67381688, then later definitions/cosine also trap. This reproduces full49-view failure near view46, not unsupported cosine or equality syntax.

FIX: add kernel.compileWithContextValue(), using the already-qualified synchronous invokeTransient/copy/rewind path. Only result-only compiler.compile() and compileScoped() semantic/display calls use it. Their public metadata is unchanged. Existing kernel.compileWithContext(), compileProgram(), retained program/workspace/document handles, owner guards and every mathematical/compiler/WASM/shader artifact remain unchanged. The compiler uses the old method as a compatibility fallback when the value-only method is unavailable; deploy these two current075 JS files together.

GREEN:
- tests/symbolic-refresh/native.mjs: before/after real canonical WASM; old traps44, new2000 public refreshes preserve exact298440 heap checkpoint after every call. All44 old successful complete public metadata hashes match new results; ordinary retained program survives, cosine still compiles afterward.
- tests/symbolic-refresh/browser.cjs: actual Product compileScopedPlatonicLabel/document adapter with forwarded typed quantity metadata before each of216 native GPU plots. Same current075 kernel/controller, actual normalized face context and world clip, exact recorded215 numeric deltas plusbaseline. Every native heap remains272912; every committed LaTeX and ALL216 RGBA hashes equal the previous raw native face run. Late cosine and reset native images attached. This forwards existing quantity metadata; it does not add native typed-binding capabilities beyond emitted physical definitions.
- Syntax checks pass. No Product files edited. No plot source/renderer replacement or stale-frame guard relaxation.

Reproduce native comparison after recovering the old runtime from Git:
  git show 344523c:public/preview/0.7.5/vf-ui/vf-symbolic-kernel-runtime.mjs > /tmp/vkf-before-refresh-runtime.mjs
  node tests/symbolic-refresh/native.mjs
GPU integration defaults PP_CODE_ROOT to the owner's read-only PP src directory; set it explicitly when elsewhere:
  PP_CODE_ROOT=/path/to/PP/src node tests/symbolic-refresh/browser.cjs
Software Chromium flags remain the existing required Vulkan/SwiftShader flags. This is the native result-allocation fix, not a general VM garbage collector or a new numerical backend. Intake only the two files listed with exact hashes in INTAKE.json; native state7347/fromIds8b47 bytes are unchanged apart from this shared runtime extension.
