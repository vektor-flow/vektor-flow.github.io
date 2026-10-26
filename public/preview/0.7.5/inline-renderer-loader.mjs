const scripts = [
  "vf-ui/katex/katex.min.js",
  "vf-ui/vf-startup-gate.js",
  "vf-ui/vf-runtime-packet-contract.js",
  "vf-ui/vf-retained-event-adapter.js",
  "vf-ui/vf-runtime-source.js",
  "vf-ui/vf-html-components.js",
  "vf-ui/vf-runtime-scene.js",
  "vf-ui/vf-runtime-flow.js",
  "vf-ui/vf-compiled-runtime-bridge.js",
  "vf-ui/vf-compiled-webgpu-adapter.js",
  "vf-ui/vf-render-clock.js",
  "vf-ui/vf-frame.js",
  "vf-ui/vf-widgets.js",
  "vf-ui/vf-static-html-loader.js",
  "vf-ui/vf-shared-runtime.js",
  "vf-ui/vf-gpu-runtime.js",
  "vf-ui/vf-axis2d-ticks.js",
  "vf-ui/vf-axis3d-kernel.js",
  "vf-ui/vf-axis3d-kernel-adapter.js",
  "vf-ui/vf-axis3d-projection-kernel.js",
  "vf-ui/vf-axis3d-projection-kernel-adapter.js",
  "vf-ui/geom/vf-geom-math.js",
  "vf-ui/geom/vf-geom-core.js",
  "vf-ui/geom/vf-geom-material-arena.js",
  "vf-ui/geom/vf-geom-ledger-layout.js",
  "vf-ui/geom/vf-geom-ledger-transport.js",
  "vf-ui/geom/vf-geom-ledger.js",
  "vf-ui/geom/vf-geom-parametric-surface.js",
  "vf-ui/geom/vf-geom-frame-adapter.js",
  "vf-ui/geom/vf-geom-wgpu.js",
  "vf-ui/vf-display.js"
];
let pending;
export function ensureInlineRenderer() {
  return pending ??= (async () => {
    window.__vfInlineRetainedScene = true;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("./vf-ui/vf-frame.css", import.meta.url);
    document.head.append(css);
    for (const path of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = new URL(path, import.meta.url);
        script.onload = resolve;
        script.onerror = () => reject(new Error("The example renderer could not be loaded"));
        document.head.append(script);
      });
    }
  })();
}
