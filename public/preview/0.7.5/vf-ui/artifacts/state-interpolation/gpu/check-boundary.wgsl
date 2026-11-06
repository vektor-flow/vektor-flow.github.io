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
fn fn6(v225:f32,v226:f32)->f32 {
let v227 = v225;
let v228 = v226;
if ((v227<v228)) {
return v225;
}
return v226;
}
fn fn7(v255:f32,v256:f32)->f32 {
let v257 = v255;
let v258 = v256;
if ((v257>v258)) {
return v255;
}
return v256;
}
fn fn8(v277:f32,v278:f32,v279:f32)->f32 {
let v280 = v279;
let v281 = v278;
let v282 = v277;
let v283 = fn7(v281,v282);
return fn6(v280,v283);
}
fn fn9(v375:f32,v376:f32,v377:f32,v378:f32,v379:f32,v380:f32)->f32 {
let v381 = 1i;
let v382 = v379;
let v383 = (f32(v381)-v382);
let v384 = 1i;
let v385 = v380;
let v386 = (f32(v384)-v385);
let v387 = (v383*v386);
let v388 = v375;
var v389: f32 = (v387*v388);
let v390 = v389;
let v391 = v379;
let v392 = 1i;
let v393 = v380;
let v394 = (f32(v392)-v393);
let v395 = (v391*v394);
let v396 = v376;
let v397 = (v395*v396);
v389 = (v390+v397);
let v398 = v389;
let v399 = 1i;
let v400 = v379;
let v401 = (f32(v399)-v400);
let v402 = v380;
let v403 = (v401*v402);
let v404 = v377;
let v405 = (v403*v404);
v389 = (v398+v405);
let v406 = v389;
let v407 = v379;
let v408 = v380;
let v409 = (v407*v408);
let v410 = v378;
let v411 = (v409*v410);
v389 = (v406+v411);
return v389;
}
fn fn5(v179:i32,v180:i32,v181:i32,v182:i32,v183:f32,v184:f32,v185:f32,v186:f32,v187:i32)->f32 {
let v188 = v187;
let v189 = v182;
let v190 = v181;
let v191 = (v189*v190);
var v192: i32 = (v188+v191);
let v193 = v192;
let v194 = v179;
let v195 = read_values((v193+v194));
let v196 = v186;
var v197: f32 = (v195*v196);
let v198 = v192;
let v199 = v179;
let v200 = (v198+v199);
let v201 = 1i;
let v202 = read_values((v200+v201));
let v203 = v186;
var v204: f32 = (v202*v203);
let v205 = v197;
let v206 = 0i;
var v209 = (v205>f32(v206));
if (v209) {
let v207 = v204;
let v208 = 0i;
v209 = (v207>f32(v208));
}
if (!(v209)) { vkf_failed = true; }
let v210 = v183;
let v211 = read_values(v192);
let v212 = (v210-v211);
let v213 = v197;
if (v213 == 0.0f) { vkf_failed = true; }
var v214: f32 = (v212/v213);
let v215 = v184;
let v216 = v192;
let v217 = 1i;
let v218 = read_values((v216+v217));
let v219 = (v215-v218);
let v220 = v204;
if (v220 == 0.0f) { vkf_failed = true; }
var v221: f32 = (v219/v220);
var v222: f32 = 0.0f;
let v223 = v197;
let v224 = v204;
var v229: f32 = fn6(v223,v224);
let v230 = v179;
let v231 = 3i;
if ((v230==v231)) {
let v232 = v192;
let v233 = v179;
let v234 = (v232+v233);
let v235 = 2i;
let v236 = read_values((v234+v235));
let v237 = v186;
var v238: f32 = (v236*v237);
let v239 = v238;
let v240 = 0i;
if (!((v239>f32(v240)))) { vkf_failed = true; }
let v241 = v185;
let v242 = v192;
let v243 = 2i;
let v244 = read_values((v242+v243));
let v245 = (v241-v244);
let v246 = v238;
if (v246 == 0.0f) { vkf_failed = true; }
v222 = (v245/v246);
let v247 = v229;
let v248 = v238;
v229 = fn6(v247,v248);
}
let v249 = abs(v214);
let v250 = 1i;
let v251 = (v249-f32(v250));
let v252 = abs(v221);
let v253 = 1i;
let v254 = (v252-f32(v253));
let v259 = fn7(v251,v254);
let v260 = abs(v222);
let v261 = 1i;
let v262 = (v260-f32(v261));
var v263: f32 = fn7(v259,v262);
let v264 = v214;
let v265 = 1i;
let v266 = (v264+f32(v265));
let v267 = v180;
let v268 = 1i;
let v269 = (v267-v268);
let v270 = (v266*f32(v269));
let v271 = 2i;
if (f32(v271) == 0.0f) { vkf_failed = true; }
let v272 = (v270/f32(v271));
let v273 = 0.0f;
let v274 = v180;
let v275 = 1i;
let v276 = (v274-v275);
var v284: f32 = fn8(v272,v273,f32(v276));
let v285 = v221;
let v286 = 1i;
let v287 = (v285+f32(v286));
let v288 = v180;
let v289 = 1i;
let v290 = (v288-v289);
let v291 = (v287*f32(v290));
let v292 = 2i;
if (f32(v292) == 0.0f) { vkf_failed = true; }
let v293 = (v291/f32(v292));
let v294 = 0.0f;
let v295 = v180;
let v296 = 1i;
let v297 = (v295-v296);
var v298: f32 = fn8(v293,v294,f32(v297));
var v299: f32 = 0.0f;
let v300 = v179;
let v301 = 3i;
if ((v300==v301)) {
let v302 = v222;
let v303 = 1i;
let v304 = (v302+f32(v303));
let v305 = v180;
let v306 = 1i;
let v307 = (v305-v306);
let v308 = (v304*f32(v307));
let v309 = 2i;
if (f32(v309) == 0.0f) { vkf_failed = true; }
let v310 = (v308/f32(v309));
let v311 = 0.0f;
let v312 = v180;
let v313 = 1i;
let v314 = (v312-v313);
v299 = fn8(v310,v311,f32(v314));
}
let v315 = v284;
let v316 = 1i;
if (f32(v316) == 0.0f) { vkf_failed = true; }
let v317 = floor(v315/f32(v316));
let v318 = v180;
let v319 = 2i;
let v320 = (v318-v319);
let v321 = fn6(v317,f32(v320));
if (!(abs(v321) < 2147483648.0f)) { vkf_failed = true; }
var v322: i32 = i32(v321);
let v323 = v298;
let v324 = 1i;
if (f32(v324) == 0.0f) { vkf_failed = true; }
let v325 = floor(v323/f32(v324));
let v326 = v180;
let v327 = 2i;
let v328 = (v326-v327);
let v329 = fn6(v325,f32(v328));
if (!(abs(v329) < 2147483648.0f)) { vkf_failed = true; }
var v330: i32 = i32(v329);
let v331 = v299;
let v332 = 1i;
if (f32(v332) == 0.0f) { vkf_failed = true; }
let v333 = floor(v331/f32(v332));
let v334 = v180;
let v335 = 2i;
let v336 = (v334-v335);
let v337 = fn6(v333,f32(v336));
if (!(abs(v337) < 2147483648.0f)) { vkf_failed = true; }
var v338: i32 = i32(v337);
let v339 = v284;
let v340 = v322;
var v341: f32 = (v339-f32(v340));
let v342 = v298;
let v343 = v330;
var v344: f32 = (v342-f32(v343));
let v345 = v299;
let v346 = v338;
var v347: f32 = (v345-f32(v346));
let v348 = v179;
let v349 = 2i;
if ((v348==v349)) {
let v350 = v192;
let v351 = 2i;
let v352 = v179;
let v353 = (v351*v352);
let v354 = (v350+v353);
let v355 = v330;
let v356 = v180;
let v357 = (v355*v356);
let v358 = (v354+v357);
let v359 = v322;
var v360: i32 = (v358+v359);
let v361 = read_values(v360);
let v362 = v360;
let v363 = 1i;
let v364 = read_values((v362+v363));
let v365 = v360;
let v366 = v180;
let v367 = read_values((v365+v366));
let v368 = v360;
let v369 = v180;
let v370 = (v368+v369);
let v371 = 1i;
let v372 = read_values((v370+v371));
let v373 = v341;
let v374 = v344;
var v412: f32 = fn9(v361,v364,v367,v372,v373,v374);
let v413 = v412;
let v414 = v263;
let v415 = 0.0f;
let v416 = fn7(v414,v415);
let v417 = (v413-v416);
let v418 = v229;
return (v417*v418);
}
var v419: i32 = 1i;
let v420 = v179;
let v421 = 3i;
if ((v420==v421)) {
v419 = 2i;
}
var v422: f32 = 0.0f;
var v423: i32 = 0i;
loop {
let v424 = v423;
let v425 = v419;
if (!((v424<v425))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v426: f32 = 1.0f;
let v427 = v179;
let v428 = 3i;
if ((v427==v428)) {
let v429 = 1i;
let v430 = v347;
v426 = (f32(v429)-v430);
let v431 = v423;
let v432 = 1i;
if ((v431==v432)) {
v426 = v347;
}
}
var v433: i32 = 0i;
loop {
let v434 = v433;
let v435 = 2i;
if (!((v434<v435))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v436 = 1i;
let v437 = v344;
var v438: f32 = (f32(v436)-v437);
let v439 = v433;
let v440 = 1i;
if ((v439==v440)) {
v438 = v344;
}
var v441: i32 = 0i;
loop {
let v442 = v441;
let v443 = 2i;
if (!((v442<v443))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v444 = 1i;
let v445 = v341;
var v446: f32 = (f32(v444)-v445);
let v447 = v441;
let v448 = 1i;
if ((v447==v448)) {
v446 = v341;
}
let v449 = v338;
let v450 = v423;
let v451 = (v449+v450);
let v452 = v180;
let v453 = (v451*v452);
let v454 = v180;
let v455 = (v453*v454);
let v456 = v330;
let v457 = v433;
let v458 = (v456+v457);
let v459 = v180;
let v460 = (v458*v459);
let v461 = (v455+v460);
let v462 = v322;
let v463 = (v461+v462);
let v464 = v441;
var v465: i32 = (v463+v464);
let v466 = v422;
let v467 = v446;
let v468 = v438;
let v469 = (v467*v468);
let v470 = v426;
let v471 = (v469*v470);
let v472 = v192;
let v473 = 2i;
let v474 = v179;
let v475 = (v473*v474);
let v476 = (v472+v475);
let v477 = v465;
let v478 = read_values((v476+v477));
let v479 = (v471*v478);
v422 = (v466+v479);
let v480 = v441;
let v481 = 1i;
v441 = (v480+v481);
}
let v482 = v433;
let v483 = 1i;
v433 = (v482+v483);
}
let v484 = v423;
let v485 = 1i;
v423 = (v484+v485);
}
let v486 = v422;
let v487 = v263;
let v488 = 0.0f;
let v489 = fn7(v487,v488);
let v490 = (v486-v489);
let v491 = v229;
return (v490*v491);
}
fn fn4(v153:i32,v154:i32,v155:i32,v156:i32,v157:f32,v158:f32,v159:f32,v160:f32)->f32 {
let v161 = v153;
let v162 = v154;
let v163 = v155;
let v164 = v156;
let v165 = v157;
let v166 = v158;
let v167 = v159;
let v168 = v160;
let v169 = 0i;
let v170 = v161;
let v171 = v162;
let v172 = v163;
let v173 = v164;
let v174 = v165;
let v175 = v166;
let v176 = v167;
let v177 = v168;
let v178 = v169;
return fn5(v170,v171,v172,v173,v174,v175,v176,v177,v178);
}
fn fn10(v514:f32,v515:f32,v516:f32)->f32 {
let v517 = v516;
let v518 = 0i;
if ((v517<=f32(v518))) {
let v519 = v514;
let v520 = v515;
return fn7(v519,v520);
}
let v521 = v516;
let v522 = v514;
let v523 = v515;
let v524 = abs((v522-v523));
let v525 = (v521-v524);
let v526 = 0.0f;
let v527 = fn7(v525,v526);
let v528 = v516;
if (v528 == 0.0f) { vkf_failed = true; }
var v529: f32 = (v527/v528);
let v530 = v514;
let v531 = v515;
let v532 = fn7(v530,v531);
let v533 = v516;
let v534 = v529;
let v535 = (v533*v534);
let v536 = v529;
let v537 = (v535*v536);
let v538 = 4i;
if (f32(v538) == 0.0f) { vkf_failed = true; }
let v539 = (v537/f32(v538));
return (v532+v539);
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
var v492: f32 = fn4(v145,v146,v147,v148,v149,v150,v151,v152);
let v493 = v131;
let v494 = 1i;
if ((v493<=v494)) {
return v492;
}
let v495 = v492;
let v496 = v128;
let v497 = v129;
let v498 = v130;
let v499 = 1i;
let v500 = v132;
let v501 = v133;
let v502 = v134;
let v503 = v135;
let v504 = v496;
let v505 = v497;
let v506 = v498;
let v507 = v499;
let v508 = v500;
let v509 = v501;
let v510 = v502;
let v511 = v503;
let v512 = fn4(v504,v505,v506,v507,v508,v509,v510,v511);
let v513 = v136;
v492 = fn10(v495,v512,v513);
let v540 = v131;
let v541 = 2i;
if ((v540<=v541)) {
return v492;
}
let v542 = v492;
let v543 = v128;
let v544 = v129;
let v545 = v130;
let v546 = 2i;
let v547 = v132;
let v548 = v133;
let v549 = v134;
let v550 = v135;
let v551 = v543;
let v552 = v544;
let v553 = v545;
let v554 = v546;
let v555 = v547;
let v556 = v548;
let v557 = v549;
let v558 = v550;
let v559 = fn4(v551,v552,v553,v554,v555,v556,v557,v558);
let v560 = v136;
v492 = fn10(v542,v559,v560);
let v561 = v131;
let v562 = 3i;
if ((v561<=v562)) {
return v492;
}
var v563: i32 = 3i;
loop {
let v564 = v563;
let v565 = v131;
if (!((v564<v565))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v566 = v492;
let v567 = v128;
let v568 = v129;
let v569 = v130;
let v570 = v563;
let v571 = v132;
let v572 = v133;
let v573 = v134;
let v574 = v135;
let v575 = fn4(v567,v568,v569,v570,v571,v572,v573,v574);
let v576 = v136;
v492 = fn10(v566,v575,v576);
let v577 = v563;
let v578 = 1i;
v563 = (v577+v578);
}
return v492;
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
var v579: f32 = fn3(v119,v120,v121,v122,v123,v124,v125,v126,v127);
let v580 = read_params(19i);
let v581 = 1i;
if ((v580==f32(v581))) {
return v579;
}
let v582 = v579;
let v583 = read_params(13i);
if (v583 == 0.0f) { vkf_failed = true; }
let v584 = (v582/v583);
let v585 = 0.5f;
let v586 = (v584+v585);
let v587 = 0.0f;
let v588 = 1.0f;
var v589: f32 = fn8(v586,v587,v588);
let v590 = read_params(19i);
let v591 = 2i;
if ((v590==f32(v591))) {
let v592 = v43;
let v593 = v58;
if (v593 == 0i) { vkf_failed = true; }
var v594: i32 = (v592%v593);
let v595 = v43;
let v596 = v58;
if (f32(v596) == 0.0f) { vkf_failed = true; }
let v597 = floor(f32(v595)/f32(v596));
let v598 = v58;
if (f32(v598) == 0.0f) { vkf_failed = true; }
var v599: i32 = i32((v597%f32(v598)));
let v600 = v43;
let v601 = v58;
let v602 = v58;
let v603 = (v601*v602);
if (f32(v603) == 0.0f) { vkf_failed = true; }
var v604: i32 = i32(floor(f32(v600)/f32(v603)));
let v605 = v594;
let v606 = 0i;
var v611 = (v605==v606);
if (!v611) {
let v607 = v594;
let v608 = v58;
let v609 = 1i;
let v610 = (v608-v609);
v611 = (v607==v610);
}
var v614 = v611;
if (!v614) {
let v612 = v599;
let v613 = 0i;
v614 = (v612==v613);
}
var v619 = v614;
if (!v619) {
let v615 = v599;
let v616 = v58;
let v617 = 1i;
let v618 = (v616-v617);
v619 = (v615==v618);
}
var v620: bool = v619;
let v621 = v50;
let v622 = 3i;
var v630 = (v621==v622);
if (v630) {
let v623 = v604;
let v624 = 0i;
var v629 = (v623==v624);
if (!v629) {
let v625 = v604;
let v626 = v58;
let v627 = 1i;
let v628 = (v626-v627);
v629 = (v625==v628);
}
v630 = v629;
}
if (v630) {
v620 = true;
}
if (v620) {
let v631 = v589;
let v632 = 9.99999997e-07f;
if (!((v631<=v632))) { vkf_failed = true; }
}
}
let v633 = v589;
let v634 = read_params(14i);
return (v633*v634);
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
