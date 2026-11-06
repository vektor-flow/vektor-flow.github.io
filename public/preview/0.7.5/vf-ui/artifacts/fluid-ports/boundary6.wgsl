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
fn fn2()->i32 {
let v4 = i32(arrayLength(&params));
let v5 = 24i;
if (!((v4>=v5))) { vkf_failed = true; }
let v6 = read_params(0i);
let v7 = 4i;
var v10 = (v6>=f32(v7));
if (v10) {
let v8 = read_params(0i);
let v9 = 64i;
v10 = (v8<=f32(v9));
}
var v13 = v10;
if (v13) {
let v11 = read_params(1i);
let v12 = 4i;
v13 = (v11>=f32(v12));
}
var v16 = v13;
if (v16) {
let v14 = read_params(1i);
let v15 = 64i;
v16 = (v14<=f32(v15));
}
var v19 = v16;
if (v19) {
let v17 = read_params(2i);
let v18 = 4i;
v19 = (v17>=f32(v18));
}
var v22 = v19;
if (v22) {
let v20 = read_params(2i);
let v21 = 64i;
v22 = (v20<=f32(v21));
}
var v29 = v22;
if (v29) {
let v23 = read_params(0i);
let v24 = read_params(1i);
let v25 = (v23*v24);
let v26 = read_params(2i);
let v27 = (v25*v26);
let v28 = 131072i;
v29 = (v27<=f32(v28));
}
if (!(v29)) { vkf_failed = true; }
var v30: i32 = 0i;
loop {
let v31 = v30;
let v32 = 3i;
if (!((v31<v32))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v33 = read_params(v30);
let v34 = read_params(v30);
if (!(abs(v34) < 2147483648.0f)) { vkf_failed = true; }
let v35 = i32(v34);
let v36 = f32(v35);
var v41 = (v33==v36);
if (v41) {
let v37 = 3i;
let v38 = v30;
let v39 = read_params((v37+v38));
let v40 = 0i;
v41 = (v39>f32(v40));
}
var v46 = v41;
if (v46) {
let v42 = 3i;
let v43 = v30;
let v44 = read_params((v42+v43));
let v45 = 1000000i;
v46 = (v44<f32(v45));
}
if (!(v46)) { vkf_failed = true; }
let v47 = v30;
let v48 = 1i;
v30 = (v47+v48);
}
let v49 = read_params(0i);
if (!(abs(v49) < 2147483648.0f)) { vkf_failed = true; }
let v50 = i32(v49);
let v51 = read_params(1i);
if (!(abs(v51) < 2147483648.0f)) { vkf_failed = true; }
let v52 = i32(v51);
let v53 = (v50*v52);
let v54 = read_params(2i);
if (!(abs(v54) < 2147483648.0f)) { vkf_failed = true; }
let v55 = i32(v54);
return (v53*v55);
}
fn fn3(v66:f32)->f32 {
let v67 = v66;
let v68 = -1.00000002e+30f;
var v71 = (v67>v68);
if (v71) {
let v69 = v66;
let v70 = 1.00000002e+30f;
v71 = (v69<v70);
}
if (!(v71)) { vkf_failed = true; }
return v66;
}
fn fn4(v76:f32)->f32 {
let v77 = v76;
var v78: f32 = fn3(v77);
let v79 = v78;
let v80 = 0i;
if (!((v79>=f32(v80)))) { vkf_failed = true; }
return v78;
}
fn fn5(v117:f32)->f32 {
let v118 = v117;
let v119 = 0i;
if ((v118<f32(v119))) {
return 0.0f;
}
let v120 = v117;
let v121 = 1i;
if ((v120>f32(v121))) {
return 1.0f;
}
return v117;
}
fn fn6(v125:f32)->f32 {
let v126 = v125;
let v127 = v125;
let v128 = (v126*v127);
let v129 = v125;
let v130 = (v128*v129);
let v131 = 10i;
let v132 = v125;
let v133 = -15i;
let v134 = 6i;
let v135 = v125;
let v136 = (f32(v134)*v135);
let v137 = (f32(v133)+v136);
let v138 = (v132*v137);
let v139 = (f32(v131)+v138);
return (v130*v139);
}
fn fn7(v146:f32,v147:f32)->f32 {
let v148 = v146;
let v149 = 0i;
var v152 = (v148<=f32(v149));
if (!v152) {
let v150 = v146;
let v151 = 1i;
v152 = (v150>=f32(v151));
}
if (v152) {
return 0.0f;
}
let v153 = 30i;
let v154 = v146;
let v155 = (f32(v153)*v154);
let v156 = v146;
let v157 = (v155*v156);
let v158 = 1i;
let v159 = v146;
let v160 = (f32(v158)-v159);
let v161 = (v157*v160);
let v162 = 1i;
let v163 = v146;
let v164 = (f32(v162)-v163);
let v165 = (v161*v164);
let v166 = v147;
if (v166 == 0.0f) { vkf_failed = true; }
return (v165/v166);
}
fn fn1(v3:i32)->array<f32,6> {
var v56: i32 = fn2();
let v57 = i32(arrayLength(&params));
let v58 = 31i;
var v61 = (v57==v58);
if (v61) {
let v59 = v3;
let v60 = 0i;
v61 = (v59>=v60);
}
var v64 = v61;
if (v64) {
let v62 = v3;
let v63 = v56;
v64 = (v62<v63);
}
if (!(v64)) { vkf_failed = true; }
let v65 = read_params(24i);
var v72: f32 = fn3(v65);
let v73 = read_params(25i);
var v74: f32 = fn3(v73);
let v75 = read_params(26i);
var v81: f32 = fn4(v75);
let v82 = read_params(27i);
var v83: f32 = fn3(v82);
var v84: f32 = read_params(28i);
let v85 = v83;
let v86 = 0i;
var v92 = (v85>f32(v86));
if (v92) {
let v87 = v84;
let v88 = 0i;
var v91 = (v87==f32(v88));
if (!v91) {
let v89 = v84;
let v90 = 1i;
v91 = (v89==f32(v90));
}
v92 = v91;
}
var v102 = v92;
if (v102) {
let v93 = i32(arrayLength(&values));
let v94 = 6i;
let v95 = v56;
let v96 = (v94*v95);
let v97 = 1i;
let v98 = v84;
if (!(abs(v98) < 2147483648.0f)) { vkf_failed = true; }
let v99 = i32(v98);
let v100 = (v97+v99);
let v101 = (v96*v100);
v102 = (v93==v101);
}
if (!(v102)) { vkf_failed = true; }
let v103 = read_params(29i);
var v104: f32 = fn3(v103);
let v105 = read_params(30i);
var v106: f32 = fn3(v105);
let v107 = v84;
let v108 = 0i;
var v111 = (v107==f32(v108));
if (!v111) {
let v109 = v106;
let v110 = 0i;
v111 = (v109>f32(v110));
}
if (!(v111)) { vkf_failed = true; }
let v112 = v72;
let v113 = v74;
let v114 = (v112-v113);
let v115 = v83;
if (v115 == 0.0f) { vkf_failed = true; }
let v116 = (v114/v115);
var v122: f32 = fn5(v116);
let v123 = v81;
let v124 = v122;
let v140 = fn6(v124);
let v141 = (v123*v140);
var v142: f32 = fn3(v141);
let v143 = v81;
let v144 = v122;
let v145 = v83;
let v167 = fn7(v144,v145);
let v168 = (v143*v167);
var v169: f32 = fn3(v168);
var v170: f32 = 0.0f;
var v171: f32 = 0.0f;
let v172 = v84;
let v173 = 1i;
if ((v172==f32(v173))) {
let v174 = v72;
let v175 = v104;
let v176 = (v174-v175);
let v177 = v106;
if (v177 == 0.0f) { vkf_failed = true; }
let v178 = (v176/v177);
var v179: f32 = fn5(v178);
let v180 = v179;
v170 = fn6(v180);
let v181 = v179;
let v182 = v106;
v171 = fn7(v181,v182);
}
let v183 = f32(0i);
let v184 = f32(0i);
let v185 = f32(0i);
let v186 = f32(0i);
let v187 = f32(0i);
let v188 = f32(0i);
var v189: array<f32,6> = array<f32,6>(v183,v184,v185,v186,v187,v188);
var v190: i32 = 0i;
loop {
let v191 = v190;
let v192 = 6i;
if (!((v191<v192))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v193 = 6i;
let v194 = v3;
let v195 = (v193*v194);
let v196 = v190;
let v197 = read_values((v195+v196));
var v198: f32 = fn3(v197);
let v199 = v190;
let v200 = 2i;
if ((v199<v200)) {
let v201 = v198;
let v202 = 0i;
if (!((v201>=f32(v202)))) { vkf_failed = true; }
}
var v203: f32 = v198;
let v204 = v84;
let v205 = 1i;
if ((v204==f32(v205))) {
let v206 = 6i;
let v207 = v56;
let v208 = (v206*v207);
let v209 = 6i;
let v210 = v3;
let v211 = (v209*v210);
let v212 = (v208+v211);
let v213 = v190;
let v214 = read_values((v212+v213));
v203 = fn3(v214);
let v215 = v190;
let v216 = 2i;
if ((v215<v216)) {
let v217 = v203;
let v218 = 0i;
if (!((v217>=f32(v218)))) { vkf_failed = true; }
}
}
let v219 = v190;
let v220 = 1i;
let v221 = v170;
let v222 = (f32(v220)-v221);
let v223 = v198;
let v224 = (v222*v223);
let v225 = v170;
let v226 = v203;
let v227 = (v225*v226);
if (v219<0i || v219>=6i) { vkf_failed=true; } else { v189[u32(v219)]=(v224+v227); }
let v228 = v190;
let v229 = 1i;
v190 = (v228+v229);
}
let v230 = f32(0i);
let v231 = f32(0i);
let v232 = f32(0i);
let v233 = f32(0i);
let v234 = f32(0i);
let v235 = f32(0i);
var v236: array<f32,6> = array<f32,6>(v230,v231,v232,v233,v234,v235);
let v237 = 0i;
let v238 = v142;
let v239 = 0i;
if (v239<0i || v239>=6i) { vkf_failed=true; }
let v240 = v189[u32(clamp(v239,0i,6i-1i))];
if (v237<0i || v237>=6i) { vkf_failed=true; } else { v236[u32(v237)]=(v238*v240); }
let v241 = 1i;
let v242 = v142;
let v243 = 1i;
if (v243<0i || v243>=6i) { vkf_failed=true; }
let v244 = v189[u32(clamp(v243,0i,6i-1i))];
let v245 = 0i;
if (v245<0i || v245>=6i) { vkf_failed=true; }
let v246 = v189[u32(clamp(v245,0i,6i-1i))];
let v247 = (v244-v246);
if (v241<0i || v241>=6i) { vkf_failed=true; } else { v236[u32(v241)]=(v242*v247); }
let v248 = 2i;
let v249 = v142;
let v250 = 2i;
if (v250<0i || v250>=6i) { vkf_failed=true; }
let v251 = v189[u32(clamp(v250,0i,6i-1i))];
if (v248<0i || v248>=6i) { vkf_failed=true; } else { v236[u32(v248)]=(v249*v251); }
let v252 = 3i;
let v253 = v142;
let v254 = 3i;
if (v254<0i || v254>=6i) { vkf_failed=true; }
let v255 = v189[u32(clamp(v254,0i,6i-1i))];
if (v252<0i || v252>=6i) { vkf_failed=true; } else { v236[u32(v252)]=(v253*v255); }
let v256 = 4i;
let v257 = v142;
let v258 = 4i;
if (v258<0i || v258>=6i) { vkf_failed=true; }
let v259 = v189[u32(clamp(v258,0i,6i-1i))];
if (v256<0i || v256>=6i) { vkf_failed=true; } else { v236[u32(v256)]=(v257*v259); }
let v260 = 5i;
let v261 = v169;
let v262 = 5i;
if (v262<0i || v262>=6i) { vkf_failed=true; }
let v263 = v189[u32(clamp(v262,0i,6i-1i))];
if (v260<0i || v260>=6i) { vkf_failed=true; } else { v236[u32(v260)]=(v261*v263); }
let v264 = v84;
let v265 = 1i;
if ((v264==f32(v265))) {
let v266 = 5i;
let v267 = 5i;
if (v267<0i || v267>=6i) { vkf_failed=true; }
let v268 = v236[u32(clamp(v267,0i,6i-1i))];
let v269 = v142;
let v270 = v171;
let v271 = (v269*v270);
let v272 = 6i;
let v273 = v56;
let v274 = (v272*v273);
let v275 = 6i;
let v276 = v3;
let v277 = (v275*v276);
let v278 = (v274+v277);
let v279 = 5i;
let v280 = read_values((v278+v279));
let v281 = 6i;
let v282 = v3;
let v283 = (v281*v282);
let v284 = 5i;
let v285 = read_values((v283+v284));
let v286 = (v280-v285);
let v287 = (v271*v286);
if (v266<0i || v266>=6i) { vkf_failed=true; } else { v236[u32(v266)]=(v268+v287); }
}
v190 = 0i;
loop {
let v288 = v190;
let v289 = 6i;
if (!((v288<v289))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v290 = v190;
let v291 = v190;
if (v291<0i || v291>=6i) { vkf_failed=true; }
let v292 = v236[u32(clamp(v291,0i,6i-1i))];
if (v290<0i || v290>=6i) { vkf_failed=true; } else { v236[u32(v290)]=fn3(v292); }
let v293 = v190;
let v294 = 1i;
v190 = (v293+v294);
}
return v236;
}
fn fn0(v1:i32)->array<f32,6> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/6u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<6u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<6u;i+=1u){results[gid.x*6u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/6u)],1u);}
}
