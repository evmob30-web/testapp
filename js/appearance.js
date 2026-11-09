/* Emberwild character customization. All shapes are original procedural meshes.
 * Works on the shared Three.js Bone rig for both player and preview.
 */
(function(root){
'use strict';
const hairColors={auburn:'#b94d29',chestnut:'#69412d',blonde:'#deb96b',black:'#252329',silver:'#d4d6d6'};
const skinColors={fair:'#f3c9ad',warm:'#e4ac84',tan:'#b77a56',deep:'#81513e'};
const eyeColors={green:'#4d9975',blue:'#6eadda',hazel:'#9c804a',violet:'#a38bc7'};
const styles=['short','long','braid'];
function material(T,color){return new T.MeshStandardMaterial({color,roughness:.83,metalness:0,flatShading:false});}
function ellipsoid(T,parent,name,x,y,z,sx,sy,sz,mat){
 const mesh=new T.Mesh(new T.SphereGeometry(1,16,10),mat);
 mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function strand(T,parent,name,points,r,mat){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
 const mesh=new T.Mesh(new T.TubeGeometry(curve,12,r,7,false),mat);
 mesh.name=name;mesh.castShadow=true;parent.add(mesh);return mesh;
}
function attach(T,rig,flame){
 const head=rig.joints.head, hairMaterial=material(T,hairColors.auburn);
 const eyesMaterial=material(T,eyeColors.green);
 const groups={};for(const style of styles){const g=new T.Group();g.name='appearance_hair_'+style;head.add(g);groups[style]=g;}
 // All hair shapes are relative to the same head bone used in the game.
 ellipsoid(T,groups.short,'short_cap',0,.40,-.06,.36,.22,.34,hairMaterial);
 for(const side of [-1,1]){
  strand(T,groups.short,'short_side_'+side,[[side*.28,.39,.06],[side*.31,.23,.07],[side*.27,.08,.11]],.08,hairMaterial);
 }
 ellipsoid(T,groups.long,'long_cap',0,.42,-.07,.36,.22,.35,hairMaterial);
 for(const side of [-1,1]){
  strand(T,groups.long,'long_side_'+side,[[side*.24,.42,-.12],[side*.36,.08,-.16],[side*.36,-.29,-.17]],.12,hairMaterial);
  strand(T,groups.long,'long_back_'+side,[[side*.15,.37,-.30],[side*.21,.03,-.38],[side*.17,-.41,-.30]],.13,hairMaterial);
 }
 ellipsoid(T,groups.braid,'braid_cap',0,.42,-.06,.36,.22,.35,hairMaterial);
 strand(T,groups.braid,'braid_sweep',[[-.25,.48,.21],[-.09,.46,.32],[.13,.34,.31]],.10,hairMaterial);
 for(let i=0;i<6;i++){
   const y=.16-i*.115;
   ellipsoid(T,groups.braid,'braid_link_'+i,.04*Math.sin(i),y,-.42,.13,.10,.12,hairMaterial);
 }
 for(let i=0;i<4;i++){
   const x=(i-1.5)*.15;
   strand(T,groups.long,'long_fringe_'+i,[[x,.49,.17],[x+.025,.35,.28],[x+.038,.25,.28]],.046,hairMaterial);
   strand(T,groups.braid,'braid_fringe_'+i,[[x,.49,.17],[x+.015,.36,.29],[x+.04,.26,.27]],.041,hairMaterial);
 }
 // Classic model had no eyes. The Flame Guardian already has its own eyes.
 const classicEyes=[];
 for(const side of [-1,1])classicEyes.push(ellipsoid(T,head,'appearance_eye_'+side,side*.13,.18,.355,.05,.044,.024,eyesMaterial));
 const oldHair=rig.joints.head.getObjectByName('hair');
 const flameHair=flame?flame.costumeMeshes.filter(m=>/^flame_(hair_crown|side_lock_|fringe_|long_hair_|brow_)/.test(m.name)):[];
 const flameSkin=flame?flame.costumeMeshes.filter(m=>/^flame_(face|nose)$/.test(m.name)):[];
 const flameEyes=flame?flame.costumeMeshes.filter(m=>/^flame_eye_/.test(m.name)):[];
 const baseFace=rig.joints.head.getObjectByName('face');
 let chosen='classic';
 function apply(skinId,appearance){
  const config=appearance||{};
  const hairstyle=styles.includes(config.hairStyle)?config.hairStyle:'short';
  const color=hairColors[config.hairColor]||hairColors.auburn;
  const flesh=skinColors[config.skinTone]||skinColors.warm;
  const irises=eyeColors[config.eyeColor]||eyeColors.green;
  chosen=skinId;
  hairMaterial.color.set(color);eyesMaterial.color.set(irises);
  if(baseFace)baseFace.material.color.set(flesh);
  for(const m of flameSkin)m.material.color.set(flesh);
  for(const m of flameEyes)m.material.color.set(irises);
  if(oldHair)oldHair.visible=false;
  for(const m of flameHair)m.visible=false;
  for(const [key,group] of Object.entries(groups))group.visible=key===hairstyle;
  for(const eye of classicEyes)eye.visible=skinId!=='flame_guardian';
 }
 function animate(time){for(const [name,group] of Object.entries(groups))if(group.visible){group.rotation.z=.012*Math.sin(time*2.1);group.rotation.x=.018*Math.sin(time*1.8);}}
 return {apply,animate,groups,classicEyes,flameHair};
}
function createPreview(T,canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
 renderer.setPixelRatio(1);
 renderer.setSize(320,400,false);
 renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.background=new T.Color('#20302c');
 const camera=new T.PerspectiveCamera(37,320/400,.1,40);
 camera.position.set(3.0,2.5,4.7);camera.lookAt(0,1.20,0);
 scene.add(new T.HemisphereLight('#fff0d6','#294036',2.6));
 const light=new T.DirectionalLight('#ffd6a2',3);light.position.set(-3,7,5);scene.add(light);
 const rig=root.EmberCharacterRig.create(T);
 const flame=root.EmberFlameGuardian.decorate(T,rig);
 const look=attach(T,rig,flame);scene.add(rig.group);
 let angle=.35;
 function select(skinId,appearance){
  const isFlame=skinId==='flame_guardian';
  flame.setVisible(isFlame);
  rig.setSkin(isFlame?'flame_guardian':'guardian');
  look.apply(skinId,appearance);
 }
 function rotate(delta){angle+=delta;}
 function update(time){
  rig.group.rotation.y=angle;
  rig.animate(time,false,0);
  flame.animate(time,{moving:false});
  look.animate(time);
  renderer.render(scene,camera);
 }
 return {select,rotate,update,renderer,rig};
}
root.EmberAppearance={attach,createPreview,hairColors,skinColors,eyeColors,styles};
})(typeof window==='undefined'?globalThis:window);
