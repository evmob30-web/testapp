(function(root){
function create(){return {remaining:0,cooldown:0,x:0,z:1};}
function dodge(c,x,z){if(c.cooldown>0||c.remaining>0)return false;const length=Math.hypot(x,z);if(length<.001)return false;c.x=x/length;c.z=z/length;c.remaining=.38;c.cooldown=1.35;return true;}
function tick(c,dt){c.remaining=Math.max(0,c.remaining-dt);c.cooldown=Math.max(0,c.cooldown-dt);}
// Swept point-to-segment test: snelle projectielen slaan geen botsingen over.
function segmentHit(ax,az,bx,bz,px,pz,radius){const dx=bx-ax,dz=bz-az,len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/len)):0;return Math.hypot(px-(ax+dx*t),pz-(az+dz*t))<=radius;}
function circleT(ax,az,bx,bz,cx,cz,r){const dx=bx-ax,dz=bz-az,ox=ax-cx,oz=az-cz,a=dx*dx+dz*dz,c=ox*ox+oz*oz-r*r;if(c<=0)return 0;if(a<1e-12)return Infinity;const b=2*(ox*dx+oz*dz),disc=b*b-4*a*c;if(disc<0)return Infinity;const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:Infinity;}
function turnToward(angle,target,step){const delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));return angle+Math.max(-step,Math.min(step,delta));}
function shieldBlocks(facing,dx,dz){const len=Math.hypot(dx,dz);return len>0&&(-dx*Math.sin(facing)-dz*Math.cos(facing))/len>.35;}
// The third strike is a heavier finisher; each consecutive hit must arrive
// within the chain window. Timing is frame-rate independent and never saved.
const comboMoves=[
 {step:1,name:'Snelle slag',multiplier:1,cooldown:.36,duration:.3,color:'#ffdb99'},
 {step:2,name:'Kruisslag',multiplier:1.2,cooldown:.34,duration:.3,color:'#ffc27e'},
 {step:3,name:'Vuurfinish',multiplier:1.65,cooldown:.52,duration:.42,color:'#ff8750'}
];
function createCombo(){return {step:0,window:0};}
function resetCombo(combo){combo.step=0;combo.window=0;return combo;}
function tickCombo(combo,dt){combo.window=Math.max(0,combo.window-Math.max(0,dt));if(combo.window===0)combo.step=0;return combo;}
function nextCombo(combo){
 const step=combo.window>0?(combo.step%3)+1:1;
 const move=comboMoves[step-1];combo.step=step;combo.window=.9;
 return move;
}
root.EmberCombat={create,dodge,tick,segmentHit,circleT,turnToward,shieldBlocks,comboMoves,createCombo,resetCombo,tickCombo,nextCombo};
})(typeof window==='undefined'?globalThis:window);
