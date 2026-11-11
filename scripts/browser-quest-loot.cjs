const {chromium}=require('playwright');
const url=()=>process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/';
async function saved(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('emberwild-characters-v1')).slots[0].state);}
async function continueHero(page){await page.locator('#play').click();await page.locator('#character-play-0').click();await page.waitForFunction(()=>window.__questClockState);}
// Follow a collision-aware route using the real WASD handlers, without teleporting.
async function walkTo(page,x,z,range=2.2){
 await page.evaluate(({x,z,range})=>{
  const world=window.__questWorld,start=world.player.group.position,cell=.8,point=(a,b)=>({x:a*cell,z:b*cell}),key=(a,b)=>a+','+b;
  const clear=(a,b)=>{const length=Math.hypot(a.x-b.x,a.z-b.z);for(let t=0;t<=length;t+=.3){const u=length?t/length:0,px=a.x+(b.x-a.x)*u,pz=a.z+(b.z-a.z)*u;if(Math.abs(px)>31||pz< -59||pz>30||world.colliders.some(c=>Math.hypot(c.x-px,c.z-pz)<c.r+.7))return false;}return true;};
  let route=[{x,z}];if(!clear(start,{x,z})){
   const sx=Math.round(start.x/cell),sz=Math.round(start.z/cell),queue=[{a:sx,b:sz,g:0}],parents=new Map(),scores=new Map([[key(sx,sz),0]]),directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];let end=null;
   for(let limit=0;queue.length&&limit<12000;limit++){
    queue.sort((a,b)=>a.g+Math.hypot(a.a*cell-x,a.b*cell-z)-b.g-Math.hypot(b.a*cell-x,b.b*cell-z));const n=queue.shift(),p=point(n.a,n.b);if(Math.hypot(p.x-x,p.z-z)<range*.8){end=key(n.a,n.b);break;}
    for(const [da,db]of directions){const a=n.a+da,b=n.b+db,next=point(a,b),cost=n.g+Math.hypot(da,db)*cell,k=key(a,b);if(!clear(p,next)||cost>=(scores.get(k)??Infinity))continue;scores.set(k,cost);parents.set(k,key(n.a,n.b));queue.push({a,b,g:cost});}
   }
   if(!end)throw Error('No walking route');route=[];while(end){const [a,b]=end.split(',').map(Number);route.unshift(point(a,b));end=parents.get(end);}route.shift();
  }
  let index=0,active=new Set(),frames=0;window.__questWalk={done:false};
  const setKeys=next=>{for(const code of active)if(!next.has(code))window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));for(const code of next)if(!active.has(code))window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));active=next;};
  function step(){
   const p=world.player.group.position;if(Math.hypot(p.x-x,p.z-z)<range){setKeys(new Set());__questWalk.done=true;return;}
   while(index<route.length-1&&Math.hypot(p.x-route[index].x,p.z-route[index].z)<.65)index++;
   const goal=route[index]||{x,z},dx=goal.x-p.x,dz=goal.z-p.z,next=new Set(['ShiftLeft']);if(Math.abs(dx)>.20)next.add(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>.20)next.add(dz>0?'KeyS':'KeyW');setKeys(next);frames++;if(frames>2500){setKeys(new Set());__questWalk.error='Walking did not reach target';return;}requestAnimationFrame(step);
  }requestAnimationFrame(step);
 },{x,z,range});
 await page.waitForFunction(()=>window.__questWalk?.done||window.__questWalk?.error,null,{timeout:60000});const error=await page.evaluate(()=>__questWalk.error);if(error)throw Error(error);
}
async function clickCorpse(page,spawnId){
 const point=await page.evaluate(id=>{
  const body=__questView.bodies.get(id);if(!body)throw Error('Missing corpse');body.model.updateWorldMatrix(true,true);const center=new THREE.Box3().setFromObject(body.model).getCenter(new THREE.Vector3()).project(__questCamera),cx=(center.x+1)*innerWidth/2,cy=(1-center.y)*innerHeight/2,ray=new THREE.Raycaster();
  for(let radius=0;radius<=140;radius+=14)for(const [ox,oy]of [[0,0],[-1,0],[1,0],[0,1],[0,-1],[-1,1],[1,1],[-1,-1],[1,-1]]){const x=cx+ox*radius,y=cy+oy*radius;if(document.elementFromPoint(x,y)?.id!=='world')continue;ray.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,1-y/innerHeight*2),__questCamera);if(__questView.pick(ray)===id)return {x,y};}throw Error('No exposed corpse pixel: '+JSON.stringify({cx,cy,element:document.elementFromPoint(cx,cy)?.id}));
 },spawnId);
 await page.mouse.click(point.x,point.y);await page.waitForFunction(()=>!document.getElementById('corpse-loot').hidden,null,{timeout:15000});
}
async function run(browser,errors){
 const page=await browser.newPage({viewport:{width:960,height:700}});page.on('pageerror',e=>errors.push('Quest/loot: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('Quest/loot: '+m.text());});
 await page.addInitScript(()=>{
  // Test content verifies that a second data-defined quest needs no gameplay changes.
  Object.defineProperty(window,'EmberAdventureData',{configurable:true,set(data){data.quests.push({id:'parallel_hunt',title:'Een tweede wolvenjacht',description:'Een onafhankelijke testopdracht voor dezelfde grijze wolven.',giver:'rowan',turnIn:'rowan',objectives:[{id:'kills',type:'KILL',enemyType:'gray_wolf',count:16,label:'Grijze wolven'}],rewards:{xp:10,gold:5}});Object.defineProperty(window,'EmberAdventureData',{value:data,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberEncounters',{configurable:true,set(api){const tick=api.tick;api.tick=(state,dt)=>{window.__questClockState=state;return tick(state,dt);};Object.defineProperty(window,'EmberEncounters',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){const create=api.createWorld;api.createWorld=(...args)=>{const world=create(...args);world.scene.onBeforeRender=(renderer,scene,camera)=>window.__questCamera=camera;return window.__questWorld=world;};Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberAdventureWorld',{configurable:true,set(api){const create=api.create;api.create=(...args)=>window.__questView=create(...args);Object.defineProperty(window,'EmberAdventureWorld',{value:api,writable:true,configurable:true});}});
  if(!sessionStorage.getItem('quest-fixture')){sessionStorage.setItem('quest-fixture','1');localStorage.setItem('emberwild-characters-v1',JSON.stringify({version:1,active:0,slots:[{name:'Woudproef',state:{version:1,classId:'guardian',level:8,hp:240,x:12,z:11,quest:0,potions:3,encounters:{version:1,worldId:'browser-wolf',clock:0,seed:94,spawns:{}}}},null,null]}));}
 });
 try{
  await page.goto(url(),{waitUntil:'load'});await continueHero(page);console.log('Quest/loot: permanent enemy and no-quest loot');
  const live=await page.evaluate(()=>__questWorld.enemies.filter(e=>e.enemyType==='gray_wolf').map(e=>({id:e.id,visible:e.mesh.visible,hp:e.hp,instance:e.instanceId})));if(live.length!==6||live.some(e=>!e.visible||e.hp!==55))throw Error('Gray wolf spawn definitions not applied: '+JSON.stringify(live));
  await page.locator('#magic').click();await page.waitForFunction(()=>__questClockState.spawns['gray-east-1'].status==='dead',null,{timeout:60000});
  const original=await page.evaluate(()=>structuredClone(__questClockState.spawns['gray-east-1']));if(original.corpse.loot.some(i=>i.kind==='quest'))throw Error('Quest item appeared without active quest');
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>!document.getElementById('dialog').hidden);if(await page.evaluate(()=>__questWorld.effects.some(e=>e.mesh.visible)))throw Error('Transient combat effects obscure Rowan during conversation');await page.screenshot({path:'/tmp/emberwild-quest-rowan.png'});await page.locator('#dialog-action').click();
  if((await saved(page)).journal.quests.wolf_plague.status!=='ACTIVE')throw Error('Rowan acceptance failed');
  await page.keyboard.press('KeyE');await page.waitForFunction(()=>document.getElementById('dialog-title').textContent==='Een tweede wolvenjacht');await page.locator('#dialog-action').click();
  if(await page.evaluate(()=>__questView.indicator.userData.questStatus!=='active'||!__questView.indicator.children[1].visible))throw Error('Accepted quests keep a yellow exclamation mark');if((await saved(page)).journal.quests.parallel_hunt.objectives.kills.count!==0)throw Error('Pre-acceptance death counted for kill quest');
  await walkTo(page,original.x,original.z,2.2);await clickCorpse(page,'gray-east-1');if(await page.locator('[data-kind="quest"]').count())throw Error('Accepting a quest rerolled an existing corpse');
  const gold=original.corpse.loot.find(i=>i.kind==='currency'),before=(await saved(page)).gold;await page.locator('[data-kind="currency"]').evaluate(button=>{button.click();button.click();});
  if((await saved(page)).gold!==before+gold.quantity)throw Error('Repeated item clicks duplicated gold');
  await page.reload({waitUntil:'load'});await continueHero(page);const restored=await page.evaluate(()=>structuredClone(__questClockState.spawns['gray-east-1']));
  if(restored.instanceId!==original.instanceId||restored.status!=='dead'||restored.corpse.loot.some(i=>i.kind==='currency'||i.kind==='quest'))throw Error('Reload reset the corpse or regenerated collected loot');
  await clickCorpse(page,'gray-east-1');await page.locator('#loot-all').click();await page.waitForFunction(()=>document.getElementById('corpse-loot').hidden);
  let previous=restored.instanceId;
  for(let count=1;count<=10;count++){
   // The pure tests assert the chosen 120–180-second deadline. Use that real clock here.
   await page.evaluate(()=>EmberEncounters.tick(__questClockState,Math.max(0,__questClockState.spawns['gray-east-1'].respawnAt-__questClockState.clock)));await page.waitForFunction(()=>__questWorld.enemies.find(e=>e.id==='gray-east-1').mesh.visible);
   const respawn=await page.evaluate(()=>({id:__questClockState.spawns['gray-east-1'].instanceId,hp:__questClockState.spawns['gray-east-1'].hp}));if(respawn.id===previous||respawn.hp!==55)throw Error('Respawn did not create a fresh full-health instance');
   await page.waitForFunction(()=>document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:60000});await walkTo(page,22,4,.8);const alive=await page.evaluate(()=>Object.values(__questClockState.spawns).filter(s=>s.status==='dead').map(s=>s.instanceId));await page.locator('#attack').click();
   await page.waitForFunction(before=>Object.values(__questClockState.spawns).some(s=>s.enemyType==='gray_wolf'&&s.status==='dead'&&!before.includes(s.instanceId)),alive,{timeout:60000});
   const dead=await page.evaluate(before=>structuredClone(Object.values(__questClockState.spawns).find(s=>s.enemyType==='gray_wolf'&&s.status==='dead'&&!before.includes(s.instanceId))),alive);if(dead.spawnId!=='gray-east-1'||dead.respawnDelay<120||dead.respawnDelay>180)throw Error('Same spawn or per-death random deadline not exercised');previous=dead.instanceId;
   await page.keyboard.press('KeyE');await page.waitForFunction(()=>!document.getElementById('corpse-loot').hidden);const beforePickup=(await saved(page)).journal;
   if(beforePickup.quests.wolf_plague.objectives.teeth.count!==count-1||beforePickup.quests.parallel_hunt.objectives.kills.count!==count)throw Error('Kill/item quest progress was coupled');
   await page.locator('[data-kind="quest"]').waitFor({state:'visible',timeout:15000});if(count===1)await page.screenshot({path:'/tmp/emberwild-quest-loot.png'});await page.locator('[data-kind="quest"]').click();
   if((await saved(page)).journal.quests.wolf_plague.objectives.teeth.count!==count)throw Error('Actual pickup did not immediately advance quest');await page.locator('#loot-all').click();await page.waitForFunction(()=>document.getElementById('corpse-loot').hidden);console.log('Quest/loot: teeth '+count+'/10');
  }
  if(await page.evaluate(()=>__questView.indicator.userData.questStatus!=='ready'||!__questView.indicator.children[2].visible||__questView.indicator.children[0].visible))throw Error('Ready quest did not immediately change to yellow question mark');if((await saved(page)).journal.quests.wolf_plague.status!=='READY_TO_TURN_IN')throw Error('Quest did not become ready');
  await page.keyboard.press('KeyJ');await page.screenshot({path:'/tmp/emberwild-quest-ready.png'});await page.keyboard.press('Escape');await walkTo(page,12,9,1.8);await page.keyboard.press('KeyE');await page.waitForFunction(()=>document.getElementById('dialog-action').textContent.includes('250 XP'));
  const rewardBefore=await saved(page);await page.locator('#dialog-action').evaluate(button=>{button.click();button.click();});const completed=await saved(page);
  if(completed.journal.quests.wolf_plague.status!=='COMPLETED'||completed.gold!==rewardBefore.gold+50||completed.xp!==rewardBefore.xp+250||completed.journal.quests.parallel_hunt.objectives.kills.count!==10)throw Error('Turn-in reward or independent quest state incorrect');
  await page.keyboard.press('KeyJ');await page.screenshot({path:'/tmp/emberwild-quest-completed.png'});if(!await page.locator('#journal-completed').textContent().then(t=>t.includes('De wolvenplaag')))throw Error('Completed quest missing from journal');await page.keyboard.press('Escape');
  await page.reload({waitUntil:'load'});await continueHero(page);if((await saved(page)).journal.quests.wolf_plague.status!=='COMPLETED')throw Error('Completed quest did not persist');await page.keyboard.press('KeyE');await page.locator('#npc-quest-options button').filter({hasText:'De wolvenplaag'}).click();if(await page.locator('#dialog-action').textContent().then(t=>t.includes('Lever in')))throw Error('Completed quest can pay out twice');await page.keyboard.press('Escape');
  await page.evaluate(()=>EmberEncounters.tick(__questClockState,Math.max(0,__questClockState.spawns['gray-east-1'].respawnAt-__questClockState.clock)));await walkTo(page,22,4,2);await page.waitForFunction(()=>document.getElementById('attack-cd').textContent==='Klaar',null,{timeout:60000});const beforeIds=await page.evaluate(()=>Object.values(__questClockState.spawns).filter(s=>s.status==='dead').map(s=>s.instanceId));await page.locator('#attack').click();await page.waitForFunction(ids=>Object.values(__questClockState.spawns).some(s=>s.enemyType==='gray_wolf'&&s.status==='dead'&&!ids.includes(s.instanceId)),beforeIds,{timeout:60000});
  if(await page.evaluate(()=>Object.values(__questClockState.spawns).some(s=>s.corpse?.loot.some(i=>i.kind==='quest'&&i.questId==='wolf_plague'))))throw Error('Quest loot continued after completion');
  console.log('Quest/loot: complete flow, persistence, independent quests and post-completion respawn passed');
 }catch(error){await page.screenshot({path:'/tmp/emberwild-quest-failure.png'}).catch(()=>{});console.error('Quest/loot state',await page.evaluate(()=>({player:__questWorld?.player.group.position.toArray(),encounters:__questClockState,notice:document.getElementById('fatal').textContent})).catch(()=>null));throw error;}
 finally{await page.close();}
}
module.exports={run,walkTo};
if(require.main===module)(async()=>{const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),errors=[];try{await run(browser,errors);console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
