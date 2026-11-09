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
 bow.release();assert.equal(bow.held.visible,false);bow.update(0,.2,false);assert.equal(bow.held.visible,true);bow.update(1,.1,true);assert.equal(bow.held.visible,false,'roll hides the nocked arrow');
});
test('staff muzzle follows the actual crystal and casting poses do not accumulate',()=>{
 const rig=env.EmberCharacterRig.create(T),mage=env.EmberMage.attach(T,rig);mage.setClass('mage');mage.setWeapon('staff');rig.group.position.set(-8,0,12);rig.group.rotation.y=-1.1;rig.animate(0,false,0,{weapon:'staff'});mage.update(0,0);
 const idle=mage.muzzle();assert.ok(idle.distanceTo(mage.gem.getWorldPosition(new T.Vector3()))<1e-8);
 mage.cast('frost');mage.update(.15,.15);const cast=mage.muzzle();assert.ok(idle.distanceTo(cast)>.1,'cast pose moves the staff');
 for(let i=0;i<90;i++)mage.update(0,.15);assert.ok(mage.muzzle().distanceTo(cast)<1e-8,'repeated casting updates keep the same pose');
 rig.animate(.3,true,0,{roll:.4,weapon:'staff'});const tucked=rig.joints.upper_arm_r.quaternion.clone();mage.update(.1,.3);assert.ok(tucked.angleTo(rig.joints.upper_arm_r.quaternion)<1e-6,'staff pose respects the roll');
});
