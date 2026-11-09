const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.waitForTimeout(2000);
 await page.locator('#play').click();
 await page.locator('#appearance-skin').selectOption('flame_guardian');
 await page.locator('#appearance-hairStyle').selectOption('braid');
 await page.locator('#appearance-hairColor').selectOption('blonde');
 await page.locator('#appearance-skinTone').selectOption('tan');
 await page.locator('#appearance-eyeColor').selectOption('blue');
 await page.locator('#creator-right').click();
 await page.waitForTimeout(180);
 if(!await page.locator('#creator-canvas').isVisible())errors.push('Character preview not visible');
 await page.locator('#class-start').click();
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


 const fatal=await page.locator('#fatal').evaluate(n=>({hidden:n.hidden,text:n.textContent}));
 const overlay=await page.locator('#overlay').evaluate(n=>n.hidden);
 await page.screenshot({path:'/tmp/emberwild-start.png'});
 console.log(JSON.stringify({fatal,overlay,errors},null,2));
 await browser.close();
 if(!fatal.hidden||errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
