const {test}=require('node:test'),assert=require('node:assert/strict');
require('../js/core.js');require('../js/loot.js');require('../js/adventure-data.js');require('../js/quest-system.js');require('../js/encounters.js');
const data=EmberAdventureData,Q=EmberQuests,E=EmberEncounters.create({...EmberAdventureData,spawns:EmberAdventureData.spawns.map(s=>({...s,respawnSeconds:30}))},EmberQuests),id='gray-east-1';
const setup=()=>({journal:Q.fresh(),encounters:E.fresh()});
const death=(s,spawn=id,roll=()=>0)=>E.defeat(s.encounters,s.journal,spawn,{roll});
test('wolves exist without quests and drop only regular loot; each spawn has independent identity and health',()=>{
 const s=setup();assert.equal(Object.keys(s.encounters.spawns).length,data.spawns.length);
 const a=s.encounters.spawns[id],b=s.encounters.spawns['gray-east-2'];assert.notEqual(a.instanceId,b.instanceId);assert.equal(a.hp,55);
 const corpse=death(s);assert.ok(corpse.corpse.loot.some(e=>e.itemId==='wolf_pelt'));assert.ok(corpse.corpse.loot.every(e=>e.kind!=='quest'));
 assert.equal(b.status,'alive');assert.equal(b.hp,55);assert.equal(death(s),null,'the same death cannot reroll loot');
});
test('quest drops require the exact active quest, objective, enemy type and an unfinished objective',()=>{
 const s=setup();assert.deepEqual(Q.questDrops(s.journal,'gray_wolf',()=>0),[]);assert.ok(Q.accept(s.journal,'wolf_plague','rowan'));assert.equal(Q.accept(s.journal,'wolf_plague','rowan'),false);
 assert.deepEqual(Q.questDrops(s.journal,'shadow_wolf',()=>0),[]);assert.deepEqual(Q.questDrops(s.journal,'gray_wolf',()=>.61),[]);
 const drops=Q.questDrops(s.journal,'gray_wolf',()=>.59);assert.equal(drops.length,1);assert.equal(drops[0].questId,'wolf_plague');assert.equal(drops[0].objectiveId,'teeth');
 death(s);assert.equal(Q.progress(s.journal,'wolf_plague','teeth'),0,'killing never counts a quest item');
 const row=E.available(s.encounters,s.journal,id).find(r=>r.kind==='quest');assert.equal(E.claim(s.encounters,s.journal,id,row.id).ok,true);assert.equal(Q.progress(s.journal,'wolf_plague','teeth'),1);
 assert.equal(E.claim(s.encounters,s.journal,id,row.id).ok,false);assert.equal(Q.progress(s.journal,'wolf_plague','teeth'),1);
});
test('configured 0%, 60% boundary and 100% drops are respected without cross-quest item counting',()=>{
 const quests=[0,60,100].map((chance,i)=>({id:'q'+i,giver:'rowan',turnIn:'rowan',objectives:[{id:'teeth',type:'QUEST_LOOT',enemyType:'gray_wolf',itemId:'wolf_tooth',count:2,chance}]})),q=Q.create({items:data.items,quests}),s=q.fresh();
 for(const def of quests)q.accept(s,def.id,'rowan');const drops=q.questDrops(s,'gray_wolf',()=>.6);assert.deepEqual(drops.map(d=>d.questId),['q2']);
 assert.ok(q.collectQuest(s,drops[0],'instance/loot/2','gray_wolf'));assert.equal(q.progress(s,'q2','teeth'),1);assert.equal(q.progress(s,'q1','teeth'),0);
 assert.equal(q.collectQuest(s,drops[0],'instance/loot/2','gray_wolf'),0);assert.equal(q.collectQuest(s,{...drops[0],questId:'q0'},'another','gray_wolf'),0,'a zero-percent rule cannot grant an item');
 assert.equal(q.questDrops(s,'gray_wolf',()=>.99999).some(d=>d.questId==='q2'),true);
});
test('all five objective types work together and talk/interact/kill events are idempotent',()=>{
 const quests=[{id:'mixed',giver:'rowan',turnIn:'elin',rewards:{xp:30,gold:7},objectives:[{id:'kill',type:'KILL',enemyType:'gray_wolf',count:1},{id:'collect',type:'COLLECT',itemId:'wolf_pelt',count:2},{id:'talk',type:'TALK',npcId:'bram',count:1},{id:'interact',type:'INTERACT',objectId:'chest',count:1},{id:'loot',type:'QUEST_LOOT',enemyType:'gray_wolf',itemId:'wolf_tooth',count:1,chance:100}]}],q=Q.create({quests,items:data.items}),s=q.fresh();
 q.notify(s,{id:'before',type:'KILL',enemyType:'gray_wolf'});assert.equal(q.accept(s,'mixed','bram'),false);q.accept(s,'mixed','rowan');assert.equal(q.progress(s,'mixed','kill'),0);
 for(const e of [{id:'wolf1',type:'KILL',enemyType:'gray_wolf'},{id:'bram1',type:'TALK',npcId:'bram'},{id:'chest1',type:'INTERACT',objectId:'chest'}]){assert.equal(q.notify(s,e),true);assert.equal(q.notify(s,e),false);}
 q.collectRegular(s,'wolf_pelt',2);q.collectQuest(s,q.questDrops(s,'gray_wolf')[0],'wolf1/tooth','gray_wolf');assert.equal(q.status(s,'mixed'),'READY_TO_TURN_IN');assert.equal(q.turnIn(s,'mixed','rowan'),null);
 assert.deepEqual(q.turnIn(s,'mixed','elin'),{xp:30,gold:7});assert.equal(s.inventory.wolf_pelt,0);assert.equal(q.turnIn(s,'mixed','elin'),null);assert.equal(q.status(q.restore(s),'mixed'),'COMPLETED');
});
test('two active quests use the same wolf independently, and kill progress is separate from picked-up items',()=>{
 const quests=[...data.quests,{id:'hunt',giver:'rowan',turnIn:'rowan',objectives:[{id:'kills',type:'KILL',enemyType:'gray_wolf',count:8}],rewards:{xp:10,gold:5}}],q=Q.create({...data,quests}),e=EmberEncounters.create(data,q),journal=q.fresh(),encounters=e.fresh();
 q.accept(journal,'wolf_plague','rowan');q.accept(journal,'hunt','rowan');const corpse=e.defeat(encounters,journal,id,{roll:()=>0});assert.equal(q.progress(journal,'hunt','kills'),1);assert.equal(q.progress(journal,'wolf_plague','teeth'),0);
 const tooth=corpse.corpse.loot.find(i=>i.kind==='quest');e.claim(encounters,journal,id,tooth.id);assert.equal(q.progress(journal,'hunt','kills'),1);assert.equal(q.progress(journal,'wolf_plague','teeth'),1);
});
test('respawns occur after 30 seconds, exactly once, independently of quests and other spawn points',()=>{
 const s=setup(),old=s.encounters.spawns[id].instanceId;death(s);E.tick(s.encounters,10);death(s,'gray-east-2');E.tick(s.encounters,19.99);assert.equal(s.encounters.spawns[id].status,'dead');
 E.tick(s.encounters,.01);const next=s.encounters.spawns[id];assert.equal(next.status,'alive');assert.equal(next.hp,55);assert.notEqual(next.instanceId,old);assert.equal(next.generation,2);assert.equal(s.encounters.spawns['gray-east-2'].status,'dead');
 for(let i=0;i<20;i++)E.tick(s.encounters,0);assert.equal(s.encounters.spawns[id].generation,2);E.tick(s.encounters,10);assert.equal(s.encounters.spawns['gray-east-2'].status,'alive');
});
test('unlooted bodies expire; looting clears a body without advancing its respawn time',()=>{
 const s=setup();death(s);E.tick(s.encounters,25);assert.equal(s.encounters.spawns[id].corpse,null);assert.equal(s.encounters.spawns[id].status,'dead');E.tick(s.encounters,5);death(s);
 const until=s.encounters.spawns[id].respawnAt;for(const item of [...E.available(s.encounters,s.journal,id)])assert.ok(E.claim(s.encounters,s.journal,id,item.id).ok);
 assert.equal(s.encounters.spawns[id].corpse,null);assert.equal(s.encounters.spawns[id].respawnAt,until);assert.equal(s.encounters.spawns[id].status,'dead');
});
test('reload preserves instance, remaining time and already-rolled loot and cannot collect an item twice',()=>{
 const s=setup();Q.accept(s.journal,'wolf_plague','rowan');death(s);E.tick(s.encounters,12);const before=JSON.parse(JSON.stringify(s)),journal=Q.restore(before.journal),encounters=E.restore(before.encounters);
 assert.deepEqual(encounters,s.encounters);assert.deepEqual(journal,s.journal);assert.equal(E.restore({...encounters,seed:0}).seed,0);const item=E.available(encounters,journal,id).find(i=>i.kind==='quest');E.claim(encounters,journal,id,item.id);
 const j2=Q.restore(JSON.parse(JSON.stringify(journal))),e2=E.restore(JSON.parse(JSON.stringify(encounters)));assert.equal(E.claim(e2,j2,id,item.id).ok,false);assert.equal(Q.progress(j2,'wolf_plague','teeth'),1);E.tick(e2,18);assert.equal(e2.spawns[id].status,'alive');
});
test('accepting a quest after a kill cannot add quest loot to that existing corpse',()=>{
 const s=setup();death(s);Q.accept(s.journal,'wolf_plague','rowan');assert.ok(E.available(s.encounters,s.journal,id).every(r=>r.kind!=='quest'));assert.equal(death(s),null);
});
test('the complete Rowan quest pays 250 XP and 50 gold once and wolves keep respawning after turn-in',()=>{
 const s=setup(),player=RPG.fresh();Q.accept(s.journal,'wolf_plague','rowan');
 for(let i=0;i<data.quests[0].objectives[0].count;i++){
  death(s);const item=E.available(s.encounters,s.journal,id).find(i=>i.kind==='quest');assert.ok(item);assert.ok(E.claim(s.encounters,s.journal,id,item.id).ok);E.tick(s.encounters,30);
 }
 assert.equal(Q.status(s.journal,'wolf_plague'),'READY_TO_TURN_IN');assert.deepEqual(Q.questDrops(s.journal,'gray_wolf',()=>0),[]);
 const reward=Q.turnIn(s.journal,'wolf_plague','rowan');assert.deepEqual(reward,{xp:250,gold:50});RPG.reward(player,reward.xp,reward.gold);assert.equal(player.gold,50);assert.equal(player.level,3);assert.equal(player.xp,70);assert.equal(Q.turnIn(s.journal,'wolf_plague','rowan'),null);
 const corpse=death(s);assert.ok(corpse.corpse.loot.every(i=>i.kind!=='quest'));E.tick(s.encounters,30);assert.equal(s.encounters.spawns[id].status,'alive');
});
test('invalid saved quest loot and regular tables cannot turn a quest item into regular inventory',()=>{
 const s=setup();assert.equal(Q.collectRegular(s.journal,'wolf_tooth',99),0);
 const broken={...data,lootTables:{...data.lootTables,wolf:[{itemId:'wolf_tooth',chance:100,min:1,max:1}]}},e=EmberEncounters.create(broken,Q),encounters=e.fresh();assert.equal(e.defeat(encounters,s.journal,id,{roll:()=>0}).corpse,null);
 Q.accept(s.journal,'wolf_plague','rowan');death(s);const corpse=s.encounters.spawns[id].corpse,tooth=corpse.loot.find(i=>i.kind==='quest');corpse.loot.push({...tooth,id:tooth.id+'0',questId:'fake'});const restored=E.restore(s.encounters);assert.equal(restored.spawns[id].corpse.loot.filter(i=>i.kind==='quest').length,1);
});
test('full material stacks and equipment rejection retain uncollected loot',()=>{
 const s=setup();s.journal.inventory.wolf_pelt=9998;death(s);const current=s.encounters.spawns[id],pelt=current.corpse.loot.find(i=>i.itemId==='wolf_pelt');pelt.quantity=3;
 const result=E.claim(s.encounters,s.journal,id,pelt.id);assert.equal(result.entry.quantity,1);assert.equal(pelt.quantity,2);assert.equal(E.claim(s.encounters,s.journal,id,pelt.id).reason,'bag-full');
 E.tick(s.encounters,30);E.defeat(s.encounters,s.journal,id,{roll:()=>0,gear:()=>({uid:1,base:'ember_helm',rarity:'rare',affix:'fury'})});const gear=current.corpse?.loot.find(i=>i.kind==='equipment')||s.encounters.spawns[id].corpse.loot.find(i=>i.kind==='equipment');assert.ok(gear);assert.equal(E.claim(s.encounters,s.journal,id,gear.id,()=>false).reason,'bag-full');assert.ok(E.available(s.encounters,s.journal,id).some(i=>i.id===gear.id));
});
