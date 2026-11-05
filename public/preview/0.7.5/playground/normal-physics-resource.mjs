import {createNormalReplayOwner} from './normal-physics-owner.mjs?sha256=1f71919c1a2fd57aa69bdd8f703f789bb539885fdd3357ff75955f926322194f';
import {createNormalReplayImport} from './normal-physics-vm-import.mjs?sha256=ddf147f79e6f7d111f27ec9ae167149088d749e477b94032badd521331816ac6';
// Generated from actual target bytes. The owner and VM import MUST resolve the
// exact same hashed owner module, preserving its private issuance WeakMap.
const compiler='45da9f646f488500745f5a142c84843daae26ef46168802de00a2b9b714b7a94';
export async function openNormalPhysicsResource(sourceOwner,manifest,sourceBinding,signal) {
  if(!/^[a-f0-9]{64}$/.test(compiler)||sourceBinding!==compiler||
     manifest?.physicsReplay?.compilerSourceBinding!==compiler)
    throw new TypeError('Normal physics package/current compiler association unavailable');
  let owner;
  try {
    signal?.throwIfAborted();
    owner=await createNormalReplayOwner(sourceOwner,sourceBinding,signal);
    signal?.throwIfAborted();
    const host=createNormalReplayImport(owner,sourceOwner,manifest);
    owner=null;return host;
  } finally {owner?.close();}
}
