// Generated from VKF typed IR. Do not edit numerical functions.
bool vkf_failed;
float splitParams[5];
float read_params(int i){return splitParams[i];}
float vkf_powi(float x,int n) { if(n < -64 || n > 64){vkf_failed=true;return 0.0;} float r=1.0;for(int i=0;i<abs(n);i+=1){r=r*x;} if(n<0){if(r==0.0){vkf_failed=true;}r=1.0/r;}return r; }
float fn1(float v9,float v10,float v11,float v12,float v13,float v14) {
int v15 = 1;
float v16 = v14;
float v17 = (float(v15)-v16);
float v18 = v17;
float v19 = v9;
float v20 = (v18*v19);
float v21 = v14;
float v22 = v10;
float v23 = (v21*v22);
float v24 = (v20+v23);
float v25 = v17;
int v26 = 3;
float v27 = vkf_powi(v25,v26);
float v28 = v17;
float v29 = (v27-v28);
float v30 = v11;
float v31 = (v29*v30);
float v32 = v14;
int v33 = 3;
float v34 = vkf_powi(v32,v33);
float v35 = v14;
float v36 = (v34-v35);
float v37 = v12;
float v38 = (v36*v37);
float v39 = (v31+v38);
float v40 = v13;
float v41 = (v39*v40);
float v42 = v13;
float v43 = (v41*v42);
int v44 = 6;
if (float(v44) == 0.0) { vkf_failed = true; }
float v45 = (v43/float(v44));
return (v24+v45);
}
float fn3(float v66,float v67) {
float v68 = v66;
float v69 = v67;
if ((v68>v69)) {
return v66;
}
return v67;
}
float fn2(float v59,float v60,float v61) {
float v62 = v61;
int v63 = 0;
if ((v62<=float(v63))) {
float v64 = v59;
float v65 = v60;
return fn3(v64,v65);
}
float v70 = v61;
float v71 = v59;
float v72 = v60;
float v73 = abs((v71-v72));
float v74 = (v70-v73);
float v75 = 0.0;
float v76 = fn3(v74,v75);
float v77 = v61;
if (v77 == 0.0) { vkf_failed = true; }
float v78 = (v76/v77);
float v79 = v59;
float v80 = v60;
float v81 = fn3(v79,v80);
float v82 = v61;
float v83 = v78;
float v84 = (v82*v83);
float v85 = v78;
float v86 = (v84*v85);
int v87 = 4;
if (float(v87) == 0.0) { vkf_failed = true; }
float v88 = (v86/float(v87));
return (v81+v88);
}
float fn0(int v1) {
float v2 = read_params(0);
float v3 = read_params(2);
float v4 = read_params(3);
float v5 = 0.0;
float v6 = 0.0;
float v7 = 1.0;
float v8 = v2;
float v46 = fn1(v3,v4,v5,v6,v7,v8);
float v47 = read_params(4);
int v48 = 4;
float v49 = (v47*float(v48));
float v50 = v2;
float v51 = (v49*v50);
int v52 = 1;
float v53 = v2;
float v54 = (float(v52)-v53);
float v55 = (v51*v54);
float v56 = read_params(1);
float v57 = v46;
float v58 = v55;
return fn2(v56,v57,v58);
}
float mitosisField(float q,float parent,float source,float target,float neck){splitParams[0]=q;splitParams[1]=parent;splitParams[2]=source;splitParams[3]=target;splitParams[4]=neck;vkf_failed=false;return fn0(0);}
