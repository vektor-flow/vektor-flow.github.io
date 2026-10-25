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
fn fn2(v21:f32,v22:f32)->f32 {
let v23 = v21;
let v24 = v22;
if ((v23>v24)) {
return v21;
}
return v22;
}
fn fn1(v14:f32,v15:f32,v16:f32)->f32 {
let v17 = v16;
let v18 = 0i;
if ((v17<=f32(v18))) {
let v19 = v14;
let v20 = v15;
return fn2(v19,v20);
}
let v25 = v16;
let v26 = v14;
let v27 = v15;
let v28 = abs((v26-v27));
let v29 = (v25-v28);
let v30 = 0.0f;
let v31 = fn2(v29,v30);
let v32 = v16;
if (v32 == 0.0f) { vkf_failed = true; }
var v33: f32 = (v31/v32);
let v34 = v14;
let v35 = v15;
let v36 = fn2(v34,v35);
let v37 = v16;
let v38 = v33;
let v39 = (v37*v38);
let v40 = v33;
let v41 = (v39*v40);
let v42 = 4i;
if (f32(v42) == 0.0f) { vkf_failed = true; }
let v43 = (v41/f32(v42));
return (v36+v43);
}
fn fn3(v51:f32,v52:f32,v53:f32,v54:f32,v55:f32,v56:f32)->f32 {
let v57 = 1i;
let v58 = v56;
var v59: f32 = (f32(v57)-v58);
let v60 = v59;
let v61 = v51;
let v62 = (v60*v61);
let v63 = v56;
let v64 = v52;
let v65 = (v63*v64);
let v66 = (v62+v65);
let v67 = v59;
let v68 = 3i;
let v69 = vkf_powi(v67,v68);
let v70 = v59;
let v71 = (v69-v70);
let v72 = v53;
let v73 = (v71*v72);
let v74 = v56;
let v75 = 3i;
let v76 = vkf_powi(v74,v75);
let v77 = v56;
let v78 = (v76-v77);
let v79 = v54;
let v80 = (v78*v79);
let v81 = (v73+v80);
let v82 = v55;
let v83 = (v81*v82);
let v84 = v55;
let v85 = (v83*v84);
let v86 = 6i;
if (f32(v86) == 0.0f) { vkf_failed = true; }
let v87 = (v85/f32(v86));
return (v66+v87);
}
fn fn0(v1:i32)->f32 {
var v2: f32 = read_params(0i);
let v3 = read_params(1i);
let v4 = read_params(2i);
let v5 = read_params(4i);
let v6 = 4i;
let v7 = (v5*f32(v6));
let v8 = v2;
let v9 = (v7*v8);
let v10 = 1i;
let v11 = v2;
let v12 = (f32(v10)-v11);
let v13 = (v9*v12);
var v44: f32 = fn1(v3,v4,v13);
let v45 = v44;
let v46 = read_params(3i);
let v47 = 0.0f;
let v48 = 0.0f;
let v49 = 1.0f;
let v50 = v2;
return fn3(v45,v46,v47,v48,v49,v50);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/1u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
if (!(abs(value)<=3.402823466e+38f)){vkf_failed=true;}
results[gid.x]=select(value,0.0f,vkf_failed);atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/1u)],1u);}
}
