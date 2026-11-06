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
fn fn2()->f32 {
var v8: i32 = i32(arrayLength(&values));
var v9: f32 = 0.0f;
var v10: i32 = 0i;
loop {
let v11 = v10;
let v12 = v8;
if (!((v11<v12))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v13 = v9;
let v14 = read_values(v10);
v9 = (v13+v14);
let v15 = v10;
let v16 = 1i;
v10 = (v15+v16);
}
return v9;
}
fn fn3(v62:f32)->f32 {
let v63 = v62;
let v64 = 0i;
var v67 = (v63>f32(v64));
if (v67) {
let v65 = v62;
let v66 = 4i;
v67 = (v65<=f32(v66));
}
if (!(v67)) { vkf_failed = true; }
var v68: f32 = 1.0f;
var v69: f32 = 1.1920929e-07f;
loop {
let v70 = v62;
let v71 = v68;
if (!((v70<v71))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v72 = v68;
let v73 = 2i;
if (f32(v73) == 0.0f) { vkf_failed = true; }
v68 = (v72/f32(v73));
let v74 = v69;
let v75 = 2i;
if (f32(v75) == 0.0f) { vkf_failed = true; }
v69 = (v74/f32(v75));
}
loop {
let v76 = v62;
let v77 = 2i;
let v78 = v68;
let v79 = (f32(v77)*v78);
if (!((v76>=v79))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v80 = v68;
let v81 = 2i;
v68 = (v80*f32(v81));
let v82 = v69;
let v83 = 2i;
v69 = (v82*f32(v83));
}
return v69;
}
fn fn6(v182:f32,v183:f32)->f32 {
let v184 = v182;
let v185 = v183;
if ((v184>v185)) {
return v182;
}
return v183;
}
fn fn7(v187:f32,v188:f32)->f32 {
let v189 = v187;
let v190 = v188;
if ((v189<v190)) {
return v187;
}
return v188;
}
fn fn5(v176:f32,v177:f32,v178:f32)->f32 {
let v179 = v178;
let v180 = v177;
let v181 = v176;
let v186 = fn6(v180,v181);
return fn7(v179,v186);
}
fn fn4(v116:i32)->f32 {
let v117 = read_params(30i);
let v118 = 1i;
if ((v117==f32(v118))) {
return read_params(v116);
}
let v119 = v116;
let v120 = 11i;
var v123 = (v119==v120);
if (!v123) {
let v121 = v116;
let v122 = 17i;
v123 = (v121==v122);
}
var v126 = v123;
if (!v126) {
let v124 = v116;
let v125 = 18i;
v126 = (v124==v125);
}
var v129 = v126;
if (!v129) {
let v127 = v116;
let v128 = 21i;
v129 = (v127==v128);
}
var v132 = v129;
if (!v132) {
let v130 = v116;
let v131 = 30i;
v132 = (v130==v131);
}
var v135 = v132;
if (!v135) {
let v133 = v116;
let v134 = 31i;
v135 = (v133==v134);
}
var v138 = v135;
if (!v138) {
let v136 = v116;
let v137 = 32i;
v138 = (v136==v137);
}
if ((!v138)) {
return read_params(v116);
}
var v139: f32 = fn2();
let v140 = v116;
let v141 = 32i;
if ((v140==v141)) {
return v139;
}
let v142 = v116;
let v143 = 21i;
if ((v142==v143)) {
return read_params(11i);
}
var v144: f32 = read_params(15i);
var v145: f32 = read_params(16i);
let v146 = v139;
let v147 = v144;
let v148 = abs((v146-v147));
let v149 = v145;
if ((v148<=v149)) {
let v150 = v116;
let v151 = 30i;
if ((v150==v151)) {
return 1.0f;
}
return read_params(v116);
}
let v152 = read_params(31i);
if (!(abs(v152) < 2147483648.0f)) { vkf_failed = true; }
var v153: i32 = i32(v152);
let v154 = v153;
let v155 = 39i;
if ((v154>=v155)) {
if (!(false)) { vkf_failed = true; }
}
let v156 = v153;
let v157 = 0i;
var v160 = (v156==v157);
if (v160) {
let v158 = v139;
let v159 = 0i;
v160 = (v158>f32(v159));
}
if (v160) {
let v161 = v116;
let v162 = 11i;
if ((v161==v162)) {
let v163 = read_params(11i);
let v164 = 1i;
let v165 = v144;
let v166 = v139;
if (v166 == 0.0f) { vkf_failed = true; }
let v167 = (v165/v166);
let v168 = 1i;
let v169 = (v167-f32(v168));
let v170 = read_params(0i);
if (v170 == 0.0f) { vkf_failed = true; }
let v171 = (v169/v170);
let v172 = (f32(v164)+v171);
let v173 = (v163*v172);
let v174 = read_params(17i);
let v175 = read_params(18i);
return fn5(v173,v174,v175);
}
let v191 = v116;
let v192 = 31i;
if ((v191==v192)) {
return -1.0f;
}
return read_params(v116);
}
let v193 = v153;
let v194 = 0i;
var v197 = (v193<v194);
if (v197) {
let v195 = v153;
let v196 = -5i;
v197 = (v195>=v196);
}
var v202 = v197;
if (v202) {
let v198 = v139;
let v199 = read_params(32i);
let v200 = abs((v198-v199));
let v201 = 9.99999994e-09f;
v202 = (v200>v201);
}
if (v202) {
let v203 = v116;
let v204 = 11i;
if ((v203==v204)) {
let v205 = read_params(11i);
let v206 = v144;
let v207 = v139;
let v208 = (v206-v207);
let v209 = read_params(11i);
let v210 = read_params(21i);
let v211 = (v209-v210);
let v212 = (v208*v211);
let v213 = v139;
let v214 = read_params(32i);
let v215 = (v213-v214);
if (v215 == 0.0f) { vkf_failed = true; }
let v216 = (v212/v215);
let v217 = (v205+v216);
let v218 = read_params(17i);
let v219 = read_params(18i);
return fn5(v217,v218,v219);
}
let v220 = v116;
let v221 = 31i;
if ((v220==v221)) {
let v222 = v153;
let v223 = 1i;
return f32((v222-v223));
}
return read_params(v116);
}
let v224 = v153;
let v225 = 0i;
if ((v224<=v225)) {
let v226 = v116;
let v227 = 11i;
if ((v226==v227)) {
return read_params(17i);
}
let v228 = v116;
let v229 = 31i;
if ((v228==v229)) {
return 1.0f;
}
return read_params(v116);
}
let v230 = v153;
let v231 = 1i;
if ((v230==v231)) {
let v232 = v139;
let v233 = v144;
if (!((v232<=v233))) { vkf_failed = true; }
let v234 = v116;
let v235 = 11i;
if ((v234==v235)) {
let v236 = 1.0f;
let v237 = read_params(18i);
return fn7(v236,v237);
}
let v238 = v116;
let v239 = 31i;
if ((v238==v239)) {
return 2.0f;
}
return read_params(v116);
}
var v240: f32 = read_params(17i);
var v241: f32 = read_params(18i);
let v242 = v153;
let v243 = 2i;
if ((v242==v243)) {
let v244 = v139;
let v245 = v144;
if ((v244<v245)) {
let v246 = read_params(11i);
let v247 = v241;
if (!((v246<v247))) { vkf_failed = true; }
let v248 = v116;
let v249 = 17i;
if ((v248==v249)) {
return read_params(11i);
}
let v250 = v116;
let v251 = 11i;
if ((v250==v251)) {
let v252 = v241;
let v253 = read_params(11i);
let v254 = 1.25f;
let v255 = (v253*v254);
return fn7(v252,v255);
}
return read_params(v116);
}
let v256 = v116;
let v257 = 18i;
if ((v256==v257)) {
return read_params(11i);
}
let v258 = v116;
let v259 = 11i;
if ((v258==v259)) {
let v260 = v240;
let v261 = read_params(11i);
let v262 = (v260+v261);
let v263 = 2i;
if (f32(v263) == 0.0f) { vkf_failed = true; }
return (v262/f32(v263));
}
let v264 = v116;
let v265 = 31i;
if ((v264==v265)) {
return 3.0f;
}
return read_params(v116);
}
let v266 = v153;
let v267 = 2i;
if ((v266>v267)) {
let v268 = v139;
let v269 = v144;
if ((v268<v269)) {
v240 = read_params(11i);
}
let v270 = v139;
let v271 = v144;
if ((v270>=v271)) {
v241 = read_params(11i);
}
}
let v272 = v116;
let v273 = 11i;
if ((v272==v273)) {
let v274 = v240;
let v275 = v241;
let v276 = (v274+v275);
let v277 = 2i;
if (f32(v277) == 0.0f) { vkf_failed = true; }
return (v276/f32(v277));
}
let v278 = v116;
let v279 = 17i;
if ((v278==v279)) {
return v240;
}
let v280 = v116;
let v281 = 18i;
if ((v280==v281)) {
return v241;
}
let v282 = v116;
let v283 = 31i;
if ((v282==v283)) {
let v284 = v153;
let v285 = 1i;
return f32((v284+v285));
}
return read_params(v116);
}
fn fn1(v3:i32)->f32 {
let v4 = i32(arrayLength(&params));
let v5 = 54i;
if (!((v4==v5))) { vkf_failed = true; }
let v6 = read_params(30i);
let v7 = 1i;
if ((v6==f32(v7))) {
return read_params(v3);
}
var v17: f32 = fn2();
var v18: f32 = read_params(15i);
let v19 = read_params(31i);
if (!(abs(v19) < 2147483648.0f)) { vkf_failed = true; }
var v20: i32 = i32(v19);
var v21: f32 = read_params(17i);
var v22: f32 = read_params(18i);
var v23: f32 = read_params(52i);
var v24: f32 = read_params(53i);
let v25 = v20;
let v26 = 1i;
if ((v25==v26)) {
v23 = v17;
}
let v27 = v20;
let v28 = 2i;
if ((v27==v28)) {
let v29 = v17;
let v30 = v18;
if ((v29<v30)) {
v23 = v17;
}
let v31 = v17;
let v32 = v18;
if ((v31>=v32)) {
v24 = v17;
}
}
let v33 = v20;
let v34 = 2i;
if ((v33>v34)) {
let v35 = v17;
let v36 = v18;
if ((v35<v36)) {
v21 = read_params(11i);
v23 = v17;
}
let v37 = v17;
let v38 = v18;
if ((v37>=v38)) {
v22 = read_params(11i);
v24 = v17;
}
}
let v39 = v3;
let v40 = 52i;
if ((v39==v40)) {
return v23;
}
let v41 = v3;
let v42 = 53i;
if ((v41==v42)) {
return v24;
}
let v43 = v20;
let v44 = 2i;
var v47 = (v43>v44);
if (v47) {
let v45 = v23;
let v46 = v18;
v47 = (v45<=v46);
}
var v50 = v47;
if (v50) {
let v48 = v24;
let v49 = v18;
v50 = (v48>=v49);
}
var v53 = v50;
if (v53) {
let v51 = v24;
let v52 = v23;
v53 = (v51>v52);
}
var v85 = v53;
if (v85) {
let v54 = v22;
let v55 = v21;
let v56 = (v54-v55);
let v57 = v21;
let v58 = v22;
let v59 = (v57+v58);
let v60 = 2i;
if (f32(v60) == 0.0f) { vkf_failed = true; }
let v61 = (v59/f32(v60));
let v84 = fn3(v61);
v85 = (v56<=v84);
}
var v90 = v85;
if (v90) {
let v86 = v17;
let v87 = v18;
let v88 = abs((v86-v87));
let v89 = read_params(16i);
v90 = (v88>v89);
}
var v91: bool = v90;
if (v91) {
let v92 = v23;
let v93 = v18;
let v94 = abs((v92-v93));
let v95 = v24;
let v96 = v18;
let v97 = abs((v95-v96));
var v98: bool = (v94<=v97);
var v99: f32 = v22;
var v100: f32 = v24;
if (v98) {
v99 = v21;
v100 = v23;
}
let v101 = v3;
let v102 = 11i;
if ((v101==v102)) {
return v99;
}
let v103 = v3;
let v104 = 17i;
if ((v103==v104)) {
return v21;
}
let v105 = v3;
let v106 = 18i;
if ((v105==v106)) {
return v22;
}
let v107 = v3;
let v108 = 30i;
if ((v107==v108)) {
return 1.0f;
}
let v109 = v3;
let v110 = 32i;
if ((v109==v110)) {
return v100;
}
let v111 = v3;
let v112 = 38i;
if ((v111==v112)) {
return 1.0f;
}
return read_params(v3);
}
let v113 = v3;
let v114 = 38i;
if ((v113==v114)) {
return 0.0f;
}
let v115 = v3;
return fn4(v115);
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
