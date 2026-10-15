// Endpoint geometry only. Correspondence, deformation and animation remain GPU work.
export const palette=[[.43,.82,.96,1],[.99,.64,.39,1],[.70,.58,.96,1],[.43,.90,.62,1]];
export function geometry(g,shape){
 if(!g)return;const point=(x,y,c=0,r=5)=>shape(x-r,y-r,r*2,r*2,palette[c%4],3);
 const axes=()=>{shape(100,535,1000,2,[.3,.38,.43,1]);shape(600,300,2,440,[.3,.38,.43,1]);};
 if(g.kind==='grid'){const n=17,angle=g.angle??0;for(let j=0;j<n;j++)for(let i=0;i<n;i++){let x=(i-8)*24,y=(j-8)*24;const xx=x+(g.shear??0)*y,yy=y*(g.scale??1);point(600+xx*Math.cos(angle)-yy*Math.sin(angle),530+xx*Math.sin(angle)+yy*Math.cos(angle),(i+j)%4,4);}}
 if(g.kind==='conic'){axes();for(let i=0;i<240;i++){const t=2*Math.PI*i/240;let x,y;if(g.form==='hyperbola'){const u=-1.3+2.6*(i%120)/119;x=(i<120?1:-1)*110*Math.cosh(u);y=110*Math.sinh(u);}else{x=270*Math.cos(t);y=(g.form==='circle'?210:110)*Math.sin(t);}point(600+x,530+y,Math.floor(i/60),4);}}
 if(g.kind==='wave'){axes();for(let i=0;i<320;i++){const t=i/319*4*Math.PI;const y=g.mode===0?Math.sin(t):g.mode===1?Math.sin(t)+Math.sin(3*t)/3:Math.sin(t)+Math.sin(3*t)/3+Math.sin(5*t)/5;point(110+980*i/319,535-135*y,Math.floor(i/80),4);}}
 if(g.kind==='polar'){for(let i=0;i<360;i++){const t=2*Math.PI*i/359;const r=g.mode===0?195:g.mode===1?210*Math.cos(3*t):35+30*t;point(600+1.5*r*Math.cos(t),535+r*Math.sin(t),Math.floor(i/90),4);}}
 if(g.kind==='integral'){axes();const n=g.n;for(let i=0;i<n;i++){const x=(i+.5)/n,h=x*x*300;shape(160+i*800/n,700-h,800/n-2,Math.max(h,2),palette[i%3],1);}for(let i=0;i<160;i++){const x=i/159;point(160+x*800,700-300*x*x,3,4);}}
 if(g.kind==='mesh'){const n=g.n;for(let j=0;j<=n;j++)for(let i=0;i<=n-j;i++){let x=210+i*570/n+j*285/n,y=685-j*310/n;const angle=g.angle??0;const dx=x-545,dy=y-540;x=600+dx*Math.cos(angle)-dy*Math.sin(angle);y=530+dx*Math.sin(angle)+dy*Math.cos(angle);point(x,y,(i+j)%3,5);}}
 if(g.kind==='sphere'){const a=g.angle;for(let j=1;j<12;j++)for(let i=0;i<32;i++){const lat=Math.PI*j/12,lon=2*Math.PI*i/32;let x=190*Math.sin(lat)*Math.cos(lon),y=190*Math.cos(lat),z=190*Math.sin(lat)*Math.sin(lon);if(g.flat)z=0;const xx=x*Math.cos(a)+z*Math.sin(a),zz=-x*Math.sin(a)+z*Math.cos(a);const perspective=1/(1+zz/1000);point(600+xx*perspective,535+y*perspective,i%4,3.5+1.3*(zz+190)/380);}}
 if(g.kind==='distribution'){axes();for(let i=0;i<g.n;i++){const x=-3+6*i/(g.n-1),y=Math.exp(-.5*((x-g.mean)/g.sigma)**2)/g.sigma;shape(120+960*i/g.n,700-y*180,Math.max(2,960/g.n-1),y*180,palette[i%3],1);}}
 if(g.kind==='vector'){for(let j=0;j<10;j++)for(let i=0;i<10;i++){const x=i-4.5,y=j-4.5;let vx=g.mode===0?-y:g.mode===1?x:x-y,vy=g.mode===0?x:g.mode===1?y:x+y;const norm=Math.max(1,Math.hypot(vx,vy));vx/=norm;vy/=norm;for(let k=0;k<4;k++)point(180+i*90+vx*k*7,350+j*36+vy*k*7,(i+j)%4,k===3?4.5:2.5);}}
 if(g.kind==='packing'){const n=g.n;for(let i=0;i<n;i++){const theta=i*2.3999632297,r=10*Math.sqrt(i);point(600+1.5*r*Math.cos(theta+g.angle),535+r*Math.sin(theta+g.angle),i%4,5);}}
}
