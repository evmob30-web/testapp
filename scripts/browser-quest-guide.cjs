/* Real mouse/keyboard and native Chromium touch through the production guide and game. */
const {chromium,devices}=require('playwright'),driver=require('./browser-mobile.cjs');
const url=()=>process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/';
const fixture=()=>({version:1,classId:'guardian',level:8,hp:240,quest:2,x:-21,z:-18.2,crystals:['c2','c3'],questGuide:{version:1,trackedId:'story',enabled:true},journal:{version:1,quests:{wolf_plague:{status:'ACTIVE',objectives:{teeth:{count:0,seen:[]}}}}},encounters:{version:1,worldId:'guide-browser',clock:0,seed:94,spawns:{}}});
async function geometry(page){return page.evaluate(()=>{
 const root=document.getElementById('quest-compass'),r=root.getBoundingClientRect(),rect=e=>e.getBoundingClientRect(),overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
 const conflicts=['joystick','skill-bar','touch-utility','enemy','header','.vitals','.quest'].filter(id=>{const node=id==='header'?document.querySelector('header'):id[0]==='.'?document.querySelector(id):document.getElementById(id);return node&&!node.hidden&&getComputedStyle(node).display!=='none'&&overlap(r,rect(node));});
 const marker=__mobileWorld.scene.getObjectByName('QuestDestination');return {rect:r.toJSON(),w:innerWidth,h:innerHeight,conflicts,visible:!root.hidden,marker:marker.visible,position:marker.position.toArray(),target:root.dataset.targetKey};
});}
async function run(browser,errors){
 const profiles=[['pc',{viewport:{width:1280,height:800},hasTouch:false}],['phone',{...devices['Pixel 7'],viewport:{width:393,height:852},screen:{width:393,height:852},deviceScaleFactor:1.5}],['tablet',{...devices['iPad (gen 7) landscape'],viewport:{width:1024,height:768},screen:{width:1024,height:768},deviceScaleFactor:1.5}]];
 for(const [name,profile]of profiles){
  const context=await browser.newContext(profile),page=await context.newPage();page.on('pageerror',e=>errors.push('Quest guide '+name+': '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('Quest guide '+name+': '+m.text());});
  try{
   await driver.observe(page,fixture());await page.goto(url(),{waitUntil:'load'});await page.waitForFunction(()=>window.__mobileNavigation);await driver.advance(page,1);const touch=name!=='pc',input=touch?await driver.fingers(page):{element:async id=>{await page.locator('#'+id).click();await driver.advance(page,3);}};
   await input.element('play');await input.element('character-play-0');await driver.advance(page,20);await page.evaluate(()=>__mobileWorld.modelAssets.ready);
   let data=await geometry(page);if(!data.visible||!data.marker||data.target!=='object:c1'||Math.abs(data.position[0]+21)>.001||Math.abs(data.position[2]+20)>.001)throw Error('Wrong crystal destination '+JSON.stringify(data));if(data.conflicts.length||data.rect.x<0||data.rect.right>data.w||data.rect.bottom>data.h)throw Error('Compass overlaps existing UI: '+name+' '+JSON.stringify(data));
   await page.screenshot({path:'/tmp/emberwild-guide-'+name+'.png'});
   const oldAngle=await page.locator('#quest-guide-arrow').evaluate(e=>e.style.transform),size=await page.evaluate(()=>({w:innerWidth,h:innerHeight})),cx=size.w*.65,cy=size.h*.48;
   if(touch){await input.down(80,cx,cy);await input.move(80,cx+60,cy);await input.up(80);}else{await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx+60,cy);await page.mouse.up({button:'right'});}await driver.advance(page,20);
   if(await page.locator('#quest-guide-arrow').evaluate(e=>e.style.transform)===oldAngle)throw Error('Compass ignored an actual camera swipe');data=await geometry(page);if(Math.abs(data.position[0]+21)>.001||Math.abs(data.position[2]+20)>.001)throw Error('Camera motion displaced the world destination');

   await input.element('quest-compass');if(await page.locator('#quest-log').isHidden())throw Error('Compass did not open quest log');await input.element('follow-quest-wolf_plague');if(await page.locator('#follow-quest-wolf_plague').getAttribute('aria-pressed')!=='true')throw Error('Follow button lost selection feedback');await input.element('quest-log-close');await driver.advance(page,5);if(!await page.evaluate(()=>document.getElementById('quest-compass').dataset.targetKey.startsWith('enemy:gray-')))throw Error('Quest choice did not select a current wolf');
   const before=await page.evaluate(()=>({x:__mobileState.x,z:__mobileState.z}));await input.element('quest-compass');await input.element('follow-story');await input.element('quest-log-close');await driver.advance(page,5);if(!await page.evaluate(p=>Math.hypot(__mobileState.x-p.x,__mobileState.z-p.z)<.001,before))throw Error('Following a quest unexpectedly moved the player');
   if(touch){await input.element('touch-interact');await driver.settle(page);}else{await page.keyboard.press('KeyE');await driver.advance(page,5);}
   if(!await page.evaluate(()=>__mobileState.crystals.length===3&&document.getElementById('quest-compass').dataset.targetKey==='npc:elin'))throw Error('Real collection did not immediately change destination to Elin');
   await input.element('quest-compass');await input.element('quest-guide-enabled');await input.element('quest-log-close');await driver.advance(page,4);if(!await page.locator('#quest-compass').isHidden()||await page.evaluate(()=>__mobileWorld.scene.getObjectByName('QuestDestination').visible))throw Error('Hide setting left a guide or marker');
   await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.__mobileNavigation);await driver.advance(page,1);await input.element('play');await input.element('character-play-0');await driver.advance(page,20);if(!await page.locator('#quest-compass').isHidden()||await page.evaluate(()=>__mobileState.questGuide.trackedId)!=='story')throw Error('Saved per-character guide setting was lost');
   await input.element('quest-button');await input.element('quest-guide-enabled');await input.element('quest-log-close');await driver.advance(page,4);if(await page.locator('#quest-compass').isHidden())throw Error('Guide could not be enabled again');
   if(name==='phone'){
    for(const size of [{width:915,height:412},{width:667,height:320}]){await page.setViewportSize(size);await driver.advance(page,10);data=await geometry(page);if(data.conflicts.length||data.rect.bottom>data.h||data.rect.x<0||data.rect.right>data.w)throw Error('Landscape guide overlaps controls '+JSON.stringify(data));await page.screenshot({path:'/tmp/emberwild-guide-phone-'+size.height+'.png'});}
   }
   console.log('Quest guide '+name+': active selection, actual collection/return destination, marker layout, hide/show and saved preferences passed');
  }catch(error){await page.screenshot({path:'/tmp/emberwild-guide-failure.png'}).catch(()=>{});throw error;}finally{await context.close();}
 }
}
module.exports={run};
if(require.main===module)(async()=>{const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),errors=[];try{await run(browser,errors);console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
