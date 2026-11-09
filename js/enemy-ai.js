/* Emberwild enemy tactics. Deterministic, frame-rate independent; no save changes. */
(function(root){
'use strict';
const profiles={
 wolf:{sight:11,leash:17,range:1.9,windup:.42,cooldown:1.5,group:8,flank:1.3},
 guardian:{sight:11,leash:17,range:2.05,windup:.68,cooldown:2.2,group:7,flank:0},
 spirit:{sight:12,leash:19,range:8,windup:.32,cooldown:2.1,group:8,flank:0},
 boss:{sight:16,leash:21,range:3.5,windup:1.15,cooldown:3,group:0,flank:0}
};
function type(e){return e.boss?'boss':e.spirit?'spirit':e.shield?'guardian':'wolf';}
function config(e){return profiles[type(e)];}
function ensure(e){
 if(!Number.isFinite(e.alertTimer))e.alertTimer=0;
 if(!Number.isFinite(e.dodgeCooldown))e.dodgeCooldown=0;
 if(!Number.isFinite(e.dodgeTime))e.dodgeTime=0;
 if(!Number.isFinite(e.telegraph))e.telegraph=0;
 if(!Number.isFinite(e.flankSide))e.flankSide=(Number(String(e.id).match(/\d+$/)?.[0]||0)%2)?1:-1;
}
function notifyHit(enemy,enemies,playerX,playerZ){
 ensure(enemy);enemy.alertTimer=10;enemy.attack=Math.min(enemy.attack,.5);
 const group=config(enemy).group;
 if(!group)return;
 for(const ally of enemies){
  if(ally===enemy||!ally.mesh.visible||ally.boss||(ally.area||'valley')!==(enemy.area||'valley'))continue;
  const d=Math.hypot(ally.mesh.position.x-enemy.mesh.position.x,ally.mesh.position.z-enemy.mesh.position.z);
  if(d>group)continue;
  ensure(ally);ally.alertTimer=Math.max(ally.alertTimer,5.5);
 }
}
function active(e,playerX,playerZ){
 const p=config(e),d=Math.hypot(playerX-e.mesh.position.x,playerZ-e.mesh.position.z);
 const homeD=Math.hypot(playerX-e.homeX,playerZ-e.homeZ);
 return d<p.sight&&homeD<p.leash||e.alertTimer>0&&d<=32;
}
function tick(e,dt){
 ensure(e);e.alertTimer=Math.max(0,e.alertTimer-dt);
 e.dodgeCooldown=Math.max(0,e.dodgeCooldown-dt);
 e.dodgeTime=Math.max(0,e.dodgeTime-dt);
 e.telegraph=Math.max(0,e.telegraph-dt);
}
function startWarning(e,duration){
 ensure(e);e.telegraph=duration;return e.telegraph;
}
function dodgeArrow(e,arrows){
 ensure(e);
 if(e.boss||e.spirit||e.dodgeCooldown>0||e.dodgeTime>0||e.windup>0||e.telegraph>0||e.alertTimer<=0)return null;
 const p=e.mesh.position;
 for(const a of arrows){
  const speed=Math.hypot(a.vx,a.vz);
  if(speed<.001)continue;
  const dx=p.x-a.x,dz=p.z-a.z;
  const forward=(dx*a.vx+dz*a.vz)/speed;
  if(forward<=.4||forward>6.5)continue;
  const side=(dx*a.vz-dz*a.vx)/speed;
  if(Math.abs(side)>.85)continue;
  // Pick the side away from the approaching arrow, then evade once.
  const sign=side===0?e.flankSide:Math.sign(side);
  e.dodgeTime=.28;e.dodgeCooldown=2.6;
  return {x:-a.vz/speed*sign,z:a.vx/speed*sign};
 }
 return null;
}
function movement(e,px,pz,neighbors=[]){
 const p=config(e),pos=e.mesh.position,dx=px-pos.x,dz=pz-pos.z,d=Math.hypot(dx,dz);
 if(d<.001)return {x:0,z:0,d};
 const towardX=dx/d,towardZ=dz/d;
 if(e.spirit){
  const direction=d>8.5?1:d<5.8?-1:0;
  return {x:towardX*direction,z:towardZ*direction,d};
 }
 if(e.boss||e.shield||d>8)return {x:towardX,z:towardZ,d};
 if(p.flank){
  const mates=neighbors.filter(n=>n!==e&&n.mesh.visible&&!n.boss&&n.alertTimer>0&&Math.hypot(n.mesh.position.x-pos.x,n.mesh.position.z-pos.z)<6);
  const flank=d>p.range+.15?(mates.length?.8:.42):.15;
  const side=e.flankSide||1;
  const x=towardX*(d>p.range?1:.05)+(-towardZ)*side*flank;
  const z=towardZ*(d>p.range?1:.05)+towardX*side*flank;
  const len=Math.hypot(x,z)||1;
  return {x:x/len,z:z/len,d,coordinated:mates.length>0};
 }
 return {x:towardX,z:towardZ,d};
}
root.EmberEnemyAI={profiles,type,config,ensure,notifyHit,active,tick,startWarning,dodgeArrow,movement};
})(typeof window==='undefined'?globalThis:window);
