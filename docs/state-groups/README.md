# Explicit native row state groups

`prepareNativeTextModes` accepts an ordered authored source group with one target:

```js
rowTransitions: [{
  fromIds: ['equation-a', 'equation-b'],
  toId: 'equation-a',
  interp: {mode: 'state', path: 0}
}]
```

`fromIds` and the existing `fromId` are mutually exclusive. `fromIds` is a nonempty unique array of existing source IDs in authored order. The one target ID may be an existing selected row, a new row, or null for a source-only state group. The group owns those source/target IDs exclusively; duplicate ownership, unknown IDs, empty groups, irrelevant parameters and wave/material mode groups are rejected. Other unchanged rows remain fixed. A group explicitly including an unchanged target is allowed.

Existing explicit removal is supported unchanged:

```js
{fromId: 'equation-b', toId: null, interp: {mode:'state'}}
```

This is native state interpolation of authored endpoint glyph states. Unmatched outgoing glyphs retain their source pose and authored colour while native alpha reaches zero. No material/smoke carrier is created. No equation simplification or semantic equality is inferred.

The adapter concatenates genuine current075 physical glyph endpoints in supplied source order, then calls the **same existing** `prepare_glyph_state` / `sample_text_rows` native kernel (source7347b1b7de885c1e3c6f9bf7bf8f1432589bbeda). Native bounded physical-ID monotone correspondence chooses matches; native Morphing owns poses, RGBA and the one shared time clock. No host correspondence, interpolation, new algorithm or WASM/GPU version was introduced. The existing bound is256 source and256 target glyphs per aggregate group. Exceeding it fails `NATIVE_STATE_GLYPH_LIMIT`.

Qualification: `node tests/state-groups/browser.cjs` uses actual physical fonts and native rendering. Six sampled merge frames have zero gas/carriers, exact native endpoint canvases and same-player seek. Heading and matched x-prefix crop hashes remain exact. Existing single-row removal, group-to-empty, and grouping an unchanged selected target pass. Malformed/empty/repeated/unknown source IDs, ambiguous fromId/fromIds and grouped wave mode reject. Evidence in QUALIFICATION.json; middle.png is a native state frame, not a fluid proof.

Only public/preview/0.7.5/vf-ui/native-labels/vf-native-text-modes.mjs changes for intake. Existing numerical artifacts/fonts/preservation/plot/capture pins remain unchanged. Physical fluid integration is deferred for this presentation deliverable; no old random transport is relabeled as physical fluid.
