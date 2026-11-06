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
fn fn3(v141:i32)->f32 {
let v142 = -1.0f;
let v143 = -1.0f;
let v144 = 1.0f;
let v145 = -0.902655125f;
let v146 = 0.620832026f;
let v147 = 0.0226690415f;
let v148 = 5.21548557f;
let v149 = 0.0f;
let v150 = -2.0f;
let v151 = -1.0f;
let v152 = -0.997480154f;
let v153 = 0.5430215f;
let v154 = -0.434417188f;
let v155 = 5.98222828f;
let v156 = 2.0f;
let v157 = 1.0f;
let v158 = 1.0f;
let v159 = -0.986352265f;
let v160 = -0.454399616f;
let v161 = 0.674935937f;
let v162 = 5.70417213f;
let v163 = 2.0f;
let v164 = -2.0f;
let v165 = 1.0f;
let v166 = -0.260235548f;
let v167 = 0.0654926002f;
let v168 = 0.182511851f;
let v169 = 4.77891493f;
let v170 = 2.0f;
let v171 = 1.0f;
let v172 = 0.0f;
let v173 = 0.0563000031f;
let v174 = -0.0703750029f;
let v175 = 0.0988564864f;
let v176 = 5.97888327f;
let v177 = 0.0f;
let v178 = 1.0f;
let v179 = -1.0f;
let v180 = -0.599876761f;
let v181 = 0.0287800953f;
let v182 = 0.0115120383f;
let v183 = 6.21408033f;
let v184 = 0.0f;
let v185 = 1.0f;
let v186 = -1.0f;
let v187 = 2.24904394f;
let v188 = 0.176140949f;
let v189 = 0.0704563856f;
let v190 = 2.50509477f;
let v191 = 1.0f;
let v192 = 1.0f;
let v193 = -1.0f;
let v194 = 0.774184585f;
let v195 = 0.738904059f;
let v196 = 0.489107788f;
let v197 = 5.62275648f;
let v198 = 1.0f;
let v199 = 2.0f;
let v200 = 0.0f;
let v201 = -0.848604023f;
let v202 = 0.265188754f;
let v203 = -0.714014769f;
let v204 = 5.431705f;
let v205 = 2.0f;
let v206 = 1.0f;
let v207 = 0.0f;
let v208 = -0.60304749f;
let v209 = 0.753809333f;
let v210 = -0.320029587f;
let v211 = 0.333391994f;
var v212: array<f32,70> = array<f32,70>(v142,v143,v144,v145,v146,v147,v148,v149,v150,v151,v152,v153,v154,v155,v156,v157,v158,v159,v160,v161,v162,v163,v164,v165,v166,v167,v168,v169,v170,v171,v172,v173,v174,v175,v176,v177,v178,v179,v180,v181,v182,v183,v184,v185,v186,v187,v188,v189,v190,v191,v192,v193,v194,v195,v196,v197,v198,v199,v200,v201,v202,v203,v204,v205,v206,v207,v208,v209,v210,v211);
let v213 = v141;
if (v213<0i || v213>=70i) { vkf_failed=true; }
return v212[u32(clamp(v213,0i,70i-1i))];
}
fn fn1(v3:i32)->f32 {
var v76: i32 = fn2();
let v77 = v3;
let v78 = 0i;
var v83 = (v77>=v78);
if (v83) {
let v79 = v3;
let v80 = 3i;
let v81 = v76;
let v82 = (v80*v81);
v83 = (v79<v82);
}
var v86 = v83;
if (v86) {
let v84 = i32(arrayLength(&values));
let v85 = 1i;
v86 = (v84==v85);
}
var v89 = v86;
if (v89) {
let v87 = read_values(0i);
let v88 = 881i;
v89 = (v87==f32(v88));
}
if (!(v89)) { vkf_failed = true; }
let v90 = v3;
let v91 = v76;
if (f32(v91) == 0.0f) { vkf_failed = true; }
var v92: i32 = i32(floor(f32(v90)/f32(v91)));
let v93 = v3;
let v94 = v76;
if (v94 == 0i) { vkf_failed = true; }
var v95: i32 = (v93%v94);
let v96 = read_params(0i);
if (!(abs(v96) < 2147483648.0f)) { vkf_failed = true; }
var v97: i32 = i32(v96);
let v98 = read_params(1i);
if (!(abs(v98) < 2147483648.0f)) { vkf_failed = true; }
var v99: i32 = i32(v98);
let v100 = v95;
let v101 = v97;
if (v101 == 0i) { vkf_failed = true; }
let v102 = (v100%v101);
let v103 = f32(v102);
let v104 = v95;
let v105 = v97;
if (f32(v105) == 0.0f) { vkf_failed = true; }
let v106 = floor(f32(v104)/f32(v105));
let v107 = v99;
if (f32(v107) == 0.0f) { vkf_failed = true; }
let v108 = (v106%f32(v107));
let v109 = v108;
let v110 = v95;
let v111 = v97;
let v112 = v99;
let v113 = (v111*v112);
if (f32(v113) == 0.0f) { vkf_failed = true; }
let v114 = floor(f32(v110)/f32(v113));
let v115 = v114;
var v116: array<f32,3> = array<f32,3>(v103,v109,v115);
var v117: i32 = 0i;
loop {
let v118 = v117;
let v119 = 3i;
if (!((v118<v119))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v120 = v117;
let v121 = v92;
if ((!(v120==v121))) {
let v122 = v117;
let v123 = v117;
if (v123<0i || v123>=3i) { vkf_failed=true; }
let v124 = v116[u32(clamp(v123,0i,3i-1i))];
let v125 = 0.5f;
if (v122<0i || v122>=3i) { vkf_failed=true; } else { v116[u32(v122)]=(v124+v125); }
}
let v126 = v117;
let v127 = v117;
if (v127<0i || v127>=3i) { vkf_failed=true; }
let v128 = v116[u32(clamp(v127,0i,3i-1i))];
let v129 = read_params(v117);
if (v129 == 0.0f) { vkf_failed = true; }
if (v126<0i || v126>=3i) { vkf_failed=true; } else { v116[u32(v126)]=(v128/v129); }
let v130 = v117;
let v131 = 1i;
v117 = (v130+v131);
}
var v132: f32 = 0.0f;
var v133: i32 = 0i;
loop {
let v134 = v133;
let v135 = 10i;
if (!((v134<v135))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v136 = 7i;
let v137 = v133;
let v138 = (v136*v137);
let v139 = 6i;
let v140 = (v138+v139);
var v214: f32 = fn3(v140);
v117 = 0i;
loop {
let v215 = v117;
let v216 = 3i;
if (!((v215<v216))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v217 = v214;
let v218 = 6.28318548f;
let v219 = 7i;
let v220 = v133;
let v221 = (v219*v220);
let v222 = v117;
let v223 = (v221+v222);
let v224 = fn3(v223);
let v225 = (v218*v224);
let v226 = v117;
if (v226<0i || v226>=3i) { vkf_failed=true; }
let v227 = v116[u32(clamp(v226,0i,3i-1i))];
let v228 = (v225*v227);
v214 = (v217+v228);
let v229 = v117;
let v230 = 1i;
v117 = (v229+v230);
}
let v231 = v132;
let v232 = 7i;
let v233 = v133;
let v234 = (v232*v233);
let v235 = 3i;
let v236 = (v234+v235);
let v237 = v92;
let v238 = (v236+v237);
let v239 = fn3(v238);
let v240 = v214;
let v241 = cos(v240);
let v242 = (v239*v241);
v132 = (v231+v242);
let v243 = v133;
let v244 = 1i;
v133 = (v243+v244);
}
return v132;
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
