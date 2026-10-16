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
fn fn3(v62:f32)->i32 {
let v63 = v62;
let v64 = read_values(0i);
var v69 = (v63>=v64);
if (v69) {
let v65 = v62;
let v66 = i32(arrayLength(&values));
let v67 = 1i;
let v68 = read_values((v66-v67));
v69 = (v65<=v68);
}
if (!(v69)) { vkf_failed = true; }
var v70: i32 = 0i;
let v71 = i32(arrayLength(&values));
let v72 = 1i;
var v73: i32 = (v71-v72);
loop {
let v74 = v73;
let v75 = v70;
let v76 = (v74-v75);
let v77 = 1i;
if (!((v76>v77))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v78 = v70;
let v79 = v73;
let v80 = (v78+v79);
let v81 = 2i;
if (f32(v81) == 0.0f) { vkf_failed = true; }
var v82: i32 = i32(floor(f32(v80)/f32(v81)));
let v83 = v62;
let v84 = read_values(v82);
if ((v83>=v84)) {
v70 = v82;
}
let v85 = v62;
let v86 = read_values(v82);
if ((v85<v86)) {
v73 = v82;
}
}
return v70;
}
fn fn2(v58:f32,v59:bool,v60:bool)->f32 {
let v61 = v58;
var v87: i32 = fn3(v61);
let v88 = v87;
let v89 = 1i;
let v90 = read_values((v88+v89));
let v91 = read_values(v87);
var v92: f32 = (v90-v91);
let v93 = v58;
let v94 = read_values(v87);
let v95 = (v93-v94);
let v96 = v92;
if (v96 == 0.0f) { vkf_failed = true; }
var v97: f32 = (v95/v96);
var v100 = v59;
if (v100) {
let v98 = v87;
let v99 = 0i;
v100 = (v98==v99);
}
var v101: bool = v100;
var v106 = v60;
if (v106) {
let v102 = v87;
let v103 = i32(arrayLength(&values));
let v104 = 2i;
let v105 = (v103-v104);
v106 = (v102==v105);
}
var v107: bool = v106;
var v108: f32 = v97;
var v109 = v101;
if (v109) {
v109 = v107;
}
if (v109) {
let v110 = 10i;
let v111 = v97;
let v112 = 3i;
let v113 = vkf_powi(v111,v112);
let v114 = (f32(v110)*v113);
let v115 = 15i;
let v116 = v97;
let v117 = 4i;
let v118 = vkf_powi(v116,v117);
let v119 = (f32(v115)*v118);
let v120 = (v114-v119);
let v121 = 6i;
let v122 = v97;
let v123 = 5i;
let v124 = vkf_powi(v122,v123);
let v125 = (f32(v121)*v124);
v108 = (v120+v125);
}
var v126 = v101;
if (v126) {
v126 = (!v107);
}
if (v126) {
let v127 = 6i;
let v128 = v97;
let v129 = 3i;
let v130 = vkf_powi(v128,v129);
let v131 = (f32(v127)*v130);
let v132 = 8i;
let v133 = v97;
let v134 = 4i;
let v135 = vkf_powi(v133,v134);
let v136 = (f32(v132)*v135);
let v137 = (v131-v136);
let v138 = 3i;
let v139 = v97;
let v140 = 5i;
let v141 = vkf_powi(v139,v140);
let v142 = (f32(v138)*v141);
v108 = (v137+v142);
}
var v143 = v107;
if (v143) {
v143 = (!v101);
}
if (v143) {
let v144 = 1i;
let v145 = v97;
var v146: f32 = (f32(v144)-v145);
let v147 = 1i;
let v148 = 6i;
let v149 = v146;
let v150 = 3i;
let v151 = vkf_powi(v149,v150);
let v152 = (f32(v148)*v151);
let v153 = 8i;
let v154 = v146;
let v155 = 4i;
let v156 = vkf_powi(v154,v155);
let v157 = (f32(v153)*v156);
let v158 = (v152-v157);
let v159 = 3i;
let v160 = v146;
let v161 = 5i;
let v162 = vkf_powi(v160,v161);
let v163 = (f32(v159)*v162);
let v164 = (v158+v163);
v108 = (f32(v147)-v164);
}
let v165 = read_values(v87);
let v166 = v92;
let v167 = v108;
let v168 = (v166*v167);
return (v165+v168);
}
fn fn6(v236:f32)->f32 {
var v237: f32 = 3.14159274f;
let v238 = 2i;
let v239 = v237;
var v240: f32 = (f32(v238)*v239);
var v241: f32 = v236;
loop {
let v242 = v241;
let v243 = v237;
if (!((v242>v243))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v244 = v241;
let v245 = v240;
v241 = (v244-v245);
}
loop {
let v246 = v241;
let v247 = (-v237);
if (!((v246<v247))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v248 = v241;
let v249 = v240;
v241 = (v248+v249);
}
let v250 = v241;
let v251 = v237;
let v252 = 2i;
if (f32(v252) == 0.0f) { vkf_failed = true; }
let v253 = (v251/f32(v252));
if ((v250>v253)) {
let v254 = v237;
let v255 = v241;
v241 = (v254-v255);
}
let v256 = v241;
let v257 = (-v237);
let v258 = 2i;
if (f32(v258) == 0.0f) { vkf_failed = true; }
let v259 = (v257/f32(v258));
if ((v256<v259)) {
let v260 = (-v237);
let v261 = v241;
v241 = (v260-v261);
}
let v262 = v241;
let v263 = v241;
var v264: f32 = (v262*v263);
let v265 = v241;
let v266 = 1i;
let v267 = v264;
let v268 = -1.0f;
let v269 = 6i;
if (f32(v269) == 0.0f) { vkf_failed = true; }
let v270 = (v268/f32(v269));
let v271 = v264;
let v272 = 1.0f;
let v273 = 120i;
if (f32(v273) == 0.0f) { vkf_failed = true; }
let v274 = (v272/f32(v273));
let v275 = v264;
let v276 = -1.0f;
let v277 = 5040i;
if (f32(v277) == 0.0f) { vkf_failed = true; }
let v278 = (v276/f32(v277));
let v279 = v264;
let v280 = 1.0f;
let v281 = 362880i;
if (f32(v281) == 0.0f) { vkf_failed = true; }
let v282 = (v280/f32(v281));
let v283 = v264;
let v284 = -1.0f;
let v285 = 39916800i;
if (f32(v285) == 0.0f) { vkf_failed = true; }
let v286 = (v284/f32(v285));
let v287 = v264;
let v288 = 6.2270208e+09f;
if (v288 == 0.0f) { vkf_failed = true; }
let v289 = (v287/v288);
let v290 = (v286+v289);
let v291 = (v283*v290);
let v292 = (v282+v291);
let v293 = (v279*v292);
let v294 = (v278+v293);
let v295 = (v275*v294);
let v296 = (v274+v295);
let v297 = (v271*v296);
let v298 = (v270+v297);
let v299 = (v267*v298);
let v300 = (f32(v266)+v299);
return (v265*v300);
}
fn fn7(v306:f32)->f32 {
let v307 = v306;
let v308 = 1.57079637f;
let v309 = (v307+v308);
return fn6(v309);
}
fn fn5(v210:i32,v211:i32,v212:f32,v213:f32)->array<f32,21> {
var v214: f32 = 3.14159274f;
var v215: f32 = v212;
var v216: f32 = v213;
var v217: f32 = 0.0f;
let v218 = v210;
let v219 = 0i;
if ((v218==v219)) {
let v220 = v211;
let v221 = 1i;
if ((v220==v221)) {
let v222 = 0.649999976f;
let v223 = v212;
let v224 = v212;
let v225 = (v223*v224);
let v226 = v213;
let v227 = v213;
let v228 = (v226*v227);
let v229 = (v225-v228);
v217 = (v222*v229);
}
let v230 = v211;
let v231 = 2i;
if ((v230==v231)) {
let v232 = 0.400000006f;
let v233 = v214;
let v234 = v212;
let v235 = (v233*v234);
let v301 = fn6(v235);
let v302 = (v232*v301);
let v303 = v214;
let v304 = v213;
let v305 = (v303*v304);
let v310 = fn7(v305);
v217 = (v302*v310);
}
}
let v311 = v210;
let v312 = 1i;
if ((v311==v312)) {
let v313 = v211;
let v314 = 1i;
if ((v313==v314)) {
let v315 = v214;
let v316 = v212;
let v317 = (v315*v316);
let v318 = 2i;
if (f32(v318) == 0.0f) { vkf_failed = true; }
let v319 = (v317/f32(v318));
v215 = fn6(v319);
let v320 = 1i;
let v321 = v214;
let v322 = v212;
let v323 = (v321*v322);
let v324 = 2i;
if (f32(v324) == 0.0f) { vkf_failed = true; }
let v325 = (v323/f32(v324));
let v326 = fn7(v325);
v217 = (f32(v320)-v326);
}
let v327 = v211;
let v328 = 2i;
if ((v327==v328)) {
let v329 = v214;
let v330 = v212;
let v331 = (v329*v330);
let v332 = fn6(v331);
let v333 = v214;
if (v333 == 0.0f) { vkf_failed = true; }
v215 = (v332/v333);
let v334 = 1i;
let v335 = v214;
let v336 = v212;
let v337 = (v335*v336);
let v338 = fn7(v337);
let v339 = (f32(v334)-v338);
let v340 = v214;
if (v340 == 0.0f) { vkf_failed = true; }
v217 = (v339/v340);
}
}
let v341 = v210;
let v342 = 2i;
if ((v341==v342)) {
let v343 = v214;
let v344 = v212;
let v345 = 1i;
let v346 = (v344+f32(v345));
var v347: f32 = (v343*v346);
let v348 = v212;
let v349 = 1i;
if ((v348==f32(v349))) {
v347 = f32(0i);
}
let v350 = v214;
let v351 = v213;
let v352 = 1i;
let v353 = (v351+f32(v352));
var v354: f32 = (v350*v353);
let v355 = v213;
let v356 = 1i;
if ((v355==f32(v356))) {
v354 = f32(0i);
}
var v357: f32 = 0.649999976f;
var v358: f32 = 0.25f;
let v359 = v211;
let v360 = 1i;
if ((v359==v360)) {
let v361 = 0.159999996f;
let v362 = 0.0799999982f;
let v363 = 3i;
let v364 = v347;
let v365 = (f32(v363)*v364);
let v366 = fn7(v365);
let v367 = (v362*v366);
v358 = (v361+v367);
}
let v368 = v211;
let v369 = 2i;
if ((v368==v369)) {
let v370 = 0.600000024f;
let v371 = 0.119999997f;
let v372 = 2i;
let v373 = v347;
let v374 = (f32(v372)*v373);
let v375 = fn7(v374);
let v376 = (v371*v375);
v357 = (v370+v376);
}
let v377 = v357;
let v378 = v358;
let v379 = v354;
let v380 = fn7(v379);
let v381 = (v378*v380);
let v382 = (v377+v381);
let v383 = v347;
let v384 = fn7(v383);
v215 = (v382*v384);
let v385 = v357;
let v386 = v358;
let v387 = v354;
let v388 = fn7(v387);
let v389 = (v386*v388);
let v390 = (v385+v389);
let v391 = v347;
let v392 = fn6(v391);
v216 = (v390*v392);
let v393 = v358;
let v394 = v354;
let v395 = fn6(v394);
v217 = (v393*v395);
}
let v396 = v210;
let v397 = 3i;
if ((v396==v397)) {
let v398 = v214;
let v399 = v212;
let v400 = 1i;
let v401 = (v399+f32(v400));
var v402: f32 = (v398*v401);
let v403 = v212;
let v404 = 1i;
if ((v403==f32(v404))) {
v402 = f32(0i);
}
let v405 = v214;
let v406 = v213;
let v407 = 1i;
let v408 = (v406+f32(v407));
let v409 = (v405*v408);
let v410 = 2i;
if (f32(v410) == 0.0f) { vkf_failed = true; }
var v411: f32 = (v409/f32(v410));
let v412 = 0.800000012f;
let v413 = v411;
let v414 = fn6(v413);
let v415 = (v412*v414);
let v416 = v402;
let v417 = fn7(v416);
v215 = (v415*v417);
let v418 = 0.800000012f;
let v419 = v411;
let v420 = fn6(v419);
let v421 = (v418*v420);
let v422 = v402;
let v423 = fn6(v422);
v216 = (v421*v423);
let v424 = 0.800000012f;
let v425 = v411;
let v426 = fn7(v425);
v217 = (v424*v426);
let v427 = v213;
let v428 = -1i;
var v431 = (v427==f32(v428));
if (!v431) {
let v429 = v213;
let v430 = 1i;
v431 = (v429==f32(v430));
}
if (v431) {
v215 = f32(0i);
v216 = f32(0i);
}
let v432 = v211;
let v433 = 1i;
if ((v432==v433)) {
let v434 = v215;
let v435 = 1.29999995f;
v215 = (v434*v435);
let v436 = v216;
let v437 = 0.75f;
v216 = (v436*v437);
let v438 = v217;
let v439 = 0.975000024f;
if (v439 == 0.0f) { vkf_failed = true; }
v217 = (v438/v439);
}
let v440 = v211;
let v441 = 2i;
if ((v440==v441)) {
let v442 = v215;
let v443 = 0.75f;
v215 = (v442*v443);
let v444 = v216;
let v445 = 1.29999995f;
v216 = (v444*v445);
let v446 = v217;
let v447 = 0.975000024f;
if (v447 == 0.0f) { vkf_failed = true; }
v217 = (v446/v447);
}
}
let v448 = v210;
let v449 = 4i;
if ((v448==v449)) {
var v450: f32 = 0.0f;
let v451 = v211;
let v452 = 1i;
if ((v451==v452)) {
let v453 = v214;
let v454 = 2i;
if (f32(v454) == 0.0f) { vkf_failed = true; }
v450 = (v453/f32(v454));
}
let v455 = v211;
let v456 = 2i;
if ((v455==v456)) {
v450 = v214;
}
let v457 = v212;
let v458 = v450;
let v459 = v213;
let v460 = (v458*v459);
let v461 = fn7(v460);
v215 = (v457*v461);
let v462 = v212;
let v463 = v450;
let v464 = v213;
let v465 = (v463*v464);
let v466 = fn6(v465);
v217 = (v462*v466);
}
let v467 = v210;
let v468 = 5i;
if ((v467==v468)) {
let v469 = v213;
let v470 = 1i;
let v471 = (v469+f32(v470));
let v472 = 2i;
if (f32(v472) == 0.0f) { vkf_failed = true; }
var v473: f32 = (v471/f32(v472));
let v474 = v214;
let v475 = v212;
let v476 = 1i;
let v477 = (v475+f32(v476));
var v478: f32 = (v474*v477);
let v479 = v212;
let v480 = 1i;
if ((v479==f32(v480))) {
v478 = f32(0i);
}
let v481 = v473;
let v482 = v478;
let v483 = fn7(v482);
v215 = (v481*v483);
let v484 = v473;
let v485 = v478;
let v486 = fn6(v485);
v216 = (v484*v486);
let v487 = v211;
let v488 = 1i;
if ((v487==v488)) {
let v489 = 0.649999976f;
let v490 = 1i;
let v491 = v473;
let v492 = v473;
let v493 = (v491*v492);
let v494 = (f32(v490)-v493);
v217 = (v489*v494);
}
}
let v495 = v215;
let v496 = v216;
let v497 = v217;
let v498 = f32(0i);
let v499 = f32(0i);
let v500 = f32(0i);
let v501 = f32(0i);
let v502 = f32(0i);
let v503 = f32(0i);
let v504 = f32(0i);
let v505 = f32(0i);
let v506 = f32(0i);
let v507 = f32(0i);
let v508 = f32(0i);
let v509 = f32(0i);
let v510 = f32(0i);
let v511 = f32(0i);
let v512 = f32(0i);
let v513 = f32(0i);
let v514 = f32(0i);
let v515 = f32(0i);
return array<f32,21>(v495,v496,v497,v498,v499,v500,v501,v502,v503,v504,v505,v506,v507,v508,v509,v510,v511,v512,v513,v514,v515);
}
fn fn9(v559:f32,v560:f32,v561:f32,v562:f32,v563:f32,v564:f32)->f32 {
let v565 = 1i;
let v566 = v564;
var v567: f32 = (f32(v565)-v566);
let v568 = v567;
let v569 = v559;
let v570 = (v568*v569);
let v571 = v564;
let v572 = v560;
let v573 = (v571*v572);
let v574 = (v570+v573);
let v575 = v567;
let v576 = 3i;
let v577 = vkf_powi(v575,v576);
let v578 = v567;
let v579 = (v577-v578);
let v580 = v561;
let v581 = (v579*v580);
let v582 = v564;
let v583 = 3i;
let v584 = vkf_powi(v582,v583);
let v585 = v564;
let v586 = (v584-v585);
let v587 = v562;
let v588 = (v586*v587);
let v589 = (v581+v588);
let v590 = v563;
let v591 = (v589*v590);
let v592 = v563;
let v593 = (v591*v592);
let v594 = 6i;
if (f32(v594) == 0.0f) { vkf_failed = true; }
let v595 = (v593/f32(v594));
return (v574+v595);
}
fn fn8(v535:f32,v536:f32,v537:f32,v538:f32,v539:i32)->f32 {
var v540: f32 = 0.0f;
let v541 = v539;
let v542 = 1i;
if ((v541==v542)) {
let v543 = 1.5f;
let v544 = v537;
let v545 = 2i;
let v546 = v536;
let v547 = (f32(v545)*v546);
let v548 = (v544-v547);
let v549 = v535;
let v550 = (v548+v549);
v540 = (v543*v550);
}
let v551 = v538;
let v552 = 1i;
if ((v551<=f32(v552))) {
let v553 = v535;
let v554 = v536;
let v555 = 0.0f;
let v556 = v540;
let v557 = 1.0f;
let v558 = v538;
return fn9(v553,v554,v555,v556,v557,v558);
}
let v596 = v536;
let v597 = v537;
let v598 = v540;
let v599 = 0.0f;
let v600 = 1.0f;
let v601 = v538;
let v602 = 1i;
let v603 = (v601-f32(v602));
return fn9(v596,v597,v598,v599,v600,v603);
}
fn fn4(v201:i32,v202:f32,v203:f32,v204:f32,v205:i32)->array<f32,21> {
let v206 = v201;
let v207 = 0i;
let v208 = v202;
let v209 = v203;
var v516: array<f32,21> = fn5(v206,v207,v208,v209);
let v517 = v201;
let v518 = 1i;
let v519 = v202;
let v520 = v203;
var v521: array<f32,21> = fn5(v517,v518,v519,v520);
let v522 = v201;
let v523 = 2i;
let v524 = v202;
let v525 = v203;
var v526: array<f32,21> = fn5(v522,v523,v524,v525);
let v527 = 0i;
if (v527<0i || v527>=21i) { vkf_failed=true; }
let v528 = v516[u32(clamp(v527,0i,21i-1i))];
let v529 = 0i;
if (v529<0i || v529>=21i) { vkf_failed=true; }
let v530 = v521[u32(clamp(v529,0i,21i-1i))];
let v531 = 0i;
if (v531<0i || v531>=21i) { vkf_failed=true; }
let v532 = v526[u32(clamp(v531,0i,21i-1i))];
let v533 = v204;
let v534 = v205;
var v604: f32 = fn8(v528,v530,v532,v533,v534);
let v605 = 1i;
if (v605<0i || v605>=21i) { vkf_failed=true; }
let v606 = v516[u32(clamp(v605,0i,21i-1i))];
let v607 = 1i;
if (v607<0i || v607>=21i) { vkf_failed=true; }
let v608 = v521[u32(clamp(v607,0i,21i-1i))];
let v609 = 1i;
if (v609<0i || v609>=21i) { vkf_failed=true; }
let v610 = v526[u32(clamp(v609,0i,21i-1i))];
let v611 = v204;
let v612 = v205;
var v613: f32 = fn8(v606,v608,v610,v611,v612);
let v614 = 2i;
if (v614<0i || v614>=21i) { vkf_failed=true; }
let v615 = v516[u32(clamp(v614,0i,21i-1i))];
let v616 = 2i;
if (v616<0i || v616>=21i) { vkf_failed=true; }
let v617 = v521[u32(clamp(v616,0i,21i-1i))];
let v618 = 2i;
if (v618<0i || v618>=21i) { vkf_failed=true; }
let v619 = v526[u32(clamp(v618,0i,21i-1i))];
let v620 = v204;
let v621 = v205;
var v622: f32 = fn8(v615,v617,v619,v620,v621);
let v623 = v604;
let v624 = v613;
let v625 = v622;
let v626 = f32(0i);
let v627 = f32(0i);
let v628 = f32(0i);
let v629 = f32(0i);
let v630 = f32(0i);
let v631 = f32(0i);
let v632 = f32(0i);
let v633 = f32(0i);
let v634 = f32(0i);
let v635 = f32(0i);
let v636 = f32(0i);
let v637 = f32(0i);
let v638 = f32(0i);
let v639 = f32(0i);
let v640 = f32(0i);
let v641 = f32(0i);
let v642 = f32(0i);
let v643 = f32(0i);
return array<f32,21>(v623,v624,v625,v626,v627,v628,v629,v630,v631,v632,v633,v634,v635,v636,v637,v638,v639,v640,v641,v642,v643);
}
fn fn1(v3:i32)->array<f32,21> {
let v4 = i32(arrayLength(&params));
let v5 = 6i;
if (!((v4>=v5))) { vkf_failed = true; }
let v6 = read_params(0i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = read_params(5i);
if (!(abs(v8) < 2147483648.0f)) { vkf_failed = true; }
var v9: i32 = i32(v8);
let v10 = v7;
let v11 = 0i;
var v14 = (v10>=v11);
if (v14) {
let v12 = v7;
let v13 = 6i;
v14 = (v12<v13);
}
var v17 = v14;
if (v17) {
let v15 = v9;
let v16 = 2i;
v17 = (v15>=v16);
}
var v20 = v17;
if (v20) {
let v18 = v9;
let v19 = 256i;
v20 = (v18<=v19);
}
if (!(v20)) { vkf_failed = true; }
let v21 = v3;
let v22 = 0i;
var v29 = (v21>=v22);
if (v29) {
let v23 = v3;
let v24 = 2i;
let v25 = v9;
let v26 = (v24*v25);
let v27 = v9;
let v28 = (v26*v27);
v29 = (v23<v28);
}
if (!(v29)) { vkf_failed = true; }
let v30 = i32(arrayLength(&values));
let v31 = 3i;
var v34 = (v30==v31);
if (v34) {
let v32 = read_values(0i);
let v33 = 0i;
v34 = (v32==f32(v33));
}
var v37 = v34;
if (v37) {
let v35 = read_values(1i);
let v36 = 1i;
v37 = (v35==f32(v36));
}
var v40 = v37;
if (v40) {
let v38 = read_values(2i);
let v39 = 2i;
v40 = (v38==f32(v39));
}
if (!(v40)) { vkf_failed = true; }
let v41 = read_params(2i);
if (!(abs(v41) < 2147483648.0f)) { vkf_failed = true; }
var v42: i32 = i32(v41);
let v43 = v42;
let v44 = 0i;
var v47 = (v43==v44);
if (!v47) {
let v45 = v42;
let v46 = 1i;
v47 = (v45==v46);
}
if (!(v47)) { vkf_failed = true; }
let v48 = read_params(1i);
let v49 = read_params(3i);
let v50 = 1i;
let v51 = (v49==f32(v50));
let v52 = read_params(4i);
let v53 = 1i;
let v54 = (v52==f32(v53));
let v55 = v48;
let v56 = v51;
let v57 = v54;
var v169: f32 = fn2(v55,v56,v57);
let v170 = v3;
let v171 = 2i;
if (f32(v171) == 0.0f) { vkf_failed = true; }
var v172: i32 = i32(floor(f32(v170)/f32(v171)));
let v173 = v172;
let v174 = v9;
if (f32(v174) == 0.0f) { vkf_failed = true; }
var v175: i32 = i32(floor(f32(v173)/f32(v174)));
let v176 = v172;
let v177 = v9;
if (v177 == 0i) { vkf_failed = true; }
var v178: i32 = (v176%v177);
let v179 = 2i;
let v180 = v178;
let v181 = (v179*v180);
let v182 = v9;
if (f32(v182) == 0.0f) { vkf_failed = true; }
let v183 = (f32(v181)/f32(v182));
let v184 = 1i;
var v185: f32 = (v183-f32(v184));
let v186 = 2i;
let v187 = v175;
let v188 = (v186*v187);
let v189 = v9;
if (f32(v189) == 0.0f) { vkf_failed = true; }
let v190 = (f32(v188)/f32(v189));
let v191 = 1i;
var v192: f32 = (v190-f32(v191));
let v193 = 2.0f;
let v194 = v9;
if (f32(v194) == 0.0f) { vkf_failed = true; }
var v195: f32 = (v193/f32(v194));
let v196 = v7;
let v197 = v185;
let v198 = v192;
let v199 = v169;
let v200 = v42;
var v644: array<f32,21> = fn4(v196,v197,v198,v199,v200);
let v645 = v7;
let v646 = v185;
let v647 = v195;
let v648 = (v646+v647);
let v649 = v192;
let v650 = v169;
let v651 = v42;
var v652: array<f32,21> = fn4(v645,v648,v649,v650,v651);
let v653 = v7;
let v654 = v185;
let v655 = v195;
let v656 = (v654+v655);
let v657 = v192;
let v658 = v195;
let v659 = (v657+v658);
let v660 = v169;
let v661 = v42;
var v662: array<f32,21> = fn4(v653,v656,v659,v660,v661);
let v663 = v3;
let v664 = 2i;
if (v664 == 0i) { vkf_failed = true; }
let v665 = (v663%v664);
let v666 = 1i;
if ((v665==v666)) {
let v667 = v7;
let v668 = v185;
let v669 = v195;
let v670 = (v668+v669);
let v671 = v192;
let v672 = v195;
let v673 = (v671+v672);
let v674 = v169;
let v675 = v42;
v652 = fn4(v667,v670,v673,v674,v675);
let v676 = v7;
let v677 = v185;
let v678 = v192;
let v679 = v195;
let v680 = (v678+v679);
let v681 = v169;
let v682 = v42;
v662 = fn4(v676,v677,v680,v681,v682);
}
let v683 = 0i;
if (v683<0i || v683>=21i) { vkf_failed=true; }
let v684 = v652[u32(clamp(v683,0i,21i-1i))];
let v685 = 0i;
if (v685<0i || v685>=21i) { vkf_failed=true; }
let v686 = v644[u32(clamp(v685,0i,21i-1i))];
var v687: f32 = (v684-v686);
let v688 = 1i;
if (v688<0i || v688>=21i) { vkf_failed=true; }
let v689 = v652[u32(clamp(v688,0i,21i-1i))];
let v690 = 1i;
if (v690<0i || v690>=21i) { vkf_failed=true; }
let v691 = v644[u32(clamp(v690,0i,21i-1i))];
var v692: f32 = (v689-v691);
let v693 = 2i;
if (v693<0i || v693>=21i) { vkf_failed=true; }
let v694 = v652[u32(clamp(v693,0i,21i-1i))];
let v695 = 2i;
if (v695<0i || v695>=21i) { vkf_failed=true; }
let v696 = v644[u32(clamp(v695,0i,21i-1i))];
var v697: f32 = (v694-v696);
let v698 = 0i;
if (v698<0i || v698>=21i) { vkf_failed=true; }
let v699 = v662[u32(clamp(v698,0i,21i-1i))];
let v700 = 0i;
if (v700<0i || v700>=21i) { vkf_failed=true; }
let v701 = v644[u32(clamp(v700,0i,21i-1i))];
var v702: f32 = (v699-v701);
let v703 = 1i;
if (v703<0i || v703>=21i) { vkf_failed=true; }
let v704 = v662[u32(clamp(v703,0i,21i-1i))];
let v705 = 1i;
if (v705<0i || v705>=21i) { vkf_failed=true; }
let v706 = v644[u32(clamp(v705,0i,21i-1i))];
var v707: f32 = (v704-v706);
let v708 = 2i;
if (v708<0i || v708>=21i) { vkf_failed=true; }
let v709 = v662[u32(clamp(v708,0i,21i-1i))];
let v710 = 2i;
if (v710<0i || v710>=21i) { vkf_failed=true; }
let v711 = v644[u32(clamp(v710,0i,21i-1i))];
var v712: f32 = (v709-v711);
let v713 = v692;
let v714 = v712;
let v715 = (v713*v714);
let v716 = v697;
let v717 = v707;
let v718 = (v716*v717);
var v719: f32 = (v715-v718);
let v720 = v697;
let v721 = v702;
let v722 = (v720*v721);
let v723 = v687;
let v724 = v712;
let v725 = (v723*v724);
var v726: f32 = (v722-v725);
let v727 = v687;
let v728 = v707;
let v729 = (v727*v728);
let v730 = v692;
let v731 = v702;
let v732 = (v730*v731);
var v733: f32 = (v729-v732);
let v734 = v719;
let v735 = v719;
let v736 = (v734*v735);
let v737 = v726;
let v738 = v726;
let v739 = (v737*v738);
let v740 = (v736+v739);
let v741 = v733;
let v742 = v733;
let v743 = (v741*v742);
let v744 = (v740+v743);
if (v744 < 0.0f) { vkf_failed = true; }
var v745: f32 = sqrt(v744);
var v746: f32 = 0.400000006f;
let v747 = v745;
let v748 = 9.99999972e-10f;
if ((v747>v748)) {
let v749 = 0.300000012f;
let v750 = 0.699999988f;
let v751 = 0.300000012f;
let v752 = v719;
let v753 = (v751*v752);
let v754 = 0.400000006f;
let v755 = v726;
let v756 = (v754*v755);
let v757 = (v753-v756);
let v758 = 0.866025388f;
let v759 = v733;
let v760 = (v758*v759);
let v761 = (v757+v760);
let v762 = v745;
if (v762 == 0.0f) { vkf_failed = true; }
let v763 = abs((v761/v762));
let v764 = (v750*v763);
v746 = (v749+v764);
}
let v765 = 0.119999997f;
let v766 = 0.200000003f;
let v767 = v185;
let v768 = 1i;
let v769 = (v767+f32(v768));
let v770 = (v766*v769);
let v771 = 2i;
if (f32(v771) == 0.0f) { vkf_failed = true; }
let v772 = (v770/f32(v771));
var v773: f32 = (v765+v772);
let v774 = 0.550000012f;
let v775 = 0.25f;
let v776 = v192;
let v777 = 1i;
let v778 = (v776+f32(v777));
let v779 = (v775*v778);
let v780 = 2i;
if (f32(v780) == 0.0f) { vkf_failed = true; }
let v781 = (v779/f32(v780));
var v782: f32 = (v774+v781);
var v783: f32 = 0.949999988f;
let v784 = 0i;
if (v784<0i || v784>=21i) { vkf_failed=true; }
let v785 = v644[u32(clamp(v784,0i,21i-1i))];
let v786 = 1i;
if (v786<0i || v786>=21i) { vkf_failed=true; }
let v787 = v644[u32(clamp(v786,0i,21i-1i))];
let v788 = 2i;
if (v788<0i || v788>=21i) { vkf_failed=true; }
let v789 = v644[u32(clamp(v788,0i,21i-1i))];
let v790 = v773;
let v791 = v746;
let v792 = (v790*v791);
let v793 = v782;
let v794 = v746;
let v795 = (v793*v794);
let v796 = v783;
let v797 = v746;
let v798 = (v796*v797);
let v799 = f32(1i);
let v800 = 0i;
if (v800<0i || v800>=21i) { vkf_failed=true; }
let v801 = v652[u32(clamp(v800,0i,21i-1i))];
let v802 = 1i;
if (v802<0i || v802>=21i) { vkf_failed=true; }
let v803 = v652[u32(clamp(v802,0i,21i-1i))];
let v804 = 2i;
if (v804<0i || v804>=21i) { vkf_failed=true; }
let v805 = v652[u32(clamp(v804,0i,21i-1i))];
let v806 = v773;
let v807 = v746;
let v808 = (v806*v807);
let v809 = v782;
let v810 = v746;
let v811 = (v809*v810);
let v812 = v783;
let v813 = v746;
let v814 = (v812*v813);
let v815 = f32(1i);
let v816 = 0i;
if (v816<0i || v816>=21i) { vkf_failed=true; }
let v817 = v662[u32(clamp(v816,0i,21i-1i))];
let v818 = 1i;
if (v818<0i || v818>=21i) { vkf_failed=true; }
let v819 = v662[u32(clamp(v818,0i,21i-1i))];
let v820 = 2i;
if (v820<0i || v820>=21i) { vkf_failed=true; }
let v821 = v662[u32(clamp(v820,0i,21i-1i))];
let v822 = v773;
let v823 = v746;
let v824 = (v822*v823);
let v825 = v782;
let v826 = v746;
let v827 = (v825*v826);
let v828 = v783;
let v829 = v746;
let v830 = (v828*v829);
let v831 = f32(1i);
return array<f32,21>(v785,v787,v789,v792,v795,v798,v799,v801,v803,v805,v808,v811,v814,v815,v817,v819,v821,v824,v827,v830,v831);
}
fn fn0(v1:i32)->array<f32,21> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/21u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<21u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<21u;i+=1u){results[gid.x*21u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/21u)],1u);}
}
