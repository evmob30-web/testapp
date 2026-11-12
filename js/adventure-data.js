/* Original Emberwild content. Add types, spawn points and quests here, not in combat. */
(function(root){
'use strict';
const items={
 gold:{name:'Goud',icon:'●',kind:'currency',rarity:'common'},
 wolf_pelt:{name:'Wolvenvacht',icon:'▧',kind:'material',rarity:'common'},
 forest_spore:{name:'Lichtspore',icon:'✧',kind:'material',rarity:'rare'},
 wolf_tooth:{name:'Wolventand',icon:'◢',kind:'quest',rarity:'common'}
};
const respawnProfiles={animal:[120,180],monster:[120,240],strong:[180,300],elite:[300,600]};
const enemyDefinitions={
 gray_wolf:{respawnCategory:'animal',name:'Grijze wolf',level:1,hp:55,damage:8,speed:2.7,xp:15,gold:[2,5],lootTable:'wolf',wanderRadius:2,respawnSeconds:respawnProfiles.animal,corpseSeconds:25},
 shadow_wolf:{respawnCategory:'animal',name:'Schemerwolf',level:2,hp:65,damage:10,speed:3.3,xp:25,gold:[12,12],lootTable:'wolf',wanderRadius:0,respawnSeconds:respawnProfiles.animal,corpseSeconds:25},
 forest_spirit:{respawnCategory:'monster',name:'Bosgeest',level:3,hp:90,damage:14,speed:1.9,xp:25,gold:[12,12],lootTable:'spirit',wanderRadius:0,respawnSeconds:respawnProfiles.monster,corpseSeconds:25},
 thorn_guardian:{name:'Doornwachter',level:5,hp:280,damage:30,speed:2.1,xp:100,gold:[40,40],lootTable:'boss',wanderRadius:0,respawnSeconds:300,corpseSeconds:25},
 root_guard:{respawnCategory:'monster',name:'Wortelwacht',level:4,hp:95,damage:14,speed:3.3,xp:35,gold:[14,14],lootTable:'root',wanderRadius:0,respawnSeconds:respawnProfiles.monster,corpseSeconds:25},
 spore_guard:{respawnCategory:'strong',name:'Sporenwachter',level:4,hp:110,damage:14,speed:1.9,xp:35,gold:[14,14],lootTable:'spirit',wanderRadius:0,respawnSeconds:respawnProfiles.strong,corpseSeconds:25},
 root_mother:{name:'Wortelmoeder',level:7,hp:820,damage:36,speed:2.1,xp:150,gold:[65,65],lootTable:'boss',wanderRadius:0,respawnSeconds:600,corpseSeconds:25}
};
enemyDefinitions.arcane_echo={name:'Vael, de Gebroken Vonk',level:3,hp:520,damage:26,speed:0,xp:0,gold:[0,0],lootTable:'none',wanderRadius:0,respawnSeconds:3600,corpseSeconds:0};
const arcaneTrial={questId:'mage_trial',spawnId:'arcane-vael',x:-26,z:3,radius:5.5,leash:9};
const lootTables={none:[],
 wolf:[{itemId:'gold',chance:100,quantity:'gold'},{itemId:'wolf_pelt',chance:100,min:1,max:1}],
 spirit:[{itemId:'gold',chance:100,quantity:'gold'},{itemId:'forest_spore',chance:65,min:1,max:2}],
 root:[{itemId:'gold',chance:100,quantity:'gold'}],
 boss:[{itemId:'gold',chance:100,quantity:'gold'},{itemId:'forest_spore',chance:100,min:2,max:4}]
};
const extraSpawns=[
 {id:'gray-east-1',enemyType:'gray_wolf',x:22,z:4},
 {id:'gray-east-2',enemyType:'gray_wolf',x:25,z:-5},
 {id:'gray-east-3',enemyType:'gray_wolf',x:18,z:-12},
 {id:'gray-east-4',enemyType:'gray_wolf',x:30,z:-16},
 {id:'gray-east-5',enemyType:'gray_wolf',x:29,z:-28},
 {id:'gray-east-6',enemyType:'gray_wolf',x:18,z:-24}
];
extraSpawns.push({id:arcaneTrial.spawnId,enemyType:'arcane_echo',x:arcaneTrial.x,z:arcaneTrial.z,arcaneTrial:true,boss:true});
const extraEnemies=extraSpawns.map(spawn=>{const type=enemyDefinitions[spawn.enemyType];return {...spawn,name:type.name,hp:type.hp,damage:type.damage,speed:type.speed};});
const npcs={rowan:{id:'rowan',name:'Jager Rowan',speaker:'Rowan · Jager',x:12,z:9,area:'valley'},lyra:{id:'lyra',name:'Magistra Lyra',speaker:'Lyra · Magistra',x:-20,z:27,area:'valley'}};
const quests=[{
 id:'wolf_plague',title:'De wolvenplaag',description:'Grijze wolven naderen Lindehaard vanuit het oosten. Verzamel tien wolventanden voor Jager Rowan, zodat hij hun herkomst kan onderzoeken.',
 giver:'rowan',turnIn:'rowan',offerText:'De grijze wolven lopen al in het oostelijke woud. Open hun lichaam na een gevecht; een wolventand heeft 60% kans op een drop.',progressText:'Verzamel de buit van verslagen grijze wolven. Nog geen tand gevonden? Ze keren na 120–180 seconden speeltijd terug.',completedText:'Dank je, reiziger. De tanden helpen ons het woud te begrijpen. De grijze wolven blijven rondlopen; hun gewone buit kun je blijven verzamelen.',objectives:[{id:'teeth',type:'QUEST_LOOT',enemyType:'gray_wolf',itemId:'wolf_tooth',count:10,chance:60,label:'Wolventanden'}],rewards:{xp:250,gold:50}
}];
const mageTraining={target:{x:-25,z:13},firing:{x:-25,z:18},ward:{x:-24,z:24},blinkStart:{x:-25,z:28},blinkEnd:{x:-25,z:21.5}};
quests.push(
 {id:'mage_spark',title:'Een vonk onder controle',classId:'mage',minLevel:1,giver:'lyra',turnIn:'lyra',description:'Magistra Lyra leert je de magie van Lindehaard beheersen. Raak het zwevende oefenkristal drie keer met een Vonkbol.',offerText:'Volg de blauwe runen naar de westelijke oefenplek. Richt met de muis op het kristal en gebruik klik of 1. Deze les geeft genoeg ervaring voor niveau 2 en Magische barrière.',progressText:'Het kristal staat ten noordwesten van Lyra. Elke echte Vonkboltreffer telt één keer. Keer na drie treffers terug.',completedText:'Je beheerst de Vonkbol. Tijd voor een beschermende spreuk.',objectives:[{id:'hits',type:'INTERACT',objectId:'mage-target',count:3,label:'Oefenkristal geraakt met Vonkbol'}],rewards:{xp:60,gold:10}},
 {id:'mage_ward',title:'De beschermende kring',classId:'mage',minLevel:2,requires:['mage_spark'],giver:'lyra',turnIn:'lyra',description:'Vang een oefenpuls op met je Magische barrière. Ga in de blauwe kring naast Lyra staan en gebruik 3.',offerText:'Magische barrière kost 20 mana, duurt 5 seconden en herstelt na 14 seconden. De kring geeft elke 3 seconden een veilige lichtpuls. Zonder barrière verlies je hier geen levens. Deze les helpt je naar niveau 3 en Blink.',progressText:'Ga in de blauw-paarse kring ten westen van Lyra staan. Druk op 3 en vang een puls op voordat de barrière verdwijnt.',completedText:'Een sterke verdediging. Nu leer je afstand overbruggen.',objectives:[{id:'blocked',type:'INTERACT',objectId:'mage-barrier',count:1,label:'Oefenpuls opgevangen met barrière'}],rewards:{xp:120,gold:15}},
 {id:'mage_step',title:'Een stap tussen sterren',classId:'mage',minLevel:3,requires:['mage_ward'],giver:'lyra',turnIn:'lyra',description:'Gebruik Blink om van de gouden startrune naar de blauwe eindrune te gaan.',offerText:'Ga op de gouden rune ten westen van Lyra staan, richt je personage naar de blauwe rune en druk op 4. Met een ingedrukte looptoets bepaalt die toets je richting. Blink kost 18 mana en herstelt na 8 seconden.',progressText:'Begin op de gouden rune en Blink naar de blauwe rune. Lopen naar de eindrune telt niet. Je kunt niet door bomen, muren of gesloten deuren heen.',completedText:'Je eerste magieopleiding is voltooid. Neem je nieuwe spreuken mee op avontuur!',objectives:[{id:'blinked',type:'INTERACT',objectId:'mage-blink',count:1,label:'Van startrune naar eindrune geblinkt'}],rewards:{xp:90,gold:25}}
);
quests.push({id:'mage_trial',title:'De Gebroken Vonk',classId:'mage',minLevel:3,requires:['mage_step'],giver:'lyra',turnIn:'lyra',description:'Een losgeslagen magische echo verstoort de open plek ten westen van Lindehaard. Versla Vael en keer terug naar Lyra om zijn staf te herstellen.',offerText:'Volg vanaf het oefenkristal de westelijke bosrand naar het noorden. Vael wacht in de runenkring. Zijn sterrenlans heeft een vastgelegde richting: gebruik barrière of stap opzij. Verlaat de oranje breukkring met Blink of door te lopen. Val aan wanneer hij herstelt. Na de overwinning ontvang je de Sterrenweversstaf: +12 spreukschade.',progressText:'Vael staat in de runenkring ten noorden van het oefenkristal. Gebruik 3 tegen de sterrenlans en 4 om uit een breukkring te komen. Loop ver van de kring weg om het gevecht opnieuw te beginnen.',completedText:'De echo is tot rust gekomen. Je Sterrenweversstaf is hersteld en kan via I worden uitgerust. Je opleiding is nu in de praktijk bewezen.',objectives:[{id:'vael',type:'KILL',enemyType:'arcane_echo',count:1,label:'Vael verslagen'}],rewards:{xp:180,gold:40,staff:'starweaver'}});
const trainingClearings=[...Object.values(mageTraining),{x:arcaneTrial.x,z:arcaneTrial.z,clearance:7.5}];
const typeOf=e=>e.enemyType||(e.rootBoss?'root_mother':e.boss?'thorn_guardian':e.area==='roots'?(e.spirit?'spore_guard':'root_guard'):e.spirit?'forest_spirit':'shadow_wolf');
const spawns=[...root.RPG.enemies,...root.RPG.dungeonEnemies.map(e=>({...e,area:'roots'})),...extraEnemies].map(e=>{
 const type=typeOf(e),definition=enemyDefinitions[type];return {id:e.id,enemyType:type,area:e.area||'valley',x:e.x,z:e.z,respawnSeconds:e.respawnSeconds??definition.respawnSeconds,corpseSeconds:e.corpseSeconds??definition.corpseSeconds,stats:{...definition,...(e.hp?{hp:e.hp}:{}),...(e.damage?{damage:e.damage}:{}),...(e.name?{name:e.name}:{})}};
});
root.EmberAdventureData={items,respawnProfiles,enemyDefinitions,lootTables,spawns,extraSpawns,extraEnemies,npcs,quests,mageTraining,trainingClearings,arcaneTrial,typeOf};
})(typeof window==='undefined'?globalThis:window);
