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
fn fn2(v27:i32,v28:i32)->i32 {
let v29 = v27;
let v30 = 1i;
if ((v29==v30)) {
let v31 = 18i;
let v32 = v28;
return (v31*v32);
}
let v33 = v27;
let v34 = 2i;
if ((v33==v34)) {
let v35 = 2i;
let v36 = v28;
return (v35*v36);
}
let v37 = v27;
let v38 = 4i;
if ((v37==v38)) {
let v39 = 12i;
let v40 = 8i;
let v41 = v28;
let v42 = (v40*v41);
return (v39+v42);
}
let v43 = v27;
let v44 = 5i;
if ((v43==v44)) {
return 32i;
}
return v28;
}
fn fn4(v62:f32)->i32 {
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
fn fn3(v58:f32,v59:bool,v60:bool)->f32 {
let v61 = v58;
var v87: i32 = fn4(v61);
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
fn fn7(v276:f32)->f32 {
var v277: f32 = v276;
let v278 = v277;
let v279 = 3.14159274f;
if ((v278>v279)) {
let v280 = v277;
let v281 = 6.28318548f;
v277 = (v280-v281);
}
let v282 = v277;
let v283 = 3.14159274f;
if ((v282>v283)) {
let v284 = v277;
let v285 = 6.28318548f;
v277 = (v284-v285);
}
let v286 = v277;
let v287 = -3.14159274f;
if ((v286<v287)) {
let v288 = v277;
let v289 = 6.28318548f;
v277 = (v288+v289);
}
let v290 = v277;
let v291 = v277;
var v292: f32 = (v290*v291);
let v293 = v277;
let v294 = 1i;
let v295 = v292;
let v296 = -1i;
let v297 = 6i;
if (f32(v297) == 0.0f) { vkf_failed = true; }
let v298 = (f32(v296)/f32(v297));
let v299 = v292;
let v300 = 1i;
let v301 = 120i;
if (f32(v301) == 0.0f) { vkf_failed = true; }
let v302 = (f32(v300)/f32(v301));
let v303 = v292;
let v304 = -1i;
let v305 = 5040i;
if (f32(v305) == 0.0f) { vkf_failed = true; }
let v306 = (f32(v304)/f32(v305));
let v307 = v292;
let v308 = 1i;
let v309 = 362880i;
if (f32(v309) == 0.0f) { vkf_failed = true; }
let v310 = (f32(v308)/f32(v309));
let v311 = v292;
let v312 = -1i;
let v313 = 39916800i;
if (f32(v313) == 0.0f) { vkf_failed = true; }
let v314 = (f32(v312)/f32(v313));
let v315 = v292;
let v316 = 6.2270208e+09f;
if (v316 == 0.0f) { vkf_failed = true; }
let v317 = (v315/v316);
let v318 = (v314+v317);
let v319 = (v311*v318);
let v320 = (v310+v319);
let v321 = (v307*v320);
let v322 = (v306+v321);
let v323 = (v303*v322);
let v324 = (v302+v323);
let v325 = (v299*v324);
let v326 = (v298+v325);
let v327 = (v295*v326);
let v328 = (f32(v294)+v327);
return (v293*v328);
}
fn fn8(v398:f32)->f32 {
let v399 = v398;
let v400 = 1.57079637f;
let v401 = (v399+v400);
return fn7(v401);
}
fn fn9(v492:i32,v493:i32,v494:i32)->f32 {
let v495 = 6.28318548f;
let v496 = v492;
let v497 = (v495*f32(v496));
let v498 = 8i;
if (f32(v498) == 0.0f) { vkf_failed = true; }
var v499: f32 = (v497/f32(v498));
let v500 = v493;
let v501 = 0i;
if ((v500==v501)) {
let v502 = v494;
let v503 = 0i;
if ((v502==v503)) {
let v504 = 0.680000007f;
let v505 = v499;
let v506 = fn8(v505);
return (v504*v506);
}
let v507 = 0.680000007f;
let v508 = v499;
let v509 = fn7(v508);
return (v507*v509);
}
let v510 = v493;
let v511 = 1i;
if ((v510==v511)) {
let v512 = v494;
let v513 = 0i;
if ((v512==v513)) {
let v514 = -0.660000026f;
let v515 = 0.439999998f;
let v516 = v492;
let v517 = 4i;
if (v517 == 0i) { vkf_failed = true; }
let v518 = (v516%v517);
let v519 = (v515*f32(v518));
return (v514+v519);
}
let v520 = -0.349999994f;
let v521 = 0.699999988f;
let v522 = v492;
let v523 = 4i;
if (f32(v523) == 0.0f) { vkf_failed = true; }
let v524 = floor(f32(v522)/f32(v523));
let v525 = (v521*v524);
return (v520+v525);
}
let v526 = v494;
let v527 = 0i;
if ((v526==v527)) {
let v528 = -0.699999988f;
let v529 = 0.200000003f;
let v530 = v492;
let v531 = (v529*f32(v530));
return (v528+v531);
}
let v532 = 0.600000024f;
let v533 = 0.319999993f;
let v534 = v492;
let v535 = 3i;
if (v535 == 0i) { vkf_failed = true; }
let v536 = (v534%v535);
let v537 = (v533*f32(v536));
return (v532-v537);
}
fn fn6(v255:i32,v256:i32,v257:f32,v258:i32,v259:i32,v260:i32)->f32 {
let v261 = v255;
let v262 = 0i;
if ((v261==v262)) {
let v263 = -0.860000014f;
let v264 = 1.72000003f;
let v265 = v257;
let v266 = (v264*v265);
var v267: f32 = (v263+v266);
let v268 = v259;
let v269 = 0i;
if ((v268==v269)) {
return v267;
}
let v270 = v258;
let v271 = 0i;
if ((v270==v271)) {
let v272 = 0.479999989f;
let v273 = 6.28318548f;
let v274 = v257;
let v275 = (v273*v274);
let v329 = fn7(v275);
return (v272*v329);
}
let v330 = v258;
let v331 = 1i;
if ((v330==v331)) {
let v332 = 1.29999995f;
let v333 = v267;
let v334 = (v332*v333);
let v335 = v267;
let v336 = (v334*v335);
let v337 = 0.419999987f;
return (v336-v337);
}
let v338 = 0.379999995f;
let v339 = 12.566371f;
let v340 = v257;
let v341 = (v339*v340);
let v342 = fn7(v341);
return (v338*v342);
}
let v343 = v255;
let v344 = 1i;
if ((v343==v344)) {
let v345 = -0.800000012f;
let v346 = 1.60000002f;
let v347 = v257;
let v348 = (v346*v347);
var v349: f32 = (v345+v348);
let v350 = -0.800000012f;
let v351 = 0.200000003f;
let v352 = v256;
let v353 = 9i;
if (v353 == 0i) { vkf_failed = true; }
let v354 = (v352%v353);
let v355 = (v351*f32(v354));
var v356: f32 = (v350+v355);
let v357 = v256;
let v358 = 9i;
if ((v357>=v358)) {
v356 = v349;
let v359 = -0.800000012f;
let v360 = 0.200000003f;
let v361 = v256;
let v362 = 9i;
if (v362 == 0i) { vkf_failed = true; }
let v363 = (v361%v362);
let v364 = (v360*f32(v363));
v349 = (v359+v364);
}
let v365 = v258;
let v366 = 1i;
if ((v365==v366)) {
let v367 = v259;
let v368 = 0i;
if ((v367==v368)) {
let v369 = v349;
let v370 = 0.119999997f;
let v371 = 4i;
let v372 = v356;
let v373 = (f32(v371)*v372);
let v374 = fn7(v373);
let v375 = (v370*v374);
return (v369+v375);
}
let v376 = v356;
let v377 = 0.119999997f;
let v378 = 4i;
let v379 = v349;
let v380 = (f32(v378)*v379);
let v381 = fn7(v380);
let v382 = (v377*v381);
return (v376+v382);
}
let v383 = v258;
let v384 = 2i;
if ((v383==v384)) {
let v385 = 0.550000012f;
let v386 = v349;
let v387 = v349;
let v388 = (v386*v387);
let v389 = v356;
let v390 = v356;
let v391 = (v389*v390);
let v392 = (v388+v391);
var v393: f32 = (v385*v392);
let v394 = v259;
let v395 = 0i;
if ((v394==v395)) {
let v396 = v349;
let v397 = v393;
let v402 = fn8(v397);
let v403 = (v396*v402);
let v404 = v356;
let v405 = v393;
let v406 = fn7(v405);
let v407 = (v404*v406);
return (v403-v407);
}
let v408 = v349;
let v409 = v393;
let v410 = fn7(v409);
let v411 = (v408*v410);
let v412 = v356;
let v413 = v393;
let v414 = fn8(v413);
let v415 = (v412*v414);
return (v411+v415);
}
let v416 = v259;
let v417 = 0i;
if ((v416==v417)) {
return v349;
}
return v356;
}
let v418 = v255;
let v419 = 2i;
if ((v418==v419)) {
let v420 = v258;
let v421 = 0.785398185f;
let v422 = (f32(v420)*v421);
let v423 = v256;
let v424 = 1.57079637f;
let v425 = (f32(v423)*v424);
var v426: f32 = (v422+v425);
let v427 = v259;
let v428 = 0i;
if ((v427==v428)) {
let v429 = -0.720000029f;
let v430 = 1.44000006f;
let v431 = v257;
let v432 = (v430*v431);
let v433 = (v429+v432);
let v434 = v426;
let v435 = fn8(v434);
return (v433*v435);
}
let v436 = -0.720000029f;
let v437 = 1.44000006f;
let v438 = v257;
let v439 = (v437*v438);
let v440 = (v436+v439);
let v441 = v426;
let v442 = fn7(v441);
return (v440*v442);
}
let v443 = v255;
let v444 = 3i;
if ((v443==v444)) {
let v445 = 6.28318548f;
let v446 = v257;
var v447: f32 = (v445*v446);
let v448 = v259;
let v449 = 0i;
if ((v448==v449)) {
let v450 = 0.720000029f;
let v451 = v447;
let v452 = fn8(v451);
return (v450*v452);
}
let v453 = v258;
let v454 = 1i;
if ((v453==v454)) {
let v455 = 0.439999998f;
let v456 = 2i;
let v457 = v447;
let v458 = (f32(v456)*v457);
let v459 = fn7(v458);
return (v455*v459);
}
let v460 = v258;
let v461 = 2i;
if ((v460==v461)) {
let v462 = 0.349999994f;
let v463 = v447;
let v464 = fn7(v463);
return (v462*v464);
}
let v465 = 0.720000029f;
let v466 = v447;
let v467 = fn7(v466);
return (v465*v467);
}
let v468 = v255;
let v469 = 4i;
if ((v468==v469)) {
let v470 = v256;
let v471 = 12i;
if ((v470<v471)) {
let v472 = v256;
let v473 = 8i;
if (v473 == 0i) { vkf_failed = true; }
var v474: i32 = (v472%v473);
let v475 = v256;
let v476 = 1i;
let v477 = (v475+v476);
let v478 = 8i;
if (v478 == 0i) { vkf_failed = true; }
var v479: i32 = (v477%v478);
let v480 = v256;
let v481 = 8i;
if ((v480>=v481)) {
let v482 = v474;
let v483 = 4i;
let v484 = (v482+v483);
let v485 = 8i;
if (v485 == 0i) { vkf_failed = true; }
v479 = (v484%v485);
}
let v486 = 1i;
let v487 = v257;
let v488 = (f32(v486)-v487);
let v489 = v474;
let v490 = v258;
let v491 = v259;
let v538 = fn9(v489,v490,v491);
let v539 = (v488*v538);
let v540 = v257;
let v541 = v479;
let v542 = v258;
let v543 = v259;
let v544 = fn9(v541,v542,v543);
let v545 = (v540*v544);
return (v539+v545);
}
let v546 = v256;
let v547 = 12i;
var v548: i32 = (v546-v547);
let v549 = 6.28318548f;
let v550 = v257;
var v551: f32 = (v549*v550);
let v552 = v259;
let v553 = 0i;
if ((v552==v553)) {
let v554 = v548;
let v555 = v258;
let v556 = v259;
let v557 = fn9(v554,v555,v556);
let v558 = 0.0549999997f;
let v559 = v551;
let v560 = fn8(v559);
let v561 = (v558*v560);
return (v557+v561);
}
let v562 = v548;
let v563 = v258;
let v564 = v259;
let v565 = fn9(v562,v563,v564);
let v566 = 0.0549999997f;
let v567 = v551;
let v568 = fn7(v567);
let v569 = (v566*v568);
return (v565+v569);
}
let v570 = v256;
let v571 = 4i;
if (f32(v571) == 0.0f) { vkf_failed = true; }
var v572: i32 = i32(floor(f32(v570)/f32(v571)));
let v573 = v256;
let v574 = 4i;
if (v574 == 0i) { vkf_failed = true; }
var v575: i32 = (v573%v574);
let v576 = v572;
let v577 = v258;
let v578 = 0i;
let v579 = fn9(v576,v577,v578);
let v580 = 0.899999976f;
var v581: f32 = (v579*v580);
let v582 = v572;
let v583 = v258;
let v584 = 1i;
let v585 = fn9(v582,v583,v584);
let v586 = 0.899999976f;
var v587: f32 = (v585*v586);
var v588: f32 = -0.0900000036f;
var v589: f32 = -0.0649999976f;
let v590 = v575;
let v591 = 0i;
if ((v590==v591)) {
let v592 = -0.0900000036f;
let v593 = 0.180000007f;
let v594 = v257;
let v595 = (v593*v594);
v588 = (v592+v595);
}
let v596 = v575;
let v597 = 1i;
if ((v596==v597)) {
v588 = 0.0900000036f;
let v598 = -0.0649999976f;
let v599 = 0.129999995f;
let v600 = v257;
let v601 = (v599*v600);
v589 = (v598+v601);
}
let v602 = v575;
let v603 = 2i;
if ((v602==v603)) {
let v604 = 0.0900000036f;
let v605 = 0.180000007f;
let v606 = v257;
let v607 = (v605*v606);
v588 = (v604-v607);
v589 = 0.0649999976f;
}
let v608 = v575;
let v609 = 3i;
if ((v608==v609)) {
let v610 = 0.0649999976f;
let v611 = 0.129999995f;
let v612 = v257;
let v613 = (v611*v612);
v589 = (v610-v613);
}
let v614 = v259;
let v615 = 0i;
if ((v614==v615)) {
let v616 = v581;
let v617 = v588;
return (v616+v617);
}
let v618 = v587;
let v619 = v589;
return (v618+v619);
}
fn fn11(v661:f32,v662:f32,v663:f32,v664:f32,v665:f32,v666:f32)->f32 {
let v667 = 1i;
let v668 = v666;
var v669: f32 = (f32(v667)-v668);
let v670 = v669;
let v671 = v661;
let v672 = (v670*v671);
let v673 = v666;
let v674 = v662;
let v675 = (v673*v674);
let v676 = (v672+v675);
let v677 = v669;
let v678 = 3i;
let v679 = vkf_powi(v677,v678);
let v680 = v669;
let v681 = (v679-v680);
let v682 = v663;
let v683 = (v681*v682);
let v684 = v666;
let v685 = 3i;
let v686 = vkf_powi(v684,v685);
let v687 = v666;
let v688 = (v686-v687);
let v689 = v664;
let v690 = (v688*v689);
let v691 = (v683+v690);
let v692 = v665;
let v693 = (v691*v692);
let v694 = v665;
let v695 = (v693*v694);
let v696 = 6i;
if (f32(v696) == 0.0f) { vkf_failed = true; }
let v697 = (v695/f32(v696));
return (v676+v697);
}
fn fn10(v637:f32,v638:f32,v639:f32,v640:f32,v641:i32)->f32 {
var v642: f32 = 0.0f;
let v643 = v641;
let v644 = 1i;
if ((v643==v644)) {
let v645 = 1.5f;
let v646 = v639;
let v647 = 2i;
let v648 = v638;
let v649 = (f32(v647)*v648);
let v650 = (v646-v649);
let v651 = v637;
let v652 = (v650+v651);
v642 = (v645*v652);
}
let v653 = v640;
let v654 = 1i;
if ((v653<=f32(v654))) {
let v655 = v637;
let v656 = v638;
let v657 = 0.0f;
let v658 = v642;
let v659 = 1.0f;
let v660 = v640;
return fn11(v655,v656,v657,v658,v659,v660);
}
let v698 = v638;
let v699 = v639;
let v700 = v642;
let v701 = 0.0f;
let v702 = 1.0f;
let v703 = v640;
let v704 = 1i;
let v705 = (v703-f32(v704));
return fn11(v698,v699,v700,v701,v702,v705);
}
fn fn5(v242:i32,v243:i32,v244:f32,v245:f32,v246:i32,v247:i32,v248:i32)->f32 {
let v249 = v242;
let v250 = v243;
let v251 = v244;
let v252 = 0i;
let v253 = v247;
let v254 = v248;
let v620 = fn6(v249,v250,v251,v252,v253,v254);
let v621 = v242;
let v622 = v243;
let v623 = v244;
let v624 = 1i;
let v625 = v247;
let v626 = v248;
let v627 = fn6(v621,v622,v623,v624,v625,v626);
let v628 = v242;
let v629 = v243;
let v630 = v244;
let v631 = 2i;
let v632 = v247;
let v633 = v248;
let v634 = fn6(v628,v629,v630,v631,v632,v633);
let v635 = v245;
let v636 = v246;
return fn10(v620,v627,v634,v635,v636);
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
let v16 = 8i;
v17 = (v15>=v16);
}
var v20 = v17;
if (v20) {
let v18 = v9;
let v19 = 128i;
v20 = (v18<=v19);
}
if (!(v20)) { vkf_failed = true; }
let v21 = v3;
let v22 = 0i;
var v47 = (v21>=v22);
if (v47) {
let v23 = v3;
let v24 = 2i;
let v25 = v7;
let v26 = v9;
let v45 = fn2(v25,v26);
let v46 = (v24*v45);
v47 = (v23<v46);
}
if (!(v47)) { vkf_failed = true; }
let v48 = read_params(1i);
let v49 = read_params(3i);
let v50 = 0i;
let v51 = (v49>f32(v50));
let v52 = read_params(4i);
let v53 = 0i;
let v54 = (v52>f32(v53));
let v55 = v48;
let v56 = v51;
let v57 = v54;
var v169: f32 = fn3(v55,v56,v57);
let v170 = read_params(2i);
if (!(abs(v170) < 2147483648.0f)) { vkf_failed = true; }
var v171: i32 = i32(v170);
let v172 = v3;
let v173 = 2i;
if (f32(v173) == 0.0f) { vkf_failed = true; }
var v174: i32 = i32(floor(f32(v172)/f32(v173)));
var v175: i32 = 0i;
let v176 = v174;
let v177 = f32(v176);
let v178 = v9;
if (f32(v178) == 0.0f) { vkf_failed = true; }
var v179: f32 = (v177/f32(v178));
let v180 = v174;
let v181 = 1i;
let v182 = (v180+v181);
let v183 = f32(v182);
let v184 = v9;
if (f32(v184) == 0.0f) { vkf_failed = true; }
var v185: f32 = (v183/f32(v184));
let v186 = v7;
let v187 = 1i;
var v190 = (v186==v187);
if (!v190) {
let v188 = v7;
let v189 = 2i;
v190 = (v188==v189);
}
if (v190) {
let v191 = v174;
let v192 = v9;
if (f32(v192) == 0.0f) { vkf_failed = true; }
v175 = i32(floor(f32(v191)/f32(v192)));
let v193 = v174;
let v194 = v9;
if (v194 == 0i) { vkf_failed = true; }
let v195 = (v193%v194);
let v196 = f32(v195);
let v197 = v9;
if (f32(v197) == 0.0f) { vkf_failed = true; }
v179 = (v196/f32(v197));
let v198 = v174;
let v199 = v9;
if (v199 == 0i) { vkf_failed = true; }
let v200 = (v198%v199);
let v201 = 1i;
let v202 = (v200+v201);
let v203 = f32(v202);
let v204 = v9;
if (f32(v204) == 0.0f) { vkf_failed = true; }
v185 = (v203/f32(v204));
}
let v205 = v7;
let v206 = 4i;
if ((v205==v206)) {
let v207 = v174;
let v208 = 12i;
if ((v207<v208)) {
v175 = v174;
v179 = f32(0i);
v185 = f32(1i);
}
let v209 = v174;
let v210 = 12i;
if ((v209>=v210)) {
let v211 = 12i;
let v212 = v174;
let v213 = 12i;
let v214 = (v212-v213);
let v215 = v9;
if (f32(v215) == 0.0f) { vkf_failed = true; }
let v216 = floor(f32(v214)/f32(v215));
v175 = i32((f32(v211)+v216));
let v217 = v174;
let v218 = 12i;
let v219 = (v217-v218);
let v220 = v9;
if (v220 == 0i) { vkf_failed = true; }
let v221 = (v219%v220);
let v222 = f32(v221);
let v223 = v9;
if (f32(v223) == 0.0f) { vkf_failed = true; }
v179 = (v222/f32(v223));
let v224 = v174;
let v225 = 12i;
let v226 = (v224-v225);
let v227 = v9;
if (v227 == 0i) { vkf_failed = true; }
let v228 = (v226%v227);
let v229 = 1i;
let v230 = (v228+v229);
let v231 = f32(v230);
let v232 = v9;
if (f32(v232) == 0.0f) { vkf_failed = true; }
v185 = (v231/f32(v232));
}
}
let v233 = v7;
let v234 = 5i;
if ((v233>=v234)) {
v175 = v174;
v179 = f32(0i);
v185 = f32(1i);
}
let v235 = v7;
let v236 = v175;
let v237 = v179;
let v238 = v169;
let v239 = v171;
let v240 = 0i;
let v241 = v9;
var v706: f32 = fn5(v235,v236,v237,v238,v239,v240,v241);
let v707 = v7;
let v708 = v175;
let v709 = v179;
let v710 = v169;
let v711 = v171;
let v712 = 1i;
let v713 = v9;
var v714: f32 = fn5(v707,v708,v709,v710,v711,v712,v713);
let v715 = v7;
let v716 = v175;
let v717 = v185;
let v718 = v169;
let v719 = v171;
let v720 = 0i;
let v721 = v9;
var v722: f32 = fn5(v715,v716,v717,v718,v719,v720,v721);
let v723 = v7;
let v724 = v175;
let v725 = v185;
let v726 = v169;
let v727 = v171;
let v728 = 1i;
let v729 = v9;
var v730: f32 = fn5(v723,v724,v725,v726,v727,v728,v729);
let v731 = v722;
let v732 = v706;
var v733: f32 = (v731-v732);
let v734 = v730;
let v735 = v714;
var v736: f32 = (v734-v735);
let v737 = v733;
let v738 = v733;
let v739 = (v737*v738);
let v740 = v736;
let v741 = v736;
let v742 = (v740*v741);
let v743 = (v739+v742);
if (v743 < 0.0f) { vkf_failed = true; }
var v744: f32 = sqrt(v743);
var v745: f32 = 0.0f;
var v746: f32 = 0.0f;
let v747 = v744;
let v748 = 1.00000001e-07f;
if ((v747>v748)) {
let v749 = (-v736);
let v750 = 0.00400000019f;
let v751 = (v749*v750);
let v752 = v744;
if (v752 == 0.0f) { vkf_failed = true; }
v745 = (v751/v752);
let v753 = v733;
let v754 = 0.00400000019f;
let v755 = (v753*v754);
let v756 = v744;
if (v756 == 0.0f) { vkf_failed = true; }
v746 = (v755/v756);
}
let v757 = f32(0i);
let v758 = f32(0i);
let v759 = f32(0i);
let v760 = f32(0i);
let v761 = f32(0i);
let v762 = f32(0i);
let v763 = f32(0i);
let v764 = f32(0i);
let v765 = f32(0i);
let v766 = f32(0i);
let v767 = f32(0i);
let v768 = f32(0i);
let v769 = f32(0i);
let v770 = f32(0i);
let v771 = f32(0i);
let v772 = f32(0i);
let v773 = f32(0i);
let v774 = f32(0i);
let v775 = f32(0i);
let v776 = f32(0i);
let v777 = f32(0i);
var v778: array<f32,21> = array<f32,21>(v757,v758,v759,v760,v761,v762,v763,v764,v765,v766,v767,v768,v769,v770,v771,v772,v773,v774,v775,v776,v777);
var v779: i32 = 0i;
loop {
let v780 = v779;
let v781 = 3i;
if (!((v780<v781))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v782: i32 = v779;
let v783 = v3;
let v784 = 2i;
if (v784 == 0i) { vkf_failed = true; }
let v785 = (v783%v784);
let v786 = 1i;
if ((v785==v786)) {
let v787 = v779;
let v788 = 1i;
v782 = (v787+v788);
let v789 = v779;
let v790 = 0i;
if ((v789==v790)) {
v782 = 0i;
}
}
let v791 = v706;
let v792 = v745;
var v793: f32 = (v791+v792);
let v794 = v714;
let v795 = v746;
var v796: f32 = (v794+v795);
let v797 = v782;
let v798 = 1i;
if ((v797==v798)) {
let v799 = v706;
let v800 = v745;
v793 = (v799-v800);
let v801 = v714;
let v802 = v746;
v796 = (v801-v802);
}
let v803 = v782;
let v804 = 2i;
if ((v803==v804)) {
let v805 = v722;
let v806 = v745;
v793 = (v805-v806);
let v807 = v730;
let v808 = v746;
v796 = (v807-v808);
}
let v809 = v782;
let v810 = 3i;
if ((v809==v810)) {
let v811 = v722;
let v812 = v745;
v793 = (v811+v812);
let v813 = v730;
let v814 = v746;
v796 = (v813+v814);
}
let v815 = v779;
let v816 = 7i;
let v817 = (v815*v816);
if (v817<0i || v817>=21i) { vkf_failed=true; } else { v778[u32(v817)]=v793; }
let v818 = v779;
let v819 = 7i;
let v820 = (v818*v819);
let v821 = 1i;
let v822 = (v820+v821);
if (v822<0i || v822>=21i) { vkf_failed=true; } else { v778[u32(v822)]=v796; }
let v823 = v779;
let v824 = 7i;
let v825 = (v823*v824);
let v826 = 2i;
let v827 = (v825+v826);
if (v827<0i || v827>=21i) { vkf_failed=true; } else { v778[u32(v827)]=f32(0i); }
let v828 = v779;
let v829 = 7i;
let v830 = (v828*v829);
let v831 = 3i;
let v832 = (v830+v831);
let v833 = 0.180000007f;
let v834 = 0.0900000036f;
let v835 = v7;
let v836 = (v834*f32(v835));
if (v832<0i || v832>=21i) { vkf_failed=true; } else { v778[u32(v832)]=(v833+v836); }
let v837 = v779;
let v838 = 7i;
let v839 = (v837*v838);
let v840 = 4i;
let v841 = (v839+v840);
let v842 = 0.850000024f;
let v843 = 0.0599999987f;
let v844 = v7;
let v845 = (v843*f32(v844));
if (v841<0i || v841>=21i) { vkf_failed=true; } else { v778[u32(v841)]=(v842-v845); }
let v846 = v779;
let v847 = 7i;
let v848 = (v846*v847);
let v849 = 5i;
let v850 = (v848+v849);
if (v850<0i || v850>=21i) { vkf_failed=true; } else { v778[u32(v850)]=0.949999988f; }
let v851 = v779;
let v852 = 7i;
let v853 = (v851*v852);
let v854 = 6i;
let v855 = (v853+v854);
if (v855<0i || v855>=21i) { vkf_failed=true; } else { v778[u32(v855)]=f32(1i); }
let v856 = v779;
let v857 = 1i;
v779 = (v856+v857);
}
return v778;
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
