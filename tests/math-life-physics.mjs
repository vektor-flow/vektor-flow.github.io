import assert from 'node:assert/strict';
import{stepRigidPolygonWorld2D}from'../public/vf-ui/vf-physics-engine.mjs';
import{stepPhysics,physicsIdentity}from'../public/previews/math-life/physics.mjs';
import{Contacts}from'../public/previews/math-life/contacts.mjs';
assert.match(physicsIdentity,/VKF/);let calls=0;
const bodies=new Map([[1,{id:1,x:200,y:150,r:20,vx:100,vy:25}],[2,{id:2,x:245,y:150,r:20,vx:-100,vy:25}]]);
stepPhysics(bodies,600,400,.01,{step:(world,dt)=>{calls++;assert.equal(world.bodies[0].shape.type,'circle');assert.equal(world.gravity[1],0);assert.equal(world.sleepDelay,0);return stepRigidPolygonWorld2D(world,dt);}});assert.equal(calls,1);assert(bodies.get(1).vx<0);assert(bodies.get(2).vx>0);for(const o of bodies.values())assert.equal(o.vy,25);assert(Math.hypot(bodies.get(2).x-bodies.get(1).x,bodies.get(2).y-bodies.get(1).y)>=44-1e-8);
const wall={id:3,x:570,y:100,r:20,vx:300,vy:15};stepPhysics(new Map([[3,wall]]),600,400,.02);assert.equal(wall.vx,-300);assert.equal(wall.vy,15);assert(wall.x<=572);
const moving={id:4,x:200,y:100,r:20,vx:300,vy:0};stepPhysics(new Map([[4,moving]]),600,400,.1,{heldId:4});assert.equal(moving.x,200);assert.equal(moving.vx,300);
// Contacts.step must use the engine for integration and rejected contacts.
const a={id:1,x:200,y:100,r:20,vx:1000,vy:0},b={id:2,x:250,y:100,r:20,vx:0,vy:0},world=new Map([[1,a],[2,b]]);const contacts=new Contacts(world,{combine:()=>({ok:false}),bounce:()=>{},merge:()=>{throw Error('Bad merge')}});contacts.resize(600,400);for(let i=0;i<20;i++)contacts.step(.001,i);assert(Math.abs(a.vx)<1e-8);assert(Math.abs(b.vx-1000)<1e-8);assert.equal(contacts.overlaps().length,0);
console.log('PASS canonical VKF runtime delegation, exact-circle impacts, wall reflections, kinematic grab and integrated momentum transfer');
