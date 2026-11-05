# Native baseline parity

Actual PP first-view specs from the existing read-only fixture were evaluated through both native paths at1280x720: normal prepareNativeLabelGeometry/retained simplex rendering and prepareNativeTextModes fixed-source rendering. Genuine current075 producer/font resources were used, with no replacement glyphs or positional correction.

The normal CSS label matrix is [scale,0,0,scale,anchorX,anchorY]. The presentation's world-anchor/sign conversion produces that same matrix. Native baselines equal authored81/486/567. At q0/.5/1, both paths have identical observed ink bounds: title56–80, caption470–490, equation533–580. Pixel counts differ between normal MSAA and certified native16-sample area AA, so no whole-image pixel-identity claim is made. Run node tests/text-modes-baseline/browser.cjs.

Root diagnosed initial host.labels() projecting anchors against stale671px canvas height before reading the720px frame rectangle. That ratio explains81→75.5,486→452.9 and567→528.4. Root owns the viewport snapshot/label-projection fix. No native coordinate/runtime/artifact change was made. Renderer functional pin2766dd4/native31decf4 remains frozen.
