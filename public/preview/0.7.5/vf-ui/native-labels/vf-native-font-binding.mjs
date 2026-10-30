const need=(v,code)=>{if(!v)throw Object.assign(Error(code),{code,status:'BLOCKED'});};
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/u.test(v);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
/** Driver verifies every actual PFB/TFM byte against PHYSICAL-FONT-CLOSURE.
 * This only joins those immutable resource pins to exact physical outlines;
 * it cannot issue native engine/owner/lease authority or GPU qualification.
 */
export function bindNativeFontResources(vectors,binding,resourceClosureSha256){
 need(vectors?.schema==='vkf.pdf-vectors/1'&&binding?.schema==='vf-native-math-atlas/1'&&hash(resourceClosureSha256),'NATIVE_FONT_BINDING');
 const copy=structuredClone(vectors),fontBindings={};
 for(const [key,digest] of Object.entries(copy.keys)){
  const entry=binding.entries?.[key];
  need(entry?.atlasKey===key&&entry.outlineDigest===digest&&copy.paths?.[digest],'NATIVE_FONT_OUTLINE_BINDING');
  const query=entry.query,font=query?.physicalFont;
  need(Number.isSafeInteger(query?.code)&&query.code>=0&&typeof query.glyphName==='string'&&query.glyphName.length>0&&Number.isSafeInteger(query.sizeSp)&&query.sizeSp>0,'NATIVE_FONT_QUERY_BINDING');
  need(hash(font?.program?.sha256)&&hash(font?.metrics?.sha256)&&hash(font?.encodingSha256)&&hash(query.charStringSha256)&&Array.isArray(font.fontMatrix)&&font.fontMatrix.length===6&&font.fontMatrix.every(Number.isFinite),'NATIVE_FONT_PROGRAM_BINDING');
  fontBindings[key]={program:font.program.sha256,metrics:font.metrics.sha256,encoding:font.encodingSha256,fontMatrix:[...font.fontMatrix],physicalFontId:font.id,
   charString:query.charStringSha256,code:query.code,glyphName:query.glyphName,sizeSp:query.sizeSp,revision:resourceClosureSha256};
 }
 return freeze({...copy,fontBindings,resourceClosureSha256});
}
