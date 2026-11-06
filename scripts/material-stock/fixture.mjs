// Independent finite operator oracle; never imported by Product/runtime code.
export function fixture(){
 const nx=8,ny=6,nz=4,n=nx*ny*nz,C=8,flow=[nx,ny,nz,.2,1/6,.1,.0004,1,0,0,0,1/60,.3,0,0,0,.0002,0,0,0,0,.000001,.0001,0],p=Float32Array.from([...flow,C,7]),v=new Float32Array(7*n+22*C);
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const at=x+nx*(y+ny*z);v[at]=.12+.04*Math.sin(2*Math.PI*(y+.5)/ny);v[n+at]=.04+.02*Math.sin(2*Math.PI*(x+.5)/nx);v[2*n+at]=.02*Math.cos(2*Math.PI*(x+.5)/nx);}
 const owners=[7,-1,8,7,-1,7,7,16777215],alive=[0,1,0,0,0,1,0,0];
 for(let i=0;i<C;i++){const b=7*n+20*i,x=i===6?-.01:.1+i*.15,y=i===6?1.01:.1+i*.1,z=.05+i*.04;
 v.set([x-.001,y-.002,z,x,y,z,1+i,2+i,3+i,.25+i*.125,.125*i,.875-.125*i,.25+.0625*i,.5+.0625*i,.1+i*.01,.8+i*.05,alive[i],i%3,100+i,1/60],b);v[7*n+20*C+i]=owners[i];v[7*n+21*C+i]=.75+i*.1;}
 const wrap=(x,k)=>((x%k)+k)%k,sample=(x,y,z,a)=>{const g=[x/p[3]-(a===0?0:.5),y/p[4]-(a===1?0:.5),z/p[5]-(a===2?0:.5)],lo=g.map(Math.floor),t=g.map((x,j)=>x-lo[j]);let sum=0;for(let k=0;k<8;k++){const d=[k%2,Math.floor(k/2)%2,Math.floor(k/4)],q=d.map((x,j)=>wrap(lo[j]+x,[nx,ny,nz][j])),w=d.reduce((s,x,j)=>s*(x?t[j]:1-t[j]),1);sum+=w*v[a*n+q[0]+nx*(q[1]+ny*q[2])];}return sum;};
 const expected=Array.from(v.subarray(7*n,7*n+20*C)),expectedOwners=[...owners],selected=[];
 for(let i=0;i<C;i++)if(alive[i]===0&&owners[i]===7){selected.push(i);const b=i*20;for(let a=0;a<3;a++)expected[b+6+a]=sample(expected[b+3],expected[b+4],expected[b+5],a);expected[b+14]=0;expected[b+15]=v[7*n+21*C+i];expected[b+16]=1;expected[b+19]=0;expectedOwners[i]=-1;}
 const capture=new Float32Array(26*C);capture.set(owners);const captureExpected=[...owners];for(let i=0;i<C;i++){const b=C+25*i;capture.set(v.subarray(7*n+20*i,7*n+20*i+20),b);capture[b+20]=[0,3,6].includes(i)?1:0;if(capture[b+20]){capture[b+16]=0;captureExpected[i]=42;}}
 return{p,v,n,C,expected,expectedOwners,selected,capture,captureParams:new Float32Array([C,42]),captureExpected};
}
