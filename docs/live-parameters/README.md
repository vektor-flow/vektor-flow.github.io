# Generic live parameter bindings

`vf-ui/vf-live-parameters.mjs` exports `liveParameterValues(parameters, elapsedMs)` and `liveParameterDefinitions(definitions, parameters)`.

These are the existing authored quantized control helpers, promoted unchanged from Product. The host owns clock/navigation and supplies validated configuration (`variable`, `min`, `max`, `initial`, `step`, `intervalMs`). The helpers contain no example-specific defaults, state interpolation, layout, rendering, or physics. Stable generated expressions run through the existing native compiler and GPU time uniform.

The unit test checks thirteen finite input cases and definition ownership. The actual native AST/scalar shader GPU test checks seven timestamps with maximum discrepancy 2.03e-8. The GPU time uniform is float32: this finite test does not establish exact ticks at every boundary or arbitrarily long uptime. Physical frame rate is independent of the 10 ms semantic control interval.
