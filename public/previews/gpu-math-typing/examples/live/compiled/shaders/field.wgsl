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
fn fn4(v156:f32,v157:f32)->f32 {
let v158 = v156;
let v159 = v157;
if ((v158<v159)) {
return v156;
}
return v157;
}
fn fn5(v186:f32,v187:f32)->f32 {
let v188 = v186;
let v189 = v187;
if ((v188>v189)) {
return v186;
}
return v187;
}
fn fn6(v208:f32,v209:f32,v210:f32)->f32 {
let v211 = v210;
let v212 = v209;
let v213 = v208;
let v214 = fn5(v212,v213);
return fn4(v211,v214);
}
fn fn3(v113:i32,v114:i32,v115:i32,v116:i32,v117:f32,v118:f32,v119:f32,v120:f32)->f32 {
let v121 = v116;
let v122 = v115;
var v123: i32 = (v121*v122);
let v124 = v123;
let v125 = v113;
let v126 = read_values((v124+v125));
let v127 = v120;
var v128: f32 = (v126*v127);
let v129 = v123;
let v130 = v113;
let v131 = (v129+v130);
let v132 = 1i;
let v133 = read_values((v131+v132));
let v134 = v120;
var v135: f32 = (v133*v134);
let v136 = v128;
let v137 = 0i;
var v140 = (v136>f32(v137));
if (v140) {
let v138 = v135;
let v139 = 0i;
v140 = (v138>f32(v139));
}
if (!(v140)) { vkf_failed = true; }
let v141 = v117;
let v142 = read_values(v123);
let v143 = (v141-v142);
let v144 = v128;
if (v144 == 0.0f) { vkf_failed = true; }
var v145: f32 = (v143/v144);
let v146 = v118;
let v147 = v123;
let v148 = 1i;
let v149 = read_values((v147+v148));
let v150 = (v146-v149);
let v151 = v135;
if (v151 == 0.0f) { vkf_failed = true; }
var v152: f32 = (v150/v151);
var v153: f32 = 0.0f;
let v154 = v128;
let v155 = v135;
var v160: f32 = fn4(v154,v155);
let v161 = v113;
let v162 = 3i;
if ((v161==v162)) {
let v163 = v123;
let v164 = v113;
let v165 = (v163+v164);
let v166 = 2i;
let v167 = read_values((v165+v166));
let v168 = v120;
var v169: f32 = (v167*v168);
let v170 = v169;
let v171 = 0i;
if (!((v170>f32(v171)))) { vkf_failed = true; }
let v172 = v119;
let v173 = v123;
let v174 = 2i;
let v175 = read_values((v173+v174));
let v176 = (v172-v175);
let v177 = v169;
if (v177 == 0.0f) { vkf_failed = true; }
v153 = (v176/v177);
let v178 = v160;
let v179 = v169;
v160 = fn4(v178,v179);
}
let v180 = abs(v145);
let v181 = 1i;
let v182 = (v180-f32(v181));
let v183 = abs(v152);
let v184 = 1i;
let v185 = (v183-f32(v184));
let v190 = fn5(v182,v185);
let v191 = abs(v153);
let v192 = 1i;
let v193 = (v191-f32(v192));
var v194: f32 = fn5(v190,v193);
let v195 = v145;
let v196 = 1i;
let v197 = (v195+f32(v196));
let v198 = v114;
let v199 = 1i;
let v200 = (v198-v199);
let v201 = (v197*f32(v200));
let v202 = 2i;
if (f32(v202) == 0.0f) { vkf_failed = true; }
let v203 = (v201/f32(v202));
let v204 = 0.0f;
let v205 = v114;
let v206 = 1i;
let v207 = (v205-v206);
var v215: f32 = fn6(v203,v204,f32(v207));
let v216 = v152;
let v217 = 1i;
let v218 = (v216+f32(v217));
let v219 = v114;
let v220 = 1i;
let v221 = (v219-v220);
let v222 = (v218*f32(v221));
let v223 = 2i;
if (f32(v223) == 0.0f) { vkf_failed = true; }
let v224 = (v222/f32(v223));
let v225 = 0.0f;
let v226 = v114;
let v227 = 1i;
let v228 = (v226-v227);
var v229: f32 = fn6(v224,v225,f32(v228));
var v230: f32 = 0.0f;
let v231 = v113;
let v232 = 3i;
if ((v231==v232)) {
let v233 = v153;
let v234 = 1i;
let v235 = (v233+f32(v234));
let v236 = v114;
let v237 = 1i;
let v238 = (v236-v237);
let v239 = (v235*f32(v238));
let v240 = 2i;
if (f32(v240) == 0.0f) { vkf_failed = true; }
let v241 = (v239/f32(v240));
let v242 = 0.0f;
let v243 = v114;
let v244 = 1i;
let v245 = (v243-v244);
v230 = fn6(v241,v242,f32(v245));
}
let v246 = v215;
let v247 = 1i;
if (f32(v247) == 0.0f) { vkf_failed = true; }
let v248 = floor(v246/f32(v247));
let v249 = v114;
let v250 = 2i;
let v251 = (v249-v250);
let v252 = fn4(v248,f32(v251));
if (!(abs(v252) < 2147483648.0f)) { vkf_failed = true; }
var v253: i32 = i32(v252);
let v254 = v229;
let v255 = 1i;
if (f32(v255) == 0.0f) { vkf_failed = true; }
let v256 = floor(v254/f32(v255));
let v257 = v114;
let v258 = 2i;
let v259 = (v257-v258);
let v260 = fn4(v256,f32(v259));
if (!(abs(v260) < 2147483648.0f)) { vkf_failed = true; }
var v261: i32 = i32(v260);
let v262 = v230;
let v263 = 1i;
if (f32(v263) == 0.0f) { vkf_failed = true; }
let v264 = floor(v262/f32(v263));
let v265 = v114;
let v266 = 2i;
let v267 = (v265-v266);
let v268 = fn4(v264,f32(v267));
if (!(abs(v268) < 2147483648.0f)) { vkf_failed = true; }
var v269: i32 = i32(v268);
let v270 = v215;
let v271 = v253;
var v272: f32 = (v270-f32(v271));
let v273 = v229;
let v274 = v261;
var v275: f32 = (v273-f32(v274));
let v276 = v230;
let v277 = v269;
var v278: f32 = (v276-f32(v277));
var v279: i32 = 1i;
let v280 = v113;
let v281 = 3i;
if ((v280==v281)) {
v279 = 2i;
}
var v282: f32 = 0.0f;
var v283: i32 = 0i;
loop {
let v284 = v283;
let v285 = v279;
if (!((v284<v285))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v286: f32 = 1.0f;
let v287 = v113;
let v288 = 3i;
if ((v287==v288)) {
let v289 = 1i;
let v290 = v278;
v286 = (f32(v289)-v290);
let v291 = v283;
let v292 = 1i;
if ((v291==v292)) {
v286 = v278;
}
}
var v293: i32 = 0i;
loop {
let v294 = v293;
let v295 = 2i;
if (!((v294<v295))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v296 = 1i;
let v297 = v275;
var v298: f32 = (f32(v296)-v297);
let v299 = v293;
let v300 = 1i;
if ((v299==v300)) {
v298 = v275;
}
var v301: i32 = 0i;
loop {
let v302 = v301;
let v303 = 2i;
if (!((v302<v303))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v304 = 1i;
let v305 = v272;
var v306: f32 = (f32(v304)-v305);
let v307 = v301;
let v308 = 1i;
if ((v307==v308)) {
v306 = v272;
}
let v309 = v269;
let v310 = v283;
let v311 = (v309+v310);
let v312 = v114;
let v313 = (v311*v312);
let v314 = v114;
let v315 = (v313*v314);
let v316 = v261;
let v317 = v293;
let v318 = (v316+v317);
let v319 = v114;
let v320 = (v318*v319);
let v321 = (v315+v320);
let v322 = v253;
let v323 = (v321+v322);
let v324 = v301;
var v325: i32 = (v323+v324);
let v326 = v282;
let v327 = v306;
let v328 = v298;
let v329 = (v327*v328);
let v330 = v286;
let v331 = (v329*v330);
let v332 = v123;
let v333 = 2i;
let v334 = v113;
let v335 = (v333*v334);
let v336 = (v332+v335);
let v337 = v325;
let v338 = read_values((v336+v337));
let v339 = (v331*v338);
v282 = (v326+v339);
let v340 = v301;
let v341 = 1i;
v301 = (v340+v341);
}
let v342 = v293;
let v343 = 1i;
v293 = (v342+v343);
}
let v344 = v283;
let v345 = 1i;
v283 = (v344+v345);
}
let v346 = v282;
let v347 = v194;
let v348 = 0.0f;
let v349 = fn5(v347,v348);
let v350 = (v346-v349);
let v351 = v160;
return (v350*v351);
}
fn fn7(v367:f32,v368:f32,v369:f32)->f32 {
let v370 = v369;
let v371 = 0i;
if ((v370<=f32(v371))) {
let v372 = v367;
let v373 = v368;
return fn5(v372,v373);
}
let v374 = v369;
let v375 = v367;
let v376 = v368;
let v377 = abs((v375-v376));
let v378 = (v374-v377);
let v379 = 0.0f;
let v380 = fn5(v378,v379);
let v381 = v369;
if (v381 == 0.0f) { vkf_failed = true; }
var v382: f32 = (v380/v381);
let v383 = v367;
let v384 = v368;
let v385 = fn5(v383,v384);
let v386 = v369;
let v387 = v382;
let v388 = (v386*v387);
let v389 = v382;
let v390 = (v388*v389);
let v391 = 4i;
if (f32(v391) == 0.0f) { vkf_failed = true; }
let v392 = (v390/f32(v391));
return (v385+v392);
}
fn fn2(v88:i32,v89:i32,v90:i32,v91:i32,v92:f32,v93:f32,v94:f32,v95:f32,v96:f32)->f32 {
let v97 = v88;
let v98 = v89;
let v99 = v90;
let v100 = 0i;
let v101 = v92;
let v102 = v93;
let v103 = v94;
let v104 = v95;
let v105 = v97;
let v106 = v98;
let v107 = v99;
let v108 = v100;
let v109 = v101;
let v110 = v102;
let v111 = v103;
let v112 = v104;
var v352: f32 = fn3(v105,v106,v107,v108,v109,v110,v111,v112);
var v353: i32 = 1i;
loop {
let v354 = v353;
let v355 = v91;
if (!((v354<v355))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v356 = v352;
let v357 = v88;
let v358 = v89;
let v359 = v90;
let v360 = v353;
let v361 = v92;
let v362 = v93;
let v363 = v94;
let v364 = v95;
let v365 = fn3(v357,v358,v359,v360,v361,v362,v363,v364);
let v366 = v96;
v352 = fn7(v356,v365,v366);
let v393 = v353;
let v394 = 1i;
v353 = (v393+v394);
}
return v352;
}
fn fn1(v3:i32)->f32 {
let v4 = read_params(30i);
let v5 = 1i;
var v8 = (v4==f32(v5));
if (v8) {
let v6 = read_params(19i);
let v7 = 0i;
v8 = (v6==f32(v7));
}
if (v8) {
return 0.0f;
}
let v9 = read_params(0i);
if (!(abs(v9) < 2147483648.0f)) { vkf_failed = true; }
var v10: i32 = i32(v9);
let v11 = read_params(1i);
if (!(abs(v11) < 2147483648.0f)) { vkf_failed = true; }
var v12: i32 = i32(v11);
let v13 = read_params(2i);
if (!(abs(v13) < 2147483648.0f)) { vkf_failed = true; }
var v14: i32 = i32(v13);
let v15 = read_params(3i);
if (!(abs(v15) < 2147483648.0f)) { vkf_failed = true; }
var v16: i32 = i32(v15);
let v17 = read_params(4i);
if (!(abs(v17) < 2147483648.0f)) { vkf_failed = true; }
var v18: i32 = i32(v17);
var v19: i32 = v18;
var v20: f32 = 0.5f;
let v21 = read_params(19i);
let v22 = 1i;
if ((v21==f32(v22))) {
let v23 = v18;
let v24 = 1i;
v19 = (v23-v24);
v20 = f32(0i);
}
let v25 = read_params(5i);
let v26 = v3;
let v27 = v18;
if (v27 == 0i) { vkf_failed = true; }
let v28 = (v26%v27);
let v29 = v20;
let v30 = (f32(v28)+v29);
let v31 = read_params(8i);
let v32 = read_params(5i);
let v33 = (v31-v32);
let v34 = (v30*v33);
let v35 = v19;
if (f32(v35) == 0.0f) { vkf_failed = true; }
let v36 = (v34/f32(v35));
var v37: f32 = (v25+v36);
let v38 = read_params(6i);
let v39 = v3;
let v40 = v18;
if (f32(v40) == 0.0f) { vkf_failed = true; }
let v41 = floor(f32(v39)/f32(v40));
let v42 = v18;
if (f32(v42) == 0.0f) { vkf_failed = true; }
let v43 = (v41%f32(v42));
let v44 = v20;
let v45 = (v43+v44);
let v46 = read_params(9i);
let v47 = read_params(6i);
let v48 = (v46-v47);
let v49 = (v45*v48);
let v50 = v19;
if (f32(v50) == 0.0f) { vkf_failed = true; }
let v51 = (v49/f32(v50));
var v52: f32 = (v38+v51);
var v53: f32 = 0.0f;
let v54 = v10;
let v55 = 3i;
if ((v54==v55)) {
let v56 = read_params(7i);
let v57 = v3;
let v58 = v18;
let v59 = v18;
let v60 = (v58*v59);
if (f32(v60) == 0.0f) { vkf_failed = true; }
let v61 = floor(f32(v57)/f32(v60));
let v62 = v20;
let v63 = (v61+v62);
let v64 = read_params(10i);
let v65 = read_params(7i);
let v66 = (v64-v65);
let v67 = (v63*v66);
let v68 = v19;
if (f32(v68) == 0.0f) { vkf_failed = true; }
let v69 = (v67/f32(v68));
v53 = (v56+v69);
}
let v70 = v10;
let v71 = v12;
let v72 = v14;
let v73 = v16;
let v74 = v37;
let v75 = v52;
let v76 = v53;
let v77 = read_params(11i);
let v78 = read_params(12i);
let v79 = v70;
let v80 = v71;
let v81 = v72;
let v82 = v73;
let v83 = v74;
let v84 = v75;
let v85 = v76;
let v86 = v77;
let v87 = v78;
var v395: f32 = fn2(v79,v80,v81,v82,v83,v84,v85,v86,v87);
let v396 = read_params(19i);
let v397 = 1i;
if ((v396==f32(v397))) {
return v395;
}
let v398 = v395;
let v399 = read_params(13i);
if (v399 == 0.0f) { vkf_failed = true; }
let v400 = (v398/v399);
let v401 = 0.5f;
let v402 = (v400+v401);
let v403 = 0.0f;
let v404 = 1.0f;
var v405: f32 = fn6(v402,v403,v404);
let v406 = read_params(19i);
let v407 = 2i;
if ((v406==f32(v407))) {
let v408 = v3;
let v409 = v18;
if (v409 == 0i) { vkf_failed = true; }
var v410: i32 = (v408%v409);
let v411 = v3;
let v412 = v18;
if (f32(v412) == 0.0f) { vkf_failed = true; }
let v413 = floor(f32(v411)/f32(v412));
let v414 = v18;
if (f32(v414) == 0.0f) { vkf_failed = true; }
var v415: i32 = i32((v413%f32(v414)));
let v416 = v3;
let v417 = v18;
let v418 = v18;
let v419 = (v417*v418);
if (f32(v419) == 0.0f) { vkf_failed = true; }
var v420: i32 = i32(floor(f32(v416)/f32(v419)));
let v421 = v410;
let v422 = 0i;
var v427 = (v421==v422);
if (!v427) {
let v423 = v410;
let v424 = v18;
let v425 = 1i;
let v426 = (v424-v425);
v427 = (v423==v426);
}
var v430 = v427;
if (!v430) {
let v428 = v415;
let v429 = 0i;
v430 = (v428==v429);
}
var v435 = v430;
if (!v435) {
let v431 = v415;
let v432 = v18;
let v433 = 1i;
let v434 = (v432-v433);
v435 = (v431==v434);
}
var v436: bool = v435;
let v437 = v10;
let v438 = 3i;
var v446 = (v437==v438);
if (v446) {
let v439 = v420;
let v440 = 0i;
var v445 = (v439==v440);
if (!v445) {
let v441 = v420;
let v442 = v18;
let v443 = 1i;
let v444 = (v442-v443);
v445 = (v441==v444);
}
v446 = v445;
}
if (v446) {
v436 = true;
}
if (v436) {
let v447 = v405;
let v448 = 9.99999997e-07f;
if (!((v447<=v448))) { vkf_failed = true; }
}
}
let v449 = v405;
let v450 = read_params(14i);
return (v449*v450);
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
