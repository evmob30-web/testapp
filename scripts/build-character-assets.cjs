/* Original Emberwild art. Regenerates the two glTF 2.0 characters and offline data.
 * Uses the vendored Three.js and Node's zlib only; no build needed to play. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const ROOT=path.join(__dirname,'..'),T=require('../vendor/three.min.js');
const context={THREE:T};vm.createContext(context);
for(const file of ['character-rig','flame-guardian'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),context);
const rig=context.EmberCharacterRig.create(T),flame=context.EmberFlameGuardian.decorate(T,rig);
rig.group.updateMatrixWorld(true);
const bones=Object.values(rig.joints),boneIndex=new Map(bones.map((b,i)=>[b.name,i]));
// A small woven/hammered surface, embedded in each GLB. All artwork is generated here.
function crc32(buf){let c=~0;for(const v of buf){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^~0)>>>0;}
function png(){const n=64,raw=Buffer.alloc(n*(n*4+1));let seed=43;for(let y=0;y<n;y++)for(let x=0;x<n;x++){
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;
 const value=236+(seed%8)+(x%4===0?5:0)-(y%4===0?7:0),p=y*(n*4+1)+1+x*4;
 raw[p]=raw[p+1]=raw[p+2]=value;raw[p+3]=255;
 }const header=Buffer.alloc(13);header.writeUInt32BE(n,0);header.writeUInt32BE(n,4);header[8]=8;header[9]=6;
 const chunk=(type,data)=>{const t=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([size,t,data,crc]);};
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const texture=png();
const specs={
 skin:{color:'#e4ac84',roughness:.88},lip:{color:'#a96455',roughness:.85},
 fabric:{color:'#647b77',roughness:.94,texture:true},trousers:{color:'#404c4c',roughness:.98,texture:true},
 leather:{color:'#594332',roughness:.82,texture:true},metal:{color:'#41464f',roughness:.46,metalness:.72,texture:true},
 gold:{color:'#c6a36b',roughness:.38,metalness:.76,texture:true},cape:{color:'#69827b',roughness:.94,texture:true},
 crimson:{color:'#872e3b',roughness:.94,texture:true},eye_white:{color:'#f6e9d2',roughness:.42},
 iris:{color:'#4d9975',roughness:.4},pupil:{color:'#162421',roughness:.36},hair:{color:'#b94d29',roughness:.83},
 glow:{color:'#ffad4b',roughness:.3,emissive:[1,.2,.015]},stitch:{color:'#b6a184',roughness:.95}
};
function build(kind){
 const parts=new Map();
 function add(name,geo,bone,material,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],weightFn){
  const b=typeof bone==='string'?bones[boneIndex.get(bone)]:bone;
  const local=new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));
  const matrix=new T.Matrix4().multiplyMatrices(b.matrixWorld,local);
  const geometry=geo.clone();geometry.applyMatrix4(matrix);
  const key=material+(name==='default_hair'?'_default_hair':'');
  if(!parts.has(key))parts.set(key,{name:key,material,positions:[],normals:[],uvs:[],joints:[],weights:[],indices:[]});
  const p=parts.get(key),offset=p.positions.length/3,pos=geometry.attributes.position,norm=geometry.attributes.normal,uv=geometry.attributes.uv;
  for(let i=0;i<pos.count;i++){
   p.positions.push(pos.getX(i),pos.getY(i),pos.getZ(i));p.normals.push(norm.getX(i),norm.getY(i),norm.getZ(i));p.uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
   const weights=weightFn?weightFn(geo.attributes.position.getY(i)): [[b.name,1]];
   for(let j=0;j<4;j++){p.joints.push(weights[j]?boneIndex.get(weights[j][0]):0);p.weights.push(weights[j]?weights[j][1]:0);}
  }
  const ix=geometry.index;for(let i=0;i<(ix?ix.count:pos.count);i++)p.indices.push(offset+(ix?ix.getX(i):i));
  geo.dispose();geometry.dispose();
 }
 function orb(name,bone,mat,pos,size,rotation){add(name,new T.SphereGeometry(1,16,10),bone,mat,pos,size,rotation);}
 function box(name,bone,mat,pos,size,rotation){add(name,new T.BoxGeometry(...size),bone,mat,pos,[1,1,1],rotation);}
 function tube(name,bone,mat,points,r=.012){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));add(name,new T.TubeGeometry(curve,12,r,5,false),bone,mat);}
 function loft(name,bone,mat,rings,weights,segments=16){
  const positions=[],uv=[],indices=[];
  for(let row=0;row<rings.length;row++){const [y,rx,rz,z=0]=rings[row];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;positions.push(Math.cos(a)*rx,y,Math.sin(a)*rz+z);uv.push(i/segments,row/(rings.length-1));}}
  for(let r=0;r<rings.length-1;r++)for(let s=0;s<segments;s++){const a=r*(segments+1)+s,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  add(name,geo,bone,mat,[0,0,0],[1,1,1],[0,0,0],weights);
 }
 const mix=(a,b,t)=>[[a,1-t],[b,t]],clamp=v=>Math.max(0,Math.min(1,v));
 // Continuous jacket: blended hips/spine/chest rather than independent rigid ovals.
 loft('tailored_tunic','hips','fabric',[[1.16,.13,.135],[1.08,.18,.17],[.94,.38,.25],[.72,.41,.27],[.48,.40,.255],[.30,.33,.23],[.10,.32,.225],[-.13,.36,.25],[-.27,.36,.26]],y=>y<.25?mix('hips','spine',clamp((y+.05)/.38)):mix('spine','chest',clamp((y-.25)/.36)));
 orb('pelvis','hips','trousers',[0,-.09,0],[.32,.25,.235]);
 loft('neck','neck','skin',[[.18,.105,.10],[.09,.115,.105],[-.06,.15,.14]],()=>[['neck',1]],12);
 for(const side of ['l','r']){
  const sign=side==='l'?-1:1,upper='upper_arm_'+side,lower='lower_arm_'+side,hand='hand_'+side;
  loft('sleeve',upper,'fabric',[[.10,.105,.15],[.03,.17,.18],[-.13,.17,.16],[-.29,.145,.14],[-.40,.126,.13],[-.48,.125,.13],[-.61,.127,.125],[-.74,.105,.108],[-.84,.095,.10]],y=>y<-.65?mix(lower,hand,clamp((-y-.71)/.17)):mix(upper,lower,clamp((-y-.31)/.27)));
  // Cuffs, individual knuckles and fingers follow the same hand socket as the weapon.
  orb('cuff',lower,'leather',[0,-.32,0],[.126,.11,.128]);
  orb('palm',hand,'skin',[0,-.075,.005],[.107,.145,.087]);
  for(let f=0;f<4;f++)orb('finger',hand,'skin',[(f-1.5)*.043,-.182,.026],[.024,.067-(f===0||f===3?.012:0),.032]);
  orb('thumb',hand,'skin',[sign*.102,-.073,.065],[.041,.083,.04],[0,0,sign*.4]);
  const thigh='upper_leg_'+side,knee='lower_leg_'+side,foot='foot_'+side;
  loft('trouser_leg',thigh,'trousers',[[.12,.165,.18],[-.05,.183,.19],[-.22,.167,.17],[-.37,.143,.145],[-.47,.13,.14],[-.56,.132,.135],[-.70,.118,.12],[-.83,.105,.112]],y=>y<-.70?mix(knee,foot,clamp((-y-.72)/.16)):mix(thigh,knee,clamp((-y-.32)/.28)));
  orb('boot',foot,'leather',[0,-.035,.105],[.17,.115,.26]);
  orb('boot_sole',foot,'trousers',[0,-.11,.105],[.177,.045,.265]);
  loft('boot_shaft',knee,'leather',[[-.09,.145,.15],[-.21,.145,.15],[-.36,.128,.135],[-.43,.12,.13]],y=>mix(knee,foot,clamp((-y-.30)/.13)),12);
  for(let i=0;i<3;i++)tube('boot_stitch',knee,'stitch',[[-.08,-.16-i*.06,.132],[0,-.19-i*.06,.153],[.08,-.16-i*.06,.132]],.008);
  box('boot_buckle',knee,'gold',[sign*.14,-.22,.01],[.022,.075,.09]);
 }
 // Shaped jaw and cheeks, inset eyes with whites, iris, pupil and small highlights.
 loft('sculpted_head','head','skin',[[.52,.10,.12,-.025],[.46,.245,.215,0],[.33,.302,.253,.014],[.19,.306,.263,.039],[.07,.258,.245,.048],[-.045,.197,.194,.053],[-.13,.108,.125,.058],[-.15,.025,.05,.06]],()=>[['head',1]],24);
 orb('nose_bridge','head','skin',[0,.15,.298],[.046,.10,.062]);
 orb('nose_tip','head','skin',[0,.085,.334],[.057,.039,.058]);
 for(const s of [-1,1]){
  orb('ear','head','skin',[s*.302,.18,.012],[.066,.127,.067],[0,0,-s*.12]);
  orb('ear_inner','head','lip',[s*.339,.18,.04],[.019,.075,.033]);
  orb('eye_socket','head','lip',[s*.133,.215,.281],[.094,.061,.031]);
  orb('eye','head','eye_white',[s*.133,.223,.299],[.077,.047,.026]);
  orb('iris','head','iris',[s*.125,.224,.322],[.030,.036,.009]);
  orb('pupil','head','pupil',[s*.125,.224,.330],[.014,.024,.004]);
  orb('eye_shine','head','eye_white',[s*.125-.009,.236,.335],[.008,.010,.003]);
  tube('brow','head','hair',[[s*.055,.299,.293],[s*.13,.314,.29],[s*.216,.288,.262]],.018);
  tube('eyelid','head','skin',[[s*.059,.237,.317],[s*.13,.268,.32],[s*.209,.234,.305]],.009);
 }
 tube('mouth','head','lip',[[-.077,.004,.273],[0,-.008,.290],[.077,.004,.273]],.012);
 // Standalone asset includes a default hairstyle; runtime swaps it for the chosen style.
 orb('default_hair','head','hair',[0,.43,-.065],[.34,.205,.31]);
 for(const s of [-1,1]){const curve=new T.CatmullRomCurve3([[s*.25,.45,.09],[s*.315,.24,.06],[s*.27,.06,.09]].map(p=>new T.Vector3(...p)));add('default_hair',new T.TubeGeometry(curve,10,.07,6,false),'head','hair');}
 if(kind==='classic'){
  // Layered leather yoke, shoulder covers, travel straps, sewn hems, belt and pouches.
  for(const s of [-1,1]){
   const a=s===-1?'upper_arm_l':'upper_arm_r';orb('leather_shoulder',a,'leather',[s*.035,.015,0],[.21,.16,.23]);
   tube('chest_strap','chest','leather',[[s*.27,.29,.20],[s*.25,.05,.278],[s*.20,-.23,.251],[s*.16,-.48,.23]],.038);
   tube('chest_stitch','chest','stitch',[[s*.29,.25,.22],[s*.28,.04,.28],[s*.23,-.22,.255]],.007);
   box('strap_buckle','chest','gold',[s*.245,.01,.302],[.097,.10,.025]);
   orb('belt_pouch','hips','leather',[s*.32,-.03,.19],[.112,.16,.12]);
   box('pouch_flap','hips','fabric',[s*.32,.03,.29],[.17,.10,.025]);
   orb('pouch_clasp','hips','gold',[s*.32,-.025,.315],[.018,.019,.012]);
  }
  loft('belt','hips','leather',[[.11,.343,.243],[-.015,.348,.247]],()=>[['hips',1]]);
  box('belt_frame','hips','gold',[0,.047,.258],[.145,.115,.034]);box('belt_inset','hips','leather',[0,.047,.279],[.10,.068,.018]);
 }else{
  // Preserve the original Flame Guardian silhouette, now exported with weighted body.
  const colors={'#343239':'metal','#c79b55':'gold','#23282c':'trousers','#822e34':'crimson','#b84931':'crimson','#ff8b25':'glow'};
  for(const mesh of flame.costumeMeshes){
   if(/flame_(face|nose|mouth|eye_|brow_|hair_|side_lock_|fringe_|long_hair_)/.test(mesh.name))continue;
   const color='#'+mesh.material.color.getHexString(),mat=colors[color]||'gold';
   if(/flame_(pauldron_-|pauldron_1|cuirass$|front_tabard|cape_panel_|cape_hem_)/.test(mesh.name))continue;
   let geometry=mesh.geometry.clone();
   if(mesh.geometry.type==='BoxGeometry'){
    const {width:w,height:h,depth:d}=mesh.geometry.parameters,r=Math.min(.025,w/5,h/5,d/5),shape=new T.Shape();
    shape.moveTo(-w/2+r,-h/2+r);shape.lineTo(w/2-r,-h/2+r);shape.lineTo(w/2-r,h/2-r);shape.lineTo(-w/2+r,h/2-r);shape.closePath();
    geometry.dispose();geometry=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1});geometry.translate(0,0,-d/2+r);
   }
   add(mesh.name,geometry,mesh.parent,mat,mesh.position.toArray(),mesh.scale.toArray(),[mesh.rotation.x,mesh.rotation.y,mesh.rotation.z]);
  }
  loft('cuirass','chest','metal',[[.34,.26,.22],[.24,.38,.30],[.06,.455,.345],[-.17,.415,.32],[-.37,.325,.25]],()=>[['chest',1]],16);
  const tabard=new T.BufferGeometry();tabard.setAttribute('position',new T.Float32BufferAttribute([-.22,.025,.29,.22,.025,.29,-.235,-.35,.31,.235,-.35,.31,-.16,-.66,.33,.16,-.66,.33],3));tabard.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,0,.5,1,.5,0,0,1,0],2));tabard.setIndex([0,2,1,1,2,3,2,4,3,3,4,5]);tabard.computeVertexNormals();add('front_tabard',tabard,'hips','crimson');
  tube('tabard_gold_hem','hips','gold',[[-.22,-.03,.302],[-.22,-.34,.324],[-.145,-.62,.344],[.145,-.62,.344],[.22,-.34,.324],[.22,-.03,.302]],.012);
  for(const s of [-1,1]){
   const arm=s===-1?'upper_arm_l':'upper_arm_r';
   const shellRings=[[.36,.035,.03],[.28,.24,.23],[.13,.45,.39],[-.06,.52,.425],[-.23,.47,.39],[-.32,.36,.30]];
   const shoulder=new T.BufferGeometry(),pp=[],uu=[],ii=[];
   for(let r=0;r<shellRings.length;r++){const [y,rx,rz]=shellRings[r];for(let k=0;k<=14;k++){const a=k/14*Math.PI*2;pp.push(Math.cos(a)*rx+s*.15,y,Math.sin(a)*rz);uu.push(k/14,r/5);}}
   for(let r=0;r<5;r++)for(let k=0;k<14;k++){const a=r*15+k,b=a+15;ii.push(a,a+1,b,b,a+1,b+1);}
   shoulder.setAttribute('position',new T.Float32BufferAttribute(pp,3));shoulder.setAttribute('uv',new T.Float32BufferAttribute(uu,2));shoulder.setIndex(ii);shoulder.computeVertexNormals();add('forged_pauldron',shoulder,arm,'metal');
   for(let i=0;i<3;i++)tube('pauldron_engraving',arm,'gold',[[s*.02,-.015-i*.055,.408],[s*.20,-.055-i*.055,.429],[s*.40,-.02-i*.055,.347]],.008);
   tube('cuirass_engraving','chest','gold',[[s*.06,.15,.331],[s*.18,.05,.335],[s*.25,-.20,.313]],.011);
   for(let i=0;i<3;i++)orb('plate_rivet','chest','gold',[s*.29,.12-i*.18,.325],[.019,.019,.014]);
  }
 }
  // Soft cape built as one draped surface, using the back attachment for its sway.
  const cp=[],cu=[],ci=[],cols=12,rows=14;
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const u=c/cols,v=r/rows,x=(u-.5)*(.60+v*.36),y=.24-v*1.40,z=-.01-v*.08-Math.cos(u*Math.PI*8)*(.014+v*.027);cp.push(x,y,z);cu.push(u,v);}
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;ci.push(a,a+1,b,b,a+1,b+1);}
  const cape=new T.BufferGeometry();cape.setAttribute('position',new T.Float32BufferAttribute(cp,3));cape.setAttribute('uv',new T.Float32BufferAttribute(cu,2));cape.setIndex(ci);cape.computeVertexNormals();add('travel_cape',cape,'back',kind==='classic'?'cape':'crimson');

 return exportGLB(parts,kind);
}
function exportGLB(parts,kind){
 const chunks=[],gltf={asset:{version:'2.0',generator:'Emberwild original character builder v1.2',copyright:'Original Emberwild art for evmob30-web/testapp'},scene:0,scenes:[{nodes:[0]}],nodes:[],skins:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}],images:[],textures:[{source:0,sampler:0}],samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}]};let length=0;
 function view(buffer,target){const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}const index=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:length,byteLength:buffer.length,...(target?{target}:{})});chunks.push(buffer);length+=buffer.length;return index;}
 function acc(values,type,componentType,minmax=false,target=34962){const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},typed=componentType===5126?new Float32Array(values):componentType===5123?new Uint16Array(values):new Uint32Array(values);const result={bufferView:view(Buffer.from(typed.buffer),target),componentType,count:values.length/sizes[type],type};if(minmax){result.min=Array(sizes[type]).fill(Infinity);result.max=Array(sizes[type]).fill(-Infinity);for(let i=0;i<values.length;i++){const axis=i%sizes[type];result.min[axis]=Math.min(result.min[axis],values[i]);result.max[axis]=Math.max(result.max[axis],values[i]);}}gltf.accessors.push(result);return gltf.accessors.length-1;}
 for(const bone of bones){const children=bone.children.filter(b=>b.isBone).map(b=>boneIndex.get(b.name));gltf.nodes.push({name:bone.name,translation:bone.position.toArray(),rotation:bone.quaternion.toArray(),...(children.length?{children}:{})});}
 gltf.skins.push({name:'Emberwild_shared_skeleton',skeleton:0,joints:bones.map((_,i)=>i),inverseBindMatrices:acc(bones.flatMap(b=>new T.Matrix4().copy(b.matrixWorld).invert().toArray()),'MAT4',5126,false,null)});
 gltf.images.push({name:'Emberwild_woven_surface',mimeType:'image/png',bufferView:view(texture)});
 const materialIndexes=new Map();
 for(const part of parts.values()){
  if(!materialIndexes.has(part.material)){
   const spec=specs[part.material],color=new T.Color(spec.color),material={name:part.material,pbrMetallicRoughness:{baseColorFactor:[color.r,color.g,color.b,1],metallicFactor:spec.metalness||0,roughnessFactor:spec.roughness,...(spec.texture?{baseColorTexture:{index:0}}:{})},doubleSided:['cape','crimson'].includes(part.material),...(spec.emissive?{emissiveFactor:spec.emissive}:{})};
   materialIndexes.set(part.material,gltf.materials.length);gltf.materials.push(material);
  }
  const attrs={POSITION:acc(part.positions,'VEC3',5126,true),NORMAL:acc(part.normals,'VEC3',5126),TEXCOORD_0:acc(part.uvs,'VEC2',5126),JOINTS_0:acc(part.joints,'VEC4',5123),WEIGHTS_0:acc(part.weights,'VEC4',5126)};
  const mesh=gltf.meshes.length;gltf.meshes.push({name:kind+'_'+part.name,primitives:[{attributes:attrs,indices:acc(part.indices,'SCALAR',part.positions.length/3>65535?5125:5123,false,34963),material:materialIndexes.get(part.material)}]});
  const node=gltf.nodes.length;gltf.nodes.push({name:kind+'_'+part.name,mesh,skin:0});gltf.scenes[0].nodes.push(node);
 }
 gltf.buffers[0].byteLength=length;const bin=Buffer.concat(chunks),json=Buffer.from(JSON.stringify(gltf)),jsonPad=Buffer.alloc((4-json.length%4)%4,32),binPad=Buffer.alloc((4-bin.length%4)%4),total=12+8+json.length+jsonPad.length+8+bin.length+binPad.length;
 const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(total,8);const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length+jsonPad.length);jh.writeUInt32LE(0x4e4f534a,4);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length+binPad.length);bh.writeUInt32LE(0x004e4942,4);
 return Buffer.concat([header,jh,json,jsonPad,bh,bin,binPad]);
}
const data={};for(const [id,file] of [['classic','ember-adventurer.glb'],['flame_guardian','flame-guardian.glb']]){const glb=build(id==='classic'?'classic':'flame');fs.writeFileSync(path.join(ROOT,'assets/characters',file),glb);data[id]=glb.toString('base64');console.log(file+': '+glb.length+' bytes');}
fs.writeFileSync(path.join(ROOT,'js/character-assets-data.js'),'/* Generated by scripts/build-character-assets.cjs. Embedded GLBs keep file:// and offline play working. */\n(function(root){root.EmberCharacterData='+JSON.stringify(data)+';})(typeof window===\'undefined\'?globalThis:window);\n');
