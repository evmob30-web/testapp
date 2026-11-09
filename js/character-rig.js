/* Emberwild reusable procedural humanoid rig.
 * Local +Z is forward, +Y up. All proportions in world units.
 * The joints are real THREE.Bone transforms; geometry currently consists of
 * rigid pieces parented to bones, not weight-painted SkinnedMeshes.
 * A future GLB SkinnedMesh can bind to the shared skeleton.
 */
(function(root){
'use strict';
function create(T, options={}){
  const skin=options.skin||'guardian';
  const group=new T.Group();group.name='Character';
  const model=new T.Bone();model.name='rig_root';model.position.y=1.2;group.add(model);
  const joints={root:model};
  function joint(name,parent,x,y,z){const g=new T.Bone();g.name=name;g.position.set(x,y,z);parent.add(g);joints[name]=g;return g;}
  function material(color,emissive){return new T.MeshStandardMaterial({color,roughness:.78,metalness:.18,flatShading:false,emissive:emissive||0,emissiveIntensity:emissive ? 0.45 : 0});}
  function cube(parent,name,w,h,d,x,y,z,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  function ellipsoid(parent,name,w,h,d,x,y,z,color){const m=new T.Mesh(new T.SphereGeometry(1,18,12),material(color));m.name=name;m.scale.set(w/2,h/2,d/2);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  function tapered(parent,name,top,bottom,height,x,y,z,color){const m=new T.Mesh(new T.CylinderGeometry(top,bottom,height,14,1),material(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  const palette=skin==='ranger'?{armor:'#637e64',fabric:'#829b74',cape:'#567357',accent:'#b8c88e'}:{armor:'#626e79',fabric:'#a0b0a3',cape:'#81958a',accent:'#d7ae6b'};
  const hips=joint('hips',model,0,-.19,0);
  ellipsoid(hips,'pelvis',.67,.43,.48,0,0,0,palette.armor);
  const spine=joint('spine',hips,0,.34,0);
  const chest=joint('chest',spine,0,.38,0);
  const body=ellipsoid(chest,'body',.86,.97,.59,0,-.09,0,palette.armor);
  const neck=joint('neck',chest,0,.46,0);
  const head=joint('head',neck,0,.12,0);
  ellipsoid(head,'face',.66,.76,.60,0,.15,.06,'#dab58d');
  ellipsoid(head,'hair',.7,.41,.63,0,.43,-.07,'#59483b');
  const cloth=ellipsoid(chest,'cloak',.85,1.04,.12,0,-.28,-.33,palette.cape);
  const left=joint('upper_leg_l',hips,-.24,-.19,0);
  tapered(left,'thigh_l',.18,.135,.48,0,-.23,0,'#514f46');
  const kneeL=joint('lower_leg_l',left,0,-.47,0);
  tapered(kneeL,'shin_l',.145,.11,.40,0,-.19,0,'#514f46');
  const footL=joint('foot_l',kneeL,0,-.37,.08);
  ellipsoid(footL,'boot_l',.35,.22,.52,0,-.02,.12,'#393d40');
  const right=joint('upper_leg_r',hips,.24,-.19,0);
  tapered(right,'thigh_r',.18,.135,.48,0,-.23,0,'#514f46');
  const kneeR=joint('lower_leg_r',right,0,-.47,0);
  tapered(kneeR,'shin_r',.145,.11,.40,0,-.19,0,'#514f46');
  const footR=joint('foot_r',kneeR,0,-.37,.08);
  ellipsoid(footR,'boot_r',.35,.22,.52,0,-.02,.12,'#393d40');
  const leftArm=joint('upper_arm_l',chest,-.53,.27,0);
  leftArm.rotation.z=-.17;
  tapered(leftArm,'upper_arm_mesh_l',.155,.115,.46,0,-.23,0,palette.armor);
  const elbowL=joint('lower_arm_l',leftArm,0,-.45,0);
  tapered(elbowL,'forearm_l',.135,.105,.40,0,-.18,0,'#514f46');
  const handL=joint('hand_l',elbowL,0,-.40,0);
  ellipsoid(handL,'glove_l',.27,.28,.27,0,-.06,0,'#403e40');
  const arm=joint('upper_arm_r',chest,.53,.27,0);
  arm.rotation.z=.17;
  tapered(arm,'upper_arm_mesh_r',.155,.115,.46,0,-.23,0,palette.armor);
  const elbowR=joint('lower_arm_r',arm,0,-.45,0);
  tapered(elbowR,'forearm_r',.135,.105,.40,0,-.18,0,'#514f46');
  const handR=joint('hand_r',elbowR,0,-.40,0);
  ellipsoid(handR,'glove_r',.27,.28,.27,0,-.06,0,'#403e40');
  // Weapon attaches to the right hand; these references preserve game combat.
  const socket=joint('weapon_r',handR,0,-.14,.05);
  const blade=tapered(socket,'blade',.072,.115,1.02,0,-.51,.40,'#d1ded5');
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
  // Shared procedural animation: all poses are deterministic and return to rest.
  // "attacking" is the remaining seconds of the existing 0.3s sword swing.
  // Do not rotate the root's X axis: dodge rolls are controlled by world.update().
  let locomotion=0, gaitPhase=0, strikeWeight=0, previousTime=null;
  function animate(time,moving,attacking,options={}){
    const dt=previousTime===null?1/60:Math.max(0,Math.min(.05,time-previousTime));
    previousTime=time;
    const running=!!options.running&&!!moving;
    const target=moving?1:0;
    const blend=1-Math.exp(-dt*12);
    locomotion+=(target-locomotion)*blend;
    gaitPhase+=dt*(running?15:9.3);
    const gait=Math.sin(gaitPhase),opposite=Math.sin(gaitPhase+Math.PI);
    const stride=locomotion*(running?.83:.48);
    // A subtle idle breath, plus small counter-rotation of the torso.
    const breath=Math.sin(time*2.4);
    spine.rotation.x=.018*breath-locomotion*(running?.13:.055);
    chest.rotation.y=locomotion*Math.sin(gaitPhase*2)*.06;
    chest.rotation.z=locomotion*gait*.035;
    if(body.userData.restY===undefined)body.userData.restY=body.scale.y;
    body.scale.y=body.userData.restY*(1+.013*breath);
    hips.rotation.z=locomotion*gait*.045;
    head.rotation.x=-spine.rotation.x*.5+.025*Math.sin(time*1.2);
    head.rotation.y=.018*Math.sin(time*.95);
    // Legs and arms are opposite during walking; knees lift on forward strides.
    left.rotation.x=gait*stride;
    right.rotation.x=opposite*stride;
    kneeL.rotation.x=locomotion*Math.max(0,-gait)*(running?.7:.43);
    kneeR.rotation.x=locomotion*Math.max(0,-opposite)*(running?.7:.43);
    footL.rotation.x=-kneeL.rotation.x*.28;
    footR.rotation.x=-kneeR.rotation.x*.28;
    const sway=.045*Math.sin(time*1.6);
    leftArm.rotation.x=-gait*stride*.66-.08+sway;
    arm.rotation.x=-opposite*stride*.66-.08-sway;
    elbowL.rotation.x=-.12-locomotion*.08;
    elbowR.rotation.x=-.10-locomotion*.10;
    // Wind up, slash and follow-through, with smooth return to the walking pose.
    const active=attacking>0;
    const comboStep=Math.max(1,Math.min(3,options.comboStep||1));
    const duration=comboStep===3?.42:.3;
    const attackPhase=active?Math.max(0,Math.min(1,(duration-attacking)/duration)):1;
    const targetStrike=active?1:0;
    strikeWeight+=(targetStrike-strikeWeight)*(1-Math.exp(-dt*(active?25:13)));
    if(active||strikeWeight>.003){
      const swing=active?Math.sin(attackPhase*Math.PI):0;
      // Different silhouettes: diagonal, cross-body return and overhead finisher.
      const drive=comboStep===3?1.30:comboStep===2?-.88:1;
      arm.rotation.x+=strikeWeight*(-.65-(comboStep===3?1.9:1.45)*swing);
      arm.rotation.z=.17-strikeWeight*drive*(.43+.27*swing);
      elbowR.rotation.x-=strikeWeight*(.3+(comboStep===3?.52:.32)*swing);
      chest.rotation.y+=strikeWeight*(comboStep===2?-.25:.23)*Math.sin(attackPhase*Math.PI);
      chest.rotation.z+=strikeWeight*(comboStep===3?-.09:.05)*swing;
    }else{strikeWeight=0;arm.rotation.z=.17;}
    leftArm.rotation.z=-.17;
    if(!active)arm.rotation.z=.17-strikeWeight*.45;
    // Hair and cloak are animated by external skin attachments, without a simulation.
    return {locomotion,gaitPhase,running,strikeWeight};
  }
  const skeleton=new T.Skeleton(Object.values(joints));
  setSkin(skin);
  return {group,model,joints,skeleton,body,cloth,left,right,arm,blade,guard,setSkin,animate};
}
root.EmberCharacterRig={create};
})(typeof window==='undefined'?globalThis:window);
