const {test}=require('node:test'),assert=require('node:assert/strict'),T=require('../vendor/three.min.js');
require('../js/grove-creatures.js');
const spirit=()=>EmberGroveCreatures.createSpirit(T),mother=()=>EmberGroveCreatures.createRootMother(T);
test('original grove creatures share bounded weighted art with independent skeletons and materials',()=>{
 for(const create of [spirit,mother]){
  const a=create(),b=create();assert.ok(a.meshes.length<=6);assert.ok(a.triangles>20000&&a.triangles<70000);assert.ok(a.skeleton.bones.length>=48);assert.strictEqual(a.texture,b.texture);assert.equal(a.texture.image.width,256);assert.notStrictEqual(a.joints.head,b.joints.head);
  for(let i=0;i<a.meshes.length;i++){
   const mesh=a.meshes[i],g=mesh.geometry;assert.ok(mesh.isSkinnedMesh);assert.strictEqual(g,b.meshes[i].geometry);assert.notStrictEqual(mesh.material,b.meshes[i].material);assert.equal(g.attributes.position.count,g.attributes.uv.count);
   for(let v=0;v<g.attributes.position.count;v++){let sum=0;for(let j=0;j<4;j++){const weight=g.attributes.skinWeight.array[v*4+j],index=g.attributes.skinIndex.array[v*4+j];assert.ok(Number.isFinite(weight)&&weight>=0&&index<a.skeleton.bones.length);sum+=weight;}assert.ok(Math.abs(sum-1)<1e-5);}
  }
 }
 assert.notStrictEqual(spirit().meshes[0].geometry,mother().meshes[0].geometry);
});
test('the floating spirit animates its leaves and tails without altering the gameplay root',()=>{
 const a=spirit();a.group.position.set(21,0,-41);a.group.rotation.y=.8;a.update(0);const position=a.group.position.clone(),rotation=a.group.quaternion.clone(),tail=a.joints.tail_0.quaternion.clone(),leaf=a.joints.mantle_0.quaternion.clone();
 for(let f=0;f<60;f++)a.update(1/60);assert.ok(a.joints.tail_0.quaternion.angleTo(tail)>.02);assert.ok(a.joints.mantle_0.quaternion.angleTo(leaf)>.01);assert.ok(Math.abs(a.model.position.y)>.01);assert.ok(a.group.position.distanceTo(position)<1e-8);assert.ok(a.group.quaternion.angleTo(rotation)<1e-7);assert.equal(a.legs.length,0);
 const idle=a.arms[0].end.getWorldPosition(new T.Vector3()).y,glow=a.materials.glow.emissiveIntensity;
 for(let f=0;f<14;f++)a.update(1/60,{pendingAttack:'orb',telegraph:.25-f/60});assert.ok(a.motion.warning>.9);assert.ok(a.arms[0].end.getWorldPosition(new T.Vector3()).y>idle+.5);assert.ok(a.materials.glow.emissiveIntensity>glow+.8);
 a.attack('orb');a.update(1/120);assert.equal(a.motion.state,'cast');assert.ok(a.motion.strike>.99);for(let f=0;f<40;f++)a.update(1/60);assert.equal(a.motion.strike,0);
});
test('six root feet stay grounded and planted at different frame rates while turning',()=>{
 for(const dt of [1/30,1/120]){
  const a=mother(),previous=[],contact=[];assert.equal(a.legs.length,6);
  for(let f=0;f<210;f++){
   a.group.rotation.y+=.004;a.group.position.x+=Math.sin(a.group.rotation.y)*2.1*dt;a.group.position.z+=Math.cos(a.group.rotation.y)*2.1*dt;a.update(dt);
   a.legs.forEach((leg,i)=>{const p=leg.end.getWorldPosition(new T.Vector3());if(leg.contact){assert.ok(Math.abs(p.y-.13)<.004,'support roots reach the floor');if(contact[i])assert.ok(p.distanceTo(previous[i])<.018,'support roots stay planted');}previous[i]=p;contact[i]=leg.contact;});
  }
 }
});
test('the root mother has distinct seed and slam warnings matching existing release moments',()=>{
 const a=mother();a.group.position.set(100,0,-54);a.update(0);const position=a.group.position.clone();
 for(let f=0;f<71;f++)a.update(1/60,{windup:1.25-f/60,pattern:0});assert.equal(a.motion.state,'slam-windup');assert.ok(a.motion.warning>.95);assert.ok(a.arms[0].end.getWorldPosition(new T.Vector3()).y>4);
 a.attack('slam');a.update(1/120);assert.equal(a.motion.state,'impact');for(const arm of a.arms)assert.ok(arm.end.getWorldPosition(new T.Vector3()).y<.9,'slamming hands reach the floor');
 for(let f=0;f<60;f++)a.update(1/60);const closed=a.joints.pod_0.rotation.x;
 for(let f=0;f<55;f++)a.update(1/60,{windup:.95-f/60,pattern:1});assert.equal(a.motion.state,'cast-windup');assert.ok(a.joints.pod_0.rotation.x>closed+.7);assert.ok(a.materials.glow.emissive.b>a.materials.glow.emissive.g);
 a.attack('salvo');a.update(1/120);assert.equal(a.motion.state,'cast');assert.ok(a.arms[0].end.getWorldPosition(new T.Vector3()).y>1.2);assert.ok(a.group.position.distanceTo(position)<1e-8);
});
test('recoil, hidden state, teleport and reset remain independent per creature',()=>{
 for(const create of [spirit,mother]){
  const a=create(),b=create();a.hit(1,0);for(let f=0;f<7;f++)a.update(1/60);assert.ok(a.motion.recoil>.8);assert.ok(a.materials.wood.emissive.r>0);assert.equal(b.materials.wood.emissive.r,0);
  a.group.visible=false;a.update(.016);a.group.position.set(-12,0,14);a.group.visible=true;a.update(.016);assert.equal(a.motion.speed,0);assert.equal(a.motion.recoil,0);for(const leg of a.legs)assert.ok(Math.abs(leg.end.getWorldPosition(new T.Vector3()).y-.13)<.004);
 }
});
test('cosmetic defeat separates immediately and cleans up or cancels on reset',()=>{
 for(const create of [spirit,mother]){
  const a=create(),scene=new T.Scene();scene.add(a.group);a.group.position.set(100,0,-54);a.update(0);a.defeat(scene);a.group.visible=false;assert.ok(a.dying);assert.notStrictEqual(a.model.parent,a.group);
  for(let f=0;f<65;f++){a.update(1/60);for(const leg of a.legs)assert.ok(Math.abs(leg.end.getWorldPosition(new T.Vector3()).y-.13)<.004);}assert.ok(a.motion.defeat>.6);
  for(let f=0;f<140;f++)a.update(1/60);assert.equal(a.dying,false);assert.strictEqual(a.model.parent,a.group);assert.equal(scene.children.length,1);
  a.reset();a.group.visible=true;a.update(0);assert.ok(a.model.visible);assert.equal(a.materials.wood.opacity,1);assert.equal(a.materials.wood.transparent,false);a.defeat(scene);a.reset();assert.equal(a.dying,false);assert.equal(scene.children.length,1);assert.strictEqual(a.model.parent,a.group);
 }
});
test('actual weighted geometry clears the floor in idle, warning, both attacks and collapse',()=>{
 const v=new T.Vector3();for(const create of [spirit,mother]){
  const a=create(),scene=new T.Scene();scene.add(a.group);
  function check(){scene.updateMatrixWorld(true);a.skeleton.update();let low=Infinity;for(const mesh of a.meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,v);v.applyMatrix4(mesh.matrixWorld);assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z));low=Math.min(low,v.y);}assert.ok(low>-.04,'surfaces stay above the floor');}
  check();for(let f=0;f<70;f++)a.update(1/60,{windup:1.25-f/60,pattern:0,pendingAttack:'orb',telegraph:.25*(1-f/70)});check();a.attack('slam');a.update(1/120);check();a.attack('salvo');a.update(1/120);check();a.defeat(scene);a.group.visible=false;for(let f=0;f<70;f++)a.update(1/60);check();
 }
});
