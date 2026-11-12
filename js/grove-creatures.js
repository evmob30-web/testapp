/* Original Bosgeest and Wortelmoeder. Weighted roots, leaf mantles and living spores.
 * Cached art is shared; every creature owns its skeleton, glow and animation state. */
(function(root){
'use strict';
const cache=new WeakMap(),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
function rig(T,mother){
 const group=new T.Group();group.name=mother?'Wortelmoeder':'Bosgeest';group.userData.actor=mother?'root-mother':'forest-spirit';
 const model=new T.Group();model.name=mother?'RootMotherModel':'ForestSpiritModel';group.add(model);const J={},legs=[],arms=[];
 function bone(name,parent,x=0,y=0,z=0){const b=new T.Bone();b.name='grove_'+name;b.position.set(x,y,z);parent.add(b);J[name]=b;return b;}
 const base=bone('root',model),hips=bone('hips',base,0,mother?2.05:1.50,0),chest=bone('chest',hips,0,mother?.85:.49,0),neck=bone('neck',chest,0,mother?.84:.32,0),head=bone('head',neck,0,mother?.35:.15,.025);
 bone('core',hips,0,mother?-.25:-.03,mother?.53:.12);
 for(const side of [-1,1]){
  const s=side<0?'l':'r',upper=bone('arm_'+s,chest,side*(mother?.86:.48),mother?.22:.06,0),lower=bone('forearm_'+s,upper,0,mother?-1.05:-.46,0),hand=bone('hand_'+s,lower,0,mother?-1.0:-.43,.03);
  arms.push({side,upper,lower,end:hand,target:new T.Vector3(),saved:[new T.Quaternion(),new T.Quaternion(),new T.Quaternion()]});
  for(let i=0;i<3;i++){const finger=bone('finger_'+s+i,hand,(i-1)*(mother?.16:.085),mother?-.28:-.13,.025);bone('tip_'+s+i,finger,0,mother?-.24:-.13,.05);}
  const thumb=bone('thumb_'+s,hand,-side*(mother?.24:.13),-.07,.04);thumb.rotation.z=-side*.65;
  bone('eye_'+s,head,side*(mother?.155:.135),mother?.23:.12,mother?.30:.265);
  if(mother)for(let row=-1;row<=1;row++){
   const name=s+(row+1),upper=bone('leg_'+name,hips,side*.65,-.30,row*.65),lower=bone('knee_'+name,upper,side*.55,-.76,row*.16),end=bone('foot_'+name,lower,side*.38,-.86,row*.14);
   legs.push({side,row,upper,lower,end,target:new T.Vector3(),anchor:new T.Vector3(),takeoff:new T.Vector3(),landing:new T.Vector3(),stance:null,start:0,contact:true,phase:0});
  }
 }
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2,b=bone('crown_'+i,head,Math.cos(a)*(mother?.27:.19),mother?.38:.29,Math.sin(a)*(mother?.22:.16)-.015);b.rotation.y=-a+Math.PI/2;}
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2,b=bone('mantle_'+i,chest,Math.cos(a)*(mother?.62:.41),mother?.27:.06,Math.sin(a)*(mother?.38:.25));b.rotation.y=-a+Math.PI/2;}
 if(mother){for(let i=0;i<6;i++){const b=bone('pod_'+i,J.core,0,0,.18);b.rotation.z=i/6*Math.PI*2;}}
 else for(let i=0;i<3;i++){const b=bone('tail_'+i,hips,(i-1)*.13,-.45,-.04),tip=bone('tailtip_'+i,b,0,-.40,0);}
 for(const c of [...legs,...arms]){c.a=c.lower.position.length();c.b=c.end.position.length();c.axisA=c.lower.position.clone().normalize();c.axisB=c.end.position.clone().normalize();}
 group.updateMatrixWorld(true);return {group,model,joints:J,legs,arms};
}
function texture(T){
 const n=256,data=new Uint8Array(n*n*4);let seed=8191;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const u=x/n,v=y/n,w=u+.018*Math.sin(v*12.56)+.012*Math.sin(v*6.28+u*8),p=(w*13)%1;
  const grain=Math.exp(-(((p-.5)/.12)**2)),light=clamp(190+Math.sin(u*19+v*4)*14-grain*33+(seed%19-9),90,235),i=(y*n+x)*4;data[i]=light;data[i+1]=light*.97;data[i+2]=light*.91;data[i+3]=255;
 }
 const t=new T.DataTexture(data,n,n);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;
}
function art(T,mother,J){
 if(!cache.has(T))cache.set(T,new Map());const cacheT=cache.get(T),id=mother?'mother':'spirit';if(cacheT.has(id))return cacheT.get(id);
 const bones=Object.values(J),index=new Map(bones.map((b,i)=>[b,i])),parts=new Map();
 const palette=mother?{wood:'#9d845e',bark:'#594b39',leaf:'#627d63',petal:'#ad9ab2',shadow:'#252932',glow:'#8bdcaf'}:{wood:'#738d86',bark:'#3d5c59',leaf:'#578c80',petal:'#83b2ad',shadow:'#1c333d',glow:'#86deea'};
 function add(g,kind,bone,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],weights,color){
  bone=typeof bone==='string'?J[bone]:bone;const original=g.attributes.position.clone(),matrix=new T.Matrix4().multiplyMatrices(bone.matrixWorld,new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale)));g.applyMatrix4(matrix);if(!g.attributes.normal)g.computeVertexNormals();
  if(!parts.has(kind))parts.set(kind,{p:[],n:[],uv:[],c:[],j:[],w:[],ix:[]});const b=parts.get(kind),off=b.p.length/3,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,tint=new T.Color(color||palette[kind]);
  for(let i=0;i<p.count;i++){
   b.p.push(p.getX(i),p.getY(i),p.getZ(i));b.n.push(n.getX(i),n.getY(i),n.getZ(i));b.uv.push(uv?uv.getX(i):original.getX(i),uv?uv.getY(i):original.getY(i));
   const shade=.90+n.getY(i)*.07+n.getZ(i)*.035+Math.sin(p.getX(i)*6+p.getY(i)*4)*.035;b.c.push(tint.r*shade,tint.g*shade,tint.b*shade);
   const ws=weights?weights(original.getY(i),original.getX(i),original.getZ(i)):[[bone,1]];for(let k=0;k<4;k++){const pair=ws[k];b.j.push(pair?index.get(typeof pair[0]==='string'?J[pair[0]]:pair[0]):0);b.w.push(pair?pair[1]:0);}
  }
  for(let i=0;i<(g.index?g.index.count:p.count);i++)b.ix.push(off+(g.index?g.index.getX(i):i));g.dispose();
 }
 function caps(p,uv,ix,rows,sides){for(const row of [0,rows-1]){const start=row*(sides+1),c=[0,0,0];for(let i=0;i<sides;i++)for(let k=0;k<3;k++)c[k]+=p[(start+i)*3+k]/sides;const center=p.length/3;p.push(...c);uv.push(.5,.5);const rim=p.length/3;for(let i=0;i<=sides;i++){p.push(p[(start+i)*3],p[(start+i)*3+1],p[(start+i)*3+2]);uv.push(.5+.5*Math.cos(i/sides*Math.PI*2),.5+.5*Math.sin(i/sides*Math.PI*2));}for(let i=0;i<sides;i++)row===0?ix.push(center,rim+i+1,rim+i):ix.push(center,rim+i,rim+i+1);}}
 function loft(rows,sides=28,sculpt,hole){
  const p=[],uv=[],ix=[];rows.forEach(([y,rx,rz,z=0,x=0],r)=>{for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,f=1+.022*Math.sin(a*7+y*3),v=[Math.cos(a)*rx*f+x,y,Math.sin(a)*rz*f+z];if(sculpt)sculpt(v,a,r);p.push(...v);uv.push(i/sides*1.5,y*.65);}});
  for(let r=0;r<rows.length-1;r++)for(let i=0;i<sides;i++){const a=r*(sides+1)+i,b=a+sides+1;if(hole&&hole((p[a*3]+p[(b+1)*3])*.5,(p[a*3+1]+p[(b+1)*3+1])*.5,(p[a*3+2]+p[(b+1)*3+2])*.5))continue;ix.push(a,a+1,b,b,a+1,b+1);}caps(p,uv,ix,rows.length,sides);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const n=g.attributes.normal;for(let r=0;r<rows.length;r++){const a=r*(sides+1),b=a+sides,v=new T.Vector3(n.getX(a)+n.getX(b),n.getY(a)+n.getY(b),n.getZ(a)+n.getZ(b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}return g;
 }
 function branch(points,radii,kind,bone,{steps=18,sides=9,flat=.80,weights,color}={}){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),frames=curve.computeFrenetFrames(steps,false),p=[],uv=[],ix=[];
  for(let r=0;r<=steps;r++){const t=r/steps,u=t*(radii.length-1),i=Math.min(radii.length-2,Math.floor(u)),radius=mix(radii[i],radii[i+1],u-i),center=curve.getPoint(t);for(let s=0;s<=sides;s++){const a=s/sides*Math.PI*2,rough=1+.06*Math.sin(a*5+t*4),v=center.clone().addScaledVector(frames.normals[r],Math.cos(a)*radius*rough).addScaledVector(frames.binormals[r],Math.sin(a)*radius*rough*flat);p.push(v.x,v.y,v.z);uv.push(s/sides,t*curve.getLength()*.75);}}
  for(let r=0;r<steps;r++)for(let s=0;s<sides;s++){const a=r*(sides+1)+s,b=a+sides+1;ix.push(a,a+1,b,b,a+1,b+1);}caps(p,uv,ix,steps+1,sides);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();add(g,kind,bone,[0,0,0],[1,1,1],[0,0,0],weights,color);
 }
 function leaf(points,width,kind,bone,{steps=20,curl=.08,color,veins=false,rot=[0,0,0],pos=[0,0,0]}={}){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),frames=curve.computeFrenetFrames(steps,false),p=[],uv=[],ix=[],sides=6;
  for(let i=0;i<=steps;i++){const t=i/steps,c=curve.getPoint(t),w=Math.max(.001,Math.pow(Math.sin(Math.PI*t),.67)*width);for(let s=0;s<=sides;s++){const u=s/sides*2-1,v=c.clone().addScaledVector(frames.normals[i],u*w).addScaledVector(frames.binormals[i],(1-u*u)*curl*Math.sin(Math.PI*t)+Math.abs(u)*Math.sin(t*19)*width*.025);p.push(v.x,v.y,v.z);uv.push(s/sides,t);}}
  for(let i=0;i<steps;i++)for(let s=0;s<sides;s++){const a=i*(sides+1)+s,b=a+sides+1;ix.push(a,a+1,b,b,a+1,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();add(g,kind,bone,pos,[1,1,1],rot,null,color);
  if(veins){
   const point=(t,u)=>{const i=Math.round(t*steps);t=i/steps;return curve.getPoint(t).addScaledVector(frames.normals[i],u*Math.pow(Math.sin(Math.PI*t),.67)*width).addScaledVector(frames.binormals[i],(1-u*u)*curl*Math.sin(Math.PI*t)+Math.abs(u)*Math.sin(t*19)*width*.025+.014).toArray();};
   for(let v=0;v<3;v++)for(const side of [-1,1]){const t=.30+v*.16;branch([point(t,0),point(t+.05,side*.40),point(t+.10,side*.82)],[.004,.003,.001],'leaf',bone,{steps:8,sides:4,color:mother?'#899e82':'#6c9d91'});}
  }
 }
 const oval=(kind,bone,pos,size,color)=>add(new T.SphereGeometry(1,20,12),kind,bone,pos,size,[0,0,0],null,color),blend=(a,b,t)=>[[a,1-clamp(t)],[b,clamp(t)]];
 if(mother){
  add(loft([[1.26,.19,.21],[1.02,.49,.35],[.73,.71,.47],[.30,.83,.59],[-.12,.98,.66],[-.48,.93,.65],[-.83,.70,.50],[-1.03,.33,.28],[-1.12,.07,.08]],40,null,(x,y,z)=>z>0&&Math.abs(x)<.40&&y>-.70&&y<.20),'wood','hips',[0,0,0],[1,1,1],[0,0,0],y=>blend('hips','chest',(y-.30)/.7));
  oval('shadow','hips',[0,-.25,.38],[.45,.64,.19]);add(loft([[.60,.005,.01],[.41,.25,.20],[.08,.42,.29],[-.35,.31,.23],[-.65,.008,.01]],36),'glow','core');
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a),z=Math.sin(a);if(z>0&&Math.abs(x)<.45)continue;branch([[x*.37,-1.03,z*.29],[x*.91,-.42,z*.66],[x*.73,.28,z*.58],[x*.48,.99,z*.36]],[.025,.14,.16,.02],'bark','hips',{steps:26,weights:y=>blend('hips','chest',(y-.30)/.7)});}
  for(const side of [-1,1])for(let i=0;i<3;i++)branch([[side*.67,.21-i*.30,.42],[side*.49,.04-i*.26,.70],[side*.29,-.08-i*.25,.81]],[.15,.10,.012],'bark','hips',{steps:22,flat:.65});
  add(loft([[.38,.12,.15],[.18,.23,.25],[-.10,.29,.30],[-.50,.44,.35],[-.78,.34,.26]],30),'wood','neck');
  for(const side of [-1,1]){
   add(loft([[.36,.018,.02],[.29,.30,.29],[.15,.62,.52],[.03,.78,.64],[-.045,.75,.61],[-.09,.40,.35]],32),'petal','chest',[side*.72,.28,-.06]);
   for(let i=0;i<11;i++){const a=i*2.39996,r=.13+Math.sqrt(i/11)*.39;oval('glow','chest',[side*.72+Math.cos(a)*r,.48-r*.22,-.06+Math.sin(a)*r*.77],[.018+(i%3)*.007,.008,.025]);}
   for(let i=0;i<9;i++){const a=i/9*Math.PI*2;branch([[side*.72,.17,-.06],[side*.72+Math.cos(a)*.40,.02,Math.sin(a)*.31-.06],[side*.72+Math.cos(a)*.65,-.04,Math.sin(a)*.51-.06]],[.009,.014,.002],'wood','chest',{steps:12,sides:5,color:'#c8b591'});}
  }
  for(let i=0;i<6;i++)leaf([[0,0,0],[0,.36,.11],[0,.73,.04],[0,.91,-.10]],.24,'petal','pod_'+i,{curl:.07,color:i%2?'#a894b5':'#b4a3bd'});
 }else{
  // A hollow leaf-and-root cage surrounds the floating seed; there are no human legs.
  add(new T.IcosahedronGeometry(.31,2),'glow','core',[0,0,0],[.85,1.45,.85]);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,x=Math.cos(a),z=Math.sin(a);branch([[x*.09,-.46,z*.08],[x*.31,-.20,z*.30],[x*.37,.20,z*.30],[x*.21,.60,z*.19],[0,.78,0]],[.015,.055,.07,.025,.003],'wood','hips',{steps:27,sides:9});}
  for(const side of [-1,1])branch([[0,.27,0],[side*.25,.17,.04],[side*.48,.06,0]],[.11,.13,.10],'wood','chest',{steps:22});
  add(loft([[.25,.04,.05],[.07,.18,.16],[-.17,.25,.21],[-.33,.18,.16],[-.42,.03,.035]],28),'bark','neck');
  for(let i=0;i<3;i++){
   branch([[0,.04,0],[.04,-.20,.035],[0,-.42,0]],[.055,.04,.02],'bark','tail_'+i,{steps:20,weights:y=>blend('tail_'+i,'tailtip_'+i,(-y-.27)/.16)});
   branch([[0,.02,0],[(i-1)*.13,-.25,.04],[(i-1)*.18,-.52,.10]],[.025,.02,.001],'wood','tailtip_'+i,{steps:20,color:'#83a79c'});
  }
 }
 // An angular carved mask with recessed luminous eyes, framed by a living corolla.
 const mask=mother?1:.83;
 add(loft([[.67*mask,.045,.06],[.54*mask,.25*mask,.22*mask],[.34*mask,.38*mask,.30*mask],[.14*mask,.34*mask,.29*mask],[-.08*mask,.22*mask,.21*mask],[-.29*mask,.04,.05]],40,(p,a)=>{if(Math.sin(a)>0){const x=p[0],y=p[1];p[2]+=.075*Math.exp(-((x/.10)**2+((y-.25)/.30)**2));}}),'wood','head');
 for(const side of [-1,1]){
  const s=side<0?'l':'r',eye=J['eye_'+s].position;
  oval('shadow','head',[eye.x,eye.y,eye.z-.02],[mother?.13:.115,.075,.035]);add(new T.SphereGeometry(1,20,10),'glow','eye_'+s,[0,0,.01],[mother?.086:.077,.024,.015],[0,0,side*.24]);
  branch([[side*.04,mother?.29:.19,mother?.33:.29],[side*.20,mother?.36:.25,mother?.32:.28],[side*(mother?.34:.28),mother?.35:.23,mother?.23:.19]],[.025,.055,.003],'bark','head',{steps:19,flat:.65});
  branch([[side*(mother?.30:.25),mother?.31:.20,.22],[side*(mother?.29:.24),.02,.24],[side*.07,-.22*mask,.13]],[.045,.05,.005],'bark','head',{steps:19,flat:.65});
  const upper='arm_'+s,lower='forearm_'+s,hand='hand_'+s,k=mother?1:.45;
  branch([[0,.09,0],[side*.07,-.32*k,.03],[0,-1.07*k,0]],[.25*k,.28*k,.12*k],'wood',upper,{steps:26,weights:y=>blend(upper,lower,(-y-.80*k)/(.26*k))});
  branch([[0,.08,0],[-side*.07,-.36*k,.04],[0,-1.03*k,.03]],[.17*k,.25*k,.12*k],'bark',lower,{steps:25,weights:y=>blend(lower,hand,(-y-.83*k)/(.20*k))});
  for(let i=0;i<3;i++)branch([[(i-1)*.075*k,.01,.12*k],[(i-1)*.14*k,-.37*k,.20*k],[(i-1)*.09*k,-.90*k,.11*k]],[.015*k,.043*k,.004],'wood',lower,{steps:20,color:mother?'#b39a70':'#8aa89b'});
  add(loft([[.05,.07,.08],[-.06*k,.20*k,.13*k],[-.28*k,.19*k,.12*k],[-.34*k,.09*k,.07*k]],24),'wood',hand);
  for(let i=0;i<3;i++){
   const f='finger_'+s+i,tip='tip_'+s+i;branch([[0,.03,0],[0,-.12*k,.03],[0,-.25*k,.05]],[.07*k,.065*k,.045*k],'wood',f,{steps:15});branch([[0,.02,0],[0,-.11*k,.06],[.015,-.22*k,.15*k]],[.047*k,.036*k,.001],'bark',tip,{steps:17});
  }
  branch([[0,.02,0],[0,-.13*k,.03],[0,-.25*k,.13*k]],[.09*k,.06*k,.001],'wood','thumb_'+s,{steps:17});
 }
 for(let i=0;i<8;i++){
  const c='crown_'+i,length=mother?(i%2?1.12:1.43):.72+(i%3)*.08,width=mother?.25:.15;
  leaf([[0,0,0],[0,length*.32,.16],[0,length*.78,.31],[0,length,.18]],width,'petal',c,{steps:26,curl:.055,veins:true,color:mother?(i%2?'#b6b59b':'#8aa28a'):(i%2?'#6e9d8e':'#9abcb0')});
  branch([[0,0,.015],[0,length*.43,.20],[0,length*.83,.29]],[.018,.015,.001],'wood',c,{steps:18,sides:6});
 }
 for(let i=0;i<6;i++){
  const m='mantle_'+i,length=mother?1.18:1.12+(i%2)*.22,width=mother?.31:.27;
  leaf([[0,.04,0],[0,-length*.28,.24],[0,-length*.74,.23],[0,-length,.04]],width,'leaf',m,{steps:25,curl:.05});
  branch([[0,.015,.02],[0,-length*.36,.26],[0,-length*.78,.20]],[.016,.012,.001],'wood',m,{steps:18,sides:6});
  if(!mother)leaf([[0,0,-.035],[0,-length*.33,.12],[0,-length*.8,.13],[0,-length*1.13,-.02]],width*.74,'petal',m,{steps:22,curl:.03,color:'#7aaba1'});
 }
 if(mother)for(const side of [-1,1])for(let row=-1;row<=1;row++){
  const s=(side<0?'l':'r')+(row+1),upper='leg_'+s,lower='knee_'+s,foot='foot_'+s,a=J[lower].position,b=J[foot].position;
  branch([[0,.12,0],[a.x*.46,-.20,a.z*.3],[a.x,a.y,a.z]],[.19,.27,.14],'wood',upper,{steps:26,weights:y=>blend(upper,lower,(-y-.55)/.22)});
  branch([[0,.08,0],[b.x*.43,-.26,b.z*.36],[b.x,b.y,b.z]],[.16,.24,.13],'bark',lower,{steps:25,weights:y=>blend(lower,foot,(-y-.64)/.23)});
  for(let i=0;i<3;i++){const off=(i-1)*.11;branch([[0,.06,0],[side*(.12+i*.03),-.035,.15+off],[side*.28,-.10,.36+off]],[.12,.11,.002],'wood',foot,{steps:20});}
  for(let i=0;i<2;i++)branch([[side*.09,.04,i*.14],[side*.23,.10,i*.14],[side*.35,.28,i*.12]],[.08,.05,.001],'wood',lower,{steps:15,color:'#a49572'});
 }
 const tex=texture(T),materials={};for(const kind of Object.keys(palette))materials[kind]=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:kind==='glow'?.4:.91,metalness:0,side:kind==='leaf'||kind==='petal'?T.DoubleSide:T.FrontSide,...['wood','bark'].includes(kind)?{map:tex,bumpMap:tex,bumpScale:.025}:{},...kind==='glow'?{emissive:mother?'#54ae84':'#45b2c4',emissiveIntensity:.85}:{}});
 const geometry=new Map();let triangles=0;for(const [kind,b]of parts){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(b.j,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(b.w,4));g.setIndex(b.ix);g.computeBoundingSphere();geometry.set(kind,g);triangles+=b.ix.length/3;}
 const data={geometry,materials,texture:tex,triangles};cacheT.set(id,data);return data;
}
function create(T,mother=false){
 const r=rig(T,mother),{group,model,joints:J,legs,arms}=r,data=art(T,mother,J),bones=Object.values(J),skin=new T.Skeleton(bones),materials={},meshes=[];
 for(const [kind,g]of data.geometry){const m=data.materials[kind].clone(),mesh=new T.SkinnedMesh(g,m);mesh.name=(mother?'rootmother_':'spirit_')+kind;materials[kind]=m;mesh.castShadow=kind!=='glow';mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.bind(skin,new T.Matrix4());model.add(mesh);meshes.push(mesh);}
 const previous=new T.Vector3(),position=new T.Vector3(),velocity=new T.Vector3(),target=new T.Vector3(),pole=new T.Vector3(),start=new T.Vector3(),direction=new T.Vector3(),bend=new T.Vector3(),mid=new T.Vector3(),resolved=new T.Vector3(),local=new T.Vector3(),q=new T.Quaternion(),worldQ=new T.Quaternion(),green=new T.Color(mother?'#54ae84':'#45b2c4'),violet=new T.Color('#a26bd0');
 const deathAnchor=new T.Group();deathAnchor.name=mother?'RootMotherDefeat':'ForestSpiritDefeat';const deathStart=bones.map(()=>({p:new T.Vector3(),q:new T.Quaternion(),s:new T.Vector3()})),deathFeet=legs.map(()=>new T.Vector3());
 let elapsed=0,initialized=false,phase=.27,locomotion=0,cast=.0,recoil=0,recoilSide=1,dying=false,held=false,deathTime=0,fading=false,wasMoving=false;
 const motion={state:'idle',speed:0,locomotion:0,warning:0,strike:0,spell:0,recoil:0,defeat:0,contacts:legs.map(()=>true)};
 function reset(){if(model.parent!==group){group.add(model);deathAnchor.removeFromParent();}dying=false;held=false;deathTime=0;initialized=false;elapsed=0;phase=.27;locomotion=cast=recoil=0;wasMoving=false;model.position.set(0,0,0);model.rotation.set(0,0,0);model.scale.set(1,1,1);model.visible=true;for(const m of Object.values(materials)){m.opacity=1;if(fading){m.transparent=false;m.depthWrite=true;m.needsUpdate=true;}}fading=false;for(const leg of legs)leg.stance=null;Object.assign(motion,{state:'idle',speed:0,locomotion:0,warning:0,strike:0,spell:0,recoil:0,defeat:0});}
 function attack(kind){cast=mother?.72:.32;motion.spell=kind==='salvo'||!mother?1:0;}
 function hit(dx=0,dz=1){if(dying)return;recoil=.28;recoilSide=Math.sign(dx*Math.cos(group.rotation.y)-dz*Math.sin(group.rotation.y))||1;}
 function defeat(scene,options={}){if(dying||!scene)return;group.updateMatrixWorld(true);bones.forEach((b,i)=>{deathStart[i].p.copy(b.position);deathStart[i].q.copy(b.quaternion);deathStart[i].s.copy(b.scale);});legs.forEach((leg,i)=>leg.end.getWorldPosition(deathFeet[i]));deathAnchor.position.copy(group.position);deathAnchor.quaternion.copy(group.quaternion);scene.add(deathAnchor);deathAnchor.add(model);dying=true;held=options.hold===true;deathTime=0;cast=recoil=0;motion.state='defeat';}
 function footRest(leg){return target.set(leg.side*(leg.row===0?1.70:1.52),.13,leg.row*1.20).applyMatrix4(group.matrixWorld);}
 function solve(c,arm=false){
  c.upper.getWorldPosition(start);direction.subVectors(c.target,start);const distance=clamp(direction.length(),.04,c.a+c.b-.001);direction.normalize();resolved.copy(start).addScaledVector(direction,distance);
  if(arm)pole.set(c.side*1.7,1.7,-.45);else pole.set(c.side*2.6,1.45,c.row*1.1);pole.applyMatrix4(group.matrixWorld);bend.subVectors(pole,start);bend.addScaledVector(direction,-bend.dot(direction)).normalize();const along=(c.a*c.a-c.b*c.b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,c.a*c.a-along*along));mid.copy(start).addScaledVector(direction,along).addScaledVector(bend,height);
  c.upper.parent.getWorldQuaternion(q).invert();local.subVectors(mid,start).normalize().applyQuaternion(q);c.upper.quaternion.setFromUnitVectors(c.axisA,local);c.upper.updateMatrixWorld(true);c.upper.getWorldQuaternion(q).invert();local.subVectors(resolved,mid).normalize().applyQuaternion(q);c.lower.quaternion.setFromUnitVectors(c.axisB,local);c.lower.updateMatrixWorld(true);c.lower.getWorldQuaternion(q).invert();c.end.quaternion.copy(q).multiply(worldQ);
 }
 function pose(warning,strike,hurt,salvo){
  const t=elapsed,breath=Math.sin(t*1.7),gait=Math.sin(phase*Math.PI*2),spell=salvo?Math.max(warning,strike):0,slam=salvo?0:strike;
  model.position.set(0,mother?0:.065*Math.sin(t*1.9),-hurt*.045);model.rotation.set(0,0,0);model.scale.set(1,1,1);
  J.hips.position.set(0,(mother?2.05:1.50)-(mother?locomotion*.07+slam*.34:0),mother?0:Math.sin(t*.8)*.018);J.hips.rotation.set(mother?slam*.08:locomotion*.06,0,mother?gait*locomotion*.012:Math.sin(t*1.2)*.022);
  J.chest.rotation.set(mother?-.09*warning+slam*.15:Math.sin(t*1.6)*.025,Math.sin(t*.7)*.025,hurt*recoilSide*.04);J.neck.rotation.set(-slam*.10,0,0);J.head.rotation.set(-.035+breath*.014+hurt*.06,Math.sin(t*.65)*.035,hurt*recoilSide*.07);
  J.core.rotation.y=mother?Math.sin(t*.8)*.035:t*.35;J.core.scale.setScalar(1+Math.sin(t*2.4)*.025+spell*.13);
  for(const [s,side]of [['l',-1],['r',1]]){
   J['arm_'+s].rotation.set(-.10+gait*locomotion*side*.10-warning*(salvo?.8:2.1)-slam*.20-strike*spell*.35,side*(.10+spell*.18),side*(.10+warning*.12+spell*.20));J['forearm_'+s].rotation.set(-.22-warning*.46+slam*.10-spell*.22,0,0);J['hand_'+s].rotation.set(-warning*.06,side*.20,0);
   J['eye_'+s].scale.y=1-warning*.25+Math.sin(t*2.1)*.025;for(let i=0;i<3;i++){J['finger_'+s+i].rotation.x=-.08+Math.sin(t*1.3+i)*.025-warning*.25+strike*.18;J['tip_'+s+i].rotation.x=-.10-warning*.28;}J['thumb_'+s].rotation.set(-spell*.12,0,-side*.65);
  }
  for(let i=0;i<8;i++){const b=J['crown_'+i];b.rotation.x=(mother?-.12:.08)+Math.sin(t*1.2+i)*.035+spell*.30-slam*.10;b.rotation.z=Math.sin(t*.8+i)*.035;}
  for(let i=0;i<6;i++){J['mantle_'+i].rotation.x=.10+Math.sin(t*1.5+i)*.045+locomotion*.09+spell*.20;J['mantle_'+i].rotation.z=Math.sin(t*1.1+i)*.045;}
  if(mother)for(let i=0;i<6;i++){J['pod_'+i].rotation.set(-.32+spell*.85,0,i/6*Math.PI*2+spell*.10+Math.sin(t*.8)*.02);}
  else for(let i=0;i<3;i++){J['tail_'+i].rotation.x=Math.sin(t*1.4+i)*.16+locomotion*.18;J['tail_'+i].rotation.z=Math.sin(t*1.1+i)*.14;J['tailtip_'+i].rotation.x=Math.sin(t*1.6+i+.4)*.22;}
  materials.glow.emissive.copy(green).lerp(violet,mother?spell:0);materials.glow.emissiveIntensity=.72+Math.sin(t*2.3)*.12+warning*1.6+strike*.85;materials.wood.emissive.setRGB(hurt*.12,hurt*.21,hurt*.17);
 }
 function death(dt){
  deathTime=Math.min(deathTime+dt,held?(mother?1.9:.85):Infinity);const duration=mother?3:1.25,collapse=smooth(deathTime/(mother?1.75:.8));pose(0,0,0,false);motion.state='defeat';motion.defeat=collapse;
  if(mother){J.hips.position.y=2.05-collapse*.72;J.chest.rotation.x=collapse*.32;J.neck.rotation.x=collapse*.24;J.head.rotation.x=collapse*.38;for(let i=0;i<8;i++)J['crown_'+i].rotation.x=-.12-collapse*.65;for(let i=0;i<6;i++)J['pod_'+i].rotation.x=-.32-collapse*.40;}
  else{model.position.y=.06+collapse*.34;J.core.scale.setScalar(1-collapse*.83);J.head.rotation.x=collapse*.28;for(let i=0;i<6;i++)J['mantle_'+i].rotation.x=.10-collapse*.40;}
  group.updateWorldMatrix(true,false);group.getWorldQuaternion(worldQ);model.updateWorldMatrix(true,true);
  if(mother){for(const leg of legs){leg.target.copy(footRest(leg));solve(leg);}for(const arm of arms){arm.target.set(arm.side*1.1,.83,.65).applyMatrix4(group.matrixWorld);solve(arm,true);}}
  const transition=smooth(deathTime/.28);if(transition<1)bones.forEach((b,i)=>{target.copy(b.position);b.position.copy(deathStart[i].p).lerp(target,transition);q.copy(b.quaternion);b.quaternion.copy(deathStart[i].q).slerp(q,transition);target.copy(b.scale);b.scale.copy(deathStart[i].s).lerp(target,transition);});
  if(mother){model.updateMatrixWorld(true);legs.forEach((leg,i)=>{target.copy(footRest(leg));leg.target.copy(deathFeet[i]).lerp(target,transition);});let drop=0;for(const leg of legs){leg.upper.getWorldPosition(start);const horizontal=Math.hypot(start.x-leg.target.x,start.z-leg.target.z),reach=leg.a+leg.b-.004;drop=Math.max(drop,start.y-leg.target.y-Math.sqrt(Math.max(.01,reach*reach-horizontal*horizontal)));}J.hips.position.y-=clamp(drop,0,.6);J.hips.updateMatrixWorld(true);for(const leg of legs)solve(leg);}
  materials.glow.emissiveIntensity=Math.max(0,1-deathTime/(mother?1.8:.9))*.9;const fadeStart=mother?2:.45;
  if(!held&&deathTime>fadeStart){if(!fading){for(const m of Object.values(materials)){m.transparent=true;m.depthWrite=false;m.needsUpdate=true;}fading=true;}for(const m of Object.values(materials))m.opacity=clamp(1-(deathTime-fadeStart)/(duration-fadeStart));}
  if(!held&&deathTime>=duration){model.visible=false;group.add(model);deathAnchor.removeFromParent();dying=false;}
 }
 function update(dt,e={}){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.05);elapsed+=dt;if(dying){death(dt);return;}if(!group.visible){if(initialized||cast||recoil)reset();return;}
  group.updateWorldMatrix(true,false);group.getWorldPosition(position);group.getWorldQuaternion(worldQ);velocity.subVectors(position,previous);const teleport=!initialized||velocity.length()>2;
  if(teleport){velocity.set(0,0,0);initialized=true;for(const leg of legs){leg.target.copy(footRest(leg));leg.anchor.copy(leg.target);leg.stance=null;}}else velocity.divideScalar(Math.max(.001,dt));previous.copy(position);cast=Math.max(0,cast-dt);recoil=Math.max(0,recoil-dt);
  const speed=Math.hypot(velocity.x,velocity.z),preparing=mother?e.windup>0:e.pendingAttack==='orb'&&e.telegraph>0,salvo=mother?(preparing?e.pattern===1:motion.spell>0):true,warning=preparing?smooth(1-(mother?e.windup/(salvo?.95:1.25):e.telegraph/.25)):0,strike=cast>0?1-smooth((1-cast/(mother?.72:.32))/.94):0,hurt=recoil>0?Math.sin((1-recoil/.28)*Math.PI):0,active=speed>.035&&!preparing&&cast===0;
  locomotion=mix(locomotion,active?1:0,1-Math.exp(-dt*8));const frequency=Math.min(1.8,speed/1.85);if(active&&!wasMoving){phase=.27;for(const leg of legs)leg.stance=null;}if(active)phase=(phase+frequency*dt)%1;wasMoving=active;pose(warning,strike,hurt,salvo);group.updateMatrixWorld(true);
  if(mother){
   for(const [i,leg]of legs.entries()){
    const p=(phase+((leg.row+(leg.side>0?1:0)+3)%2)*.5)%1,stance=p<.58;
    if(!active&&locomotion<.3){leg.target.lerp(footRest(leg),1-Math.exp(-dt*12));leg.target.y=position.y+.13;leg.stance=null;leg.contact=true;}
    else if(stance){if(leg.stance!==true)leg.anchor.copy(leg.stance===false?leg.landing:leg.target);leg.target.copy(leg.anchor);leg.target.y=position.y+.13;leg.stance=true;leg.contact=true;}
    else{const raw=(p-.58)/.42;if(leg.stance!==false){leg.takeoff.copy(leg.target);leg.start=raw;leg.stance=false;}const t=clamp((raw-leg.start)/Math.max(.01,1-leg.start)),remaining=(1-p)/Math.max(.1,frequency);leg.landing.copy(footRest(leg)).addScaledVector(velocity,.44/Math.max(.1,speed)+remaining);leg.target.lerpVectors(leg.takeoff,leg.landing,smooth(t));leg.target.y=position.y+.13+Math.sin(t*Math.PI)*.19;leg.contact=false;}motion.contacts[i]=leg.contact;
   }
   let drop=0;for(const leg of legs)if(leg.contact){leg.upper.getWorldPosition(start);const horizontal=Math.hypot(start.x-leg.target.x,start.z-leg.target.z),reach=leg.a+leg.b-.004;drop=Math.max(drop,start.y-leg.target.y-Math.sqrt(Math.max(.01,reach*reach-horizontal*horizontal)));}J.hips.position.y-=clamp(drop,0,.6);J.hips.updateMatrixWorld(true);for(const leg of legs)solve(leg);
   if(strike>0&&!salvo)for(const arm of arms){const chain=[arm.upper,arm.lower,arm.end];chain.forEach((b,i)=>arm.saved[i].copy(b.quaternion));arm.target.set(arm.side*1.12,.83,.65).applyMatrix4(group.matrixWorld);solve(arm,true);chain.forEach((b,i)=>{q.copy(b.quaternion);b.quaternion.copy(arm.saved[i]).slerp(q,strike);});}
  }
  motion.speed=speed;motion.locomotion=locomotion;motion.warning=preparing?.15+warning*.85:0;motion.strike=strike;motion.recoil=hurt;motion.state=preparing?(salvo?'cast-windup':'slam-windup'):strike>0?(salvo?'cast':'impact'):hurt>.05?'hurt':locomotion>.15?'move':'idle';if(cast===0)motion.spell=0;
 }
 update(0);return {...r,skeleton:skin,materials,meshes,motion,texture:data.texture,triangles:data.triangles,update,reset,attack,hit,defeat,get dying(){return dying;}};
}
root.EmberGroveCreatures={createSpirit:T=>create(T,false),createRootMother:T=>create(T,true)};
})(typeof window==='undefined'?globalThis:window);
