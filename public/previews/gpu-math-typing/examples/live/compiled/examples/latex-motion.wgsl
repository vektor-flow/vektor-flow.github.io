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
fn fn3(v105:f32)->i32 {
let v106 = v105;
let v107 = read_values(0i);
var v112 = (v106>=v107);
if (v112) {
let v108 = v105;
let v109 = i32(arrayLength(&values));
let v110 = 1i;
let v111 = read_values((v109-v110));
v112 = (v108<=v111);
}
if (!(v112)) { vkf_failed = true; }
var v113: i32 = 0i;
let v114 = i32(arrayLength(&values));
let v115 = 1i;
var v116: i32 = (v114-v115);
loop {
let v117 = v116;
let v118 = v113;
let v119 = (v117-v118);
let v120 = 1i;
if (!((v119>v120))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v121 = v113;
let v122 = v116;
let v123 = (v121+v122);
let v124 = 2i;
if (f32(v124) == 0.0f) { vkf_failed = true; }
var v125: i32 = i32(floor(f32(v123)/f32(v124)));
let v126 = v105;
let v127 = read_values(v125);
if ((v126>=v127)) {
v113 = v125;
}
let v128 = v105;
let v129 = read_values(v125);
if ((v128<v129)) {
v116 = v125;
}
}
return v113;
}
fn fn2(v101:f32,v102:bool,v103:bool)->f32 {
let v104 = v101;
var v130: i32 = fn3(v104);
let v131 = v130;
let v132 = 1i;
let v133 = read_values((v131+v132));
let v134 = read_values(v130);
var v135: f32 = (v133-v134);
let v136 = v101;
let v137 = read_values(v130);
let v138 = (v136-v137);
let v139 = v135;
if (v139 == 0.0f) { vkf_failed = true; }
var v140: f32 = (v138/v139);
var v143 = v102;
if (v143) {
let v141 = v130;
let v142 = 0i;
v143 = (v141==v142);
}
var v144: bool = v143;
var v149 = v103;
if (v149) {
let v145 = v130;
let v146 = i32(arrayLength(&values));
let v147 = 2i;
let v148 = (v146-v147);
v149 = (v145==v148);
}
var v150: bool = v149;
var v151: f32 = v140;
var v152 = v144;
if (v152) {
v152 = v150;
}
if (v152) {
let v153 = 10i;
let v154 = v140;
let v155 = 3i;
let v156 = vkf_powi(v154,v155);
let v157 = (f32(v153)*v156);
let v158 = 15i;
let v159 = v140;
let v160 = 4i;
let v161 = vkf_powi(v159,v160);
let v162 = (f32(v158)*v161);
let v163 = (v157-v162);
let v164 = 6i;
let v165 = v140;
let v166 = 5i;
let v167 = vkf_powi(v165,v166);
let v168 = (f32(v164)*v167);
v151 = (v163+v168);
}
var v169 = v144;
if (v169) {
v169 = (!v150);
}
if (v169) {
let v170 = 6i;
let v171 = v140;
let v172 = 3i;
let v173 = vkf_powi(v171,v172);
let v174 = (f32(v170)*v173);
let v175 = 8i;
let v176 = v140;
let v177 = 4i;
let v178 = vkf_powi(v176,v177);
let v179 = (f32(v175)*v178);
let v180 = (v174-v179);
let v181 = 3i;
let v182 = v140;
let v183 = 5i;
let v184 = vkf_powi(v182,v183);
let v185 = (f32(v181)*v184);
v151 = (v180+v185);
}
var v186 = v150;
if (v186) {
v186 = (!v144);
}
if (v186) {
let v187 = 1i;
let v188 = v140;
var v189: f32 = (f32(v187)-v188);
let v190 = 1i;
let v191 = 6i;
let v192 = v189;
let v193 = 3i;
let v194 = vkf_powi(v192,v193);
let v195 = (f32(v191)*v194);
let v196 = 8i;
let v197 = v189;
let v198 = 4i;
let v199 = vkf_powi(v197,v198);
let v200 = (f32(v196)*v199);
let v201 = (v195-v200);
let v202 = 3i;
let v203 = v189;
let v204 = 5i;
let v205 = vkf_powi(v203,v204);
let v206 = (f32(v202)*v205);
let v207 = (v201+v206);
v151 = (f32(v190)-v207);
}
let v208 = read_values(v130);
let v209 = v135;
let v210 = v151;
let v211 = (v209*v210);
return (v208+v211);
}
fn fn5(v255:f32,v256:f32,v257:f32,v258:f32,v259:f32,v260:f32)->f32 {
let v261 = 1i;
let v262 = v260;
var v263: f32 = (f32(v261)-v262);
let v264 = v263;
let v265 = v255;
let v266 = (v264*v265);
let v267 = v260;
let v268 = v256;
let v269 = (v267*v268);
let v270 = (v266+v269);
let v271 = v263;
let v272 = 3i;
let v273 = vkf_powi(v271,v272);
let v274 = v263;
let v275 = (v273-v274);
let v276 = v257;
let v277 = (v275*v276);
let v278 = v260;
let v279 = 3i;
let v280 = vkf_powi(v278,v279);
let v281 = v260;
let v282 = (v280-v281);
let v283 = v258;
let v284 = (v282*v283);
let v285 = (v277+v284);
let v286 = v259;
let v287 = (v285*v286);
let v288 = v259;
let v289 = (v287*v288);
let v290 = 6i;
if (f32(v290) == 0.0f) { vkf_failed = true; }
let v291 = (v289/f32(v290));
return (v270+v291);
}
fn fn4(v231:f32,v232:f32,v233:f32,v234:f32,v235:i32)->f32 {
var v236: f32 = 0.0f;
let v237 = v235;
let v238 = 1i;
if ((v237==v238)) {
let v239 = 1.5f;
let v240 = v233;
let v241 = 2i;
let v242 = v232;
let v243 = (f32(v241)*v242);
let v244 = (v240-v243);
let v245 = v231;
let v246 = (v244+v245);
v236 = (v239*v246);
}
let v247 = v234;
let v248 = 1i;
if ((v247<=f32(v248))) {
let v249 = v231;
let v250 = v232;
let v251 = 0.0f;
let v252 = v236;
let v253 = 1.0f;
let v254 = v234;
return fn5(v249,v250,v251,v252,v253,v254);
}
let v292 = v232;
let v293 = v233;
let v294 = v236;
let v295 = 0.0f;
let v296 = 1.0f;
let v297 = v234;
let v298 = 1i;
let v299 = (v297-f32(v298));
return fn5(v292,v293,v294,v295,v296,v299);
}
fn fn1(v3:i32)->array<f32,16> {
let v4 = i32(arrayLength(&params));
let v5 = 8i;
var v8 = (v4>=v5);
if (v8) {
let v6 = i32(arrayLength(&values));
let v7 = 3i;
v8 = (v6==v7);
}
if (!(v8)) { vkf_failed = true; }
let v9 = read_values(0i);
let v10 = 0i;
var v13 = (v9==f32(v10));
if (v13) {
let v11 = read_values(1i);
let v12 = 1i;
v13 = (v11==f32(v12));
}
var v16 = v13;
if (v16) {
let v14 = read_values(2i);
let v15 = 2i;
v16 = (v14==f32(v15));
}
if (!(v16)) { vkf_failed = true; }
let v17 = read_params(6i);
if (!(abs(v17) < 2147483648.0f)) { vkf_failed = true; }
var v18: i32 = i32(v17);
let v19 = read_params(7i);
if (!(abs(v19) < 2147483648.0f)) { vkf_failed = true; }
var v20: i32 = i32(v19);
let v21 = v18;
let v22 = 0i;
var v25 = (v21>v22);
if (v25) {
let v23 = v20;
let v24 = 0i;
v25 = (v23>v24);
}
var v28 = v25;
if (v28) {
let v26 = v18;
let v27 = 100000i;
v28 = (v26<=v27);
}
var v31 = v28;
if (v31) {
let v29 = v20;
let v30 = 100000i;
v31 = (v29<=v30);
}
if (!(v31)) { vkf_failed = true; }
let v32 = v18;
let v33 = f32(v32);
let v34 = read_params(6i);
var v38 = (v33==v34);
if (v38) {
let v35 = v20;
let v36 = f32(v35);
let v37 = read_params(7i);
v38 = (v36==v37);
}
if (!(v38)) { vkf_failed = true; }
let v39 = i32(arrayLength(&params));
let v40 = 8i;
let v41 = 17i;
let v42 = v18;
let v43 = (v41*v42);
let v44 = (v40+v43);
let v45 = 6i;
let v46 = v20;
let v47 = (v45*v46);
let v48 = (v44+v47);
if (!((v39==v48))) { vkf_failed = true; }
let v49 = v3;
let v50 = 0i;
var v53 = (v49>=v50);
if (v53) {
let v51 = v3;
let v52 = v18;
v53 = (v51<v52);
}
if (!(v53)) { vkf_failed = true; }
let v54 = read_params(2i);
if (!(abs(v54) < 2147483648.0f)) { vkf_failed = true; }
var v55: i32 = i32(v54);
let v56 = v55;
let v57 = f32(v56);
let v58 = read_params(2i);
var v64 = (v57==v58);
if (v64) {
let v59 = v55;
let v60 = 0i;
var v63 = (v59==v60);
if (!v63) {
let v61 = v55;
let v62 = 1i;
v63 = (v61==v62);
}
v64 = v63;
}
if (!(v64)) { vkf_failed = true; }
var v65: f32 = read_params(5i);
let v66 = v65;
let v67 = 0i;
if (!((v66>f32(v67)))) { vkf_failed = true; }
let v68 = 8i;
let v69 = 16i;
let v70 = v18;
let v71 = (v69*v70);
let v72 = (v68+v71);
let v73 = v3;
let v74 = read_params((v72+v73));
if (!(abs(v74) < 2147483648.0f)) { vkf_failed = true; }
var v75: i32 = i32(v74);
let v76 = v75;
let v77 = 0i;
var v80 = (v76>=v77);
if (v80) {
let v78 = v75;
let v79 = v20;
v80 = (v78<v79);
}
var v90 = v80;
if (v90) {
let v81 = v75;
let v82 = f32(v81);
let v83 = 8i;
let v84 = 16i;
let v85 = v18;
let v86 = (v84*v85);
let v87 = (v83+v86);
let v88 = v3;
let v89 = read_params((v87+v88));
v90 = (v82==v89);
}
if (!(v90)) { vkf_failed = true; }
let v91 = read_params(1i);
let v92 = read_params(3i);
let v93 = 0i;
let v94 = (v92>f32(v93));
let v95 = read_params(4i);
let v96 = 0i;
let v97 = (v95>f32(v96));
let v98 = v91;
let v99 = v94;
let v100 = v97;
var v212: f32 = fn2(v98,v99,v100);
let v213 = 8i;
let v214 = 17i;
let v215 = v18;
let v216 = (v214*v215);
let v217 = (v213+v216);
let v218 = 6i;
let v219 = v75;
let v220 = (v218*v219);
var v221: i32 = (v217+v220);
let v222 = read_params(v221);
let v223 = v221;
let v224 = 2i;
let v225 = read_params((v223+v224));
let v226 = v221;
let v227 = 4i;
let v228 = read_params((v226+v227));
let v229 = v212;
let v230 = v55;
var v300: f32 = fn4(v222,v225,v228,v229,v230);
let v301 = v221;
let v302 = 1i;
let v303 = read_params((v301+v302));
let v304 = v221;
let v305 = 3i;
let v306 = read_params((v304+v305));
let v307 = v221;
let v308 = 5i;
let v309 = read_params((v307+v308));
let v310 = v212;
let v311 = v55;
var v312: f32 = fn4(v303,v306,v309,v310,v311);
let v313 = 8i;
let v314 = 16i;
let v315 = v3;
let v316 = (v314*v315);
var v317: i32 = (v313+v316);
let v318 = v317;
let v319 = 2i;
let v320 = read_params((v318+v319));
let v321 = 0i;
var v326 = (v320>=f32(v321));
if (v326) {
let v322 = v317;
let v323 = 3i;
let v324 = read_params((v322+v323));
let v325 = 0i;
v326 = (v324>=f32(v325));
}
if (!(v326)) { vkf_failed = true; }
let v327 = f32(0i);
let v328 = f32(0i);
let v329 = f32(0i);
let v330 = f32(0i);
let v331 = f32(0i);
let v332 = f32(0i);
let v333 = f32(0i);
let v334 = f32(0i);
let v335 = f32(0i);
let v336 = f32(0i);
let v337 = f32(0i);
let v338 = f32(0i);
let v339 = f32(0i);
let v340 = f32(0i);
let v341 = f32(0i);
let v342 = f32(0i);
var v343: array<f32,16> = array<f32,16>(v327,v328,v329,v330,v331,v332,v333,v334,v335,v336,v337,v338,v339,v340,v341,v342);
var v344: i32 = 0i;
loop {
let v345 = v344;
let v346 = 16i;
if (!((v345<v346))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v347 = v344;
let v348 = v317;
let v349 = v344;
if (v347<0i || v347>=16i) { vkf_failed=true; } else { v343[u32(v347)]=read_params((v348+v349)); }
let v350 = v344;
let v351 = 1i;
v344 = (v350+v351);
}
let v352 = 0i;
let v353 = read_params(v317);
let v354 = v300;
let v355 = (v353+v354);
let v356 = v65;
if (v352<0i || v352>=16i) { vkf_failed=true; } else { v343[u32(v352)]=(v355*v356); }
let v357 = 1i;
let v358 = v317;
let v359 = 1i;
let v360 = read_params((v358+v359));
let v361 = v312;
let v362 = (v360+v361);
let v363 = v65;
if (v357<0i || v357>=16i) { vkf_failed=true; } else { v343[u32(v357)]=(v362*v363); }
let v364 = 2i;
let v365 = v317;
let v366 = 2i;
let v367 = read_params((v365+v366));
let v368 = v65;
if (v364<0i || v364>=16i) { vkf_failed=true; } else { v343[u32(v364)]=(v367*v368); }
let v369 = 3i;
let v370 = v317;
let v371 = 3i;
let v372 = read_params((v370+v371));
let v373 = v65;
if (v369<0i || v369>=16i) { vkf_failed=true; } else { v343[u32(v369)]=(v372*v373); }
let v374 = v317;
let v375 = 12i;
let v376 = read_params((v374+v375));
let v377 = 1i;
if ((v376==f32(v377))) {
let v378 = 13i;
let v379 = 2i;
if (v379<0i || v379>=16i) { vkf_failed=true; }
if (v378<0i || v378>=16i) { vkf_failed=true; } else { v343[u32(v378)]=v343[u32(clamp(v379,0i,16i-1i))]; }
let v380 = 14i;
let v381 = 3i;
if (v381<0i || v381>=16i) { vkf_failed=true; }
if (v380<0i || v380>=16i) { vkf_failed=true; } else { v343[u32(v380)]=v343[u32(clamp(v381,0i,16i-1i))]; }
let v382 = 0i;
let v383 = 0i;
if (v383<0i || v383>=16i) { vkf_failed=true; }
let v384 = v343[u32(clamp(v383,0i,16i-1i))];
let v385 = 1i;
if (v382<0i || v382>=16i) { vkf_failed=true; } else { v343[u32(v382)]=(v384-f32(v385)); }
let v386 = 1i;
let v387 = 1i;
if (v387<0i || v387>=16i) { vkf_failed=true; }
let v388 = v343[u32(clamp(v387,0i,16i-1i))];
let v389 = 1i;
if (v386<0i || v386>=16i) { vkf_failed=true; } else { v343[u32(v386)]=(v388-f32(v389)); }
let v390 = 2i;
let v391 = 2i;
if (v391<0i || v391>=16i) { vkf_failed=true; }
let v392 = v343[u32(clamp(v391,0i,16i-1i))];
let v393 = 2i;
if (v390<0i || v390>=16i) { vkf_failed=true; } else { v343[u32(v390)]=(v392+f32(v393)); }
let v394 = 3i;
let v395 = 3i;
if (v395<0i || v395>=16i) { vkf_failed=true; }
let v396 = v343[u32(clamp(v395,0i,16i-1i))];
let v397 = 2i;
if (v394<0i || v394>=16i) { vkf_failed=true; } else { v343[u32(v394)]=(v396+f32(v397)); }
}
return v343;
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
