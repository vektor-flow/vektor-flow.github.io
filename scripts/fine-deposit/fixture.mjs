// Independent finite test data/oracle. Not part of a Product or fluid runtime.
export function fixture(C,support,width=1280,height=720,{nonDyadic=false}={}){
 const K=support.length,p=new Float32Array([C,K,7,width,height,1.6,1]),values=new Float32Array(24*C+2*K),expected=new Float64Array(5*K),classified=new Float64Array(6*C);let selected=0,selectedMass=0;
 support.forEach(([id,a],i)=>{values[24*C+2*i]=id;values[24*C+2*i+1]=a;});
 for(let i=0;i<C;i++){const b=20*i,which=(73*i+13)%K,[id,alpha]=support[which],mass=nonDyadic?.13+(i%31)/127:.125+(i%31)/128,coverage=Math.fround(alpha),opacity=(i%5)/4,alive=i%4===0?1:0,owner=i%4===1?8:(alive&&i%8===0?-1:7);values.set([-999,4e6,-.1,12345,-54321,.2,1,2,3,mass,nonDyadic?(i%255)/255:(i%17)/16,nonDyadic?((i*3)%255)/255:((i*3)%17)/16,nonDyadic?((i*7)%255)/255:((i*7)%17)/16,Math.fround(coverage*opacity),.1,.7,alive,i%3,100+i,1/60],b);values[20*C+i]=owner;values[21*C+2*i]=alive||owner!==7?-1:id%width;values[21*C+2*i+1]=alive||owner!==7?-1:Math.floor(id/width);values[23*C+i]=coverage;classified[6*i]=-1;
 if(alive===0&&owner===7){selected++;selectedMass+=values[b+9];classified[6*i]=which;const moments=[values[b+9]*values[b+10],values[b+9]*values[b+11],values[b+9]*values[b+12],values[b+9],values[b+9]*(values[b+13]/values[23*C+i])];moments.forEach((v,j)=>{classified[6*i+1+j]=v;expected[5*which+j]+=v;});}}
 return{params:p,values,expected,classified,C,K,selected,selectedMass,tiles:Math.ceil(C/4096)};
}
