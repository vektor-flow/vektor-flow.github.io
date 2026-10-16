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
var v23: i32 = i32(arrayLength(&values));
var v24: f32 = 0.0f;
var v25: i32 = 0i;
loop {
let v26 = v25;
let v27 = v23;
if (!((v26<v27))) { break; }
if (vkf_ticks >= 65536u) { vkf_failed = true; break; }
vkf_ticks += 1u;
let v28 = v24;
let v29 = read_values(v25);
v24 = (v28+v29);
let v30 = v25;
let v31 = 1i;
v25 = (v30+v31);
}
return v24;
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
let v15 = 30i;
v16 = (v14==v15);
}
var v19 = v16;
if (!v19) {
let v17 = v3;
let v18 = 31i;
v19 = (v17==v18);
}
var v22 = v19;
if (!v22) {
let v20 = v3;
let v21 = 32i;
v22 = (v20==v21);
}
if ((!v22)) {
return read_params(v3);
}
var v32: f32 = fn2();
let v33 = v3;
let v34 = 32i;
if ((v33==v34)) {
return v32;
}
var v35: f32 = read_params(15i);
var v36: f32 = read_params(16i);
let v37 = v32;
let v38 = v35;
let v39 = abs((v37-v38));
let v40 = v36;
if ((v39<=v40)) {
let v41 = v3;
let v42 = 30i;
if ((v41==v42)) {
return 1.0f;
}
return read_params(v3);
}
let v43 = read_params(31i);
if (!(abs(v43) < 2147483648.0f)) { vkf_failed = true; }
var v44: i32 = i32(v43);
let v45 = v44;
let v46 = 39i;
if ((v45>=v46)) {
if (!(false)) { vkf_failed = true; }
}
let v47 = v44;
let v48 = 0i;
if ((v47==v48)) {
let v49 = v3;
let v50 = 11i;
if ((v49==v50)) {
return read_params(17i);
}
let v51 = v3;
let v52 = 31i;
if ((v51==v52)) {
return 1.0f;
}
return read_params(v3);
}
let v53 = v44;
let v54 = 1i;
if ((v53==v54)) {
let v55 = v32;
let v56 = v35;
if (!((v55<=v56))) { vkf_failed = true; }
let v57 = v3;
let v58 = 11i;
if ((v57==v58)) {
return read_params(18i);
}
let v59 = v3;
let v60 = 31i;
if ((v59==v60)) {
return 2.0f;
}
return read_params(v3);
}
var v61: f32 = read_params(17i);
var v62: f32 = read_params(18i);
let v63 = v44;
let v64 = 2i;
if ((v63==v64)) {
let v65 = v32;
let v66 = v35;
if (!((v65>=v66))) { vkf_failed = true; }
}
let v67 = v44;
let v68 = 2i;
if ((v67>v68)) {
let v69 = v32;
let v70 = v35;
if ((v69<v70)) {
v61 = read_params(11i);
}
let v71 = v32;
let v72 = v35;
if ((v71>=v72)) {
v62 = read_params(11i);
}
}
let v73 = v3;
let v74 = 11i;
if ((v73==v74)) {
let v75 = v61;
let v76 = v62;
let v77 = (v75+v76);
let v78 = 2i;
if (f32(v78) == 0.0f) { vkf_failed = true; }
return (v77/f32(v78));
}
let v79 = v3;
let v80 = 17i;
if ((v79==v80)) {
return v61;
}
let v81 = v3;
let v82 = 18i;
if ((v81==v82)) {
return v62;
}
let v83 = v3;
let v84 = 31i;
if ((v83==v84)) {
let v85 = v44;
let v86 = 1i;
return f32((v85+v86));
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
