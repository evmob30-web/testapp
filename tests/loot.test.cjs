const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const THREE=require('../vendor/three.min.js');
const root={THREE};root.window=root;vm.createContext(root);
for(const file of ['core','loot','equipment','character-rig'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'),root);
const loot=root.EmberLoot,armor=root.EmberEquipment;
function randomStream(values){let i=0;return ()=>values[i++%values.length];}
test('rarities, distinct affixes and template-derived bonuses',()=>{
 const base={uid:1,base:'ember_chest',affix:'vitality'};
 const common=loot.itemStats({...base,rarity:'common'});
 const legendary=loot.itemStats({...base,rarity:'legendary'});
 assert.ok(legendary.hp>common.hp);
 assert.equal(legendary.color,'#ffb44f');
 assert.ok(loot.itemStats({...base,affix:'marksman',rarity:'epic'}).bow>0);
 assert.ok(loot.itemStats({...base,affix:'bulwark',rarity:'epic'}).guard>0);
 assert.equal(loot.itemStats({...base,rarity:'custom'}),null);
});
test('loot chance uses weighted randomness and legendary boss rewards',()=>{
 const state=root.RPG.fresh();
 const wolf={id:'w1',mesh:{position:{x:3,z:-7}},area:'valley'};
 assert.equal(loot.roll(state,wolf,randomStream([.99])),null,'normal enemies do not always drop loot');
 const rare=loot.roll(state,wolf,randomStream([.1,.66,.2,.51]));
 assert.equal(rare.rarity,'rare');
 assert.equal(rare.area,'valley');
 assert.equal(loot.roll(state,{...wolf,boss:true},randomStream([.99,.99,.1,.1])).rarity,'legendary');
 assert.equal(new Set(state.lootDrops.map(i=>i.uid)).size,2);
});
test('pickup, equip, compare, save, unequip and sell',()=>{
 const s=root.RPG.fresh('ranger');
 s.lootDrops=[{uid:2,base:'ember_gloves',rarity:'epic',affix:'marksman',x:7,z:-10,area:'valley'}];s.lootSequence=2;
 const picked=loot.pickup(s,2);
 assert.equal(picked.uid,2);assert.equal(s.lootDrops.length,0);
 const comparison=loot.comparison(s,picked);
 assert.ok(comparison.difference.bow>0);
 const baseArrow=root.RPG.arrowDamage(s,1.2);
 assert.equal(loot.equip(s,2),true);
 assert.equal(s.lootEquipped.hands,2);
 assert.ok(root.RPG.arrowDamage(s,1.2)>baseArrow);
 assert.equal(loot.sell(s,2),0,'cannot sell equipped item');
 const saved=root.RPG.restore(JSON.stringify(s));
 assert.equal(saved.lootEquipped.hands,2);
 assert.equal(loot.equip(saved,2),true);
 assert.equal(saved.lootEquipped.hands,null);
 assert.equal(loot.sell(saved,2),90);
 assert.equal(saved.gold,90);
 assert.equal(loot.sell(saved,2),0);
});
test('legacy armor and randomized gear never stack in the same slot',()=>{
 const s=root.RPG.fresh();armor.clean(s);
 armor.equip(s,'wanderer_chest');
 const baseline=root.RPG.maxHp(s);
 s.lootBag=[{uid:1,base:'ember_chest',rarity:'rare',affix:'vitality'}];s.lootSequence=1;
 assert.equal(loot.equip(s,1),true);
 assert.equal(s.armorEquipped.chest,null);
 assert.equal(root.RPG.maxHp(s),root.RPG.classConfig(s).hp+loot.itemStats(s.lootBag[0]).hp);
 armor.equip(s,'wanderer_chest');
 assert.equal(s.lootEquipped.chest,null);
 assert.equal(root.RPG.maxHp(s),baseline);
});
test('bad saves cannot inject items, arbitrary bonuses, duplicate IDs or fake slot references',()=>{
 const old=root.RPG.fresh();
 const corrupt={...old,lootSequence:-9999,
  lootBag:[{uid:1,base:'ember_chest',rarity:'legendary',affix:'fury',hp:999999},{uid:1,base:'ember_helm',rarity:'epic',affix:'fury'},{uid:2,base:'fake',rarity:'legendary',affix:'fury'},{uid:4,base:'ember_boots',rarity:'legendary',affix:'guard'}],
  lootEquipped:{head:1,chest:1,hands:666,invalid:1},
  lootDrops:[{uid:1,base:'ember_helm',rarity:'common',affix:'fury',x:0,z:0,area:'valley'},{uid:3,base:'ember_helm',rarity:'common',affix:'fury',x:99999,z:0,area:'valley'}]};
 const fixed=root.RPG.restore(JSON.stringify(corrupt));
 assert.equal(fixed.lootBag.length,1);
 assert.equal(fixed.lootDrops.length,0);
 assert.equal(fixed.lootEquipped.head,null);
 assert.equal(fixed.lootEquipped.chest,1);
 assert.equal(loot.bonuses(fixed).power,loot.itemStats(fixed.lootBag[0]).power);
 assert.equal(fixed.lootSequence,1);
 assert.deepEqual(Object.keys(fixed.lootEquipped),Array.from(loot.slots));
});
test('inventory stays bounded even after repeated enemy drops',()=>{
 const state=root.RPG.fresh(),enemy={id:'w1',mesh:{position:{x:0,z:0}}};
 for(let i=0;i<70;i++)loot.roll(state,enemy,randomStream([0,.1,.2,.3]));
 assert.equal(state.lootDrops.length,32);
 assert.equal(loot.pickup(state,1).uid,1);
 assert.ok(state.lootBag.length<=loot.maxInventory);
});
