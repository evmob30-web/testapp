const { chromium } = require('playwright');
async function currentState(page){return page.evaluate(()=>{const roster=JSON.parse(localStorage.getItem('emberwild-characters-v1'));return roster?.slots[roster.active]?.state;});}
async function continueHero(page,index=0){await page.locator('#play').click();await page.locator('#character-play-'+index).click();}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage();
 // Observe the real production controllers without adding game-only test APIs.
 await page.addInitScript(()=>{
  Object.defineProperty(window,'EmberModelAssets',{configurable:true,set(api){
   const attach=api.attach;api.attach=(...args)=>{const controller=attach(...args);(window.__modelInstances??=[]).push({controller,rig:args[1]});return controller;};
   Object.defineProperty(window,'EmberModelAssets',{value:api,writable:true,configurable:true});
  }});
 });
 const errors=[];
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
  if(!bow?.visible||!held||rig.blade.visible)return false;
  const nock=held.localToWorld(new THREE.Vector3(0,0,-.45));return rig.palmWorld('r').distanceTo(nock)<.001;
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
 const importedLook=await page.evaluate(()=>{
  const {controller}=window.__modelInstances[0];const skin=controller.models.getObjectByName('flame_skin');return skin?.material.color.getHexString();
 });
 if(importedLook!=='b77a56')errors.push('Saved skin tone did not reach the imported game model');
 await page.locator('#world').hover();await page.mouse.wheel(0,-400);await page.waitForTimeout(300);
 await page.screenshot({path:'/tmp/emberwild-model-play.png'});
 // Execute all three melee stages in the actual WebGL game, without needing an enemy.
 for(let step=1;step<=3;step++){
   if(step>1)await page.waitForFunction(()=>document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:25000});
   await page.locator('#attack').click();
   await page.waitForFunction(expected=>document.getElementById('combo-indicator').textContent.includes('COMBO '+expected+' / 3'),step,{timeout:25000});
   const shown=await page.locator('#combo-indicator').textContent();
   if(!shown.includes('COMBO '+step+' / 3'))errors.push('Combo stage '+step+' was not visible: '+shown);
 }
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
 await page.screenshot({path:'/tmp/emberwild-start.png'});await page.close();

 // A separate context exercises the new class without replacing the legacy test save.
 const magePage=await browser.newPage();const mageErrors=[];
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
 errors.push(...mageErrors.map(e=>'Mage/roster: '+e));await magePage.close();
 // Real-browser migration keeps the original save bytes and never reimports a deleted hero.
 const migrated=await browser.newPage();migrated.on('pageerror',e=>errors.push('Migration: '+e.message));
 await migrated.addInitScript(raw=>{localStorage.setItem('emberwild-save-v1',raw);},JSON.stringify(legacyFixture));
 await migrated.goto(process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/',{waitUntil:'load'});
 const migration=await migrated.evaluate(()=>({roster:JSON.parse(localStorage.getItem('emberwild-characters-v1')),backup:localStorage.getItem('emberwild-save-v1')}));
 if(migration.roster.slots[0]?.state.lootEquipped.hands!==77||migration.backup!==JSON.stringify(legacyFixture))errors.push('Legacy loot/backup did not migrate');
 await migrated.locator('#play').click();await migrated.locator('#character-delete-0').click();await migrated.locator('#character-delete-accept').click();await migrated.reload({waitUntil:'load'});await migrated.locator('#play').click();
 if(await migrated.locator('[id^="character-play-"]').count()!==0||await migrated.locator('[id^="character-create-"]').count()!==3)errors.push('Deleted legacy hero was imported again');
 await migrated.close();

 console.log('HTTP game flow completed',JSON.stringify({errors}));
 if(!process.argv.includes('--http-only')){
 // The embedded assets must also work when index.html is opened directly, without HTTP.
 const offline=await browser.newPage();const offlineErrors=[];
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
