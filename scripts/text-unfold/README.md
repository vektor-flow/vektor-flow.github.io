# Text unfolds

Two comparable text entrance studies: **Letters** and **Words**. The same
five-line passage, layout, colors and twelve-second timeline isolate grouping.
These are explicit zero-area entrance effects, not handwriting stroke tracing
or the conserved-material biological morph adapter.

`entrance.vkf` imports the unchanged `Morphing.vkf` library. There is one state
per revealed group, followed by settling states. Its natural cubic interpolates
horizontal/vertical offsets and two scales. Explicit VKF constraints keep unborn
groups invisible, clamp negative dimensions and settle old groups exactly.
Constraints do not preserve the unconstrained cubic at their boundaries.
Ligatures stay together in Letters; complete words share a transform in Words.
No JavaScript implements frame interpolation.

The existing LaTeX engine lays out the passage once. The harness presents native
samples with the original glyph instance ABI, atlas and unchanged `draw.wgsl`.
Rendering is WebGPU; motion sampling is offline native CPU work, not GPU-compute
playback. No new compiler is shipped.

Reproduce from this site checkout:

```bash
export PATH=/home/viktor/.local/bin:$PATH
export VKF_MORPHING_LIBRARY=/path/to/libraries
export VKF_COMPILER=/path/to/vkf
node scripts/text-unfold/prepare.mjs /tmp/vkf-text-unfold
python3 scripts/text-unfold/serve.py /tmp/vkf-text-unfold
# In another terminal, with the existing software-only Playwright environment:
node scripts/text-unfold/capture.cjs /tmp/vkf-text-unfold
```

The capture harness verifies and forces SwiftShader. It uses the existing
`createSceneMediaCapture.startFrameMovie` API to encode 720 frames at 60fps.
Timestamps are independent of rendering speed. Checks include blank initial
frames, visible intermediate/final frames, no viewport-edge ink, identical final
ink counts, and absence of browser/GPU errors. Review intermediate images and
complete films before publication.

Convert each WebM to H.264, retaining all frames:

```bash
ffmpeg -i /tmp/vkf-text-unfold/letters.webm -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart public/previews/text-unfold/letters.mp4
ffmpeg -i /tmp/vkf-text-unfold/words.webm -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart public/previews/text-unfold/words.mp4
```

Videos do not autoplay or loop. The page has a static transcript, caption track,
MP4 and WebM sources. Existing compiler pins and live examples stay unchanged.
Provenance records exact compiler/library inputs and capture evidence. Encoded
60fps playback establishes no physical GPU or phone performance claim.
