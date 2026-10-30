// This provider transports immutable UTF-8 file bytes. It performs no parsing,
// evaluation, linear algebra, hashing oracle substitution, or timing.
export function mountImmutableHostDocuments(vm, manifest, documents) {
  const descriptor = manifest.immutableHostDocuments;
  if (!descriptor || descriptor.version !== 1 || descriptor.readOnly !== true)
    throw new Error('Program did not opt into immutable host documents');
  for (const name of ['vkf_vm_host_documents_ptr', 'vkf_vm_host_documents_len',
                      'vkf_vm_host_documents_seal', 'vkf_vm_host_documents_clear'])
    if (typeof vm[name] !== 'function') throw new Error('Missing mount export: ' + name);
  const arena = vm.vkf_vm_host_documents_ptr(), length = vm.vkf_vm_host_documents_len();
  if (arena !== descriptor.arenaPointer || length !== descriptor.arenaLength ||
      !Number.isSafeInteger(arena) || !Number.isSafeInteger(length) ||
      arena < 0 || length !== 64 + 16 * 262416 || arena + length > vm.memory.buffer.byteLength ||
      descriptor.slotCount !== 16 || descriptor.slotSize !== 262416 ||
      descriptor.headerSize !== 64 || descriptor.pathCapacity !== 256 ||
      descriptor.dataCapacity !== 262144 || descriptor.totalByteQuota !== 2097152)
    throw new Error('Unreviewed immutable document layout');
  const view = new DataView(vm.memory.buffer);
  if (view.getUint32(arena, true) !== 0)
    throw new Error('Clear existing host document authority before replacing it');
  if (!Array.isArray(documents) || documents.length > descriptor.slotCount)
    throw new Error('Too many immutable host documents');
  const names = new Set(), rows = [], encoder = new TextEncoder();
  let total = 0;
  for (const document of documents) {
    if (typeof document.path !== 'string' || !/^[\x20-\x7e]+$/.test(document.path))
      throw new Error('Host document paths must use printable ASCII');
    const path = encoder.encode(document.path), parts = document.path.replace(/^\//, '').split('/');
    if (path.length >= descriptor.pathCapacity || /[\\:]/.test(document.path) ||
        parts.some(part => part === '' || part === '.' || part === '..') || names.has(document.path))
      throw new Error('Noncanonical or duplicate host document path');
    if (!(document.bytes instanceof Uint8Array) || document.bytes.length > descriptor.dataCapacity)
      throw new Error('Invalid immutable document bytes or per-document quota');
    new TextDecoder('utf-8', {fatal: true}).decode(document.bytes);
    total += document.bytes.length;
    if (total > descriptor.totalByteQuota) throw new Error('Immutable document total quota exceeded');
    names.add(document.path);
    // Buffer.slice() aliases; snapshot every accepted Uint8Array before writes.
    rows.push({path, bytes: new Uint8Array(document.bytes)});
  }
  const memory = new Uint8Array(vm.memory.buffer);
  for (let i = 0; i < rows.length; ++i) {
    const slot = arena + descriptor.headerSize + i * descriptor.slotSize;
    view.setUint32(slot + 4, rows[i].path.length, true);
    view.setUint32(slot + 8, rows[i].bytes.length, true);
    memory.set(rows[i].path, slot + 16);
    memory.set(rows[i].bytes, slot + 16 + descriptor.pathCapacity);
  }
  const status = vm.vkf_vm_host_documents_seal(rows.length);
  if (status !== 0) {
    vm.vkf_vm_host_documents_clear();
    throw new Error('Immutable document seal rejected descriptor: ' + status);
  }
  return {documents: rows.length, bytes: total};
}
