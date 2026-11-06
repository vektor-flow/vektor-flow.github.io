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
let v77 = 3i;
let v78 = v76;
let v79 = (v77*v78);
let v80 = 1023i;
let v81 = (v79+v80);
let v82 = 1024i;
if (f32(v82) == 0.0f) { vkf_failed = true; }
var v83: i32 = i32(floor(f32(v81)/f32(v82)));
let v84 = v3;
let v85 = 0i;
var v88 = (v84>=v85);
if (v88) {
let v86 = v3;
let v87 = v83;
v88 = (v86<v87);
}
var v93 = v88;
if (v93) {
let v89 = i32(arrayLength(&values));
let v90 = 3i;
let v91 = v76;
let v92 = (v90*v91);
v93 = (v89==v92);
}
if (!(v93)) { vkf_failed = true; }
let v94 = v3;
let v95 = 1i;
let v96 = (v94+v95);
let v97 = 1024i;
var v98: i32 = (v96*v97);
let v99 = v98;
let v100 = 3i;
let v101 = v76;
let v102 = (v100*v101);
if ((v99>v102)) {
let v103 = 3i;
let v104 = v76;
v98 = (v103*v104);
}
var v105: f32 = 0.0f;
var v106: f32 = 0.0f;
let v107 = v3;
let v108 = 1024i;
var v109: i32 = (v107*v108);
loop {
let v110 = v109;
let v111 = v98;
if (!((v110<v111))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v112: f32 = read_values(v109);
let v113 = v112;
let v114 = -1000000i;
var v117 = (v113>f32(v114));
if (v117) {
let v115 = v112;
let v116 = 1000000i;
v117 = (v115<f32(v116));
}
if (!(v117)) { vkf_failed = true; }
let v118 = v112;
let v119 = v112;
let v120 = (v118*v119);
let v121 = v106;
var v122: f32 = (v120-v121);
let v123 = v105;
let v124 = v122;
var v125: f32 = (v123+v124);
let v126 = v125;
let v127 = v105;
let v128 = (v126-v127);
let v129 = v122;
v106 = (v128-v129);
v105 = v125;
let v130 = v109;
let v131 = 1i;
v109 = (v130+v131);
}
return v105;
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
