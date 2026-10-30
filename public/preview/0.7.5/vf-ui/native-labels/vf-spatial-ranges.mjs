/** Immutable source-order hierarchy. Camera queries never touch source elements.
 * Conservative affine hulls include marker/ink extent; no density reduction.
 * Ranges reference original buffer indices, preserving selection/source identity.
 */
export function createSpatialRanges(count,boundsAt,{leafSize=256}={}) {
 if(!Number.isSafeInteger(count)||count<0||count>0xffffffff||!Number.isSafeInteger(leafSize)||leafSize<1)throw RangeError('SPATIAL_SOURCE_COUNT');
 const leaves=Math.max(1,Math.ceil(count/leafSize)),capacity=leaves*2-1;
 const bounds=new Float64Array(capacity*6),first=new Uint32Array(capacity),end=new Uint32Array(capacity),left=new Int32Array(capacity),right=new Int32Array(capacity);
 left.fill(-1);right.fill(-1);let used=0;
 function build(a,b){const node=used++,o=node*6;first[node]=a;end[node]=b;
  if(b-a<=leafSize){bounds.set([Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity],o);
   for(let i=a;i<b;i++){const v=boundsAt(i);if(v.length!==6||!v.every(Number.isFinite)||v.some((x,j)=>j<3&&x>v[j+3]))throw TypeError('SPATIAL_SOURCE_BOUNDS');
    for(let j=0;j<3;j++){bounds[o+j]=Math.min(bounds[o+j],v[j]);bounds[o+j+3]=Math.max(bounds[o+j+3],v[j+3]);}}
  }else{const m=a+Math.floor(Math.ceil((b-a)/leafSize)/2)*leafSize,l=build(a,m),r=build(m,b);left[node]=l;right[node]=r;
   for(let j=0;j<3;j++){bounds[o+j]=Math.min(bounds[l*6+j],bounds[r*6+j]);bounds[o+j+3]=Math.max(bounds[l*6+j+3],bounds[r*6+j+3]);}}
  return node;
 }
 if(count)build(0,count);
 const ranges=new Uint32Array(leaves*2);let n=0,submitted=0,visited=0,key=null,queries=0;
 function query(matrix,width,height,pad=0){if(matrix.length!==8||!matrix.every(Number.isFinite)||![width,height,pad].every(Number.isFinite)||width<=0||height<=0||pad<0)throw TypeError('SPATIAL_CAMERA');
  const k=matrix.join(',')+','+width+','+height+','+pad;if(k===key)return result();key=k;n=0;submitted=0;visited=0;queries++;
  const add=(a,b)=>{if(n&&ranges[n-1]===a)ranges[n-1]=b;else{ranges[n++]=a;ranges[n++]=b;}submitted+=b-a;};
  function visit(node){visited++;const o=node*6;let x0=matrix[6],x1=x0,y0=matrix[7],y1=y0,magnitude=Math.abs(x0)+Math.abs(y0);
   for(let j=0;j<3;j++){const a=matrix[j*2],b=matrix[j*2+1],lo=bounds[o+j],hi=bounds[o+j+3];x0+=a*(a<0?hi:lo);x1+=a*(a<0?lo:hi);y0+=b*(b<0?hi:lo);y1+=b*(b<0?lo:hi);magnitude+=(Math.abs(a)+Math.abs(b))*Math.max(Math.abs(lo),Math.abs(hi));}const margin=pad+32*2**-23*magnitude;
   if(x1 < -margin||x0>width+margin||y1 < -margin||y0>height+margin)return;
   if(left[node]<0||(x0>=-margin&&x1<=width+margin&&y0>=-margin&&y1<=height+margin)){add(first[node],end[node]);return;}
   visit(left[node]);visit(right[node]);
  }
  if(count)visit(0);return result();
 }
 function result(){return {ranges,rangeCount:n/2,submitted,visited,resident:count,queries,bytes:bounds.byteLength+first.byteLength+end.byteLength+left.byteLength+right.byteLength+ranges.byteLength};}
 return Object.freeze({query,statistics:result});
}
