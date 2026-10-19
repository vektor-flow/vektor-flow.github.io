# Vektor Flow public site

The public compiler remains the reviewed 0.7.2 package, pinned byte for byte in
`public/current-compiler-release.json`. Do not promote compiler candidates through
website changes. Browser checks use explicit software rendering; preserve the
physical GPU stop.

## Current text examples

`public/previews/morphing-current/` now contains real-time LaTeX wave rendering.
The existing text-flow/LaTeX typesetter, instance packer and native MSDF glyph
atlas provide the text and equations. One shared WebGL2 shader uses a clamped
quarter-period sin² alpha ramp along reading order. Lines finish sequentially;
there is no repeating per-glyph wave or contour stage. Color travels from red through violet across alpha 0–0.8, then fades to white
across 0.8–1. Compare growth with adjustable 0–50% size overshoot; both settle to
the same typeset geometry. k ranges from 1–10 and v from 0–1 (zero holds the front).
The slower defaults are k=4 and v=0.25. Time, k, v, overshoot and growth are live uniforms;
geometry uploads occur on layout changes, not animation frames.

The compact atlas copies existing glyph tiles without resampling. Its build
receipt is ASSETS.json; original engine/atlas hashes and current source hashes
are in SOURCE.json. Extra glyphs can load the existing full LaTeX resources.
The old sentence recordings and CPU morphology archive are removed from public
assets. There is one active example implementation. Do not restore stale clips
or imply that playback controls are real-time rendering.

Run `node tests/current-morphing.cjs` against the local range server or set
VKF_SITE_URL to the deployed site. Tests use Chromium SwiftShader and software
WebKit, check actual GPU pixels, live controls, editable LaTeX, stable geometry
buffers and the absence of video requests. No hardware performance is claimed.

The third comparison is sequential mitosis: the first symbol is present, then
one coincident child separates from the preceding symbol and changes into the
next native LaTeX glyph. Earlier symbols stay in place. This adapter supplies
reading-order correspondence, not automatic semantic matching. Glyphs with holes,
rules, crossings and line wraps are not a universal topology/collision solution.

`MITOSIS.json` records the unchanged native `segment.value` and `field.union`
sources, compiler-emitted WGSL and mechanically translated scalar GLSL. Sources
and license live in `scripts/text-wave/mitosis/`. The translator rejects unsupported
emitted scalar syntax. No per-sentence shape workaround or video fallback is used.
`python3 scripts/text-wave/verify-mitosis-native.py` reproduces 64 native oracle
values; the browser test compares actual float GPU output to those same values.
The separately pinned public compiler remains unchanged.

## Publication

Run `python3 scripts/verify-current-site.py`,
`python3 scripts/package-morphing.py`, then `python3 scripts/update-manifest.py`.
CI checks exact compiler/source bytes, retired paths, local links and the complete
deployment manifest before GitHub Pages publication.
