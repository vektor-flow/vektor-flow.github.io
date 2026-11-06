# Live time controls and axis intersections

The actual Product source/physical definition set is retained in `tests/native-axis-pair/live-fixture.json`. At t=2.527 seconds, the old e03 shader rejected factorization because the quantized time controls use `abs(floor(t...))`. It fell back to the implicit product, whose gradient vanishes at crossings. In the genuine face chart and1280x720 native GPU viewport, the three tested crossings were black.

The native shader now accepts spatially constant `abs` in the existing total-real eligibility test and emits its exact zero spatial derivatives. Spatial `abs(x)` remains on the existing path; domain-sensitive sqrt controls also remain unchanged. No extra axes, thickness, overpainting, host sampling or native numerical artifacts were added.

The same scoped native compiler/controller/GPU test now reports three exact zero-set factors. Crossing RGB values are230/194/230, identical to the separate native relations at those pixels. Domain-sensitive and spatial-abs eligibility controls remain unchanged. See LIVE-RED-AXES.json and LIVE-AXES-QUALIFICATION.json. The one public shader file is independently ingestible; the glyph visible-area and native physics gaps are separate.
