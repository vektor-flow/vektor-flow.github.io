// Copy compiler-owned packed bytes while its compile/execute/format transaction
// remains exclusive. Geometry, metadata and validation stay in the compiler.
export function copyCanonicalRetainedPackets(owner, packets) {
  if (!Array.isArray(packets)) throw new TypeError('Malformed retained output');
  const count = owner.ccall('vkf_browser_retained_ui_arena_count', 'number', [], []);
  if (!Number.isSafeInteger(count) || count !== packets.length) {
    throw new TypeError('Compiler retained arena count mismatch');
  }
  return packets.map((packet, index) => {
    const ref = packet?.arena;
    if (!ref || ref.storage !== 'compiler-binary' || ref.index !== index ||
        !Number.isSafeInteger(ref.byte_length) || ref.byte_length < 0) {
      throw new TypeError('Compiler retained arena reference mismatch');
    }
    const pointer = owner.ccall('vkf_browser_retained_ui_arena', 'number', ['number'], [index]);
    const length = owner.ccall('vkf_browser_retained_ui_arena_size', 'number', ['number'], [index]);
    const heap = owner.HEAPU8;
    if (!Number.isSafeInteger(length) || length !== ref.byte_length ||
        !Number.isSafeInteger(pointer) || pointer < 0 ||
        !(heap instanceof Uint8Array) || pointer > heap.length || length > heap.length - pointer ||
        (length > 0 && pointer === 0)) {
      throw new RangeError('Compiler retained arena extent mismatch');
    }
    return {...packet, arena: heap.slice(pointer, pointer + length)};
  });
}
