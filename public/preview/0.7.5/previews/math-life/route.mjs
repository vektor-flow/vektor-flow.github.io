// A bounded indexed queue routes explicit tap/keyboard pairs around other
// compatible objects, so an intermediate expression cannot steal the operation.
export function pairRoute(moving,target,objects,width,height,combine){
 const step=10,margin=moving.r+8,cols=Math.max(1,Math.floor((width-2*margin)/step)+1),rows=Math.max(1,Math.floor((height-margin-moving.r-30)/step)+1),size=cols*rows;
 const obstacles=[...objects.values()].filter(o=>o.id!==moving.id&&o.id!==target.id&&combine(moving,o).ok);
 const blocked=(x,y)=>obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<moving.r+o.r+9);
 const ix=Math.max(0,Math.min(cols-1,Math.round((moving.x-margin)/step))),iy=Math.max(0,Math.min(rows-1,Math.round((moving.y-margin)/step))),start=iy*cols+ix,previous=new Int32Array(size).fill(-1),queue=new Int32Array(size);
 previous[start]=start;queue[0]=start;let first=0,last=1,finish=-1;
 while(first<last){const at=queue[first++],col=at%cols,row=Math.floor(at/cols),x=margin+col*step,y=margin+row*step;if(Math.hypot(x-target.x,y-target.y)<moving.r+target.r+2){finish=at;break;}
  for(const[dx,dy]of[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]){const xx=col+dx,yy=row+dy;if(xx<0||xx>=cols||yy<0||yy>=rows)continue;const next=yy*cols+xx;if(previous[next]>=0)continue;const px=margin+xx*step,py=margin+yy*step;if(blocked(px,py)||blocked((x+px)/2,(y+py)/2))continue;previous[next]=at;queue[last++]=next;}
 }
 if(finish<0)return null;const path=[];for(let at=finish;at!==start;at=previous[at])path.push({x:margin+(at%cols)*step,y:margin+Math.floor(at/cols)*step});return path.reverse();
}
