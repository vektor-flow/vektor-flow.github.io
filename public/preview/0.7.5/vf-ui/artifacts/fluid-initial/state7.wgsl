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
if (!((v4==v5))) { vkf_failed = true; }
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
let v45 = 2i;
v46 = (v44<f32(v45));
}
if (!(v46)) { vkf_failed = true; }
let v47 = v30;
let v48 = 1i;
v30 = (v47+v48);
}
let v49 = read_params(0i);
let v50 = read_params(3i);
let v51 = (v49*v50);
let v52 = 1.60000002f;
let v53 = abs((v51-v52));
let v54 = 9.99999975e-06f;
var v61 = (v53<v54);
if (v61) {
let v55 = read_params(1i);
let v56 = read_params(4i);
let v57 = (v55*v56);
let v58 = 1.0f;
let v59 = abs((v57-v58));
let v60 = 9.99999975e-06f;
v61 = (v59<v60);
}
var v68 = v61;
if (v68) {
let v62 = read_params(2i);
let v63 = read_params(5i);
let v64 = (v62*v63);
let v65 = 0.400000006f;
let v66 = abs((v64-v65));
let v67 = 9.99999975e-06f;
v68 = (v66<v67);
}
if (!(v68)) { vkf_failed = true; }
let v69 = read_params(0i);
if (!(abs(v69) < 2147483648.0f)) { vkf_failed = true; }
let v70 = i32(v69);
let v71 = read_params(1i);
if (!(abs(v71) < 2147483648.0f)) { vkf_failed = true; }
let v72 = i32(v71);
let v73 = (v70*v72);
let v74 = read_params(2i);
if (!(abs(v74) < 2147483648.0f)) { vkf_failed = true; }
let v75 = i32(v74);
return (v73*v75);
}
fn fn1(v3:i32)->f32 {
var v76: i32 = fn2();
let v77 = v3;
let v78 = 0i;
var v83 = (v77>=v78);
if (v83) {
let v79 = v3;
let v80 = 7i;
let v81 = v76;
let v82 = (v80*v81);
v83 = (v79<v82);
}
var v90 = v83;
if (v90) {
let v84 = i32(arrayLength(&values));
let v85 = 3i;
let v86 = v76;
let v87 = (v85*v86);
let v88 = 1i;
let v89 = (v87+v88);
v90 = (v84==v89);
}
if (!(v90)) { vkf_failed = true; }
let v91 = 3i;
let v92 = v76;
var v93: f32 = read_values((v91*v92));
let v94 = v93;
let v95 = 0i;
var v98 = (v94>f32(v95));
if (v98) {
let v96 = v93;
let v97 = 1000000i;
v98 = (v96<f32(v97));
}
if (!(v98)) { vkf_failed = true; }
let v99 = v3;
let v100 = 3i;
let v101 = v76;
let v102 = (v100*v101);
if ((v99>=v102)) {
return 0.0f;
}
var v103: f32 = read_values(v3);
let v104 = v103;
let v105 = -1000000i;
var v108 = (v104>f32(v105));
if (v108) {
let v106 = v103;
let v107 = 1000000i;
v108 = (v106<f32(v107));
}
if (!(v108)) { vkf_failed = true; }
let v109 = v103;
let v110 = v93;
return (v109*v110);
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
