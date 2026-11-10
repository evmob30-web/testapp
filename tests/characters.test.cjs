const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const env={};env.window=env;vm.createContext(env);for(const file of ['core','loot','equipment','characters'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),env);const {RPG,EmberCharacters:C}=env;
function memory(seed={}){const values={...seed};return {values,getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v,removeItem:k=>delete values[k]};}
const open=storage=>C.open({storage:()=>storage});
test('legacy adventure migrates once with class, appearance, quests, gear and an untouched backup',()=>{
 const old=RPG.fresh('mage');old.quest=5;old.level=4;old.gold=321;old.sideQuest=3;old.appearance.hairStyle='braid';old.kills=['w1','w2','w3','boss','d2','rootboss'];old.dungeon=2;old.amulet=true;old.amuletEquipped=true;old.armorOwned.push('ember_gloves');old.armorEquipped.hands='ember_gloves';old.lootBag=[{uid:8,base:'ember_helm',rarity:'epic',affix:'fury'}];old.lootEquipped.head=8;old.lootSequence=8;
 const raw=JSON.stringify(old),storage=memory({[C.legacyKey]:raw}),roster=open(storage),loaded=roster.load();
 assert.equal(roster.migrated,true);assert.equal(roster.active,0);assert.equal(roster.snapshot().slots.filter(Boolean).length,1);assert.equal(loaded.classId,'mage');assert.equal(loaded.quest,5);assert.equal(loaded.gold,321);assert.equal(loaded.appearance.hairStyle,'braid');assert.equal(loaded.amuletEquipped,true);assert.equal(loaded.armorEquipped.hands,'ember_gloves');assert.equal(loaded.lootEquipped.head,8);assert.equal(storage.values[C.legacyKey],raw);
 const again=open(storage);assert.equal(again.migrated,false);assert.equal(again.snapshot().slots.filter(Boolean).length,1);assert.equal(again.load().gold,321);
});
test('three classes keep independent progress, equipment, appearance and cloned state',()=>{
 const storage=memory(),roster=open(storage);
 for(const [i,id]of ['guardian','ranger','mage'].entries()){const state=RPG.fresh(id);state.gold=10+i;state.appearance.hairColor=['black','blonde','silver'][i];assert.equal(roster.create(i,id,state),true);state.gold=900;}
 assert.equal(roster.create(0,'replacement',RPG.fresh()),false);assert.equal(roster.create(3,'fourth',RPG.fresh()),false);
 roster.activate(1);const ranger=roster.load();assert.equal(ranger.gold,11);ranger.quest=1;ranger.gold=77;roster.save(ranger,'Liora');ranger.gold=999;
 const again=open(storage);assert.equal(again.active,1);assert.equal(again.name,'Liora');assert.equal(again.load().gold,77);assert.equal(again.load(0).gold,10);assert.equal(again.load(2).gold,12);assert.equal(again.load(2).appearance.hairColor,'silver');assert.equal(again.load(1).quest,1);assert.equal(again.load(0).quest,0);assert.equal(again.load(2).weapon,'staff');
});
test('cancelling a draft leaves storage unchanged and an occupied slot cannot be replaced',()=>{
 const storage=memory(),roster=open(storage),before=JSON.stringify(storage.values);assert.equal(roster.snapshot().slots.filter(Boolean).length,0);assert.equal(JSON.stringify(storage.values),before);
 roster.create(0,'Aerin',RPG.fresh());const raw=storage.values[C.key];assert.equal(roster.create(0,'Other',RPG.fresh('mage')),false);assert.equal(storage.values[C.key],raw);assert.equal(roster.save(RPG.fresh('guardian')),true);
});
test('removing every hero does not resurrect the retained legacy backup',()=>{
 const raw=JSON.stringify(RPG.fresh()),storage=memory({[C.legacyKey]:raw}),roster=open(storage);roster.create(1,'Liora',RPG.fresh('ranger'));roster.remove(0);assert.equal(roster.load(1).classId,'ranger');roster.remove(1);
 const again=open(storage);assert.equal(again.active,null);assert.equal(again.snapshot().slots.filter(Boolean).length,0);assert.equal(storage.values[C.legacyKey],raw);assert.equal(again.create(0,'Orion',RPG.fresh('mage')),true);assert.equal(again.load().classId,'mage');
});
test('blocked storage and quota failure keep characters playable in this session',()=>{
 const blocked=C.open({storage:()=>{throw Error('Blocked');}});assert.equal(blocked.persistent,false);assert.equal(blocked.create(0,'Orion',RPG.fresh('mage')),true);assert.equal(blocked.load().classId,'mage');assert.match(blocked.message,/sessie/);
 const storage=memory();storage.setItem=()=>{throw Error('Quota');};const roster=open(storage);roster.create(0,'Aerin',RPG.fresh());roster.create(1,'Liora',RPG.fresh('ranger'));assert.equal(roster.load(0).classId,'guardian');assert.equal(roster.load(1).classId,'ranger');assert.equal(roster.persistent,false);
});
test('failed migration never erases the original and retries on the next load',()=>{
 const raw=JSON.stringify({...RPG.fresh('ranger'),gold:84}),storage=memory({[C.legacyKey]:raw}),write=storage.setItem;storage.setItem=()=>{throw Error('Quota');};const first=open(storage);assert.equal(first.load().gold,84);assert.equal(storage.values[C.legacyKey],raw);assert.equal(storage.values[C.key],undefined);storage.setItem=write;const again=open(storage);assert.equal(again.load().gold,84);assert.equal(again.persistent,true);assert.ok(storage.values[C.key]);
});
test('malformed or unsupported rosters stay untouched instead of being overwritten',()=>{
 for(const raw of ['{broken',JSON.stringify({version:99,slots:[null,null,null]}),JSON.stringify({version:1,active:0,slots:[{name:'Old',state:{version:99}},null,null]})]){
  const storage=memory({[C.key]:raw,[C.legacyKey]:JSON.stringify(RPG.fresh())}),roster=open(storage);assert.equal(roster.locked,true);assert.equal(roster.create(0,'New',RPG.fresh()),false);assert.equal(storage.values[C.key],raw);
 }
});
test('invalid old data is retained and new characters require an explicit create',()=>{
 const storage=memory({[C.legacyKey]:'{broken'}),roster=open(storage);assert.equal(roster.snapshot().slots.filter(Boolean).length,0);assert.equal(storage.values[C.key],undefined);assert.equal(storage.values[C.legacyKey],'{broken');assert.equal(roster.create(1,'Liora',RPG.fresh('ranger')),true);assert.equal(storage.values[C.legacyKey],'{broken');
});
test('stale saves and external changes cannot overwrite a newer roster',()=>{
 const storage=memory(),first=open(storage);first.create(0,'Aerin',RPG.fresh());const second=open(storage);second.create(1,'Orion',RPG.fresh('mage'));const latest=storage.values[C.key],oldState=first.load();oldState.gold=999;assert.equal(first.save(oldState),false);assert.equal(first.locked,true);assert.equal(storage.values[C.key],latest);
 const third=open(storage);assert.equal(third.external(latest),false);assert.equal(third.external(null),true);assert.equal(third.remove(1),false);assert.equal(storage.values[C.key],latest);
});
test('names are bounded plain text and roster snapshots cannot mutate saved heroes',()=>{
 assert.equal(C.name('  Élin   van\nhet woud  '),'Élin van het woud');assert.equal(C.name('  '),'Aerin');assert.equal(Array.from(C.name('a'.repeat(50))).length,24);
 const storage=memory(),roster=open(storage);roster.create(0,'<img onerror=alert(1)>',RPG.fresh());const snapshot=roster.snapshot();snapshot.slots[0].state.gold=999;assert.equal(roster.load().gold,0);assert.equal(typeof roster.name,'string');
});
