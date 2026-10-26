// WebGL2 backend of the shared LaTeX renderer. Same native16 ABI and material
// equations as draw.wgsl; no unfolding, growth or game-specific color shader.
const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec4 rect;layout(location=1) in vec4 uvRect;layout(location=2) in vec4 ink;layout(location=3) in vec4 info;
uniform vec2 viewport;out vec2 uv;out vec4 color;flat out vec4 material;out vec2 local;
void main(){vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));vec2 c=corners[gl_VertexID],p=rect.xy+c*rect.zw;gl_Position=vec4(2.0*p.x/viewport.x-1.0,1.0-2.0*p.y/viewport.y,0,1);uv=mix(uvRect.xy,uvRect.zw,c);color=ink;material=info;local=c*rect.zw;}`;
const fragment=`#version 300 es
precision highp float;uniform sampler2D atlas;uniform vec2 atlasSize;
in vec2 uv;in vec4 color;flat in vec4 material;in vec2 local;out vec4 outputColor;
void main(){float range=max(.5*dot(vec2(8.0)/atlasSize,1.0/max(fwidth(uv),vec2(1e-8))),1.0);vec2 pixelSize=max(fwidth(local),vec2(1e-8));vec4 sampled=texture(atlas,uv);
if(material.x>2.5){float alpha=sampled.a*color.a;outputColor=vec4(color.rgb*alpha,alpha);return;}
if(material.x>1.5){float alpha=sampled.a*color.a;outputColor=vec4(sampled.rgb*color.rgb*alpha,alpha);return;}
vec3 v=sampled.rgb;float m=max(min(v.r,v.g),min(max(v.r,v.g),v.b));float coverage=clamp((m-.5)*range+.5,0.0,1.0);
if(material.x>.5){vec2 halfSize=material.yz*.5,p=local-(halfSize+1.0);vec2 lo=max(p-pixelSize*.5,-halfSize),hi=min(p+pixelSize*.5,halfSize);vec2 area=clamp((hi-lo)/pixelSize,vec2(0),vec2(1));coverage=area.x*area.y;}
float alpha=coverage*color.a;outputColor=vec4(color.rgb*alpha,alpha);}`;
function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;}
export function createWebGLLatexRenderer(canvas,{gl,assets,texture,composite=false}){
 if(!gl||gl.canvas!==canvas||!assets)throw Error('Shared LaTeX WebGL context and assets required');
 const program=gl.createProgram(),shaders=[compile(gl,gl.VERTEX_SHADER,vertex),compile(gl,gl.FRAGMENT_SHADER,fragment)];for(const s of shaders)gl.attachShader(program,s);gl.linkProgram(program);for(const s of shaders)gl.deleteShader(s);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const vao=gl.createVertexArray(),locations=Object.fromEntries(['viewport','atlas','atlasSize'].map(k=>[k,gl.getUniformLocation(program,k)]));let buffer=null,count=0,width=0,height=0,dead=false;
 function alive(){if(dead)throw Error('LaTeX renderer disposed');}
 function draw(){alive();if(!width||!height)throw Error('Resize the LaTeX renderer before drawing');gl.viewport(0,0,width,height);if(!composite){gl.clearColor(9/255,17/255,22/255,1);gl.clear(gl.COLOR_BUFFER_BIT);}if(!buffer||!count)return;gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(program);gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(let i=0;i<4;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,64,i*16);gl.vertexAttribDivisor(i,1);}gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(locations.atlas,0);gl.uniform2f(locations.atlasSize,...assets.data.atlasSize);gl.uniform2f(locations.viewport,width,height);gl.drawArraysInstanced(gl.TRIANGLES,0,6,count);}
 return{backend:'webgl2',shaderIdentity:'draw.wgsl WebGL2 material adapter',instanceStride:64,resize(w,h=w){alive();if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)throw Error('Invalid LaTeX viewport');width=w;height=h;if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;},draw,clear(){alive();buffer=null;count=0;},setResidentInstances(next,n){alive();if(!next||!Number.isInteger(n)||n<0)throw Error('Invalid resident LaTeX instances');buffer=next;count=n;draw();},destroy(){if(dead)return;dead=true;gl.deleteVertexArray(vao);gl.deleteProgram(program);}};
}
