import {binary64Words} from './vf-native-residual.mjs';
import {CURVE_PROGRAM_ID,CURVE_LIMITS,need,enclose32,prepareCurveProgramScene,curveProgramSceneMatches} from './vf-native-curve-program.mjs';
import {CURVE_VERTEX_GLSL,CURVE_FRAGMENT_GLSL,CURVE_FAST_FRAGMENT_GLSL,CURVE_CERTIFICATE_GLSL,CURVE_STENCIL_GLSL,CURVE_CLEAR_GLSL,FULLSCREEN_VERTEX_GLSL,UNCERTAINTY_REDUCE_GLSL,CURVE_RESOLVE_GLSL} from './vf-native-curve-shaders.mjs';

/** Optional source component. No GPU qualification is inherited from e1158.
 * Persistent physical programs + ordered instance data; camera changes NEVER
 * cause AA-phase mesh construction. A bounded per-sample GPU integer dyadic predicate is
 * the only refinement fallback. Unresolved intervals refuse frame acceptance.
 * Source currentness is rechecked each submission, before rendering/commit.
 */
export function createNativeCurveProgramRenderer(canvas,options={}){
 const ratio=options.pixelRatio??(()=>globalThis.devicePixelRatio||1),limits={...CURVE_LIMITS,...options.curveProgramLimits};
 let gl=null,closed=false,paint=null,fastPaint=null,certificatePaint=null,stencilPaint=null,clearPaint=null,reduce=null,resolve=null,vao=null,current=null,spare=null,scene=null,packet=null,gpu=null,pending=null,receipt=null;
 let camera=[1,0,0,1,0,0],cssWidth=1,cssHeight=1,uploads=0,uploadedBytes=0,draws=0,sourceBuilds=0;
 const textures=new Set(),framebuffers=new Set(),renderbuffers=new Set(),programs=new Set(),locations=new Map();
 let floatTargets=false,certificateDraws=0,fastDraws=0,exactReplayDraws=0;
 const live=()=>need(!closed,'CURVE_PROGRAM_CLOSED');
 function uniform(p,name){let map=locations.get(p);if(!map){map=new Map();locations.set(p,map);}if(!map.has(name))map.set(name,gl.getUniformLocation(p,name));return map.get(name);}
 function program(v,f){const p=gl.createProgram();need(p,'CURVE_PROGRAM_GL_PROGRAM');programs.add(p);const shaders=[];
  try{for(const [type,source] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(type);need(s,'CURVE_PROGRAM_GL_SHADER');shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);need(gl.getShaderParameter(s,gl.COMPILE_STATUS),'CURVE_PROGRAM_SHADER_PARSE: '+gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);need(gl.getProgramParameter(p,gl.LINK_STATUS),'CURVE_PROGRAM_SHADER_LINK: '+gl.getProgramInfoLog(p));return p;}
  catch(e){gl.deleteProgram(p);programs.delete(p);throw e;}finally{for(const s of shaders)gl.deleteShader(s);}
 }
 function dropTexture(t){if(t&&textures.delete(t))gl.deleteTexture(t);}
 function dropFramebuffer(f){if(f&&framebuffers.delete(f))gl.deleteFramebuffer(f);}
 function texture(width,height,data=null,float=false,integer=false){const t=gl.createTexture();need(t,'CURVE_PROGRAM_GL_TEXTURE');textures.add(t);
  try{gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,integer?gl.RGBA32UI:float?gl.RGBA32F:gl.RGBA8,width,height,0,integer?gl.RGBA_INTEGER:gl.RGBA,integer?gl.UNSIGNED_INT:float?gl.FLOAT:gl.UNSIGNED_BYTE,data);return t;}
  catch(e){dropTexture(t);throw e;}
 }
 function framebuffer(color,flags=null){const f=gl.createFramebuffer();need(f,'CURVE_PROGRAM_GL_FRAMEBUFFER');framebuffers.add(f);
  try{gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,color,0);if(flags)gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,flags,0);gl.drawBuffers(flags?[gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]:[gl.COLOR_ATTACHMENT0]);need(gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE,'CURVE_PROGRAM_FRAMEBUFFER');return f;}
  catch(e){dropFramebuffer(f);throw e;}
 }
 function target(width,height){const owned={width,height,color:null,flags:null,fbo:null,levels:[]};try{
  owned.color=texture(width,height);owned.flags=texture(width,height);owned.fbo=framebuffer(owned.color,owned.flags);
  for(let w=width,h=height;w>1||h>1;){w=Math.ceil(w/2);h=Math.ceil(h/2);const l={width:w,height:h,texture:texture(w,h),fbo:null};owned.levels.push(l);l.fbo=framebuffer(l.texture);}
  return owned;
 }catch(e){dropTarget(owned);throw e;}}
 function dropResidual(t){
  if(!t)return;
  if(t.stencil){
   gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);
   gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.STENCIL_ATTACHMENT,gl.RENDERBUFFER,null);
   gl.deleteRenderbuffer(t.stencil);renderbuffers.delete(t.stencil);t.stencil=null;
  }
  dropFramebuffer(t.maskFbo);dropTexture(t.mask);t.maskFbo=t.mask=null;
 }
 function dropTarget(t){if(!t)return;dropResidual(t);dropFramebuffer(t.fbo);dropTexture(t.color);dropTexture(t.flags);for(const l of t.levels){dropFramebuffer(l.fbo);dropTexture(l.texture);}}
 function packedTexture(array){const count=Math.max(1,array.length/4),max=gl.getParameter(gl.MAX_TEXTURE_SIZE),width=Math.min(max,count),height=Math.ceil(count/width);need(height<=max,'CURVE_PROGRAM_DATA_TEXTURE_LIMIT');const integer=array instanceof Uint32Array,padded=integer?new Uint32Array(width*height*4):new Float32Array(width*height*4);padded.set(array);const t=texture(width,height,padded,!integer,integer);uploads++;uploadedBytes+=padded.byteLength;return {texture:t,stride:width,bytes:padded.byteLength};}
 function upload(p,retainedBytes=0){
  const packedBytes=a=>{const n=Math.max(1,a.length/4),w=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),n);return w*Math.ceil(n/w)*16;};
  need(packedBytes(p.controls)+packedBytes(p.instances)+packedBytes(p.exactControls)+packedBytes(p.exactInstances)+retainedBytes<=limits.maxBytes,'CURVE_PROGRAM_PADDED_BYTES');
  let controls,instances,exactControls,exactInstances;try{controls=packedTexture(p.controls);instances=packedTexture(p.instances);exactControls=packedTexture(p.exactControls);exactInstances=packedTexture(p.exactInstances);return {controls,instances,exactControls,exactInstances,certificate:null};}catch(e){for(const v of [controls,instances,exactControls,exactInstances])dropTexture(v?.texture);throw e;}
 }
 const gpuBytes=g=>g?g.controls.bytes+g.instances.bytes+g.exactControls.bytes+g.exactInstances.bytes+(g.certificate?.bytes??0):0;
 function dropGPU(g){if(g){for(const v of [g.controls,g.instances,g.exactControls,g.exactInstances])dropTexture(v.texture);if(g.certificate){dropFramebuffer(g.certificate.fbo);dropTexture(g.certificate.texture);}}}
 function bindTexture(p,name,t,unit){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(uniform(p,name),unit);}
 function dimensions(w,h){const dpr=ratio();need(Number.isInteger(w)&&w>0&&Number.isInteger(h)&&h>0&&Number.isInteger(dpr)&&dpr>=1&&dpr<=3,'CURVE_PROGRAM_VIEWPORT');const width=w*dpr,height=h*dpr,max=gl.getParameter(gl.MAX_TEXTURE_SIZE);need(width<=65536&&height<=65536&&width*4<=max&&height*4<=max,'CURVE_PROGRAM_VIEWPORT_LIMIT');
  // Two candidate sample attachments plus a geometric reduction series.
  const bytes=Math.ceil(width*height*16*4*(2+1/3))+64;
  // Stencil/mask sharing is an optimization, never a narrower viewport domain.
  // Discard derived scratch before refusing an otherwise admissible target.
  const budget=options.maxCoverageBytes??536870912;
  const oldBase=current?Math.ceil(current.width*current.height*4*(2+1/3))+64:0;
  let old=oldBase+(current?.mask?current.width*current.height*5:0);
  if(bytes+old>budget){dropResidual(current);old=oldBase;}
  need(bytes+old<=budget,'CURVE_PROGRAM_TARGET_BYTES');
  return {width,height,dpr,bytes,sparseReplayAllowed:bytes+old+width*height*16*5<=budget};}
 async function initialize(){live();gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true});need(gl,'CURVE_PROGRAM_WEBGL2');try{
  need((options.nativeAccuracy??'required')==='required'&&(options.samplesPerAxis??4)===4,'CURVE_PROGRAM_POLICY');
  for(const stage of [gl.VERTEX_SHADER,gl.FRAGMENT_SHADER]){const p=gl.getShaderPrecisionFormat(stage,gl.HIGH_FLOAT);need(p?.precision>=23&&p.rangeMax>=127,'CURVE_PROGRAM_PRECISION');}
  need(gl.getParameter(gl.MAX_DRAW_BUFFERS)>=2&&gl.getParameter(gl.MAX_COLOR_ATTACHMENTS)>=2&&gl.getParameter(gl.SUBPIXEL_BITS)>=2,'CURVE_PROGRAM_MRT_PRECISION');
  // Exact program is linked lazily only after an unresolved fast frame.
  // Common frames cannot inherit its register/local-storage allocation.
  fastPaint=program(CURVE_VERTEX_GLSL,CURVE_FAST_FRAGMENT_GLSL);
  stencilPaint=program(FULLSCREEN_VERTEX_GLSL,CURVE_STENCIL_GLSL);
  clearPaint=program(FULLSCREEN_VERTEX_GLSL,CURVE_CLEAR_GLSL);
  floatTargets=!!gl.getExtension('EXT_color_buffer_float');
  if(floatTargets)certificatePaint=program(FULLSCREEN_VERTEX_GLSL,CURVE_CERTIFICATE_GLSL);
  reduce=program(FULLSCREEN_VERTEX_GLSL,UNCERTAINTY_REDUCE_GLSL);resolve=program(FULLSCREEN_VERTEX_GLSL,CURVE_RESOLVE_GLSL);vao=gl.createVertexArray();need(vao,'CURVE_PROGRAM_VAO');
  cssWidth=canvas.clientWidth||canvas.width||1;cssHeight=canvas.clientHeight||canvas.height||1;return 'webgl2-physical-curve-program-e1161';
 }catch(e){destroy();throw e;}}
 function flags(t){gl.disable(gl.BLEND);gl.useProgram(reduce);let input=t.flags;
  for(const l of t.levels){gl.bindFramebuffer(gl.FRAMEBUFFER,l.fbo);gl.viewport(0,0,l.width,l.height);bindTexture(reduce,'flags',input,0);gl.drawArrays(gl.TRIANGLES,0,3);draws++;input=l.texture;}
  gl.bindFramebuffer(gl.FRAMEBUFFER,t.levels.at(-1)?.fbo??t.fbo);gl.readBuffer(gl.COLOR_ATTACHMENT0);const result=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,result);return {unknown:result[0]!==0,refined:result[1]!==0};
 }
 // Certificate allocation is optional and participates in the existing asset
 // byte budget, including accepted and pending packets. Inline evaluation is
 // the safe fallback when the extension/index/byte domain is unavailable.
 function prepareCertificates(p,g,nextCamera,size){
  if(!floatTargets||!p.sources.length||p.sources.length>100000||p.instanceControlCount>=2**24)return false;
  const max=gl.getParameter(gl.MAX_TEXTURE_SIZE),count=p.instanceControlCount;
  const width=Math.min(max,count),height=Math.ceil(count/width),bytes=width*height*16;
  const retained=[...new Set([gpu,pending?.gpu,g])].filter(Boolean).reduce((n,v)=>n+gpuBytes(v),0);
  if(height>max||retained+(g.certificate?0:bytes)>limits.maxBytes)return false;
  if(!g.certificate){
   const owned={texture:null,fbo:null,stride:width,width,height,bytes};
   try{owned.texture=texture(width,height,null,true);owned.fbo=framebuffer(owned.texture);g.certificate=owned;}
   catch(e){dropFramebuffer(owned.fbo);dropTexture(owned.texture);throw e;}
  }
  const c=g.certificate;
  gl.bindFramebuffer(gl.FRAMEBUFFER,c.fbo);gl.drawBuffers([gl.COLOR_ATTACHMENT0]);gl.viewport(0,0,c.width,c.height);
  gl.disable(gl.BLEND);gl.disable(gl.STENCIL_TEST);gl.useProgram(certificatePaint);
  bindCommon(certificatePaint,g,nextCamera,size);
  gl.uniform1i(uniform(certificatePaint,'deviceControlStride'),c.stride);
  gl.uniform1i(uniform(certificatePaint,'deviceControlCount'),count);
  gl.uniform1i(uniform(certificatePaint,'instanceCount'),p.sources.length);
  gl.drawArrays(gl.TRIANGLES,0,3);draws++;certificateDraws++;
  return true;
 }
 function bindCommon(program,g,nextCamera,size){
  bindTexture(program,'instanceData',g.instances.texture,0);
  bindTexture(program,'controlData',g.controls.texture,1);
  gl.uniform1i(uniform(program,'instanceStride'),g.instances.stride);
  gl.uniform1i(uniform(program,'controlStride'),g.controls.stride);
  gl.uniform2fv(uniform(program,'cameraPairs[0]'),new Float32Array(nextCamera.flatMap(enclose32)));
  gl.uniform1f(uniform(program,'dpr'),size.dpr);
  gl.uniform2f(uniform(program,'deviceViewport'),size.width,size.height);
 }
 function drawOrdered(program,p,g,nextCamera,size,certified,exact){
  gl.useProgram(program);bindCommon(program,g,nextCamera,size);
  // Bind even the disabled sampler to a compatible float texture on its own
  // unit, avoiding WebGL sampler type aliasing with the exact uint textures.
  bindTexture(program,'deviceControls',certified?g.certificate.texture:g.controls.texture,4);
  gl.uniform1i(uniform(program,'deviceControlStride'),certified?g.certificate.stride:g.controls.stride);
  gl.uniform1i(uniform(program,'certificateEnabled'),certified?1:0);
  gl.uniform1i(uniform(program,'depthLimit'),Math.min(24,limits.maxDepth));
  gl.uniform1i(uniform(program,'nodeLimit'),Math.min(8192,limits.maxNodes));
  if(exact){
   bindTexture(program,'exactControls',g.exactControls.texture,2);
   bindTexture(program,'exactInstances',g.exactInstances.texture,3);
   gl.uniform1i(uniform(program,'exactControlStride'),g.exactControls.stride);
   gl.uniform1i(uniform(program,'exactInstanceStride'),g.exactInstances.stride);
   gl.uniform1i(uniform(program,'exactLimbCount'),16);
   gl.uniform2uiv(uniform(program,'camera64[0]'),new Uint32Array(nextCamera.flatMap(binary64Words)));
  }
  // Full source primitive order in BOTH passes. No grouping by material or
  // program, and no late overpainting by an isolated unresolved instance.
  gl.drawArraysInstanced(gl.TRIANGLES,0,6,p.sources.length);draws++;
  if(exact)exactReplayDraws++;else fastDraws++;
 }
 function residualStencil(t){
  if(!t.mask){
   const owned={mask:null,maskFbo:null,stencil:null};
   try{
    owned.mask=texture(t.width,t.height);owned.maskFbo=framebuffer(owned.mask);
    owned.stencil=gl.createRenderbuffer();need(owned.stencil,'CURVE_PROGRAM_STENCIL');renderbuffers.add(owned.stencil);
    gl.bindRenderbuffer(gl.RENDERBUFFER,owned.stencil);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.STENCIL_INDEX8,t.width,t.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.STENCIL_ATTACHMENT,gl.RENDERBUFFER,owned.stencil);
    need(gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE,'CURVE_PROGRAM_STENCIL_FRAMEBUFFER');
    Object.assign(t,owned);
   }catch(error){
    gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.STENCIL_ATTACHMENT,gl.RENDERBUFFER,null);
    if(owned.stencil){gl.deleteRenderbuffer(owned.stencil);renderbuffers.delete(owned.stencil);}
    dropFramebuffer(owned.maskFbo);dropTexture(owned.mask);throw error;
   }
  }
  // A separate immutable mask avoids an attachment/sampler feedback loop.
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER,t.fbo);gl.readBuffer(gl.COLOR_ATTACHMENT1);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,t.maskFbo);gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
  gl.blitFramebuffer(0,0,t.width,t.height,0,0,t.width,t.height,gl.COLOR_BUFFER_BIT,gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);gl.viewport(0,0,t.width,t.height);
  gl.drawBuffers([gl.NONE,gl.NONE]);gl.colorMask(false,false,false,false);
  gl.enable(gl.STENCIL_TEST);gl.stencilMask(255);gl.clearStencil(0);gl.clear(gl.STENCIL_BUFFER_BIT);
  gl.stencilFunc(gl.ALWAYS,1,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.REPLACE);
  gl.disable(gl.BLEND);gl.useProgram(stencilPaint);bindTexture(stencilPaint,'residualMask',t.mask,0);
  gl.drawArrays(gl.TRIANGLES,0,3);draws++;
  // Clear precisely the marked sample centers, then replay ALL original
  // source contributors there with the identical RGBA8 source-over pipeline.
  gl.stencilMask(0);gl.stencilFunc(gl.EQUAL,1,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
  gl.colorMask(true,true,true,true);gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);
  gl.useProgram(clearPaint);gl.drawArrays(gl.TRIANGLES,0,3);draws++;
 }
 function render(p,g,nextCamera,w,h){
  const size=dimensions(w,h);
  if(spare&&(spare.width!==size.width*4||spare.height!==size.height*4)){dropTarget(spare);spare=null;}
  const t=spare??target(size.width*4,size.height*4);spare=t;
  if(!size.sparseReplayAllowed)dropResidual(t);
  const dither=gl.isEnabled(gl.DITHER),beforeCertificates=certificateDraws;
  try{
   need(Number.isInteger(limits.maxDepth)&&limits.maxDepth>0&&limits.maxDepth<=24&&Number.isInteger(limits.maxNodes)&&limits.maxNodes>0,'CURVE_PROGRAM_WORK_LIMIT');
   gl.disable(gl.DITHER);gl.disable(gl.DEPTH_TEST);gl.disable(gl.STENCIL_TEST);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.CULL_FACE);
   gl.colorMask(true,true,true,true);gl.bindVertexArray(vao);
   const certified=prepareCertificates(p,g,nextCamera,size);
   gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);gl.viewport(0,0,t.width,t.height);
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
   drawOrdered(fastPaint,p,g,nextCamera,size,certified,false);
   let status=flags(t),replayed=false;
   if(status.unknown){
    if(!paint)paint=program(CURVE_VERTEX_GLSL,CURVE_FRAGMENT_GLSL);
    if(size.sparseReplayAllowed)residualStencil(t);
    else{
     // Same exact predicate and original painter order without scratch when
     // memory only fits the original double-buffer coverage contract.
     gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);gl.viewport(0,0,t.width,t.height);
     gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    drawOrdered(paint,p,g,nextCamera,size,certified,true);replayed=true;
    gl.disable(gl.STENCIL_TEST);status=flags(t);
   }
   need(!gl.isContextLost()&&gl.getError()===gl.NO_ERROR,'CURVE_PROGRAM_GL_ERROR');
   need(!status.unknown,'CURVE_PROGRAM_UNRESOLVED_SAMPLES');
   return {target:t,size,refined:status.refined,replayed,sparseReplay:replayed&&size.sparseReplayAllowed,certified,certificateDraws:certificateDraws-beforeCertificates};
  }finally{
   gl.disable(gl.STENCIL_TEST);gl.stencilMask(255);gl.colorMask(true,true,true,true);
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindVertexArray(null);if(dither)gl.enable(gl.DITHER);
  }
 }
 function present(t,size){const dither=gl.isEnabled(gl.DITHER);try{gl.disable(gl.DITHER);if(canvas.width!==size.width)canvas.width=size.width;if(canvas.height!==size.height)canvas.height=size.height;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,size.width,size.height);gl.disable(gl.BLEND);gl.bindVertexArray(vao);gl.useProgram(resolve);bindTexture(resolve,'area',t.color,0);gl.drawArrays(gl.TRIANGLES,0,3);draws++;need(!gl.isContextLost()&&gl.getError()===gl.NO_ERROR,'CURVE_PROGRAM_PRESENT_ERROR');}finally{gl.bindVertexArray(null);if(dither)gl.enable(gl.DITHER);}}
 function submit(nextScene,nextCamera,w,h){live();need(gl&&nextScene?.nativeSourceOutlines,'NATIVE_ACCURACY_PHYSICAL_SOURCE_REQUIRED');need(Array.isArray(nextCamera)&&nextCamera.length===6&&nextCamera.every(v=>Number.isFinite(v)&&Math.abs(v)<=65536),'CURVE_PROGRAM_CAMERA');
  // Identity-camera source intake catches current physical path, native lease,
  // source bounds, placement, material and revision changes before reuse.
  // It performs no tessellation or per-phase proof. Shape content is compared,
  // never accepted on glyph spelling or an unchecked revision string.
  const inputs=nextScene.nativeSourceOutlines([1,0,0,1,0,0],{maxInstances:limits.maxInstances});
  need(Array.isArray(inputs)&&inputs.length<=limits.maxInstances,'CURVE_PROGRAM_INSTANCE_LIMIT');
  const unchanged=packet&&curveProgramSceneMatches(packet,inputs),pendingHit=!unchanged&&pending&&curveProgramSceneMatches(pending.packet,inputs),nextPacket=unchanged?packet:pendingHit?pending.packet:prepareCurveProgramScene(inputs,limits);let nextGPU=unchanged?gpu:pendingHit?pending.gpu:null,result;
  if(!unchanged&&!pendingHit){
   if(pending){dropGPU(pending.gpu);pending=null;}
   // Asset certification is independent of view acceptance. Keep the most
   // recent rejected proposal's programs resident; never call it an accepted
   // frame or make its source available for capture. Bound BOTH asset owners.
   need(nextPacket.receipt.bytes+(gpu?gpuBytes(gpu):0)<=limits.maxBytes,'CURVE_PROGRAM_TRANSACTION_BYTES');
   nextGPU=upload(nextPacket,gpu?gpuBytes(gpu):0);sourceBuilds++;pending={scene:nextScene,packet:nextPacket,gpu:nextGPU};
  }
  if(pendingHit)pending.scene=nextScene;
  const beforeUploads=uploads,beforeBytes=uploadedBytes;
  result=render(nextPacket,nextGPU,nextCamera,w,h);present(result.target,result.size);
  const oldTarget=current,oldGPU=gpu;current=result.target;spare=oldTarget;gpu=nextGPU;packet=nextPacket;scene=nextScene;camera=[...nextCamera];cssWidth=w;cssHeight=h;if(oldGPU!==gpu)dropGPU(oldGPU);if(pending&&pending.gpu!==gpu)dropGPU(pending.gpu);pending=null;
  receipt={...packet.receipt,status:'RUNTIME_CURVE_PROGRAM_ACCEPTED_UNQUALIFIED',pixelRatio:result.size.dpr,width:w,height:h,runtimeIntervalResolved:true,boundedGPURefinement:result.refined,exactReplay:result.replayed,sparseExactReplay:result.sparseReplay,gpuControlCertificates:result.certified,gpuCertificateDraws:result.certificateDraws,gpuPrecomputationIncludedInSubmission:true,sourcePreparationMs:null,newPrograms:unchanged||pendingHit?0:packet.programs.length,newPhaseProofs:0,warmGeometryUploadCalls:uploads-beforeUploads,warmGeometryUploadBytes:uploadedBytes-beforeBytes,driverQualification:'UNRUN until admitted ordinary21+witness8 and full10k current-source checks',allFontsCertificate:false};return receipt;
 }
 function setNativeScene(s,c=camera){return submit(s,c,cssWidth,cssHeight);}
 function setNativeCamera(c){return submit(scene??pending?.scene,c,cssWidth,cssHeight);}
 function resize(w=canvas.clientWidth,h=canvas.clientHeight){live();if(!scene){need(Number.isInteger(w)&&w>0&&Number.isInteger(h)&&h>0,'CURVE_PROGRAM_VIEWPORT');cssWidth=w;cssHeight=h;return;}return submit(scene,camera,w,h);}
 function nativeSourceSnapshot(){live();need(receipt&&packet,'NATIVE_ACCURACY_NO_ACCEPTED_SOURCE');need(curveProgramSceneMatches(packet,scene.nativeSourceOutlines([1,0,0,1,0,0],{maxInstances:limits.maxInstances})),'CURVE_PROGRAM_STALE_CAPTURE');return {sources:structuredClone(scene.nativeSourceOutlines(camera,{maxInstances:limits.maxInstances})),receipt:structuredClone(receipt)};}
 // Explicit diagnostic readback, invoked outside benchmark query scopes.
 // Flags count the union of sample centers over source instances; additive
 // Boolean MRT flags do not expose exact per-instance invocation frequency.
 function nativeSampleDiagnostics(){
  live();need(current&&receipt,'NATIVE_ACCURACY_NO_ACCEPTED_SOURCE');
  const started=performance.now(),samples=current.width*current.height;
  const pixels=new Uint8Array(samples*4);
  gl.bindFramebuffer(gl.FRAMEBUFFER,current.fbo);gl.readBuffer(gl.COLOR_ATTACHMENT1);
  try{
   gl.readPixels(0,0,current.width,current.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   need(!gl.isContextLost()&&gl.getError()===gl.NO_ERROR,'CURVE_PROGRAM_DIAGNOSTIC_GL_ERROR');
   let unresolved=0,refined=0;
   for(let i=0;i<pixels.length;i+=4){unresolved+=pixels[i]!==0;refined+=pixels[i+1]!==0;}
   return {sampleCenters:samples,refinedSampleCenters:refined,unresolvedSampleCenters:unresolved,refinedFraction:refined/samples,exactInstanceInvocationCount:null,scope:'union over all source instances; separate diagnostic readback, never a GPU benchmark',readbackBytes:pixels.byteLength,cpuDiagnosticMs:performance.now()-started};
  }finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
 }
 function nativeStatistics(){return {nativeAccuracy:receipt??{status:'NO_NATIVE_SCENE',indexed10kAccuracy:'OPEN'},camera:[...camera],uploads,uploadBytes:uploadedBytes,sourceBuilds,gpuBytes:(gpu?gpuBytes(gpu):0)+(pending?gpuBytes(pending.gpu):0),pendingPhysicalPrograms:pending?.packet.programs.length??0,pendingViewAccepted:false,coverageBytes:current?current.width*current.height*8:0,draws,labels:packet?.sources.length??0,backend:CURVE_PROGRAM_ID,certificateDraws,fastDraws,exactReplayDraws};}
 function destroy(){if(closed)return;closed=true;if(gl){for(const f of [...framebuffers])dropFramebuffer(f);for(const t of [...textures])dropTexture(t);for(const r of renderbuffers)gl.deleteRenderbuffer(r);renderbuffers.clear();for(const p of programs)gl.deleteProgram(p);if(vao)gl.deleteVertexArray(vao);}programs.clear();scene=packet=gpu=pending=current=receipt=null;gl=null;}
 const unsupported=()=>need(false,'NATIVE_ACCURACY_PHYSICAL_SOURCE_REQUIRED');
 return Object.freeze({initialize,resize,setNativeScene,setNativeCamera,nativeStatistics,nativeSourceSnapshot,nativeSampleDiagnostics,setPackedVertices:unsupported,setCertifiedNativeOutline:unsupported,setNativeLabelBatches:unsupported,setScene:unsupported,destroy,get backend(){return gl?'webgl2-physical-curve-program-e1161':null;},get nativeAreaFramebuffer(){return current?.fbo??null;},coveragePolicy:()=>({samplesPerAxis:4,pixelRatio:ratio(),target:current?{width:current.width/4,height:current.height/4}:null})});
}
