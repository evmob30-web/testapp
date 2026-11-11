const {chromium}=require('playwright');
const url=()=>process.env.EMBERWILD_BASE_URL||'http://127.0.0.1:8765/';
async function run(browser,errors){
 const page=await browser.newPage({viewport:{width:1100,height:720}});page.on('pageerror',e=>errors.push('Quest symbols: '+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('Quest symbols: '+m.text());});
 await page.addInitScript(()=>{
  window.requestAnimationFrame=()=>0;
  Object.defineProperty(window,'EmberWorld',{configurable:true,set(api){const make=api.createWorld;api.createWorld=(...args)=>window.__markerWorld=make(...args);Object.defineProperty(window,'EmberWorld',{value:api,writable:true,configurable:true});}});
  Object.defineProperty(window,'EmberAdventureWorld',{configurable:true,set(api){const make=api.create;api.create=(...args)=>{const view=make(...args),reconcile=view.reconcile;view.reconcile=(state,...args)=>{window.__markerState=state;return reconcile(state,...args);};return window.__markerView=view;};Object.defineProperty(window,'EmberAdventureWorld',{value:api,writable:true,configurable:true});}});
 });
 try{
  await page.goto(url(),{waitUntil:'load'});await page.waitForFunction(()=>window.__markerState);
  await page.evaluate(async()=>{
   const T=THREE,w=__markerWorld;await w.modelAssets.ready;await Promise.all([...w.npcActors.values()].map(e=>e.actor.ready));w.player.group.visible=false;
   for(const node of document.body.children)if(node.id!=='world')node.style.display='none';
   const renderer=new T.WebGLRenderer({canvas:document.getElementById('world'),antialias:true});renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
   const camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.1,180);window.__markerReview={renderer,camera,width:innerWidth,height:innerHeight};
  });
  const measurements=[];
  for(const state of ['available','active','ready','completed']){
   await page.evaluate(state=>{
    const q=EmberQuests,s=__markerState;
    if(state==='active')q.accept(s.journal,'wolf_plague','rowan');
    if(state==='ready')for(let i=0;i<10;i++)q.collectQuest(s.journal,q.questDrops(s.journal,'gray_wolf',()=>0)[0],'marker-readability/'+i,'gray_wolf');
    if(state==='completed')q.turnIn(s.journal,'wolf_plague','rowan');
    __markerView.reconcile(s);if(__markerView.indicator.userData.questStatus!==state)throw Error('Indicator and quest state differ');
   },state);
   for(const [angle,pose]of (state==='completed'?[['near',[19,6,19]]]:[['near',[19,6,19]],['mid',[20,10,43]],['far',[6,12,80]],['forest',[12,8,-65]]])){
    const metrics=await page.evaluate(pose=>{
     const T=THREE,{renderer,camera,width,height}=__markerReview;camera.position.set(...pose);camera.lookAt(12,1.8,9);__markerView.updateIndicators(camera,height);__markerWorld.scene.updateMatrixWorld(true);
     // Isolate the real sprite's rendered alpha/colours; dense fog cannot wash it away.
     const scene=new T.Scene();scene.fog=new T.FogExp2('#b4c8bb',2);const copy=__markerView.indicator.clone(true);scene.add(copy);const target=new T.WebGLRenderTarget(width,height);target.texture.colorSpace=T.SRGBColorSpace;renderer.setClearColor(0,0);renderer.setRenderTarget(target);renderer.render(scene,camera);
     const pixels=new Uint8Array(width*height*4);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);let minX=width,minY=height,maxX=-1,maxY=-1,gold=0,dark=0,silver=0;
     for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];if(a<64)continue;const n=i/4,x=n%width,y=Math.floor(n/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(a>170&&r>190&&g>100&&b<120)gold++;if(a>170&&r<110&&g<95&&b<95)dark++;if(a>170&&r>90&&Math.max(r,g,b)-Math.min(r,g,b)<55)silver++;}
     renderer.setRenderTarget(null);target.dispose();renderer.setClearColor('#b4c8bb',1);renderer.render(__markerWorld.scene,camera);return {height:maxY<0?0:maxY-minY+1,width:maxX<0?0:maxX-minX+1,gold,dark,silver};
    },pose);
    measurements.push({state,angle,...metrics});
    if(state==='completed'){if(metrics.height)throw Error('Completed quest still renders a symbol');}
    else if(metrics.height<48||metrics.height>90||metrics.width<15||metrics.dark<35||(state==='active'?metrics.silver<70:metrics.gold<100))throw Error('Unreadable quest marker: '+JSON.stringify({state,angle,...metrics}));
    await page.screenshot({path:'/tmp/emberwild-quest-markers-'+state+'-'+angle+'.png'});
   }
  }
  await page.setViewportSize({width:860,height:420});
  const small=await page.evaluate(()=>{
   const T=THREE,r=__markerReview,marker=__markerView.indicators.get('elin').group;r.renderer.setSize(innerWidth,innerHeight,false);r.camera.aspect=innerWidth/innerHeight;r.camera.fov=70;r.camera.updateProjectionMatrix();r.camera.position.set(-8,12,76);r.camera.lookAt(-3,3.9,17);__markerView.updateIndicators(r.camera,innerHeight);__markerWorld.scene.updateMatrixWorld(true);
   const size=marker.children[0].getWorldScale(new T.Vector3()),bottom=marker.getWorldPosition(new T.Vector3()),top=bottom.clone().add(new T.Vector3(0,size.y,0).applyQuaternion(r.camera.quaternion)),pixels=Math.abs(top.project(r.camera).y-bottom.project(r.camera).y)*innerHeight/2;r.renderer.render(__markerWorld.scene,r.camera);return pixels;
  });if(small<47||small>69)throw Error('Resize/zoom lost marker size: '+small);await page.screenshot({path:'/tmp/emberwild-quest-markers-resized.png'});
  console.log('Quest symbols: four statuses, close/mid/far/forest views, fog, resize and zoom passed '+JSON.stringify(measurements));
 }catch(error){await page.screenshot({path:'/tmp/emberwild-quest-markers-failure.png'}).catch(()=>{});throw error;}finally{await page.close();}
}
module.exports={run};
if(require.main===module)(async()=>{const browser=await chromium.launch({headless:true,...(process.env.EMBERWILD_CHROMIUM_PATH?{executablePath:process.env.EMBERWILD_CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']}),errors=[];try{await run(browser,errors);console.log(JSON.stringify({errors}));if(errors.length)process.exitCode=1;}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
