/* Original Emberwild heroic fantasy art. Self-contained glTF 2.0 export.
 * Regenerate with Node.js; uses only built-ins and the vendored Three.js. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const ROOT=path.join(__dirname,'..'),T=require('../vendor/three.min.js'),context={THREE:T};vm.createContext(context);
for(const file of ['hero-art','character-rig'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),context);
const rig=context.EmberCharacterRig.create(T),art=context.EmberHeroArt.create(T);rig.group.updateMatrixWorld(true);
const bones=Object.values(rig.joints),boneIndex=new Map(bones.map((b,i)=>[b.name,i]));
function crc32(buf){let c=~0;for(const v of buf){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^~0)>>>0;}
// Original painted surface atlas: cloth, hide, brushed steel, gold, crimson and twill.
function png(){
 const w=512,h=256,tile=128,raw=Buffer.alloc(h*(w*4+1));let seed=47;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const u=(x%tile)/(tile-1),v=(y%tile)/(tile-1),id=Math.floor(y/tile)*4+Math.floor(x/tile),edge=Math.min(u,v,1-u,1-v);
  const brush=Math.sin(u*34+Math.sin(v*17)*2)*3+Math.sin(v*93+u*8)*2+(seed%7-3);
  let value=231+brush;
  if(id===1||id===6)value=226+brush+((x+y)%4===0?7:0)-9*Math.cos(u*25);
  if(id===2)value=221+brush*1.4+8*Math.sin(v*9)-Math.max(0,.05-edge)*260;
  if(id===3||id===4){value=209+brush*.6+29*(1-v)+10*Math.sin(u*5+v*3);if(edge<.035)value=246;if(edge>.04&&edge<.052)value=168;}
  if(id===5){value=222+brush+11*Math.cos(u*24);if(u<.06||u>.94)value=252;if((u>.075&&u<.1)||(u<.925&&u>.9))value=175;}
  if(id===2&&((u>.055&&u<.07)||(u<.945&&u>.93))&&y%10<5)value=250;
  const p=y*(w*4+1)+1+x*4,c=Math.max(0,Math.min(255,Math.round(value)));raw[p]=raw[p+1]=raw[p+2]=c;raw[p+3]=255;
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(w,0);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;
 const chunk=(type,data)=>{const t=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([size,t,data,crc]);};
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const texture=png(),specs={
 skin:{color:'#e4ac84',roughness:.85},lip:{color:'#ad6b59',roughness:.85},
 fabric:{color:'#355867',roughness:.9,tile:1},trousers:{color:'#293c45',roughness:.94,tile:6},
 leather:{color:'#6f4c37',roughness:.78,tile:2},metal:{color:'#496575',roughness:.58,metalness:.32,tile:3},
 gold:{color:'#d7b06b',roughness:.46,metalness:.42,tile:4},cape:{color:'#285967',roughness:.9,tile:5},
 crimson:{color:'#9b3548',roughness:.86,tile:5},eye_white:{color:'#e3d6bb',roughness:.5},
 iris:{color:'#4d9975',roughness:.42},pupil:{color:'#12252b',roughness:.45},hair:{color:'#b94d29',roughness:.85},
 glow:{color:'#ffc170',roughness:.4,emissive:[1,.24,.025]},stitch:{color:'#c4aa79',roughness:.88}
};
function build(kind){
 const parts=new Map(),clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>[[a,1-t],[b,t]];
 function add(name,geo,bone,material,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],weightFn){
  const b=typeof bone==='string'?bones[boneIndex.get(bone)]:bone;
  const local=new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale)),matrix=new T.Matrix4().multiplyMatrices(b.matrixWorld,local),geometry=geo.clone();geometry.applyMatrix4(matrix);
  const key=material+(name==='default_hair'?'_default_hair':'');
  if(!parts.has(key))parts.set(key,{name:key,material,positions:[],normals:[],colors:[],uvs:[],joints:[],weights:[],indices:[]});
  const p=parts.get(key),offset=p.positions.length/3,pos=geometry.attributes.position,norm=geometry.attributes.normal,uv=geometry.attributes.uv,col=geometry.attributes.color,tile=specs[material].tile;
  for(let i=0;i<pos.count;i++){
   p.positions.push(pos.getX(i),pos.getY(i),pos.getZ(i));p.normals.push(norm.getX(i),norm.getY(i),norm.getZ(i));
   let u=uv?uv.getX(i):0,v=uv?uv.getY(i):0;
   if(tile!==undefined){u=(tile%4+.008+clamp(u)*.984)/4;v=(Math.floor(tile/4)+.008+clamp(v)*.984)/2;}
   p.uvs.push(u,v);p.colors.push(col?col.getX(i):1,col?col.getY(i):1,col?col.getZ(i):1);
   const weights=weightFn?weightFn(geo.attributes.position.getY(i)):[[b.name,1]];
   for(let j=0;j<4;j++){p.joints.push(weights[j]?boneIndex.get(weights[j][0]):0);p.weights.push(weights[j]?weights[j][1]:0);}
  }
  const ix=geometry.index;for(let i=0;i<(ix?ix.count:pos.count);i++)p.indices.push(offset+(ix?ix.getX(i):i));
  geo.dispose();geometry.dispose();
 }
 const orb=(name,bone,mat,pos,size,rot)=>add(name,new T.SphereGeometry(1,16,10),bone,mat,pos,size,rot);
 const loft=(name,bone,mat,rings,weights,segments=20)=>add(name,art.loft(rings,segments),bone,mat,[0,0,0],[1,1,1],[0,0,0],weights);
 function tube(name,bone,mat,points,r=.009){add(name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,r,5,false),bone,mat);}
 function panel(name,bone,mat,outline,pos=[0,0,0],depth=.04,bow=0){
  const g=bow?art.curvedPlate(outline,depth,bow):art.plate(outline,depth,.011);
  add(name,g,bone,mat,pos);
 }
 function edge(name,bone,mat,outline,z,bow=0,r=.008){tube(name,bone,mat,outline.map(([x,y])=>[x,y,z+bow*(1-(x/.46)**2)]),r);}
 function jewel(name,bone,pos,size=.08){add(name,new T.OctahedronGeometry(size,0),bone,'glow',pos,[.7,1.35,.42]);}
 function fittings(slot){for(const p of art.armor(slot,true))add('forged_'+slot,p.geometry,p.bone,p.role==='trim'?'gold':'metal',p.position,[1,1,1],p.rotation);}
 // Heroic anatomy: longer legs and arms, tapered ribcage, defined shoulders and waist.
 loft('tailored_tunic','hips','fabric',[[1.02,.11,.115],[.94,.18,.16],[.81,.39,.245],[.66,.455,.27],[.47,.42,.26],[.26,.34,.22],[.06,.33,.215],[-.17,.365,.24]],y=>y<.32?mix('hips','spine',clamp((y+.04)/.37)):mix('spine','chest',clamp((y-.30)/.34)));
 loft('trouser_seat','hips','trousers',[[.07,.31,.20],[-.07,.35,.235],[-.23,.32,.225],[-.29,.27,.19]],()=>[['hips',1]]);
 loft('neck','neck','skin',[[.15,.09,.09],[.02,.101,.10],[-.08,.135,.13]],()=>[['neck',1]],16);
 for(const side of ['l','r']){
  const sign=side==='l'?-1:1,upper='upper_arm_'+side,lower='lower_arm_'+side,hand='hand_'+side,thigh='upper_leg_'+side,knee='lower_leg_'+side,foot='foot_'+side;
  loft('articulated_sleeve',upper,'fabric',[[.08,.09,.13],[.015,.17,.19],[-.14,.18,.17],[-.36,.155,.145],[-.52,.126,.135],[-.61,.125,.13],[-.74,.145,.14],[-.94,.12,.115],[-1.13,.09,.10]],y=>y<-1.0?mix(lower,hand,clamp((-y-1.0)/.14)):mix(upper,lower,clamp((-y-.46)/.29)));
  loft('muscular_leg',thigh,'trousers',[[.15,.15,.17],[-.04,.197,.21],[-.23,.20,.20],[-.43,.174,.175],[-.60,.145,.15],[-.68,.14,.145],[-.83,.157,.15],[-1.01,.13,.127],[-1.28,.105,.11]],y=>y<-1.10?mix(knee,foot,clamp((-y-1.1)/.19)):mix(thigh,knee,clamp((-y-.51)/.32)));
  // Real silhouettes on boots: ankle, instep, toe and a thin supporting sole.
  loft('traveler_boot',foot,'leather',[[.21,.105,.12],[.11,.125,.14],[.035,.148,.225,.065],[-.035,.16,.265,.10],[-.075,.16,.264,.10]],()=>[[foot,1]],20);
  loft('boot_sole',foot,'trousers',[[-.06,.164,.268,.10],[-.08,.165,.27,.10]],()=>[[foot,1]],20);
  loft('boot_cuff',knee,'leather',[[-.22,.15,.155],[-.28,.158,.16],[-.48,.125,.13],[-.59,.113,.12]],()=>[[knee,1]],16);
  for(let i=0;i<4;i++)tube('boot_lace',knee,'stitch',[[-.07,-.30-i*.047,.14],[0,-.32-i*.047,.165],[.07,-.30-i*.047,.14]],.0055);
  orb('gloved_palm',hand,'leather',[0,-.085,.015],[.104,.125,.075]);
  for(let f=0;f<4;f++)add('articulated_finger',art.lock([[(f-1.5)*.045,-.11,.03],[(f-1.5)*.047,-.22,.065],[(f-1.5)*.043,-.255,.096]],.024,.021,8),hand,'leather');
  add('thumb',art.lock([[sign*.07,-.03,.035],[sign*.127,-.1,.075],[sign*.09,-.17,.105]],.033,.028,10),hand,'leather');
  loft('wrist_wrap',lower,'leather',[[-.41,.12,.125],[-.47,.112,.117],[-.54,.102,.105]],()=>[[lower,1]],16);
  panel('glove_seam',hand,'gold',[[-.073,-.03],[.073,-.03],[.06,-.07],[-.06,-.07]],[0,0,.08],.012);
 }
 // Sculpted face: nose bridge, cheeks, jaw and recessed almond-shaped eyes.
 const headRings=[[.34,.015,.025,-.025],[.32,.12,.12,-.025],[.28,.198,.17,-.018],[.235,.218,.184,-.012],[.19,.22,.185,-.006],[.15,.215,.188,.004],[.11,.204,.182,.008],[.065,.198,.173,.014],[.02,.183,.161,.017],[-.025,.165,.145,.018],[-.07,.153,.123,.023],[-.11,.116,.094,.03],[-.14,.035,.04,.035]];
 const face=art.loft(headRings,48,(p,a)=>{if(Math.sin(a)<=0)return;const [x,y]=p,gauss=(cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
  p[2]+=.061*gauss(0,.11,.040,.073)+.015*gauss(0,.075,.042,.025)+.012*(gauss(.128,.065,.055,.06)+gauss(-.128,.065,.055,.06))-.014*(gauss(.093,.175,.04,.035)+gauss(-.093,.175,.04,.035));
 });
 const fp=face.attributes.position,fc=face.attributes.color;
 for(let i=0;i<fp.count;i++){const blush=Math.exp(-(((Math.abs(fp.getX(i))-.13)/.045)**2+((fp.getY(i)-.06)/.055)**2))*.08;if(fp.getZ(i)>.08){fc.setY(i,fc.getY(i)-blush);fc.setZ(i,fc.getZ(i)-blush*.85);}}
 add('sculpted_face',face,'head','skin');
 for(const sign of [-1,1]){
  orb('ear','head','skin',[sign*.217,.115,-.015],[.047,.075,.037],[0,0,-sign*.25]);
  orb('ear_inner','head','lip',[sign*.248,.116,.005],[.013,.043,.018]);
  // A shallow curved almond surface keeps whites inside the eyelids.
  const eye=new T.BufferGeometry(),p=[sign*.094,.176,.177],uv=[.5,.5],ix=[],n=24;
  for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;p.push(sign*.094+Math.cos(a)*.043,.176+Math.sin(a)*.020*(.88+.12*Math.cos(a)),.161+Math.sin(a)*.003);uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);if(i<n)ix.push(0,i+1,i+2);}
  eye.setAttribute('position',new T.Float32BufferAttribute(p,3));eye.setAttribute('uv',new T.Float32BufferAttribute(uv,2));eye.setIndex(ix);eye.computeVertexNormals();add('almond_eye',eye,'head','eye_white');
  orb('iris','head','iris',[sign*.091,.177,.180],[.015,.018,.004]);orb('pupil','head','pupil',[sign*.091,.177,.184],[.0067,.012,.002]);orb('eye_glint','head','eye_white',[sign*.091-.004,.184,.187],[.0035,.004,.001]);
  tube('upper_lid','head','skin',[[sign*.052,.177,.173],[sign*.093,.198,.17],[sign*.137,.175,.153]],.007);
  tube('lower_lid','head','skin',[[sign*.052,.173,.173],[sign*.093,.157,.168],[sign*.137,.174,.154]],.005);
  add('sculpted_brow',art.lock([[sign*.05,.224,.181],[sign*.094,.232,.176],[sign*.145,.215,.149]],.017,.008,10),'head','hair');
  tube('nostril','head','lip',[[sign*.014,.074,.26],[sign*.027,.072,.246]],.0035);
 }
 tube('mouth','head','lip',[[-.052,-.035,.161],[0,-.041,.178],[.052,-.035,.161]],.0055);
 tube('lower_lip','head','skin',[[-.035,-.051,.163],[0,-.057,.173],[.035,-.051,.163]],.005);
 const defaultHair=art.hair('short',new T.MeshStandardMaterial());defaultHair.traverse(m=>{if(m.isMesh)add('default_hair',m.geometry.clone(),'head','hair');});
 // Waist belts, an original sun-shaped clasp and tailored split skirts.
 loft('belt','hips','leather',[[.065,.343,.229],[-.04,.35,.238]],()=>[['hips',1]]);
 panel('sun_buckle','hips','gold',[[-.085,.035],[0,.09],[.085,.035],[.07,-.045],[0,-.07],[-.07,-.045]],[0,0,.26],.035);
 jewel('belt_ember','hips',[0,.015,.29],.031);
 for(const side of [-1,1]){
  const bone=side<0?'upper_leg_l':'upper_leg_r';
  panel('belt_pouch','hips','leather',[[-.085,.08],[.085,.08],[.09,-.10],[.05,-.14],[-.05,-.14],[-.09,-.10]],[side*.31,-.035,.18],.11);
  panel('pouch_flap','hips','gold',[[-.08,.075],[.08,.075],[.045,.02],[-.045,.02]],[side*.31,-.035,.25],.014);
  if(kind==='flame'){
   panel('thigh_plate',bone,'metal',[[-.145,.10],[.145,.10],[.15,-.29],[0,-.38],[-.15,-.29]],[0,-.05,.20],.055);
   edge('thigh_trim',bone,'gold',[[-.13,.08],[-.13,-.27],[0,-.34],[.13,-.27],[.13,.08]],.235,0,.008);
   panel('knee_guard','lower_leg_'+(side<0?'l':'r'),'gold',[[-.115,.025],[0,.10],[.115,.025],[.09,-.10],[0,-.145],[-.09,-.10]],[0,-.015,.15],.045);
  }
 }
 if(kind==='classic'){
  // Fitted travel leathers, one reinforced shoulder, curved straps and subtle stitching.
  panel('travel_jerkin','chest','leather',[[-.33,.27],[-.13,.31],[0,.18],[.13,.31],[.33,.27],[.37,-.05],[.27,-.36],[0,-.44],[-.27,-.36],[-.37,-.05]],[0,0,.15],.045,.17);
  edge('jerkin_binding','chest','stitch',[[-.33,.26],[-.13,.30],[0,.17],[.13,.30],[.33,.26]],.183,.17,.008);
  tube('diagonal_harness','chest','leather',[[-.34,.32,.24],[-.18,.09,.37],[0,-.12,.39],[.26,-.38,.29]],.039);
  panel('harness_buckle','chest','gold',[[-.045,.045],[.045,.045],[.045,-.045],[-.045,-.045]],[-.085,-.025,.408],.024);
  for(const p of art.armor('shoulders',false))if(p.bone==='upper_arm_l')add('scout_pauldron',p.geometry,p.bone,p.role==='trim'?'gold':'metal',p.position,[1,1,1],p.rotation);
  for(let i=0;i<4;i++)panel('leather_lamella','upper_arm_r','leather',[[-.15,.045],[.15,.045],[.13,-.045],[-.13,-.045]],[0,-.08-i*.065,.13],.025);
  panel('collar_fold','chest','cape',[[-.23,.35],[-.11,.40],[0,.19],[.11,.40],[.23,.35],[.14,.20],[0,.13],[-.14,.20]],[0,0,.155],.038,.06);
 }else{
  fittings('shoulders');fittings('hands');fittings('feet');
  const cuirass=[[-.39,.22],[-.20,.32],[0,.24],[.20,.32],[.39,.22],[.43,.03],[.34,-.17],[.16,-.25],[0,-.19],[-.16,-.25],[-.34,-.17],[-.43,.03]];
  panel('forged_cuirass','chest','metal',cuirass,[0,0,.19],.065,.14);
  edge('neckline_inlay','chest','gold',[[-.34,.24],[-.18,.285],[0,.205],[.18,.285],[.34,.24]],.235,.14,.009);
  edge('cuirass_hem','chest','gold',[[-.33,-.135],[-.16,-.215],[0,-.155],[.16,-.215],[.33,-.135]],.235,.14,.008);
  for(const sign of [-1,1]){
   tube('pectoral_engraving','chest','gold',[[sign*.13,.055,.368],[sign*.24,.105,.337],[sign*.31,.10,.305]],.0045);
   const arm=sign<0?'upper_arm_l':'upper_arm_r';
   panel('shoulder_crest',arm,'gold',[[-.08,.12],[0,.28],[.08,.12],[0,.075]],[sign*.10,.025,.05],.06);
   jewel('shoulder_ember',arm,[sign*.06,-.035,.342],.053);
   for(let i=0;i<3;i++)tube('shoulder_engraving',arm,'gold',[[sign*-.09,-.04-i*.033,.317],[sign*.025,-.075-i*.033,.33],[sign*.14,-.05-i*.033,.302]],.005);
  }
  for(let i=0;i<3;i++){
   const y=.08-i*.115;
   panel('abdominal_lamella','spine','metal',[[-.28,y+.06],[0,y+.09],[.28,y+.06],[.255,y-.04],[0,y-.085],[-.255,y-.04]],[0,0,.19],.045,.055);
   edge('lamella_trim','spine','gold',[[-.25,y-.03],[0,y-.075],[.25,y-.03]],.223,.055,.006);
  }
  panel('ember_frame','chest','gold',[[-.077,.15],[0,.24],[.077,.15],[0,-.025]],[0,0,.353],.024);
  jewel('heart_ember','chest',[0,.125,.384],.077);
  panel('split_tabard','hips','crimson',[[-.20,.015],[.20,.015],[.17,-.57],[0,-.71],[-.17,-.57]],[0,0,.285],.018);
  edge('tabard_embroidery','hips','gold',[[-.18,-.04],[-.15,-.55],[0,-.675],[.15,-.55],[.18,-.04]],.304,0,.007);
  panel('tabard_sigil','hips','gold',[[-.035,-.22],[0,-.14],[.035,-.22],[0,-.32]],[0,0,.314],.013);
 }
 // One draped cape, with a broad readable silhouette and a raised sun crest on its back.
 const cp=[],cu=[],ci=[],cols=20,rows=20,length=kind==='classic'?1.52:1.91;
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
  const u=c/cols,v=r/rows,x=(u-.5)*(.60+v*.45),y=.30-v*length+(v>.9?Math.cos(u*Math.PI*4)*.025:0),z=-.015-v*.09-Math.cos(u*Math.PI*8)*(.012+v*.029);
  cp.push(x,y,z);cu.push(u,1-v);
 }
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;ci.push(a,a+1,b,b,a+1,b+1);}
 const cape=new T.BufferGeometry();cape.setAttribute('position',new T.Float32BufferAttribute(cp,3));cape.setAttribute('uv',new T.Float32BufferAttribute(cu,2));cape.setIndex(ci);cape.computeVertexNormals();add('draped_cape',art.paint(cape),'back',kind==='classic'?'cape':'crimson');
 for(const sign of [-1,1])tube('cape_binding','back','gold',[0,.25,.65,1].map(v=>[sign*.5*(.60+v*.45),.30-v*length+(v>.9?.025:0),-.039-v*.119]),.007);
 const sun=new T.TorusGeometry(.11,.009,5,24);add('cape_sun_ring',sun,'back','gold',[0,-.25,-.11]);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;tube('sun_rays','back','gold',[[Math.cos(a)*.145,-.25+Math.sin(a)*.145,-.115],[Math.cos(a)*.185,-.25+Math.sin(a)*.185,-.115]],.006);}
 return exportGLB(parts,kind);
}
function exportGLB(parts,kind){
 const chunks=[],gltf={asset:{version:'2.0',generator:'Emberwild original character builder v1.3',copyright:'Original Emberwild art for evmob30-web/testapp'},scene:0,scenes:[{nodes:[0]}],nodes:[],skins:[],meshes:[],materials:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}],images:[],textures:[{source:0,sampler:0}],samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}]};let length=0;
 function view(buffer,target){const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}const index=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:length,byteLength:buffer.length,...(target?{target}:{})});chunks.push(buffer);length+=buffer.length;return index;}
 function acc(values,type,componentType,minmax=false,target=34962){const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},typed=componentType===5126?new Float32Array(values):componentType===5123?new Uint16Array(values):new Uint32Array(values);const result={bufferView:view(Buffer.from(typed.buffer),target),componentType,count:values.length/sizes[type],type};if(minmax){result.min=Array(sizes[type]).fill(Infinity);result.max=Array(sizes[type]).fill(-Infinity);for(let i=0;i<values.length;i++){const axis=i%sizes[type];result.min[axis]=Math.min(result.min[axis],values[i]);result.max[axis]=Math.max(result.max[axis],values[i]);}}gltf.accessors.push(result);return gltf.accessors.length-1;}
 for(const bone of bones){const children=bone.children.filter(b=>b.isBone).map(b=>boneIndex.get(b.name));gltf.nodes.push({name:bone.name,translation:bone.position.toArray(),rotation:bone.quaternion.toArray(),...(children.length?{children}:{})});}
 gltf.skins.push({name:'Emberwild_shared_skeleton',skeleton:0,joints:bones.map((_,i)=>i),inverseBindMatrices:acc(bones.flatMap(b=>new T.Matrix4().copy(b.matrixWorld).invert().toArray()),'MAT4',5126,false,null)});
 gltf.images.push({name:'Emberwild_painted_material_atlas',mimeType:'image/png',bufferView:view(texture)});
 const materialIndexes=new Map();
 for(const part of parts.values()){
  if(!materialIndexes.has(part.material)){
   const spec=specs[part.material],color=new T.Color(spec.color),material={name:part.material,pbrMetallicRoughness:{baseColorFactor:[color.r,color.g,color.b,1],metallicFactor:spec.metalness||0,roughnessFactor:spec.roughness,...(spec.tile!==undefined?{baseColorTexture:{index:0}}:{})},doubleSided:['cape','crimson'].includes(part.material),...(spec.emissive?{emissiveFactor:spec.emissive}:{})};
   materialIndexes.set(part.material,gltf.materials.length);gltf.materials.push(material);
  }
  const attrs={POSITION:acc(part.positions,'VEC3',5126,true),NORMAL:acc(part.normals,'VEC3',5126),COLOR_0:acc(part.colors,'VEC3',5126),TEXCOORD_0:acc(part.uvs,'VEC2',5126),JOINTS_0:acc(part.joints,'VEC4',5123),WEIGHTS_0:acc(part.weights,'VEC4',5126)};
  const mesh=gltf.meshes.length;gltf.meshes.push({name:kind+'_'+part.name,primitives:[{attributes:attrs,indices:acc(part.indices,'SCALAR',part.positions.length/3>65535?5125:5123,false,34963),material:materialIndexes.get(part.material)}]});
  const node=gltf.nodes.length;gltf.nodes.push({name:kind+'_'+part.name,mesh,skin:0});gltf.scenes[0].nodes.push(node);
 }
 gltf.buffers[0].byteLength=length;const bin=Buffer.concat(chunks),json=Buffer.from(JSON.stringify(gltf)),jsonPad=Buffer.alloc((4-json.length%4)%4,32),binPad=Buffer.alloc((4-bin.length%4)%4),total=12+8+json.length+jsonPad.length+8+bin.length+binPad.length;
 const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(total,8);const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length+jsonPad.length);jh.writeUInt32LE(0x4e4f534a,4);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length+binPad.length);bh.writeUInt32LE(0x004e4942,4);
 return Buffer.concat([header,jh,json,jsonPad,bh,bin,binPad]);
}
const data={};for(const [id,file] of [['classic','ember-adventurer.glb'],['flame_guardian','flame-guardian.glb']]){const glb=build(id==='classic'?'classic':'flame');fs.writeFileSync(path.join(ROOT,'assets/characters',file),glb);data[id]=glb.toString('base64');console.log(file+': '+glb.length+' bytes');}
fs.writeFileSync(path.join(ROOT,'js/character-assets-data.js'),'/* Generated by scripts/build-character-assets.cjs. Embedded GLBs keep file:// and offline play working. */\n(function(root){root.EmberCharacterData='+JSON.stringify(data)+';})(typeof window===\'undefined\'?globalThis:window);\n');
