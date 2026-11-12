/* Renderer adapter for one target registry: NPCs, enemies, corpses and quest objects. */
(function(root){
'use strict';
function visible(node){if(!node)return false;for(let p=node;p;p=p.parent){if(p.visible===false)return false;if(p.isScene)return true;}return false;}
function create(world,{state,adventure,exploration,archery,dungeon,training}){
 const T=root.THREE,registry=new Map(),tmp=new T.Vector3(),ray=new T.Raycaster(),mouse=new T.Vector2();let selected=null;
 const ring=new T.Mesh(new T.RingGeometry(.82,.92,40),new T.MeshBasicMaterial({color:'#ffe1a0',side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));ring.name='InteractionSelection';ring.rotation.x=-Math.PI/2;ring.visible=false;world.scene.add(ring);
 const position=node=>{node.getWorldPosition(tmp);return {x:tmp.x,z:tmp.z};};
 function register(key,definition){registry.set(key,{key,...definition});}
 function snapshot(key){
  const entry=registry.get(typeof key==='string'?key:key?.key);if(!entry||!entry.valid())return null;const p=entry.position();if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return null;
  return {...entry,position:p,identity:entry.identity?entry.identity():entry.key};
 }
 const names={elin:'Elin',bram:'Bram',mira:'Mira',tovin:'Tovin'},nearIds={elin:'ranger',bram:'merchant'};
 for(const [id,entry]of world.npcActors){const actor=entry.actor.group;register('npc:'+id,{kind:'npc',label:root.EmberAdventureData.npcs[id]?.name||names[id]||id,interactionId:nearIds[id]||id,range:id==='elin'||id==='bram'?2.8:2.6,position:()=>position(actor),valid:()=>state().area==='valley'&&visible(actor),objects:()=>[actor,...(visible(entry.questMarker)?[entry.questMarker]:[])]});}
 for(const enemy of world.enemies){
  register('enemy:'+enemy.id,{kind:'enemy',label:root.RPG.enemyName(enemy),enemy,range:3,position:()=>position(enemy.mesh),valid:()=>visible(enemy.mesh)&&root.RPG.enemyVisible(state(),enemy)&&enemy.hp>0,identity:()=>enemy.instanceId,objects:()=>[enemy.mesh]});
  register('corpse:'+enemy.id,{kind:'corpse',label:root.RPG.enemyName(enemy)+' · buit',interactionId:'corpse:'+enemy.id,range:2.95,spawnId:enemy.id,position:()=>{const s=state().encounters.spawns[enemy.id];return {x:s.x,z:s.z};},valid:()=>{const s=state(),spawn=root.EmberEncounters.spawnDefinitions.get(enemy.id);const body=adventure.bodies.get(enemy.id);return spawn?.area===s.area&&!!body&&(visible(body.model)||visible(body.marker))&&root.EmberEncounters.available(s.encounters,s.journal,enemy.id).length>0;},identity:()=>state().encounters.spawns[enemy.id]?.instanceId,objects:()=>{const body=adventure.bodies.get(enemy.id);return body?[body.model,body.marker]:[];}});
 }
 function object(id,label,node,range,valid,point){register('object:'+id,{kind:'object',label,interactionId:id,range,position:()=>point?typeof point==='function'?point():point:position(node),valid:()=>valid()&&visible(node),objects:()=>[node]});}
 object('chest','Verborgen kist',world.chest,2.5,()=>state().area==='valley'&&!state().chest);
 for(const c of world.crystals)object(c.id,'Lichtkristal',c.mesh,2.5,()=>state().area==='valley'&&root.RPG.questVisibility(state()).crystals&&!state().crystals.includes(c.id));
 for(const h of exploration.herbNodes)object(h.id,'Goudbloesem',h.mesh,1.9,()=>state().area==='valley'&&root.RPG.questVisibility(state()).herbalist&&!state().gathered.includes(h.id));
 object('shrine','Fluisterheiligdom',exploration.shrine,2.8,()=>state().area==='valley'&&root.RPG.questVisibility(state()).shrine,root.RPG.places.shrine);
 object('entrance','Wortelgrotten',dungeon.entrance,2.7,()=>state().area==='valley'&&root.RPG.questVisibility(state()).dungeon,{x:0,z:-58.5});
 object('exit','Uitgang',dungeon.exit,2.5,()=>state().area==='roots',{x:100,z:16.5});
 object('root-key','Wortelsleutel',dungeon.key,2.4,()=>state().area==='roots'&&!state().caveKey,{x:110,z:-21});
 object('root-gate','Worteldeur',dungeon.gate,2.8,()=>state().area==='roots'&&!state().gateOpen,{x:100,z:-35});
 object('root-altar','Hartamulet',dungeon.amulet,2.7,()=>state().area==='roots'&&!state().amulet&&state().kills.includes('rootboss'),{x:100,z:-63});
 for(const p of archery.targets)register('practice:'+p.id,{kind:'practice',label:'Boogdoel',practice:p,range:24,position:()=>position(p.mesh),valid:()=>state().area==='valley'&&root.RPG.questVisibility(state()).bow&&visible(p.mesh),objects:()=>[p.mesh]});
 register('practice:mage',{kind:'practice',label:'Oefenkristal',range:21,position:()=>position(training.target),valid:()=>state().area==='valley'&&state().classId==='mage'&&root.EmberMageTraining.active(state(),'mage_spark')&&visible(training.target),objects:()=>[training.target]});
 function drops(){const s=state(),keys=new Set();for(const drop of s.lootDrops){const key='object:loot:'+drop.uid;keys.add(key);if(registry.has(key))continue;register(key,{kind:'object',label:'Gevonden uitrusting',interactionId:'loot:'+drop.uid,range:2.3,dynamic:true,position:()=>{const d=state().lootDrops.find(d=>d.uid===drop.uid);return d?{x:d.x,z:d.z}:{x:NaN,z:NaN};},valid:()=>state().lootDrops.some(d=>d.uid===drop.uid&&d.area===state().area)&&visible(world.lootMeshes.get(drop.uid)?.group),objects:()=>[world.lootMeshes.get(drop.uid)?.group].filter(Boolean)});}for(const [key,entry]of registry)if(entry.dynamic&&!keys.has(key))registry.delete(key);}
 function list(){drops();return [...registry.keys()].map(snapshot).filter(Boolean);}
 function resolve(request){const entry=snapshot(request);if(request?.identity!==undefined&&entry?.identity!==request.identity)return null;return entry;}
 function forInteraction(id){return list().find(t=>t.interactionId===id)||null;}
 function select(request){const entry=resolve(request);selected=entry?{key:entry.key,identity:entry.identity}:null;update();return entry;}
 function update(){const entry=selected&&resolve(selected);if(!entry){selected=null;ring.visible=false;return null;}ring.visible=true;ring.position.set(entry.position.x,.105,entry.position.z);ring.scale.setScalar(entry.enemy?.boss?1.6:entry.kind==='corpse'?1.15:1);ring.material.color.set(entry.kind==='enemy'?'#ffbd8d':'#c5e9ff');return entry;}
 function pick(x,y,camera,rect){
  mouse.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);camera.updateMatrixWorld();ray.setFromCamera(mouse,camera);let chosen=null,best=Infinity;const blocking=ray.intersectObjects(world.cameraMeshes,false).find(hit=>visible(hit.object))?.distance??Infinity;
  for(const target of list())for(const node of target.objects()){if(!visible(node))continue;node.updateWorldMatrix(true,true);for(const hit of ray.intersectObject(node,true)){if(!visible(hit.object)||hit.distance>=best||hit.distance>blocking+.1&&!(target.kind==='npc'&&hit.object.isSprite&&hit.object.material.depthTest===false))continue;chosen=target;best=hit.distance;}}
  return chosen;
 }
 return {register,list,resolve,forInteraction,select,update,pick,ring,get selected(){return selected&&resolve(selected);}};
}
root.EmberInteractionTargets={create,visible};
})(typeof window==='undefined'?globalThis:window);
