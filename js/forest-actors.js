/* Original forest characters. Animation transforms children, never gameplay positions. */
(function(root){
'use strict';
const cache=new WeakMap(),clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
function kit(T,coat='shadow'){
 if(!cache.has(T))cache.set(T,new Map());const entries=cache.get(T);if(entries.has(coat))return entries.get(coat);
 function tint(g,color,shade=.16){
  if(!g.attributes.normal)g.computeVertexNormals();const c=new T.Color(color),n=g.attributes.normal,out=[];
  for(let i=0;i<n.count;i++){const light=.85+shade*(n.getY(i)*.6+n.getZ(i)*.22-n.getX(i)*.12);out.push(c.r*light,c.g*light,c.b*light);}
  g.setAttribute('color',new T.Float32BufferAttribute(out,3));return g;
 }
 function oval(w,h,d,color,x=0,y=0,z=0){return tint(new T.SphereGeometry(1,16,10).scale(w/2,h/2,d/2).translate(x,y,z),color);}
 function taper(top,bottom,h,color,x=0,y=0,z=0){return tint(new T.CylinderGeometry(top,bottom,h,10).translate(x,y,z),color);}
 function merge(parts){
  const p=[],n=[],c=[],indices=[];
  for(const g of parts){const offset=p.length/3;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);c.push(...g.attributes.color.array);if(g.index)for(const i of g.index.array)indices.push(offset+i);else for(let i=0;i<g.attributes.position.count;i++)indices.push(offset+i);g.dispose();}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(indices);g.computeBoundingSphere();return g;
 }
 function tuft(w,h,d,color,x=0,y=0,z=0,angle=0){return tint(new T.ConeGeometry(w,h,5).scale(1,1,d/w).rotateX(angle).translate(x,y,z),color);}
 const fur=coat==='gray'?'#969c9b':'#718793',dark=coat==='gray'?'#626966':'#465c6b',pale=coat==='gray'?'#d5d6c9':'#bdc9c5';
 function loft(rings,color,underside,axis='z'){
  const p=[],ix=[],colors=[],segments=20,base=new T.Color(color),pale=new T.Color(underside);
  for(let r=0;r<rings.length;r++)for(let i=0;i<=segments;i++){
   const angle=i/segments*Math.PI*2,[along,rx,ry,offset=0]=rings[r],x=Math.cos(angle)*rx,y=Math.sin(angle)*ry;
   if(axis==='z')p.push(x,y+offset,along);else p.push(x,along,y+offset);
   const blend=axis==='z'?Math.pow(Math.max(0,-Math.sin(angle)),2)*.78:Math.pow(Math.max(0,Math.sin(angle)),2)*.65,c=base.clone().lerp(pale,blend);colors.push(c.r,c.g,c.b);
  }
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;if(axis==='y')ix.push(a,b,a+1,b,b+1,a+1);else ix.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();
  const normals=g.attributes.normal;for(let r=0;r<rings.length;r++){const a=r*(segments+1),b=a+segments,x=normals.getX(a)+normals.getX(b),y=normals.getY(a)+normals.getY(b),z=normals.getZ(a)+normals.getZ(b),length=Math.hypot(x,y,z)||1;normals.setXYZ(a,x/length,y/length,z/length);normals.setXYZ(b,x/length,y/length,z/length);}return g;
 }
 const body=merge([loft([[-.91,.025,.10,-.04],[-.70,.27,.29,-.04],[-.40,.29,.30,-.03],[0,.29,.31,0],[.34,.34,.39,.035],[.62,.26,.31,.045],[.78,.025,.12,.05]],fur,pale),...[0,1,2].map(i=>tuft(.09,.18,.07,dark,0,.30,.30-i*.18,-1.25))]);
 const neck=loft([[-.42,.08,.13,-.13],[-.25,.29,.25,-.03],[.02,.27,.27,.055],[.20,.19,.20,.11],[.31,.035,.06,.13]],fur,pale,'y');
 const head=merge([loft([[-.24,.025,.08,.02],[-.10,.225,.19,.02],[.10,.205,.17,0],[.28,.15,.112,-.035],[.46,.112,.08,-.065],[.62,.065,.065,-.075]],fur,pale),oval(.17,.115,.12,'#293c46',0,-.055,.65),...[-1,1].map(side=>oval(.115,.035,.09,dark).rotateZ(-side*.17).translate(side*.176,.107,.165)),...[-1,1].map(side=>tint(new T.ConeGeometry(.022,.085,6).rotateX(Math.PI).translate(side*.10,-.15,.43),'#e9e3cc'))]);
 const eyes=merge([-1,1].flatMap(side=>[oval(.073,.043,.05,'#dcae67',side*.176,.067,.175),oval(.018,.031,.015,'#17252d',side*.177,.065,.204),oval(.010,.010,.010,'#fff0ce',side*.170,.078,.214)]));
 const jaw=merge([loft([[-.07,.03,.025,0],[.06,.12,.045,0],[.26,.105,.043,.005],[.43,.058,.03,.024]],pale,pale),oval(.18,.023,.30,'#59484c',0,.039,.22),...[-1,1].map(side=>tint(new T.ConeGeometry(.02,.06,6).translate(side*.08,.055,.30),'#eee4cb'))]);
 function earPiece(points,depth,color,z){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return tint(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.007,bevelSegments:2,steps:1}).translate(0,0,z),color);}
 const ear=merge([earPiece([[-.11,0],[.10,0],[.01,.31]],.06,fur,-.03),earPiece([[-.062,.055],[.061,.055],[.01,.245]],.005,'#9d9d96',.039)]);
 const paw=merge([oval(.23,.19,.33,dark,0,-.026,.06),...[-1,0,1].map(i=>oval(.045,.04,.075,'#d4d2be',i*.062,-.08,.206))]);paw.computeBoundingBox();
 const foreUpper=merge([oval(.22,.35,.25,fur,0,-.14,0),taper(.09,.06,.44,fur,0,-.22,0)]),foreLower=merge([taper(.06,.045,.43,dark,0,-.215,0),oval(.125,.13,.13,dark)]);
 const rearUpper=oval(.31,.46,.35,fur,0,-.16,0),rearLower=merge([taper(.075,.044,.42,dark,0,-.21,0),oval(.13,.17,.16,fur,0,-.015,0)]);
 const tails=[taper(.14,.065,.34,fur,0,0,0),taper(.10,.055,.37,fur,0,0,0),taper(.07,.008,.31,pale,0,0,0)].map(g=>g.rotateX(Math.PI/2).translate(0,0,-.17));
 const material=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.92,metalness:0});
 const result={body,neck,head,eyes,jaw,ear,paw,foreUpper,foreLower,rearUpper,rearLower,tails,material};entries.set(coat,result);return result;
}
function createWolf(T,{coat='shadow',groundLevel=-.1}={}){
 const art=kit(T,coat),pawHeight=groundLevel-art.paw.boundingBox.min.y,group=new T.Group();group.name=coat==='gray'?'Grijze wolf':'Schemerwolf';group.userData.actor='wolf';
 const model=new T.Bone();model.name='wolf_root';group.add(model);const joints={root:model};
 function bone(name,parent,x,y,z){const b=new T.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);joints[name]=b;return b;}
 function part(name,parent,geometry){const mesh=new T.Mesh(geometry,art.material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const spine=bone('wolf_spine',model,0,.97,0);part('wolf_coat',spine,art.body);
 const neck=bone('wolf_neck',spine,0,.15,.57);part('wolf_ruff',neck,art.neck);
 const head=bone('wolf_head',neck,0,.17,.24);part('wolf_face',head,art.head);part('wolf_eyes',head,art.eyes);
 const jaw=bone('wolf_jaw',head,0,-.17,.15);part('wolf_lower_jaw',jaw,art.jaw);
 const ears=[-1,1].map(side=>{const b=bone('wolf_ear_'+(side<0?'l':'r'),head,side*.18,.12,-.08);part('wolf_ear_mesh',b,art.ear);return b;});
 const tails=[];let parent=spine;for(let i=0;i<3;i++){const b=bone('wolf_tail_'+i,parent,0,i===0?-.03:0,i===0?-.76:-.33);part('wolf_tail_mesh',b,art.tails[i]);tails.push(b);parent=b;}
 const legs=[];
 for(const front of [true,false])for(const side of [-1,1]){
  const name=(front?'front_':'rear_')+(side<0?'l':'r'),a=front?.44:.40,b=front?.43:.42;
  const upper=bone('wolf_upper_'+name,spine,side*(front?.25:.24),front?-.07:-.11,front?.50:-.57);
  const lower=bone('wolf_lower_'+name,upper,0,-a,0),paw=bone('wolf_paw_'+name,lower,0,-b,0);
  part('wolf_limb_upper',upper,front?art.foreUpper:art.rearUpper);part('wolf_limb_lower',lower,front?art.foreLower:art.rearLower);part('wolf_paw',paw,art.paw);
  legs.push({upper,lower,paw,a,b,front,side,walkOffset:front?(side<0?0:.5):(side<0?.25:.75),trotOffset:front?(side<0?0:.5):(side<0?.5:1),phaseSwing:false,stance:null,anchor:new T.Vector3(),target:new T.Vector3(),takeoff:new T.Vector3(),landing:new T.Vector3(),progress:0,duration:.2,contact:true});
 }
 const previous=new T.Vector3(),position=new T.Vector3(),velocity=new T.Vector3(),target=new T.Vector3(),pole=new T.Vector3(),origin=new T.Vector3(),direction=new T.Vector3(),elbow=new T.Vector3(),bend=new T.Vector3(),resolved=new T.Vector3(),local=new T.Vector3(),q=new T.Quaternion(),worldQ=new T.Quaternion(),down=new T.Vector3(0,-1,0);
 const deathAnchor=new T.Group();deathAnchor.name='WolfCorpse';let dying=false,deathTime=0,held=false;
 const previousFacing=new T.Quaternion();let initialized=false,elapsed=0,phase=.15,locomotion=0,strike=0,recoil=0,recoilSide=1,bodyDrop=0,gait=0;
 const motion={speed:0,locomotion:0,warning:0,strike:0,contacts:[true,true,true,true]};
 function reset(){if(model.parent!==group){group.add(model);deathAnchor.removeFromParent();}dying=false;held=false;deathTime=0;model.visible=true;model.position.set(0,0,0);model.rotation.set(0,0,0);initialized=false;phase=.15;locomotion=strike=recoil=bodyDrop=gait=0;elapsed=0;for(const leg of legs){leg.stance=null;leg.progress=0;leg.phaseSwing=false;}}
 function defeat(scene,options={}){if(dying||!scene)return;deathAnchor.position.copy(group.position);deathAnchor.quaternion.copy(group.quaternion);scene.add(deathAnchor);deathAnchor.add(model);dying=true;held=options.hold===true;deathTime=0;motion.state='defeat';}
 function attack(){strike=.28;}
 function hit(dx=0,dz=1){recoil=.22;recoilSide=Math.sign(dx*Math.cos(group.rotation.y)-dz*Math.sin(group.rotation.y))||1;}
 function rest(leg){return target.set(leg.side*(leg.front?.31:.30),pawHeight,leg.front?.50:-.57).applyMatrix4(group.matrixWorld);}
 function lift(leg,duration){leg.takeoff.copy(leg.target);leg.landing.copy(rest(leg));leg.duration=Math.max(.12,duration);leg.progress=0;leg.stance=false;}
 function solve(leg){
  // An unreachable stride must shorten along the ground, never pull the paw upward.
  leg.upper.getWorldPosition(origin);const reach=leg.a+leg.b-.001,dy=clamp(leg.target.y-origin.y,-reach+.001,reach-.001),dx=leg.target.x-origin.x,dz=leg.target.z-origin.z,horizontal=Math.hypot(dx,dz),span=Math.sqrt(Math.max(0,reach*reach-dy*dy)),scale=horizontal>span?span/Math.max(.001,horizontal):1;
  resolved.set(origin.x+dx*scale,origin.y+dy,origin.z+dz*scale);direction.subVectors(resolved,origin);const distance=clamp(direction.length(),.03,reach);direction.normalize();
  pole.set(leg.side*.33,.48,leg.front?.06:-.12).applyMatrix4(group.matrixWorld);bend.subVectors(pole,origin);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const along=(leg.a*leg.a-leg.b*leg.b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,leg.a*leg.a-along*along));elbow.copy(origin).addScaledVector(direction,along).addScaledVector(bend,height);
  leg.upper.parent.getWorldQuaternion(q).invert();local.subVectors(elbow,origin).normalize().applyQuaternion(q);leg.upper.quaternion.setFromUnitVectors(down,local);leg.upper.updateMatrixWorld(true);
  leg.upper.getWorldQuaternion(q).invert();local.subVectors(resolved,elbow).normalize().applyQuaternion(q);leg.lower.quaternion.setFromUnitVectors(down,local);leg.lower.updateMatrixWorld(true);
  leg.lower.getWorldQuaternion(q).invert();leg.paw.quaternion.copy(q).multiply(worldQ);
 }
 function update(dt,e={}){
  if(dying){dt=clamp(Number.isFinite(dt)?dt:0,0,.05);deathTime=Math.min(deathTime+dt,held?.85:Infinity);const t=clamp(deathTime/.7),ease=t*t*(3-2*t);model.rotation.z=-1.445*ease;model.position.y=.48*ease;head.rotation.x=.12*ease;jaw.rotation.x=.12;for(const leg of legs){leg.upper.rotation.x=.18*ease;leg.lower.rotation.x=.25*ease;}motion.state='defeat';motion.defeat=ease;if(!held&&deathTime>=1.2){model.visible=false;group.add(model);deathAnchor.removeFromParent();dying=false;}return;}
  if(!group.visible){reset();return;}dt=clamp(Number.isFinite(dt)?dt:0,0,.05);elapsed+=dt;strike=Math.max(0,strike-dt);recoil=Math.max(0,recoil-dt);
  group.updateWorldMatrix(true,false);group.getWorldPosition(position);group.getWorldQuaternion(worldQ);velocity.subVectors(position,previous);const teleport=!initialized||velocity.length()>1.5,turning=teleport?0:Math.min(7,previousFacing.angleTo(worldQ)/Math.max(.001,dt));previousFacing.copy(worldQ);
  if(teleport){velocity.set(0,0,0);initialized=true;for(const leg of legs){leg.target.copy(rest(leg));leg.anchor.copy(leg.target);leg.stance=true;leg.progress=0;leg.phaseSwing=false;}}
  else velocity.divideScalar(Math.max(.001,dt));previous.copy(position);
  const speed=Math.hypot(velocity.x,velocity.z),warning=e.pendingAttack==='melee'&&e.telegraph>0?clamp(1-e.telegraph/.42):0,preparing=e.pendingAttack==='melee'&&e.telegraph>0;
  const active=(speed>.025||turning>.15)&&!preparing&&strike===0,blend=1-Math.exp(-dt*13);locomotion=mix(locomotion,active?1:0,blend);
  const running=clamp((speed-1.3)/1.8);gait=mix(gait,running,blend);const cycle=clamp(.28+speed*.4,.38,1.25),frequency=Math.min(3.5,(speed+turning*.5)/cycle),stancePart=.72-gait*.17,halfStep=speed/Math.max(.1,frequency)*stancePart*.5;
  if(active)phase=(phase+frequency*dt)%1;
  const lunge=strike>0?Math.sin(strike/.28*Math.PI/2):0,hurt=recoil>0?Math.sin((1-recoil/.22)*Math.PI):0,crouch=preparing?(.25+warning*.75):0;
  model.position.set(0,0,lunge*.19-hurt*.055);spine.position.y=.97-locomotion*(.06+gait*.07)-crouch*.16+lunge*.07+Math.sin(phase*Math.PI*4)*locomotion*.008;
  spine.rotation.set(crouch*.09-lunge*.08,0,hurt*.045*recoilSide);spine.scale.set(1+Math.sin(elapsed*2)*.008,1,1);
  neck.position.y=.15-crouch*.08;neck.rotation.set(crouch*.18-lunge*.16,Math.sin(elapsed*.7)*.025*(1-locomotion),hurt*.12*recoilSide);
  head.rotation.set(-.04+Math.sin(elapsed*1.7)*.025+crouch*.04-lunge*.13,Math.sin(elapsed*.9)*.035,hurt*.08*recoilSide);
  jaw.rotation.x=.02+crouch*.43+lunge*.56+hurt*.14;
  for(const [i,ear]of ears.entries()){ear.rotation.x=crouch*-.52-hurt*.18;ear.rotation.z=(i===0?-1:1)*(.10+crouch*.13)+Math.sin(elapsed*1.3+i)*.025;}
  for(const [i,tail]of tails.entries()){tail.rotation.x=-.28-locomotion*.08+crouch*.10;tail.rotation.y=Math.sin(elapsed*2.1-i*.6)*(.10+locomotion*.10)*(1-crouch*.7);}
  group.updateMatrixWorld(true);
  // Finish airborne steps when stopping; then settle one paw at a time, without sliding.
  let settling=null;if(!active&&!legs.some(leg=>leg.stance===false)){let farthest=.05;for(const leg of legs){const distance=leg.target.distanceTo(rest(leg));if(distance>farthest){farthest=distance;settling=leg;}}}
  let supports=0;for(const leg of legs)if(leg.stance!==false)supports++;
  for(const leg of legs){
   const offset=mix(leg.walkOffset,leg.trotOffset,gait),p=(phase+offset)%1,swingPhase=active&&p>=stancePart,startStep=swingPhase&&!leg.phaseSwing;leg.phaseSwing=swingPhase;
   leg.upper.getWorldPosition(origin);const overstretched=active&&Math.hypot(origin.x-leg.anchor.x,origin.z-leg.anchor.z)>.45;
   if(leg.stance!==false&&(startStep&&supports>1||overstretched&&supports>2||leg===settling)){lift(leg,active?(1-stancePart)/Math.max(.1,frequency):.18);supports--;}
   if(leg.stance===false){
    if(active)leg.duration=Math.max(.12,(1-stancePart)/Math.max(.1,frequency));else leg.duration=Math.min(.2,leg.duration);
    leg.progress=clamp(leg.progress+dt/leg.duration);const t=leg.progress,smooth=t*t*(3-2*t),remaining=(1-t)*leg.duration;
    rest(leg);if(active)target.addScaledVector(velocity,halfStep/Math.max(.1,speed)+remaining);leg.landing.lerp(target,1-Math.exp(-dt*20));
    leg.target.lerpVectors(leg.takeoff,leg.landing,smooth);leg.target.y=position.y+pawHeight+16*t*t*(1-t)*(1-t)*(.055+gait*.035);leg.contact=false;
    if(t===1){leg.anchor.copy(leg.landing);leg.target.copy(leg.anchor);leg.stance=true;leg.contact=true;supports++;}
   }else{leg.target.copy(leg.anchor);leg.target.y=position.y+pawHeight;leg.contact=true;}
   if(lunge>0&&leg.front){target.set(leg.side*.31,pawHeight+lunge*.07,.50+lunge*.17).applyMatrix4(group.matrixWorld);leg.target.copy(target);leg.contact=false;}
  }
  let supportDrop=0;for(const leg of legs)if(leg.contact){leg.upper.getWorldPosition(origin);const horizontal=Math.hypot(origin.x-leg.target.x,origin.z-leg.target.z),reach=leg.a+leg.b-.003;supportDrop=Math.max(supportDrop,origin.y-leg.target.y-Math.sqrt(Math.max(.01,reach*reach-horizontal*horizontal)));}
  bodyDrop=Math.max(clamp(supportDrop,0,.20),bodyDrop*Math.exp(-dt*16));model.position.y=-bodyDrop;model.updateMatrixWorld(true);for(const leg of legs)solve(leg);
  motion.speed=speed;motion.locomotion=locomotion;motion.warning=crouch;motion.strike=lunge;legs.forEach((leg,i)=>motion.contacts[i]=leg.contact);
 }
 update(0);return {group,model,joints,legs,motion,update,reset,attack,hit,defeat,get dying(){return dying;}};
}
function createElin(T,options={}){
 const rig=root.EmberCharacterRig.create(T,{skin:'ranger'});rig.group.name=options.id||'Elin';rig.group.userData.npc=options.id||'elin';
 const baseMeshes=[];rig.group.traverse(m=>{if(m.isMesh)baseMeshes.push(m);});rig.blade.visible=rig.guard.visible=false;
 const appearance=root.EmberAppearance.attach(T,rig,null),look={hairStyle:'braid',hairColor:'chestnut',skinTone:'warm',eyeColor:'hazel'};appearance.apply('classic',look);
 const assets=root.EmberModelAssets?.attach(T,rig,{baseMeshes,costumeMeshes:[]},appearance);assets?.setLook('classic',look,'ranger');
 const leather=new T.MeshStandardMaterial({color:'#654b38',roughness:.88}),gold=new T.MeshStandardMaterial({color:'#d0b77c',roughness:.53,metalness:.35,vertexColors:true}),fabric=new T.MeshStandardMaterial({color:'#466b55',roughness:.9,vertexColors:true});
 function part(name,parent,g,mat,x=0,y=0,z=0){const m=new T.Mesh(g,mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 const art=root.EmberHeroArt?.create(T),chest=rig.joints.chest;
 if(art){
  const leaf=art.plate([[0,.17],[-.06,.12],[-.045,.075],[-.09,.04],[-.065,-.015],[-.03,-.04],[0,-.13],[.03,-.04],[.065,-.015],[.09,.04],[.045,.075],[.06,.12]],.025,.008);part('elin_oak_brooch',chest,leaf,gold,0,.19,.39);
  for(const side of [-1,1]){const mantle=art.curvedPlate([[-.20,.10],[0,.18],[.22,.06],[.18,-.14],[0,-.23],[-.18,-.13]],.035,.06,.23);const m=part('elin_leaf_mantle',rig.joints[side<0?'upper_arm_l':'upper_arm_r'],mantle,fabric,side*.025,.025,.10);m.rotation.z=-side*.22;}
  const braidBand=part('elin_braid_band',rig.joints.head,new T.TorusGeometry(.058,.014,5,14),gold,0,-.43,-.27);braidBand.rotation.x=Math.PI/2;
 }
 const back=new T.Group();back.name='ElinQuiver';back.position.set(.24,-.14,-.17);back.rotation.z=-.15;rig.joints.back.add(back);
 part('elin_quiver',back,new T.CylinderGeometry(.15,.11,.86,12,1,true),leather,0,-.18,0);
 const bandMat=new T.MeshStandardMaterial({color:'#b89f70',roughness:.67,metalness:.18});
 for(const y of [-.56,.21])part('elin_quiver_band',back,new T.TorusGeometry(.151,.025,5,16),bandMat,0,y,0).rotation.x=Math.PI/2;
 const arrowShafts=[],featherGeo=[];
 for(let i=0;i<4;i++){
  const x=(i%2-.5)*.10,z=(Math.floor(i/2)-.5)*.10,y=.48+(i%3)*.05;
  arrowShafts.push(new T.CylinderGeometry(.012,.012,.75,5).translate(x,y-.19,z));
  featherGeo.push(new T.BoxGeometry(.12,.19,.018).translate(x,y+.11,z),new T.BoxGeometry(.018,.19,.12).translate(x,y+.11,z));
 }
 function combine(parts){const p=[],n=[],ix=[];for(const g of parts){const offset=p.length/3;p.push(...g.attributes.position.array);n.push(...g.attributes.normal.array);for(const i of g.index.array)ix.push(offset+i);g.dispose();}const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(p,3));result.setAttribute('normal',new T.Float32BufferAttribute(n,3));result.setIndex(ix);return result;}
 part('elin_arrow_shafts',back,combine(arrowShafts),leather);part('elin_arrow_fletching',back,combine(featherGeo),new T.MeshStandardMaterial({color:'#dedbc4',roughness:.95}));
 const bow=new T.Group();bow.name='ElinStowedBow';bow.position.set(-.27,-.03,-.17);bow.rotation.z=.32;rig.joints.back.add(bow);
 const curve=new T.QuadraticBezierCurve3(new T.Vector3(0,-.66,0),new T.Vector3(-.36,0,-.18),new T.Vector3(0,.66,0));part('elin_bow',bow,new T.TubeGeometry(curve,20,.035,6,false),leather);
 bow.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-.66,0),new T.Vector3(0,.66,0)]),new T.LineBasicMaterial({color:'#d9c498'})));
 const ready=assets?.ready.then(ok=>{
  if(ok)assets.models.getObjectByName('GLB_classic')?.traverse(m=>{if(!m.isSkinnedMesh)return;const colors={fabric:'#526f58',cape:'#355446',leather:'#6a4e36',metal:'#9b8e68'};if(colors[m.material.name])m.material.color.set(colors[m.material.name]);});return ok;
 })||Promise.resolve(false);
 let elapsed=0,talking=false,talkBlend=0;const homeYaw=.6,palm=new T.Vector3(),pole=new T.Vector3(),handQ=new T.Quaternion(),tiltQ=new T.Quaternion(),tilt=new T.Euler();
 function setTalking(value){talking=!!value;}
 function reset(){talking=false;talkBlend=0;elapsed=0;rig.group.rotation.y=homeYaw;rig.resetMotion();}
 function update(dt,player){
  if(!rig.group.visible)return;dt=clamp(Number.isFinite(dt)?dt:0,0,.05);elapsed+=dt;
  const near=player&&Number.isFinite(player.x)&&Number.isFinite(player.z)&&Math.hypot(player.x-rig.group.position.x,player.z-rig.group.position.z)<5;
  const desired=talking?homeYaw:near?Math.atan2(player.x-rig.group.position.x,player.z-rig.group.position.z):homeYaw,delta=Math.atan2(Math.sin(desired-rig.group.rotation.y),Math.cos(desired-rig.group.rotation.y));rig.group.rotation.y+=clamp(delta,-dt*2.4,dt*2.4);
  talkBlend=mix(talkBlend,talking?1:0,1-Math.exp(-dt*6));rig.animate(elapsed,false,0,{dt,weapon:'none'});appearance.animate(elapsed);assets?.animate(elapsed);
  rig.joints.head.rotation.x+=Math.sin(elapsed*3.4)*.045*talkBlend;rig.joints.head.rotation.y+=Math.sin(elapsed*.9)*.035;
  if(talkBlend>.001){
   rig.group.updateWorldMatrix(true,true);rig.group.getWorldQuaternion(handQ);handQ.multiply(tiltQ.setFromEuler(tilt.set(-.55,0,-.2)));
   palm.set(-.59,1.40+talkBlend*(.29+Math.sin(elapsed*2.5)*.055),.24+talkBlend*.20);rig.group.localToWorld(palm);pole.set(-.90,1.70,.05);rig.group.localToWorld(pole);rig.aimArm('l',palm,pole,handQ);
  }
  return talkBlend;
 }
 return {...rig,assets,appearance,ready,back,bow,setTalking,update,reset,get talking(){return talking;},get talkBlend(){return talkBlend;}};
}
root.EmberForestActors={createWolf,createElin,createRangerNPC:createElin};
})(typeof window==='undefined'?globalThis:window);
