/* Original, safe mage lessons. Props exist only during their accepted lesson. */
(function(root){
'use strict';
const lessonIds=['mage_spark','mage_ward','mage_step'];
function active(s,id){return s.classId==='mage'&&s.area==='valley'&&root.EmberQuests.status(s.journal,id)==='ACTIVE';}
function visible(s,id){return s.classId==='mage'&&s.area==='valley'&&['ACTIVE','READY_TO_TURN_IN'].includes(root.EmberQuests.status(s.journal,id));}
function record(s,id,objectId){return active(s,id)&&root.EmberQuests.signal(s.journal,{type:'INTERACT',objectId});}
function recordBolt(s){return record(s,'mage_spark','mage-target');}
function recordBlock(s,absorbed){const p=root.EmberAdventureData.mageTraining.ward;return absorbed>0&&Math.hypot(s.x-p.x,s.z-p.z)<=1.25&&record(s,'mage_ward','mage-barrier');}
function recordBlink(s,result){
 const d=root.EmberAdventureData.mageTraining;
 return !!(result?.ok&&result.distance>=4.5&&Math.hypot(result.from.x-d.blinkStart.x,result.from.z-d.blinkStart.z)<=1.8&&Math.hypot(result.x-d.blinkEnd.x,result.z-d.blinkEnd.z)<=1.8&&record(s,'mage_step','mage-blink'));
}
function create(world){
 const T=root.THREE,D=root.EmberAdventureData,spots=D.mageTraining;
 const npc=root.EmberForestActors.createRangerNPC(T,{id:'lyra'}),look={hairStyle:'braid',hairColor:'silver',skinTone:'warm',eyeColor:'blue'};
 npc.group.name='MagistraLyra';npc.group.position.set(D.npcs.lyra.x,0,D.npcs.lyra.z);npc.back.visible=npc.bow.visible=false;
 npc.group.traverse(m=>{if(m.name==='elin_oak_brooch'||m.name==='elin_leaf_mantle')m.visible=false;});
 npc.appearance.apply('classic',look);npc.assets?.setLook('classic',look,'mage');
 npc.ready=npc.ready.then(ok=>{npc.assets?.models.getObjectByName('GLB_classic')?.traverse(m=>{if(!m.isSkinnedMesh)return;const colors={fabric:'#6f649e',cape:'#3e375f',leather:'#58475b',metal:'#c9baa0'};if(colors[m.material.name])m.material.color.set(colors[m.material.name]);});return ok;});
 const mageView=root.EmberMage.attach(T,npc);mageView.setClass('mage');mageView.setWeapon('staff');
 const npcUpdate=npc.update,npcTalk=npc.setTalking;let elapsed=0;
 npc.update=(dt,player)=>{npcUpdate(dt,player);elapsed+=dt;mageView.update(dt,elapsed);};
 npc.setTalking=value=>{npcTalk(value);if(value)mageView.cast('barrier');};
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.font='600 36px system-ui';ctx.textAlign='center';ctx.fillStyle='#e5d3ff';ctx.fillText('Magistra Lyra',256,76);
 const nameplate=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthTest:false,depthWrite:false}));nameplate.scale.set(4,1,1);nameplate.position.set(D.npcs.lyra.x,3.55,D.npcs.lyra.z);
 world.scene.add(npc.group,nameplate);world.registerNPC('lyra',npc,nameplate,null,{yaw:.4,forward:4.5,side:2,targetSide:1.1});
 const gold=new T.MeshStandardMaterial({color:'#d6bc86',roughness:.55,metalness:.5}),stone=new T.MeshStandardMaterial({color:'#72738b',roughness:.9}),glow=new T.MeshStandardMaterial({color:'#a8caff',emissive:'#6869d6',emissiveIntensity:.7,roughness:.45});
 const runeGeometry=new T.RingGeometry(1.15,1.24,40),runeBlue=new T.MeshBasicMaterial({color:'#9bdcff',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}),runeGold=runeBlue.clone();runeGold.color.set('#ffdc95');
 function rune(name,p,material=runeBlue){const group=new T.Group();group.name=name;group.position.set(p.x,.055,p.z);const ring=new T.Mesh(runeGeometry,material);ring.rotation.x=-Math.PI/2;group.add(ring);for(let i=0;i<6;i++){const gem=new T.Mesh(new T.OctahedronGeometry(.07),material);gem.position.set(Math.sin(i*Math.PI/3)*1.42,.08,Math.cos(i*Math.PI/3)*1.42);group.add(gem);}world.scene.add(group);return group;}
 const firing=rune('MageFiringRune',spots.firing),ward=rune('MageWardRune',spots.ward),blinkStart=rune('MageBlinkStart',spots.blinkStart,runeGold),blinkEnd=rune('MageBlinkEnd',spots.blinkEnd);
 const target=new T.Group();target.name='MageTrainingCrystal';target.position.set(spots.target.x,0,spots.target.z);
 const base=new T.Mesh(new T.CylinderGeometry(.6,.8,.4,8),stone);base.position.y=.2;target.add(base);
 const cage=new T.Mesh(new T.TorusGeometry(.65,.035,5,32),gold);cage.position.y=1.6;target.add(cage);
 const crystal=new T.Mesh(new T.OctahedronGeometry(.45),glow);crystal.position.y=1.6;crystal.scale.y=1.5;target.add(crystal);world.scene.add(target);
 let pulse=0,lastQuest=null;
 function sync(s){const show=visible(s,'mage_spark');target.visible=firing.visible=show;ward.visible=visible(s,'mage_ward');blinkStart.visible=blinkEnd.visible=visible(s,'mage_step');npc.group.visible=s.area==='valley';nameplate.visible=s.area==='valley'&&!world.conversation;const current=root.EmberQuests.status(s.journal,'mage_ward');if(current!==lastQuest){pulse=0;lastQuest=current;}}
 function update(dt,time,s){sync(s);crystal.rotation.y=time*.7;crystal.position.y=1.6+Math.sin(time*2)*.1;
  if(!active(s,'mage_ward')||Math.hypot(s.x-spots.ward.x,s.z-spots.ward.z)>1.25){pulse=0;return;}
  pulse+=dt;if(pulse<3)return;pulse=0;
  world.magicImpact(spots.ward.x,spots.ward.z,'#c8b5ff',.55);
  // Training pulses never subtract HP, even if the shield is missing or exhausted.
  const result=root.EmberMage.absorb(s,18);if(result.absorbed){mageView.cast('barrier');world.mageView.barrierHit();world.damageText('OPGEVANGEN',s.x,s.z,'#b5ddff');recordBlock(s,result.absorbed);}else world.damageText('GEBRUIK 3',s.x,s.z,'#e8d2ff');
 }
 return {npc,mageView,nameplate,target,firing,ward,blinkStart,blinkEnd,sync,update,recordBolt,recordBlink,get targetActive(){return target.visible;}};
}
root.EmberMageTraining={lessonIds,active,visible,recordBolt,recordBlock,recordBlink,create};
})(typeof window==='undefined'?globalThis:window);
