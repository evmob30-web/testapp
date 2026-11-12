/* Vael: one original mage encounter, using the existing journal and saved spawns. */
(function(root){
'use strict';
const attacks=Object.freeze({lance:Object.freeze({name:'Sterrenlans',windup:1.15,recovery:1.8,damage:26,length:12,width:1.05}),nova:Object.freeze({name:'Breukkring',windup:1.65,recovery:4.2,damage:40,radius:3.1})});
function freshFight(){return {phase:'waiting',remaining:1.8,next:'lance',kind:null,origin:{x:0,z:0},aim:{x:0,z:0}};}
function stepFight(f,dt,origin,player){
 if(!Number.isFinite(dt)||dt<=0)return [];const events=[];f.remaining-=Math.min(dt,.25);
 while(f.remaining<=1e-9){
  if(f.phase==='warning'){
   events.push({type:'attack',kind:f.kind,origin:{...f.origin},aim:{...f.aim}});f.phase='recovery';f.remaining+=attacks[f.kind].recovery;f.next=f.kind==='lance'?'nova':'lance';
  }else{
   f.kind=f.next;f.phase='warning';f.origin={x:origin.x,z:origin.z};f.aim={x:player.x,z:player.z};f.remaining+=attacks[f.kind].windup;events.push({type:'warning',kind:f.kind,origin:{...f.origin},aim:{...f.aim}});
  }
 }return events;
}
function lanceEnd(event){const dx=event.aim.x-event.origin.x,dz=event.aim.z-event.origin.z,d=Math.hypot(dx,dz)||1;return {x:event.origin.x+dx/d*attacks.lance.length,z:event.origin.z+(dx||dz?dz/d:-1)*attacks.lance.length};}
function attackHits(event,player){
 if(event.kind==='nova')return Math.hypot(player.x-event.aim.x,player.z-event.aim.z)<attacks.nova.radius+.45;
 const end=lanceEnd(event),dx=end.x-event.origin.x,dz=end.z-event.origin.z,length=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((player.x-event.origin.x)*dx+(player.z-event.origin.z)*dz)/length));
 return Math.hypot(player.x-event.origin.x-dx*t,player.z-event.origin.z-dz*t)<attacks.lance.width;
}
function available(s){return s.classId==='mage'&&s.area==='valley'&&root.EmberQuests.status(s.journal,'mage_trial')==='ACTIVE';}
function createActor(T){
 const rig=root.EmberCharacterRig.create(T,{skin:'guardian'}),base=[];rig.group.traverse(m=>{if(m.isMesh)base.push(m);});rig.blade.visible=rig.guard.visible=false;
 const appearance=root.EmberAppearance.attach(T,rig,null),look={hairStyle:'long',hairColor:'silver',skinTone:'deep',eyeColor:'violet'};appearance.apply('classic',look);
 const assets=root.EmberModelAssets?.attach(T,rig,{baseMeshes:base,costumeMeshes:[]},appearance);assets?.setLook('classic',look,'mage');
 rig.group.name='VaelTheBrokenSpark';rig.group.userData.actor='arcane-echo';rig.group.scale.setScalar(1.13);
 const mage=root.EmberMage.attach(T,rig);mage.setClass('mage');mage.setWeapon('staff');mage.setStaff?.('starweaver');mage.gem.material.color.set('#e4b8ff');mage.gem.material.emissive.set('#a266f0');
 const art=root.EmberHeroArt.create(T),metal=new T.MeshStandardMaterial({color:'#313c65',metalness:.65,roughness:.42}),gold=new T.MeshStandardMaterial({color:'#d5bc8b',metalness:.6,roughness:.4}),crystal=new T.MeshStandardMaterial({color:'#a4d9ff',emissive:'#6a76ef',emissiveIntensity:.7,metalness:.22,roughness:.3});
 function part(parent,name,g,material,pos=[0,0,0]){const m=new T.Mesh(g,material);m.name=name;m.position.set(...pos);m.castShadow=true;parent.add(m);return m;}
 const head=rig.joints.head,chest=rig.joints.chest;
 part(head,'vael_faceted_mask',art.plate([[-.28,.36],[0,.46],[.28,.36],[.30,.05],[.18,-.22],[0,-.30],[-.18,-.22],[-.30,.05]],.12,.045),metal,[0,.04,.38]);
 for(const side of [-1,1]){
  const eye=part(head,'vael_crystal_visor',new T.OctahedronGeometry(.11),crystal,[side*.13,.17,.51]);eye.scale.set(1.35,.23,.4);eye.rotation.z=-side*.12;
  for(let i=0;i<3;i++){const crown=part(head,'vael_crown_crystal',new T.OctahedronGeometry(.12),i===1?crystal:gold,[side*(.19+i*.085),.47-i*.055,.01]);crown.scale.set(.7,2.5-i*.35,.7);crown.rotation.z=-side*(.1+i*.22);}
  const arm=rig.joints[side<0?'upper_arm_l':'upper_arm_r'];
  part(arm,'vael_shoulder_plate',art.curvedPlate([[-.24,.09],[0,.25],[.26,.10],[.23,-.19],[0,-.26],[-.21,-.13]],.05,.1,.20),metal,[side*.04,.06,.1]);
  for(let i=0;i<3;i++){const shard=part(arm,'vael_shoulder_shard',new T.OctahedronGeometry(.15),i===1?crystal:gold,[side*(.12+i*.10),.16-i*.035,.02]);shard.scale.set(.7,1.6,.65);shard.rotation.z=-side*(.2+i*.3);}
 }
 const core=part(chest,'vael_heart_crystal',new T.OctahedronGeometry(.18,1),crystal,[0,-.10,.41]);core.scale.set(.9,1.35,.55);
 const halo=part(chest,'vael_broken_halo',new T.TorusGeometry(.79,.025,5,48,Math.PI*1.75),gold,[0,.14,-.32]);halo.rotation.z=.25;
 const orbit=new T.Group();orbit.name='VaelOrbitingRunes';orbit.position.set(0,1.8,0);rig.group.add(orbit);
 for(let i=0;i<4;i++){const a=i*Math.PI/2,m=part(orbit,'vael_orbit_rune',new T.OctahedronGeometry(.085),crystal,[Math.sin(a)*1.02,Math.cos(a*2)*.24,Math.cos(a)*1.02]);m.scale.y=1.7;}
 const ready=assets?.ready.then(ok=>{assets.models.getObjectByName('GLB_classic')?.traverse(m=>{if(!m.isSkinnedMesh)return;const colors={fabric:'#3c3b69',cape:'#242641',leather:'#3f3c53',metal:'#746ca0'};if(colors[m.material.name])m.material.color.set(colors[m.material.name]);});return ok;})||Promise.resolve(false);
 let elapsed=0,flash=0,casting=false;
 function reset(){elapsed=0;flash=0;casting=false;rig.resetMotion();core.scale.set(.9,1.35,.55);}
 function signal(kind){casting=!!kind;if(kind)mage.cast(kind==='nova'?'frost':'bolt');}
 function update(dt,enemy){if(!rig.group.visible)return;elapsed+=dt;flash=Math.max(0,flash-dt);rig.animate(elapsed,false,0,{dt,weapon:'staff'});appearance.animate(elapsed);assets?.animate(elapsed);mage.update(dt,elapsed);orbit.rotation.y=elapsed*.32;halo.rotation.z=.25+Math.sin(elapsed*.5)*.08;crystal.emissiveIntensity=.7+(casting?.45:0)+flash*2;core.rotation.y=Math.sin(elapsed)*.15;}
 return {...rig,assets,ready,core,halo,orbit,mage,update,reset,signal,hit(){flash=.22;},attack(kind){signal(kind);},defeat(){casting=false;},get dying(){return false;}};
}
function create(world){
 const T=root.THREE,D=root.EmberAdventureData.arcaneTrial,boss=world.enemies.find(e=>e.id===D.spawnId),arena=new T.Group();arena.name='VaelQuestArena';arena.position.set(D.x,0,D.z);world.scene.add(arena);
 const ink=new T.MeshBasicMaterial({color:'#9db9ed',transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}),warn=new T.MeshBasicMaterial({color:'#ff9d59',transparent:true,opacity:.36,side:T.DoubleSide,depthWrite:false,fog:false}),edge=warn.clone();edge.opacity=.85;
 const ring=new T.Mesh(new T.RingGeometry(D.radius-.045,D.radius,64),ink);ring.rotation.x=-Math.PI/2;ring.position.y=.065;arena.add(ring);
 const stone=new T.MeshStandardMaterial({color:'#6a7086',roughness:.85}),glow=new T.MeshStandardMaterial({color:'#b8b7ee',emissive:'#6965aa',emissiveIntensity:.55,roughness:.5});
 for(let i=0;i<8;i++){const a=i*Math.PI/4,base=new T.Mesh(new T.CylinderGeometry(.19,.29,.34,6),stone),crystal=new T.Mesh(new T.OctahedronGeometry(.14),glow);base.position.set(Math.sin(a)*5.7,.17,Math.cos(a)*5.7);crystal.position.copy(base.position);crystal.position.y=.5;crystal.scale.y=1.8;arena.add(base,crystal);}
 const lance=new T.Group();lance.name='VaelLanceWarning';world.scene.add(lance);const lane=new T.Mesh(new T.PlaneGeometry(attacks.lance.width*2,attacks.lance.length),warn);lane.rotation.x=-Math.PI/2;lane.position.set(0,.085,attacks.lance.length/2);lance.add(lane);
 const w=attacks.lance.width,length=attacks.lance.length,laneEdge=new T.LineLoop(new T.BufferGeometry().setFromPoints([new T.Vector3(-w,.105,0),new T.Vector3(w,.105,0),new T.Vector3(w,.105,length),new T.Vector3(-w,.105,length)]),new T.LineBasicMaterial({color:'#ffe0a4',transparent:true,opacity:.95,depthWrite:false,fog:false}));lance.add(laneEdge);
 const arrowShape=new T.Shape();arrowShape.moveTo(-.24,.22);arrowShape.lineTo(.24,.22);arrowShape.lineTo(0,-.29);arrowShape.closePath();const arrowGeometry=new T.ShapeGeometry(arrowShape),arrowMaterial=new T.MeshBasicMaterial({color:'#ffda93',side:T.DoubleSide,depthWrite:false,fog:false});
 for(const z of [3,6,9]){const arrow=new T.Mesh(arrowGeometry,arrowMaterial);arrow.rotation.x=-Math.PI/2;arrow.position.set(0,.11,z);lance.add(arrow);}

 const nova=new T.Group();nova.name='VaelNovaWarning';world.scene.add(nova);const disk=new T.Mesh(new T.CircleGeometry(attacks.nova.radius,48),warn),outline=new T.Mesh(new T.RingGeometry(attacks.nova.radius-.07,attacks.nova.radius,48),edge);disk.rotation.x=outline.rotation.x=-Math.PI/2;outline.position.y=.012;nova.add(disk,outline);
 let fight=freshFight(),identity=null,inArena=false;
 function reset(s,restoreHealth=false){fight=freshFight();boss.visual.signal(null);lance.visible=nova.visible=false;if(restoreHealth){const current=s.encounters.spawns[D.spawnId];if(current?.status==='alive'){current.hp=boss.hp=boss.max;current.x=boss.homeX;current.z=boss.homeZ;boss.mesh.position.set(boss.homeX,0,boss.homeZ);}}}
 function sync(s){
  const key=s.encounters.worldId+'/'+s.encounters.spawns[D.spawnId].instanceId;if(identity!==key){identity=key;reset(s);}
  const enabled=available(s);arena.visible=enabled;inArena=enabled&&boss.mesh.visible&&Math.hypot(s.x-D.x,s.z-D.z)<=D.leash;
  if(!inArena)reset(s,enabled);const hint=document.getElementById('trial-hint');hint.hidden=!inArena;
  if(inArena)hint.textContent=fight.phase==='warning'?attacks[fight.kind].name+' · '+Math.max(0,fight.remaining).toFixed(1)+' s · '+(fight.kind==='lance'?'Barrière [3] of stap opzij':'Verlaat de kring · Blink [4]'):fight.phase==='recovery'?'Vael herstelt · Val nu aan!':'Vael verzamelt sterrenlicht…';
 }
 function update(dt,time,s,takeDamage){
  sync(s);if(!inArena)return;boss.mesh.rotation.y=Math.atan2(s.x-D.x,s.z-D.z);root.EmberMage.tickEnemy(boss,dt);
  for(const event of stepFight(fight,dt,{x:D.x,z:D.z},s)){
   if(event.type==='warning'){boss.visual.signal(event.kind);continue;}
   boss.visual.signal(null);
   if(event.kind==='lance'){const end=lanceEnd(event);world.beam?.(event.origin.x,event.origin.z,end.x,end.z);world.magicImpact(event.origin.x,event.origin.z,'#b9b9ff',.5);}
   else world.magicImpact(event.aim.x,event.aim.z,'#edb37d',1);
   if(attackHits(event,s))takeDamage(attacks[event.kind].damage);root.EmberAudio.play('spell');
  }
  lance.visible=fight.phase==='warning'&&fight.kind==='lance';nova.visible=fight.phase==='warning'&&fight.kind==='nova';
  if(lance.visible){const end=lanceEnd(fight);lance.position.set(fight.origin.x,0,fight.origin.z);lance.rotation.y=Math.atan2(end.x-fight.origin.x,end.z-fight.origin.z);}
  if(nova.visible)nova.position.set(fight.aim.x,.08,fight.aim.z);warn.opacity=.22+Math.sin(time*9)*.07+Math.max(0,1-fight.remaining/(attacks[fight.kind]?.windup||1))*.12;sync(s);
 }
 return {boss,arena,lance,nova,sync,update,reset,get fight(){return fight;},get inArena(){return inArena;}};
}
root.EmberArcaneTrial={attacks,freshFight,stepFight,lanceEnd,attackHits,available,createActor,create};
})(typeof window==='undefined'?globalThis:window);
