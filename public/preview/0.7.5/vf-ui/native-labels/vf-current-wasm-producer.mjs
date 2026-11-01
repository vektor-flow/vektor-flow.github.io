const need = (ok, message) => { if (!ok) throw new Error(message); };
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const identityKeys = ['compilerSha256', 'programSha256', 'catalogSha256',
  'resourceClosureSha256', 'sourceClosureSha256', 'wasmSha256', 'manifestSha256',
  'compilerSourceBinding', 'entrySourceSha256'];
const sameIdentity = (a, b) => a && b &&
  JSON.stringify(Object.keys(a).sort()) === JSON.stringify(Object.keys(b).sort()) &&
  Object.keys(a).every(key => a[key] === b[key]);
const digest = async bytes => Array.from(new Uint8Array(
  await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('');

/** Load an actual current-compiler emitted math_layout_kernel, never a native
 * recording. Its identity is NEW; do not reuse the native executable's bundle
 * identity. The current provider still validates boxes and physical font keys.
 * Abort, timeout and close permanently retire this owned worker and all calls.
 */
export async function loadCurrentWasmLabelProducer({files, identity,
  fetch: fetcher = globalThis.fetch, WorkerClass = globalThis.Worker,
  signal, timeoutMs = 12000} = {}) {
  for (const key of identityKeys) need(hash(identity?.[key]), 'WASM_LABEL_IDENTITY_' + key);
  need(identity.target === 'wasm', 'WASM_LABEL_TARGET');
  need(identity.programSha256 === identity.wasmSha256, 'WASM_LABEL_PROGRAM_ARTIFACT');
  need(Number.isSafeInteger(timeoutMs) && timeoutMs > 0, 'WASM_LABEL_TIMEOUT');
  const pins = Object.freeze(structuredClone(identity));
  const abort = new AbortController();
  let worker, loading = [], closed = false, nextId = 0;
  const pending = new Map();
  const close = (reason = new Error('WASM_LABEL_CLOSED')) => {
    if (closed) return;
    closed = true; abort.abort(reason);
    signal?.removeEventListener('abort', onAbort);
    // Browser Worker.terminate stops execution immediately; this guest cannot
    // start children or external host work because all imports were refused.
    worker?.terminate();
    for (const row of [...pending.values()]) row.reject(reason);
  };
  const onAbort = () => close(signal.reason ?? new DOMException('Aborted', 'AbortError'));
  signal?.addEventListener('abort', onAbort, {once: true});
  const loadingTimer = setTimeout(() => close(new Error('WASM_LABEL_LOAD_TIMEOUT')), timeoutMs);
  try {
    if (signal?.aborted) onAbort();
    need(!closed, 'WASM_LABEL_CLOSED');
    async function read(name, expected) {
      const file = files?.[name];
      need(file?.url && file.sha256 === expected, 'WASM_LABEL_FILE_PIN_' + name);
      const response = await fetcher(file.url, {cache: 'no-store', signal: abort.signal});
      need(response.ok, 'WASM_LABEL_FETCH_' + name);
      const bytes = await response.arrayBuffer();
      need(await digest(bytes) === expected, 'WASM_LABEL_FILE_CHANGED_' + name);
      return bytes;
    }
    loading = [
      read('wasm', pins.wasmSha256), read('manifest', pins.manifestSha256),
      read('catalog', pins.catalogSha256),
    ];
    const [wasm, manifestBytes, catalogBytes] = await Promise.all(loading);
    need(!closed, 'WASM_LABEL_CLOSED');
    const decoder = new TextDecoder('utf-8', {fatal: true});
    const manifest = JSON.parse(decoder.decode(manifestBytes));
    const catalog = decoder.decode(catalogBytes);
    worker = new WorkerClass(new URL('./vf-current-wasm-label-worker.mjs', import.meta.url), {type: 'module'});
    worker.onmessage = ({data}) => {
      const row = pending.get(data?.id);
      if (!row) return;
      if (data.error) { row.reject(new Error(data.error)); return; }
      if (!sameIdentity(data.identity, pins)) {
        close(new Error('WASM_LABEL_CHANGED_IDENTITY')); return;
      }
      row.resolve(data);
    };
    worker.onerror = event => close(new Error(event.message || 'WASM_LABEL_WORKER_FAILED'));
    worker.onmessageerror = () => close(new Error('WASM_LABEL_MESSAGE_FAILED'));
    function request(message, requestSignal) {
      return new Promise((resolve, reject) => {
        if (closed) { reject(new Error('WASM_LABEL_CLOSED')); return; }
        const id = ++nextId;
        const onRequestAbort = () => close(requestSignal.reason ?? new DOMException('Aborted', 'AbortError'));
        const timer = setTimeout(() => close(new Error('WASM_LABEL_TIMEOUT')), timeoutMs);
        const settle = callback => value => {
          clearTimeout(timer); requestSignal?.removeEventListener('abort', onRequestAbort);
          pending.delete(id); callback(value);
        };
        pending.set(id, {resolve: settle(resolve), reject: settle(reject)});
        requestSignal?.addEventListener('abort', onRequestAbort, {once: true});
        if (requestSignal?.aborted) { onRequestAbort(); return; }
        try { worker.postMessage({id, ...message}); }
        catch (error) { close(error); }
      });
    }
    await request({type: 'initialize', wasm, manifest, catalog, identity: pins});
    clearTimeout(loadingTimer);
    return Object.freeze({identity: pins,
      async typeset(run, expectedIdentity, {signal: requestSignal} = {}) {
        need(sameIdentity(expectedIdentity, pins), 'WASM_LABEL_CHANGED_IDENTITY');
        const requestedIdentity = {...expectedIdentity};
        need(run?.kind === 'math' && typeof run.source === 'string' &&
          run.display !== true && run.font_size === undefined, 'WASM_LABEL_PROFILE_UNSUPPORTED');
        const source = run.source;
        const result = await request({type: 'typeset', source}, requestSignal);
        need(!closed, 'WASM_LABEL_CLOSED');
        need(result.source === source, 'WASM_LABEL_CHANGED_SOURCE');
        return {source, identity: requestedIdentity, box: result.box, timing: result.timing};
      },
      close: () => close(),
    });
  } catch (error) {
    close(error);
    await Promise.allSettled(loading); // Join all aborted asset reads too.
    throw error;
  } finally { clearTimeout(loadingTimer); }
}
