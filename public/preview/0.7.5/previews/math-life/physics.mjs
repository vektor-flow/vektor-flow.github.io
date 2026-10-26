// Adapter only: numerical integration, exact-circle contacts, wall constraints
// and impulses belong to the unchanged packaged VKF browser physics runtime.
import {stepRigidPolygonWorld2D} from '../../vf-ui/vf-physics-engine.mjs?v=526b318080c6';
export const physicsIdentity='VKF browser physics: stepRigidPolygonWorld2D / exact circles';
export function stepPhysics(objects,width,height,dt,{gap=4,heldId=null,reduced=false,step=stepRigidPolygonWorld2D}={}){
 if(!objects.size)return;
 // Authored walls: left/right/top inset 8; bottom inset 30 (the world note).
 const center=[width/2,(height-22)/2],worldWidth=Math.max(1,width-16),worldHeight=Math.max(1,height-38);
 const bodies=[...objects.entries()].map(([id,o])=>({id,shape:{type:'circle',radius:o.r+gap/2},mass:o.r*o.r,position:[o.x-center[0],o.y-center[1]],velocity:reduced&&!o.tossed&&id!==heldId?[0,0]:[o.vx,o.vy],fixed:id===heldId,angle:0,angularVelocity:0,e_n:1,e_t:0,mu_s:0,mu_d:0,mu_r:0,restitution_threshold:0}));
 // The gap is part of the circle, so expand walls by the same half-gap.
 const next=step({width:worldWidth+gap,height:worldHeight+gap,gravity:[0,0],bodies,solverIterations:dt?8:32,maxStep:dt||1,sleepDelay:0},dt);
 for(const body of next.bodies){const o=objects.get(body.id);if(!o)continue;o.x=body.position[0]+center[0];o.y=body.position[1]+center[1];o.vx=body.velocity[0];o.vy=body.velocity[1];if(dt&&reduced&&Math.hypot(o.vx,o.vy)>1)o.tossed=true;}
}
