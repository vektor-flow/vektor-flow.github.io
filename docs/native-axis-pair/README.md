# Native zero-set intersections and retained physical pairs

The product residual F=f*g*h has both F=0 and gradF=0 where two regular factors
cross. Existing implicit Newton/distance projection rejected these pixels.
Actual native compiler/controller/WebGPU RED: all3known crossing pixels black;
separate native relations haveRGB229–230. The shader compiler now reuses the
EXISTING per-explicit-curve zero-union distance path for eligible total-real
products equalzero. Actual crossings now match the separate native relations.
No alpha/line-width/overpaint/hostrenderer change. The full source equation stays
unchanged, and a single existing GPU relation renderer draws the exact union.

Eligibility is deliberately conservative:2–8explicit x/y factors, total-real
supported operations; division only by provably nonzero constants, sqrt only
provably positive constants, floor only spatially constant. Inequalities,
nonzero RHS, ambiguous or domain-sensitive factors retain prior behavior.
Domain-control fullRGBAimage is EXACT before/after. Existing legacy invalid-domain
plotting behavior is not qualified/corrected by this patch. Native finitef32 and
existing explicit-distance numerical limits remain; no general algebraicfactorer.

Ordinary glyph state already reserves native closest equalphysicalID pairs.
When BOTH residual sets are nonempty, the adapter now keeps those pairs as
independent native affine/identity cohorts and routes ONLY unmatched residuals
through the SAME canonical native reserve_groups/field path. One-sided residuals
retain existing donors. No host matcher, new state algorithm or artifact change.

Actual public grouped Complete Square regression: old control retains<4native
pairs andfails; new preserves4through allintermediates, fixedheadingexact,
endpoint/seekexact, zero gas, positive opaque nativefield material, samearea law.
Glyphs can move under nativeaffine placement when layoutchanges. This policy
doesnotpromise semanticmatching orfixa part forcedintoone-sided split/merge.

Run tests/native-axis-pair/axes.cjs (VKF_OLD_SHADER=1 for recordedRED control),
tests/native-axis-pair/pairs.cjs (VKF_OLD_PAIRS=1 for actualfailingOLD control),
and tests/symbolic-{exp,floor} pure regressions. Currentad9nativeWASM/shaders,
fonts/capture/PMA/value-onlyruntime remainunchanged. MixedRGBAcohortsupport is
independent nextnativefieldchannel extension, not claimed here.
