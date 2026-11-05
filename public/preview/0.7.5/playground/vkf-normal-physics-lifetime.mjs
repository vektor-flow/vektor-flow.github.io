import {openNormalPhysicsResource} from './normal-physics-resource.mjs?sha256=fc197e82d60d1c8c166f891dabcf6970f2b4385c6ac31e5f6ca7f49ff94d23ed';
// Called only with an actual issued canonical program or a private ticket
// received on its existing actual compiler-worker route. Never from guest data.
export async function prepareNormalPhysicsLifetime(sourceOwner,manifest,sourceBinding,signal) {
  let host=null,closed=false,bound=false;
  const aborted=()=>signal?.throwIfAborted();
  const close=()=>{
    if(closed)return;
    const owned=host;
    try{owned?.close();}finally{
      // Refused teardown retains the still-issued owner for a later safe close.
      if(!owned||owned.closed){closed=true;host=null;sourceOwner=null;}
    }
  };
  try {
    aborted();host=await openNormalPhysicsResource(sourceOwner,manifest,sourceBinding,signal);
    aborted();
    // Abort guards reject new operations immediately. The actual execution's
    // finally/retained close owns teardown after the guest settles, preserving
    // the same VM/resource and propagating disposal errors through that owner.
    // An AbortSignal event callback must not consume the only teardown error.
    return Object.freeze({
      get closed(){return closed;},
      get imports(){if(closed||!host)throw new TypeError('Normal physics run is closed');return host.imports;},
      bind(exports){
        aborted();if(closed||bound||!host)throw new TypeError('Normal physics VM cannot be rebound or closed');
        host.bind(exports);bound=true;
      },
      bindWorld(resourcePointer,worldOwner,geometry,state){
        aborted();if(closed||!bound||!host)throw new TypeError('Current bound normal physics lifetime required');
        return host.bindWorld(resourcePointer,worldOwner,geometry,state);
      },
      requestWorld(view,cause,tick){
        aborted();if(closed||!bound||!host)throw new TypeError('Current retained physics lifetime required');
        return host.requestWorld(view,cause,tick);
      },close,
    });
  } catch(error) {
    try{close();}catch(cleanup){throw new AggregateError([error,cleanup],'Normal physics preparation and cleanup failed');}
    throw error;
  }
}
export function classifyNormalImports(imports) {
  const seen=new Set();let retained=false,physics=false,concurrent=false;
  for(const item of imports){
    const key=item.module+'/'+item.name;
    if(item.kind!=='function'||seen.has(key))throw new TypeError('Invalid or duplicate normal host import');
    seen.add(key);
    if(key==='vkf.retained/invoke_v1')retained=true;
    else if(key==='vkf.physics/replay_si_v1'||key==='vkf.physics/session_si_v1')physics=true;
    else if(key==='vkf.concurrent/invoke')concurrent=true;
    else throw new TypeError('Compiled program requires an unavailable host capability');
  }
  // Existing retained/concurrent host ownerships remain separate. Physics can
  // accompany either supported route without replacing either import table.
  if(retained&&concurrent)throw new TypeError('Combined retained/concurrent host route unavailable');
  return Object.freeze({retained,physics,concurrent});
}
