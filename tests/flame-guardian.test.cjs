const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const THREE=require('../vendor/three.min.js');
const context={THREE};context.window=context;vm.createContext(context);
for(const name of ['core','character-rig','flame-guardian'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8'),context);
test('Flame Guardian meshes follow reusable bones and can switch back',()=>{
 const rig=context.EmberCharacterRig.create(THREE);
 const skin=context.EmberFlameGuardian.decorate(THREE,rig);
 assert.ok(skin.costumeMeshes.length>=40,'detailed costume has multiple distinct armor pieces');
 for(const name of ['flame_hair_crown','flame_cuirass','flame_cape_panel_1','flame_pauldron_-1','flame_shoulder_ember_1'])
  assert.ok(skin.costumeMeshes.some(m=>m.name===name),name);
 skin.setVisible(true);
 assert.ok(skin.costumeMeshes.every(m=>m.visible));
 assert.ok(skin.baseMeshes.every(m=>!m.visible));
 assert.equal(rig.blade.visible,true);
 const shoulder=rig.joints.upper_arm_r;
 const crystal=skin.costumeMeshes.find(m=>m.name==='flame_shoulder_ember_1');
 const before=crystal.getWorldPosition(new THREE.Vector3());
 shoulder.rotation.x=.8;rig.group.updateMatrixWorld(true);
 const after=crystal.getWorldPosition(new THREE.Vector3());
 assert.ok(before.distanceTo(after)>.05,'crystal follows arm bone');
 skin.setVisible(false);
 assert.ok(skin.costumeMeshes.every(m=>!m.visible));
 assert.ok(skin.baseMeshes.every(m=>m.visible));
});
test('appearance survives old and new saved games independently of class',()=>{
 const state=context.RPG.fresh('ranger');
 assert.equal(state.skinId,'classic');
 state.skinId='flame_guardian';
 const loaded=context.RPG.restore(JSON.stringify(state));
 assert.equal(loaded.skinId,'flame_guardian');
 assert.equal(loaded.classId,'ranger');
 delete state.skinId;
 assert.equal(context.RPG.restore(JSON.stringify(state)).skinId,'classic');
 state.skinId='unknown';
 assert.equal(context.RPG.restore(JSON.stringify(state)).skinId,'classic');
});

test('sculpted Flame Guardian has curved hair and smooth armor geometry',()=>{
 const rig=context.EmberCharacterRig.create(THREE);
 const skin=context.EmberFlameGuardian.decorate(THREE,rig);
 const named=n=>skin.costumeMeshes.find(m=>m.name==='flame_'+n);
 assert.equal(named('cuirass').geometry.type,'SphereGeometry');
 assert.equal(named('pauldron_-1').geometry.type,'SphereGeometry');
 assert.equal(named('fringe_2').geometry.type,'TubeGeometry');
 assert.equal(named('long_hair_1').geometry.type,'TubeGeometry');
 assert.equal(named('face').geometry.type,'SphereGeometry');
 assert.equal(named('nose').geometry.type,'SphereGeometry');
 assert.equal(named('cape_panel_1').geometry.type,'SphereGeometry');
 assert.equal(named('cuirass').material.flatShading,false);
 skin.setVisible(true);
 rig.animate(0.3,true,0);
 assert.ok(skin.costumeMeshes.every(m=>m.visible));
});

test('hair and cape sway during movement and return to rest without drifting',()=>{
 const rig=context.EmberCharacterRig.create(THREE);
 const flame=context.EmberFlameGuardian.decorate(THREE,rig);
 const cape=flame.costumeMeshes.find(m=>m.name==='flame_cape_panel_1');
 const hair=flame.costumeMeshes.find(m=>m.name==='flame_long_hair_1');
 const initialCape=cape.rotation.x,initialHair=hair.rotation.x;
 flame.animate(.4,{moving:true,running:true,attacking:0});
 assert.notEqual(cape.rotation.x,initialCape);
 assert.notEqual(hair.rotation.x,initialHair);
 const initial=flame.costumeMeshes.length;
 for(let i=0;i<100;i++)flame.animate(i*.03,{moving:false,attacking:0});
 assert.ok(Math.abs(cape.rotation.x)<.2);
 assert.equal(flame.costumeMeshes.length,initial);
 flame.setVisible(false);flame.animate(4,{moving:false});flame.setVisible(true);
 assert.ok(flame.costumeMeshes.every(m=>m.visible));
});
