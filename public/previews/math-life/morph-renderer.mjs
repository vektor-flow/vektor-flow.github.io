const kernel=await fetch(new URL('./merge-kernel.glsl?v=210e239e9031',import.meta.url)).then(r=>{if(!r.ok)throw Error('Morphing kernel unavailable');return r.text()});
const vertex=`#version 300 es
precision highp float;uniform vec2 viewport;uniform vec2 center;uniform float dpr;uniform float radius;out vec2 point;
void main(){vec2 corners[6]=vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));point=corners[gl_VertexID]*(radius+24.0);vec2 p=(center+point)*dpr;gl_Position=vec4(2.0*p.x/viewport.x-1.0,1.0-2.0*p.y/viewport.y,0,1);}`;
const fragment=`#version 300 es
precision highp float;precision highp int;
uniform sampler2D atlas;uniform sampler2D packets;uniform vec2 atlasSize;uniform float phase;uniform float dpr;uniform vec4 sourceA;uniform vec4 sourceB;uniform float targetRadius;uniform ivec3 counts;uniform vec3 tint;
in vec2 point;out vec4 outputColor;
${kernel}
float glyphField(vec2 p,int index){int base=index*4;vec4 rect=texelFetch(packets,ivec2(base,0),0),uv=texelFetch(packets,ivec2(base+1,0),0),info=texelFetch(packets,ivec2(base+3,0),0);vec2 local=(p-rect.xy)/rect.zw;
 if(info.x>.5){vec2 q=abs(p-(rect.xy+rect.zw*.5))-info.yz*.5;return -length(max(q,0.0))-min(max(q.x,q.y),0.0);}
 vec4 c=texture(atlas,mix(uv.xy,uv.zw,clamp(local,0.0,1.0)));float m=max(min(c.r,c.g),min(max(c.r,c.g),c.b));vec2 outside=max(max(-local,local-1.0),vec2(0));float unit=min(rect.z/((uv.z-uv.x)*atlasSize.x),rect.w/((uv.w-uv.y)*atlasSize.y));return(m-.5)*8.0*unit-length(outside*rect.zw);
}
float labelField(vec2 p,int start,int count){float field=-10000.0;for(int i=0;i<64;i++){if(i>=count)break;field=max(field,glyphField(p,start+i));}return count==0?-2.0:field;}
void main(){
 vec2 a=sourceA.xy*(1.0-phase),b=sourceB.xy*(1.0-phase);
 float left=sourceA.z-length(point-a),right=sourceB.z-length(point-b),target=targetRadius-length(point);if(targetRadius<=0.0)target-=1.0;
 float body=mergeField(phase,left,right,target,min(sourceA.z,sourceB.z)*.55);
 float aa=max(fwidth(body),.65/dpr),fill=clamp(body/aa+.5,0.0,1.0),rim=exp(-abs(body)*1.0);float glow=exp(-abs(body)/13.0)*.12;
 vec3 surface=vec3(.045,.075,.10)+tint*.15;float alpha=clamp(fill+rim*.24+glow,0.0,1.0);vec3 color=surface*fill+tint*(rim*.34+glow);
 // Transport the native stroke fields into common coordinates before changing shape.
 float transport=1.0-smoothstep(0.0,.55,phase),shape=smoothstep(.2,1.0,phase);
 // Absorb the operation geometrically while the expression changes its strokes.
 // This avoids laying two full-size labels over each other at the merge center.
 float absorb=max(.001,1.0-smoothstep(.02,.68,phase));bool absorbA=sourceA.w>.5&&sourceB.w<.5;
 float sizeA=absorbA?absorb:1.0,sizeB=absorbA?1.0:absorb;
 float oldA=labelField((point-sourceA.xy*transport)/sizeA,0,counts.x)*sizeA,oldB=labelField((point-sourceB.xy*transport)/sizeB,counts.x,counts.y)*sizeB,result=labelField(point,counts.x+counts.y,counts.z);
 float ink=mergeField(shape,oldA,oldB,result,2.0);float coverage=clamp(ink/max(fwidth(ink),.7/dpr)+.5,0.0,1.0)*fill;
 color=mix(color,vec3(1),coverage);alpha=max(alpha,coverage);if(vkf_failed)discard;outputColor=vec4(color,alpha);
}`;
function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
export class MergeRenderer{
 constructor(gl,assets,label){this.gl=gl;this.assets=assets;this.label=label;this.program=gl.createProgram();gl.attachShader(this.program,compile(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));this.vao=gl.createVertexArray();this.locations=Object.fromEntries(['viewport','center','dpr','radius','atlas','packets','atlasSize','phase','sourceA','sourceB','targetRadius','counts','tint'].map(k=>[k,gl.getUniformLocation(this.program,k)]));}
 prepare(o){const m=o.morph,all=[],counts=[];for(const item of[m.a,m.b,m.result]){if(!item){counts.push(0);continue;}const l=this.label(item),scale=Math.min(32/l.height,item.r*1.4/l.width);counts.push(l.packets.length);for(const p of l.packets){const a=p.slice();a[0]=(p[0]-l.left-l.width/2)*scale;a[1]=(p[1]-l.top-l.height/2)*scale;a[2]*=scale;a[3]*=scale;if(a[12]===1){a[13]*=scale;a[14]*=scale;}all.push(...a);}}
 if(all.length/16>64)throw Error('Merge exceeds native glyph packet bound');const gl=this.gl,texture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,all.length/4,1,0,gl.RGBA,gl.FLOAT,new Float32Array(all));m.gpu={texture,counts};gl.activeTexture(gl.TEXTURE0);}
 draw(o,dpr,width,height){if(!o.morph.gpu)this.prepare(o);const gl=this.gl,m=o.morph,L=this.locations;gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.uniform2f(L.viewport,width,height);gl.uniform2f(L.center,o.x,o.y);gl.uniform1f(L.dpr,dpr);gl.uniform1f(L.radius,o.r);gl.uniform1f(L.phase,m.phase);gl.uniform4f(L.sourceA,m.a.x-m.origin.x,m.a.y-m.origin.y,m.a.r,m.a.kind==='operation'?1:0);gl.uniform4f(L.sourceB,m.b.x-m.origin.x,m.b.y-m.origin.y,m.b.r,m.b.kind==='operation'?1:0);gl.uniform1f(L.targetRadius,m.result?.r??0);gl.uniform3iv(L.counts,m.gpu.counts);gl.uniform3f(L.tint,...(o.seed?[.52,.96,.73]:o.kind==='number'?[.29,.78,.86]:[.68,.56,1]));gl.uniform2f(L.atlasSize,...this.assets.data.atlasSize);gl.uniform1i(L.atlas,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,m.gpu.texture);gl.uniform1i(L.packets,1);gl.drawArrays(gl.TRIANGLES,0,6);gl.activeTexture(gl.TEXTURE0);}
 release(o){if(o.morph?.gpu){this.gl.deleteTexture(o.morph.gpu.texture);o.morph.gpu=null;}}
}
