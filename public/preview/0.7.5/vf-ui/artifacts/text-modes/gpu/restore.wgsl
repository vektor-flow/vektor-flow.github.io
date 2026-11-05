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
fn fn2(v26:i32,v27:i32,v28:i32)->i32 {
let v29 = v27;
let v30 = v28;
if (f32(v30) == 0.0f) { vkf_failed = true; }
var v31: i32 = i32(floor(f32(v29)/f32(v30)));
let v32 = v27;
let v33 = v28;
if (v33 == 0i) { vkf_failed = true; }
var v34: i32 = (v32%v33);
let v35 = v34;
let v36 = v31;
let v37 = 1i;
let v38 = (v36+v37);
var v39: i32 = (v35*v38);
let v40 = v26;
let v41 = v39;
if ((v40<v41)) {
let v42 = v26;
let v43 = v31;
let v44 = 1i;
let v45 = (v43+v44);
if (f32(v45) == 0.0f) { vkf_failed = true; }
return i32(floor(f32(v42)/f32(v45)));
}
let v46 = v34;
let v47 = v26;
let v48 = v39;
let v49 = (v47-v48);
let v50 = v31;
if (f32(v50) == 0.0f) { vkf_failed = true; }
let v51 = floor(f32(v49)/f32(v50));
return i32((f32(v46)+v51));
}
fn fn3(v56:i32,v57:i32,v58:i32)->i32 {
let v59 = v57;
let v60 = v58;
if (f32(v60) == 0.0f) { vkf_failed = true; }
var v61: i32 = i32(floor(f32(v59)/f32(v60)));
let v62 = v57;
let v63 = v58;
if (v63 == 0i) { vkf_failed = true; }
var v64: i32 = (v62%v63);
let v65 = v64;
let v66 = v61;
let v67 = 1i;
let v68 = (v66+v67);
var v69: i32 = (v65*v68);
let v70 = v56;
let v71 = v69;
if ((v70<v71)) {
let v72 = v56;
let v73 = v61;
let v74 = 1i;
let v75 = (v73+v74);
if (v75 == 0i) { vkf_failed = true; }
return (v72%v75);
}
let v76 = v56;
let v77 = v69;
let v78 = (v76-v77);
let v79 = v61;
if (v79 == 0i) { vkf_failed = true; }
return (v78%v79);
}
fn fn4(v84:i32,v85:i32,v86:i32)->i32 {
let v87 = v85;
let v88 = v86;
if (f32(v88) == 0.0f) { vkf_failed = true; }
var v89: i32 = i32(floor(f32(v87)/f32(v88)));
let v90 = v85;
let v91 = v86;
if (v91 == 0i) { vkf_failed = true; }
var v92: i32 = (v90%v91);
let v93 = v84;
let v94 = v92;
let v95 = v89;
let v96 = 1i;
let v97 = (v95+v96);
let v98 = (v94*v97);
if ((v93<v98)) {
let v99 = v89;
let v100 = 1i;
return (v99+v100);
}
return v89;
}
fn fn1(v3:i32)->array<f32,13> {
let v4 = read_params(10i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = read_params(24i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = read_params(25i);
if (!(abs(v8) < 2147483648.0f)) { vkf_failed = true; }
var v9: i32 = i32(v8);
let v10 = v7;
let v11 = 0i;
var v14 = (v10>v11);
if (v14) {
let v12 = v5;
let v13 = v7;
v14 = (v12>=v13);
}
var v17 = v14;
if (v17) {
let v15 = v5;
let v16 = 131072i;
v17 = (v15<=v16);
}
var v22 = v17;
if (v22) {
let v18 = i32(arrayLength(&values));
let v19 = 16i;
let v20 = v7;
let v21 = (v19*v20);
v22 = (v18==v21);
}
if (!(v22)) { vkf_failed = true; }
let v23 = v3;
let v24 = v5;
let v25 = v7;
var v52: i32 = fn2(v23,v24,v25);
let v53 = v3;
let v54 = v5;
let v55 = v7;
var v80: i32 = fn3(v53,v54,v55);
let v81 = v3;
let v82 = v5;
let v83 = v7;
var v101: i32 = fn4(v81,v82,v83);
let v102 = 16i;
let v103 = v52;
let v104 = (v102*v103);
let v105 = 3i;
var v106: f32 = read_values((v104+v105));
let v107 = v106;
let v108 = v106;
var v109: f32 = (v107*v108);
var v110: i32 = 1i;
loop {
let v111 = v110;
let v112 = v110;
let v113 = (v111*v112);
let v114 = v101;
if (!((v113<v114))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v115 = v110;
let v116 = 1i;
v110 = (v115+v116);
}
let v117 = v101;
let v118 = v110;
let v119 = (v117+v118);
let v120 = 1i;
let v121 = (v119-v120);
let v122 = v110;
if (f32(v122) == 0.0f) { vkf_failed = true; }
var v123: i32 = i32(floor(f32(v121)/f32(v122)));
let v124 = v80;
let v125 = v110;
if (v125 == 0i) { vkf_failed = true; }
let v126 = (v124%v125);
let v127 = f32(v126);
let v128 = 0.5f;
let v129 = (v127+v128);
let v130 = v110;
let v131 = f32(v130);
if (v131 == 0.0f) { vkf_failed = true; }
let v132 = (v129/v131);
let v133 = 0.5f;
let v134 = (v132-v133);
let v135 = v106;
let v136 = (v134*v135);
let v137 = read_params(23i);
if (v137 == 0.0f) { vkf_failed = true; }
var v138: f32 = (v136/v137);
let v139 = v80;
let v140 = v110;
if (f32(v140) == 0.0f) { vkf_failed = true; }
let v141 = floor(f32(v139)/f32(v140));
let v142 = v141;
let v143 = 0.5f;
let v144 = (v142+v143);
let v145 = v123;
let v146 = f32(v145);
if (v146 == 0.0f) { vkf_failed = true; }
let v147 = (v144/v146);
let v148 = 0.5f;
let v149 = (v147-v148);
let v150 = v106;
let v151 = (v149*v150);
let v152 = read_params(23i);
if (v152 == 0.0f) { vkf_failed = true; }
var v153: f32 = (v151/v152);
let v154 = 16i;
let v155 = v52;
let v156 = (v154*v155);
let v157 = 11i;
var v158: f32 = read_values((v156+v157));
let v159 = 16i;
let v160 = v52;
let v161 = (v159*v160);
let v162 = 12i;
var v163: f32 = read_values((v161+v162));
let v164 = 16i;
let v165 = v52;
let v166 = (v164*v165);
let v167 = 13i;
var v168: f32 = read_values((v166+v167));
let v169 = 16i;
let v170 = v52;
let v171 = (v169*v170);
let v172 = 7i;
var v173: f32 = read_values((v171+v172));
var v174: f32 = 1.0f;
let v175 = 16i;
let v176 = v52;
let v177 = (v175*v176);
let v178 = 15i;
var v179: f32 = read_values((v177+v178));
let v180 = v158;
let v181 = 0i;
if ((v180<f32(v181))) {
let v182 = 16i;
let v183 = v52;
let v184 = (v182*v183);
let v185 = 10i;
let v186 = read_values((v184+v185));
let v187 = v109;
v158 = (v186*v187);
let v188 = read_params(16i);
let v189 = v9;
let v190 = f32(v189);
if (v190 == 0.0f) { vkf_failed = true; }
v163 = (v188/v190);
let v191 = read_params(17i);
let v192 = v9;
let v193 = f32(v192);
if (v193 == 0.0f) { vkf_failed = true; }
v168 = (v191/v193);
let v194 = 1i;
let v195 = v9;
let v196 = f32(v195);
if (v196 == 0.0f) { vkf_failed = true; }
v173 = (f32(v194)/v196);
v174 = f32(0i);
v179 = f32(0i);
}
let v197 = v179;
let v198 = 0.5f;
if ((v197>v198)) {
v179 = f32(0i);
}
var v199: f32 = 1.0f;
let v200 = v9;
let v201 = 0i;
var v204 = (v200>v201);
if (v204) {
let v202 = v9;
let v203 = v7;
v204 = (v202<v203);
}
if (v204) {
v199 = f32(2i);
}
let v205 = f32(0i);
let v206 = f32(0i);
let v207 = f32(0i);
let v208 = f32(0i);
let v209 = f32(0i);
let v210 = f32(0i);
let v211 = f32(0i);
let v212 = f32(0i);
let v213 = f32(0i);
let v214 = f32(0i);
let v215 = f32(0i);
let v216 = f32(0i);
let v217 = f32(0i);
var v218: array<f32,13> = array<f32,13>(v205,v206,v207,v208,v209,v210,v211,v212,v213,v214,v215,v216,v217);
let v219 = 0i;
let v220 = 16i;
let v221 = v52;
let v222 = read_values((v220*v221));
let v223 = v138;
if (v219<0i || v219>=13i) { vkf_failed=true; } else { v218[u32(v219)]=(v222+v223); }
let v224 = 1i;
let v225 = 16i;
let v226 = v52;
let v227 = (v225*v226);
let v228 = 1i;
let v229 = read_values((v227+v228));
let v230 = v153;
if (v224<0i || v224>=13i) { vkf_failed=true; } else { v218[u32(v224)]=(v229+v230); }
let v231 = 2i;
let v232 = 16i;
let v233 = v52;
let v234 = (v232*v233);
let v235 = 4i;
if (v231<0i || v231>=13i) { vkf_failed=true; } else { v218[u32(v231)]=read_values((v234+v235)); }
let v236 = 3i;
let v237 = 16i;
let v238 = v52;
let v239 = (v237*v238);
let v240 = 5i;
if (v236<0i || v236>=13i) { vkf_failed=true; } else { v218[u32(v236)]=read_values((v239+v240)); }
let v241 = 4i;
let v242 = 16i;
let v243 = v52;
let v244 = (v242*v243);
let v245 = 6i;
if (v241<0i || v241>=13i) { vkf_failed=true; } else { v218[u32(v241)]=read_values((v244+v245)); }
let v246 = 5i;
let v247 = 16i;
let v248 = v52;
let v249 = (v247*v248);
let v250 = 10i;
if (v246<0i || v246>=13i) { vkf_failed=true; } else { v218[u32(v246)]=read_values((v249+v250)); }
let v251 = 6i;
let v252 = v109;
let v253 = v101;
let v254 = f32(v253);
if (v254 == 0.0f) { vkf_failed = true; }
let v255 = (v252/v254);
if (v255 < 0.0f) { vkf_failed = true; }
if (v251<0i || v251>=13i) { vkf_failed=true; } else { v218[u32(v251)]=sqrt(v255); }
let v256 = 7i;
let v257 = v158;
let v258 = v101;
let v259 = f32(v258);
if (v259 == 0.0f) { vkf_failed = true; }
if (v256<0i || v256>=13i) { vkf_failed=true; } else { v218[u32(v256)]=(v257/v259); }
let v260 = 8i;
let v261 = v163;
let v262 = v101;
let v263 = f32(v262);
if (v263 == 0.0f) { vkf_failed = true; }
if (v260<0i || v260>=13i) { vkf_failed=true; } else { v218[u32(v260)]=(v261/v263); }
let v264 = 9i;
let v265 = v168;
let v266 = v101;
let v267 = f32(v266);
if (v267 == 0.0f) { vkf_failed = true; }
if (v264<0i || v264>=13i) { vkf_failed=true; } else { v218[u32(v264)]=(v265/v267); }
let v268 = 10i;
let v269 = v173;
let v270 = v199;
let v271 = v101;
let v272 = f32(v271);
let v273 = (v270*v272);
if (v273 == 0.0f) { vkf_failed = true; }
if (v268<0i || v268>=13i) { vkf_failed=true; } else { v218[u32(v268)]=(v269/v273); }
let v274 = 11i;
if (v274<0i || v274>=13i) { vkf_failed=true; } else { v218[u32(v274)]=v174; }
let v275 = 12i;
if (v275<0i || v275>=13i) { vkf_failed=true; } else { v218[u32(v275)]=v179; }
return v218;
}
fn fn0(v1:i32)->array<f32,13> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/13u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<13u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<13u;i+=1u){results[gid.x*13u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/13u)],1u);}
}
