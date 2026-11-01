import createCompiler from './compiler-base.mjs';
import createFormatter from './formatter.mjs';
// Explicit Node host entrypoint; the browser/default factory never imports host
// I/O or resolves packages. Ship package-tools and prepare-formatter-ir.mjs
// alongside this wrapper (tools/package-canonical.mjs stages their closure).
export async function createProjectCompiler(options={}){
 const {createProjectCompiler: create}=await import('./package-tools/project.mjs');
 return create({...options,factory:options.factory??(options.compilerModule?undefined:createCanonicalPackage)});
}
export default async function createCanonicalPackage(options){
 const [owner,response]=await Promise.all([createCompiler(options),(async()=>{const url=new URL('./formatter.wasm',import.meta.url);if(url.protocol==='file:'){const {readFile}=await import('node:fs/promises');const bytes=await readFile(url);return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}return fetch(url);})()]);
 if(!response.ok)throw new Error('Compiler formatter package unavailable');
 const formatterOwner=await createFormatter({wasmBinary:await response.arrayBuffer()});
 owner.formatterOwner=formatterOwner;
 return owner;
}
