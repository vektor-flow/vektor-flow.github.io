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
fn fn3(v70:f32)->f32 {
let v71 = v70;
let v72 = -1.00000002e+30f;
var v75 = (v71>v72);
if (v75) {
let v73 = v70;
let v74 = 1.00000002e+30f;
v75 = (v73<v74);
}
if (!(v75)) { vkf_failed = true; }
return v70;
}
fn fn1(v3:i32)->f32 {
var v56: i32 = fn2();
let v57 = i32(arrayLength(&values));
let v58 = 13i;
let v59 = v56;
let v60 = (v58*v59);
var v63 = (v57==v60);
if (v63) {
let v61 = v3;
let v62 = 0i;
v63 = (v61>=v62);
}
var v68 = v63;
if (v68) {
let v64 = v3;
let v65 = 7i;
let v66 = v56;
let v67 = (v65*v66);
v68 = (v64<v67);
}
if (!(v68)) { vkf_failed = true; }
let v69 = read_values(v3);
var v76: f32 = fn3(v69);
let v77 = v3;
let v78 = v56;
if (f32(v78) == 0.0f) { vkf_failed = true; }
var v79: i32 = i32(floor(f32(v77)/f32(v78)));
let v80 = v79;
let v81 = 3i;
if ((v80<v81)) {
let v82 = v76;
let v83 = 7i;
let v84 = v56;
let v85 = (v83*v84);
let v86 = 6i;
let v87 = v3;
let v88 = v56;
if (v88 == 0i) { vkf_failed = true; }
let v89 = (v87%v88);
let v90 = (v86*v89);
let v91 = (v85+v90);
let v92 = 2i;
let v93 = (v91+v92);
let v94 = v79;
let v95 = read_values((v93+v94));
let v96 = fn3(v95);
let v97 = (v82+v96);
return fn3(v97);
}
return v76;
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
