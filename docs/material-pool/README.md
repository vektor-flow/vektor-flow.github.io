# Removed ink → retained stock → first creation

The canonical typed `Interp` backend owns all state, wave, random-walk and material calculations. `prepareNativeTextModes` binds actual current075 physical text outlines and every covered source/target raster pixel. The numerical kernel accepts generic ink; this browser binder captures text only.

Matched current IDs use `rowTransitions: [{fromId,toId,interp:{mode:'state'}}]`. Births with no material use `{fromId:null,toId,interp:{mode:'wave',start,finish,k:4}}`. Wave preserves authored RGB and unit growth. Stable identical specs remain fixed.

One scene pool is explicit authored routing:

```js
materialGroups: [{
  id: 'scene-stock', sourceIds: ['removed-a', 'removed-b'],
  firstTargetId: 'first-born', // null retains unclaimed smoke
  interp: {mode:'vapor',temperature:1,footprint:.75,captureWidth:.25,
           captureStart:.15,captureEnd:.6},
  momentum: {source:[0,0],target:[0,0]} // optional, stationary default
}]
```

Source IDs must be absent from the current target; firstTargetId must be absent from the current source. There are no list/fullness/index restrictions. Group-owned IDs must be omitted from rowTransitions. Later births use wave only. Removed ink not explicitly routed is rejected, rather than silently faded.

`await effect.exportMaterialPool()` returns an opaque `vkf-material-pool/1` snapshot for **fully released unclaimed** stock, or null when consumed. Pass it unchanged as `retainedMaterial` before closing the previous effect. It contains copied native particle position/mass/RGB/momentum/coverage, immutable future random coefficients and native age. Empty and matched-only views preserve stock and pause its clock; the next first creation consumes it. Same viewport is required. Partly released/partly claimed handoff is explicitly unsupported; completed blank views are supported. A new whole run discards the old snapshot explicitly at the owner boundary.

Fresh plans use independent cryptographic entropy inputs. Native code accumulates 32 independent uniform 2D increments and interpolates their finite walk, with a native capture envelope that converges to actual target ink. This is a stochastic finite approximation, not Gaussian Wiener motion, physical thermodynamics or CFD. `exportRandomPlan()` and `randomPlan` preserve coefficients for replay; seeks never reseed. Held stock reuses its future window and only appends a new future window beyond that horizon, anchored at its current position.

Normalized source-lineage ledger sums to one; emitted/reservoir/exited are always zero. **Actual mass is interpolated**, not conserved when endpoint ink areas differ. Carrier area, coverage, RGB and optional momentum use the existing native state interpolation. All gas is zero by the first creation's captureEnd; later waves have zero smoke. A removed-only blank retains all unclaimed material without fading away.

GPU programs are current compiler-owned real-f32 restore/diffusion/carrier/capture kernels. They are generated from the same VKF source, not host effect formulas. All covered pixels have positive descendants; dispatch is bounded at 131072, with explicit budget failure and no thinning. GPU resource cap is 128 MiB; opaque CPU snapshots additionally contain bounded copied particle/coefficient arrays. Native text rendering and the final compositor readback barrier preserve usable accepted canvas pixels before capture. No font, plot, simplex/PMA or movie codec changes belong to this feature.

Run `node tests/material-pool/browser.cjs` for native-font GPU/VP9 decoded proof, exact seek/replay and continuation assertions. `NATIVE_REFERENCE=<build-gpu temporary root> node tests/material-pool/parity.cjs` compares the same four native WASM functions to their real-f32 GPU execution. Evidence is under this directory. Native ELF and full-scene drawable capture are not qualified by these checks.
