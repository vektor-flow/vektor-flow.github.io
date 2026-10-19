import assert from 'node:assert/strict';
import{expressionRadius,mergedVelocity,advance,mass}from'../public/previews/math-life/motion.mjs';
import{Contacts}from'../public/previews/math-life/contacts.mjs';
const n=value=>({kind:'number',value});assert(expressionRadius(n(12),31)>expressionRadius(n(2),31));assert(expressionRadius(n(2),31)>expressionRadius(n(0),31));assert.equal(expressionRadius({...n(0),imag:1},31),expressionRadius(n(-1),31));
const o={x:100,y:100,r:20,vx:80,vy:-30};for(let i=0;i<100;i++)advance(o,.01,1000,1000);assert.equal(o.vx,80);assert.equal(o.vy,-30);assert(Math.abs(o.x-180)<1e-10);o.x=979;advance(o,.1,1000,1000);assert.equal(o.vx,-80);assert.equal(o.vy,-30);
const a={id:1,x:100,y:100,r:20,vx:60,vy:4},b={id:2,x:152,y:100,r:30,vx:-20,vy:4};const c=new Contacts(new Map([[1,a],[2,b]]),{});c.resize(1000,1000);const momentum=mass(a)*a.vx+mass(b)*b.vx,energy=mass(a)*a.vx*a.vx+mass(b)*b.vx*b.vx;c.separate(a,b);assert(Math.abs(momentum-mass(a)*a.vx-mass(b)*b.vx)<1e-8);assert(Math.abs(energy-mass(a)*a.vx*a.vx-mass(b)*b.vx*b.vx)<1e-6);assert.equal(a.vy,4);assert.equal(b.vy,4);assert.deepEqual(mergedVelocity(a,b),{vx:momentum/(mass(a)+mass(b)),vy:4});
console.log('PASS persistent free velocity, elastic unequal-size bounce, merge velocity and magnitude-driven radius');
