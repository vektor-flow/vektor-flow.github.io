// WebGL2 / GLSL ES 3.00: exact uint arithmetic, no f64 extension or float EFT.
// 16 little-endian radix-65536 limbs = 256 exact magnitude bits. Every lost
// bit, alignment overflow, exhausted proof/stack/node budget propagates false.
export const RESIDUAL_GLSL=`
uniform highp usampler2D exactControls;
uniform highp usampler2D exactInstances;
uniform int exactControlStride;
uniform int exactInstanceStride;
uniform uvec2 camera64[6];
bool exactOK;
const int NL=16;
uniform int exactLimbCount; // Host binds 16; runtime loop bounds prevent driver static expansion.
struct Dyad {uint v[16]; int e; int s;};
Dyad zeroD(){Dyad r;for(int i=0;i<exactLimbCount;i++)r.v[i]=0u;r.e=0;r.s=0;return r;}
int lengthD(Dyad a){for(int i=exactLimbCount-1;i>=0;i--){uint w=a.v[i];if(w!=0u){int n=0;for(int k=0;k<exactLimbCount;k++){if(w==0u)break;n++;w>>=1;}return i*16+n;}}return 0;}
Dyad rightD(Dyad a,int n){Dyad r=zeroD();r.s=a.s;r.e=a.e;int q=n/16,b=n%16;
 for(int i=0;i<exactLimbCount;i++){int j=i+q;if(j<exactLimbCount){r.v[i]=a.v[j]>>uint(b);if(b>0&&j+1<NL)r.v[i]|=(a.v[j+1]<<uint(16-b))&65535u;}}return r;}
Dyad leftD(Dyad a,int n){Dyad r=zeroD();r.s=a.s;r.e=a.e;if(n<0||lengthD(a)+n>256){exactOK=false;return r;}int q=n/16,b=n%16;
 for(int i=0;i<exactLimbCount;i++){int j=i-q;if(j>=0){r.v[i]=(a.v[j]<<uint(b))&65535u;if(b>0&&j>0)r.v[i]|=a.v[j-1]>>uint(16-b);}}return r;}
Dyad normalizeD(Dyad a){int first=-1;for(int i=0;i<exactLimbCount;i++)if(a.v[i]!=0u){first=i;break;}if(first<0)return zeroD();
 int bits=0;uint w=a.v[first];for(int k=0;k<exactLimbCount;k++){if((w&1u)!=0u)break;w>>=1;bits++;}
 int n=first*16+bits;a=rightD(a,n);a.e+=n;return a;}
Dyad uintD(uint n){Dyad r=zeroD();r.v[0]=n&65535u;r.v[1]=n>>16;r.s=n==0u?0:1;return normalizeD(r);}
Dyad decodeD(uvec2 w){uint e=(w.y>>20)&2047u;if(e==2047u){exactOK=false;return zeroD();}Dyad r=zeroD();r.v[0]=w.x&65535u;r.v[1]=w.x>>16;r.v[2]=w.y&65535u;r.v[3]=((w.y>>16)&15u)|(e>0u?16u:0u);r.e=e>0u?int(e)-1075:-1074;r.s=(w.y&2147483648u)!=0u?-1:1;return normalizeD(r);}
Dyad negD(Dyad a){a.s=-a.s;return a;}
int magCmpD(Dyad a,Dyad b){for(int i=exactLimbCount-1;i>=0;i--){if(a.v[i]<b.v[i])return -1;if(a.v[i]>b.v[i])return 1;}return 0;}
Dyad addD(Dyad a,Dyad b){if(a.s==0)return b;if(b.s==0)return a;int e=min(a.e,b.e);a=leftD(a,a.e-e);b=leftD(b,b.e-e);Dyad r=zeroD();r.e=e;
 if(a.s==b.s){uint carry=0u;for(int i=0;i<exactLimbCount;i++){uint t=a.v[i]+b.v[i]+carry;r.v[i]=t&65535u;carry=t>>16;}if(carry!=0u)exactOK=false;r.s=a.s;}
 else {int c=magCmpD(a,b);if(c==0)return r;Dyad large=a,small=b;if(c<=0){large=b;small=a;}uint borrow=0u;for(int i=0;i<exactLimbCount;i++){uint sub=small.v[i]+borrow;borrow=large.v[i]<sub?1u:0u;r.v[i]=(large.v[i]-sub)&65535u;}r.s=large.s;}
 return normalizeD(r);}
Dyad subD(Dyad a,Dyad b){return addD(a,negD(b));}
int cmpD(Dyad a,Dyad b){return subD(a,b).s;}
Dyad mulD(Dyad a,Dyad b){if(a.s==0||b.s==0)return zeroD();Dyad r=zeroD();r.e=a.e+b.e;r.s=a.s*b.s;
 // A single radix digit product + output digit + carry <= 2^32-1.
 for(int i=0;i<exactLimbCount;i++){uint carry=0u;for(int j=0;j<exactLimbCount;j++){int k=i+j;if(k<NL){uint t=a.v[i]*b.v[j]+r.v[k]+carry;r.v[k]=t&65535u;carry=t>>16;}else if(a.v[i]!=0u&&b.v[j]!=0u)exactOK=false;}if(carry!=0u)exactOK=false;}
 return normalizeD(r);}
bool bitD(Dyad a,int n){return n>=0&&n<256?((a.v[n/16]>>uint(n%16))&1u)!=0u:false;}
Dyad roundD(Dyad a){if(a.s==0)return a;int cut=max(0,max(lengthD(a)-53,-1074-a.e));if(cut>0){bool guard=bitD(a,cut-1),sticky=false;for(int i=0;i<exactLimbCount*16;i++){if(i>=cut-1)break;if(bitD(a,i))sticky=true;}
 Dyad r=rightD(a,cut);r.e=a.e+cut;int signA=a.s;r.s=1;
 if(guard&&(sticky||bitD(r,0))){Dyad one=uintD(1u);one.e=r.e;r=addD(r,one);}r.s=signA;a=normalizeD(r);}
 if(a.s!=0&&lengthD(a)+a.e-1>1023)exactOK=false;return a;}
Dyad add64D(Dyad a,Dyad b){return roundD(addD(a,b));}
Dyad mul64D(Dyad a,Dyad b){return roundD(mulD(a,b));}
Dyad dot64D(Dyad a,Dyad b,Dyad c,Dyad d,Dyad e){return add64D(add64D(mul64D(a,b),mul64D(c,d)),e);}
uvec4 exactInstance(int id,int k){int n=id*8+k;return texelFetch(exactInstances,ivec2(n%exactInstanceStride,n/exactInstanceStride),0);}
Dyad instance64D(int id,int k){uvec4 w=exactInstance(id,k/2);return decodeD((k%2)==0?w.xy:w.zw);}
void matrixD(int id,out Dyad m[6]){Dyad c[6];for(int k=0;k<6;k++)c[k]=decodeD(camera64[k]);uvec4 meta=exactInstance(id,7);
 if(meta.z==1u){Dyad z=instance64D(id,6),ax=instance64D(id,7),ay=instance64D(id,8),ix=instance64D(id,9),iy=instance64D(id,10),sx=instance64D(id,11),sy=instance64D(id,12);Dyad b[6];
  b[0]=mul64D(c[0],z);b[1]=mul64D(c[1],z);b[2]=mul64D(negD(c[2]),z);b[3]=mul64D(negD(c[3]),z);b[4]=dot64D(c[0],ax,c[2],ay,c[4]);b[5]=dot64D(c[1],ax,c[3],ay,c[5]);
  m[0]=mul64D(b[0],sx);m[1]=mul64D(b[1],sx);m[2]=mul64D(b[2],sy);m[3]=mul64D(b[3],sy);m[4]=dot64D(b[0],ix,b[2],iy,b[4]);m[5]=dot64D(b[1],ix,b[3],iy,b[5]);
 }else {if(meta.z!=0u)exactOK=false;Dyad p[6];for(int k=0;k<6;k++)p[k]=instance64D(id,k);
 m[0]=add64D(mul64D(c[0],p[0]),mul64D(c[2],p[1]));m[1]=add64D(mul64D(c[1],p[0]),mul64D(c[3],p[1]));m[2]=add64D(mul64D(c[0],p[2]),mul64D(c[2],p[3]));m[3]=add64D(mul64D(c[1],p[2]),mul64D(c[3],p[3]));m[4]=dot64D(c[0],p[4],c[2],p[5],c[4]);m[5]=dot64D(c[1],p[4],c[3],p[5],c[5]);}
}
struct EPoint {Dyad x;Dyad y;};
EPoint exactPointD(int n,Dyad m[6]){uvec4 w=texelFetch(exactControls,ivec2(n%exactControlStride,n/exactControlStride),0);Dyad x=decodeD(w.xy),y=decodeD(w.zw),ratio=uintD(uint(dpr));
 return EPoint(mulD(addD(addD(mulD(m[0],x),mulD(m[2],y)),m[4]),ratio),mulD(addD(addD(mulD(m[1],x),mulD(m[3],y)),m[5]),ratio));}
Dyad halfD(Dyad a){if(a.s!=0)a.e--;return a;}
EPoint midD(EPoint a,EPoint b){return EPoint(halfD(addD(a.x,b.x)),halfD(addD(a.y,b.y)));}
struct ExactNode {EPoint a;EPoint b;EPoint c;EPoint d;int depth;};
int exactWindingD(vec2 sampleAt,out bool unknown){exactOK=true;Dyad m[6];matrixD(instanceId,m);
 // AA16 centers are exact multiples of1/8; viewport <=65536, so f32 is
 // sufficient ONLY for constructing this lattice index, never for geometry.
 Dyad x=uintD(uint(sampleAt.x*8.)),y=uintD(uint(sampleAt.y*8.));if(x.s!=0)x.e-=3;if(y.s!=0)y.e-=3;
 vec4 meta=instanceTexel(instanceId,5);int winding=0,nodes=0;uint pathStack[25];int depthStack[25];
 for(int segment=0;segment<4096;segment++){
  if(segment>=int(meta.y)||!exactOK)break;int offset=int(meta.x)+segment*4;
  // A full interval hull certificate can eliminate this segment before
  // any binary64 control decode/transform or exact cubic subdivision.
  vec4 m0=instanceTexel(instanceId,0),m1=instanceTexel(instanceId,1),m2=instanceTexel(instanceId,2);
  vec2 magnitude=instanceTexel(instanceId,6).xy;
  vec4 ia=sampleControl(offset,m0,m1,m2,magnitude),ib=sampleControl(offset+1,m0,m1,m2,magnitude),ic=sampleControl(offset+2,m0,m1,m2,magnitude),id=sampleControl(offset+3,m0,m1,m2,magnitude);
  float yh=max(max(ia.w,ib.w),max(ic.w,id.w)),yl=min(min(ia.z,ib.z),min(ic.z,id.z));
  float xh=max(max(ia.y,ib.y),max(ic.y,id.y)),xl=min(min(ia.x,ib.x),min(ic.x,id.x));
  bool skip=yh<=sampleAt.y||yl>sampleAt.y||xh<=sampleAt.x;
  int sa=side(ia,sampleAt.y),sd=side(id,sampleAt.y);
  bool right=xl>sampleAt.x&&sa>=0&&sd>=0;
  if(skip||right){nodes++;if(nodes>nodeLimit){exactOK=false;break;}if(!skip)winding+=sa-sd;continue;}
  EPoint a=exactPointD(offset,m),b=exactPointD(offset+1,m),c=exactPointD(offset+2,m),d=exactPointD(offset+3,m);
  // L/Z are stored with duplicated endpoints. A genuine cubic with these
  // controls has the same oriented line image (monotone 3t²-2t³), too.
  bool line=cmpD(a.x,b.x)==0&&cmpD(a.y,b.y)==0&&cmpD(c.x,d.x)==0&&cmpD(c.y,d.y)==0;
  if(line){nodes++;if(nodes>nodeLimit){exactOK=false;break;}int dir=(cmpD(a.y,y)<=0?1:0)-(cmpD(d.y,y)<=0?1:0);
   if(dir!=0){Dyad dy=subD(d.y,a.y),det=addD(mulD(subD(a.x,x),dy),mulD(subD(d.x,a.x),subD(y,a.y)));if(det.s!=0&&det.s==dy.s)winding+=dir;}continue;}
  pathStack[0]=0u;depthStack[0]=0;int count=1;
  while(count>0&&exactOK){count--;uint path=pathStack[count];int depth=depthStack[count];ExactNode p=ExactNode(a,b,c,d,depth);
   // Compact DFS state. Reconstruct the same exact de Casteljau node from
   // the original controls and its <=24-bit route instead of retaining25
   // complete 256-bit hulls in fragment-local storage.
   for(int level=0;level<depth;level++){
    EPoint ab=midD(p.a,p.b),bc=midD(p.b,p.c),cd=midD(p.c,p.d),abc=midD(ab,bc),bcd=midD(bc,cd),q=midD(abc,bcd);
    if((path&(1u<<uint(depth-level-1)))!=0u)p=ExactNode(q,bcd,cd,p.d,depth);else p=ExactNode(p.a,ab,abc,q,depth);
   }
   if(!exactOK)break;nodes++;if(nodes>nodeLimit){exactOK=false;break;}
   int xa=cmpD(p.a.x,x),xb=cmpD(p.b.x,x),xc=cmpD(p.c.x,x),xd=cmpD(p.d.x,x),ya=cmpD(p.a.y,y),yb=cmpD(p.b.y,y),yc=cmpD(p.c.y,y),yd=cmpD(p.d.y,y);
   if(max(max(ya,yb),max(yc,yd))<=0||min(min(ya,yb),min(yc,yd))>0||max(max(xa,xb),max(xc,xd))<=0)continue;
   if(min(min(xa,xb),min(xc,xd))>0){winding+=(ya<=0?1:0)-(yd<=0?1:0);continue;}
   if(p.depth>=depthLimit||count+2>25){exactOK=false;break;}
   pathStack[count]=(path<<1)|1u;depthStack[count]=depth+1;count++;pathStack[count]=path<<1;depthStack[count]=depth+1;count++;
  }
 }
 unknown=!exactOK;return winding;
}
`;
