import {TextWave} from './wave-renderer.mjs?v=ea2e9eaf6419';
const kernel=await fetch(new URL('./mitosis-kernel.glsl?v=1e2a4195ae78',import.meta.url)).then(r=>{if(!r.ok)throw Error('Mitosis kernel unavailable');return r.text()});
const vertex=`#version 300 es
precision highp float;
uniform vec2 viewport;uniform vec4 bounds;out vec2 point;
void main(){vec2 c[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));point=bounds.xy+c[gl_VertexID]*bounds.zw;gl_Position=vec4(2.0*point.x/viewport.x-1.0,1.0-2.0*point.y/viewport.y,0,1);}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D atlas;uniform vec2 atlasSize;uniform vec4 parentRect;uniform vec4 childRect;uniform vec4 parentUV;uniform vec4 childUV;uniform vec4 parentInfo;uniform vec4 childInfo;uniform vec4 movingRect;uniform float phase;
in vec2 point;out vec4 outputColor;
${kernel}
float glyphField(vec2 uv,vec4 tex,vec4 info,vec2 size){
 vec2 outside=max(max(-uv,uv-1.0),vec2(0));
 if(info.x>.5){vec2 inside=min(uv*size,(1.0-uv)*size);return min(inside.x,inside.y)-1.0;}
 vec4 c=texture(atlas,mix(tex.xy,tex.zw,clamp(uv,0.0,1.0)));
 float median=max(min(c.r,c.g),min(max(c.r,c.g),c.b));
 float unit=min(size.x/((tex.z-tex.x)*atlasSize.x),size.y/((tex.w-tex.y)*atlasSize.y));
 return (median-.5)*8.0*unit-length(outside*size);
}
void main(){
 float parent=glyphField((point-parentRect.xy)/parentRect.zw,parentUV,parentInfo,parentRect.zw);
 vec2 uv=(point-movingRect.xy)/movingRect.zw;
 float source=glyphField(uv,parentUV,parentInfo,movingRect.zw);
 float target=glyphField(uv,childUV,childInfo,movingRect.zw);
 float d=mitosisField(phase,parent,source,target,min(movingRect.z,movingRect.w)*.14);
 float coverage=clamp(d/max(fwidth(d),.7)+.5,0.0,1.0);
 float hue=.75*clamp(phase/.8,0.0,1.0);vec3 spectral=clamp(abs(mod(hue*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);
 vec3 color=mix(spectral,vec3(1),smoothstep(.8,1.0,phase));
 color=mix(color,vec3(1),clamp(parent+.5,0.0,1.0));
 if(vkf_failed)discard;outputColor=vec4(color*coverage,coverage);
}`;
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
export class MitosisWave extends TextWave {
 constructor(canvas,assets){super(canvas,assets,'mitosis');const gl=this.gl;this.split=gl.createProgram();gl.attachShader(this.split,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(this.split,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.split);if(!gl.getProgramParameter(this.split,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.split));this.splitLocations=Object.fromEntries(['viewport','bounds','atlas','atlasSize','parentRect','childRect','parentUV','childUV','parentInfo','childInfo','movingRect','phase'].map(k=>[k,gl.getUniformLocation(this.split,k)]));this.splitVao=gl.createVertexArray();}
 async layout(source){await super.layout(source);const packets=Array.from({length:this.count},(_,i)=>Array.from(this.instances.slice(i*20,(i+1)*20)));packets.sort((a,b)=>a[17]-b[17]||a[0]-b[0]||a[1]-b[1]);this.instances=new Float32Array(packets.flat());const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.instances,gl.STATIC_DRAW);}
 draw(progress,k,v,grow=true,amount=0){
  const total=this.count,stage=Math.min(Math.max(0,progress),1)*Math.max(1,total-1),parent=Math.min(total-1,Math.floor(stage));
  // Settled symbols use the unchanged native LaTeX renderer.
  this.count=progress>=1||total<2?total:parent;const timing=super.draw(1,k,v,false,0);this.count=total;
  if(progress>=1||total<2)return timing;
  const q=stage-parent,theta=Math.min(Math.PI/2,Math.max(0,(k*(q-.5)+.5)*Math.PI/2));const a=Math.sin(theta)**2;
  if(a===0||a===1){this.count=parent+1+(a===1?1:0);super.draw(1,k,v,false,0);this.count=total;return timing;}
  const old=Array.from(this.instances.slice(parent*20,parent*20+16)),next=Array.from(this.instances.slice((parent+1)*20,(parent+1)*20+16));
  // Coincident replicas at q=0; separate embeddings and interpolate local fields.
  const mix=(x,y)=>x+(y-x)*a;let size=1;
  if(grow)size+=amount*16*a*a*(1-a)*(1-a);
  const w=mix(old[2],next[2])*size,h=mix(old[3],next[3])*size;
  const x=mix(old[0]+old[2]/2,next[0]+next[2]/2)-w/2,y=mix(old[1]+old[3]/2,next[1]+next[3]/2)-h/2;
  const pad=Math.max(w,h)*.2+3,minX=Math.min(old[0],x)-pad,minY=Math.min(old[1],y)-pad,maxX=Math.max(old[0]+old[2],x+w)+pad,maxY=Math.max(old[1]+old[3],y+h)+pad;
  const gl=this.gl,L=this.splitLocations;gl.useProgram(this.split);gl.bindVertexArray(this.splitVao);gl.uniform2f(L.viewport,this.canvas.width,this.canvas.height);gl.uniform4f(L.bounds,minX,minY,maxX-minX,maxY-minY);gl.uniform1i(L.atlas,0);gl.uniform2f(L.atlasSize,...this.assets.data.atlasSize);gl.uniform4fv(L.parentRect,old.slice(0,4));gl.uniform4fv(L.childRect,next.slice(0,4));gl.uniform4fv(L.parentUV,old.slice(4,8));gl.uniform4fv(L.childUV,next.slice(4,8));gl.uniform4fv(L.parentInfo,old.slice(12,16));gl.uniform4fv(L.childInfo,next.slice(12,16));gl.uniform4f(L.movingRect,x,y,w,h);gl.uniform1f(L.phase,a);gl.drawArrays(gl.TRIANGLES,0,6);return timing;
 }
 destroy(){if(this.dead)return;this.gl.deleteProgram(this.split);this.gl.deleteVertexArray(this.splitVao);super.destroy();}
}
