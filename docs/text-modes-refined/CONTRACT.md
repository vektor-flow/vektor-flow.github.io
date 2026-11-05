# Refined native state and material rows

Frozen implementation: renderer4034401, canonical libraryc9e70dd879517e2cb0ca893339e092d426a1be83. Artifact source hashes and exact compiler binding are in public/preview/0.7.5/vf-ui/artifacts/text-modes/PROVENANCE.json. The canonical Interp record has named zero-or-one typed setting groups; public JavaScript factories/schema reject irrelevant mode parameters. This is one Morphing-backed implementation.

```js
const player = await prepareNativeTextModes({
  fromSpecs, toSpecs, typography, width, height, pixelRatio: 1,
  maxCarriers: 1024, signal, interp: {mode: 'state', path: 0},
  rowTransitions: [
    {fromId: 'equation', toId: 'equation', interp: {mode: 'state', path: 0}},
    {fromId: null, toId: 'new-row', interp: {mode: 'vapor',
      temperature: 1, footprint: .75, captureWidth: .25,
      captureStart: .35, captureEnd: .85, boundary: 'emit'}},
  ],
});
container.append(player.element);
await player.sample(.5); // raw q; native batch applies shared clock once
const receipt = player.receipt();
player.close();
```

Specs use genuine current075 native typography: id, kind:'math', source, CSS-pixel anchor, scale, authored RGBA, sizeSpace:'css'. No DOM font or geometry rendering is supplied by this adapter. Unchanged identical specs remain fixed regardless of requested mode. Explicit related-row state transitions use native monotone physical-glyph correspondence, bounded to256glyphs per endpoint. Identity is a native glyph/path identity, not a semantic mathematical equivalence claim. Matched native outlines interpolate pose and authored RGBA; paths/triangles are not morphed.

Explicit row descriptors have exactly fromId/toId/interp. Null source means birth; null target means exit. Each non-null endpoint is consumed once. Unlisted matching IDs use spec.interp or global state settings; unmatched endpoints use vapor. Material fronts address only active incoming material rows, so fixed/calculation rows do not delay the front. Added rows never borrow unrelated disappearing content.

Vapor accepts only mode, temperature, spread, lift, seed, footprint, captureWidth, velocity, boundary, captureStart, captureEnd. Boundary is closed/emit/exit/exchange; exchange is default. The native material ledger reports source/gas/target/reservoir/emitted/exited normalized ownership. Empty-source emission explicitly consumes an external reservoir; it is not closed-system mass conservation. Target authored ink coverage follows native carrier capture. There is no spectral RGB pulse, overshoot, growth, independent target fade, or host easing in this presentation path. Coherent native convection plus mild shared seeded cubic variation is deterministic under arbitrary seeking; it is not CFD or a Brownian integrator.

Presentation profile .75CSS footprint, .25 captureWidth, .35 captureStart, .85 captureEnd and temperature1 is qualified at1024carriers. Capture boundaries are raw fractions converted natively once during preparation. Seed defaults0; spread.35/lift.65/velocity.54; general factory footprint/captureWidth defaults remain.45. Receipt transport.rows contains native per-glyph targetAlpha and named ledgers. Native computation is CPU WASM; gas rasterization uses the existing GPU point renderer with analytic square/pixel overlap. No GPU compute claim.

Bounds:4096carriers total;128row descriptors;4096 intermediate native glyphs; viewport up to4096each side and4194304pixels; pixel ratios1/2/3. A carrier budget must cover incoming native glyphs. Abort and close release bounded resources; queued seeks supersede older frames. No world time/device reset is performed.

Qualification: kernel.mjs plus tests/text-modes-refined/browser.cjs; see QUALIFICATION-1024.json.49real native frames encoded/decoded: fixed heading, existing row and unchanged equation prefix remained pixel-identical, new row captured left-to-right, reservoir ledger/endpoints/seeking passed.1024 and2048 budget runs used the same1024actual native samples and produced identical frame hashes. Full PP authoring/navigation/video acceptance remains the integrating application's responsibility. Legacy explicit spectral mode remains available to older callers but is outside this presentation contract.
