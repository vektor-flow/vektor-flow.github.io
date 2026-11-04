import {mountRetainedSceneResult} from '../inline-retained-scene-view.mjs';
import {prepareRetainedViewTransition} from './vf-presentation-transition.mjs';
const need=(v,c)=>{if(!v)throw Error(c);};
/** Shared VKF view-stack player. The host supplies authored state IDs/packets,
 * navigation and timing; this component owns all state rendering/interpolation.
 */
export function createRetainedPresentationPlayer({container,VfDisplay=globalThis.VfDisplay,VfFrame=globalThis.VfFrame,onFrame=()=>{}}={}){
 const states=new Map();let current=null,transition=null,pair=null,sequence=0,closed=false;
 async function mount(packets,axisVisible){
  const element=container.ownerDocument.createElement('div');element.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:0';container.append(element);
  const dispose=mountRetainedSceneResult(element,packets,{VfDisplay,VfFrame,axisVisible});
  try{
   const shown=await dispose.presented;need(shown,'VKF view was disposed before presentation');
   if(packets.some(p=>p.metadata.scene.texts?.length)||(axisVisible!==false&&packets.some(p=>p.metadata.scene.meshes?.some(m=>m.axis_ticks?.enabled!==false))))await Promise.all(dispose.frameIds.map(id=>VfDisplay.waitForNativeLabelFrame(id)));
   const sources=[];
   packets.forEach((p,i)=>{const ids=new Set((p.metadata.scene.texts||[]).map((t,j)=>String(t.id??'native-text-'+j)));sources.push(...VfDisplay.nativeLabelFrameSources(dispose.frameIds[i]).filter(s=>ids.has(s.provenance.elementId)));});
   return {element,packets,sources,dispose(){dispose();element.remove();}};
  }catch(error){dispose();element.remove();throw error;}
 }
 function clearTransition(){transition?.close();transition=null;pair=null;}
 return Object.freeze({
  async show({key,packets,fromKey,durationMs=0,progress,axisVisible}={}){
   need(!closed,'VKF presentation is closed');const ticket=++sequence;
   if(!packets?.length){clearTransition();current?.dispose();current=null;states.clear();return true;}
   need(typeof key==='string'&&key.length>0,'VKF authored state identity is required');
   const requestedPair=fromKey&&fromKey!==key?fromKey+'\u0000'+key:null;
   const accepted=receipt=>{onFrame({...receipt,fromKey,toKey:key});};
   if(requestedPair&&requestedPair===pair&&transition&&progress!==undefined){transition.element.style.display='';const frame=await transition.sample(progress);if(ticket!==sequence||closed)return false;accepted(frame);current.element.style.opacity=progress===1?'1':'0';if(progress===1){current.element.style.opacity='1';transition.element.style.display='none';}return true;}
   clearTransition();
   const endpoint=await mount(packets,axisVisible);if(ticket!==sequence||closed){endpoint.dispose();return false;}
   const prior=states.get(fromKey);states.set(key,{packets,sources:endpoint.sources});
   while(states.size>12){const candidate=states.keys().next().value;if(candidate===key)break;states.delete(candidate);}
   if(prior&&requestedPair&&(durationMs>0||progress!==undefined)){
    const priorEndpoint=current;
    try{
     transition=await prepareRetainedViewTransition({container,fromPackets:prior.packets,toPackets:packets,fromSources:prior.sources,toSources:endpoint.sources,axisVisible:axisVisible===true,VfDisplay,VfFrame});pair=requestedPair;
     current=endpoint;
     if(progress!==undefined){const frame=await transition.sample(progress);priorEndpoint?.element.style.setProperty('opacity','0');accepted(frame);if(progress===1){endpoint.element.style.opacity='1';transition.element.style.display='none';}}
     else{
      const frames=Math.max(2,Math.round(durationMs/1000*24)),started=performance.now();
      for(let i=0;i<=frames;i++){
       if(ticket!==sequence||closed){endpoint.dispose();return false;}
       const frame=await transition.sample(i/frames);priorEndpoint?.element.style.setProperty('opacity','0');accepted(frame);
       const delay=started+durationMs*(i+1)/frames-performance.now();if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
      }
      endpoint.element.style.opacity='1';transition.element.style.display='none';
     }
     priorEndpoint?.dispose();return true;
    }catch(error){endpoint.dispose();clearTransition();current=priorEndpoint;if(priorEndpoint)priorEndpoint.element.style.opacity='1';throw error;}
   }
   endpoint.element.style.opacity='1';current?.dispose();current=endpoint;return true;
  },
  close(){if(closed)return;closed=true;sequence++;clearTransition();current?.dispose();current=null;states.clear();}
 });
}
