// Compiler-owned canonical typed-IR real-f32 candidate field.
@group(0) @binding(0) var<storage,read> params:array<f32>;
@group(0) @binding(1) var<storage,read> values:array<f32>;
@group(0) @binding(2) var<storage,read_write> results:array<f32>;
@group(0) @binding(3) var<storage,read_write> errors:array<atomic<u32>>;
var<private> vkf_failed:bool;
var<private> vkf_ticks:u32;
fn read_params(i:i32)->f32 { if(i<0 || u32(i)>=arrayLength(&params)){vkf_failed=true;return 0.0f;} return params[u32(i)]; }
fn read_values(i:i32)->f32 { if(i<0 || u32(i)>=arrayLength(&values)){vkf_failed=true;return 0.0f;} return values[u32(i)]; }
fn vkf_powi(x:f32,n:i32)->f32 { if(n < -64 || n > 64){vkf_failed=true;return 0.0f;} var r=1.0f;for(var i=0i;i<abs(n);i+=1i){r=r*x;} if(n<0){if(r==0.0f){vkf_failed=true;}r=1.0f/r;}return r; }
fn fn3(v23:f32,v24:f32)->f32 {
let v25 = v23;
let v26 = v24;
if ((v25>v26)) {
return v23;
}
return v24;
}
fn fn4(v28:f32,v29:f32)->f32 {
let v30 = v28;
let v31 = v29;
if ((v30<v31)) {
return v28;
}
return v29;
}
fn fn2(v17:f32,v18:f32,v19:f32)->f32 {
let v20 = v19;
let v21 = v18;
let v22 = v17;
let v27 = fn3(v21,v22);
return fn4(v20,v27);
}
fn fn1(v3:i32)->array<f32,4> {
let v4 = f32(0i);
let v5 = f32(0i);
let v6 = f32(0i);
let v7 = f32(0i);
var v8: array<f32,4> = array<f32,4>(v4,v5,v6,v7);
let v9 = v3;
let v10 = 5i;
var v11: i32 = (v9*v10);
let v12 = v11;
let v13 = 4i;
let v14 = read_values((v12+v13));
let v15 = 0.0f;
let v16 = 1.0f;
var v32: f32 = fn2(v14,v15,v16);
let v33 = v32;
let v34 = 0i;
if ((v33==f32(v34))) {
return v8;
}
let v35 = v11;
let v36 = 3i;
var v37: f32 = read_values((v35+v36));
let v38 = v37;
let v39 = 0i;
var v42 = (v38>f32(v39));
if (v42) {
let v40 = v37;
let v41 = 1e+10f;
v42 = (v40<v41);
}
if (!(v42)) { vkf_failed = true; }
var v43: i32 = 0i;
loop {
let v44 = v43;
let v45 = 3i;
if (!((v44<v45))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v46 = v11;
let v47 = v43;
var v48: f32 = read_values((v46+v47));
let v49 = v48;
let v50 = 0i;
var v53 = (v49>=f32(v50));
if (v53) {
let v51 = v48;
let v52 = 1e+10f;
v53 = (v51<v52);
}
if (!(v53)) { vkf_failed = true; }
let v54 = v43;
let v55 = v48;
let v56 = v37;
if (v56 == 0.0f) { vkf_failed = true; }
let v57 = (v55/v56);
let v58 = 0.0f;
let v59 = 1.0f;
let v60 = fn2(v57,v58,v59);
let v61 = v32;
if (v54<0i || v54>=4i) { vkf_failed=true; } else { v8[u32(v54)]=(v60*v61); }
let v62 = v43;
let v63 = 1i;
v43 = (v62+v63);
}
let v64 = 3i;
if (v64<0i || v64>=4i) { vkf_failed=true; } else { v8[u32(v64)]=v32; }
return v8;
}
fn fn0(v1:i32)->array<f32,4> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/4u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<4u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<4u;i+=1u){results[gid.x*4u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/4u)],1u);}
}
