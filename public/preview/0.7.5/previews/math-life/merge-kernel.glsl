// Generated from VKF typed IR. Do not edit numerical functions.
bool vkf_failed;
float mergeParams[5];
float read_params(int i){return mergeParams[i];}
float vkf_powi(float x,int n) { if(n < -64 || n > 64){vkf_failed=true;return 0.0;} float r=1.0;for(int i=0;i<abs(n);i+=1){r=r*x;} if(n<0){if(r==0.0){vkf_failed=true;}r=1.0/r;}return r; }
float fn2(float v21,float v22) {
float v23 = v21;
float v24 = v22;
if ((v23>v24)) {
return v21;
}
return v22;
}
float fn1(float v14,float v15,float v16) {
float v17 = v16;
int v18 = 0;
if ((v17<=float(v18))) {
float v19 = v14;
float v20 = v15;
return fn2(v19,v20);
}
float v25 = v16;
float v26 = v14;
float v27 = v15;
float v28 = abs((v26-v27));
float v29 = (v25-v28);
float v30 = 0.0;
float v31 = fn2(v29,v30);
float v32 = v16;
if (v32 == 0.0) { vkf_failed = true; }
float v33 = (v31/v32);
float v34 = v14;
float v35 = v15;
float v36 = fn2(v34,v35);
float v37 = v16;
float v38 = v33;
float v39 = (v37*v38);
float v40 = v33;
float v41 = (v39*v40);
int v42 = 4;
if (float(v42) == 0.0) { vkf_failed = true; }
float v43 = (v41/float(v42));
return (v36+v43);
}
float fn3(float v51,float v52,float v53,float v54,float v55,float v56) {
int v57 = 1;
float v58 = v56;
float v59 = (float(v57)-v58);
float v60 = v59;
float v61 = v51;
float v62 = (v60*v61);
float v63 = v56;
float v64 = v52;
float v65 = (v63*v64);
float v66 = (v62+v65);
float v67 = v59;
int v68 = 3;
float v69 = vkf_powi(v67,v68);
float v70 = v59;
float v71 = (v69-v70);
float v72 = v53;
float v73 = (v71*v72);
float v74 = v56;
int v75 = 3;
float v76 = vkf_powi(v74,v75);
float v77 = v56;
float v78 = (v76-v77);
float v79 = v54;
float v80 = (v78*v79);
float v81 = (v73+v80);
float v82 = v55;
float v83 = (v81*v82);
float v84 = v55;
float v85 = (v83*v84);
int v86 = 6;
if (float(v86) == 0.0) { vkf_failed = true; }
float v87 = (v85/float(v86));
return (v66+v87);
}
float fn0(int v1) {
float v2 = read_params(0);
float v3 = read_params(1);
float v4 = read_params(2);
float v5 = read_params(4);
int v6 = 4;
float v7 = (v5*float(v6));
float v8 = v2;
float v9 = (v7*v8);
int v10 = 1;
float v11 = v2;
float v12 = (float(v10)-v11);
float v13 = (v9*v12);
float v44 = fn1(v3,v4,v13);
float v45 = v44;
float v46 = read_params(3);
float v47 = 0.0;
float v48 = 0.0;
float v49 = 1.0;
float v50 = v2;
return fn3(v45,v46,v47,v48,v49,v50);
}
float mergeField(float q,float a,float b,float target,float neck){mergeParams[0]=q;mergeParams[1]=a;mergeParams[2]=b;mergeParams[3]=target;mergeParams[4]=neck;vkf_failed=false;return fn0(0); }
