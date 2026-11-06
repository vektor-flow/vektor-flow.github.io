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
fn fn2(v18:f32)->bool {
let v19 = v18;
let v20 = -1i;
var v23 = (v19>=f32(v20));
if (v23) {
let v21 = v18;
let v22 = 16777215.0f;
v23 = (v21<=v22);
}
var v28 = v23;
if (v28) {
let v24 = v18;
let v25 = v18;
if (!(abs(v25) < 2147483648.0f)) { vkf_failed = true; }
let v26 = i32(v25);
let v27 = f32(v26);
v28 = (v24==v27);
}
return v28;
}
fn fn1(v3:i32)->f32 {
let v4 = i32(arrayLength(&params));
let v5 = 2i;
if (!((v4==v5))) { vkf_failed = true; }
let v6 = read_params(0i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = v7;
let v9 = 0i;
var v12 = (v8>v9);
if (v12) {
let v10 = v7;
let v11 = 131072i;
v12 = (v10<=v11);
}
var v16 = v12;
if (v16) {
let v13 = read_params(0i);
let v14 = v7;
let v15 = f32(v14);
v16 = (v13==v15);
}
var v29 = v16;
if (v29) {
let v17 = read_params(1i);
v29 = fn2(v17);
}
var v32 = v29;
if (v32) {
let v30 = read_params(1i);
let v31 = 0i;
v32 = (v30>=f32(v31));
}
var v35 = v32;
if (v35) {
let v33 = v3;
let v34 = 0i;
v35 = (v33>=v34);
}
var v38 = v35;
if (v38) {
let v36 = v3;
let v37 = v7;
v38 = (v36<v37);
}
var v43 = v38;
if (v43) {
let v39 = i32(arrayLength(&values));
let v40 = 26i;
let v41 = v7;
let v42 = (v40*v41);
v43 = (v39==v42);
}
if (!(v43)) { vkf_failed = true; }
var v44: f32 = read_values(v3);
let v45 = v7;
let v46 = 25i;
let v47 = v3;
let v48 = (v46*v47);
var v49: i32 = (v45+v48);
let v50 = v49;
let v51 = 20i;
var v52: f32 = read_values((v50+v51));
let v53 = v44;
var v59 = fn2(v53);
if (v59) {
let v54 = v52;
let v55 = 0i;
var v58 = (v54==f32(v55));
if (!v58) {
let v56 = v52;
let v57 = 1i;
v58 = (v56==f32(v57));
}
v59 = v58;
}
if (!(v59)) { vkf_failed = true; }
let v60 = v52;
let v61 = 1i;
if ((v60==f32(v61))) {
let v62 = v49;
let v63 = 16i;
let v64 = read_values((v62+v63));
let v65 = 0i;
if (!((v64==f32(v65)))) { vkf_failed = true; }
return read_params(1i);
}
return v44;
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
