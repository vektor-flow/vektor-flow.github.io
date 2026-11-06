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
let v5 = 7i;
if (!((v4==v5))) { vkf_failed = true; }
let v6 = read_params(0i);
let v7 = 1i;
var v10 = (v6>=f32(v7));
if (v10) {
let v8 = read_params(0i);
let v9 = 131072i;
v10 = (v8<=f32(v9));
}
var v13 = v10;
if (v13) {
let v11 = read_params(1i);
let v12 = 1i;
v13 = (v11>=f32(v12));
}
var v16 = v13;
if (v16) {
let v14 = read_params(1i);
let v15 = 65536i;
v16 = (v14<=f32(v15));
}
var v21 = v16;
if (v21) {
let v17 = read_params(0i);
let v18 = read_params(1i);
let v19 = (v17*v18);
let v20 = 64000000.0f;
v21 = (v19<=v20);
}
var v24 = v21;
if (v24) {
let v22 = read_params(2i);
let v23 = 0i;
v24 = (v22>=f32(v23));
}
var v27 = v24;
if (v27) {
let v25 = read_params(2i);
let v26 = 16777215.0f;
v27 = (v25<=v26);
}
var v30 = v27;
if (v30) {
let v28 = read_params(3i);
let v29 = 1i;
v30 = (v28>=f32(v29));
}
var v33 = v30;
if (v33) {
let v31 = read_params(3i);
let v32 = 4096i;
v33 = (v31<=f32(v32));
}
var v36 = v33;
if (v36) {
let v34 = read_params(4i);
let v35 = 1i;
v36 = (v34>=f32(v35));
}
var v39 = v36;
if (v39) {
let v37 = read_params(4i);
let v38 = 4096i;
v39 = (v37<=f32(v38));
}
var v44 = v39;
if (v44) {
let v40 = read_params(3i);
let v41 = read_params(4i);
let v42 = (v40*v41);
let v43 = 4194304.0f;
v44 = (v42<=v43);
}
var v47 = v44;
if (v47) {
let v45 = read_params(5i);
let v46 = 0i;
v47 = (v45>f32(v46));
}
var v50 = v47;
if (v50) {
let v48 = read_params(6i);
let v49 = 0i;
v50 = (v48>f32(v49));
}
var v53 = v50;
if (v53) {
let v51 = read_params(5i);
let v52 = 1e+10f;
v53 = (v51<v52);
}
var v56 = v53;
if (v56) {
let v54 = read_params(6i);
let v55 = 1e+10f;
v56 = (v54<v55);
}
if (!(v56)) { vkf_failed = true; }
var v57: i32 = 0i;
loop {
let v58 = v57;
let v59 = 5i;
if (!((v58<v59))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v60 = read_params(v57);
let v61 = read_params(v57);
if (!(abs(v61) < 2147483648.0f)) { vkf_failed = true; }
let v62 = i32(v61);
let v63 = f32(v62);
if (!((v60==v63))) { vkf_failed = true; }
let v64 = v57;
let v65 = 1i;
v57 = (v64+v65);
}
let v66 = read_params(0i);
if (!(abs(v66) < 2147483648.0f)) { vkf_failed = true; }
return i32(v66);
}
fn fn1(v3:i32)->array<f32,6> {
var v67: i32 = fn2();
let v68 = read_params(1i);
if (!(abs(v68) < 2147483648.0f)) { vkf_failed = true; }
var v69: i32 = i32(v68);
let v70 = i32(arrayLength(&values));
let v71 = 24i;
let v72 = v67;
let v73 = (v71*v72);
let v74 = 2i;
let v75 = v69;
let v76 = (v74*v75);
let v77 = (v73+v76);
var v80 = (v70==v77);
if (v80) {
let v78 = v3;
let v79 = 0i;
v80 = (v78>=v79);
}
var v83 = v80;
if (v83) {
let v81 = v3;
let v82 = v67;
v83 = (v81<v82);
}
if (!(v83)) { vkf_failed = true; }
let v84 = f32(0i);
let v85 = f32(0i);
let v86 = f32(0i);
let v87 = f32(0i);
let v88 = f32(0i);
let v89 = f32(0i);
var v90: array<f32,6> = array<f32,6>(v84,v85,v86,v87,v88,v89);
let v91 = 0i;
if (v91<0i || v91>=6i) { vkf_failed=true; } else { v90[u32(v91)]=f32(-1i); }
let v92 = 20i;
let v93 = v3;
var v94: i32 = (v92*v93);
let v95 = v94;
let v96 = 16i;
var v97: f32 = read_values((v95+v96));
let v98 = 20i;
let v99 = v67;
let v100 = (v98*v99);
let v101 = v3;
var v102: f32 = read_values((v100+v101));
let v103 = v97;
let v104 = 0i;
var v107 = (v103==f32(v104));
if (!v107) {
let v105 = v97;
let v106 = 1i;
v107 = (v105==f32(v106));
}
var v110 = v107;
if (v110) {
let v108 = v102;
let v109 = -1i;
v110 = (v108>=f32(v109));
}
var v113 = v110;
if (v113) {
let v111 = v102;
let v112 = 16777215.0f;
v113 = (v111<=v112);
}
var v118 = v113;
if (v118) {
let v114 = v102;
let v115 = v102;
if (!(abs(v115) < 2147483648.0f)) { vkf_failed = true; }
let v116 = i32(v115);
let v117 = f32(v116);
v118 = (v114==v117);
}
if (!(v118)) { vkf_failed = true; }
let v119 = v97;
let v120 = 0i;
var v123 = (v119==f32(v120));
if (v123) {
let v121 = v102;
let v122 = read_params(2i);
v123 = (v121==v122);
}
if ((!v123)) {
return v90;
}
let v124 = 21i;
let v125 = v67;
let v126 = (v124*v125);
let v127 = 2i;
let v128 = v3;
let v129 = (v127*v128);
var v130: f32 = read_values((v126+v129));
let v131 = 21i;
let v132 = v67;
let v133 = (v131*v132);
let v134 = 2i;
let v135 = v3;
let v136 = (v134*v135);
let v137 = (v133+v136);
let v138 = 1i;
var v139: f32 = read_values((v137+v138));
let v140 = v130;
let v141 = 0i;
var v144 = (v140>=f32(v141));
if (v144) {
let v142 = v130;
let v143 = read_params(3i);
v144 = (v142<v143);
}
var v147 = v144;
if (v147) {
let v145 = v139;
let v146 = 0i;
v147 = (v145>=f32(v146));
}
var v150 = v147;
if (v150) {
let v148 = v139;
let v149 = read_params(4i);
v150 = (v148<v149);
}
var v155 = v150;
if (v155) {
let v151 = v130;
let v152 = v130;
if (!(abs(v152) < 2147483648.0f)) { vkf_failed = true; }
let v153 = i32(v152);
let v154 = f32(v153);
v155 = (v151==v154);
}
var v160 = v155;
if (v160) {
let v156 = v139;
let v157 = v139;
if (!(abs(v157) < 2147483648.0f)) { vkf_failed = true; }
let v158 = i32(v157);
let v159 = f32(v158);
v160 = (v156==v159);
}
if (!(v160)) { vkf_failed = true; }
let v161 = v130;
let v162 = read_params(3i);
let v163 = v139;
let v164 = (v162*v163);
var v165: f32 = (v161+v164);
var v166: i32 = 0i;
var v167: i32 = v69;
loop {
let v168 = v166;
let v169 = v167;
if (!((v168<v169))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v170 = v166;
let v171 = v167;
let v172 = (v170+v171);
let v173 = 2i;
if (f32(v173) == 0.0f) { vkf_failed = true; }
var v174: i32 = i32(floor(f32(v172)/f32(v173)));
let v175 = 24i;
let v176 = v67;
let v177 = (v175*v176);
let v178 = 2i;
let v179 = v174;
let v180 = (v178*v179);
let v181 = read_values((v177+v180));
let v182 = v165;
if ((v181<v182)) {
let v183 = v174;
let v184 = 1i;
v166 = (v183+v184);
}
let v185 = 24i;
let v186 = v67;
let v187 = (v185*v186);
let v188 = 2i;
let v189 = v174;
let v190 = (v188*v189);
let v191 = read_values((v187+v190));
let v192 = v165;
if ((!(v191<v192))) {
v167 = v174;
}
}
let v193 = v166;
let v194 = v69;
if (!((v193<v194))) { vkf_failed = true; }
let v195 = 24i;
let v196 = v67;
let v197 = (v195*v196);
let v198 = 2i;
let v199 = v166;
let v200 = (v198*v199);
let v201 = read_values((v197+v200));
let v202 = v165;
var v213 = (v201==v202);
if (v213) {
let v203 = 24i;
let v204 = v67;
let v205 = (v203*v204);
let v206 = 2i;
let v207 = v166;
let v208 = (v206*v207);
let v209 = (v205+v208);
let v210 = 1i;
let v211 = read_values((v209+v210));
let v212 = 0i;
v213 = (v211>f32(v212));
}
var v224 = v213;
if (v224) {
let v214 = 24i;
let v215 = v67;
let v216 = (v214*v215);
let v217 = 2i;
let v218 = v166;
let v219 = (v217*v218);
let v220 = (v216+v219);
let v221 = 1i;
let v222 = read_values((v220+v221));
let v223 = 1i;
v224 = (v222<=f32(v223));
}
if (!(v224)) { vkf_failed = true; }
let v225 = v94;
let v226 = 9i;
var v227: f32 = read_values((v225+v226));
let v228 = 23i;
let v229 = v67;
let v230 = (v228*v229);
let v231 = v3;
var v232: f32 = read_values((v230+v231));
let v233 = v94;
let v234 = 13i;
var v235: f32 = read_values((v233+v234));
let v236 = v227;
let v237 = 0i;
var v240 = (v236>f32(v237));
if (v240) {
let v238 = v227;
let v239 = 1.00000002e+30f;
v240 = (v238<v239);
}
var v243 = v240;
if (v243) {
let v241 = v232;
let v242 = 0i;
v243 = (v241>f32(v242));
}
var v246 = v243;
if (v246) {
let v244 = v232;
let v245 = 1i;
v246 = (v244<=f32(v245));
}
var v249 = v246;
if (v249) {
let v247 = v235;
let v248 = 0i;
v249 = (v247>=f32(v248));
}
var v254 = v249;
if (v254) {
let v250 = v235;
let v251 = v232;
let v252 = 1.00000095f;
let v253 = (v251*v252);
v254 = (v250<=v253);
}
if (!(v254)) { vkf_failed = true; }
let v255 = 0i;
let v256 = v166;
if (v255<0i || v255>=6i) { vkf_failed=true; } else { v90[u32(v255)]=f32(v256); }
var v257: i32 = 0i;
loop {
let v258 = v257;
let v259 = 3i;
if (!((v258<v259))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v260 = v94;
let v261 = 10i;
let v262 = (v260+v261);
let v263 = v257;
var v264: f32 = read_values((v262+v263));
let v265 = v264;
let v266 = 0i;
var v269 = (v265>=f32(v266));
if (v269) {
let v267 = v264;
let v268 = 1i;
v269 = (v267<=f32(v268));
}
if (!(v269)) { vkf_failed = true; }
let v270 = 1i;
let v271 = v257;
let v272 = (v270+v271);
let v273 = v227;
let v274 = v264;
if (v272<0i || v272>=6i) { vkf_failed=true; } else { v90[u32(v272)]=(v273*v274); }
let v275 = v257;
let v276 = 1i;
v257 = (v275+v276);
}
let v277 = 4i;
if (v277<0i || v277>=6i) { vkf_failed=true; } else { v90[u32(v277)]=v227; }
let v278 = 5i;
let v279 = v227;
let v280 = v235;
let v281 = v232;
if (v281 == 0.0f) { vkf_failed = true; }
let v282 = (v280/v281);
if (v278<0i || v278>=6i) { vkf_failed=true; } else { v90[u32(v278)]=(v279*v282); }
return v90;
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
