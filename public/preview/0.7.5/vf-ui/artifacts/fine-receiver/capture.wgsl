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
fn fn2(v143:f32,v144:f32)->f32 {
let v145 = v143;
let v146 = v143;
let v147 = v144;
if (v147 == 0.0f) { vkf_failed = true; }
let v148 = (v146/v147);
let v149 = 1i;
if (f32(v149) == 0.0f) { vkf_failed = true; }
let v150 = floor(v148/f32(v149));
let v151 = v144;
let v152 = (v150*v151);
return (v145-v152);
}
fn fn3(v280:f32,v281:f32)->f32 {
let v282 = v280;
let v283 = v281;
if ((v282>v283)) {
return v280;
}
return v281;
}
fn fn4(v296:f32,v297:f32)->f32 {
let v298 = v296;
let v299 = v297;
if ((v298<v299)) {
return v296;
}
return v297;
}
fn fn5(v306:i32,v307:i32)->i32 {
let v308 = v306;
let v309 = v307;
if (v309 == 0i) { vkf_failed = true; }
let v310 = (v308%v309);
let v311 = v307;
let v312 = (v310+v311);
let v313 = v307;
if (v313 == 0i) { vkf_failed = true; }
return (v312%v313);
}
fn fn1(v3:i32)->array<f32,25> {
let v4 = read_params(0i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
var v5: i32 = i32(v4);
let v6 = read_params(1i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
var v7: i32 = i32(v6);
let v8 = read_params(11i);
if (!(abs(v8) < 2147483648.0f)) { vkf_failed = true; }
var v9: i32 = i32(v8);
let v10 = v5;
let v11 = 0i;
var v14 = (v10>v11);
if (v14) {
let v12 = v5;
let v13 = 4096i;
v14 = (v12<=v13);
}
var v17 = v14;
if (v17) {
let v15 = v7;
let v16 = 0i;
v17 = (v15>v16);
}
var v20 = v17;
if (v20) {
let v18 = v7;
let v19 = 4096i;
v20 = (v18<=v19);
}
var v25 = v20;
if (v25) {
let v21 = v5;
let v22 = v7;
let v23 = (v21*v22);
let v24 = 4194304i;
v25 = (v23<=v24);
}
var v28 = v25;
if (v28) {
let v26 = read_params(2i);
let v27 = 0i;
v28 = (v26>f32(v27));
}
var v31 = v28;
if (v31) {
let v29 = read_params(3i);
let v30 = 0i;
v31 = (v29>f32(v30));
}
var v34 = v31;
if (v34) {
let v32 = read_params(4i);
let v33 = 0i;
v34 = (v32>f32(v33));
}
var v37 = v34;
if (v37) {
let v35 = read_params(5i);
let v36 = 0i;
v37 = (v35>=f32(v36));
}
var v40 = v37;
if (v40) {
let v38 = v9;
let v39 = 0i;
v40 = (v38>v39);
}
var v43 = v40;
if (v43) {
let v41 = v9;
let v42 = 4096i;
v43 = (v41<=v42);
}
if (!(v43)) { vkf_failed = true; }
let v44 = v3;
let v45 = 0i;
var v49 = (v44>=v45);
if (v49) {
let v46 = v3;
let v47 = read_params(12i);
if (!(abs(v47) < 2147483648.0f)) { vkf_failed = true; }
let v48 = i32(v47);
v49 = (v46<v48);
}
var v54 = v49;
if (v54) {
let v50 = read_params(10i);
let v51 = 20i;
let v52 = read_params(12i);
let v53 = (f32(v51)*v52);
v54 = (v50>=v53);
}
var v63 = v54;
if (v63) {
let v55 = read_params(10i);
let v56 = v5;
let v57 = v7;
let v58 = (v56*v57);
let v59 = f32(v58);
let v60 = (v55+v59);
let v61 = i32(arrayLength(&values));
let v62 = f32(v61);
v63 = (v60<=v62);
}
if (!(v63)) { vkf_failed = true; }
let v64 = read_params(6i);
let v65 = 0i;
var v71 = (v64==f32(v65));
if (!v71) {
let v66 = read_params(6i);
let v67 = 1i;
var v70 = (v66==f32(v67));
if (v70) {
let v68 = read_params(9i);
let v69 = 0i;
v70 = (v68>f32(v69));
}
v71 = v70;
}
if (!(v71)) { vkf_failed = true; }
let v72 = v3;
let v73 = 20i;
var v74: i32 = (v72*v73);
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
var v100: array<f32,25> = array<f32,25>(v75,v76,v77,v78,v79,v80,v81,v82,v83,v84,v85,v86,v87,v88,v89,v90,v91,v92,v93,v94,v95,v96,v97,v98,v99);
var v101: i32 = 0i;
loop {
let v102 = v101;
let v103 = 20i;
if (!((v102<v103))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v104 = v101;
let v105 = v74;
let v106 = v101;
if (v104<0i || v104>=25i) { vkf_failed=true; } else { v100[u32(v104)]=read_values((v105+v106)); }
let v107 = v101;
let v108 = 1i;
v101 = (v107+v108);
}
let v109 = 21i;
if (v109<0i || v109>=25i) { vkf_failed=true; } else { v100[u32(v109)]=f32(-1i); }
let v110 = 22i;
if (v110<0i || v110>=25i) { vkf_failed=true; } else { v100[u32(v110)]=f32(-1i); }
let v111 = 23i;
if (v111<0i || v111>=25i) { vkf_failed=true; } else { v100[u32(v111)]=f32(-1i); }
let v112 = 16i;
if (v112<0i || v112>=25i) { vkf_failed=true; }
let v113 = v100[u32(clamp(v112,0i,25i-1i))];
let v114 = 0i;
var v118 = (v113==f32(v114));
if (!v118) {
let v115 = 16i;
if (v115<0i || v115>=25i) { vkf_failed=true; }
let v116 = v100[u32(clamp(v115,0i,25i-1i))];
let v117 = 1i;
v118 = (v116==f32(v117));
}
if (!(v118)) { vkf_failed = true; }
let v119 = 16i;
if (v119<0i || v119>=25i) { vkf_failed=true; }
let v120 = v100[u32(clamp(v119,0i,25i-1i))];
let v121 = 0i;
if ((v120==f32(v121))) {
return v100;
}
let v122 = 19i;
if (v122<0i || v122>=25i) { vkf_failed=true; }
var v123: f32 = v100[u32(clamp(v122,0i,25i-1i))];
let v124 = v123;
let v125 = 0i;
var v129 = (v124>=f32(v125));
if (v129) {
let v126 = 9i;
if (v126<0i || v126>=25i) { vkf_failed=true; }
let v127 = v100[u32(clamp(v126,0i,25i-1i))];
let v128 = 0i;
v129 = (v127>=f32(v128));
}
var v133 = v129;
if (v133) {
let v130 = 14i;
if (v130<0i || v130>=25i) { vkf_failed=true; }
let v131 = v100[u32(clamp(v130,0i,25i-1i))];
let v132 = 0i;
v133 = (v131>=f32(v132));
}
var v138 = v133;
if (v138) {
let v134 = 15i;
if (v134<0i || v134>=25i) { vkf_failed=true; }
let v135 = v100[u32(clamp(v134,0i,25i-1i))];
let v136 = 14i;
if (v136<0i || v136>=25i) { vkf_failed=true; }
let v137 = v100[u32(clamp(v136,0i,25i-1i))];
v138 = (v135>=v137);
}
if (!(v138)) { vkf_failed = true; }
let v139 = 3i;
let v140 = 3i;
if (v140<0i || v140>=25i) { vkf_failed=true; }
let v141 = v100[u32(clamp(v140,0i,25i-1i))];
let v142 = read_params(2i);
if (v139<0i || v139>=25i) { vkf_failed=true; } else { v100[u32(v139)]=fn2(v141,v142); }
let v153 = 4i;
let v154 = 4i;
if (v154<0i || v154>=25i) { vkf_failed=true; }
let v155 = v100[u32(clamp(v154,0i,25i-1i))];
let v156 = read_params(3i);
if (v153<0i || v153>=25i) { vkf_failed=true; } else { v100[u32(v153)]=fn2(v155,v156); }
let v157 = 5i;
let v158 = 5i;
if (v158<0i || v158>=25i) { vkf_failed=true; }
let v159 = v100[u32(clamp(v158,0i,25i-1i))];
let v160 = read_params(4i);
if (v157<0i || v157>=25i) { vkf_failed=true; } else { v100[u32(v157)]=fn2(v159,v160); }
let v161 = v123;
let v162 = 0i;
var v165 = (v161==f32(v162));
if (!v165) {
let v163 = read_params(5i);
let v164 = 0i;
v165 = (v163==f32(v164));
}
if (v165) {
return v100;
}
var v166: f32 = read_values(v74);
let v167 = v74;
let v168 = 1i;
var v169: f32 = read_values((v167+v168));
let v170 = v74;
let v171 = 2i;
var v172: f32 = read_values((v170+v171));
let v173 = v74;
let v174 = 3i;
let v175 = read_values((v173+v174));
let v176 = v166;
var v177: f32 = (v175-v176);
let v178 = v74;
let v179 = 4i;
let v180 = read_values((v178+v179));
let v181 = v169;
var v182: f32 = (v180-v181);
let v183 = v74;
let v184 = 5i;
let v185 = read_values((v183+v184));
let v186 = v172;
var v187: f32 = (v185-v186);
let v188 = v166;
let v189 = v5;
let v190 = f32(v189);
let v191 = (v188*v190);
let v192 = read_params(2i);
if (v192 == 0.0f) { vkf_failed = true; }
var v193: f32 = (v191/v192);
let v194 = v169;
let v195 = v7;
let v196 = f32(v195);
let v197 = (v194*v196);
let v198 = read_params(3i);
if (v198 == 0.0f) { vkf_failed = true; }
var v199: f32 = (v197/v198);
let v200 = v177;
let v201 = v5;
let v202 = f32(v201);
let v203 = (v200*v202);
let v204 = read_params(2i);
if (v204 == 0.0f) { vkf_failed = true; }
var v205: f32 = (v203/v204);
let v206 = v182;
let v207 = v7;
let v208 = f32(v207);
let v209 = (v206*v208);
let v210 = read_params(3i);
if (v210 == 0.0f) { vkf_failed = true; }
var v211: f32 = (v209/v210);
let v212 = v193;
let v213 = 1i;
if (f32(v213) == 0.0f) { vkf_failed = true; }
let v214 = floor(v212/f32(v213));
if (!(abs(v214) < 2147483648.0f)) { vkf_failed = true; }
var v215: i32 = i32(v214);
let v216 = v199;
let v217 = 1i;
if (f32(v217) == 0.0f) { vkf_failed = true; }
let v218 = floor(v216/f32(v217));
if (!(abs(v218) < 2147483648.0f)) { vkf_failed = true; }
var v219: i32 = i32(v218);
var v220: i32 = 0i;
var v221: i32 = 0i;
var v222: f32 = 2.0f;
var v223: f32 = 2.0f;
var v224: f32 = 2.0f;
var v225: f32 = 2.0f;
let v226 = v205;
let v227 = 0i;
if ((v226>f32(v227))) {
v220 = 1i;
let v228 = 1i;
let v229 = v205;
if (v229 == 0.0f) { vkf_failed = true; }
v224 = (f32(v228)/v229);
let v230 = v215;
let v231 = 1i;
let v232 = (v230+v231);
let v233 = f32(v232);
let v234 = v193;
let v235 = (v233-v234);
let v236 = v205;
if (v236 == 0.0f) { vkf_failed = true; }
v222 = (v235/v236);
}
let v237 = v205;
let v238 = 0i;
if ((v237<f32(v238))) {
v220 = -1i;
let v239 = -1i;
let v240 = v205;
if (v240 == 0.0f) { vkf_failed = true; }
v224 = (f32(v239)/v240);
let v241 = v193;
let v242 = v215;
let v243 = f32(v242);
let v244 = (v241-v243);
let v245 = (-v205);
if (v245 == 0.0f) { vkf_failed = true; }
v222 = (v244/v245);
let v246 = v222;
let v247 = 0i;
if ((v246==f32(v247))) {
let v248 = v215;
let v249 = 1i;
v215 = (v248-v249);
v222 = v224;
}
}
let v250 = v211;
let v251 = 0i;
if ((v250>f32(v251))) {
v221 = 1i;
let v252 = 1i;
let v253 = v211;
if (v253 == 0.0f) { vkf_failed = true; }
v225 = (f32(v252)/v253);
let v254 = v219;
let v255 = 1i;
let v256 = (v254+v255);
let v257 = f32(v256);
let v258 = v199;
let v259 = (v257-v258);
let v260 = v211;
if (v260 == 0.0f) { vkf_failed = true; }
v223 = (v259/v260);
}
let v261 = v211;
let v262 = 0i;
if ((v261<f32(v262))) {
v221 = -1i;
let v263 = -1i;
let v264 = v211;
if (v264 == 0.0f) { vkf_failed = true; }
v225 = (f32(v263)/v264);
let v265 = v199;
let v266 = v219;
let v267 = f32(v266);
let v268 = (v265-v267);
let v269 = (-v211);
if (v269 == 0.0f) { vkf_failed = true; }
v223 = (v268/v269);
let v270 = v223;
let v271 = 0i;
if ((v270==f32(v271))) {
let v272 = v219;
let v273 = 1i;
v219 = (v272-v273);
v223 = v225;
}
}
let v274 = 0.0f;
let v275 = 15i;
if (v275<0i || v275>=25i) { vkf_failed=true; }
let v276 = v100[u32(clamp(v275,0i,25i-1i))];
let v277 = 14i;
if (v277<0i || v277>=25i) { vkf_failed=true; }
let v278 = v100[u32(clamp(v277,0i,25i-1i))];
let v279 = (v276-v278);
var v284: f32 = fn3(v274,v279);
var v285: f32 = 0.0f;
var v286: f32 = 0.0f;
var v287: i32 = 0i;
loop {
let v288 = v286;
let v289 = 1i;
var v292 = (v288<f32(v289));
if (v292) {
let v290 = v287;
let v291 = v9;
v292 = (v290<v291);
}
if (!(v292)) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v293 = 1.0f;
let v294 = v222;
let v295 = v223;
let v300 = fn4(v294,v295);
var v301: f32 = fn4(v293,v300);
var v302: f32 = v286;
var v303: f32 = v301;
let v304 = v215;
let v305 = v5;
var v314: i32 = fn5(v304,v305);
let v315 = v7;
let v316 = 1i;
let v317 = (v315-v316);
let v318 = v219;
let v319 = v7;
let v320 = fn5(v318,v319);
var v321: i32 = (v317-v320);
let v322 = read_params(10i);
if (!(abs(v322) < 2147483648.0f)) { vkf_failed = true; }
let v323 = i32(v322);
let v324 = v321;
let v325 = v5;
let v326 = (v324*v325);
let v327 = (v323+v326);
let v328 = v314;
var v329: f32 = read_values((v327+v328));
let v330 = v329;
let v331 = 0i;
var v334 = (v330>=f32(v331));
if (v334) {
let v332 = v329;
let v333 = 1i;
v334 = (v332<=f32(v333));
}
if (!(v334)) { vkf_failed = true; }
let v335 = read_params(6i);
let v336 = 1i;
if ((v335==f32(v336))) {
let v337 = v215;
let v338 = f32(v337);
let v339 = v5;
let v340 = f32(v339);
if (v340 == 0.0f) { vkf_failed = true; }
let v341 = (v338/v340);
let v342 = 1i;
if (f32(v342) == 0.0f) { vkf_failed = true; }
let v343 = floor(v341/f32(v342));
if (!(abs(v343) < 2147483648.0f)) { vkf_failed = true; }
var v344: i32 = i32(v343);
let v345 = v166;
let v346 = v344;
let v347 = f32(v346);
let v348 = read_params(2i);
let v349 = (v347*v348);
let v350 = (v345-v349);
let v351 = read_params(7i);
var v352: f32 = (v350-v351);
let v353 = v177;
let v354 = read_params(8i);
let v355 = read_params(7i);
let v356 = (v354-v355);
var v357: f32 = (v353-v356);
let v358 = read_params(9i);
let v359 = 2i;
if (f32(v359) == 0.0f) { vkf_failed = true; }
var v360: f32 = (v358/f32(v359));
let v361 = v357;
let v362 = 0i;
if ((v361==f32(v362))) {
let v363 = abs(v352);
let v364 = v360;
if ((v363>v364)) {
v303 = v302;
}
}
let v365 = v357;
let v366 = 0i;
if ((!(v365==f32(v366)))) {
let v367 = (-v360);
let v368 = v352;
let v369 = (v367-v368);
let v370 = v357;
if (v370 == 0.0f) { vkf_failed = true; }
var v371: f32 = (v369/v370);
let v372 = v360;
let v373 = v352;
let v374 = (v372-v373);
let v375 = v357;
if (v375 == 0.0f) { vkf_failed = true; }
var v376: f32 = (v374/v375);
let v377 = v302;
let v378 = v371;
let v379 = v376;
let v380 = fn4(v378,v379);
v302 = fn3(v377,v380);
let v381 = v303;
let v382 = v371;
let v383 = v376;
let v384 = fn3(v382,v383);
v303 = fn4(v381,v384);
}
}
let v385 = read_params(5i);
let v386 = v329;
var v387: f32 = (v385*v386);
let v388 = v387;
let v389 = 0i;
var v392 = (v388>f32(v389));
if (v392) {
let v390 = v303;
let v391 = v302;
v392 = (v390>v391);
}
if (v392) {
let v393 = v387;
let v394 = v123;
let v395 = (v393*v394);
let v396 = v303;
let v397 = v302;
let v398 = (v396-v397);
var v399: f32 = (v395*v398);
let v400 = v285;
let v401 = v399;
let v402 = (v400+v401);
let v403 = v284;
if ((v402>=v403)) {
let v404 = v302;
let v405 = v284;
let v406 = v285;
let v407 = (v405-v406);
let v408 = v387;
let v409 = v123;
let v410 = (v408*v409);
if (v410 == 0.0f) { vkf_failed = true; }
let v411 = (v407/v410);
var v412: f32 = (v404+v411);
let v413 = 3i;
let v414 = v166;
let v415 = v177;
let v416 = v412;
let v417 = (v415*v416);
let v418 = (v414+v417);
let v419 = read_params(2i);
if (v413<0i || v413>=25i) { vkf_failed=true; } else { v100[u32(v413)]=fn2(v418,v419); }
let v420 = 4i;
let v421 = v169;
let v422 = v182;
let v423 = v412;
let v424 = (v422*v423);
let v425 = (v421+v424);
let v426 = read_params(3i);
if (v420<0i || v420>=25i) { vkf_failed=true; } else { v100[u32(v420)]=fn2(v425,v426); }
let v427 = 5i;
let v428 = v172;
let v429 = v187;
let v430 = v412;
let v431 = (v429*v430);
let v432 = (v428+v431);
let v433 = read_params(4i);
if (v427<0i || v427>=25i) { vkf_failed=true; } else { v100[u32(v427)]=fn2(v432,v433); }
let v434 = 14i;
let v435 = v74;
let v436 = 15i;
if (v434<0i || v434>=25i) { vkf_failed=true; } else { v100[u32(v434)]=read_values((v435+v436)); }
let v437 = 16i;
if (v437<0i || v437>=25i) { vkf_failed=true; } else { v100[u32(v437)]=f32(0i); }
let v438 = 20i;
if (v438<0i || v438>=25i) { vkf_failed=true; } else { v100[u32(v438)]=f32(1i); }
let v439 = 21i;
if (v439<0i || v439>=25i) { vkf_failed=true; } else { v100[u32(v439)]=v412; }
let v440 = 22i;
let v441 = v314;
if (v440<0i || v440>=25i) { vkf_failed=true; } else { v100[u32(v440)]=f32(v441); }
let v442 = 23i;
let v443 = v321;
if (v442<0i || v442>=25i) { vkf_failed=true; } else { v100[u32(v442)]=f32(v443); }
let v444 = 24i;
if (v444<0i || v444>=25i) { vkf_failed=true; } else { v100[u32(v444)]=v284; }
return v100;
}
let v445 = v285;
let v446 = v399;
v285 = (v445+v446);
}
let v447 = v222;
let v448 = v223;
var v449: bool = (v447<=v448);
let v450 = v223;
let v451 = v222;
var v452: bool = (v450<=v451);
if (v449) {
let v453 = v215;
let v454 = v220;
v215 = (v453+v454);
let v455 = v220;
let v456 = 0i;
if ((v455>v456)) {
let v457 = v215;
let v458 = 1i;
let v459 = (v457+v458);
let v460 = f32(v459);
let v461 = v193;
let v462 = (v460-v461);
let v463 = v205;
if (v463 == 0.0f) { vkf_failed = true; }
v222 = (v462/v463);
}
let v464 = v220;
let v465 = 0i;
if ((v464<v465)) {
let v466 = v215;
let v467 = f32(v466);
let v468 = v193;
let v469 = (v467-v468);
let v470 = v205;
if (v470 == 0.0f) { vkf_failed = true; }
v222 = (v469/v470);
}
}
if (v452) {
let v471 = v219;
let v472 = v221;
v219 = (v471+v472);
let v473 = v221;
let v474 = 0i;
if ((v473>v474)) {
let v475 = v219;
let v476 = 1i;
let v477 = (v475+v476);
let v478 = f32(v477);
let v479 = v199;
let v480 = (v478-v479);
let v481 = v211;
if (v481 == 0.0f) { vkf_failed = true; }
v223 = (v480/v481);
}
let v482 = v221;
let v483 = 0i;
if ((v482<v483)) {
let v484 = v219;
let v485 = f32(v484);
let v486 = v199;
let v487 = (v485-v486);
let v488 = v211;
if (v488 == 0.0f) { vkf_failed = true; }
v223 = (v487/v488);
}
}
v286 = v301;
let v489 = v287;
let v490 = 1i;
v287 = (v489+v490);
}
let v491 = v286;
let v492 = 1i;
if (!((v491>=f32(v492)))) { vkf_failed = true; }
let v493 = 14i;
let v494 = v74;
let v495 = 14i;
let v496 = read_values((v494+v495));
let v497 = v285;
if (v493<0i || v493>=25i) { vkf_failed=true; } else { v100[u32(v493)]=(v496+v497); }
let v498 = 24i;
if (v498<0i || v498>=25i) { vkf_failed=true; } else { v100[u32(v498)]=v285; }
return v100;
}
fn fn0(v1:i32)->array<f32,25> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/25u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<25u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<25u;i+=1u){results[gid.x*25u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/25u)],1u);}
}
