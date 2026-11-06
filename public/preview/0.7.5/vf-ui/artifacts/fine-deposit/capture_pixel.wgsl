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
fn fn1(v3:i32)->array<f32,2> {
let v4 = i32(arrayLength(&params));
let v5 = 3i;
if (!((v4==v5))) { vkf_failed = true; }
let v6 = read_params(0i);
let v7 = 1i;
var v10 = (v6>=f32(v7));
if (v10) {
let v8 = read_params(0i);
let v9 = 131072i;
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
let v15 = 4096i;
v16 = (v14<=f32(v15));
}
var v19 = v16;
if (v19) {
let v17 = read_params(2i);
let v18 = 1i;
v19 = (v17>=f32(v18));
}
var v22 = v19;
if (v22) {
let v20 = read_params(2i);
let v21 = 4096i;
v22 = (v20<=f32(v21));
}
var v27 = v22;
if (v27) {
let v23 = read_params(1i);
let v24 = read_params(2i);
let v25 = (v23*v24);
let v26 = 4194304.0f;
v27 = (v25<=v26);
}
if (!(v27)) { vkf_failed = true; }
let v28 = read_params(0i);
if (!(abs(v28) < 2147483648.0f)) { vkf_failed = true; }
var v29: i32 = i32(v28);
let v30 = read_params(0i);
let v31 = v29;
let v32 = f32(v31);
var v37 = (v30==v32);
if (v37) {
let v33 = read_params(1i);
let v34 = read_params(1i);
if (!(abs(v34) < 2147483648.0f)) { vkf_failed = true; }
let v35 = i32(v34);
let v36 = f32(v35);
v37 = (v33==v36);
}
var v42 = v37;
if (v42) {
let v38 = read_params(2i);
let v39 = read_params(2i);
if (!(abs(v39) < 2147483648.0f)) { vkf_failed = true; }
let v40 = i32(v39);
let v41 = f32(v40);
v42 = (v38==v41);
}
var v45 = v42;
if (v45) {
let v43 = v3;
let v44 = 0i;
v45 = (v43>=v44);
}
var v48 = v45;
if (v48) {
let v46 = v3;
let v47 = v29;
v48 = (v46<v47);
}
var v53 = v48;
if (v53) {
let v49 = i32(arrayLength(&values));
let v50 = 27i;
let v51 = v29;
let v52 = (v50*v51);
v53 = (v49==v52);
}
if (!(v53)) { vkf_failed = true; }
let v54 = 2i;
let v55 = v3;
let v56 = read_values((v54*v55));
let v57 = 2i;
let v58 = v3;
let v59 = (v57*v58);
let v60 = 1i;
let v61 = read_values((v59+v60));
var v62: array<f32,2> = array<f32,2>(v56,v61);
let v63 = 2i;
let v64 = v29;
let v65 = (v63*v64);
let v66 = 25i;
let v67 = v3;
let v68 = (v66*v67);
var v69: i32 = (v65+v68);
let v70 = v69;
let v71 = 20i;
var v72: f32 = read_values((v70+v71));
let v73 = v72;
let v74 = 0i;
var v77 = (v73==f32(v74));
if (!v77) {
let v75 = v72;
let v76 = 1i;
v77 = (v75==f32(v76));
}
if (!(v77)) { vkf_failed = true; }
let v78 = v72;
let v79 = 1i;
if ((v78==f32(v79))) {
let v80 = v69;
let v81 = 22i;
var v82: f32 = read_values((v80+v81));
let v83 = v69;
let v84 = 23i;
var v85: f32 = read_values((v83+v84));
let v86 = v69;
let v87 = 16i;
let v88 = read_values((v86+v87));
let v89 = 0i;
var v92 = (v88==f32(v89));
if (v92) {
let v90 = v82;
let v91 = 0i;
v92 = (v90>=f32(v91));
}
var v95 = v92;
if (v95) {
let v93 = v82;
let v94 = read_params(1i);
v95 = (v93<v94);
}
var v98 = v95;
if (v98) {
let v96 = v85;
let v97 = 0i;
v98 = (v96>=f32(v97));
}
var v101 = v98;
if (v101) {
let v99 = v85;
let v100 = read_params(2i);
v101 = (v99<v100);
}
var v106 = v101;
if (v106) {
let v102 = v82;
let v103 = v82;
if (!(abs(v103) < 2147483648.0f)) { vkf_failed = true; }
let v104 = i32(v103);
let v105 = f32(v104);
v106 = (v102==v105);
}
var v111 = v106;
if (v111) {
let v107 = v85;
let v108 = v85;
if (!(abs(v108) < 2147483648.0f)) { vkf_failed = true; }
let v109 = i32(v108);
let v110 = f32(v109);
v111 = (v107==v110);
}
if (!(v111)) { vkf_failed = true; }
let v112 = 0i;
if (v112<0i || v112>=2i) { vkf_failed=true; } else { v62[u32(v112)]=v82; }
let v113 = 1i;
if (v113<0i || v113>=2i) { vkf_failed=true; } else { v62[u32(v113)]=v85; }
}
return v62;
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
