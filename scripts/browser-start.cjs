const { chromium } = require('playwright');
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
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.waitForTimeout(2000);
 await page.locator('#play').click();
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
 const selected=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(selected?.skinId!=='flame_guardian'||selected?.appearance?.hairStyle!=='braid'||selected?.appearance?.hairColor!=='blonde')errors.push('Creator selection did not save');
 await page.locator('#inventory-button').click();
 await page.locator('#customize').click();
 await page.locator('#appearance-eyeColor').selectOption('violet');
 await page.locator('#class-start').click();
 const edited=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(edited?.appearance?.eyeColor!=='violet'||edited?.quest!==selected?.quest)errors.push('Appearance editor did not preserve progress');
 // Armor should equip from owned inventory, affect the save, and survive reload.
 await page.locator('#inventory-button').click();
 if(!await page.locator('#armor-slots').isVisible())errors.push('Armor slots missing in inventory');
 const initialArmor=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(!initialArmor?.armorOwned?.includes('wanderer_chest'))errors.push('Starter chest armor is missing');
 await page.locator('#armor-bag button').filter({hasText:'Leren borstpantser'}).click();
 let equipped=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(equipped?.armorEquipped?.chest!=='wanderer_chest')errors.push('Armor slot not equipped');
 // A shop purchase spends saved gold once, then survives a save round-trip.
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('armor-funded')==='1')return;
  const raw=localStorage.getItem('emberwild-save-v1');
  if(raw){const save=JSON.parse(raw);save.gold=200;localStorage.setItem('emberwild-save-v1',JSON.stringify(save));sessionStorage.setItem('armor-funded','1');}
 });
 await page.reload({waitUntil:'load'});
 await page.locator('#play').click();
 await page.locator('#inventory-button').click();
 const fundedGold=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')).gold);
 if(fundedGold!==200)errors.push('Funding in browser setup failed: '+fundedGold);
 await page.locator('#armor-shop button').filter({hasText:'Vonkenhelm'}).click();
 equipped=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(!equipped?.armorOwned?.includes('ember_helm')||equipped?.gold!==105)errors.push('Armor shop purchase did not save correctly');
 await page.locator('#armor-bag button').filter({hasText:'Vonkenhelm'}).click();
 await page.reload({waitUntil:'load'});
 await page.waitForTimeout(300);
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(restored?.appearance?.eyeColor!=='violet')errors.push('Creator appearance not restored after reload');
 if(restored?.armorEquipped?.head!=='ember_helm'||restored?.armorEquipped?.chest!=='wanderer_chest')errors.push('Equipped armor not restored');
 // Inject a legitimate loot drop into the isolated test save before browser loading.
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('loot-seeded'))return;
  const raw=localStorage.getItem('emberwild-save-v1');if(!raw)return;
  const save=JSON.parse(raw);save.lootSequence=77;
  save.lootDrops=[{uid:77,base:'ember_gloves',rarity:'epic',affix:'marksman',x:0,z:22,area:'valley'}];
  localStorage.setItem('emberwild-save-v1',JSON.stringify(save));
  sessionStorage.setItem('loot-seeded','1');
 });
 await page.reload({waitUntil:'load'});
 await page.locator('#play').click();
 await page.waitForTimeout(350);
 await page.keyboard.press('e');
 await page.waitForTimeout(180);
 const picked=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(picked?.lootBag?.length!==1||picked?.lootDrops?.length!==0)errors.push('3D ground loot was not collected with E');
 await page.locator('#inventory-button').click();
 if(!await page.locator('#loot-bag .loot-entry').isVisible())errors.push('Loot item comparison missing in inventory');
 await page.locator('#loot-bag .loot-entry button').first().click();
 const worn=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(worn?.lootEquipped?.hands!==77)errors.push('Loot item did not equip');
 await page.reload({waitUntil:'load'});
 const wornAfterReload=await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-save-v1')));
 if(wornAfterReload?.lootEquipped?.hands!==77)errors.push('Loot item equipment not restored');


 console.log('HTTP game flow completed',JSON.stringify({errors}));
 if(!process.argv.includes('--http-only')){
 // The embedded assets must also work when index.html is opened directly, without HTTP.
 const offline=await browser.newPage();const offlineErrors=[];
 offline.on('pageerror',e=>offlineErrors.push(e.message));
 offline.on('console',m=>{if(m.type()==='error')offlineErrors.push(m.text());});
 await offline.goto(require('node:url').pathToFileURL(require('node:path').resolve('index.html')).href,{waitUntil:'load'});
 await offline.waitForFunction(()=>document.getElementById('play').onclick!==null);
 await offline.locator('#play').click();
 await offline.waitForFunction(()=>document.getElementById('creator-canvas').dataset.characterModel==='ready',null,{timeout:30000});
 await offline.locator('#class-start').click();
 if(!await offline.locator('#overlay').isHidden())errors.push('Direct-file game did not start');
 errors.push(...offlineErrors.map(e=>'Direct file: '+e));await offline.close();
 }

 const fatal=await page.locator('#fatal').evaluate(n=>({hidden:n.hidden,text:n.textContent}));
 const overlay=await page.locator('#overlay').evaluate(n=>n.hidden);
 await page.screenshot({path:'/tmp/emberwild-start.png'});
 console.log(JSON.stringify({fatal,overlay,errors},null,2));
 await browser.close();
 if(!fatal.hidden||errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
