const {test}=require('node:test'),assert=require('node:assert/strict'),T=require('../vendor/three.min.js');
require('../js/core.js');require('../js/loot.js');require('../js/equipment.js');require('../js/adventure-data.js');require('../js/quest-system.js');require('../js/encounters.js');require('../js/characters.js');require('../js/forest-actors.js');require('../js/thorn-guardian.js');require('../js/grove-creatures.js');
const Q=EmberQuests,E=EmberEncounters;
test('journal, collected items, queued corpse loot and remaining respawn time survive the real roster save path per character',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},roster=EmberCharacters.open({storage:()=>storage}),a=RPG.fresh('mage'),b=RPG.fresh('ranger');
 Q.accept(a.journal,'wolf_plague','rowan');E.defeat(a.encounters,a.journal,'gray-east-1',{roll:()=>0});const tooth=E.available(a.encounters,a.journal,'gray-east-1').find(e=>e.kind==='quest');E.claim(a.encounters,a.journal,'gray-east-1',tooth.id);E.tick(a.encounters,12);
 a.quest=5;a.kills=['boss','g1','d2'];a.caveKey=a.gateOpen=true;a.appearance.hairStyle='braid';a.gold=123;
 assert.ok(roster.create(0,'Mage',a));assert.ok(roster.create(1,'Ranger',b));const loaded=EmberCharacters.open({storage:()=>storage}),saved=loaded.load(0);
 assert.equal(Q.progress(saved.journal,'wolf_plague','teeth'),1);assert.equal(saved.encounters.clock,12);assert.equal(saved.encounters.spawns['gray-east-1'].status,'dead');assert.ok(E.available(saved.encounters,saved.journal,'gray-east-1').every(i=>i.kind!=='quest'));assert.equal(saved.gold,123);assert.equal(saved.appearance.hairStyle,'braid');assert.ok(saved.kills.includes('g1'));assert.ok(saved.gateOpen);
 const ranger=loaded.load(1);assert.equal(Q.status(ranger.journal,'wolf_plague'),'NOT_STARTED');assert.equal(ranger.encounters.spawns['gray-east-1'].status,'alive');assert.notEqual(ranger.encounters.worldId,saved.encounters.worldId);E.tick(saved.encounters,saved.encounters.spawns['gray-east-1'].respawnAt-saved.encounters.clock);assert.equal(saved.encounters.spawns['gray-east-1'].status,'alive');assert.equal(ranger.encounters.clock,0);
});
test('equipment in an unlooted corpse reserves its UID across restore and transfers to the existing inventory once',()=>{
 const state=RPG.fresh(),enemy={mesh:{position:{x:22,z:4}}};E.defeat(state.encounters,state.journal,'gray-east-1',{roll:()=>0,gear:r=>EmberLoot.generate(state,enemy,r)});const gear=E.available(state.encounters,state.journal,'gray-east-1').find(i=>i.kind==='equipment');assert.ok(gear);
 state.lootSequence=0;const loaded=RPG.restore(JSON.stringify(state));assert.equal(loaded.lootSequence,gear.gear.uid);const next=EmberLoot.generate(loaded,enemy,()=>0);assert.ok(next.uid>gear.gear.uid);
 const claim=()=>E.claim(loaded.encounters,loaded.journal,'gray-east-1',gear.id,item=>EmberLoot.receive(loaded,item));assert.equal(claim().ok,true);assert.equal(claim().ok,false);assert.equal(loaded.lootBag.length,1);assert.equal(EmberLoot.itemStats(loaded.lootBag[0]).name,EmberLoot.itemStats(gear.gear).name);
});
test('gray wolves reuse art per coat and leave an actual opaque, grounded corpse until it is released',()=>{
 const a=EmberForestActors.createWolf(T,{coat:'gray'}),b=EmberForestActors.createWolf(T,{coat:'gray'}),blue=EmberForestActors.createWolf(T),scene=new T.Scene();scene.add(a.group);a.group.position.set(22,0,4);a.update(0);
 const am=a.group.getObjectByName('wolf_coat'),bm=b.group.getObjectByName('wolf_coat');assert.strictEqual(am.geometry,bm.geometry);assert.strictEqual(am.material,bm.material);assert.notStrictEqual(am.geometry,blue.group.getObjectByName('wolf_coat').geometry);
 const origin=a.group.position.clone();a.defeat(scene,{hold:true});a.group.visible=false;for(let i=0;i<240;i++)a.update(1/60);assert.ok(a.dying);assert.notStrictEqual(a.model.parent,a.group);assert.equal(am.material.opacity,1);assert.ok(a.group.position.distanceTo(origin)<1e-8);
 scene.updateMatrixWorld(true);const v=new T.Vector3();let lowest=Infinity;a.model.traverse(m=>{if(m.isMesh)for(let i=0;i<m.geometry.attributes.position.count;i++){v.fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld);lowest=Math.min(lowest,v.y);}});assert.ok(lowest>=-.02&&lowest<.15,'the real corpse meets the ground');
 a.reset();assert.equal(a.dying,false);assert.strictEqual(a.model.parent,a.group);assert.equal(scene.getObjectByName('WolfCorpse'),undefined);
});
test('existing boss models can hold their final collapse without changing their default animation lifecycle',()=>{
 for(const create of [()=>EmberThornGuardian.create(T),()=>EmberGroveCreatures.createRootMother(T),()=>EmberGroveCreatures.createSpirit(T)]){
  const a=create(),scene=new T.Scene();scene.add(a.group);a.defeat(scene,{hold:true});a.group.visible=false;for(let i=0;i<240;i++)a.update(1/60);assert.ok(a.dying);assert.ok(a.model.visible);for(const material of Object.values(a.materials))assert.equal(material.opacity,1);a.reset();assert.equal(a.dying,false);assert.equal(scene.children.length,1);
 }
});
test('a new enemy type and spawn with a different delay work by changing data alone',()=>{
 const data={...EmberAdventureData,spawns:[{id:'future-wolf',enemyType:'red_wolf',x:2,z:3,area:'valley',respawnSeconds:7,corpseSeconds:5,stats:{...EmberAdventureData.enemyDefinitions.gray_wolf,hp:77}}]},quests=Q.create({items:data.items,quests:[{id:'future-hunt',giver:'rowan',turnIn:'rowan',objectives:[{id:'hunt',type:'KILL',enemyType:'red_wolf',count:1}]}]}),encounters=E.create(data,quests),journal=quests.fresh(),state=encounters.fresh();quests.accept(journal,'future-hunt','rowan');const old=state.spawns['future-wolf'].instanceId;encounters.defeat(state,journal,'future-wolf',{roll:()=>0});assert.equal(quests.status(journal,'future-hunt'),'READY_TO_TURN_IN');encounters.tick(state,6.99);assert.equal(state.spawns['future-wolf'].status,'dead');encounters.tick(state,.01);assert.equal(state.spawns['future-wolf'].hp,77);assert.notEqual(state.spawns['future-wolf'].instanceId,old);assert.throws(()=>E.create({...data,spawns:[...data.spawns,...data.spawns]},quests),/duplicate spawn/);
});
test('killing the permanently visible forest boss early does not lock the existing story',()=>{
 const state=RPG.fresh();RPG.recordKill(state,'boss');assert.equal(state.quest,0);RPG.advance(state);for(const id of ['w1','w2','w3'])RPG.recordEncounterKill(state,id,'shadow_wolf','instance/'+id);RPG.advance(state);state.crystals=['c1','c2','c3'];RPG.advance(state);assert.equal(state.quest,4);assert.ok(RPG.advance(state));assert.equal(state.quest,5);
});
