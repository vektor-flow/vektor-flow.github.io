// Transport the complete typed IR through the formatter heap. Emscripten's
// ccall string conversion uses its fixed C stack and cannot carry large IR.
export function prepareFormatterIr(formatter,text){
 if(typeof text!=='string'||text.includes('\0'))throw new TypeError('Invalid typed IR text');
 const bytes=new TextEncoder().encode(text);
 const pointer=formatter._malloc(bytes.byteLength+1);
 if(!pointer)throw new RangeError('Formatter IR transport allocation failed');
 try{
  formatter.HEAPU8.set(bytes,pointer);
  formatter.HEAPU8[pointer+bytes.byteLength]=0;
  return formatter.ccall('vkf_formatter_prepare_ir','number',['number'],[pointer]);
 }finally{formatter._free(pointer);}
}
