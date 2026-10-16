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
let v279 = v113;
let v280 = 2i;
if ((v279==v280)) {
let v281 = v123;
let v282 = 2i;
let v283 = v113;
let v284 = (v282*v283);
let v285 = (v281+v284);
let v286 = v261;
let v287 = v114;
let v288 = (v286*v287);
let v289 = (v285+v288);
let v290 = v253;
var v291: i32 = (v289+v290);
let v292 = 1i;
let v293 = v272;
let v294 = (f32(v292)-v293);
let v295 = 1i;
let v296 = v275;
let v297 = (f32(v295)-v296);
let v298 = (v294*v297);
let v299 = read_values(v291);
var v300: f32 = (v298*v299);
let v301 = v300;
let v302 = v272;
let v303 = 1i;
let v304 = v275;
let v305 = (f32(v303)-v304);
let v306 = (v302*v305);
let v307 = v291;
let v308 = 1i;
let v309 = read_values((v307+v308));
let v310 = (v306*v309);
v300 = (v301+v310);
let v311 = v300;
let v312 = 1i;
let v313 = v272;
let v314 = (f32(v312)-v313);
let v315 = v275;
let v316 = (v314*v315);
let v317 = v291;
let v318 = v114;
let v319 = read_values((v317+v318));
let v320 = (v316*v319);
v300 = (v311+v320);
let v321 = v300;
let v322 = v272;
let v323 = v275;
let v324 = (v322*v323);
let v325 = v291;
let v326 = v114;
let v327 = (v325+v326);
let v328 = 1i;
let v329 = read_values((v327+v328));
let v330 = (v324*v329);
v300 = (v321+v330);
let v331 = v300;
let v332 = v194;
let v333 = 0.0f;
let v334 = fn5(v332,v333);
let v335 = (v331-v334);
let v336 = v160;
return (v335*v336);
}
var v337: i32 = 1i;
let v338 = v113;
let v339 = 3i;
if ((v338==v339)) {
v337 = 2i;
}
var v340: f32 = 0.0f;
var v341: i32 = 0i;
loop {
let v342 = v341;
let v343 = v337;
if (!((v342<v343))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v344: f32 = 1.0f;
let v345 = v113;
let v346 = 3i;
if ((v345==v346)) {
let v347 = 1i;
let v348 = v278;
v344 = (f32(v347)-v348);
let v349 = v341;
let v350 = 1i;
if ((v349==v350)) {
v344 = v278;
}
}
var v351: i32 = 0i;
loop {
let v352 = v351;
let v353 = 2i;
if (!((v352<v353))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v354 = 1i;
let v355 = v275;
var v356: f32 = (f32(v354)-v355);
let v357 = v351;
let v358 = 1i;
if ((v357==v358)) {
v356 = v275;
}
var v359: i32 = 0i;
loop {
let v360 = v359;
let v361 = 2i;
if (!((v360<v361))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v362 = 1i;
let v363 = v272;
var v364: f32 = (f32(v362)-v363);
let v365 = v359;
let v366 = 1i;
if ((v365==v366)) {
v364 = v272;
}
let v367 = v269;
let v368 = v341;
let v369 = (v367+v368);
let v370 = v114;
let v371 = (v369*v370);
let v372 = v114;
let v373 = (v371*v372);
let v374 = v261;
let v375 = v351;
let v376 = (v374+v375);
let v377 = v114;
let v378 = (v376*v377);
let v379 = (v373+v378);
let v380 = v253;
let v381 = (v379+v380);
let v382 = v359;
var v383: i32 = (v381+v382);
let v384 = v340;
let v385 = v364;
let v386 = v356;
let v387 = (v385*v386);
let v388 = v344;
let v389 = (v387*v388);
let v390 = v123;
let v391 = 2i;
let v392 = v113;
let v393 = (v391*v392);
let v394 = (v390+v393);
let v395 = v383;
let v396 = read_values((v394+v395));
let v397 = (v389*v396);
v340 = (v384+v397);
let v398 = v359;
let v399 = 1i;
v359 = (v398+v399);
}
let v400 = v351;
let v401 = 1i;
v351 = (v400+v401);
}
let v402 = v341;
let v403 = 1i;
v341 = (v402+v403);
}
let v404 = v340;
let v405 = v194;
let v406 = 0.0f;
let v407 = fn5(v405,v406);
let v408 = (v404-v407);
let v409 = v160;
return (v408*v409);
}
fn fn7(v432:f32,v433:f32,v434:f32)->f32 {
let v435 = v434;
let v436 = 0i;
if ((v435<=f32(v436))) {
let v437 = v432;
let v438 = v433;
return fn5(v437,v438);
}
let v439 = v434;
let v440 = v432;
let v441 = v433;
let v442 = abs((v440-v441));
let v443 = (v439-v442);
let v444 = 0.0f;
let v445 = fn5(v443,v444);
let v446 = v434;
if (v446 == 0.0f) { vkf_failed = true; }
var v447: f32 = (v445/v446);
let v448 = v432;
let v449 = v433;
let v450 = fn5(v448,v449);
let v451 = v434;
let v452 = v447;
let v453 = (v451*v452);
let v454 = v447;
let v455 = (v453*v454);
let v456 = 4i;
if (f32(v456) == 0.0f) { vkf_failed = true; }
let v457 = (v455/f32(v456));
return (v450+v457);
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
var v410: f32 = fn3(v105,v106,v107,v108,v109,v110,v111,v112);
let v411 = v91;
let v412 = 1i;
if ((v411<=v412)) {
return v410;
}
let v413 = v410;
let v414 = v88;
let v415 = v89;
let v416 = v90;
let v417 = 1i;
let v418 = v92;
let v419 = v93;
let v420 = v94;
let v421 = v95;
let v422 = v414;
let v423 = v415;
let v424 = v416;
let v425 = v417;
let v426 = v418;
let v427 = v419;
let v428 = v420;
let v429 = v421;
let v430 = fn3(v422,v423,v424,v425,v426,v427,v428,v429);
let v431 = v96;
v410 = fn7(v413,v430,v431);
let v458 = v91;
let v459 = 2i;
if ((v458<=v459)) {
return v410;
}
let v460 = v410;
let v461 = v88;
let v462 = v89;
let v463 = v90;
let v464 = 2i;
let v465 = v92;
let v466 = v93;
let v467 = v94;
let v468 = v95;
let v469 = v461;
let v470 = v462;
let v471 = v463;
let v472 = v464;
let v473 = v465;
let v474 = v466;
let v475 = v467;
let v476 = v468;
let v477 = fn3(v469,v470,v471,v472,v473,v474,v475,v476);
let v478 = v96;
v410 = fn7(v460,v477,v478);
let v479 = v91;
let v480 = 3i;
if ((v479<=v480)) {
return v410;
}
var v481: i32 = 3i;
loop {
let v482 = v481;
let v483 = v91;
if (!((v482<v483))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v484 = v410;
let v485 = v88;
let v486 = v89;
let v487 = v90;
let v488 = v481;
let v489 = v92;
let v490 = v93;
let v491 = v94;
let v492 = v95;
let v493 = fn3(v485,v486,v487,v488,v489,v490,v491,v492);
let v494 = v96;
v410 = fn7(v484,v493,v494);
let v495 = v481;
let v496 = 1i;
v481 = (v495+v496);
}
return v410;
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
var v497: f32 = fn2(v79,v80,v81,v82,v83,v84,v85,v86,v87);
let v498 = read_params(19i);
let v499 = 1i;
if ((v498==f32(v499))) {
return v497;
}
let v500 = v497;
let v501 = read_params(13i);
if (v501 == 0.0f) { vkf_failed = true; }
let v502 = (v500/v501);
let v503 = 0.5f;
let v504 = (v502+v503);
let v505 = 0.0f;
let v506 = 1.0f;
var v507: f32 = fn6(v504,v505,v506);
let v508 = read_params(19i);
let v509 = 2i;
if ((v508==f32(v509))) {
let v510 = v3;
let v511 = v18;
if (v511 == 0i) { vkf_failed = true; }
var v512: i32 = (v510%v511);
let v513 = v3;
let v514 = v18;
if (f32(v514) == 0.0f) { vkf_failed = true; }
let v515 = floor(f32(v513)/f32(v514));
let v516 = v18;
if (f32(v516) == 0.0f) { vkf_failed = true; }
var v517: i32 = i32((v515%f32(v516)));
let v518 = v3;
let v519 = v18;
let v520 = v18;
let v521 = (v519*v520);
if (f32(v521) == 0.0f) { vkf_failed = true; }
var v522: i32 = i32(floor(f32(v518)/f32(v521)));
let v523 = v512;
let v524 = 0i;
var v529 = (v523==v524);
if (!v529) {
let v525 = v512;
let v526 = v18;
let v527 = 1i;
let v528 = (v526-v527);
v529 = (v525==v528);
}
var v532 = v529;
if (!v532) {
let v530 = v517;
let v531 = 0i;
v532 = (v530==v531);
}
var v537 = v532;
if (!v537) {
let v533 = v517;
let v534 = v18;
let v535 = 1i;
let v536 = (v534-v535);
v537 = (v533==v536);
}
var v538: bool = v537;
let v539 = v10;
let v540 = 3i;
var v548 = (v539==v540);
if (v548) {
let v541 = v522;
let v542 = 0i;
var v547 = (v541==v542);
if (!v547) {
let v543 = v522;
let v544 = v18;
let v545 = 1i;
let v546 = (v544-v545);
v547 = (v543==v546);
}
v548 = v547;
}
if (v548) {
v538 = true;
}
if (v538) {
let v549 = v507;
let v550 = 9.99999997e-07f;
if (!((v549<=v550))) { vkf_failed = true; }
}
}
let v551 = v507;
let v552 = read_params(14i);
return (v551*v552);
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
