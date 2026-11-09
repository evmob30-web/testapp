(function(root){
function create(){return {remaining:0,cooldown:0,x:0,z:1};}
function dodge(c,x,z){if(c.cooldown>0||c.remaining>0)return false;const length=Math.hypot(x,z);if(length<.001)return false;c.x=x/length;c.z=z/length;c.remaining=.38;c.cooldown=1.35;return true;}
function tick(c,dt){c.remaining=Math.max(0,c.remaining-dt);c.cooldown=Math.max(0,c.cooldown-dt);}
// Swept point-to-segment test: snelle projectielen slaan geen botsingen over.
function segmentHit(ax,az,bx,bz,px,pz,radius){const dx=bx-ax,dz=bz-az,len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/len)):0;return Math.hypot(px-(ax+dx*t),pz-(az+dz*t))<=radius;}
root.EmberCombat={create,dodge,tick,segmentHit};
})(typeof window==='undefined'?globalThis:window);
