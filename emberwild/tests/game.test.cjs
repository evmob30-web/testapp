const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');const RealThree=require('../vendor/three.min.js');
test('3D world and full gameplay: quests, combat, inventory, pause, saving and new game',()=>{
 const handlers={},elements={},stored={};const ctx=new Proxy({},{get:()=>()=>{}});
 function element(){return {hidden:false,style:{},textContent:'',width:512,height:128,addEventListener(name,fn){(this.events??={})[name]=fn;},getContext:()=>ctx,appendChild(){},setPointerCapture(){}};}
 const get=id=>elements[id]??=element();let callback,ms=0,s,world,renderCount=0;
 class Renderer{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(scene,camera){assert.ok(scene.isScene);assert.ok(camera.isPerspectiveCamera);renderCount++;}}
 const sandbox={console,THREE:{...RealThree,WebGLRenderer:Renderer},devicePixelRatio:1,innerWidth:1280,innerHeight:720,HTMLButtonElement:class{},document:{getElementById:get,createElement:element,addEventListener(n,fn){handlers[n]=fn;}},localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},requestAnimationFrame:fn=>callback=fn,addEventListener:(n,fn)=>handlers[n]=fn};sandbox.window=sandbox;vm.createContext(sandbox);
 const load=n=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+n+'.js'),'utf8'),sandbox);
 load('core');const fresh=sandbox.RPG.fresh;sandbox.RPG.fresh=()=>s=fresh();load('world');const create=sandbox.EmberWorld.createWorld;sandbox.EmberWorld.createWorld=()=>world=create();load('game');
 const tick=(n=1)=>{for(let i=0;i<n;i++){ms+=1000/60;callback(ms);}};const key=code=>{handlers.keydown({code,target:{},preventDefault(){}});handlers.keyup({code});};
 tick();assert.ok(renderCount>0);assert.ok(world.scene.children.length>100);get('play').onclick();tick();assert.equal(get('overlay').hidden,true);
 s.x=-3;s.z=18;tick();key('KeyE');assert.equal(get('dialog').hidden,false);get('dialog-action').onclick();assert.equal(s.quest,1);
 // Defeat three wolves with actual attack input and cooldown updates.
 for(const id of ['w1','w2','w3']){const enemy=world.enemies.find(e=>e.id===id);s.x=enemy.homeX;s.z=enemy.homeZ+1;tick();for(let i=0;i<4&&enemy.mesh.visible;i++){key('Digit1');tick(32);}assert.ok(s.kills.includes(id));}
 s.x=-3;s.z=18;tick();key('KeyE');get('dialog-action').onclick();assert.equal(s.quest,2);
 for(const c of world.crystals){s.x=c.x;s.z=c.z;tick();key('KeyE');}assert.equal(s.crystals.length,3);
 s.x=-3;s.z=18;tick();key('KeyE');get('dialog-action').onclick();assert.equal(s.quest,3);
 const boss=world.enemies.find(e=>e.boss);s.x=0;s.z=-51;tick();for(let i=0;i<15&&boss.mesh.visible;i++){s.hp=200;key('Digit1');tick(32);}assert.ok(s.kills.includes('boss'));assert.equal(s.quest,4);
 s.x=-3;s.z=18;tick();key('KeyE');get('dialog-action').onclick();assert.equal(s.quest,5);assert.equal(JSON.parse(stored['emberwild-save-v1']).quest,5);
 key('KeyI');assert.equal(get('inventory').hidden,false);key('Escape');assert.equal(get('inventory').hidden,true);
 key('Escape');assert.equal(get('overlay').hidden,false);get('new').onclick();assert.equal(get('dialog').hidden,false);get('dialog-action').onclick();assert.equal(s.quest,0);assert.equal(s.kills.length,0);
 // Death returns to town, preserves quest, costs only available gold.
 s.hp=-1;s.x=25;s.z=-40;s.gold=3;tick();assert.equal(s.x,0);assert.equal(s.z,22);assert.equal(s.gold,0);assert.equal(s.hp,100);
 world.scene.traverse(o=>{assert.ok(Number.isFinite(o.position.x));assert.ok(Number.isFinite(o.position.y));assert.ok(Number.isFinite(o.position.z));});
});
