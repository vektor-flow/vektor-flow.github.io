# Manual layered canvas source

`createLayeredCanvasCaptureSource` in `vf-ui/vf-media-capture.mjs` exposes the
existing layer compositor without a stream or automatic frame loop:

```js
const source = createLayeredCanvasCaptureSource({
  layers: [geometryCanvas, () => currentNativeTextCanvas],
  beforeDraw: () => flushExistingRenderer(),
});
try {
  for (let index = 0; index < count; index++) {
    await nativePlayer.sample(index / (count - 1));
    source.drawFrame();
    await existingFrameMovieCapture.addFrame(source.canvas, index);
  }
} finally {
  source.close();
}
```

`layers` accepts an array of canvases/dynamic layer functions, or a function
returning the current array. Each `drawFrame()` calls synchronous `beforeDraw`
once, resolves current layers, resizes the output to the first active layer's
pixel dimensions, clears, then paints active layers in order. Layers scale to
that output exactly as in the existing stream adapter. The method returns the
output canvas. No draw occurs at construction and no RAF, timer, media stream,
video decoder, scene recreation, text/font rendering or animation math is added.
Await asynchronous native/render preparation before calling it. Await encoder
consumption before changing/drawing the next source frame.

Initial setup requires a nonzero-sized layer. If all layers later become absent,
the existing output size is retained and cleared. `close()` is idempotent, frees
only the owned output raster and rejects further draws; input layers remain
caller-owned. `closed` reports the lifecycle state. The existing
`createLayeredCanvasCaptureStream` reuses this source while preserving automatic
stream draws/track requests, and releases the owned source after tracks end.

Checks: `node tests/media-capture/source.mjs` covers ordering, dynamic layer
replacement/list changes, resize, beforeDraw, no automatic scheduling, close and
stream compatibility. `node tests/media-capture/browser.cjs` checks actual pixel
composition and encodes four manual canvas frames through the existing VP9 CFR
encoder. ffprobe decodes four frames at 0, .042, .083, .125 seconds (24fps within
WebM millisecond timestamp precision). Software browser evidence is in
MANUAL-QUALIFICATION.json; this is neither a native-scene nor performance claim.
