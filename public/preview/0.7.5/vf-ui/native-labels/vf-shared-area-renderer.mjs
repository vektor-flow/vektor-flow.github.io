import {createCertifiedOutlineCache} from './vf-native-outline-cache.mjs';
import {createNativeCurveProgramRenderer} from './vf-native-curve-renderer.mjs';
import {certifiedNativeSampleMesh} from './vf-native-certified-samples.mjs';
import {prepareNativeAccuracyScene} from './vf-native-accuracy-scene.mjs';
import {buildScreenSpaceSimplexVertices} from '../geom/vf-screen-simplex-renderer.mjs';
import {COVERAGE_POLICY,areaSampleOffsets} from './vf-stroke-contract.mjs';
const failure=(message,status='FAIL')=>Object.assign(Error(message),{status,code:message});
export function areaTarget({cssWidth,cssHeight,pixelRatio=1,samplesPerAxis=COVERAGE_POLICY.samplesPerAxis,maxTextureSize=16384,maxBytes=536870912}) {
  areaSampleOffsets(samplesPerAxis);
  if(![cssWidth,cssHeight,pixelRatio].every(x=>Number.isFinite(x)&&x>0))throw failure('PLOT_COVERAGE_VIEWPORT');
  const width=Math.max(1,Math.round(cssWidth*pixelRatio)),height=Math.max(1,Math.round(cssHeight*pixelRatio));
  const areaWidth=width*samplesPerAxis,areaHeight=height*samplesPerAxis,bytes=areaWidth*areaHeight*4;
  if(areaWidth>maxTextureSize||areaHeight>maxTextureSize||bytes>maxBytes)throw failure('PLOT_COVERAGE_TARGET_BUDGET','BLOCKED');
  return Object.freeze({width,height,areaWidth,areaHeight,bytes,samplesPerAxis,cssWidth,cssHeight,pixelRatio});
}
// Index identical complete float32 vertex records without changing triangle
// order, winding, boundary coordinates, color, placement, or sample policy.
// Keep the original stream when indexing cannot reduce owned GPU bytes.
export function indexNativeCoverageMesh(vertices) {
 if(!(vertices instanceof Float32Array)||vertices.length%18)throw failure('PLOT_NATIVE_INDEX_INPUT');
 const bits=new Uint32Array(vertices.buffer,vertices.byteOffset,vertices.length),ids=new Map(),unique=[],indices=[];
 for(let at=0;at<bits.length;at+=6){
  const key=Array.from(bits.subarray(at,at+6)).join(',');let id=ids.get(key);
  if(id===undefined){id=unique.length/6;ids.set(key,id);for(let j=0;j<6;j++)unique.push(bits[at+j]);}indices.push(id);
 }
 const words=new Uint32Array(unique),packed=new Float32Array(words.buffer),Index=unique.length/6<=65536?Uint16Array:Uint32Array,element=new Index(indices);
 if(packed.byteLength+element.byteLength>=vertices.byteLength)return null;
 // Exact bitwise expansion is a cold-path guard, including signed zero.
 for(let i=0;i<element.length;i++)for(let j=0;j<6;j++)if(words[element[i]*6+j]!==bits[i*6+j])return null;
 return {vertices:packed,indices:element,indexBytes:element.BYTES_PER_ELEMENT,sourceVertices:vertices.length/6,uniqueVertices:packed.length/6};
}

// Exact accepted vector geometry is re-rasterized at centered area samples and
// box resolved in premultiplied space. Zoom never enlarges an old bitmap.
// Shared triangle edges are resolved once after the whole scene is drawn.
export function createSharedAreaRenderer(canvas,options={}) {
  if(options.nativeAccuracyBackend==='curve-program-e1161')return createNativeCurveProgramRenderer(canvas,options);
  if(options.nativeAccuracyBackend!==undefined&&options.nativeAccuracyBackend!=='exact-phase-cache-e1158')throw failure('PLOT_NATIVE_ACCURACY_BACKEND');
  const nativeAccuracy=options.nativeAccuracy??'required';
  if(!['required','diagnostic-uncertified'].includes(nativeAccuracy))throw failure('PLOT_NATIVE_ACCURACY_POLICY');
  const ratio=options.pixelRatio??(()=>globalThis.devicePixelRatio||1);
  const sampleCount=options.samplesPerAxis??COVERAGE_POLICY.samplesPerAxis;
  areaSampleOffsets(sampleCount);
  let gl=null,paint=null,resolve=null,buffer=null,texture=null,framebuffer=null,vao=null,nativePaint=null;
  let indexedSourceVertices=0,indexedUniqueVertices=0,indexedMeshes=0;
  let adaptiveScene=null,adaptiveGPU=new Map(),adaptiveLast=null,adaptiveDrawWallMs=0;
  let nativeStyleColor=null;
  let nativeBatches=null,camera=[1,0,0,1,0,0],nativeUploads=0,nativeBytes=0,nativeDraws=0,nativeVerifiedSamples=0;
  let certifiedQuantization=false;
  let accuracyScene=null,accuracyReceipt=null,accuracySources=[],accuracyDraws=[],accuracyGPU=new Map(),accuracyGPUBytes=0,accuracyGPUClock=0;
  const outlineCache=createCertifiedOutlineCache(options.nativeAccuracyLimits);
  let cssWidth=1,cssHeight=1,target=null,vertices=new Float32Array(),closed=false,capacity=0;
  const uniformLocations=new Map();
  function uniform(p,name){let m=uniformLocations.get(p);if(!m){m=new Map();uniformLocations.set(p,m);}if(!m.has(name))m.set(name,gl.getUniformLocation(p,name));return m.get(name);}
  const live=()=>{if(closed)throw failure('PLOT_COVERAGE_CLOSED')};
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw failure('PLOT_COVERAGE_SHADER: '+log)}return s;}
  function program(v,f){const p=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,v);let fs;
    try{fs=shader(gl.FRAGMENT_SHADER,f);gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw failure('PLOT_COVERAGE_LINK: '+gl.getProgramInfoLog(p));return p;
    }catch(error){gl.deleteProgram(p);throw error}finally{gl.deleteShader(vs);if(fs)gl.deleteShader(fs)}}
  async function initialize(){live();gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true});
    if(!gl)throw failure('PLOT_AREA_WEBGL2_UNAVAILABLE','BLOCKED');
    try{
      paint=program(`#version 300 es
        layout(location=0) in vec2 position; layout(location=1) in vec4 color;
        uniform vec2 viewport; uniform vec2 certifiedTranslation; uniform vec4 certifiedColor; uniform bool residentCertificate; out vec4 rgba;
        void main(){vec2 p=position+certifiedTranslation;gl_Position=vec4(p.x/viewport.x*2.-1.,1.-p.y/viewport.y*2.,0.,1.);rgba=residentCertificate?certifiedColor:color;}`,
      `#version 300 es
        precision highp float; in vec4 rgba; out vec4 result; uniform bool certifiedSamples;
        void main(){vec4 p=vec4(rgba.rgb*rgba.a,rgba.a);result=certifiedSamples?floor(p*255.+.5)/255.:p;}`);
      resolve=program(`#version 300 es
        void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`,
      `#version 300 es
        precision highp float; precision highp int;
        uniform highp sampler2D area; uniform int samples; uniform bool certifiedSamples; out vec4 result;
        void main(){ivec2 base=ivec2(gl_FragCoord.xy)*samples;
          if(certifiedSamples){ivec4 bytes=ivec4(0);int count=samples*samples;
            for(int y=0;y<8;y++){if(y>=samples)break;for(int x=0;x<8;x++){if(x>=samples)break;bytes+=ivec4(floor(texelFetch(area,base+ivec2(x,y),0)*255.+.5));}}
            result=vec4((bytes+ivec4(count/2))/count)/255.;return;}
          vec4 sum=vec4(0.);
          for(int y=0;y<8;y++){if(y>=samples)break;for(int x=0;x<8;x++){if(x>=samples)break;sum+=texelFetch(area,base+ivec2(x,y),0);}}
          result=sum/float(samples*samples);}`);
      nativePaint=program(`#version 300 es
        layout(location=0) in vec2 position;layout(location=1) in vec4 color;layout(location=2) in vec4 placement;
        uniform vec2 viewport;uniform vec4 linear;uniform vec2 translate;uniform vec4 styleColor;uniform bool styleOverride;out vec4 rgba;
        void main(){vec2 world=placement.xy+vec2(position.x,-position.y)*placement.z;vec2 p=vec2(linear.x*world.x+linear.z*world.y,linear.y*world.x+linear.w*world.y)+translate;gl_Position=vec4(p.x/viewport.x*2.-1.,1.-p.y/viewport.y*2.,0.,1.);rgba=styleOverride?styleColor:color;}`,
       `#version 300 es
        precision highp float;in vec4 rgba;out vec4 result;void main(){result=vec4(rgba.rgb*rgba.a,rgba.a);}`);
      buffer=gl.createBuffer();texture=gl.createTexture();framebuffer=gl.createFramebuffer();vao=gl.createVertexArray();
      resize(canvas.clientWidth||cssWidth,canvas.clientHeight||cssHeight);return 'webgl2-area';
    }catch(error){destroy();throw error}
  }
  function resize(width=canvas.clientWidth,height=canvas.clientHeight){live();const nextWidth=Math.max(1,Number(width)||1),nextHeight=Math.max(1,Number(height)||1);
    if(!gl){cssWidth=nextWidth;cssHeight=nextHeight;return;}
    const next=areaTarget({cssWidth:nextWidth,cssHeight:nextHeight,pixelRatio:ratio(),samplesPerAxis:sampleCount,maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),maxBytes:options.maxCoverageBytes??536870912});
    const accepted=accuracyScene?prepareAccuracy(accuracyScene,camera,nextWidth,nextHeight,next):null;
    cssWidth=nextWidth;cssHeight=nextHeight;
    if(canvas.width!==next.width)canvas.width=next.width;if(canvas.height!==next.height)canvas.height=next.height;
    if(!target||target.areaWidth!==next.areaWidth||target.areaHeight!==next.areaHeight){
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,next.areaWidth,next.areaHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw failure('PLOT_COVERAGE_FRAMEBUFFER','BLOCKED');
    }
    target=next;draw(accepted);
  }
  function draw(accepted=null){if(!gl||!target)return;
    if(accuracyScene){accepted??=prepareAccuracy(accuracyScene,camera,cssWidth,cssHeight,target);accuracyDraws=accepted.draws;accuracySources=accepted.sources;vertices=new Float32Array();accuracyReceipt=accepted.receipt;certifiedQuantization=true;}
    const restoreDither=certifiedQuantization&&gl.isEnabled(gl.DITHER);
    try{if(certifiedQuantization)gl.disable(gl.DITHER);
    gl.bindVertexArray(vao);gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,target.areaWidth,target.areaHeight);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(paint);gl.uniform1i(uniform(paint,'certifiedSamples'),certifiedQuantization?1:0);gl.uniform2f(uniform(paint,'viewport'),cssWidth,cssHeight);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.uniform2f(uniform(paint,'certifiedTranslation'),0,0);gl.uniform1i(uniform(paint,'residentCertificate'),0);
    if(capacity<vertices.byteLength){capacity=Math.max(256,vertices.byteLength);gl.bufferData(gl.ARRAY_BUFFER,capacity,gl.DYNAMIC_DRAW)}
    if(!nativeBatches&&!adaptiveScene&&vertices.length){gl.bufferSubData(gl.ARRAY_BUFFER,0,vertices);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,24,8);gl.drawArrays(gl.TRIANGLES,0,vertices.length/6)}
    if(accuracyScene){
      // Preserve the exact original outline/material order. Only geometry is
      // shared; overlapping half-opacity instances are NEVER regrouped.
      const pinned=new Set(accuracyDraws.map(d=>d.template));
      gl.uniform1i(uniform(paint,'residentCertificate'),1);
      for(const d of accuracyDraws){let gpu=accuracyGPU.get(d.template);
       if(!gpu){const packed=buildScreenSpaceSimplexVertices({primitives:d.template.triangles.map(points=>({kind:'face',points,color:[0,0,0,1]}))});
        const gpuLimit=options.nativeAccuracyLimits?.maxBytes??134217728,entryLimit=options.nativeAccuracyLimits?.maxEntries??4096;
        while(accuracyGPUBytes+packed.byteLength>gpuLimit||accuracyGPU.size>=entryLimit){let victim;for(const [template,item] of accuracyGPU)if(!pinned.has(template)&&(!victim||item.used<victim.item.used))victim={template,item};if(!victim)throw blocked('OUTLINE_CACHE_GPU_BYTES');gl.deleteBuffer(victim.item.buffer);accuracyGPUBytes-=victim.item.bytes;accuracyGPU.delete(victim.template);}
        const v=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,v);gl.bufferData(gl.ARRAY_BUFFER,packed,gl.STATIC_DRAW);gpu={buffer:v,bytes:packed.byteLength,count:packed.length/6,used:0};accuracyGPU.set(d.template,gpu);accuracyGPUBytes+=gpu.bytes;nativeUploads++;
       }
       gpu.used=++accuracyGPUClock;gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,24,8);
       gl.uniform2fv(uniform(paint,'certifiedTranslation'),d.translation);gl.uniform4fv(uniform(paint,'certifiedColor'),d.color);gl.drawArrays(gl.TRIANGLES,0,gpu.count);nativeDraws++;
      }
      gl.uniform1i(uniform(paint,'residentCertificate'),0);gl.uniform2f(uniform(paint,'certifiedTranslation'),0,0);
    }
    if(nativeBatches){gl.useProgram(nativePaint);gl.uniform2f(uniform(nativePaint,'viewport'),cssWidth,cssHeight);gl.uniform4fv(uniform(nativePaint,'linear'),camera.slice(0,4));gl.uniform2fv(uniform(nativePaint,'translate'),camera.slice(4));gl.uniform1i(uniform(nativePaint,'styleOverride'),nativeStyleColor?1:0);gl.uniform4fv(uniform(nativePaint,'styleColor'),nativeStyleColor??[0,0,0,1]);
      for(const b of nativeBatches){gl.bindBuffer(gl.ARRAY_BUFFER,b.vertexBuffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,24,8);
       gl.bindBuffer(gl.ARRAY_BUFFER,b.instanceBuffer);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,16,0);gl.vertexAttribDivisor(2,1);gl.drawArraysInstanced(gl.TRIANGLES,0,b.vertexCount,b.count);nativeDraws++;}
      gl.vertexAttribDivisor(2,0);gl.disableVertexAttribArray(2);
    }
    if(adaptiveScene){const active=adaptiveScene.frame(camera,cssWidth,cssHeight,{samplesPerAxis:sampleCount,pixelRatio:target.pixelRatio});adaptiveLast=adaptiveScene.statistics();
      if(adaptiveLast.meshMisses)for(const [group,gpu] of adaptiveGPU)for(const [key,mesh] of gpu.meshes)if(!group.meshes.has(key)){gl.deleteBuffer(mesh.buffer);if(mesh.indexBuffer)gl.deleteBuffer(mesh.indexBuffer);nativeBytes-=mesh.bytes;gpu.meshes.delete(key);}
      gl.useProgram(nativePaint);gl.uniform2f(uniform(nativePaint,'viewport'),cssWidth,cssHeight);gl.uniform4fv(uniform(nativePaint,'linear'),camera.slice(0,4));gl.uniform2fv(uniform(nativePaint,'translate'),camera.slice(4));gl.uniform1i(uniform(nativePaint,'styleOverride'),nativeStyleColor?1:0);gl.uniform4fv(uniform(nativePaint,'styleColor'),nativeStyleColor??[0,0,0,1]);
      const drawStart=performance.now();
      for(const b of active){const gpu=adaptiveGPU.get(b.group);let mesh=gpu.meshes.get(b.mesh.key);
       // Bound GPU meshes by the same source mesh cache; eviction deletes GL ownership.
       for(const [k,v] of gpu.meshes)if(!b.group.meshes.has(k)){gl.deleteBuffer(v.buffer);if(v.indexBuffer)gl.deleteBuffer(v.indexBuffer);nativeBytes-=v.bytes;gpu.meshes.delete(k);}
       if(!mesh){const indexed=options.indexNativeMeshes===false?null:indexNativeCoverageMesh(b.mesh.vertices),data=indexed?.vertices??b.mesh.vertices,vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);mesh={buffer:vertexBuffer,vertices:b.mesh.vertices.length/6,bytes:data.byteLength};nativeUploads++;
        if(indexed){mesh.indexBuffer=gl.createBuffer();mesh.indexType=indexed.indexBytes===2?gl.UNSIGNED_SHORT:gl.UNSIGNED_INT;gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indexed.indices,gl.STATIC_DRAW);mesh.bytes+=indexed.indices.byteLength;nativeUploads++;indexedMeshes++;indexedSourceVertices+=indexed.sourceVertices;indexedUniqueVertices+=indexed.uniqueVertices;}
        gpu.meshes.set(b.mesh.key,mesh);nativeBytes+=mesh.bytes;}
       gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,24,8);
       gl.bindBuffer(gl.ARRAY_BUFFER,gpu.instanceBuffer);gl.enableVertexAttribArray(2);gl.vertexAttribDivisor(2,1);
       for(let i=0;i<b.rangeCount*2;i+=2){const first=b.ranges[i],count=b.ranges[i+1]-first;gl.vertexAttribPointer(2,4,gl.FLOAT,false,16,first*16);if(mesh.indexBuffer){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);gl.drawElementsInstanced(gl.TRIANGLES,mesh.vertices,mesh.indexType,0,count);}else gl.drawArraysInstanced(gl.TRIANGLES,0,mesh.vertices,count);nativeDraws++;}
      }
      adaptiveDrawWallMs=performance.now()-drawStart;gl.vertexAttribDivisor(2,0);gl.disableVertexAttribArray(2);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,target.width,target.height);gl.disable(gl.BLEND);gl.useProgram(resolve);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(uniform(resolve,'area'),0);gl.uniform1i(uniform(resolve,'samples'),sampleCount);gl.uniform1i(uniform(resolve,'certifiedSamples'),certifiedQuantization?1:0);gl.drawArrays(gl.TRIANGLES,0,3);gl.bindVertexArray(null);
    }finally{if(restoreDither)gl.enable(gl.DITHER);}
  }
  function replacePackedVertices(next,certified){live();if(!(next instanceof Float32Array)||next.length%18)throw failure('PLOT_COVERAGE_TRIANGLES');if(nativeBatches||adaptiveScene||accuracyScene)releaseNative();certifiedQuantization=certified;vertices=next;draw()}
  function setPackedVertices(next){replacePackedVertices(next,false)}
  // Explicit bounded display fallback; source commands remain the vector and
  // selection authority. Compute/certify before replacing the current scene.
  // The indexed large-scene path and its immutable mesh keys are untouched.
  function setCertifiedNativeOutline({commands,matrix,color=[0,0,0,1],maxPixels=4096,...limits}){
    live();if(!gl||!target||sampleCount!==4)throw failure('PLOT_CERTIFIED_SAMPLE_POLICY','BLOCKED');
    const precision=gl.getShaderPrecisionFormat(gl.VERTEX_SHADER,gl.HIGH_FLOAT);
    const subpixelBits=gl.getParameter(gl.SUBPIXEL_BITS);
    if(!precision||precision.precision<23||precision.rangeMax<127||subpixelBits<2)throw failure('PLOT_CERTIFIED_RASTER_PRECISION','BLOCKED');
    const rasterErrorEnvelope=16*2**(-precision.precision)*Math.max(target.areaWidth,target.areaHeight)+2**(-subpixelBits-1);
    if(!(rasterErrorEnvelope<.5))throw failure('PLOT_CERTIFIED_RASTER_ENVELOPE','BLOCKED');
    const pixelRatio=ratio();
    if(target.width!==cssWidth*pixelRatio||target.height!==cssHeight*pixelRatio)throw failure('PLOT_CERTIFIED_VIEWPORT_SCALE','BLOCKED');
    const certified=certifiedNativeSampleMesh(commands,matrix,{...limits,pixelRatio,width:cssWidth,height:cssHeight,maxPixels});
    const packed=buildScreenSpaceSimplexVertices({primitives:certified.triangles.map(points=>({kind:'face',points,color}))});
    certified.raster={shaderPrecisionBits:precision.precision,subpixelBits,errorEnvelopeAreaTexels:rasterErrorEnvelope,sampleMarginAreaTexels:.5};
    certified.raster.quantization='exact RGBA8 premultiplied sample quantization and integer byte-space AA16 box resolve; DITHER disabled during certified draw then prior state restored';
    replacePackedVertices(packed,true);return certified;
  }
  function blocked(code){return Object.assign(failure(code,'BLOCKED'),{action:'retain previous accepted frame; use bounded physical-source scene or a qualified general renderer',nativeAccuracy:'OPEN'});}
  function prepareAccuracy(scene,nextCamera,width,height,nextTarget){
   if(!gl||!nextTarget||sampleCount!==4)throw blocked('PLOT_CERTIFIED_SAMPLE_POLICY');
   if(!Array.isArray(nextCamera)||nextCamera.length!==6||!nextCamera.every(Number.isFinite))throw blocked('PLOT_NATIVE_CAMERA');
   if(typeof scene?.nativeSourceOutlines!=='function')throw blocked('NATIVE_ACCURACY_PHYSICAL_SOURCE_REQUIRED');
   const precision=gl.getShaderPrecisionFormat(gl.VERTEX_SHADER,gl.HIGH_FLOAT),subpixelBits=gl.getParameter(gl.SUBPIXEL_BITS);
   if(!precision||precision.precision<23||precision.rangeMax<127||subpixelBits<2)throw blocked('PLOT_CERTIFIED_RASTER_PRECISION');
   const envelope=16*2**(-precision.precision)*Math.max(nextTarget.areaWidth,nextTarget.areaHeight)+2**(-subpixelBits-1),pixelRatio=nextTarget.pixelRatio;
   if(!(envelope<.5))throw blocked('PLOT_CERTIFIED_RASTER_ENVELOPE');
   if(nextTarget.width!==width*pixelRatio||nextTarget.height!==height*pixelRatio)throw blocked('PLOT_CERTIFIED_VIEWPORT_SCALE');
   const began=performance.now();let plan;
   try{plan=prepareNativeAccuracyScene(scene.nativeSourceOutlines([...nextCamera],options.nativeAccuracyLimits),{...options.nativeAccuracyLimits,width,height,pixelRatio,cache:outlineCache,resident:true});
    const unique=new Set(plan.draws.map(d=>d.template)),gpuBytes=[...unique].reduce((n,t)=>n+t.triangles.length*18*4,0);
    if(gpuBytes>(options.nativeAccuracyLimits?.maxBytes??134217728))throw blocked('OUTLINE_CACHE_GPU_BYTES');
    let maxCoordinate=Math.max(width,height);for(const d of plan.draws)for(const v of d.translation)maxCoordinate=Math.max(maxCoordinate,Math.abs(v));for(const t of unique)for(const v of t.bounds)maxCoordinate=Math.max(maxCoordinate,Math.abs(v)/pixelRatio);
    const residentEnvelope=64*2**(-precision.precision)*maxCoordinate*pixelRatio*sampleCount+2**(-subpixelBits-1);
    if(!(residentEnvelope<.5))throw blocked('PLOT_CERTIFIED_RASTER_ENVELOPE');
    plan.receipt.residentRasterEnvelope=residentEnvelope;plan.receipt.residentGPUBytes=gpuBytes;}
   catch(error){error.status='BLOCKED';error.action??=blocked(error.code??'NATIVE_ACCURACY_UNCERTIFIED').action;throw error;}
   return {draws:plan.draws,sources:plan.sources,receipt:{...plan.receipt,sourcePreparationMs:performance.now()-began,packedBytes:0,rasterErrorEnvelopeAreaTexels:envelope,
    sourceCaptureAuthority:'physical source commands; display sample cells excluded from selection/PDF',camera:[...nextCamera]}};
  }
  function releaseNative(){accuracyScene=null;accuracyReceipt=null;accuracySources=[];accuracyDraws=[];for(const gpu of accuracyGPU.values())gl.deleteBuffer(gpu.buffer);accuracyGPU.clear();accuracyGPUBytes=0;const previousVAO=gl.getParameter(gl.VERTEX_ARRAY_BINDING);gl.bindVertexArray(vao);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,null);gl.bindVertexArray(previousVAO);for(const g of adaptiveGPU.values()){gl.deleteBuffer(g.instanceBuffer);for(const m of g.meshes.values()){gl.deleteBuffer(m.buffer);if(m.indexBuffer)gl.deleteBuffer(m.indexBuffer);}}adaptiveGPU.clear();adaptiveScene=null;adaptiveLast=null;if(nativeBatches)for(const b of nativeBatches){gl.deleteBuffer(b.vertexBuffer);gl.deleteBuffer(b.instanceBuffer);}nativeBatches=null;nativeBytes=0;}
  function setNativeLabelBatches(batches,nextCamera){live();if(!gl)throw failure('PLOT_NATIVE_BATCH_INITIALIZE');if(nativeAccuracy==='required')throw blocked('NATIVE_ACCURACY_PHYSICAL_SOURCE_REQUIRED');if(!Array.isArray(batches))throw failure('PLOT_NATIVE_BATCH_ARRAY');releaseNative();certifiedQuantization=false;nativeBatches=[];nativeBytes=0;
   for(const b of batches){if(!(b.vertices instanceof Float32Array)||b.vertices.length%18||!(b.instances instanceof Float32Array)||b.instances.length%4)throw failure('PLOT_NATIVE_BATCH_RECORD');
    const vertexBuffer=gl.createBuffer(),instanceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);gl.bufferData(gl.ARRAY_BUFFER,b.vertices,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,b.instances,gl.STATIC_DRAW);
    for(const offset of [0,Math.max(0,b.instances.length-4)]){if(!b.instances.length)continue;const sample=new Float32Array(4);gl.getBufferSubData(gl.ARRAY_BUFFER,offset*4,sample);if(sample.some((x,j)=>x!==b.instances[offset+j]))throw failure('PLOT_NATIVE_INSTANCE_UPLOAD_MISMATCH');nativeVerifiedSamples++;}
    if(gl.getBufferParameter(gl.ARRAY_BUFFER,gl.BUFFER_SIZE)!==b.instances.byteLength)throw failure('PLOT_NATIVE_INSTANCE_GPU_SIZE');nativeBytes+=b.vertices.byteLength+b.instances.byteLength;nativeUploads+=2;
    nativeBatches.push({vertexBuffer,instanceBuffer,vertexCount:b.vertices.length/6,count:b.instances.length/4});}
   setNativeCamera(nextCamera);
  }
  function setNativeScene(scene,nextCamera){live();if(!gl||!scene?.frame||!scene?.groups)throw failure('PLOT_ADAPTIVE_SCENE');
   if(nativeAccuracy==='required'){const accepted=prepareAccuracy(scene,nextCamera,cssWidth,cssHeight,target);releaseNative();accuracyScene=scene;camera=[...nextCamera];draw(accepted);return accuracyReceipt;}
   releaseNative();certifiedQuantization=false;adaptiveScene=scene;
   for(const g of scene.groups.values()){const instanceBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,g.instances,gl.STATIC_DRAW);nativeBytes+=g.instances.byteLength;nativeUploads++;
    for(const offset of [0,Math.max(0,g.instances.length-4)]){if(!g.instances.length)continue;const sample=new Float32Array(4);gl.getBufferSubData(gl.ARRAY_BUFFER,offset*4,sample);if(sample.some((x,j)=>x!==g.instances[offset+j]))throw failure('PLOT_ADAPTIVE_INSTANCE_SOURCE');nativeVerifiedSamples++;}
    if(gl.getBufferParameter(gl.ARRAY_BUFFER,gl.BUFFER_SIZE)!==g.instances.byteLength)throw failure('PLOT_ADAPTIVE_INSTANCE_BYTES');adaptiveGPU.set(g,{instanceBuffer,meshes:new Map()});
   }setNativeCamera(nextCamera);
  }
  function setNativeCamera(next){live();if(!Array.isArray(next)||next.length!==6||!next.every(Number.isFinite))throw failure('PLOT_NATIVE_CAMERA');const accepted=accuracyScene?prepareAccuracy(accuracyScene,next,cssWidth,cssHeight,target):null;camera=[...next];draw(accepted);return accuracyReceipt;}
  // Evaluated opaque style only. Physical source/cache/required-accuracy
  // guards remain unchanged; no uncertified style enters the required path.
  function setNativeColor(color){
   live();if(nativeAccuracy==='required')throw blocked('NATIVE_ACCURACY_STYLE_PROFILE_UNQUALIFIED');
   if(!adaptiveScene)throw failure('PLOT_NATIVE_RESIDENT_SCENE_REQUIRED');
   if(!Array.isArray(color)||color.length!==4||!color.every(v=>Number.isFinite(v)&&v>=0&&v<=1)||color[3]!==1)throw failure('PLOT_NATIVE_OPAQUE_STYLE');
   nativeStyleColor=[...color];draw();
  }
  function nativeSourceSnapshot(){live();if(!accuracyScene||!accuracyReceipt)throw blocked('NATIVE_ACCURACY_NO_ACCEPTED_SOURCE');return {sources:structuredClone(accuracySources),receipt:structuredClone(accuracyReceipt)};}
  function nativeStatistics(){return {styleColor:nativeStyleColor&&[...nativeStyleColor],nativeAccuracy:accuracyReceipt??{status:nativeAccuracy==='required'?'NO_NATIVE_SCENE':'DIAGNOSTIC_UNCERTIFIED',indexed10kAccuracy:'OPEN'},indexedMeshes,indexedSourceVertices,indexedUniqueVertices,batches:adaptiveScene?adaptiveGPU.size:(nativeBatches?.length??0),labels:adaptiveLast?.resident??nativeBatches?.reduce((n,b)=>n+b.count,0)??0,submittedVertices:adaptiveLast?adaptiveLast.triangles*3:(nativeBatches?.reduce((n,b)=>n+b.vertexCount*b.count,0)??0),gpuBytes:nativeBytes+accuracyGPUBytes,coverageBytes:target?.bytes??0,uploads:nativeUploads,verifiedInstanceSamples:nativeVerifiedSamples,draws:nativeDraws,camera:[...camera],adaptive:adaptiveLast,adaptiveDrawWallMs};}
  function destroy(){if(closed)return;closed=true;vertices=new Float32Array();if(gl){releaseNative();if(nativePaint)gl.deleteProgram(nativePaint);if(buffer)gl.deleteBuffer(buffer);if(texture)gl.deleteTexture(texture);if(framebuffer)gl.deleteFramebuffer(framebuffer);if(vao)gl.deleteVertexArray(vao);if(paint)gl.deleteProgram(paint);if(resolve)gl.deleteProgram(resolve)}outlineCache.close();gl=null;target=null}
  return Object.freeze({initialize,resize,setPackedVertices,setCertifiedNativeOutline,setNativeLabelBatches,setNativeScene,setNativeCamera,setNativeColor,nativeStatistics,nativeSourceSnapshot,setScene:scene=>setPackedVertices(buildScreenSpaceSimplexVertices(scene)),destroy,
    get backend(){return gl?'webgl2-area':null},coveragePolicy:()=>Object.freeze({...COVERAGE_POLICY,samplesPerAxis:sampleCount,target})});
}
