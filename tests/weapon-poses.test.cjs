const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),T=require('../vendor/three.min.js');
const env={THREE:T};env.window=env;vm.createContext(env);for(const name of ['core','hero-art','character-rig','mage','archery'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8'),env);
test('bow grip, drawing hand and arrow nock line up in a transformed world',()=>{
 const rig=env.EmberCharacterRig.create(T),bow=env.EmberArchery.attach(T,rig),left=rig.joints.hand_l,right=rig.joints.hand_r;bow.bow.visible=true;
 rig.group.position.set(11,0,-24);rig.group.rotation.y=1.7;
 for(const draw of [0,.5,1]){
  rig.animate(draw,false,0,{weapon:'bow'});bow.prepareShot(draw,.12);
  const grip=bow.bow.getWorldPosition(new T.Vector3()),nock=bow.bow.localToWorld(new T.Vector3(0,.055+draw*.03,-.35*(1+draw*.08)-draw*.45)),tail=bow.held.localToWorld(new T.Vector3(0,0,-.45));
  assert.ok(rig.palmWorld('l').distanceTo(grip)<1e-6,'left hand holds the grip');assert.ok(rig.palmWorld('r').distanceTo(nock)<1e-6,'right hand draws the string');assert.ok(tail.distanceTo(nock)<1e-6,'arrow tail stays on the string');
  assert.ok(bow.muzzle().distanceTo(bow.held.getWorldPosition(new T.Vector3()))<1e-6);assert.strictEqual(left,rig.joints.hand_l);assert.strictEqual(right,rig.joints.hand_r);
 }
 const before=bow.muzzle();for(let i=0;i<90;i++)bow.prepareShot(1,.12);assert.ok(bow.muzzle().distanceTo(before)<1e-8,'repeated aiming does not accumulate rotations');
 bow.release();assert.equal(bow.held.visible,false);bow.update(1,.2,false);assert.equal(bow.held.visible,true);bow.update(1,.1,true);assert.equal(bow.held.visible,false,'roll hides the nocked arrow');
});
test('bow lowers beside the body and the drawing arm returns to rest after aiming',()=>{
 const rig=env.EmberCharacterRig.create(T),bow=env.EmberArchery.attach(T,rig);bow.bow.visible=true;rig.group.rotation.y=-.8;
 for(const raised of [false,true,false]){
  for(let f=0;f<90;f++){rig.animate(f/60,false,0,{weapon:'bow'});bow.update(raised?1:0,1/60);}
  assert.ok(bow.bow.getWorldPosition(new T.Vector3()).distanceTo(rig.palmWorld('l'))<1e-6,'grip stays inside the left hand');
  if(raised){assert.equal(bow.held.visible,true);continue;}
  assert.equal(bow.held.visible,false,'no floating arrow while the bow is lowered');
  for(const side of ['l','r']){
   const shoulder=rig.group.worldToLocal(rig.joints['upper_arm_'+side].getWorldPosition(new T.Vector3())),elbow=rig.group.worldToLocal(rig.joints['lower_arm_'+side].getWorldPosition(new T.Vector3())),hand=rig.group.worldToLocal(rig.joints['hand_'+side].getWorldPosition(new T.Vector3()));
   assert.ok(hand.y<shoulder.y-.75,'hand lowers beside the hip');assert.ok(Math.abs(elbow.x-shoulder.x)<.14,'elbow does not flare outward');
  }
 }
});
test('sword and staff cross the fingers at the grip with relaxed elbows',()=>{
 for(const weapon of ['sword','staff']){
  const rig=env.EmberCharacterRig.create(T),mage=env.EmberMage.attach(T,rig);mage.setClass(weapon==='staff'?'mage':'guardian');
  rig.group.position.set(7,0,-3);rig.group.rotation.y=2.1;rig.animate(.7,false,0,{weapon});mage.update(0,.7);
  const grip=weapon==='sword'?rig.guard.getObjectByName('sword_grip'):mage.staff;
  assert.ok(grip.getWorldPosition(new T.Vector3()).distanceTo(rig.palmWorld('r'))<1e-6,'weapon crosses the gripping fingers');
  const axis=new T.Vector3(0,1,0).applyQuaternion(grip.getWorldQuaternion(new T.Quaternion())),fingerAxis=new T.Vector3(0,-1,0).applyQuaternion(rig.joints.hand_r.getWorldQuaternion(new T.Quaternion()));
  assert.ok(Math.abs(axis.dot(fingerAxis))<.01,'handle runs across the fist, perpendicular to the fingers');
  const shoulder=rig.group.worldToLocal(rig.joints.upper_arm_r.getWorldPosition(new T.Vector3())),elbow=rig.group.worldToLocal(rig.joints.lower_arm_r.getWorldPosition(new T.Vector3()));
  assert.ok(elbow.y<shoulder.y-.45&&Math.abs(elbow.x-shoulder.x)<.14,'elbow stays close to the torso');
  if(weapon==='staff')assert.ok(axis.y>.99,'staff remains upright');
 }
});
test('staff muzzle follows the actual crystal and casting poses do not accumulate',()=>{
 const rig=env.EmberCharacterRig.create(T),mage=env.EmberMage.attach(T,rig);mage.setClass('mage');mage.setWeapon('staff');rig.group.position.set(-8,0,12);rig.group.rotation.y=-1.1;rig.animate(0,false,0,{weapon:'staff'});mage.update(0,0);
 const idle=mage.muzzle();assert.ok(idle.distanceTo(mage.gem.getWorldPosition(new T.Vector3()))<1e-8);
 mage.cast('frost');mage.update(.15,.15);const cast=mage.muzzle();assert.ok(idle.distanceTo(cast)>.1,'cast pose moves the staff');
 for(let i=0;i<90;i++)mage.update(0,.15);assert.ok(mage.muzzle().distanceTo(cast)<1e-8,'repeated casting updates keep the same pose');
 rig.animate(.3,true,0,{roll:.4,weapon:'staff'});const tucked=rig.joints.upper_arm_r.quaternion.clone();mage.update(.1,.3);assert.ok(tucked.angleTo(rig.joints.upper_arm_r.quaternion)<1e-6,'staff pose respects the roll');
});
