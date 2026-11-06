# Measured native live-frame caches

Only immutable per-initialized-context WebGL capability queries are cached:
VERTEX/HIGH_FLOAT precision, SUBPIXEL_BITS, MAX_TEXTURE_SIZE. All existing
precision, raster-envelope, memory and viewport guards still run using the exact
same values; no renderer/backend/AA/quality change. Initialization refreshes the
cache; destruction clears it. Mutable GL state queries are not cached.

Actual1280 native boundtable05 proof:24valueframes exactlyRGBAidentical before/
after. Precision/subpixel/maxtexture calls drop24/24/25 to1/1/1 total. Native
font/layout/capture/bounds remain unchanged. Context recreation requires normal
renderer initialization; no automatic GPU fallback is added.

Compiler setDefinitions now returns immediately only for identical orderedglobal
strings and identical per-scope localstring lists (local objectkeyorderirrelevant).
Changedglobals, changedlocals and scope removal still replace definitions. A
native failure leaves the lastaccepteddefinition state intact. This does not
cache ASTs or plot frames and does not alter retainedprogramhandle ownership.
2000sameupdates:zeroadditionalnativecompilecalls, exactheap272872, nativeboundAST
parity; changedglobal/local/removal and retainedprogramsurvival pass.

Tests: tests/live-cache/browser.cjs (VKF_OLD_CAPS=1 recordedcontrol) and
 tests/definition-cache/native.mjs. Same canonical current075symbolicWASM.
