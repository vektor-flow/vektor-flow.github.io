import {bindNativeFontResources} from './vf-native-font-binding.mjs';

const need = (ok, message) => { if (!ok) throw new Error(message); };
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

/** Retain freshly executed native VKF layouts, never run a host layout engine.
 * A missing formula is refused. Supply typeset only when an application owns a
 * live native provider with the SAME program/catalog/engine identities.
 */
export function createCurrentNativeTypography({boxes, vectors, binding, identity, typeset} = {}) {
  for (const key of ['compilerSha256', 'programSha256', 'catalogSha256', 'resourceClosureSha256'])
    need(hash(identity?.[key]), 'CURRENT_NATIVE_IDENTITY_' + key);
  need(boxes && typeof boxes === 'object', 'CURRENT_NATIVE_BOXES');
  const pins = freeze(structuredClone(identity));
  const physical = bindNativeFontResources(vectors, binding, pins.resourceClosureSha256);
  const engineIdentity = 'current-vkf-native:' + pins.compilerSha256 + ':' + pins.programSha256;
  const resourceIdentity = pins.catalogSha256 + ':' + pins.resourceClosureSha256;
  const cache = new Map(); let leases = 0, closed = false;
  function validate(box) {
    need(box?.complete === true && Array.isArray(box.diagnostics) && box.diagnostics.length === 0 &&
      [box.width, box.height, box.depth].every(Number.isFinite) && Array.isArray(box.items), 'CURRENT_NATIVE_INCOMPLETE');
    for (const item of box.items) {
      need(!item.clip && !item.crop && [item.x, item.y, item.sx ?? 1, item.sy ?? 1].every(Number.isFinite), 'CURRENT_NATIVE_ITEM');
      if (item.kind === 'glyph') need(physical.paths[physical.keys[item.key]] && physical.fontBindings[item.key], 'CURRENT_NATIVE_FONT_MAPPING');
      else need(item.kind === 'rule' && [item.width, item.height].every(v => Number.isFinite(v) && v >= 0), 'CURRENT_NATIVE_RULE');
    }
    return freeze(structuredClone(box));
  }
  for (const [source, row] of Object.entries(boxes)) {
    need(row.kind === 'fresh-current-vkf-label-output' && row.source === source, 'CURRENT_NATIVE_OUTPUT_ORIGIN');
    cache.set(source, validate(row.box));
  }
  return Object.freeze({engineIdentity, resourceIdentity, vectors: physical, identity: pins,
    async prepare(run) {
      need(!closed, 'CURRENT_NATIVE_CLOSED');
      need(run?.kind === 'math' && typeof run.source === 'string' && run.display !== true && run.font_size === undefined, 'CURRENT_NATIVE_PROFILE_UNSUPPORTED');
      let box = cache.get(run.source);
      if (!box) {
        need(typeof typeset === 'function', 'CURRENT_NATIVE_FORMULA_REQUIRES_FRESH_EXECUTION');
        const result = await typeset({...run}, pins);
        need(JSON.stringify(result?.identity) === JSON.stringify(pins), 'CURRENT_NATIVE_CHANGED_ENGINE_OR_RESOURCES');
        need(result.source === run.source, 'CURRENT_NATIVE_CHANGED_SOURCE');
        box = validate(result.box); need(!closed, 'CURRENT_NATIVE_CLOSED'); cache.set(run.source, box);
      }
      leases++; let released = false;
      return Object.freeze({run: freeze({...run}), box,
        prepared: {provenance: {kind: 'fresh-current-vkf-native-layout', engineIdentity, resourceIdentity,
          compilerSha256: pins.compilerSha256, programSha256: pins.programSha256,
          catalogSha256: pins.catalogSha256, fontRevision: physical.resourceClosureSha256}},
        release() { if (!released) { released = true; leases--; } }
      });
    },
    stats: () => ({leases, cachedFormulas: cache.size, closed}),
    close() { need(leases === 0, 'CURRENT_NATIVE_LEASES_REMAIN'); closed = true; cache.clear(); }
  });
}

/** The app supplies byte pins from its actual current native execution. */
export async function loadCurrentNativeTypography({files, identity, fetch: fetcher = globalThis.fetch, typeset} = {}) {
  async function read(name) {
    const pin = files?.[name]; need(pin?.url && hash(pin.sha256), 'CURRENT_NATIVE_FILE_PIN_' + name);
    const response = await fetcher(pin.url, {cache: 'no-store'}); need(response.ok, 'CURRENT_NATIVE_FETCH_' + name);
    const bytes = await response.arrayBuffer();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');
    need(digest === pin.sha256, 'CURRENT_NATIVE_FILE_CHANGED_' + name);
    return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
  }
  const [boxes, vectors, binding] = await Promise.all(['boxes', 'vectors', 'binding'].map(read));
  return createCurrentNativeTypography({boxes, vectors, binding, identity, typeset});
}
