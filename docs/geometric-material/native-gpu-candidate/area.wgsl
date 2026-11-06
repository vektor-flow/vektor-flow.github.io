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
fn fn4(v155:f32,v156:f32,v157:f32)->f32 {
let v158 = v156;
let v159 = v156;
let v160 = v155;
let v161 = (v159-v160);
if (v161 == 0.0f) { vkf_failed = true; }
var v162: f32 = (v158/v161);
let v163 = v157;
let v164 = v157;
let v165 = v155;
let v166 = (v164-v165);
if (v166 == 0.0f) { vkf_failed = true; }
var v167: f32 = (v163/v166);
let v168 = v162;
let v169 = v167;
let v170 = (v168+v169);
let v171 = v162;
let v172 = v167;
let v173 = (v171*v172);
var v174: f32 = (v170-v173);
let v175 = v174;
let v176 = 1i;
if ((v175>f32(v176))) {
return 1.0f;
}
let v177 = v174;
let v178 = 0i;
if ((v177<f32(v178))) {
return 0.0f;
}
return v174;
}
fn fn3(v77:f32,v78:f32,v79:f32)->f32 {
let v80 = v77;
let v81 = 0i;
var v84 = (v80>=f32(v81));
if (v84) {
let v82 = v78;
let v83 = 0i;
v84 = (v82>=f32(v83));
}
var v87 = v84;
if (v87) {
let v85 = v79;
let v86 = 0i;
v87 = (v85>=f32(v86));
}
if (v87) {
return 1.0f;
}
let v88 = v77;
let v89 = 0i;
var v92 = (v88<f32(v89));
if (v92) {
let v90 = v78;
let v91 = 0i;
v92 = (v90<f32(v91));
}
var v95 = v92;
if (v95) {
let v93 = v79;
let v94 = 0i;
v95 = (v93<f32(v94));
}
if (v95) {
return 0.0f;
}
let v96 = v77;
let v97 = 0i;
var v100 = (v96>=f32(v97));
if (v100) {
let v98 = v78;
let v99 = 0i;
v100 = (v98<f32(v99));
}
var v103 = v100;
if (v103) {
let v101 = v79;
let v102 = 0i;
v103 = (v101<f32(v102));
}
if (v103) {
let v104 = v77;
let v105 = v77;
let v106 = v78;
let v107 = (v105-v106);
if (v107 == 0.0f) { vkf_failed = true; }
let v108 = (v104/v107);
let v109 = v77;
let v110 = v77;
let v111 = v79;
let v112 = (v110-v111);
if (v112 == 0.0f) { vkf_failed = true; }
let v113 = (v109/v112);
return (v108*v113);
}
let v114 = v78;
let v115 = 0i;
var v118 = (v114>=f32(v115));
if (v118) {
let v116 = v77;
let v117 = 0i;
v118 = (v116<f32(v117));
}
var v121 = v118;
if (v121) {
let v119 = v79;
let v120 = 0i;
v121 = (v119<f32(v120));
}
if (v121) {
let v122 = v78;
let v123 = v78;
let v124 = v77;
let v125 = (v123-v124);
if (v125 == 0.0f) { vkf_failed = true; }
let v126 = (v122/v125);
let v127 = v78;
let v128 = v78;
let v129 = v79;
let v130 = (v128-v129);
if (v130 == 0.0f) { vkf_failed = true; }
let v131 = (v127/v130);
return (v126*v131);
}
let v132 = v79;
let v133 = 0i;
var v136 = (v132>=f32(v133));
if (v136) {
let v134 = v77;
let v135 = 0i;
v136 = (v134<f32(v135));
}
var v139 = v136;
if (v139) {
let v137 = v78;
let v138 = 0i;
v139 = (v137<f32(v138));
}
if (v139) {
let v140 = v79;
let v141 = v79;
let v142 = v77;
let v143 = (v141-v142);
if (v143 == 0.0f) { vkf_failed = true; }
let v144 = (v140/v143);
let v145 = v79;
let v146 = v79;
let v147 = v78;
let v148 = (v146-v147);
if (v148 == 0.0f) { vkf_failed = true; }
let v149 = (v145/v148);
return (v144*v149);
}
let v150 = v77;
let v151 = 0i;
if ((v150<f32(v151))) {
let v152 = v77;
let v153 = v78;
let v154 = v79;
return fn4(v152,v153,v154);
}
let v179 = v78;
let v180 = 0i;
if ((v179<f32(v180))) {
let v181 = v78;
let v182 = v77;
let v183 = v79;
return fn4(v181,v182,v183);
}
let v184 = v79;
let v185 = v77;
let v186 = v78;
return fn4(v184,v185,v186);
}
fn fn2(v70:f32,v71:f32,v72:f32,v73:f32)->f32 {
let v74 = v70;
let v75 = v71;
let v76 = v73;
let v187 = fn3(v74,v75,v76);
let v188 = v70;
let v189 = v73;
let v190 = v72;
let v191 = fn3(v188,v189,v190);
let v192 = (v187+v191);
let v193 = 2i;
if (f32(v193) == 0.0f) { vkf_failed = true; }
return (v192/f32(v193));
}
fn fn1(v3:i32)->f32 {
let v4 = read_params(1i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = read_params(2i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = v3;
let v9 = v7;
var v10: i32 = (v8*v9);
let v11 = 2i;
let v12 = v10;
let v13 = 2i;
let v14 = read_values((v12+v13));
let v15 = (f32(v11)*v14);
let v16 = v5;
let v17 = 1i;
let v18 = (v16-v17);
let v19 = f32(v18);
if (v19 == 0.0f) { vkf_failed = true; }
var v20: f32 = (v15/v19);
let v21 = 2i;
let v22 = v10;
let v23 = 3i;
let v24 = read_values((v22+v23));
let v25 = (f32(v21)*v24);
let v26 = v5;
let v27 = 1i;
let v28 = (v26-v27);
let v29 = f32(v28);
if (v29 == 0.0f) { vkf_failed = true; }
var v30: f32 = (v25/v29);
var v31: f32 = 0.0f;
var v32: i32 = 0i;
loop {
let v33 = v32;
let v34 = v5;
let v35 = 1i;
let v36 = (v34-v35);
let v37 = v5;
let v38 = 1i;
let v39 = (v37-v38);
let v40 = (v36*v39);
if (!((v33<v40))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v41 = v10;
let v42 = 4i;
let v43 = (v41+v42);
let v44 = v32;
let v45 = v5;
let v46 = 1i;
let v47 = (v45-v46);
if (f32(v47) == 0.0f) { vkf_failed = true; }
let v48 = floor(f32(v44)/f32(v47));
let v49 = v5;
let v50 = (v48*f32(v49));
let v51 = (f32(v43)+v50);
let v52 = v32;
let v53 = v5;
let v54 = 1i;
let v55 = (v53-v54);
if (v55 == 0i) { vkf_failed = true; }
let v56 = (v52%v55);
var v57: i32 = i32((v51+f32(v56)));
let v58 = read_values(v57);
let v59 = v57;
let v60 = 1i;
let v61 = read_values((v59+v60));
let v62 = v57;
let v63 = v5;
let v64 = read_values((v62+v63));
let v65 = v57;
let v66 = v5;
let v67 = (v65+v66);
let v68 = 1i;
let v69 = read_values((v67+v68));
var v194: f32 = fn2(v58,v61,v64,v69);
let v195 = v31;
let v196 = v194;
let v197 = v20;
let v198 = (v196*v197);
let v199 = v30;
let v200 = (v198*v199);
v31 = (v195+v200);
let v201 = v32;
let v202 = 1i;
v32 = (v201+v202);
}
let v203 = v31;
let v204 = 0i;
var v207 = (v203>f32(v204));
if (v207) {
let v205 = abs(v31);
let v206 = 1e+10f;
v207 = (v205<v206);
}
if (!(v207)) { vkf_failed = true; }
return v31;
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
