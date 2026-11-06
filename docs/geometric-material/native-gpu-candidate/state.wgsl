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
fn fn4(v86:f32,v87:f32,v88:f32,v89:f32,v90:f32,v91:f32)->f32 {
let v92 = 1i;
let v93 = v91;
var v94: f32 = (f32(v92)-v93);
let v95 = v94;
let v96 = v86;
let v97 = (v95*v96);
let v98 = v91;
let v99 = v87;
let v100 = (v98*v99);
let v101 = (v97+v100);
let v102 = v94;
let v103 = 3i;
let v104 = vkf_powi(v102,v103);
let v105 = v94;
let v106 = (v104-v105);
let v107 = v88;
let v108 = (v106*v107);
let v109 = v91;
let v110 = 3i;
let v111 = vkf_powi(v109,v110);
let v112 = v91;
let v113 = (v111-v112);
let v114 = v89;
let v115 = (v113*v114);
let v116 = (v108+v115);
let v117 = v90;
let v118 = (v116*v117);
let v119 = v90;
let v120 = (v118*v119);
let v121 = 6i;
if (f32(v121) == 0.0f) { vkf_failed = true; }
let v122 = (v120/f32(v121));
return (v101+v122);
}
fn fn3(v44:i32,v45:i32,v46:i32,v47:f32,v48:f32,v49:i32)->f32 {
let v50 = v46;
let v51 = v44;
let v52 = (v50*v51);
let v53 = v49;
var v54: i32 = (v52+v53);
let v55 = v54;
let v56 = v44;
var v57: i32 = (v55+v56);
var v58: i32 = v45;
let v59 = v45;
let v60 = 0i;
if ((v59<v60)) {
v58 = (-v45);
}
let v61 = v58;
let v62 = v44;
var v63: i32 = (v61*v62);
var v64: i32 = v54;
let v65 = v45;
let v66 = 0i;
if ((v65<v66)) {
let v67 = 2i;
let v68 = v46;
let v69 = (v67*v68);
let v70 = v44;
let v71 = (v69*v70);
let v72 = v49;
v64 = (v71+v72);
}
let v73 = v64;
let v74 = v44;
var v75: i32 = (v73+v74);
let v76 = read_values(v54);
let v77 = read_values(v57);
let v78 = v63;
let v79 = v64;
let v80 = read_values((v78+v79));
let v81 = v63;
let v82 = v75;
let v83 = read_values((v81+v82));
let v84 = v47;
let v85 = v48;
return fn4(v76,v77,v80,v83,v84,v85);
}
fn fn2(v9:i32)->f32 {
let v10 = read_params(2i);
if (!(abs(v10) < 2147483648.0f)) { vkf_failed = true; }
var v11: i32 = i32(v10);
let v12 = read_params(1i);
if (!(abs(v12) < 2147483648.0f)) { vkf_failed = true; }
var v13: i32 = i32(v12);
let v14 = v13;
let v15 = v13;
var v16: i32 = (v14*v15);
let v17 = v9;
let v18 = v11;
if (f32(v18) == 0.0f) { vkf_failed = true; }
var v19: i32 = i32(floor(f32(v17)/f32(v18)));
let v20 = v9;
let v21 = v11;
if (v21 == 0i) { vkf_failed = true; }
var v22: i32 = (v20%v21);
let v23 = v22;
let v24 = 4i;
if ((v23<v24)) {
let v25 = read_params(39i);
if (!(abs(v25) < 2147483648.0f)) { vkf_failed = true; }
let v26 = i32(v25);
let v27 = read_params(24i);
if (!(abs(v27) < 2147483648.0f)) { vkf_failed = true; }
let v28 = i32(v27);
let v29 = read_params(21i);
if (!(abs(v29) < 2147483648.0f)) { vkf_failed = true; }
let v30 = i32(v29);
let v31 = read_params(23i);
let v32 = read_params(22i);
let v33 = 4i;
let v34 = v19;
let v35 = (v33*v34);
let v36 = v22;
let v37 = (v35+v36);
let v38 = v26;
let v39 = v28;
let v40 = v30;
let v41 = v31;
let v42 = v32;
let v43 = v37;
return fn3(v38,v39,v40,v41,v42,v43);
}
var v123: f32 = read_params(40i);
let v124 = v22;
let v125 = 4i;
let v126 = v16;
let v127 = (v125+v126);
if ((v124<v127)) {
let v128 = v22;
let v129 = 4i;
var v130: i32 = (v128-v129);
let v131 = read_params(43i);
if (!(abs(v131) < 2147483648.0f)) { vkf_failed = true; }
let v132 = i32(v131);
let v133 = v130;
var v134: f32 = read_values((v132+v133));
let v135 = read_params(44i);
if (!(abs(v135) < 2147483648.0f)) { vkf_failed = true; }
let v136 = i32(v135);
let v137 = v19;
var v138: f32 = read_values((v136+v137));
let v139 = read_params(45i);
if (!(abs(v139) < 2147483648.0f)) { vkf_failed = true; }
let v140 = i32(v139);
let v141 = v19;
var v142: f32 = read_values((v140+v141));
let v143 = v123;
let v144 = v138;
if ((v143<v144)) {
let v145 = read_params(41i);
if (!(abs(v145) < 2147483648.0f)) { vkf_failed = true; }
let v146 = i32(v145);
let v147 = v19;
let v148 = 3i;
let v149 = (v147*v148);
let v150 = v16;
let v151 = (v149*v150);
let v152 = (v146+v151);
let v153 = v130;
var v154: i32 = (v152+v153);
let v155 = read_values(v154);
let v156 = v134;
let v157 = v154;
let v158 = v16;
let v159 = read_values((v157+v158));
let v160 = v154;
let v161 = 2i;
let v162 = v16;
let v163 = (v161*v162);
let v164 = read_values((v160+v163));
let v165 = v138;
let v166 = v123;
let v167 = v138;
if (v167 == 0.0f) { vkf_failed = true; }
let v168 = (v166/v167);
return fn4(v155,v156,v159,v164,v165,v168);
}
let v169 = v123;
let v170 = v142;
if ((v169>v170)) {
let v171 = read_params(42i);
if (!(abs(v171) < 2147483648.0f)) { vkf_failed = true; }
let v172 = i32(v171);
let v173 = v19;
let v174 = 3i;
let v175 = (v173*v174);
let v176 = v16;
let v177 = (v175*v176);
let v178 = (v172+v177);
let v179 = v130;
var v180: i32 = (v178+v179);
let v181 = 1i;
let v182 = v142;
var v183: f32 = (f32(v181)-v182);
let v184 = v134;
let v185 = read_values(v180);
let v186 = v180;
let v187 = v16;
let v188 = read_values((v186+v187));
let v189 = v180;
let v190 = 2i;
let v191 = v16;
let v192 = (v190*v191);
let v193 = read_values((v189+v192));
let v194 = v183;
let v195 = v123;
let v196 = v142;
let v197 = (v195-v196);
let v198 = v183;
if (v198 == 0.0f) { vkf_failed = true; }
let v199 = (v197/v198);
return fn4(v184,v185,v188,v193,v194,v199);
}
return v134;
}
let v200 = v22;
let v201 = 4i;
let v202 = (v200-v201);
let v203 = v16;
var v204: i32 = (v202-v203);
let v205 = read_params(46i);
if (!(abs(v205) < 2147483648.0f)) { vkf_failed = true; }
let v206 = i32(v205);
let v207 = 4i;
let v208 = v19;
let v209 = (v207*v208);
let v210 = (v206+v209);
let v211 = v204;
var v212: f32 = read_values((v210+v211));
let v213 = read_params(47i);
if (!(abs(v213) < 2147483648.0f)) { vkf_failed = true; }
let v214 = i32(v213);
let v215 = 4i;
let v216 = v19;
let v217 = (v215*v216);
let v218 = (v214+v217);
let v219 = v204;
var v220: f32 = read_values((v218+v219));
let v221 = v212;
let v222 = v220;
let v223 = 0.0f;
let v224 = 0.0f;
let v225 = 1.0f;
let v226 = v123;
return fn4(v221,v222,v223,v224,v225,v226);
}
fn fn1(v3:i32)->f32 {
let v4 = i32(arrayLength(&params));
let v5 = 37i;
if ((v4>v5)) {
let v6 = read_params(37i);
let v7 = 1i;
if ((v6==f32(v7))) {
let v8 = v3;
return fn2(v8);
}
}
let v227 = read_params(25i);
if (!(abs(v227) < 2147483648.0f)) { vkf_failed = true; }
let v228 = i32(v227);
let v229 = read_params(24i);
if (!(abs(v229) < 2147483648.0f)) { vkf_failed = true; }
let v230 = i32(v229);
let v231 = read_params(21i);
if (!(abs(v231) < 2147483648.0f)) { vkf_failed = true; }
let v232 = i32(v231);
let v233 = read_params(23i);
let v234 = read_params(22i);
let v235 = v3;
let v236 = v228;
let v237 = v230;
let v238 = v232;
let v239 = v233;
let v240 = v234;
let v241 = v235;
return fn3(v236,v237,v238,v239,v240,v241);
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
