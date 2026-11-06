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
fn fn3(v65:f32,v66:f32,v67:f32,v68:f32,v69:f32,v70:f32)->f32 {
let v71 = 1i;
let v72 = v70;
var v73: f32 = (f32(v71)-v72);
let v74 = v66;
let v75 = v65;
let v76 = (v74-v75);
let v77 = v69;
if (v77 == 0.0f) { vkf_failed = true; }
let v78 = (v76/v77);
let v79 = 1i;
let v80 = 3i;
let v81 = v73;
let v82 = (f32(v80)*v81);
let v83 = v73;
let v84 = (v82*v83);
let v85 = (f32(v79)-v84);
let v86 = v67;
let v87 = (v85*v86);
let v88 = 3i;
let v89 = v70;
let v90 = (f32(v88)*v89);
let v91 = v70;
let v92 = (v90*v91);
let v93 = 1i;
let v94 = (v92-f32(v93));
let v95 = v68;
let v96 = (v94*v95);
let v97 = (v87+v96);
let v98 = v69;
let v99 = (v97*v98);
let v100 = 6i;
if (f32(v100) == 0.0f) { vkf_failed = true; }
let v101 = (v99/f32(v100));
return (v78+v101);
}
fn fn2(v23:i32,v24:i32,v25:i32,v26:f32,v27:f32,v28:i32)->f32 {
let v29 = v25;
let v30 = v23;
let v31 = (v29*v30);
let v32 = v28;
var v33: i32 = (v31+v32);
let v34 = v33;
let v35 = v23;
var v36: i32 = (v34+v35);
var v37: i32 = v24;
let v38 = v24;
let v39 = 0i;
if ((v38<v39)) {
v37 = (-v24);
}
let v40 = v37;
let v41 = v23;
var v42: i32 = (v40*v41);
var v43: i32 = v33;
let v44 = v24;
let v45 = 0i;
if ((v44<v45)) {
let v46 = 2i;
let v47 = v25;
let v48 = (v46*v47);
let v49 = v23;
let v50 = (v48*v49);
let v51 = v28;
v43 = (v50+v51);
}
let v52 = v43;
let v53 = v23;
var v54: i32 = (v52+v53);
let v55 = read_values(v33);
let v56 = read_values(v36);
let v57 = v42;
let v58 = v43;
let v59 = read_values((v57+v58));
let v60 = v42;
let v61 = v54;
let v62 = read_values((v60+v61));
let v63 = v26;
let v64 = v27;
return fn3(v55,v56,v59,v62,v63,v64);
}
fn fn1(v3:i32)->f32 {
let v4 = i32(arrayLength(&params));
let v5 = 37i;
if ((v4>v5)) {
let v6 = read_params(37i);
let v7 = 1i;
if ((v6==f32(v7))) {
let v8 = read_params(39i);
if (!(abs(v8) < 2147483648.0f)) { vkf_failed = true; }
let v9 = i32(v8);
let v10 = read_params(24i);
if (!(abs(v10) < 2147483648.0f)) { vkf_failed = true; }
let v11 = i32(v10);
let v12 = read_params(21i);
if (!(abs(v12) < 2147483648.0f)) { vkf_failed = true; }
let v13 = i32(v12);
let v14 = read_params(23i);
let v15 = read_params(22i);
let v16 = v3;
let v17 = v9;
let v18 = v11;
let v19 = v13;
let v20 = v14;
let v21 = v15;
let v22 = v16;
return fn2(v17,v18,v19,v20,v21,v22);
}
}
let v102 = v3;
let v103 = 4i;
if (f32(v103) == 0.0f) { vkf_failed = true; }
let v104 = floor(f32(v102)/f32(v103));
let v105 = read_params(2i);
if (!(abs(v105) < 2147483648.0f)) { vkf_failed = true; }
let v106 = i32(v105);
let v107 = (v104*f32(v106));
let v108 = v3;
let v109 = 4i;
if (v109 == 0i) { vkf_failed = true; }
let v110 = (v108%v109);
var v111: i32 = i32((v107+f32(v110)));
let v112 = read_params(25i);
if (!(abs(v112) < 2147483648.0f)) { vkf_failed = true; }
let v113 = i32(v112);
let v114 = read_params(24i);
if (!(abs(v114) < 2147483648.0f)) { vkf_failed = true; }
let v115 = i32(v114);
let v116 = read_params(21i);
if (!(abs(v116) < 2147483648.0f)) { vkf_failed = true; }
let v117 = i32(v116);
let v118 = read_params(23i);
let v119 = read_params(22i);
let v120 = v111;
let v121 = v113;
let v122 = v115;
let v123 = v117;
let v124 = v118;
let v125 = v119;
let v126 = v120;
return fn2(v121,v122,v123,v124,v125,v126);
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
