/* Emberwild mage: bounded mana, frost status and original lightweight staff/VFX.
 * Save-compatible power state, no external assets. Geometry/materials are reused. */
(function(root){
'use strict';
const resources=new WeakMap();
function isMage(s){return s.classId==='mage';}
function spend(s,cost){
 if(!isMage(s)||!Number.isFinite(cost)||cost<0||!Number.isFinite(s.mana)||s.mana+1e-8<cost)return false;
 s.mana=Math.max(0,s.mana-cost);return true;
}
function regenerate(s,dt){
 if(!isMage(s)||!Number.isFinite(dt)||dt<=0)return;
 const maximum=root.RPG.maxMana(s),current=Number.isFinite(s.mana)?s.mana:0;
 s.mana=Math.min(maximum,Math.max(0,current)+root.RPG.classConfig(s).regen*dt);
}
// Deadlines use the saved encounter clock: menus and offline time never consume them.
const powers=Object.freeze({barrier:Object.freeze({name:'Magische barrière',level:2,cost:20,cooldown:14,duration:5}),blink:Object.freeze({name:'Blink',level:3,cost:18,cooldown:8,distance:6.5})});
const clock=s=>Number.isFinite(s.encounters?.clock)?Math.max(0,s.encounters.clock):0;
function freshPowers(){return {version:1,barrierAmount:0,barrierUntil:0,barrierReadyAt:0,blinkReadyAt:0};}
function barrierCapacity(s){return 42+s.level*3;}
function restorePowers(s,raw){
 const p=freshPowers(),now=clock(s),n=(v,max)=>Number.isFinite(v)?Math.max(0,Math.min(max,v)):0;
 if(isMage(s)&&raw?.version===1){
  if(s.level>=powers.barrier.level){p.barrierReadyAt=n(raw.barrierReadyAt,now+powers.barrier.cooldown);p.barrierUntil=n(raw.barrierUntil,now+powers.barrier.duration);p.barrierAmount=p.barrierUntil>now?n(raw.barrierAmount,barrierCapacity(s)):0;}
  if(s.level>=powers.blink.level)p.blinkReadyAt=n(raw.blinkReadyAt,now+powers.blink.cooldown);
 }return p;
}
function tickPowers(s){
 const p=s.magePowers??=freshPowers();if(!isMage(s)||s.level<2||p.barrierUntil<=clock(s)){p.barrierAmount=0;p.barrierUntil=0;}return p;
}
function powerStatus(s,id){
 const rule=powers[id];if(!rule)return {ok:false,reason:'unknown'};
 const p=tickPowers(s),remaining=Math.max(0,p[id+'ReadyAt']-clock(s));
 const reason=!isMage(s)?'class':s.level<rule.level?'level':remaining>1e-8?'cooldown':s.mana<rule.cost?'mana':null;
 return {ok:!reason,reason,remaining,unlocked:isMage(s)&&s.level>=rule.level,...rule};
}
function barrier(s){
 const status=powerStatus(s,'barrier');if(!status.ok)return status;
 if(!spend(s,status.cost))return {ok:false,reason:'mana'};
 const p=tickPowers(s),now=clock(s);p.barrierAmount=barrierCapacity(s);p.barrierUntil=now+status.duration;p.barrierReadyAt=now+status.cooldown;return {ok:true,amount:p.barrierAmount};
}
function absorb(s,amount){
 if(!Number.isFinite(amount)||amount<=0)return {absorbed:0,damage:0};
 const p=tickPowers(s),absorbed=Math.min(amount,p.barrierAmount);p.barrierAmount-=absorbed;return {absorbed,damage:amount-absorbed};
}
function endBarrier(s){const p=tickPowers(s);p.barrierAmount=0;p.barrierUntil=0;}
function blinkDestination(s,direction,canStand){
 const length=Math.hypot(direction.x,direction.z);if(!Number.isFinite(length)||length<.001)return null;
 const dx=direction.x/length,dz=direction.z/length,distance=powers.blink.distance,steps=Math.ceil(distance/.08);let result=null;
 // Sweeping the player's complete collision radius prevents crossing thin walls and closed doors.
 for(let i=1;i<=steps;i++){const d=i/steps*distance,x=s.x+dx*d,z=s.z+dz*d;if(!canStand(x,z))break;result={x,z,distance:d};}
 return result&&result.distance>=.75?result:null;
}
function blink(s,direction,canStand){
 const status=powerStatus(s,'blink');if(!status.ok)return status;
 const target=blinkDestination(s,direction,canStand);if(!target)return {ok:false,reason:'blocked'};
 if(!spend(s,status.cost))return {ok:false,reason:'mana'};
 const from={x:s.x,z:s.z};s.x=target.x;s.z=target.z;tickPowers(s).blinkReadyAt=clock(s)+status.cooldown;return {ok:true,from,...target};
}
function chill(e){e.chill=Math.max(e.chill||0,e.boss?1.5:3);if(e.chillHalo)e.chillHalo.visible=true;}
function tickEnemy(e,dt){e.chill=Math.max(0,(e.chill||0)-dt);if(e.chillHalo)e.chillHalo.visible=e.chill>0;}
function movementScale(e){return e.chill>0?(e.boss?.72:.45):1;}
function nearby(s,enemies,radius,clearLine=()=>true){return enemies.filter(e=>e.mesh.visible&&root.RPG.enemyVisible(s,e)&&Math.hypot(e.mesh.position.x-s.x,e.mesh.position.z-s.z)<=radius&&clearLine(e.mesh.position.x,e.mesh.position.z));}
function shared(T){
 if(!resources.has(T))resources.set(T,{
  core:new T.OctahedronGeometry(.17,1),ring:new T.TorusGeometry(.21,.018,4,20),halo:new T.RingGeometry(.69,.75,28),
  blue:new T.MeshStandardMaterial({color:'#9be7ff',emissive:'#408cff',emissiveIntensity:1.3,roughness:.4}),
  violet:new T.MeshBasicMaterial({color:'#cbb4ff',transparent:true,opacity:.8}),
  frost:new T.MeshBasicMaterial({color:'#8ce1ff',transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false})
 });
 return resources.get(T);
}
function bolt(T,x,z){
 const a=shared(T),group=new T.Group();group.name='mage_bolt';group.position.set(x,1.8,z);
 group.add(new T.Mesh(a.core,a.blue));for(const side of [-1,1]){const m=new T.Mesh(a.ring,a.violet);m.rotation.set(side*.65,0,side*.65);group.add(m);}return group;
}
function markChilled(T,e){
 if(!e.chillHalo){e.chillHalo=new T.Mesh(shared(T).halo,shared(T).frost);e.chillHalo.name='mage_frost_halo';e.chillHalo.rotation.x=-Math.PI/2;e.chillHalo.position.y=.04;e.chillHalo.scale.setScalar(e.boss?1.6:1);e.mesh.add(e.chillHalo);}
 e.chillHalo.visible=true;
}
function attach(T,rig){
 const staff=new T.Group();staff.name='MageStaff';rig.joints.weapon_r.add(staff);
 const gold=new T.MeshStandardMaterial({color:'#d9c6a1',metalness:.48,roughness:.46});
 const wood=new T.MeshStandardMaterial({color:'#45345e',roughness:.78});
 const magic=new T.MeshStandardMaterial({color:'#b8deff',emissive:'#6585ff',emissiveIntensity:1.1,roughness:.4});
 const fabric=new T.MeshStandardMaterial({color:'#65508d',roughness:.85,side:T.DoubleSide});
 const inlay=new T.MeshStandardMaterial({color:'#d4c6f0',metalness:.32,roughness:.55});
 function mesh(parent,name,geometry,material,pos=[0,0,0]){const m=new T.Mesh(geometry,material);m.name=name;m.position.set(...pos);m.castShadow=true;parent.add(m);return m;}
 mesh(staff,'mage_staff_shaft',new T.CylinderGeometry(.035,.045,1.65,10),wood,[0,.04,0]);
 for(const y of [-.72,-.23,.22,.73])mesh(staff,'mage_staff_band',new T.CylinderGeometry(.052,.052,.075,10),gold,[0,y,0]);
 const crown=mesh(staff,'mage_staff_crown',new T.TorusGeometry(.16,.022,5,24),gold,[0,.91,0]);
 const gem=mesh(staff,'mage_staff_crystal',new T.OctahedronGeometry(.115,0),magic,[0,.92,0]);gem.scale.set(.72,1.55,.72);
 const orbit=mesh(staff,'mage_staff_orbit',new T.TorusGeometry(.20,.012,4,24),magic,[0,.92,0]);orbit.rotation.y=.65;
 const pommel=mesh(staff,'mage_staff_pommel',new T.OctahedronGeometry(.07,0),gold,[0,-.84,0]);pommel.scale.y=1.3;
 // Class accents work with either cosmetic skin and keep armor slots independent.
 const accents=new T.Group();accents.name='MageAccents';rig.joints.chest.add(accents);
 for(const side of [-1,1]){
  const g=root.EmberHeroArt?.create(T).plate([[side*.07,.28],[side*.23,.40],[side*.27,.23],[side*.12,.09]],.025,.008)||new T.BoxGeometry(.14,.23,.025);
  mesh(accents,'mage_mantle_clasp',g,fabric,[0,0,.35]);
  mesh(accents,'mage_silver_clasp',new T.OctahedronGeometry(.042,0),inlay,[side*.23,.27,.40]);
 }
 const ward=new T.Group();ward.name='MageBarrier';ward.position.y=1.3;rig.group.add(ward);
 const wardMat=new T.MeshBasicMaterial({color:'#8fceff',transparent:true,opacity:.12,depthWrite:false,side:T.FrontSide});
 const shell=new T.Mesh(new T.SphereGeometry(.88,16,10),wardMat);shell.scale.set(1,1.48,1);ward.add(shell);
 const wardRingMat=new T.MeshBasicMaterial({color:'#cfbbff',transparent:true,opacity:.65,depthWrite:false});
 const wardRing=new T.Mesh(new T.TorusGeometry(.88,.013,4,40),wardRingMat);wardRing.rotation.x=Math.PI/2;ward.add(wardRing);
 const rewardCrown=new T.Group();rewardCrown.name='StarweaverCrown';staff.add(rewardCrown);
 const crescent=mesh(rewardCrown,'starweaver_crescent',new T.TorusGeometry(.25,.028,6,32,Math.PI*1.55),gold,[0,.98,0]);crescent.rotation.z=-Math.PI*.27;
 for(const side of [-1,1]){const wing=mesh(rewardCrown,'starweaver_wing',new T.OctahedronGeometry(.10),inlay,[side*.18,1.05,0]);wing.scale.set(.5,1.8,.65);wing.rotation.z=-side*.45;mesh(rewardCrown,'starweaver_spark',new T.OctahedronGeometry(.04),magic,[side*.27,.86,0]);}
 function setStaff(id){const upgraded=id==='starweaver';rewardCrown.visible=upgraded;crown.visible=!upgraded;staff.userData.staffId=upgraded?'starweaver':'starter';gem.position.y=upgraded?1.0:.92;gem.scale.set(upgraded?.82:.72,upgraded?1.8:1.55,upgraded?.82:.72);magic.color.set(upgraded?'#b5efff':'#b8deff');magic.emissive.set(upgraded?'#4c9be0':'#6585ff');}
 setStaff('starter');
 let enabled=false,weapon='staff',castTime=0,castDuration=.34,nova=false,wardActive=false,wardFlash=0;
 function setBarrier(amount){wardActive=amount>0;ward.visible=enabled&&wardActive;}
 function barrierHit(){wardFlash=.25;}
 function setClass(id){enabled=id==='mage';accents.visible=enabled;ward.visible=enabled&&wardActive;staff.visible=enabled&&weapon==='staff';}
 function setWeapon(id){weapon=id;staff.visible=enabled&&weapon==='staff';}
 function cast(kind='bolt'){nova=kind==='frost'||kind==='barrier';castDuration=nova?.5:.34;castTime=castDuration;}
 const palm=new T.Vector3(),pole=new T.Vector3(),chest=new T.Vector3(),handQ=new T.Quaternion(),yawQ=new T.Quaternion(),tiltQ=new T.Quaternion(),tilt=new T.Euler();
 function update(dt,time,moving=false){
  wardFlash=Math.max(0,wardFlash-dt);wardMat.opacity=.09+Math.sin(time*3)*.015+wardFlash*.55;wardRing.rotation.z=time*.4;wardRingMat.opacity=.5+wardFlash;
  castTime=Math.max(0,castTime-dt);gem.rotation.y=time*.8;orbit.rotation.z=time*.7;
  magic.emissiveIntensity=.9+Math.sin(time*2)*.12+(castTime>0?.6:0);
  if(!enabled||weapon!=='staff'||rig.motion.rolling)return;
  rig.resetUpperPose();
  const amount=castTime>0?Math.sin((1-castTime/castDuration)*Math.PI):0;
  rig.joints.chest.rotation.y-=amount*.09;rig.joints.head.rotation.x-=amount*.035;
  rig.group.updateWorldMatrix(true,true);rig.group.getWorldQuaternion(yawQ);rig.group.worldToLocal(rig.joints.chest.getWorldPosition(chest));
  // The shaft crosses the fist; the wrist follows the forward-facing forearm.
  handQ.copy(yawQ).multiply(tiltQ.setFromEuler(tilt.set(amount*.24,-Math.PI/2,Math.PI/2,'XYZ')));
  palm.set(.60,chest.y-.61+amount*.26,.38+amount*.25).applyMatrix4(rig.group.matrixWorld);pole.set(.58,chest.y-.33,-.30).applyMatrix4(rig.group.matrixWorld);rig.aimArm('r',palm,pole,handQ);
  staff.rotation.set(0,0,0);
  if(nova&&castTime>0){
   handQ.copy(yawQ).multiply(tiltQ.setFromEuler(tilt.set(-.20,0,-.65*amount)));
   palm.set(-.62-amount*.28,chest.y-.72+amount*.72,.15+amount*.32).applyMatrix4(rig.group.matrixWorld);pole.set(-1.2,chest.y-.3,-.1).applyMatrix4(rig.group.matrixWorld);rig.aimArm('l',palm,pole,handQ);
  }
 }
 function muzzle(out=new T.Vector3()){rig.group.updateWorldMatrix(true,true);return gem.getWorldPosition(out);}
 setClass('guardian');
 return {staff,accents,gem,ward,setClass,setWeapon,setStaff,setBarrier,barrierHit,cast,update,muzzle};
}
root.EmberMage={powers,freshPowers,restorePowers,barrierCapacity,tickPowers,powerStatus,barrier,absorb,endBarrier,blinkDestination,blink,isMage,spend,regenerate,chill,tickEnemy,movementScale,nearby,bolt,markChilled,attach};
})(typeof window==='undefined'?globalThis:window);
