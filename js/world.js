/* Eigen low-poly landschap en personages; Three.js verzorgt uitsluitend WebGL. */
(function(){
function createWorld(){
const T=THREE,scene=new T.Scene();scene.background=new T.Color('#a8c4ba');scene.fog=new T.FogExp2('#adc4b1',.014);const colliders=[],cameraMeshes=[],animated=[],enemies=[],crystals=[],effects=[];
const mats={};function mat(color,emissive){const key=color+emissive;return mats[key]??=new T.MeshStandardMaterial({color,roughness:.95,flatShading:true,emissive:emissive||0,emissiveIntensity:emissive?.8:0});}
function mesh(geo,color,x,y,z,parent=scene){const m=new T.Mesh(geo,typeof color==='string'?mat(color):color);m.position.set(x,y,z);parent.add(m);m.receiveShadow=true;return m;}
const box=(w,h,d,color,x,y,z,parent)=>mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent);
const cone=(r,h,color,x,y,z,n=7,parent)=>mesh(new T.ConeGeometry(r,h,n),color,x,y,z,parent);
const sphere=(r,color,x,y,z,parent)=>mesh(new T.IcosahedronGeometry(r,0),color,x,y,z,parent);
scene.add(new T.HemisphereLight('#e4eddb','#344d40',2.15));const sun=new T.DirectionalLight('#ffe0ae',2.6);sun.position.set(-25,48,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:55,bottom:-55,near:1,far:125});sun.shadow.bias=-.001;sun.target.position.z=-16;scene.add(sun,sun.target);
// Colour regions share one surface; overlapping decorative planes caused z-fighting.
scene.add(EmberTerrain.create(T));
let seed=47;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
function tree(x,z,scale=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);box(.6,3,.6,'#665449',0,1.5,0,g);for(let j=0;j<3;j++){const crown=cone(2-j*.35,3.3-j*.3,['#486c53','#557b59','#6b8a61'][j],0,3.1+j*1.15,0,7,g);cameraMeshes.push(crown);}colliders.push({x,z,r:.8*scale});}
for(let i=0;i<85;i++){let x=(rand()-.5)*95,z=rand()*115-73;if(Math.abs(x)<6||z>10&&Math.abs(x)<19)continue;if(RPG.explorationSpots.some(p=>Math.hypot(x-p.x,z-p.z)<3.2))continue;if(RPG.crystals.some(c=>Math.hypot(x-c.x,z-c.z)<4)||RPG.enemies.some(e=>Math.hypot(x-e.x,z-e.z)<4))continue;const size=.7+rand()*.65;if(globalThis.EmberAdventureData&&[...EmberAdventureData.extraEnemies,...Object.values(EmberAdventureData.npcs),...(EmberAdventureData.trainingClearings||[])].some(p=>Math.hypot(x-p.x,z-p.z)<3.5))continue;tree(x,z,size);}
for(let i=0;i<20;i++){const x=(i%2?-1:1)*(43+rand()*30),z=rand()*150-100;cone(12+rand()*10,15+rand()*20,'#829986',x,6,z,5);}
function house(x,z,rotation){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);const body=box(6,4,5,'#d3c19a',0,2,0,g);body.castShadow=true;cameraMeshes.push(body);box(6.5,.3,5.5,'#65533f',0,4,0,g);const roof=cone(5.1,3,'#6a7771',0,5.5,0,4,g);roof.rotation.y=Math.PI/4;roof.castShadow=true;box(1.2,2.3,.12,'#584a36',0,1.15,2.55,g);for(const a of [-1.9,1.9]){box(.8,1,.1,'#ffcf80',a,2.2,2.56,g);box(.08,1.1,.12,'#66553e',a,2.2,2.65,g);}colliders.push({x,z,r:4.2});}
house(-12,22,-.5);house(12,23,.5);house(-12,11,.3);
// Village lanterns, banners, flowers and the campfire.
for(const x of [-4,4]){box(.15,3,.15,'#685a44',x,1.5,18);box(.6,.65,.6,mat('#ffe0a0','#edac55'),x,3,18);const flag=box(1.1,1.5,.07,'#738c9c',x+.6,2.5,12);box(.12,4,.12,'#73634b',x,2,12);}
const camp={x:0,z:14};for(let i=0;i<8;i++)sphere(.35,'#73766c',Math.cos(i*Math.PI/4)*1.3,.15,14+Math.sin(i*Math.PI/4)*1.3);const fire=cone(.55,1.7,mat('#ffc875','#ff8e3a'),0,.85,14,5);animated.push({mesh:fire,type:'fire'});const firelight=new T.PointLight('#ffbc74',6,12);firelight.position.set(0,2,14);scene.add(firelight);
for(let i=0;i<80;i++){const x=(rand()-.5)*65,z=rand()*90-58;if(Math.abs(x)<3)continue;const g=new T.Group();g.position.set(x,0,z);scene.add(g);box(.06,.4,.06,'#55715a',0,.2,0,g);sphere(.13,i%2?'#d2c6d6':'#efce89',0,.45,0,g);}
// Ruin at the north end; gateway is a visual landmark, not a second area.
const ruin=new T.Group();scene.add(ruin);for(const x of [-6,6]){box(1.4,6,1.4,'#899789',x,3,-58);box(2,.6,2,'#acb5a0',x,6,-58);colliders.push({x,z:-58,r:1});}box(14,.9,1.7,'#a4af9a',0,6.6,-58);const sigil=mesh(new T.TorusGeometry(1,.12,5,24),mat('#c59fdf','#9962cf'),0,4.5,-57);animated.push({mesh:sigil,type:'sigil'});for(const x of [-9,9]){const r=box(2,2.4,2,'#899789',x,1.2,-51);r.rotation.y=.3;colliders.push({x,z:-51,r:1.6});}
// Character models. Facing is towards +Z in local coordinates.
const player=EmberCharacterRig.create(T,{skin:'guardian'});const flameCostume=typeof EmberFlameGuardian!=='undefined'?EmberFlameGuardian.decorate(T,player):{setVisible(){},costumeMeshes:[],animate(){}};const appearance=EmberAppearance.attach(T,player,flameCostume);const armorVisual=EmberEquipment.attach(T,player);const modelAssets=globalThis.EmberModelAssets?.attach(T,player,flameCostume,appearance);const mageView=globalThis.EmberMage?.attach(T,player);player.group.position.set(0,0,22);scene.add(player.group);
const ornaments=[];for(const side of [-1,1])for(const y of [-.36,-.67]){const thorn=cone(.10,.32,mat('#d5eac0','#6fa87d'),side*.10,y,.12,4,player.joints.weapon_r);thorn.rotation.z=-side*.9;thorn.visible=false;ornaments.push(thorn);}
const ranger=EmberForestActors.createElin(T);ranger.group.position.set(-3,0,17);ranger.group.rotation.y=.6;scene.add(ranger.group);
const merchant=EmberVillageActors.create(T,'bram');merchant.group.position.set(8,0,19);merchant.group.rotation.y=-.8;scene.add(merchant.group);
function label(text,x,y,z,color='#fff0ba'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.font='500 32px system-ui';c.textAlign='center';c.fillStyle='#172e28b0';c.fillRect(0,22,512,58);c.fillStyle=color;c.fillText(text,256,61);const texture=new T.CanvasTexture(canvas),s=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));s.scale.set(4.5,1.125,1);s.position.set(x,y,z);scene.add(s);return s;}
const elinLabel=label('Elin · Wachter',-3,3.25,17),bramLabel=label('Bram · Handelaar',8,3.25,19);const marker=label('!',-3,4.3,17,'#ffdc7c');label('SCHEMERWOUD',0,5,-3,'#e7e4c4');
for(const e of [...RPG.enemies,...(globalThis.EmberAdventureData?.extraEnemies||[])]){let g=new T.Group();g.position.set(e.x,0,e.z);scene.add(g);let visual=null;if(e.boss){visual=EmberThornGuardian.create(T);scene.remove(g);g=visual.group;g.position.set(e.x,0,e.z);scene.add(g);}else if(e.spirit){visual=EmberGroveCreatures.createSpirit(T);scene.remove(g);g=visual.group;g.position.set(e.x,0,e.z);scene.add(g);}else{visual=EmberForestActors.createWolf(T,{coat:e.enemyType==='gray_wolf'?'gray':'shadow'});scene.remove(g);g=visual.group;g.position.set(e.x,0,e.z);scene.add(g);}
 const warningMesh=mesh(new T.RingGeometry(.1,e.boss?3.8:e.spirit?1.2:1.8,36),new T.MeshBasicMaterial({color:e.spirit?'#bb9eff':'#ff9c68',transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}),e.x,.07,e.z);
 warningMesh.rotation.x=-Math.PI/2;warningMesh.visible=false;
 enemies.push({...e,visual,mesh:g,warningMesh,hp:e.hp||(e.boss?280:e.spirit?90:65),max:e.hp||(e.boss?280:e.spirit?90:65),attack:1,windup:0,flash:0,homeX:e.x,homeZ:e.z});}
for(const c of RPG.crystals){const gem=mesh(new T.OctahedronGeometry(.7,0),mat('#a8e9d2','#4cbda8'),c.x,1.5,c.z);crystals.push({...c,mesh:gem});}
const chest=new T.Group();chest.position.set(24,0,-10);scene.add(chest);box(1.4,.9,1,'#937247',0,.5,0,chest);box(1.5,.12,1.1,'#d8b574',0,.85,0,chest);box(.25,.4,.05,'#edca83',0,.65,.55,chest);
const warning=mesh(new T.RingGeometry(.1,4.6,40),new T.MeshBasicMaterial({color:'#f0a167',transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false}),0,.05,-53);warning.rotation.x=-Math.PI/2;warning.visible=false;
const lootMeshes=new Map();
function clearLoot(){
 for(const entry of lootMeshes.values()){scene.remove(entry.group);entry.group.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();obj.material.dispose();}});}
 lootMeshes.clear();
}
function syncLoot(state){
 clearLoot();
 for(const drop of state.lootDrops||[]){
  if(drop.area!==state.area)continue;
  const color=EmberLoot.rarity[drop.rarity]?.color||'#c4d2c3';
  const group=new T.Group();group.position.set(drop.x,.5,drop.z);group.name='loot_'+drop.uid;
  const crystal=new T.Mesh(new T.OctahedronGeometry(.39,0),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.65,metalness:.1,roughness:.3}));
  crystal.position.y=.65;group.add(crystal);
  const ring=new T.Mesh(new T.TorusGeometry(.56,.055,5,28),new T.MeshBasicMaterial({color,transparent:true,opacity:.68}));
  ring.rotation.x=Math.PI/2;ring.position.y=.16;group.add(ring);
  const light=new T.Mesh(new T.CylinderGeometry(.2,.42,.9,12,1,true),new T.MeshBasicMaterial({color,transparent:true,opacity:.17,depthWrite:false,side:T.DoubleSide}));
  light.position.y=.5;group.add(light);
  scene.add(group);lootMeshes.set(drop.uid,{group,crystal,ring});
 }
}
function burst(x,z,color='#ffe0a1',count=12){for(let i=0;i<count&&effects.length<100;i++){const m=sphere(.1+Math.random()*.1,color,x,.8+Math.random(),z);effects.push({mesh:m,vx:(Math.random()-.5)*5,vz:(Math.random()-.5)*5,vy:2+Math.random()*3,life:.6,max:.6});}}
const npcActors=new Map();let conversation=null;const dialogueHidden=[];
function registerNPC(id,actor,nameplate,questMarker,camera={}){npcActors.set(id,{id,actor,nameplate,questMarker,camera:{yaw:0,forward:4.8,side:1.3,height:1.05,targetSide:.95,targetForward:-.35,...camera}});}
registerNPC('elin',ranger,elinLabel,marker,{yaw:0,forward:4.4,side:3.2,targetSide:.89,targetForward:-.65});
registerNPC('bram',merchant,bramLabel,null,{yaw:-.8,forward:4.8,side:1.3});
function barkBurst(x,z,count=7,height=2.2,radius=.35){
 for(let i=0;i<count&&effects.length<96;i++){
  const a=i/count*Math.PI*2+Math.random()*.3,m=EmberThornGuardian.fragment(T);m.position.set(x+Math.cos(a)*radius,height+Math.random()*.2,z+Math.sin(a)*radius);m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);scene.add(m);
  const speed=1.8+Math.random()*1.8,life=.65+Math.random()*.20;effects.push({mesh:m,vx:Math.cos(a)*speed,vz:Math.sin(a)*speed,vy:2+Math.random()*2,gravity:11,life,max:life,kind:'bark',spin:3+Math.random()*4,sharedGeometry:true});
 }
}
function thornImpact(x,z){barkBurst(x,z,14,.10,1.1);magicImpact(x,z,'#d9b272',1.15);}
function updateNPC(dt){
 for(const entry of npcActors.values())entry.actor.update(dt,player.group.position);
 if(conversation)for(const entry of npcActors.values()){if(entry.nameplate)entry.nameplate.visible=false;if(entry.questMarker)entry.questMarker.visible=false;}
}
function setConversation(value){
 for(const item of dialogueHidden)item.object.visible=item.visible;dialogueHidden.length=0;
 const id=value===true?'elin':value;conversation=npcActors.get(id)||null;
 for(const entry of npcActors.values()){
  entry.actor.setTalking(entry===conversation);
  if(conversation)for(const object of [entry.nameplate,entry.questMarker])if(object){dialogueHidden.push({object,visible:object.visible});object.visible=false;}
 }
 if(conversation)for(const effect of effects)if(effect.mesh){dialogueHidden.push({object:effect.mesh,visible:effect.mesh.visible});effect.mesh.visible=false;}
 player.group.visible=!conversation;
}
function resetActors(){setConversation(false);for(const entry of npcActors.values())entry.actor.reset();for(const e of enemies)e.visual?.reset();}
function update(dt,time,moving,attacking,roll=0,running=false,comboStep=1){updateNPC(dt);for(const a of animated){if(a.type==='fire'){a.mesh.scale.y=1+Math.sin(time*9)*.12;a.mesh.rotation.y=time;}else a.mesh.rotation.z=time*.3;}for(const c of crystals){c.mesh.rotation.y=time;c.mesh.position.y=1.5+Math.sin(time*2+c.x)*.15;}player.animate(time,moving,attacking,{dt,running,comboStep,worldMotion:true,weapon:player.group.userData.weapon||'sword',roll:roll>0?1-roll/.38:undefined});flameCostume.animate?.(time,{moving,running,attacking});appearance.animate(time);modelAssets?.animate(time,{moving,running});mageView?.update(dt,time,moving);marker.position.y=4.3+Math.sin(time*2)*.12;for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.position.x+=e.vx*dt;e.mesh.position.z+=e.vz*dt;e.mesh.position.y+=e.vy*dt;e.vy-=(e.gravity??9)*dt;if(e.kind==='slash')e.mesh.rotation.z+=dt*7;if(e.kind==='frost')e.mesh.scale.setScalar(e.radius*(1-e.life/e.max));if(e.kind==='pulse')e.mesh.scale.multiplyScalar(1+dt*5);if(e.kind==='magic')e.mesh.rotation.y+=dt*7;if(e.kind==='bark'){e.mesh.rotation.x+=dt*e.spin;e.mesh.rotation.z+=dt*e.spin*.7;e.mesh.scale.setScalar(Math.min(1,Math.max(0,e.life)/.2));}if(e.ownedMaterial)e.mesh.material.opacity=Math.max(0,e.life/e.max);if(!e.kind)e.mesh.scale.setScalar(Math.max(0,e.life/e.max));if(e.life<=0){scene.remove(e.mesh);if(!e.sprite&&!e.sharedGeometry)e.mesh.geometry.dispose();if(e.ownedMaterial){if(e.mesh.material.map)e.mesh.material.map.dispose();e.mesh.material.dispose();}effects.splice(i,1);}}for(const entry of lootMeshes.values()){entry.crystal.rotation.y=time*1.3;entry.crystal.position.y=.65+Math.sin(time*2.5+entry.group.position.x)*.12;entry.ring.rotation.z=time*.4;}
for(const e of enemies){
 e.visual?.update(dt,e);
 if(e.spirit&&!e.visual&&e.mesh.visible)e.mesh.position.y=Math.sin(time*2+e.homeX)*.17;
 const indicator=e.warningMesh;
 if(!indicator)continue;
 indicator.visible=!!(e.mesh.visible&&e.telegraph>0);
 if(indicator.visible){
  indicator.position.set(e.mesh.position.x,.07,e.mesh.position.z);
  indicator.material.opacity=.27+.28*(.5+.5*Math.sin(time*18));
  indicator.rotation.z=time*.65;
 }
}}
function damageText(text,x,z,color='#ffe6ad'){if(effects.length>=100)return;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.font='bold 35px system-ui';c.textAlign='center';c.lineWidth=5;c.strokeStyle='#192b27';c.strokeText(String(text),128,46);c.fillStyle=color;c.fillText(String(text),128,46);const texture=new T.CanvasTexture(canvas),m=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));m.position.set(x,2.9,z);m.scale.set(3.2,.8,1);scene.add(m);effects.push({mesh:m,vx:0,vz:0,vy:1.4,gravity:0,life:.85,max:.85,kind:'text',sprite:true,ownedMaterial:true});}
function slash(x,z,angle,step=1){
 if(effects.length>=95)return;
 const styles=[{color:'#ffe2aa',outer:2.2,scale:1},{color:'#ffc47c',outer:2.55,scale:1.14},{color:'#ff7839',outer:3.05,scale:1.36}];
 const style=styles[Math.max(0,Math.min(2,step-1))];
 const m=mesh(new T.RingGeometry(1.35,style.outer,48,1,0,Math.PI*(step===2?1.3:1.1)),new T.MeshBasicMaterial({color:style.color,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),x,1.25,z);
 m.rotation.set(-Math.PI/2,0,-angle+(step===2?.35:step===3?-.2:0));m.scale.setScalar(style.scale);
 effects.push({mesh:m,vx:0,vz:0,vy:0,gravity:0,life:step===3?.37:.22,max:step===3?.37:.22,kind:'slash',ownedMaterial:true});
 if(step===3){burst(x+Math.sin(angle)*1.6,z+Math.cos(angle)*1.6,'#ff9750',12);magicImpact(x+Math.sin(angle)*1.7,z+Math.cos(angle)*1.7,'#ff994a',.8);}
}
function magicImpact(x,z,color='#ffbd79',radius=1){
 if(effects.length>=93)return;
 const ring=mesh(new T.RingGeometry(radius*.46,radius*.58,40),new T.MeshBasicMaterial({color,transparent:true,opacity:.95,side:T.DoubleSide,depthWrite:false}),x,.13,z);
 ring.rotation.x=-Math.PI/2;
 effects.push({mesh:ring,vx:0,vz:0,vy:0,gravity:0,life:.48,max:.48,kind:'pulse',ownedMaterial:true});
 burst(x,z,color,11);
}
function magicCast(x,z,tx,tz,color='#ffd58e'){
 magicImpact(x,z,color,.7);
 magicImpact(tx,tz,color,1.15);
 for(let i=0;i<3&&effects.length<94;i++){
   const height=.6+i*.45;
   const column=mesh(new T.CylinderGeometry(.13,.31,height,8),new T.MeshBasicMaterial({color,transparent:true,opacity:.7,depthWrite:false}),tx,height*.5,tz);
   effects.push({mesh:column,vx:0,vz:0,vy:.4+i*.18,gravity:0,life:.32+i*.1,max:.32+i*.1,kind:'magic',ownedMaterial:true});
 }
}
function beam(x,z,tx,tz){const length=Math.hypot(tx-x,tz-z),m=mesh(new T.CylinderGeometry(.07,.13,length,6),new T.MeshBasicMaterial({color:'#b0ffec',transparent:true,opacity:.8,depthWrite:false}),(x+tx)/2,1.5,(z+tz)/2);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(tx-x,0,tz-z).normalize());effects.push({mesh:m,vx:0,vz:0,vy:0,gravity:0,life:.18,max:.18,kind:'beam',ownedMaterial:true});}
const orbGeometry=new T.IcosahedronGeometry(.3,1),orbMaterial=mat('#e4c1fc','#aa69d5');
function orb(x,z){return mesh(orbGeometry,orbMaterial,x,1.4,z);}
function mageBolt(x,z){const m=EmberMage.bolt(T,x,z);scene.add(m);return m;}
function mageNova(x,z,radius){
 if(effects.length>=95)return;
 const ring=new T.Mesh(new T.RingGeometry(.96,1,64),new T.MeshBasicMaterial({color:'#a8eaff',transparent:true,opacity:.78,side:T.DoubleSide,depthWrite:false}));
 ring.rotation.x=-Math.PI/2;ring.position.set(x,.12,z);ring.scale.setScalar(.1);scene.add(ring);
 effects.push({mesh:ring,vx:0,vz:0,vy:0,gravity:0,life:.6,max:.6,radius,kind:'frost',ownedMaterial:true});burst(x,z,'#b9eaff',12);
}
const pendant=new T.Group();player.joints.chest.add(pendant);pendant.position.set(0,-.12,.40);sphere(.10,mat('#b1f1c6','#52a375'),0,0,0,pendant);const chain=mesh(new T.TorusGeometry(.13,.018,4,16),mat('#dfcc8f'),0,.1,0,pendant);pendant.visible=false;
function setAmulet(on){pendant.visible=!!on;}
function setWeapon(name,weapon='sword'){const thorn=name==='thorn',sword=weapon==='sword';player.group.userData.weapon=weapon;mageView?.setWeapon(weapon);player.blade.visible=sword;player.guard.visible=sword;player.blade.material=thorn?mat('#ade8c9','#539e7d'):mat('#d1ded5');player.blade.scale.set(thorn?1.8:1,thorn?1.3:1,thorn?1.4:1);for(const part of ornaments)part.visible=thorn&&sword;}
function setClass(id){player.setSkin(id);mageView?.setClass(id);}
function setArmor(state){armorVisual.sync(state);}
function setAppearance(id,classId='guardian',look){const flame=id==='flame_guardian';flameCostume.setVisible(flame);player.setSkin(flame?'flame_guardian':classId);appearance.apply(id,look);modelAssets?.setLook(id,look,classId);}
return {barkBurst,thornImpact,registerNPC,npcActors,get conversation(){return conversation;},updateNPC,setConversation,resetActors,mageView,mageBolt,mageNova,modelAssets,scene,colliders,cameraMeshes,sigil,player,ranger,merchant,enemies,crystals,chest,warning,marker,lootMeshes,syncLoot,clearLoot,burst,update,firelight,damageText,slash,beam,magicCast,magicImpact,orb,setWeapon,setClass,setAppearance,setAmulet,setArmor,effects};
}
window.EmberWorld={createWorld};
})();
