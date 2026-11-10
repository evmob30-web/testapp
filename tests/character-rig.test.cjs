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
 assert.ok(rig.motion.contacts.every(Boolean),'both soles settle on the floor');
 assert.ok(Math.abs(rig.joints.foot_l.getWorldPosition(new THREE.Vector3()).y+.02)<.001,'idle ankle stays on the ground');
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
 assert.ok(arm.rotation.x<-.25,'sword arm swings forward');
 for(let i=1;i<=80;i++)rig.animate(1+i/60,false,0);
 assert.ok(rig.motion.contacts.every(Boolean),'idle feet return to planted contacts');
 assert.ok(Math.abs(rig.joints.foot_r.getWorldPosition(new THREE.Vector3()).y+.02)<.001,'breathing does not lift the planted foot');
 const shoulder=arm.getWorldPosition(new THREE.Vector3()),elbow=rig.joints.lower_arm_r.getWorldPosition(new THREE.Vector3());
 assert.ok(elbow.y<shoulder.y-.55&&Math.abs(elbow.x-shoulder.x)<.05,'sword arm returns close to the body');
 assert.strictEqual(rig.blade.parent,handSocket);
});

test('relaxed arms hang beside the torso with both palms facing inward',()=>{
 const rig=makeRig();rig.group.position.set(8,0,-12);rig.group.rotation.y=1.4;
 for(const weapon of ['none','sword','bow','staff'])for(const time of [0,1.6,8]){
  rig.animate(time,false,0,{weapon});const inverse=rig.group.getWorldQuaternion(new THREE.Quaternion()).invert();
  for(const [side,sign]of [['l',-1],['r',1]]){
   const shoulder=rig.group.worldToLocal(rig.joints['upper_arm_'+side].getWorldPosition(new THREE.Vector3()));
   const elbow=rig.group.worldToLocal(rig.joints['lower_arm_'+side].getWorldPosition(new THREE.Vector3()));
   const wrist=rig.group.worldToLocal(rig.joints['hand_'+side].getWorldPosition(new THREE.Vector3()));
   const normal=new THREE.Vector3(0,0,1).applyQuaternion(rig.joints['hand_'+side].getWorldQuaternion(new THREE.Quaternion())).applyQuaternion(inverse);
   assert.ok(elbow.y<shoulder.y-.55&&Math.abs(elbow.x-shoulder.x)<.05,'elbow hangs below the shoulder');
   assert.ok(wrist.y<shoulder.y-1&&Math.abs(wrist.x-shoulder.x)<.08,'wrist stays beside the hip');
   assert.ok(normal.x*sign<-.98,'palm faces the thigh');
  }
 }
});

test('distance-driven feet stay planted through walking, running and gentle turns',()=>{
 for(const dt of [1/30,1/120])for(const [speed,direction]of [[5,0],[8.25,0],[3.5,Math.PI],[3.5,Math.PI/2]]){
  const rig=makeRig(),previous=[],wasContact=[];
  rig.animate(0,false,0,{dt,worldMotion:true});
  for(let frame=1;frame<180;frame++){
   rig.group.rotation.y+=.007;
   rig.group.position.x+=Math.sin(rig.group.rotation.y+direction)*speed*dt;
   rig.group.position.z+=Math.cos(rig.group.rotation.y+direction)*speed*dt;
   rig.animate(frame*dt,true,0,{dt,worldMotion:true,running:speed>5});
   for(const [i,side]of ['l','r'].entries()){
    const foot=rig.joints['foot_'+side].getWorldPosition(new THREE.Vector3());
    if(rig.motion.contacts[i]){
     assert.ok(Math.abs(foot.y+.02)<.012,'support ankle stays at floor height');
     if(wasContact[i])assert.ok(foot.distanceTo(previous[i])<.025,'support sole does not skate along the ground');
    }
    previous[i]=foot;wasContact[i]=rig.motion.contacts[i];
   }
  }
 }
});
test('blocked movement settles and teleports reset foot anchors without stretching bones',()=>{
 const rig=makeRig();for(let i=0;i<80;i++)rig.animate(i/60,true,0,{dt:1/60,worldMotion:true,running:true});
 assert.equal(rig.motion.speed,0);assert.ok(rig.motion.locomotion<.001,'input against a wall does not run in place');
 rig.group.position.set(100,0,-60);rig.group.rotation.y=2.5;rig.resetMotion();rig.animate(2,false,0,{dt:1/60,worldMotion:true});
 for(const side of ['l','r']){
  const p=rig.group.worldToLocal(rig.joints['foot_'+side].getWorldPosition(new THREE.Vector3()));
  assert.ok(Math.abs(p.y+.02)<.001);assert.ok(Math.abs(p.z-.08)<.001);
 }
});
test('roll turns forward, tucks limbs and returns to a grounded pose',()=>{
 const rig=makeRig();let angle=-1;
 for(let frame=0;frame<=24;frame++){
  const p=frame/24;rig.animate(frame/60,true,0,{dt:1/60,roll:p});
  assert.ok(rig.model.rotation.x>=angle,'forward rotation never reverses');angle=rig.model.rotation.x;
  assert.equal(rig.motion.rolling,true);assert.ok(rig.motion.contacts.every(c=>!c));
  if(p===.5)assert.ok(rig.joints.lower_leg_l.rotation.x>2,'knees tuck during the roll');
 }
 rig.animate(.5,false,0,{dt:1/60});assert.equal(rig.model.rotation.x,0);assert.equal(rig.motion.rolling,false);
 for(const side of ['l','r'])assert.ok(Math.abs(rig.joints['foot_'+side].getWorldPosition(new THREE.Vector3()).y+.02)<.001);
});
