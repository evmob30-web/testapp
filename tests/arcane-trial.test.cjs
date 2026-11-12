const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),THREE=require('../vendor/three.min.js');
function environment(){const e={THREE};e.window=e;vm.createContext(e);for(const file of ['core','loot','equipment','adventure-data','quest-system','encounters','hero-art','character-rig','appearance','mage','arcane-trial'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),e);return e;}
const {RPG,EmberQuests:Q,EmberEncounters:E,EmberArcaneTrial:A,EmberAdventureData:D,EmberMage:M}=environment();
function graduate(){const s=RPG.fresh('mage');s.level=3;s.x=D.arcaneTrial.x;s.z=D.arcaneTrial.z+5;s.hp=RPG.maxHp(s);s.mana=RPG.maxMana(s);s.journal=Q.restore({version:1,quests:{mage_spark:{status:'COMPLETED'},mage_ward:{status:'COMPLETED'},mage_step:{status:'COMPLETED'}}},s);return s;}
test('Vael and arena remain gated by class, completed lessons and explicit acceptance',()=>{
 const s=graduate(),enemy={id:D.arcaneTrial.spawnId,arcaneTrial:true};assert.equal(A.available(s),false);assert.equal(RPG.enemyVisible(s,enemy),false);assert.equal(Q.npcQuests(s.journal,'lyra',s)[0].id,'mage_trial');assert.ok(Q.accept(s.journal,'mage_trial','lyra',s));assert.ok(A.available(s));assert.ok(RPG.enemyVisible(s,enemy));
 for(const classId of ['guardian','ranger']){const other=RPG.fresh(classId);other.level=20;assert.equal(Q.accept(other.journal,'mage_trial','lyra',other),false);assert.equal(RPG.enemyVisible(other,enemy),false);assert.equal(A.available(other),false);}
 assert.equal(Q.accept(RPG.fresh('mage').journal,'mage_trial','lyra',{classId:'mage',level:20}),false);s.area='roots';assert.equal(A.available(s),false);assert.equal(RPG.enemyVisible(s,enemy),false);
});
test('warnings lock their aim before impact, then alternate with recovery windows',()=>{
 const f=A.freshFight(),events=[];const boss={x:0,z:0},player={x:0,z:5};for(let i=0;i<60;i++)events.push(...A.stepFight(f,1/30,boss,player));assert.equal(events.length,1);assert.equal(events[0].type,'warning');assert.equal(f.phase,'warning');assert.equal(f.kind,'lance');assert.equal(f.aim.x,0);
 player.x=5;for(let i=0;i<30;i++)events.push(...A.stepFight(f,1/30,boss,player));const lance=events.find(e=>e.type==='attack');assert.equal(lance.aim.x,0,'telegraph never tracks the moving player');assert.equal(f.phase,'recovery');assert.equal(A.attackHits(lance,player),false);
 for(let i=0;i<110;i++)events.push(...A.stepFight(f,1/30,boss,player));assert.deepEqual(events.filter(e=>e.type==='attack').map(e=>e.kind),['lance','nova']);assert.equal(events.filter(e=>e.type==='warning')[1].aim.x,5);
});
test('fight timing is stable across normal frame rates and does not attack during frozen frames',()=>{
 function run(dt){const f=A.freshFight(),out=[];for(let t=0;t<30-dt/2;t+=dt)for(const e of A.stepFight(f,dt,{x:0,z:0},{x:0,z:5}))out.push(e.type+'/'+e.kind);return out;}
 assert.deepEqual(run(1/60),run(1/25));const f=A.freshFight(),snapshot=JSON.stringify(f);assert.equal(A.stepFight(f,0,{x:0,z:0},{x:0,z:5}).length,0);assert.equal(A.stepFight(f,NaN,{x:0,z:0},{x:0,z:5}).length,0);assert.equal(JSON.stringify(f),snapshot);
});
test('lance has a finite width and length while nova damage matches the announced location',()=>{
 const lance={kind:'lance',origin:{x:0,z:0},aim:{x:0,z:5}};assert.ok(A.attackHits(lance,{x:0,z:5}));assert.equal(A.attackHits(lance,{x:2,z:5}),false);assert.equal(A.attackHits(lance,{x:0,z:14}),false);assert.equal(A.attackHits(lance,{x:0,z:-2}),false);
 const nova={kind:'nova',origin:{x:0,z:0},aim:{x:0,z:5}};assert.ok(A.attackHits(nova,{x:0,z:5}));assert.equal(A.attackHits(nova,{x:0,z:11.5}),false);assert.equal(A.attackHits(nova,{x:0,z:0}),false);
});
test('barrier can absorb the lance and a real Blink can escape the locked nova',()=>{
 const s=graduate();s.x=0;s.z=5;const hp=s.hp;assert.ok(M.barrier(s).ok);assert.equal(M.absorb(s,A.attacks.lance.damage).damage,0);assert.equal(s.hp,hp);assert.equal(s.magePowers.barrierAmount,25);
 const nova={kind:'nova',origin:{x:0,z:0},aim:{x:0,z:5}};assert.ok(A.attackHits(nova,s));assert.ok(M.blink(s,{x:0,z:-1},()=>true).ok);assert.equal(A.attackHits(nova,s),false);
});
test('one real saved spawn kill completes the quest without random loot or repeated rewards',()=>{
 const s=graduate();Q.accept(s.journal,'mage_trial','lyra',s);const defeated=E.defeat(s.encounters,s.journal,D.arcaneTrial.spawnId);assert.ok(defeated);assert.equal(Q.status(s.journal,'mage_trial'),'READY_TO_TURN_IN');assert.equal(E.available(s.encounters,s.journal,D.arcaneTrial.spawnId).length,0);assert.equal(E.defeat(s.encounters,s.journal,D.arcaneTrial.spawnId),null);assert.equal(RPG.enemyVisible(s,{id:D.arcaneTrial.spawnId,arcaneTrial:true}),false);
 const loaded=RPG.restore(JSON.stringify(s));assert.equal(Q.status(loaded.journal,'mage_trial'),'READY_TO_TURN_IN');assert.equal(loaded.encounters.spawns[D.arcaneTrial.spawnId].status,'dead');const reward=Q.turnIn(loaded.journal,'mage_trial','lyra',loaded);assert.equal(reward.staff,'starweaver');assert.equal(reward.xp,180);assert.equal(reward.gold,40);assert.equal(Q.turnIn(loaded.journal,'mage_trial','lyra',loaded),null);
 E.tick(loaded.encounters,3600);assert.equal(RPG.enemyVisible(loaded,{id:D.arcaneTrial.spawnId,arcaneTrial:true}),false,'even the underlying respawn cannot make a completed quest farmable');
});
test('the unique staff is gated, equipable, save compatible and grants only its stated spell bonus',()=>{
 const s=graduate();assert.equal(RPG.setStaff(s,'starweaver'),false);s.staffId='starweaver';assert.equal(RPG.staffBonus(s),0);assert.equal(RPG.staffId(RPG.restore(s)),'starter');
 Q.accept(s.journal,'mage_trial','lyra',s);E.defeat(s.encounters,s.journal,D.arcaneTrial.spawnId);Q.turnIn(s.journal,'mage_trial','lyra',s);const before=RPG.spellDamage({...s,staffId:'starter'});assert.ok(RPG.setStaff(s,'starweaver'));assert.equal(RPG.spellDamage(s),before+12);assert.equal(RPG.staffName(s),'Sterrenweversstaf');assert.equal(RPG.staffOptions(s).length,2);assert.equal(s.weapon,'staff');assert.equal(RPG.staffId(RPG.restore(s)),'starweaver');
 assert.ok(RPG.setStaff(s,'starter'));assert.equal(RPG.spellDamage(s),before);assert.equal(RPG.setStaff(s,'invented'),false);const other=RPG.restore({...s,classId:'guardian',staffId:'starweaver'});assert.equal(RPG.staffBonus(other),0);assert.equal(RPG.setStaff(other,'starweaver'),false);
 delete s.staffId;const old=RPG.restore(s);assert.equal(old.level,3);assert.equal(RPG.staffId(old),'starter');assert.equal(RPG.staffOptions(old).length,2);
});
test('Vael has a reusable rig, original mask and crystals, grounded root and stable cast poses',()=>{
 const actor=A.createActor(THREE),enemy={mesh:actor.group};assert.equal(actor.group.name,'VaelTheBrokenSpark');assert.ok(actor.group.getObjectByName('vael_faceted_mask'));assert.ok(actor.group.getObjectByName('vael_crown_crystal'));assert.ok(actor.group.getObjectByName('VaelOrbitingRunes'));assert.ok(actor.mage.staff.visible);const hpRoot=actor.group.position.clone();actor.signal('lance');for(let i=0;i<90;i++)actor.update(1/60,enemy);assert.ok(actor.group.position.distanceTo(hpRoot)<1e-9);actor.signal('nova');for(let i=0;i<90;i++)actor.update(1/60,enemy);actor.reset();actor.group.traverse(m=>{assert.ok(Number.isFinite(m.position.x));assert.ok(Number.isFinite(m.quaternion.w));});assert.equal(actor.group.position.y,0);
});
test('the reward staff has a visible alternate crown and its projectile muzzle follows the crystal',()=>{
 const rig=environment().EmberCharacterRig.create(THREE),view=M.attach(THREE,rig);view.setClass('mage');view.setWeapon('staff');view.setStaff('starweaver');assert.ok(view.staff.getObjectByName('StarweaverCrown').visible);assert.equal(view.staff.userData.staffId,'starweaver');view.update(1/30,1);rig.group.updateMatrixWorld(true);assert.ok(view.muzzle().distanceTo(view.gem.getWorldPosition(new THREE.Vector3()))<1e-8);view.setStaff('starter');assert.equal(view.staff.getObjectByName('StarweaverCrown').visible,false);
});
