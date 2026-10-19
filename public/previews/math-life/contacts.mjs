import {mass} from './motion.mjs?v=1bec15fd2d5f';
// Indexed broad phase. All contacts resolve before a frame is presented.
export class Contacts {
 constructor(objects,{combine,merge,bounce}){this.objects=objects;this.combine=combine;this.merge=merge;this.bounce=bounce;this.cells=new Map();this.cellSize=96;this.width=1;this.height=1;this.gap=4;}
 resize(width,height){this.width=width;this.height=height;}
 constrain(o){o.x=Math.max(o.r+8,Math.min(this.width-o.r-8,o.x));o.y=Math.max(o.r+8,Math.min(this.height-o.r-30,o.y));}
 index(){this.cells.clear();this.maxRadius=0;for(const o of this.objects.values()){this.maxRadius=Math.max(this.maxRadius,o.r);const key=`${Math.floor(o.x/96)},${Math.floor(o.y/96)}`;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(o);}}
 *near(o){const x=Math.floor(o.x/96),y=Math.floor(o.y/96),range=Math.ceil((o.r+this.maxRadius+this.gap)/96);for(let yy=y-range;yy<=y+range;yy++)for(let xx=x-range;xx<=x+range;xx++)for(const other of this.cells.get(`${xx},${yy}`)??[])if(other.id!==o.id)yield other;}
 separate(a,b){let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-8){const angle=((a.id*137+b.id*71)%360)*Math.PI/180;dx=Math.cos(angle);dy=Math.sin(angle);d=1;}const nx=dx/d,ny=dy/d,penetration=a.r+b.r+this.gap-Math.hypot(b.x-a.x,b.y-a.y);
 if(penetration>0){const shift=penetration*.5+.002;a.x-=nx*shift;a.y-=ny*shift;b.x+=nx*shift;b.y+=ny*shift;this.constrain(a);this.constrain(b);}
 const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative<0){const ma=mass(a),mb=mass(b),impulse=-2*relative/(1/ma+1/mb);a.vx-=impulse/ma*nx;a.vy-=impulse/ma*ny;b.vx+=impulse/mb*nx;b.vy+=impulse/mb*ny;}
 }
 resolve(now){for(const o of this.objects.values())this.constrain(o);let passes=0;
 for(;passes<96;passes++){this.index();let changed=false,merged=false;
 outer:for(const a of this.objects.values())for(const b of this.near(a)){if(b.id<=a.id||!this.objects.has(a.id)||!this.objects.has(b.id))continue;const distance=Math.hypot(a.x-b.x,a.y-b.y),contact=a.r+b.r+this.gap;if(distance>contact+.01)continue;const result=this.combine(a,b);if(result.ok){this.merge(a,b,result,now);changed=merged=true;break outer;}
 if(distance<contact-.001){this.separate(a,b);this.bounce(a,b,result,now);changed=true;}}
 if(!changed)break;
 }
 this.index();return this.overlaps().length===0;
 }
 overlaps(tolerance=.05){const pairs=[];for(const a of this.objects.values())for(const b of this.near(a))if(b.id>a.id&&Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r-tolerance)pairs.push([a.id,b.id]);return pairs;}
 // A pointer cannot tunnel through intervening objects between browser events.
 move(id,x,y,now,velocity){let o=this.objects.get(id);if(!o)return;const steps=Math.max(1,Math.ceil(Math.hypot(x-o.x,y-o.y)/Math.max(4,o.r*.2))),dx=(x-o.x)/steps,dy=(y-o.y)/steps;for(let i=0;i<steps;i++){o=this.objects.get(id);if(!o)break;o.x+=dx;o.y+=dy;o.vx=velocity?.vx??dx*24;o.vy=velocity?.vy??dy*24;this.resolve(now);} }
}
