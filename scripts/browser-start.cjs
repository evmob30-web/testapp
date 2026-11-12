const { chromium } = require('playwright');
const questLootBrowser=require('./browser-quest-loot.cjs');
const terrainBrowser=require('./browser-terrain.cjs');
const wolfBrowser=require('./browser-wolves.cjs');
const markerBrowser=require('./browser-markers.cjs');
const mageTrainingBrowser=require('./browser-mage-training.cjs');
async function currentState(page){return page.evaluate(()=>{const roster=JSON.parse(localStorage.getItem('emberwild-characters-v1'));return roster?.slots[roster.active]?.state;});}
async function continueHero(page,index=0){await page.locator('#play').click();await page.locator('#character-play-'+index).click();}
async function observeForest(page){await page.addInitScript(()=>{
 Object.defineProperty(window,'EmberThornGuardian',{configurable:true,set(api){
  const create=api.create;api.create=(...args)=>window.__thornBoss=create(...args);
  Object.defineProperty(window,'EmberThornGuardian',{value:api,writable:true,configurable:true});
 }});
 Object.defineProperty(window,'EmberVillageActors',{configurable:true,set(api){
  const create=api.create;api.create=(...args)=>{const actor=create(...args);(window.__villageActors??={})[args[1]]=actor;return actor;};
  Object.defineProperty(window,'EmberVillageActors',{value:api,writable:true,configurable:true});
 }});
 Object.defineProperty(window,'EmberForestActors',{configurable:true,set(api){
  const makeElin=api.createElin,makeWolf=api.createWolf;
  api.createElin=(...args)=>window.__elinActor=makeElin(...args);
  api.createWolf=(...args)=>{const wolf=makeWolf(...args);(window.__wolves??=[]).push(wolf);return wolf;};
  Object.defineProperty(window,'EmberForestActors',{value:api,writable:true,configurable:true});
 }});
});}
async function lootBody(page,worldName,id){const p=await page.evaluate(({worldName,id})=>{window.__questWorld=window[worldName];const e=__questWorld.enemies.find(e=>e.id===id);return {x:e.mesh.position.x,z:e.mesh.position.z,d:Math.hypot(__questWorld.player.group.position.x-e.mesh.position.x,__questWorld.player.group.position.z-e.mesh.position.z)};},{worldName,id});if(p.d>2.8)await questLootBrowser.walkTo(page,p.x,p.z,2.3);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!document.getElementById('corpse-loot').hidden,null,{timeout:60000});await page.locator('#loot-all').click();await page.waitForFunction(()=>document.getElementById('corpse-loot').hidden);}
async function checkGrove(browser,errors){
 for(const kind of ['spirit','mother']){console.log('Browser: grove '+kind);
  const page=await browser.newPage({viewport:{width:960,height:640}});
  page.on('pageerror',e=>errors.push(kind+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push(kind+': '+m.text());});
  await page.addInitScript(kind=>{
   if(!sessionStorage.getItem('grove-fixture')){
    sessionStorage.setItem('grove-fixture','1');const state={version:1,classId:'guardian',level:8,hp:240,quest:5,equipped:'thorn',kills:['w1','w2','w3','w4','boss','g1'],crystals:['c1','c2','c3'],bowUnlocked:true,bowQuest:1,bowPractice:['t1'],potions:3,x:21,z:-35};
    state.encounters={version:1,worldId:'grove-fixture',clock:0,seed:1,spawns:Object.fromEntries(['w1','w2','w3','w4','d1','d2','d3'].map(id=>[id,{status:'dead',deadAt:0,generation:1,hp:0,corpse:null}]))};
    if(kind==='mother')Object.assign(state,{area:'roots',dungeon:1,caveKey:true,gateOpen:true,x:100,z:-52,kills:[...state.kills,'d1','d2','d3']});
    localStorage.setItem('emberwild-characters-v1',JSON.stringify({version:1,active:0,slots:[{name:'Woudproef',state},null,null]}));
   }
   Object.defineProperty(window,'EmberGroveCreatures',{configurable:true,set(api){
    for(const name of ['createSpirit','createRootMother']){const create=api[name];api[name]=(...args)=>{const actor=create(...args),attack=actor.attack;actor.attack=kind=>{(window.__groveAttacks??=[]).push({actor:actor.group.name,kind});attack(kind);};(window.__groveActors??=[]).push(actor);return actor;};}
    Object.defineProperty(window,'EmberGroveCreatures',{value:api,writable:true,configurable:true});
   }});
   Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){const create=api.createWorld;api.createWorld=(...args)=>window.__groveWorld=create(...args);Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
  },kind);
  await page.goto(process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/',{waitUntil:'load'});await continueHero(page);
  await page.evaluate(kind=>{window.__groveEnemy=__groveWorld.enemies.find(e=>e.id===(kind==='mother'?'rootboss':'s1'));window.__groveActor=__groveEnemy.visual;},kind);
  const art=await page.evaluate(()=>({bones:__groveActor.skeleton.bones.length,draws:__groveActor.meshes.length,weighted:__groveActor.meshes.every(m=>m.isSkinnedMesh),retired:__groveWorld.enemies.some(e=>e.id==='g1'||e.shield)}));
  if(!art.weighted||art.draws>6||art.bones<48||art.retired)errors.push(kind+' art/retired enemy incorrect: '+JSON.stringify(art));
  await page.waitForFunction(()=>__groveActor.motion.warning>.4,null,{timeout:60000});await page.keyboard.press('Escape');
  const frozen=await page.evaluate(()=>({arm:__groveActor.joints.arm_r.quaternion.toArray(),warning:__groveActor.motion.warning,windup:__groveEnemy.windup,telegraph:__groveEnemy.telegraph}));await page.waitForTimeout(200);
  if(await page.evaluate(p=>__groveActor.motion.warning!==p.warning||__groveEnemy.windup!==p.windup||__groveEnemy.telegraph!==p.telegraph||__groveActor.joints.arm_r.quaternion.toArray().some((n,i)=>n!==p.arm[i]),frozen))errors.push(kind+' warning moved during pause');
  await page.screenshot({path:'/tmp/emberwild-grove-'+kind+'-warning.png'});await page.keyboard.press('Escape');
  await page.waitForFunction(()=>__groveActor.motion.strike>.5,null,{timeout:60000});
  if(kind==='mother'){
   await page.waitForFunction(()=>__groveActor.motion.state==='slam-windup'&&__groveActor.motion.warning>.5,null,{timeout:60000});
   await page.waitForFunction(()=>__groveActor.motion.state==='impact'&&__groveActor.motion.strike>.5,null,{timeout:60000});
  }
  await page.keyboard.press('Escape');await page.screenshot({path:'/tmp/emberwild-grove-'+kind+'-impact.png'});await page.keyboard.press('Escape');
  const attacks=await page.evaluate(()=>__groveAttacks||[]);if(!attacks.some(a=>a.kind===(kind==='mother'?'salvo':'orb'))||kind==='mother'&&!attacks.some(a=>a.kind==='slam'))errors.push(kind+' attack/release animation mismatch: '+JSON.stringify(attacks));
  await page.locator('#magic').click();
  if(kind==='mother')for(let i=0;i<14;i++){
   if(!await page.evaluate(()=>__groveEnemy.mesh.visible))break;
   await page.waitForFunction(()=>document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:60000});await page.locator('#attack').click();
   await page.waitForFunction(()=>!__groveEnemy.mesh.visible||document.getElementById('attack-cd').textContent!=='Klaar',null,{timeout:60000});
   await page.waitForFunction(()=>!__groveEnemy.mesh.visible||document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:60000});
  }
  await page.waitForFunction(()=>!__groveEnemy.mesh.visible,null,{timeout:60000});await page.keyboard.press('Escape');
  const defeat=await page.evaluate(()=>({dying:__groveActor.dying,separate:__groveActor.model.parent!==__groveEnemy.mesh,killed:JSON.parse(localStorage.getItem('emberwild-characters-v1')).slots[0].state.kills.includes(__groveEnemy.id),phase:__groveActor.motion.defeat}));
  if(!defeat.dying||!defeat.separate||!defeat.killed)errors.push(kind+' logical/cosmetic defeat incorrect: '+JSON.stringify(defeat));await page.waitForTimeout(200);if(await page.evaluate(phase=>__groveActor.motion.defeat!==phase,defeat.phase))errors.push(kind+' defeat moved during pause');
  await page.screenshot({path:'/tmp/emberwild-grove-'+kind+'-defeat.png'});await page.keyboard.press('Escape');await lootBody(page,'__groveWorld',kind==='mother'?'rootboss':'s1');await page.waitForFunction(()=>!__groveActor.dying,null,{timeout:60000});
  if(await page.evaluate(()=>!!__groveWorld.scene.getObjectByName('RootMotherDefeat')||!!__groveWorld.scene.getObjectByName('ForestSpiritDefeat')))errors.push(kind+' defeat visual was not cleaned up');
  const saved=await currentState(page);if(!saved.kills.includes('g1')||saved.bowPractice.length!==1)errors.push(kind+' old progress was lost');
  await page.reload({waitUntil:'load'});await continueHero(page);
  console.log('Browser: grove '+kind+' fight/loot/reload completed');if(await page.evaluate(id=>__groveWorld.enemies.find(e=>e.id===id).mesh.visible,kind==='mother'?'rootboss':'s1'))errors.push(kind+' returned before its saved respawn time');await page.close();
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 if(process.argv.includes('--quest-loot-only')){const errors=[];await questLootBrowser.run(browser,errors);console.log('Quest/loot',JSON.stringify({errors}));await browser.close();if(errors.length)process.exit(1);return;}
 if(process.argv.includes('--grove-only')){const errors=[];await checkGrove(browser,errors);console.log('Grove creatures',JSON.stringify({errors}));await browser.close();if(errors.length)process.exit(1);return;}
 const page=await browser.newPage({viewport:{width:960,height:700}});
 // Observe native sources: opening/starting stays silent and attacks retain effects.
 await page.addInitScript(()=>{
  const Audio=window.AudioContext||window.webkitAudioContext;window.__audioProbe={available:!!Audio,buffers:0,notes:0};if(!Audio)return;
  const makeBuffer=Audio.prototype.createBufferSource,makeOscillator=Audio.prototype.createOscillator;
  Audio.prototype.createBufferSource=function(...args){window.__audioProbe.buffers++;return makeBuffer.apply(this,args);};
  Audio.prototype.createOscillator=function(...args){const node=makeOscillator.apply(this,args),start=node.start;node.start=function(...args){window.__audioProbe.notes++;return start.apply(this,args);};return node;};
 });
 // Observe the real production controllers without adding game-only test APIs.
 await page.addInitScript(()=>{
  Object.defineProperty(window,'EmberModelAssets',{configurable:true,set(api){
   const attach=api.attach;api.attach=(...args)=>{const controller=attach(...args);if(!args[1].group.userData.npc)(window.__modelInstances??=[]).push({controller,rig:args[1]});return controller;};
   Object.defineProperty(window,'EmberModelAssets',{value:api,writable:true,configurable:true});
  }});
 });
 const errors=[];await observeForest(page);
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.waitForTimeout(2000);
 await page.locator('#play').click();
 await page.locator('#character-create-0').click();
 await page.waitForFunction(()=>document.getElementById('creator-canvas').dataset.characterModel==='ready',null,{timeout:30000});
 for(const skin of ['classic','flame_guardian'])for(const style of ['short','long','braid']){
  await page.locator('#appearance-skin').selectOption(skin);await page.locator('#appearance-hairStyle').selectOption(style);
  const count=await page.evaluate(selected=>{
   const rig=window.__modelInstances[1].rig,group=rig.joints.head.getObjectByName('appearance_hair_'+selected);
   return group?.visible&&group.children.filter(m=>m.isMesh).length;
  },style);
  if(count!==1)errors.push('Hairstyle is not visible/batched: '+skin+'/'+style);
 }
 await page.locator('#class-ranger').click();await page.locator('#appearance-skin').selectOption('classic');
 const rangerColor=await page.evaluate(()=>window.__modelInstances[1].controller.models.getObjectByName('classic_fabric').material.color.getHexString());
 if(rangerColor!=='637e64')errors.push('Ranger preview uses the wrong class colors');
 await page.waitForFunction(()=>{
  const rig=window.__modelInstances[1].rig,bow=rig.joints.hand_l.getObjectByName('WoodlandBow'),held=bow?.getObjectByName('NockedArrow');
  if(!bow?.visible||!held||held.visible||rig.blade.visible)return false;
  const wrist=rig.group.worldToLocal(rig.joints.hand_r.getWorldPosition(new THREE.Vector3())),shoulder=rig.group.worldToLocal(rig.joints.upper_arm_r.getWorldPosition(new THREE.Vector3()));
  return wrist.y<shoulder.y-1&&Math.abs(wrist.x-shoulder.x)<.08&&rig.palmWorld('l').distanceTo(bow.getWorldPosition(new THREE.Vector3()))<.001;
 },null,{timeout:25000});

 await page.locator('#class-guardian').click();
 await page.locator('#appearance-skin').selectOption('flame_guardian');
 await page.locator('#appearance-hairStyle').selectOption('braid');
 await page.locator('#appearance-hairColor').selectOption('blonde');
 await page.locator('#appearance-skinTone').selectOption('tan');
 await page.locator('#appearance-eyeColor').selectOption('blue');
 await page.locator('#creator-right').click();
 await page.waitForTimeout(180);
 if(!await page.locator('#creator-canvas').isVisible())errors.push('Character preview not visible');
 await page.waitForFunction(()=>window.__modelInstances?.length>=2&&window.__modelInstances.every(i=>i.controller.status!=='loading'),null,{timeout:30000});
 const assetState=await page.evaluate(()=>window.__modelInstances.map(({controller,rig})=>{
  let weighted=0;controller.models.traverse(m=>{if(m.isSkinnedMesh)weighted++;});
  return {status:controller.status,weighted,skin:rig.group.userData.characterAsset.skin,weaponAttached:rig.blade.parent===rig.joints.weapon_r};
 }));
 if(assetState.some(s=>s.status!=='ready'||s.weighted<10||!s.weaponAttached))errors.push('GLB assets did not load/bind: '+JSON.stringify(assetState));
 if(await page.locator('#creator-canvas').getAttribute('data-character-model')!=='ready')errors.push('Creator GLB is not ready');
 await page.screenshot({path:'/tmp/emberwild-model-preview.png'});
 await page.locator('#class-start').click();
 const initialAudio=await page.evaluate(()=>window.__audioProbe);if(initialAudio.buffers||initialAudio.notes)errors.push('Game startup produced background audio: '+JSON.stringify(initialAudio));
 const importedLook=await page.evaluate(()=>{
  const {controller}=window.__modelInstances[0];const skin=controller.models.getObjectByName('flame_skin');return skin?.material.color.getHexString();
 });
 if(importedLook!=='b77a56')errors.push('Saved skin tone did not reach the imported game model');
 await page.locator('#world').hover();await page.mouse.wheel(0,-400);await page.waitForTimeout(300);
 await page.screenshot({path:'/tmp/emberwild-model-play.png'});
 await page.waitForFunction(()=>window.__elinActor?.assets?.status==='ready');
 const forest=await page.evaluate(()=>({wolves:window.__wolves?.length,quiver:!!window.__elinActor.group.getObjectByName('ElinQuiver'),hidden:window.__wolves.every(w=>!w.group.visible)}));
 if(forest.wolves!==10||!forest.quiver||forest.hidden)errors.push('Forest actors/permanent visibility incorrect: '+JSON.stringify(forest));
 // Execute all three melee stages in the actual WebGL game, without needing an enemy.
 for(let step=1;step<=3;step++){
   if(step>1)await page.waitForFunction(()=>document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:25000});
   await page.locator('#attack').click();
   await page.waitForFunction(expected=>document.getElementById('combo-indicator').textContent.includes('COMBO '+expected+' / 3'),step,{timeout:25000});
   const shown=await page.locator('#combo-indicator').textContent();
   if(!shown.includes('COMBO '+step+' / 3'))errors.push('Combo stage '+step+' was not visible: '+shown);
 }
 await page.waitForFunction(()=>!window.__audioProbe.available||window.__audioProbe.notes>=3,null,{timeout:25000});
 const actionAudio=await page.evaluate(()=>window.__audioProbe);if(actionAudio.buffers||actionAudio.available&&actionAudio.notes<3)errors.push('Action audio/background silence incorrect: '+JSON.stringify(actionAudio));
 const selected=await currentState(page);
 if(selected?.skinId!=='flame_guardian'||selected?.appearance?.hairStyle!=='braid'||selected?.appearance?.hairColor!=='blonde')errors.push('Creator selection did not save');
 await page.locator('#inventory-button').click();
 await page.locator('#customize').click();
 await page.locator('#appearance-eyeColor').selectOption('violet');
 await page.locator('#class-start').click();
 const edited=await currentState(page);
 if(edited?.appearance?.eyeColor!=='violet'||edited?.quest!==selected?.quest)errors.push('Appearance editor did not preserve progress');
 // Armor should equip from owned inventory, affect the save, and survive reload.
 await page.locator('#inventory-button').click();
 if(!await page.locator('#armor-slots').isVisible())errors.push('Armor slots missing in inventory');
 const initialArmor=await currentState(page);
 if(!initialArmor?.armorOwned?.includes('wanderer_chest'))errors.push('Starter chest armor is missing');
 await page.locator('#armor-bag button').filter({hasText:'Leren borstpantser'}).click();
 let equipped=await currentState(page);
 if(equipped?.armorEquipped?.chest!=='wanderer_chest')errors.push('Armor slot not equipped');
 // A shop purchase spends saved gold once, then survives a save round-trip.
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('armor-funded')==='1')return;
  const raw=localStorage.getItem('emberwild-characters-v1');
  if(raw){const roster=JSON.parse(raw),save=roster.slots[roster.active].state;save.gold=200;localStorage.setItem('emberwild-characters-v1',JSON.stringify(roster));sessionStorage.setItem('armor-funded','1');}
 });
 await page.reload({waitUntil:'load'});
 await continueHero(page);
 await page.locator('#inventory-button').click();
 const fundedGold=(await currentState(page)).gold;
 if(fundedGold!==200)errors.push('Funding in browser setup failed: '+fundedGold);
 await page.locator('#armor-shop button').filter({hasText:'Vonkenhelm'}).click();
 equipped=await currentState(page);
 if(!equipped?.armorOwned?.includes('ember_helm')||equipped?.gold!==105)errors.push('Armor shop purchase did not save correctly');
 await page.locator('#armor-bag button').filter({hasText:'Vonkenhelm'}).click();
 await page.reload({waitUntil:'load'});
 await page.waitForTimeout(300);
 const restored=await currentState(page);
 if(restored?.appearance?.eyeColor!=='violet')errors.push('Creator appearance not restored after reload');
 if(restored?.armorEquipped?.head!=='ember_helm'||restored?.armorEquipped?.chest!=='wanderer_chest')errors.push('Equipped armor not restored');
 // Inject a legitimate loot drop into the isolated test save before browser loading.
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('loot-seeded'))return;
  const raw=localStorage.getItem('emberwild-characters-v1');if(!raw)return;
  const roster=JSON.parse(raw),save=roster.slots[roster.active].state;save.lootSequence=77;
  save.lootDrops=[{uid:77,base:'ember_gloves',rarity:'epic',affix:'marksman',x:0,z:22,area:'valley'}];
  localStorage.setItem('emberwild-characters-v1',JSON.stringify(roster));
  sessionStorage.setItem('loot-seeded','1');
 });
 await page.reload({waitUntil:'load'});
 await continueHero(page);
 await page.waitForTimeout(350);
 await page.keyboard.press('e');
 await page.waitForTimeout(180);
 const picked=await currentState(page);
 if(picked?.lootBag?.length!==1||picked?.lootDrops?.length!==0)errors.push('3D ground loot was not collected with E');
 await page.locator('#inventory-button').click();
 if(!await page.locator('#loot-bag .loot-entry').isVisible())errors.push('Loot item comparison missing in inventory');
 await page.locator('#loot-bag .loot-entry button').first().click();
 const worn=await currentState(page);
 if(worn?.lootEquipped?.hands!==77)errors.push('Loot item did not equip');
 await page.reload({waitUntil:'load'});
 const wornAfterReload=await currentState(page);
 if(wornAfterReload?.lootEquipped?.hands!==77)errors.push('Loot item equipment not restored');


 const legacyFixture=await currentState(page);
 const fatal=await page.locator('#fatal').evaluate(n=>({hidden:n.hidden,text:n.textContent}));
 const overlay=await page.locator('#overlay').evaluate(n=>n.hidden);
 await page.screenshot({path:'/tmp/emberwild-start.png'});await page.close();console.log('Browser: base flow',JSON.stringify({errors}));

 // A separate context exercises the new class without replacing the legacy test save.
 const magePage=await browser.newPage({viewport:{width:960,height:700}});const mageErrors=[];
 magePage.on('pageerror',e=>mageErrors.push(e.message));magePage.on('console',m=>{if(m.type()==='error')mageErrors.push(m.text());});
 await magePage.addInitScript(()=>{
  Object.defineProperty(window,'EmberMage',{configurable:true,set(api){
   const attach=api.attach;api.attach=(...args)=>{const view=attach(...args);(window.__mageViews??=[]).push(view);return view;};
   const bolt=api.bolt;api.bolt=(...args)=>{window.__mageBolts=(window.__mageBolts||0)+1;return window.__lastMageBolt=bolt(...args);};
   Object.defineProperty(window,'EmberMage',{value:api,writable:true,configurable:true});
  }});
 });
 await magePage.goto(process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/',{waitUntil:'load'});
 await magePage.locator('#play').click();await magePage.locator('#character-create-0').click();await magePage.locator('#class-mage').click();
 await magePage.waitForFunction(()=>document.getElementById('creator-canvas').dataset.characterModel==='ready'&&window.__mageViews?.[1]?.staff.visible,null,{timeout:30000});
 await magePage.screenshot({path:'/tmp/emberwild-mage-creator.png'});
 await magePage.locator('#class-start').click();
 if(!await magePage.locator('#mana-wrap').isVisible())mageErrors.push('Mage mana bar missing');
 if(await magePage.locator('#attack-name').textContent()!=='Vonkbol'||await magePage.locator('#skill-name').textContent()!=='Vrieskring')mageErrors.push('Mage abilities missing');
 const mageStart=await currentState(magePage);
 if(mageStart?.classId!=='mage'||mageStart?.weapon!=='staff'||mageStart?.hp!==75)mageErrors.push('Mage start/save incorrect');
 const crystalOrigin=await magePage.evaluate(()=>{document.getElementById('attack').click();return window.__lastMageBolt.position.distanceTo(window.__mageViews[0].muzzle());});
 if(crystalOrigin>.0001)mageErrors.push('Spell did not begin at the staff crystal: '+crystalOrigin);
 await magePage.waitForFunction(()=>window.__mageBolts===1);
 const afterBolt=Number((await magePage.locator('#mana-label').textContent()).split(' / ')[0]);
 if(afterBolt>=100)mageErrors.push('Basic spell did not spend mana');
 await magePage.locator('#magic').click();
 const afterFrost=Number((await magePage.locator('#mana-label').textContent()).split(' / ')[0]);
 if(afterFrost>=afterBolt)mageErrors.push('Frost did not spend mana');
 await magePage.screenshot({path:'/tmp/emberwild-mage-play.png'});
 await magePage.keyboard.press('Escape');const pausedMana=await magePage.locator('#mana-label').textContent();
 await magePage.waitForTimeout(400);if(await magePage.locator('#mana-label').textContent()!==pausedMana)mageErrors.push('Mana changed while paused');
 await magePage.keyboard.press('Escape');await magePage.keyboard.press('f');
 if(await magePage.evaluate(()=>window.__mageViews[0].staff.visible))mageErrors.push('Staff did not hide after weapon switch');
 await magePage.keyboard.press('f');if(!await magePage.evaluate(()=>window.__mageViews[0].staff.visible))mageErrors.push('Staff did not return');
 await magePage.locator('#inventory-button').click();await magePage.locator('#customize').click();
 await magePage.locator('#appearance-hairColor').selectOption('silver');await magePage.locator('#class-start').click();
 const mageEdited=await currentState(magePage);
 if(mageEdited?.classId!=='mage'||mageEdited?.appearance?.hairColor!=='silver'||mageEdited?.quest!==mageStart?.quest)mageErrors.push('Mage appearance editing lost class/progress');
 await magePage.reload({waitUntil:'load'});await continueHero(magePage);
 await magePage.waitForFunction(()=>window.__mageViews?.[0]?.staff.visible);
 const mageRestored=await currentState(magePage);
 if(mageRestored?.classId!=='mage'||mageRestored?.weapon!=='staff'||mageRestored?.appearance?.hairColor!=='silver')mageErrors.push('Mage restore failed');
 // Three real characters, cancelling a draft, switching, reloading and deletion.
 await magePage.keyboard.press('Escape');await magePage.locator('#new').click();
 const mageBefore=await magePage.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('emberwild-characters-v1')).slots[0]));
 await magePage.locator('#character-create-1').click();await magePage.locator('#class-ranger').click();await magePage.locator('#class-back').click();
 if(await magePage.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-characters-v1')).slots[1])!==null)mageErrors.push('Cancelling creator saved a draft');
 await magePage.locator('#character-create-1').click();await magePage.locator('#class-ranger').click();await magePage.locator('#character-name').fill('Liora');await magePage.locator('#appearance-hairColor').selectOption('blonde');await magePage.locator('#class-start').click();
 if((await currentState(magePage)).classId!=='ranger')mageErrors.push('Second hero did not start as ranger');
 await magePage.keyboard.press('Escape');await magePage.locator('#new').click();
 if(await magePage.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('emberwild-characters-v1')).slots[0]))!==mageBefore)mageErrors.push('Creating ranger changed the mage');
 await magePage.locator('#character-create-2').click();await magePage.locator('#character-name').fill('Bramor');await magePage.locator('#class-start').click();
 await magePage.keyboard.press('Escape');await magePage.locator('#new').click();
 if(await magePage.locator('[id^="character-create-"]').count()!==0)mageErrors.push('Full roster offers a fourth hero');
 await magePage.screenshot({path:'/tmp/emberwild-characters.png'});
 await magePage.locator('#character-delete-0').click();await magePage.keyboard.press('Escape');
 if(await magePage.locator('#character-delete-confirm').isVisible())mageErrors.push('Escape did not cancel deletion');
 await magePage.locator('#character-play-0').click();
 if((await currentState(magePage)).appearance.hairColor!=='silver'||!await magePage.evaluate(()=>window.__mageViews[0].staff.visible))mageErrors.push('Mage appearance/staff was not restored after switching');
 await magePage.reload({waitUntil:'load'});await magePage.locator('#play').click();
 if(await magePage.locator('[id^="character-play-"]').count()!==3)mageErrors.push('Three heroes did not survive reload');
 await magePage.locator('#character-delete-2').click();await magePage.locator('#character-delete-accept').click();
 if(await magePage.locator('#character-create-2').count()!==1)mageErrors.push('Confirmed deletion did not free the third slot');
 await magePage.locator('#character-play-1').click();
 if(!((await magePage.locator('#player-name').textContent()).includes('Liora')))mageErrors.push('Selected hero name missing from HUD');
 errors.push(...mageErrors.map(e=>'Mage/roster: '+e));await magePage.close();console.log('Browser: mage/roster flow',JSON.stringify({errors}));
 // Real-browser migration keeps the original save bytes and never reimports a deleted hero.
 const migrated=await browser.newPage({viewport:{width:960,height:700}});await observeForest(migrated);legacyFixture.x=-3;legacyFixture.z=18;migrated.on('pageerror',e=>errors.push('Migration: '+e.message));
 await migrated.addInitScript(raw=>{localStorage.setItem('emberwild-save-v1',raw);},JSON.stringify(legacyFixture));
 await migrated.goto(process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/',{waitUntil:'load'});
 const migration=await migrated.evaluate(()=>({roster:JSON.parse(localStorage.getItem('emberwild-characters-v1')),backup:localStorage.getItem('emberwild-save-v1')}));
 if(migration.roster.slots[0]?.state.lootEquipped.hands!==77||migration.backup!==JSON.stringify(legacyFixture))errors.push('Legacy loot/backup did not migrate');
 await continueHero(migrated);await migrated.keyboard.press('e');
 await migrated.waitForFunction(()=>window.__elinActor?.talkBlend>.4&&window.__elinActor.assets.status==='ready',null,{timeout:30000});
 const dialogueHealth=await migrated.locator('#health-label').textContent();await migrated.waitForTimeout(350);if(await migrated.locator('#health-label').textContent()!==dialogueHealth)errors.push('Gameplay continued during Elin dialogue');
 await migrated.screenshot({path:'/tmp/emberwild-elin-dialogue.png'});await migrated.locator('#dialog-action').click();
 if(await migrated.evaluate(()=>window.__elinActor.talking||window.__wolves.some(w=>!w.group.visible)))errors.push('Elin dialogue/accepted wolves did not synchronize');
 // Review each real NPC conversation, including Tovin before and after his rescue.
 await migrated.addInitScript(()=>{
  const fixture=sessionStorage.getItem('npc-camera-fixture');if(!fixture)return;
  const roster=JSON.parse(localStorage.getItem('emberwild-characters-v1'));Object.assign(roster.slots[0].state,JSON.parse(fixture));localStorage.setItem('emberwild-characters-v1',JSON.stringify(roster));
 });
 for(const fixture of [{id:'bram',x:8,z:19,sideQuest:0},{id:'mira',x:6,z:25,sideQuest:0},{id:'tovin',x:-23,z:-32,sideQuest:1},{id:'tovin',x:9,z:27,sideQuest:2}]){
  await migrated.evaluate(f=>sessionStorage.setItem('npc-camera-fixture',JSON.stringify(f)),{x:fixture.x,z:fixture.z,sideQuest:fixture.sideQuest});
  await migrated.reload({waitUntil:'load'});await continueHero(migrated);await migrated.keyboard.press('e');
  await migrated.waitForFunction(id=>window.__villageActors?.[id]?.assets.status==='ready'&&window.__villageActors[id].talkBlend>.8,fixture.id,{timeout:30000});
  if(await migrated.locator('#health-label').isVisible())errors.push('HUD obscures NPC conversation: '+fixture.id);
  if(await migrated.locator('#dialog').getAttribute('data-speaker')!==fixture.id)errors.push('Wrong NPC dialogue camera: '+fixture.id);
  const health=await migrated.locator('#health-label').textContent();await migrated.waitForTimeout(250);if(await migrated.locator('#health-label').textContent()!==health)errors.push('Gameplay continued during '+fixture.id+' dialogue');
  await migrated.screenshot({path:'/tmp/emberwild-'+fixture.id+'-'+fixture.sideQuest+'-dialogue.png'});await migrated.locator('#dialog-close').click();if(!await migrated.locator('#health-label').isVisible())errors.push('HUD did not return after '+fixture.id+' dialogue');
  if(await migrated.evaluate(()=>Object.values(window.__villageActors).some(a=>a.talking)))errors.push('NPC did not leave conversation pose: '+fixture.id);
  await migrated.keyboard.press('Escape');
 }
 await migrated.evaluate(()=>sessionStorage.removeItem('npc-camera-fixture'));
 await migrated.addInitScript(()=>{if(sessionStorage.getItem('wolf-fixture'))return;const raw=localStorage.getItem('emberwild-characters-v1');if(!raw)return;const roster=JSON.parse(raw),state=roster.slots[0].state;state.x=-13;state.z=-4;state.quest=1;localStorage.setItem('emberwild-characters-v1',JSON.stringify(roster));sessionStorage.setItem('wolf-fixture','1');});
 await migrated.reload({waitUntil:'load'});await continueHero(migrated);
 await migrated.waitForFunction(()=>window.__wolves?.[0]?.motion.warning>.4,null,{timeout:30000});await migrated.screenshot({path:'/tmp/emberwild-wolf-warning.png'});
 await migrated.waitForFunction(()=>window.__wolves?.[0]?.motion.strike>.2,null,{timeout:30000});
 await migrated.keyboard.press('Escape');await migrated.locator('#new').click();await migrated.locator('#character-delete-0').click();await migrated.locator('#character-delete-accept').click();await migrated.reload({waitUntil:'load'});await migrated.locator('#play').click();
 if(await migrated.locator('[id^="character-play-"]').count()!==0||await migrated.locator('[id^="character-create-"]').count()!==3)errors.push('Deleted legacy hero was imported again');
 await migrated.close();console.log('Browser: migration/NPC flow',JSON.stringify({errors}));

 // A real boss fight exercises the weighted model, timed slam and cosmetic defeat.
 const bossPage=await browser.newPage({viewport:{width:960,height:640}});await observeForest(bossPage);bossPage.on('pageerror',e=>errors.push('Doornwachter: '+e.message));
 await bossPage.addInitScript(()=>{
  if(!sessionStorage.getItem('thorn-fixture')){sessionStorage.setItem('thorn-fixture','1');localStorage.setItem('emberwild-characters-v1',JSON.stringify({version:1,active:0,slots:[{name:'Eindbaasproef',state:{version:1,classId:'guardian',level:4,hp:154,quest:3,x:0,z:-50,crystals:['c1','c2','c3'],kills:['w1','w2','w3'],potions:3}},null,null]}));}
  Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){const create=api.createWorld;api.createWorld=(...args)=>window.__thornWorld=create(...args);Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
 });
 await bossPage.goto(process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/',{waitUntil:'load'});await continueHero(bossPage);
 await bossPage.waitForFunction(()=>window.__thornBoss?.motion.warning>.65,null,{timeout:60000});await bossPage.keyboard.press('Escape');
 const frozenBoss=await bossPage.evaluate(()=>({windup:__thornWorld.enemies.find(e=>e.id==='boss').windup,arm:__thornBoss.joints.arm_r.quaternion.toArray()}));await bossPage.waitForTimeout(200);
 if(await bossPage.evaluate(before=>__thornWorld.enemies.find(e=>e.id==='boss').windup!==before.windup||__thornBoss.joints.arm_r.quaternion.toArray().some((n,i)=>n!==before.arm[i]),frozenBoss))errors.push('Boss warning moved while paused');
 await bossPage.screenshot({path:'/tmp/emberwild-thorn-warning.png'});await bossPage.keyboard.press('Escape');
 await bossPage.waitForFunction(()=>__thornBoss.motion.strike>.6,null,{timeout:60000});await bossPage.screenshot({path:'/tmp/emberwild-thorn-impact.png'});
 const bossArt=await bossPage.evaluate(()=>({weighted:__thornBoss.meshes.every(m=>m.isSkinnedMesh),draws:__thornBoss.meshes.length,bark:__thornWorld.effects.some(e=>e.kind==='bark'&&e.sharedGeometry)}));if(!bossArt.weighted||bossArt.draws>8||!bossArt.bark)errors.push('Boss art/impact missing: '+JSON.stringify(bossArt));
 await bossPage.locator('#magic').click();
 for(let i=0;i<8;i++){
  if(!await bossPage.evaluate(()=>__thornWorld.enemies.find(e=>e.id==='boss').mesh.visible))break;
  await bossPage.waitForFunction(()=>document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:25000});await bossPage.locator('#attack').click();
  await bossPage.waitForFunction(()=>!__thornWorld.enemies.find(e=>e.id==='boss').mesh.visible||document.getElementById('attack-cd').textContent!=='Klaar',null,{timeout:25000});
  await bossPage.waitForFunction(()=>!__thornWorld.enemies.find(e=>e.id==='boss').mesh.visible||document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:25000});
 }
 await bossPage.waitForFunction(()=>!__thornWorld.enemies.find(e=>e.id==='boss').mesh.visible,null,{timeout:15000});await bossPage.keyboard.press('Escape');
 const defeat=await bossPage.evaluate(()=>({dying:__thornBoss.dying,separate:__thornBoss.model.parent!==__thornBoss.group,killed:JSON.parse(localStorage.getItem('emberwild-characters-v1')).slots[0].state.kills.includes('boss'),phase:__thornBoss.motion.defeat}));if(!defeat.dying||!defeat.separate||!defeat.killed)errors.push('Boss defeat/reward did not separate visuals from gameplay: '+JSON.stringify(defeat));await bossPage.waitForTimeout(200);if(await bossPage.evaluate(p=>__thornBoss.motion.defeat!==p,defeat.phase))errors.push('Cosmetic defeat moved during pause');
 await bossPage.screenshot({path:'/tmp/emberwild-thorn-defeat.png'});await bossPage.keyboard.press('Escape');await lootBody(bossPage,'__thornWorld','boss');await bossPage.waitForFunction(()=>!__thornBoss.dying,null,{timeout:60000});
 if(await bossPage.evaluate(()=>!!__thornWorld.scene.getObjectByName('DoornwachterDefeat')))errors.push('Boss corpse was not cleaned up');
 await bossPage.reload({waitUntil:'load'});await continueHero(bossPage);if(await bossPage.evaluate(()=>__thornWorld.enemies.find(e=>e.id==='boss').mesh.visible||__thornBoss.dying))errors.push('Boss returned before its saved respawn time');await bossPage.close();console.log('Browser: Doornwachter flow',JSON.stringify({errors}));

 await checkGrove(browser,errors);
 await questLootBrowser.run(browser,errors);
 await terrainBrowser.run(browser,errors);
 await wolfBrowser.run(browser,errors);
 await markerBrowser.run(browser,errors);
 await mageTrainingBrowser.run(browser,errors);
 console.log('HTTP game flow completed',JSON.stringify({errors}));
 if(!process.argv.includes('--http-only')){
 // The embedded assets must also work when index.html is opened directly, without HTTP.
 const offline=await browser.newPage({viewport:{width:960,height:700}});const offlineErrors=[];
 offline.on('pageerror',e=>offlineErrors.push(e.message));
 offline.on('console',m=>{if(m.type()==='error')offlineErrors.push(m.text());});
 await offline.goto(require('node:url').pathToFileURL(require('node:path').resolve('index.html')).href,{waitUntil:'load'});
 await offline.waitForFunction(()=>document.getElementById('play').onclick!==null);
 await offline.locator('#play').click();await offline.locator('#character-create-0').click();
 await offline.waitForFunction(()=>document.getElementById('creator-canvas').dataset.characterModel==='ready',null,{timeout:30000});
 await offline.locator('#class-start').click();
 if(!await offline.locator('#overlay').isHidden())errors.push('Direct-file game did not start');
 errors.push(...offlineErrors.map(e=>'Direct file: '+e));await offline.close();
 }

 console.log(JSON.stringify({fatal,overlay,errors},null,2));
 await browser.close();
 if(!fatal.hidden||errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
