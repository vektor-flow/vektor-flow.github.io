// Visual area determines collision mass; expression magnitude determines size.
export const mass=o=>o.r*o.r;
export function expressionRadius(item,base,seed=false){const magnitude=Math.hypot(item.value,item.imag??0),growth=item.kind==='number'?1+Math.min(.45,.09*Math.log2(1+magnitude)):1;return base*growth*(seed?1.25:1);}
export function mergedVelocity(a,b){const ma=mass(a),mb=mass(b);return{vx:(a.vx*ma+b.vx*mb)/(ma+mb),vy:(a.vy*ma+b.vy*mb)/(ma+mb)};}
export function advance(o,dt,width,height){o.x+=o.vx*dt;o.y+=o.vy*dt;const left=o.r+8,right=width-o.r-8,top=o.r+8,bottom=height-o.r-30;if(o.x<left){o.x=left;o.vx=Math.abs(o.vx);}else if(o.x>right){o.x=right;o.vx=-Math.abs(o.vx);}if(o.y<top){o.y=top;o.vy=Math.abs(o.vy);}else if(o.y>bottom){o.y=bottom;o.vy=-Math.abs(o.vy);}}
