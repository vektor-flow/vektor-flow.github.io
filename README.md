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
