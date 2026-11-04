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
fn fn5(v182:f32,v183:f32)->f32 {
let v184 = v182;
let v185 = v183;
if ((v184<v185)) {
return v182;
}
return v183;
}
fn fn6(v212:f32,v213:f32)->f32 {
let v214 = v212;
let v215 = v213;
if ((v214>v215)) {
return v212;
}
return v213;
}
fn fn7(v234:f32,v235:f32,v236:f32)->f32 {
let v237 = v236;
let v238 = v235;
let v239 = v234;
let v240 = fn6(v238,v239);
return fn5(v237,v240);
}
fn fn8(v332:f32,v333:f32,v334:f32,v335:f32,v336:f32,v337:f32)->f32 {
let v338 = 1i;
let v339 = v336;
let v340 = (f32(v338)-v339);
let v341 = 1i;
let v342 = v337;
let v343 = (f32(v341)-v342);
let v344 = (v340*v343);
let v345 = v332;
var v346: f32 = (v344*v345);
let v347 = v346;
let v348 = v336;
let v349 = 1i;
let v350 = v337;
let v351 = (f32(v349)-v350);
let v352 = (v348*v351);
let v353 = v333;
let v354 = (v352*v353);
v346 = (v347+v354);
let v355 = v346;
let v356 = 1i;
let v357 = v336;
let v358 = (f32(v356)-v357);
let v359 = v337;
let v360 = (v358*v359);
let v361 = v334;
let v362 = (v360*v361);
v346 = (v355+v362);
let v363 = v346;
let v364 = v336;
let v365 = v337;
let v366 = (v364*v365);
let v367 = v335;
let v368 = (v366*v367);
v346 = (v363+v368);
return v346;
}
fn fn4(v139:i32,v140:i32,v141:i32,v142:i32,v143:f32,v144:f32,v145:f32,v146:f32)->f32 {
let v147 = v142;
let v148 = v141;
var v149: i32 = (v147*v148);
let v150 = v149;
let v151 = v139;
let v152 = read_values((v150+v151));
let v153 = v146;
var v154: f32 = (v152*v153);
let v155 = v149;
let v156 = v139;
let v157 = (v155+v156);
let v158 = 1i;
let v159 = read_values((v157+v158));
let v160 = v146;
var v161: f32 = (v159*v160);
let v162 = v154;
let v163 = 0i;
var v166 = (v162>f32(v163));
if (v166) {
let v164 = v161;
let v165 = 0i;
v166 = (v164>f32(v165));
}
if (!(v166)) { vkf_failed = true; }
let v167 = v143;
let v168 = read_values(v149);
let v169 = (v167-v168);
let v170 = v154;
if (v170 == 0.0f) { vkf_failed = true; }
var v171: f32 = (v169/v170);
let v172 = v144;
let v173 = v149;
let v174 = 1i;
let v175 = read_values((v173+v174));
let v176 = (v172-v175);
let v177 = v161;
if (v177 == 0.0f) { vkf_failed = true; }
var v178: f32 = (v176/v177);
var v179: f32 = 0.0f;
let v180 = v154;
let v181 = v161;
var v186: f32 = fn5(v180,v181);
let v187 = v139;
let v188 = 3i;
if ((v187==v188)) {
let v189 = v149;
let v190 = v139;
let v191 = (v189+v190);
let v192 = 2i;
let v193 = read_values((v191+v192));
let v194 = v146;
var v195: f32 = (v193*v194);
let v196 = v195;
let v197 = 0i;
if (!((v196>f32(v197)))) { vkf_failed = true; }
let v198 = v145;
let v199 = v149;
let v200 = 2i;
let v201 = read_values((v199+v200));
let v202 = (v198-v201);
let v203 = v195;
if (v203 == 0.0f) { vkf_failed = true; }
v179 = (v202/v203);
let v204 = v186;
let v205 = v195;
v186 = fn5(v204,v205);
}
let v206 = abs(v171);
let v207 = 1i;
let v208 = (v206-f32(v207));
let v209 = abs(v178);
let v210 = 1i;
let v211 = (v209-f32(v210));
let v216 = fn6(v208,v211);
let v217 = abs(v179);
let v218 = 1i;
let v219 = (v217-f32(v218));
var v220: f32 = fn6(v216,v219);
let v221 = v171;
let v222 = 1i;
let v223 = (v221+f32(v222));
let v224 = v140;
let v225 = 1i;
let v226 = (v224-v225);
let v227 = (v223*f32(v226));
let v228 = 2i;
if (f32(v228) == 0.0f) { vkf_failed = true; }
let v229 = (v227/f32(v228));
let v230 = 0.0f;
let v231 = v140;
let v232 = 1i;
let v233 = (v231-v232);
var v241: f32 = fn7(v229,v230,f32(v233));
let v242 = v178;
let v243 = 1i;
let v244 = (v242+f32(v243));
let v245 = v140;
let v246 = 1i;
let v247 = (v245-v246);
let v248 = (v244*f32(v247));
let v249 = 2i;
if (f32(v249) == 0.0f) { vkf_failed = true; }
let v250 = (v248/f32(v249));
let v251 = 0.0f;
let v252 = v140;
let v253 = 1i;
let v254 = (v252-v253);
var v255: f32 = fn7(v250,v251,f32(v254));
var v256: f32 = 0.0f;
let v257 = v139;
let v258 = 3i;
if ((v257==v258)) {
let v259 = v179;
let v260 = 1i;
let v261 = (v259+f32(v260));
let v262 = v140;
let v263 = 1i;
let v264 = (v262-v263);
let v265 = (v261*f32(v264));
let v266 = 2i;
if (f32(v266) == 0.0f) { vkf_failed = true; }
let v267 = (v265/f32(v266));
let v268 = 0.0f;
let v269 = v140;
let v270 = 1i;
let v271 = (v269-v270);
v256 = fn7(v267,v268,f32(v271));
}
let v272 = v241;
let v273 = 1i;
if (f32(v273) == 0.0f) { vkf_failed = true; }
let v274 = floor(v272/f32(v273));
let v275 = v140;
let v276 = 2i;
let v277 = (v275-v276);
let v278 = fn5(v274,f32(v277));
if (!(abs(v278) < 2147483648.0f)) { vkf_failed = true; }
var v279: i32 = i32(v278);
let v280 = v255;
let v281 = 1i;
if (f32(v281) == 0.0f) { vkf_failed = true; }
let v282 = floor(v280/f32(v281));
let v283 = v140;
let v284 = 2i;
let v285 = (v283-v284);
let v286 = fn5(v282,f32(v285));
if (!(abs(v286) < 2147483648.0f)) { vkf_failed = true; }
var v287: i32 = i32(v286);
let v288 = v256;
let v289 = 1i;
if (f32(v289) == 0.0f) { vkf_failed = true; }
let v290 = floor(v288/f32(v289));
let v291 = v140;
let v292 = 2i;
let v293 = (v291-v292);
let v294 = fn5(v290,f32(v293));
if (!(abs(v294) < 2147483648.0f)) { vkf_failed = true; }
var v295: i32 = i32(v294);
let v296 = v241;
let v297 = v279;
var v298: f32 = (v296-f32(v297));
let v299 = v255;
let v300 = v287;
var v301: f32 = (v299-f32(v300));
let v302 = v256;
let v303 = v295;
var v304: f32 = (v302-f32(v303));
let v305 = v139;
let v306 = 2i;
if ((v305==v306)) {
let v307 = v149;
let v308 = 2i;
let v309 = v139;
let v310 = (v308*v309);
let v311 = (v307+v310);
let v312 = v287;
let v313 = v140;
let v314 = (v312*v313);
let v315 = (v311+v314);
let v316 = v279;
var v317: i32 = (v315+v316);
let v318 = read_values(v317);
let v319 = v317;
let v320 = 1i;
let v321 = read_values((v319+v320));
let v322 = v317;
let v323 = v140;
let v324 = read_values((v322+v323));
let v325 = v317;
let v326 = v140;
let v327 = (v325+v326);
let v328 = 1i;
let v329 = read_values((v327+v328));
let v330 = v298;
let v331 = v301;
var v369: f32 = fn8(v318,v321,v324,v329,v330,v331);
let v370 = v369;
let v371 = v220;
let v372 = 0.0f;
let v373 = fn6(v371,v372);
let v374 = (v370-v373);
let v375 = v186;
return (v374*v375);
}
var v376: i32 = 1i;
let v377 = v139;
let v378 = 3i;
if ((v377==v378)) {
v376 = 2i;
}
var v379: f32 = 0.0f;
var v380: i32 = 0i;
loop {
let v381 = v380;
let v382 = v376;
if (!((v381<v382))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v383: f32 = 1.0f;
let v384 = v139;
let v385 = 3i;
if ((v384==v385)) {
let v386 = 1i;
let v387 = v304;
v383 = (f32(v386)-v387);
let v388 = v380;
let v389 = 1i;
if ((v388==v389)) {
v383 = v304;
}
}
var v390: i32 = 0i;
loop {
let v391 = v390;
let v392 = 2i;
if (!((v391<v392))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v393 = 1i;
let v394 = v301;
var v395: f32 = (f32(v393)-v394);
let v396 = v390;
let v397 = 1i;
if ((v396==v397)) {
v395 = v301;
}
var v398: i32 = 0i;
loop {
let v399 = v398;
let v400 = 2i;
if (!((v399<v400))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v401 = 1i;
let v402 = v298;
var v403: f32 = (f32(v401)-v402);
let v404 = v398;
let v405 = 1i;
if ((v404==v405)) {
v403 = v298;
}
let v406 = v295;
let v407 = v380;
let v408 = (v406+v407);
let v409 = v140;
let v410 = (v408*v409);
let v411 = v140;
let v412 = (v410*v411);
let v413 = v287;
let v414 = v390;
let v415 = (v413+v414);
let v416 = v140;
let v417 = (v415*v416);
let v418 = (v412+v417);
let v419 = v279;
let v420 = (v418+v419);
let v421 = v398;
var v422: i32 = (v420+v421);
let v423 = v379;
let v424 = v403;
let v425 = v395;
let v426 = (v424*v425);
let v427 = v383;
let v428 = (v426*v427);
let v429 = v149;
let v430 = 2i;
let v431 = v139;
let v432 = (v430*v431);
let v433 = (v429+v432);
let v434 = v422;
let v435 = read_values((v433+v434));
let v436 = (v428*v435);
v379 = (v423+v436);
let v437 = v398;
let v438 = 1i;
v398 = (v437+v438);
}
let v439 = v390;
let v440 = 1i;
v390 = (v439+v440);
}
let v441 = v380;
let v442 = 1i;
v380 = (v441+v442);
}
let v443 = v379;
let v444 = v220;
let v445 = 0.0f;
let v446 = fn6(v444,v445);
let v447 = (v443-v446);
let v448 = v186;
return (v447*v448);
}
fn fn9(v471:f32,v472:f32,v473:f32)->f32 {
let v474 = v473;
let v475 = 0i;
if ((v474<=f32(v475))) {
let v476 = v471;
let v477 = v472;
return fn6(v476,v477);
}
let v478 = v473;
let v479 = v471;
let v480 = v472;
let v481 = abs((v479-v480));
let v482 = (v478-v481);
let v483 = 0.0f;
let v484 = fn6(v482,v483);
let v485 = v473;
if (v485 == 0.0f) { vkf_failed = true; }
var v486: f32 = (v484/v485);
let v487 = v471;
let v488 = v472;
let v489 = fn6(v487,v488);
let v490 = v473;
let v491 = v486;
let v492 = (v490*v491);
let v493 = v486;
let v494 = (v492*v493);
let v495 = 4i;
if (f32(v495) == 0.0f) { vkf_failed = true; }
let v496 = (v494/f32(v495));
return (v489+v496);
}
fn fn3(v114:i32,v115:i32,v116:i32,v117:i32,v118:f32,v119:f32,v120:f32,v121:f32,v122:f32)->f32 {
let v123 = v114;
let v124 = v115;
let v125 = v116;
let v126 = 0i;
let v127 = v118;
let v128 = v119;
let v129 = v120;
let v130 = v121;
let v131 = v123;
let v132 = v124;
let v133 = v125;
let v134 = v126;
let v135 = v127;
let v136 = v128;
let v137 = v129;
let v138 = v130;
var v449: f32 = fn4(v131,v132,v133,v134,v135,v136,v137,v138);
let v450 = v117;
let v451 = 1i;
if ((v450<=v451)) {
return v449;
}
let v452 = v449;
let v453 = v114;
let v454 = v115;
let v455 = v116;
let v456 = 1i;
let v457 = v118;
let v458 = v119;
let v459 = v120;
let v460 = v121;
let v461 = v453;
let v462 = v454;
let v463 = v455;
let v464 = v456;
let v465 = v457;
let v466 = v458;
let v467 = v459;
let v468 = v460;
let v469 = fn4(v461,v462,v463,v464,v465,v466,v467,v468);
let v470 = v122;
v449 = fn9(v452,v469,v470);
let v497 = v117;
let v498 = 2i;
if ((v497<=v498)) {
return v449;
}
let v499 = v449;
let v500 = v114;
let v501 = v115;
let v502 = v116;
let v503 = 2i;
let v504 = v118;
let v505 = v119;
let v506 = v120;
let v507 = v121;
let v508 = v500;
let v509 = v501;
let v510 = v502;
let v511 = v503;
let v512 = v504;
let v513 = v505;
let v514 = v506;
let v515 = v507;
let v516 = fn4(v508,v509,v510,v511,v512,v513,v514,v515);
let v517 = v122;
v449 = fn9(v499,v516,v517);
let v518 = v117;
let v519 = 3i;
if ((v518<=v519)) {
return v449;
}
var v520: i32 = 3i;
loop {
let v521 = v520;
let v522 = v117;
if (!((v521<v522))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v523 = v449;
let v524 = v114;
let v525 = v115;
let v526 = v116;
let v527 = v520;
let v528 = v118;
let v529 = v119;
let v530 = v120;
let v531 = v121;
let v532 = fn4(v524,v525,v526,v527,v528,v529,v530,v531);
let v533 = v122;
v449 = fn9(v523,v532,v533);
let v534 = v520;
let v535 = 1i;
v520 = (v534+v535);
}
return v449;
}
fn fn2(v29:i32)->f32 {
let v30 = read_params(30i);
let v31 = 1i;
var v34 = (v30==f32(v31));
if (v34) {
let v32 = read_params(19i);
let v33 = 0i;
v34 = (v32==f32(v33));
}
if (v34) {
return 0.0f;
}
let v35 = read_params(0i);
if (!(abs(v35) < 2147483648.0f)) { vkf_failed = true; }
var v36: i32 = i32(v35);
let v37 = read_params(1i);
if (!(abs(v37) < 2147483648.0f)) { vkf_failed = true; }
var v38: i32 = i32(v37);
let v39 = read_params(2i);
if (!(abs(v39) < 2147483648.0f)) { vkf_failed = true; }
var v40: i32 = i32(v39);
let v41 = read_params(3i);
if (!(abs(v41) < 2147483648.0f)) { vkf_failed = true; }
var v42: i32 = i32(v41);
let v43 = read_params(4i);
if (!(abs(v43) < 2147483648.0f)) { vkf_failed = true; }
var v44: i32 = i32(v43);
var v45: i32 = v44;
var v46: f32 = 0.5f;
let v47 = read_params(19i);
let v48 = 1i;
if ((v47==f32(v48))) {
let v49 = v44;
let v50 = 1i;
v45 = (v49-v50);
v46 = f32(0i);
}
let v51 = read_params(5i);
let v52 = v29;
let v53 = v44;
if (v53 == 0i) { vkf_failed = true; }
let v54 = (v52%v53);
let v55 = v46;
let v56 = (f32(v54)+v55);
let v57 = read_params(8i);
let v58 = read_params(5i);
let v59 = (v57-v58);
let v60 = (v56*v59);
let v61 = v45;
if (f32(v61) == 0.0f) { vkf_failed = true; }
let v62 = (v60/f32(v61));
var v63: f32 = (v51+v62);
let v64 = read_params(6i);
let v65 = v29;
let v66 = v44;
if (f32(v66) == 0.0f) { vkf_failed = true; }
let v67 = floor(f32(v65)/f32(v66));
let v68 = v44;
if (f32(v68) == 0.0f) { vkf_failed = true; }
let v69 = (v67%f32(v68));
let v70 = v46;
let v71 = (v69+v70);
let v72 = read_params(9i);
let v73 = read_params(6i);
let v74 = (v72-v73);
let v75 = (v71*v74);
let v76 = v45;
if (f32(v76) == 0.0f) { vkf_failed = true; }
let v77 = (v75/f32(v76));
var v78: f32 = (v64+v77);
var v79: f32 = 0.0f;
let v80 = v36;
let v81 = 3i;
if ((v80==v81)) {
let v82 = read_params(7i);
let v83 = v29;
let v84 = v44;
let v85 = v44;
let v86 = (v84*v85);
if (f32(v86) == 0.0f) { vkf_failed = true; }
let v87 = floor(f32(v83)/f32(v86));
let v88 = v46;
let v89 = (v87+v88);
let v90 = read_params(10i);
let v91 = read_params(7i);
let v92 = (v90-v91);
let v93 = (v89*v92);
let v94 = v45;
if (f32(v94) == 0.0f) { vkf_failed = true; }
let v95 = (v93/f32(v94));
v79 = (v82+v95);
}
let v96 = v36;
let v97 = v38;
let v98 = v40;
let v99 = v42;
let v100 = v63;
let v101 = v78;
let v102 = v79;
let v103 = read_params(11i);
let v104 = read_params(12i);
let v105 = v96;
let v106 = v97;
let v107 = v98;
let v108 = v99;
let v109 = v100;
let v110 = v101;
let v111 = v102;
let v112 = v103;
let v113 = v104;
var v536: f32 = fn3(v105,v106,v107,v108,v109,v110,v111,v112,v113);
let v537 = read_params(19i);
let v538 = 1i;
if ((v537==f32(v538))) {
return v536;
}
let v539 = v536;
let v540 = read_params(13i);
if (v540 == 0.0f) { vkf_failed = true; }
let v541 = (v539/v540);
let v542 = 0.5f;
let v543 = (v541+v542);
let v544 = 0.0f;
let v545 = 1.0f;
var v546: f32 = fn7(v543,v544,v545);
let v547 = read_params(19i);
let v548 = 2i;
if ((v547==f32(v548))) {
let v549 = v29;
let v550 = v44;
if (v550 == 0i) { vkf_failed = true; }
var v551: i32 = (v549%v550);
let v552 = v29;
let v553 = v44;
if (f32(v553) == 0.0f) { vkf_failed = true; }
let v554 = floor(f32(v552)/f32(v553));
let v555 = v44;
if (f32(v555) == 0.0f) { vkf_failed = true; }
var v556: i32 = i32((v554%f32(v555)));
let v557 = v29;
let v558 = v44;
let v559 = v44;
let v560 = (v558*v559);
if (f32(v560) == 0.0f) { vkf_failed = true; }
var v561: i32 = i32(floor(f32(v557)/f32(v560)));
let v562 = v551;
let v563 = 0i;
var v568 = (v562==v563);
if (!v568) {
let v564 = v551;
let v565 = v44;
let v566 = 1i;
let v567 = (v565-v566);
v568 = (v564==v567);
}
var v571 = v568;
if (!v571) {
let v569 = v556;
let v570 = 0i;
v571 = (v569==v570);
}
var v576 = v571;
if (!v576) {
let v572 = v556;
let v573 = v44;
let v574 = 1i;
let v575 = (v573-v574);
v576 = (v572==v575);
}
var v577: bool = v576;
let v578 = v36;
let v579 = 3i;
var v587 = (v578==v579);
if (v587) {
let v580 = v561;
let v581 = 0i;
var v586 = (v580==v581);
if (!v586) {
let v582 = v561;
let v583 = v44;
let v584 = 1i;
let v585 = (v583-v584);
v586 = (v582==v585);
}
v587 = v586;
}
if (v587) {
v577 = true;
}
if (v577) {
let v588 = v546;
let v589 = 9.99999997e-07f;
if (!((v588<=v589))) { vkf_failed = true; }
}
}
let v590 = v546;
let v591 = read_params(14i);
return (v590*v591);
}
fn fn1(v3:i32)->f32 {
let v4 = read_params(30i);
let v5 = 1i;
if ((v4==f32(v5))) {
return 0.0f;
}
let v6 = read_params(4i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = v7;
let v9 = v7;
var v10: i32 = (v8*v9);
let v11 = read_params(0i);
let v12 = 3i;
if ((v11==f32(v12))) {
let v13 = v10;
let v14 = v7;
v10 = (v13*v14);
}
var v15: f32 = 0.0f;
let v16 = v3;
let v17 = 8i;
var v18: i32 = (v16*v17);
let v19 = v18;
let v20 = 8i;
var v21: i32 = (v19+v20);
loop {
let v22 = v18;
let v23 = v21;
var v26 = (v22<v23);
if (v26) {
let v24 = v18;
let v25 = v10;
v26 = (v24<v25);
}
if (!(v26)) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v27 = v15;
let v28 = v18;
let v592 = fn2(v28);
v15 = (v27+v592);
let v593 = v18;
let v594 = 1i;
v18 = (v593+v594);
}
return v15;
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
