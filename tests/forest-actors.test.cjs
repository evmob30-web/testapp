const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),T=require('../vendor/three.min.js');
const env={THREE:T};env.window=env;vm.createContext(env);for(const file of ['hero-art','character-rig','appearance','forest-actors'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),env);
const actors=env.EmberForestActors;
const pawLevel=wolf=>-.1-wolf.group.getObjectByName('wolf_paw').geometry.boundingBox.min.y;
function sole(leg){const mesh=leg.paw.children[0];return mesh.localToWorld(new T.Vector3(0,mesh.geometry.boundingBox.min.y,0));}
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
   wolf.legs.forEach((leg,index)=>{const p=leg.paw.getWorldPosition(new T.Vector3());if(leg.contact){assert.ok(Math.abs(p.y-pawLevel(wolf))<.015,'support paw stays on the floor');if(contacts[index])assert.ok(p.distanceTo(previous[index])<.03,'support paw does not slide');}previous[index]=p;contacts[index]=leg.contact;});
  }
 }
});
test('wolf windup, bite and recoil are visible without changing its gameplay transform',()=>{
 const wolf=actors.createWolf(T);wolf.group.position.set(6,0,-12);wolf.group.rotation.y=.8;wolf.update(.02);const idle=wolf.joints.wolf_spine.position.y,position=wolf.group.position.clone(),yaw=wolf.group.rotation.y;
 wolf.update(.02,{pendingAttack:'melee',telegraph:.08});assert.ok(wolf.joints.wolf_spine.position.y<idle-.1,'warning crouch');assert.ok(wolf.joints.wolf_jaw.rotation.x>.3,'warning snarl');
 wolf.attack();wolf.update(.01);assert.ok(wolf.motion.strike>.9,'bite is extended when the attack resolves');assert.ok(wolf.model.position.z>.15);wolf.hit(1,0);wolf.update(.09);assert.notEqual(wolf.joints.wolf_head.rotation.z,0,'head flinches on hit');
 for(let i=0;i<60;i++)wolf.update(1/60);assert.ok(wolf.joints.wolf_jaw.rotation.x<.03);assert.ok(Math.abs(wolf.model.position.z)<.001,'bite extension returns to rest');for(const leg of wolf.legs)assert.ok(Math.abs(sole(leg).y+.1)<.006,'resting paws touch the terrain');assert.ok(position.distanceTo(wolf.group.position)<1e-8);assert.equal(wolf.group.rotation.y,yaw);
});
test('hidden and teleported wolves reset visual tracking instead of carrying old attacks',()=>{
 const wolf=actors.createWolf(T);wolf.attack();wolf.update(.02);wolf.group.visible=false;wolf.update(.02);wolf.group.position.set(-20,0,13);wolf.group.visible=true;wolf.update(.02);assert.equal(wolf.motion.strike,0);assert.equal(wolf.motion.speed,0);
 for(const leg of wolf.legs)assert.ok(Math.abs(leg.paw.getWorldPosition(new T.Vector3()).y-pawLevel(wolf))<.015);wolf.hit();wolf.reset();wolf.update(.02);assert.ok(Math.abs(wolf.joints.wolf_head.rotation.z)<1e-6);
});
test('slow wandering and tight curves retain real sole contact instead of unreachable, floating paws',()=>{
 for(const coat of ['gray','shadow'])for(const dt of [1/30,1/120])for(const speed of [.3,.65,1]){
  const wolf=actors.createWolf(T,{coat});
  for(let frame=0;frame<6/dt;frame++){
   wolf.group.rotation.y+=.8*dt;wolf.group.position.x+=Math.sin(wolf.group.rotation.y)*speed*dt;wolf.group.position.z+=Math.cos(wolf.group.rotation.y)*speed*dt;wolf.update(dt);
   let support=0;for(const leg of wolf.legs){if(leg.contact){support++;assert.ok(Math.abs(sole(leg).y+.1)<.006,'support sole reaches the actual terrain');}const hip=leg.upper.getWorldPosition(new T.Vector3()),knee=leg.lower.getWorldPosition(new T.Vector3());assert.ok(knee.y<hip.y,'knees remain below the body');}
   assert.ok(support>=1,'walking never becomes an airborne pose');
  }
 }
});
test('walk, trot, tight turns and stopping keep low, continuous steps and finish with four planted paws',()=>{
 for(const dt of [1/30,1/120]){
  const wolf=actors.createWolf(T),previous=[];
  for(let frame=0;frame<12/dt;frame++){
   const time=frame*dt,speed=time<1?0:time<4?.65:time>=5&&time<5.07?0:time<7?3.3:time<8?3.3*(8-time):0,turn=time<5?.8:time<7?-2:0;
   wolf.group.rotation.y+=turn*dt;wolf.group.position.x+=Math.sin(wolf.group.rotation.y)*speed*dt;wolf.group.position.z+=Math.cos(wolf.group.rotation.y)*speed*dt;wolf.update(dt);
   let lowest=Infinity;wolf.legs.forEach((leg,i)=>{const p=sole(leg);lowest=Math.min(lowest,p.y);assert.ok(p.y<.025,'steps remain close to the floor');if(previous[i])assert.ok(Math.abs(p.y-previous[i].y)<2.2*dt,'no vertical foot snap when starting or stopping');if(leg.contact)assert.ok(Math.abs(p.y+.1)<.006,JSON.stringify({dt,time,leg:i,sole:p.toArray(),target:leg.target.toArray(),hip:leg.upper.getWorldPosition(new T.Vector3()).toArray(),drop:wolf.model.position.y,progress:leg.progress}));previous[i]=p;});assert.ok(lowest<-.09,'a real supporting paw stays on the floor');
  }
  assert.ok(wolf.legs.every(leg=>leg.contact));for(const leg of wolf.legs)assert.ok(Math.abs(sole(leg).y+.1)<.002);
 }
});
test('idle and respawn align the paw soles with the ground for both coats and translated roots',()=>{
 for(const coat of ['shadow','gray']){
  const wolf=actors.createWolf(T,{coat});wolf.group.position.set(22,.4,-12);
  for(let frame=0;frame<180;frame++){wolf.update(1/60);for(const leg of wolf.legs)assert.ok(Math.abs(sole(leg).y-.3)<.003,'idle feet do not float with body breathing');}
  wolf.reset();wolf.group.position.set(-12,0,8);wolf.update(1/60);for(const leg of wolf.legs)assert.ok(Math.abs(sole(leg).y+.1)<.003);
 }
});
test('Elin gestures, faces nearby players and settles while retaining stationary feet and a fallback',async()=>{
 const elin=actors.createElin(T);assert.equal(await elin.ready,false,'procedural model works without the asset loader');assert.ok(elin.group.getObjectByName('elin_oak_brooch'));assert.ok(elin.group.getObjectByName('ElinQuiver'));assert.ok(elin.group.getObjectByName('ElinStowedBow'));assert.equal(elin.blade.visible,false);
 elin.group.position.set(-3,0,17);for(let i=0;i<60;i++)elin.update(1/60,{x:-3,z:19});assert.ok(Math.abs(elin.group.rotation.y)<.02,'faces the player');const hand=elin.palmWorld('l'),localHand=elin.group.worldToLocal(hand.clone());elin.setTalking(true);for(let i=0;i<60;i++)elin.update(1/60,{x:-3,z:19});assert.ok(elin.palmWorld('l').distanceTo(hand)>.25,'speaking gesture moves the hand');assert.ok(elin.talkBlend>.9);
 assert.deepEqual(elin.group.position.toArray(),[-3,0,17]);for(const side of ['l','r'])assert.ok(Math.abs(elin.joints['foot_'+side].getWorldPosition(new T.Vector3()).y+.02)<.002);
 elin.setTalking(false);for(let i=0;i<120;i++)elin.update(1/60,{x:30,z:20});assert.ok(elin.talkBlend<.001);assert.ok(Math.abs(elin.group.rotation.y-.6)<.02);assert.ok(elin.group.worldToLocal(elin.palmWorld('l')).distanceTo(localHand)<.12);
});
