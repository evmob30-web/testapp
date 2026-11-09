/* Emberwild reusable procedural humanoid rig.
 * Local +Z is forward, +Y up. All proportions in world units.
 * The joints are real THREE.Bone transforms shared by the weighted GLB models,
 * weapon/equipment attachments and the lightweight procedural fallback.
 */
(function(root){
'use strict';
function create(T, options={}){
  const skin=options.skin||'guardian', art=root.EmberHeroArt?.create(T);
  const group=new T.Group();group.name='Character';
  const model=new T.Bone();model.name='rig_root';model.position.y=1.2;group.add(model);
  const joints={root:model};
  function joint(name,parent,x,y,z){const g=new T.Bone();g.name=name;g.position.set(x,y,z);parent.add(g);joints[name]=g;return g;}
  function material(color,emissive){return new T.MeshStandardMaterial({color,roughness:.78,metalness:.18,flatShading:false,emissive:emissive||0,emissiveIntensity:emissive ? 0.45 : 0});}
  function cube(parent,name,w,h,d,x,y,z,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  function ellipsoid(parent,name,w,h,d,x,y,z,color){const m=new T.Mesh(new T.SphereGeometry(1,18,12),material(color));m.name=name;m.scale.set(w/2,h/2,d/2);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  function tapered(parent,name,top,bottom,height,x,y,z,color){const m=new T.Mesh(new T.CylinderGeometry(top,bottom,height,14,1),material(color));m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  const palette=skin==='ranger'?{armor:'#637e64',fabric:'#829b74',cape:'#567357',accent:'#b8c88e'}:{armor:'#626e79',fabric:'#a0b0a3',cape:'#81958a',accent:'#d7ae6b'};
  const hips=joint('hips',model,0,.30,0);
  ellipsoid(hips,'pelvis',.67,.43,.48,0,0,0,palette.armor);
  const spine=joint('spine',hips,0,.27,0);
  const chest=joint('chest',spine,0,.34,0);
  const body=ellipsoid(chest,'body',.86,.97,.59,0,-.09,0,palette.armor);
  const neck=joint('neck',chest,0,.38,0);
  const head=joint('head',neck,0,.11,0);
  ellipsoid(head,'face',.45,.49,.43,0,.09,.025,'#dab58d');
  ellipsoid(head,'hair',.7,.41,.63,0,.43,-.07,'#59483b');
  const cloth=ellipsoid(chest,'cloak',.85,1.04,.12,0,-.28,-.33,palette.cape);
  const left=joint('upper_leg_l',hips,-.24,-.23,0);
  tapered(left,'thigh_l',.19,.15,.68,0,-.34,0,'#514f46');
  const kneeL=joint('lower_leg_l',left,0,-.68,0);
  tapered(kneeL,'shin_l',.16,.12,.61,0,-.30,0,'#514f46');
  const footL=joint('foot_l',kneeL,0,-.61,.08);
  ellipsoid(footL,'boot_l',.35,.22,.52,0,-.02,.12,'#393d40');
  const right=joint('upper_leg_r',hips,.24,-.23,0);
  tapered(right,'thigh_r',.19,.15,.68,0,-.34,0,'#514f46');
  const kneeR=joint('lower_leg_r',right,0,-.68,0);
  tapered(kneeR,'shin_r',.16,.12,.61,0,-.30,0,'#514f46');
  const footR=joint('foot_r',kneeR,0,-.61,.08);
  ellipsoid(footR,'boot_r',.35,.22,.52,0,-.02,.12,'#393d40');
  const leftArm=joint('upper_arm_l',chest,-.53,.20,0);
  leftArm.rotation.z=-.17;
  tapered(leftArm,'upper_arm_mesh_l',.17,.125,.61,0,-.30,0,palette.armor);
  const elbowL=joint('lower_arm_l',leftArm,0,-.61,0);
  tapered(elbowL,'forearm_l',.15,.105,.53,0,-.265,0,'#514f46');
  const handL=joint('hand_l',elbowL,0,-.53,0);
  ellipsoid(handL,'glove_l',.27,.28,.27,0,-.06,0,'#403e40');
  const arm=joint('upper_arm_r',chest,.53,.20,0);
  arm.rotation.z=.17;
  tapered(arm,'upper_arm_mesh_r',.17,.125,.61,0,-.30,0,palette.armor);
  const elbowR=joint('lower_arm_r',arm,0,-.61,0);
  tapered(elbowR,'forearm_r',.15,.105,.53,0,-.265,0,'#514f46');
  const handR=joint('hand_r',elbowR,0,-.53,0);
  ellipsoid(handR,'glove_r',.27,.28,.27,0,-.06,0,'#403e40');
  // Weapon attaches to the right hand; these references preserve game combat.
  const socket=joint('weapon_r',handR,0,-.14,.05);
  const blade=tapered(socket,'blade',.072,.115,1.02,0,-.51,.12,'#d1ded5');
  const guard=cube(socket,'guard',.50,.11,.19,0,-.12,.12,'#e2bd78');
  if(art){blade.geometry.dispose();blade.geometry=art.swordBlade();guard.geometry.dispose();guard.geometry=art.plate([[-.24,.045],[-.13,.005],[0,.02],[.13,.005],[.24,.045],[.20,-.035],[.10,-.05],[0,-.025],[-.10,-.05],[-.20,-.035]],.075,.012);}
  // A dedicated back socket can carry bows, backpacks and capes.
  joint('back',chest,0,0,-.38);
  function setSkin(next){
    const palettes={
      guardian:{armor:'#626e79',cape:'#81958a'},
      ranger:{armor:'#637e64',cape:'#567357'},
      mage:{armor:'#65558c',cape:'#423768'},
      flame_guardian:{armor:'#48444c',cape:'#932e32'}
    };
    const p=palettes[next]||palettes.guardian;
    body.material.color.set(p.armor);cloth.material.color.set(p.cape);
  }
  // Animation only: rest transforms above and GLB inverse bind matrices stay unchanged.
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,t)=>a+(b-a)*t;
  function chain(upper,lower,end){return {upper,lower,end,a:lower.position.length(),b:end.position.length(),axisA:lower.position.clone().normalize(),axisB:end.position.clone().normalize(),start:new T.Vector3(),delta:new T.Vector3(),pole:new T.Vector3(),mid:new T.Vector3(),resolved:new T.Vector3(),direction:new T.Vector3(),q:new T.Quaternion(),parentQ:new T.Quaternion()};}
  const legL=chain(left,kneeL,footL),legR=chain(right,kneeR,footR),armL=chain(leftArm,elbowL,handL),armR=chain(arm,elbowR,handR);
  function solve(c,target,pole,orientation){
    c.upper.updateWorldMatrix(true,false);c.start.setFromMatrixPosition(c.upper.matrixWorld);
    c.delta.copy(target).sub(c.start);const length=clamp(c.delta.length(),.025,c.a+c.b-.0002);c.delta.normalize();c.resolved.copy(c.start).addScaledVector(c.delta,length);
    c.pole.copy(pole).sub(c.start);c.pole.addScaledVector(c.delta,-c.pole.dot(c.delta));
    if(c.pole.lengthSq()<1e-8)c.pole.set(0,0,1).addScaledVector(c.delta,-c.delta.z);c.pole.normalize();
    const along=(c.a*c.a-c.b*c.b+length*length)/(2*length),height=Math.sqrt(Math.max(0,c.a*c.a-along*along));
    c.mid.copy(c.start).addScaledVector(c.delta,along).addScaledVector(c.pole,height);
    c.upper.parent.getWorldQuaternion(c.parentQ).invert();c.direction.copy(c.mid).sub(c.start).normalize().applyQuaternion(c.parentQ);
    c.upper.quaternion.setFromUnitVectors(c.axisA,c.direction);c.upper.updateMatrixWorld(true);
    c.upper.getWorldQuaternion(c.parentQ).invert();c.direction.copy(c.resolved).sub(c.mid).normalize().applyQuaternion(c.parentQ);
    c.lower.quaternion.setFromUnitVectors(c.axisB,c.direction);c.lower.updateMatrixWorld(true);
    if(orientation){c.lower.getWorldQuaternion(c.parentQ).invert();c.end.quaternion.copy(c.parentQ).multiply(orientation);c.end.updateMatrixWorld(true);}
  }
  const palmOffset=new T.Vector3(0,-.085,.015),handTarget=new T.Vector3();
  function aimArm(side,palm,pole,orientation){handTarget.copy(palmOffset).applyQuaternion(orientation);handTarget.subVectors(palm,handTarget);solve(side==='l'?armL:armR,handTarget,pole,orientation);}
  function palmWorld(side,target=new T.Vector3()){return (side==='l'?handL:handR).localToWorld(target.copy(palmOffset));}
  const poseBase={chest:new T.Euler(),head:new T.Euler()};
  function resetUpperPose(){chest.rotation.copy(poseBase.chest);head.rotation.copy(poseBase.head);chest.updateMatrixWorld(true);}
  const feet=[{side:-1,chain:legL,anchor:new T.Vector3(),target:new T.Vector3(),takeoff:new T.Vector3(),landing:new T.Vector3(),stance:null,offset:0,contact:true},{side:1,chain:legR,anchor:new T.Vector3(),target:new T.Vector3(),takeoff:new T.Vector3(),landing:new T.Vector3(),stance:null,offset:0,contact:true}];
  const rootPosition=new T.Vector3(),previousPosition=new T.Vector3(),velocity=new T.Vector3(),localTarget=new T.Vector3(),worldTarget=new T.Vector3(),poleTarget=new T.Vector3(),footQ=new T.Quaternion(),groupQ=new T.Quaternion(),pitchQ=new T.Quaternion();
  const footPitchAxis=new T.Vector3(1,0,0);
  let locomotion=0,runBlend=0,gaitPhase=.25,previousTime=null,previousYaw=0,initialized=false,wasMoving=false,wasRolling=false;
  const motion={locomotion:0,gaitPhase:0,running:false,strikeWeight:0,rolling:false,contacts:[true,true],speed:0};
  function resetMotion(){initialized=false;locomotion=0;runBlend=0;gaitPhase=.25;previousTime=null;wasMoving=false;wasRolling=false;for(const f of feet)f.stance=null;}
  function restFeet(){
    group.updateWorldMatrix(true,false);
    for(const f of feet){f.target.set(f.side*.24,-.02,.08).applyMatrix4(group.matrixWorld);f.anchor.copy(f.target);f.stance=null;f.contact=true;}
  }
  function animate(time,moving,attacking,options={}){
    const dt=Number.isFinite(options.dt)?clamp(options.dt,0,.05):previousTime===null?1/60:clamp(time-previousTime,1/240,.05);previousTime=time;
    group.updateWorldMatrix(true,false);rootPosition.setFromMatrixPosition(group.matrixWorld);group.getWorldQuaternion(groupQ);
    const yaw=group.rotation.y,yawDelta=Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw));previousYaw=yaw;
    velocity.subVectors(rootPosition,previousPosition);const distance=velocity.length();
    const teleported=!initialized||distance>1.5||Math.abs(yawDelta)>1.2;
    if(teleported){restFeet();velocity.set(0,0,0);initialized=true;}
    else velocity.divideScalar(Math.max(.001,dt));
    previousPosition.copy(rootPosition);
    const rolling=Number.isFinite(options.roll)&&options.roll>=0,rollProgress=rolling?clamp(options.roll):0;
    const measured=options.worldMotion?Math.hypot(velocity.x,velocity.z):(moving?(options.running?7.5:5):0);
    const active=!!moving&&!rolling&&measured>.04;
    const blend=1-Math.exp(-dt*14);locomotion=mix(locomotion,active?1:0,blend);runBlend=mix(runBlend,active&&options.running&&measured>6.25?1:0,1-Math.exp(-dt*9));
    const cycle=2.6+runBlend*.7,frequency=Math.min(3.1,measured/cycle);
    if(active&&!wasMoving){gaitPhase=.25;for(const f of feet)f.stance=null;}
    if(active)gaitPhase=(gaitPhase+frequency*dt)%1;wasMoving=active;
    const breath=Math.sin(time*2.15),gait=Math.sin(gaitPhase*Math.PI*2),stepBob=Math.cos(gaitPhase*Math.PI*4);
    const drop=.025+locomotion*(.17+runBlend*.12);
    model.rotation.x=rolling?smooth(rollProgress)*Math.PI*2:0;
    model.position.y=1.2+(rolling?Math.sin(rollProgress*Math.PI)*.24:0);
    hips.position.set(0,.30-drop+locomotion*.018*stepBob+.003*breath,locomotion*.025);
    hips.rotation.set(0,locomotion*gait*.025,locomotion*gait*.023+.003*breath);
    spine.rotation.set(.012*breath+locomotion*(.055+runBlend*.075),0,0);
    chest.rotation.set(0,-locomotion*gait*.045,-locomotion*gait*.017);
    neck.rotation.set(0,0,0);head.rotation.set(-spine.rotation.x*.7,.014*Math.sin(time*.8),0);
    if(body.userData.restY===undefined)body.userData.restY=body.scale.y;body.scale.y=body.userData.restY*(1+.009*breath);
    leftArm.rotation.set(-.10+gait*locomotion*(.27+runBlend*.16),0,-.17);
    arm.rotation.set(-.16-gait*locomotion*(.27+runBlend*.16),0,.17);
    elbowL.rotation.set(-.17-runBlend*.35,0,0);elbowR.rotation.set(-.20-runBlend*.35,0,0);
    handL.rotation.set(0,0,0);handR.rotation.set(0,0,0);joints.back.scale.set(1,1,1);
    const attackingNow=attacking>0&&(options.weapon||'sword')==='sword',step=clamp(options.comboStep||1,1,3),duration=step===3?.42:.3;
    if(attackingNow&&!rolling){
      const p=clamp((duration-attacking)/duration),impact=step===3?.16/.42:.105/.3;
      const windup=step===1?[-2.0,-.25,.75,-.95,-.18]:step===2?[-1.8,.40,-.55,-.8,.25]:[-2.65,0,.05,-.8,-.08];
      const strike=step===1?[-1.2,.15,-.35,-.30,.18]:step===2?[-1.05,-.2,.55,-.35,-.18]:[-1.2,0,.10,-.25,.08];
      const follow=step===1?[-.20,.25,-.55,-.16,.28]:step===2?[-.40,-.35,.45,-.22,-.25]:[-.25,0,.15,-.30,.05];
      const base=[arm.rotation.x,0,.17,elbowR.rotation.x,chest.rotation.y];let a,b,t;
      if(p<.23){a=base;b=windup;t=smooth(p/.23);}else if(p<impact){a=windup;b=strike;t=smooth((p-.23)/(impact-.23));}else if(p<.72){a=strike;b=follow;t=smooth((p-impact)/(.72-impact));}else{a=follow;b=base;t=smooth((p-.72)/.28);}
      arm.rotation.set(mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t));elbowR.rotation.x=mix(a[3],b[3],t);chest.rotation.y=mix(a[4],b[4],t);
      const weight=Math.sin(p*Math.PI);leftArm.rotation.x-=weight*.4;elbowL.rotation.x-=weight*.5;chest.rotation.x+=(step===3?.11:.035)*weight;motion.strikeWeight=weight;
    }else motion.strikeWeight=0;
    if(rolling){
      const tuck=Math.pow(Math.sin(rollProgress*Math.PI),.65);
      hips.position.y=.30-.18*tuck;hips.rotation.set(.45*tuck,0,0);spine.rotation.x=.65*tuck;chest.rotation.set(.55*tuck,0,0);neck.rotation.x=.10*tuck;head.rotation.set(.25*tuck,0,0);
      for(const c of [legL,legR]){c.upper.rotation.set(-1.35*tuck,0,0);c.lower.rotation.set(2.15*tuck,0,0);c.end.rotation.set(-.45*tuck,0,0);}
      leftArm.rotation.set(-1.4*tuck,0,-.17-.22*tuck);arm.rotation.set(-1.4*tuck,0,.17+.22*tuck);elbowL.rotation.x=elbowR.rotation.x=-1.2*tuck;joints.back.scale.y=1-.45*tuck;
      group.updateMatrixWorld(true);
      // Keep the curled body above the floor throughout a full forward tumble.
      let lowest=Infinity;for(const [bone,radius] of [[head,.32],[chest,.42],[hips,.31],[kneeL,.17],[kneeR,.17],[footL,.23],[footR,.23],[handL,.13],[handR,.13]]){bone.getWorldPosition(worldTarget);lowest=Math.min(lowest,worldTarget.y-radius);}
      model.position.y+=Math.max(0,rootPosition.y-.095-lowest);model.updateMatrixWorld(true);wasRolling=true;
      for(const f of feet){f.contact=false;f.stance=null;}
    }else{
      if(wasRolling||teleported){restFeet();wasRolling=false;}
      group.updateMatrixWorld(true);
      for(const f of feet){
        const phase=(gaitPhase+(f.side>0?.5:0))%1,stance=phase<.5,halfStep=cycle*.25*locomotion,ground=rootPosition.y-.02;
        if(locomotion<.035||!active&&locomotion<.30){
          localTarget.set(f.side*.24,-.02,.08).applyMatrix4(group.matrixWorld);f.target.lerp(localTarget,1-Math.exp(-dt*14));f.target.y=mix(f.target.y,ground,1-Math.exp(-dt*20));f.stance=null;f.contact=Math.abs(f.target.y-ground)<.015;
        }else if(!options.worldMotion){
          const t=stance?phase/.5:(phase-.5)/.5;
          localTarget.set(f.side*.24,-.02+(stance?0:Math.sin(t*Math.PI)*(.15+.12*runBlend)*locomotion),.08+halfStep*(stance?1-2*t:-1+2*smooth(t)));
          f.target.copy(localTarget).applyMatrix4(group.matrixWorld);f.contact=stance;f.stance=stance;
        }else if(stance){
          if(f.stance!==true)f.anchor.copy(f.stance===false?f.landing:f.target);f.target.copy(f.anchor);f.target.y=ground;f.contact=true;f.stance=true;
        }else{
          const raw=(phase-.5)/.5;
          if(f.stance!==false){f.takeoff.copy(f.target);f.offset=raw;f.stance=false;}
          const t=clamp((raw-f.offset)/Math.max(.01,1-f.offset));
          localTarget.set(f.side*.24,-.02,.08).applyMatrix4(group.matrixWorld);localTarget.addScaledVector(velocity,halfStep/Math.max(.1,measured));
          const remaining=(1-phase)/Math.max(.1,frequency);localTarget.addScaledVector(velocity,remaining);
          f.landing.copy(localTarget);f.target.lerpVectors(f.takeoff,f.landing,smooth(t));f.target.y=ground+Math.sin(t*Math.PI)*(.15+.12*runBlend)*locomotion;f.contact=false;
        }
        f.phase=phase;
      }
      // A planted foot may briefly trail farther during acceleration or a turn.
      // Let the pelvis settle enough to reach it instead of sliding the sole.
      let supportDrop=0;
      for(const f of feet)if(f.contact){
        f.chain.upper.getWorldPosition(worldTarget);
        const horizontal=Math.hypot(worldTarget.x-f.target.x,worldTarget.z-f.target.z),reach=f.chain.a+f.chain.b-.004;
        supportDrop=Math.max(supportDrop,worldTarget.y-f.target.y-Math.sqrt(Math.max(.01,reach*reach-horizontal*horizontal)));
      }
      hips.position.y-=clamp(supportDrop,0,.25);hips.updateMatrixWorld(true);
      for(const f of feet){
        poleTarget.set(f.side*.24,.65,.8).applyMatrix4(group.matrixWorld);
        const swing=f.phase<.5?0:Math.sin((f.phase-.5)/.5*Math.PI),pitch=f.contact?0:-.18*swing;
        footQ.copy(groupQ).multiply(pitchQ.setFromAxisAngle(footPitchAxis,pitch));solve(f.chain,f.target,poleTarget,footQ);
      }
    }
    poseBase.chest.copy(chest.rotation);poseBase.head.copy(head.rotation);
    motion.locomotion=locomotion;motion.gaitPhase=gaitPhase;motion.running=runBlend>.5;motion.rolling=rolling;motion.contacts[0]=feet[0].contact;motion.contacts[1]=feet[1].contact;motion.speed=measured;
    return motion;
  }
  group.updateMatrixWorld(true);
  const skeleton=new T.Skeleton(Object.values(joints));
  setSkin(skin);
  return {group,model,joints,skeleton,body,cloth,left,right,arm,blade,guard,setSkin,animate,aimArm,palmWorld,resetUpperPose,resetMotion,motion};
}
root.EmberCharacterRig={create};
})(typeof window==='undefined'?globalThis:window);
