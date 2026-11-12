const {chromium}=require('playwright');
const url=()=>process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/';
async function run(browser,errors){
 const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push('Arcane trial: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('Arcane trial: '+m.text());});
 await page.addInitScript(()=>{
  // Drive the real game at a fixed frame rate. Only intermediate GPU draws are skipped.
  window.requestAnimationFrame=callback=>{window.__trialFrame=callback;return 0;};
  Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){
   const Renderer=THREE.WebGLRenderer;THREE.WebGLRenderer=class extends Renderer{constructor(...args){super(...args);const draw=this.render;this.render=(scene,camera)=>{if(scene===window.__trialWorld?.scene)window.__trialCamera=camera;if(window.__trialSkipDraw){scene.updateMatrixWorld();camera.updateMatrixWorld();return;}return draw.call(this,scene,camera);};}};
   const create=api.createWorld;api.createWorld=(...args)=>window.__trialWorld=create(...args);
   Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberMageTraining',{configurable:true,set(api){const create=api.create;api.create=(...args)=>window.__trialTraining=create(...args);Object.defineProperty(window,'EmberMageTraining',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberAdventureWorld',{configurable:true,set(api){const create=api.create;api.create=(...args)=>{const view=create(...args),reconcile=view.reconcile;view.reconcile=(state,...args)=>{window.__trialState=state;return reconcile(state,...args);};return view;};Object.defineProperty(window,'EmberAdventureWorld',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberArcaneTrial',{configurable:true,set(api){const create=api.create;api.create=(...args)=>window.__trialView=create(...args);Object.defineProperty(window,'EmberArcaneTrial',{value:api,writable:true,configurable:true});}});
  if(!sessionStorage.getItem('trial-fixture')){sessionStorage.setItem('trial-fixture','1');localStorage.setItem('emberwild-characters-v1',JSON.stringify({version:1,active:0,slots:[{name:'Magieproef',state:{version:1,classId:'mage',level:3,xp:90,gold:50,hp:115,mana:110,x:-20,z:27,journal:{version:1,quests:{mage_spark:{status:'COMPLETED'},mage_ward:{status:'COMPLETED'},mage_step:{status:'COMPLETED'}}},encounters:{version:1,worldId:'trial-browser',clock:0,seed:94,spawns:{}}}},null,null]}));}
  let ms=0;
  window.__advance=(frames=1,draw=true)=>{for(let i=0;i<frames;i++){window.__trialSkipDraw=!draw||i<frames-1;__trialFrame(ms+=1000/30);}window.__trialSkipDraw=false;};
  window.__trialWalk=(x,z,range=.3)=>{
   const keys=new Set();const clear=()=>{for(const code of keys)window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));keys.clear();};
   for(let i=0;i<1200;i++){
    const s=__trialState,dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<range){clear();__advance(2);return;}
    const next=new Set(['ShiftLeft']);if(Math.abs(dx)>.12)next.add(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>.12)next.add(dz>0?'KeyS':'KeyW');
    for(const code of keys)if(!next.has(code))window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));for(const code of next)if(!keys.has(code))window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));keys.clear();for(const code of next)keys.add(code);__advance(1,false);
   }clear();throw Error('Walking failed at '+JSON.stringify({x:__trialState.x,z:__trialState.z,target:[x,z]}));
  };
 });
 const click=async id=>page.locator('#'+id).evaluate(el=>el.click()),advance=async n=>page.evaluate(n=>__advance(n),n),walk=async(x,z,r=.3)=>page.evaluate(p=>__trialWalk(...p),[x,z,r]);
 const assert=async(fn,message)=>{if(!await page.evaluate(fn))throw Error(message);};
 const aim=async()=>page.evaluate(()=>{const p=__trialView.boss.mesh.position,v=new THREE.Vector3(p.x,1.6,p.z).project(__trialCamera);document.getElementById('world').dispatchEvent(new PointerEvent('pointermove',{clientX:(v.x+1)*innerWidth/2,clientY:(1-v.y)*innerHeight/2,bubbles:true}));});
 const until=async(kind,phase='warning')=>page.evaluate(({kind,phase})=>{for(let i=0;i<500;i++){if(__trialView.fight.kind===kind&&__trialView.fight.phase===phase){__advance(1);return;}__advance(1,false);}throw Error('Attack phase did not arrive: '+JSON.stringify(__trialView.fight));},{kind,phase});
 const trainer=async()=>{await walk(-26,14);await walk(-25,27);await walk(-21,27);await page.keyboard.press('KeyE');};
 try{
  await page.goto(url(),{waitUntil:'load'});await page.waitForFunction(()=>window.__trialState);await click('play');await click('character-play-0');await advance(2);await page.evaluate(async()=>{await __trialView.boss.visual.ready;await __trialTraining.npc.ready;});
  await assert(()=>!__trialView.arena.visible&&!__trialView.boss.mesh.visible&&RPG.staffOptions(__trialState).length===1,'Unaccepted trial leaked a boss, arena or reward');
  await page.keyboard.press('KeyE');await advance(25);await page.screenshot({path:'/tmp/emberwild-vael-quest.png'});await click('dialog-action');await advance(2);
  await assert(()=>EmberQuests.status(__trialState.journal,'mage_trial')==='ACTIVE'&&__trialView.arena.visible&&__trialView.boss.mesh.visible,'Actual acceptance did not show Vael');
  await walk(-25,25);await walk(-26,8);await until('lance');await page.screenshot({path:'/tmp/emberwild-vael-lance-warning.png'});
  await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>[__trialView.fight.remaining,__trialState.encounters.clock]);await advance(120);if(JSON.stringify(await page.evaluate(()=>[__trialView.fight.remaining,__trialState.encounters.clock]))!==JSON.stringify(frozen))throw Error('Pause advanced the boss warning');await page.keyboard.press('Escape');
  await page.keyboard.press('Digit3');const protectedState=await page.evaluate(()=>({hp:__trialState.hp,shield:__trialState.magePowers.barrierAmount}));await until('lance','recovery');
  if(!await page.evaluate(before=>__trialState.hp===before.hp&&Math.abs(__trialState.magePowers.barrierAmount-(before.shield-26))<.001,protectedState))throw Error('The announced lance was not absorbed by the actual barrier');
  await until('nova');await page.screenshot({path:'/tmp/emberwild-vael-nova-warning.png'});const novaHp=await page.evaluate(()=>__trialState.hp);await page.keyboard.down('KeyW');await page.keyboard.press('Digit4');await page.keyboard.up('KeyW');await until('nova','recovery');if(await page.evaluate(()=>__trialState.hp)!==novaHp)throw Error('Blink failed to escape the announced explosion');
  await aim();await page.keyboard.press('Digit1');await advance(30);await assert(()=>__trialView.boss.hp<__trialView.boss.max,'Real Vonkbol did not damage Vael');
  await page.keyboard.press('Escape');const wounded=await page.evaluate(()=>__trialView.boss.hp);await page.reload({waitUntil:'load'});await click('play');await click('character-play-0');await advance(2);if(await page.evaluate(()=>__trialView.boss.hp)!==wounded)throw Error('Reload lost active boss HP');
  await walk(-26,14);await assert(()=>__trialView.boss.hp===__trialView.boss.max&&!__trialView.lance.visible&&!__trialView.nova.visible,'Retreat failed to reset Vael and his hazards');await walk(-26,8);
  console.log('Arcane trial: acceptance, real shield/Blink counters, pause, reload and retreat passed');
  await page.evaluate(()=>{
   const key=code=>{dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));};
   for(let frame=0;frame<1000&&__trialView.boss.mesh.visible;frame++){
    const s=__trialState,f=__trialView.fight;
    if(s.hp<60&&s.potions>0)key('KeyQ');
    if(f.phase==='warning'&&f.kind==='lance'&&f.remaining<.45&&EmberMage.powerStatus(s,'barrier').ok)key('Digit3');
    if(f.phase==='warning'&&f.kind==='nova'&&f.remaining<.5&&EmberMage.powerStatus(s,'blink').ok){
     for(const [code,direction]of [['KeyW',{x:0,z:-1}],['KeyD',{x:1,z:0}],['KeyS',{x:0,z:1}],['KeyA',{x:-1,z:0}]]){
      const target=EmberMage.blinkDestination(s,direction,(x,z)=>x>=-32&&x<=32&&z>=-60&&z<=31&&__trialWorld.colliders.every(c=>Math.hypot(x-c.x,z-c.z)>=c.r+.55));
      if(!target||Math.hypot(target.x+26,target.z-3)>8.5||Math.hypot(target.x-f.aim.x,target.z-f.aim.z)<3.7)continue;
      dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));key('Digit4');dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));break;
     }
    }
    if(frame%22===0){const p=__trialView.boss.mesh.position,v=new THREE.Vector3(p.x,1.6,p.z).project(__trialCamera);document.getElementById('world').dispatchEvent(new PointerEvent('pointermove',{clientX:(v.x+1)*innerWidth/2,clientY:(1-v.y)*innerHeight/2,bubbles:true}));key('Digit1');}
    __advance(1,false);
   }__advance(2);if(__trialView.boss.mesh.visible)throw Error('Actual combat did not defeat Vael: '+JSON.stringify({hp:__trialState.hp,x:__trialState.x,z:__trialState.z,bossHp:__trialView.boss.hp}));
  });
  await assert(()=>EmberQuests.status(__trialState.journal,'mage_trial')==='READY_TO_TURN_IN'&&!__trialView.arena.visible&&EmberEncounters.available(__trialState.encounters,__trialState.journal,'arcane-vael').length===0,'Kill did not complete the quest cleanly');await page.screenshot({path:'/tmp/emberwild-vael-victory.png'});
  await page.keyboard.press('Escape');await page.reload({waitUntil:'load'});await click('play');await click('character-play-0');await advance(2);await assert(()=>EmberQuests.status(__trialState.journal,'mage_trial')==='READY_TO_TURN_IN'&&!__trialView.boss.mesh.visible,'Reload resurrected the completed boss');
  await trainer();await page.screenshot({path:'/tmp/emberwild-vael-reward.png'});await click('dialog-action');await advance(3);await assert(()=>__trialState.gold===90&&__trialState.staffId==='starweaver'&&EmberQuests.status(__trialState.journal,'mage_trial')==='COMPLETED'&&__trialWorld.mageView.staff.getObjectByName('StarweaverCrown').visible,'Unique reward did not equip correctly');
  await page.keyboard.press('KeyI');const enhanced=await page.evaluate(()=>RPG.spellDamage(__trialState));await click('staff-starter');if(await page.evaluate(()=>RPG.spellDamage(__trialState))!==enhanced-12)throw Error('Staff bonus did not switch by exactly 12');await click('staff-starweaver');await click('skin-toggle');await assert(()=>__trialState.skinId==='flame_guardian'&&__trialWorld.mageView.staff.visible&&__trialWorld.mageView.staff.getObjectByName('StarweaverCrown').visible,'Reward staff was lost when changing outfit');await click('skin-toggle');await page.keyboard.press('Escape');await advance(20);await page.screenshot({path:'/tmp/emberwild-starweaver-equipped.png'});
  await page.keyboard.press('Escape');await page.reload({waitUntil:'load'});await click('play');await click('character-play-0');await advance(2);await assert(()=>__trialState.gold===90&&__trialState.staffId==='starweaver'&&RPG.staffOptions(__trialState).length===2&&!__trialView.arena.visible&&!__trialView.boss.mesh.visible,'Reward/save cleanup failed');
  await page.keyboard.press('KeyE');await click('dialog-action');await advance(2);await assert(()=>__trialState.gold===90,'Completed conversation duplicated the reward');
  await page.keyboard.press('Escape');await click('new');await click('character-create-1');await click('class-guardian');await click('class-start');await advance(2);await assert(()=>__trialState.classId==='guardian'&&!__trialView.arena.visible&&!__trialView.boss.mesh.visible&&EmberQuests.npcQuests(__trialState.journal,'lyra',__trialState).length===0,'Another class inherited the mage encounter');
  console.log('Arcane trial: real combat victory, one-time reward, staff model/stats/equipping, persistence and class isolation passed');
 }catch(error){await page.screenshot({path:'/tmp/emberwild-vael-failure.png'}).catch(()=>{});throw error;}finally{await page.close();}
}
module.exports={run};
if(require.main===module)(async()=>{const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),errors=[];try{await run(browser,errors);console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
