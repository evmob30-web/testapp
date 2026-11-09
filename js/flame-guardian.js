/* Original Emberwild Flame Guardian costume — mesh pieces parented to shared bones.
   Procedural stylized fantasy preview; not a weight-painted GLB. */
(function(root){
'use strict';
function decorate(T,rig){
 const J=rig.joints, costume=new T.Group();costume.name='FlameGuardianCostume';rig.group.add(costume);
 const metal='#343239',edge='#c79b55',dark='#23282c',cloth='#822e34',red='#b84931',hair='#b94d29',skin='#e4ac84',glow='#ff8b25';
 const mats={};
 function mat(color,emissive){const key=color+'_'+(emissive||'');return mats[key]??=new T.MeshStandardMaterial({color,roughness:color===metal?.48:.78,metalness:color===metal?.65:.22,flatShading:true,emissive:emissive||0,emissiveIntensity:emissive?.9:0});}
 function piece(parent,name,geometry,color,x=0,y=0,z=0,rx=0,ry=0,rz=0,emissive){
   const m=new T.Mesh(geometry,mat(color,emissive));m.name='flame_'+name;m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;
 }
 const box=(p,n,w,h,d,x,y,z,c)=>piece(p,n,new T.BoxGeometry(w,h,d),c,x,y,z);
 const gem=(p,n,s,x,y,z)=>{const m=piece(p,n,new T.OctahedronGeometry(s,0),glow,x,y,z,0,0,0,'#ff5100');m.scale.set(.68,1.35,.7);return m;};
 const orb=(p,n,r,x,y,z,c)=>piece(p,n,new T.IcosahedronGeometry(r,1),c,x,y,z);
 const cone=(p,n,rad,height,x,y,z,c,rotate=0)=>piece(p,n,new T.ConeGeometry(rad,height,6),c,x,y,z,0,0,rotate);
 // Waist and torso; prominent exaggerated silhouette.
 box(J.hips,'belt',.8,.15,.55,0,.09,.02,edge);
 box(J.hips,'belt_buckle',.22,.19,.10,0,.11,.32,glow);
 box(J.hips,'front_tabard',.47,.68,.11,0,-.33,.30,cloth);
 for(const side of [-1,1]){
   box(J.hips,'hip_plate_'+side,.26,.36,.48,side*.40,-.16,.0,metal);
   const trim=box(J.chest,'breastplate_trim_'+side,.10,.62,.08,side*.32,-.1,.34,edge);
   trim.rotation.z=side*.28;
 }
 box(J.chest,'cuirass',.82,.68,.62,0,-.05,0,metal);
 box(J.chest,'cuirass_gold',.62,.11,.08,0,.22,.35,edge);
 box(J.chest,'cuirass_lower',.72,.11,.08,0,-.33,.35,edge);
 gem(J.chest,'heart_ember',.18,0,-.03,.39);
 for(const side of [-1,1]){
   const shoulder=J[side===-1?'upper_arm_l':'upper_arm_r'];
   const elbow=J[side===-1?'lower_arm_l':'lower_arm_r'];
   const knee=J[side===-1?'lower_leg_l':'lower_leg_r'];
   const thigh=J[side===-1?'upper_leg_l':'upper_leg_r'];
   const foot=J[side===-1?'foot_l':'foot_r'];
   const pauldron=orb(shoulder,'pauldron_'+side,.41,side*.15,-.06,0,metal);
   pauldron.scale.set(1.28,.72,1.05);
   const rim=box(shoulder,'pauldron_rim_'+side,.66,.10,.57,side*.17,-.33,.03,edge);
   rim.rotation.z=side*.14;
   cone(shoulder,'pauldron_horn_'+side,.15,.52,side*.25,.31,0,edge,-side*.22);
   gem(shoulder,'shoulder_ember_'+side,.13,side*.21,-.03,.40);
   box(shoulder,'arm_plate_'+side,.32,.38,.33,0,-.25,.015,metal);
   box(elbow,'gauntlet_'+side,.34,.39,.38,0,-.20,.02,metal);
   box(elbow,'gauntlet_trim_'+side,.38,.09,.4,0,-.13,.02,edge);
   box(thigh,'legplate_'+side,.34,.50,.37,0,-.22,.02,metal);
   const kneecap=orb(knee,'kneecap_'+side,.23,0,-.10,.18,edge);kneecap.scale.set(.95,.75,.5);
   box(knee,'greave_'+side,.31,.43,.37,0,-.22,.01,metal);
   box(foot,'boot_armor_'+side,.35,.24,.49,0,-.05,.11,dark);
   box(foot,'toe_trim_'+side,.37,.07,.12,0,-.11,.33,edge);
 }
 // Characterful face and long swept red hair attached to head bone.
 const face=orb(J.head,'face',.325,0,.17,.08,skin);face.scale.set(.97,1.03,.94);
 for(const side of [-1,1]){
   const eye=orb(J.head,'eye_'+side,.055,side*.135,.19,.36,'#422c28');
   eye.scale.set(1,.75,.5);
   const brow=box(J.head,'brow_'+side,.14,.034,.04,side*.135,.28,.375,hair);brow.rotation.z=-side*.10;
   cone(J.head,'side_lock_'+side,.14,.42,side*.30,.05,-.03,hair,side*.16);
 }
 const crown=orb(J.head,'hair_crown',.36,0,.39,-.07,hair);crown.scale.set(1.04,.7,1.04);
 for(let i=0;i<5;i++){
   const x=(i-2)*.135;
   const strand=cone(J.head,'fringe_'+i,.11,.30,x,.26,.27,hair,(i-2)*.09);
   strand.rotation.x=.28;
 }
 for(const side of [-1,1]){
   cone(J.head,'long_hair_'+side,.18,.73,side*.24,-.16,-.24,hair,side*.08);
 }
 // Layered crimson cape behind the arms, separate rigid segments.
 const cape=J.back;
 box(cape,'cape_collar',.73,.19,.17,0,.28,-.02,edge);
 for(let i=0;i<3;i++){
   const segment=box(cape,'cape_panel_'+i,.27,1.13,.085,(i-1)*.27,-.48,-.09,cloth);
   segment.rotation.z=(i-1)*.12;
   box(cape,'cape_hem_'+i,.28,.10,.09,(i-1)*.31,-1.03,-.09,edge);
 }
 for(const side of [-1,1]){
   const clasp=orb(J.chest,'clasp_'+side,.11,side*.35,.29,.29,edge);clasp.scale.set(.9,.65,.4);
 }
 // Gold weapon hilt and ember pommel are decorations; actual blade remains the combat mesh.
 box(J.weapon_r,'hilt_gold',.13,.48,.13,0,-.23,.40,edge);
 gem(J.weapon_r,'pommel',.085,0,.02,.40);
 // A few emissive crystals give the character identity without expensive lights.
 const baseMeshes=[];
 rig.model.traverse(o=>{if(o.isMesh&&o!==rig.blade&&o!==rig.guard&&!o.name.startsWith('flame_'))baseMeshes.push(o);});
 // Decoration was added to bones; hide it by toggling individual meshes, never the bones.
 const costumeMeshes=[];
 rig.model.traverse(o=>{if(o.isMesh&&o.name.startsWith('flame_'))costumeMeshes.push(o);});
 function setVisible(on){for(const m of baseMeshes)m.visible=!on;for(const m of costumeMeshes)m.visible=!!on;}
 setVisible(false);
 return {setVisible,costumeMeshes,baseMeshes};
}
root.EmberFlameGuardian={decorate};
})(typeof window==='undefined'?globalThis:window);
