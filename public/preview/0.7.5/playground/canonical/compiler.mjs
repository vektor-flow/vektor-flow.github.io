import createCompiler from './compiler-base.mjs?sha256=7528ecc611af15707cdaca3b0d722a3f99004ae416a9d212b21bebcbf1345ae4';
import createFormatter from './formatter.mjs?sha256=09d2c19339b97bf47cbe3f95e6f0e9dfe762f463ef27fc4fe8cc913a7b12d53f';
// Explicit Node host entrypoint; the browser/default factory never imports host
// I/O or resolves packages. Ship package-tools and prepare-formatter-ir.mjs
// alongside this wrapper (tools/package-canonical.mjs stages their closure).
export async function createProjectCompiler(options={}){
 const {createProjectCompiler: create}=await import('./package-tools/project.mjs');
 return create({...options,factory:options.factory??(options.compilerModule?undefined:createCanonicalPackage)});
}
export default async function createCanonicalPackage(options){
 const [owner,response]=await Promise.all([createCompiler(options),(async()=>{const url=new URL('./formatter.wasm?sha256=474cc08820c38053d1377d17646688fecb7bc6df07b09133ca959c06f73ae7e6',import.meta.url);if(url.protocol==='file:'){const {readFile}=await import('node:fs/promises');const bytes=await readFile(url);return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}return fetch(url);})()]);
 if(!response.ok)throw new Error('Compiler formatter package unavailable');
 const formatterOwner=await createFormatter({wasmBinary:await response.arrayBuffer()});
 owner.formatterOwner=formatterOwner;
 return owner;
}
