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
fn fn6(v211:f32,v212:f32)->f32 {
let v213 = v211;
let v214 = v212;
if ((v213<v214)) {
return v211;
}
return v212;
}
fn fn7(v241:f32,v242:f32)->f32 {
let v243 = v241;
let v244 = v242;
if ((v243>v244)) {
return v241;
}
return v242;
}
fn fn8(v263:f32,v264:f32,v265:f32)->f32 {
let v266 = v265;
let v267 = v264;
let v268 = v263;
let v269 = fn7(v267,v268);
return fn6(v266,v269);
}
fn fn9(v361:f32,v362:f32,v363:f32,v364:f32,v365:f32,v366:f32)->f32 {
let v367 = 1i;
let v368 = v365;
let v369 = (f32(v367)-v368);
let v370 = 1i;
let v371 = v366;
let v372 = (f32(v370)-v371);
let v373 = (v369*v372);
let v374 = v361;
var v375: f32 = (v373*v374);
let v376 = v375;
let v377 = v365;
let v378 = 1i;
let v379 = v366;
let v380 = (f32(v378)-v379);
let v381 = (v377*v380);
let v382 = v362;
let v383 = (v381*v382);
v375 = (v376+v383);
let v384 = v375;
let v385 = 1i;
let v386 = v365;
let v387 = (f32(v385)-v386);
let v388 = v366;
let v389 = (v387*v388);
let v390 = v363;
let v391 = (v389*v390);
v375 = (v384+v391);
let v392 = v375;
let v393 = v365;
let v394 = v366;
let v395 = (v393*v394);
let v396 = v364;
let v397 = (v395*v396);
v375 = (v392+v397);
return v375;
}
fn fn5(v165:i32,v166:i32,v167:i32,v168:i32,v169:f32,v170:f32,v171:f32,v172:f32,v173:i32)->f32 {
let v174 = v173;
let v175 = v168;
let v176 = v167;
let v177 = (v175*v176);
var v178: i32 = (v174+v177);
let v179 = v178;
let v180 = v165;
let v181 = read_values((v179+v180));
let v182 = v172;
var v183: f32 = (v181*v182);
let v184 = v178;
let v185 = v165;
let v186 = (v184+v185);
let v187 = 1i;
let v188 = read_values((v186+v187));
let v189 = v172;
var v190: f32 = (v188*v189);
let v191 = v183;
let v192 = 0i;
var v195 = (v191>f32(v192));
if (v195) {
let v193 = v190;
let v194 = 0i;
v195 = (v193>f32(v194));
}
if (!(v195)) { vkf_failed = true; }
let v196 = v169;
let v197 = read_values(v178);
let v198 = (v196-v197);
let v199 = v183;
if (v199 == 0.0f) { vkf_failed = true; }
var v200: f32 = (v198/v199);
let v201 = v170;
let v202 = v178;
let v203 = 1i;
let v204 = read_values((v202+v203));
let v205 = (v201-v204);
let v206 = v190;
if (v206 == 0.0f) { vkf_failed = true; }
var v207: f32 = (v205/v206);
var v208: f32 = 0.0f;
let v209 = v183;
let v210 = v190;
var v215: f32 = fn6(v209,v210);
let v216 = v165;
let v217 = 3i;
if ((v216==v217)) {
let v218 = v178;
let v219 = v165;
let v220 = (v218+v219);
let v221 = 2i;
let v222 = read_values((v220+v221));
let v223 = v172;
var v224: f32 = (v222*v223);
let v225 = v224;
let v226 = 0i;
if (!((v225>f32(v226)))) { vkf_failed = true; }
let v227 = v171;
let v228 = v178;
let v229 = 2i;
let v230 = read_values((v228+v229));
let v231 = (v227-v230);
let v232 = v224;
if (v232 == 0.0f) { vkf_failed = true; }
v208 = (v231/v232);
let v233 = v215;
let v234 = v224;
v215 = fn6(v233,v234);
}
let v235 = abs(v200);
let v236 = 1i;
let v237 = (v235-f32(v236));
let v238 = abs(v207);
let v239 = 1i;
let v240 = (v238-f32(v239));
let v245 = fn7(v237,v240);
let v246 = abs(v208);
let v247 = 1i;
let v248 = (v246-f32(v247));
var v249: f32 = fn7(v245,v248);
let v250 = v200;
let v251 = 1i;
let v252 = (v250+f32(v251));
let v253 = v166;
let v254 = 1i;
let v255 = (v253-v254);
let v256 = (v252*f32(v255));
let v257 = 2i;
if (f32(v257) == 0.0f) { vkf_failed = true; }
let v258 = (v256/f32(v257));
let v259 = 0.0f;
let v260 = v166;
let v261 = 1i;
let v262 = (v260-v261);
var v270: f32 = fn8(v258,v259,f32(v262));
let v271 = v207;
let v272 = 1i;
let v273 = (v271+f32(v272));
let v274 = v166;
let v275 = 1i;
let v276 = (v274-v275);
let v277 = (v273*f32(v276));
let v278 = 2i;
if (f32(v278) == 0.0f) { vkf_failed = true; }
let v279 = (v277/f32(v278));
let v280 = 0.0f;
let v281 = v166;
let v282 = 1i;
let v283 = (v281-v282);
var v284: f32 = fn8(v279,v280,f32(v283));
var v285: f32 = 0.0f;
let v286 = v165;
let v287 = 3i;
if ((v286==v287)) {
let v288 = v208;
let v289 = 1i;
let v290 = (v288+f32(v289));
let v291 = v166;
let v292 = 1i;
let v293 = (v291-v292);
let v294 = (v290*f32(v293));
let v295 = 2i;
if (f32(v295) == 0.0f) { vkf_failed = true; }
let v296 = (v294/f32(v295));
let v297 = 0.0f;
let v298 = v166;
let v299 = 1i;
let v300 = (v298-v299);
v285 = fn8(v296,v297,f32(v300));
}
let v301 = v270;
let v302 = 1i;
if (f32(v302) == 0.0f) { vkf_failed = true; }
let v303 = floor(v301/f32(v302));
let v304 = v166;
let v305 = 2i;
let v306 = (v304-v305);
let v307 = fn6(v303,f32(v306));
if (!(abs(v307) < 2147483648.0f)) { vkf_failed = true; }
var v308: i32 = i32(v307);
let v309 = v284;
let v310 = 1i;
if (f32(v310) == 0.0f) { vkf_failed = true; }
let v311 = floor(v309/f32(v310));
let v312 = v166;
let v313 = 2i;
let v314 = (v312-v313);
let v315 = fn6(v311,f32(v314));
if (!(abs(v315) < 2147483648.0f)) { vkf_failed = true; }
var v316: i32 = i32(v315);
let v317 = v285;
let v318 = 1i;
if (f32(v318) == 0.0f) { vkf_failed = true; }
let v319 = floor(v317/f32(v318));
let v320 = v166;
let v321 = 2i;
let v322 = (v320-v321);
let v323 = fn6(v319,f32(v322));
if (!(abs(v323) < 2147483648.0f)) { vkf_failed = true; }
var v324: i32 = i32(v323);
let v325 = v270;
let v326 = v308;
var v327: f32 = (v325-f32(v326));
let v328 = v284;
let v329 = v316;
var v330: f32 = (v328-f32(v329));
let v331 = v285;
let v332 = v324;
var v333: f32 = (v331-f32(v332));
let v334 = v165;
let v335 = 2i;
if ((v334==v335)) {
let v336 = v178;
let v337 = 2i;
let v338 = v165;
let v339 = (v337*v338);
let v340 = (v336+v339);
let v341 = v316;
let v342 = v166;
let v343 = (v341*v342);
let v344 = (v340+v343);
let v345 = v308;
var v346: i32 = (v344+v345);
let v347 = read_values(v346);
let v348 = v346;
let v349 = 1i;
let v350 = read_values((v348+v349));
let v351 = v346;
let v352 = v166;
let v353 = read_values((v351+v352));
let v354 = v346;
let v355 = v166;
let v356 = (v354+v355);
let v357 = 1i;
let v358 = read_values((v356+v357));
let v359 = v327;
let v360 = v330;
var v398: f32 = fn9(v347,v350,v353,v358,v359,v360);
let v399 = v398;
let v400 = v249;
let v401 = 0.0f;
let v402 = fn7(v400,v401);
let v403 = (v399-v402);
let v404 = v215;
return (v403*v404);
}
var v405: i32 = 1i;
let v406 = v165;
let v407 = 3i;
if ((v406==v407)) {
v405 = 2i;
}
var v408: f32 = 0.0f;
var v409: i32 = 0i;
loop {
let v410 = v409;
let v411 = v405;
if (!((v410<v411))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v412: f32 = 1.0f;
let v413 = v165;
let v414 = 3i;
if ((v413==v414)) {
let v415 = 1i;
let v416 = v333;
v412 = (f32(v415)-v416);
let v417 = v409;
let v418 = 1i;
if ((v417==v418)) {
v412 = v333;
}
}
var v419: i32 = 0i;
loop {
let v420 = v419;
let v421 = 2i;
if (!((v420<v421))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v422 = 1i;
let v423 = v330;
var v424: f32 = (f32(v422)-v423);
let v425 = v419;
let v426 = 1i;
if ((v425==v426)) {
v424 = v330;
}
var v427: i32 = 0i;
loop {
let v428 = v427;
let v429 = 2i;
if (!((v428<v429))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v430 = 1i;
let v431 = v327;
var v432: f32 = (f32(v430)-v431);
let v433 = v427;
let v434 = 1i;
if ((v433==v434)) {
v432 = v327;
}
let v435 = v324;
let v436 = v409;
let v437 = (v435+v436);
let v438 = v166;
let v439 = (v437*v438);
let v440 = v166;
let v441 = (v439*v440);
let v442 = v316;
let v443 = v419;
let v444 = (v442+v443);
let v445 = v166;
let v446 = (v444*v445);
let v447 = (v441+v446);
let v448 = v308;
let v449 = (v447+v448);
let v450 = v427;
var v451: i32 = (v449+v450);
let v452 = v408;
let v453 = v432;
let v454 = v424;
let v455 = (v453*v454);
let v456 = v412;
let v457 = (v455*v456);
let v458 = v178;
let v459 = 2i;
let v460 = v165;
let v461 = (v459*v460);
let v462 = (v458+v461);
let v463 = v451;
let v464 = read_values((v462+v463));
let v465 = (v457*v464);
v408 = (v452+v465);
let v466 = v427;
let v467 = 1i;
v427 = (v466+v467);
}
let v468 = v419;
let v469 = 1i;
v419 = (v468+v469);
}
let v470 = v409;
let v471 = 1i;
v409 = (v470+v471);
}
let v472 = v408;
let v473 = v249;
let v474 = 0.0f;
let v475 = fn7(v473,v474);
let v476 = (v472-v475);
let v477 = v215;
return (v476*v477);
}
fn fn4(v139:i32,v140:i32,v141:i32,v142:i32,v143:f32,v144:f32,v145:f32,v146:f32)->f32 {
let v147 = v139;
let v148 = v140;
let v149 = v141;
let v150 = v142;
let v151 = v143;
let v152 = v144;
let v153 = v145;
let v154 = v146;
let v155 = 0i;
let v156 = v147;
let v157 = v148;
let v158 = v149;
let v159 = v150;
let v160 = v151;
let v161 = v152;
let v162 = v153;
let v163 = v154;
let v164 = v155;
return fn5(v156,v157,v158,v159,v160,v161,v162,v163,v164);
}
fn fn10(v500:f32,v501:f32,v502:f32)->f32 {
let v503 = v502;
let v504 = 0i;
if ((v503<=f32(v504))) {
let v505 = v500;
let v506 = v501;
return fn7(v505,v506);
}
let v507 = v502;
let v508 = v500;
let v509 = v501;
let v510 = abs((v508-v509));
let v511 = (v507-v510);
let v512 = 0.0f;
let v513 = fn7(v511,v512);
let v514 = v502;
if (v514 == 0.0f) { vkf_failed = true; }
var v515: f32 = (v513/v514);
let v516 = v500;
let v517 = v501;
let v518 = fn7(v516,v517);
let v519 = v502;
let v520 = v515;
let v521 = (v519*v520);
let v522 = v515;
let v523 = (v521*v522);
let v524 = 4i;
if (f32(v524) == 0.0f) { vkf_failed = true; }
let v525 = (v523/f32(v524));
return (v518+v525);
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
var v478: f32 = fn4(v131,v132,v133,v134,v135,v136,v137,v138);
let v479 = v117;
let v480 = 1i;
if ((v479<=v480)) {
return v478;
}
let v481 = v478;
let v482 = v114;
let v483 = v115;
let v484 = v116;
let v485 = 1i;
let v486 = v118;
let v487 = v119;
let v488 = v120;
let v489 = v121;
let v490 = v482;
let v491 = v483;
let v492 = v484;
let v493 = v485;
let v494 = v486;
let v495 = v487;
let v496 = v488;
let v497 = v489;
let v498 = fn4(v490,v491,v492,v493,v494,v495,v496,v497);
let v499 = v122;
v478 = fn10(v481,v498,v499);
let v526 = v117;
let v527 = 2i;
if ((v526<=v527)) {
return v478;
}
let v528 = v478;
let v529 = v114;
let v530 = v115;
let v531 = v116;
let v532 = 2i;
let v533 = v118;
let v534 = v119;
let v535 = v120;
let v536 = v121;
let v537 = v529;
let v538 = v530;
let v539 = v531;
let v540 = v532;
let v541 = v533;
let v542 = v534;
let v543 = v535;
let v544 = v536;
let v545 = fn4(v537,v538,v539,v540,v541,v542,v543,v544);
let v546 = v122;
v478 = fn10(v528,v545,v546);
let v547 = v117;
let v548 = 3i;
if ((v547<=v548)) {
return v478;
}
var v549: i32 = 3i;
loop {
let v550 = v549;
let v551 = v117;
if (!((v550<v551))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v552 = v478;
let v553 = v114;
let v554 = v115;
let v555 = v116;
let v556 = v549;
let v557 = v118;
let v558 = v119;
let v559 = v120;
let v560 = v121;
let v561 = fn4(v553,v554,v555,v556,v557,v558,v559,v560);
let v562 = v122;
v478 = fn10(v552,v561,v562);
let v563 = v549;
let v564 = 1i;
v549 = (v563+v564);
}
return v478;
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
var v565: f32 = fn3(v105,v106,v107,v108,v109,v110,v111,v112,v113);
let v566 = read_params(19i);
let v567 = 1i;
if ((v566==f32(v567))) {
return v565;
}
let v568 = v565;
let v569 = read_params(13i);
if (v569 == 0.0f) { vkf_failed = true; }
let v570 = (v568/v569);
let v571 = 0.5f;
let v572 = (v570+v571);
let v573 = 0.0f;
let v574 = 1.0f;
var v575: f32 = fn8(v572,v573,v574);
let v576 = read_params(19i);
let v577 = 2i;
if ((v576==f32(v577))) {
let v578 = v29;
let v579 = v44;
if (v579 == 0i) { vkf_failed = true; }
var v580: i32 = (v578%v579);
let v581 = v29;
let v582 = v44;
if (f32(v582) == 0.0f) { vkf_failed = true; }
let v583 = floor(f32(v581)/f32(v582));
let v584 = v44;
if (f32(v584) == 0.0f) { vkf_failed = true; }
var v585: i32 = i32((v583%f32(v584)));
let v586 = v29;
let v587 = v44;
let v588 = v44;
let v589 = (v587*v588);
if (f32(v589) == 0.0f) { vkf_failed = true; }
var v590: i32 = i32(floor(f32(v586)/f32(v589)));
let v591 = v580;
let v592 = 0i;
var v597 = (v591==v592);
if (!v597) {
let v593 = v580;
let v594 = v44;
let v595 = 1i;
let v596 = (v594-v595);
v597 = (v593==v596);
}
var v600 = v597;
if (!v600) {
let v598 = v585;
let v599 = 0i;
v600 = (v598==v599);
}
var v605 = v600;
if (!v605) {
let v601 = v585;
let v602 = v44;
let v603 = 1i;
let v604 = (v602-v603);
v605 = (v601==v604);
}
var v606: bool = v605;
let v607 = v36;
let v608 = 3i;
var v616 = (v607==v608);
if (v616) {
let v609 = v590;
let v610 = 0i;
var v615 = (v609==v610);
if (!v615) {
let v611 = v590;
let v612 = v44;
let v613 = 1i;
let v614 = (v612-v613);
v615 = (v611==v614);
}
v616 = v615;
}
if (v616) {
v606 = true;
}
if (v606) {
let v617 = v575;
let v618 = 9.99999997e-07f;
if (!((v617<=v618))) { vkf_failed = true; }
}
}
let v619 = v575;
let v620 = read_params(14i);
return (v619*v620);
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
let v621 = fn2(v28);
v15 = (v27+v621);
let v622 = v18;
let v623 = 1i;
v18 = (v622+v623);
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
