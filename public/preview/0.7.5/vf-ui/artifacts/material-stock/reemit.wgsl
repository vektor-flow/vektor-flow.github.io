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
fn fn4(v142:i32,v143:i32)->bool {
let v144 = read_params(24i);
if (!(abs(v144) < 2147483648.0f)) { vkf_failed = true; }
var v145: i32 = i32(v144);
let v146 = 7i;
let v147 = v143;
let v148 = (v146*v147);
let v149 = 20i;
let v150 = v142;
let v151 = (v149*v150);
var v152: i32 = (v148+v151);
let v153 = 7i;
let v154 = v143;
let v155 = (v153*v154);
let v156 = 20i;
let v157 = v145;
let v158 = (v156*v157);
let v159 = (v155+v158);
let v160 = v142;
var v161: f32 = read_values((v159+v160));
let v162 = v161;
var v172 = fn3(v162);
if (v172) {
let v163 = v152;
let v164 = 16i;
let v165 = read_values((v163+v164));
let v166 = 0i;
var v171 = (v165==f32(v166));
if (!v171) {
let v167 = v152;
let v168 = 16i;
let v169 = read_values((v167+v168));
let v170 = 1i;
v171 = (v169==f32(v170));
}
v172 = v171;
}
if (!(v172)) { vkf_failed = true; }
let v173 = v152;
let v174 = 16i;
let v175 = read_values((v173+v174));
let v176 = 0i;
var v179 = (v175==f32(v176));
if (v179) {
let v177 = v161;
let v178 = read_params(25i);
v179 = (v177==v178);
}
return v179;
}
fn fn6(v331:i32,v332:i32)->i32 {
let v333 = v331;
let v334 = v332;
if (v334 == 0i) { vkf_failed = true; }
let v335 = (v333%v334);
let v336 = v332;
let v337 = (v335+v336);
let v338 = v332;
if (v338 == 0i) { vkf_failed = true; }
return (v337%v338);
}
fn fn7()->i32 {
let v358 = read_params(0i);
if (!(abs(v358) < 2147483648.0f)) { vkf_failed = true; }
let v359 = i32(v358);
let v360 = read_params(1i);
if (!(abs(v360) < 2147483648.0f)) { vkf_failed = true; }
let v361 = i32(v360);
let v362 = (v359*v361);
let v363 = read_params(2i);
if (!(abs(v363) < 2147483648.0f)) { vkf_failed = true; }
let v364 = i32(v363);
return (v362*v364);
}
fn fn5(v238:i32,v239:f32,v240:f32,v241:f32,v242:i32)->f32 {
var v243: f32 = 0.5f;
var v244: f32 = 0.5f;
var v245: f32 = 0.5f;
let v246 = v242;
let v247 = 0i;
if ((v246==v247)) {
v243 = f32(0i);
}
let v248 = v242;
let v249 = 1i;
if ((v248==v249)) {
v244 = f32(0i);
}
let v250 = v242;
let v251 = 2i;
if ((v250==v251)) {
v245 = f32(0i);
}
let v252 = v239;
let v253 = read_params(3i);
if (v253 == 0.0f) { vkf_failed = true; }
let v254 = (v252/v253);
let v255 = v243;
var v256: f32 = (v254-v255);
let v257 = v240;
let v258 = read_params(4i);
if (v258 == 0.0f) { vkf_failed = true; }
let v259 = (v257/v258);
let v260 = v244;
var v261: f32 = (v259-v260);
let v262 = v241;
let v263 = read_params(5i);
if (v263 == 0.0f) { vkf_failed = true; }
let v264 = (v262/v263);
let v265 = v245;
var v266: f32 = (v264-v265);
let v267 = v256;
let v268 = 1i;
if (f32(v268) == 0.0f) { vkf_failed = true; }
let v269 = floor(v267/f32(v268));
if (!(abs(v269) < 2147483648.0f)) { vkf_failed = true; }
var v270: i32 = i32(v269);
let v271 = v261;
let v272 = 1i;
if (f32(v272) == 0.0f) { vkf_failed = true; }
let v273 = floor(v271/f32(v272));
if (!(abs(v273) < 2147483648.0f)) { vkf_failed = true; }
var v274: i32 = i32(v273);
let v275 = v266;
let v276 = 1i;
if (f32(v276) == 0.0f) { vkf_failed = true; }
let v277 = floor(v275/f32(v276));
if (!(abs(v277) < 2147483648.0f)) { vkf_failed = true; }
var v278: i32 = i32(v277);
let v279 = v256;
let v280 = v270;
let v281 = f32(v280);
var v282: f32 = (v279-v281);
let v283 = v261;
let v284 = v274;
let v285 = f32(v284);
var v286: f32 = (v283-v285);
let v287 = v266;
let v288 = v278;
let v289 = f32(v288);
var v290: f32 = (v287-v289);
let v291 = read_params(0i);
if (!(abs(v291) < 2147483648.0f)) { vkf_failed = true; }
var v292: i32 = i32(v291);
let v293 = read_params(1i);
if (!(abs(v293) < 2147483648.0f)) { vkf_failed = true; }
var v294: i32 = i32(v293);
let v295 = read_params(2i);
if (!(abs(v295) < 2147483648.0f)) { vkf_failed = true; }
var v296: i32 = i32(v295);
var v297: f32 = 0.0f;
var v298: i32 = 0i;
loop {
let v299 = v298;
let v300 = 8i;
if (!((v299<v300))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v301 = v298;
let v302 = 2i;
if (v302 == 0i) { vkf_failed = true; }
var v303: i32 = (v301%v302);
let v304 = v298;
let v305 = 2i;
if (f32(v305) == 0.0f) { vkf_failed = true; }
let v306 = floor(f32(v304)/f32(v305));
let v307 = 2i;
if (f32(v307) == 0.0f) { vkf_failed = true; }
var v308: i32 = i32((v306%f32(v307)));
let v309 = v298;
let v310 = 4i;
if (f32(v310) == 0.0f) { vkf_failed = true; }
var v311: i32 = i32(floor(f32(v309)/f32(v310)));
let v312 = 1i;
let v313 = v282;
var v314: f32 = (f32(v312)-v313);
let v315 = 1i;
let v316 = v286;
var v317: f32 = (f32(v315)-v316);
let v318 = 1i;
let v319 = v290;
var v320: f32 = (f32(v318)-v319);
let v321 = v303;
let v322 = 1i;
if ((v321==v322)) {
v314 = v282;
}
let v323 = v308;
let v324 = 1i;
if ((v323==v324)) {
v317 = v286;
}
let v325 = v311;
let v326 = 1i;
if ((v325==v326)) {
v320 = v290;
}
let v327 = v270;
let v328 = v303;
let v329 = (v327+v328);
let v330 = v292;
let v339 = fn6(v329,v330);
let v340 = v292;
let v341 = v274;
let v342 = v308;
let v343 = (v341+v342);
let v344 = v294;
let v345 = fn6(v343,v344);
let v346 = v294;
let v347 = v278;
let v348 = v311;
let v349 = (v347+v348);
let v350 = v296;
let v351 = fn6(v349,v350);
let v352 = (v346*v351);
let v353 = (v345+v352);
let v354 = (v340*v353);
var v355: i32 = (v339+v354);
let v356 = v238;
let v357 = v242;
let v365 = fn7();
let v366 = (v357*v365);
let v367 = (v356+v366);
let v368 = v355;
var v369: i32 = (v367+v368);
let v370 = v297;
let v371 = v314;
let v372 = v317;
let v373 = (v371*v372);
let v374 = v320;
let v375 = (v373*v374);
let v376 = read_values(v369);
let v377 = (v375*v376);
v297 = (v370+v377);
let v378 = v298;
let v379 = 1i;
v298 = (v378+v379);
}
return v297;
}
fn fn1(v3:i32)->array<f32,20> {
let v4 = v3;
var v101: i32 = fn2(v4);
let v102 = read_params(24i);
if (!(abs(v102) < 2147483648.0f)) { vkf_failed = true; }
var v103: i32 = i32(v102);
let v104 = 7i;
let v105 = v101;
let v106 = (v104*v105);
let v107 = 20i;
let v108 = v3;
let v109 = (v107*v108);
var v110: i32 = (v106+v109);
let v111 = f32(0i);
let v112 = f32(0i);
let v113 = f32(0i);
let v114 = f32(0i);
let v115 = f32(0i);
let v116 = f32(0i);
let v117 = f32(0i);
let v118 = f32(0i);
let v119 = f32(0i);
let v120 = f32(0i);
let v121 = f32(0i);
let v122 = f32(0i);
let v123 = f32(0i);
let v124 = f32(0i);
let v125 = f32(0i);
let v126 = f32(0i);
let v127 = f32(0i);
let v128 = f32(0i);
let v129 = f32(0i);
let v130 = f32(0i);
var v131: array<f32,20> = array<f32,20>(v111,v112,v113,v114,v115,v116,v117,v118,v119,v120,v121,v122,v123,v124,v125,v126,v127,v128,v129,v130);
var v132: i32 = 0i;
loop {
let v133 = v132;
let v134 = 20i;
if (!((v133<v134))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v135 = v132;
let v136 = v110;
let v137 = v132;
if (v135<0i || v135>=20i) { vkf_failed=true; } else { v131[u32(v135)]=read_values((v136+v137)); }
let v138 = v132;
let v139 = 1i;
v132 = (v138+v139);
}
let v140 = v3;
let v141 = v101;
if ((!fn4(v140,v141))) {
return v131;
}
let v180 = 7i;
let v181 = v101;
let v182 = (v180*v181);
let v183 = 21i;
let v184 = v103;
let v185 = (v183*v184);
let v186 = (v182+v185);
let v187 = v3;
var v188: f32 = read_values((v186+v187));
let v189 = v188;
let v190 = 0i;
var v193 = (v189>f32(v190));
if (v193) {
let v191 = v188;
let v192 = 1000i;
v193 = (v191<f32(v192));
}
var v197 = v193;
if (v197) {
let v194 = 9i;
if (v194<0i || v194>=20i) { vkf_failed=true; }
let v195 = v131[u32(clamp(v194,0i,20i-1i))];
let v196 = 0i;
v197 = (v195>f32(v196));
}
var v201 = v197;
if (v201) {
let v198 = 9i;
if (v198<0i || v198>=20i) { vkf_failed=true; }
let v199 = abs(v131[u32(clamp(v198,0i,20i-1i))]);
let v200 = 1.00000002e+30f;
v201 = (v199<v200);
}
if (!(v201)) { vkf_failed = true; }
v132 = 0i;
loop {
let v202 = v132;
let v203 = 20i;
if (!((v202<v203))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v204 = v132;
if (v204<0i || v204>=20i) { vkf_failed=true; }
let v205 = abs(v131[u32(clamp(v204,0i,20i-1i))]);
let v206 = 1.00000002e+30f;
if (!((v205<v206))) { vkf_failed = true; }
let v207 = v132;
let v208 = 1i;
v132 = (v207+v208);
}
v132 = 10i;
loop {
let v209 = v132;
let v210 = 14i;
if (!((v209<v210))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v211 = v132;
if (v211<0i || v211>=20i) { vkf_failed=true; }
let v212 = v131[u32(clamp(v211,0i,20i-1i))];
let v213 = 0i;
var v217 = (v212>=f32(v213));
if (v217) {
let v214 = v132;
if (v214<0i || v214>=20i) { vkf_failed=true; }
let v215 = v131[u32(clamp(v214,0i,20i-1i))];
let v216 = 1i;
v217 = (v215<=f32(v216));
}
if (!(v217)) { vkf_failed = true; }
let v218 = v132;
let v219 = 1i;
v132 = (v218+v219);
}
v132 = 0i;
loop {
let v220 = v132;
let v221 = 3i;
if (!((v220<v221))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v222 = 6i;
let v223 = v132;
let v224 = (v222+v223);
let v225 = 0i;
let v226 = 3i;
if (v226<0i || v226>=20i) { vkf_failed=true; }
let v227 = v131[u32(clamp(v226,0i,20i-1i))];
let v228 = 4i;
if (v228<0i || v228>=20i) { vkf_failed=true; }
let v229 = v131[u32(clamp(v228,0i,20i-1i))];
let v230 = 5i;
if (v230<0i || v230>=20i) { vkf_failed=true; }
let v231 = v131[u32(clamp(v230,0i,20i-1i))];
let v232 = v132;
let v233 = v225;
let v234 = v227;
let v235 = v229;
let v236 = v231;
let v237 = v232;
if (v224<0i || v224>=20i) { vkf_failed=true; } else { v131[u32(v224)]=fn5(v233,v234,v235,v236,v237); }
let v380 = v132;
let v381 = 1i;
v132 = (v380+v381);
}
let v382 = 14i;
if (v382<0i || v382>=20i) { vkf_failed=true; } else { v131[u32(v382)]=f32(0i); }
let v383 = 15i;
if (v383<0i || v383>=20i) { vkf_failed=true; } else { v131[u32(v383)]=v188; }
let v384 = 16i;
if (v384<0i || v384>=20i) { vkf_failed=true; } else { v131[u32(v384)]=f32(1i); }
let v385 = 19i;
if (v385<0i || v385>=20i) { vkf_failed=true; } else { v131[u32(v385)]=f32(0i); }
return v131;
}
fn fn0(v1:i32)->array<f32,20> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/20u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<20u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<20u;i+=1u){results[gid.x*20u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/20u)],1u);}
}
