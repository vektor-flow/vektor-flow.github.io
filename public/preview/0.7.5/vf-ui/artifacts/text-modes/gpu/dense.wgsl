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
fn fn3(v117:f32,v118:f32,v119:f32)->f32 {
let v120 = v117;
let v121 = v118;
if ((v120<v121)) {
return v118;
}
let v122 = v117;
let v123 = v119;
if ((v122>v123)) {
return v119;
}
return v117;
}
fn fn4(v191:f32,v192:f32,v193:f32,v194:f32,v195:f32,v196:f32)->f32 {
let v197 = 1i;
let v198 = v196;
var v199: f32 = (f32(v197)-v198);
let v200 = v199;
let v201 = v191;
let v202 = (v200*v201);
let v203 = v196;
let v204 = v192;
let v205 = (v203*v204);
let v206 = (v202+v205);
let v207 = v199;
let v208 = 3i;
let v209 = vkf_powi(v207,v208);
let v210 = v199;
let v211 = (v209-v210);
let v212 = v193;
let v213 = (v211*v212);
let v214 = v196;
let v215 = 3i;
let v216 = vkf_powi(v214,v215);
let v217 = v196;
let v218 = (v216-v217);
let v219 = v194;
let v220 = (v218*v219);
let v221 = (v213+v220);
let v222 = v195;
let v223 = (v221*v222);
let v224 = v195;
let v225 = (v223*v224);
let v226 = 6i;
if (f32(v226) == 0.0f) { vkf_failed = true; }
let v227 = (v225/f32(v226));
return (v206+v227);
}
fn fn2(v99:i32,v100:i32,v101:f32)->array<f32,11> {
var v102: f32 = read_params(0i);
var v103: f32 = read_params(1i);
let v104 = read_params(10i);
if (!(abs(v104) < 2147483648.0f)) { vkf_failed = true; }
var v105: i32 = i32(v104);
var v106: f32 = read_params(6i);
let v107 = 1.5f;
let v108 = v106;
var v109: f32 = (v107*v108);
let v110 = read_params(9i);
let v111 = v101;
let v112 = (v110-v111);
let v113 = v106;
if (v113 == 0.0f) { vkf_failed = true; }
let v114 = (v112/v113);
let v115 = 0.0f;
let v116 = 1.0f;
var v124: f32 = fn3(v114,v115,v116);
let v125 = read_params(9i);
let v126 = v101;
let v127 = (v125-v126);
let v128 = v109;
let v129 = (v127+v128);
let v130 = v109;
if (v130 == 0.0f) { vkf_failed = true; }
let v131 = (v129/v130);
let v132 = 0.0f;
let v133 = 1.0f;
var v134: f32 = fn3(v131,v132,v133);
let v135 = v102;
let v136 = 0i;
if ((v135==f32(v136))) {
v124 = f32(0i);
v134 = f32(0i);
}
let v137 = v102;
let v138 = 1i;
if ((v137==f32(v138))) {
v124 = f32(1i);
v134 = f32(1i);
}
let v139 = f32(0i);
let v140 = f32(0i);
let v141 = f32(0i);
let v142 = f32(0i);
let v143 = f32(0i);
let v144 = f32(0i);
let v145 = f32(0i);
var v146: array<f32,7> = array<f32,7>(v139,v140,v141,v142,v143,v144,v145);
var v147: i32 = 0i;
loop {
let v148 = v147;
let v149 = 7i;
if (!((v148<v149))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v150 = 7i;
let v151 = v99;
let v152 = (v150*v151);
let v153 = v147;
var v154: f32 = read_values((v152+v153));
let v155 = 7i;
let v156 = v105;
let v157 = (v155*v156);
let v158 = 7i;
let v159 = v99;
let v160 = (v158*v159);
let v161 = (v157+v160);
let v162 = v147;
var v163: f32 = read_values((v161+v162));
let v164 = read_params(12i);
let v165 = 1i;
var v168 = (v164==f32(v165));
if (v168) {
let v166 = v147;
let v167 = 1i;
v168 = (v166==v167);
}
if (v168) {
let v169 = v154;
let v170 = 0.0799999982f;
let v171 = read_params(4i);
let v172 = (v170*v171);
v154 = (v169-v172);
}
let v173 = read_params(12i);
let v174 = 2i;
var v177 = (v173==f32(v174));
if (v177) {
let v175 = v147;
let v176 = 1i;
v177 = (v175==v176);
}
if (v177) {
let v178 = v163;
let v179 = 0.349999994f;
let v180 = (v178+v179);
let v181 = 0.100000001f;
let v182 = read_params(4i);
let v183 = (v181*v182);
v163 = (v180+v183);
}
let v184 = v147;
let v185 = v154;
let v186 = v163;
let v187 = 0.0f;
let v188 = 0.0f;
let v189 = 1.0f;
let v190 = v134;
if (v184<0i || v184>=7i) { vkf_failed=true; } else { v146[u32(v184)]=fn4(v185,v186,v187,v188,v189,v190); }
let v228 = v147;
let v229 = 1i;
v147 = (v228+v229);
}
let v230 = v103;
let v231 = 1i;
let v232 = v134;
let v233 = (f32(v231)-v232);
let v234 = (v230*v233);
let v235 = read_params(2i);
var v236: f32 = (v234*v235);
let v237 = 8i;
let v238 = 7i;
let v239 = v99;
let v240 = read_values((v238*v239));
let v241 = 7i;
let v242 = v99;
let v243 = (v241*v242);
let v244 = 1i;
let v245 = read_values((v243+v244));
let v246 = (v240+v245);
let v247 = (f32(v237)*v246);
let v248 = 6i;
let v249 = v102;
let v250 = (f32(v248)*v249);
var v251: f32 = (v247+v250);
let v252 = read_params(12i);
let v253 = 1i;
if ((v252==f32(v253))) {
let v254 = v251;
let v255 = 8i;
let v256 = 0.0799999982f;
let v257 = (f32(v255)*v256);
let v258 = read_params(4i);
let v259 = (v257*v258);
v251 = (v254-v259);
}
let v260 = 0i;
let v261 = 0i;
if (v261<0i || v261>=7i) { vkf_failed=true; }
let v262 = v146[u32(clamp(v261,0i,7i-1i))];
let v263 = 0.150000006f;
let v264 = read_params(3i);
let v265 = (v263*v264);
let v266 = v236;
let v267 = (v265*v266);
let v268 = 0.800000012f;
let v269 = v251;
let v270 = sin(v269);
let v271 = (v268*v270);
let v272 = 0.119999997f;
let v273 = read_params(7i);
let v274 = (v272*v273);
let v275 = (v271+v274);
let v276 = (v267*v275);
if (v260<0i || v260>=7i) { vkf_failed=true; } else { v146[u32(v260)]=(v262+v276); }
let v277 = 1i;
let v278 = 1i;
if (v278<0i || v278>=7i) { vkf_failed=true; }
let v279 = v146[u32(clamp(v278,0i,7i-1i))];
let v280 = 0.150000006f;
let v281 = read_params(4i);
let v282 = (v280*v281);
let v283 = v236;
let v284 = (v282*v283);
let v285 = 1i;
let v286 = 0.200000003f;
let v287 = v251;
let v288 = cos(v287);
let v289 = (v286*v288);
let v290 = (f32(v285)+v289);
let v291 = 0.0799999982f;
let v292 = read_params(8i);
let v293 = (v291*v292);
let v294 = (v290+v293);
let v295 = (v284*v294);
if (v277<0i || v277>=7i) { vkf_failed=true; } else { v146[u32(v277)]=(v279+v295); }
let v296 = 7i;
let v297 = v99;
var v298: f32 = read_values((v296*v297));
let v299 = 7i;
let v300 = v99;
let v301 = (v299*v300);
let v302 = 1i;
var v303: f32 = read_values((v301+v302));
let v304 = read_params(12i);
let v305 = 1i;
if ((v304==f32(v305))) {
let v306 = v303;
let v307 = 0.0799999982f;
let v308 = read_params(4i);
let v309 = (v307*v308);
v303 = (v306-v309);
}
let v310 = 64i;
let v311 = v298;
let v312 = (f32(v310)*v311);
let v313 = 37i;
let v314 = v303;
let v315 = (f32(v313)*v314);
let v316 = (v312+v315);
let v317 = 3i;
let v318 = v102;
let v319 = (f32(v317)*v318);
let v320 = (v316+v319);
let v321 = 0.200000003f;
let v322 = read_params(7i);
let v323 = (v321*v322);
var v324: f32 = (v320+v323);
let v325 = 512i;
let v326 = v298;
let v327 = (f32(v325)*v326);
let v328 = 383i;
let v329 = v303;
let v330 = (f32(v328)*v329);
let v331 = (v327-v330);
let v332 = 4i;
let v333 = v102;
let v334 = (f32(v332)*v333);
let v335 = (v331-v334);
let v336 = 0.200000003f;
let v337 = read_params(8i);
let v338 = (v336*v337);
var v339: f32 = (v335+v338);
let v340 = 0i;
let v341 = 0i;
if (v341<0i || v341>=7i) { vkf_failed=true; }
let v342 = v146[u32(clamp(v341,0i,7i-1i))];
let v343 = read_params(3i);
let v344 = v236;
let v345 = (v343*v344);
let v346 = 0.0599999987f;
let v347 = v324;
let v348 = sin(v347);
let v349 = (v346*v348);
let v350 = 0.0250000004f;
let v351 = v339;
let v352 = sin(v351);
let v353 = (v350*v352);
let v354 = (v349+v353);
let v355 = (v345*v354);
if (v340<0i || v340>=7i) { vkf_failed=true; } else { v146[u32(v340)]=(v342+v355); }
let v356 = 1i;
let v357 = 1i;
if (v357<0i || v357>=7i) { vkf_failed=true; }
let v358 = v146[u32(clamp(v357,0i,7i-1i))];
let v359 = read_params(4i);
let v360 = v236;
let v361 = (v359*v360);
let v362 = 0.0350000001f;
let v363 = v324;
let v364 = cos(v363);
let v365 = (v362*v364);
let v366 = 0.0120000001f;
let v367 = v339;
let v368 = cos(v367);
let v369 = (v366*v368);
let v370 = (v365+v369);
let v371 = (v361*v370);
if (v356<0i || v356>=7i) { vkf_failed=true; } else { v146[u32(v356)]=(v358+v371); }
var v372: f32 = read_params(5i);
let v373 = read_params(13i);
let v374 = 1i;
if ((v373==f32(v374))) {
let v375 = 6i;
if (v375<0i || v375>=7i) { vkf_failed=true; }
v372 = v146[u32(clamp(v375,0i,7i-1i))];
}
let v376 = v102;
let v377 = 1i;
if ((v376==f32(v377))) {
let v378 = 0i;
let v379 = 7i;
let v380 = v105;
let v381 = (v379*v380);
let v382 = 7i;
let v383 = v99;
let v384 = (v382*v383);
if (v378<0i || v378>=7i) { vkf_failed=true; } else { v146[u32(v378)]=read_values((v381+v384)); }
let v385 = 1i;
let v386 = 7i;
let v387 = v105;
let v388 = (v386*v387);
let v389 = 7i;
let v390 = v99;
let v391 = (v389*v390);
let v392 = (v388+v391);
let v393 = 1i;
if (v385<0i || v385>=7i) { vkf_failed=true; } else { v146[u32(v385)]=read_values((v392+v393)); }
let v394 = read_params(12i);
let v395 = 2i;
if ((v394==f32(v395))) {
let v396 = 1i;
let v397 = 1i;
if (v397<0i || v397>=7i) { vkf_failed=true; }
let v398 = v146[u32(clamp(v397,0i,7i-1i))];
let v399 = 0.349999994f;
let v400 = (v398+v399);
let v401 = 0.100000001f;
let v402 = read_params(4i);
let v403 = (v401*v402);
if (v396<0i || v396>=7i) { vkf_failed=true; } else { v146[u32(v396)]=(v400+v403); }
}
}
let v404 = 0i;
if (v404<0i || v404>=7i) { vkf_failed=true; }
let v405 = v146[u32(clamp(v404,0i,7i-1i))];
let v406 = 1i;
if (v406<0i || v406>=7i) { vkf_failed=true; }
let v407 = v146[u32(clamp(v406,0i,7i-1i))];
let v408 = 5i;
if (v408<0i || v408>=7i) { vkf_failed=true; }
let v409 = v146[u32(clamp(v408,0i,7i-1i))];
let v410 = v103;
let v411 = (v409*v410);
let v412 = 1i;
let v413 = v124;
let v414 = (f32(v412)-v413);
let v415 = (v411*v414);
let v416 = v372;
let v417 = 2i;
if (v417<0i || v417>=7i) { vkf_failed=true; }
let v418 = v146[u32(clamp(v417,0i,7i-1i))];
let v419 = 3i;
if (v419<0i || v419>=7i) { vkf_failed=true; }
let v420 = v146[u32(clamp(v419,0i,7i-1i))];
let v421 = 4i;
if (v421<0i || v421>=7i) { vkf_failed=true; }
let v422 = v146[u32(clamp(v421,0i,7i-1i))];
let v423 = 1i;
let v424 = v105;
let v425 = f32(v424);
if (v425 == 0.0f) { vkf_failed = true; }
let v426 = (f32(v423)/v425);
let v427 = v124;
let v428 = v100;
let v429 = f32(v428);
let v430 = 5i;
if (v430<0i || v430>=7i) { vkf_failed=true; }
let v431 = v146[u32(clamp(v430,0i,7i-1i))];
return array<f32,11>(v405,v407,v415,v416,v418,v420,v422,v426,v427,v429,v431);
}
fn fn1(v3:i32)->array<f32,11> {
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
let v14 = 65536i;
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
let v23 = 14i;
let v24 = v5;
let v25 = (v23*v24);
let v26 = 7i;
let v27 = v7;
let v28 = (v26*v27);
let v29 = (v25+v28);
v30 = (v22==v29);
}
if (!(v30)) { vkf_failed = true; }
let v31 = 7i;
let v32 = v5;
let v33 = (v31*v32);
let v34 = 7i;
let v35 = v3;
let v36 = (v34*v35);
var v37: f32 = read_values((v33+v36));
let v38 = 7i;
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
let v55 = 14i;
let v56 = v5;
let v57 = (v55*v56);
let v58 = 7i;
let v59 = v51;
let v60 = (v58*v59);
let v61 = read_values((v57+v60));
var v62: f32 = (v54-v61);
let v63 = v46;
let v64 = 14i;
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
let v87 = 14i;
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
fn fn0(v1:i32)->array<f32,11> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/11u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<11u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<11u;i+=1u){results[gid.x*11u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/11u)],1u);}
}
