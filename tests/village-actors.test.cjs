const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),T=require('../vendor/three.min.js');
const env={THREE:T};env.window=env;vm.createContext(env);for(const file of ['hero-art','character-rig','appearance','village-actors'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),env);
const make=id=>env.EmberVillageActors.create(T,id);
test('villagers have distinct original outfits, cached geometry and independent bones/materials',async()=>{
 const bram=make('bram'),copy=make('bram'),mira=make('mira'),tovin=make('tovin');assert.equal(await bram.ready,false,'fallback works without a GLB loader');
 for(const [actor,part]of [[bram,'bram_beard'],[bram,'bram_potions'],[bram,'bram_ledger'],[mira,'mira_shawl'],[mira,'mira_flower_brooch'],[tovin,'tovin_satchel'],[tovin,'tovin_herbs'],[tovin,'TovinLantern']])assert.ok(actor.group.getObjectByName(part),part);
 const a=bram.group.getObjectByName('bram_apron_cloth'),b=copy.group.getObjectByName('bram_apron_cloth');assert.strictEqual(a.geometry,b.geometry);assert.notStrictEqual(a.material,b.material);assert.notStrictEqual(bram.joints.hand_r,copy.joints.hand_r);
 for(const actor of [bram,mira,tovin]){assert.equal(actor.blade.visible,false);assert.equal(actor.guard.visible,false);const accessoryMeshes=[];actor.group.traverse(m=>{if(m.isMesh&&m.name.startsWith(actor.group.userData.npc+'_'))accessoryMeshes.push(m);});assert.ok(accessoryMeshes.length<=22,'accessories are batched per material and bone');}
});
test('each villager gestures and faces a nearby player without moving or lifting planted feet',()=>{
 for(const id of ['bram','mira','tovin']){
  const actor=make(id);actor.group.position.set(8,0,19);const position=actor.group.position.clone(),hand=id==='bram'?'r':'l';
  for(let f=0;f<90;f++)actor.update(1/60,{x:8,z:21});assert.ok(Math.abs(actor.group.rotation.y)<.01);
  const idle=actor.group.worldToLocal(actor.palmWorld(hand));actor.setTalking(true);for(let f=0;f<90;f++)actor.update(1/60,{x:8,z:21});
  assert.ok(actor.talkBlend>.99);assert.ok(actor.group.worldToLocal(actor.palmWorld(hand)).distanceTo(idle)>.20,'speaking hand rises naturally');assert.ok(actor.group.position.distanceTo(position)<1e-8);
  for(const side of ['l','r'])assert.ok(Math.abs(actor.joints['foot_'+side].getWorldPosition(new T.Vector3()).y+.02)<.002);
  actor.setTalking(false);for(let f=0;f<150;f++)actor.update(1/60,{x:30,z:30});assert.ok(actor.talkBlend<.001);const shoulder=actor.group.worldToLocal(actor.joints['upper_arm_'+hand].getWorldPosition(new T.Vector3())),wrist=actor.group.worldToLocal(actor.joints['hand_'+hand].getWorldPosition(new T.Vector3()));assert.ok(wrist.y<shoulder.y-1,'hand returns beside the hip');
 }
});
test('hidden villagers freeze and rescued Tovin resets his grounded pose at the new location',()=>{
 const actor=make('tovin'),parent=new T.Group();parent.add(actor.group);actor.setTalking(true);actor.update(.05);const q=actor.joints.head.quaternion.clone(),blend=actor.talkBlend;parent.visible=false;for(let i=0;i<60;i++)actor.update(.05);assert.equal(actor.talkBlend,blend);assert.ok(actor.joints.head.quaternion.angleTo(q)<1e-7);
 parent.visible=true;actor.group.position.set(9,0,27);actor.reset();actor.update(1/60);assert.equal(actor.talking,false);assert.equal(actor.talkBlend,0);for(const side of ['l','r'])assert.ok(Math.abs(actor.joints['foot_'+side].getWorldPosition(new T.Vector3()).y+.02)<.002);
});
test('Tovin holds his lantern at the fingers and keeps it upright through turns and gestures',()=>{
 const actor=make('tovin');actor.group.position.set(-23,0,-32);const up=new T.Vector3();
 for(let f=0;f<180;f++){
  actor.setTalking(f>60&&f<120);actor.update(1/60,{x:-21,z:-30});
  assert.ok(actor.lantern.getWorldPosition(new T.Vector3()).distanceTo(actor.palmWorld('r'))<1e-7,'handle stays in the hand');
  up.set(0,1,0).applyQuaternion(actor.lantern.getWorldQuaternion(new T.Quaternion()));assert.ok(up.y>.995,'lantern hangs upright');
  assert.ok(actor.lantern.localToWorld(new T.Vector3(0,-.63,0)).y>.3,'lantern clears the ground');
 }
});
