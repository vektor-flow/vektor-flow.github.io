// SOURCE reference for the bounded GPU integer predicate. No bitmap or oracle
// data enters this module. Every accepted operation is an exact dyadic result.
export const RESIDUAL_BITS=256,RESIDUAL_DEPTH=24,RESIDUAL_NODES=8192;
const view=new DataView(new ArrayBuffer(8));
export function binary64Words(x){if(!Number.isFinite(x))throw Error('RESIDUAL_NONFINITE');view.setFloat64(0,x,true);return [view.getUint32(0,true),view.getUint32(4,true)];}
export function dyadic(x){const [lo,hi]=binary64Words(x),e=(hi>>>20)&2047;return norm({n:((BigInt(hi&0xfffff)<<32n)|BigInt(lo)|(e?1n<<52n:0n))*(hi>>>31?-1n:1n),e:e?e-1075:-1074});}
const bitLength=n=>(n<0n?-n:n).toString(2).length;
const blocked=reason=>{throw Object.assign(Error(reason),{code:reason});};
export function norm({n,e}){if(n===0n)return {n:0n,e:0};while((n&1n)===0n){n>>=1n;e++;}if(bitLength(n)>RESIDUAL_BITS)blocked('precision-capacity');return {n,e};}
export function plus(a,b){if(a.n===0n)return b;if(b.n===0n)return a;const e=Math.min(a.e,b.e),sa=a.e-e,sb=b.e-e;
 // GPU checks operand alignment BEFORE cancellation, too.
 if(bitLength(a.n)+sa>RESIDUAL_BITS||bitLength(b.n)+sb>RESIDUAL_BITS)blocked('precision-alignment');
 return norm({n:(a.n<<BigInt(sa))+(b.n<<BigInt(sb)),e});}
export const negate=a=>({n:-a.n,e:a.e});
export const minus=(a,b)=>plus(a,negate(b));
export function times(a,b){if(a.n===0n||b.n===0n)return dyadic(0);if(bitLength(a.n)+bitLength(b.n)-1>RESIDUAL_BITS)blocked('precision-product');return norm({n:a.n*b.n,e:a.e+b.e});}
export const compare=(a,b)=>{if(a.n===0n&&b.n===0n)return 0;return minus(a,b).n<0n?-1:minus(a,b).n>0n?1:0;};
export function round64(a){if(a.n===0n)return a;const sign=a.n<0n?-1n:1n,n=a.n*sign,cut=Math.max(0,bitLength(n)-53,-1074-a.e);let q=n>>BigInt(cut);
 if(cut){const rest=n-(q<<BigInt(cut)),half=1n<<BigInt(cut-1);if(rest>half||(rest===half&&(q&1n)))q++;}
 const r=norm({n:q*sign,e:a.e+cut});if(r.n!==0n&&bitLength(r.n)+r.e-1>1023)blocked('binary64-overflow');return r;}
export const add64=(a,b)=>round64(plus(a,b)),mul64=(a,b)=>round64(times(a,b));
export function composeResidualMatrix(pose,camera,recipe=null){const c=camera.map(dyadic),p=pose.map(dyadic),dot=(a,b,d,e,f)=>add64(add64(mul64(a,b),mul64(d,e)),f);
 if(recipe){const [z,ax,ay,ix,iy,sx,sy]=recipe.map(dyadic),b=[mul64(c[0],z),mul64(c[1],z),mul64(negate(c[2]),z),mul64(negate(c[3]),z),dot(c[0],ax,c[2],ay,c[4]),dot(c[1],ax,c[3],ay,c[5])];
  return [mul64(b[0],sx),mul64(b[1],sx),mul64(b[2],sy),mul64(b[3],sy),dot(b[0],ix,b[2],iy,b[4]),dot(b[1],ix,b[3],iy,b[5])];}
 return [add64(mul64(c[0],p[0]),mul64(c[2],p[1])),add64(mul64(c[1],p[0]),mul64(c[3],p[1])),add64(mul64(c[0],p[2]),mul64(c[2],p[3])),add64(mul64(c[1],p[2]),mul64(c[3],p[3])),dot(c[0],p[4],c[2],p[5],c[4]),dot(c[1],p[4],c[3],p[5],c[5])];
}
export function originalSegments(commands){let current,origin;const out=[];for(const c of commands){if(c[0]==='M'){current=c.slice(1);origin=current;}else if(c[0]==='L'||c[0]==='Z'){const end=c[0]==='Z'?origin:c.slice(1);out.push({line:true,p:[current,current,end,end]});current=end;}else if(c[0]==='C'){const end=c.slice(5);out.push({line:false,p:[current,c.slice(1,3),c.slice(3,5),end]});current=end;}else throw Error('RESIDUAL_COMMAND');}return out;}
export function referenceResidualWinding(commands,pose,camera,sample,{pixelRatio=1,recipe=null,roundoffMagnitude=[0,0],maxDepth=RESIDUAL_DEPTH,maxNodes=RESIDUAL_NODES}={}){
 let nodes=0,splits=0,depthMax=0,lineTests=0;try{
 if(!Number.isInteger(pixelRatio)||pixelRatio<1||pixelRatio>3)blocked('pixel-ratio');
 if(!recipe&&roundoffMagnitude.some(v=>v!==0))blocked('missing-transform-recipe');
 if(!Number.isInteger(maxDepth)||maxDepth<0||maxDepth>RESIDUAL_DEPTH||!Number.isInteger(maxNodes)||maxNodes<1)blocked('work-limit');
 const m=composeResidualMatrix(pose,camera,recipe),dpr=dyadic(pixelRatio),[x,y]=sample.map(dyadic);let winding=0;
 const transform=p=>[0,1].map(k=>times(plus(plus(times(m[k],dyadic(p[0])),times(m[k+2],dyadic(p[1]))),m[k+4]),dpr));
 const midpoint=(a,b)=>a.map((v,k)=>times(plus(v,b[k]),dyadic(.5))),side=p=>compare(p[1],y)<=0?1:0;
 for(const s of originalSegments(commands)){
  const controls=s.p.map(transform);if(s.line){if(++nodes>maxNodes)blocked('node-budget');lineTests++;const a=controls[0],b=controls[3],dy=minus(b[1],a[1]);
   const dir=side(a)-side(b);if(dir){const det=plus(times(minus(a[0],x),dy),times(minus(b[0],a[0]),minus(y,a[1])));if(det.n!==0n&&((det.n>0n)===(dy.n>0n)))winding+=dir;}continue;}
  const stack=[{p:controls,depth:0}];while(stack.length){const {p,depth}=stack.pop();depthMax=Math.max(depthMax,depth);if(++nodes>maxNodes)blocked('node-budget');
   const xs=p.map(q=>compare(q[0],x)),ys=p.map(q=>compare(q[1],y));if(ys.every(v=>v<=0)||ys.every(v=>v>0)||xs.every(v=>v<=0))continue;
   if(xs.every(v=>v>0)){winding+=side(p[0])-side(p[3]);continue;}
   if(depth===maxDepth)blocked('exact-boundary-or-depth');if(stack.length+2>25)blocked('stack-budget');splits++;
   const ab=midpoint(p[0],p[1]),bc=midpoint(p[1],p[2]),cd=midpoint(p[2],p[3]),abc=midpoint(ab,bc),bcd=midpoint(bc,cd),q=midpoint(abc,bcd);
   stack.push({p:[q,bcd,cd,p[3]],depth:depth+1},{p:[p[0],ab,abc,q],depth:depth+1});
  }
 }
 return {resolved:true,winding,inside:winding!==0,nodes,splits,depthMax,lineTests};
 }catch(e){return {resolved:false,reason:e.code??e.message,nodes,splits,depthMax,lineTests};}
}
