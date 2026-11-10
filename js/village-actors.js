/* Original village outfits on the shared weighted character rig. No extra assets. */
(function(root){
'use strict';
const cache=new WeakMap(),clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const profiles={
 bram:{name:'Bram',yaw:-.8,phase:.4,hand:'r',look:{hairStyle:'short',hairColor:'chestnut',skinTone:'tan',eyeColor:'hazel'},colors:{fabric:'#93734d',cape:'#654744',leather:'#725039',trousers:'#3b4141'},cloth:'#ac8254',trim:'#d7b784',accent:'#713d43'},
 mira:{name:'Mira',yaw:-.5,phase:2.1,hand:'l',look:{hairStyle:'long',hairColor:'chestnut',skinTone:'warm',eyeColor:'green'},colors:{fabric:'#b88676',cape:'#75556a',leather:'#795449',trousers:'#62515e'},cloth:'#dec5a0',trim:'#e8cf9c',accent:'#87637c'},
 tovin:{name:'Tovin',yaw:.7,phase:4.3,hand:'l',look:{hairStyle:'short',hairColor:'silver',skinTone:'olive',eyeColor:'blue'},colors:{fabric:'#597d78',cape:'#49615c',leather:'#79664b',trousers:'#42534d'},cloth:'#79805c',trim:'#c0ad7f',accent:'#a9a080'}
};
// Bake each outfit once. Parts on the same bone/material are batched together.
function outfit(T,id){
 if(!cache.has(T))cache.set(T,new Map());const saved=cache.get(T);if(saved.has(id))return saved.get(id);
 const art=root.EmberHeroArt.create(T),batches=new Map();
 function add(name,bone,material,g,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1]){
  const key=name+'|'+bone+'|'+material;if(!batches.has(key))batches.set(key,{name,bone,material,p:[],n:[],c:[],ix:[]});const b=batches.get(key),offset=b.p.length/3;
  const matrix=new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale));g.applyMatrix4(matrix);if(!g.attributes.normal)g.computeVertexNormals();
  const p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color;
  for(let i=0;i<p.count;i++){b.p.push(p.getX(i),p.getY(i),p.getZ(i));b.n.push(n.getX(i),n.getY(i),n.getZ(i));b.c.push(c?c.getX(i):1,c?c.getY(i):1,c?c.getZ(i):1);}
  for(let i=0;i<(g.index?g.index.count:p.count);i++)b.ix.push(offset+(g.index?g.index.getX(i):i));g.dispose();
 }
 const box=(name,bone,mat,size,pos,rot)=>add(name,bone,mat,new T.BoxGeometry(...size),pos,rot);
 const orb=(name,bone,mat,size,pos)=>add(name,bone,mat,new T.SphereGeometry(1,12,8),pos,[0,0,0],size);
 const plate=(name,bone,mat,outline,pos,depth=.024,bow=0)=>add(name,bone,mat,bow?art.curvedPlate(outline,depth,bow):art.plate(outline,depth,.006),pos);
 const tube=(name,bone,mat,points,r=.009)=>add(name,bone,mat,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),14,r,5,false));
 function drape(rows){
  const p=[],ix=[],segments=10;
  for(const [y,width,z,bow]of rows)for(let i=0;i<=segments;i++){const u=i/segments*2-1;p.push(u*width,y,z-bow*u*u+.004*Math.sin(u*Math.PI*3));}
  for(let r=0;r<rows.length-1;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;ix.push(a,b,a+1,a+1,b,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return art.paint(g,.12);
 }
 function apron(prefix,cloth){
  add(prefix+'_apron','chest',cloth,drape([[.24,.19,.39,.025],[.12,.22,.455,.025],[-.12,.25,.465,.025],[-.34,.26,.44,.025],[-.44,.25,.415,.025],[-.62,.29,.335,.025]]));
  add(prefix+'_apron','hips',cloth,drape([[.03,.30,.30,.04],[-.20,.31,.34,.04],[-.42,.325,.35,.045],[-.63,.33,.36,.045]]));
  for(const side of [-1,1])tube(prefix+'_apron','chest','trim',[[side*.20,.32,.22],[side*.20,.20,.29],[side*.22,.08,.36],[side*.23,-.20,.36]],.014);
  plate(prefix+'_apron','hips','leather',[[-.34,.06],[.34,.06],[.34,-.035],[-.34,-.035]],[0,0,.32]);
  plate(prefix+'_apron','hips','trim',[[-.05,.04],[.05,.04],[.05,-.03],[-.05,-.03]],[.08,0,.36]);
 }
 if(id==='bram'){
  apron('bram','cloth');
  add('bram_beard','head','hair',art.loft([[-.035,.145,.115,.045],[-.09,.14,.11,.055],[-.17,.11,.09,.05],[-.24,.045,.035,.045]],20));
  for(const side of [-1,1])add('bram_beard','head','hair',art.lock([[side*.012,-.015,.20],[side*.07,-.025,.19],[side*.11,-.06,.16]],.024,.014,10));
  orb('bram_purse','hips','leather',[.13,.18,.11],[.41,-.15,.16]);
  add('bram_purse','hips','trim',new T.TorusGeometry(.075,.014,5,12),[.41,.015,.16],[Math.PI/2,0,0]);
  for(let i=0;i<3;i++){
   const x=-.23+i*.15;add('bram_potions','hips',i===1?'glass':'green',new T.CylinderGeometry(.05,.06,.19,10),[x,-.17,.38]);
   add('bram_potions','hips','trim',new T.CylinderGeometry(.025,.025,.07,8),[x,-.04,.38]);
   box('bram_potions','hips','leather',[.105,.045,.035],[x,-.18,.435]);
  }
  box('bram_ledger','hips','accent',[.20,.32,.085],[-.41,-.15,.07],[0,0,-.16]);
  box('bram_ledger','hips','paper',[.16,.27,.06],[-.43,-.15,.12],[0,0,-.16]);
  box('bram_ledger','hips','trim',[.025,.31,.02],[-.34,-.14,.16],[0,0,-.16]);
 }else if(id==='mira'){
  apron('mira','cloth');
  add('mira_shawl','chest','accent',art.loft([[.28,.23,.18],[.19,.40,.36],[.06,.66,.50],[-.12,.58,.51],[-.21,.49,.49]],28));
  for(const side of [-1,1]){
   tube('mira_shawl','chest','trim',[[side*.22,.20,.36],[side*.42,.08,.405],[side*.46,-.13,.32]],.012);
   add('mira_shawl',side<0?'upper_arm_l':'upper_arm_r','accent',art.loft([[.05,.14,.16],[-.10,.21,.20],[-.28,.19,.19]],20));
  }
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5;orb('mira_flower_brooch','chest','trim',[.035,.053,.015],[-.25+Math.sin(a)*.048,.10+Math.cos(a)*.048,.49]);
  }
  orb('mira_flower_brooch','chest','green',[.03,.03,.017],[-.25,.10,.513]);
  plate('mira_apron','hips','accent',[[-.13,-.20],[.13,-.20],[.11,-.39],[-.11,-.39]],[0,0,.36]);
  for(const x of [-.07,0,.07])tube('mira_embroidery','hips','trim',[[x-.02,-.49,.35],[x,-.46,.357],[x+.02,-.49,.35]],.005);
  add('mira_hairband','head','accent',new T.TorusGeometry(.245,.018,5,28),[0,.285,-.035],[Math.PI/2,0,0]);
 }else{
  // A soft field mantle, packed satchel, rolled blanket and visible gathered herbs.
  add('tovin_mantle','chest','cloth',art.loft([[.28,.20,.16],[.17,.40,.36],[-.04,.60,.49],[-.19,.49,.48]],24));
  for(const side of [-1,1])add('tovin_mantle',side<0?'upper_arm_l':'upper_arm_r','cloth',art.loft([[.05,.14,.16],[-.10,.21,.20],[-.26,.19,.19]],20));
  for(const side of [-1,1])tube('tovin_pack_straps','chest','leather',[[side*.28,.30,.18],[side*.32,.04,.36],[side*.29,-.34,.33]],.034);
  add('tovin_satchel','back','cloth',art.loft([[.08,.21,.13,-.20],[-.03,.31,.17,-.20],[-.54,.30,.16,-.20],[-.65,.20,.12,-.20]],20));
  plate('tovin_satchel','back','leather',[[-.29,.05],[.29,.05],[.27,-.20],[0,-.27],[-.27,-.20]],[0,0,-.39]);
  for(const x of [-.17,.17])box('tovin_satchel','back','trim',[.045,.075,.025],[x,-.20,-.425]);
  add('tovin_bedroll','back','accent',new T.CylinderGeometry(.13,.13,.74,16),[0,.20,-.24],[0,0,Math.PI/2]);
  for(const x of [-.22,.22])add('tovin_bedroll','back','leather',new T.TorusGeometry(.133,.018,5,16),[x,.20,-.24],[0,Math.PI/2,0]);
  for(let i=0;i<3;i++){
   const x=.22+i*.045; tube('tovin_herbs','back','green',[[x,-.12,-.19],[x+.04,.10,-.24],[x+.08,.30+i*.04,-.26]],.009);
   for(const side of [-1,1])add('tovin_herbs','back','green',art.lock([[x+.04,.16,-.24],[x+side*.10,.25,-.25],[x+side*.14,.28,-.27]],.033,.012,8));
  }
  for(const side of [-1,1])add('tovin_spectacles','head','trim',new T.TorusGeometry(.052,.007,5,18),[side*.092,.18,.187]);
  box('tovin_spectacles','head','trim',[.075,.012,.012],[0,.18,.198]);
  for(const side of [-1,1])tube('tovin_spectacles','head','trim',[[side*.14,.19,.18],[side*.20,.20,.11],[side*.22,.18,-.01]],.006);
  add('TovinLantern','lantern','metal',new T.TorusGeometry(.115,.016,6,18,Math.PI),[0,-.115,0]);
  for(const x of [-.115,.115])box('TovinLantern','lantern','metal',[.025,.12,.025],[x,-.16,0]);
  add('TovinLantern','lantern','metal',new T.ConeGeometry(.21,.14,4),[0,-.255,0],[0,Math.PI/4,0]);
  box('TovinLantern','lantern','glass',[.23,.26,.22],[0,-.43,0]);
  for(const x of [-.125,.125])for(const z of [-.12,.12])box('TovinLantern','lantern','metal',[.022,.31,.022],[x,-.435,z]);
  box('TovinLantern','lantern','metal',[.29,.045,.28],[0,-.605,0]);
 }
 const parts=Array.from(batches.values(),b=>{
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geometry.setAttribute('color',new T.Float32BufferAttribute(b.c,3));geometry.setIndex(b.ix);geometry.computeBoundingSphere();
  return {name:b.name,bone:b.bone,material:b.material,geometry};
 });saved.set(id,parts);return parts;
}
function create(T,id){
 const profile=profiles[id];if(!profile)throw new Error('Unknown village character: '+id);
 const rig=root.EmberCharacterRig.create(T);rig.group.name=profile.name;rig.group.userData.npc=id;
 const baseMeshes=[];rig.group.traverse(m=>{if(m.isMesh)baseMeshes.push(m);});rig.blade.visible=rig.guard.visible=false;
 const appearance=root.EmberAppearance.attach(T,rig,null);appearance.apply('classic',profile.look);
 rig.body.material.color.set(profile.colors.fabric);rig.cloth.material.color.set(profile.colors.cape);
 const assets=root.EmberModelAssets?.attach(T,rig,{baseMeshes,costumeMeshes:[]},appearance);assets?.setLook('classic',profile.look);
 const colors={cloth:profile.cloth,accent:profile.accent,trim:profile.trim,leather:profile.colors.leather,hair:'#574735',paper:'#d6c6a3',green:'#7b9771',glass:'#8fcfe3',metal:'#756957'},materials={};
 for(const [name,color]of Object.entries(colors))materials[name]=new T.MeshStandardMaterial({color,vertexColors:true,side:name==='cloth'?T.DoubleSide:T.FrontSide,roughness:name==='glass'?.4:.85,metalness:name==='trim'||name==='metal'?.25:0,...name==='glass'?{emissive:'#327d9f',emissiveIntensity:id==='tovin'?.65:.12}:{}});
 const lantern=new T.Group();lantern.name='TovinLanternMount';lantern.position.set(0,-.18,.09);if(id==='tovin')rig.joints.hand_r.add(lantern);
 const groups=new Map();
 for(const part of outfit(T,id)){
  const key=part.bone+'|'+part.name;if(!groups.has(key)){const g=new T.Group();g.name=part.name;(part.bone==='lantern'?lantern:rig.joints[part.bone]).add(g);groups.set(key,g);}
  const mesh=new T.Mesh(part.geometry,materials[part.material]);mesh.name=part.name+'_'+part.material;mesh.castShadow=true;groups.get(key).add(mesh);
 }
 const ready=assets?.ready.then(ok=>{
  if(ok)assets.models.getObjectByName('GLB_classic')?.traverse(m=>{
   if(!m.isSkinnedMesh)return;
   // Town clothes replace the adventurer's metal shoulder plate and gold trim.
   if(['metal','gold'].includes(m.material.name))m.visible=false;
   if(profile.colors[m.material.name])m.material.color.set(profile.colors[m.material.name]);
  });return ok;
 })||Promise.resolve(false);
 let elapsed=0,talking=false,talkBlend=0,homeYaw=profile.yaw,tracking=false;const previous=new T.Vector3(),palm=new T.Vector3(),target=new T.Vector3(),pole=new T.Vector3(),handQ=new T.Quaternion(),gestureQ=new T.Quaternion(),yawQ=new T.Quaternion(),localQ=new T.Quaternion(),tilt=new T.Euler();
 function setTalking(value){talking=!!value;}
 function reset(){talking=false;talkBlend=0;elapsed=0;tracking=false;rig.group.rotation.y=homeYaw;rig.resetMotion();}
 function update(dt,player){
  for(let p=rig.group;p;p=p.parent)if(!p.visible){tracking=false;return;}
  dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
  if(!tracking||previous.distanceToSquared(rig.group.position)>1){rig.resetMotion();tracking=true;}
  previous.copy(rig.group.position);elapsed+=dt;const t=elapsed+profile.phase;
  const near=player&&Number.isFinite(player.x)&&Number.isFinite(player.z)&&Math.hypot(player.x-rig.group.position.x,player.z-rig.group.position.z)<4.8;
  const desired=talking?homeYaw:near?Math.atan2(player.x-rig.group.position.x,player.z-rig.group.position.z):homeYaw,delta=Math.atan2(Math.sin(desired-rig.group.rotation.y),Math.cos(desired-rig.group.rotation.y));rig.group.rotation.y+=clamp(delta,-dt*2.2,dt*2.2);
  talkBlend+=(Number(talking)-talkBlend)*(1-Math.exp(-dt*6));rig.animate(t,false,0,{dt,weapon:'none'});appearance.animate(t);assets?.animate(t);
  rig.joints.head.rotation.y+=Math.sin(t*.47)*.055;rig.joints.head.rotation.x+=Math.sin(t*3.2)*.034*talkBlend;
  rig.joints.chest.rotation.y+=Math.sin(t*1.7)*.018*talkBlend;
  if(talkBlend>.001){
   rig.group.updateWorldMatrix(true,true);rig.group.getWorldQuaternion(yawQ);const side=profile.hand==='l'?-1:1,beat=Math.sin(t*(id==='bram'?2.1:1.7));
   rig.palmWorld(profile.hand,palm);target.set(side*(.56+.035*beat),1.68+.045*beat,.43+(id==='tovin'?.10:0)).applyMatrix4(rig.group.matrixWorld);palm.lerp(target,talkBlend);
   pole.set(side*.67,1.67,-.22).applyMatrix4(rig.group.matrixWorld);
   rig.joints['hand_'+profile.hand].getWorldQuaternion(handQ);gestureQ.copy(yawQ).multiply(localQ.setFromEuler(tilt.set(id==='bram'?-1.02:-.70,side*.12,-side*.15)));handQ.slerp(gestureQ,talkBlend);rig.aimArm(profile.hand,palm,pole,handQ);
  }
  if(id==='tovin'){
   rig.group.getWorldQuaternion(yawQ);gestureQ.copy(yawQ).multiply(localQ.setFromEuler(tilt.set(.025*Math.sin(t*1.6),Math.PI/2,.035*Math.sin(t*1.1))));
   rig.joints.hand_r.getWorldQuaternion(handQ).invert();lantern.quaternion.copy(handQ).multiply(gestureQ);
  }
  return talkBlend;
 }
 reset();return {...rig,assets,appearance,ready,lantern,setTalking,update,reset,get talking(){return talking;},get talkBlend(){return talkBlend;}};
}
root.EmberVillageActors={create};
})(typeof window==='undefined'?globalThis:window);
