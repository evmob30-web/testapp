const {chromium}=require('playwright');
const {walkTo}=require('./browser-quest-loot.cjs');
const url=()=>process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/';
async function run(browser,errors){
 const page=await browser.newPage({viewport:{width:960,height:640}});page.on('pageerror',e=>errors.push('Wolf animation: '+e.message));await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
 try{
  await page.goto(url(),{waitUntil:'load'});
  await page.evaluate(()=>{
   const T=THREE,scene=new T.Scene();scene.background=new T.Color('#b4cbc0');scene.add(new T.HemisphereLight('#e4eddb','#344d40',2.15));
   const sun=new T.DirectionalLight('#ffe0ae',2.6);sun.position.set(-3,8,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12});scene.add(sun);
   const floor=EmberTerrain.create(T);scene.add(floor);const wolves=['shadow','gray'].map((coat,i)=>{const wolf=EmberForestActors.createWolf(T,{coat});wolf.group.position.x=i*2.3;scene.add(wolf.group);return wolf;});
   for(const node of document.body.children)if(node.id!=='world')node.style.display='none';const renderer=new T.WebGLRenderer({canvas:document.getElementById('world'),antialias:true});renderer.setSize(960,640,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
   window.__wolfReview={scene,wolves,renderer,camera:new T.PerspectiveCamera(42,960/640,.1,180),frames:0,supportError:0,lift:0,unsupported:0,inverted:0};
  });
  for(const [name,speed,turn,frames]of [['idle',0,0,60],['walk-1',.65,.8,50],['walk-2',.65,.8,30],['walk-3',.65,.8,30],['walk-4',.65,.8,30],['trot-1',3.3,-.8,50],['trot-2',3.3,-.8,12],['trot-3',3.3,-.8,12],['stop',0,0,120]]){
   const stats=await page.evaluate(({speed,turn,frames})=>{
    const T=THREE,r=__wolfReview,center=new T.Vector3();
    for(let frame=0;frame<frames;frame++)for(const wolf of r.wolves){
     wolf.group.rotation.y+=turn/60;wolf.group.position.x+=Math.sin(wolf.group.rotation.y)*speed/60;wolf.group.position.z+=Math.cos(wolf.group.rotation.y)*speed/60;wolf.update(1/60);let support=0;
     for(const leg of wolf.legs){const mesh=leg.paw.children[0],sole=mesh.localToWorld(new T.Vector3(0,mesh.geometry.boundingBox.min.y,0)),hip=leg.upper.getWorldPosition(new T.Vector3()),knee=leg.lower.getWorldPosition(new T.Vector3());if(leg.contact){support++;r.supportError=Math.max(r.supportError,Math.abs(sole.y+.1));}r.lift=Math.max(r.lift,sole.y+.1);if(knee.y>hip.y)r.inverted++;}if(!support)r.unsupported++;r.frames++;
    }
    for(const wolf of r.wolves)center.add(wolf.group.position);center.multiplyScalar(.5);const offset=new T.Vector3(5,2.5,5).applyAxisAngle(new T.Vector3(0,1,0),r.wolves[0].group.rotation.y);r.camera.position.copy(center).add(offset);r.camera.lookAt(center.x,.65,center.z);r.scene.updateMatrixWorld(true);r.renderer.render(r.scene,r.camera);
    return {frames:r.frames,supportError:r.supportError,lift:r.lift,unsupported:r.unsupported,inverted:r.inverted};
   },{speed,turn,frames});
   if(stats.supportError>.008||stats.lift>.13||stats.unsupported||stats.inverted)throw Error('Rendered wolf pose failed at '+name+': '+JSON.stringify(stats));await page.screenshot({path:'/tmp/emberwild-wolves-'+name+'.png'});
  }
  console.log('Wolves: both coats, four walk phases, trot, turning, idle and stop rendered with grounded soles');
 }finally{await page.close();}

 const game=await browser.newPage({viewport:{width:960,height:700}});game.on('pageerror',e=>errors.push('Wolf gameplay: '+e.message));
 await game.addInitScript(()=>{
  Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){const create=api.createWorld;api.createWorld=(...args)=>window.__questWorld=create(...args);Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberForestActors',{configurable:true,set(api){
   const create=api.createWolf;api.createWolf=(...args)=>{const actor=create(...args),update=actor.update;actor.update=(dt,e)=>{const result=update(dt,e);if(!actor.group.visible||actor.dying||actor.motion.warning||actor.motion.strike||actor.motion.speed<.1)return result;
    const stats=window.__wolfGameStats??={walking:0,chasing:0,supportError:0,unsupported:0};if(actor.motion.speed<1.2)stats.walking++;else if(actor.motion.speed>1.2)stats.chasing++;let support=0;
    for(const leg of actor.legs)if(leg.contact){support++;const mesh=leg.paw.children[0],p=mesh.localToWorld(new THREE.Vector3(0,mesh.geometry.boundingBox.min.y,0));stats.supportError=Math.max(stats.supportError,Math.abs(p.y-(actor.group.position.y-.1)));}if(!support)stats.unsupported++;return result;
   };return actor;};Object.defineProperty(window,'EmberForestActors',{value:api,writable:true,configurable:true});
  }});
  localStorage.setItem('emberwild-characters-v1',JSON.stringify({version:1,active:0,slots:[{name:'Wolvenproef',state:{version:1,classId:'guardian',level:8,hp:240,x:9,z:10,quest:0,potions:3}},null,null]}));
 });
 try{
  await game.goto(url(),{waitUntil:'load'});await game.locator('#play').click();await game.locator('#character-play-0').click();
  await game.waitForFunction(()=>window.__wolfGameStats?.walking>100,null,{timeout:60000});await game.screenshot({path:'/tmp/emberwild-wolves-game-wandering.png'});
  await walkTo(game,22,4,1.2);await game.keyboard.down('KeyA');await game.waitForTimeout(600);await game.keyboard.up('KeyA');await game.keyboard.down('KeyS');await game.waitForTimeout(600);await game.keyboard.up('KeyS');
  await walkTo(game,16,11,1);await game.waitForFunction(()=>__wolfGameStats.chasing>30,null,{timeout:60000});await game.screenshot({path:'/tmp/emberwild-wolves-game-chasing.png'});
  const stats=await game.evaluate(()=>__wolfGameStats);if(stats.supportError>.015||stats.unsupported)throw Error('Real wolf AI lost ground contact: '+JSON.stringify(stats));console.log('Wolves: real wandering, WASD movement and chasing passed '+JSON.stringify(stats));
 }catch(error){console.error('Wolf gameplay state',await game.evaluate(()=>({stats:window.__wolfGameStats,player:window.__questWorld?.player.group.position.toArray(),speeds:window.__questWorld?.enemies.filter(e=>e.visual?.legs).map(e=>({id:e.id,speed:e.visual.motion.speed,warning:e.visual.motion.warning,strike:e.visual.motion.strike}))})).catch(()=>null));await game.screenshot({path:'/tmp/emberwild-wolves-game-failure.png'}).catch(()=>{});throw error;}finally{await game.close();}
}
module.exports={run};
if(require.main===module)(async()=>{const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),errors=[];try{await run(browser,errors);console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
