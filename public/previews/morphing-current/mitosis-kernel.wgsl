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
fn fn1(v9:f32,v10:f32,v11:f32,v12:f32,v13:f32,v14:f32)->f32 {
let v15 = 1i;
let v16 = v14;
var v17: f32 = (f32(v15)-v16);
let v18 = v17;
let v19 = v9;
let v20 = (v18*v19);
let v21 = v14;
let v22 = v10;
let v23 = (v21*v22);
let v24 = (v20+v23);
let v25 = v17;
let v26 = 3i;
let v27 = vkf_powi(v25,v26);
let v28 = v17;
let v29 = (v27-v28);
let v30 = v11;
let v31 = (v29*v30);
let v32 = v14;
let v33 = 3i;
let v34 = vkf_powi(v32,v33);
let v35 = v14;
let v36 = (v34-v35);
let v37 = v12;
let v38 = (v36*v37);
let v39 = (v31+v38);
let v40 = v13;
let v41 = (v39*v40);
let v42 = v13;
let v43 = (v41*v42);
let v44 = 6i;
if (f32(v44) == 0.0f) { vkf_failed = true; }
let v45 = (v43/f32(v44));
return (v24+v45);
}
fn fn3(v66:f32,v67:f32)->f32 {
let v68 = v66;
let v69 = v67;
if ((v68>v69)) {
return v66;
}
return v67;
}
fn fn2(v59:f32,v60:f32,v61:f32)->f32 {
let v62 = v61;
let v63 = 0i;
if ((v62<=f32(v63))) {
let v64 = v59;
let v65 = v60;
return fn3(v64,v65);
}
let v70 = v61;
let v71 = v59;
let v72 = v60;
let v73 = abs((v71-v72));
let v74 = (v70-v73);
let v75 = 0.0f;
let v76 = fn3(v74,v75);
let v77 = v61;
if (v77 == 0.0f) { vkf_failed = true; }
var v78: f32 = (v76/v77);
let v79 = v59;
let v80 = v60;
let v81 = fn3(v79,v80);
let v82 = v61;
let v83 = v78;
let v84 = (v82*v83);
let v85 = v78;
let v86 = (v84*v85);
let v87 = 4i;
if (f32(v87) == 0.0f) { vkf_failed = true; }
let v88 = (v86/f32(v87));
return (v81+v88);
}
fn fn0(v1:i32)->f32 {
var v2: f32 = read_params(0i);
let v3 = read_params(2i);
let v4 = read_params(3i);
let v5 = 0.0f;
let v6 = 0.0f;
let v7 = 1.0f;
let v8 = v2;
var v46: f32 = fn1(v3,v4,v5,v6,v7,v8);
let v47 = read_params(4i);
let v48 = 4i;
let v49 = (v47*f32(v48));
let v50 = v2;
let v51 = (v49*v50);
let v52 = 1i;
let v53 = v2;
let v54 = (f32(v52)-v53);
var v55: f32 = (v51*v54);
let v56 = read_params(1i);
let v57 = v46;
let v58 = v55;
return fn2(v56,v57,v58);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/1u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
if (!(abs(value)<=3.402823466e+38f)){vkf_failed=true;}
results[gid.x]=select(value,0.0f,vkf_failed);atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/1u)],1u);}
}
