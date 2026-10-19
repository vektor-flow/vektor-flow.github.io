// Generated from VKF typed IR. Do not edit numerical functions.
bool vkf_failed;
float unfoldParams[2];
float read_params(int i){return unfoldParams[i];}
float vkf_powi(float x,int n) { if(n < -64 || n > 64){vkf_failed=true;return 0.0;} float r=1.0;for(int i=0;i<abs(n);i+=1){r=r*x;} if(n<0){if(r==0.0){vkf_failed=true;}r=1.0/r;}return r; }
float fn3(float v19,float v20) {
float v21 = v19;
float v22 = v20;
if ((v21>v22)) {
return v19;
}
return v20;
}
float fn4(float v24,float v25) {
float v26 = v24;
float v27 = v25;
if ((v26<v27)) {
return v24;
}
return v25;
}
float fn2(float v13,float v14,float v15) {
float v16 = v15;
float v17 = v14;
float v18 = v13;
float v23 = fn3(v17,v18);
return fn4(v16,v23);
}
float fn1(float v6,float v7) {
float v8 = v7;
float v9 = v6;
float v10 = (v8*v9);
float v11 = 0.0;
float v12 = 1.57079637;
float v28 = fn2(v10,v11,v12);
float v29 = v28;
int v30 = 0;
if ((v29<=float(v30))) {
return 0.0;
}
float v31 = v28;
float v32 = 1.57079637;
if ((v31>=v32)) {
return 1.0;
}
float v33 = v28;
float v34 = v28;
float v35 = (v33*v34);
float v36 = v28;
int v37 = 1;
float v38 = v35;
float v39 = -1.0;
int v40 = 6;
if (float(v40) == 0.0) { vkf_failed = true; }
float v41 = (v39/float(v40));
float v42 = v35;
float v43 = 1.0;
int v44 = 120;
if (float(v44) == 0.0) { vkf_failed = true; }
float v45 = (v43/float(v44));
float v46 = v35;
float v47 = -1.0;
int v48 = 5040;
if (float(v48) == 0.0) { vkf_failed = true; }
float v49 = (v47/float(v48));
float v50 = v35;
float v51 = 1.0;
int v52 = 362880;
if (float(v52) == 0.0) { vkf_failed = true; }
float v53 = (v51/float(v52));
float v54 = v35;
float v55 = -1.0;
int v56 = 39916800;
if (float(v56) == 0.0) { vkf_failed = true; }
float v57 = (v55/float(v56));
float v58 = v35;
float v59 = 6.2270208e+09;
if (v59 == 0.0) { vkf_failed = true; }
float v60 = (v58/v59);
float v61 = (v57+v60);
float v62 = (v54*v61);
float v63 = (v53+v62);
float v64 = (v50*v63);
float v65 = (v49+v64);
float v66 = (v46*v65);
float v67 = (v45+v66);
float v68 = (v42*v67);
float v69 = (v41+v68);
float v70 = (v38*v69);
float v71 = (float(v37)+v70);
float v72 = (v36*v71);
float v73 = v72;
float v74 = v72;
return (v73*v74);
}
float fn5(float v79,float v80) {
float v81 = v79;
float v82 = 0.0;
float v83 = 1.0;
float v84 = fn2(v81,v82,v83);
int v85 = 1;
float v86 = (v84-float(v85));
int v87 = 1;
float v88 = v80;
int v89 = 1;
float v90 = (v88+float(v89));
float v91 = v86;
float v92 = (v90*v91);
float v93 = v86;
float v94 = (v92*v93);
float v95 = v86;
float v96 = (v94*v95);
float v97 = (float(v87)+v96);
float v98 = v80;
float v99 = v86;
float v100 = (v98*v99);
float v101 = v86;
float v102 = (v100*v101);
return (v97+v102);
}
float fn6(float v107,int v108) {
int v109 = v108;
int v110 = 0;
bool v113 = (v109>=v110);
if (v113) {
int v111 = v108;
int v112 = 3;
v113 = (v111<v112);
}
if (!(v113)) { vkf_failed = true; }
float v114 = 4.5;
float v115 = v107;
float v116 = 0.800000012;
if (v116 == 0.0) { vkf_failed = true; }
float v117 = (v115/v116);
float v118 = 0.0;
float v119 = 1.0;
float v120 = fn2(v117,v118,v119);
float v121 = (v114*v120);
int v122 = v108;
int v123 = 1;
if ((v122==v123)) {
float v124 = v121;
int v125 = 4;
v121 = (v124+float(v125));
}
int v126 = v108;
int v127 = 2;
if ((v126==v127)) {
float v128 = v121;
int v129 = 2;
v121 = (v128+float(v129));
}
float v130 = v121;
int v131 = 6;
if ((v130>=float(v131))) {
float v132 = v121;
int v133 = 6;
v121 = (v132-float(v133));
}
float v134 = v121;
int v135 = 3;
float v136 = abs((v134-float(v135)));
int v137 = 1;
float v138 = (v136-float(v137));
float v139 = 0.0;
float v140 = 1.0;
float v141 = fn2(v138,v139,v140);
float v142 = v107;
float v143 = 0.800000012;
float v144 = (v142-v143);
float v145 = 0.200000003;
if (v145 == 0.0) { vkf_failed = true; }
float v146 = (v144/v145);
float v147 = 0.0;
float v148 = 1.0;
float v149 = fn2(v146,v147,v148);
float v150 = v149;
float v151 = v149;
float v152 = (v150*v151);
int v153 = 3;
int v154 = 2;
float v155 = v149;
float v156 = (float(v154)*v155);
float v157 = (float(v153)-v156);
float v158 = (v152*v157);
float v159 = v141;
int v160 = 1;
float v161 = v141;
float v162 = (float(v160)-v161);
float v163 = v158;
float v164 = (v162*v163);
return (v159+v164);
}
float fn0(int v1) {
int v2 = v1;
int v3 = 0;
if ((v2==v3)) {
float v4 = read_params(0);
float v5 = read_params(1);
return fn1(v4,v5);
}
int v75 = v1;
int v76 = 1;
if ((v75==v76)) {
float v77 = read_params(0);
float v78 = read_params(1);
return fn5(v77,v78);
}
float v103 = read_params(0);
int v104 = v1;
int v105 = 2;
int v106 = (v104-v105);
return fn6(v103,v106);
}
float unfoldAlpha(float distance,float k){unfoldParams[0]=distance;unfoldParams[1]=k;vkf_failed=false;return fn0(0); }
float unfoldGrowth(float a,float coefficient){unfoldParams[0]=a;unfoldParams[1]=coefficient;vkf_failed=false;return fn0(1); }
vec3 unfoldColor(float a){unfoldParams[0]=a;unfoldParams[1]=0.0;vkf_failed=false;return vec3(fn0(2),fn0(3),fn0(4));}
