import { loadCanonicalBrowserCompiler } from './playground/vkf-canonical-browser-compiler.mjs';
import { createSymbolicKernel } from './vf-ui/vf-symbolic-kernel-runtime.mjs';

export function physicsUpdateTemplate(dimension = 2) {
  return `update(p:[num:${dimension}],v:[num:${dimension}],a:[num:${dimension}],time:num,time_step:num):\n    (p:p,v:v,a:a)`;
}

export async function compilePhysicsUpdate(source, { dimension = 2, baseURL = new URL('./', import.meta.url) } = {}) {
  if (![2, 3].includes(dimension)) throw new RangeError('Unsupported update dimension.');
  if (typeof source !== 'string' || new TextEncoder().encode(source).length > 65536) {
    throw new RangeError('Update source exceeds the 64 KB limit.');
  }
  const compiler = await loadCanonicalBrowserCompiler(Object.fromEntries(
    ['moduleURL', 'wasmURL', 'dataURL'].map((key, index) =>
      [key, new URL(`playground/canonical/compiler.${['mjs', 'wasm', 'data'][index]}`, baseURL).href])));
  const vector = `[num:${dimension}]`;
  const zero = `[${Array(dimension).fill(0).join(',')}]`;
  const wrapped = `${source}\n`
    + `pp_update(p:${vector},v:${vector},a:${vector},time:num,time_step:num):\n`
    + '    update(p,v,a,time,time_step)\n'
    + `::pp_update(${zero},${zero},${zero},0,0)\n`;
  const program = compiler.compileSource(wrapped, '/browser/platonic-physics-update.vkf');
  const module = await WebAssembly.compile(program.wasm);
  if (WebAssembly.Module.imports(module).length) throw new Error('External update capabilities are unavailable.');
  if (program.manifest.functions.pp_update?.parameters !== 5) {
    throw new Error('The compiler did not provide the update function.');
  }
  const kernel = createSymbolicKernel({ instance: new WebAssembly.Instance(module), manifest: program.manifest });
  const vectorValue = value => {
    if (!Array.isArray(value) || value.length !== dimension || !value.every(Number.isFinite)) {
      throw new RangeError('Update vectors must contain finite numbers matching the Session dimension.');
    }
    return value;
  };
  return Object.freeze({
    step({ p, v, a, time }, timeStep) {
      if (!Number.isFinite(time) || !Number.isFinite(timeStep) || timeStep < 0) {
        throw new RangeError('Update time and time_step must be finite and time_step nonnegative.');
      }
      const result = kernel.invokeValue('pp_update', [vectorValue(p), vectorValue(v), vectorValue(a), time, timeStep]);
      if (!result || Array.isArray(result) || typeof result !== 'object') {
        throw new TypeError('The update function must return a tuple containing p, v, or a.');
      }
      const entries = Object.entries(result);
      if (!entries.length || entries.some(([key]) => !['p', 'v', 'a'].includes(key))) {
        throw new TypeError('The update function must return only p, v, and a.');
      }
      return Object.fromEntries(entries.map(([key, value]) => [key, [...vectorValue(value)]]));
    }
  });
}
