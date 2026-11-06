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
fn fn2(v40:f32,v41:f32)->f32 {
let v42 = v40;
let v43 = v41;
if ((v42>v43)) {
return v40;
}
return v41;
}
fn fn1(v3:i32)->f32 {
let v4 = read_params(25i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = read_params(3i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
var v8: f32 = 0.0f;
var v9: i32 = 0i;
loop {
let v10 = v9;
let v11 = v7;
if (!((v10<v11))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v12 = v5;
let v13 = v9;
var v14: f32 = read_values((v12+v13));
let v15 = v5;
let v16 = v7;
let v17 = (v15+v16);
let v18 = v9;
var v19: f32 = read_values((v17+v18));
let v20 = v14;
let v21 = 0i;
var v24 = (v20>f32(v21));
if (v24) {
let v22 = v19;
let v23 = 0i;
v24 = (v22>f32(v23));
}
var v27 = v24;
if (v27) {
let v25 = abs(v14);
let v26 = 1e+10f;
v27 = (v25<v26);
}
var v30 = v27;
if (v30) {
let v28 = abs(v19);
let v29 = 1e+10f;
v30 = (v28<v29);
}
if (!(v30)) { vkf_failed = true; }
let v31 = v19;
let v32 = v14;
if (v32 == 0.0f) { vkf_failed = true; }
var v33: f32 = (v31/v32);
let v34 = abs(v33);
let v35 = 10i;
let v36 = 30i;
let v37 = vkf_powi(f32(v35),v36);
if (!((v34<v37))) { vkf_failed = true; }
let v38 = v8;
let v39 = v33;
v8 = fn2(v38,v39);
let v44 = v9;
let v45 = 1i;
v9 = (v44+v45);
}
let v46 = v5;
let v47 = v7;
let v48 = (v46+v47);
let v49 = v3;
let v50 = read_values((v48+v49));
let v51 = v5;
let v52 = v3;
let v53 = read_values((v51+v52));
if (v53 == 0.0f) { vkf_failed = true; }
let v54 = (v50/v53);
let v55 = v8;
if (v55 == 0.0f) { vkf_failed = true; }
var v56: f32 = (v54/v55);
let v57 = v56;
let v58 = 1i;
let v59 = 16384i;
if (f32(v59) == 0.0f) { vkf_failed = true; }
let v60 = (f32(v58)/f32(v59));
if (!((v57>=v60))) { vkf_failed = true; }
return v56;
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
