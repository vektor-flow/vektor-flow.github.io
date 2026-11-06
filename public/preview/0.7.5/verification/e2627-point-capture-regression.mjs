// Ordinary authored point programs, compared before/after at the packet boundary.
export async function pointCaptureControls() {
 const base='/preview/0.7.5/';
 const m=await(await fetch(base+'current-compiler-release.json',{cache:'no-store'})).json();
 const {createInlineRunner}=await import(base+'inline-runner.mjs');
 const runner=createInlineRunner({wasmUrl:base+m.package.wasm.replace(/^\.\//,''),moduleURL:base+m.package.module.replace(/^\.\//,''),dataURL:base+m.package.data.replace(/^\.\//,''),expectedSourceBinding:m.browser_binding,timeoutMs:180000});
 const sources=[
  {name:'asymmetric-full-domain',source:`viewport: .ui.viewport
points:[[-3,2,1],[4,-5,2],[0,7,-6],[1,0,3]]
viewport.add(p:points_ic,s:3,color:[0.2,0.6,0.8,0.4],id:"capture")
viewport.show()`},
  {name:'repeated-executed-add',source:`viewport: .ui.viewport
points:[[0.0,0.0,0.0],[1.0,1.0,1.0],[2.0,-1.0,3.0]]
i:0
i<3?>
    points.(0):[i*3-4,i-2,i+1]
    viewport.add(p:points_ic,s:2,color:[0.1,0.3,0.7,0.5])
    .i:i+1
viewport.show()`},
  {name:'ordinary-view-fallback',source:`viewport: .ui.viewport
points:[[-2,3,1],[4,-1,-3],[1,2,5]]
viewport.add(p:points_ic,s:2,color:[0.2,0.6,0.8,0.4],id:"view")
viewport.push()
viewport.add(p:points_ic,s:3,color:[0.8,0.2,0.1,0.7],id:"second")
viewport.show()`},
 ];
 const need=(v,s)=>{if(!v)throw Error(s);},rows=[];
 try {
  for(const {name,source} of sources){
   const visual=await runner.run(source,{guestArenaBytes:1073741824});
   need(visual.sourceBinding===m.browser_binding,'COMPILER_BINDING');
   const packets=visual.packets.map(packet=>{
    const normalize=value=>{
     if(value&&typeof value==='object'&&value.storage&&Number.isInteger(value.byte_offset)&&Number.isInteger(value.length)){
      const C=value.storage==='float32'?Float32Array:value.storage==='uint32'?Uint32Array:null;
      if(C){const values=Array.from(new C(packet.arena.buffer,packet.arena.byteOffset+value.byte_offset,value.length));need(values.every(Number.isFinite),'NONFINITE_ARENA');return {storage:value.storage,values};}
     }
     if(Array.isArray(value))return value.map(normalize);
     if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)]));
     return value;
    };
    return normalize(packet.metadata);
   });
   need(packets.length>0,'ORDINARY_POINT_PACKET');
   const meshes=packets.flatMap(p=>p.scene.meshes??[]);
   for(const mesh of meshes){need(mesh.vertices.values.length%10===0,'FULL_XYZ_NORMAL_RGBA');need(mesh.indices.values.every((v,i)=>v===i),'ORDERED_INDICES');}
   if(name==='asymmetric-full-domain'){
    need(meshes.length===1&&meshes[0].vertices.values.length===40,'ALL_FOUR_POINTS');
    const a=meshes[0].vertices.values,xyz=[[-3,2,1],[4,-5,2],[0,7,-6],[1,0,3]];
    for(let i=0;i<4;i++)for(let c=0;c<10;c++)need(Math.abs(a[i*10+c]-[...xyz[i],0,0,1,.2,.6,.8,.4][c])<1e-6,'FULL_CHANNEL_VALUE');
   }
   if(name==='repeated-executed-add'){
    need(meshes.length===3,'ALL_THREE_EXECUTED_ADDS');
    need(meshes.every((mesh,i)=>mesh.vertices.values.length===30&&mesh.vertices.values[0]===i*3-4),'INDEPENDENT_CAPTURE_ORDER');
   }
   rows.push({name,source,packets});
  }
  return {status:'PASS_ORDINARY_POINT_CAPTURE',binding:visualBinding(m),rows};
 } finally {await runner.dispose();}
 function visualBinding(m){return m.browser_binding;}
}
