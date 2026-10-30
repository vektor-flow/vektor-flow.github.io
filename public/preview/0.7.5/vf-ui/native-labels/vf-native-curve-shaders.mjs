import {RESIDUAL_GLSL} from './vf-native-residual-shader.mjs';
// No implicit-distance AA approximation. All samples use the retained
// centered AA16 lattice. A hull decision is accepted only if its full numeric
// interval establishes a signed ray contribution. Exhaustion sets an MRT flag.
export const CURVE_INTERVAL_GLSL=`
precision highp float;
precision highp int;
uniform highp sampler2D instanceData;
uniform int instanceStride;
uniform vec2 cameraPairs[6];
uniform float dpr;
uniform vec2 deviceViewport;
vec4 instanceTexel(int id,int k){int n=id*7+k;return texelFetch(instanceData,ivec2(n%instanceStride,n/instanceStride),0);}
vec2 wide(vec2 v){float e=max(max(abs(v.x),abs(v.y))*0.00000095367431640625,7.888609052210118e-31);return vec2(v.x-e,v.y+e);}
vec2 plusI(vec2 a,vec2 b){return wide(vec2(a.x+b.x,a.y+b.y));}
vec2 timesI(vec2 a,vec2 b){vec4 q=vec4(a.x*b.x,a.x*b.y,a.y*b.x,a.y*b.y);return wide(vec2(min(min(q.x,q.y),min(q.z,q.w)),max(max(q.x,q.y),max(q.z,q.w))));}
vec2 absI(vec2 a){return vec2(a.x<=0.&&a.y>=0.?0.:min(abs(a.x),abs(a.y)),max(abs(a.x),abs(a.y)));}
vec4 posePoint(vec4 p,vec4 m0,vec4 m1,vec4 m2){return vec4(plusI(plusI(timesI(m0.xy,p.xy),timesI(m1.xy,p.zw)),m2.xy),plusI(plusI(timesI(m0.zw,p.xy),timesI(m1.zw,p.zw)),m2.zw));}
vec4 devicePoint(vec4 p,vec4 m0,vec4 m1,vec4 m2){
 vec4 w=posePoint(p,m0,m1,m2);
 vec2 x=plusI(plusI(timesI(cameraPairs[0],w.xy),timesI(cameraPairs[2],w.zw)),cameraPairs[4]);
 vec2 y=plusI(plusI(timesI(cameraPairs[1],w.xy),timesI(cameraPairs[3],w.zw)),cameraPairs[5]);
 return vec4(timesI(x,vec2(dpr)),timesI(y,vec2(dpr)));
}
vec4 sourceDevicePoint(vec4 p,vec4 m0,vec4 m1,vec4 m2,vec2 magnitude){
 vec4 t=devicePoint(p,m0,m1,m2);
 // 2^-46 > 2*gamma32(binary64), padded by interval operations. Includes the
 // original CPU camera-first source composition AND identity-pose order.
 vec2 ex=timesI(plusI(plusI(timesI(absI(cameraPairs[0]),vec2(magnitude.x)),timesI(absI(cameraPairs[2]),vec2(magnitude.y))),absI(cameraPairs[4])),vec2(1.4210854715202004e-14*dpr));
 vec2 ey=timesI(plusI(plusI(timesI(absI(cameraPairs[1]),vec2(magnitude.x)),timesI(absI(cameraPairs[3]),vec2(magnitude.y))),absI(cameraPairs[5])),vec2(1.4210854715202004e-14*dpr));
 return vec4(plusI(t.xy,vec2(-ex.y,ex.y)),plusI(t.zw,vec2(-ey.y,ey.y)));
}
vec4 middleI(vec4 a,vec4 b){return vec4(timesI(plusI(a.xy,b.xy),vec2(.5)),timesI(plusI(a.zw,b.zw),vec2(.5)));}
`;

export const CURVE_VERTEX_GLSL=`#version 300 es
${CURVE_INTERVAL_GLSL}
flat out int instanceId;
void main(){
 instanceId=gl_InstanceID;
 vec4 m0=instanceTexel(instanceId,0),m1=instanceTexel(instanceId,1),m2=instanceTexel(instanceId,2),b=instanceTexel(instanceId,4);vec2 magnitude=instanceTexel(instanceId,6).xy;
 vec4 a=sourceDevicePoint(vec4(b.x,b.x,b.y,b.y),m0,m1,m2,magnitude),c=sourceDevicePoint(vec4(b.z,b.z,b.y,b.y),m0,m1,m2,magnitude);
 vec4 e=sourceDevicePoint(vec4(b.x,b.x,b.w,b.w),m0,m1,m2,magnitude),f=sourceDevicePoint(vec4(b.z,b.z,b.w,b.w),m0,m1,m2,magnitude);
 vec2 low=vec2(min(min(a.x,c.x),min(e.x,f.x)),min(min(a.z,c.z),min(e.z,f.z)));
 vec2 high=vec2(max(max(a.y,c.y),max(e.y,f.y)),max(max(a.w,c.w),max(e.w,f.w)));
 // Interval hull already encloses geometry. Clamp BEFORE clip arithmetic;
 // an additional two device pixels exceed its precision/raster envelope for
 // the admitted <=65536 viewport. No inverse/singular-camera assumptions.
 low=clamp(low-vec2(2.),vec2(-2.),deviceViewport+vec2(2.));
 high=clamp(high+vec2(2.),vec2(-2.),deviceViewport+vec2(2.));
 vec2 corner=vec2(float((gl_VertexID==1||gl_VertexID==2||gl_VertexID==4)?1:0),float(gl_VertexID>=2&&gl_VertexID<=4?1:0));
 vec2 p=mix(low,high,corner);gl_Position=vec4(p.x/deviceViewport.x*2.-1.,1.-p.y/deviceViewport.y*2.,0.,1.);
}`;

// This source is shared by both paint programs. The fast program has no
// uint dyadic types, exact arithmetic functions, or exact local node stack.
export const CURVE_SAMPLE_GLSL=`
uniform highp sampler2D controlData;
uniform highp sampler2D deviceControls;
uniform int controlStride;
uniform int deviceControlStride;
uniform bool certificateEnabled;
uniform int depthLimit;
uniform int nodeLimit;
flat in int instanceId;
layout(location=0) out vec4 sampleColor;
layout(location=1) out vec4 uncertainty;
struct Node {vec4 a;vec4 b;vec4 c;vec4 d;int depth;};
vec4 control(int n){return texelFetch(controlData,ivec2(n%controlStride,n/controlStride),0);}
vec4 sampleControl(int n,vec4 m0,vec4 m1,vec4 m2,vec2 magnitude){
 if(certificateEnabled){
  vec4 meta=instanceTexel(instanceId,5);
  int index=int(meta.z)+n-int(meta.x);
  return texelFetch(deviceControls,ivec2(index%deviceControlStride,index/deviceControlStride),0);
 }
 return sourceDevicePoint(control(n),m0,m1,m2,magnitude);
}
int side(vec4 p,float y){if(p.w<=y)return 1;if(p.z>y)return 0;return -1;}
int evaluateWinding(vec2 sampleAt,int maxDepth,int maxNodes,out bool unknown){
 vec4 m0=instanceTexel(instanceId,0),m1=instanceTexel(instanceId,1),m2=instanceTexel(instanceId,2),meta=instanceTexel(instanceId,5);vec2 magnitude=instanceTexel(instanceId,6).xy;
 int winding=0,nodes=0;unknown=false;
 // Both callers cap this interval traversal at depth12: at most13 pending nodes.
 Node stack[13];
 for(int segment=0;segment<4096;segment++){
  if(segment>=int(meta.y)||unknown)break;
  int offset=int(meta.x)+segment*4;
  stack[0]=Node(sampleControl(offset,m0,m1,m2,magnitude),sampleControl(offset+1,m0,m1,m2,magnitude),sampleControl(offset+2,m0,m1,m2,magnitude),sampleControl(offset+3,m0,m1,m2,magnitude),0);
  int count=1;
  while(count>0){
   count--;Node p=stack[count];nodes++;
   if(nodes>maxNodes){unknown=true;break;}
   float yHigh=max(max(p.a.w,p.b.w),max(p.c.w,p.d.w)),yLow=min(min(p.a.z,p.b.z),min(p.c.z,p.d.z));
   float xHigh=max(max(p.a.y,p.b.y),max(p.c.y,p.d.y)),xLow=min(min(p.a.x,p.b.x),min(p.c.x,p.d.x));
   if(yHigh<=sampleAt.y||yLow>sampleAt.y||xHigh<=sampleAt.x)continue;
   if(xLow>sampleAt.x){int a=side(p.a,sampleAt.y),b=side(p.d,sampleAt.y);if(a>=0&&b>=0){winding+=a-b;continue;}}
   if(p.depth>=maxDepth||count+2>13){unknown=true;break;}
   vec4 ab=middleI(p.a,p.b),bc=middleI(p.b,p.c),cd=middleI(p.c,p.d),abc=middleI(ab,bc),bcd=middleI(bc,cd),q=middleI(abc,bcd);
   stack[count]=Node(q,bcd,cd,p.d,p.depth+1);count++;
   stack[count]=Node(p.a,ab,abc,q,p.depth+1);count++;
  }
 }
 return winding;
}
`;

const paintMain=exact=>`
void main(){
 vec2 sampleAt=vec2(gl_FragCoord.x,deviceViewport.y*4.-gl_FragCoord.y)*.25;
 bool unknown=false;
 int winding=evaluateWinding(sampleAt,min(12,depthLimit),min(2048,nodeLimit),unknown);
 bool refined=unknown;
 ${exact?'if(unknown)winding=exactWindingD(sampleAt,unknown);':''}
 vec4 rgba=instanceTexel(instanceId,3);
 sampleColor=(!unknown&&winding!=0)?floor(vec4(rgba.rgb*rgba.a,rgba.a)*255.+.5)/255.:vec4(0.);
 uncertainty=vec4(unknown?1.:0.,refined?1.:0.,0.,0.);
}`;
export const CURVE_FAST_FRAGMENT_GLSL=`#version 300 es
${CURVE_INTERVAL_GLSL}
${CURVE_SAMPLE_GLSL}
${paintMain(false)}`;
export const CURVE_FRAGMENT_GLSL=`#version 300 es
${CURVE_INTERVAL_GLSL}
${CURVE_SAMPLE_GLSL}
${RESIDUAL_GLSL}
${paintMain(true)}`;

// One GPU invocation per instance/control/camera, independent of sample count.
// Binary search uses the persistent prefix in instance metadata. No camera
// change allocates or uploads a new CPU geometry/control/mapping buffer.
export const CURVE_CERTIFICATE_GLSL=`#version 300 es
${CURVE_INTERVAL_GLSL}
uniform highp sampler2D controlData;
uniform int controlStride;
uniform int deviceControlStride;
uniform int deviceControlCount;
uniform int instanceCount;
out vec4 result;
void main(){
 int index=int(gl_FragCoord.y)*deviceControlStride+int(gl_FragCoord.x);
 if(index>=deviceControlCount){result=vec4(0.);return;}
 int low=0,high=instanceCount;
 for(int step=0;step<18;step++){
  if(low+1>=high)break;
  int middle=(low+high)/2;
  if(int(instanceTexel(middle,5).z)<=index)low=middle;else high=middle;
 }
 vec4 meta=instanceTexel(low,5);
 int source=int(meta.x)+index-int(meta.z);
 vec4 p=texelFetch(controlData,ivec2(source%controlStride,source/controlStride),0);
 result=sourceDevicePoint(p,instanceTexel(low,0),instanceTexel(low,1),instanceTexel(low,2),instanceTexel(low,6).xy);
}`;
export const CURVE_STENCIL_GLSL=`#version 300 es
precision highp float;precision highp int;
uniform highp sampler2D residualMask;
out vec4 result;
void main(){
 if(texelFetch(residualMask,ivec2(gl_FragCoord.xy),0).r==0.)discard;
 result=vec4(0.);
}`;
export const CURVE_CLEAR_GLSL=`#version 300 es
precision highp float;
layout(location=0) out vec4 sampleColor;
layout(location=1) out vec4 uncertainty;
void main(){sampleColor=vec4(0.);uncertainty=vec4(0.);}`;

export const FULLSCREEN_VERTEX_GLSL=`#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}`;
export const UNCERTAINTY_REDUCE_GLSL=`#version 300 es
precision highp float;precision highp int;
uniform highp sampler2D flags;out vec4 result;
void main(){ivec2 base=ivec2(gl_FragCoord.xy)*2,sz=textureSize(flags,0);vec2 flag=vec2(0.);for(int y=0;y<2;y++)for(int x=0;x<2;x++){ivec2 p=base+ivec2(x,y);if(all(lessThan(p,sz)))flag=max(flag,texelFetch(flags,p,0).rg);}result=vec4(flag,0.,0.);}`;
export const CURVE_RESOLVE_GLSL=`#version 300 es
precision highp float;precision highp int;
uniform highp sampler2D area;out vec4 result;
void main(){ivec2 base=ivec2(gl_FragCoord.xy)*4;ivec4 sum=ivec4(0);for(int y=0;y<4;y++)for(int x=0;x<4;x++)sum+=ivec4(floor(texelFetch(area,base+ivec2(x,y),0)*255.+.5));result=vec4((sum+ivec4(8))/16)/255.;}`;
