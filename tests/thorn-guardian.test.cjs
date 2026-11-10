const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),T=require('../vendor/three.min.js');
const env={THREE:T};env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/thorn-guardian.js'),'utf8'),env);const create=()=>env.EmberThornGuardian.create(T);
test('the original guardian shares weighted art but owns its pose and materials',()=>{
 const a=create(),b=create();assert.ok(Object.keys(a.joints).length>=40,'body, fingers, eyes and crown are articulated');assert.ok(a.meshes.length<=8,'detailed art stays batched');assert.ok(a.triangles<80000,'bounded mesh budget');assert.equal(a.texture.image.width,512);assert.strictEqual(a.texture,b.texture);
 for(let i=0;i<a.meshes.length;i++){const m=a.meshes[i];assert.ok(m.isSkinnedMesh);assert.strictEqual(m.geometry,b.meshes[i].geometry);assert.notStrictEqual(m.material,b.meshes[i].material);const g=m.geometry;assert.equal(g.attributes.position.count,g.attributes.uv.count);for(let v=0;v<g.attributes.position.count;v++){let sum=0;for(let k=0;k<4;k++){const w=g.attributes.skinWeight.array[v*4+k],ix=g.attributes.skinIndex.array[v*4+k];assert.ok(Number.isFinite(w)&&ix<a.skeleton.bones.length);sum+=w;}assert.ok(Math.abs(sum-1)<1e-5,'weights sum to one');}}
 assert.notStrictEqual(a.joints.head,b.joints.head);assert.ok(new Set(a.texture.image.data).size>80,'the authored grain has tonal detail');
});
test('heavy steps keep support roots planted across frame rates and turns',()=>{
 for(const dt of [1/30,1/120])for(const speed of [2.1,2.8]){
  const a=create(),previous=[],contacts=[];a.update(0);
  for(let f=0;f<170;f++){
   a.group.rotation.y+=.004;a.group.position.x+=Math.sin(a.group.rotation.y)*speed*dt;a.group.position.z+=Math.cos(a.group.rotation.y)*speed*dt;a.update(dt);
   a.legs.forEach((leg,i)=>{const p=leg.foot.getWorldPosition(new T.Vector3());if(leg.contact){assert.ok(Math.abs(p.y-.18)<.015,'support ankle stays grounded');if(contacts[i])assert.ok(p.distanceTo(previous[i])<.035,'support foot does not skate');}previous[i]=p;contacts[i]=leg.contact;});
  }
 }
});
test('windup raises the arms and the resolved impact brings claws down without moving the gameplay root',()=>{
 const a=create();a.group.position.set(4,0,-12);a.group.rotation.y=.8;a.update(0);const position=a.group.position.clone(),q=a.group.quaternion.clone(),idle=a.joints.hand_r.getWorldPosition(new T.Vector3()).y,glow=a.materials.ember.emissiveIntensity;
 for(let f=0;f<60;f++)a.update(1/60,{windup:1.15-f/60});assert.ok(a.motion.warning>.9);assert.ok(a.joints.hand_r.getWorldPosition(new T.Vector3()).y>idle+2,'clear raised-arm warning');assert.ok(a.materials.ember.emissiveIntensity>glow+.5);
 a.attack();a.update(1/120);assert.ok(a.motion.strike>.99);for(const s of ['l','r'])assert.ok(a.joints['hand_'+s].getWorldPosition(new T.Vector3()).y<1.30,'hands reach the impact near the ground');
 assert.ok(a.group.position.distanceTo(position)<1e-8);assert.ok(a.group.quaternion.angleTo(q)<1e-7);for(let f=0;f<90;f++)a.update(1/60);assert.equal(a.motion.strike,0);assert.equal(a.motion.state,'idle');
});
test('hit recoil and glow recover independently; hidden or teleported actors reset tracking',()=>{
 const a=create(),b=create();a.update(.016);const before=b.joints.head.quaternion.clone();a.hit(1,0);for(let f=0;f<7;f++)a.update(1/60);assert.ok(a.motion.recoil>.8);assert.ok(a.materials.wood.emissive.r>0);assert.equal(b.materials.wood.emissive.r,0);assert.ok(b.joints.head.quaternion.angleTo(before)<1e-7);
 a.group.visible=false;a.update(.016);a.group.position.set(-25,0,18);a.group.visible=true;a.update(.016);assert.equal(a.motion.speed,0);assert.equal(a.motion.recoil,0);for(const leg of a.legs)assert.ok(Math.abs(leg.foot.getWorldPosition(new T.Vector3()).y-.18)<.002);
});
test('defeat is a separate noninteractive visual, keeps feet grounded and resets cleanly',()=>{
 const a=create(),scene=new T.Scene();scene.add(a.group);a.group.position.set(-3,0,-53);a.update(0);const position=a.group.position.clone();a.defeat(scene);a.group.visible=false;assert.equal(a.dying,true);assert.notStrictEqual(a.model.parent,a.group);
 for(let f=0;f<90;f++){a.update(1/60);for(const leg of a.legs)assert.ok(Math.abs(leg.foot.getWorldPosition(new T.Vector3()).y-.18)<.002,'roots remain on the floor during collapse');}
 assert.ok(a.motion.defeat>.99);assert.ok(a.materials.ember.emissiveIntensity<.2);assert.ok(a.group.position.distanceTo(position)<1e-8);
 for(let f=0;f<90;f++)a.update(1/60);assert.equal(a.dying,false);assert.strictEqual(a.model.parent,a.group);assert.equal(scene.getObjectByName('DoornwachterDefeat'),undefined);
 a.reset();a.group.visible=true;a.update(0);assert.equal(a.model.visible,true);assert.equal(a.materials.wood.opacity,1);assert.equal(a.materials.wood.transparent,false);assert.equal(a.motion.state,'idle');
});
test('bark fragments reuse geometry/materials and do not consume extra skeletons',()=>{
 const a=env.EmberThornGuardian.fragment(T),b=env.EmberThornGuardian.fragment(T);assert.strictEqual(a.geometry,b.geometry);assert.strictEqual(a.material,b.material);assert.equal(a.isSkinnedMesh,undefined);
});
test('the actual weighted surface clears the floor in idle, windup, impact and defeat',()=>{
 const a=create(),scene=new T.Scene(),v=new T.Vector3();scene.add(a.group);
 function check(){scene.updateMatrixWorld(true);a.skeleton.update();let low=Infinity;for(const mesh of a.meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,v);v.applyMatrix4(mesh.matrixWorld);assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z));low=Math.min(low,v.y);}assert.ok(low>-.04,'wood and claws do not sink through the floor');}
 check();for(let f=0;f<60;f++)a.update(1/60,{windup:1.15-f/60});check();a.attack();a.update(1/120);check();a.defeat(scene);a.group.visible=false;for(let f=0;f<70;f++)a.update(1/60);check();
});
