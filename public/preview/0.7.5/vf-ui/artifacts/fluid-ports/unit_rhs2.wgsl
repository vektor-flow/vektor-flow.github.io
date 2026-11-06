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
let v5 = 24i;
if (!((v4>=v5))) { vkf_failed = true; }
let v6 = read_params(0i);
let v7 = 4i;
var v10 = (v6>=f32(v7));
if (v10) {
let v8 = read_params(0i);
let v9 = 64i;
v10 = (v8<=f32(v9));
}
var v13 = v10;
if (v13) {
let v11 = read_params(1i);
let v12 = 4i;
v13 = (v11>=f32(v12));
}
var v16 = v13;
if (v16) {
let v14 = read_params(1i);
let v15 = 64i;
v16 = (v14<=f32(v15));
}
var v19 = v16;
if (v19) {
let v17 = read_params(2i);
let v18 = 4i;
v19 = (v17>=f32(v18));
}
var v22 = v19;
if (v22) {
let v20 = read_params(2i);
let v21 = 64i;
v22 = (v20<=f32(v21));
}
var v29 = v22;
if (v29) {
let v23 = read_params(0i);
let v24 = read_params(1i);
let v25 = (v23*v24);
let v26 = read_params(2i);
let v27 = (v25*v26);
let v28 = 131072i;
v29 = (v27<=f32(v28));
}
if (!(v29)) { vkf_failed = true; }
var v30: i32 = 0i;
loop {
let v31 = v30;
let v32 = 3i;
if (!((v31<v32))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v33 = read_params(v30);
let v34 = read_params(v30);
if (!(abs(v34) < 2147483648.0f)) { vkf_failed = true; }
let v35 = i32(v34);
let v36 = f32(v35);
var v41 = (v33==v36);
if (v41) {
let v37 = 3i;
let v38 = v30;
let v39 = read_params((v37+v38));
let v40 = 0i;
v41 = (v39>f32(v40));
}
var v46 = v41;
if (v46) {
let v42 = 3i;
let v43 = v30;
let v44 = read_params((v42+v43));
let v45 = 1000000i;
v46 = (v44<f32(v45));
}
if (!(v46)) { vkf_failed = true; }
let v47 = v30;
let v48 = 1i;
v30 = (v47+v48);
}
let v49 = read_params(0i);
if (!(abs(v49) < 2147483648.0f)) { vkf_failed = true; }
let v50 = i32(v49);
let v51 = read_params(1i);
if (!(abs(v51) < 2147483648.0f)) { vkf_failed = true; }
let v52 = i32(v51);
let v53 = (v50*v52);
let v54 = read_params(2i);
if (!(abs(v54) < 2147483648.0f)) { vkf_failed = true; }
let v55 = i32(v54);
return (v53*v55);
}
fn fn4(v76:f32)->f32 {
let v77 = v76;
let v78 = -1.00000002e+30f;
var v81 = (v77>v78);
if (v81) {
let v79 = v76;
let v80 = 1.00000002e+30f;
v81 = (v79<v80);
}
if (!(v81)) { vkf_failed = true; }
return v76;
}
fn fn3(v74:f32)->f32 {
let v75 = v74;
var v82: f32 = fn4(v75);
let v83 = v82;
let v84 = 0i;
if (!((v83>=f32(v84)))) { vkf_failed = true; }
return v82;
}
fn fn1(v3:i32)->array<f32,2> {
var v56: i32 = fn2();
let v57 = i32(arrayLength(&values));
let v58 = 2i;
let v59 = v56;
let v60 = (v58*v59);
var v63 = (v57==v60);
if (v63) {
let v61 = v3;
let v62 = 0i;
v63 = (v61>=v62);
}
var v66 = v63;
if (v66) {
let v64 = v3;
let v65 = v56;
v66 = (v64<v65);
}
if (!(v66)) { vkf_failed = true; }
let v67 = f32(0i);
let v68 = f32(0i);
var v69: array<f32,2> = array<f32,2>(v67,v68);
let v70 = 0i;
let v71 = 2i;
let v72 = v3;
let v73 = read_values((v71*v72));
let v85 = fn3(v73);
let v86 = 2i;
let v87 = v3;
let v88 = (v86*v87);
let v89 = 1i;
let v90 = read_values((v88+v89));
let v91 = fn3(v90);
if (v70<0i || v70>=2i) { vkf_failed=true; } else { v69[u32(v70)]=(v85-v91); }
return v69;
}
fn fn0(v1:i32)->array<f32,2> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/2u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<2u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<2u;i+=1u){results[gid.x*2u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/2u)],1u);}
}
