Canonical glyph-field geometric measure investigation,2026-11-06

NOT READY. This checkpoint preserves an area-GREEN/count-RED prototype.
The actual27-to1 authored glyph cohort is the original packing-actual27 fixture;
no alternate correspondence, host interpolation, font or target-shape swap.
Native source8c017be5c63b2f8444cc6e20d89ac1f4d79916c4 emits local zero-contours
using the original scalar clipping implementation. For join=0, union of carrier
positive sets is the existing max-field positive set. MSAA/depth presents their
union and per-carrier RGBA through the existing resident mesh renderer.

Endpoint-visible-alpha area989.788→35.059 CSSpx². Existing native calibration,
with test-only measured-pixel oracle, meets linear endpoint targets within1px at
q=.25,.5,.75 in3,2,5passes. The old soft SDF measure/global257 lattice did not.
However ALL visible connected components are29→37→43→13→1; even removing only
components smaller than4px² would leave29→32→27→10→1. No filtering is applied.
This FAILS monotonic body/count acceptance and is not a finished solution.

Current research distinguishes continuous field interpolation from discrete
count/connectivity events: generalization/working_reference.txt lines62-63.
core_contract/round_1/limitations.txt explicitly excludes topology proofs.
Neither the old global renderer nor this local-contour prototype establishes a
universal object-count or topology guarantee. Need isolate native field topology
before claiming a rendering correction resolves it.

Reproduction: set VKF_LIBRARY_DIR to the owned native source checkout and
NATIVE_CARRIER_ROOT to a fresh exact current075/emitter build containing state,
carrier and calibrate.{wasm,json},state/carrier.wgsl(+manifests),PROVENANCE.json;
run node tests/geometric-material/local-browser.cjs with supported software flags.
Full source/compiler/WGSL hashes and raw PNGs are in LOCAL-QUANTITY.json.
Snapshot qualification is separate: docs/state-resources/SNAPSHOT-QUALIFICATION.json.

Readback of actual GPU evaluated fields confirms the extra islands PRECEDE
rendering: positive-lattice8-neighbour component sums across carriers are
29,53,67,32,27 at q0,.25,.5,.75,1. Target27 duplicate carrier fields overlap
into ONE visible body. At q.5 individual native carrier fields have1–4 pieces.
This is a native continuous field-blend topology limitation, not just AA.

Reproducible build entry: tests/geometric-material/build.mjs. Set VKF_LIBRARY_DIR,
VKF_COMPILER_DIR, VKF_GPU_EMITTER to the qualified sources/toolchain, then use its
reported output as NATIVE_CARRIER_ROOT for the browser qualifier.
