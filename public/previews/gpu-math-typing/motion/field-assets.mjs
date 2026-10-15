// Rendering-resource adapter, independent of matching/deformation. All tiles are
// byte-identical portions of the pinned native renderer atlas (same UV/metrics).
export async function bytes(url){const r=await fetch(url);if(!r.ok)throw Error('Math asset failed to load: '+r.status);const raw=await r.arrayBuffer();return new Uint8Array(raw)[0]===31?new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():raw;}
export function residentFields(device,texture,atlasSize,base){
 const loaded=new Set(),pending=new Map(),size=512,[width,height]=atlasSize,stats={tiles:0,uploadedBytes:0};
 async function tile(key){if(loaded.has(key))return;if(pending.has(key))return pending.get(key);const task=(async()=>{const raw=await bytes(new URL('fields/'+key+'.rgba.gz',base));if(raw.byteLength!==size*size*4)throw Error('Invalid field tile');const [x,y]=key.split('-').map(Number);device.queue.writeTexture({texture,origin:[x*size,y*size]},raw,{bytesPerRow:size*4},[size,size]);loaded.add(key);stats.tiles++;stats.uploadedBytes+=raw.byteLength;})();pending.set(key,task);try{await task;}finally{pending.delete(key);}}
 async function ensure(...packets){const keys=new Set();for(const packet of packets)for(let i=0;i<packet.length;i+=16){if(packet[i+12]!==0)continue;const left=Math.max(0,Math.floor((packet[i+4]*width-1)/size)),right=Math.min(width/size-1,Math.floor((packet[i+6]*width+1)/size)),top=Math.max(0,Math.floor((packet[i+5]*height-1)/size)),bottom=Math.min(height/size-1,Math.floor((packet[i+7]*height+1)/size));for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)keys.add(x+'-'+y);}const queue=[...keys];await Promise.all(Array.from({length:Math.min(6,queue.length)},async()=>{while(queue.length)await tile(queue.shift());}));}
 return {ensure,stats};
}
