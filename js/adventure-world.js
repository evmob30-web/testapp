/* Rendering adapter for the persistent encounter state. Combat owns live movement. */
(function(root){
'use strict';
function create(world){
 const T=root.THREE,data=root.EmberAdventureData,E=root.EmberEncounters,Q=root.EmberQuests,bodies=new Map();
 function label(text,color,width=512){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=128;const ctx=canvas.getContext('2d');ctx.font='600 38px system-ui';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,width/2,76);
  const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthTest:false}));sprite.scale.set(width/128,1,1);return sprite;
 }
 const npc=data.npcs.rowan,rowan=root.EmberForestActors.createRangerNPC(T,{id:'rowan'}),look={hairStyle:'short',hairColor:'chestnut',skinTone:'tan',eyeColor:'green'};
 rowan.group.name='JagerRowan';rowan.group.userData.npc='rowan';rowan.group.position.set(npc.x,0,npc.z);rowan.appearance.apply('classic',look);rowan.assets?.setLook('classic',look,'ranger');
 const felt=new T.MeshStandardMaterial({color:'#5e6951',roughness:.95}),band=new T.MeshStandardMaterial({color:'#886a45',roughness:.86});
 const hat=new T.Mesh(new T.SphereGeometry(.34,14,8,0,Math.PI*2,0,Math.PI/2),felt);hat.scale.set(1,.85,.94);hat.position.set(0,.28,0);rowan.joints.head.add(hat);
 const brim=new T.Mesh(new T.TorusGeometry(.32,.045,5,18),band);brim.scale.set(1.3,1,.7);brim.rotation.x=Math.PI/2;brim.position.y=.28;rowan.joints.head.add(brim);
 world.scene.add(rowan.group);const nameplate=label(npc.name,'#e8e3bd');nameplate.position.set(npc.x,3.55,npc.z);world.scene.add(nameplate);
 world.registerNPC('rowan',rowan,nameplate,null,{yaw:-.35,forward:4.7,side:2,targetSide:1.15});
 const indicators=new Map();let indicatorTime=0;
 for(const [id,entry]of world.npcActors){
  if(entry.questMarker){entry.questMarker.visible=false;entry.questMarker.removeFromParent();}const marker=root.EmberQuestMarkers.create(T),{group,symbols}=marker;group.name=id==='rowan'?'RowanQuestIndicator':id+'QuestIndicator';group.userData.npcId=id;
  world.scene.add(group);entry.questMarker=group;indicators.set(id,{group,symbols,marker,actor:entry.actor});
 }
 const indicator=indicators.get('rowan').group;
 const ringGeometry=new T.RingGeometry(.34,.39,28),sparkGeometry=new T.OctahedronGeometry(.065),gold=new T.MeshBasicMaterial({color:'#e8c87b',transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false});
 function removeBody(id){
  const entry=bodies.get(id);if(!entry)return;entry.marker.removeFromParent();if(entry.fallback)entry.model.removeFromParent();else entry.enemy.visual.reset();bodies.delete(id);
 }
 function reset(){for(const id of [...bodies.keys()])removeBody(id);}
 function bind(enemy,current,spawn){
  enemy.visual?.reset();enemy.instanceId=current.instanceId;enemy.spawnId=spawn.id;enemy.enemyType=spawn.enemyType;enemy.level=spawn.stats.level;enemy.definition=spawn.stats;enemy.name=spawn.stats.name;enemy.max=spawn.stats.hp;enemy.hp=current.hp;enemy.damage=spawn.stats.damage;enemy.speed=spawn.stats.speed;enemy.mesh.position.set(current.x,0,current.z);enemy.mesh.scale.setScalar(1);enemy.mesh.rotation.x=enemy.mesh.rotation.z=0;
  Object.assign(enemy,{attack:1,windup:0,flash:0,stagger:0,chill:0,pattern:0,alertTimer:0,focusUntil:0,pendingAttack:null,telegraph:0,dodgeTime:0,dodgeCooldown:0,dodgeVector:null,lastX:current.x,lastZ:current.z});if(enemy.warningMesh)enemy.warningMesh.visible=false;if(enemy.chillHalo)enemy.chillHalo.visible=false;
 }
 function makeBody(enemy,current,state){
  let model,fallback=false;
  if(enemy.visual?.defeat){
   if(!enemy.visual.dying){enemy.visual.update(0,enemy);enemy.visual.defeat(world.scene,{hold:true});const age=Math.min(1.95,state.encounters.clock-current.deadAt);for(let t=0;t<age;t+=.04)enemy.visual.update(Math.min(.04,age-t),enemy);}
   model=enemy.visual.model;
  }else{model=enemy.mesh.clone(true);model.visible=true;model.position.set(current.x,.5,current.z);model.rotation.x=-Math.PI*.46;world.scene.add(model);fallback=true;}
  const marker=new T.Group();marker.name='LootableCorpse';marker.position.set(current.x,.10,current.z);const ring=new T.Mesh(ringGeometry,gold);ring.rotation.x=-Math.PI/2;marker.add(ring);
  for(let i=0;i<3;i++){const spark=new T.Mesh(sparkGeometry,gold);spark.position.set(Math.cos(i*2.09)*.25,.65+i*.14,Math.sin(i*2.09)*.25);marker.add(spark);}world.scene.add(marker);
  const entry={enemy,instanceId:current.instanceId,model,marker,fallback};bodies.set(enemy.id,entry);return entry;
 }
 function reconcile(state,force=false){
  if(force)reset();
  for(const enemy of world.enemies){
   const spawn=E.spawnDefinitions.get(enemy.id),current=state.encounters.spawns[enemy.id];if(!spawn||!current)continue;
   if(force||enemy.instanceId!==current.instanceId){removeBody(enemy.id);bind(enemy,current,spawn);}
   enemy.dead=current.status==='dead';enemy.mesh.visible=!enemy.dead&&spawn.area===state.area;
   const loot=E.available(state.encounters,state.journal,enemy.id),show=enemy.dead&&loot.length>0&&spawn.area===state.area;
   if(show){const entry=bodies.get(enemy.id);if(!entry||entry.instanceId!==current.instanceId){removeBody(enemy.id);makeBody(enemy,current,state);}}
   else removeBody(enemy.id);
  }
  rowan.group.visible=state.area==='valley';nameplate.visible=state.area==='valley'&&!world.conversation;
  for(const [id,entry]of indicators){
   const status=Q.npcStatus(state.journal,id,root.RPG.npcQuestStatuses(state,id),state),code=status==='READY_TO_TURN_IN'?2:status==='NOT_STARTED'?0:status==='ACTIVE'?1:-1;
   entry.marker.place(entry.actor.group.position);entry.group.visible=(data.npcs[id]?.area||'valley')===state.area&&entry.actor.group.visible&&!world.conversation&&code>=0;entry.symbols.forEach((sprite,i)=>sprite.visible=i===code);entry.group.userData.questStatus=code===2?'ready':code===1?'active':code===0?'available':'completed';
  }
 }
 function update(dt,time,state){reconcile(state);indicatorTime+=dt;for(const entry of bodies.values()){entry.marker.rotation.y=time*.32;entry.marker.children.forEach((m,i)=>{if(i)m.position.y=.65+(i-1)*.14+Math.sin(time*2+i)*.09;});}}
 function updateIndicators(camera,viewportHeight){camera.updateMatrixWorld();for(const entry of indicators.values())entry.marker.updateView(camera,viewportHeight,indicatorTime);}

 function nearest(state){let found=null,best=3.1;for(const [id,entry]of bodies){const p=entry.marker.position,d=Math.hypot(state.x-p.x,state.z-p.z);if(d<best){best=d;found=id;}}return found;}
 function pick(raycaster){let found=null,best=Infinity;for(const [id,entry]of bodies){entry.model.updateWorldMatrix(true,true);entry.marker.updateWorldMatrix(true,true);const hits=[...raycaster.intersectObject(entry.model,true),...raycaster.intersectObject(entry.marker,true)];for(const hit of hits)if(hit.distance<best){best=hit.distance;found=id;}}return found;}
 function wander(enemy,dt,state){
  const radius=enemy.definition?.wanderRadius;if(!radius)return false;const i=data.spawns.findIndex(s=>s.id===enemy.id),t=state.encounters.clock*.18+i*1.7,x=enemy.homeX+Math.sin(t)*radius,z=enemy.homeZ+Math.cos(t*.83)*radius,dx=x-enemy.mesh.position.x,dz=z-enemy.mesh.position.z,d=Math.hypot(dx,dz);
  if(d<.08)return true;const step=Math.min(d,dt*.65),nx=enemy.mesh.position.x+dx/d*step,nz=enemy.mesh.position.z+dz/d*step;
  if(!world.colliders.some(c=>Math.hypot(nx-c.x,nz-c.z)<c.r+.6)){enemy.mesh.position.x=nx;enemy.mesh.position.z=nz;enemy.mesh.rotation.y=root.EmberCombat.turnToward(enemy.mesh.rotation.y,Math.atan2(dx,dz),dt*2.1);}return true;
 }
 return {rowan,indicator,indicators,nameplate,bodies,reconcile,update,updateIndicators,reset,nearest,pick,wander};
}
root.EmberAdventureWorld={create};
})(typeof window==='undefined'?globalThis:window);
