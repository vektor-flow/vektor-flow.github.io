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
fn fn3(v99:i32,v100:i32)->i32 {
let v101 = v99;
let v102 = v100;
if ((v101<v102)) {
return v99;
}
return v100;
}
fn fn1(v3:i32)->array<f32,5> {
var v67: i32 = fn2();
let v68 = read_params(1i);
if (!(abs(v68) < 2147483648.0f)) { vkf_failed = true; }
var v69: i32 = i32(v68);
let v70 = v67;
let v71 = 4095i;
let v72 = (v70+v71);
let v73 = 4096i;
if (f32(v73) == 0.0f) { vkf_failed = true; }
var v74: i32 = i32(floor(f32(v72)/f32(v73)));
let v75 = i32(arrayLength(&values));
let v76 = 6i;
let v77 = v67;
let v78 = (v76*v77);
var v81 = (v75==v78);
if (v81) {
let v79 = v3;
let v80 = 0i;
v81 = (v79>=v80);
}
var v86 = v81;
if (v86) {
let v82 = v3;
let v83 = v69;
let v84 = v74;
let v85 = (v83*v84);
v86 = (v82<v85);
}
if (!(v86)) { vkf_failed = true; }
let v87 = v3;
let v88 = v69;
if (f32(v88) == 0.0f) { vkf_failed = true; }
var v89: i32 = i32(floor(f32(v87)/f32(v88)));
let v90 = v3;
let v91 = v69;
if (v91 == 0i) { vkf_failed = true; }
var v92: i32 = (v90%v91);
let v93 = v67;
let v94 = v89;
let v95 = 1i;
let v96 = (v94+v95);
let v97 = 4096i;
let v98 = (v96*v97);
var v103: i32 = fn3(v93,v98);
let v104 = v89;
let v105 = 4096i;
var v106: i32 = (v104*v105);
let v107 = f32(0i);
let v108 = f32(0i);
let v109 = f32(0i);
let v110 = f32(0i);
let v111 = f32(0i);
var v112: array<f32,5> = array<f32,5>(v107,v108,v109,v110,v111);
let v113 = f32(0i);
let v114 = f32(0i);
let v115 = f32(0i);
let v116 = f32(0i);
let v117 = f32(0i);
var v118: array<f32,5> = array<f32,5>(v113,v114,v115,v116,v117);
loop {
let v119 = v106;
let v120 = v103;
if (!((v119<v120))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v121 = 6i;
let v122 = v106;
let v123 = read_values((v121*v122));
let v124 = v92;
let v125 = f32(v124);
if ((v123==v125)) {
var v126: i32 = 0i;
loop {
let v127 = v126;
let v128 = 5i;
if (!((v127<v128))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v129 = 6i;
let v130 = v106;
let v131 = (v129*v130);
let v132 = 1i;
let v133 = (v131+v132);
let v134 = v126;
let v135 = read_values((v133+v134));
let v136 = v126;
if (v136<0i || v136>=5i) { vkf_failed=true; }
let v137 = v118[u32(clamp(v136,0i,5i-1i))];
var v138: f32 = (v135-v137);
let v139 = v126;
if (v139<0i || v139>=5i) { vkf_failed=true; }
let v140 = v112[u32(clamp(v139,0i,5i-1i))];
let v141 = v138;
var v142: f32 = (v140+v141);
let v143 = v126;
let v144 = v142;
let v145 = v126;
if (v145<0i || v145>=5i) { vkf_failed=true; }
let v146 = v112[u32(clamp(v145,0i,5i-1i))];
let v147 = (v144-v146);
let v148 = v138;
if (v143<0i || v143>=5i) { vkf_failed=true; } else { v118[u32(v143)]=(v147-v148); }
let v149 = v126;
if (v149<0i || v149>=5i) { vkf_failed=true; } else { v112[u32(v149)]=v142; }
let v150 = v126;
let v151 = 1i;
v126 = (v150+v151);
}
}
let v152 = v106;
let v153 = 1i;
v106 = (v152+v153);
}
return v112;
}
fn fn0(v1:i32)->array<f32,5> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/5u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<5u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<5u;i+=1u){results[gid.x*5u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/5u)],1u);}
}
