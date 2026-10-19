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
fn fn3(v19:f32,v20:f32)->f32 {
let v21 = v19;
let v22 = v20;
if ((v21>v22)) {
return v19;
}
return v20;
}
fn fn4(v24:f32,v25:f32)->f32 {
let v26 = v24;
let v27 = v25;
if ((v26<v27)) {
return v24;
}
return v25;
}
fn fn2(v13:f32,v14:f32,v15:f32)->f32 {
let v16 = v15;
let v17 = v14;
let v18 = v13;
let v23 = fn3(v17,v18);
return fn4(v16,v23);
}
fn fn1(v6:f32,v7:f32)->f32 {
let v8 = v7;
let v9 = v6;
let v10 = (v8*v9);
let v11 = 0.0f;
let v12 = 1.57079637f;
var v28: f32 = fn2(v10,v11,v12);
let v29 = v28;
let v30 = 0i;
if ((v29<=f32(v30))) {
return 0.0f;
}
let v31 = v28;
let v32 = 1.57079637f;
if ((v31>=v32)) {
return 1.0f;
}
let v33 = v28;
let v34 = v28;
var v35: f32 = (v33*v34);
let v36 = v28;
let v37 = 1i;
let v38 = v35;
let v39 = -1.0f;
let v40 = 6i;
if (f32(v40) == 0.0f) { vkf_failed = true; }
let v41 = (v39/f32(v40));
let v42 = v35;
let v43 = 1.0f;
let v44 = 120i;
if (f32(v44) == 0.0f) { vkf_failed = true; }
let v45 = (v43/f32(v44));
let v46 = v35;
let v47 = -1.0f;
let v48 = 5040i;
if (f32(v48) == 0.0f) { vkf_failed = true; }
let v49 = (v47/f32(v48));
let v50 = v35;
let v51 = 1.0f;
let v52 = 362880i;
if (f32(v52) == 0.0f) { vkf_failed = true; }
let v53 = (v51/f32(v52));
let v54 = v35;
let v55 = -1.0f;
let v56 = 39916800i;
if (f32(v56) == 0.0f) { vkf_failed = true; }
let v57 = (v55/f32(v56));
let v58 = v35;
let v59 = 6.2270208e+09f;
if (v59 == 0.0f) { vkf_failed = true; }
let v60 = (v58/v59);
let v61 = (v57+v60);
let v62 = (v54*v61);
let v63 = (v53+v62);
let v64 = (v50*v63);
let v65 = (v49+v64);
let v66 = (v46*v65);
let v67 = (v45+v66);
let v68 = (v42*v67);
let v69 = (v41+v68);
let v70 = (v38*v69);
let v71 = (f32(v37)+v70);
var v72: f32 = (v36*v71);
let v73 = v72;
let v74 = v72;
return (v73*v74);
}
fn fn5(v79:f32,v80:f32)->f32 {
let v81 = v79;
let v82 = 0.0f;
let v83 = 1.0f;
let v84 = fn2(v81,v82,v83);
let v85 = 1i;
var v86: f32 = (v84-f32(v85));
let v87 = 1i;
let v88 = v80;
let v89 = 1i;
let v90 = (v88+f32(v89));
let v91 = v86;
let v92 = (v90*v91);
let v93 = v86;
let v94 = (v92*v93);
let v95 = v86;
let v96 = (v94*v95);
let v97 = (f32(v87)+v96);
let v98 = v80;
let v99 = v86;
let v100 = (v98*v99);
let v101 = v86;
let v102 = (v100*v101);
return (v97+v102);
}
fn fn6(v107:f32,v108:i32)->f32 {
let v109 = v108;
let v110 = 0i;
var v113 = (v109>=v110);
if (v113) {
let v111 = v108;
let v112 = 3i;
v113 = (v111<v112);
}
if (!(v113)) { vkf_failed = true; }
let v114 = 4.5f;
let v115 = v107;
let v116 = 0.800000012f;
if (v116 == 0.0f) { vkf_failed = true; }
let v117 = (v115/v116);
let v118 = 0.0f;
let v119 = 1.0f;
let v120 = fn2(v117,v118,v119);
var v121: f32 = (v114*v120);
let v122 = v108;
let v123 = 1i;
if ((v122==v123)) {
let v124 = v121;
let v125 = 4i;
v121 = (v124+f32(v125));
}
let v126 = v108;
let v127 = 2i;
if ((v126==v127)) {
let v128 = v121;
let v129 = 2i;
v121 = (v128+f32(v129));
}
let v130 = v121;
let v131 = 6i;
if ((v130>=f32(v131))) {
let v132 = v121;
let v133 = 6i;
v121 = (v132-f32(v133));
}
let v134 = v121;
let v135 = 3i;
let v136 = abs((v134-f32(v135)));
let v137 = 1i;
let v138 = (v136-f32(v137));
let v139 = 0.0f;
let v140 = 1.0f;
var v141: f32 = fn2(v138,v139,v140);
let v142 = v107;
let v143 = 0.800000012f;
let v144 = (v142-v143);
let v145 = 0.200000003f;
if (v145 == 0.0f) { vkf_failed = true; }
let v146 = (v144/v145);
let v147 = 0.0f;
let v148 = 1.0f;
var v149: f32 = fn2(v146,v147,v148);
let v150 = v149;
let v151 = v149;
let v152 = (v150*v151);
let v153 = 3i;
let v154 = 2i;
let v155 = v149;
let v156 = (f32(v154)*v155);
let v157 = (f32(v153)-v156);
var v158: f32 = (v152*v157);
let v159 = v141;
let v160 = 1i;
let v161 = v141;
let v162 = (f32(v160)-v161);
let v163 = v158;
let v164 = (v162*v163);
return (v159+v164);
}
fn fn0(v1:i32)->f32 {
let v2 = v1;
let v3 = 0i;
if ((v2==v3)) {
let v4 = read_params(0i);
let v5 = read_params(1i);
return fn1(v4,v5);
}
let v75 = v1;
let v76 = 1i;
if ((v75==v76)) {
let v77 = read_params(0i);
let v78 = read_params(1i);
return fn5(v77,v78);
}
let v103 = read_params(0i);
let v104 = v1;
let v105 = 2i;
let v106 = (v104-v105);
return fn6(v103,v106);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/1u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
if (!(abs(value)<=3.402823466e+38f)){vkf_failed=true;}
results[gid.x]=select(value,0.0f,vkf_failed);atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/1u)],1u);}
}
