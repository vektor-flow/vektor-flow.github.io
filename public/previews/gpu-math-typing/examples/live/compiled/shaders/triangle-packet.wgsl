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
fn fn3(v137:i32,v138:i32,v139:i32,v140:i32)->i32 {
let v141 = v140;
let v142 = 0i;
if ((v141==v142)) {
return v137;
}
let v143 = v139;
let v144 = 0i;
if ((v143==v144)) {
let v145 = v140;
let v146 = 1i;
if ((v145==v146)) {
let v147 = v137;
let v148 = 1i;
return (v147+v148);
}
let v149 = v137;
let v150 = v138;
let v151 = (v149+v150);
let v152 = 1i;
return (v151+v152);
}
let v153 = v140;
let v154 = 1i;
if ((v153==v154)) {
let v155 = v137;
let v156 = v138;
let v157 = (v155+v156);
let v158 = 1i;
return (v157+v158);
}
let v159 = v137;
let v160 = v138;
return (v159+v160);
}
fn fn2(v19:i32,v20:f32,v21:i32,v22:f32,v23:f32,v24:f32,v25:f32)->array<f32,72> {
let v26 = f32(0i);
let v27 = f32(0i);
let v28 = f32(0i);
let v29 = f32(0i);
let v30 = f32(0i);
let v31 = f32(0i);
let v32 = f32(0i);
let v33 = f32(0i);
let v34 = f32(0i);
let v35 = f32(0i);
let v36 = f32(0i);
let v37 = f32(0i);
let v38 = f32(0i);
let v39 = f32(0i);
let v40 = f32(0i);
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
var v98: array<f32,72> = array<f32,72>(v26,v27,v28,v29,v30,v31,v32,v33,v34,v35,v36,v37,v38,v39,v40,v41,v42,v43,v44,v45,v46,v47,v48,v49,v50,v51,v52,v53,v54,v55,v56,v57,v58,v59,v60,v61,v62,v63,v64,v65,v66,v67,v68,v69,v70,v71,v72,v73,v74,v75,v76,v77,v78,v79,v80,v81,v82,v83,v84,v85,v86,v87,v88,v89,v90,v91,v92,v93,v94,v95,v96,v97);
let v99 = v22;
let v100 = v23;
let v101 = v24;
let v102 = v25;
var v103: array<f32,4> = array<f32,4>(v99,v100,v101,v102);
let v104 = v21;
let v105 = v19;
let v106 = 1i;
let v107 = (v105-v106);
if (f32(v107) == 0.0f) { vkf_failed = true; }
let v108 = floor(f32(v104)/f32(v107));
let v109 = v19;
let v110 = (v108*f32(v109));
let v111 = v21;
let v112 = v19;
let v113 = 1i;
let v114 = (v112-v113);
if (v114 == 0i) { vkf_failed = true; }
let v115 = (v111%v114);
var v116: i32 = i32((v110+f32(v115)));
var v117: i32 = 0i;
loop {
let v118 = v117;
let v119 = 2i;
if (!((v118<v119))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v120 = f32(0i);
let v121 = f32(0i);
let v122 = f32(0i);
let v123 = f32(0i);
let v124 = f32(0i);
let v125 = f32(0i);
let v126 = f32(0i);
let v127 = f32(0i);
var v128: array<f32,8> = array<f32,8>(v120,v121,v122,v123,v124,v125,v126,v127);
var v129: i32 = 0i;
var v130: i32 = 0i;
loop {
let v131 = v130;
let v132 = 3i;
if (!((v131<v132))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v133 = v116;
let v134 = v19;
let v135 = v117;
let v136 = v130;
var v161: i32 = fn3(v133,v134,v135,v136);
let v162 = v116;
let v163 = v19;
let v164 = v117;
let v165 = v130;
let v166 = 1i;
let v167 = (v165+v166);
let v168 = 3i;
if (v168 == 0i) { vkf_failed = true; }
let v169 = (v167%v168);
var v170: i32 = fn3(v162,v163,v164,v169);
var v171: f32 = read_values(v161);
var v172: f32 = read_values(v170);
let v173 = v171;
let v174 = 0i;
if ((v173>=f32(v174))) {
let v175 = 2i;
let v176 = v129;
let v177 = (v175*v176);
let v178 = v161;
let v179 = v19;
if (v179 == 0i) { vkf_failed = true; }
let v180 = (v178%v179);
let v181 = f32(v180);
let v182 = v20;
let v183 = (v181*v182);
let v184 = v19;
let v185 = 1i;
let v186 = (v184-v185);
if (f32(v186) == 0.0f) { vkf_failed = true; }
if (v177<0i || v177>=8i) { vkf_failed=true; } else { v128[u32(v177)]=(v183/f32(v186)); }
let v187 = 2i;
let v188 = v129;
let v189 = (v187*v188);
let v190 = 1i;
let v191 = (v189+v190);
let v192 = v161;
let v193 = v19;
if (f32(v193) == 0.0f) { vkf_failed = true; }
let v194 = floor(f32(v192)/f32(v193));
let v195 = v194;
let v196 = v20;
let v197 = (v195*v196);
let v198 = v19;
let v199 = 1i;
let v200 = (v198-v199);
if (f32(v200) == 0.0f) { vkf_failed = true; }
if (v191<0i || v191>=8i) { vkf_failed=true; } else { v128[u32(v191)]=(v197/f32(v200)); }
let v201 = v129;
let v202 = 1i;
v129 = (v201+v202);
}
let v203 = v171;
let v204 = 0i;
var v207 = (v203<f32(v204));
if (v207) {
let v205 = v172;
let v206 = 0i;
v207 = (v205>f32(v206));
}
var v213 = v207;
if (!v213) {
let v208 = v171;
let v209 = 0i;
var v212 = (v208>f32(v209));
if (v212) {
let v210 = v172;
let v211 = 0i;
v212 = (v210<f32(v211));
}
v213 = v212;
}
if (v213) {
let v214 = v171;
let v215 = v171;
let v216 = v172;
let v217 = (v215-v216);
if (v217 == 0.0f) { vkf_failed = true; }
var v218: f32 = (v214/v217);
let v219 = 2i;
let v220 = v129;
let v221 = (v219*v220);
let v222 = v161;
let v223 = v19;
if (v223 == 0i) { vkf_failed = true; }
let v224 = (v222%v223);
let v225 = f32(v224);
let v226 = v218;
let v227 = v170;
let v228 = v19;
if (v228 == 0i) { vkf_failed = true; }
let v229 = (v227%v228);
let v230 = v161;
let v231 = v19;
if (v231 == 0i) { vkf_failed = true; }
let v232 = (v230%v231);
let v233 = (v229-v232);
let v234 = (v226*f32(v233));
let v235 = (v225+v234);
let v236 = v20;
let v237 = (v235*v236);
let v238 = v19;
let v239 = 1i;
let v240 = (v238-v239);
if (f32(v240) == 0.0f) { vkf_failed = true; }
if (v221<0i || v221>=8i) { vkf_failed=true; } else { v128[u32(v221)]=(v237/f32(v240)); }
let v241 = 2i;
let v242 = v129;
let v243 = (v241*v242);
let v244 = 1i;
let v245 = (v243+v244);
let v246 = v161;
let v247 = v19;
if (f32(v247) == 0.0f) { vkf_failed = true; }
let v248 = floor(f32(v246)/f32(v247));
let v249 = v248;
let v250 = v218;
let v251 = v170;
let v252 = v19;
if (f32(v252) == 0.0f) { vkf_failed = true; }
let v253 = floor(f32(v251)/f32(v252));
let v254 = v161;
let v255 = v19;
if (f32(v255) == 0.0f) { vkf_failed = true; }
let v256 = floor(f32(v254)/f32(v255));
let v257 = (v253-v256);
let v258 = (v250*v257);
let v259 = (v249+v258);
let v260 = v20;
let v261 = (v259*v260);
let v262 = v19;
let v263 = 1i;
let v264 = (v262-v263);
if (f32(v264) == 0.0f) { vkf_failed = true; }
if (v245<0i || v245>=8i) { vkf_failed=true; } else { v128[u32(v245)]=(v261/f32(v264)); }
let v265 = v129;
let v266 = 1i;
v129 = (v265+v266);
}
let v267 = v130;
let v268 = 1i;
v130 = (v267+v268);
}
var v269: i32 = 1i;
let v270 = v117;
let v271 = 36i;
var v272: i32 = (v270*v271);
loop {
let v273 = v269;
let v274 = v129;
let v275 = 1i;
let v276 = (v274-v275);
if (!((v273<v276))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v277: i32 = 0i;
loop {
let v278 = v277;
let v279 = 3i;
if (!((v278<v279))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v280: i32 = 0i;
let v281 = v277;
let v282 = 0i;
if ((v281>v282)) {
let v283 = v269;
let v284 = v277;
let v285 = (v283+v284);
let v286 = 1i;
v280 = (v285-v286);
}
let v287 = v272;
let v288 = 2i;
let v289 = v280;
let v290 = (v288*v289);
if (v290<0i || v290>=8i) { vkf_failed=true; }
if (v287<0i || v287>=72i) { vkf_failed=true; } else { v98[u32(v287)]=v128[u32(clamp(v290,0i,8i-1i))]; }
let v291 = v272;
let v292 = 1i;
let v293 = (v291+v292);
let v294 = 2i;
let v295 = v280;
let v296 = (v294*v295);
let v297 = 1i;
let v298 = (v296+v297);
if (v298<0i || v298>=8i) { vkf_failed=true; }
if (v293<0i || v293>=72i) { vkf_failed=true; } else { v98[u32(v293)]=v128[u32(clamp(v298,0i,8i-1i))]; }
var v299: i32 = 0i;
loop {
let v300 = v299;
let v301 = 4i;
if (!((v300<v301))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v302 = v272;
let v303 = 2i;
let v304 = (v302+v303);
let v305 = v299;
let v306 = (v304+v305);
let v307 = v299;
if (v307<0i || v307>=4i) { vkf_failed=true; }
if (v306<0i || v306>=72i) { vkf_failed=true; } else { v98[u32(v306)]=v103[u32(clamp(v307,0i,4i-1i))]; }
let v308 = v299;
let v309 = 1i;
v299 = (v308+v309);
}
let v310 = v272;
let v311 = 6i;
v272 = (v310+v311);
let v312 = v277;
let v313 = 1i;
v277 = (v312+v313);
}
let v314 = v269;
let v315 = 1i;
v269 = (v314+v315);
}
let v316 = v117;
let v317 = 1i;
v117 = (v316+v317);
}
return v98;
}
fn fn1(v3:i32)->array<f32,72> {
let v4 = read_params(4i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
let v5 = i32(v4);
let v6 = read_params(20i);
let v7 = v3;
let v8 = read_params(26i);
let v9 = read_params(27i);
let v10 = read_params(28i);
let v11 = read_params(29i);
let v12 = v5;
let v13 = v6;
let v14 = v7;
let v15 = v8;
let v16 = v9;
let v17 = v10;
let v18 = v11;
return fn2(v12,v13,v14,v15,v16,v17,v18);
}
fn fn0(v1:i32)->array<f32,72> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/72u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<72u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<72u;i+=1u){results[gid.x*72u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/72u)],1u);}
}
