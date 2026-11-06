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
fn fn1(v3:i32)->array<f32,4> {
let v4 = f32(0i);
let v5 = f32(0i);
let v6 = f32(0i);
let v7 = f32(0i);
var v8: array<f32,4> = array<f32,4>(v4,v5,v6,v7);
let v9 = v3;
let v10 = 8i;
var v11: i32 = (v9*v10);
var v12: i32 = 0i;
loop {
let v13 = v12;
let v14 = 4i;
if (!((v13<v14))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v15 = v11;
let v16 = v12;
var v17: f32 = read_values((v15+v16));
let v18 = v11;
let v19 = 4i;
let v20 = (v18+v19);
let v21 = v12;
var v22: f32 = read_values((v20+v21));
let v23 = v17;
let v24 = 0i;
var v27 = (v23>=f32(v24));
if (v27) {
let v25 = v22;
let v26 = 0i;
v27 = (v25>=f32(v26));
}
var v30 = v27;
if (v30) {
let v28 = abs(v17);
let v29 = 1e+10f;
v30 = (v28<v29);
}
var v33 = v30;
if (v33) {
let v31 = abs(v22);
let v32 = 1e+10f;
v33 = (v31<v32);
}
if (!(v33)) { vkf_failed = true; }
let v34 = v12;
let v35 = v17;
let v36 = v22;
if (v34<0i || v34>=4i) { vkf_failed=true; } else { v8[u32(v34)]=(v35+v36); }
let v37 = v12;
let v38 = 1i;
v12 = (v37+v38);
}
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
