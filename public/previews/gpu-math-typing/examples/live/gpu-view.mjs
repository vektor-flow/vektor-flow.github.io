// Presentation only. Native VKF supplies coverage; this shader does no morphing.
export function createGPUView(canvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('This player requires WebGL 2.');
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const vertex=shader(gl.VERTEX_SHADER,`#version 300 es
 const vec2 p[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3));out vec2 uv;void main(){gl_Position=vec4(p[gl_VertexID],0,1);uv=p[gl_VertexID]*.5+.5;}`);
 const fragment=shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;uniform sampler2D coverage;in vec2 uv;out vec4 color;
 float at(ivec2 p,ivec2 size){return texelFetch(coverage,clamp(p,ivec2(0),size-1),0).r;}
 void main(){ivec2 size=textureSize(coverage,0);vec2 pos=vec2(uv.x,1.-uv.y)*vec2(size)-.5;ivec2 i=ivec2(floor(pos));vec2 f=fract(pos);
 float a=mix(mix(at(i,size),at(i+ivec2(1,0),size),f.x),mix(at(i+ivec2(0,1),size),at(i+ivec2(1,1),size),f.x),f.y);
 color=vec4(mix(vec3(9.,17.,22.),vec3(67.,211.,224.),clamp(a,0.,1.))/255.,1.);}`);
 const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 return {draw(frame,resolution){if(gl.isContextLost())throw Error('GPU context lost. Reload the player.');gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.R32F,resolution,resolution,0,gl.RED,gl.FLOAT,Float32Array.from(frame.coverage));gl.drawArrays(gl.TRIANGLES,0,3);gl.flush();},destroy(){gl.deleteTexture(texture);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);},backend:'WebGL2'};
}
