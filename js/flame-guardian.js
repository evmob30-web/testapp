/* Original Emberwild Flame Guardian procedural fallback and asset source.
   The weighted GLB replacement shares these bones; attachments stay compatible. */
(function(root){
'use strict';
function decorate(T,rig){
 const J=rig.joints, costume=new T.Group();costume.name='FlameGuardianCostume';rig.group.add(costume);
 const metal='#343239',edge='#c79b55',dark='#23282c',cloth='#822e34',red='#b84931',hair='#b94d29',skin='#e4ac84',glow='#ff8b25';
 const mats={};
 function mat(color,emissive){const key=color+'_'+(emissive||'');return mats[key]??=new T.MeshStandardMaterial({color,roughness:color===metal?.48:.78,metalness:color===metal?.65:.22,flatShading:false,emissive:emissive||0,emissiveIntensity:emissive?.9:0});}
 function piece(parent,name,geometry,color,x=0,y=0,z=0,rx=0,ry=0,rz=0,emissive){
   const m=new T.Mesh(geometry,mat(color,emissive));m.name='flame_'+name;m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;
 }
 const box=(p,n,w,h,d,x,y,z,c)=>piece(p,n,new T.BoxGeometry(w,h,d),c,x,y,z);
 const gem=(p,n,s,x,y,z)=>{const m=piece(p,n,new T.OctahedronGeometry(s,0),glow,x,y,z,0,0,0,'#ff5100');m.scale.set(.68,1.35,.7);return m;};
 const orb=(p,n,r,x,y,z,c)=>piece(p,n,new T.SphereGeometry(r,18,12),c,x,y,z);
 const shell=(p,n,w,h,d,x,y,z,c)=>{const m=orb(p,n,1,x,y,z,c);m.scale.set(w/2,h/2,d/2);return m;};
 const strand=(p,n,points,r,c)=>piece(p,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),12,r,6,false),c);
 const cone=(p,n,rad,height,x,y,z,c,rotate=0)=>piece(p,n,new T.ConeGeometry(rad,height,6),c,x,y,z,0,0,rotate);
 // Waist and torso; prominent exaggerated silhouette.
 box(J.hips,'belt',.8,.15,.55,0,.09,.02,edge);
 box(J.hips,'belt_buckle',.22,.19,.10,0,.11,.32,glow);
 shell(J.hips,'front_tabard',.47,.68,.12,0,-.33,.30,cloth);
 for(const side of [-1,1]){
   shell(J.hips,'hip_plate_'+side,.30,.43,.48,side*.40,-.16,.0,metal);
   const trim=box(J.chest,'breastplate_trim_'+side,.10,.62,.08,side*.32,-.1,.34,edge);
   trim.rotation.z=side*.28;
 }
 shell(J.chest,'cuirass',.88,.76,.66,0,-.05,0,metal);
 box(J.chest,'cuirass_gold',.62,.11,.08,0,.22,.35,edge);
 box(J.chest,'cuirass_lower',.72,.11,.08,0,-.33,.35,edge);
 gem(J.chest,'heart_ember',.18,0,-.03,.39);
 for(const side of [-1,1]){
   const shoulder=J[side===-1?'upper_arm_l':'upper_arm_r'];
   const elbow=J[side===-1?'lower_arm_l':'lower_arm_r'];
   const knee=J[side===-1?'lower_leg_l':'lower_leg_r'];
   const thigh=J[side===-1?'upper_leg_l':'upper_leg_r'];
   const foot=J[side===-1?'foot_l':'foot_r'];
   const pauldron=shell(shoulder,'pauldron_'+side,1.04,.66,.83,side*.15,-.06,0,metal);
   const rim=shell(shoulder,'pauldron_rim_'+side,.78,.13,.63,side*.17,-.32,.03,edge);
   rim.rotation.z=side*.14;
   cone(shoulder,'pauldron_horn_'+side,.15,.52,side*.25,.31,0,edge,-side*.22);
   gem(shoulder,'shoulder_ember_'+side,.13,side*.21,-.03,.40);
   shell(shoulder,'arm_plate_'+side,.34,.41,.35,0,-.25,.015,metal);
   shell(elbow,'gauntlet_'+side,.36,.43,.40,0,-.20,.02,metal);
   box(elbow,'gauntlet_trim_'+side,.38,.09,.4,0,-.13,.02,edge);
   shell(thigh,'legplate_'+side,.37,.52,.4,0,-.22,.02,metal);
   const kneecap=orb(knee,'kneecap_'+side,.23,0,-.10,.18,edge);kneecap.scale.set(.95,.75,.5);
   shell(knee,'greave_'+side,.34,.46,.40,0,-.22,.01,metal);
   shell(foot,'boot_armor_'+side,.37,.25,.54,0,-.05,.11,dark);
   box(foot,'toe_trim_'+side,.37,.07,.12,0,-.11,.33,edge);
 }
 // Characterful face and long swept red hair attached to head bone.
 const face=shell(J.head,'face',.64,.72,.61,0,.17,.08,skin);
 shell(J.head,'nose',.105,.14,.14,0,.13,.39,skin);
 strand(J.head,'mouth',[[-.085,-.025,.377],[0,-.041,.389],[.085,-.025,.377]],.013,'#9b5b51');
 for(const side of [-1,1]){
   const eye=orb(J.head,'eye_'+side,.055,side*.135,.19,.36,'#422c28');
   eye.scale.set(1,.75,.5);
   strand(J.head,'brow_'+side,[[side*.065,.285,.373],[side*.14,.30,.376],[side*.22,.273,.36]],.022,hair);
   strand(J.head,'side_lock_'+side,[[side*.29,.40,.02],[side*.345,.21,.075],[side*.29,-.10,.10]],.085,hair);
 }
 const crown=shell(J.head,'hair_crown',.73,.39,.66,0,.42,-.07,hair);
 for(let i=0;i<5;i++){
   const x=(i-2)*.135;
   strand(J.head,'fringe_'+i,[[x*.65,.48,.24],[x,.34,.32],[x+.045,.23,.30]],.053,hair);
 }
 for(const side of [-1,1]){
   strand(J.head,'long_hair_'+side,[[side*.25,.37,-.22],[side*.36,.05,-.29],[side*.30,-.36,-.22]],.115,hair);
 }
 // Layered crimson cape behind the arms, separate rigid segments.
 const cape=J.back;
 box(cape,'cape_collar',.73,.19,.17,0,.28,-.02,edge);
 for(let i=0;i<3;i++){
   const segment=shell(cape,'cape_panel_'+i,.32,1.22,.105,(i-1)*.26,-.48,-.09,cloth);
   segment.rotation.z=(i-1)*.11;
   shell(cape,'cape_hem_'+i,.33,.12,.11,(i-1)*.30,-1.05,-.09,edge);
 }
 for(const side of [-1,1]){
   const clasp=orb(J.chest,'clasp_'+side,.11,side*.35,.29,.29,edge);clasp.scale.set(.9,.65,.4);
 }
 // Gold weapon hilt and ember pommel are decorations; actual blade remains the combat mesh.
 box(J.weapon_r,'hilt_gold',.07,.055,.07,0,.20,.12,edge);
 gem(J.weapon_r,'pommel',.055,0,.25,.12);
 // A few emissive crystals give the character identity without expensive lights.
 const baseMeshes=[];
 rig.model.traverse(o=>{if(o.isMesh&&o!==rig.blade&&o!==rig.guard&&!o.userData.weaponPart&&!o.name.startsWith('flame_'))baseMeshes.push(o);});
 // Decoration was added to bones; hide it by toggling individual meshes, never the bones.
 const costumeMeshes=[];
 rig.model.traverse(o=>{if(o.isMesh&&o.name.startsWith('flame_'))costumeMeshes.push(o);});
 function setVisible(on){for(const m of baseMeshes)m.visible=!on;for(const m of costumeMeshes)m.visible=!!on;}
 // Lightweight secondary motion: all ornaments stay attached to their own bones.
 // Each mesh uses a stable rest pose, so switching skins never accumulates drift.
 const dynamic=costumeMeshes.filter(m=>/^flame_(long_hair_|side_lock_|cape_panel_|cape_hem_)/.test(m.name));
 for(const mesh of dynamic)mesh.userData.motionRest={x:mesh.rotation.x,y:mesh.rotation.y,z:mesh.rotation.z};
 function animate(time,options={}){
   const amount=options.moving?(options.running?1:.58):.08;
   const attack=options.attacking>0?.17:0;
   for(const mesh of dynamic){
     const rest=mesh.userData.motionRest;
     const hair=mesh.name.includes('hair_')||mesh.name.includes('side_lock_');
     const phase=hair?time*4.2:time*2.8;
     const amplitude=hair?.11:.16;
     mesh.rotation.x=rest.x+Math.sin(phase+(hair?0:1.1))*amplitude*(.3+amount)+attack;
     mesh.rotation.z=rest.z+Math.sin(phase*.77+(mesh.position.x*4))*amplitude*(.3+amount);
     mesh.rotation.y=rest.y+Math.sin(phase*.68)*amplitude*.2;
   }
 }
 setVisible(false);
 return {setVisible,animate,costumeMeshes,baseMeshes};
}
root.EmberFlameGuardian={decorate};
})(typeof window==='undefined'?globalThis:window);
