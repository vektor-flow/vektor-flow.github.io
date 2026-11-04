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
fn fn8(v346:f32,v347:f32,v348:f32,v349:f32,v350:f32,v351:f32)->f32 {
let v352 = 1i;
let v353 = v350;
let v354 = (f32(v352)-v353);
let v355 = 1i;
let v356 = v351;
let v357 = (f32(v355)-v356);
let v358 = (v354*v357);
let v359 = v346;
var v360: f32 = (v358*v359);
let v361 = v360;
let v362 = v350;
let v363 = 1i;
let v364 = v351;
let v365 = (f32(v363)-v364);
let v366 = (v362*v365);
let v367 = v347;
let v368 = (v366*v367);
v360 = (v361+v368);
let v369 = v360;
let v370 = 1i;
let v371 = v350;
let v372 = (f32(v370)-v371);
let v373 = v351;
let v374 = (v372*v373);
let v375 = v348;
let v376 = (v374*v375);
v360 = (v369+v376);
let v377 = v360;
let v378 = v350;
let v379 = v351;
let v380 = (v378*v379);
let v381 = v349;
let v382 = (v380*v381);
v360 = (v377+v382);
return v360;
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
let v332 = read_values(v331);
let v333 = v331;
let v334 = 1i;
let v335 = read_values((v333+v334));
let v336 = v331;
let v337 = v154;
let v338 = read_values((v336+v337));
let v339 = v331;
let v340 = v154;
let v341 = (v339+v340);
let v342 = 1i;
let v343 = read_values((v341+v342));
let v344 = v312;
let v345 = v315;
var v383: f32 = fn8(v332,v335,v338,v343,v344,v345);
let v384 = v383;
let v385 = v234;
let v386 = 0.0f;
let v387 = fn6(v385,v386);
let v388 = (v384-v387);
let v389 = v200;
return (v388*v389);
}
var v390: i32 = 1i;
let v391 = v153;
let v392 = 3i;
if ((v391==v392)) {
v390 = 2i;
}
var v393: f32 = 0.0f;
var v394: i32 = 0i;
loop {
let v395 = v394;
let v396 = v390;
if (!((v395<v396))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v397: f32 = 1.0f;
let v398 = v153;
let v399 = 3i;
if ((v398==v399)) {
let v400 = 1i;
let v401 = v318;
v397 = (f32(v400)-v401);
let v402 = v394;
let v403 = 1i;
if ((v402==v403)) {
v397 = v318;
}
}
var v404: i32 = 0i;
loop {
let v405 = v404;
let v406 = 2i;
if (!((v405<v406))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v407 = 1i;
let v408 = v315;
var v409: f32 = (f32(v407)-v408);
let v410 = v404;
let v411 = 1i;
if ((v410==v411)) {
v409 = v315;
}
var v412: i32 = 0i;
loop {
let v413 = v412;
let v414 = 2i;
if (!((v413<v414))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v415 = 1i;
let v416 = v312;
var v417: f32 = (f32(v415)-v416);
let v418 = v412;
let v419 = 1i;
if ((v418==v419)) {
v417 = v312;
}
let v420 = v309;
let v421 = v394;
let v422 = (v420+v421);
let v423 = v154;
let v424 = (v422*v423);
let v425 = v154;
let v426 = (v424*v425);
let v427 = v301;
let v428 = v404;
let v429 = (v427+v428);
let v430 = v154;
let v431 = (v429*v430);
let v432 = (v426+v431);
let v433 = v293;
let v434 = (v432+v433);
let v435 = v412;
var v436: i32 = (v434+v435);
let v437 = v393;
let v438 = v417;
let v439 = v409;
let v440 = (v438*v439);
let v441 = v397;
let v442 = (v440*v441);
let v443 = v163;
let v444 = 2i;
let v445 = v153;
let v446 = (v444*v445);
let v447 = (v443+v446);
let v448 = v436;
let v449 = read_values((v447+v448));
let v450 = (v442*v449);
v393 = (v437+v450);
let v451 = v412;
let v452 = 1i;
v412 = (v451+v452);
}
let v453 = v404;
let v454 = 1i;
v404 = (v453+v454);
}
let v455 = v394;
let v456 = 1i;
v394 = (v455+v456);
}
let v457 = v393;
let v458 = v234;
let v459 = 0.0f;
let v460 = fn6(v458,v459);
let v461 = (v457-v460);
let v462 = v200;
return (v461*v462);
}
fn fn9(v485:f32,v486:f32,v487:f32)->f32 {
let v488 = v487;
let v489 = 0i;
if ((v488<=f32(v489))) {
let v490 = v485;
let v491 = v486;
return fn6(v490,v491);
}
let v492 = v487;
let v493 = v485;
let v494 = v486;
let v495 = abs((v493-v494));
let v496 = (v492-v495);
let v497 = 0.0f;
let v498 = fn6(v496,v497);
let v499 = v487;
if (v499 == 0.0f) { vkf_failed = true; }
var v500: f32 = (v498/v499);
let v501 = v485;
let v502 = v486;
let v503 = fn6(v501,v502);
let v504 = v487;
let v505 = v500;
let v506 = (v504*v505);
let v507 = v500;
let v508 = (v506*v507);
let v509 = 4i;
if (f32(v509) == 0.0f) { vkf_failed = true; }
let v510 = (v508/f32(v509));
return (v503+v510);
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
var v463: f32 = fn4(v145,v146,v147,v148,v149,v150,v151,v152);
let v464 = v131;
let v465 = 1i;
if ((v464<=v465)) {
return v463;
}
let v466 = v463;
let v467 = v128;
let v468 = v129;
let v469 = v130;
let v470 = 1i;
let v471 = v132;
let v472 = v133;
let v473 = v134;
let v474 = v135;
let v475 = v467;
let v476 = v468;
let v477 = v469;
let v478 = v470;
let v479 = v471;
let v480 = v472;
let v481 = v473;
let v482 = v474;
let v483 = fn4(v475,v476,v477,v478,v479,v480,v481,v482);
let v484 = v136;
v463 = fn9(v466,v483,v484);
let v511 = v131;
let v512 = 2i;
if ((v511<=v512)) {
return v463;
}
let v513 = v463;
let v514 = v128;
let v515 = v129;
let v516 = v130;
let v517 = 2i;
let v518 = v132;
let v519 = v133;
let v520 = v134;
let v521 = v135;
let v522 = v514;
let v523 = v515;
let v524 = v516;
let v525 = v517;
let v526 = v518;
let v527 = v519;
let v528 = v520;
let v529 = v521;
let v530 = fn4(v522,v523,v524,v525,v526,v527,v528,v529);
let v531 = v136;
v463 = fn9(v513,v530,v531);
let v532 = v131;
let v533 = 3i;
if ((v532<=v533)) {
return v463;
}
var v534: i32 = 3i;
loop {
let v535 = v534;
let v536 = v131;
if (!((v535<v536))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v537 = v463;
let v538 = v128;
let v539 = v129;
let v540 = v130;
let v541 = v534;
let v542 = v132;
let v543 = v133;
let v544 = v134;
let v545 = v135;
let v546 = fn4(v538,v539,v540,v541,v542,v543,v544,v545);
let v547 = v136;
v463 = fn9(v537,v546,v547);
let v548 = v534;
let v549 = 1i;
v534 = (v548+v549);
}
return v463;
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
var v550: f32 = fn3(v119,v120,v121,v122,v123,v124,v125,v126,v127);
let v551 = read_params(19i);
let v552 = 1i;
if ((v551==f32(v552))) {
return v550;
}
let v553 = v550;
let v554 = read_params(13i);
if (v554 == 0.0f) { vkf_failed = true; }
let v555 = (v553/v554);
let v556 = 0.5f;
let v557 = (v555+v556);
let v558 = 0.0f;
let v559 = 1.0f;
var v560: f32 = fn7(v557,v558,v559);
let v561 = read_params(19i);
let v562 = 2i;
if ((v561==f32(v562))) {
let v563 = v43;
let v564 = v58;
if (v564 == 0i) { vkf_failed = true; }
var v565: i32 = (v563%v564);
let v566 = v43;
let v567 = v58;
if (f32(v567) == 0.0f) { vkf_failed = true; }
let v568 = floor(f32(v566)/f32(v567));
let v569 = v58;
if (f32(v569) == 0.0f) { vkf_failed = true; }
var v570: i32 = i32((v568%f32(v569)));
let v571 = v43;
let v572 = v58;
let v573 = v58;
let v574 = (v572*v573);
if (f32(v574) == 0.0f) { vkf_failed = true; }
var v575: i32 = i32(floor(f32(v571)/f32(v574)));
let v576 = v565;
let v577 = 0i;
var v582 = (v576==v577);
if (!v582) {
let v578 = v565;
let v579 = v58;
let v580 = 1i;
let v581 = (v579-v580);
v582 = (v578==v581);
}
var v585 = v582;
if (!v585) {
let v583 = v570;
let v584 = 0i;
v585 = (v583==v584);
}
var v590 = v585;
if (!v590) {
let v586 = v570;
let v587 = v58;
let v588 = 1i;
let v589 = (v587-v588);
v590 = (v586==v589);
}
var v591: bool = v590;
let v592 = v50;
let v593 = 3i;
var v601 = (v592==v593);
if (v601) {
let v594 = v575;
let v595 = 0i;
var v600 = (v594==v595);
if (!v600) {
let v596 = v575;
let v597 = v58;
let v598 = 1i;
let v599 = (v597-v598);
v600 = (v596==v599);
}
v601 = v600;
}
if (v601) {
v591 = true;
}
if (v591) {
let v602 = v560;
let v603 = 9.99999997e-07f;
if (!((v602<=v603))) { vkf_failed = true; }
}
}
let v604 = v560;
let v605 = read_params(14i);
return (v604*v605);
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
