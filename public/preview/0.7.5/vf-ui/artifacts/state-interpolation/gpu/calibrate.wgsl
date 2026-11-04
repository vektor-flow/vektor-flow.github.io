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
var v26: i32 = i32(arrayLength(&values));
var v27: f32 = 0.0f;
var v28: i32 = 0i;
loop {
let v29 = v28;
let v30 = v26;
if (!((v29<v30))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v31 = v27;
let v32 = read_values(v28);
v27 = (v31+v32);
let v33 = v28;
let v34 = 1i;
v28 = (v33+v34);
}
return v27;
}
fn fn4(v78:f32,v79:f32)->f32 {
let v80 = v78;
let v81 = v79;
if ((v80>v81)) {
return v78;
}
return v79;
}
fn fn5(v83:f32,v84:f32)->f32 {
let v85 = v83;
let v86 = v84;
if ((v85<v86)) {
return v83;
}
return v84;
}
fn fn3(v72:f32,v73:f32,v74:f32)->f32 {
let v75 = v74;
let v76 = v73;
let v77 = v72;
let v82 = fn4(v76,v77);
return fn5(v75,v82);
}
fn fn1(v3:i32)->f32 {
let v4 = read_params(30i);
let v5 = 1i;
if ((v4==f32(v5))) {
return read_params(v3);
}
let v6 = v3;
let v7 = 11i;
var v10 = (v6==v7);
if (!v10) {
let v8 = v3;
let v9 = 17i;
v10 = (v8==v9);
}
var v13 = v10;
if (!v13) {
let v11 = v3;
let v12 = 18i;
v13 = (v11==v12);
}
var v16 = v13;
if (!v16) {
let v14 = v3;
let v15 = 21i;
v16 = (v14==v15);
}
var v19 = v16;
if (!v19) {
let v17 = v3;
let v18 = 30i;
v19 = (v17==v18);
}
var v22 = v19;
if (!v22) {
let v20 = v3;
let v21 = 31i;
v22 = (v20==v21);
}
var v25 = v22;
if (!v25) {
let v23 = v3;
let v24 = 32i;
v25 = (v23==v24);
}
if ((!v25)) {
return read_params(v3);
}
var v35: f32 = fn2();
let v36 = v3;
let v37 = 32i;
if ((v36==v37)) {
return v35;
}
let v38 = v3;
let v39 = 21i;
if ((v38==v39)) {
return read_params(11i);
}
var v40: f32 = read_params(15i);
var v41: f32 = read_params(16i);
let v42 = v35;
let v43 = v40;
let v44 = abs((v42-v43));
let v45 = v41;
if ((v44<=v45)) {
let v46 = v3;
let v47 = 30i;
if ((v46==v47)) {
return 1.0f;
}
return read_params(v3);
}
let v48 = read_params(31i);
if (!(abs(v48) < 2147483648.0f)) { vkf_failed = true; }
var v49: i32 = i32(v48);
let v50 = v49;
let v51 = 39i;
if ((v50>=v51)) {
if (!(false)) { vkf_failed = true; }
}
let v52 = v49;
let v53 = 0i;
var v56 = (v52==v53);
if (v56) {
let v54 = v35;
let v55 = 0i;
v56 = (v54>f32(v55));
}
if (v56) {
let v57 = v3;
let v58 = 11i;
if ((v57==v58)) {
let v59 = read_params(11i);
let v60 = 1i;
let v61 = v40;
let v62 = v35;
if (v62 == 0.0f) { vkf_failed = true; }
let v63 = (v61/v62);
let v64 = 1i;
let v65 = (v63-f32(v64));
let v66 = read_params(0i);
if (v66 == 0.0f) { vkf_failed = true; }
let v67 = (v65/v66);
let v68 = (f32(v60)+v67);
let v69 = (v59*v68);
let v70 = read_params(17i);
let v71 = read_params(18i);
return fn3(v69,v70,v71);
}
let v87 = v3;
let v88 = 31i;
if ((v87==v88)) {
return -1.0f;
}
return read_params(v3);
}
let v89 = v49;
let v90 = 0i;
var v93 = (v89<v90);
if (v93) {
let v91 = v49;
let v92 = -5i;
v93 = (v91>=v92);
}
var v98 = v93;
if (v98) {
let v94 = v35;
let v95 = read_params(32i);
let v96 = abs((v94-v95));
let v97 = 9.99999994e-09f;
v98 = (v96>v97);
}
if (v98) {
let v99 = v3;
let v100 = 11i;
if ((v99==v100)) {
let v101 = read_params(11i);
let v102 = v40;
let v103 = v35;
let v104 = (v102-v103);
let v105 = read_params(11i);
let v106 = read_params(21i);
let v107 = (v105-v106);
let v108 = (v104*v107);
let v109 = v35;
let v110 = read_params(32i);
let v111 = (v109-v110);
if (v111 == 0.0f) { vkf_failed = true; }
let v112 = (v108/v111);
let v113 = (v101+v112);
let v114 = read_params(17i);
let v115 = read_params(18i);
return fn3(v113,v114,v115);
}
let v116 = v3;
let v117 = 31i;
if ((v116==v117)) {
let v118 = v49;
let v119 = 1i;
return f32((v118-v119));
}
return read_params(v3);
}
let v120 = v49;
let v121 = 0i;
if ((v120<=v121)) {
let v122 = v3;
let v123 = 11i;
if ((v122==v123)) {
return read_params(17i);
}
let v124 = v3;
let v125 = 31i;
if ((v124==v125)) {
return 1.0f;
}
return read_params(v3);
}
let v126 = v49;
let v127 = 1i;
if ((v126==v127)) {
let v128 = v35;
let v129 = v40;
if (!((v128<=v129))) { vkf_failed = true; }
let v130 = v3;
let v131 = 11i;
if ((v130==v131)) {
return read_params(18i);
}
let v132 = v3;
let v133 = 31i;
if ((v132==v133)) {
return 2.0f;
}
return read_params(v3);
}
var v134: f32 = read_params(17i);
var v135: f32 = read_params(18i);
let v136 = v49;
let v137 = 2i;
if ((v136==v137)) {
let v138 = v35;
let v139 = v40;
if (!((v138>=v139))) { vkf_failed = true; }
}
let v140 = v49;
let v141 = 2i;
if ((v140>v141)) {
let v142 = v35;
let v143 = v40;
if ((v142<v143)) {
v134 = read_params(11i);
}
let v144 = v35;
let v145 = v40;
if ((v144>=v145)) {
v135 = read_params(11i);
}
}
let v146 = v3;
let v147 = 11i;
if ((v146==v147)) {
let v148 = v134;
let v149 = v135;
let v150 = (v148+v149);
let v151 = 2i;
if (f32(v151) == 0.0f) { vkf_failed = true; }
return (v150/f32(v151));
}
let v152 = v3;
let v153 = 17i;
if ((v152==v153)) {
return v134;
}
let v154 = v3;
let v155 = 18i;
if ((v154==v155)) {
return v135;
}
let v156 = v3;
let v157 = 31i;
if ((v156==v157)) {
let v158 = v49;
let v159 = 1i;
return f32((v158+v159));
}
return read_params(v3);
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
