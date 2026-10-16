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
fn fn5(v196:f32,v197:f32)->f32 {
let v198 = v196;
let v199 = v197;
if ((v198<v199)) {
return v196;
}
return v197;
}
fn fn6(v226:f32,v227:f32)->f32 {
let v228 = v226;
let v229 = v227;
if ((v228>v229)) {
return v226;
}
return v227;
}
fn fn7(v248:f32,v249:f32,v250:f32)->f32 {
let v251 = v250;
let v252 = v249;
let v253 = v248;
let v254 = fn6(v252,v253);
return fn5(v251,v254);
}
fn fn4(v153:i32,v154:i32,v155:i32,v156:i32,v157:f32,v158:f32,v159:f32,v160:f32)->f32 {
let v161 = v156;
let v162 = v155;
var v163: i32 = (v161*v162);
let v164 = v163;
let v165 = v153;
let v166 = read_values((v164+v165));
let v167 = v160;
var v168: f32 = (v166*v167);
let v169 = v163;
let v170 = v153;
let v171 = (v169+v170);
let v172 = 1i;
let v173 = read_values((v171+v172));
let v174 = v160;
var v175: f32 = (v173*v174);
let v176 = v168;
let v177 = 0i;
var v180 = (v176>f32(v177));
if (v180) {
let v178 = v175;
let v179 = 0i;
v180 = (v178>f32(v179));
}
if (!(v180)) { vkf_failed = true; }
let v181 = v157;
let v182 = read_values(v163);
let v183 = (v181-v182);
let v184 = v168;
if (v184 == 0.0f) { vkf_failed = true; }
var v185: f32 = (v183/v184);
let v186 = v158;
let v187 = v163;
let v188 = 1i;
let v189 = read_values((v187+v188));
let v190 = (v186-v189);
let v191 = v175;
if (v191 == 0.0f) { vkf_failed = true; }
var v192: f32 = (v190/v191);
var v193: f32 = 0.0f;
let v194 = v168;
let v195 = v175;
var v200: f32 = fn5(v194,v195);
let v201 = v153;
let v202 = 3i;
if ((v201==v202)) {
let v203 = v163;
let v204 = v153;
let v205 = (v203+v204);
let v206 = 2i;
let v207 = read_values((v205+v206));
let v208 = v160;
var v209: f32 = (v207*v208);
let v210 = v209;
let v211 = 0i;
if (!((v210>f32(v211)))) { vkf_failed = true; }
let v212 = v159;
let v213 = v163;
let v214 = 2i;
let v215 = read_values((v213+v214));
let v216 = (v212-v215);
let v217 = v209;
if (v217 == 0.0f) { vkf_failed = true; }
v193 = (v216/v217);
let v218 = v200;
let v219 = v209;
v200 = fn5(v218,v219);
}
let v220 = abs(v185);
let v221 = 1i;
let v222 = (v220-f32(v221));
let v223 = abs(v192);
let v224 = 1i;
let v225 = (v223-f32(v224));
let v230 = fn6(v222,v225);
let v231 = abs(v193);
let v232 = 1i;
let v233 = (v231-f32(v232));
var v234: f32 = fn6(v230,v233);
let v235 = v185;
let v236 = 1i;
let v237 = (v235+f32(v236));
let v238 = v154;
let v239 = 1i;
let v240 = (v238-v239);
let v241 = (v237*f32(v240));
let v242 = 2i;
if (f32(v242) == 0.0f) { vkf_failed = true; }
let v243 = (v241/f32(v242));
let v244 = 0.0f;
let v245 = v154;
let v246 = 1i;
let v247 = (v245-v246);
var v255: f32 = fn7(v243,v244,f32(v247));
let v256 = v192;
let v257 = 1i;
let v258 = (v256+f32(v257));
let v259 = v154;
let v260 = 1i;
let v261 = (v259-v260);
let v262 = (v258*f32(v261));
let v263 = 2i;
if (f32(v263) == 0.0f) { vkf_failed = true; }
let v264 = (v262/f32(v263));
let v265 = 0.0f;
let v266 = v154;
let v267 = 1i;
let v268 = (v266-v267);
var v269: f32 = fn7(v264,v265,f32(v268));
var v270: f32 = 0.0f;
let v271 = v153;
let v272 = 3i;
if ((v271==v272)) {
let v273 = v193;
let v274 = 1i;
let v275 = (v273+f32(v274));
let v276 = v154;
let v277 = 1i;
let v278 = (v276-v277);
let v279 = (v275*f32(v278));
let v280 = 2i;
if (f32(v280) == 0.0f) { vkf_failed = true; }
let v281 = (v279/f32(v280));
let v282 = 0.0f;
let v283 = v154;
let v284 = 1i;
let v285 = (v283-v284);
v270 = fn7(v281,v282,f32(v285));
}
let v286 = v255;
let v287 = 1i;
if (f32(v287) == 0.0f) { vkf_failed = true; }
let v288 = floor(v286/f32(v287));
let v289 = v154;
let v290 = 2i;
let v291 = (v289-v290);
let v292 = fn5(v288,f32(v291));
if (!(abs(v292) < 2147483648.0f)) { vkf_failed = true; }
var v293: i32 = i32(v292);
let v294 = v269;
let v295 = 1i;
if (f32(v295) == 0.0f) { vkf_failed = true; }
let v296 = floor(v294/f32(v295));
let v297 = v154;
let v298 = 2i;
let v299 = (v297-v298);
let v300 = fn5(v296,f32(v299));
if (!(abs(v300) < 2147483648.0f)) { vkf_failed = true; }
var v301: i32 = i32(v300);
let v302 = v270;
let v303 = 1i;
if (f32(v303) == 0.0f) { vkf_failed = true; }
let v304 = floor(v302/f32(v303));
let v305 = v154;
let v306 = 2i;
let v307 = (v305-v306);
let v308 = fn5(v304,f32(v307));
if (!(abs(v308) < 2147483648.0f)) { vkf_failed = true; }
var v309: i32 = i32(v308);
let v310 = v255;
let v311 = v293;
var v312: f32 = (v310-f32(v311));
let v313 = v269;
let v314 = v301;
var v315: f32 = (v313-f32(v314));
let v316 = v270;
let v317 = v309;
var v318: f32 = (v316-f32(v317));
let v319 = v153;
let v320 = 2i;
if ((v319==v320)) {
let v321 = v163;
let v322 = 2i;
let v323 = v153;
let v324 = (v322*v323);
let v325 = (v321+v324);
let v326 = v301;
let v327 = v154;
let v328 = (v326*v327);
let v329 = (v325+v328);
let v330 = v293;
var v331: i32 = (v329+v330);
let v332 = 1i;
let v333 = v312;
let v334 = (f32(v332)-v333);
let v335 = 1i;
let v336 = v315;
let v337 = (f32(v335)-v336);
let v338 = (v334*v337);
let v339 = read_values(v331);
var v340: f32 = (v338*v339);
let v341 = v340;
let v342 = v312;
let v343 = 1i;
let v344 = v315;
let v345 = (f32(v343)-v344);
let v346 = (v342*v345);
let v347 = v331;
let v348 = 1i;
let v349 = read_values((v347+v348));
let v350 = (v346*v349);
v340 = (v341+v350);
let v351 = v340;
let v352 = 1i;
let v353 = v312;
let v354 = (f32(v352)-v353);
let v355 = v315;
let v356 = (v354*v355);
let v357 = v331;
let v358 = v154;
let v359 = read_values((v357+v358));
let v360 = (v356*v359);
v340 = (v351+v360);
let v361 = v340;
let v362 = v312;
let v363 = v315;
let v364 = (v362*v363);
let v365 = v331;
let v366 = v154;
let v367 = (v365+v366);
let v368 = 1i;
let v369 = read_values((v367+v368));
let v370 = (v364*v369);
v340 = (v361+v370);
let v371 = v340;
let v372 = v234;
let v373 = 0.0f;
let v374 = fn6(v372,v373);
let v375 = (v371-v374);
let v376 = v200;
return (v375*v376);
}
var v377: i32 = 1i;
let v378 = v153;
let v379 = 3i;
if ((v378==v379)) {
v377 = 2i;
}
var v380: f32 = 0.0f;
var v381: i32 = 0i;
loop {
let v382 = v381;
let v383 = v377;
if (!((v382<v383))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v384: f32 = 1.0f;
let v385 = v153;
let v386 = 3i;
if ((v385==v386)) {
let v387 = 1i;
let v388 = v318;
v384 = (f32(v387)-v388);
let v389 = v381;
let v390 = 1i;
if ((v389==v390)) {
v384 = v318;
}
}
var v391: i32 = 0i;
loop {
let v392 = v391;
let v393 = 2i;
if (!((v392<v393))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v394 = 1i;
let v395 = v315;
var v396: f32 = (f32(v394)-v395);
let v397 = v391;
let v398 = 1i;
if ((v397==v398)) {
v396 = v315;
}
var v399: i32 = 0i;
loop {
let v400 = v399;
let v401 = 2i;
if (!((v400<v401))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v402 = 1i;
let v403 = v312;
var v404: f32 = (f32(v402)-v403);
let v405 = v399;
let v406 = 1i;
if ((v405==v406)) {
v404 = v312;
}
let v407 = v309;
let v408 = v381;
let v409 = (v407+v408);
let v410 = v154;
let v411 = (v409*v410);
let v412 = v154;
let v413 = (v411*v412);
let v414 = v301;
let v415 = v391;
let v416 = (v414+v415);
let v417 = v154;
let v418 = (v416*v417);
let v419 = (v413+v418);
let v420 = v293;
let v421 = (v419+v420);
let v422 = v399;
var v423: i32 = (v421+v422);
let v424 = v380;
let v425 = v404;
let v426 = v396;
let v427 = (v425*v426);
let v428 = v384;
let v429 = (v427*v428);
let v430 = v163;
let v431 = 2i;
let v432 = v153;
let v433 = (v431*v432);
let v434 = (v430+v433);
let v435 = v423;
let v436 = read_values((v434+v435));
let v437 = (v429*v436);
v380 = (v424+v437);
let v438 = v399;
let v439 = 1i;
v399 = (v438+v439);
}
let v440 = v391;
let v441 = 1i;
v391 = (v440+v441);
}
let v442 = v381;
let v443 = 1i;
v381 = (v442+v443);
}
let v444 = v380;
let v445 = v234;
let v446 = 0.0f;
let v447 = fn6(v445,v446);
let v448 = (v444-v447);
let v449 = v200;
return (v448*v449);
}
fn fn8(v472:f32,v473:f32,v474:f32)->f32 {
let v475 = v474;
let v476 = 0i;
if ((v475<=f32(v476))) {
let v477 = v472;
let v478 = v473;
return fn6(v477,v478);
}
let v479 = v474;
let v480 = v472;
let v481 = v473;
let v482 = abs((v480-v481));
let v483 = (v479-v482);
let v484 = 0.0f;
let v485 = fn6(v483,v484);
let v486 = v474;
if (v486 == 0.0f) { vkf_failed = true; }
var v487: f32 = (v485/v486);
let v488 = v472;
let v489 = v473;
let v490 = fn6(v488,v489);
let v491 = v474;
let v492 = v487;
let v493 = (v491*v492);
let v494 = v487;
let v495 = (v493*v494);
let v496 = 4i;
if (f32(v496) == 0.0f) { vkf_failed = true; }
let v497 = (v495/f32(v496));
return (v490+v497);
}
fn fn3(v128:i32,v129:i32,v130:i32,v131:i32,v132:f32,v133:f32,v134:f32,v135:f32,v136:f32)->f32 {
let v137 = v128;
let v138 = v129;
let v139 = v130;
let v140 = 0i;
let v141 = v132;
let v142 = v133;
let v143 = v134;
let v144 = v135;
let v145 = v137;
let v146 = v138;
let v147 = v139;
let v148 = v140;
let v149 = v141;
let v150 = v142;
let v151 = v143;
let v152 = v144;
var v450: f32 = fn4(v145,v146,v147,v148,v149,v150,v151,v152);
let v451 = v131;
let v452 = 1i;
if ((v451<=v452)) {
return v450;
}
let v453 = v450;
let v454 = v128;
let v455 = v129;
let v456 = v130;
let v457 = 1i;
let v458 = v132;
let v459 = v133;
let v460 = v134;
let v461 = v135;
let v462 = v454;
let v463 = v455;
let v464 = v456;
let v465 = v457;
let v466 = v458;
let v467 = v459;
let v468 = v460;
let v469 = v461;
let v470 = fn4(v462,v463,v464,v465,v466,v467,v468,v469);
let v471 = v136;
v450 = fn8(v453,v470,v471);
let v498 = v131;
let v499 = 2i;
if ((v498<=v499)) {
return v450;
}
let v500 = v450;
let v501 = v128;
let v502 = v129;
let v503 = v130;
let v504 = 2i;
let v505 = v132;
let v506 = v133;
let v507 = v134;
let v508 = v135;
let v509 = v501;
let v510 = v502;
let v511 = v503;
let v512 = v504;
let v513 = v505;
let v514 = v506;
let v515 = v507;
let v516 = v508;
let v517 = fn4(v509,v510,v511,v512,v513,v514,v515,v516);
let v518 = v136;
v450 = fn8(v500,v517,v518);
let v519 = v131;
let v520 = 3i;
if ((v519<=v520)) {
return v450;
}
var v521: i32 = 3i;
loop {
let v522 = v521;
let v523 = v131;
if (!((v522<v523))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v524 = v450;
let v525 = v128;
let v526 = v129;
let v527 = v130;
let v528 = v521;
let v529 = v132;
let v530 = v133;
let v531 = v134;
let v532 = v135;
let v533 = fn4(v525,v526,v527,v528,v529,v530,v531,v532);
let v534 = v136;
v450 = fn8(v524,v533,v534);
let v535 = v521;
let v536 = 1i;
v521 = (v535+v536);
}
return v450;
}
fn fn2(v43:i32)->f32 {
let v44 = read_params(30i);
let v45 = 1i;
var v48 = (v44==f32(v45));
if (v48) {
let v46 = read_params(19i);
let v47 = 0i;
v48 = (v46==f32(v47));
}
if (v48) {
return 0.0f;
}
let v49 = read_params(0i);
if (!(abs(v49) < 2147483648.0f)) { vkf_failed = true; }
var v50: i32 = i32(v49);
let v51 = read_params(1i);
if (!(abs(v51) < 2147483648.0f)) { vkf_failed = true; }
var v52: i32 = i32(v51);
let v53 = read_params(2i);
if (!(abs(v53) < 2147483648.0f)) { vkf_failed = true; }
var v54: i32 = i32(v53);
let v55 = read_params(3i);
if (!(abs(v55) < 2147483648.0f)) { vkf_failed = true; }
var v56: i32 = i32(v55);
let v57 = read_params(4i);
if (!(abs(v57) < 2147483648.0f)) { vkf_failed = true; }
var v58: i32 = i32(v57);
var v59: i32 = v58;
var v60: f32 = 0.5f;
let v61 = read_params(19i);
let v62 = 1i;
if ((v61==f32(v62))) {
let v63 = v58;
let v64 = 1i;
v59 = (v63-v64);
v60 = f32(0i);
}
let v65 = read_params(5i);
let v66 = v43;
let v67 = v58;
if (v67 == 0i) { vkf_failed = true; }
let v68 = (v66%v67);
let v69 = v60;
let v70 = (f32(v68)+v69);
let v71 = read_params(8i);
let v72 = read_params(5i);
let v73 = (v71-v72);
let v74 = (v70*v73);
let v75 = v59;
if (f32(v75) == 0.0f) { vkf_failed = true; }
let v76 = (v74/f32(v75));
var v77: f32 = (v65+v76);
let v78 = read_params(6i);
let v79 = v43;
let v80 = v58;
if (f32(v80) == 0.0f) { vkf_failed = true; }
let v81 = floor(f32(v79)/f32(v80));
let v82 = v58;
if (f32(v82) == 0.0f) { vkf_failed = true; }
let v83 = (v81%f32(v82));
let v84 = v60;
let v85 = (v83+v84);
let v86 = read_params(9i);
let v87 = read_params(6i);
let v88 = (v86-v87);
let v89 = (v85*v88);
let v90 = v59;
if (f32(v90) == 0.0f) { vkf_failed = true; }
let v91 = (v89/f32(v90));
var v92: f32 = (v78+v91);
var v93: f32 = 0.0f;
let v94 = v50;
let v95 = 3i;
if ((v94==v95)) {
let v96 = read_params(7i);
let v97 = v43;
let v98 = v58;
let v99 = v58;
let v100 = (v98*v99);
if (f32(v100) == 0.0f) { vkf_failed = true; }
let v101 = floor(f32(v97)/f32(v100));
let v102 = v60;
let v103 = (v101+v102);
let v104 = read_params(10i);
let v105 = read_params(7i);
let v106 = (v104-v105);
let v107 = (v103*v106);
let v108 = v59;
if (f32(v108) == 0.0f) { vkf_failed = true; }
let v109 = (v107/f32(v108));
v93 = (v96+v109);
}
let v110 = v50;
let v111 = v52;
let v112 = v54;
let v113 = v56;
let v114 = v77;
let v115 = v92;
let v116 = v93;
let v117 = read_params(11i);
let v118 = read_params(12i);
let v119 = v110;
let v120 = v111;
let v121 = v112;
let v122 = v113;
let v123 = v114;
let v124 = v115;
let v125 = v116;
let v126 = v117;
let v127 = v118;
var v537: f32 = fn3(v119,v120,v121,v122,v123,v124,v125,v126,v127);
let v538 = read_params(19i);
let v539 = 1i;
if ((v538==f32(v539))) {
return v537;
}
let v540 = v537;
let v541 = read_params(13i);
if (v541 == 0.0f) { vkf_failed = true; }
let v542 = (v540/v541);
let v543 = 0.5f;
let v544 = (v542+v543);
let v545 = 0.0f;
let v546 = 1.0f;
var v547: f32 = fn7(v544,v545,v546);
let v548 = read_params(19i);
let v549 = 2i;
if ((v548==f32(v549))) {
let v550 = v43;
let v551 = v58;
if (v551 == 0i) { vkf_failed = true; }
var v552: i32 = (v550%v551);
let v553 = v43;
let v554 = v58;
if (f32(v554) == 0.0f) { vkf_failed = true; }
let v555 = floor(f32(v553)/f32(v554));
let v556 = v58;
if (f32(v556) == 0.0f) { vkf_failed = true; }
var v557: i32 = i32((v555%f32(v556)));
let v558 = v43;
let v559 = v58;
let v560 = v58;
let v561 = (v559*v560);
if (f32(v561) == 0.0f) { vkf_failed = true; }
var v562: i32 = i32(floor(f32(v558)/f32(v561)));
let v563 = v552;
let v564 = 0i;
var v569 = (v563==v564);
if (!v569) {
let v565 = v552;
let v566 = v58;
let v567 = 1i;
let v568 = (v566-v567);
v569 = (v565==v568);
}
var v572 = v569;
if (!v572) {
let v570 = v557;
let v571 = 0i;
v572 = (v570==v571);
}
var v577 = v572;
if (!v577) {
let v573 = v557;
let v574 = v58;
let v575 = 1i;
let v576 = (v574-v575);
v577 = (v573==v576);
}
var v578: bool = v577;
let v579 = v50;
let v580 = 3i;
var v588 = (v579==v580);
if (v588) {
let v581 = v562;
let v582 = 0i;
var v587 = (v581==v582);
if (!v587) {
let v583 = v562;
let v584 = v58;
let v585 = 1i;
let v586 = (v584-v585);
v587 = (v583==v586);
}
v588 = v587;
}
if (v588) {
v578 = true;
}
if (v578) {
let v589 = v547;
let v590 = 9.99999997e-07f;
if (!((v589<=v590))) { vkf_failed = true; }
}
}
let v591 = v547;
let v592 = read_params(14i);
return (v591*v592);
}
fn fn1(v3:i32)->f32 {
let v4 = read_params(0i);
let v5 = 2i;
if (!((v4==f32(v5)))) { vkf_failed = true; }
let v6 = read_params(4i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = v3;
let v9 = 0i;
var v14 = (v8>=v9);
if (v14) {
let v10 = v3;
let v11 = 4i;
let v12 = v7;
let v13 = (v11*v12);
v14 = (v10<v13);
}
if (!(v14)) { vkf_failed = true; }
let v15 = v3;
let v16 = v7;
if (f32(v16) == 0.0f) { vkf_failed = true; }
var v17: i32 = i32(floor(f32(v15)/f32(v16)));
let v18 = v3;
let v19 = v7;
if (v19 == 0i) { vkf_failed = true; }
var v20: i32 = (v18%v19);
var v21: i32 = v20;
let v22 = v17;
let v23 = 1i;
if ((v22==v23)) {
let v24 = v7;
let v25 = 1i;
let v26 = (v24-v25);
let v27 = v7;
let v28 = (v26*v27);
let v29 = v20;
v21 = (v28+v29);
}
let v30 = v17;
let v31 = 2i;
if ((v30==v31)) {
let v32 = v20;
let v33 = v7;
v21 = (v32*v33);
}
let v34 = v17;
let v35 = 3i;
if ((v34==v35)) {
let v36 = v20;
let v37 = v7;
let v38 = (v36*v37);
let v39 = v7;
let v40 = (v38+v39);
let v41 = 1i;
v21 = (v40-v41);
}
let v42 = v21;
return fn2(v42);
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
