import {createResidentMeshRenderer} from '../../public/preview/0.7.5/vf-ui/geom/vf-resident-mesh-renderer.mjs';
import {createCompiledFieldKernel,createFieldBuffer} from '../../public/preview/0.7.5/vf-ui/vf-compiled-field-runtime.mjs';
const check=(x,m)=>{if(!x)throw Error(m);};
window.run=async()=>{
 const errors=[],adapter=await navigator.gpu.requestAdapter(),device=await adapter.requestDevice();device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
 const kernels={};for(const name of ['accumulate','resolve']){const code=await(await fetch(new URL('./artifacts/'+name+'.wgsl',import.meta.url))).text(),manifest=await(await fetch(new URL('./artifacts/'+name+'.wgsl.json',import.meta.url))).json();kernels[name]=await createCompiledFieldKernel(device,code,manifest);}
 const canvas=document.createElement('canvas');document.body.append(canvas);const renderer=await createResidentMeshRenderer(canvas,{device,profile:'implicit-material-density-2d',densityKernels:kernels}),buffers=[];
 const alloc=a=>{const b=createFieldBuffer(device,a,GPUBufferUsage.VERTEX);buffers.push(b);return b;};
 const square=(x0,x1,rgba)=>new Float32Array([[x0,-.5],[x1,-.5],[x0,.5],[x0,.5],[x1,-.5],[x1,.5]].flatMap(([x,y])=>[x,y,0,...rgba]));
 const red=square(-.5,.5,[.25,0,0,.25]),blue=square(-.5,.5,[0,0,.75,.75]),packet=new Float32Array(red.length+blue.length);packet.set(red);packet.set(blue,red.length);const b=alloc(packet);
 const snapshot=async()=>{const image=await renderer.captureBitmap(),c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(image,0,0);image.close();return cx.getImageData(0,0,c.width,c.height).data;};
 const rgba=(data,x,y)=>[...data.subarray((y*canvas.width+x)*4,(y*canvas.width+x)*4+4)];
 const invalid=alloc(square(-.5,.5,[-.25,0,0,.25]));const reports=[];
 try{
 renderer.resize(128,128);
 await renderer.setResidentLineages([{buffer:b,count:6},{buffer:b,count:6,offset:red.byteLength}]);const first=await snapshot(),centre=rgba(first,64,64);check(centre.every((v,i)=>Math.abs(v-[64,0,191,255][i])<=1),'Native density weighted colour '+centre);check(rgba(first,0,0).every(v=>v===0),'Outside density is visible');reports.push({kind:'native-density-mixture',centre});
 await renderer.setResidentLineages([{buffer:b,count:6,offset:red.byteLength},{buffer:b,count:6}]);const reversed=await snapshot();check(reversed.every((v,i)=>v===first[i]),'Two-lineage ordering changes colour');reports.push({kind:'order-parity',exact:true});
 await renderer.clear();check((await snapshot()).every(v=>v===0),'Clear retained material');
 await renderer.setResidentLineages([{buffer:b,count:6},{buffer:b,count:6,offset:red.byteLength}]);check((await snapshot()).every((v,i)=>v===first[i]),'Seek replay changed pixels');reports.push({kind:'seek-replay',exact:true});
 let diagnostic=false;try{await renderer.setResidentLineages([{buffer:invalid,count:6}]);}catch(e){diagnostic=e.message==='Native density kernel diagnostic';}check(diagnostic,'Native numerical failure was hidden');check((await snapshot()).every((v,i)=>v===first[i]),'Failed native result was displayed');reports.push({kind:'native-error-summary',rejectsBeforeDisplay:true});
 await renderer.setResidentLineages([{buffer:b,count:6},{buffer:b,count:6,offset:red.byteLength}]);
 let rejected=0;for(const input of [[{buffer:b,count:5}],[{buffer:b,count:6,offset:1}],[{buffer:b,count:6,offset:b.size}]]){try{await renderer.setResidentLineages(input);}catch{rejected++;}}check(rejected===3,'Invalid packet accepted');
 const before=renderer.statistics();try{renderer.resize(4096,4096);throw Error('Oversized resize accepted');}catch(e){check(e.message==='Density renderer resource limit','Wrong resource rejection '+e.message);}check(renderer.statistics().width===128,'Rejected resize discarded valid viewport');reports.push({kind:'resource-rejection',preservesViewport:true});
 await renderer.setResidentLineages([{buffer:b,count:6}]);const only=rgba(await snapshot(),64,64);check(only.every((v,i)=>Math.abs(v-[255,0,0,255][i])<=1),'Single material density changed opacity/colour');reports.push({kind:'single-density',centre:only});
 renderer.resize(256,128);await renderer.setResidentLineages([{buffer:b,count:6},{buffer:b,count:6,offset:red.byteLength}]);check(rgba(await snapshot(),128,64).every((v,i)=>Math.abs(v-[64,0,191,255][i])<=1),'Non-square native projection failed');
 await device.queue.onSubmittedWorkDone();check(errors.length===0,'WebGPU errors '+errors.join(';'));
 return{schema:'native-density-composition/1',passed:true,reports,invalidPackets:rejected,statistics:renderer.statistics(),firstStatistics:before,errors,scope:'Raster/transport of supplied native density operators; no state topology, fluid or Product readiness claim'};
 }finally{renderer.destroy();buffers.forEach(b=>b.destroy());device.destroy();}
};window.ready=true;
