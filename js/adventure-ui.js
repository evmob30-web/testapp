/* DOM-only quest log, live tracker, item bag and corpse loot window. */
(function(root){
'use strict';
function create(doc,callbacks){
 const Q=root.EmberQuests,E=root.EmberEncounters,D=root.EmberAdventureData,$=id=>doc.getElementById(id);let signature='';
 const el=(tag,text,className)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
 const append=(node,...children)=>{for(const child of children)node.appendChild(child);return node;};
 function objectiveLabel(o){return o.label||D.items[o.itemId]?.name||D.enemyDefinitions[o.enemyType]?.name||o.npcId||o.objectId||'Doel';}
 function objectives(state,q){
  const list=el('ul',undefined,'objective-list');for(const o of q.objectives){const count=Q.progress(state.journal,q.id,o.id),row=el('li',undefined,count>=o.count?'objective-done':'');append(row,el('span',objectiveLabel(o)),el('strong',count+' / '+o.count));list.appendChild(row);}return list;
 }
 function card(state,q,compact=false){
  const section=el('section',undefined,'journal-card'),status=Q.status(state.journal,q.id);append(section,el(compact?'h4':'h3',q.title));if(!compact)section.appendChild(el('p',q.description));section.appendChild(objectives(state,q));
  if(status==='READY_TO_TURN_IN')section.appendChild(el('p','Quest voltooid! Keer terug naar '+(D.npcs[q.turnIn]?.name||q.turnIn)+'.','quest-ready'));
  if(!compact){section.appendChild(el('p',(q.rewards?.xp||0)+' XP · '+(q.rewards?.gold||0)+' goud','quest-rewards'));if(status==='COMPLETED')section.appendChild(el('p','Voltooid · Beloning ontvangen','quest-ready'));}return section;
 }
 function render(state){
  const next=JSON.stringify([state.journal,state.quest,state.kills,state.crystals,state.dungeon,state.area,state.caveKey,state.gateOpen,state.amulet]);if(signature===next)return;signature=next;
  const active=D.quests.filter(q=>['ACTIVE','READY_TO_TURN_IN'].includes(Q.status(state.journal,q.id))),complete=D.quests.filter(q=>Q.status(state.journal,q.id)==='COMPLETED');
  $('extra-quest-tracker').replaceChildren();$('extra-quest-tracker').hidden=!active.length;for(const q of active)$('extra-quest-tracker').appendChild(card(state,q,true));
  $('journal-active').replaceChildren();$('journal-completed').replaceChildren();for(const q of active)$('journal-active').appendChild(card(state,q));for(const q of complete)$('journal-completed').appendChild(card(state,q));
  if(!active.length)$('journal-active').appendChild(el('p','Nog geen extra opdrachten. Jager Rowan wacht ten oosten van het kampvuur.','journal-empty'));if(!complete.length)$('journal-completed').appendChild(el('p','Je voltooide opdrachten verschijnen hier.','journal-empty'));
  const story=root.RPG.questText(state);$('journal-story').textContent=story[0]+' — '+story[1];
  $('adventure-bag').replaceChildren();for(const entry of Q.inventory(state.journal)){const item=D.items[entry.itemId],row=el('div',undefined,'material-row');append(row,el('span',item.icon,'item-symbol'),el('span',item.name+(entry.quest?' · Questitem':'')),el('strong','×'+entry.quantity));$('adventure-bag').appendChild(row);}if(!Q.inventory(state.journal).length)$('adventure-bag').appendChild(el('p','Nog geen materialen of questitems.','journal-empty'));
 }
 function renderLoot(state,spawnId){
  const spawn=E.spawnDefinitions.get(spawnId),rows=E.available(state.encounters,state.journal,spawnId);$('corpse-loot-list').replaceChildren();if(!spawn||!rows.length)return 0;
  $('corpse-loot-title').textContent=spawn.stats.name;$('corpse-loot-level').textContent='Niveau '+spawn.stats.level+' · Jouw buit';
  rows.forEach((entry,index)=>{
   const stats=entry.kind==='equipment'?root.EmberLoot.itemStats(entry.gear):null,item=stats?{name:stats.name,icon:'♜',rarity:entry.gear.rarity}:D.items[entry.itemId],button=el('button',undefined,'corpse-loot-row');button.type='button';button.id='loot-entry-'+index;button.dataset.lootId=entry.id;button.dataset.kind=entry.kind;button.dataset.rarity=item.rarity;button.setAttribute('aria-label','Verzamel '+item.name+' ×'+entry.quantity);
   const words=el('span',undefined,'loot-item-words');append(words,el('strong',item.name),el('small',entry.kind==='quest'?'Questitem · '+Q.definitions.get(entry.questId).title:entry.kind==='currency'?'Goudstukken':root.EmberLoot.rarity[item.rarity]?.name||'Gewoon'));
   append(button,el('span',item.icon,'item-symbol'),words,el('b','×'+entry.quantity));button.onclick=()=>callbacks.lootOne(spawnId,entry.id);$('corpse-loot-list').appendChild(button);
  });return rows.length;
 }
 function offers(npcId,selected){
  const list=D.quests.filter(q=>q.giver===npcId||q.turnIn===npcId);$('npc-quest-options').replaceChildren();$('npc-quest-options').hidden=list.length<2;for(const q of list){const button=el('button',q.title,'quiet');button.type='button';button.setAttribute('aria-pressed',String(q.id===selected));button.onclick=()=>callbacks.showQuest(npcId,q.id);$('npc-quest-options').appendChild(button);}
 }
 $('quest-button').onclick=callbacks.openLog;$('quest-log-close').onclick=callbacks.closeLog;$('corpse-loot-close').onclick=callbacks.closeLoot;$('loot-all').onclick=callbacks.lootAll;
 return {render,renderLoot,offers,reset(){signature='';}};
}
root.EmberAdventureUI={create};
})(typeof window==='undefined'?globalThis:window);
