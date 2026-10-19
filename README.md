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
whole number. Two expressions always bounce. Operations compose only into a
supported simple operation (including exact multiply/divide reduction) or cancel.
The existing packaged VKF symbolic WASM kernel evaluates the arithmetic; the game
supplies compatibility policy, including native inverse checks for roots/division.

The page is a fixed visual-viewport shell. Touch/pointer panning is suppressed on
the surface. Controls and messages have stable layout; rules open in a dialog.
Pointer contact is swept and resolved before rendering. An indexed broad phase
separates unrelated objects; a merging pair becomes one reserved collision cohort.

The body and native LaTeX strokes deform through a shared compiler-emitted native
Morphing `field.union` / `segment.value` kernel. The operation's stroke geometry
shrinks into the expression while the expression changes into the result. This
is signed-field interpolation, not a label crossfade or instant replacement.
Glyph packets are prepared once per merge and stay resident on the GPU. Sources,
compiler/library pins and source hashes are in MORPHING.json. This does not claim
semantic glyph matching, exact volume conservation or physical GPU performance.

A 15-tile native atlas is copied without resampling. Glyph layouts, object IDs and
contact-grid buckets are cached/indexed. Tap/keyboard pairing routes the operation
around other compatible objects when space permits; otherwise move them closer.
Reduced motion stops drift and shortens the geometric merge. Reset disposes active
morph packets. The pinned public compiler and selected text-wave demo are unchanged.

Run `node tests/math-life-rules.mjs`, `node tests/math-life-contacts.mjs`,
`node tests/math-life-browser.cjs` and `node tests/math-life-morph-browser.cjs`.
Checks include 250 numeric compatibility cases, expression-pair rejection, simple
operation composition, 1,800 crowded contact frames, page position while dragging,
held-pointer merge/bounce, touch and keyboard input, native LaTeX pixels and the
complete quest. Morph checks sample five actual GPU geometry states and compare
64 shared kernel values against compiled native VKF, on desktop SwiftShader and
software WebKit. `scripts/math-life/build-merge.py` reproduces the native kernel
and oracle; `compile-merge.py` mechanically translates its scalar WGSL to GLSL.
