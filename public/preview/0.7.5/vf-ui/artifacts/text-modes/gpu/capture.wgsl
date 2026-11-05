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
fn fn1(v3:i32)->array<f32,10> {
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
let v11 = v7;
v12 = (v10<v11);
}
var v21 = v12;
if (v21) {
let v13 = i32(arrayLength(&values));
let v14 = 11i;
let v15 = v5;
let v16 = (v14*v15);
let v17 = 7i;
let v18 = v7;
let v19 = (v17*v18);
let v20 = (v16+v19);
v21 = (v13==v20);
}
if (!(v21)) { vkf_failed = true; }
var v22: f32 = 0.0f;
var v23: f32 = 0.0f;
var v24: f32 = 0.0f;
var v25: f32 = 0.0f;
var v26: f32 = 0.0f;
var v27: i32 = 0i;
loop {
let v28 = v27;
let v29 = v5;
if (!((v28<v29))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v30 = 11i;
let v31 = v27;
let v32 = (v30*v31);
let v33 = 9i;
let v34 = read_values((v32+v33));
if (!(abs(v34) < 2147483648.0f)) { vkf_failed = true; }
let v35 = i32(v34);
let v36 = v3;
if ((v35==v36)) {
let v37 = 11i;
let v38 = v27;
let v39 = (v37*v38);
let v40 = 7i;
var v41: f32 = read_values((v39+v40));
let v42 = 11i;
let v43 = v27;
let v44 = (v42*v43);
let v45 = 8i;
var v46: f32 = read_values((v44+v45));
let v47 = v24;
let v48 = v41;
v24 = (v47+v48);
let v49 = v22;
let v50 = v41;
let v51 = read_params(1i);
let v52 = (v50*v51);
let v53 = 1i;
let v54 = v46;
let v55 = (f32(v53)-v54);
let v56 = (v52*v55);
v22 = (v49+v56);
let v57 = v23;
let v58 = v41;
let v59 = read_params(1i);
let v60 = (v58*v59);
let v61 = v46;
let v62 = (v60*v61);
v23 = (v57+v62);
let v63 = v25;
let v64 = 11i;
let v65 = v27;
let v66 = (v64*v65);
let v67 = 2i;
let v68 = read_values((v66+v67));
let v69 = 11i;
let v70 = v27;
let v71 = (v69*v70);
let v72 = 3i;
let v73 = read_values((v71+v72));
let v74 = 2i;
let v75 = vkf_powi(v73,v74);
let v76 = (v68*v75);
v25 = (v63+v76);
let v77 = v26;
let v78 = 11i;
let v79 = v27;
let v80 = (v78*v79);
let v81 = 10i;
let v82 = read_values((v80+v81));
let v83 = 11i;
let v84 = v27;
let v85 = (v83*v84);
let v86 = 3i;
let v87 = read_values((v85+v86));
let v88 = 2i;
let v89 = vkf_powi(v87,v88);
let v90 = (v82*v89);
v26 = (v77+v90);
}
let v91 = v27;
let v92 = 1i;
v27 = (v91+v92);
}
var v93: f32 = 0.0f;
let v94 = v24;
let v95 = 0i;
if ((v94>f32(v95))) {
let v96 = v23;
let v97 = v24;
if (v97 == 0.0f) { vkf_failed = true; }
let v98 = (v96/v97);
let v99 = 11i;
let v100 = v5;
let v101 = (v99*v100);
let v102 = 7i;
let v103 = v3;
let v104 = (v102*v103);
let v105 = (v101+v104);
let v106 = 6i;
let v107 = read_values((v105+v106));
v93 = (v98*v107);
}
let v108 = v93;
let v109 = f32(1i);
let v110 = 11i;
let v111 = v5;
let v112 = (v110*v111);
let v113 = 7i;
let v114 = v3;
let v115 = (v113*v114);
let v116 = (v112+v115);
let v117 = 3i;
let v118 = read_values((v116+v117));
let v119 = 11i;
let v120 = v5;
let v121 = (v119*v120);
let v122 = 7i;
let v123 = v3;
let v124 = (v122*v123);
let v125 = (v121+v124);
let v126 = 4i;
let v127 = read_values((v125+v126));
let v128 = 11i;
let v129 = v5;
let v130 = (v128*v129);
let v131 = 7i;
let v132 = v3;
let v133 = (v131*v132);
let v134 = (v130+v133);
let v135 = 5i;
let v136 = read_values((v134+v135));
let v137 = v22;
let v138 = v23;
let v139 = v24;
let v140 = v25;
let v141 = v26;
return array<f32,10>(v108,v109,v118,v127,v136,v137,v138,v139,v140,v141);
}
fn fn0(v1:i32)->array<f32,10> {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/10u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
for(var i=0u;i<10u;i+=1u){if(!(abs(value[i])<=3.402823466e+38f)){vkf_failed=true;}}
for(var i=0u;i<10u;i+=1u){results[gid.x*10u+i]=select(value[i],0.0f,vkf_failed);}atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/10u)],1u);}
}
