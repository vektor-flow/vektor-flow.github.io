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
fn fn2(v167:i32,v168:i32,v169:i32,v170:i32,v171:f32,v172:f32,v173:f32,v174:f32,v175:f32)->array<f32,72> {
let v176 = f32(0i);
let v177 = f32(0i);
let v178 = f32(0i);
let v179 = f32(0i);
let v180 = f32(0i);
let v181 = f32(0i);
let v182 = f32(0i);
let v183 = f32(0i);
let v184 = f32(0i);
let v185 = f32(0i);
let v186 = f32(0i);
let v187 = f32(0i);
let v188 = f32(0i);
let v189 = f32(0i);
let v190 = f32(0i);
let v191 = f32(0i);
let v192 = f32(0i);
let v193 = f32(0i);
let v194 = f32(0i);
let v195 = f32(0i);
let v196 = f32(0i);
let v197 = f32(0i);
let v198 = f32(0i);
let v199 = f32(0i);
let v200 = f32(0i);
let v201 = f32(0i);
let v202 = f32(0i);
let v203 = f32(0i);
let v204 = f32(0i);
let v205 = f32(0i);
let v206 = f32(0i);
let v207 = f32(0i);
let v208 = f32(0i);
let v209 = f32(0i);
let v210 = f32(0i);
let v211 = f32(0i);
let v212 = f32(0i);
let v213 = f32(0i);
let v214 = f32(0i);
let v215 = f32(0i);
let v216 = f32(0i);
let v217 = f32(0i);
let v218 = f32(0i);
let v219 = f32(0i);
let v220 = f32(0i);
let v221 = f32(0i);
let v222 = f32(0i);
let v223 = f32(0i);
let v224 = f32(0i);
let v225 = f32(0i);
let v226 = f32(0i);
let v227 = f32(0i);
let v228 = f32(0i);
let v229 = f32(0i);
let v230 = f32(0i);
let v231 = f32(0i);
let v232 = f32(0i);
let v233 = f32(0i);
let v234 = f32(0i);
let v235 = f32(0i);
let v236 = f32(0i);
let v237 = f32(0i);
let v238 = f32(0i);
let v239 = f32(0i);
let v240 = f32(0i);
let v241 = f32(0i);
let v242 = f32(0i);
let v243 = f32(0i);
let v244 = f32(0i);
let v245 = f32(0i);
let v246 = f32(0i);
let v247 = f32(0i);
var v248: array<f32,72> = array<f32,72>(v176,v177,v178,v179,v180,v181,v182,v183,v184,v185,v186,v187,v188,v189,v190,v191,v192,v193,v194,v195,v196,v197,v198,v199,v200,v201,v202,v203,v204,v205,v206,v207,v208,v209,v210,v211,v212,v213,v214,v215,v216,v217,v218,v219,v220,v221,v222,v223,v224,v225,v226,v227,v228,v229,v230,v231,v232,v233,v234,v235,v236,v237,v238,v239,v240,v241,v242,v243,v244,v245,v246,v247);
let v249 = v167;
let v250 = f32(v249);
let v251 = v168;
let v252 = f32(v251);
let v253 = v169;
let v254 = f32(v253);
let v255 = v168;
let v256 = f32(v255);
let v257 = v169;
let v258 = f32(v257);
let v259 = v168;
let v260 = 1i;
let v261 = (v259+v260);
let v262 = f32(v261);
let v263 = v167;
let v264 = f32(v263);
let v265 = v168;
let v266 = f32(v265);
let v267 = v169;
let v268 = f32(v267);
let v269 = v168;
let v270 = 1i;
let v271 = (v269+v270);
let v272 = f32(v271);
let v273 = v167;
let v274 = f32(v273);
let v275 = v168;
let v276 = 1i;
let v277 = (v275+v276);
let v278 = f32(v277);
var v279: array<f32,12> = array<f32,12>(v250,v252,v254,v256,v258,v262,v264,v266,v268,v272,v274,v278);
let v280 = v172;
let v281 = v173;
let v282 = v174;
let v283 = v175;
var v284: array<f32,4> = array<f32,4>(v280,v281,v282,v283);
var v285: i32 = 0i;
loop {
let v286 = v285;
let v287 = 6i;
if (!((v286<v287))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v288 = v285;
let v289 = 6i;
let v290 = (v288*v289);
let v291 = 2i;
let v292 = v285;
let v293 = (v291*v292);
if (v293<0i || v293>=12i) { vkf_failed=true; }
let v294 = v279[u32(clamp(v293,0i,12i-1i))];
let v295 = v171;
let v296 = (v294*v295);
let v297 = v170;
let v298 = 1i;
let v299 = (v297-v298);
if (f32(v299) == 0.0f) { vkf_failed = true; }
if (v290<0i || v290>=72i) { vkf_failed=true; } else { v248[u32(v290)]=(v296/f32(v299)); }
let v300 = v285;
let v301 = 6i;
let v302 = (v300*v301);
let v303 = 1i;
let v304 = (v302+v303);
let v305 = 2i;
let v306 = v285;
let v307 = (v305*v306);
let v308 = 1i;
let v309 = (v307+v308);
if (v309<0i || v309>=12i) { vkf_failed=true; }
let v310 = v279[u32(clamp(v309,0i,12i-1i))];
let v311 = v171;
let v312 = (v310*v311);
let v313 = v170;
let v314 = 1i;
let v315 = (v313-v314);
if (f32(v315) == 0.0f) { vkf_failed = true; }
if (v304<0i || v304>=72i) { vkf_failed=true; } else { v248[u32(v304)]=(v312/f32(v315)); }
var v316: i32 = 0i;
loop {
let v317 = v316;
let v318 = 4i;
if (!((v317<v318))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v319 = v285;
let v320 = 6i;
let v321 = (v319*v320);
let v322 = 2i;
let v323 = (v321+v322);
let v324 = v316;
let v325 = (v323+v324);
let v326 = v316;
if (v326<0i || v326>=4i) { vkf_failed=true; }
if (v325<0i || v325>=72i) { vkf_failed=true; } else { v248[u32(v325)]=v284[u32(clamp(v326,0i,4i-1i))]; }
let v327 = v316;
let v328 = 1i;
v316 = (v327+v328);
}
let v329 = v285;
let v330 = 1i;
v285 = (v329+v330);
}
return v248;
}
fn fn4(v463:i32,v464:i32,v465:i32,v466:i32)->i32 {
let v467 = v466;
let v468 = 0i;
if ((v467==v468)) {
return v463;
}
let v469 = v465;
let v470 = 0i;
if ((v469==v470)) {
let v471 = v466;
let v472 = 1i;
if ((v471==v472)) {
let v473 = v463;
let v474 = 1i;
return (v473+v474);
}
let v475 = v463;
let v476 = v464;
let v477 = (v475+v476);
let v478 = 1i;
return (v477+v478);
}
let v479 = v466;
let v480 = 1i;
if ((v479==v480)) {
let v481 = v463;
let v482 = v464;
let v483 = (v481+v482);
let v484 = 1i;
return (v483+v484);
}
let v485 = v463;
let v486 = v464;
return (v485+v486);
}
fn fn3(v345:i32,v346:f32,v347:i32,v348:f32,v349:f32,v350:f32,v351:f32)->array<f32,72> {
let v352 = f32(0i);
let v353 = f32(0i);
let v354 = f32(0i);
let v355 = f32(0i);
let v356 = f32(0i);
let v357 = f32(0i);
let v358 = f32(0i);
let v359 = f32(0i);
let v360 = f32(0i);
let v361 = f32(0i);
let v362 = f32(0i);
let v363 = f32(0i);
let v364 = f32(0i);
let v365 = f32(0i);
let v366 = f32(0i);
let v367 = f32(0i);
let v368 = f32(0i);
let v369 = f32(0i);
let v370 = f32(0i);
let v371 = f32(0i);
let v372 = f32(0i);
let v373 = f32(0i);
let v374 = f32(0i);
let v375 = f32(0i);
let v376 = f32(0i);
let v377 = f32(0i);
let v378 = f32(0i);
let v379 = f32(0i);
let v380 = f32(0i);
let v381 = f32(0i);
let v382 = f32(0i);
let v383 = f32(0i);
let v384 = f32(0i);
let v385 = f32(0i);
let v386 = f32(0i);
let v387 = f32(0i);
let v388 = f32(0i);
let v389 = f32(0i);
let v390 = f32(0i);
let v391 = f32(0i);
let v392 = f32(0i);
let v393 = f32(0i);
let v394 = f32(0i);
let v395 = f32(0i);
let v396 = f32(0i);
let v397 = f32(0i);
let v398 = f32(0i);
let v399 = f32(0i);
let v400 = f32(0i);
let v401 = f32(0i);
let v402 = f32(0i);
let v403 = f32(0i);
let v404 = f32(0i);
let v405 = f32(0i);
let v406 = f32(0i);
let v407 = f32(0i);
let v408 = f32(0i);
let v409 = f32(0i);
let v410 = f32(0i);
let v411 = f32(0i);
let v412 = f32(0i);
let v413 = f32(0i);
let v414 = f32(0i);
let v415 = f32(0i);
let v416 = f32(0i);
let v417 = f32(0i);
let v418 = f32(0i);
let v419 = f32(0i);
let v420 = f32(0i);
let v421 = f32(0i);
let v422 = f32(0i);
let v423 = f32(0i);
var v424: array<f32,72> = array<f32,72>(v352,v353,v354,v355,v356,v357,v358,v359,v360,v361,v362,v363,v364,v365,v366,v367,v368,v369,v370,v371,v372,v373,v374,v375,v376,v377,v378,v379,v380,v381,v382,v383,v384,v385,v386,v387,v388,v389,v390,v391,v392,v393,v394,v395,v396,v397,v398,v399,v400,v401,v402,v403,v404,v405,v406,v407,v408,v409,v410,v411,v412,v413,v414,v415,v416,v417,v418,v419,v420,v421,v422,v423);
let v425 = v348;
let v426 = v349;
let v427 = v350;
let v428 = v351;
var v429: array<f32,4> = array<f32,4>(v425,v426,v427,v428);
let v430 = v347;
let v431 = v345;
let v432 = 1i;
let v433 = (v431-v432);
if (f32(v433) == 0.0f) { vkf_failed = true; }
let v434 = floor(f32(v430)/f32(v433));
let v435 = v345;
let v436 = (v434*f32(v435));
let v437 = v347;
let v438 = v345;
let v439 = 1i;
let v440 = (v438-v439);
if (v440 == 0i) { vkf_failed = true; }
let v441 = (v437%v440);
var v442: i32 = i32((v436+f32(v441)));
var v443: i32 = 0i;
loop {
let v444 = v443;
let v445 = 2i;
if (!((v444<v445))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v446 = f32(0i);
let v447 = f32(0i);
let v448 = f32(0i);
let v449 = f32(0i);
let v450 = f32(0i);
let v451 = f32(0i);
let v452 = f32(0i);
let v453 = f32(0i);
var v454: array<f32,8> = array<f32,8>(v446,v447,v448,v449,v450,v451,v452,v453);
var v455: i32 = 0i;
var v456: i32 = 0i;
loop {
let v457 = v456;
let v458 = 3i;
if (!((v457<v458))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v459 = v442;
let v460 = v345;
let v461 = v443;
let v462 = v456;
var v487: i32 = fn4(v459,v460,v461,v462);
let v488 = v442;
let v489 = v345;
let v490 = v443;
let v491 = v456;
let v492 = 1i;
let v493 = (v491+v492);
let v494 = 3i;
if (v494 == 0i) { vkf_failed = true; }
let v495 = (v493%v494);
var v496: i32 = fn4(v488,v489,v490,v495);
var v497: f32 = read_values(v487);
var v498: f32 = read_values(v496);
let v499 = v497;
let v500 = 0i;
if ((v499>=f32(v500))) {
let v501 = 2i;
let v502 = v455;
let v503 = (v501*v502);
let v504 = v487;
let v505 = v345;
if (v505 == 0i) { vkf_failed = true; }
let v506 = (v504%v505);
let v507 = f32(v506);
let v508 = v346;
let v509 = (v507*v508);
let v510 = v345;
let v511 = 1i;
let v512 = (v510-v511);
if (f32(v512) == 0.0f) { vkf_failed = true; }
if (v503<0i || v503>=8i) { vkf_failed=true; } else { v454[u32(v503)]=(v509/f32(v512)); }
let v513 = 2i;
let v514 = v455;
let v515 = (v513*v514);
let v516 = 1i;
let v517 = (v515+v516);
let v518 = v487;
let v519 = v345;
if (f32(v519) == 0.0f) { vkf_failed = true; }
let v520 = floor(f32(v518)/f32(v519));
let v521 = v520;
let v522 = v346;
let v523 = (v521*v522);
let v524 = v345;
let v525 = 1i;
let v526 = (v524-v525);
if (f32(v526) == 0.0f) { vkf_failed = true; }
if (v517<0i || v517>=8i) { vkf_failed=true; } else { v454[u32(v517)]=(v523/f32(v526)); }
let v527 = v455;
let v528 = 1i;
v455 = (v527+v528);
}
let v529 = v497;
let v530 = 0i;
var v533 = (v529<f32(v530));
if (v533) {
let v531 = v498;
let v532 = 0i;
v533 = (v531>f32(v532));
}
var v539 = v533;
if (!v539) {
let v534 = v497;
let v535 = 0i;
var v538 = (v534>f32(v535));
if (v538) {
let v536 = v498;
let v537 = 0i;
v538 = (v536<f32(v537));
}
v539 = v538;
}
if (v539) {
let v540 = v497;
let v541 = v497;
let v542 = v498;
let v543 = (v541-v542);
if (v543 == 0.0f) { vkf_failed = true; }
var v544: f32 = (v540/v543);
let v545 = 2i;
let v546 = v455;
let v547 = (v545*v546);
let v548 = v487;
let v549 = v345;
if (v549 == 0i) { vkf_failed = true; }
let v550 = (v548%v549);
let v551 = f32(v550);
let v552 = v544;
let v553 = v496;
let v554 = v345;
if (v554 == 0i) { vkf_failed = true; }
let v555 = (v553%v554);
let v556 = v487;
let v557 = v345;
if (v557 == 0i) { vkf_failed = true; }
let v558 = (v556%v557);
let v559 = (v555-v558);
let v560 = (v552*f32(v559));
let v561 = (v551+v560);
let v562 = v346;
let v563 = (v561*v562);
let v564 = v345;
let v565 = 1i;
let v566 = (v564-v565);
if (f32(v566) == 0.0f) { vkf_failed = true; }
if (v547<0i || v547>=8i) { vkf_failed=true; } else { v454[u32(v547)]=(v563/f32(v566)); }
let v567 = 2i;
let v568 = v455;
let v569 = (v567*v568);
let v570 = 1i;
let v571 = (v569+v570);
let v572 = v487;
let v573 = v345;
if (f32(v573) == 0.0f) { vkf_failed = true; }
let v574 = floor(f32(v572)/f32(v573));
let v575 = v574;
let v576 = v544;
let v577 = v496;
let v578 = v345;
if (f32(v578) == 0.0f) { vkf_failed = true; }
let v579 = floor(f32(v577)/f32(v578));
let v580 = v487;
let v581 = v345;
if (f32(v581) == 0.0f) { vkf_failed = true; }
let v582 = floor(f32(v580)/f32(v581));
let v583 = (v579-v582);
let v584 = (v576*v583);
let v585 = (v575+v584);
let v586 = v346;
let v587 = (v585*v586);
let v588 = v345;
let v589 = 1i;
let v590 = (v588-v589);
if (f32(v590) == 0.0f) { vkf_failed = true; }
if (v571<0i || v571>=8i) { vkf_failed=true; } else { v454[u32(v571)]=(v587/f32(v590)); }
let v591 = v455;
let v592 = 1i;
v455 = (v591+v592);
}
let v593 = v456;
let v594 = 1i;
v456 = (v593+v594);
}
var v595: i32 = 1i;
let v596 = v443;
let v597 = 36i;
var v598: i32 = (v596*v597);
loop {
let v599 = v595;
let v600 = v455;
let v601 = 1i;
let v602 = (v600-v601);
if (!((v599<v602))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v603: i32 = 0i;
loop {
let v604 = v603;
let v605 = 3i;
if (!((v604<v605))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v606: i32 = 0i;
let v607 = v603;
let v608 = 0i;
if ((v607>v608)) {
let v609 = v595;
let v610 = v603;
let v611 = (v609+v610);
let v612 = 1i;
v606 = (v611-v612);
}
let v613 = v598;
let v614 = 2i;
let v615 = v606;
let v616 = (v614*v615);
if (v616<0i || v616>=8i) { vkf_failed=true; }
if (v613<0i || v613>=72i) { vkf_failed=true; } else { v424[u32(v613)]=v454[u32(clamp(v616,0i,8i-1i))]; }
let v617 = v598;
let v618 = 1i;
let v619 = (v617+v618);
let v620 = 2i;
let v621 = v606;
let v622 = (v620*v621);
let v623 = 1i;
let v624 = (v622+v623);
if (v624<0i || v624>=8i) { vkf_failed=true; }
if (v619<0i || v619>=72i) { vkf_failed=true; } else { v424[u32(v619)]=v454[u32(clamp(v624,0i,8i-1i))]; }
var v625: i32 = 0i;
loop {
let v626 = v625;
let v627 = 4i;
if (!((v626<v627))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v628 = v598;
let v629 = 2i;
let v630 = (v628+v629);
let v631 = v625;
let v632 = (v630+v631);
let v633 = v625;
if (v633<0i || v633>=4i) { vkf_failed=true; }
if (v632<0i || v632>=72i) { vkf_failed=true; } else { v424[u32(v632)]=v429[u32(clamp(v633,0i,4i-1i))]; }
let v634 = v625;
let v635 = 1i;
v625 = (v634+v635);
}
let v636 = v598;
let v637 = 6i;
v598 = (v636+v637);
let v638 = v603;
let v639 = 1i;
v603 = (v638+v639);
}
let v640 = v595;
let v641 = 1i;
v595 = (v640+v641);
}
let v642 = v443;
let v643 = 1i;
v443 = (v642+v643);
}
return v424;
}
fn fn1(v3:i32)->array<f32,72> {
let v4 = read_params(4i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = v5;
let v7 = v5;
var v8: i32 = (v6*v7);
let v9 = v8;
let v10 = v5;
let v11 = (v9+v10);
let v12 = 1i;
let v13 = read_values((v11-v12));
if (!(abs(v13) < 2147483648.0f)) { vkf_failed = true; }
var v14: i32 = i32(v13);
let v15 = v3;
let v16 = v14;
if ((v15>=v16)) {
let v17 = f32(0i);
let v18 = f32(0i);
let v19 = f32(0i);
let v20 = f32(0i);
let v21 = f32(0i);
let v22 = f32(0i);
let v23 = f32(0i);
let v24 = f32(0i);
let v25 = f32(0i);
let v26 = f32(0i);
let v27 = f32(0i);
let v28 = f32(0i);
let v29 = f32(0i);
let v30 = f32(0i);
let v31 = f32(0i);
let v32 = f32(0i);
let v33 = f32(0i);
let v34 = f32(0i);
let v35 = f32(0i);
let v36 = f32(0i);
let v37 = f32(0i);
let v38 = f32(0i);
let v39 = f32(0i);
let v40 = f32(0i);
let v41 = f32(0i);
let v42 = f32(0i);
let v43 = f32(0i);
let v44 = f32(0i);
let v45 = f32(0i);
let v46 = f32(0i);
let v47 = f32(0i);
let v48 = f32(0i);
let v49 = f32(0i);
let v50 = f32(0i);
let v51 = f32(0i);
let v52 = f32(0i);
let v53 = f32(0i);
let v54 = f32(0i);
let v55 = f32(0i);
let v56 = f32(0i);
let v57 = f32(0i);
let v58 = f32(0i);
let v59 = f32(0i);
let v60 = f32(0i);
let v61 = f32(0i);
let v62 = f32(0i);
let v63 = f32(0i);
let v64 = f32(0i);
let v65 = f32(0i);
let v66 = f32(0i);
let v67 = f32(0i);
let v68 = f32(0i);
let v69 = f32(0i);
let v70 = f32(0i);
let v71 = f32(0i);
let v72 = f32(0i);
let v73 = f32(0i);
let v74 = f32(0i);
let v75 = f32(0i);
let v76 = f32(0i);
let v77 = f32(0i);
let v78 = f32(0i);
let v79 = f32(0i);
let v80 = f32(0i);
let v81 = f32(0i);
let v82 = f32(0i);
let v83 = f32(0i);
let v84 = f32(0i);
let v85 = f32(0i);
let v86 = f32(0i);
let v87 = f32(0i);
let v88 = f32(0i);
var v89: array<f32,72> = array<f32,72>(v17,v18,v19,v20,v21,v22,v23,v24,v25,v26,v27,v28,v29,v30,v31,v32,v33,v34,v35,v36,v37,v38,v39,v40,v41,v42,v43,v44,v45,v46,v47,v48,v49,v50,v51,v52,v53,v54,v55,v56,v57,v58,v59,v60,v61,v62,v63,v64,v65,v66,v67,v68,v69,v70,v71,v72,v73,v74,v75,v76,v77,v78,v79,v80,v81,v82,v83,v84,v85,v86,v87,v88);
return v89;
}
var v90: i32 = 0i;
let v91 = v5;
let v92 = 1i;
var v93: i32 = (v91-v92);
loop {
let v94 = v90;
let v95 = 1i;
let v96 = (v94+v95);
let v97 = v93;
if (!((v96<v97))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v98 = v90;
let v99 = v93;
let v100 = (v98+v99);
let v101 = 2i;
if (f32(v101) == 0.0f) { vkf_failed = true; }
var v102: i32 = i32(floor(f32(v100)/f32(v101)));
let v103 = v8;
let v104 = v102;
let v105 = read_values((v103+v104));
let v106 = v3;
if ((v105<=f32(v106))) {
v90 = v102;
}
let v107 = v8;
let v108 = v102;
let v109 = read_values((v107+v108));
let v110 = v3;
if ((v109>f32(v110))) {
v93 = v102;
}
}
let v111 = v3;
let v112 = v8;
let v113 = v90;
let v114 = read_values((v112+v113));
if (!(abs(v114) < 2147483648.0f)) { vkf_failed = true; }
let v115 = i32(v114);
var v116: i32 = (v111-v115);
let v117 = v8;
let v118 = v5;
let v119 = (v117+v118);
let v120 = v90;
let v121 = 256i;
let v122 = (v120*v121);
let v123 = (v119+v122);
let v124 = 1i;
let v125 = (v123+v124);
let v126 = v116;
let v127 = read_values((v125+v126));
if (!(abs(v127) < 2147483648.0f)) { vkf_failed = true; }
var v128: i32 = i32(v127);
let v129 = v5;
let v130 = 1i;
let v131 = (v129-v130);
let v132 = v5;
let v133 = 1i;
let v134 = (v132-v133);
var v135: i32 = (v131*v134);
let v136 = v128;
let v137 = v135;
if (v137 == 0i) { vkf_failed = true; }
var v138: i32 = (v136%v137);
let v139 = v128;
let v140 = v135;
if (f32(v140) == 0.0f) { vkf_failed = true; }
var v141: i32 = i32(floor(f32(v139)/f32(v140)));
let v142 = v141;
let v143 = 0i;
if ((v142>v143)) {
let v144 = v138;
let v145 = v5;
let v146 = 1i;
let v147 = (v145-v146);
if (v147 == 0i) { vkf_failed = true; }
let v148 = (v144%v147);
let v149 = v138;
let v150 = v5;
let v151 = 1i;
let v152 = (v150-v151);
if (f32(v152) == 0.0f) { vkf_failed = true; }
let v153 = floor(f32(v149)/f32(v152));
let v154 = v138;
let v155 = v5;
let v156 = 1i;
let v157 = (v155-v156);
if (v157 == 0i) { vkf_failed = true; }
let v158 = (v154%v157);
let v159 = v141;
let v160 = (v158+v159);
let v161 = v5;
let v162 = read_params(20i);
let v163 = read_params(26i);
let v164 = read_params(27i);
let v165 = read_params(28i);
let v166 = read_params(29i);
return fn2(v148,i32(v153),v160,v161,v162,v163,v164,v165,v166);
}
let v331 = v5;
let v332 = read_params(20i);
let v333 = v138;
let v334 = read_params(26i);
let v335 = read_params(27i);
let v336 = read_params(28i);
let v337 = read_params(29i);
let v338 = v331;
let v339 = v332;
let v340 = v333;
let v341 = v334;
let v342 = v335;
let v343 = v336;
let v344 = v337;
return fn3(v338,v339,v340,v341,v342,v343,v344);
}
fn fn0(v1:i32)->array<f32,72> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/72u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<72u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<72u;i+=1u){results[gid.x*72u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/72u)],1u);}
}
