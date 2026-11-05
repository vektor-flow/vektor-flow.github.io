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
fn fn2(v10:i32,v11:i32,v12:i32)->i32 {
let v13 = v11;
let v14 = v12;
if (f32(v14) == 0.0f) { vkf_failed = true; }
var v15: i32 = i32(floor(f32(v13)/f32(v14)));
let v16 = v11;
let v17 = v12;
if (v17 == 0i) { vkf_failed = true; }
var v18: i32 = (v16%v17);
let v19 = v18;
let v20 = v15;
let v21 = 1i;
let v22 = (v20+v21);
var v23: i32 = (v19*v22);
let v24 = v10;
let v25 = v23;
if ((v24<v25)) {
let v26 = v10;
let v27 = v15;
let v28 = 1i;
let v29 = (v27+v28);
if (f32(v29) == 0.0f) { vkf_failed = true; }
return i32(floor(f32(v26)/f32(v29)));
}
let v30 = v18;
let v31 = v10;
let v32 = v23;
let v33 = (v31-v32);
let v34 = v15;
if (f32(v34) == 0.0f) { vkf_failed = true; }
let v35 = floor(f32(v33)/f32(v34));
return i32((f32(v30)+v35));
}
fn fn1(v3:i32)->array<f32,66> {
let v4 = read_params(24i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = v3;
let v7 = read_params(10i);
if (!(abs(v7) < 2147483648.0f)) { vkf_failed = true; }
let v8 = i32(v7);
let v9 = v5;
var v36: i32 = fn2(v6,v8,v9);
let v37 = i32(arrayLength(&values));
let v38 = 82i;
let v39 = v5;
let v40 = (v38*v39);
if (!((v37==v40))) { vkf_failed = true; }
let v41 = f32(0i);
let v42 = f32(0i);
let v43 = f32(0i);
let v44 = f32(0i);
let v45 = f32(0i);
let v46 = f32(0i);
let v47 = f32(0i);
let v48 = f32(0i);
let v49 = f32(0i);
let v50 = f32(0i);
let v51 = f32(0i);
let v52 = f32(0i);
let v53 = f32(0i);
let v54 = f32(0i);
let v55 = f32(0i);
let v56 = f32(0i);
let v57 = f32(0i);
let v58 = f32(0i);
let v59 = f32(0i);
let v60 = f32(0i);
let v61 = f32(0i);
let v62 = f32(0i);
let v63 = f32(0i);
let v64 = f32(0i);
let v65 = f32(0i);
let v66 = f32(0i);
let v67 = f32(0i);
let v68 = f32(0i);
let v69 = f32(0i);
let v70 = f32(0i);
let v71 = f32(0i);
let v72 = f32(0i);
let v73 = f32(0i);
let v74 = f32(0i);
let v75 = f32(0i);
let v76 = f32(0i);
let v77 = f32(0i);
let v78 = f32(0i);
let v79 = f32(0i);
let v80 = f32(0i);
let v81 = f32(0i);
let v82 = f32(0i);
let v83 = f32(0i);
let v84 = f32(0i);
let v85 = f32(0i);
let v86 = f32(0i);
let v87 = f32(0i);
let v88 = f32(0i);
let v89 = f32(0i);
let v90 = f32(0i);
let v91 = f32(0i);
let v92 = f32(0i);
let v93 = f32(0i);
let v94 = f32(0i);
let v95 = f32(0i);
let v96 = f32(0i);
let v97 = f32(0i);
let v98 = f32(0i);
let v99 = f32(0i);
let v100 = f32(0i);
let v101 = f32(0i);
let v102 = f32(0i);
let v103 = f32(0i);
let v104 = f32(0i);
let v105 = f32(0i);
let v106 = f32(0i);
var v107: array<f32,66> = array<f32,66>(v41,v42,v43,v44,v45,v46,v47,v48,v49,v50,v51,v52,v53,v54,v55,v56,v57,v58,v59,v60,v61,v62,v63,v64,v65,v66,v67,v68,v69,v70,v71,v72,v73,v74,v75,v76,v77,v78,v79,v80,v81,v82,v83,v84,v85,v86,v87,v88,v89,v90,v91,v92,v93,v94,v95,v96,v97,v98,v99,v100,v101,v102,v103,v104,v105,v106);
let v108 = 16i;
let v109 = v36;
let v110 = (v108*v109);
let v111 = 11i;
let v112 = read_values((v110+v111));
let v113 = 0i;
var v120 = (v112<f32(v113));
if (!v120) {
let v114 = 16i;
let v115 = v36;
let v116 = (v114*v115);
let v117 = 15i;
let v118 = read_values((v116+v117));
let v119 = 0.5f;
v120 = (v118>v119);
}
var v121: bool = v120;
if ((!v121)) {
var v122: i32 = 0i;
loop {
let v123 = v122;
let v124 = 66i;
if (!((v123<v124))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v125 = v122;
let v126 = 16i;
let v127 = v5;
let v128 = (v126*v127);
let v129 = 66i;
let v130 = v36;
let v131 = (v129*v130);
let v132 = (v128+v131);
let v133 = v122;
if (v125<0i || v125>=66i) { vkf_failed=true; } else { v107[u32(v125)]=read_values((v132+v133)); }
let v134 = v122;
let v135 = 1i;
v122 = (v134+v135);
}
return v107;
}
var v136: i32 = 1i;
loop {
let v137 = v136;
let v138 = 32i;
if (!((v137<=v138))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v139 = 16i;
let v140 = v5;
let v141 = (v139*v140);
let v142 = 66i;
let v143 = v36;
let v144 = (v142*v143);
let v145 = (v141+v144);
let v146 = 2i;
let v147 = v136;
let v148 = 1i;
let v149 = (v147-v148);
let v150 = (v146*v149);
var v151: f32 = read_values((v145+v150));
let v152 = 16i;
let v153 = v5;
let v154 = (v152*v153);
let v155 = 66i;
let v156 = v36;
let v157 = (v155*v156);
let v158 = (v154+v157);
let v159 = 2i;
let v160 = v136;
let v161 = 1i;
let v162 = (v160-v161);
let v163 = (v159*v162);
let v164 = (v158+v163);
let v165 = 1i;
var v166: f32 = read_values((v164+v165));
let v167 = v151;
let v168 = 0i;
var v171 = (v167>=f32(v168));
if (v171) {
let v169 = v151;
let v170 = 65535i;
v171 = (v169<=f32(v170));
}
var v174 = v171;
if (v174) {
let v172 = v166;
let v173 = 0i;
v174 = (v172>=f32(v173));
}
var v177 = v174;
if (v177) {
let v175 = v166;
let v176 = 65535i;
v177 = (v175<=f32(v176));
}
if (!(v177)) { vkf_failed = true; }
let v178 = 2i;
let v179 = v136;
let v180 = (v178*v179);
let v181 = 2i;
let v182 = v136;
let v183 = (v181*v182);
let v184 = 2i;
let v185 = (v183-v184);
if (v185<0i || v185>=66i) { vkf_failed=true; }
let v186 = v107[u32(clamp(v185,0i,66i-1i))];
let v187 = v151;
let v188 = 65535i;
if (f32(v188) == 0.0f) { vkf_failed = true; }
let v189 = (v187/f32(v188));
let v190 = 0.5f;
let v191 = (v189-v190);
let v192 = 0.866025388f;
let v193 = (v191*v192);
if (v180<0i || v180>=66i) { vkf_failed=true; } else { v107[u32(v180)]=(v186+v193); }
let v194 = 2i;
let v195 = v136;
let v196 = (v194*v195);
let v197 = 1i;
let v198 = (v196+v197);
let v199 = 2i;
let v200 = v136;
let v201 = (v199*v200);
let v202 = 1i;
let v203 = (v201-v202);
if (v203<0i || v203>=66i) { vkf_failed=true; }
let v204 = v107[u32(clamp(v203,0i,66i-1i))];
let v205 = v166;
let v206 = 65535i;
if (f32(v206) == 0.0f) { vkf_failed = true; }
let v207 = (v205/f32(v206));
let v208 = 0.5f;
let v209 = (v207-v208);
let v210 = 0.866025388f;
let v211 = (v209*v210);
if (v198<0i || v198>=66i) { vkf_failed=true; } else { v107[u32(v198)]=(v204+v211); }
let v212 = v136;
let v213 = 1i;
v136 = (v212+v213);
}
return v107;
}
fn fn0(v1:i32)->array<f32,66> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/66u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<66u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<66u;i+=1u){results[gid.x*66u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/66u)],1u);}
}
