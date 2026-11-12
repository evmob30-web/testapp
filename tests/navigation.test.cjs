const {test}=require('node:test'),assert=require('node:assert/strict');require('../js/navigation.js');require('../js/dungeon.js');const N=EmberNavigation;
const bounds={minX:-32,maxX:32,minZ:-60,maxZ:31};
test('a direct route stops within interaction range and never teleports to its target',()=>{
 const field=N.createField({bounds}),start={x:0,z:22},goal={x:12,z:9,range:2.6};const path=field.findPath(start,goal);assert.equal(path.length,1);assert.ok(N.distance(path[0],goal)<=2.6);assert.ok(N.distance(path[0],goal)>2.3);assert.deepEqual(field.findPath(path[0],goal),[]);
});
test('A* walks around the actual house-sized obstruction with complete-radius segment clearance',()=>{
 const circles=[{x:-12,z:22,r:4.2},{x:-12,z:11,r:4.2}],field=N.createField({bounds,circles}),start={x:-22,z:23},goal={x:-3,z:17,range:2.8};assert.equal(field.clear(start,goal),false);const path=field.findPath(start,goal);assert.ok(path?.length>1);let previous=start;for(const p of path){assert.ok(field.clear(previous,p));for(let i=0;i<=50;i++){const t=i/50,x=previous.x+(p.x-previous.x)*t,z=previous.z+(p.z-previous.z)*t;assert.ok(circles.every(c=>Math.hypot(x-c.x,z-c.z)>=c.r+.62-1e-7));}previous=p;}assert.ok(N.distance(previous,goal)<=goal.range);assert.ok(field.cachedCells<9000);
});
test('the route cannot cut a diagonal corner, cross a narrow blocked wall or leave bounds',()=>{
 const legal=(x,z)=>!(x>.9&&x<1.1)||z>2,field=N.createField({bounds:{minX:0,maxX:4,minZ:0,maxZ:4},canStand:legal,step:.5});assert.equal(field.clear({x:.5,z:.5},{x:2,z:.5}),false);const path=field.findPath({x:.5,z:.5},{x:3,z:.5,range:.2});assert.ok(path);let p={x:.5,z:.5};for(const q of path){assert.ok(field.clear(p,q));p=q;}assert.ok(path.some(p=>p.z>2));assert.equal(field.stand(-1,1),false);assert.equal(field.stand(NaN,1),false);assert.equal(field.findPath({x:NaN,z:0},{x:1,z:1,range:1}),null);
});
test('closed dungeon doors reject unreachable routes and opening the real gate makes the route legal',()=>{
 const start={x:100,z:-32},goal={x:100,z:-42,range:1},b={minX:86,maxX:114,minZ:-66,maxZ:18};const closed=N.createField({bounds:b,canStand:(x,z,r)=>EmberDungeon.canStand(x,z,false,r)});assert.equal(closed.findPath(start,goal),null);const open=N.createField({bounds:b,canStand:(x,z,r)=>EmberDungeon.canStand(x,z,true,r)}),path=open.findPath(start,goal);assert.ok(path);let p=start;for(const q of path){assert.ok(open.clear(p,q));p=q;}
});
test('unreachable goals are bounded rather than searched forever',()=>{
 const field=N.createField({bounds:{minX:0,maxX:20,minZ:0,maxZ:20},canStand:(x,z)=>x<8||x>12,maxNodes:70});assert.equal(field.findPath({x:2,z:2},{x:18,z:18,range:1}),null);assert.ok(field.cachedCells<650);
});
function controller(options={}){
 const player={x:0,z:0},target={key:'a',identity:'one',position:{x:6,z:0},range:1,label:'NPC'},field=N.createField({bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}}),acts=[],cancels=[];let valid=true,ready=true;
 const nav=N.createController({position:()=>player,resolve:o=>valid&&o.key===target.key?target:null,field:()=>field,canAct:()=>ready,onAct:(t,o)=>acts.push(o.key),onCancel:r=>cancels.push(r),...options});
 function frame(dt=.04){const v=nav.update(dt),step=Math.min(5*dt,v.remaining??0);if(v.x||v.z){const next={x:player.x+v.x*step,z:player.z+v.z*step};if(nav.checkStep(player,next))Object.assign(player,next);}return v;}
 return {player,target,field,nav,acts,cancels,frame,set valid(v){valid=v;},set ready(v){ready=v;}};
}
test('the shared order reaches a legal position and executes exactly one interaction',()=>{
 const e=controller();assert.ok(e.nav.go({key:'a'}));assert.equal(e.nav.state,N.states.MOVING_TO_TARGET);for(let i=0;i<100;i++)e.frame();assert.deepEqual(e.acts,['a']);assert.ok(N.distance(e.player,e.target.position)<=1);assert.equal(e.nav.order,null);for(let i=0;i<100;i++)e.frame();assert.equal(e.acts.length,1);
});
test('manual input stops movement immediately without opening a dialogue',()=>{
 const e=controller();e.nav.go({key:'a'});e.frame();e.nav.cancel('manual');const p={...e.player};for(let i=0;i<30;i++)e.frame();assert.deepEqual(e.player,p);assert.equal(e.nav.state,N.states.CANCELLED);assert.equal(e.acts.length,0);
});
test('disappearing bodies and changing enemy generations cancel their original order',()=>{
 const e=controller();e.nav.go({key:'a'});e.valid=false;e.frame();assert.equal(e.nav.order,null);assert.equal(e.acts.length,0);assert.deepEqual(e.cancels,['invalid']);e.valid=true;e.nav.go({key:'a'});e.target.identity='respawn-two';e.frame();assert.equal(e.nav.order,null);assert.equal(e.acts.length,0);
});
test('rapid replacement cannot execute an earlier order; arrival can safely start a new order',()=>{
 let player={x:0,z:0},calls=[],targets={a:{key:'a',identity:'a',position:{x:0,z:0},range:1},b:{key:'b',identity:'b',position:{x:0,z:0},range:1}};const field=N.createField({bounds:{minX:-2,maxX:2,minZ:-2,maxZ:2}});let nav;
 nav=N.createController({position:()=>player,resolve:o=>targets[o.key],field:()=>field,onAct:(t,o)=>{calls.push(o.key);if(o.key==='b')nav.go({key:'a'});}});nav.go({key:'a'});nav.go({key:'b'});nav.update(.04);assert.deepEqual(calls,['b']);assert.equal(nav.order.key,'a');nav.update(.04);assert.deepEqual(calls,['b','a']);nav.update(.04);assert.equal(calls.length,2);
});
test('an attack waits for the existing cooldown and fires only once',()=>{
 const e=controller();e.player.x=5.5;e.ready=false;e.nav.go({key:'a',action:'primary'});for(let i=0;i<10;i++)e.frame();assert.equal(e.acts.length,0);assert.equal(e.nav.state,N.states.ATTACKING);e.ready=true;e.frame();assert.deepEqual(e.acts,['a']);e.frame();assert.equal(e.acts.length,1);
});
test('a moved target is replanned on a budget while a blocked player stops safely',()=>{
 let plans=0;const e=controller(),find=e.field.findPath;e.field.findPath=(...a)=>{plans++;return find(...a);};e.nav.go({key:'a'});e.target.position.z=5;for(let i=0;i<10;i++)e.frame();assert.equal(plans,1);for(let i=0;i<40;i++)e.frame();assert.ok(plans<=3);const stuck=controller();stuck.nav.go({key:'a'});for(let i=0;i<100;i++)stuck.nav.update(.04);assert.equal(stuck.nav.order,null);assert.ok(stuck.cancels.includes('stuck'));
});
