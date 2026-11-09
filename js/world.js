/* Eigen low-poly landschap en personages; Three.js verzorgt uitsluitend WebGL. */
(function(){
function createWorld(){
const T=THREE,scene=new T.Scene();scene.background=new T.Color('#a8c4ba');scene.fog=new T.FogExp2('#adc4b1',.014);const colliders=[],cameraMeshes=[],animated=[],enemies=[],crystals=[],effects=[];
const mats={};function mat(color,emissive){const key=color+emissive;return mats[key]??=new T.MeshStandardMaterial({color,roughness:.95,flatShading:true,emissive:emissive||0,emissiveIntensity:emissive?.8:0});}
function mesh(geo,color,x,y,z,parent=scene){const m=new T.Mesh(geo,typeof color==='string'?mat(color):color);m.position.set(x,y,z);parent.add(m);m.receiveShadow=true;return m;}
const box=(w,h,d,color,x,y,z,parent)=>mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent);
const cone=(r,h,color,x,y,z,n=7,parent)=>mesh(new T.ConeGeometry(r,h,n),color,x,y,z,parent);
const sphere=(r,color,x,y,z,parent)=>mesh(new T.IcosahedronGeometry(r,0),color,x,y,z,parent);
scene.add(new T.HemisphereLight('#e4eddb','#344d40',2.15));const sun=new T.DirectionalLight('#ffe0ae',2.6);sun.position.set(-25,48,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:55,bottom:-55,near:1,far:125});sun.shadow.bias=-.001;sun.target.position.z=-16;scene.add(sun,sun.target);
box(170,.5,190,'#77916a',0,-.35,-20);const path=box(5,.04,90,'#b2a27b',0,-.07,-15);box(25,.05,4,'#b2a27b',0,-.06,21);
// Broad patches break up the flat meadow without obscuring combat.
for(let i=0;i<35;i++){const x=Math.sin(i*93.2)*33,z=-58+(i*17.3%91);const p=mesh(new T.CircleGeometry(2+i%4,7),i%2?'#83986d':'#6f8c67',x,-.04,z);p.rotation.x=-Math.PI/2;}
let seed=47;const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
function tree(x,z,scale=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);box(.6,3,.6,'#665449',0,1.5,0,g);for(let j=0;j<3;j++)cone(2-j*.35,3.3-j*.3,['#486c53','#557b59','#6b8a61'][j],0,3.1+j*1.15,0,7,g);colliders.push({x,z,r:.8*scale});}
for(let i=0;i<85;i++){let x=(rand()-.5)*95,z=rand()*115-73;if(Math.abs(x)<6||z>10&&Math.abs(x)<19)continue;if(RPG.explorationSpots.some(p=>Math.hypot(x-p.x,z-p.z)<3.2))continue;if(RPG.crystals.some(c=>Math.hypot(x-c.x,z-c.z)<4)||RPG.enemies.some(e=>Math.hypot(x-e.x,z-e.z)<4))continue;tree(x,z,.7+rand()*.65);}
for(let i=0;i<20;i++){const x=(i%2?-1:1)*(43+rand()*30),z=rand()*150-100;cone(12+rand()*10,15+rand()*20,'#829986',x,6,z,5);}
function house(x,z,rotation){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);const body=box(6,4,5,'#d3c19a',0,2,0,g);body.castShadow=true;cameraMeshes.push(body);box(6.5,.3,5.5,'#65533f',0,4,0,g);const roof=cone(5.1,3,'#6a7771',0,5.5,0,4,g);roof.rotation.y=Math.PI/4;roof.castShadow=true;box(1.2,2.3,.12,'#584a36',0,1.15,2.55,g);for(const a of [-1.9,1.9]){box(.8,1,.1,'#ffcf80',a,2.2,2.56,g);box(.08,1.1,.12,'#66553e',a,2.2,2.65,g);}colliders.push({x,z,r:4.2});}
house(-12,22,-.5);house(12,23,.5);house(-12,11,.3);
// Village lanterns, banners, flowers and the campfire.
for(const x of [-4,4]){box(.15,3,.15,'#685a44',x,1.5,18);box(.6,.65,.6,mat('#ffe0a0','#edac55'),x,3,18);const flag=box(1.1,1.5,.07,'#738c9c',x+.6,2.5,12);box(.12,4,.12,'#73634b',x,2,12);}
const camp={x:0,z:14};for(let i=0;i<8;i++)sphere(.35,'#73766c',Math.cos(i*Math.PI/4)*1.3,.15,14+Math.sin(i*Math.PI/4)*1.3);const fire=cone(.55,1.7,mat('#ffc875','#ff8e3a'),0,.85,14,5);animated.push({mesh:fire,type:'fire'});const firelight=new T.PointLight('#ffbc74',6,12);firelight.position.set(0,2,14);scene.add(firelight);
for(let i=0;i<80;i++){const x=(rand()-.5)*65,z=rand()*90-58;if(Math.abs(x)<3)continue;const g=new T.Group();g.position.set(x,0,z);scene.add(g);box(.06,.4,.06,'#55715a',0,.2,0,g);sphere(.13,i%2?'#d2c6d6':'#efce89',0,.45,0,g);}
// Ruin at the north end; gateway is a visual landmark, not a second area.
const ruin=new T.Group();scene.add(ruin);for(const x of [-6,6]){box(1.4,6,1.4,'#899789',x,3,-58);box(2,.6,2,'#acb5a0',x,6,-58);colliders.push({x,z:-58,r:1});}box(14,.9,1.7,'#a4af9a',0,6.6,-58);const sigil=mesh(new T.TorusGeometry(1,.12,5,24),mat('#c59fdf','#9962cf'),0,4.5,-57);animated.push({mesh:sigil,type:'sigil'});for(const x of [-9,9]){const r=box(2,2.4,2,'#899789',x,1.2,-51);r.rotation.y=.3;colliders.push({x,z:-51,r:1.6});}
// Character models. Facing is towards +Z in local coordinates.
function humanoid(color,cloak){const g=new T.Group();const body=box(.75,1,.5,color,0,1.45,0,g);body.castShadow=true;sphere(.36,'#dab58d',0,2.25,0,g);sphere(.37,'#584c3d',0,2.44,-.08,g);const cloth=box(.8,.8,.15,cloak,0,1.45,-.33,g);const left=box(.23,.65,.25,'#514f46',-.23,.4,0,g),right=box(.23,.65,.25,'#514f46',.23,.4,0,g);box(.2,.72,.2,color,-.54,1.4,0,g);const arm=new T.Group();arm.position.set(.55,1.7,0);g.add(arm);box(.2,.65,.2,color,0,-.3,0,arm);const blade=box(.1,1.05,.16,'#d1ded5',0,-.1,.55,arm);const guard=box(.5,.1,.18,'#e2bd78',0,-.6,.55,arm);const model=new T.Group();model.position.y=1.2;for(const child of [...g.children]){g.remove(child);child.position.y-=1.2;model.add(child);}g.add(model);return {group:g,left,right,arm,blade,guard,body,cloth,model};}
const player=EmberCharacterRig.create(T,{skin:'guardian'});const flameCostume=typeof EmberFlameGuardian!=='undefined'?EmberFlameGuardian.decorate(T,player):{setVisible(){},costumeMeshes:[],animate(){}};const appearance=EmberAppearance.attach(T,player,flameCostume);const armorVisual=EmberEquipment.attach(T,player);player.group.position.set(0,0,22);scene.add(player.group);
const ornaments=[];for(const side of [-1,1])for(const y of [-.1,.2]){const thorn=cone(.12,.45,mat('#d5eac0','#6fa87d'),side*.13,y,.55,4,player.arm);thorn.rotation.z=-side*.9;thorn.visible=false;ornaments.push(thorn);}
const ranger=humanoid('#88946a','#566f51');ranger.group.position.set(-3,0,17);ranger.group.rotation.y=.6;scene.add(ranger.group);
const merchant=humanoid('#b5a57b','#87735f');merchant.group.position.set(8,0,19);merchant.group.rotation.y=-.8;scene.add(merchant.group);
function label(text,x,y,z,color='#fff0ba'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.font='500 32px system-ui';c.textAlign='center';c.fillStyle='#172e28b0';c.fillRect(0,22,512,58);c.fillStyle=color;c.fillText(text,256,61);const texture=new T.CanvasTexture(canvas),s=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));s.scale.set(4.5,1.125,1);s.position.set(x,y,z);scene.add(s);return s;}
label('Elin · Wachter',-3,3.25,17);label('Bram · Handelaar',8,3.25,19);const marker=label('!',-3,4.3,17,'#ffdc7c');label('SCHEMERWOUD',0,5,-3,'#e7e4c4');
for(const e of RPG.enemies){const g=new T.Group();g.position.set(e.x,0,e.z);scene.add(g);if(e.boss){box(2.5,3,1.5,'#655b60',0,2,0,g);sphere(.8,'#85816c',0,4,0,g);for(const side of [-1,1]){const arm=box(.7,2.6,.8,'#696f5e',side*1.7,2.2,0,g);arm.rotation.z=side*.3;cone(.5,2,'#c5b990',side*.6,5.1,0,4,g);}sphere(.22,mat('#ffe1a4','#ffae51'),0,4,.72,g);}else if(e.spirit){const robe=cone(.9,2.4,mat('#8eacc4','#456c8a'),0,1.6,0,7,g);sphere(.48,mat('#c2dfdc','#66aeaa'),0,3,0,g);for(const side of [-1,1]){sphere(.17,mat('#ffe7af','#e9a870'),side*.21,3.08,.37,g);cone(.22,1.3,'#c5c8ab',side*.65,2.6,0,4,g);}const crown=mesh(new T.TorusGeometry(.5,.06,4,12),mat('#c8e6c0','#65bda9'),0,3.6,0,g);crown.rotation.x=Math.PI/2;}else if(e.shield){box(1.15,1.6,.8,'#7d887b',0,1.5,0,g);sphere(.5,'#b2b69c',0,2.65,0,g);for(const side of [-1,1]){box(.28,.9,.35,'#626c61',side*.35,.45,0,g);box(.3,1,.35,'#899282',side*.76,1.5,0,g);}const shield=mesh(new T.CylinderGeometry(.85,.85,.22,10),mat('#a0a58a'),.25,1.5,.75,g);shield.rotation.x=Math.PI/2;box(.15,1.35,.14,'#d5c798',.25,1.5,.9,g);box(1.2,.14,.15,'#d5c798',.25,1.5,.9,g);}else{box(1.1,.85,1.8,'#626e78',0,.85,0,g);sphere(.55,'#7a8790',0,1.3,1,g);for(const side of [-1,1]){cone(.23,.55,'#7a8790',side*.32,1.8,1,4,g);for(const z of [-.6,.6])box(.22,.65,.22,'#536169',side*.4,.33,z,g);sphere(.08,mat('#ffd8a2','#f1aa6a'),side*.23,1.43,1.45,g);}}
 enemies.push({...e,mesh:g,hp:e.hp||(e.boss?280:e.spirit?90:65),max:e.hp||(e.boss?280:e.spirit?90:65),attack:1,windup:0,flash:0,homeX:e.x,homeZ:e.z});}
for(const c of RPG.crystals){const gem=mesh(new T.OctahedronGeometry(.7,0),mat('#a8e9d2','#4cbda8'),c.x,1.5,c.z);crystals.push({...c,mesh:gem});}
const chest=new T.Group();chest.position.set(24,0,-10);scene.add(chest);box(1.4,.9,1,'#937247',0,.5,0,chest);box(1.5,.12,1.1,'#d8b574',0,.85,0,chest);box(.25,.4,.05,'#edca83',0,.65,.55,chest);
const warning=mesh(new T.RingGeometry(.1,4.6,40),new T.MeshBasicMaterial({color:'#f0a167',transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false}),0,.05,-53);warning.rotation.x=-Math.PI/2;warning.visible=false;
function burst(x,z,color='#ffe0a1',count=12){for(let i=0;i<count&&effects.length<100;i++){const m=sphere(.1+Math.random()*.1,color,x,.8+Math.random(),z);effects.push({mesh:m,vx:(Math.random()-.5)*5,vz:(Math.random()-.5)*5,vy:2+Math.random()*3,life:.6,max:.6});}}
function update(dt,time,moving,attacking,roll=0,running=false){for(const a of animated){if(a.type==='fire'){a.mesh.scale.y=1+Math.sin(time*9)*.12;a.mesh.rotation.y=time;}else a.mesh.rotation.z=time*.3;}for(const c of crystals){c.mesh.rotation.y=time;c.mesh.position.y=1.5+Math.sin(time*2+c.x)*.15;}player.model.rotation.x=roll>0?(1-roll/.38)*Math.PI*2:0;player.model.position.y=1.2+(roll>0?Math.sin((1-roll/.38)*Math.PI)*.2:0);player.animate(time,moving,attacking,{running});flameCostume.animate?.(time,{moving,running,attacking});appearance.animate(time);marker.position.y=4.3+Math.sin(time*2)*.12;for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.life-=dt;e.mesh.position.x+=e.vx*dt;e.mesh.position.z+=e.vz*dt;e.mesh.position.y+=e.vy*dt;e.vy-=(e.gravity??9)*dt;if(e.kind==='slash')e.mesh.rotation.z+=dt*7;if(e.kind==='pulse')e.mesh.scale.multiplyScalar(1+dt*5);if(e.kind==='magic')e.mesh.rotation.y+=dt*7;if(e.ownedMaterial)e.mesh.material.opacity=Math.max(0,e.life/e.max);if(!e.kind)e.mesh.scale.setScalar(Math.max(0,e.life/e.max));if(e.life<=0){scene.remove(e.mesh);if(!e.sprite)e.mesh.geometry.dispose();if(e.ownedMaterial){if(e.mesh.material.map)e.mesh.material.map.dispose();e.mesh.material.dispose();}effects.splice(i,1);}}for(const e of enemies)if(e.spirit&&e.mesh.visible)e.mesh.position.y=Math.sin(time*2+e.homeX)*.17;}
function damageText(text,x,z,color='#ffe6ad'){if(effects.length>=100)return;const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.font='bold 35px system-ui';c.textAlign='center';c.lineWidth=5;c.strokeStyle='#192b27';c.strokeText(String(text),128,46);c.fillStyle=color;c.fillText(String(text),128,46);const texture=new T.CanvasTexture(canvas),m=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));m.position.set(x,2.9,z);m.scale.set(3.2,.8,1);scene.add(m);effects.push({mesh:m,vx:0,vz:0,vy:1.4,gravity:0,life:.85,max:.85,kind:'text',sprite:true,ownedMaterial:true});}
function slash(x,z,angle,step=1){
 if(effects.length>=95)return;
 const styles=[{color:'#ffe2aa',outer:2.2,scale:1},{color:'#ffc47c',outer:2.55,scale:1.14},{color:'#ff7839',outer:3.05,scale:1.36}];
 const style=styles[Math.max(0,Math.min(2,step-1))];
 const m=mesh(new T.RingGeometry(1.35,style.outer,48,1,0,Math.PI*(step===2?1.3:1.1)),new T.MeshBasicMaterial({color:style.color,transparent:true,opacity:.85,side:T.DoubleSide,depthWrite:false}),x,1.25,z);
 m.rotation.set(-Math.PI/2,0,-angle+(step===2?.35:step===3?-.2:0));m.scale.setScalar(style.scale);
 effects.push({mesh:m,vx:0,vz:0,vy:0,gravity:0,life:step===3?.37:.22,max:step===3?.37:.22,kind:'slash',ownedMaterial:true});
 if(step===3){burst(x+Math.sin(angle)*1.6,z+Math.cos(angle)*1.6,'#ff9750',12);magicImpact(x+Math.sin(angle)*1.7,z+Math.cos(angle)*1.7,'#ff994a',.8);}
}
function magicImpact(x,z,color='#ffbd79',radius=1){
 if(effects.length>=93)return;
 const ring=mesh(new T.RingGeometry(radius*.46,radius*.58,40),new T.MeshBasicMaterial({color,transparent:true,opacity:.95,side:T.DoubleSide,depthWrite:false}),x,.13,z);
 ring.rotation.x=-Math.PI/2;
 effects.push({mesh:ring,vx:0,vz:0,vy:0,gravity:0,life:.48,max:.48,kind:'pulse',ownedMaterial:true});
 burst(x,z,color,11);
}
function magicCast(x,z,tx,tz,color='#ffd58e'){
 magicImpact(x,z,color,.7);
 magicImpact(tx,tz,color,1.15);
 for(let i=0;i<3&&effects.length<94;i++){
   const height=.6+i*.45;
   const column=mesh(new T.CylinderGeometry(.13,.31,height,8),new T.MeshBasicMaterial({color,transparent:true,opacity:.7,depthWrite:false}),tx,height*.5,tz);
   effects.push({mesh:column,vx:0,vz:0,vy:.4+i*.18,gravity:0,life:.32+i*.1,max:.32+i*.1,kind:'magic',ownedMaterial:true});
 }
}
function beam(x,z,tx,tz){const length=Math.hypot(tx-x,tz-z),m=mesh(new T.CylinderGeometry(.07,.13,length,6),new T.MeshBasicMaterial({color:'#b0ffec',transparent:true,opacity:.8,depthWrite:false}),(x+tx)/2,1.5,(z+tz)/2);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(tx-x,0,tz-z).normalize());effects.push({mesh:m,vx:0,vz:0,vy:0,gravity:0,life:.18,max:.18,kind:'beam',ownedMaterial:true});}
const orbGeometry=new T.IcosahedronGeometry(.3,1),orbMaterial=mat('#e4c1fc','#aa69d5');
function orb(x,z){return mesh(orbGeometry,orbMaterial,x,1.4,z);}
const pendant=new T.Group();player.model.add(pendant);pendant.position.set(0,.55,.34);sphere(.15,mat('#b1f1c6','#52a375'),0,0,0,pendant);const chain=mesh(new T.TorusGeometry(.19,.025,4,12),mat('#dfcc8f'),0,.1,0,pendant);pendant.visible=false;
function setAmulet(on){pendant.visible=!!on;}
function setWeapon(name,weapon='sword'){const thorn=name==='thorn',sword=weapon!=='bow';player.blade.visible=sword;player.guard.visible=sword;player.blade.material=thorn?mat('#ade8c9','#539e7d'):mat('#d1ded5');player.blade.scale.set(thorn?1.8:1,thorn?1.3:1,thorn?1.4:1);for(const part of ornaments)part.visible=thorn&&sword;}
function setClass(id){player.setSkin(id==='ranger'?'ranger':'guardian');}
function setArmor(state){armorVisual.sync(state);}
function setAppearance(id,classId='guardian',look){const flame=id==='flame_guardian';flameCostume.setVisible(flame);player.setSkin(flame?'flame_guardian':classId==='ranger'?'ranger':'guardian');appearance.apply(id,look);}
return {scene,colliders,cameraMeshes,sigil,player,ranger,merchant,enemies,crystals,chest,warning,marker,burst,update,firelight,damageText,slash,beam,magicCast,magicImpact,orb,setWeapon,setClass,setAppearance,setAmulet,setArmor,effects};
}
window.EmberWorld={createWorld};
})();
