// Visual area determines collision mass; expression magnitude determines size.
export const mass=o=>o.r*o.r;
export function expressionRadius(item,base,seed=false){const magnitude=Math.hypot(item.value,item.imag??0),growth=item.kind==='number'?1+Math.min(.45,.09*Math.log2(1+magnitude)):1;return base*growth*(seed?1.25:1);}
export function mergedVelocity(a,b){const ma=mass(a),mb=mass(b);return{vx:(a.vx*ma+b.vx*mb)/(ma+mb),vy:(a.vy*ma+b.vy*mb)/(ma+mb)};}
export function advance(o,dt,width,height){o.x+=o.vx*dt;o.y+=o.vy*dt;const left=o.r+8,right=width-o.r-8,top=o.r+8,bottom=height-o.r-30;if(o.x<left){o.x=left;o.vx=Math.abs(o.vx);}else if(o.x>right){o.x=right;o.vx=-Math.abs(o.vx);}if(o.y<top){o.y=top;o.vy=Math.abs(o.vy);}else if(o.y>bottom){o.y=bottom;o.vy=-Math.abs(o.vy);}}
// Fixed-size chronological ring; velocity is measured in CSS pixels / second.
// Include the stationary interval before release so holding an object stops it.
export class DragVelocity {
 constructor(x,y,time){this.samples=new Float64Array(32*3);this.start=0;this.length=0;this.sample(x,y,time);}
 sample(x,y,time){if(this.length){const last=((this.start+this.length-1)%32)*3;if(time<=this.samples[last+2]){this.samples[last]=x;this.samples[last+1]=y;return;}}const index=((this.start+this.length)%32)*3;this.samples.set([x,y,time],index);if(this.length<32)this.length++;else this.start=(this.start+1)%32;}
 velocity(time){const data=this.samples,last=((this.start+this.length-1)%32)*3,cutoff=time-100;let first=this.start*3,x=data[first],y=data[first+1],t=data[first+2];for(let i=1;i<this.length;i++){const next=((this.start+i)%32)*3;if(data[next+2]>cutoff){if(t<cutoff){const q=(cutoff-t)/(data[next+2]-t);x+=(data[next]-x)*q;y+=(data[next+1]-y)*q;t=cutoff;}break;}first=next;x=data[first];y=data[first+1];t=data[first+2];}if(t<cutoff)t=cutoff;const dt=(time-t)/1000;if(dt<=0)return{vx:0,vy:0};let vx=(data[last]-x)/dt,vy=(data[last+1]-y)/dt;const scale=Math.min(1,1600/Math.max(1,Math.hypot(vx,vy)));return{vx:vx*scale,vy:vy*scale};}
}
// Bound travel per contact step even for fast throws, so balls cannot tunnel.
export function motionSteps(objects,dt){let count=1;for(const o of objects.values())count=Math.max(count,Math.ceil(Math.hypot(o.vx,o.vy)*dt/Math.max(4,o.r*.25)));return count;}
