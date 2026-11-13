const {test}=require('node:test'),assert=require('node:assert/strict');
for(const name of ['quest-guide','core','loot','equipment','adventure-data','quest-system','encounters','characters'])require('../js/'+name+'.js');
const G=EmberQuestGuide,Q=EmberQuests,E=EmberEncounters,D=EmberAdventureData;
function targets(s){
 const result=[],add=(key,position,extra={})=>result.push({key,position,identity:key,kind:'object',range:2.6,...extra});
 if(s.area==='valley'){
  for(const [id,p]of Object.entries({...D.npcs,elin:{x:-3,z:17},mira:RPG.places.mira,...(s.sideQuest?{tovin:s.sideQuest>=2?{x:9,z:27}:RPG.places.tovin}:{})}))add('npc:'+id,p,{kind:'npc'});
  if(RPG.questVisibility(s).crystals)for(const c of RPG.crystals)if(!s.crystals.includes(c.id))add('object:'+c.id,c);
  if(RPG.questVisibility(s).bow)for(const t of RPG.bowTargets)add('practice:'+t.id,t,{kind:'practice'});
  if(Q.status(s.journal,'mage_spark')==='ACTIVE')add('practice:mage',D.mageTraining.target,{kind:'practice'});
  if(RPG.questVisibility(s).dungeon)add('object:entrance',{x:0,z:-58.5});
 }else for(const [id,p]of Object.entries({exit:{x:100,z:16.5},'root-key':{x:110,z:-21},'root-gate':{x:100,z:-35},'root-altar':{x:100,z:-63}}))add('object:'+id,p);
 for(const spawn of D.spawns){const current=s.encounters.spawns[spawn.id];if(spawn.area!==s.area)continue;if(current.status==='alive'&&(spawn.enemyType!=='arcane_echo'||Q.status(s.journal,'mage_trial')==='ACTIVE'))add('enemy:'+spawn.id,current,{kind:'enemy',identity:current.instanceId,enemy:{enemyType:spawn.enemyType}});if(E.available(s.encounters,s.journal,spawn.id).length)add('corpse:'+spawn.id,current,{kind:'corpse',spawnId:spawn.id,identity:current.instanceId});}
 return result;
}
const plan=(g,s)=>g.plan(s,targets(s));
function accept(s,id,npc='lyra'){assert.ok(Q.accept(s.journal,id,npc,s));}
function tooth(s,id){return Q.collectQuest(s.journal,{kind:'quest',questId:'wolf_plague',objectiveId:'teeth',itemId:'wolf_tooth',quantity:1},'guide-tooth/'+id,'gray_wolf');}
test('unaccepted, future, completed and wrong-class quests cannot produce a guide or destination',()=>{
 const s=RPG.fresh(),g=G.create();assert.deepEqual(G.list(s),[]);assert.equal(plan(g,s),null);assert.equal(G.select(s,'quest:mage_trial'),false);s.quest=5;s.dungeon=0;assert.equal(plan(g,s),null);s.journal.quests.mage_spark={status:'ACTIVE',objectives:{hits:{count:0,seen:[]}}};assert.equal(plan(g,s),null);delete s.journal.quests.mage_spark;
 accept(s,'wolf_plague','rowan');for(let i=0;i<10;i++)tooth(s,i);Q.turnIn(s.journal,'wolf_plague','rowan',s);assert.equal(plan(g,s),null);assert.equal(s.questGuide.trackedId,null);
});
test('the selected accepted quest survives new offers and only active quests can replace it',()=>{
 const s=RPG.fresh('mage'),g=G.create();s.quest=1;accept(s,'wolf_plague','rowan');accept(s,'mage_spark');assert.equal(plan(g,s).quest.id,'story');assert.ok(G.select(s,'quest:mage_spark'));assert.equal(plan(g,s).target.key,'practice:mage');assert.equal(G.select(s,'quest:mage_ward'),false);assert.equal(plan(g,s).quest.id,'quest:mage_spark');assert.ok(G.select(s,'quest:wolf_plague'));assert.match(plan(g,s).target.key,/^enemy:gray-/);
});
test('the real story switches from wolves to Elin, remaining crystals and the boss without revealing later steps',()=>{
 const s=RPG.fresh(),g=G.create();RPG.advance(s);assert.match(plan(g,s).target.key,/^enemy:w/);for(let i=0;i<3;i++)RPG.recordEncounterKill(s,'w'+(i+1),'shadow_wolf','story-instance/'+i);assert.equal(plan(g,s).target.key,'npc:elin');RPG.advance(s);let p=plan(g,s);assert.match(p.target.key,/^object:c/);s.crystals.push(p.target.key.slice(7));assert.notEqual(plan(g,s).target.key,p.target.key);s.crystals=RPG.crystals.map(c=>c.id);assert.equal(plan(g,s).target.key,'npc:elin');RPG.advance(s);assert.equal(plan(g,s).target.key,'enemy:boss');RPG.recordKill(s,'boss');assert.equal(plan(g,s).target.key,'npc:elin');RPG.advance(s);assert.equal(plan(g,s),null);
});
test('only actual quest loot changes the hunt marker into a corpse marker; taking the last item points to Rowan',()=>{
 const s=RPG.fresh(),g=G.create();accept(s,'wolf_plague','rowan');const first=plan(g,s).target.key.slice(6);E.defeat(s.encounters,s.journal,first,{roll:()=>0});assert.equal(plan(g,s).target.key,'corpse:'+first);
 for(let i=0;i<9;i++)tooth(s,i);const row=E.available(s.encounters,s.journal,first).find(r=>r.kind==='quest');assert.ok(row);assert.ok(Q.collectQuest(s.journal,row,row.id,'gray_wolf'));assert.equal(plan(g,s).target.key,'npc:rowan');assert.equal(plan(g,s).quest.status,'READY_TO_TURN_IN');
});
test('a body with no tooth is never advertised as quest loot and expired bodies are dropped safely',()=>{
 const s=RPG.fresh(),g=G.create();accept(s,'wolf_plague','rowan');let id=plan(g,s).target.key.slice(6);E.defeat(s.encounters,s.journal,id,{roll:()=>.99});assert.notEqual(plan(g,s).target.key,'corpse:'+id);id=plan(g,s).target.key.slice(6);E.defeat(s.encounters,s.journal,id,{roll:()=>0});assert.equal(plan(g,s).target.key,'corpse:'+id);E.tick(s.encounters,26);assert.notEqual(plan(g,s).target?.key,'corpse:'+id);
});
test('the marker holds a valid target when nearby wolves exchange distance, then follows its real position',()=>{
 const s=RPG.fresh(),g=G.create();accept(s,'wolf_plague','rowan');const live=targets(s),first=g.plan(s,live).target,other=live.find(t=>t.kind==='enemy'&&t.enemy.enemyType==='gray_wolf'&&t.key!==first.key);other.position={x:s.x+.1,z:s.z};assert.equal(g.plan(s,live).target.key,first.key);live.find(t=>t.key===first.key).position={x:12,z:-2};assert.deepEqual(g.plan(s,live).target.position,{x:12,z:-2});
});
test('no live enemies produces a waiting hint without a ghost destination, and respawn restores guidance',()=>{
 const s=RPG.fresh(),g=G.create();accept(s,'wolf_plague','rowan');for(const spawn of D.spawns.filter(e=>e.enemyType==='gray_wolf'))E.defeat(s.encounters,s.journal,spawn.id,{roll:()=>.99});assert.equal(plan(g,s).target,null);assert.ok(plan(g,s).waiting);E.tick(s.encounters,181);assert.match(plan(g,s).target.key,/^enemy:gray-/);
});
test('each mage lesson guides only its own accepted props and completion points back to Lyra',()=>{
 const s=RPG.fresh('mage'),g=G.create();accept(s,'mage_spark');assert.equal(plan(g,s).target.key,'practice:mage');for(let i=0;i<3;i++)Q.signal(s.journal,{type:'INTERACT',objectId:'mage-target'});assert.equal(plan(g,s).target.key,'npc:lyra');Q.turnIn(s.journal,'mage_spark','lyra',s);assert.equal(plan(g,s),null);
 s.level=2;accept(s,'mage_ward');assert.equal(plan(g,s).target.key,'lesson:ward');Q.signal(s.journal,{type:'INTERACT',objectId:'mage-barrier'});assert.equal(plan(g,s).target.key,'npc:lyra');Q.turnIn(s.journal,'mage_ward','lyra',s);s.level=3;accept(s,'mage_step');assert.equal(plan(g,s).target.key,'lesson:blink-start');Object.assign(s,D.mageTraining.blinkStart);assert.equal(plan(g,s).target.key,'lesson:blink-end');Q.signal(s.journal,{type:'INTERACT',objectId:'mage-blink'});assert.equal(plan(g,s).target.key,'npc:lyra');
 Q.turnIn(s.journal,'mage_step','lyra',s);assert.equal(plan(g,s),null);accept(s,'mage_trial');assert.equal(plan(g,s).target.key,'enemy:arcane-vael');Q.notify(s.journal,{type:'KILL',enemyType:'arcane_echo',id:'vael-guide'});assert.equal(plan(g,s).target.key,'npc:lyra');
});
test('the real dungeon progression routes entrance, key guard, key, door, boss, amulet and exit in order',()=>{
 const s=RPG.fresh(),g=G.create();s.quest=5;assert.equal(plan(g,s),null);RPG.acceptDungeon(s);assert.equal(plan(g,s).target.key,'object:entrance');s.area='roots';assert.equal(plan(g,s).target.key,'enemy:d2');RPG.recordKill(s,'d2');assert.equal(plan(g,s).target.key,'object:root-key');RPG.claimKey(s);assert.equal(plan(g,s).target.key,'object:root-gate');RPG.openGate(s);assert.equal(plan(g,s).target.key,'enemy:rootboss');RPG.recordKill(s,'rootboss');assert.equal(plan(g,s).target.key,'object:root-altar');RPG.claimAmulet(s);assert.equal(plan(g,s).target.key,'object:exit');s.area='valley';assert.equal(plan(g,s).target.key,'npc:elin');RPG.finishDungeon(s);assert.equal(plan(g,s),null);
});
test('another followed quest inside the cave points to the exit rather than to world coordinates in another area',()=>{
 const s=RPG.fresh(),g=G.create();s.quest=5;RPG.acceptDungeon(s);accept(s,'wolf_plague','rowan');G.select(s,'quest:wolf_plague');s.area='roots';const p=plan(g,s);assert.equal(p.target.key,'object:exit');assert.equal(p.target.area,'roots');s.area='valley';assert.match(plan(g,s).target.key,/^enemy:gray-/);
});
test('bow training excludes hit targets, and Tovin guidance changes to Mira immediately after rescue',()=>{
 const s=RPG.fresh(),g=G.create();RPG.acceptBow(s);let p=plan(g,s);assert.match(p.target.key,/^practice:t/);RPG.practiceHit(s,p.target.key.slice(9),1.2);assert.notEqual(plan(g,s).target.key,p.target.key);s.bowPractice=['t1','t2','t3'];assert.equal(plan(g,s).target.key,'npc:elin');RPG.finishBow(s);assert.equal(plan(g,s),null);RPG.acceptSide(s);assert.equal(plan(g,s).target.key,'npc:tovin');RPG.rescueTovin(s);assert.equal(plan(g,s).target.key,'npc:mira');RPG.finishSide(s);assert.equal(plan(g,s),null);
});
test('tracking and visibility are saved independently in real character slots and old saves gain safe defaults',()=>{
 const stored=new Map(),storage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)},roster=EmberCharacters.open({storage:()=>storage}),a=RPG.fresh('mage'),b=RPG.fresh();a.quest=1;accept(a,'mage_spark');G.select(a,'quest:mage_spark');G.setEnabled(a,false);RPG.acceptBow(b);G.select(b,'bow');assert.ok(roster.create(0,'Mage',a));assert.ok(roster.create(1,'Ranger',b));const loaded=EmberCharacters.open({storage:()=>storage});assert.equal(loaded.load(0).questGuide.trackedId,'quest:mage_spark');assert.equal(loaded.load(0).questGuide.enabled,false);assert.equal(loaded.load(1).questGuide.trackedId,'bow');assert.equal(loaded.load(1).questGuide.enabled,true);const old=RPG.fresh();delete old.questGuide;assert.deepEqual(RPG.restore(old).questGuide,G.fresh());
});
test('bad or stale preferences cannot select unavailable content or mutate quest progress and rewards',()=>{
 const s=RPG.fresh(),g=G.create();accept(s,'wolf_plague','rowan');s.questGuide={version:1,trackedId:'quest:mage_trial',enabled:false};const before=JSON.stringify([s.journal,s.encounters,s.gold,s.xp,s.level]);assert.equal(plan(g,s).quest.id,'quest:wolf_plague');assert.equal(s.questGuide.enabled,false);assert.equal(JSON.stringify([s.journal,s.encounters,s.gold,s.xp,s.level]),before);assert.equal(G.restore({version:1,trackedId:'<script>',enabled:'false'}).trackedId,null);assert.deepEqual(G.restore({version:2,trackedId:'story'}),G.fresh());assert.equal(G.select(s,'__proto__'),false);
});
