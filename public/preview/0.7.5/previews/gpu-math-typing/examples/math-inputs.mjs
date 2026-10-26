const step=(math,note='',geometry=null)=>({math,note,geometry});
const ex=(id,title,group,steps)=>({id,title,group,steps:steps.map(x=>typeof x==='string'?step(x):x)});
export const examples=[
 {...ex('square','Complete the square','Algebra',[
 step('x^2+6x=40','Start with the equation.'),step('x^2+6x+9=40+9','Add the same quantity to both sides.'),step('(x+3)^2=49','Factor the square and simplify.'),step('x+3=\\pm7','Keep both square roots.'),step('x=-3\\pm7','Isolate x.'),step('x=4,\\quad x=-10','Both values solve the original equation.')]),source:{title:'OpenStax · Intermediate Algebra 2e §9.2',url:'https://openstax.org/books/intermediate-algebra-2e/pages/9-2-solve-quadratic-equations-by-completing-the-square',note:'Equation from OpenStax; steps and presentation adapted here.'}},
 ex('cancel','Cancel factors, keep the hole','Algebra',[
 step('f(x)=\\frac{x^2+5x+6}{x^2+4x+3}','Excluded values: x = −3 and −1.',{kind:'rational'}),step('f(x)=\\frac{(x+2)(x+3)}{(x+1)(x+3)}','Factor numerator and denominator.',{kind:'rational'}),step('f(x)=\\frac{x+2}{x+1}','Cancel the common factor; x = −3 remains excluded.',{kind:'rational'}),step('f(x)=1+\\frac{1}{x+1}','Same graph, including its hole at (−3, ½).',{kind:'rational'})]),
 ex('linear','Solve a bill-sharing equation','Everyday',[
 step('3(x+12)+18=90','Three people pay the same amount plus fixed charges.'),'3x+36+18=90','3x+54=90','3x=36',step('x=12','Each variable share is 12.')]),
 ex('discount','Discount then tax','Everyday',['P=240(1-0.15)(1+0.20)','P=240\\times0.85\\times1.20','P=204\\times1.20','P=244.80']),
 ex('tiles','Retile three floors','Geometry',[
 step('n=\\frac{6}{1/2}\\times\\frac{4}{1/2}','Half-metre tiles in each 6 × 4 metre room.',{kind:'tiles',cols:12,rows:8}),step('C_3=3(96\\times3+24+18)','Three rooms, including fixed charges.',{kind:'tiles',cols:12,rows:8}),step('C_3=990','Original total.',{kind:'tiles',cols:12,rows:8}),step('n=\\frac{6}{1}\\times\\frac{4}{1}=24','Switch to one-metre tiles.',{kind:'tiles',cols:6,rows:4}),step('C_3=3(24\\times9+24+18)=774','New total.',{kind:'tiles',cols:6,rows:4}),step('990-774=216','Savings across three rooms.',{kind:'tiles',cols:6,rows:4})]),
 ex('graph','Parabola → cubic','Graphs',[
 step('f(x)=x^2','Parabola with sampled curve.',{kind:'power',power:2,count:96}),step('g(x)=x^3','Change the function and graph together.',{kind:'power',power:3,count:180}),step('h(x)=x^3-x','Subtract x; the roots change.',{kind:'power',power:3,linear:-1,count:144}),step('h(x)=x(x-1)(x+1)','Factorization of the same curve.',{kind:'power',power:3,linear:-1,count:144})]),
 ex('derivative','Differentiate from the definition','Calculus',[
 '\\frac{(x+h)^2-x^2}{h}','\\frac{x^2+2xh+h^2-x^2}{h}','\\frac{2xh+h^2}{h}','2x+h','\\lim_{h\\to0}(2x+h)=2x']),
 ex('cubic','Expand and refactor a cubic','Algebra',['(a+b)^3','(a+b)(a^2+2ab+b^2)','a^3+2a^2b+ab^2+a^2b+2ab^2+b^3','a^3+3a^2b+3ab^2+b^3','(a+b)^3']),
 ex('fractions','Add unlike fractions','Arithmetic',['\\frac{3}{4}+\\frac{5}{6}','\\frac{9}{12}+\\frac{10}{12}','\\frac{9+10}{12}','\\frac{19}{12}','1+\\frac{7}{12}']),
 ex('system','Eliminate a variable','Algebra',[
 step('2x+y=11,\\quad x-y=1','Two simultaneous equations.'),step('(2x+y)+(x-y)=11+1','Add the equations.'),'3x=12','x=4',step('4-y=1','Substitute x into the second equation.'),'x=4,\\quad y=3']),
 ex('circle','Find a circle’s centre','Geometry',[
 'x^2+y^2-6x+4y-12=0','x^2-6x+y^2+4y=12','(x^2-6x+9)+(y^2+4y+4)=25',step('(x-3)^2+(y+2)^2=25','Centre (3, −2), radius 5.',{kind:'ring'})]),
 ex('pythagoras','Find the diagonal','Geometry',['d^2=6^2+8^2','d^2=36+64','d^2=100','d=10']),
 ex('radical','Simplify a radical','Algebra',['\\sqrt{72}','\\sqrt{36\\times2}','\\sqrt{36}\\sqrt{2}','6\\sqrt{2}']),
 ex('quadratic','Solve by factoring','Algebra',['2x^2-5x-3=0','2x^2-6x+x-3=0','2x(x-3)+(x-3)=0','(2x+1)(x-3)=0','x=-\\frac{1}{2},\\quad x=3']),
 ex('growth','Compound growth','Everyday',['A=1000(1+0.05)^3','A=1000(1.05)^3','A=1000\\times1.157625','A=1157.625']),
 ex('binomial','Evaluate a probability','Statistics',['P=\\binom{5}{2}(0.4)^2(0.6)^3','P=10\\times0.16\\times0.216','P=0.3456'])
];
export {splitSteps} from './math-import.mjs';

const geo=(math,note,kind,parameters)=>step(math,note,{kind,...parameters});
examples.push(
 ex('affine-grid','Rotate, shear and stretch a grid','Geometry lab',[
 geo('A=I,\\quad \\det(A)=1','289 grid points; identity map.','grid',{}),
 geo('A=\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}','Quarter-turn, same point count.','grid',{angle:Math.PI/2}),
 geo('A=\\begin{pmatrix}1&0.6\\\\0&1\\end{pmatrix}','Shear preserves area.','grid',{shear:.6}),
 geo('A=\\begin{pmatrix}1&0\\\\0&0.6\\end{pmatrix}','Compress the vertical direction.','grid',{scale:.6})]),
 ex('conics','Circle, ellipse and hyperbola','Geometry lab',[
 geo('x^2+y^2=1','A circle in normalized coordinates.','conic',{form:'circle'}),
 geo('x^2+4y^2=1','Compress into an ellipse.','conic',{form:'ellipse'}),
 geo('x^2-y^2=1','Change topology into two branches.','conic',{form:'hyperbola'})]),
 ex('harmonics','Build a wave from harmonics','Geometry lab',[
 geo('f(x)=\\sin(x)','320 samples of one harmonic.','wave',{mode:0}),
 geo('f(x)=\\sin(x)+\\frac{\\sin(3x)}{3}','Add a third harmonic.','wave',{mode:1}),
 geo('f(x)=\\sin(x)+\\frac{\\sin(3x)}{3}+\\frac{\\sin(5x)}{5}','Add a fifth harmonic.','wave',{mode:2})]),
 ex('polar-curves','Circle, rose and spiral','Geometry lab',[
 geo('r(\\theta)=1,\\quad 0\\leq\\theta\\leq2\\pi','360 points on a closed curve.','polar',{mode:0}),
 geo('r(\\theta)=\\cos(3\\theta)','A three-petal rose.','polar',{mode:1}),
 geo('r(\\theta)=a+b\\theta','Open the curve into a spiral.','polar',{mode:2})]),
 ex('integration','Refine an area approximation','Geometry lab',[
 geo('S_{16}=\\sum_{k=1}^{16}f(x_k)\\Delta x','16 midpoint rectangles beneath the parabola.','integral',{n:16}),
 geo('S_{32}=\\sum_{k=1}^{32}f(x_k)\\Delta x','Double the rectangles.','integral',{n:32}),
 geo('S_{64}\\to\\int_0^1x^2\\,dx','64 rectangles approach the integral.','integral',{n:64}),
 geo('\\int_0^1x^2\\,dx=\\frac{1}{3}','The exact area is one third.','integral',{n:96})]),
 ex('triangle-mesh','Refine and rotate a triangular mesh','Geometry lab',[
 geo('N=\\frac{(n+1)(n+2)}{2},\\quad n=18','190 vertices on a triangular lattice.','mesh',{n:18}),
 geo('n=24,\\quad N=325','Refine to 325 vertices.','mesh',{n:24}),
 geo('n=28,\\quad N=435','Refine and rotate the lattice.','mesh',{n:28,angle:.35}),
 geo('n=20,\\quad N=231','Coarsen while rotating back.','mesh',{n:20,angle:-.2})]),
 ex('sphere-projection','Rotate a sphere, flatten a projection','Geometry lab',[
 geo('x^2+y^2+z^2=R^2','352 colored samples on a sphere.','sphere',{angle:0}),
 geo('R_y(\\theta),\\quad \\theta=\\frac{\\pi}{3}','Rotate the 3D samples around y.','sphere',{angle:Math.PI/3}),
 geo('P(x,y,z)=(x,y,0)','Project the sphere into a disk.','sphere',{angle:0,flat:true})]),
 ex('normal-shift','Shift and narrow a distribution','Geometry lab',[
 geo('p(x)=\\frac{e^{-x^2/2}}{\\sqrt{2\\pi}}','80 bars; centred normal profile.','distribution',{n:80,mean:0,sigma:1}),
 geo('p(x)=\\frac{e^{-(x-1)^2/2}}{\\sqrt{2\\pi}}','Shift the mean by one.','distribution',{n:120,mean:1,sigma:1}),
 geo('p(x)=\\frac{2e^{-2(x-1)^2}}{\\sqrt{2\\pi}}','Halve the standard deviation, refine bars.','distribution',{n:160,mean:1,sigma:.5})]),
 ex('vector-fields','Vortex, expansion and spiral field','Geometry lab',[
 geo('F(x,y)=(-y,x)','100 arrows represented by 400 samples.','vector',{mode:0}),
 geo('F(x,y)=(x,y)','Switch from rotation to expansion.','vector',{mode:1}),
 geo('F(x,y)=(x-y,x+y)','Combine expansion with rotation.','vector',{mode:2})]),
 ex('phyllotaxis','Grow and shrink a colored packing','Geometry lab',[
 geo('r_n=c\\sqrt{n},\\quad N=200','200 points on a golden-angle packing.','packing',{n:200,angle:0}),
 geo('\\theta_n=n\\alpha,\\quad N=350','Grow to 350 points and rotate.','packing',{n:350,angle:.3}),
 geo('\\alpha=\\pi(3-\\sqrt{5}),\\quad N=450','450 points plus the formula.','packing',{n:450,angle:.6}),
 geo('r_n=c\\sqrt{n},\\quad N=240','Shrink back to 240 points.','packing',{n:240,angle:.2})])
);

import {derivations} from './derivation-data.mjs';
examples.push(...derivations);
