import {createSharedAreaRenderer} from './vf-shared-area-renderer.mjs';
const need=(v,c)=>{if(!v)throw Object.assign(Error(c),{code:c});};
// Exact-sized native GPU tiles, copied without scaling. One GPU context owns
// the whole label layer; the visible canvas changes only after every tile passes.
// This changes neither typesetting, physical outlines nor the AA sample policy.
export function createTiledNativeLabelRenderer(canvas,options={}) {
 const document=canvas.ownerDocument,staging=document.createElement('canvas'),tile=document.createElement('canvas');
 tile.width=tile.height=1;
 const renderer=createSharedAreaRenderer(tile,options),ratio=options.pixelRatio??(()=>globalThis.devicePixelRatio||1);
 let initialized=false,closed=false,width=1,height=1,scene=null,camera=[1,0,0,1,0,0],color=null,last=null;
 const live=()=>need(!closed,'NATIVE_LABEL_TILES_CLOSED');
 function resize(w,h){live();need([w,h].every(v=>Number.isFinite(v)&&v>0),'NATIVE_LABEL_TILES_VIEWPORT');width=w;height=h;}
 function draw(nextScene,nextCamera,nextColor){
  live();need(initialized&&nextScene&&nextCamera.length===6&&nextCamera.every(Number.isFinite),'NATIVE_LABEL_TILES_INPUT');
  const dpr=ratio(),w=Math.round(width*dpr),h=Math.round(height*dpr),budget=options.maxCoverageBytes??536870912;
  // Two complete RGBA canvases plus one bounded 4x4 area tile and native data.
  need(dpr>0&&w>0&&h>0&&w<=16384&&h<=16384&&w*h*8+960*960*64<=budget,'NATIVE_LABEL_TILES_BUDGET');
  staging.width=w;staging.height=h;
  const ctx=staging.getContext('2d',{alpha:true});need(ctx,'NATIVE_LABEL_TILES_COMPOSITOR');
  const rows=[];let currentScene=null;
  for(let y=0;y<h;y+=960)for(let x=0;x<w;x+=960){
   const tw=Math.min(960,w-x),th=Math.min(960,h-y),c=[...nextCamera];c[4]-=x/dpr;c[5]-=y/dpr;
   renderer.resize(tw/dpr,th/dpr);
   if(currentScene!==nextScene){renderer.setNativeScene(nextScene,c);currentScene=nextScene;}else renderer.setNativeCamera(c);
   if(nextColor)renderer.setNativeColor(nextColor);
   need(tile.width===tw&&tile.height===th,'NATIVE_LABEL_TILES_EXACT_PIXELS');
   ctx.drawImage(tile,0,0,tw,th,x,y,tw,th);
   rows.push({x,y,width:tw,height:th,renderer:renderer.nativeStatistics()});
  }
  const display=canvas.getContext('2d',{alpha:true});need(display,'NATIVE_LABEL_TILES_DISPLAY');
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  display.clearRect(0,0,w,h);display.drawImage(staging,0,0);
  scene=nextScene;camera=[...nextCamera];color=nextColor&&[...nextColor];
  last={backend:'native-area-tiles',width:w,height:h,pixelRatio:dpr,tiles:rows,camera:[...camera],resampling:false,source:'current native VKF physical outlines'};
 }
 return Object.freeze({async initialize(){live();await renderer.initialize();if(closed)return 'disposed';initialized=true;return 'native-area-tiles';},resize,
  setNativeScene(s,c){draw(s,c,color);},setNativeCamera(c){draw(scene,c,color);},setNativeColor(c){draw(scene,camera,c);},
  nativeSourceSnapshot(){live();need(scene&&last,'NATIVE_LABEL_TILES_NO_ACCEPTED_SOURCE');return {sources:structuredClone(scene.nativeSourceOutlines(camera)).map(s=>color?{...s,color:[...color]}:s),receipt:{status:'TILED',resampling:false,tiles:last.tiles.map(t=>({x:t.x,y:t.y,width:t.width,height:t.height,receipt:t.renderer.nativeAccuracy}))}};},
  nativeStatistics:()=>last??{backend:'native-area-tiles',status:'PENDING'},
  destroy(){if(closed)return;closed=true;renderer.destroy();scene=null;staging.width=staging.height=tile.width=tile.height=1;}
 });
}
