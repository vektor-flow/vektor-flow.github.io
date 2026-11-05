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
fn fn3(v137:f32,v138:f32,v139:f32)->f32 {
let v140 = v137;
let v141 = v138;
if ((v140<v141)) {
return v138;
}
let v142 = v137;
let v143 = v139;
if ((v142>v143)) {
return v139;
}
return v137;
}
fn fn4(v189:f32,v190:f32,v191:f32,v192:f32,v193:f32,v194:f32)->f32 {
let v195 = 1i;
let v196 = v194;
var v197: f32 = (f32(v195)-v196);
let v198 = v197;
let v199 = v189;
let v200 = (v198*v199);
let v201 = v194;
let v202 = v190;
let v203 = (v201*v202);
let v204 = (v200+v203);
let v205 = v197;
let v206 = 3i;
let v207 = vkf_powi(v205,v206);
let v208 = v197;
let v209 = (v207-v208);
let v210 = v191;
let v211 = (v209*v210);
let v212 = v194;
let v213 = 3i;
let v214 = vkf_powi(v212,v213);
let v215 = v194;
let v216 = (v214-v215);
let v217 = v192;
let v218 = (v216*v217);
let v219 = (v211+v218);
let v220 = v193;
let v221 = (v219*v220);
let v222 = v193;
let v223 = (v221*v222);
let v224 = 6i;
if (f32(v224) == 0.0f) { vkf_failed = true; }
let v225 = (v223/f32(v224));
return (v204+v225);
}
fn fn5(v327:i32,v328:f32,v329:i32)->f32 {
let v330 = v328;
let v331 = 0.0f;
let v332 = 1.0f;
let v333 = fn3(v330,v331,v332);
let v334 = 32i;
var v335: f32 = (v333*f32(v334));
var v336: i32 = 0i;
var v337: i32 = 16i;
loop {
let v338 = v337;
let v339 = 0i;
if (!((v338>v339))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v340 = v336;
let v341 = v337;
var v342: i32 = (v340+v341);
let v343 = v342;
let v344 = 32i;
var v348 = (v343<v344);
if (v348) {
let v345 = v342;
let v346 = f32(v345);
let v347 = v335;
v348 = (v346<=v347);
}
if (v348) {
v336 = v342;
}
let v349 = v337;
let v350 = 2i;
if (f32(v350) == 0.0f) { vkf_failed = true; }
v337 = i32(floor(f32(v349)/f32(v350)));
}
let v351 = v327;
let v352 = 2i;
let v353 = v336;
let v354 = (v352*v353);
let v355 = (v351+v354);
let v356 = v329;
let v357 = read_values((v355+v356));
let v358 = v327;
let v359 = 2i;
let v360 = v336;
let v361 = (v359*v360);
let v362 = (v358+v361);
let v363 = 2i;
let v364 = (v362+v363);
let v365 = v329;
let v366 = read_values((v364+v365));
let v367 = 0.0f;
let v368 = 0.0f;
let v369 = 1.0f;
let v370 = v335;
let v371 = v336;
let v372 = f32(v371);
let v373 = (v370-v372);
return fn4(v357,v366,v367,v368,v369,v373);
}
fn fn2(v99:i32,v100:i32,v101:f32)->array<f32,16> {
let v102 = read_params(10i);
if (!(abs(v102) < 2147483648.0f)) { vkf_failed = true; }
var v103: i32 = i32(v102);
let v104 = i32(arrayLength(&params));
let v105 = 26i;
var v106: bool = (v104>=v105);
var v107: i32 = 7i;
if (v106) {
v107 = 13i;
}
let v108 = v107;
let v109 = v99;
var v110: i32 = (v108*v109);
let v111 = v107;
let v112 = v103;
let v113 = (v111*v112);
let v114 = 7i;
let v115 = v99;
let v116 = (v114*v115);
var v117: i32 = (v113+v116);
var v118: f32 = read_params(1i);
var v119: f32 = 0.0f;
var v120: f32 = 0.0f;
if (v106) {
let v121 = v110;
let v122 = 11i;
v119 = read_values((v121+v122));
let v123 = v110;
let v124 = 12i;
v120 = read_values((v123+v124));
let v125 = v119;
let v126 = 1i;
if ((v125==f32(v126))) {
v118 = f32(1i);
}
}
let v127 = 1.5f;
let v128 = read_params(6i);
var v129: f32 = (v127*v128);
let v130 = read_params(9i);
let v131 = v101;
let v132 = (v130-v131);
let v133 = read_params(6i);
if (v133 == 0.0f) { vkf_failed = true; }
let v134 = (v132/v133);
let v135 = 0.0f;
let v136 = 1.0f;
var v144: f32 = fn3(v134,v135,v136);
let v145 = read_params(9i);
let v146 = v101;
let v147 = (v145-v146);
let v148 = v129;
let v149 = (v147+v148);
let v150 = v129;
if (v150 == 0.0f) { vkf_failed = true; }
let v151 = (v149/v150);
let v152 = 0.0f;
let v153 = 1.0f;
var v154: f32 = fn3(v151,v152,v153);
let v155 = read_params(0i);
let v156 = 0i;
if ((v155==f32(v156))) {
v144 = f32(0i);
v154 = f32(0i);
}
let v157 = read_params(0i);
let v158 = 1i;
if ((v157==f32(v158))) {
v144 = f32(1i);
v154 = f32(1i);
}
let v159 = i32(arrayLength(&params));
let v160 = 21i;
var v163 = (v159>=v160);
if (v163) {
let v161 = read_params(20i);
let v162 = 1i;
v163 = (v161==f32(v162));
}
if (v163) {
v144 = f32(1i);
v154 = f32(1i);
}
var v166 = v106;
if (v166) {
let v164 = read_params(21i);
let v165 = 1i;
v166 = (v164==f32(v165));
}
if (v166) {
v144 = f32(0i);
v154 = f32(0i);
}
let v167 = f32(0i);
let v168 = f32(0i);
let v169 = f32(0i);
let v170 = f32(0i);
let v171 = f32(0i);
let v172 = f32(0i);
let v173 = f32(0i);
var v174: array<f32,7> = array<f32,7>(v167,v168,v169,v170,v171,v172,v173);
var v175: i32 = 0i;
loop {
let v176 = v175;
let v177 = 7i;
if (!((v176<v177))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v178 = v175;
let v179 = v110;
let v180 = v175;
let v181 = read_values((v179+v180));
let v182 = v117;
let v183 = v175;
let v184 = read_values((v182+v183));
let v185 = 0.0f;
let v186 = 0.0f;
let v187 = 1.0f;
let v188 = v154;
if (v178<0i || v178>=7i) { vkf_failed=true; } else { v174[u32(v178)]=fn4(v181,v184,v185,v186,v187,v188); }
let v226 = v175;
let v227 = 1i;
v175 = (v226+v227);
}
var v228: f32 = read_params(5i);
let v229 = 5i;
if (v229<0i || v229>=7i) { vkf_failed=true; }
let v230 = v174[u32(clamp(v229,0i,7i-1i))];
let v231 = v228;
let v232 = (v230*v231);
let v233 = v228;
var v234: f32 = (v232*v233);
var v235: f32 = 0.0f;
var v236: f32 = 0.0f;
let v237 = 1i;
let v238 = v103;
let v239 = f32(v238);
if (v239 == 0.0f) { vkf_failed = true; }
var v240: f32 = (f32(v237)/v239);
var v241: f32 = v120;
if (v106) {
let v242 = v110;
let v243 = 6i;
let v244 = read_values((v242+v243));
let v245 = 2i;
var v246: f32 = vkf_powi(v244,v245);
let v247 = v117;
let v248 = 6i;
let v249 = read_values((v247+v248));
let v250 = 2i;
var v251: f32 = vkf_powi(v249,v250);
let v252 = v246;
let v253 = v251;
let v254 = 0.0f;
let v255 = 0.0f;
let v256 = 1.0f;
let v257 = v154;
var v258: f32 = fn4(v252,v253,v254,v255,v256,v257);
let v259 = v110;
let v260 = 7i;
let v261 = read_values((v259+v260));
let v262 = v117;
let v263 = 5i;
let v264 = read_values((v262+v263));
let v265 = v251;
let v266 = (v264*v265);
let v267 = 0.0f;
let v268 = 0.0f;
let v269 = 1.0f;
let v270 = v154;
v234 = fn4(v261,v266,v267,v268,v269,v270);
let v271 = v258;
if (v271 < 0.0f) { vkf_failed = true; }
v228 = sqrt(v271);
let v272 = 5i;
let v273 = v234;
let v274 = v258;
if (v274 == 0.0f) { vkf_failed = true; }
let v275 = (v273/v274);
let v276 = 0.0f;
let v277 = 1.0f;
if (v272<0i || v272>=7i) { vkf_failed=true; } else { v174[u32(v272)]=fn3(v275,v276,v277); }
let v278 = v110;
let v279 = 8i;
let v280 = read_values((v278+v279));
let v281 = read_params(18i);
let v282 = v103;
let v283 = f32(v282);
if (v283 == 0.0f) { vkf_failed = true; }
let v284 = (v281/v283);
let v285 = 0.0f;
let v286 = 0.0f;
let v287 = 1.0f;
let v288 = v154;
v235 = fn4(v280,v284,v285,v286,v287,v288);
let v289 = v110;
let v290 = 9i;
let v291 = read_values((v289+v290));
let v292 = read_params(19i);
let v293 = v103;
let v294 = f32(v293);
if (v294 == 0.0f) { vkf_failed = true; }
let v295 = (v292/v294);
let v296 = 0.0f;
let v297 = 0.0f;
let v298 = 1.0f;
let v299 = v154;
v236 = fn4(v291,v295,v296,v297,v298,v299);
let v300 = v110;
let v301 = 10i;
v240 = read_values((v300+v301));
let v302 = v120;
let v303 = 0.5f;
let v304 = read_params(15i);
let v305 = (v303*v304);
let v306 = (v302+v305);
let v307 = 0.0f;
let v308 = 1.0f;
v241 = fn3(v306,v307,v308);
let v309 = 20i;
let v310 = v103;
let v311 = (v309*v310);
let v312 = 7i;
let v313 = read_params(11i);
if (!(abs(v313) < 2147483648.0f)) { vkf_failed = true; }
let v314 = i32(v313);
let v315 = (v312*v314);
let v316 = (v311+v315);
let v317 = 66i;
let v318 = v99;
let v319 = (v317*v318);
var v320: i32 = (v316+v319);
let v321 = v320;
let v322 = v241;
let v323 = 0i;
let v324 = v321;
let v325 = v322;
let v326 = v323;
let v374 = fn5(v324,v325,v326);
let v375 = v320;
let v376 = v120;
let v377 = 0i;
let v378 = v375;
let v379 = v376;
let v380 = v377;
let v381 = fn5(v378,v379,v380);
var v382: f32 = (v374-v381);
let v383 = v320;
let v384 = v241;
let v385 = 1i;
let v386 = v383;
let v387 = v384;
let v388 = v385;
let v389 = fn5(v386,v387,v388);
let v390 = v320;
let v391 = v120;
let v392 = 1i;
let v393 = v390;
let v394 = v391;
let v395 = v392;
let v396 = fn5(v393,v394,v395);
var v397: f32 = (v389-v396);
let v398 = v118;
let v399 = 1i;
let v400 = v154;
let v401 = (f32(v399)-v400);
let v402 = (v398*v401);
let v403 = read_params(2i);
var v404: f32 = (v402*v403);
var v405: f32 = 1.0f;
let v406 = v119;
let v407 = 1i;
if ((v406==f32(v407))) {
v405 = read_params(15i);
}
let v408 = 0i;
let v409 = 0i;
if (v409<0i || v409>=7i) { vkf_failed=true; }
let v410 = v174[u32(clamp(v409,0i,7i-1i))];
let v411 = 0.200000003f;
let v412 = read_params(3i);
let v413 = (v411*v412);
let v414 = v404;
let v415 = (v413*v414);
let v416 = v382;
let v417 = (v415*v416);
if (v408<0i || v408>=7i) { vkf_failed=true; } else { v174[u32(v408)]=(v410+v417); }
let v418 = 1i;
let v419 = 1i;
if (v419<0i || v419>=7i) { vkf_failed=true; }
let v420 = v174[u32(clamp(v419,0i,7i-1i))];
let v421 = read_params(4i);
let v422 = v404;
let v423 = (v421*v422);
let v424 = 0.140000001f;
let v425 = v397;
let v426 = (v424*v425);
let v427 = 0.150000006f;
let v428 = v405;
let v429 = (v427*v428);
let v430 = (v426+v429);
let v431 = (v423*v430);
if (v418<0i || v418>=7i) { vkf_failed=true; } else { v174[u32(v418)]=(v420+v431); }
}
let v432 = 0i;
if (v432<0i || v432>=7i) { vkf_failed=true; }
let v433 = v174[u32(clamp(v432,0i,7i-1i))];
let v434 = 1i;
if (v434<0i || v434>=7i) { vkf_failed=true; }
let v435 = v174[u32(clamp(v434,0i,7i-1i))];
let v436 = 5i;
if (v436<0i || v436>=7i) { vkf_failed=true; }
let v437 = v174[u32(clamp(v436,0i,7i-1i))];
let v438 = v118;
let v439 = (v437*v438);
let v440 = 1i;
let v441 = v144;
let v442 = (f32(v440)-v441);
let v443 = (v439*v442);
let v444 = v228;
let v445 = 2i;
if (v445<0i || v445>=7i) { vkf_failed=true; }
let v446 = v174[u32(clamp(v445,0i,7i-1i))];
let v447 = 3i;
if (v447<0i || v447>=7i) { vkf_failed=true; }
let v448 = v174[u32(clamp(v447,0i,7i-1i))];
let v449 = 4i;
if (v449<0i || v449>=7i) { vkf_failed=true; }
let v450 = v174[u32(clamp(v449,0i,7i-1i))];
let v451 = v240;
let v452 = v144;
let v453 = v100;
let v454 = f32(v453);
let v455 = 5i;
if (v455<0i || v455>=7i) { vkf_failed=true; }
let v456 = v174[u32(clamp(v455,0i,7i-1i))];
let v457 = v234;
let v458 = v235;
let v459 = v236;
let v460 = v118;
let v461 = v241;
return array<f32,16>(v433,v435,v443,v444,v446,v448,v450,v451,v452,v454,v456,v457,v458,v459,v460,v461);
}
fn fn1(v3:i32)->array<f32,16> {
let v4 = read_params(10i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = read_params(11i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = v3;
let v9 = 0i;
var v12 = (v8>=v9);
if (v12) {
let v10 = v3;
let v11 = v5;
v12 = (v10<v11);
}
var v15 = v12;
if (v15) {
let v13 = v5;
let v14 = 131072i;
v15 = (v13<=v14);
}
var v18 = v15;
if (v18) {
let v16 = v7;
let v17 = 0i;
v18 = (v16>v17);
}
var v21 = v18;
if (v21) {
let v19 = v7;
let v20 = 4096i;
v21 = (v19<=v20);
}
var v30 = v21;
if (v30) {
let v22 = i32(arrayLength(&values));
let v23 = 86i;
let v24 = v5;
let v25 = (v23*v24);
let v26 = 7i;
let v27 = v7;
let v28 = (v26*v27);
let v29 = (v25+v28);
v30 = (v22==v29);
}
if (!(v30)) { vkf_failed = true; }
let v31 = 13i;
let v32 = v5;
let v33 = (v31*v32);
let v34 = 7i;
let v35 = v3;
let v36 = (v34*v35);
var v37: f32 = read_values((v33+v36));
let v38 = 13i;
let v39 = v5;
let v40 = (v38*v39);
let v41 = 7i;
let v42 = v3;
let v43 = (v41*v42);
let v44 = (v40+v43);
let v45 = 1i;
var v46: f32 = read_values((v44+v45));
var v47: i32 = 0i;
let v48 = 10i;
let v49 = 20i;
var v50: f32 = vkf_powi(f32(v48),v49);
var v51: i32 = 0i;
loop {
let v52 = v51;
let v53 = v7;
if (!((v52<v53))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v54 = v37;
let v55 = 20i;
let v56 = v5;
let v57 = (v55*v56);
let v58 = 7i;
let v59 = v51;
let v60 = (v58*v59);
let v61 = read_values((v57+v60));
var v62: f32 = (v54-v61);
let v63 = v46;
let v64 = 20i;
let v65 = v5;
let v66 = (v64*v65);
let v67 = 7i;
let v68 = v51;
let v69 = (v67*v68);
let v70 = (v66+v69);
let v71 = 1i;
let v72 = read_values((v70+v71));
var v73: f32 = (v63-v72);
let v74 = v62;
let v75 = v62;
let v76 = (v74*v75);
let v77 = v73;
let v78 = v73;
let v79 = (v77*v78);
var v80: f32 = (v76+v79);
let v81 = v80;
let v82 = v50;
if ((v81<v82)) {
v47 = v51;
v50 = v80;
}
let v83 = v51;
let v84 = 1i;
v51 = (v83+v84);
}
let v85 = v3;
let v86 = v47;
let v87 = 20i;
let v88 = v5;
let v89 = (v87*v88);
let v90 = 7i;
let v91 = v47;
let v92 = (v90*v91);
let v93 = (v89+v92);
let v94 = 2i;
let v95 = read_values((v93+v94));
let v96 = v85;
let v97 = v86;
let v98 = v95;
return fn2(v96,v97,v98);
}
fn fn0(v1:i32)->array<f32,16> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/16u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<16u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<16u;i+=1u){results[gid.x*16u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/16u)],1u);}
}
