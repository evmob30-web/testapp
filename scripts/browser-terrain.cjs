const {chromium}=require('playwright');
const {walkTo}=require('./browser-quest-loot.cjs');
const url=()=>process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/';
async function observe(page,freeze=false){
 await page.addInitScript(freeze=>{
  if(freeze)window.requestAnimationFrame=()=>0;
  Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){const make=api.createWorld;api.createWorld=(...args)=>{const w=make(...args);w.scene.onBeforeRender=(r,s,c)=>window.__terrainCamera=c;return window.__questWorld=w;};Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
 },freeze);
}
async function run(browser,errors){
 const page=await browser.newPage({viewport:{width:960,height:700}});page.on('pageerror',e=>errors.push('Terrain: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('Terrain: '+m.text());});await observe(page,true);
 try{
  await page.goto(url(),{waitUntil:'load'});await page.waitForFunction(()=>window.__questWorld);
  await page.evaluate(async()=>{
   const T=THREE,w=__questWorld;await w.modelAssets.ready;
   for(const node of document.body.children)if(node.id!=='world')node.style.display='none';w.player.group.visible=false;
   const terrain=w.scene.getObjectByName('ValleyTerrain');if(!terrain?.isMesh||terrain.userData.terrain.meadows!==35)throw Error('Original meadow designs missing');
   if(w.scene.children.some(m=>m.geometry?.type==='CircleGeometry'&&m.geometry.parameters.segments===7&&Math.abs(m.position.y+.04)<1e-5))throw Error('Competing coplanar meadow meshes remain');
   const renderer=new T.WebGLRenderer({canvas:document.getElementById('world'),antialias:true});renderer.setSize(960,700,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
   const camera=new T.PerspectiveCamera(52,960/700,.1,180),idScene=new T.Scene(),idMesh=new T.Mesh(terrain.geometry,new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}));idScene.add(idMesh);idScene.updateMatrixWorld(true);
   const target=new T.WebGLRenderTarget(960,700);target.texture.colorSpace=T.SRGBColorSpace;
   window.__terrainReview={w,terrain,renderer,camera,idScene,idMesh,target};
  });
  let checks=0;
  for(const [name,pose]of [['north',[6,2.2,-38.5,0,-45.55]],['east',[8,1.1,-42,0,-45.55]],['west',[-7,2.8,-39,0,-45.55]],['high',[0,12,-40,0,-45.55]],['mid',[5,2,-26,.2,-32.75]],['south',[6,2,14,-.2,6.35]],['village',[5,3,29,0,21]],['outer',[-24,2,-18,-28.6,-25.65]]]){
   const result=await page.evaluate(pose=>{
    const T=THREE,{w,terrain,renderer,camera,idScene,idMesh,target}=__terrainReview,[x,y,z,tx,tz]=pose;camera.position.set(x,y,z);camera.lookAt(tx,-.1,tz);camera.updateMatrixWorld(true);w.scene.updateMatrixWorld(true);
    // A colour-ID pass isolates geometry/depth stability from legitimate moving shadows.
    renderer.setRenderTarget(target);renderer.render(idScene,camera);const ray=new T.Raycaster(),pixel=new Uint8Array(4),failures=[];let checked=0;
    for(let dx=-4;dx<=4;dx+=.8)for(let dz=-3;dz<=3;dz+=.8){
     const p=new T.Vector3(tx+dx,-.1,tz+dz),projected=p.clone().project(camera);if(Math.abs(projected.x)>.95||Math.abs(projected.y)>.95||projected.z>1)continue;
     const px=Math.floor((projected.x+1)*480),py=Math.floor((projected.y+1)*350);ray.setFromCamera(new T.Vector2((px+.5)/480-1,(py+.5)/350-1),camera);const hit=ray.intersectObject(idMesh)[0];if(!hit)throw Error('Hole in visible terrain');
     const a=new T.Vector3().fromBufferAttribute(terrain.geometry.attributes.position,hit.face.a),b=new T.Vector3().fromBufferAttribute(terrain.geometry.attributes.position,hit.face.b),c=new T.Vector3().fromBufferAttribute(terrain.geometry.attributes.position,hit.face.c),weights=new T.Vector3();T.Triangle.getBarycoord(hit.point,a,b,c,weights);if(Math.min(weights.x,weights.y,weights.z)<.035)continue;
     renderer.readRenderTargetPixels(target,px,py,1,1,pixel);const expected=new T.Color().fromBufferAttribute(terrain.geometry.attributes.color,hit.face.a).getHex(),rgb=[expected>>16&255,expected>>8&255,expected&255];if(rgb.some((v,i)=>Math.abs(v-pixel[i])>2))failures.push({px,py,expected:rgb,actual:[...pixel]});checked++;
    }
    renderer.setRenderTarget(null);renderer.render(w.scene,camera);return {checked,failures:failures.slice(0,3)};
   },pose);
   if(result.failures.length||!result.checked)throw Error('Camera-dependent terrain colours at '+name+': '+JSON.stringify(result));checks+=result.checked;await page.screenshot({path:'/tmp/emberwild-terrain-'+name+'.png'});
  }
  console.log('Terrain: eight views, '+checks+' rendered colour/depth samples passed');
 }finally{await page.close();}

 const walking=await browser.newPage({viewport:{width:960,height:700}});walking.on('pageerror',e=>errors.push('Terrain walk: '+e.message));await observe(walking);
 await walking.addInitScript(()=>{
  // Isolate navigation from combat; production movement, collision and camera remain active.
  Object.defineProperty(window,'EmberAdventureData',{configurable:true,set(data){const spawns=Object.fromEntries(data.spawns.map(s=>[s.id,{status:'dead',deadAt:0,respawnDelay:600,respawnAt:600,generation:1,hp:0,corpse:null}]));localStorage.setItem('emberwild-characters-v1',JSON.stringify({version:1,active:0,slots:[{name:'Terreinproef',state:{version:1,classId:'guardian',level:8,hp:240,x:0,z:-24,quest:5,dungeon:1,kills:['w1','w2','w3','boss'],encounters:{version:1,worldId:'terrain-walk',clock:0,seed:1,spawns}}},null,null]}));Object.defineProperty(window,'EmberAdventureData',{value:data,writable:true,configurable:true});}});
 });
 try{
  await walking.goto(url(),{waitUntil:'load'});await walking.locator('#play').click();await walking.locator('#character-play-0').click();
  await walkTo(walking,0,-39,.8);await walking.screenshot({path:'/tmp/emberwild-terrain-walk-mid.png'});
  const before=await walking.evaluate(()=>__terrainCamera.position.toArray());await walking.mouse.move(460,330);await walking.mouse.down({button:'right'});await walking.mouse.move(540,350,{steps:8});await walking.mouse.up({button:'right'});await walking.waitForFunction(p=>__terrainCamera.position.distanceTo(new THREE.Vector3(...p))>.5,before);await walking.screenshot({path:'/tmp/emberwild-terrain-walk-turned.png'});
  await walking.mouse.move(540,350);await walking.mouse.down({button:'right'});await walking.mouse.move(460,330,{steps:8});await walking.mouse.up({button:'right'});
  await walkTo(walking,0,-56.7,.9);await walking.locator('#interact').filter({hasText:'Daal af'}).waitFor();await walking.screenshot({path:'/tmp/emberwild-terrain-walk-cave.png'});
  const position=await walking.evaluate(()=>__questWorld.player.group.position.toArray());if(Math.abs(position[0])>1||position[2]>-55.5)throw Error('Walking/collision did not reach the grotto');
  await walking.keyboard.press('KeyE');await walking.waitForFunction(()=>JSON.parse(localStorage.getItem('emberwild-characters-v1')).slots[0].state.area==='roots');await walking.screenshot({path:'/tmp/emberwild-terrain-cave-floor.png'});
  console.log('Terrain: actual WASD/Shift walk, camera rotation, collision and cave entry passed');
 }catch(e){await walking.screenshot({path:'/tmp/emberwild-terrain-walk-failure.png'}).catch(()=>{});throw e;}finally{await walking.close();}
}
module.exports={run};
if(require.main===module)(async()=>{const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),errors=[];try{await run(browser,errors);console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
