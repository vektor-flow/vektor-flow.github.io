# Existing Morphing: text input checks

These two short clips check the existing biological split/merge implementation
with supplied letter/word geometry. They are not a new solver, a new entrance
animation, or a completed progressive text sequence. Intermediate fragments and
finite-grid text artifacts remain visible. Visual quality is not marked accepted.

The source library is the existing `codex/morphology-review-20261015` commit
`9bdee82535659b5836293e88b3096a015e223d12`, also verified against its remote branch.
Every copied Morphing module and existing GPU kernel/player is byte-identical.
The native compiler is the installed Cuvami VKF0.7.3. The canonical WASM emitter
builds only an application input fixture; public compiler releases stay unchanged.

The real LaTeX engine lays out bold text and supplies its original scalar glyph
fields. The input scripts convert these to anonymous local distance grids. Each
fixture declares one parent at the first key state and that parent plus a child
at the second. Both persistent carriers occupy the same parent initially; neither
starts transparent, zero-sized or below the baseline. Word inputs group the
word's glyph coverage into one field. This is authored lineage, not automatic
correspondence inference. A nonempty seed is required by the existing library.

`b.prepare` owns the existing cubic state plan, and the existing compiled GPU
kernels own interpolation, smooth contact union, area calibration and triangle
emission. No custom frame transforms, fades, glyph scaling or trajectory offsets
are applied by the capture host. The copied GPU control fixture's provisional
measure vector has two entries to match the two input states; no library source
is edited. With two knots, the natural cubic has zero second derivatives; the
library's own smooth endpoint clock is retained. This does not demonstrate a
multi-knot sentence animation or a generic mitosis correspondence guarantee.

Exact local recipes used for the checks are preserved here:

```bash
export PATH=/home/viktor/.local/bin:$PATH
node scripts/text-mitosis/letters-layout.mjs Cu
/tmp/cuvami-morphology-venv/bin/python scripts/text-mitosis/letters-build.py
node scripts/text-mitosis/words-layout.mjs 'Ideas grow.'
/tmp/cuvami-morphology-venv/bin/python scripts/text-mitosis/words-build.py
python3 scripts/text-mitosis/serve.py
# Another terminal:
node scripts/text-mitosis/capture.cjs
node scripts/text-mitosis/capture.cjs /tmp/vkf-word-mitosis-check-20261018
```

The scripts preserve the exact local dependency/artifact paths used. The source
download includes the generated standalone VKF programs, unchanged library files,
endpoint inputs, source hashes and GPU/capture reports. Capture explicitly forces
SwiftShader, uses the existing VKF frame movie API and records1931080-square
frames at48fps. All201 sampled coordinates per clip satisfy the existing1e-4
sampled-area tolerance, with no GPU/browser errors. Those checks establish neither
generic topology preservation nor acceptable visual quality. No physical GPU runs.

The published page shows only the clips and short labels. The full-passage text,
caption track and previous entrance media have been removed from public assets;
Git history retains the rejected approach.
