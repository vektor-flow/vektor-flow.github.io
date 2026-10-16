// Compiler-owned canonical typed-IR real-f32 candidate field.
@group(0) @binding(0) var<storage,read> params:array<f32>;
@group(0) @binding(1) var<storage,read> values:array<f32>;
@group(0) @binding(2) var<storage,read_write> results:array<u32>;
@group(0) @binding(3) var<storage,read_write> errors:array<atomic<u32>>;
var<private> vkf_failed:bool;
var<private> vkf_ticks:u32;
fn read_params(i:i32)->f32 { if(i<0 || u32(i)>=arrayLength(&params)){vkf_failed=true;return 0.0f;} return params[u32(i)]; }
fn read_values(i:i32)->f32 { if(i<0 || u32(i)>=arrayLength(&values)){vkf_failed=true;return 0.0f;} return values[u32(i)]; }
fn vkf_powi(x:f32,n:i32)->f32 { if(n < -64 || n > 64){vkf_failed=true;return 0.0f;} var r=1.0f;for(var i=0i;i<abs(n);i+=1i){r=r*x;} if(n<0){if(r==0.0f){vkf_failed=true;}r=1.0f/r;}return r; }
fn fn1(v3:i32)->i32 {
let v4 = v3;
let v5 = 0i;
if ((v4==v5)) {
let v6 = read_params(4i);
if (!(abs(v6) < 2147483648.0f)) { vkf_failed = true; }
let v7 = i32(v6);
let v8 = 1i;
let v9 = read_values((v7-v8));
if (!(abs(v9) < 2147483648.0f)) { vkf_failed = true; }
let v10 = i32(v9);
let v11 = 63i;
let v12 = (v10+v11);
let v13 = 64i;
if (f32(v13) == 0.0f) { vkf_failed = true; }
return i32(floor(f32(v12)/f32(v13)));
}
return 1i;
}
fn fn0(v1:i32)->i32 {
let v2 = v1;
return fn1(v2);
}
@compute @workgroup_size(64) fn vkf_field(@builtin(global_invocation_id) gid:vec3<u32>) {
if(gid.x >= (arrayLength(&results)/1u)){return;}
vkf_failed=false;vkf_ticks=0u;
let value=fn0(i32(gid.x));
if(value<0i){vkf_failed=true;}
results[gid.x]=select(u32(value),0u,vkf_failed);atomicStore(&errors[gid.x],select(0u,1u,vkf_failed));if(vkf_failed){atomicOr(&errors[(arrayLength(&results)/1u)],1u);}
}
