import createCompiler from './compiler-base.mjs?sha256=e21ea1482e7623a238903006a9a559b8f74456b7822fbb2002a5e39359c94789';
import createFormatter from './formatter.mjs?sha256=0677e87bc584ef5b736e989103d87e524d96a5a945c0e60db340cd82894ceae3';
// Explicit Node host entrypoint; the browser/default factory never imports host
// I/O or resolves packages. Ship package-tools and prepare-formatter-ir.mjs
// alongside this wrapper (tools/package-canonical.mjs stages their closure).
export async function createProjectCompiler(options={}){
 const {createProjectCompiler: create}=await import('./package-tools/project.mjs');
 return create({...options,factory:options.factory??(options.compilerModule?undefined:createCanonicalPackage)});
}
export default async function createCanonicalPackage(options){
 const [owner,response]=await Promise.all([createCompiler(options),(async()=>{const url=new URL('./formatter.wasm?sha256=1b0a89d3c12c64844634884beb8347c1d8f1f9b18b3ffce6daa1878a18046b09',import.meta.url);if(url.protocol==='file:'){const {readFile}=await import('node:fs/promises');const bytes=await readFile(url);return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}return fetch(url);})()]);
 if(!response.ok)throw new Error('Compiler formatter package unavailable');
 const formatterOwner=await createFormatter({wasmBinary:await response.arrayBuffer()});
 owner.formatterOwner=formatterOwner;
 return owner;
}
