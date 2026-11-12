const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function environment(){const e={};e.window=e;vm.createContext(e);for(const file of ['core','loot','equipment','adventure-data','quest-system','encounters','mage','mage-training','dungeon'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),e);return e;}
const {RPG,EmberMage:M,EmberQuests:Q,EmberEncounters:E,EmberMageTraining:T,EmberAdventureData:D,EmberDungeon:Dungeon}=environment();
function mage(level=1){const s=RPG.fresh('mage');s.level=level;s.mana=RPG.maxMana(s);return s;}
test('new powers unlock at levels 2 and 3, while other classes never spend mana',()=>{
 const s=mage();assert.equal(M.barrier(s).reason,'level');assert.equal(M.blink(s,{x:1,z:0},()=>true).reason,'level');assert.equal(s.mana,100);s.level=2;assert.ok(M.barrier(s).ok);assert.equal(s.mana,80);assert.equal(M.blink(s,{x:1,z:0},()=>true).reason,'level');
 for(const classId of ['guardian','ranger']){const other=RPG.fresh(classId);other.level=20;other.mana=100;assert.equal(M.barrier(other).reason,'class');assert.equal(M.blink(other,{x:1,z:0},()=>true).reason,'class');assert.equal(other.mana,100);}
});
test('barrier absorbs a bounded amount once, overflows to HP damage and expires on play time',()=>{
 const s=mage(2);assert.ok(M.barrier(s).ok);assert.equal(s.magePowers.barrierAmount,48);
 assert.deepEqual({...M.absorb(s,18)},{absorbed:18,damage:0});assert.deepEqual({...M.absorb(s,50)},{absorbed:30,damage:20});assert.deepEqual({...M.absorb(s,12)},{absorbed:0,damage:12});assert.equal(M.barrier(s).reason,'cooldown');assert.equal(s.mana,85);
 E.tick(s.encounters,14);assert.ok(M.barrier(s).ok);E.tick(s.encounters,5);assert.equal(M.tickPowers(s).barrierAmount,0);assert.equal(M.absorb(s,18).damage,18);
});
test('mana checks and blocked blinks consume neither mana nor cooldown',()=>{
 const s=mage(3);s.mana=19;assert.equal(M.barrier(s).reason,'mana');s.mana=17;assert.equal(M.blink(s,{x:1,z:0},()=>true).reason,'mana');s.mana=100;
 for(const direction of [{x:0,z:0},{x:NaN,z:0},{x:Infinity,z:1},{x:1,z:0}])assert.equal(M.blink(s,direction,()=>false).reason,'blocked');assert.equal(s.mana,100);assert.equal(s.magePowers.blinkReadyAt,0);
});
test('Blink sweeps the whole route and cannot pass an intermediate wall or world edge',()=>{
 const s=mage(3);s.x=0;s.z=0;const result=M.blink(s,{x:3,z:0},x=>!(x>2&&x<3));assert.ok(result.ok);assert.ok(s.x<=2&&s.x>1.8);assert.equal(s.z,0);assert.equal(s.mana,92);assert.equal(M.blink(s,{x:1,z:0},()=>true).reason,'cooldown');
 E.tick(s.encounters,8);s.x=31.8;s.z=0;const before=s.mana;assert.equal(M.blink(s,{x:1,z:0},x=>x<=32).reason,'blocked');assert.equal(s.mana,before);
 E.tick(s.encounters,8);s.x=0;const full=M.blink(s,{x:0,z:-2},()=>true);assert.ok(full.ok);assert.ok(Math.abs(s.z+6.5)<1e-9);
});
test('reload preserves active barriers and both deadlines without losing old saves or class slots',()=>{
 const s=mage(3);s.gold=79;s.quest=2;E.tick(s.encounters,20);M.barrier(s);M.absorb(s,10);M.blink(s,{x:1,z:0},()=>true);E.tick(s.encounters,2);
 const r=RPG.restore(JSON.stringify(s));assert.equal(r.magePowers.barrierAmount,41);assert.equal(M.powerStatus(r,'barrier').remaining,12);assert.equal(M.powerStatus(r,'blink').remaining,6);assert.equal(r.gold,79);assert.equal(r.quest,2);assert.equal(r.encounters.clock,22);
 const other=mage(3);assert.equal(M.powerStatus(other,'barrier').remaining,0);assert.equal(other.magePowers.barrierAmount,0);
 delete s.magePowers;const old=RPG.restore(s);assert.equal(old.gold,79);assert.equal(old.magePowers.barrierAmount,0);assert.ok(M.barrier(old).ok);
 const wrong=RPG.restore({...r,classId:'ranger'});assert.equal(wrong.magePowers.barrierAmount,0);assert.equal(wrong.magePowers.blinkReadyAt,0);
});
test('corrupt power state is bounded and ending a barrier retains its cooldown',()=>{
 const s=mage(3);s.encounters.clock=30;s.magePowers=M.restorePowers(s,{version:1,barrierAmount:1e9,barrierUntil:1e9,barrierReadyAt:1e9,blinkReadyAt:Infinity});assert.equal(s.magePowers.barrierAmount,51);assert.equal(s.magePowers.barrierUntil,35);assert.equal(s.magePowers.barrierReadyAt,44);assert.equal(s.magePowers.blinkReadyAt,0);M.endBarrier(s);assert.equal(s.magePowers.barrierAmount,0);assert.equal(M.powerStatus(s,'barrier').remaining,14);
});
test('Lyra offers only the current eligible mage lesson and does not mark other classes',()=>{
 for(const id of ['guardian','ranger']){const s=RPG.fresh(id);s.level=20;assert.equal(Q.npcQuests(s.journal,'lyra',s).length,0);assert.equal(Q.npcStatus(s.journal,'lyra',[],s),'COMPLETED');assert.equal(Q.accept(s.journal,'mage_spark','lyra',s),false);}
 const s=mage();assert.deepEqual(Array.from(Q.npcQuests(s.journal,'lyra',s),q=>q.id),['mage_spark']);assert.equal(Q.accept(s.journal,'mage_spark','rowan',s),false);assert.equal(Q.accept(s.journal,'mage_ward','lyra',s),false);assert.equal(Q.accept(s.journal,'mage_spark','lyra'),false);
});
test('three lessons teach real actions, unlock both powers and grant each reward only once',()=>{
 const s=mage();assert.equal(T.recordBolt(s),false);assert.equal(T.visible(s,'mage_spark'),false);Q.accept(s.journal,'mage_spark','lyra',s);assert.ok(T.visible(s,'mage_spark'));assert.equal(T.visible(s,'mage_ward'),false);
 for(let i=0;i<3;i++)assert.ok(T.recordBolt(s));assert.equal(T.recordBolt(s),false);assert.equal(Q.npcStatus(s.journal,'lyra',[],s),'READY_TO_TURN_IN');let reward=Q.turnIn(s.journal,'mage_spark','lyra',s);RPG.reward(s,reward.xp,reward.gold);assert.equal(s.level,2);assert.equal(Q.turnIn(s.journal,'mage_spark','lyra',s),null);assert.equal(T.visible(s,'mage_spark'),false);
 assert.equal(Q.npcQuests(s.journal,'lyra',s)[0].id,'mage_ward');assert.ok(Q.accept(s.journal,'mage_ward','lyra',s));assert.equal(T.recordBlock(s,0),false);s.x=D.mageTraining.ward.x;s.z=D.mageTraining.ward.z;M.barrier(s);assert.ok(T.recordBlock(s,M.absorb(s,18).absorbed));reward=Q.turnIn(s.journal,'mage_ward','lyra',s);RPG.reward(s,reward.xp,reward.gold);assert.equal(s.level,3);
 assert.ok(Q.accept(s.journal,'mage_step','lyra',s));s.x=D.mageTraining.blinkStart.x;s.z=D.mageTraining.blinkStart.z;assert.equal(T.recordBlink(s,{ok:false}),false);assert.equal(T.recordBlink(s,{ok:true,from:{x:0,z:0},x:D.mageTraining.blinkEnd.x,z:D.mageTraining.blinkEnd.z,distance:6.5}),false);
 const result=M.blink(s,{x:0,z:-1},()=>true);assert.ok(T.recordBlink(s,result));assert.equal(T.recordBlink(s,result),false);reward=Q.turnIn(s.journal,'mage_step','lyra',s);RPG.reward(s,reward.xp,reward.gold);assert.equal(s.gold,50);assert.equal(s.xp,90);assert.equal(Q.turnIn(s.journal,'mage_step','lyra',s),null);assert.equal(Q.npcStatus(s.journal,'lyra',[],s),'COMPLETED');
 const restored=RPG.restore(s);assert.equal(Q.status(restored.journal,'mage_step'),'COMPLETED');assert.equal(Q.npcQuests(RPG.restore({...s,classId:'guardian'}).journal,'lyra',{classId:'guardian',level:20}).length,0);
});

test('Blink respects the real dungeon wall footprint and the closed root gate',()=>{
 const s=mage(3);s.area='roots';s.x=100;s.z=-32;const closed=M.blink(s,{x:0,z:-1},(x,z)=>Dungeon.canStand(x,z,false,.55));assert.ok(closed.ok);assert.ok(s.z>=-33.95,'stops before closed gate with full player radius');
 E.tick(s.encounters,8);s.z=-32;const open=M.blink(s,{x:0,z:-1},(x,z)=>Dungeon.canStand(x,z,true,.55));assert.ok(open.ok);assert.ok(Math.abs(s.z+38.5)<1e-9);
 E.tick(s.encounters,8);s.x=100;s.z=-34;const side=M.blink(s,{x:1,z:0},(x,z)=>Dungeon.canStand(x,z,true,.55));assert.ok(side.ok);assert.ok(s.x<=102.45&&s.x>102.3,'cannot cross corridor side wall');
});
