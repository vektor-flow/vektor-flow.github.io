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
fn fn3(v46:f32,v47:f32,v48:f32,v49:f32,v50:f32,v51:f32)->f32 {
let v52 = 1i;
let v53 = v51;
var v54: f32 = (f32(v52)-v53);
let v55 = v54;
let v56 = v46;
let v57 = (v55*v56);
let v58 = v51;
let v59 = v47;
let v60 = (v58*v59);
let v61 = (v57+v60);
let v62 = v54;
let v63 = 3i;
let v64 = vkf_powi(v62,v63);
let v65 = v54;
let v66 = (v64-v65);
let v67 = v48;
let v68 = (v66*v67);
let v69 = v51;
let v70 = 3i;
let v71 = vkf_powi(v69,v70);
let v72 = v51;
let v73 = (v71-v72);
let v74 = v49;
let v75 = (v73*v74);
let v76 = (v68+v75);
let v77 = v50;
let v78 = (v76*v77);
let v79 = v50;
let v80 = (v78*v79);
let v81 = 6i;
if (f32(v81) == 0.0f) { vkf_failed = true; }
let v82 = (v80/f32(v81));
return (v61+v82);
}
fn fn2(v19:i32,v20:i32,v21:i32,v22:f32,v23:f32,v24:i32)->f32 {
let v25 = v21;
let v26 = v19;
let v27 = (v25*v26);
let v28 = v24;
var v29: i32 = (v27+v28);
let v30 = v29;
let v31 = v19;
var v32: i32 = (v30+v31);
let v33 = v20;
let v34 = v19;
var v35: i32 = (v33*v34);
let v36 = read_values(v29);
let v37 = read_values(v32);
let v38 = v35;
let v39 = v29;
let v40 = read_values((v38+v39));
let v41 = v35;
let v42 = v32;
let v43 = read_values((v41+v42));
let v44 = v22;
let v45 = v23;
return fn3(v36,v37,v40,v43,v44,v45);
}
fn fn1(v3:i32)->f32 {
let v4 = read_params(25i);
if (!(abs(v4) < 2147483648.0f)) { vkf_failed = true; }
let v5 = i32(v4);
let v6 = read_params(24i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
let v7 = i32(v6);
let v8 = read_params(21i);
if (!(abs(v8) < 2147483648.0f)) { vkf_failed = true; }
let v9 = i32(v8);
let v10 = read_params(23i);
let v11 = read_params(22i);
let v12 = v3;
let v13 = v5;
let v14 = v7;
let v15 = v9;
let v16 = v10;
let v17 = v11;
let v18 = v12;
return fn2(v13,v14,v15,v16,v17,v18);
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
