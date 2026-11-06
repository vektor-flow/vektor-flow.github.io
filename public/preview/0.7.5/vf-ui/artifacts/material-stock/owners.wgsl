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
fn fn3(v77:f32)->bool {
let v78 = v77;
let v79 = -1i;
var v82 = (v78>=f32(v79));
if (v82) {
let v80 = v77;
let v81 = 16777215.0f;
v82 = (v80<=v81);
}
var v87 = v82;
if (v87) {
let v83 = v77;
let v84 = v77;
if (!(abs(v84) < 2147483648.0f)) { vkf_failed = true; }
let v85 = i32(v84);
let v86 = f32(v85);
v87 = (v83==v86);
}
return v87;
}
fn fn2(v5:i32)->i32 {
let v6 = i32(arrayLength(&params));
let v7 = 26i;
if (!((v6==v7))) { vkf_failed = true; }
let v8 = read_params(0i);
if (!(abs(v8) < 2147483648.0f)) { vkf_failed = true; }
var v9: i32 = i32(v8);
let v10 = read_params(1i);
if (!(abs(v10) < 2147483648.0f)) { vkf_failed = true; }
var v11: i32 = i32(v10);
let v12 = read_params(2i);
if (!(abs(v12) < 2147483648.0f)) { vkf_failed = true; }
var v13: i32 = i32(v12);
let v14 = v9;
let v15 = v11;
let v16 = (v14*v15);
let v17 = v13;
var v18: i32 = (v16*v17);
let v19 = v9;
let v20 = 4i;
var v23 = (v19>=v20);
if (v23) {
let v21 = v11;
let v22 = 4i;
v23 = (v21>=v22);
}
var v26 = v23;
if (v26) {
let v24 = v13;
let v25 = 4i;
v26 = (v24>=v25);
}
var v29 = v26;
if (v29) {
let v27 = v18;
let v28 = 131072i;
v29 = (v27<=v28);
}
var v33 = v29;
if (v33) {
let v30 = read_params(0i);
let v31 = v9;
let v32 = f32(v31);
v33 = (v30==v32);
}
var v37 = v33;
if (v37) {
let v34 = read_params(1i);
let v35 = v11;
let v36 = f32(v35);
v37 = (v34==v36);
}
var v41 = v37;
if (v41) {
let v38 = read_params(2i);
let v39 = v13;
let v40 = f32(v39);
v41 = (v38==v40);
}
if (!(v41)) { vkf_failed = true; }
let v42 = read_params(3i);
let v43 = 0i;
var v46 = (v42>f32(v43));
if (v46) {
let v44 = read_params(4i);
let v45 = 0i;
v46 = (v44>f32(v45));
}
var v49 = v46;
if (v49) {
let v47 = read_params(5i);
let v48 = 0i;
v49 = (v47>f32(v48));
}
var v52 = v49;
if (v52) {
let v50 = abs(read_params(3i));
let v51 = 1e+10f;
v52 = (v50<v51);
}
var v55 = v52;
if (v55) {
let v53 = abs(read_params(4i));
let v54 = 1e+10f;
v55 = (v53<v54);
}
var v58 = v55;
if (v58) {
let v56 = abs(read_params(5i));
let v57 = 1e+10f;
v58 = (v56<v57);
}
if (!(v58)) { vkf_failed = true; }
let v59 = read_params(24i);
if (!(abs(v59) < 2147483648.0f)) { vkf_failed = true; }
var v60: i32 = i32(v59);
let v61 = v60;
let v62 = 0i;
var v65 = (v61>v62);
if (v65) {
let v63 = v60;
let v64 = 131072i;
v65 = (v63<=v64);
}
var v69 = v65;
if (v69) {
let v66 = read_params(24i);
let v67 = v60;
let v68 = f32(v67);
v69 = (v66==v68);
}
var v72 = v69;
if (v72) {
let v70 = v5;
let v71 = 0i;
v72 = (v70>=v71);
}
var v75 = v72;
if (v75) {
let v73 = v5;
let v74 = v60;
v75 = (v73<v74);
}
var v88 = v75;
if (v88) {
let v76 = read_params(25i);
v88 = fn3(v76);
}
var v91 = v88;
if (v91) {
let v89 = read_params(25i);
let v90 = 0i;
v91 = (v89>=f32(v90));
}
var v100 = v91;
if (v100) {
let v92 = i32(arrayLength(&values));
let v93 = 7i;
let v94 = v18;
let v95 = (v93*v94);
let v96 = 22i;
let v97 = v60;
let v98 = (v96*v97);
let v99 = (v95+v98);
v100 = (v92==v99);
}
if (!(v100)) { vkf_failed = true; }
return v18;
}
fn fn4(v104:i32,v105:i32)->bool {
let v106 = read_params(24i);
if (!(abs(v106) < 2147483648.0f)) { vkf_failed = true; }
var v107: i32 = i32(v106);
let v108 = 7i;
let v109 = v105;
let v110 = (v108*v109);
let v111 = 20i;
let v112 = v104;
let v113 = (v111*v112);
var v114: i32 = (v110+v113);
let v115 = 7i;
let v116 = v105;
let v117 = (v115*v116);
let v118 = 20i;
let v119 = v107;
let v120 = (v118*v119);
let v121 = (v117+v120);
let v122 = v104;
var v123: f32 = read_values((v121+v122));
let v124 = v123;
var v134 = fn3(v124);
if (v134) {
let v125 = v114;
let v126 = 16i;
let v127 = read_values((v125+v126));
let v128 = 0i;
var v133 = (v127==f32(v128));
if (!v133) {
let v129 = v114;
let v130 = 16i;
let v131 = read_values((v129+v130));
let v132 = 1i;
v133 = (v131==f32(v132));
}
v134 = v133;
}
if (!(v134)) { vkf_failed = true; }
let v135 = v114;
let v136 = 16i;
let v137 = read_values((v135+v136));
let v138 = 0i;
var v141 = (v137==f32(v138));
if (v141) {
let v139 = v123;
let v140 = read_params(25i);
v141 = (v139==v140);
}
return v141;
}
fn fn1(v3:i32)->f32 {
let v4 = v3;
var v101: i32 = fn2(v4);
let v102 = v3;
let v103 = v101;
if (fn4(v102,v103)) {
return -1.0f;
}
let v142 = 7i;
let v143 = v101;
let v144 = (v142*v143);
let v145 = 20i;
let v146 = read_params(24i);
if (!(abs(v146) < 2147483648.0f)) { vkf_failed = true; }
let v147 = i32(v146);
let v148 = (v145*v147);
let v149 = (v144+v148);
let v150 = v3;
return read_values((v149+v150));
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
