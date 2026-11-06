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
fn fn2()->i32 {
let v4 = i32(arrayLength(&params));
let v5 = 3i;
if (!((v4==v5))) { vkf_failed = true; }
let v6 = read_params(0i);
let v7 = 1i;
var v10 = (v6>=f32(v7));
if (v10) {
let v8 = read_params(0i);
let v9 = 8192i;
v10 = (v8<=f32(v9));
}
var v13 = v10;
if (v13) {
let v11 = read_params(1i);
let v12 = 1i;
v13 = (v11>=f32(v12));
}
var v16 = v13;
if (v16) {
let v14 = read_params(1i);
let v15 = 8192i;
v16 = (v14<=f32(v15));
}
var v21 = v16;
if (v21) {
let v17 = read_params(0i);
let v18 = read_params(1i);
let v19 = (v17*v18);
let v20 = 16777216i;
v21 = (v19<=f32(v20));
}
var v24 = v21;
if (v24) {
let v22 = read_params(2i);
let v23 = 0.125f;
v24 = (v22>=v23);
}
var v27 = v24;
if (v27) {
let v25 = read_params(2i);
let v26 = 16i;
v27 = (v25<=f32(v26));
}
if (!(v27)) { vkf_failed = true; }
let v28 = read_params(0i);
let v29 = read_params(0i);
if (!(abs(v29) < 2147483648.0f)) { vkf_failed = true; }
let v30 = i32(v29);
let v31 = f32(v30);
var v36 = (v28==v31);
if (v36) {
let v32 = read_params(1i);
let v33 = read_params(1i);
if (!(abs(v33) < 2147483648.0f)) { vkf_failed = true; }
let v34 = i32(v33);
let v35 = f32(v34);
v36 = (v32==v35);
}
if (!(v36)) { vkf_failed = true; }
let v37 = read_params(0i);
if (!(abs(v37) < 2147483648.0f)) { vkf_failed = true; }
return i32(v37);
}
fn fn1(v3:i32)->f32 {
var v38: i32 = fn2();
let v39 = read_params(1i);
if (!(abs(v39) < 2147483648.0f)) { vkf_failed = true; }
var v40: i32 = i32(v39);
let v41 = v3;
let v42 = 0i;
var v45 = (v41>=v42);
if (v45) {
let v43 = v3;
let v44 = v40;
v45 = (v43<v44);
}
var v50 = v45;
if (v50) {
let v46 = i32(arrayLength(&values));
let v47 = v38;
let v48 = v40;
let v49 = (v47*v48);
v50 = (v46==v49);
}
if (!(v50)) { vkf_failed = true; }
var v51: f32 = 0.0f;
var v52: f32 = 0.0f;
var v53: i32 = 0i;
loop {
let v54 = v53;
let v55 = v38;
if (!((v54<v55))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v56 = v3;
let v57 = v38;
let v58 = (v56*v57);
let v59 = v53;
var v60: f32 = read_values((v58+v59));
let v61 = v60;
let v62 = 0i;
var v65 = (v61>=f32(v62));
if (v65) {
let v63 = v60;
let v64 = 1i;
v65 = (v63<=f32(v64));
}
if (!(v65)) { vkf_failed = true; }
let v66 = v60;
let v67 = v52;
var v68: f32 = (v66-v67);
let v69 = v51;
let v70 = v68;
var v71: f32 = (v69+v70);
let v72 = v71;
let v73 = v51;
let v74 = (v72-v73);
let v75 = v68;
v52 = (v74-v75);
v51 = v71;
let v76 = v53;
let v77 = 1i;
v53 = (v76+v77);
}
return v51;
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
