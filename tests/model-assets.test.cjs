const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const THREE=require('../vendor/three.min.js');
const ROOT=path.join(__dirname,'..');
function environment(){
 const warnings=[];class BitmapTestLoader extends THREE.Loader{constructor(...args){super(...args);this.isImageBitmapLoader=true;}load(url,onLoad){Promise.resolve().then(()=>onLoad({width:512,height:256,close(){}}));}}
 const sandbox={THREE:{...THREE,ImageBitmapLoader:BitmapTestLoader},console:{...console,warn:(...args)=>warnings.push(args)},warnings,URL,Blob,fetch,atob,TextDecoder,setTimeout,
  // Node tests exercise glTF parsing/bindings; real PNG decoding/rendering runs in Chromium CI.
  createImageBitmap:async()=>({width:64,height:64,close(){}})};
 sandbox.window=sandbox;sandbox.self=sandbox;vm.createContext(sandbox);
 for(const file of ['js/hero-art.js','js/character-rig.js','js/flame-guardian.js','js/appearance.js','vendor/GLTFLoader.js','js/character-assets-data.js','js/model-assets.js','js/forest-actors.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
 return sandbox;
}
function avatar(env){
 const rig=env.EmberCharacterRig.create(THREE),flame=env.EmberFlameGuardian.decorate(THREE,rig),look=env.EmberAppearance.attach(THREE,rig,flame);
 return {rig,flame,look,assets:env.EmberModelAssets.attach(THREE,rig,flame,look)};
}
test('shipped GLBs are self-contained and identical to the offline payload',()=>{
 const env=environment();
 for(const [id,file] of [['classic','ember-adventurer.glb'],['flame_guardian','flame-guardian.glb']]){
  const bytes=fs.readFileSync(path.join(ROOT,'assets/characters',file));
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.deepEqual(bytes,Buffer.from(env.EmberCharacterData[id],'base64'));
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  assert.ok(gltf.skins[0].joints.length>=20);
  assert.ok(gltf.images[0].bufferView>=0,'PNG texture is embedded');
  assert.ok(gltf.buffers.every(b=>!b.uri),'no external network assets');
  assert.ok(gltf.meshes.length<=18,'geometry batched by material');
 }
});
test('GLB models deform on the game bones, preserve attachments and keep avatar materials independent',async()=>{
 const env=environment(),a=avatar(env),b=avatar(env);
 // Match the actual asynchronous game: animation, world translation and selection happen before load.
 a.rig.group.position.set(4,0,22);a.rig.animate(.25,true,0);
 a.assets.setLook('flame_guardian',{skinTone:'deep',eyeColor:'violet',hairColor:'silver'},'ranger');
 b.assets.setLook('classic',{skinTone:'fair'},'guardian');
 assert.equal(await a.assets.ready,true);assert.equal(await b.assets.ready,true);
 assert.equal(a.assets.status,'ready');assert.equal(env.warnings.length,0,'successful assets have no loader warnings');
 const first=a.assets.models.getObjectByName('flame_skin');
 assert.ok(first?.isSkinnedMesh);
 assert.equal(first.material.color.getHexString(),'81513e');
 const other=b.assets.models.getObjectByName('flame_skin');
 assert.strictEqual(first.geometry,other.geometry,'immutable geometry is reused');
 assert.notStrictEqual(first.material,other.material,'preview colors cannot mutate the player');
 for(const bone of first.skeleton.bones)assert.ok(Object.values(a.rig.joints).includes(bone),'uses original equipment bones');
 assert.strictEqual(a.rig.blade.parent,a.rig.joints.weapon_r);
 assert.ok(a.rig.blade.visible,'combat weapon stays visible');
 assert.ok(a.flame.baseMeshes.every(m=>!m.visible));
 assert.ok(a.flame.costumeMeshes.every(m=>!m.visible));
 assert.ok(a.look.classicEyes.every(m=>!m.visible));
 assert.equal(a.assets.models.getObjectByName('GLB_flame_guardian').visible,true);
 const fabric=a.assets.models.getObjectByName('classic_fabric');
 const weights=fabric.geometry.attributes.skinWeight,indices=fabric.geometry.attributes.skinIndex;
 let blended=0;const elbowVertices=[];
 for(let i=0;i<weights.count;i++){
  const sum=weights.getX(i)+weights.getY(i)+weights.getZ(i)+weights.getW(i);
  assert.ok(Math.abs(sum-1)<1e-6,'normalized vertex weights');
  if(weights.getY(i)>0&&weights.getX(i)>0){blended++;if(fabric.skeleton.bones[indices.getY(i)].name==='lower_arm_l')elbowVertices.push(i);}
 }
 assert.ok(blended>100,'torso and limb joints have blended weights');assert.ok(elbowVertices.length);
 a.rig.group.updateMatrixWorld(true);fabric.skeleton.update();
 const before=elbowVertices.map(i=>fabric.getVertexPosition(i,new THREE.Vector3()));
 a.rig.joints.lower_arm_l.rotation.x-=1.1;a.rig.group.updateMatrixWorld(true);fabric.skeleton.update();
 const moved=elbowVertices.map((v,i)=>before[i].distanceTo(fabric.getVertexPosition(v,new THREE.Vector3())));assert.ok(Math.max(...moved)>.03,'the imported sleeve actually bends');
 a.assets.setLook('classic',{},'ranger');
 assert.equal(a.assets.models.getObjectByName('GLB_flame_guardian').visible,false);
 assert.equal(a.assets.models.getObjectByName('GLB_classic').visible,true);
 assert.equal(fabric.material.color.getHexString(),'637e64');
});
test('asset failure leaves the procedural character usable',async()=>{
 const env=environment();env.EmberGLTFLoader=null;
 const {rig,assets}=avatar(env);
 assert.equal(await assets.ready,false);assert.equal(assets.status,'fallback');
 assert.ok(env.warnings.some(w=>String(w[0]).includes('fallback')));assert.ok(rig.body.visible);assert.ok(rig.blade.visible);rig.animate(.5,true,.2);
 assert.ok(Number.isFinite(rig.joints.upper_arm_r.rotation.x));
});

test('heroic proportions keep feet on the original ground and hair is shared without color leaks',async()=>{
 const env=environment(),a=avatar(env),b=avatar(env);await Promise.all([a.assets.ready,b.assets.ready]);
 a.rig.group.updateMatrixWorld(true);
 for(const side of ['l','r'])assert.ok(Math.abs(a.rig.joints['foot_'+side].getWorldPosition(new THREE.Vector3()).y+.02)<1e-6,'ground contact is preserved');
 const skin=a.assets.models.getObjectByName('classic_skin');skin.geometry.computeBoundingBox();
 assert.ok(skin.geometry.boundingBox.max.y-skin.geometry.boundingBox.min.y<.6,'head and neck stay proportional to the heroic body');
 for(const style of ['short','long','braid']){
  const ga=a.look.groups[style],gb=b.look.groups[style];assert.equal(ga.children.length,1,'one draw per hairstyle');
  assert.strictEqual(ga.children[0].geometry,gb.children[0].geometry);assert.notStrictEqual(ga.children[0].material,gb.children[0].material);
 }
 a.look.apply('classic',{hairStyle:'long',hairColor:'silver'});b.look.apply('classic',{hairStyle:'braid',hairColor:'black'});
 assert.equal(a.look.groups.long.visible,true);assert.equal(b.look.groups.braid.visible,true);
 assert.notEqual(a.look.groups.long.children[0].material.color.getHex(),b.look.groups.braid.children[0].material.color.getHex());
});

test('rolling keeps the weighted body above the floor',async()=>{
 const env=environment(),a=avatar(env);await a.assets.ready;
 for(const skin of ['classic','flame_guardian']){
  a.assets.setLook(skin,{},'guardian');
  for(const p of [.05,.2,.4,.6,.8,.95]){
   a.rig.animate(p,true,0,{roll:p});a.rig.group.updateMatrixWorld(true);let min=Infinity;
   a.assets.models.getObjectByName(skin==='classic'?'GLB_classic':'GLB_flame_guardian').traverse(m=>{if(!m.isSkinnedMesh||/cape/.test(m.name))return;m.skeleton.update();const point=new THREE.Vector3();for(let i=0;i<m.geometry.attributes.position.count;i++){m.getVertexPosition(i,point);point.applyMatrix4(m.matrixWorld);min=Math.min(min,point.y);}});
   assert.ok(min>=-.11,'weighted body clears the ground: '+skin+' at '+p);assert.ok(min<.8,'roll remains close to the ground');
  }
 }
});


test('Elin reuses weighted geometry with her own materials and leaves the player unchanged',async()=>{
 const env=environment(),player=avatar(env),elin=env.EmberForestActors.createElin(THREE);player.assets.setLook('classic',{},'guardian');await Promise.all([player.assets.ready,elin.ready]);
 assert.equal(elin.assets.status,'ready');const npc=elin.assets.models.getObjectByName('classic_fabric'),hero=player.assets.models.getObjectByName('classic_fabric');assert.strictEqual(npc.geometry,hero.geometry);assert.notStrictEqual(npc.material,hero.material);assert.equal(npc.material.color.getHexString(),'526f58');assert.equal(hero.material.color.getHexString(),'46697a');
 const before=hero.material.color.getHexString();elin.setTalking(true);for(let i=0;i<30;i++)elin.update(1/60,{x:1,z:2});assert.equal(hero.material.color.getHexString(),before);assert.ok(elin.assets.models.getObjectByName('classic_skin').isSkinnedMesh);assert.ok(elin.appearance.groups.braid.visible);
});
