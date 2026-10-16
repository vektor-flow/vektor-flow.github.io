const $=id=>document.getElementById(id),canvas=$('view'),ctx=canvas.getContext('2d');
let worker,ready=false,busy=false,wanted=0,generation=0;
function request(){if(!ready||busy)return;busy=true;$('status').textContent=`Calculating state ${wanted.toFixed(2)}…`;worker.postMessage({type:'sample',coordinate:wanted});}
function prepare(){
 worker?.terminate();ready=false;busy=false;const current=++generation;
 $('status').textContent='Preparing geometry…';worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
 worker.onmessage=({data})=>{
  if(current!==generation)return;
  if(data.type==='ready'){ready=true;request();return;}
  if(data.type==='error'){busy=false;$('status').textContent=`Could not calculate this state: ${data.message}`;return;}
  if(data.type==='frame'){
   busy=false;if(data.coordinate!==wanted){request();return;}
   // Presentation only: coverage is produced by VKF, including shape and area.
   const surface=new OffscreenCanvas(data.resolution,data.resolution),paint=surface.getContext('2d');
   const pixels=paint.createImageData(data.resolution,data.resolution);
   data.frame.coverage.forEach((a,i)=>{pixels.data[4*i]=9+58*a;pixels.data[4*i+1]=17+194*a;pixels.data[4*i+2]=22+202*a;pixels.data[4*i+3]=255;});
   paint.putImageData(pixels,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(surface,0,0,canvas.width,canvas.height);
   $('position').value=data.coordinate.toFixed(2);$('status').textContent=`State ${data.coordinate.toFixed(2)} · area ${data.frame.measure.toFixed(4)} · calculated in ${(data.milliseconds/1000).toFixed(2)} s`;
   window.morphingVerification={coordinate:data.coordinate,measure:data.frame.measure,resolution:data.resolution,mode:Number($('mode').value),start:$('start').checked,end:$('end').checked};
  }
 };
 worker.onerror=event=>{$('status').textContent=`Could not load Morphing: ${event.message}`;};
 worker.postMessage({type:'prepare',mode:Number($('mode').value),start:$('start').checked,end:$('end').checked});
}
$('coordinate').oninput=()=>{wanted=Number($('coordinate').value);request();};
for(const id of ['mode','start','end'])$(id).onchange=prepare;
window.addEventListener('pagehide',()=>worker?.terminate());prepare();
