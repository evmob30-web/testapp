/* Quest guidance reads existing progress; it never grants items or advances quests. */
(function(root){
'use strict';
const legacyIds=['story','roots','bow','herbalist'];
const active=status=>status==='ACTIVE'||status==='READY_TO_TURN_IN';
function fresh(){return {version:1,trackedId:null,enabled:true};}
function restore(raw){
 if(!raw||raw.version!==1)return fresh();
 return {version:1,trackedId:typeof raw.trackedId==='string'&&/^[a-z][a-z0-9_:-]{0,63}$/.test(raw.trackedId)?raw.trackedId:null,enabled:raw.enabled!==false};
}
function list(s){
 const R=root.RPG,Q=root.EmberQuests,result=[];
 const add=(id,title,description,ready=false)=>result.push({id,title,description,status:ready?'READY_TO_TURN_IN':'ACTIVE',legacy:true});
 if(s.quest>=1&&s.quest<=4){const text=R.questText(s);add('story',text[0],text[1],s.quest===4||s.quest===1&&R.wolfCount(s)>=3||s.quest===2&&s.crystals.length===3);}
 if(s.quest===5&&s.dungeon>=1&&s.dungeon<=2){const text=R.questText(s);add('roots','De Wortelgrotten',text[1],s.dungeon===2);}
 if(s.bowQuest===1)add('bow','Boogtraining bij Elin',s.bowPractice.length+' / 3 doelen geraakt met een geladen pijl.',s.bowPractice.length===3);
 if(s.sideQuest===1||s.sideQuest===2){const text=R.sideText(s);add('herbalist','De vermiste kruidenzoeker',text[1],s.sideQuest===2);}
 for(const q of Q.definitions.values()){const status=Q.status(s.journal,q.id);if(active(status)&&(!q.classId||q.classId===s.classId))result.push({id:'quest:'+q.id,title:q.title,description:q.description,status,definition:q,legacy:false});}
 return result;
}
function ensure(s){
 s.questGuide=restore(s.questGuide);const quests=list(s);
 if(!quests.some(q=>q.id===s.questGuide.trackedId))s.questGuide.trackedId=quests[0]?.id||null;
 return quests.find(q=>q.id===s.questGuide.trackedId)||null;
}
function select(s,id){if(!list(s).some(q=>q.id===id))return false;s.questGuide=restore(s.questGuide);s.questGuide.trackedId=id;s.questGuide.enabled=true;return true;}
function setEnabled(s,value){ensure(s);s.questGuide.enabled=value===true;}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function create(){
 let previous=null,previousQuest=null;
 function plan(s,targets=[]){
  const quest=ensure(s);if(!quest){previous=previousQuest=null;return null;}
  if(previousQuest!==quest.id){previous=null;previousQuest=quest.id;}
  const R=root.RPG,Q=root.EmberQuests,D=root.EmberAdventureData,E=root.EmberEncounters,byKey=new Map(targets.map(t=>[t.key,t]));
  const result={quest,target:null,step:'Dit doel is tijdelijk niet beschikbaar.',waiting:true};
  function goal(target,label){
   if(!target||!Number.isFinite(target.position?.x)||!Number.isFinite(target.position?.z))return result;
   previous=target.key;result.target={key:target.key,identity:target.identity,position:{...target.position},area:s.area,kind:target.kind||'object',range:target.range||2,label:label||target.label};result.step=label||target.label;result.waiting=false;return result;
  }
  const key=(id,label)=>goal(byKey.get(id),label);
  function nearest(candidates,label){
   if(!candidates.length)return result;const old=candidates.find(t=>t.key===previous),chosen=old||candidates.reduce((a,b)=>distance(s,a.position)<=distance(s,b.position)?a:b);
   return goal(chosen,typeof label==='function'?label(chosen):label);
  }
  function valley(){if(s.area!=='roots')return false;key('object:exit','Verlaat de grot · terug naar de vallei');return true;}
  function npc(id){if(valley())return result;const name=D.npcs[id]?.name||{elin:'Elin',mira:'Mira',tovin:'Tovin'}[id]||id;return key('npc:'+id,'Praat met '+name);}
  function enemies(type,label){
   if(valley())return result;
   const candidates=targets.filter(t=>t.kind==='enemy'&&t.enemy.enemyType===type);
   if(!candidates.length){result.step='Wacht op '+(D.enemyDefinitions[type]?.name||'de vijand')+' · doel keert terug';return result;}
   return nearest(candidates,label);
  }
  if(quest.id==='story'){
   if(quest.status==='READY_TO_TURN_IN')return npc('elin');
   if(s.quest===1)return enemies('shadow_wolf','Versla schemerwolven · '+R.wolfCount(s)+' / 3');
   if(valley())return result;
   if(s.quest===2)return nearest(R.crystals.filter(c=>!s.crystals.includes(c.id)).map(c=>byKey.get('object:'+c.id)).filter(Boolean),'Verzamel een lichtkristal · '+s.crystals.length+' / 3');
   return key('enemy:boss','Versla de Doornwachter');
  }
  if(quest.id==='roots'){
   if(s.dungeon===2)return npc('elin');
   if(s.area==='valley')return key('object:entrance','Betreed de Wortelgrotten');
   if(!s.caveKey)return s.kills.includes('d2')?key('object:root-key','Pak de wortelsleutel'):key('enemy:d2','Versla de Sporenwachter voor de sleutel');
   if(!s.gateOpen)return key('object:root-gate','Open de worteldeur');
   if(!s.kills.includes('rootboss'))return key('enemy:rootboss','Versla de Wortelmoeder');
   return key('object:root-altar','Neem het Hartamulet');
  }
  if(quest.id==='bow'){
   if(quest.status==='READY_TO_TURN_IN')return npc('elin');if(valley())return result;
   return nearest(R.bowTargets.filter(t=>!s.bowPractice.includes(t.id)).map(t=>byKey.get('practice:'+t.id)).filter(Boolean),'Raak dit doel met een geladen pijl · '+s.bowPractice.length+' / 3');
  }
  if(quest.id==='herbalist')return npc(s.sideQuest===2?'mira':'tovin');
  const q=quest.definition;if(quest.status==='READY_TO_TURN_IN')return npc(q.turnIn);
  const objective=q.objectives.find(o=>Q.progress(s.journal,q.id,o.id)<o.count);if(!objective)return result;
  if(valley())return result;
  if(objective.type==='TALK')return npc(objective.npcId);
  if(objective.type==='QUEST_LOOT'){
   const corpses=targets.filter(t=>t.kind==='corpse'&&E.available(s.encounters,s.journal,t.spawnId).some(item=>item.kind==='quest'&&item.questId===q.id&&item.objectiveId===objective.id));
   if(corpses.length)return nearest(corpses,'Verzamel '+(D.items[objective.itemId]?.name||'questbuit')+' uit dit lichaam');
   return enemies(objective.enemyType,'Versla '+(D.enemyDefinitions[objective.enemyType]?.name||'een vijand')+' · '+Q.progress(s.journal,q.id,objective.id)+' / '+objective.count);
  }
  if(objective.type==='KILL')return enemies(objective.enemyType,'Versla '+(D.enemyDefinitions[objective.enemyType]?.name||'de vijand'));
  if(objective.type==='INTERACT'){
   if(objective.objectId==='mage-target')return key('practice:mage','Raak het oefenkristal met Vonkbol · '+Q.progress(s.journal,q.id,objective.id)+' / 3');
   const data=D.mageTraining;
   if(objective.objectId==='mage-barrier')return goal({key:'lesson:ward',position:data.ward},'Vang in de blauwe kring een puls op met Barrière');
   if(objective.objectId==='mage-blink')return distance(s,data.blinkStart)<=1.8?goal({key:'lesson:blink-end',position:data.blinkEnd},'Gebruik Blink naar de blauwe eindrune'):goal({key:'lesson:blink-start',position:data.blinkStart},'Ga op de gouden startrune staan');
   return key('object:'+objective.objectId,objective.label);
  }
  return result;
 }
 return {plan,reset(){previous=previousQuest=null;}};
}
root.EmberQuestGuide={fresh,restore,list,ensure,select,setEnabled,create,legacyIds};
})(typeof window==='undefined'?globalThis:window);
