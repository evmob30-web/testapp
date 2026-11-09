/* Emberwild mage: bounded mana, frost status and original lightweight staff/VFX.
 * No save schema migration or external assets. Geometry/materials are reused. */
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
 const staff=new T.Group();staff.name='MageStaff';rig.joints.weapon_r.add(staff);staff.position.set(0,-.05,.13);
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
 let enabled=false,weapon='staff',castTime=0,castDuration=.34,nova=false;
 function setClass(id){enabled=id==='mage';accents.visible=enabled;staff.visible=enabled&&weapon==='staff';}
 function setWeapon(id){weapon=id;staff.visible=enabled&&weapon==='staff';}
 function cast(kind='bolt'){nova=kind==='frost';castDuration=nova?.5:.34;castTime=castDuration;}
 function update(dt,time,moving=false){
  castTime=Math.max(0,castTime-dt);gem.rotation.y=time*.8;orbit.rotation.z=time*.7;
  magic.emissiveIntensity=.9+Math.sin(time*2)*.12+(castTime>0?.6:0);
  if(!enabled)return;
  if(weapon==='staff'){
   const amount=castTime>0?Math.sin((1-castTime/castDuration)*Math.PI):0;
   rig.joints.upper_arm_r.rotation.x-=.10+amount*.85;
   rig.joints.lower_arm_r.rotation.x-=.09+amount*.18;
   staff.rotation.z=.035*Math.sin(time*1.3)*(moving?.35:1);
  }
  if(nova&&castTime>0){const amount=Math.sin((1-castTime/castDuration)*Math.PI);rig.joints.upper_arm_l.rotation.z-=amount*.52;rig.joints.upper_arm_l.rotation.x-=amount*.45;}
 }
 setClass('guardian');
 return {staff,accents,gem,setClass,setWeapon,cast,update};
}
root.EmberMage={isMage,spend,regenerate,chill,tickEnemy,movementScale,nearby,bolt,markChilled,attach};
})(typeof window==='undefined'?globalThis:window);
