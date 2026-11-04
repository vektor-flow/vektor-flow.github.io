import createCompiler from './compiler-base.mjs?sha256=6ef6ac12a6988af9753af1d2644785d68a147875e0e9bfad663b5d1f3187a64c';
import createFormatter from './formatter.mjs?sha256=0677e87bc584ef5b736e989103d87e524d96a5a945c0e60db340cd82894ceae3';
// Explicit Node host entrypoint; the browser/default factory never imports host
// I/O or resolves packages. Ship package-tools and prepare-formatter-ir.mjs
// alongside this wrapper (tools/package-canonical.mjs stages their closure).
export async function createProjectCompiler(options={}){
 const {createProjectCompiler: create}=await import('./package-tools/project.mjs');
 return create({...options,factory:options.factory??(options.compilerModule?undefined:createCanonicalPackage)});
}
export default async function createCanonicalPackage(options){
 const [owner,response]=await Promise.all([createCompiler(options),(async()=>{const url=new URL('./formatter.wasm?sha256=3586ebc5dda88fd289791245e43769c77ded65de3ae28aaf49d22262918978da',import.meta.url);if(url.protocol==='file:'){const {readFile}=await import('node:fs/promises');const bytes=await readFile(url);return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}return fetch(url);})()]);
 if(!response.ok)throw new Error('Compiler formatter package unavailable');
 const formatterOwner=await createFormatter({wasmBinary:await response.arrayBuffer()});
 owner.formatterOwner=formatterOwner;
 return owner;
}
