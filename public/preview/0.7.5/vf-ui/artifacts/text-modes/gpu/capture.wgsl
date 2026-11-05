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
fn fn1(v3:i32)->array<f32,16> {
let v4 = read_params(10i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = read_params(11i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = v3;
let v9 = v7;
if (v9 == 0i) { vkf_failed = true; }
var v10: i32 = (v8%v9);
let v11 = v3;
let v12 = v7;
if (f32(v12) == 0.0f) { vkf_failed = true; }
var v13: i32 = i32(floor(f32(v11)/f32(v12)));
let v14 = i32(arrayLength(&values));
let v15 = 16i;
let v16 = v5;
let v17 = (v15*v16);
let v18 = 7i;
let v19 = v7;
let v20 = (v18*v19);
let v21 = (v17+v20);
if (!((v14==v21))) { vkf_failed = true; }
var v22: f32 = 0.0f;
var v23: f32 = 0.0f;
var v24: f32 = 0.0f;
var v25: f32 = 0.0f;
var v26: f32 = 0.0f;
var v27: f32 = 0.0f;
var v28: f32 = 0.0f;
var v29: f32 = 0.0f;
var v30: f32 = 0.0f;
var v31: f32 = 0.0f;
var v32: f32 = 0.0f;
let v33 = v13;
let v34 = 65536i;
var v35: i32 = (v33*v34);
var v36: i32 = v5;
let v37 = v36;
let v38 = v13;
let v39 = 1i;
let v40 = (v38+v39);
let v41 = 65536i;
let v42 = (v40*v41);
if ((v37>v42)) {
let v43 = v13;
let v44 = 1i;
let v45 = (v43+v44);
let v46 = 65536i;
v36 = (v45*v46);
}
loop {
let v47 = v35;
let v48 = v36;
if (!((v47<v48))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v49 = 16i;
let v50 = v35;
let v51 = (v49*v50);
let v52 = 9i;
let v53 = read_values((v51+v52));
if (!(abs(v53) < 2147483648.0f)) { vkf_failed = true; }
let v54 = i32(v53);
let v55 = v10;
if ((v54==v55)) {
let v56 = 16i;
let v57 = v35;
let v58 = (v56*v57);
let v59 = 7i;
var v60: f32 = read_values((v58+v59));
let v61 = 16i;
let v62 = v35;
let v63 = (v61*v62);
let v64 = 8i;
var v65: f32 = read_values((v63+v64));
let v66 = 16i;
let v67 = v35;
let v68 = (v66*v67);
let v69 = 11i;
var v70: f32 = read_values((v68+v69));
let v71 = 16i;
let v72 = v35;
let v73 = (v71*v72);
let v74 = 14i;
var v75: f32 = read_values((v73+v74));
let v76 = v24;
let v77 = v60;
v24 = (v76+v77);
let v78 = v31;
let v79 = v60;
let v80 = 1i;
let v81 = v75;
let v82 = (f32(v80)-v81);
let v83 = (v79*v82);
v31 = (v78+v83);
let v84 = v22;
let v85 = v60;
let v86 = v75;
let v87 = (v85*v86);
let v88 = 1i;
let v89 = v65;
let v90 = (f32(v88)-v89);
let v91 = (v87*v90);
v22 = (v84+v91);
let v92 = v23;
let v93 = v60;
let v94 = v75;
let v95 = (v93*v94);
let v96 = v65;
let v97 = (v95*v96);
v23 = (v92+v97);
let v98 = v25;
let v99 = 16i;
let v100 = v35;
let v101 = (v99*v100);
let v102 = 2i;
let v103 = read_values((v101+v102));
let v104 = 16i;
let v105 = v35;
let v106 = (v104*v105);
let v107 = 3i;
let v108 = read_values((v106+v107));
let v109 = 2i;
let v110 = vkf_powi(v108,v109);
let v111 = (v103*v110);
v25 = (v98+v111);
let v112 = v26;
let v113 = v70;
v26 = (v112+v113);
let v114 = v32;
let v115 = v70;
let v116 = 1i;
let v117 = v75;
let v118 = (f32(v116)-v117);
let v119 = (v115*v118);
v32 = (v114+v119);
let v120 = v27;
let v121 = v70;
let v122 = v75;
let v123 = (v121*v122);
let v124 = 1i;
let v125 = v65;
let v126 = (f32(v124)-v125);
let v127 = (v123*v126);
v27 = (v120+v127);
let v128 = v28;
let v129 = v70;
let v130 = v75;
let v131 = (v129*v130);
let v132 = v65;
let v133 = (v131*v132);
v28 = (v128+v133);
let v134 = v29;
let v135 = 16i;
let v136 = v35;
let v137 = (v135*v136);
let v138 = 12i;
let v139 = read_values((v137+v138));
v29 = (v134+v139);
let v140 = v30;
let v141 = 16i;
let v142 = v35;
let v143 = (v141*v142);
let v144 = 13i;
let v145 = read_values((v143+v144));
v30 = (v140+v145);
}
let v146 = v35;
let v147 = 1i;
v35 = (v146+v147);
}
var v148: f32 = 0.0f;
let v149 = v24;
let v150 = 0i;
if ((v149>f32(v150))) {
let v151 = v23;
let v152 = v24;
if (v152 == 0.0f) { vkf_failed = true; }
let v153 = (v151/v152);
let v154 = 16i;
let v155 = v5;
let v156 = (v154*v155);
let v157 = 7i;
let v158 = v10;
let v159 = (v157*v158);
let v160 = (v156+v159);
let v161 = 6i;
let v162 = read_values((v160+v161));
v148 = (v153*v162);
}
let v163 = v148;
let v164 = f32(1i);
let v165 = 16i;
let v166 = v5;
let v167 = (v165*v166);
let v168 = 7i;
let v169 = v10;
let v170 = (v168*v169);
let v171 = (v167+v170);
let v172 = 3i;
let v173 = read_values((v171+v172));
let v174 = 16i;
let v175 = v5;
let v176 = (v174*v175);
let v177 = 7i;
let v178 = v10;
let v179 = (v177*v178);
let v180 = (v176+v179);
let v181 = 4i;
let v182 = read_values((v180+v181));
let v183 = 16i;
let v184 = v5;
let v185 = (v183*v184);
let v186 = 7i;
let v187 = v10;
let v188 = (v186*v187);
let v189 = (v185+v188);
let v190 = 5i;
let v191 = read_values((v189+v190));
let v192 = v22;
let v193 = v23;
let v194 = v24;
let v195 = v25;
let v196 = v26;
let v197 = v27;
let v198 = v28;
let v199 = v29;
let v200 = v30;
let v201 = v31;
let v202 = v32;
return array<f32,16>(v163,v164,v173,v182,v191,v192,v193,v194,v195,v196,v197,v198,v199,v200,v201,v202);
}
fn fn0(v1:i32)->array<f32,16> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/16u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<16u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<16u;i+=1u){results[gid.x*16u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/16u)],1u);}
}
