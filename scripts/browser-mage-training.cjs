const {chromium}=require('playwright');
const url=()=>process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/';
async function run(browser,errors){
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>errors.push('Mage lessons: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('Mage lessons: '+m.text());});
 await page.addInitScript(()=>{
  // Drive the real game at a fixed frame rate. Only intermediate GPU draws are skipped.
  window.requestAnimationFrame=callback=>{window.__mageFrame=callback;return 0;};
  Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){
   const Renderer=THREE.WebGLRenderer;THREE.WebGLRenderer=class extends Renderer{constructor(...args){super(...args);const draw=this.render;this.render=(scene,camera)=>{if(scene===window.__mageWorld?.scene)window.__mageCamera=camera;if(window.__mageSkipDraw){scene.updateMatrixWorld();camera.updateMatrixWorld();return;}return draw.call(this,scene,camera);};}};
   const create=api.createWorld;api.createWorld=(...args)=>window.__mageWorld=create(...args);
   Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberMageTraining',{configurable:true,set(api){const create=api.create;api.create=(...args)=>window.__mageTraining=create(...args);Object.defineProperty(window,'EmberMageTraining',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberAdventureWorld',{configurable:true,set(api){const create=api.create;api.create=(...args)=>{const view=create(...args),reconcile=view.reconcile;view.reconcile=(state,...args)=>{window.__mageState=state;return reconcile(state,...args);};return view;};Object.defineProperty(window,'EmberAdventureWorld',{value:api,writable:true,configurable:true});}});
  let ms=0;
  window.__advance=(frames=1,draw=true)=>{for(let i=0;i<frames;i++){window.__mageSkipDraw=!draw||i<frames-1;__mageFrame(ms+=1000/30);}window.__mageSkipDraw=false;};
  window.__mageWalk=(x,z,range=.3)=>{
   const keys=new Set();const clear=()=>{for(const code of keys)window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));keys.clear();};
   for(let i=0;i<1200;i++){
    const s=__mageState,dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<range){clear();__advance(2);return;}
    const next=new Set(['ShiftLeft']);if(Math.abs(dx)>.12)next.add(dx>0?'KeyD':'KeyA');if(Math.abs(dz)>.12)next.add(dz>0?'KeyS':'KeyW');
    for(const code of keys)if(!next.has(code))window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));for(const code of next)if(!keys.has(code))window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));keys.clear();for(const code of next)keys.add(code);__advance(1,false);
   }clear();throw Error('Walking failed at '+JSON.stringify({x:__mageState.x,z:__mageState.z,target:[x,z]}));
  };
 });
 const click=async id=>page.locator('#'+id).evaluate(el=>el.click());
 const advance=async n=>page.evaluate(n=>__advance(n),n);
 const walk=async(x,z,r=.3)=>page.evaluate(p=>__mageWalk(...p),[x,z,r]);
 const assert=async(fn,message)=>{if(!await page.evaluate(fn))throw Error(message);};
 const trainer=async()=>{await walk(-25,27);await walk(-21,27);await page.keyboard.press('KeyE');};
 try{
  await page.goto(url(),{waitUntil:'load'});await page.waitForFunction(()=>window.__mageState);await advance(1);
  await click('play');await click('character-create-0');await click('class-mage');await page.waitForFunction(()=>document.getElementById('creator-canvas').dataset.characterModel==='ready');await click('class-start');await advance(3);
  await page.evaluate(async()=>{await __mageWorld.modelAssets.ready;await __mageTraining.npc.ready;});
  await assert(()=>document.getElementById('barrier').disabled&&document.getElementById('blink').disabled&&!__mageTraining.target.visible,'Fresh mage spell locks/props failed');
  console.log('Mage lessons: fresh mage ready');await walk(0,29);await walk(-20,29);await page.keyboard.press('KeyE');await advance(30);await page.screenshot({path:'/tmp/emberwild-mage-lyra.png'});await click('dialog-action');await advance(3);
  await assert(()=>EmberQuests.status(__mageState.journal,'mage_spark')==='ACTIVE'&&__mageTraining.target.visible&&!__mageTraining.ward.visible&&!__mageTraining.blinkStart.visible,'Accept did not expose just the first lesson');
  await walk(-25,28);await walk(-25,18);
  for(let i=0;i<3;i++){
   await page.evaluate(()=>{const p=EmberAdventureData.mageTraining.target,v=new THREE.Vector3(p.x,1.6,p.z).project(__mageCamera);document.getElementById('world').dispatchEvent(new PointerEvent('pointermove',{clientX:(v.x+1)*innerWidth/2,clientY:(1-v.y)*innerHeight/2,bubbles:true}));});
   await page.keyboard.press('Digit1');await advance(30);
  }
  await assert(()=>EmberQuests.status(__mageState.journal,'mage_spark')==='READY_TO_TURN_IN','Three actual spell projectiles did not complete the crystal lesson');
  console.log('Mage lessons: crystal hit three times');await trainer();await click('dialog-action');await advance(3);await assert(()=>__mageState.level===2&&!document.getElementById('barrier').disabled&&document.getElementById('blink').disabled,'First lesson did not unlock level 2 barrier');
  await page.keyboard.press('KeyE');await click('dialog-action');await advance(3);await walk(-24,24);const safeHp=await page.evaluate(()=>__mageState.hp);await advance(100);
  if(await page.evaluate(()=>__mageState.hp)!==safeHp)throw Error('Unprotected training pulse damaged HP');
  await page.keyboard.press('Digit3');await advance(1);await assert(()=>__mageWorld.mageView.ward.visible&&__mageState.magePowers.barrierAmount>0,'Barrier did not render');await page.screenshot({path:'/tmp/emberwild-mage-barrier.png'});
  await page.keyboard.press('Escape');const frozen=await page.evaluate(()=>[__mageState.encounters.clock,__mageState.magePowers.barrierAmount]);await advance(180);
  if(JSON.stringify(await page.evaluate(()=>[__mageState.encounters.clock,__mageState.magePowers.barrierAmount]))!==JSON.stringify(frozen))throw Error('Pause advanced power clock/shield');
  await page.reload({waitUntil:'load'});await click('play');await click('character-play-0');await advance(2);await assert(()=>__mageState.magePowers.barrierAmount>0&&EmberMage.powerStatus(__mageState,'barrier').remaining>0,'Reload lost shield/cooldown');await advance(100);
  await assert(()=>EmberQuests.status(__mageState.journal,'mage_ward')==='READY_TO_TURN_IN','Actual absorbed pulse did not complete barrier lesson');
  console.log('Mage lessons: pulse absorbed after pause/reload');await trainer();await click('dialog-action');await advance(3);await assert(()=>__mageState.level===3&&!document.getElementById('blink').disabled,'Second lesson did not unlock level 3 Blink');await page.keyboard.press('KeyE');await click('dialog-action');await advance(3);
  await walk(-25,21.5);await assert(()=>EmberQuests.status(__mageState.journal,'mage_step')==='ACTIVE','Walking into the end rune counted as a Blink');await walk(-25,28);
  await page.keyboard.down('KeyW');await page.keyboard.press('Digit4');await page.keyboard.up('KeyW');await advance(1);
  await assert(()=>EmberQuests.status(__mageState.journal,'mage_step')==='READY_TO_TURN_IN'&&Math.abs(__mageState.z-21.5)<.7,'Actual forward Blink did not land on the end rune');await page.screenshot({path:'/tmp/emberwild-mage-blink.png'});
  await trainer();await click('dialog-action');await advance(3);await assert(()=>__mageState.gold===50&&EmberQuests.status(__mageState.journal,'mage_step')==='COMPLETED'&&!__mageTraining.blinkStart.visible,'Final reward/prop cleanup failed');
  await page.keyboard.press('Escape');await page.reload({waitUntil:'load'});await click('play');await click('character-play-0');await advance(3);
  await assert(()=>__mageState.level===3&&__mageState.gold===50&&EmberQuests.status(__mageState.journal,'mage_step')==='COMPLETED'&&!__mageTraining.target.visible&&!__mageTraining.ward.visible,'Completed lessons did not survive reload');
  await page.setViewportSize({width:560,height:800});await page.evaluate(()=>dispatchEvent(new Event('resize')));await advance(2);await assert(()=>[...document.querySelectorAll('#skill-bar button')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),'Mage hotbar overflows narrow viewport');await page.screenshot({path:'/tmp/emberwild-mage-small-screen.png'});
  console.log('Mage lessons: real walking, dialog, projectile hits, safe pulses, barrier, level unlocks, Blink, pause/reload and responsive HUD passed');
 }catch(error){await page.screenshot({path:'/tmp/emberwild-mage-failure.png'}).catch(()=>{});throw error;}finally{await page.close();}
}
module.exports={run};
if(require.main===module)(async()=>{const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),errors=[];try{await run(browser,errors);console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
