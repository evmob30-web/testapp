const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const THREE=require('../vendor/three.min.js');

function makeRig(){
 const sandbox={THREE};sandbox.window=sandbox;vm.createContext(sandbox);
 for(const file of ['hero-art','character-rig'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+file+'.js'),'utf8'),sandbox);
 return sandbox.EmberCharacterRig.create(THREE);
}
test('shared character rig exposes stable named joints and equipment anchors',()=>{
 const rig=makeRig();
 for(const name of ['root','hips','spine','chest','neck','head','upper_arm_l','lower_arm_l','hand_l','upper_arm_r','lower_arm_r','hand_r','upper_leg_l','lower_leg_l','foot_l','upper_leg_r','lower_leg_r','foot_r','weapon_r','back']){
   assert.ok(rig.joints[name],name+' is required');
   assert.ok(rig.joints[name].isBone);
 }
 assert.equal(rig.model.parent,rig.group);
 assert.ok(rig.skeleton instanceof THREE.Skeleton);
 assert.ok(rig.blade.parent===rig.joints.weapon_r);
 assert.ok(rig.guard.parent===rig.joints.weapon_r);
 assert.ok(rig.body.isMesh);
});
test('skin swaps preserve joint identities and basic animation works',()=>{
 const rig=makeRig();
 const arm=rig.joints.upper_arm_r;
 const initial=rig.body.material.color.getHex();
 rig.setSkin('flame_guardian');
 assert.notEqual(rig.body.material.color.getHex(),initial);
 assert.strictEqual(rig.joints.upper_arm_r,arm);
 rig.animate(.5,true,0);
 assert.notEqual(rig.left.rotation.x,0);
 for(let i=1;i<=28;i++)rig.animate(.5+i/60,false,0);
 assert.ok(Math.abs(rig.left.rotation.x)<.015,'legs settle when idle');
 rig.animate(.5,false,.2);
 assert.notEqual(rig.arm.rotation.x,0);
});

test('shared base uses rounded torso, face and tapered limbs instead of primitive cubes',()=>{
 const rig=makeRig();
 assert.equal(rig.body.geometry.type,'SphereGeometry');
 assert.equal(rig.body.material.flatShading,false);
 const thigh=rig.joints.upper_leg_l.getObjectByName('thigh_l');
 assert.equal(thigh.geometry.type,'CylinderGeometry');
 assert.equal(rig.joints.head.getObjectByName('face').geometry.type,'SphereGeometry');
 assert.ok(rig.joints.upper_arm_r.getObjectByName('upper_arm_mesh_r').geometry.type==='CylinderGeometry');
 const attach=rig.joints.weapon_r;
 rig.animate(.6,true,.25);
 assert.strictEqual(attach,rig.blade.parent);
});

test('idle breath, walk/run cadence and attack settle without damaging bone sockets',()=>{
 const rig=makeRig();
 const initialY=rig.body.scale.y;
 rig.animate(.016,false,0);
 rig.animate(.36,false,0);
 assert.notEqual(rig.body.scale.y,initialY,'subtle breathing while idle');
 const left=rig.joints.upper_leg_l;
 const arm=rig.joints.upper_arm_r;
 for(let i=1;i<=18;i++)rig.animate(.36+i/60,true,0,{running:false});
 const walking=Math.abs(left.rotation.x);
 assert.ok(walking>.03,'walk gait swings legs');
 const handSocket=rig.joints.weapon_r;
 for(let i=19;i<=36;i++)rig.animate(.36+i/60,true,0,{running:true});
 assert.ok(Math.abs(left.rotation.x)<=1,'run gait remains bounded');
 rig.animate(1.0,true,.21,{running:true});
 assert.ok(arm.rotation.x<-.8,'sword arm swings forward');
 for(let i=1;i<=80;i++)rig.animate(1+i/60,false,0);
 assert.ok(Math.abs(left.rotation.x)<.01,'idle legs return to rest');
 assert.ok(Math.abs(arm.rotation.z-.17)<.01,'sword arm returns to rest');
 assert.strictEqual(rig.blade.parent,handSocket);
});
