const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const THREE=require('../vendor/three.min.js');
const env={THREE};env.window=env;vm.createContext(env);
for(const file of ['core','loot','equipment','hero-art','character-rig','mage'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'),env);
const {RPG,EmberMage:mage}=env;
test('mage is a distinct third class and legacy classes keep their own loadouts',()=>{
 const s=RPG.fresh('mage');assert.equal(s.classId,'mage');assert.equal(s.weapon,'staff');assert.equal(s.hp,75);assert.equal(s.mana,100);assert.equal(s.bowUnlocked,false);assert.equal(RPG.classConfig(s).skill.kind,'frost');
 assert.equal(RPG.fresh('guardian').weapon,'sword');assert.equal(RPG.fresh('ranger').weapon,'bow');assert.equal(RPG.restore({version:1,gold:72,quest:2}).classId,'guardian');
 assert.equal(RPG.setWeapon(RPG.fresh('ranger'),'staff'),false);assert.equal(RPG.setWeapon(RPG.fresh('guardian'),'staff'),false);
});
test('mage save/restore clamps mana and rejects illegal equipment without erasing progress',()=>{
 const s=RPG.fresh('mage');s.mana=37.25;s.gold=78;s.quest=2;s.level=3;s.appearance.hairStyle='braid';
 const restored=RPG.restore(JSON.stringify(s));assert.equal(restored.mana,37.25);assert.equal(restored.weapon,'staff');assert.equal(restored.gold,78);assert.equal(restored.quest,2);assert.equal(restored.appearance.hairStyle,'braid');
 for(const bad of [NaN,Infinity,'9999',null])assert.equal(RPG.restore({...s,mana:bad}).mana,RPG.maxMana(s));
 assert.equal(RPG.restore({...s,mana:-50}).mana,0);assert.equal(RPG.restore({...s,mana:9999}).mana,RPG.maxMana(s));
 assert.equal(RPG.restore({...s,classId:'guardian',weapon:'staff',mana:9999}).weapon,'sword');assert.equal(RPG.restore({...s,classId:'guardian',mana:9999}).mana,0);
});
test('spells spend finite mana only when affordable and regeneration stays bounded',()=>{
 const s=RPG.fresh('mage');assert.equal(mage.spend(s,8),true);assert.equal(s.mana,92);mage.regenerate(s,.5);assert.equal(s.mana,95.5);mage.regenerate(s,100);assert.equal(s.mana,100);
 s.mana=7.5;assert.equal(mage.spend(s,8),false);assert.equal(s.mana,7.5);for(const cost of [-1,Infinity,NaN])assert.equal(mage.spend(s,cost),false);
 mage.regenerate(s,-1);mage.regenerate(s,NaN);assert.equal(s.mana,7.5);assert.equal(mage.spend(RPG.fresh('guardian'),0),false);
});
test('magic scales with level, quest light and armor, independently of a sword bonus',()=>{
 const s=RPG.fresh('mage'),base=RPG.spellDamage(s);s.quest=3;assert.equal(RPG.spellDamage(s),base+12);s.level=2;assert.equal(RPG.spellDamage(s),base+18);
 s.kills=['boss'];RPG.equip(s,'thorn');const withSword=RPG.spellDamage(s);s.equipped='starter';assert.equal(RPG.spellDamage(s),withSword);
 env.EmberEquipment.clean(s);env.EmberEquipment.grant(s,'ember_gloves');env.EmberEquipment.equip(s,'ember_gloves');assert.ok(RPG.spellDamage(s)>withSword);
 s.mana=0;RPG.reward(s,1000,0);assert.equal(s.mana,RPG.maxMana(s));
});
test('mage bow training and staff return share the existing equipment validation',()=>{
 const s=RPG.fresh('mage');assert.equal(RPG.setWeapon(s,'bow'),false);assert.equal(RPG.acceptBow(s),true);assert.equal(s.weapon,'bow');
 assert.equal(RPG.setWeapon(s,'staff'),true);for(const t of RPG.bowTargets)assert.equal(RPG.practiceHit(s,t.id,1.2),true);assert.equal(RPG.finishBow(s),true);
 assert.equal(RPG.restore(JSON.stringify(s)).weapon,'staff');assert.equal(RPG.restore(JSON.stringify(s)).bowQuest,2);
});
test('frost selects only accepted nearby enemies with clear line of sight and expires on bosses too',()=>{
 const s=RPG.fresh('mage'),make=(id,x,z,boss=false)=>({id,boss,mesh:{visible:true,position:{x,z}}});s.x=s.z=0;
 const w=make('w1',2,0),far=make('w2',10,0),boss=make('boss',1,0,true);
 assert.equal(mage.nearby(s,[w,far,boss],4.8).length,0);s.quest=1;assert.equal(mage.nearby(s,[w,far,boss],4.8).length,1);assert.equal(mage.nearby(s,[w],4.8,()=>false).length,0);w.mesh.visible=false;assert.equal(mage.nearby(s,[w],4.8).length,0);w.mesh.visible=true;
 mage.chill(w);assert.equal(mage.movementScale(w),.45);mage.tickEnemy(w,3.1);assert.equal(mage.movementScale(w),1);
 mage.chill(boss);assert.equal(boss.chill,1.5);assert.equal(mage.movementScale(boss),.72);mage.tickEnemy(boss,2);assert.equal(boss.chill,0);
});
test('staff and class accents stay on the shared bones and hide for other weapons/classes',()=>{
 const rig=env.EmberCharacterRig.create(THREE),view=mage.attach(THREE,rig);view.setClass('mage');view.setWeapon('staff');assert.equal(view.staff.visible,true);assert.equal(view.accents.visible,true);assert.strictEqual(view.staff.parent,rig.joints.weapon_r);
 view.setWeapon('bow');assert.equal(view.staff.visible,false);assert.equal(view.accents.visible,true);view.setClass('guardian');assert.equal(view.accents.visible,false);
 view.setClass('mage');view.setWeapon('staff');view.cast('frost');rig.animate(.1,false,0);view.update(.1,.1);assert.ok(Number.isFinite(rig.joints.upper_arm_r.rotation.x));
});
