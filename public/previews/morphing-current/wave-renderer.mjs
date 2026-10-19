import {typesetText} from '../gpu-math-typing/text-flow.mjs';
import {packLatexItem} from '../gpu-math-typing/latex-instances.mjs';
// One clamped quarter-period ramp, shared by both shader stages.
const ramp=`float alphaWave(float x){float q=clamp(k*(front-x),0.0,1.5707963267948966);float a=sin(q);return a*a;}`;
const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec4 rect;layout(location=1) in vec4 uvRect;layout(location=2) in vec4 ink;layout(location=3) in vec4 info;layout(location=4) in vec4 wave;
uniform vec2 viewport;uniform float front;uniform float k;uniform float grow;uniform float overshoot;
out vec2 uv;out vec2 local;out float readingX;flat out vec4 material;
${ramp}
void main(){
 vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));vec2 c=corners[gl_VertexID];
 float gap=1.5707963267948966/k;float a=alphaWave(wave.w+wave.y*gap);float z=a-1.0;float size=1.0+(overshoot+1.0)*z*z*z+overshoot*z*z;
 if(grow<.5)size=1.0;
 vec2 center=rect.xy+rect.zw*.5;vec2 p=center+(c-.5)*rect.zw*max(0.0,size);
 readingX=wave.x+wave.y*gap+(p.x-rect.x)*wave.z;
 gl_Position=vec4(2.0*p.x/viewport.x-1.0,1.0-2.0*p.y/viewport.y,0,1);
 uv=mix(uvRect.xy,uvRect.zw,c);local=c*rect.zw;material=info;
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D atlas;uniform vec2 atlasSize;uniform float front;uniform float k;
in vec2 uv;in vec2 local;in float readingX;flat in vec4 material;out vec4 outputColor;
${ramp}
void main(){
 vec4 sampleColor=texture(atlas,uv);float m=max(min(sampleColor.r,sampleColor.g),min(max(sampleColor.r,sampleColor.g),sampleColor.b));
 float range=max(.5*dot(vec2(8.0)/atlasSize,1.0/max(fwidth(uv),vec2(1e-8))),1.0);
 float coverage=clamp((m-.5)*range+.5,0.0,1.0);
 if(material.x>.5){vec2 halfSize=material.yz*.5;vec2 q=local-(halfSize+1.0);vec2 pixel=max(fwidth(local),vec2(1e-8));vec2 lo=max(q-pixel*.5,-halfSize);vec2 hi=min(q+pixel*.5,halfSize);vec2 area=clamp((hi-lo)/pixel,vec2(0),vec2(1));coverage=area.x*area.y;}
 float a=alphaWave(readingX);float alpha=coverage*a;
 // Red -> yellow -> green -> cyan -> blue -> violet, then white.
 float hue=.75*clamp(a/.8,0.0,1.0);
 vec3 spectral=clamp(abs(mod(hue*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
 vec3 color=mix(spectral,vec3(1),smoothstep(.8,1.0,a));
 outputColor=vec4(color*alpha,alpha);
}`;
async function unpack(url,json=false){const r=await fetch(new URL(url,import.meta.url));if(!r.ok)throw Error('LaTeX resource unavailable');const raw=await r.arrayBuffer();const bytes=new Uint8Array(raw);const content=bytes[0]===31&&bytes[1]===139?await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():raw;return json?JSON.parse(new TextDecoder().decode(content)):new Uint8Array(content);}
let compactPromise,fullPromise;
export function loadWaveAssets(){return compactPromise??=Promise.all([unpack('wave-data.json.gz',true),unpack('wave-atlas.rgba.gz')]).then(([data,pixels])=>({data,pixels}));}
function loadFullAssets(){return fullPromise??=Promise.all([fetch(new URL('../gpu-math-typing/typing-data.json',import.meta.url)).then(r=>r.json()),unpack('../gpu-math-typing/atlas.rgba.gz')]).then(([data,pixels])=>({data,pixels}));}
function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
export class TextWave {
 constructor(canvas,assets,mode){
  this.canvas=canvas;this.mode=mode;this.assets=assets;this.count=0;this.groups=0;this.dead=false;
  const gl=this.gl=canvas.getContext('webgl2',{alpha:false,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL2 is required for real-time LaTeX');
  this.program=gl.createProgram();gl.attachShader(this.program,compile(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
  this.locations=Object.fromEntries(['viewport','atlasSize','atlas','front','k','grow','overshoot'].map(key=>[key,gl.getUniformLocation(this.program,key)]));
  this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
  for(let i=0;i<5;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,80,i*16);gl.vertexAttribDivisor(i,1);}
  this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.uploadAtlas();
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 }
 uploadAtlas(){const gl=this.gl;const[w,h]=this.assets.data.atlasSize;if(Math.max(w,h)>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw Error('This LaTeX atlas exceeds the device texture limit');gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,this.assets.pixels);}
 async layout(source){
  if(!/\$|\\[([]/.test(source)&&/\\[A-Za-z]+|[\^_=]/.test(source))source=`$$${source}$$`;
  const width=Math.max(1,this.canvas.getBoundingClientRect().width);const cssHeight=width<500?340:360;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(cssHeight*dpr);
  let box=typesetText(source,this.assets.data.maps,{width:width<500?108:190,font:'mathrm'});
  if(!box.complete||box.items.some(item=>!['glyph','rule'].includes(item.kind)))throw Error(box.diagnostics.join('; ')||'Unsupported LaTeX content');
  if(box.items.some(item=>item.kind==='glyph'&&!this.assets.data.tiles[item.key])){this.assets=await loadFullAssets();this.uploadAtlas();}
  const lines=new Map();for(const item of box.items){const p=item.kind==='glyph'?this.assets.data.tiles[item.key].plane:[0,0,item.width,item.height];const lo=item.x+p[0]*(item.sx??1),hi=item.x+p[2]*(item.sx??1);const key=item.flowLine??0;const b=lines.get(key)??[Infinity,-Infinity];b[0]=Math.min(b[0],lo);b[1]=Math.max(b[1],hi);lines.set(key,b);}
  const maxWidth=Math.max(1,...[...lines.values()].map(b=>b[1]-b[0]));const scale=Math.min((this.canvas.width-52*dpr)/maxWidth,(this.canvas.height-80*dpr)/(box.height+box.depth));const origin=[this.canvas.width/2,(this.canvas.height-(box.height+box.depth)*scale)/2+box.height*scale];
  const ordered=[...lines.keys()].sort((a,b)=>a-b);const lineInfo=new Map();let offset=0;
  for(const [index,key] of ordered.entries()){const bounds=lines.get(key);lineInfo.set(key,{index,offset,left:origin[0]-(bounds[1]-bounds[0])*scale/2});offset+=(bounds[1]-bounds[0])/maxWidth;}
  this.pathLength=offset;this.lineCount=ordered.length;const unitsPerPixel=1/(maxWidth*scale);
  const values=[];box.items.forEach(item=>{const line=lineInfo.get(item.flowLine??0);const bounds=lines.get(item.flowLine??0);const moved={...item,color:[1,1,1,1],x:origin[0]+(item.x-(bounds[0]+bounds[1])/2)*scale,y:origin[1]+item.y*scale,sx:(item.sx??1)*scale,sy:(item.sy??1)*scale};if(item.kind==='rule'){moved.width=item.width*scale;moved.height=item.height*scale;}const packed=packLatexItem(moved,this.assets.data,{pixelAlign:false,ink:[1,1,1,1]});const start=line.offset+(packed[0]-line.left)*unitsPerPixel;values.push(...packed,start,line.index,unitsPerPixel,start+packed[2]*.5*unitsPerPixel);});
  this.instances=new Float32Array(values);this.count=box.items.length;const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);this.source=source;this.layoutBox=box;
 }
 timing(k,v){const width=Math.PI/(2*k);const travel=this.pathLength+Math.max(1,this.lineCount)*width;return{width,travel,total:v>0?travel/v:Infinity};}
 draw(progress,k,v,grow=true,amount=0){const gl=this.gl;const timing=this.timing(k,v);
  if(this.lastAmount!==amount){let lo=0,hi=16;for(let i=0;i<32;i++){const s=(lo+hi)/2;if(4*s*s*s/(27*(s+1)*(s+1))<amount)lo=s;else hi=s;}this.back=amount>0?(lo+hi)/2:0;this.lastAmount=amount;}
  gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(.025,.035,.055,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.locations.atlas,0);gl.uniform2f(this.locations.viewport,this.canvas.width,this.canvas.height);gl.uniform2f(this.locations.atlasSize,...this.assets.data.atlasSize);gl.uniform1f(this.locations.front,progress*timing.travel);gl.uniform1f(this.locations.k,k);gl.uniform1f(this.locations.grow,grow?1:0);gl.uniform1f(this.locations.overshoot,this.back);gl.drawArraysInstanced(gl.TRIANGLES,0,6,this.count);return timing;}
 destroy(){if(this.dead)return;this.dead=true;const gl=this.gl;gl.deleteTexture(this.texture);gl.deleteBuffer(this.buffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);}
}
