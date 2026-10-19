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
there is no repeating per-glyph wave or contour stage. A faint near-white gradient
settles to white. Compare smooth growth with a 10% size overshoot that settles to
the same typeset geometry. Time, k, v and the growth toggle are live uniforms;
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

## Publication

Run `python3 scripts/verify-current-site.py`,
`python3 scripts/package-morphing.py`, then `python3 scripts/update-manifest.py`.
CI checks exact compiler/source bytes, retired paths, local links and the complete
deployment manifest before GitHub Pages publication.
