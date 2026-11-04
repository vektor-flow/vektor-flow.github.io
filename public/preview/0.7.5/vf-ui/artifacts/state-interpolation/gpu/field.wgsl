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
fn fn7(v306:f32,v307:f32,v308:f32,v309:f32,v310:f32,v311:f32)->f32 {
let v312 = 1i;
let v313 = v310;
let v314 = (f32(v312)-v313);
let v315 = 1i;
let v316 = v311;
let v317 = (f32(v315)-v316);
let v318 = (v314*v317);
let v319 = v306;
var v320: f32 = (v318*v319);
let v321 = v320;
let v322 = v310;
let v323 = 1i;
let v324 = v311;
let v325 = (f32(v323)-v324);
let v326 = (v322*v325);
let v327 = v307;
let v328 = (v326*v327);
v320 = (v321+v328);
let v329 = v320;
let v330 = 1i;
let v331 = v310;
let v332 = (f32(v330)-v331);
let v333 = v311;
let v334 = (v332*v333);
let v335 = v308;
let v336 = (v334*v335);
v320 = (v329+v336);
let v337 = v320;
let v338 = v310;
let v339 = v311;
let v340 = (v338*v339);
let v341 = v309;
let v342 = (v340*v341);
v320 = (v337+v342);
return v320;
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
let v292 = read_values(v291);
let v293 = v291;
let v294 = 1i;
let v295 = read_values((v293+v294));
let v296 = v291;
let v297 = v114;
let v298 = read_values((v296+v297));
let v299 = v291;
let v300 = v114;
let v301 = (v299+v300);
let v302 = 1i;
let v303 = read_values((v301+v302));
let v304 = v272;
let v305 = v275;
var v343: f32 = fn7(v292,v295,v298,v303,v304,v305);
let v344 = v343;
let v345 = v194;
let v346 = 0.0f;
let v347 = fn5(v345,v346);
let v348 = (v344-v347);
let v349 = v160;
return (v348*v349);
}
var v350: i32 = 1i;
let v351 = v113;
let v352 = 3i;
if ((v351==v352)) {
v350 = 2i;
}
var v353: f32 = 0.0f;
var v354: i32 = 0i;
loop {
let v355 = v354;
let v356 = v350;
if (!((v355<v356))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v357: f32 = 1.0f;
let v358 = v113;
let v359 = 3i;
if ((v358==v359)) {
let v360 = 1i;
let v361 = v278;
v357 = (f32(v360)-v361);
let v362 = v354;
let v363 = 1i;
if ((v362==v363)) {
v357 = v278;
}
}
var v364: i32 = 0i;
loop {
let v365 = v364;
let v366 = 2i;
if (!((v365<v366))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v367 = 1i;
let v368 = v275;
var v369: f32 = (f32(v367)-v368);
let v370 = v364;
let v371 = 1i;
if ((v370==v371)) {
v369 = v275;
}
var v372: i32 = 0i;
loop {
let v373 = v372;
let v374 = 2i;
if (!((v373<v374))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v375 = 1i;
let v376 = v272;
var v377: f32 = (f32(v375)-v376);
let v378 = v372;
let v379 = 1i;
if ((v378==v379)) {
v377 = v272;
}
let v380 = v269;
let v381 = v354;
let v382 = (v380+v381);
let v383 = v114;
let v384 = (v382*v383);
let v385 = v114;
let v386 = (v384*v385);
let v387 = v261;
let v388 = v364;
let v389 = (v387+v388);
let v390 = v114;
let v391 = (v389*v390);
let v392 = (v386+v391);
let v393 = v253;
let v394 = (v392+v393);
let v395 = v372;
var v396: i32 = (v394+v395);
let v397 = v353;
let v398 = v377;
let v399 = v369;
let v400 = (v398*v399);
let v401 = v357;
let v402 = (v400*v401);
let v403 = v123;
let v404 = 2i;
let v405 = v113;
let v406 = (v404*v405);
let v407 = (v403+v406);
let v408 = v396;
let v409 = read_values((v407+v408));
let v410 = (v402*v409);
v353 = (v397+v410);
let v411 = v372;
let v412 = 1i;
v372 = (v411+v412);
}
let v413 = v364;
let v414 = 1i;
v364 = (v413+v414);
}
let v415 = v354;
let v416 = 1i;
v354 = (v415+v416);
}
let v417 = v353;
let v418 = v194;
let v419 = 0.0f;
let v420 = fn5(v418,v419);
let v421 = (v417-v420);
let v422 = v160;
return (v421*v422);
}
fn fn8(v445:f32,v446:f32,v447:f32)->f32 {
let v448 = v447;
let v449 = 0i;
if ((v448<=f32(v449))) {
let v450 = v445;
let v451 = v446;
return fn5(v450,v451);
}
let v452 = v447;
let v453 = v445;
let v454 = v446;
let v455 = abs((v453-v454));
let v456 = (v452-v455);
let v457 = 0.0f;
let v458 = fn5(v456,v457);
let v459 = v447;
if (v459 == 0.0f) { vkf_failed = true; }
var v460: f32 = (v458/v459);
let v461 = v445;
let v462 = v446;
let v463 = fn5(v461,v462);
let v464 = v447;
let v465 = v460;
let v466 = (v464*v465);
let v467 = v460;
let v468 = (v466*v467);
let v469 = 4i;
if (f32(v469) == 0.0f) { vkf_failed = true; }
let v470 = (v468/f32(v469));
return (v463+v470);
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
var v423: f32 = fn3(v105,v106,v107,v108,v109,v110,v111,v112);
let v424 = v91;
let v425 = 1i;
if ((v424<=v425)) {
return v423;
}
let v426 = v423;
let v427 = v88;
let v428 = v89;
let v429 = v90;
let v430 = 1i;
let v431 = v92;
let v432 = v93;
let v433 = v94;
let v434 = v95;
let v435 = v427;
let v436 = v428;
let v437 = v429;
let v438 = v430;
let v439 = v431;
let v440 = v432;
let v441 = v433;
let v442 = v434;
let v443 = fn3(v435,v436,v437,v438,v439,v440,v441,v442);
let v444 = v96;
v423 = fn8(v426,v443,v444);
let v471 = v91;
let v472 = 2i;
if ((v471<=v472)) {
return v423;
}
let v473 = v423;
let v474 = v88;
let v475 = v89;
let v476 = v90;
let v477 = 2i;
let v478 = v92;
let v479 = v93;
let v480 = v94;
let v481 = v95;
let v482 = v474;
let v483 = v475;
let v484 = v476;
let v485 = v477;
let v486 = v478;
let v487 = v479;
let v488 = v480;
let v489 = v481;
let v490 = fn3(v482,v483,v484,v485,v486,v487,v488,v489);
let v491 = v96;
v423 = fn8(v473,v490,v491);
let v492 = v91;
let v493 = 3i;
if ((v492<=v493)) {
return v423;
}
var v494: i32 = 3i;
loop {
let v495 = v494;
let v496 = v91;
if (!((v495<v496))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v497 = v423;
let v498 = v88;
let v499 = v89;
let v500 = v90;
let v501 = v494;
let v502 = v92;
let v503 = v93;
let v504 = v94;
let v505 = v95;
let v506 = fn3(v498,v499,v500,v501,v502,v503,v504,v505);
let v507 = v96;
v423 = fn8(v497,v506,v507);
let v508 = v494;
let v509 = 1i;
v494 = (v508+v509);
}
return v423;
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
var v510: f32 = fn2(v79,v80,v81,v82,v83,v84,v85,v86,v87);
let v511 = read_params(19i);
let v512 = 1i;
if ((v511==f32(v512))) {
return v510;
}
let v513 = v510;
let v514 = read_params(13i);
if (v514 == 0.0f) { vkf_failed = true; }
let v515 = (v513/v514);
let v516 = 0.5f;
let v517 = (v515+v516);
let v518 = 0.0f;
let v519 = 1.0f;
var v520: f32 = fn6(v517,v518,v519);
let v521 = read_params(19i);
let v522 = 2i;
if ((v521==f32(v522))) {
let v523 = v3;
let v524 = v18;
if (v524 == 0i) { vkf_failed = true; }
var v525: i32 = (v523%v524);
let v526 = v3;
let v527 = v18;
if (f32(v527) == 0.0f) { vkf_failed = true; }
let v528 = floor(f32(v526)/f32(v527));
let v529 = v18;
if (f32(v529) == 0.0f) { vkf_failed = true; }
var v530: i32 = i32((v528%f32(v529)));
let v531 = v3;
let v532 = v18;
let v533 = v18;
let v534 = (v532*v533);
if (f32(v534) == 0.0f) { vkf_failed = true; }
var v535: i32 = i32(floor(f32(v531)/f32(v534)));
let v536 = v525;
let v537 = 0i;
var v542 = (v536==v537);
if (!v542) {
let v538 = v525;
let v539 = v18;
let v540 = 1i;
let v541 = (v539-v540);
v542 = (v538==v541);
}
var v545 = v542;
if (!v545) {
let v543 = v530;
let v544 = 0i;
v545 = (v543==v544);
}
var v550 = v545;
if (!v550) {
let v546 = v530;
let v547 = v18;
let v548 = 1i;
let v549 = (v547-v548);
v550 = (v546==v549);
}
var v551: bool = v550;
let v552 = v10;
let v553 = 3i;
var v561 = (v552==v553);
if (v561) {
let v554 = v535;
let v555 = 0i;
var v560 = (v554==v555);
if (!v560) {
let v556 = v535;
let v557 = v18;
let v558 = 1i;
let v559 = (v557-v558);
v560 = (v556==v559);
}
v561 = v560;
}
if (v561) {
v551 = true;
}
if (v551) {
let v562 = v520;
let v563 = 9.99999997e-07f;
if (!((v562<=v563))) { vkf_failed = true; }
}
}
let v564 = v520;
let v565 = read_params(14i);
return (v564*v565);
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
