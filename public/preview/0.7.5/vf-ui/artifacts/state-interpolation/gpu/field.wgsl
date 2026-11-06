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
fn fn5(v185:f32,v186:f32)->f32 {
let v187 = v185;
let v188 = v186;
if ((v187<v188)) {
return v185;
}
return v186;
}
fn fn6(v215:f32,v216:f32)->f32 {
let v217 = v215;
let v218 = v216;
if ((v217>v218)) {
return v215;
}
return v216;
}
fn fn7(v237:f32,v238:f32,v239:f32)->f32 {
let v240 = v239;
let v241 = v238;
let v242 = v237;
let v243 = fn6(v241,v242);
return fn5(v240,v243);
}
fn fn8(v335:f32,v336:f32,v337:f32,v338:f32,v339:f32,v340:f32)->f32 {
let v341 = 1i;
let v342 = v339;
let v343 = (f32(v341)-v342);
let v344 = 1i;
let v345 = v340;
let v346 = (f32(v344)-v345);
let v347 = (v343*v346);
let v348 = v335;
var v349: f32 = (v347*v348);
let v350 = v349;
let v351 = v339;
let v352 = 1i;
let v353 = v340;
let v354 = (f32(v352)-v353);
let v355 = (v351*v354);
let v356 = v336;
let v357 = (v355*v356);
v349 = (v350+v357);
let v358 = v349;
let v359 = 1i;
let v360 = v339;
let v361 = (f32(v359)-v360);
let v362 = v340;
let v363 = (v361*v362);
let v364 = v337;
let v365 = (v363*v364);
v349 = (v358+v365);
let v366 = v349;
let v367 = v339;
let v368 = v340;
let v369 = (v367*v368);
let v370 = v338;
let v371 = (v369*v370);
v349 = (v366+v371);
return v349;
}
fn fn4(v139:i32,v140:i32,v141:i32,v142:i32,v143:f32,v144:f32,v145:f32,v146:f32,v147:i32)->f32 {
let v148 = v147;
let v149 = v142;
let v150 = v141;
let v151 = (v149*v150);
var v152: i32 = (v148+v151);
let v153 = v152;
let v154 = v139;
let v155 = read_values((v153+v154));
let v156 = v146;
var v157: f32 = (v155*v156);
let v158 = v152;
let v159 = v139;
let v160 = (v158+v159);
let v161 = 1i;
let v162 = read_values((v160+v161));
let v163 = v146;
var v164: f32 = (v162*v163);
let v165 = v157;
let v166 = 0i;
var v169 = (v165>f32(v166));
if (v169) {
let v167 = v164;
let v168 = 0i;
v169 = (v167>f32(v168));
}
if (!(v169)) { vkf_failed = true; }
let v170 = v143;
let v171 = read_values(v152);
let v172 = (v170-v171);
let v173 = v157;
if (v173 == 0.0f) { vkf_failed = true; }
var v174: f32 = (v172/v173);
let v175 = v144;
let v176 = v152;
let v177 = 1i;
let v178 = read_values((v176+v177));
let v179 = (v175-v178);
let v180 = v164;
if (v180 == 0.0f) { vkf_failed = true; }
var v181: f32 = (v179/v180);
var v182: f32 = 0.0f;
let v183 = v157;
let v184 = v164;
var v189: f32 = fn5(v183,v184);
let v190 = v139;
let v191 = 3i;
if ((v190==v191)) {
let v192 = v152;
let v193 = v139;
let v194 = (v192+v193);
let v195 = 2i;
let v196 = read_values((v194+v195));
let v197 = v146;
var v198: f32 = (v196*v197);
let v199 = v198;
let v200 = 0i;
if (!((v199>f32(v200)))) { vkf_failed = true; }
let v201 = v145;
let v202 = v152;
let v203 = 2i;
let v204 = read_values((v202+v203));
let v205 = (v201-v204);
let v206 = v198;
if (v206 == 0.0f) { vkf_failed = true; }
v182 = (v205/v206);
let v207 = v189;
let v208 = v198;
v189 = fn5(v207,v208);
}
let v209 = abs(v174);
let v210 = 1i;
let v211 = (v209-f32(v210));
let v212 = abs(v181);
let v213 = 1i;
let v214 = (v212-f32(v213));
let v219 = fn6(v211,v214);
let v220 = abs(v182);
let v221 = 1i;
let v222 = (v220-f32(v221));
var v223: f32 = fn6(v219,v222);
let v224 = v174;
let v225 = 1i;
let v226 = (v224+f32(v225));
let v227 = v140;
let v228 = 1i;
let v229 = (v227-v228);
let v230 = (v226*f32(v229));
let v231 = 2i;
if (f32(v231) == 0.0f) { vkf_failed = true; }
let v232 = (v230/f32(v231));
let v233 = 0.0f;
let v234 = v140;
let v235 = 1i;
let v236 = (v234-v235);
var v244: f32 = fn7(v232,v233,f32(v236));
let v245 = v181;
let v246 = 1i;
let v247 = (v245+f32(v246));
let v248 = v140;
let v249 = 1i;
let v250 = (v248-v249);
let v251 = (v247*f32(v250));
let v252 = 2i;
if (f32(v252) == 0.0f) { vkf_failed = true; }
let v253 = (v251/f32(v252));
let v254 = 0.0f;
let v255 = v140;
let v256 = 1i;
let v257 = (v255-v256);
var v258: f32 = fn7(v253,v254,f32(v257));
var v259: f32 = 0.0f;
let v260 = v139;
let v261 = 3i;
if ((v260==v261)) {
let v262 = v182;
let v263 = 1i;
let v264 = (v262+f32(v263));
let v265 = v140;
let v266 = 1i;
let v267 = (v265-v266);
let v268 = (v264*f32(v267));
let v269 = 2i;
if (f32(v269) == 0.0f) { vkf_failed = true; }
let v270 = (v268/f32(v269));
let v271 = 0.0f;
let v272 = v140;
let v273 = 1i;
let v274 = (v272-v273);
v259 = fn7(v270,v271,f32(v274));
}
let v275 = v244;
let v276 = 1i;
if (f32(v276) == 0.0f) { vkf_failed = true; }
let v277 = floor(v275/f32(v276));
let v278 = v140;
let v279 = 2i;
let v280 = (v278-v279);
let v281 = fn5(v277,f32(v280));
if (!(abs(v281) < 2147483648.0f)) { vkf_failed = true; }
var v282: i32 = i32(v281);
let v283 = v258;
let v284 = 1i;
if (f32(v284) == 0.0f) { vkf_failed = true; }
let v285 = floor(v283/f32(v284));
let v286 = v140;
let v287 = 2i;
let v288 = (v286-v287);
let v289 = fn5(v285,f32(v288));
if (!(abs(v289) < 2147483648.0f)) { vkf_failed = true; }
var v290: i32 = i32(v289);
let v291 = v259;
let v292 = 1i;
if (f32(v292) == 0.0f) { vkf_failed = true; }
let v293 = floor(v291/f32(v292));
let v294 = v140;
let v295 = 2i;
let v296 = (v294-v295);
let v297 = fn5(v293,f32(v296));
if (!(abs(v297) < 2147483648.0f)) { vkf_failed = true; }
var v298: i32 = i32(v297);
let v299 = v244;
let v300 = v282;
var v301: f32 = (v299-f32(v300));
let v302 = v258;
let v303 = v290;
var v304: f32 = (v302-f32(v303));
let v305 = v259;
let v306 = v298;
var v307: f32 = (v305-f32(v306));
let v308 = v139;
let v309 = 2i;
if ((v308==v309)) {
let v310 = v152;
let v311 = 2i;
let v312 = v139;
let v313 = (v311*v312);
let v314 = (v310+v313);
let v315 = v290;
let v316 = v140;
let v317 = (v315*v316);
let v318 = (v314+v317);
let v319 = v282;
var v320: i32 = (v318+v319);
let v321 = read_values(v320);
let v322 = v320;
let v323 = 1i;
let v324 = read_values((v322+v323));
let v325 = v320;
let v326 = v140;
let v327 = read_values((v325+v326));
let v328 = v320;
let v329 = v140;
let v330 = (v328+v329);
let v331 = 1i;
let v332 = read_values((v330+v331));
let v333 = v301;
let v334 = v304;
var v372: f32 = fn8(v321,v324,v327,v332,v333,v334);
let v373 = v372;
let v374 = v223;
let v375 = 0.0f;
let v376 = fn6(v374,v375);
let v377 = (v373-v376);
let v378 = v189;
return (v377*v378);
}
var v379: i32 = 1i;
let v380 = v139;
let v381 = 3i;
if ((v380==v381)) {
v379 = 2i;
}
var v382: f32 = 0.0f;
var v383: i32 = 0i;
loop {
let v384 = v383;
let v385 = v379;
if (!((v384<v385))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v386: f32 = 1.0f;
let v387 = v139;
let v388 = 3i;
if ((v387==v388)) {
let v389 = 1i;
let v390 = v307;
v386 = (f32(v389)-v390);
let v391 = v383;
let v392 = 1i;
if ((v391==v392)) {
v386 = v307;
}
}
var v393: i32 = 0i;
loop {
let v394 = v393;
let v395 = 2i;
if (!((v394<v395))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v396 = 1i;
let v397 = v304;
var v398: f32 = (f32(v396)-v397);
let v399 = v393;
let v400 = 1i;
if ((v399==v400)) {
v398 = v304;
}
var v401: i32 = 0i;
loop {
let v402 = v401;
let v403 = 2i;
if (!((v402<v403))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v404 = 1i;
let v405 = v301;
var v406: f32 = (f32(v404)-v405);
let v407 = v401;
let v408 = 1i;
if ((v407==v408)) {
v406 = v301;
}
let v409 = v298;
let v410 = v383;
let v411 = (v409+v410);
let v412 = v140;
let v413 = (v411*v412);
let v414 = v140;
let v415 = (v413*v414);
let v416 = v290;
let v417 = v393;
let v418 = (v416+v417);
let v419 = v140;
let v420 = (v418*v419);
let v421 = (v415+v420);
let v422 = v282;
let v423 = (v421+v422);
let v424 = v401;
var v425: i32 = (v423+v424);
let v426 = v382;
let v427 = v406;
let v428 = v398;
let v429 = (v427*v428);
let v430 = v386;
let v431 = (v429*v430);
let v432 = v152;
let v433 = 2i;
let v434 = v139;
let v435 = (v433*v434);
let v436 = (v432+v435);
let v437 = v425;
let v438 = read_values((v436+v437));
let v439 = (v431*v438);
v382 = (v426+v439);
let v440 = v401;
let v441 = 1i;
v401 = (v440+v441);
}
let v442 = v393;
let v443 = 1i;
v393 = (v442+v443);
}
let v444 = v383;
let v445 = 1i;
v383 = (v444+v445);
}
let v446 = v382;
let v447 = v223;
let v448 = 0.0f;
let v449 = fn6(v447,v448);
let v450 = (v446-v449);
let v451 = v189;
return (v450*v451);
}
fn fn3(v113:i32,v114:i32,v115:i32,v116:i32,v117:f32,v118:f32,v119:f32,v120:f32)->f32 {
let v121 = v113;
let v122 = v114;
let v123 = v115;
let v124 = v116;
let v125 = v117;
let v126 = v118;
let v127 = v119;
let v128 = v120;
let v129 = 0i;
let v130 = v121;
let v131 = v122;
let v132 = v123;
let v133 = v124;
let v134 = v125;
let v135 = v126;
let v136 = v127;
let v137 = v128;
let v138 = v129;
return fn4(v130,v131,v132,v133,v134,v135,v136,v137,v138);
}
fn fn9(v474:f32,v475:f32,v476:f32)->f32 {
let v477 = v476;
let v478 = 0i;
if ((v477<=f32(v478))) {
let v479 = v474;
let v480 = v475;
return fn6(v479,v480);
}
let v481 = v476;
let v482 = v474;
let v483 = v475;
let v484 = abs((v482-v483));
let v485 = (v481-v484);
let v486 = 0.0f;
let v487 = fn6(v485,v486);
let v488 = v476;
if (v488 == 0.0f) { vkf_failed = true; }
var v489: f32 = (v487/v488);
let v490 = v474;
let v491 = v475;
let v492 = fn6(v490,v491);
let v493 = v476;
let v494 = v489;
let v495 = (v493*v494);
let v496 = v489;
let v497 = (v495*v496);
let v498 = 4i;
if (f32(v498) == 0.0f) { vkf_failed = true; }
let v499 = (v497/f32(v498));
return (v492+v499);
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
var v452: f32 = fn3(v105,v106,v107,v108,v109,v110,v111,v112);
let v453 = v91;
let v454 = 1i;
if ((v453<=v454)) {
return v452;
}
let v455 = v452;
let v456 = v88;
let v457 = v89;
let v458 = v90;
let v459 = 1i;
let v460 = v92;
let v461 = v93;
let v462 = v94;
let v463 = v95;
let v464 = v456;
let v465 = v457;
let v466 = v458;
let v467 = v459;
let v468 = v460;
let v469 = v461;
let v470 = v462;
let v471 = v463;
let v472 = fn3(v464,v465,v466,v467,v468,v469,v470,v471);
let v473 = v96;
v452 = fn9(v455,v472,v473);
let v500 = v91;
let v501 = 2i;
if ((v500<=v501)) {
return v452;
}
let v502 = v452;
let v503 = v88;
let v504 = v89;
let v505 = v90;
let v506 = 2i;
let v507 = v92;
let v508 = v93;
let v509 = v94;
let v510 = v95;
let v511 = v503;
let v512 = v504;
let v513 = v505;
let v514 = v506;
let v515 = v507;
let v516 = v508;
let v517 = v509;
let v518 = v510;
let v519 = fn3(v511,v512,v513,v514,v515,v516,v517,v518);
let v520 = v96;
v452 = fn9(v502,v519,v520);
let v521 = v91;
let v522 = 3i;
if ((v521<=v522)) {
return v452;
}
var v523: i32 = 3i;
loop {
let v524 = v523;
let v525 = v91;
if (!((v524<v525))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v526 = v452;
let v527 = v88;
let v528 = v89;
let v529 = v90;
let v530 = v523;
let v531 = v92;
let v532 = v93;
let v533 = v94;
let v534 = v95;
let v535 = fn3(v527,v528,v529,v530,v531,v532,v533,v534);
let v536 = v96;
v452 = fn9(v526,v535,v536);
let v537 = v523;
let v538 = 1i;
v523 = (v537+v538);
}
return v452;
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
var v539: f32 = fn2(v79,v80,v81,v82,v83,v84,v85,v86,v87);
let v540 = read_params(19i);
let v541 = 1i;
if ((v540==f32(v541))) {
return v539;
}
let v542 = v539;
let v543 = read_params(13i);
if (v543 == 0.0f) { vkf_failed = true; }
let v544 = (v542/v543);
let v545 = 0.5f;
let v546 = (v544+v545);
let v547 = 0.0f;
let v548 = 1.0f;
var v549: f32 = fn7(v546,v547,v548);
let v550 = read_params(19i);
let v551 = 2i;
if ((v550==f32(v551))) {
let v552 = v3;
let v553 = v18;
if (v553 == 0i) { vkf_failed = true; }
var v554: i32 = (v552%v553);
let v555 = v3;
let v556 = v18;
if (f32(v556) == 0.0f) { vkf_failed = true; }
let v557 = floor(f32(v555)/f32(v556));
let v558 = v18;
if (f32(v558) == 0.0f) { vkf_failed = true; }
var v559: i32 = i32((v557%f32(v558)));
let v560 = v3;
let v561 = v18;
let v562 = v18;
let v563 = (v561*v562);
if (f32(v563) == 0.0f) { vkf_failed = true; }
var v564: i32 = i32(floor(f32(v560)/f32(v563)));
let v565 = v554;
let v566 = 0i;
var v571 = (v565==v566);
if (!v571) {
let v567 = v554;
let v568 = v18;
let v569 = 1i;
let v570 = (v568-v569);
v571 = (v567==v570);
}
var v574 = v571;
if (!v574) {
let v572 = v559;
let v573 = 0i;
v574 = (v572==v573);
}
var v579 = v574;
if (!v579) {
let v575 = v559;
let v576 = v18;
let v577 = 1i;
let v578 = (v576-v577);
v579 = (v575==v578);
}
var v580: bool = v579;
let v581 = v10;
let v582 = 3i;
var v590 = (v581==v582);
if (v590) {
let v583 = v564;
let v584 = 0i;
var v589 = (v583==v584);
if (!v589) {
let v585 = v564;
let v586 = v18;
let v587 = 1i;
let v588 = (v586-v587);
v589 = (v585==v588);
}
v590 = v589;
}
if (v590) {
v580 = true;
}
if (v580) {
let v591 = v549;
let v592 = 9.99999997e-07f;
if (!((v591<=v592))) { vkf_failed = true; }
}
}
let v593 = v549;
let v594 = read_params(14i);
return (v593*v594);
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
