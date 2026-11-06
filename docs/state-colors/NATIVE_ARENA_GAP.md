# Current075 detached native arena boundary

The initial complete 29-view attempt was RED at view 7, before attributes or
rendering. The restored 86 source plus scoped preparation subsequently passed
all 29 color/resource contract checks. Visible pixel-area/quality remains a
separate unqualified issue. This document preserves the native arena gap; it
does not claim a generic GC repair or overall visual readiness.

The failure reduces to two value-only native invocations on one current075
kernel with diagnostics enabled:

```js
kernel.invokeValue('contour_field', fixture.contour);
kernel.invokeValue('prepare_geometry', fixture.geometry);
```

The exact arguments are recorded in the library test fixture
`tests/morphing/packing-gc-fixture.json`. They came from current genuine native
physical outlines for Product lesson view 7; no glyph or field was substituted.
The geometry inputs are finite, size 65, dimension 2, seven carriers, offsets
`[0,7,8]`, and 33800 supplied signed-field cells. Geometry alone succeeds,
including four repetitions on one fresh kernel. Both diagnostic modes succeed
when testing geometry alone. The existing native `vkf_vm_reset()` between the
two calls does not repair the failure. Complete 223-call recorded history
reproduces the same trap in Node and Chrome, despite the heap pointer returning
to 13532896 after each completed value-only invocation.

For the captured state.wasm SHA
`88a184cc9bebb2b1ccd7334fb834bdb9b4b8be3d6c00c95e6ce81e6267caebaf`,
the trap is in function 136 at 0x13897f: the native GC heap scan asserts that an
allocation header has size at least 8. Its underlying cause has not been isolated.
This is not evidence for invalid glyph geometry, an opacity correction, or a
general array-language defect. The attempted whole-output comprehension source 571a16a did not repair the
shared-arena reproduction, and an actual 27→1 glyph case then returned a corrupt
native value tag 65538 even on a fresh instance. It is rejected and removed from
active source. The exact d429 carrier-chunk implementation was restored by 86d5841;
actual geometry and per-carrier RGBA hashes match the original full kernel.

`kernel-ownership.mjs` tests the supported isolation boundary: one cached exact
WebAssembly.Module, a fresh instance for each detached value-only operation,
materialize the value, and release all instance/kernel references. It uses no
forced GC, host numerical algorithm, retained handle, or alternate source.
`KERNEL_OWNERSHIP.json` records 216 applicable operations from 223 recorded calls,
48 exact native fields,17 geometry plans matching actual prepared inputs, and
seven distinct attribute plans matching actual GPU control inputs. It also
records instance creation costs and resident/external memory accounting. This
is bounded evidence for detached preparation ownership, not a repaired compiler
GC implementation or a claim of constant process memory. Retained-program APIs
must retain their existing instance ownership.

The full authored browser gate was rerun with the explicit preparation boundary
and native capture barrier; QUALIFICATION.json records its color/resource PASS.
That does not qualify the separately observed visible-area/shape issue. No pixel gate or
positive-interior gate is relaxed by the ownership change.
