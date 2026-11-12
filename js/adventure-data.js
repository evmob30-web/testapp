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
const lootTables={
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
const extraEnemies=extraSpawns.map(spawn=>{const type=enemyDefinitions[spawn.enemyType];return {...spawn,name:type.name,hp:type.hp,damage:type.damage,speed:type.speed};});
const npcs={rowan:{id:'rowan',name:'Jager Rowan',speaker:'Rowan · Jager',x:12,z:9,area:'valley'}};
const quests=[{
 id:'wolf_plague',title:'De wolvenplaag',description:'Grijze wolven naderen Lindehaard vanuit het oosten. Verzamel tien wolventanden voor Jager Rowan, zodat hij hun herkomst kan onderzoeken.',
 giver:'rowan',turnIn:'rowan',offerText:'De grijze wolven lopen al in het oostelijke woud. Open hun lichaam na een gevecht; een wolventand heeft 60% kans op een drop.',progressText:'Verzamel de buit van verslagen grijze wolven. Nog geen tand gevonden? Ze keren na 120–180 seconden speeltijd terug.',completedText:'Dank je, reiziger. De tanden helpen ons het woud te begrijpen. De grijze wolven blijven rondlopen; hun gewone buit kun je blijven verzamelen.',objectives:[{id:'teeth',type:'QUEST_LOOT',enemyType:'gray_wolf',itemId:'wolf_tooth',count:10,chance:60,label:'Wolventanden'}],rewards:{xp:250,gold:50}
}];
const typeOf=e=>e.enemyType||(e.rootBoss?'root_mother':e.boss?'thorn_guardian':e.area==='roots'?(e.spirit?'spore_guard':'root_guard'):e.spirit?'forest_spirit':'shadow_wolf');
const spawns=[...root.RPG.enemies,...root.RPG.dungeonEnemies.map(e=>({...e,area:'roots'})),...extraEnemies].map(e=>{
 const type=typeOf(e),definition=enemyDefinitions[type];return {id:e.id,enemyType:type,area:e.area||'valley',x:e.x,z:e.z,respawnSeconds:e.respawnSeconds??definition.respawnSeconds,corpseSeconds:e.corpseSeconds??definition.corpseSeconds,stats:{...definition,...(e.hp?{hp:e.hp}:{}),...(e.damage?{damage:e.damage}:{}),...(e.name?{name:e.name}:{})}};
});
root.EmberAdventureData={items,respawnProfiles,enemyDefinitions,lootTables,spawns,extraSpawns,extraEnemies,npcs,quests,typeOf};
})(typeof window==='undefined'?globalThis:window);
