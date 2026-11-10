/* Original bow, hand poses and arrows. Targets remain separate from avatar previews. */
(function(root){
'use strict';
function attach(T,rig){
 const wood=new T.MeshStandardMaterial({color:'#a18351',roughness:.8}),metal=new T.MeshStandardMaterial({color:'#cfe0c5',metalness:.2,roughness:.5}),fletch=new T.MeshStandardMaterial({color:'#c1dfaf',roughness:.8}),glow=new T.MeshStandardMaterial({color:'#b3f2dc',emissive:'#4c9f85',emissiveIntensity:1});
 const template=new T.Group(),shaft=new T.Mesh(new T.BoxGeometry(.045,.045,.9),wood);template.add(shaft);
 const head=new T.Mesh(new T.ConeGeometry(.1,.28,5),metal);head.rotation.x=Math.PI/2;head.position.z=.55;template.add(head);
 const feathers=new T.Mesh(new T.BoxGeometry(.22,.035,.23),fletch);feathers.position.z=-.35;template.add(feathers);
 const bow=new T.Group();bow.name='WoodlandBow';rig.joints.hand_l.add(bow);bow.position.set(0,-.18,.09);
 const curve=new T.QuadraticBezierCurve3(new T.Vector3(0,-.75,-.35),new T.Vector3(0,0,.35),new T.Vector3(0,.75,-.35));
 const limbs=new T.Mesh(new T.TubeGeometry(curve,18,.045,6,false),wood);bow.add(limbs);
 const grip=new T.Mesh(new T.CylinderGeometry(.058,.058,.19,10),new T.MeshStandardMaterial({color:'#423d39',roughness:.9}));bow.add(grip);
 const stringGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(0,-.75,-.35),new T.Vector3(0,.055,-.35),new T.Vector3(0,.75,-.35)]);
 bow.add(new T.Line(stringGeo,new T.LineBasicMaterial({color:'#efe0b6'})));
 const held=template.clone(true);held.name='NockedArrow';bow.add(held);
 const frame=new T.Quaternion(),handQ=new T.Quaternion(),inverse=new T.Quaternion(),pitchQ=new T.Quaternion(),palm=new T.Vector3(),pole=new T.Vector3(),nock=new T.Vector3(),chest=new T.Vector3(),axis=new T.Vector3(1,0,0);
 const leftTurn=new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI/2,-Math.PI/2)),rightTurn=new T.Quaternion().setFromEuler(new T.Euler(0,-Math.PI/2,Math.PI/2));
 const rightBones=['upper_arm_r','lower_arm_r','hand_r'].map(name=>rig.joints[name]),restRight=rightBones.map(()=>new T.Quaternion());
 let draw=0,recoil=0,aim=0;
 function pose(amount,pitch=0,raised=1){
  rig.resetUpperPose();rig.resetArmPose('r');rig.joints.chest.rotation.y+=(.16+amount*.14)*raised;rig.joints.head.rotation.y-=(.12+amount*.12)*raised;
  rig.group.updateWorldMatrix(true,true);rig.group.getWorldQuaternion(frame);frame.multiply(pitchQ.setFromAxisAngle(axis,pitch*raised));handQ.copy(frame).multiply(leftTurn);
  rig.group.worldToLocal(rig.joints.chest.getWorldPosition(chest));
  palm.set(-.58+.66*raised,chest.y-.65+raised*(.40+amount*.47),.30+raised*(.40+amount*.16)).applyMatrix4(rig.group.matrixWorld);pole.set(-.58-.37*raised,chest.y-.33+raised*.38,-.30+raised*.65).applyMatrix4(rig.group.matrixWorld);
  rig.aimArm('l',palm,pole,handQ);
  rig.joints.hand_l.getWorldQuaternion(inverse).invert();bow.quaternion.copy(inverse).multiply(frame);bow.updateWorldMatrix(true,true);
  const bend=1+amount*.08,nockZ=-.35*bend-amount*.45,nockY=.055+amount*.03;
  limbs.scale.z=bend;stringGeo.attributes.position.setXYZ(0,0,-.75,-.35*bend);stringGeo.attributes.position.setXYZ(1,0,nockY,nockZ);stringGeo.attributes.position.setXYZ(2,0,.75,-.35*bend);stringGeo.attributes.position.needsUpdate=true;
  held.position.set(0,nockY,nockZ+.45);
  if(raised>0){
   rightBones.forEach((bone,i)=>restRight[i].copy(bone.quaternion));
   handQ.copy(frame).multiply(rightTurn);nock.set(0,nockY,nockZ);bow.localToWorld(nock);pole.set(1.05,chest.y-.40+amount*.32,-.45).applyMatrix4(rig.group.matrixWorld);rig.aimArm('r',nock,pole,handQ);
   rightBones.forEach((bone,i)=>{inverse.copy(bone.quaternion);bone.quaternion.copy(restRight[i]).slerp(inverse,raised);});
  }
 }
 function update(charge=0,dt=1/60,rolling=false,pitch=0){
  recoil=Math.max(0,recoil-dt);draw+=(Math.max(0,Math.min(1,charge))-draw)*(1-Math.exp(-18*dt));
  aim+=((charge>0?1:0)-aim)*(1-Math.exp(-14*dt));if(aim<.001)aim=0;
  held.visible=bow.visible&&!rolling&&recoil<=0&&aim>.85;
  if(!bow.visible)return;
  if(rolling){bow.quaternion.copy(leftTurn).invert();return;}
  pose(Math.max(0,draw-Math.sin(recoil/.18*Math.PI)*.1),pitch,aim);
 }
 function prepareShot(power,pitch=0){draw=Math.max(0,Math.min(1,power));aim=1;pose(draw,pitch);held.visible=bow.visible;}
 function muzzle(out=new T.Vector3()){rig.group.updateWorldMatrix(true,true);return held.getWorldPosition(out);}
 function release(){recoil=.18;draw=0;held.visible=false;}
 function arrow(x,z,dx,dz,magical=false){const mesh=template.clone(true);if(magical)mesh.children[1].material=glow;mesh.position.set(x,1.5,z);mesh.rotation.y=Math.atan2(dx,dz);return mesh;}
 bow.visible=false;held.visible=false;
 return {bow,held,wood,update,prepareShot,muzzle,release,arrow};
}
function create(world){
 const T=THREE,view=attach(T,world.player),targetsRoot=new T.Group();world.scene.add(targetsRoot);
 const targets=RPG.bowTargets.map(data=>{const group=new T.Group();group.position.set(data.x,0,data.z);targetsRoot.add(group);const stand=new T.Mesh(new T.BoxGeometry(.16,1.6,.16),view.wood);stand.position.y=.8;group.add(stand);const disk=new T.Mesh(new T.CylinderGeometry(.8,.8,.25,16),new T.MeshStandardMaterial({color:'#c1ac75',roughness:1}));disk.rotation.x=Math.PI/2;disk.position.y=1.7;group.add(disk);const bull=new T.Mesh(new T.TorusGeometry(.4,.1,5,20),new T.MeshStandardMaterial({color:'#b86f57'}));bull.position.set(0,1.7,.15);group.add(bull);return {...data,mesh:group,bull};});
 function sync(state){targetsRoot.visible=state.area==='valley'&&RPG.questVisibility(state).bow;for(const t of targets)t.mesh.visible=targetsRoot.visible;view.bow.visible=state.weapon==='bow';for(const t of targets)t.bull.material.color.set(state.bowPractice.includes(t.id)?'#9ad2b0':'#b86f57');}
 function arrow(...args){const mesh=view.arrow(...args);world.scene.add(mesh);return mesh;}
 return {...view,targets,targetsRoot,sync,arrow};
}
root.EmberArchery={attach,create};
})(typeof window==='undefined'?globalThis:window);
