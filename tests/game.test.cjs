const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('full game lifecycle, rendering calls, input, stars, fall, pause and portal',()=>{
 const events={},elements={},gradient={addColorStop(){}};const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
 const el=id=>elements[id]??=( {setAttribute(){},parentElement:{classList:{add(){},remove(){}}},hidden:false,style:{},textContent:'',addEventListener(){},getContext:()=>ctx});let callback,game;
 const sandbox={console,Math,Set,document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){}},requestAnimationFrame:fn=>callback=fn};sandbox.window=sandbox;sandbox.addEventListener=(name,fn)=>events[name]=fn;vm.createContext(sandbox);
 for(const f of ['level','physics','renderer','audio','records'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+f+'.js'),'utf8'),sandbox);
 const render=sandbox.StarRenderer.render;sandbox.StarRenderer.render=(ctx,g,t)=>{game=g;render(ctx,g,t);};vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8'),sandbox);
 let ms=0;const tick=(n=1)=>{for(let i=0;i<n;i++){ms+=1000/60;callback(ms);}};const key=(code,repeat=false)=>events.keydown({code,repeat,preventDefault(){}});tick();assert.equal(el('overlay').hidden,false);el('primary').onclick();tick(30);assert.ok(game.player.grounded);assert.equal(el('overlay').hidden,true);
 key('Space');tick(5);assert.equal(game.player.animation,'jump');events.keyup({code:'Space'});tick(75);assert.ok(game.player.grounded);
 key('Escape');const elapsed=game.elapsed;tick(30);assert.equal(game.elapsed,elapsed);assert.equal(el('title').textContent,'Pauze');key('Escape');tick();assert.ok(game.elapsed>elapsed);
 const s=game.level.stars[0];game.player.x=s.x-13;game.player.y=s.y-18;tick();assert.equal(game.collected.size,1);
 game.player.y=900;tick();assert.equal(game.falls,1);assert.equal(game.collected.size,0);assert.equal(game.camera,0);
 const portal=game.level.portal;game.player.x=portal.x;game.player.y=portal.y-36;game.player.vy=0;tick();assert.equal(el('title').textContent,'Je schittert.');assert.equal(el('overlay').hidden,false);el('primary').onclick();tick();assert.equal(game.falls,0);assert.equal(el('overlay').hidden,true);
 key('KeyD');tick(20);assert.ok(game.player.x>95);events.blur();assert.equal(el('title').textContent,'Pauze');
});
