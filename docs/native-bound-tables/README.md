Native bound numeric tables use the existing current075 parser, array layout,
retained command tree, font resources and certified physical glyph renderer.
The new small VKF kernel extracts actual retained numeric-cell owners and anchors,
reserves native widths from declared bounds, formats values and emits typed
physical-glyph keys/positions. It does not infer geometry from flattened ink.

```js
import {prepareNativeBoundTables} from './vf-ui/native-labels/vf-native-bound-tables.mjs';
const table = await prepareNativeBoundTables({
  tables: [{id:'coefficients', anchor:[81,180], scale:3,
    color:[.5,.95,.85,1], rows:[
      {id:'a-cell', label:'a', variable:'a', precision:2, min:.9, max:1.1},
      {id:'d-cell', label:'d', variable:'d', precision:2, min:6, max:7}
    ]}],
  typography, width:1280, height:720, pixelRatio:1, signal
});
container.append(table.element);
await table.sample({a:1, d:6.01});
const diagnostics = table.receipt();
// table.canvas is the accepted native layer for the existing capture compositor.
table.close();
```

Prepare once for the run; keep the same instance through numeric changes and
views. Bounds must cover the full run. Cells retain their identities, widths,
alignment and baselines. Per-frame work performs no typesetting/layout. The
adapter maps authored variable names to scalar values and marshals native output.
Queued obsolete samples return `SUPERSEDED`; serial awaited sampling preserves
exact replay. Closing/aborting terminates the owned worker and renderer.

Supported profile: 1–8 tables, each 1–16 two-column rows, native math labels,
uniform authored RGBA per table, fixed precision 0–6, finite values/bounds within
±100000000. Numeric values outside declared bounds fail (1e-9 allowance covers
binary64 endpoint noise). Formatting rounds the scaled binary64 value half away
from zero and normalizes negative zero. This is an explicit display rule, not an
exact-decimal arithmetic claim. Nested/multiple matrix labels, missing physical
fonts, custom table rules/spans and arbitrary LaTeX table updates are unsupported.

`NATIVE-GEOMETRY.json` compares genuine native full-array typesetting against
retained-cell output: keys and logical metrics match; coordinate residual is at
most 1.43e-14 native units from native summation order. 2000 native updates retain
an exact heap checkpoint. `QUALIFICATION.json` records the real native-font
browser test, exact pixel replay/static labels, unchanged layout-call counts,
invalid/close checks, and decoded 12-frame VP9 proof. The small typed kernel is
fast; existing software GPU physical rendering limits total frame rate. The
reported measurements do not establish 100Hz end-to-end rendering.

Rebuild using the exact source commit and current canonical compiler:

```sh
node scripts/native-number-table/build.mjs \
  '/home/viktor/Projects/Vektor Flow/.worktrees/native-number-table-source-20261106' \
  4036ef364794b8f89650fa33c3eef8af827b9ff3 \
  '/home/viktor/Projects/Tesseracs/.worktrees/platonic-phone-web-20261104/public/vkf-0.7.5/playground/canonical' \
  public/preview/0.7.5/vf-ui/artifacts/bound-tables
node tests/native-number-table/test.mjs
node tests/native-number-table/geometry.mjs
node tests/native-bound-tables/browser.cjs
```

The source branch starts at the exact native producer source repository commit
f9578e11f92889027ace0b64a695bc72f6755f07; the new module is
`renderer-source/native_number_table.vkf`. Dependencies are hash-checked against
the installed producer closure during build. Producer WASM/catalog/physical
fonts and the ordinary glyph/state interpolation artifacts remain unchanged.

Tiled-canvas correction: the source callback now resolves original physical
outlines for each renderer-supplied tile camera, composing that camera with the
existing CSS chart flip. This preserves native affine/roundoff metadata and
certified physical M/L/C/Z source geometry. A callback returning precomputed
viewport sources had ignored off-origin tiles and made right-side tables blank.
`TILES.json` qualifies direct raw pixels at1280×720, anchor1062/72, DPR1/2/3,
changed numeric endpoints and exact replay. `TILE-BOUNDARY.json` additionally
qualifies a table crossing the960CSS-pixel boundary atDPR2; both sides retain
native ink. No WASM, font, layout or numerical interpolation asset changed.
