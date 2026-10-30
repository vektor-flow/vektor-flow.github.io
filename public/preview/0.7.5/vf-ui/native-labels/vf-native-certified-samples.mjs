// Bounded source-owned fallback. Never a replacement font or raster reference.
// Each accepted bit has an exact dyadic nonzero-winding proof for the original
// cubic under the supplied affine map. No numerical tolerance accepts a bit.
const fail=code=>Object.assign(Error(code),{code,status:'BLOCKED'});
const require=(v,c)=>{if(!v)throw fail(c);};
const storage=new DataView(new ArrayBuffer(8));
function dyad(x){
 require(Number.isFinite(x),'NATIVE_SAMPLE_NONFINITE');
 storage.setFloat64(0,x);const hi=storage.getUint32(0),lo=storage.getUint32(4),e=(hi>>>20)&2047;
 let n=(BigInt(hi&1048575)<<32n)|BigInt(lo);if(e)n|=1n<<52n;
 if(n===0n)return {n:0n,e:0};
 let power=e?e-1023-52:-1074;while((n&1n)===0n){n>>=1n;power++;}
 return {n:hi>>>31?-n:n,e:power};
}
function add(a,b){const e=Math.min(a.e,b.e);return {n:(a.n<<BigInt(a.e-e))+(b.n<<BigInt(b.e-e)),e};}
const mul=(a,b)=>({n:a.n*b.n,e:a.e+b.e});
const sum=(a,b,c)=>add(add(a,b),c);
function affine(m,p,dpr){return [sum(mul(dyad(m[0]),dyad(p[0])),mul(dyad(m[2]),dyad(p[1])),dyad(m[4])),sum(mul(dyad(m[1]),dyad(p[0])),mul(dyad(m[3]),dyad(p[1])),dyad(m[5]))].map(x=>mul(x,dyad(dpr)));}
const lo=a=>a.reduce((x,y)=>x<y?x:y),hi=a=>a.reduce((x,y)=>x>y?x:y);
const floorDiv=(a,b)=>a>=0n?a/b:-((-a+b-1n)/b);
function split(p){const axis=k=>{const [a,b,c,d]=p.map(q=>q[k]);return [[8n*a,4n*(a+b),2n*(a+2n*b+c),a+3n*b+3n*c+d],[a+3n*b+3n*c+d,2n*(b+2n*c+d),4n*(c+d),8n*d]];};const x=axis(0),y=axis(1);return [0,1].map(s=>[0,1,2,3].map(i=>[x[s][i],y[s][i]]));}
function crossing(a,b,x,y){
 if(!((a[1]<=y&&y<b[1])||(b[1]<=y&&y<a[1])))return 0;
 const dy=b[1]-a[1],lhs=(a[0]-x)*dy+(b[0]-a[0])*(y-a[1]);
 // Strict ray x_intersection > x; exact equality follows that convention.
 return ((dy>0n&&lhs>0n)||(dy<0n&&lhs<0n))?(dy>0n?1:-1):0;
}
export function compileNativeSampleProof(commands,matrix,{pixelRatio=1,maxDepth=48,maxNodes=2000000}={}){
 require(Array.isArray(commands)&&matrix?.length===6&&matrix.every(Number.isFinite)&&Number.isInteger(pixelRatio)&&pixelRatio>=1&&pixelRatio<=3,'NATIVE_SAMPLE_TRANSFORM');
 require(Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=64&&Number.isSafeInteger(maxNodes)&&maxNodes>0,'NATIVE_SAMPLE_LIMIT');
 const pending=[];let current,origin,open=false;
 const transform=p=>affine(matrix,p,pixelRatio);
 for(const c of commands){
  require(Array.isArray(c),'NATIVE_SAMPLE_COMMAND');
  if(c[0]==='M'){require(!open&&c.length===3,'NATIVE_SAMPLE_PATH');current=transform(c.slice(1));origin=current;open=true;}
  else if(c[0]==='L'){require(open&&c.length===3,'NATIVE_SAMPLE_PATH');const d=transform(c.slice(1));pending.push([current,d]);current=d;}
  else if(c[0]==='C'){require(open&&c.length===7,'NATIVE_SAMPLE_PATH');const d=transform(c.slice(5));pending.push([current,transform(c.slice(1,3)),transform(c.slice(3,5)),d]);current=d;}
  else if(c[0]==='Z'){require(open&&c.length===1,'NATIVE_SAMPLE_PATH');pending.push([current,origin]);open=false;current=origin;}
  else throw fail('NATIVE_SAMPLE_OPERATOR');
 }
 require(!open&&pending.length>0&&pending.length<=4096,'NATIVE_SAMPLE_UNCLOSED_OR_LIMIT');
 const exponent=Math.min(-3,...pending.flat(2).map(d=>d.e));
 const segments=pending.map(s=>s.map(p=>p.map(v=>v.n<<BigInt(v.e-exponent))));
 const unit=1n<<BigInt(-exponent),eighth=unit/8n;
 const bounds=[0,1].map(k=>{const all=segments.flat().map(p=>p[k]);return [Number(floorDiv(lo(all),unit)),Number(-floorDiv(-hi(all),unit))];});
 require(bounds.flat().every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=65536),'NATIVE_SAMPLE_COORDINATE_LIMIT');
 const stats={samples:0,nodes:0,splits:0,maxDepth:0,exactDyadic:true,ambiguous:0};
 function cubic(p,x,y,depth){
  require(++stats.nodes<=maxNodes,'NATIVE_SAMPLE_NODE_BUDGET');stats.maxDepth=Math.max(stats.maxDepth,depth);
  const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);
  if(hi(ys)<=y||lo(ys)>y||hi(xs)<=x)return 0;
  // The whole Bezier convex hull is right of the ray origin: algebraic
  // crossing count depends only on endpoint sides, even through extrema.
  if(lo(xs)>x)return (p[0][1]<=y?1:0)-(p[3][1]<=y?1:0);
  if(depth===maxDepth){stats.ambiguous++;throw fail('NATIVE_SAMPLE_UNRESOLVED_BOUNDARY');}
  stats.splits++;const [a,b]=split(p);return cubic(a,x*8n,y*8n,depth+1)+cubic(b,x*8n,y*8n,depth+1);
 }
 function winding(ix,iy){require(Number.isSafeInteger(ix)&&Number.isSafeInteger(iy),'NATIVE_SAMPLE_INDEX');stats.samples++;
  const x=BigInt(2*ix+1)*eighth,y=BigInt(2*iy+1)*eighth;let w=0;
  for(const s of segments){if(s.length===2){require(++stats.nodes<=maxNodes,'NATIVE_SAMPLE_NODE_BUDGET');w+=crossing(s[0],s[1],x,y);}else w+=cubic(s,x,y,0);}return w;
 }
 // A region is the inclusive rectangle of sample CENTERS, not pixel edges.
 // Return null unless EVERY segment has the same signed ray contribution
 // throughout that rectangle. Never infer a bit from approximate polygons.
 const regionChildren=new WeakMap();
 stats.regionSplits=0;
 function regionSegment(s,x0,y0,x1,y1,depth=0){
  require(++stats.nodes<=maxNodes,'NATIVE_SAMPLE_NODE_BUDGET');
  const xs=s.map(p=>p[0]),ys=s.map(p=>p[1]);
  if(hi(ys)<=y0||lo(ys)>y1||hi(xs)<=x0)return 0;
  if(lo(xs)>x1){
   const side=p=>p[1]<=y0?1:p[1]>y1?0:null,a=side(s[0]),b=side(s.at(-1));
   return a===null||b===null?null:a-b;
  }
  // A fixed refinement depth bounds ONLY sharing work. It never accepts an
  // approximation: unresolved leaves return null and use exact sample proofs.
  if(s.length===2||depth===3)return null;
  let children=regionChildren.get(s);if(!children){children=split(s);regionChildren.set(s,children);stats.regionSplits++;}
  const a=regionSegment(children[0],x0*8n,y0*8n,x1*8n,y1*8n,depth+1);if(a===null)return null;
  const b=regionSegment(children[1],x0*8n,y0*8n,x1*8n,y1*8n,depth+1);return b===null?null:a+b;
 }
 function region(ix0,iy0,ix1,iy1){
  require([ix0,iy0,ix1,iy1].every(Number.isSafeInteger)&&ix0<=ix1&&iy0<=iy1,'NATIVE_SAMPLE_REGION');
  const x0=BigInt(2*ix0+1)*eighth,x1=BigInt(2*ix1+1)*eighth,
   y0=BigInt(2*iy0+1)*eighth,y1=BigInt(2*iy1+1)*eighth;let w=0;
  for(const s of segments){
   const contribution=regionSegment(s,x0,y0,x1,y1);if(contribution===null)return null;w+=contribution;
  }
  return w;
 }
 return {winding,region,stats,bounds,policy:'nonzero; strict +x ray; centered 4x4; exact input binary64 affine product/sum, no float32 contour'};
}

/** Share exact ray decisions over convex-hull-separated sample regions.
 * Ambiguous regions split; singleton leaves use the original exact cubic
 * de Casteljau proof. Output runs/triangles are identical to the bounded
 * per-sample mesh, so no new approximate boundary geometry is introduced.
 */
export function certifiedNativeRegionMesh(commands,matrix,{pixelRatio=1,width,height,maxPixels=4096,maxTriangles=131072,...limits}={}){
 require(Number.isSafeInteger(width)&&width>0&&Number.isSafeInteger(height)&&height>0&&width*pixelRatio<=65536&&height*pixelRatio<=65536,'NATIVE_SAMPLE_VIEWPORT');
 require(Number.isSafeInteger(maxPixels)&&maxPixels>0&&Number.isSafeInteger(maxTriangles)&&maxTriangles>0,'NATIVE_SAMPLE_PIXEL_LIMIT');
 const proof=compileNativeSampleProof(commands,matrix,{pixelRatio,...limits});
 const [[lx,hx],[ly,hy]]=proof.bounds,x0=Math.max(0,lx),x1=Math.min(width*pixelRatio,hx),y0=Math.max(0,ly),y1=Math.min(height*pixelRatio,hy);
 const pixels=Math.max(0,x1-x0)*Math.max(0,y1-y0);
 require(pixels<=maxPixels,'NATIVE_SAMPLE_PIXEL_BUDGET');
 const rowRuns=new Map();let regionTests=0,sharedSamples=0,fallbackSamples=0;
 function occupy(a,b,c,d){for(let y=b;y<=d;y++){let runs=rowRuns.get(y);if(!runs)rowRuns.set(y,runs=[]);runs.push([a,c+1]);}}
 function visit(a,b,c,d){
  regionTests++;const w=proof.region(a,b,c,d);
  if(w!==null){sharedSamples+=(c-a+1)*(d-b+1);if(w!==0)occupy(a,b,c,d);return;}
  if(a===c&&b===d){fallbackSamples++;if(proof.winding(a,b)!==0)occupy(a,b,c,d);return;}
  if(c-a>=d-b){const m=Math.floor((a+c)/2);visit(a,b,m,d);visit(m+1,b,c,d);}
  else {const m=Math.floor((b+d)/2);visit(a,b,c,m);visit(a,m+1,c,d);}
 }
 if(pixels)visit(x0*4,y0*4,x1*4-1,y1*4-1);
 const rows=[],triangles=[],step=4*pixelRatio;
 for(let iy=y0*4;iy<y1*4;iy++){
  const sorted=(rowRuns.get(iy)??[]).sort((a,b)=>a[0]-b[0]),runs=[];
  for(const r of sorted){const last=runs.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else runs.push([...r]);}
  for(const [start,end] of runs){const a=[start/step,iy/step],b=[end/step,iy/step],c=[end/step,(iy+1)/step],d=[start/step,(iy+1)/step];require(triangles.length+2<=maxTriangles,'NATIVE_SAMPLE_TRIANGLE_BUDGET');triangles.push([a,b,c],[a,c,d]);}
  rows.push({iy,runs});
 }
 return {triangles,rows,stats:{...proof.stats,regionTests,sharedSamples,fallbackSamples,acceptedSamples:pixels*16},policy:proof.policy,
  sourceCommands:commands,sourceMatrix:matrix,pixelRatio,displayOnly:true,bounds:[x0,y0,x1,y1]};
}
/** A sample run is a rectangle whose edges lie halfway between sample centers.
 * Reusing the existing 4x area target keeps AA16 and premultiplied resolve.
 * Native commands remain the vector/selection/capture authority. These cells
 * are a display-only fallback and must not be exported as vector glyph paths.
 */
export function certifiedNativeSampleMesh(commands,matrix,{pixelRatio=1,width,height,maxPixels=4096,maxTriangles=131072,...limits}={}){
 require(Number.isSafeInteger(width)&&width>0&&Number.isSafeInteger(height)&&height>0&&width*pixelRatio<=65536&&height*pixelRatio<=65536,'NATIVE_SAMPLE_VIEWPORT');
 require(Number.isSafeInteger(maxPixels)&&maxPixels>0&&Number.isSafeInteger(maxTriangles)&&maxTriangles>0,'NATIVE_SAMPLE_PIXEL_LIMIT');
 const proof=compileNativeSampleProof(commands,matrix,{pixelRatio,...limits});
 const [[lx,hx],[ly,hy]]=proof.bounds,x0=Math.max(0,lx),x1=Math.min(width*pixelRatio,hx),y0=Math.max(0,ly),y1=Math.min(height*pixelRatio,hy);
 require(Math.max(0,x1-x0)*Math.max(0,y1-y0)<=maxPixels,'NATIVE_SAMPLE_PIXEL_BUDGET');
 const triangles=[],rows=[];const step=4*pixelRatio;
 for(let iy=y0*4;iy<y1*4;iy++){
  const runs=[];let start=null;
  for(let ix=x0*4;ix<=x1*4;ix++){
   const inside=ix<x1*4&&proof.winding(ix,iy)!==0;
   if(inside&&start===null)start=ix;
   if(!inside&&start!==null){const a=[start/step,iy/step],b=[ix/step,iy/step],c=[ix/step,(iy+1)/step],d=[start/step,(iy+1)/step];require(triangles.length+2<=maxTriangles,'NATIVE_SAMPLE_TRIANGLE_BUDGET');triangles.push([a,b,c],[a,c,d]);runs.push([start,ix]);start=null;}
  }
  rows.push({iy,runs});
 }
 return {triangles,rows,stats:{...proof.stats},policy:proof.policy,sourceCommands:commands,sourceMatrix:matrix,pixelRatio,displayOnly:true,bounds:[x0,y0,x1,y1]};
}
