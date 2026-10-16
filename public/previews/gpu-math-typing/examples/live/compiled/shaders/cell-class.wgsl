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
fn fn1(v3:i32)->f32 {
let v4 = read_params(4i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = v3;
let v7 = v5;
let v8 = 1i;
let v9 = (v7-v8);
if (f32(v9) == 0.0f) { vkf_failed = true; }
let v10 = floor(f32(v6)/f32(v9));
let v11 = v5;
let v12 = (v10*f32(v11));
let v13 = v3;
let v14 = v5;
let v15 = 1i;
let v16 = (v14-v15);
if (v16 == 0i) { vkf_failed = true; }
let v17 = (v13%v16);
var v18: i32 = i32((v12+f32(v17)));
var v19: f32 = read_values(v18);
let v20 = v18;
let v21 = 1i;
var v22: f32 = read_values((v20+v21));
let v23 = v18;
let v24 = v5;
var v25: f32 = read_values((v23+v24));
let v26 = v18;
let v27 = v5;
let v28 = (v26+v27);
let v29 = 1i;
var v30: f32 = read_values((v28+v29));
let v31 = v19;
let v32 = 0i;
var v35 = (v31>=f32(v32));
if (v35) {
let v33 = v22;
let v34 = 0i;
v35 = (v33>=f32(v34));
}
var v38 = v35;
if (v38) {
let v36 = v25;
let v37 = 0i;
v38 = (v36>=f32(v37));
}
var v41 = v38;
if (v41) {
let v39 = v30;
let v40 = 0i;
v41 = (v39>=f32(v40));
}
if (v41) {
return 2.0f;
}
let v42 = v19;
let v43 = 0i;
var v46 = (v42>=f32(v43));
if (!v46) {
let v44 = v22;
let v45 = 0i;
v46 = (v44>=f32(v45));
}
var v49 = v46;
if (!v49) {
let v47 = v25;
let v48 = 0i;
v49 = (v47>=f32(v48));
}
var v52 = v49;
if (!v52) {
let v50 = v30;
let v51 = 0i;
v52 = (v50>=f32(v51));
}
if (v52) {
return 1.0f;
}
return 0.0f;
}
fn fn0(v1:i32)->f32 {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/1u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
if (!(abs(value)<=3.402823466e+38f)){vkf_failed=true;}
results[gid.x]=select(value,0.0f,vkf_failed);atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/1u)],1u);}
}
