(function(root){
function create(){return {remaining:0,cooldown:0,x:0,z:1};}
function dodge(c,x,z){if(c.cooldown>0||c.remaining>0)return false;const length=Math.hypot(x,z);if(length<.001)return false;c.x=x/length;c.z=z/length;c.remaining=.38;c.cooldown=1.35;return true;}
function tick(c,dt){c.remaining=Math.max(0,c.remaining-dt);c.cooldown=Math.max(0,c.cooldown-dt);}
// Swept point-to-segment test: snelle projectielen slaan geen botsingen over.
function segmentHit(ax,az,bx,bz,px,pz,radius){const dx=bx-ax,dz=bz-az,len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/len)):0;return Math.hypot(px-(ax+dx*t),pz-(az+dz*t))<=radius;}
function circleT(ax,az,bx,bz,cx,cz,r){const dx=bx-ax,dz=bz-az,ox=ax-cx,oz=az-cz,a=dx*dx+dz*dz,c=ox*ox+oz*oz-r*r;if(c<=0)return 0;if(a<1e-12)return Infinity;const b=2*(ox*dx+oz*dz),disc=b*b-4*a*c;if(disc<0)return Infinity;const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:Infinity;}
function turnToward(angle,target,step){const delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));return angle+Math.max(-step,Math.min(step,delta));}
function shieldBlocks(facing,dx,dz){const len=Math.hypot(dx,dz);return len>0&&(-dx*Math.sin(facing)-dz*Math.cos(facing))/len>.35;}
root.EmberCombat={create,dodge,tick,segmentHit,circleT,turnToward,shieldBlocks};
})(typeof window==='undefined'?globalThis:window);
