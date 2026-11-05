# Exact native material performance gate

Final numerical source pin0e7ff86041170ef7bcdf7bd56ddbf965d6f2c2e0. Only
immutable nested arrays/carrier count are hoisted, and destination x/y are read
once before the same nearest-anchor loop. No scalar math, summation order,
correspondence, trajectory, colors, carrier cap, fonts or renderer budget changes.

Actual UI-authored exported163source→180targetglyph fixture,4096carriers: complete
RGBA frame SHA256 hashes match before/after at q0,.25,.5,.75,1. Native sampling
4701–4856ms before,1960–2094ms after, about2.3times faster. Preparation including
actual native font work56784→42649ms. Both runs retain134217728-byte outline
cache cap. See MATERIAL-4K-QUALIFICATION.json. Four complete4096carrier native
packets also compare exactly, with the final sampling function byte-identical
to that qualified sampler (constructor-only x/y change followed).

Quick final synthetic1024carrier/170glyph native measure: prepare1336ms, full
invokeValue sample including tagged ABI write/decode139ms. This is CPU/WASM,
not GPU compute, an actual-font browser latency, or a60fps claim. The host may
choose its existing lower carrier budget independently; exact4k tests here
retain4k. Remaining generic WASM throughput is an explicit limitation.

Diagnosis: old4096call measured~4.6–5.1s inside guest vs~125–139ms tagged input
write; this was not JSON, GPU capture or font rendering. Local array hoists
remove repeated deep prepared-record projections. A bounded block-layout
prototype and a cached cubic-basis prototype preserved packet equality but
did not improve over simple hoists; excluded from final sources. No alternative
math implementation or experimental schema shipped.

Engine handoff: a persistent immutable native plan handle and a bulk f64 execution
ABI could avoid repeatedly rematerializing large tagged arrays and improve
interpreter aggregate work. Current generic kernel.invoke returns a shallow
SymbolicKernelHandle; retaining prepare_vapor_transport's result, invoking
vapor_front, then sampling that handle caused guest out-of-bounds in the tested
current compiler. No safe lifetime claim is made; final code continues copying
immutable values through the supported invokeValue path. Metadata diagnostics
are themselves explicitly scoped until-reset-or-next-invoke. This is a bounded
observed unsupported optimization, not a claim that opaque symbolic workspaces
or all existing handles are broken.

A larger record-block assignment prototype left its initialized records unchanged.
Minimal literal/repeated record arrays, fixed/dynamic index and while-loop update
controls all returned7 as expected on the same compiler binding; no general
record-array compiler defect has been established or should be forwarded.

Reproduce actual fonts/pixels: VKF_BEFORE_ARTIFACTS=...
VKF_AFTER_ARTIFACTS=... node tests/text-modes/material-4k.cjs. Native full packets:
node tests/text-modes/native-4k.mjs with those artifact roots. Artifact builds use
existing scripts/text-modes/build.mjs at b29b588 and0e7ff86. Browser shader/math
route and capturef5db remain unchanged; parent owns final PP density/video check.
