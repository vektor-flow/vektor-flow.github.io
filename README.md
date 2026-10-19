# Vektor Flow public site

The public compiler remains the reviewed 0.7.2 package, pinned byte for byte in
`public/current-compiler-release.json`. Do not promote compiler candidates through
website changes. Browser checks use explicit software rendering; preserve the
physical GPU stop.

## Current text example

`public/previews/morphing-current/` contains one real-time LaTeX text-unfolding
example. The owner-selected defaults are k=4, v=0.54, 32% overshoot, Grow and Loop
on. All controls remain adjustable: k 1–10, v 0–1, overshoot 0–50%, and time.
The former comparison demos and their runtime files are removed.

Native `Morphing.unfold` owns the quarter-period sin² alpha ramp, back-ease size
and red-to-violet-to-white color. The compiler emits indexed scalar channels;
`compile-unfold.py` mechanically translates its scalar WGSL output to WebGL GLSL.
UNFOLD.json records library and compiler hashes. The public compiler stays 0.7.2.

The existing LaTeX engine supplies layout, native atlas glyphs and rule coverage.
Glyph instances, cumulative row offsets and row IDs are prepared once per layout;
GPU instance/vertex indexing handles playback. Control/output nodes are cached.
Changing time, k, v, overshoot or growth does not upload glyph geometry. Rows
finish sequentially, with one active front. No text is parsed during animation.

The compact atlas copies native tiles without resampling. ASSETS.json records
the build; SOURCE.json records engine and current source hashes. Extra glyphs
can load the existing full LaTeX resources. Old clips and inactive runtimes stay
retired; this page renders live and requests no videos.

`node tests/current-morphing.cjs` checks desktop SwiftShader and software WebKit,
selected defaults, live controls, editable LaTeX, stable GPU geometry buffers,
white endpoints, spectral ink and float GPU parity with 96 native kernel samples.
Set VKF_SITE_URL for hosted verification. No hardware performance is claimed.

## Publication

Run `python3 scripts/verify-current-site.py`,
`python3 scripts/package-morphing.py`, then `python3 scripts/update-manifest.py`.
CI checks exact compiler/source bytes, retired paths, local links and the complete
deployment manifest before GitHub Pages publication.

## Living mathematics demo

`public/previews/math-life/` is the Cuvami drag-to-merge game preview. Start with
zero and reach twelve. An operation applies to an expression if the result is a
Gaussian integer (a + bi, with integer a and b). The chosen root of −1 is +i.
Two expressions always bounce. Operations compose only into a
supported simple operation (including exact multiply/divide reduction) or cancel.
The existing packaged VKF symbolic WASM kernel evaluates the arithmetic; the game
supplies compatibility policy, with exact BigInt witnesses guarding floating-point arithmetic and Gaussian roots.

The page is a fixed visual-viewport shell. Touch/pointer panning is suppressed on
the surface. Controls and messages have stable layout; rules open in a dialog.
Pointer contact is swept and resolved before rendering. An indexed broad phase
selects mathematical contacts; VKF separates unrelated objects; a merging pair becomes one reserved collision cohort.

The body and native LaTeX strokes deform through a shared compiler-emitted native
Morphing `field.union` / `segment.value` kernel. The operation's stroke geometry
shrinks into the expression while the expression changes into the result. This
is signed-field interpolation, not a label crossfade or instant replacement.
Glyph packets are prepared once per merge and stay resident on the GPU. Sources,
compiler/library pins and source hashes are in MORPHING.json. This does not claim
semantic glyph matching, exact volume conservation or physical GPU performance.

The game calls the shared `createLatexRenderer`: WebGPU uses the original unchanged
`draw.wgsl`, with a transparent label surface over the morphing bodies. Browsers
without a usable WebGPU device use the shared renderer's WebGL2 material adapter.
Both consume the native 16-float (64-byte) glyph/rule ABI; TextWave is no longer
part of the game. Atlas resources can be shared per device and compact atlas.
The document renderer's full-atlas default remains supported.

Balls retain release velocity and free motion has no drag. Unequal-size contacts
use elastic area-weighted impulses; merges retain area-weighted incoming velocity.
Expression radii grow with magnitude, capped to keep the world usable. Native
body morphology changes smoothly to that radius. The palette includes +i, ×i
and a −1 expression so the imaginary direction can be explored directly.

An 18-tile native atlas is copied without resampling. Glyph layouts, object IDs and
contact-grid buckets are cached/indexed. Tap/keyboard pairing routes the operation
around other compatible objects when space permits; otherwise move them closer.
Reduced motion stops drift and shortens the geometric merge. Reset disposes active
morph packets. The pinned public compiler and selected text-wave demo are unchanged.

Run `node tests/math-life-rules.mjs`, `node tests/math-life-contacts.mjs`,
`node tests/math-life-motion.mjs`, `node tests/math-life-browser.cjs`,
`node tests/math-life-latex-browser.cjs` and `node tests/math-life-morph-browser.cjs`.
Checks include 250 numeric compatibility cases, expression-pair rejection, simple
operation composition, 1,800 crowded contact frames, page position while dragging,
held-pointer merge/bounce, touch and keyboard input, native LaTeX pixels and the
complete quest. Morph checks sample five actual GPU geometry states and compare
64 shared kernel values against compiled native VKF, on desktop SwiftShader and
software WebKit. `scripts/math-life/build-merge.py` reproduces the native kernel
and oracle; `compile-merge.py` mechanically translates its scalar WGSL to GLSL.

The LaTeX browser check uses explicit SwiftShader for ANGLE and Vulkan (physical
GPU stop preserved). It verifies the original WebGPU shader, pixel parity with
its WebGL2 adapter, the −1 → i → −1 interaction and changing sizes. Rules tests
include 961 independent Gaussian root cases. Browser release checks cover
persistent velocity on desktop and phone. Existing numerical merge-kernel
qualification is reused; that native source and generated shader are unchanged.

Throws use an indexed 32-sample pointer ring and the last 100 ms of real pointer
time, including coalesced touch samples. Release speed follows gesture speed;
holding before release stops the ball. Explicit throws also run with reduced
motion enabled. Free motion subdivides travel before contact resolution so fast
throws still merge or bounce without tunneling. `node tests/math-life-toss-browser.cjs`
checks slow/fast flicks and hold-to-stop with desktop mouse, native browser touch
input and software WebKit. `math-life-motion.mjs` checks timing/event-rate parity,
speed bounds and fast compatible/incompatible contacts independently.

The physics integration now calls the packaged VKF browser reference
`stepRigidPolygonWorld2D` for both time advancement and collision response.
`physics.mjs` maps stable IDs, analytic circles, area masses, authored walls and
kinematic grabs; it contains no impulse solver. `contacts.mjs` retains the indexed
compatibility/merge policy. PHYSICS.json pins exact runtime bytes, independently
matched to the canonical bootstrap and public-site copies. Tests include direct
runtime delegation, glancing impacts, walls, kinetic energy/momentum, kinematic
grabs and crowded no-overlap frames. The browser's actual engine identities and
native16 GPU label ABI are checked; object buttons contain no visible DOM math.

This uses the existing JavaScript browser physics reference. It does not complete
the native VKF physics/compiler port. LaTeX glyph drawing uses the GPU; its
existing layout/typesetting remains JavaScript. The native symbolic WASM and
compiled Morphing field kernels remain separate, unchanged components.
