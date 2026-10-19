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
zero and reach twelve. Values add; operations apply to values; like operations
compose and inverse pairs cancel. Invalid fractional/non-real results preserve
both objects and repel them. This first round uses exact whole-number arithmetic.
The existing packaged VKF symbolic WASM kernel parses and evaluates expressions;
the game supplies compatibility policy. It does not use JavaScript eval.

Native LaTeX glyphs/rules use a 15-tile atlas copied without resampling from the
existing font atlas. A single WebGL2 canvas presents objects and glyph instances.
Cached glyph layouts and object-ID maps are reused; a spatial grid finds nearby
drop targets. Pointer dragging, touch pairing and keyboard pairing share the same
merge function. Reduced motion stops drift. The operation tray replenishes the
world; reset cancels unfinished transitions. SOURCE.json pins implementation,
native symbol kernel and font dependencies.

Run `node tests/math-life-rules.mjs` and `node tests/math-life-browser.cjs`. The
first checks 250 native arithmetic compatibility cases plus composition and
cancellation. The second checks actual drag rejection, successful drag merges,
touch pairing, keyboard cancellation, tray spawning, the complete quest and
native LaTeX pixels on desktop SwiftShader and phone software WebKit.
