const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),T=require('../vendor/three.min.js');
const env={THREE:T};env.window=env;vm.createContext(env);for(const file of ['hero-art','character-rig','appearance','forest-actors'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),env);
const actors=env.EmberForestActors;
test('wolves share immutable art but own their bones and remain lightweight',()=>{
 const a=actors.createWolf(T),b=actors.createWolf(T);assert.equal(a.legs.length,4);assert.strictEqual(a.group.getObjectByName('wolf_coat').geometry,b.group.getObjectByName('wolf_coat').geometry);assert.notStrictEqual(a.joints.wolf_jaw,b.joints.wolf_jaw);
 let meshes=0;a.group.traverse(m=>{if(m.isMesh)meshes++;});assert.ok(meshes<=24,'bounded draw calls for four wolves');
 const before=b.joints.wolf_jaw.quaternion.clone();a.attack();a.update(.02);assert.ok(a.joints.wolf_jaw.rotation.x>.4);assert.ok(before.angleTo(b.joints.wolf_jaw.quaternion)<1e-7);
});
test('wolf support paws stay planted through different speeds and frame steps',()=>{
 for(const dt of [1/30,1/120])for(const speed of [2,3.3]){
  const wolf=actors.createWolf(T),previous=[],contacts=[];
  for(let i=0;i<150;i++){
   wolf.group.rotation.y+=.004;wolf.group.position.x+=Math.sin(wolf.group.rotation.y)*speed*dt;wolf.group.position.z+=Math.cos(wolf.group.rotation.y)*speed*dt;wolf.update(dt);
   wolf.legs.forEach((leg,index)=>{const p=leg.paw.getWorldPosition(new T.Vector3());if(leg.contact){assert.ok(Math.abs(p.y-.045)<.015,'support paw stays on the floor');if(contacts[index])assert.ok(p.distanceTo(previous[index])<.03,'support paw does not slide');}previous[index]=p;contacts[index]=leg.contact;});
  }
 }
});
test('wolf windup, bite and recoil are visible without changing its gameplay transform',()=>{
 const wolf=actors.createWolf(T);wolf.group.position.set(6,0,-12);wolf.group.rotation.y=.8;wolf.update(.02);const idle=wolf.joints.wolf_spine.position.y,position=wolf.group.position.clone(),yaw=wolf.group.rotation.y;
 wolf.update(.02,{pendingAttack:'melee',telegraph:.08});assert.ok(wolf.joints.wolf_spine.position.y<idle-.1,'warning crouch');assert.ok(wolf.joints.wolf_jaw.rotation.x>.3,'warning snarl');
 wolf.attack();wolf.update(.01);assert.ok(wolf.motion.strike>.9,'bite is extended when the attack resolves');assert.ok(wolf.model.position.z>.15);wolf.hit(1,0);wolf.update(.09);assert.notEqual(wolf.joints.wolf_head.rotation.z,0,'head flinches on hit');
 for(let i=0;i<60;i++)wolf.update(1/60);assert.ok(wolf.joints.wolf_jaw.rotation.x<.03);assert.ok(wolf.model.position.length()<.001);assert.ok(position.distanceTo(wolf.group.position)<1e-8);assert.equal(wolf.group.rotation.y,yaw);
});
test('hidden and teleported wolves reset visual tracking instead of carrying old attacks',()=>{
 const wolf=actors.createWolf(T);wolf.attack();wolf.update(.02);wolf.group.visible=false;wolf.update(.02);wolf.group.position.set(-20,0,13);wolf.group.visible=true;wolf.update(.02);assert.equal(wolf.motion.strike,0);assert.equal(wolf.motion.speed,0);
 for(const leg of wolf.legs)assert.ok(Math.abs(leg.paw.getWorldPosition(new T.Vector3()).y-.045)<.015);wolf.hit();wolf.reset();wolf.update(.02);assert.ok(Math.abs(wolf.joints.wolf_head.rotation.z)<1e-6);
});
test('Elin gestures, faces nearby players and settles while retaining stationary feet and a fallback',async()=>{
 const elin=actors.createElin(T);assert.equal(await elin.ready,false,'procedural model works without the asset loader');assert.ok(elin.group.getObjectByName('elin_oak_brooch'));assert.ok(elin.group.getObjectByName('ElinQuiver'));assert.ok(elin.group.getObjectByName('ElinStowedBow'));assert.equal(elin.blade.visible,false);
 elin.group.position.set(-3,0,17);for(let i=0;i<60;i++)elin.update(1/60,{x:-3,z:19});assert.ok(Math.abs(elin.group.rotation.y)<.02,'faces the player');const hand=elin.palmWorld('l'),localHand=elin.group.worldToLocal(hand.clone());elin.setTalking(true);for(let i=0;i<60;i++)elin.update(1/60,{x:-3,z:19});assert.ok(elin.palmWorld('l').distanceTo(hand)>.25,'speaking gesture moves the hand');assert.ok(elin.talkBlend>.9);
 assert.deepEqual(elin.group.position.toArray(),[-3,0,17]);for(const side of ['l','r'])assert.ok(Math.abs(elin.joints['foot_'+side].getWorldPosition(new T.Vector3()).y+.02)<.002);
 elin.setTalking(false);for(let i=0;i<120;i++)elin.update(1/60,{x:30,z:20});assert.ok(elin.talkBlend<.001);assert.ok(Math.abs(elin.group.rotation.y-.6)<.02);assert.ok(elin.group.worldToLocal(elin.palmWorld('l')).distanceTo(localHand)<.12);
});
