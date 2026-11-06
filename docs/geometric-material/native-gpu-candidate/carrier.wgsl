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
fn fn2(v177:f32,v178:f32)->f32 {
let v179 = v177;
let v180 = v178;
if ((v179<v180)) {
return v177;
}
return v178;
}
fn fn4(v241:i32,v242:i32,v243:i32,v244:i32)->i32 {
let v245 = v244;
let v246 = 0i;
if ((v245==v246)) {
return v241;
}
let v247 = v243;
let v248 = 0i;
if ((v247==v248)) {
let v249 = v244;
let v250 = 1i;
if ((v249==v250)) {
let v251 = v241;
let v252 = 1i;
return (v251+v252);
}
let v253 = v241;
let v254 = v242;
let v255 = (v253+v254);
let v256 = 1i;
return (v255+v256);
}
let v257 = v244;
let v258 = 1i;
if ((v257==v258)) {
let v259 = v241;
let v260 = v242;
let v261 = (v259+v260);
let v262 = 1i;
return (v261+v262);
}
let v263 = v241;
let v264 = v242;
return (v263+v264);
}
fn fn3(v228:i32,v229:i32,v230:i32,v231:i32)->i32 {
var v232: i32 = 0i;
var v233: i32 = 0i;
loop {
let v234 = v233;
let v235 = 3i;
if (!((v234<v235))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v236 = v231;
let v237 = v228;
let v238 = v229;
let v239 = v230;
let v240 = v233;
let v265 = fn4(v237,v238,v239,v240);
var v266: f32 = read_values((v236+v265));
let v267 = v231;
let v268 = v228;
let v269 = v229;
let v270 = v230;
let v271 = v233;
let v272 = 1i;
let v273 = (v271+v272);
let v274 = 3i;
if (v274 == 0i) { vkf_failed = true; }
let v275 = (v273%v274);
let v276 = fn4(v268,v269,v270,v275);
var v277: f32 = read_values((v267+v276));
let v278 = v266;
let v279 = 0i;
if ((v278>=f32(v279))) {
let v280 = v232;
let v281 = 1i;
v232 = (v280+v281);
}
let v282 = v266;
let v283 = 0i;
var v286 = (v282<f32(v283));
if (v286) {
let v284 = v277;
let v285 = 0i;
v286 = (v284>f32(v285));
}
var v292 = v286;
if (!v292) {
let v287 = v266;
let v288 = 0i;
var v291 = (v287>f32(v288));
if (v291) {
let v289 = v277;
let v290 = 0i;
v291 = (v289<f32(v290));
}
v292 = v291;
}
if (v292) {
let v293 = v232;
let v294 = 1i;
v232 = (v293+v294);
}
let v295 = v233;
let v296 = 1i;
v233 = (v295+v296);
}
return v232;
}
fn fn5(v328:i32,v329:i32,v330:i32,v331:i32,v332:i32,v333:i32)->f32 {
var v334: i32 = 0i;
var v335: i32 = 0i;
loop {
let v336 = v335;
let v337 = 3i;
if (!((v336<v337))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v338 = v328;
let v339 = v329;
let v340 = v330;
let v341 = v335;
var v342: i32 = fn4(v338,v339,v340,v341);
let v343 = v328;
let v344 = v329;
let v345 = v330;
let v346 = v335;
let v347 = 1i;
let v348 = (v346+v347);
let v349 = 3i;
if (v349 == 0i) { vkf_failed = true; }
let v350 = (v348%v349);
var v351: i32 = fn4(v343,v344,v345,v350);
let v352 = v333;
let v353 = v342;
var v354: f32 = read_values((v352+v353));
let v355 = v333;
let v356 = v351;
var v357: f32 = read_values((v355+v356));
let v358 = v342;
let v359 = v329;
if (v359 == 0i) { vkf_failed = true; }
let v360 = (v358%v359);
var v361: f32 = f32(v360);
let v362 = v351;
let v363 = v329;
if (v363 == 0i) { vkf_failed = true; }
let v364 = (v362%v363);
var v365: f32 = f32(v364);
let v366 = v332;
let v367 = 1i;
if ((v366==v367)) {
let v368 = v342;
let v369 = v329;
if (f32(v369) == 0.0f) { vkf_failed = true; }
let v370 = floor(f32(v368)/f32(v369));
v361 = v370;
let v371 = v351;
let v372 = v329;
if (f32(v372) == 0.0f) { vkf_failed = true; }
let v373 = floor(f32(v371)/f32(v372));
v365 = v373;
}
let v374 = v354;
let v375 = 0i;
if ((v374>=f32(v375))) {
let v376 = v334;
let v377 = v331;
if ((v376==v377)) {
return v361;
}
let v378 = v334;
let v379 = 1i;
v334 = (v378+v379);
}
let v380 = v354;
let v381 = 0i;
var v384 = (v380<f32(v381));
if (v384) {
let v382 = v357;
let v383 = 0i;
v384 = (v382>f32(v383));
}
var v390 = v384;
if (!v390) {
let v385 = v354;
let v386 = 0i;
var v389 = (v385>f32(v386));
if (v389) {
let v387 = v357;
let v388 = 0i;
v389 = (v387<f32(v388));
}
v390 = v389;
}
if (v390) {
let v391 = v334;
let v392 = v331;
if ((v391==v392)) {
let v393 = v361;
let v394 = v354;
let v395 = v354;
let v396 = v357;
let v397 = (v395-v396);
if (v397 == 0.0f) { vkf_failed = true; }
let v398 = (v394/v397);
let v399 = v365;
let v400 = v361;
let v401 = (v399-v400);
let v402 = (v398*v401);
return (v393+v402);
}
let v403 = v334;
let v404 = 1i;
v334 = (v403+v404);
}
let v405 = v335;
let v406 = 1i;
v335 = (v405+v406);
}
return 0.0f;
}
fn fn6(v531:f32,v532:f32)->f32 {
let v533 = v531;
let v534 = v532;
if ((v533>v534)) {
return v531;
}
return v532;
}
fn fn1(v3:i32)->array<f32,84> {
let v4 = read_params(1i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = read_params(2i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = v5;
let v9 = v5;
var v10: i32 = (v8*v9);
let v11 = v5;
let v12 = 1i;
let v13 = (v11-v12);
let v14 = v5;
let v15 = 1i;
let v16 = (v14-v15);
var v17: i32 = (v13*v16);
let v18 = v3;
let v19 = v17;
if (f32(v19) == 0.0f) { vkf_failed = true; }
var v20: i32 = i32(floor(f32(v18)/f32(v19)));
let v21 = v3;
let v22 = v17;
if (v22 == 0i) { vkf_failed = true; }
var v23: i32 = (v21%v22);
let v24 = read_params(0i);
if (!(abs(v24) < 2147483648.0f)) { vkf_failed = true; }
let v25 = i32(v24);
let v26 = 2i;
var v33 = (v25==v26);
if (v33) {
let v27 = v7;
let v28 = 4i;
let v29 = v10;
let v30 = (v28+v29);
let v31 = 4i;
let v32 = (v30+v31);
v33 = (v27==v32);
}
var v37 = v33;
if (v37) {
let v34 = v20;
let v35 = read_params(3i);
if (!(abs(v35) < 2147483648.0f)) { vkf_failed = true; }
let v36 = i32(v35);
v37 = (v34<v36);
}
if (!(v37)) { vkf_failed = true; }
let v38 = v20;
let v39 = v7;
var v40: i32 = (v38*v39);
let v41 = v40;
let v42 = 4i;
var v43: i32 = (v41+v42);
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
let v89 = f32(0i);
let v90 = f32(0i);
let v91 = f32(0i);
let v92 = f32(0i);
let v93 = f32(0i);
let v94 = f32(0i);
let v95 = f32(0i);
let v96 = f32(0i);
let v97 = f32(0i);
let v98 = f32(0i);
let v99 = f32(0i);
let v100 = f32(0i);
let v101 = f32(0i);
let v102 = f32(0i);
let v103 = f32(0i);
let v104 = f32(0i);
let v105 = f32(0i);
let v106 = f32(0i);
let v107 = f32(0i);
let v108 = f32(0i);
let v109 = f32(0i);
let v110 = f32(0i);
let v111 = f32(0i);
let v112 = f32(0i);
let v113 = f32(0i);
let v114 = f32(0i);
let v115 = f32(0i);
let v116 = f32(0i);
let v117 = f32(0i);
let v118 = f32(0i);
let v119 = f32(0i);
let v120 = f32(0i);
let v121 = f32(0i);
let v122 = f32(0i);
let v123 = f32(0i);
let v124 = f32(0i);
let v125 = f32(0i);
let v126 = f32(0i);
let v127 = f32(0i);
var v128: array<f32,84> = array<f32,84>(v44,v45,v46,v47,v48,v49,v50,v51,v52,v53,v54,v55,v56,v57,v58,v59,v60,v61,v62,v63,v64,v65,v66,v67,v68,v69,v70,v71,v72,v73,v74,v75,v76,v77,v78,v79,v80,v81,v82,v83,v84,v85,v86,v87,v88,v89,v90,v91,v92,v93,v94,v95,v96,v97,v98,v99,v100,v101,v102,v103,v104,v105,v106,v107,v108,v109,v110,v111,v112,v113,v114,v115,v116,v117,v118,v119,v120,v121,v122,v123,v124,v125,v126,v127);
let v129 = v23;
let v130 = v5;
let v131 = 1i;
let v132 = (v130-v131);
if (v132 == 0i) { vkf_failed = true; }
var v133: i32 = (v129%v132);
let v134 = v23;
let v135 = v5;
let v136 = 1i;
let v137 = (v135-v136);
if (f32(v137) == 0.0f) { vkf_failed = true; }
var v138: i32 = i32(floor(f32(v134)/f32(v137)));
let v139 = v138;
let v140 = v5;
let v141 = (v139*v140);
let v142 = v133;
var v143: i32 = (v141+v142);
let v144 = v43;
let v145 = v143;
var v146: f32 = read_values((v144+v145));
let v147 = v43;
let v148 = v143;
let v149 = (v147+v148);
let v150 = 1i;
var v151: f32 = read_values((v149+v150));
let v152 = v43;
let v153 = v143;
let v154 = (v152+v153);
let v155 = v5;
var v156: f32 = read_values((v154+v155));
let v157 = v43;
let v158 = v143;
let v159 = (v157+v158);
let v160 = v5;
let v161 = (v159+v160);
let v162 = 1i;
var v163: f32 = read_values((v161+v162));
var v164: f32 = read_params(11i);
let v165 = v40;
let v166 = 2i;
let v167 = read_values((v165+v166));
let v168 = v164;
var v169: f32 = (v167*v168);
let v170 = v40;
let v171 = 3i;
let v172 = read_values((v170+v171));
let v173 = v164;
var v174: f32 = (v172*v173);
let v175 = v169;
let v176 = v174;
var v181: f32 = fn2(v175,v176);
var v182: bool = false;
let v183 = i32(arrayLength(&params));
let v184 = 36i;
if ((v183>v184)) {
let v185 = read_params(36i);
let v186 = 1i;
v182 = (v185==f32(v186));
}
var v187: bool = false;
let v188 = i32(arrayLength(&params));
let v189 = 51i;
if ((v188>v189)) {
let v190 = read_params(49i);
let v191 = 1i;
v187 = (v190==f32(v191));
}
var v192: f32 = 1.0f;
var v193: f32 = 1.0f;
if (v187) {
v192 = read_params(50i);
v193 = read_params(51i);
let v194 = v192;
let v195 = 0i;
var v198 = (v194>f32(v195));
if (v198) {
let v196 = v193;
let v197 = 0i;
v198 = (v196>f32(v197));
}
if (!(v198)) { vkf_failed = true; }
}
var v199: f32 = 1.0f;
if (v182) {
let v200 = v40;
let v201 = 4i;
let v202 = (v200+v201);
let v203 = v10;
let v204 = (v202+v203);
let v205 = 3i;
let v206 = read_values((v204+v205));
let v207 = 1i;
if (!((v206==f32(v207)))) { vkf_failed = true; }
let v208 = read_params(25i);
if (!(abs(v208) < 2147483648.0f)) { vkf_failed = true; }
let v209 = i32(v208);
let v210 = 2i;
let v211 = read_params(3i);
if (!(abs(v211) < 2147483648.0f)) { vkf_failed = true; }
let v212 = i32(v211);
let v213 = (v210*v212);
let v214 = (v209+v213);
let v215 = v20;
v199 = read_values((v214+v215));
let v216 = v199;
let v217 = 0i;
var v220 = (v216>f32(v217));
if (v220) {
let v218 = v199;
let v219 = 1.00001001f;
v220 = (v218<=v219);
}
if (!(v220)) { vkf_failed = true; }
}
var v221: i32 = 0i;
loop {
let v222 = v221;
let v223 = 2i;
if (!((v222<v223))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v224 = v143;
let v225 = v5;
let v226 = v221;
let v227 = v43;
var v297: i32 = fn3(v224,v225,v226,v227);
var v298: i32 = 1i;
let v299 = v221;
let v300 = 42i;
var v301: i32 = (v299*v300);
loop {
let v302 = v298;
let v303 = v297;
let v304 = 1i;
let v305 = (v303-v304);
if (!((v302<v305))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v306: i32 = 0i;
loop {
let v307 = v306;
let v308 = 3i;
if (!((v307<v308))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v309: i32 = 0i;
let v310 = v306;
let v311 = 0i;
if ((v310>v311)) {
let v312 = v298;
let v313 = v306;
let v314 = (v312+v313);
let v315 = 1i;
v309 = (v314-v315);
}
let v316 = v143;
let v317 = v5;
let v318 = v221;
let v319 = v309;
let v320 = 0i;
let v321 = v43;
let v322 = v316;
let v323 = v317;
let v324 = v318;
let v325 = v319;
let v326 = v320;
let v327 = v321;
var v407: f32 = fn5(v322,v323,v324,v325,v326,v327);
let v408 = v143;
let v409 = v5;
let v410 = v221;
let v411 = v309;
let v412 = 1i;
let v413 = v43;
let v414 = v408;
let v415 = v409;
let v416 = v410;
let v417 = v411;
let v418 = v412;
let v419 = v413;
var v420: f32 = fn5(v414,v415,v416,v417,v418,v419);
let v421 = v407;
let v422 = v133;
var v423: f32 = (v421-f32(v422));
let v424 = v420;
let v425 = v138;
var v426: f32 = (v424-f32(v425));
let v427 = v146;
let v428 = 1i;
let v429 = v423;
let v430 = (f32(v428)-v429);
let v431 = (v427*v430);
let v432 = v151;
let v433 = v423;
let v434 = v426;
let v435 = (v433-v434);
let v436 = (v432*v435);
let v437 = (v431+v436);
let v438 = v163;
let v439 = v426;
let v440 = (v438*v439);
var v441: f32 = (v437+v440);
let v442 = v221;
let v443 = 1i;
if ((v442==v443)) {
let v444 = v146;
let v445 = 1i;
let v446 = v426;
let v447 = (f32(v445)-v446);
let v448 = (v444*v447);
let v449 = v163;
let v450 = v423;
let v451 = (v449*v450);
let v452 = (v448+v451);
let v453 = v156;
let v454 = v426;
let v455 = v423;
let v456 = (v454-v455);
let v457 = (v453*v456);
v441 = (v452+v457);
}
let v458 = v301;
let v459 = read_values(v40);
let v460 = 2i;
let v461 = v407;
let v462 = (f32(v460)*v461);
let v463 = v5;
let v464 = 1i;
let v465 = (v463-v464);
if (f32(v465) == 0.0f) { vkf_failed = true; }
let v466 = (v462/f32(v465));
let v467 = 1i;
let v468 = (v466-f32(v467));
let v469 = v169;
let v470 = (v468*v469);
if (v458<0i || v458>=84i) { vkf_failed=true; } else { v128[u32(v458)]=(v459+v470); }
let v471 = v301;
let v472 = 1i;
let v473 = (v471+v472);
let v474 = v40;
let v475 = 1i;
let v476 = read_values((v474+v475));
let v477 = 2i;
let v478 = v420;
let v479 = (f32(v477)*v478);
let v480 = v5;
let v481 = 1i;
let v482 = (v480-v481);
if (f32(v482) == 0.0f) { vkf_failed = true; }
let v483 = (v479/f32(v482));
let v484 = 1i;
let v485 = (v483-f32(v484));
let v486 = v174;
let v487 = (v485*v486);
if (v473<0i || v473>=84i) { vkf_failed=true; } else { v128[u32(v473)]=(-(v476+v487)); }
if (v187) {
let v488 = v301;
if (v488<0i || v488>=84i) { vkf_failed=true; }
let v489 = v128[u32(clamp(v488,0i,84i-1i))];
let v490 = 1i;
let v491 = (v489+f32(v490));
let v492 = read_params(20i);
let v493 = (v491*v492);
let v494 = 2i;
if (f32(v494) == 0.0f) { vkf_failed = true; }
let v495 = (v493/f32(v494));
let v496 = read_params(34i);
var v497: f32 = (v495+v496);
let v498 = 1i;
let v499 = v301;
let v500 = 1i;
let v501 = (v499+v500);
if (v501<0i || v501>=84i) { vkf_failed=true; }
let v502 = v128[u32(clamp(v501,0i,84i-1i))];
let v503 = (f32(v498)-v502);
let v504 = read_params(20i);
let v505 = (v503*v504);
let v506 = 2i;
if (f32(v506) == 0.0f) { vkf_failed = true; }
let v507 = (v505/f32(v506));
let v508 = read_params(35i);
var v509: f32 = (v507+v508);
let v510 = v301;
let v511 = 2i;
let v512 = v497;
let v513 = (f32(v511)*v512);
let v514 = v192;
let v515 = (v513-v514);
let v516 = v193;
if (v516 == 0.0f) { vkf_failed = true; }
if (v510<0i || v510>=84i) { vkf_failed=true; } else { v128[u32(v510)]=(v515/v516); }
let v517 = v301;
let v518 = 1i;
let v519 = (v517+v518);
let v520 = 1i;
let v521 = 2i;
let v522 = v509;
let v523 = (f32(v521)*v522);
let v524 = v193;
if (v524 == 0.0f) { vkf_failed = true; }
let v525 = (v523/v524);
if (v519<0i || v519>=84i) { vkf_failed=true; } else { v128[u32(v519)]=(f32(v520)-v525); }
}
let v526 = v301;
let v527 = 2i;
let v528 = (v526+v527);
let v529 = v441;
let v530 = 0.0f;
let v535 = fn6(v529,v530);
let v536 = v181;
if (v528<0i || v528>=84i) { vkf_failed=true; } else { v128[u32(v528)]=(v535*v536); }
var v537: i32 = 0i;
loop {
let v538 = v537;
let v539 = 4i;
if (!((v538<v539))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v540 = v40;
let v541 = 4i;
let v542 = (v540+v541);
let v543 = v10;
let v544 = (v542+v543);
let v545 = v537;
var v546: f32 = read_values((v544+v545));
if (v182) {
let v547 = v537;
let v548 = 3i;
if ((v547<v548)) {
let v549 = v546;
let v550 = v199;
v546 = (v549*v550);
}
let v551 = v537;
let v552 = 3i;
if ((v551==v552)) {
v546 = v199;
}
}
let v553 = v301;
let v554 = 3i;
let v555 = (v553+v554);
let v556 = v537;
let v557 = (v555+v556);
if (v557<0i || v557>=84i) { vkf_failed=true; } else { v128[u32(v557)]=v546; }
let v558 = v537;
let v559 = 1i;
v537 = (v558+v559);
}
let v560 = v301;
let v561 = 7i;
v301 = (v560+v561);
let v562 = v306;
let v563 = 1i;
v306 = (v562+v563);
}
let v564 = v298;
let v565 = 1i;
v298 = (v564+v565);
}
let v566 = v221;
let v567 = 1i;
v221 = (v566+v567);
}
return v128;
}
fn fn0(v1:i32)->array<f32,84> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/84u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<84u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<84u;i+=1u){results[gid.x*84u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/84u)],1u);}
}
