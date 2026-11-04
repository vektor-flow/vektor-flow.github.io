const scripts = [
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
const scriptVersions = {"vf-ui/geom/vf-geom-core.js": "2c414dedd1dc10da8f553e04ce3fd2de020e7acf00eb48f976d058a5411ab693", "vf-ui/geom/vf-geom-frame-adapter.js": "db179b3ad2885fe3187735f5e07175a8888e6ecf7263e2a9ed8436404299e459", "vf-ui/geom/vf-geom-ledger-layout.js": "17468a185566d6e3b0bc5c8eff749482cb9399e84c97a01c0caeaac59e2c0f2f", "vf-ui/geom/vf-geom-ledger-transport.js": "04298dc65b9f691676b3908c400ba45d82800e80d0129bb0fa3831175b62d093", "vf-ui/geom/vf-geom-ledger.js": "89126424637eacc41cecdce57c17ad2326b2e7772dc2978e94948464966b0ef0", "vf-ui/geom/vf-geom-material-arena.js": "5b1441aff2b84fffb1e02eb3d4f4b4dc81ebeaa155519fb7e852db9c22427365", "vf-ui/geom/vf-geom-math.js": "3b91b0d3140162e9579a48f907cc703b77817b9e610ed076483f9375d2ea4023", "vf-ui/geom/vf-geom-parametric-surface.js": "06ba6aabdccc3ee1ead00225394f83b79667045de2e8b167ec9657805836e6a7", "vf-ui/geom/vf-geom-wgpu.js": "116f53f363a150de0e50ed418c769d60a16394510ed1109f2621b4e02c236d37", "vf-ui/vf-axis2d-ticks.js": "64960b6d2be29343e7a64d0bf209d4c26ae5d305320a0dc347c7c12dcf7dac75", "vf-ui/vf-axis3d-kernel-adapter.js": "e0404f60f661239f453793964273daae100ecfbab7c0658e459146ded7901b22", "vf-ui/vf-axis3d-kernel.js": "ce9309e37d39a8d1bd326af34d43c92b335b0d12945c1896622940ff6b95d911", "vf-ui/vf-axis3d-projection-kernel-adapter.js": "547e8ed0bb74760cec9bac2ecd8e2b9d2123dd67f423cb6b999d8eb5027ad199", "vf-ui/vf-axis3d-projection-kernel.js": "72eb524cc308507a63aebb01915bc75d8f968e2763b7c8967ad3996f347c47b7", "vf-ui/vf-compiled-runtime-bridge.js": "4ff9b30cad45ec0270223852f7d360c51dcce8c0cd1987ad129c27ace48ff70a", "vf-ui/vf-compiled-webgpu-adapter.js": "1486c62fdf3f975a9d95df508de1c129d517413f47caa14b222dde0007b0e606", "vf-ui/vf-display.js": "16cd670c3892de8e4756776851be181da9989b1db2139957135bc5712acbe2a8", "vf-ui/vf-frame.js": "865f43b7cc537de826c3c6dca7114c93f371c6e6d031be725344b197ad8db353", "vf-ui/vf-gpu-runtime.js": "9a323546d8e46cce824aac5e999a05c8953e5bf56c77a6a30f8db447793f6508", "vf-ui/vf-html-components.js": "3bbf2e4aeacf6f2066201105ef0af48e207771e04bad90a4d2da75c08bea9724", "vf-ui/vf-render-clock.js": "c2250bef93b3de6afdff83aa09d1d0e144dc46251db8440a92b4e5660db93b54", "vf-ui/vf-retained-event-adapter.js": "b7082ab7a277ece450781deb5e4a56f8e3dd33ef5f78c4a921fc47dfae2f001b", "vf-ui/vf-runtime-flow.js": "b7a464edd0e88206d079a19a47259af9a22c9841cac6fdb58e39ca7ed262061f", "vf-ui/vf-runtime-packet-contract.js": "15072337a9d12f6901593a73e989133387fb182970c8fbc847d585163ab0e7e6", "vf-ui/vf-runtime-scene.js": "262a1d0b48b7a8d95cd0b5ea74508bf15e2d3e91751c4aa8c733d8b15115f922", "vf-ui/vf-runtime-source.js": "bb9c3a5a256f8e294e4fd5b5bc4c65c548b6b717f8c23c03c74e5fba44913feb", "vf-ui/vf-shared-runtime.js": "1725ee7329ac829e922efc8a5b47df433ff7341485a3fca37112f0cebd732ab6", "vf-ui/vf-startup-gate.js": "ec551b48249bf6cd10ff9224750e31bd9ea88fb4da99f789f64d2b55d51dc78d", "vf-ui/vf-static-html-loader.js": "88c63f0392fc4eaf4c988c5b1e427c0b45eac13eb8fca5eeb7fd51fdcb2cd5af", "vf-ui/vf-widgets.js": "00251dc4541eabeb2d75b4b2b8eea34061335314d46ca29e849fafafee4715cb"};
let pending, mathInstallation;
export function currentInlineMathLabelEngine() {return mathInstallation;}
export async function closeInlineMathLabels() {if(mathInstallation){const p=mathInstallation;mathInstallation=undefined;await (await p).close();}}
export function ensureInlineRenderer() {
  return pending ??= (async () => {
    window.__vfInlineRetainedScene = true;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("./vf-ui/vf-frame.css?sha256=ea8e9f3cd0fcc7e3cec2b4fc6e2dff394badc0a14d366767c3cdfc0ab92e0690", import.meta.url);
    document.head.append(css);
    const toolbarCSS=document.createElement("link");toolbarCSS.rel="stylesheet";
    toolbarCSS.href=new URL("./vf-ui/vf-plot-toolbar.css?sha256=c96c0b355654677df560bac48c02cdf86738fbf96976c3dd5191c1e64340cafc",import.meta.url);document.head.append(toolbarCSS);
    for (const path of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const url = new URL(path, import.meta.url);
        url.searchParams.set('sha256', scriptVersions[path]);
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(new Error("The example renderer could not be loaded"));
        document.head.append(script);
      });
    }
    await ensureInlineNativeLabels();
  })();
}
let nativeLabelsReady;
export function ensureInlineNativeLabels() {
  return nativeLabelsReady ??= (async () => {
    const {createNativePlotTextLayer} = await import('./vf-ui/native-labels/vf-native-plot-text.mjs?sha256=6bf25e79be946a3259c37f27a7b5d966f96ed53914254531bb3024c3be871bf2');
    VfDisplay.setNativePlotTextRendererFactory(createNativePlotTextLayer);
    const refresh = () => VfDisplay.refreshExamplePlotTheme();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change',refresh);
    new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    // A monitor/browser zoom change can alter DPR without changing CSS bounds.
    let density;
    const watchDensity = () => {
      density?.removeEventListener('change',changedDensity);
      density = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
      density.addEventListener('change',changedDensity,{once:true});
    };
    const changedDensity = () => {VfDisplay.redrawVisibleGeomFrames();watchDensity();};
    watchDensity();
    VfDisplay.setNativeMathLabelInstaller(() => mathInstallation ??= import('./vf-ui/native-labels/vf-current-wasm-math-labels.mjs?sha256=5e9fa3d702dfa6e095254b86674728442490f6b153d12d1446938749673836c6').then(m=>m.installCurrentWasmMathLabels()));
  })();
}
