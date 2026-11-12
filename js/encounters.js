/* Persistent spawn lifecycles: one instance and one loot roll per death, no setTimeout. */
(function(root){
'use strict';
const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{},number=(v,a,b)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):a;
function create(data=root.EmberAdventureData,quests=root.EmberQuests){
 const spawnDefinitions=new Map();
 function respawnRange(spawn){const value=spawn.respawnSeconds,r=Array.isArray(value)?value:[value,value];if(r.length!==2||!r.every(Number.isFinite)||r[0]<=0||r[1]<r[0]||r[1]>86400)throw Error('Invalid respawn range');return r;}
 for(const spawn of data.spawns){if(!spawn.id||spawnDefinitions.has(spawn.id)||!spawn.enemyType||!Number.isFinite(spawn.stats?.hp)||spawn.stats.hp<=0||!Number.isFinite(spawn.corpseSeconds)||spawn.corpseSeconds<0)throw Error('Invalid or duplicate spawn definition');respawnRange(spawn);spawnDefinitions.set(spawn.id,spawn);}
 const pickDelay=(range,u)=>range[0]===range[1]?range[0]:range.every(Number.isInteger)?range[0]+Math.floor(u*(range[1]-range[0]+1)):range[0]+u*(range[1]-range[0]);
 function timerRandom(state){state.respawnSeed=(Math.imul(state.respawnSeed,1664525)+1013904223)>>>0;return state.respawnSeed/4294967296;}
 function migratedDelay(current,prior,spawn){
  if(Number.isFinite(prior.respawnDelay)&&prior.respawnDelay>0&&prior.respawnDelay<=86400)return prior.respawnDelay;
  const range=respawnRange(spawn),saved=prior.respawnAt-current.deadAt;if(Number.isFinite(saved)&&saved>=range[0]&&saved<=range[1])return saved;
  let hash=2166136261;for(let i=0;i<current.instanceId.length;i++)hash=Math.imul(hash^current.instanceId.charCodeAt(i),16777619)>>>0;return pickDelay(range,hash/4294967296);
 }
 const newWorld=()=>Date.now().toString(36)+Math.floor(Math.random()*0xffffff).toString(36);
 const identity=(state,spawn,generation)=>state.worldId+'/'+spawn.id+'/'+generation;
 function instance(state,spawn,generation=1){return {instanceId:identity(state,spawn,generation),spawnId:spawn.id,enemyType:spawn.enemyType,generation,status:'alive',hp:spawn.stats.hp,x:spawn.x,z:spawn.z,deadAt:0,respawnDelay:0,respawnAt:0,corpse:null};}
 function fresh(){const state={version:1,worldId:newWorld(),clock:0,seed:Math.floor(Math.random()*0x7ffffffe)+1,spawns:{}};state.respawnSeed=(state.seed^0x9e3779b9)>>>0;for(const spawn of spawnDefinitions.values())state.spawns[spawn.id]=instance(state,spawn);return state;}
 function random(state){state.seed=(Math.imul(state.seed,1664525)+1013904223)>>>0;return state.seed/4294967296;}
 function hasChance(chance,roll){return chance===100||chance>0&&roll()<chance/100;}
 function normalizeLoot(raw,current,spawn){
  if(!Array.isArray(raw))return [];const ids=new Set(),bindings=new Set(),loot=[];
  for(const input of raw.slice(0,64)){
   const row=object(input),prefix=current.instanceId+'/loot/',suffix=typeof row.id==='string'?row.id.slice(prefix.length):'';
   if(typeof row.id!=='string'||!row.id.startsWith(prefix)||!/^\d{1,2}$/.test(suffix)||ids.has(row.id))continue;
   const quantity=Math.floor(number(row.quantity,0,9999));if(!quantity)continue;let entry=null;
   if(row.kind==='equipment'){
    const gear=root.EmberLoot?.readItem(row.gear);if(gear)entry={id:row.id,kind:'equipment',quantity:1,gear};
   }else if(row.kind==='quest'){
    const q=quests.definitions.get(row.questId),o=q?.objectives.find(o=>o.id===row.objectiveId);
    if(o?.type==='QUEST_LOOT'&&o.enemyType===spawn.enemyType&&o.itemId===row.itemId&&o.chance>0)entry={id:row.id,kind:'quest',itemId:o.itemId,quantity:1,questId:q.id,objectiveId:o.id};
   }else{
    const item=data.items[row.itemId],table=data.lootTables[spawn.stats.lootTable]||[],rule=table.find(r=>r.itemId===row.itemId);
    if(item&&item.kind!=='quest'&&rule&&rule.chance>0){const maximum=rule.quantity==='gold'?spawn.stats.gold[1]:rule.max;entry={id:row.id,kind:item.kind,itemId:row.itemId,quantity:Math.min(quantity,maximum)};}
   }
   if(!entry)continue;const key=entry.kind==='equipment'?'equipment:'+entry.gear.uid:entry.kind+':'+entry.itemId+':'+(entry.questId||'')+':'+(entry.objectiveId||'');
   if(bindings.has(key))continue;bindings.add(key);ids.add(entry.id);loot.push(entry);
  }return loot;
 }
 function restore(raw){
  const state=fresh(),old=object(raw);if(old.version!==1)return state;
  if(typeof old.worldId==='string'&&/^[a-zA-Z0-9-]{1,40}$/.test(old.worldId))state.worldId=old.worldId;
  state.clock=number(old.clock,0,1e9);state.seed=Number.isFinite(old.seed)?Math.floor(number(old.seed,0,4294967295)):state.seed;state.respawnSeed=Number.isFinite(old.respawnSeed)?Math.floor(number(old.respawnSeed,0,4294967295)):(state.seed^0x9e3779b9)>>>0;
  for(const spawn of spawnDefinitions.values()){
   const prior=object(object(old.spawns)[spawn.id]),generation=Math.floor(number(prior.generation,1,1e9)),current=instance(state,spawn,generation);state.spawns[spawn.id]=current;
   const x=number(prior.x,spawn.x-19,spawn.x+19),z=number(prior.z,spawn.z-19,spawn.z+19);if(Number.isFinite(prior.x)&&Number.isFinite(prior.z)){current.x=x;current.z=z;}
   current.hp=Number.isFinite(prior.hp)?number(prior.hp,1,spawn.stats.hp):spawn.stats.hp;
   if(prior.status==='dead'){
    current.status='dead';current.hp=0;current.deadAt=number(prior.deadAt,0,state.clock);current.respawnDelay=migratedDelay(current,prior,spawn);current.respawnAt=current.deadAt+current.respawnDelay;
    if(prior.corpse&&state.clock<current.deadAt+spawn.corpseSeconds){const loot=normalizeLoot(object(prior.corpse).loot,current,spawn);if(loot.length)current.corpse={id:current.instanceId,expiresAt:current.deadAt+spawn.corpseSeconds,loot};}
   }
  }tick(state,0);return state;
 }
 function tick(state,dt){
  state.clock+=number(dt,0,86400);const changes=[];
  for(const spawn of spawnDefinitions.values()){
   const current=state.spawns[spawn.id];if(current.status!=='dead')continue;
   if(state.clock+1e-8>=current.respawnAt){state.spawns[spawn.id]=instance(state,spawn,current.generation+1);changes.push({type:'respawn',spawnId:spawn.id,oldInstanceId:current.instanceId});}
   else if(current.corpse&&state.clock+1e-8>=current.corpse.expiresAt){current.corpse=null;changes.push({type:'expired',spawnId:spawn.id});}
  }return changes;
 }
 function defeat(state,journal,spawnId,{x,z,gear,roll}={}){
  const spawn=spawnDefinitions.get(spawnId),current=state.spawns[spawnId];if(!spawn||!current||current.status!=='alive')return null;
  current.status='dead';current.hp=0;if(Number.isFinite(x)&&Number.isFinite(z)){current.x=x;current.z=z;}current.deadAt=state.clock;const range=respawnRange(spawn);current.respawnDelay=pickDelay(range,range[0]===range[1]?0:timerRandom(state));current.respawnAt=state.clock+current.respawnDelay;
  quests.notify(journal,{id:current.instanceId,type:'KILL',enemyType:spawn.enemyType});
  const next=roll||(()=>random(state)),loot=[];
  for(const rule of data.lootTables[spawn.stats.lootTable]||[]){
   const item=data.items[rule.itemId];if(!item||item.kind==='quest'||!hasChance(rule.chance,next))continue;
   const [min,max]=rule.quantity==='gold'?spawn.stats.gold:[rule.min,rule.max],quantity=min+Math.floor(next()*(max-min+1));if(quantity>0)loot.push({kind:item.kind,itemId:rule.itemId,quantity});
  }
  if(gear){const item=gear(next);if(item)loot.push({kind:'equipment',quantity:1,gear:item});}
  loot.push(...quests.questDrops(journal,spawn.enemyType,next));loot.forEach((entry,i)=>entry.id=current.instanceId+'/loot/'+i);
  current.corpse=loot.length?{id:current.instanceId,expiresAt:state.clock+spawn.corpseSeconds,loot}:null;return current;
 }
 function available(state,journal,spawnId){
  const current=state.spawns[spawnId];if(current?.status!=='dead'||!current.corpse||state.clock>=current.corpse.expiresAt)return [];
  current.corpse.loot=current.corpse.loot.filter(row=>row.kind!=='quest'||quests.eligible(journal,row.questId,row.objectiveId,current.enemyType));
  return current.corpse.loot;
 }
 function claim(state,journal,spawnId,lootId,receiveEquipment){
  const current=state.spawns[spawnId],loot=available(state,journal,spawnId),index=loot.findIndex(row=>row.id===lootId);if(index<0)return {ok:false,reason:'unavailable'};
  const row=loot[index];let quantity=row.quantity;
  if(row.kind==='quest')quantity=quests.collectQuest(journal,row,row.id,current.enemyType);
  else if(row.kind==='material')quantity=quests.collectRegular(journal,row.itemId,quantity);
  else if(row.kind==='equipment'&&!receiveEquipment?.(row.gear))return {ok:false,reason:'bag-full'};
  if(!quantity)return {ok:false,reason:'bag-full'};
  if(quantity<row.quantity)row.quantity-=quantity;else loot.splice(index,1);if(!loot.length)current.corpse=null;return {ok:true,entry:{...row,quantity},gold:row.kind==='currency'?quantity:0};
 }
 function snapshot(state,enemies){
  for(const e of enemies){const current=state.spawns[e.id];if(!current||current.status!=='alive')continue;current.hp=Math.max(1,e.hp);current.x=e.mesh.position.x;current.z=e.mesh.position.z;}
 }
 function maxGearUID(state){let uid=0;for(const e of Object.values(state.spawns))for(const row of e.corpse?.loot||[])if(row.kind==='equipment')uid=Math.max(uid,row.gear.uid);return uid;}
 return {fresh,restore,random,tick,defeat,available,claim,snapshot,maxGearUID,spawnDefinitions,respawnRange};
}
root.EmberEncounters={...create(),create};
})(typeof window==='undefined'?globalThis:window);
