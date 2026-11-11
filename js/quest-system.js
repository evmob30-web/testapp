/* Pure, per-character journal and inventory rules. No renderer, storage or timers. */
(function(root){
'use strict';
const integer=(n,min=0,max=9999)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),record=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
function create({quests=[],items={}}={}){
 const definitions=new Map(),types=new Set(['KILL','COLLECT','QUEST_LOOT','TALK','INTERACT']);
 for(const q of quests){
  if(!q.id||definitions.has(q.id)||!q.giver||!q.turnIn||!q.objectives?.length)throw Error('Invalid quest definition');
  const ids=new Set();for(const o of q.objectives){
   if(!o.id||ids.has(o.id)||!types.has(o.type)||!Number.isInteger(o.count)||o.count<1||o.count>1000)throw Error('Invalid quest objective');ids.add(o.id);
   if(o.type==='QUEST_LOOT'&&(!o.enemyType||items[o.itemId]?.kind!=='quest'||!Number.isFinite(o.chance)||o.chance<0||o.chance>100))throw Error('Invalid quest loot');
   if(o.type==='COLLECT'&&(!items[o.itemId]||items[o.itemId].kind==='quest'))throw Error('Invalid collect item');
  }definitions.set(q.id,q);
 }
 const binding=(q,o)=>q+'::'+o;
 function fresh(){return {version:1,sequence:0,quests:{},inventory:{},questItems:{}};}
 function progress(s,qid,oid){return s.quests[qid]?.objectives[oid]?.count||0;}
 function status(s,qid){return s.quests[qid]?.status||'NOT_STARTED';}
 function refresh(s,qid){
  const q=definitions.get(qid),entry=s.quests[qid];if(!q||!entry||entry.status==='COMPLETED')return;
  for(const o of q.objectives){const p=entry.objectives[o.id];if(o.type==='COLLECT')p.count=Math.min(o.count,s.inventory[o.itemId]||0);if(o.type==='QUEST_LOOT')p.count=Math.min(o.count,s.questItems[binding(qid,o.id)]||0);}
  entry.status=q.objectives.every(o=>progress(s,qid,o.id)>=o.count)?'READY_TO_TURN_IN':'ACTIVE';
 }
 function restore(raw){
  const result=fresh(),data=record(raw);if(data.version!==1)return result;result.sequence=integer(data.sequence,0,1e9);
  for(const [id,quantity]of Object.entries(record(data.inventory)))if(own(items,id)&&items[id].kind==='material')result.inventory[id]=integer(quantity);
  for(const [id,q]of definitions){
   const old=record(record(data.quests)[id]);if(!['ACTIVE','READY_TO_TURN_IN','COMPLETED'].includes(old.status))continue;
   const entry={status:old.status==='COMPLETED'?'COMPLETED':'ACTIVE',objectives:{}};result.quests[id]=entry;
   for(const o of q.objectives){
    const p=record(record(old.objectives)[o.id]);entry.objectives[o.id]={count:integer(p.count,0,o.count),seen:Array.isArray(p.seen)?[...new Set(p.seen.filter(v=>typeof v==='string'&&v.length<=160))].slice(0,o.count):[]};
    if(o.type==='QUEST_LOOT'&&entry.status!=='COMPLETED')result.questItems[binding(id,o.id)]=integer(record(data.questItems)[binding(id,o.id)],0,o.count);
   }refresh(result,id);
  }return result;
 }
 function accept(s,qid,npc){
  const q=definitions.get(qid);if(!q||q.giver!==npc||status(s,qid)!=='NOT_STARTED')return false;
  s.quests[qid]={status:'ACTIVE',objectives:Object.fromEntries(q.objectives.map(o=>[o.id,{count:0,seen:[]}]))};for(const o of q.objectives)if(o.type==='QUEST_LOOT')s.questItems[binding(qid,o.id)]=0;refresh(s,qid);return true;
 }
 function notify(s,event){
  if(!event||typeof event.id!=='string'||event.id.length>160)return false;let changed=false;
  for(const [qid,q]of definitions){if(status(s,qid)!=='ACTIVE')continue;
   for(const o of q.objectives){
    const p=s.quests[qid].objectives[o.id];if(p.count>=o.count||p.seen.includes(event.id))continue;
    const matches=o.type==='KILL'&&event.type==='KILL'&&o.enemyType===event.enemyType||o.type==='TALK'&&event.type==='TALK'&&o.npcId===event.npcId||o.type==='INTERACT'&&event.type==='INTERACT'&&o.objectId===event.objectId;
    if(matches){p.seen.push(event.id);p.count=Math.min(o.count,p.count+1);changed=true;}
   }refresh(s,qid);
  }return changed;
 }
 function signal(s,event){if(!['TALK','INTERACT'].includes(event.type))return false;s.sequence=(s.sequence||0)+1;return notify(s,{...event,id:event.type+'/'+s.sequence+'/'+(event.npcId||event.objectId)});}
 function eligible(s,qid,oid,enemyType){
  const q=definitions.get(qid),o=q?.objectives.find(o=>o.id===oid);return !!(o&&o.type==='QUEST_LOOT'&&o.chance>0&&o.enemyType===enemyType&&status(s,qid)==='ACTIVE'&&progress(s,qid,oid)<o.count);
 }
 function questDrops(s,enemyType,random=Math.random){
  const drops=[];for(const [qid,q]of definitions)for(const o of q.objectives){if(!eligible(s,qid,o.id,enemyType))continue;if(o.chance===100||o.chance>0&&random()<o.chance/100)drops.push({kind:'quest',itemId:o.itemId,quantity:1,questId:qid,objectiveId:o.id});}return drops;
 }
 function collectQuest(s,entry,receipt,enemyType){
  if(!eligible(s,entry.questId,entry.objectiveId,enemyType))return 0;
  const q=definitions.get(entry.questId),o=q.objectives.find(o=>o.id===entry.objectiveId),p=s.quests[entry.questId].objectives[o.id];
  if(entry.itemId!==o.itemId||typeof receipt!=='string'||receipt.length>160||p.seen.includes(receipt))return 0;
  const amount=Math.min(integer(entry.quantity),o.count-p.count);if(!amount)return 0;
  p.seen.push(receipt);s.questItems[binding(q.id,o.id)]=(s.questItems[binding(q.id,o.id)]||0)+amount;refresh(s,q.id);return amount;
 }
 function collectRegular(s,itemId,quantity){
  if(!own(items,itemId)||items[itemId].kind!=='material')return 0;const before=s.inventory[itemId]||0,amount=Math.min(integer(quantity),9999-before);if(!amount)return 0;s.inventory[itemId]=before+amount;for(const id of definitions.keys())refresh(s,id);return amount;
 }
 function turnIn(s,qid,npc){
  const q=definitions.get(qid);refresh(s,qid);if(!q||q.turnIn!==npc||status(s,qid)!=='READY_TO_TURN_IN')return null;
  for(const o of q.objectives){if(o.type==='COLLECT')s.inventory[o.itemId]-=o.count;if(o.type==='QUEST_LOOT')delete s.questItems[binding(qid,o.id)];}
  s.quests[qid].status='COMPLETED';for(const id of definitions.keys())refresh(s,id);return {xp:integer(q.rewards?.xp,0,99999),gold:integer(q.rewards?.gold,0,99999)};
 }
 function inventory(s){
  const list=Object.entries(s.inventory).filter(([,n])=>n>0).map(([itemId,quantity])=>({itemId,quantity,quest:false}));
  for(const [qid,q]of definitions)for(const o of q.objectives){const quantity=s.questItems[binding(qid,o.id)]||0;if(quantity>0)list.push({itemId:o.itemId,quantity,quest:true,questId:qid,objectiveId:o.id});}return list;
 }
 return {fresh,restore,accept,status,progress,notify,signal,eligible,questDrops,collectQuest,collectRegular,turnIn,inventory,definitions,items,binding};
}
root.EmberQuests={...create(root.EmberAdventureData),create};
})(typeof window==='undefined'?globalThis:window);
