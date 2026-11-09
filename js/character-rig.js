/* Emberwild reusable procedural humanoid rig.
 * Local +Z is forward, +Y up. All proportions in world units.
 * Skeleton joints are THREE.Group pivots, not skinned mesh bones:
 * a lightweight animation-ready hierarchy for procedural characters.
 * A future GLB SkinnedMesh can be retargeted to the named joints.
 */
(function(root){
'use strict';
function create(T, options={}){
  const skin=options.skin||'guardian';
  const group=new T.Group();group.name='Character';
  const model=new T.Group();model.name='rig_root';model.position.y=1.2;group.add(model);
  const joints={root:model};
  function joint(name,parent,x,y,z){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);joints[name]=g;return g;}
  function material(color,emissive){return new T.MeshStandardMaterial({color,roughness:.78,metalness:.18,flatShading:true,emissive:emissive||0,emissiveIntensity:emissive?.45:0});}
  function cube(parent,name,w,h,d,x,y,z,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  function ball(parent,name,r,x,y,z,color){const m=new T.Mesh(new T.SphereGeometry(r,10,7),material(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  const palette=skin==='ranger'?{armor:'#637e64',fabric:'#829b74',cape:'#567357',accent:'#b8c88e'}:{armor:'#626e79',fabric:'#a0b0a3',cape:'#81958a',accent:'#d7ae6b'};
  const hips=joint('hips',model,0,-.19,0);
  cube(hips,'pelvis',.66,.35,.43,0,0,0,palette.armor);
  const spine=joint('spine',hips,0,.34,0);
  const chest=joint('chest',spine,0,.38,0);
  const body=cube(chest,'body',.78,.89,.50,0,-.09,0,palette.armor);
  const neck=joint('neck',chest,0,.46,0);
  const head=joint('head',neck,0,.12,0);
  ball(head,'face',.34,0,.15,.06,'#dab58d');
  ball(head,'hair',.36,0,.32,-.09,'#59483b');
  const cloth=cube(chest,'cloak',.81,.93,.11,0,-.28,-.32,palette.cape);
  const left=joint('upper_leg_l',hips,-.24,-.19,0);
  cube(left,'thigh_l',.26,.48,.28,0,-.23,0,'#514f46');
  const kneeL=joint('lower_leg_l',left,0,-.47,0);
  cube(kneeL,'shin_l',.24,.40,.27,0,-.19,0,'#514f46');
  const footL=joint('foot_l',kneeL,0,-.37,.08);
  cube(footL,'boot_l',.28,.20,.43,0,-.02,.12,'#393d40');
  const right=joint('upper_leg_r',hips,.24,-.19,0);
  cube(right,'thigh_r',.26,.48,.28,0,-.23,0,'#514f46');
  const kneeR=joint('lower_leg_r',right,0,-.47,0);
  cube(kneeR,'shin_r',.24,.40,.27,0,-.19,0,'#514f46');
  const footR=joint('foot_r',kneeR,0,-.37,.08);
  cube(footR,'boot_r',.28,.20,.43,0,-.02,.12,'#393d40');
  const leftArm=joint('upper_arm_l',chest,-.53,.27,0);
  leftArm.rotation.z=-.17;
  cube(leftArm,'upper_arm_mesh_l',.22,.44,.23,0,-.23,0,palette.armor);
  const elbowL=joint('lower_arm_l',leftArm,0,-.45,0);
  cube(elbowL,'forearm_l',.23,.39,.24,0,-.18,0,'#514f46');
  const handL=joint('hand_l',elbowL,0,-.40,0);
  cube(handL,'glove_l',.23,.22,.24,0,-.06,0,'#403e40');
  const arm=joint('upper_arm_r',chest,.53,.27,0);
  arm.rotation.z=.17;
  cube(arm,'upper_arm_mesh_r',.22,.44,.23,0,-.23,0,palette.armor);
  const elbowR=joint('lower_arm_r',arm,0,-.45,0);
  cube(elbowR,'forearm_r',.23,.39,.24,0,-.18,0,'#514f46');
  const handR=joint('hand_r',elbowR,0,-.40,0);
  cube(handR,'glove_r',.23,.22,.24,0,-.06,0,'#403e40');
  // Weapon attaches to the right hand; these references preserve game combat.
  const socket=joint('weapon_r',handR,0,-.14,.05);
  const blade=cube(socket,'blade',.12,1.02,.15,0,-.51,.40,'#d1ded5');
  const guard=cube(socket,'guard',.50,.11,.19,0,-.12,.40,'#e2bd78');
  // A dedicated back socket can carry bows, backpacks and capes.
  joint('back',chest,0,0,-.38);
  function setSkin(next){
    const palettes={
      guardian:{armor:'#626e79',cape:'#81958a'},
      ranger:{armor:'#637e64',cape:'#567357'},
      flame_guardian:{armor:'#48444c',cape:'#932e32'}
    };
    const p=palettes[next]||palettes.guardian;
    body.material.color.set(p.armor);cloth.material.color.set(p.cape);
  }
  function animate(time,moving,attacking){
    const step=moving?Math.sin(time*11)*.6:0;
    left.rotation.x=step;right.rotation.x=-step;
    kneeL.rotation.x=moving?Math.max(0,-step)*.4:0;
    kneeR.rotation.x=moving?Math.max(0,step)*.4:0;
    leftArm.rotation.x=-step*.38;
    arm.rotation.x=attacking>0?-1.5+attacking*5:step*.38;
    elbowL.rotation.x=moving?-.09:0;
    elbowR.rotation.x=attacking>0?-.35:0;
  }
  setSkin(skin);
  return {group,model,joints,body,cloth,left,right,arm,blade,guard,setSkin,animate};
}
root.EmberCharacterRig={create};
})(typeof window==='undefined'?globalThis:window);
