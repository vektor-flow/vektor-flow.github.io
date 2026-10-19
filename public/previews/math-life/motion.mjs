import {stepPhysics} from './physics.mjs?v=5f431486cfe3';
// Visual area determines collision mass; expression magnitude determines size.
export const mass=o=>o.r*o.r;
export function expressionRadius(item,base,seed=false){const magnitude=Math.hypot(item.value,item.imag??0),growth=item.kind==='number'?1+Math.min(.45,.09*Math.log2(1+magnitude)):1;return base*growth*(seed?1.25:1);}
export function mergedVelocity(a,b){const ma=mass(a),mb=mass(b);return{vx:(a.vx*ma+b.vx*mb)/(ma+mb),vy:(a.vy*ma+b.vy*mb)/(ma+mb)};}
export function advance(o,dt,width,height){stepPhysics(new Map([[o.id??0,o]]),width,height,dt,{gap:0});}

// Fixed-size chronological ring; velocity is measured in CSS pixels / second.
// Include the stationary interval before release so holding an object stops it.
export class DragVelocity {
 constructor(x,y,time){this.samples=new Float64Array(32*3);this.start=0;this.length=0;this.sample(x,y,time);}
 sample(x,y,time){if(this.length){const last=((this.start+this.length-1)%32)*3;if(time<=this.samples[last+2]){this.samples[last]=x;this.samples[last+1]=y;return;}}const index=((this.start+this.length)%32)*3;this.samples.set([x,y,time],index);if(this.length<32)this.length++;else this.start=(this.start+1)%32;}
 velocity(time){const data=this.samples,last=((this.start+this.length-1)%32)*3,cutoff=time-100;let first=this.start*3,x=data[first],y=data[first+1],t=data[first+2];for(let i=1;i<this.length;i++){const next=((this.start+i)%32)*3;if(data[next+2]>cutoff){if(t<cutoff){const q=(cutoff-t)/(data[next+2]-t);x+=(data[next]-x)*q;y+=(data[next+1]-y)*q;t=cutoff;}break;}first=next;x=data[first];y=data[first+1];t=data[first+2];}if(t<cutoff)t=cutoff;const dt=(time-t)/1000;if(dt<=0)return{vx:0,vy:0};let vx=(data[last]-x)/dt,vy=(data[last+1]-y)/dt;const scale=Math.min(1,1600/Math.max(1,Math.hypot(vx,vy)));return{vx:vx*scale,vy:vy*scale};}
}
// Bound travel per contact step even for fast throws, so balls cannot tunnel.
export function motionSteps(objects,dt){let speed=0,radius=Infinity;for(const o of objects.values()){speed=Math.max(speed,Math.hypot(o.vx,o.vy));radius=Math.min(radius,o.r);}return Math.max(1,Math.ceil(speed*dt/Math.max(4,radius*.25)));}
