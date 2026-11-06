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
fn fn3(v137:i32,v138:i32,v139:i32,v140:i32)->i32 {
let v141 = v140;
let v142 = 0i;
if ((v141==v142)) {
return v137;
}
let v143 = v139;
let v144 = 0i;
if ((v143==v144)) {
let v145 = v140;
let v146 = 1i;
if ((v145==v146)) {
let v147 = v137;
let v148 = 1i;
return (v147+v148);
}
let v149 = v137;
let v150 = v138;
let v151 = (v149+v150);
let v152 = 1i;
return (v151+v152);
}
let v153 = v140;
let v154 = 1i;
if ((v153==v154)) {
let v155 = v137;
let v156 = v138;
let v157 = (v155+v156);
let v158 = 1i;
return (v157+v158);
}
let v159 = v137;
let v160 = v138;
return (v159+v160);
}
fn fn2(v19:i32,v20:f32,v21:i32,v22:f32,v23:f32,v24:f32,v25:f32)->array<f32,72> {
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
let v89 = f32(0i);
let v90 = f32(0i);
let v91 = f32(0i);
let v92 = f32(0i);
let v93 = f32(0i);
let v94 = f32(0i);
let v95 = f32(0i);
let v96 = f32(0i);
let v97 = f32(0i);
var v98: array<f32,72> = array<f32,72>(v26,v27,v28,v29,v30,v31,v32,v33,v34,v35,v36,v37,v38,v39,v40,v41,v42,v43,v44,v45,v46,v47,v48,v49,v50,v51,v52,v53,v54,v55,v56,v57,v58,v59,v60,v61,v62,v63,v64,v65,v66,v67,v68,v69,v70,v71,v72,v73,v74,v75,v76,v77,v78,v79,v80,v81,v82,v83,v84,v85,v86,v87,v88,v89,v90,v91,v92,v93,v94,v95,v96,v97);
let v99 = v22;
let v100 = v23;
let v101 = v24;
let v102 = v25;
var v103: array<f32,4> = array<f32,4>(v99,v100,v101,v102);
let v104 = v21;
let v105 = v19;
let v106 = 1i;
let v107 = (v105-v106);
if (f32(v107) == 0.0f) { vkf_failed = true; }
let v108 = floor(f32(v104)/f32(v107));
let v109 = v19;
let v110 = (v108*f32(v109));
let v111 = v21;
let v112 = v19;
let v113 = 1i;
let v114 = (v112-v113);
if (v114 == 0i) { vkf_failed = true; }
let v115 = (v111%v114);
var v116: i32 = i32((v110+f32(v115)));
var v117: i32 = 0i;
loop {
let v118 = v117;
let v119 = 2i;
if (!((v118<v119))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v120 = f32(0i);
let v121 = f32(0i);
let v122 = f32(0i);
let v123 = f32(0i);
let v124 = f32(0i);
let v125 = f32(0i);
let v126 = f32(0i);
let v127 = f32(0i);
var v128: array<f32,8> = array<f32,8>(v120,v121,v122,v123,v124,v125,v126,v127);
var v129: i32 = 0i;
var v130: i32 = 0i;
loop {
let v131 = v130;
let v132 = 3i;
if (!((v131<v132))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v133 = v116;
let v134 = v19;
let v135 = v117;
let v136 = v130;
var v161: i32 = fn3(v133,v134,v135,v136);
let v162 = v116;
let v163 = v19;
let v164 = v117;
let v165 = v130;
let v166 = 1i;
let v167 = (v165+v166);
let v168 = 3i;
if (v168 == 0i) { vkf_failed = true; }
let v169 = (v167%v168);
var v170: i32 = fn3(v162,v163,v164,v169);
var v171: f32 = read_values(v161);
var v172: f32 = read_values(v170);
let v173 = v171;
let v174 = 0i;
if ((v173>=f32(v174))) {
let v175 = 2i;
let v176 = v129;
let v177 = (v175*v176);
let v178 = v161;
let v179 = v19;
if (v179 == 0i) { vkf_failed = true; }
let v180 = (v178%v179);
let v181 = f32(v180);
let v182 = v20;
let v183 = (v181*v182);
let v184 = v19;
let v185 = 1i;
let v186 = (v184-v185);
if (f32(v186) == 0.0f) { vkf_failed = true; }
if (v177<0i || v177>=8i) { vkf_failed=true; } else { v128[u32(v177)]=(v183/f32(v186)); }
let v187 = 2i;
let v188 = v129;
let v189 = (v187*v188);
let v190 = 1i;
let v191 = (v189+v190);
let v192 = v161;
let v193 = v19;
if (f32(v193) == 0.0f) { vkf_failed = true; }
let v194 = floor(f32(v192)/f32(v193));
let v195 = v194;
let v196 = v20;
let v197 = (v195*v196);
let v198 = v19;
let v199 = 1i;
let v200 = (v198-v199);
if (f32(v200) == 0.0f) { vkf_failed = true; }
if (v191<0i || v191>=8i) { vkf_failed=true; } else { v128[u32(v191)]=(v197/f32(v200)); }
let v201 = v129;
let v202 = 1i;
v129 = (v201+v202);
}
let v203 = v171;
let v204 = 0i;
var v207 = (v203<f32(v204));
if (v207) {
let v205 = v172;
let v206 = 0i;
v207 = (v205>f32(v206));
}
var v213 = v207;
if (!v213) {
let v208 = v171;
let v209 = 0i;
var v212 = (v208>f32(v209));
if (v212) {
let v210 = v172;
let v211 = 0i;
v212 = (v210<f32(v211));
}
v213 = v212;
}
if (v213) {
let v214 = v171;
let v215 = v171;
let v216 = v172;
let v217 = (v215-v216);
if (v217 == 0.0f) { vkf_failed = true; }
var v218: f32 = (v214/v217);
let v219 = 2i;
let v220 = v129;
let v221 = (v219*v220);
let v222 = v161;
let v223 = v19;
if (v223 == 0i) { vkf_failed = true; }
let v224 = (v222%v223);
let v225 = f32(v224);
let v226 = v218;
let v227 = v170;
let v228 = v19;
if (v228 == 0i) { vkf_failed = true; }
let v229 = (v227%v228);
let v230 = v161;
let v231 = v19;
if (v231 == 0i) { vkf_failed = true; }
let v232 = (v230%v231);
let v233 = (v229-v232);
let v234 = (v226*f32(v233));
let v235 = (v225+v234);
let v236 = v20;
let v237 = (v235*v236);
let v238 = v19;
let v239 = 1i;
let v240 = (v238-v239);
if (f32(v240) == 0.0f) { vkf_failed = true; }
if (v221<0i || v221>=8i) { vkf_failed=true; } else { v128[u32(v221)]=(v237/f32(v240)); }
let v241 = 2i;
let v242 = v129;
let v243 = (v241*v242);
let v244 = 1i;
let v245 = (v243+v244);
let v246 = v161;
let v247 = v19;
if (f32(v247) == 0.0f) { vkf_failed = true; }
let v248 = floor(f32(v246)/f32(v247));
let v249 = v248;
let v250 = v218;
let v251 = v170;
let v252 = v19;
if (f32(v252) == 0.0f) { vkf_failed = true; }
let v253 = floor(f32(v251)/f32(v252));
let v254 = v161;
let v255 = v19;
if (f32(v255) == 0.0f) { vkf_failed = true; }
let v256 = floor(f32(v254)/f32(v255));
let v257 = (v253-v256);
let v258 = (v250*v257);
let v259 = (v249+v258);
let v260 = v20;
let v261 = (v259*v260);
let v262 = v19;
let v263 = 1i;
let v264 = (v262-v263);
if (f32(v264) == 0.0f) { vkf_failed = true; }
if (v245<0i || v245>=8i) { vkf_failed=true; } else { v128[u32(v245)]=(v261/f32(v264)); }
let v265 = v129;
let v266 = 1i;
v129 = (v265+v266);
}
let v267 = v130;
let v268 = 1i;
v130 = (v267+v268);
}
var v269: i32 = 1i;
let v270 = v117;
let v271 = 36i;
var v272: i32 = (v270*v271);
loop {
let v273 = v269;
let v274 = v129;
let v275 = 1i;
let v276 = (v274-v275);
if (!((v273<v276))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v277: i32 = 0i;
loop {
let v278 = v277;
let v279 = 3i;
if (!((v278<v279))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v280: i32 = 0i;
let v281 = v277;
let v282 = 0i;
if ((v281>v282)) {
let v283 = v269;
let v284 = v277;
let v285 = (v283+v284);
let v286 = 1i;
v280 = (v285-v286);
}
let v287 = v272;
let v288 = 2i;
let v289 = v280;
let v290 = (v288*v289);
if (v290<0i || v290>=8i) { vkf_failed=true; }
if (v287<0i || v287>=72i) { vkf_failed=true; } else { v98[u32(v287)]=v128[u32(clamp(v290,0i,8i-1i))]; }
let v291 = v272;
let v292 = 1i;
let v293 = (v291+v292);
let v294 = 2i;
let v295 = v280;
let v296 = (v294*v295);
let v297 = 1i;
let v298 = (v296+v297);
if (v298<0i || v298>=8i) { vkf_failed=true; }
if (v293<0i || v293>=72i) { vkf_failed=true; } else { v98[u32(v293)]=v128[u32(clamp(v298,0i,8i-1i))]; }
var v299: i32 = 0i;
loop {
let v300 = v299;
let v301 = 4i;
if (!((v300<v301))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v302 = v272;
let v303 = 2i;
let v304 = (v302+v303);
let v305 = v299;
let v306 = (v304+v305);
let v307 = v299;
if (v307<0i || v307>=4i) { vkf_failed=true; }
if (v306<0i || v306>=72i) { vkf_failed=true; } else { v98[u32(v306)]=v103[u32(clamp(v307,0i,4i-1i))]; }
let v308 = v299;
let v309 = 1i;
v299 = (v308+v309);
}
let v310 = v272;
let v311 = 6i;
v272 = (v310+v311);
let v312 = v277;
let v313 = 1i;
v277 = (v312+v313);
}
let v314 = v269;
let v315 = 1i;
v269 = (v314+v315);
}
let v316 = v117;
let v317 = 1i;
v117 = (v316+v317);
}
return v98;
}
fn fn1(v3:i32)->array<f32,72> {
let v4 = read_params(4i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
let v5 = i32(v4);
let v6 = read_params(20i);
let v7 = v3;
let v8 = read_params(26i);
let v9 = read_params(27i);
let v10 = read_params(28i);
let v11 = read_params(29i);
let v12 = v5;
let v13 = v6;
let v14 = v7;
let v15 = v8;
let v16 = v9;
let v17 = v10;
let v18 = v11;
return fn2(v12,v13,v14,v15,v16,v17,v18);
}
fn fn6(v481:f32,v482:f32)->f32 {
let v483 = v481;
let v484 = v482;
if ((v483<v484)) {
return v481;
}
return v482;
}
fn fn7(v511:f32,v512:f32)->f32 {
let v513 = v511;
let v514 = v512;
if ((v513>v514)) {
return v511;
}
return v512;
}
fn fn8(v533:f32,v534:f32,v535:f32)->f32 {
let v536 = v535;
let v537 = v534;
let v538 = v533;
let v539 = fn7(v537,v538);
return fn6(v536,v539);
}
fn fn9(v631:f32,v632:f32,v633:f32,v634:f32,v635:f32,v636:f32)->f32 {
let v637 = 1i;
let v638 = v635;
let v639 = (f32(v637)-v638);
let v640 = 1i;
let v641 = v636;
let v642 = (f32(v640)-v641);
let v643 = (v639*v642);
let v644 = v631;
var v645: f32 = (v643*v644);
let v646 = v645;
let v647 = v635;
let v648 = 1i;
let v649 = v636;
let v650 = (f32(v648)-v649);
let v651 = (v647*v650);
let v652 = v632;
let v653 = (v651*v652);
v645 = (v646+v653);
let v654 = v645;
let v655 = 1i;
let v656 = v635;
let v657 = (f32(v655)-v656);
let v658 = v636;
let v659 = (v657*v658);
let v660 = v633;
let v661 = (v659*v660);
v645 = (v654+v661);
let v662 = v645;
let v663 = v635;
let v664 = v636;
let v665 = (v663*v664);
let v666 = v634;
let v667 = (v665*v666);
v645 = (v662+v667);
return v645;
}
fn fn5(v435:i32,v436:i32,v437:i32,v438:i32,v439:f32,v440:f32,v441:f32,v442:f32,v443:i32)->f32 {
let v444 = v443;
let v445 = v438;
let v446 = v437;
let v447 = (v445*v446);
var v448: i32 = (v444+v447);
let v449 = v448;
let v450 = v435;
let v451 = read_values((v449+v450));
let v452 = v442;
var v453: f32 = (v451*v452);
let v454 = v448;
let v455 = v435;
let v456 = (v454+v455);
let v457 = 1i;
let v458 = read_values((v456+v457));
let v459 = v442;
var v460: f32 = (v458*v459);
let v461 = v453;
let v462 = 0i;
var v465 = (v461>f32(v462));
if (v465) {
let v463 = v460;
let v464 = 0i;
v465 = (v463>f32(v464));
}
if (!(v465)) { vkf_failed = true; }
let v466 = v439;
let v467 = read_values(v448);
let v468 = (v466-v467);
let v469 = v453;
if (v469 == 0.0f) { vkf_failed = true; }
var v470: f32 = (v468/v469);
let v471 = v440;
let v472 = v448;
let v473 = 1i;
let v474 = read_values((v472+v473));
let v475 = (v471-v474);
let v476 = v460;
if (v476 == 0.0f) { vkf_failed = true; }
var v477: f32 = (v475/v476);
var v478: f32 = 0.0f;
let v479 = v453;
let v480 = v460;
var v485: f32 = fn6(v479,v480);
let v486 = v435;
let v487 = 3i;
if ((v486==v487)) {
let v488 = v448;
let v489 = v435;
let v490 = (v488+v489);
let v491 = 2i;
let v492 = read_values((v490+v491));
let v493 = v442;
var v494: f32 = (v492*v493);
let v495 = v494;
let v496 = 0i;
if (!((v495>f32(v496)))) { vkf_failed = true; }
let v497 = v441;
let v498 = v448;
let v499 = 2i;
let v500 = read_values((v498+v499));
let v501 = (v497-v500);
let v502 = v494;
if (v502 == 0.0f) { vkf_failed = true; }
v478 = (v501/v502);
let v503 = v485;
let v504 = v494;
v485 = fn6(v503,v504);
}
let v505 = abs(v470);
let v506 = 1i;
let v507 = (v505-f32(v506));
let v508 = abs(v477);
let v509 = 1i;
let v510 = (v508-f32(v509));
let v515 = fn7(v507,v510);
let v516 = abs(v478);
let v517 = 1i;
let v518 = (v516-f32(v517));
var v519: f32 = fn7(v515,v518);
let v520 = v470;
let v521 = 1i;
let v522 = (v520+f32(v521));
let v523 = v436;
let v524 = 1i;
let v525 = (v523-v524);
let v526 = (v522*f32(v525));
let v527 = 2i;
if (f32(v527) == 0.0f) { vkf_failed = true; }
let v528 = (v526/f32(v527));
let v529 = 0.0f;
let v530 = v436;
let v531 = 1i;
let v532 = (v530-v531);
var v540: f32 = fn8(v528,v529,f32(v532));
let v541 = v477;
let v542 = 1i;
let v543 = (v541+f32(v542));
let v544 = v436;
let v545 = 1i;
let v546 = (v544-v545);
let v547 = (v543*f32(v546));
let v548 = 2i;
if (f32(v548) == 0.0f) { vkf_failed = true; }
let v549 = (v547/f32(v548));
let v550 = 0.0f;
let v551 = v436;
let v552 = 1i;
let v553 = (v551-v552);
var v554: f32 = fn8(v549,v550,f32(v553));
var v555: f32 = 0.0f;
let v556 = v435;
let v557 = 3i;
if ((v556==v557)) {
let v558 = v478;
let v559 = 1i;
let v560 = (v558+f32(v559));
let v561 = v436;
let v562 = 1i;
let v563 = (v561-v562);
let v564 = (v560*f32(v563));
let v565 = 2i;
if (f32(v565) == 0.0f) { vkf_failed = true; }
let v566 = (v564/f32(v565));
let v567 = 0.0f;
let v568 = v436;
let v569 = 1i;
let v570 = (v568-v569);
v555 = fn8(v566,v567,f32(v570));
}
let v571 = v540;
let v572 = 1i;
if (f32(v572) == 0.0f) { vkf_failed = true; }
let v573 = floor(v571/f32(v572));
let v574 = v436;
let v575 = 2i;
let v576 = (v574-v575);
let v577 = fn6(v573,f32(v576));
if (!(abs(v577) < 2147483648.0f)) { vkf_failed = true; }
var v578: i32 = i32(v577);
let v579 = v554;
let v580 = 1i;
if (f32(v580) == 0.0f) { vkf_failed = true; }
let v581 = floor(v579/f32(v580));
let v582 = v436;
let v583 = 2i;
let v584 = (v582-v583);
let v585 = fn6(v581,f32(v584));
if (!(abs(v585) < 2147483648.0f)) { vkf_failed = true; }
var v586: i32 = i32(v585);
let v587 = v555;
let v588 = 1i;
if (f32(v588) == 0.0f) { vkf_failed = true; }
let v589 = floor(v587/f32(v588));
let v590 = v436;
let v591 = 2i;
let v592 = (v590-v591);
let v593 = fn6(v589,f32(v592));
if (!(abs(v593) < 2147483648.0f)) { vkf_failed = true; }
var v594: i32 = i32(v593);
let v595 = v540;
let v596 = v578;
var v597: f32 = (v595-f32(v596));
let v598 = v554;
let v599 = v586;
var v600: f32 = (v598-f32(v599));
let v601 = v555;
let v602 = v594;
var v603: f32 = (v601-f32(v602));
let v604 = v435;
let v605 = 2i;
if ((v604==v605)) {
let v606 = v448;
let v607 = 2i;
let v608 = v435;
let v609 = (v607*v608);
let v610 = (v606+v609);
let v611 = v586;
let v612 = v436;
let v613 = (v611*v612);
let v614 = (v610+v613);
let v615 = v578;
var v616: i32 = (v614+v615);
let v617 = read_values(v616);
let v618 = v616;
let v619 = 1i;
let v620 = read_values((v618+v619));
let v621 = v616;
let v622 = v436;
let v623 = read_values((v621+v622));
let v624 = v616;
let v625 = v436;
let v626 = (v624+v625);
let v627 = 1i;
let v628 = read_values((v626+v627));
let v629 = v597;
let v630 = v600;
var v668: f32 = fn9(v617,v620,v623,v628,v629,v630);
let v669 = v668;
let v670 = v519;
let v671 = 0.0f;
let v672 = fn7(v670,v671);
let v673 = (v669-v672);
let v674 = v485;
return (v673*v674);
}
var v675: i32 = 1i;
let v676 = v435;
let v677 = 3i;
if ((v676==v677)) {
v675 = 2i;
}
var v678: f32 = 0.0f;
var v679: i32 = 0i;
loop {
let v680 = v679;
let v681 = v675;
if (!((v680<v681))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v682: f32 = 1.0f;
let v683 = v435;
let v684 = 3i;
if ((v683==v684)) {
let v685 = 1i;
let v686 = v603;
v682 = (f32(v685)-v686);
let v687 = v679;
let v688 = 1i;
if ((v687==v688)) {
v682 = v603;
}
}
var v689: i32 = 0i;
loop {
let v690 = v689;
let v691 = 2i;
if (!((v690<v691))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v692 = 1i;
let v693 = v600;
var v694: f32 = (f32(v692)-v693);
let v695 = v689;
let v696 = 1i;
if ((v695==v696)) {
v694 = v600;
}
var v697: i32 = 0i;
loop {
let v698 = v697;
let v699 = 2i;
if (!((v698<v699))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v700 = 1i;
let v701 = v597;
var v702: f32 = (f32(v700)-v701);
let v703 = v697;
let v704 = 1i;
if ((v703==v704)) {
v702 = v597;
}
let v705 = v594;
let v706 = v679;
let v707 = (v705+v706);
let v708 = v436;
let v709 = (v707*v708);
let v710 = v436;
let v711 = (v709*v710);
let v712 = v586;
let v713 = v689;
let v714 = (v712+v713);
let v715 = v436;
let v716 = (v714*v715);
let v717 = (v711+v716);
let v718 = v578;
let v719 = (v717+v718);
let v720 = v697;
var v721: i32 = (v719+v720);
let v722 = v678;
let v723 = v702;
let v724 = v694;
let v725 = (v723*v724);
let v726 = v682;
let v727 = (v725*v726);
let v728 = v448;
let v729 = 2i;
let v730 = v435;
let v731 = (v729*v730);
let v732 = (v728+v731);
let v733 = v721;
let v734 = read_values((v732+v733));
let v735 = (v727*v734);
v678 = (v722+v735);
let v736 = v697;
let v737 = 1i;
v697 = (v736+v737);
}
let v738 = v689;
let v739 = 1i;
v689 = (v738+v739);
}
let v740 = v679;
let v741 = 1i;
v679 = (v740+v741);
}
let v742 = v678;
let v743 = v519;
let v744 = 0.0f;
let v745 = fn7(v743,v744);
let v746 = (v742-v745);
let v747 = v485;
return (v746*v747);
}
fn fn4(v395:i32,v396:i32,v397:i32,v398:i32,v399:f32,v400:f32,v401:f32,v402:f32,v403:i32)->i32 {
let v404 = v398;
let v405 = 0i;
var v408 = (v404>v405);
if (v408) {
let v406 = v403;
let v407 = 0i;
v408 = (v406>=v407);
}
var v415 = v408;
if (v415) {
let v409 = i32(arrayLength(&values));
let v410 = v403;
let v411 = v398;
let v412 = v397;
let v413 = (v411*v412);
let v414 = (v410+v413);
v415 = (v409>=v414);
}
if (!(v415)) { vkf_failed = true; }
var v416: i32 = 0i;
let v417 = v395;
let v418 = v396;
let v419 = v397;
let v420 = 0i;
let v421 = v399;
let v422 = v400;
let v423 = v401;
let v424 = v402;
let v425 = v403;
let v426 = v417;
let v427 = v418;
let v428 = v419;
let v429 = v420;
let v430 = v421;
let v431 = v422;
let v432 = v423;
let v433 = v424;
let v434 = v425;
var v748: f32 = fn5(v426,v427,v428,v429,v430,v431,v432,v433,v434);
var v749: i32 = 1i;
loop {
let v750 = v749;
let v751 = v398;
if (!((v750<v751))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v752 = v395;
let v753 = v396;
let v754 = v397;
let v755 = v749;
let v756 = v399;
let v757 = v400;
let v758 = v401;
let v759 = v402;
let v760 = v403;
var v761: f32 = fn5(v752,v753,v754,v755,v756,v757,v758,v759,v760);
let v762 = v761;
let v763 = v748;
if ((v762>=v763)) {
v416 = v749;
v748 = v761;
}
let v764 = v749;
let v765 = 1i;
v749 = (v764+v765);
}
return v416;
}
fn fn0(v1:i32)->array<f32,72> {
let v2 = v1;
var v318: array<f32,72> = fn1(v2);
let v319 = read_params(0i);
if (!(abs(v319) < 2147483648.0f)) { vkf_failed = true; }
var v320: i32 = i32(v319);
let v321 = read_params(1i);
if (!(abs(v321) < 2147483648.0f)) { vkf_failed = true; }
var v322: i32 = i32(v321);
let v323 = read_params(2i);
if (!(abs(v323) < 2147483648.0f)) { vkf_failed = true; }
var v324: i32 = i32(v323);
let v325 = read_params(3i);
if (!(abs(v325) < 2147483648.0f)) { vkf_failed = true; }
var v326: i32 = i32(v325);
let v327 = read_params(4i);
if (!(abs(v327) < 2147483648.0f)) { vkf_failed = true; }
var v328: i32 = i32(v327);
let v329 = v328;
let v330 = v328;
var v331: i32 = (v329*v330);
let v332 = 2i;
let v333 = v320;
let v334 = (v332*v333);
let v335 = v322;
let v336 = v322;
let v337 = (v335*v336);
var v338: i32 = (v334+v337);
let v339 = v324;
let v340 = v338;
let v341 = 4i;
let v342 = (v340+v341);
var v343: bool = (v339==v342);
var v344: i32 = 0i;
loop {
let v345 = v344;
let v346 = 12i;
if (!((v345<v346))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
var v354 = v343;
if (v354) {
let v347 = v344;
let v348 = 6i;
let v349 = (v347*v348);
let v350 = 5i;
let v351 = (v349+v350);
if (v351<0i || v351>=72i) { vkf_failed=true; }
let v352 = v318[u32(clamp(v351,0i,72i-1i))];
let v353 = 0i;
v354 = (v352>f32(v353));
}
if (v354) {
let v355 = 2i;
let v356 = v344;
let v357 = 6i;
let v358 = (v356*v357);
if (v358<0i || v358>=72i) { vkf_failed=true; }
let v359 = v318[u32(clamp(v358,0i,72i-1i))];
let v360 = (f32(v355)*v359);
let v361 = read_params(20i);
if (v361 == 0.0f) { vkf_failed = true; }
let v362 = (v360/v361);
let v363 = 1i;
var v364: f32 = (v362-f32(v363));
let v365 = 2i;
let v366 = v344;
let v367 = 6i;
let v368 = (v366*v367);
let v369 = 1i;
let v370 = (v368+v369);
if (v370<0i || v370>=72i) { vkf_failed=true; }
let v371 = v318[u32(clamp(v370,0i,72i-1i))];
let v372 = (f32(v365)*v371);
let v373 = read_params(20i);
if (v373 == 0.0f) { vkf_failed = true; }
let v374 = (v372/v373);
let v375 = 1i;
var v376: f32 = (v374-f32(v375));
let v377 = v320;
let v378 = v322;
let v379 = v324;
let v380 = v326;
let v381 = v364;
let v382 = v376;
let v383 = 0i;
let v384 = read_params(11i);
let v385 = v331;
let v386 = v377;
let v387 = v378;
let v388 = v379;
let v389 = v380;
let v390 = v381;
let v391 = v382;
let v392 = v383;
let v393 = v384;
let v394 = v385;
var v766: i32 = fn4(v386,v387,v388,v389,v390,v391,f32(v392),v393,v394);
let v767 = v331;
let v768 = v766;
let v769 = v324;
let v770 = (v768*v769);
let v771 = (v767+v770);
let v772 = v338;
var v773: i32 = (v771+v772);
var v774: i32 = 0i;
loop {
let v775 = v774;
let v776 = 4i;
if (!((v775<v776))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v777 = v344;
let v778 = 6i;
let v779 = (v777*v778);
let v780 = 2i;
let v781 = (v779+v780);
let v782 = v774;
let v783 = (v781+v782);
let v784 = v773;
let v785 = v774;
if (v783<0i || v783>=72i) { vkf_failed=true; } else { v318[u32(v783)]=read_values((v784+v785)); }
let v786 = v774;
let v787 = 1i;
v774 = (v786+v787);
}
}
let v788 = v344;
let v789 = 6i;
let v790 = (v788*v789);
let v791 = v344;
let v792 = 6i;
let v793 = (v791*v792);
if (v793<0i || v793>=72i) { vkf_failed=true; }
let v794 = v318[u32(clamp(v793,0i,72i-1i))];
let v795 = read_params(34i);
if (v790<0i || v790>=72i) { vkf_failed=true; } else { v318[u32(v790)]=(v794+v795); }
let v796 = v344;
let v797 = 6i;
let v798 = (v796*v797);
let v799 = 1i;
let v800 = (v798+v799);
let v801 = v344;
let v802 = 6i;
let v803 = (v801*v802);
let v804 = 1i;
let v805 = (v803+v804);
if (v805<0i || v805>=72i) { vkf_failed=true; }
let v806 = v318[u32(clamp(v805,0i,72i-1i))];
let v807 = read_params(35i);
if (v800<0i || v800>=72i) { vkf_failed=true; } else { v318[u32(v800)]=(v806+v807); }
let v808 = v344;
let v809 = 1i;
v344 = (v808+v809);
}
return v318;
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/72u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<72u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<72u;i+=1u){results[gid.x*72u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/72u)],1u);}
}
