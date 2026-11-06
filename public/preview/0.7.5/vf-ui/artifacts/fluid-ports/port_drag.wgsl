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
fn fn4(v84:f32)->f32 {
let v85 = v84;
let v86 = -1.00000002e+30f;
var v89 = (v85>v86);
if (v89) {
let v87 = v84;
let v88 = 1.00000002e+30f;
v89 = (v87<v88);
}
if (!(v89)) { vkf_failed = true; }
return v84;
}
fn fn3(v82:f32)->f32 {
let v83 = v82;
var v90: f32 = fn4(v83);
let v91 = v90;
let v92 = 0i;
if (!((v91>=f32(v92)))) { vkf_failed = true; }
return v90;
}
fn fn5(v103:i32,v104:i32)->i32 {
let v105 = read_params(0i);
if (!(abs(v105) < 2147483648.0f)) { vkf_failed = true; }
var v106: i32 = i32(v105);
let v107 = read_params(1i);
if (!(abs(v107) < 2147483648.0f)) { vkf_failed = true; }
var v108: i32 = i32(v107);
let v109 = read_params(2i);
if (!(abs(v109) < 2147483648.0f)) { vkf_failed = true; }
var v110: i32 = i32(v109);
let v111 = v104;
let v112 = 0i;
if ((v111==v112)) {
let v113 = v103;
let v114 = v106;
if (v114 == 0i) { vkf_failed = true; }
let v115 = (v113%v114);
let v116 = v106;
let v117 = (v115+v116);
let v118 = 1i;
let v119 = (v117-v118);
let v120 = v106;
if (v120 == 0i) { vkf_failed = true; }
let v121 = (v119%v120);
let v122 = v106;
let v123 = v103;
let v124 = v106;
if (f32(v124) == 0.0f) { vkf_failed = true; }
let v125 = floor(f32(v123)/f32(v124));
let v126 = (f32(v122)*v125);
return i32((f32(v121)+v126));
}
let v127 = v104;
let v128 = 1i;
if ((v127==v128)) {
let v129 = v103;
let v130 = v106;
if (v130 == 0i) { vkf_failed = true; }
let v131 = (v129%v130);
let v132 = v106;
let v133 = v103;
let v134 = v106;
if (f32(v134) == 0.0f) { vkf_failed = true; }
let v135 = floor(f32(v133)/f32(v134));
let v136 = v108;
let v137 = (v135+f32(v136));
let v138 = 1i;
let v139 = (v137-f32(v138));
let v140 = v108;
if (f32(v140) == 0.0f) { vkf_failed = true; }
let v141 = (v139%f32(v140));
let v142 = v108;
let v143 = v103;
let v144 = v106;
let v145 = v108;
let v146 = (v144*v145);
if (f32(v146) == 0.0f) { vkf_failed = true; }
let v147 = floor(f32(v143)/f32(v146));
let v148 = (f32(v142)*v147);
let v149 = (v141+v148);
let v150 = (f32(v132)*v149);
return i32((f32(v131)+v150));
}
let v151 = v103;
let v152 = v106;
let v153 = v108;
let v154 = (v152*v153);
if (v154 == 0i) { vkf_failed = true; }
let v155 = (v151%v154);
let v156 = v106;
let v157 = v108;
let v158 = (v156*v157);
let v159 = v103;
let v160 = v106;
let v161 = v108;
let v162 = (v160*v161);
if (f32(v162) == 0.0f) { vkf_failed = true; }
let v163 = floor(f32(v159)/f32(v162));
let v164 = v110;
let v165 = (v163+f32(v164));
let v166 = 1i;
let v167 = (v165-f32(v166));
let v168 = v110;
if (f32(v168) == 0.0f) { vkf_failed = true; }
let v169 = (v167%f32(v168));
let v170 = (f32(v158)*v169);
return i32((f32(v155)+v170));
}
fn fn1(v3:i32)->f32 {
var v56: i32 = fn2();
let v57 = i32(arrayLength(&values));
let v58 = 20i;
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
let v69 = v3;
let v70 = v56;
if (v70 == 0i) { vkf_failed = true; }
var v71: i32 = (v69%v70);
let v72 = v3;
let v73 = v56;
if (f32(v73) == 0.0f) { vkf_failed = true; }
var v74: i32 = i32(floor(f32(v72)/f32(v73)));
let v75 = 14i;
let v76 = v56;
let v77 = (v75*v76);
let v78 = 6i;
let v79 = v71;
let v80 = (v78*v79);
let v81 = read_values((v77+v80));
var v93: f32 = fn3(v81);
let v94 = v74;
let v95 = 3i;
if ((v94<v95)) {
let v96 = v93;
let v97 = 14i;
let v98 = v56;
let v99 = (v97*v98);
let v100 = 6i;
let v101 = v71;
let v102 = v74;
let v171 = fn5(v101,v102);
let v172 = (v100*v171);
let v173 = read_values((v99+v172));
let v174 = fn3(v173);
let v175 = (v96+v174);
let v176 = 2i;
if (f32(v176) == 0.0f) { vkf_failed = true; }
v93 = (v175/f32(v176));
}
let v177 = 7i;
let v178 = v56;
let v179 = (v177*v178);
let v180 = v3;
let v181 = read_values((v179+v180));
let v182 = fn4(v181);
let v183 = v93;
let v184 = read_values(v3);
let v185 = fn4(v184);
let v186 = (v183*v185);
let v187 = (v182-v186);
return fn4(v187);
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
