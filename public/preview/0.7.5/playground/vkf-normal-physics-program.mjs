// Only the actual canonical compiler call below receives an issuer closure.
// The guest receives no enrollment export, record, numeric token or callback.
const programs=new WeakMap();
const sameBytes=(left,right)=>left instanceof Uint8Array&&left.length===right.length&&left.every((v,i)=>v===right[i]);
export function createNormalPhysicsProgramIssuer(compiler) {
  const binding=compiler.ccall('vkf075_source_binding','string',[],[]);
  if(typeof binding!=='string'||!/^[a-f0-9]{64}$/.test(binding))
    throw new TypeError('Current compiler source identity unavailable');
  return program=>{
    if(!program.manifest.physicsReplay)return program;
    const wire=program.manifest.physicsReplay;
    if(wire.compilerSourceBinding!==binding||wire.sourceAdmission!=='current-live-packaged-provider-generation')
      throw new TypeError('Normal physics result differs from the actual compiler owner');
    // Hidden immutable snapshots detect host-side mutation before an async
    // compile/instantiate boundary. Pins do not replace source issuance.
    programs.set(program,{binding,manifest:program.manifestText,bytes:program.wasm.slice()});
    return program;
  };
}
export function takeNormalPhysicsProgram(program,sourceBinding) {
  const issued=programs.get(program);
  if(!issued||issued.binding!==sourceBinding||program.manifestText!==issued.manifest||
     JSON.stringify(program.manifest)!==JSON.stringify(JSON.parse(issued.manifest))||
     !sameBytes(program.wasm,issued.bytes))
    throw new TypeError('Actual unchanged current-source physics program is required');
  programs.delete(program);
  // Fresh host identity per actual source run; never reconstructed from wire.
  return Object.freeze({sourceOwner:Object.freeze({}),binding:issued.binding,
    wasm:issued.bytes,manifest:JSON.parse(issued.manifest)});
}
