import {loadCurrentWasmLabelProducer} from './vf-current-wasm-producer.mjs?sha256=4b653b98b42a2c2ff175f30bfb0719765e37eadaaf4c9c3b505a4a09073a0e58';
import {createCurrentNativeTypography} from './vf-current-native-provider.mjs?sha256=1bd1b35a58878452355c5c3152419eb08d9c0a4a7eca7aa0107407baeea426ad';
import {installCurrentNativeLabels} from './vf-native-label-layer.mjs?sha256=f4214b936ba0df65e789cf790beb87768a2abb32bf2ec0af294016b37dd3b83b';
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
/** Normal UI installation. Immutable installed code is reusable; each new math
 * source still enters the genuine current VKF parser/layout engine. No seed boxes.
 * Called lazily from an actual evaluated standalone-math text, never prewarmed.
 */
export async function installCurrentWasmMathLabels({VfDisplay=globalThis.VfDisplay,
 producerURL=new URL('../artifacts/current-labels/producer.json',import.meta.url),
 mappingURL=new URL('../artifacts/current-labels/native-mapping/bundle.json',import.meta.url),fetch:fetcher=globalThis.fetch}={}){
 const started=performance.now(),results=[];let producer,typography,uninstall;
 async function json(url,pin){const r=await fetcher(url,{cache:'no-store'});if(!r.ok)throw Error('CURRENT_MATH_RESOURCE_FETCH');const bytes=await r.arrayBuffer();if(pin&&await digest(bytes)!==pin)throw Error('CURRENT_MATH_RESOURCE_CHANGED');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 try{
  const [descriptor,bundle]=await Promise.all([json(producerURL),json(mappingURL)]);
  if(descriptor.identity.catalogSha256!==bundle.identity.catalogSha256||descriptor.identity.resourceClosureSha256!==bundle.identity.resourceClosureSha256)throw Error('CURRENT_MATH_RESOURCE_CLOSURE');
  const files=Object.fromEntries(Object.entries(descriptor.files).map(([k,v])=>[k,{...v,url:new URL(v.url,producerURL).href}]));
  const loads=await Promise.allSettled([loadCurrentWasmLabelProducer({...descriptor,files,fetch:fetcher}),...['vectors','binding'].map(k=>json(new URL(bundle.files[k].url,mappingURL),bundle.files[k].sha256))]);
  if(loads[0].status==='fulfilled')producer=loads[0].value;
  const failed=loads.find(x=>x.status==='rejected');if(failed)throw failed.reason;
  const [loaded,vectors,binding]=loads.map(x=>x.value);
  typography=createCurrentNativeTypography({boxes:{},vectors,binding,identity:producer.identity,typeset:async(run,pins)=>{const at=performance.now(),result=await producer.typeset(run,pins);results.push({source:run.source,box:result.box,roundtripMs:performance.now()-at,timing:result.timing});return result;}});
  uninstall=installCurrentNativeLabels({VfDisplay,typography});
  let closing;
  return Object.freeze({identity:producer.identity,setupMs:performance.now()-started,results,statistics:()=>typography.stats(),async measureMathSource(source){
    const lease=await typography.prepare({kind:'math',source});
    try{return {width:lease.box.width,height:lease.box.height,depth:lease.box.depth};}finally{lease.release();}
  },close(){return closing??=(async()=>{await uninstall();await VfDisplay.joinNativeLabelCleanup();typography.close();producer.close();})();}});
 }catch(error){await uninstall?.();typography?.close();producer?.close();throw error;}
}
