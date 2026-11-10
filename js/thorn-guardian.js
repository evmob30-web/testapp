/* Original Doornwachter: sculpted, weighted heartwood, bark, roots and foliage.
 * All geometry and the painted grain are deterministic, cached and self-contained.
 * +Z faces forward. Animation never changes the gameplay root transform. */
(function(root){
'use strict';
const cache=new WeakMap(),clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);},mix=(a,b,t)=>a+(b-a)*t;
function skeleton(T){
 const group=new T.Group();group.name='Doornwachter';group.userData.actor='thorn-guardian';
 const model=new T.Group();model.name='ThornGuardianModel';group.add(model);const joints={};
 function bone(name,parent,x=0,y=0,z=0){const b=new T.Bone();b.name='thorn_'+name;b.position.set(x,y,z);parent.add(b);joints[name]=b;return b;}
 const base=bone('root',model),hips=bone('hips',base,0,2.25,0),spine=bone('spine',hips,0,.75,0),chest=bone('chest',spine,0,.85,-.03),neck=bone('neck',chest,0,.70,0),head=bone('head',neck,0,.18,.02);
 bone('jaw',head,0,-.23,.03);bone('core',chest,0,-.03,.68);
 for(const side of [-1,1]){
  const s=side<0?'l':'r',upper=bone('arm_'+s,chest,side*1.08,.21,0);upper.rotation.z=side*.10;
  const lower=bone('forearm_'+s,upper,0,-1.22,0),hand=bone('hand_'+s,lower,0,-1.18,0);
  for(let i=0;i<4;i++){const finger=bone('finger_'+s+i,hand,(i-1.5)*.17,-.39,.015);bone('tip_'+s+i,finger,0,-.30,.085);}
  const thumb=bone('thumb_'+s,hand,-side*.32,-.15,.075);thumb.rotation.z=-side*.65;bone('thumbtip_'+s,thumb,0,-.27,.09);
  const thigh=bone('thigh_'+s,hips,side*.56,-.15,0),shin=bone('shin_'+s,thigh,0,-.98,0);bone('foot_'+s,shin,0,-.94,.05);
  bone('eye_'+s,head,side*.24,.12,.37);bone('crown_'+s,head,side*.29,.40,-.06);
 }
 group.updateMatrixWorld(true);return {group,model,joints};
}
function grain(T){
 const size=512,data=new Uint8Array(size*size*4);let seed=173;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  let warp=.018*Math.sin(v*Math.PI*2)+.009*Math.sin(v*Math.PI*6+u*5)+.008*Math.sin(u*21+Math.sin(v*6.28));
  for(const [kx,ky]of [[.22,.27],[.72,.67]]){const dx=u-kx,dy=(v-ky)*.6,r=Math.sqrt(dx*dx+dy*dy);warp+=Math.sin(Math.atan2(dy,dx)*2)*.025*Math.exp(-r*r/.009);}
  const phase=((u+warp)*13)%1,groove=Math.exp(-(((phase-.50)/.105)**2)),rim=Math.exp(-(((phase-.65)/.06)**2)),broken=.40+.60*(.5+.5*Math.sin(v*19+Math.floor((u+warp)*13)*2.7));
  const fibers=Math.pow(Math.max(0,Math.sin((u+warp*.5)*450+Math.sin(v*37)*.8)),12);
  const value=clamp(184+Math.sin(u*24+Math.sin(v*6.28)*.5)*17-groove*37*broken+rim*15-fibers*8+(seed%19-9),50,241),p=(y*size+x)*4;
  data[p]=value;data[p+1]=value*.96;data[p+2]=value*.88;data[p+3]=255;
 }
 const texture=new T.DataTexture(data,size,size);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;return texture;
}
function art(T,joints){
 if(cache.has(T))return cache.get(T);
 const bones=Object.values(joints),indices=new Map(bones.map((b,i)=>[b,i])),parts=new Map(),colors={wood:'#806249',bark:'#594b37',cut:'#9e8159',moss:'#60784c',dark:'#261f1d',ember:'#f39c3d'};
 function add(g,kind,bone,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0],weights,color){
  bone=typeof bone==='string'?joints[bone]:bone;
  const original=g.attributes.position.clone(),matrix=new T.Matrix4().multiplyMatrices(bone.matrixWorld,new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale)));
  g.applyMatrix4(matrix);if(!g.attributes.normal)g.computeVertexNormals();if(!parts.has(kind))parts.set(kind,{p:[],n:[],uv:[],c:[],ix:[],bi:[],bw:[]});
  const b=parts.get(kind),offset=b.p.length/3,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,tint=new T.Color(color||colors[kind]),lichen=new T.Color('#536747');
  for(let i=0;i<p.count;i++){
   b.p.push(p.getX(i),p.getY(i),p.getZ(i));b.n.push(n.getX(i),n.getY(i),n.getZ(i));b.uv.push(uv?uv.getX(i):original.getX(i),uv?uv.getY(i):original.getY(i));
   const light=.91+n.getY(i)*.07+n.getZ(i)*.025+Math.sin(p.getX(i)*8+p.getY(i)*5)*.025,patch=['wood','bark'].includes(kind)&&p.getY(i)>2.3?clamp((Math.sin(p.getX(i)*4+p.getY(i)*2.7)+Math.cos(p.getZ(i)*5-p.getY(i)*1.3)-.65)*.44)*(p.getZ(i)<-.12?.75:.35):0;b.c.push(mix(tint.r,lichen.r,patch)*light,mix(tint.g,lichen.g,patch)*light,mix(tint.b,lichen.b,patch)*light);
   const w=weights?weights(original.getY(i),original.getX(i),original.getZ(i)):[[bone,1]];
   for(let j=0;j<4;j++){const pair=w[j];b.bi.push(pair?indices.get(typeof pair[0]==='string'?joints[pair[0]]:pair[0]):0);b.bw.push(pair?pair[1]:0);}
  }
  for(let i=0;i<(g.index?g.index.count:p.count);i++)b.ix.push(offset+(g.index?g.index.getX(i):i));g.dispose();
 }
 function capEnds(p,uv,ix,rows,segments){
  for(const row of [0,rows-1]){
   const start=row*(segments+1),center=p.length/3,c=[0,0,0];for(let i=0;i<segments;i++)for(let k=0;k<3;k++)c[k]+=p[(start+i)*3+k]/segments;p.push(...c);uv.push(.5,.5);
   const rim=p.length/3;for(let i=0;i<=segments;i++){p.push(p[(start+i)*3],p[(start+i)*3+1],p[(start+i)*3+2]);uv.push(.5+.5*Math.cos(i/segments*Math.PI*2),.5+.5*Math.sin(i/segments*Math.PI*2));}
   for(let i=0;i<segments;i++)if(row===0)ix.push(center,rim+i+1,rim+i);else ix.push(center,rim+i,rim+i+1);
  }
 }
 function loft(rows,segments=36,sculpt,hole){
  const p=[],uv=[],ix=[];
  rows.forEach(([y,rx,rz,z=0,x=0],r)=>{for(let i=0;i<=segments;i++){
   const a=i/segments*Math.PI*2,ridge=1+.025*Math.sin(a*7+y*2)+.016*Math.sin(a*13-y*3),v=[Math.cos(a)*rx*ridge+x,y,Math.sin(a)*rz*ridge+z];if(sculpt)sculpt(v,a,r);p.push(...v);uv.push(i/segments*2,(y-rows[rows.length-1][0])*.55);
  }});
  for(let r=0;r<rows.length-1;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;if(hole&&hole((p[a*3]+p[(b+1)*3])*.5,(p[a*3+1]+p[(b+1)*3+1])*.5,(p[a*3+2]+p[(b+1)*3+2])*.5))continue;ix.push(a,a+1,b,b,a+1,b+1);}
  capEnds(p,uv,ix,rows.length,segments);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
  const n=g.attributes.normal;for(let r=0;r<rows.length;r++){const a=r*(segments+1),b=a+segments,v=new T.Vector3(n.getX(a)+n.getX(b),n.getY(a)+n.getY(b),n.getZ(a)+n.getZ(b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}return g;
 }
 function branch(points,radii,kind,bone,{segments=18,sides=10,flat=.82,color,weights}={}){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),frames=curve.computeFrenetFrames(segments,false),p=[],uv=[],ix=[];
  for(let r=0;r<=segments;r++){
   const t=r/segments,u=t*(radii.length-1),i=Math.min(radii.length-2,Math.floor(u)),radius=mix(radii[i],radii[i+1],u-i),center=curve.getPoint(t);
   for(let s=0;s<=sides;s++){
    const a=s/sides*Math.PI*2,grain=1+.09*Math.sin(a*5+t*3),v=center.clone().addScaledVector(frames.normals[r],Math.cos(a)*radius*grain).addScaledVector(frames.binormals[r],Math.sin(a)*radius*flat*grain);p.push(v.x,v.y,v.z);uv.push(s/sides,t*curve.getLength()*.7);
   }
  }
  for(let r=0;r<segments;r++)for(let s=0;s<sides;s++){const a=r*(sides+1)+s,b=a+sides+1;ix.push(a,a+1,b,b,a+1,b+1);}
  capEnds(p,uv,ix,segments+1,sides);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();
  add(g,kind,bone,[0,0,0],[1,1,1],[0,0,0],weights,color);
 }
 const oval=(kind,bone,pos,size,color)=>add(new T.SphereGeometry(1,20,12),kind,bone,pos,size,[0,0,0],null,color);
 const blend=(a,b,t)=>[[a,1-clamp(t)],[b,clamp(t)]],torso=y=>y<.80?blend('hips','spine',(y-.12)/.65):blend('spine','chest',(y-.80)/.65);
 // A continuous tapered trunk, with root buttresses and overlapping bark ridges.
 add(loft([[1.95,.34,.28],[1.72,.80,.49],[1.47,1.04,.59],[1.20,.99,.62],[.92,.81,.55],[.62,.68,.48],[.30,.59,.44],[.04,.66,.43],[-.22,.59,.38],[-.33,.30,.26]],48,null,(x,y,z)=>z>0&&Math.abs(x)<.34&&y>1.20&&y<1.92),'wood','hips',[0,0,0],[1,1,1],[0,0,0],torso);
 for(let i=0;i<13;i++){
  const a=i/13*Math.PI*2,x=Math.cos(a),z=Math.sin(a),front=z>0;
  if(front&&Math.abs(x)<.52)continue;
  branch([[x*.57,-.18,z*.37],[x*.61,.42,z*.47],[x*.83,1.04,z*.59],[x*.84,1.55,z*.49],[x*.51,1.81,z*.38]],[.07,.12,.10,.015],'bark','hips',{weights:torso,segments:25,flat:.50});
 }
 for(const side of [-1,1]){
  branch([[side*.45,-.24,.22],[side*.63,.52,.40],[side*.88,1.08,.40],[side*.73,1.62,.34]],[.13,.17,.14,.015],'bark','hips',{weights:torso,segments:30,flat:.65});
  branch([[side*.34,-.08,-.34],[side*.49,.59,-.52],[side*.25,1.22,-.62],[0,1.75,-.43]],[.10,.16,.14,.01],'wood','hips',{weights:torso,segments:30,flat:.65,color:'#7d684d'});
  branch([[side*.43,.10,.22],[side*.57,-.31,.32],[side*.65,-.73,.32],[side*.63,-1.03,.20]],[.17,.19,.12,.012],'bark','hips',{weights:y=>blend('hips','thigh_'+(side<0?'l':'r'),(-y+.08)/.64),segments:26});
 }
 add(loft([[.37,.07,.10],[.27,.25,.25],[.04,.34,.31],[-.24,.40,.34],[-.46,.48,.35],[-.55,.35,.29]],32),'wood','neck');
 // A recessed seed of emberlight is held behind curved root ribs.
 oval('dark','chest',[0,-.03,.45],[.39,.44,.14]);
 add(loft([[.36,.006,.012],[.24,.15,.105],[0,.205,.13],[-.26,.13,.10],[-.40,.003,.006]],28),'ember','core',[0,0,.015],[.82,.82,.82]);
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const y=.30-i*.22;
  branch([[side*(.64-i*.025),y+.12,.41],[side*.43,y,.65],[side*.27,y-.12,.76],[side*(.10+i*.025),y-.17,.74]],[.12,.11,.06,.012],'wood','chest',{segments:22,flat:.72,color:i%2?'#886647':'#76583e'});
  if(i<3)branch([[side*.46,y-.04,.665],[side*.34,y-.12,.76],[side*.28,y-.16,.775]],[.018,.012,.002],'ember','chest',{segments:12,sides:6});
 }
 // Sculpted mask: deep eye sockets, hard brows, a raised grain ridge and hooked jaw.
 const gauss=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2)-((y-cy)/sy)**2);
 add(loft([[.63,.10,.08],[.55,.37,.26],[.43,.54,.35],[.28,.57,.39],[.12,.52,.39],[-.04,.45,.37],[-.20,.34,.30],[-.34,.18,.17],[-.38,.025,.035]],48,(p,a)=>{
  if(Math.sin(a)<0)return;const [x,y]=p;p[2]+=.12*gauss(x,y,0,.12,.11,.25)-.095*(gauss(x,y,.24,.12,.14,.12)+gauss(x,y,-.24,.12,.14,.12))+.075*(gauss(x,y,.27,.29,.22,.11)+gauss(x,y,-.27,.29,.22,.11));
 }),'wood','head');
 branch([[0,.49,.35],[-.035,.19,.49],[.025,-.10,.43]],[.055,.075,.015],'cut','head',{segments:22,flat:.45,color:'#9a7850'});
 branch([[-.20,-.18,.305],[0,-.20,.33],[.20,-.18,.305]],[.008,.019,.008],'dark','head',{segments:18,sides:8,flat:.40});
 add(loft([[.12,.23,.19,.10],[.04,.31,.23,.08],[-.10,.25,.21,.10],[-.22,.08,.065,.12]],28),'bark','jaw');
 for(const side of [-1,1]){
  const s=side<0?'l':'r';
  oval('dark','head',[side*.24,.12,.325],[.17,.10,.045]);
  const ep=[0,0,.022],euv=[.5,.5],ei=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;ep.push(Math.cos(a)*.122,Math.sin(a)*.028,0);euv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);if(i<24)ei.push(0,i+1,i+2);}const eye=new T.BufferGeometry();eye.setAttribute('position',new T.Float32BufferAttribute(ep,3));eye.setAttribute('uv',new T.Float32BufferAttribute(euv,2));eye.setIndex(ei);eye.computeVertexNormals();add(eye,'ember','eye_'+s,[0,0,.005],[1,1,1],[0,0,side*.18]);
  add(new T.SphereGeometry(1,16,10),'dark','eye_'+s,[0,0,.030],[.009,.024,.006]);
  branch([[side*.055,.16,.44],[side*.25,.26,.43],[side*.49,.29,.32]],[.045,.102,.012],'bark','head',{segments:24,flat:.55});
  branch([[side*.44,.20,.28],[side*.49,-.015,.33],[side*.26,-.23,.33]],[.065,.085,.018],'cut','head',{segments:20,flat:.50,color:'#8e7351'});
  branch([[side*.13,.085,.26],[side*.11,.16,.30],[side*.10,.19,.31]],[.035,.025,.002],'cut','jaw',{segments:10,sides:8});
  branch([[side*.20,-.11,.19],[side*.16,-.30,.20],[side*.25,-.43,.10]],[.09,.05,.003],'bark','jaw',{segments:16});
  branch([[side*.02,.02,0],[side*.23,.38,-.07],[side*.38,.76,-.03],[side*(s==='l'?.70:.54),1.13,-.13],[side*(s==='l'?.78:.64),1.47,-.21]],[.17,.16,.11,.06,.002],'bark','crown_'+s,{segments:34,sides:12});
  branch([[side*.24,.43,-.045],[side*.57,.64,-.08],[side*.92,.87,-.15],[side*1.02,1.04,-.10]],[.11,.09,.045,.002],'wood','crown_'+s,{segments:25});
  branch([[side*.37,.75,-.04],[side*.24,1.02,.06],[side*.34,1.25,.12]],[.07,.045,.001],'cut','crown_'+s,{segments:19,color:'#9d7b50'});
 }
 // Hands have separate weighted root fingers and hooked tips rather than solid clubs.
 for(const side of [-1,1]){
  const s=side<0?'l':'r',upper='arm_'+s,lower='forearm_'+s,hand='hand_'+s,a=side>0?1.08:1;
  for(const z of [-.16,.14])branch([[side*.44,.28,z],[side*.92,.34,z],[side*1.18,.14,z+.02],[side*1.24,-.30,z+.06]],[.24,.37,.34,.10],'wood','chest',{weights:(y,x)=>blend('chest',upper,(Math.abs(x)-.46)/.67),segments:25,color:'#7d6347'});
  add(loft([[.16,.12,.15],[.08,.38*a,.35],[-.12,.50*a,.42],[-.40,.43*a,.37],[-.76,.33,.31],[-1.09,.28,.28],[-1.30,.23,.24]],36),'wood',upper,[0,0,0],[1,1,1],[0,0,0],y=>blend(upper,lower,(-y-.95)/.35));
  add(loft([[.15,.19,.21],[.02,.30,.30],[-.24,.42*a,.36],[-.55,.38*a,.34],[-.86,.29,.28],[-1.08,.23,.23],[-1.24,.18,.18]],36),'wood',lower,[0,0,0],[1,1,1],[0,0,0],y=>blend(lower,hand,(-y-1.02)/.22));
  for(let i=0;i<5;i++){
   const angle=i/5*Math.PI*2,x=Math.cos(angle),z=Math.sin(angle);
   branch([[x*.31,.02,z*.30],[x*.43,-.36,z*.38],[x*.29,-.88,z*.28],[x*.20,-1.15,z*.21]],[.04,.095,.08,.009],'bark',lower,{segments:21,flat:.5});
  }
  for(let i=0;i<3;i++)branch([[side*.30,-.25-i*.29,-.06],[side*(.62-i*.06),-.07-i*.30,-.13],[side*(.81-i*.08),.20-i*.32,-.15]],[.12-i*.015,.07,.002],'bark',lower,{segments:17});
  add(loft([[.08,.18,.18],[-.08,.34,.24],[-.28,.37,.23],[-.43,.30,.19],[-.47,.16,.10]],28),'wood',hand);
  for(let i=0;i<4;i++){
   branch([[0,.045,0],[.008,-.16,.035],[0,-.32,.09]],[.10,.091,.073],'wood','finger_'+s+i,{segments:16});
   branch([[0,.035,0],[0,-.105,.055],[.005,-.22,.15],[.008,-.245,.19]],[.075,.061,.034,.001],'cut','tip_'+s+i,{segments:19,color:'#8e7754'});
  }
  branch([[0,.04,0],[0,-.12,.04],[0,-.28,.09]],[.12,.10,.075],'wood','thumb_'+s,{segments:16});
  branch([[0,.03,0],[0,-.12,.07],[0,-.19,.18]],[.075,.055,.001],'cut','thumbtip_'+s,{segments:16});
  branch([[side*.61,.28,-.08],[side*1.10,.58,-.18],[side*1.49,.97,-.29]],[.23,.15,.002],'bark','chest',{segments:26,sides:12});
  branch([[side*.87,.20,-.34],[side*1.44,.47,-.50],[side*1.82,.79,-.49]],[.19,.10,.002],'wood','chest',{segments:24});
  const thigh='thigh_'+s,shin='shin_'+s,foot='foot_'+s;
  add(loft([[.18,.16,.21],[.04,.37,.34],[-.30,.39,.36],[-.65,.31,.30],[-.91,.25,.25],[-1.10,.20,.21]],32),'wood',thigh,[0,0,0],[1,1,1],[0,0,0],y=>blend(thigh,shin,(-y-.84)/.25));
  add(loft([[.15,.17,.18],[0,.28,.27],[-.23,.33,.28],[-.55,.28,.26],[-.80,.23,.24],[-.99,.19,.20]],32),'wood',shin,[0,0,0],[1,1,1],[0,0,0],y=>blend(shin,foot,(-y-.80)/.20));
  for(let i=0;i<5;i++){
   const a=i/5*Math.PI*2,x=Math.cos(a),z=Math.sin(a);
   branch([[x*.23,.03,z*.26],[x*.32,-.30,z*.30],[x*.22,-.81,z*.26],[x*.17,-1.00,z*.19]],[.045,.075,.065,.008],'bark',shin,{segments:20,flat:.55});
  }
  add(loft([[.27,.12,.16],[.14,.27,.34,.07],[.02,.43,.51,.17],[-.12,.42,.53,.17],[-.17,.34,.43,.17]],32),'bark',foot);
  for(let i=0;i<4;i++){
   const x=(i-1.5)*.21;branch([[x*.5,.10,-.04],[x,.015,.33],[x*1.5,-.10,.72],[x*1.8,-.13,.90+(i%2)*.12]],[.13,.13,.08,.004],'wood',foot,{segments:23,flat:.64});
  }
  branch([[side*.05,.10,-.05],[side*.19,-.04,-.33],[side*.39,-.14,-.60]],[.15,.10,.002],'wood',foot,{segments:18});
 }
 // Hanging lichens and small leaves break the silhouette without extra draw calls.
 function leaf(bone,p,size,angle){
  const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-size*.48,size*.34,-size*.32,size*.78,0,size);shape.bezierCurveTo(size*.34,size*.75,size*.39,size*.30,0,0);
  const g=new T.ShapeGeometry(shape,5),v=g.attributes.position;for(let i=0;i<v.count;i++)v.setZ(i,Math.sin(v.getY(i)/size*Math.PI)*size*.17+v.getX(i)*v.getX(i)/size*.3);g.computeVertexNormals();add(g,'moss',bone,p,[1,1,1],angle,null,'#6f8450');
 }
 for(const side of [-1,1]){
  const s=side<0?'l':'r';
  for(let i=0;i<9;i++){
   const x=side*(.54+(i%3)*.22),y=.37+Math.floor(i/3)*.07,z=-.06+(i%3)*.14;
   branch([[x,y,z],[x+side*.06,y+.08,z+.03],[x+side*.10,y+.13,z+.07]],[.045,.035,.001],'moss','chest',{segments:9,sides:6,flat:.7,color:i%2?'#687e4c':'#7b8f59'});
   if(i%2===0)leaf('chest',[x,y+.06,z+.04],.15,[.3,side*.3,-side*.8]);
  }
  for(let i=0;i<4;i++)leaf('crown_'+s,[side*.48,.70+i*.03,-.09],.17+i*.025,[.2,side*.8,side*(.8+i*.4)]);
  for(let i=0;i<3;i++)branch([[side*(.74+i*.11),.35,-.24],[side*(.81+i*.11),-.03-i*.09,-.30],[side*(.84+i*.12),-.25-i*.13,-.25]],[.027,.018,.001],'moss','chest',{segments:17,sides:6,color:'#788968'});
 }
 const texture=grain(T),materials={};
 for(const kind of Object.keys(colors))materials[kind]=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:kind==='ember'?.46:.93,metalness:0,side:kind==='moss'?T.DoubleSide:T.FrontSide,...['wood','bark','cut'].includes(kind)?{map:texture,bumpMap:texture,bumpScale:kind==='bark'?.045:.025}:{},...kind==='ember'?{emissive:'#e3832e',emissiveIntensity:.60}:{}});
 const geometry=new Map();let triangles=0;
 for(const [kind,b]of parts){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(b.bi,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(b.bw,4));g.setIndex(b.ix);g.computeBoundingSphere();geometry.set(kind,g);triangles+=b.ix.length/3;
 }
 const chip=new T.BufferGeometry();chip.setAttribute('position',new T.Float32BufferAttribute([-.065,-.12,0,.055,-.09,0,.045,.09,0,-.025,.15,0,0,0,.04],3));chip.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1,.5,.5],2));chip.setIndex([0,1,4,1,2,4,2,3,4,3,0,4,3,2,1,3,1,0]);chip.computeVertexNormals();
 const chipMaterial=new T.MeshStandardMaterial({color:'#9b754b',roughness:.95,map:texture});
 const result={geometry,materials,texture,chip,chipMaterial,triangles};cache.set(T,result);return result;
}
function create(T){
 const rig=skeleton(T),{group,model,joints:J}=rig,kit=art(T,J),bones=Object.values(J),skin=new T.Skeleton(bones),materials={},meshes=[];
 for(const [kind,g]of kit.geometry){const m=kit.materials[kind].clone();materials[kind]=m;const mesh=new T.SkinnedMesh(g,m);mesh.name='thorn_'+kind;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.bind(skin,new T.Matrix4());model.add(mesh);meshes.push(mesh);}
 const legs=['l','r'].map((s,i)=>({side:i===0?-1:1,upper:J['thigh_'+s],lower:J['shin_'+s],foot:J['foot_'+s],a:.98,b:.94,phase:0,stance:null,target:new T.Vector3(),anchor:new T.Vector3(),takeoff:new T.Vector3(),landing:new T.Vector3(),offset:0,contact:true}));
 const arms=['l','r'].map((s,i)=>({side:i===0?-1:1,upper:J['arm_'+s],lower:J['forearm_'+s],foot:J['hand_'+s],a:1.22,b:1.18,target:new T.Vector3(),saved:[new T.Quaternion(),new T.Quaternion(),new T.Quaternion()]}));
 for(const chain of [...legs,...arms]){chain.a=chain.lower.position.length();chain.b=chain.foot.position.length();chain.axisA=chain.lower.position.clone().normalize();chain.axisB=chain.foot.position.clone().normalize();}
 const previous=new T.Vector3(),position=new T.Vector3(),velocity=new T.Vector3(),target=new T.Vector3(),pole=new T.Vector3(),origin=new T.Vector3(),direction=new T.Vector3(),bend=new T.Vector3(),mid=new T.Vector3(),resolved=new T.Vector3(),local=new T.Vector3(),q=new T.Quaternion(),worldQ=new T.Quaternion();
 const deathAnchor=new T.Group();deathAnchor.name='DoornwachterDefeat';
 const deathStart=bones.map(()=>({p:new T.Vector3(),q:new T.Quaternion(),s:new T.Vector3()})),deathFeet=legs.map(()=>new T.Vector3());
 let initialized=false,elapsed=0,phase=.25,locomotion=0,strike=0,recoil=0,recoilSide=1,dying=false,deathTime=0,wasMoving=false,fading=false;
 const motion={speed:0,locomotion:0,warning:0,strike:0,recoil:0,defeat:0,contacts:[true,true],state:'idle'};
 function reset(){
  if(model.parent!==group){group.add(model);deathAnchor.removeFromParent();}dying=false;deathTime=0;initialized=false;locomotion=strike=recoil=0;elapsed=0;phase=.25;wasMoving=false;
  model.position.set(0,0,0);model.rotation.set(0,0,0);model.visible=true;
  for(const m of Object.values(materials)){m.opacity=1;if(fading){m.transparent=false;m.depthWrite=true;m.needsUpdate=true;}}fading=false;
  for(const leg of legs)leg.stance=null;motion.defeat=motion.warning=motion.strike=motion.recoil=motion.locomotion=motion.speed=0;motion.state='idle';
 }
 function attack(){strike=.68;}
 function hit(dx=0,dz=1){if(dying)return;recoil=.28;recoilSide=Math.sign(dx*Math.cos(group.rotation.y)-dz*Math.sin(group.rotation.y))||1;}
 function defeat(scene){
  if(dying||!scene)return;group.updateMatrixWorld(true);bones.forEach((b,i)=>{deathStart[i].p.copy(b.position);deathStart[i].q.copy(b.quaternion);deathStart[i].s.copy(b.scale);});legs.forEach((leg,i)=>leg.foot.getWorldPosition(deathFeet[i]));
  deathAnchor.position.copy(group.position);deathAnchor.quaternion.copy(group.quaternion);deathAnchor.scale.copy(group.scale);scene.add(deathAnchor);deathAnchor.add(model);dying=true;deathTime=0;strike=recoil=0;motion.state='defeat';
 }
 function rest(leg){return target.set(leg.side*.62,.18,.05).applyMatrix4(group.matrixWorld);}
 function solve(leg,arm=false){
  leg.upper.getWorldPosition(origin);direction.subVectors(leg.target,origin);const distance=clamp(direction.length(),.04,leg.a+leg.b-.0005);direction.normalize();resolved.copy(origin).addScaledVector(direction,distance);
  if(arm)pole.set(leg.side*1.85,1.8,-.45);else pole.set(leg.side*.63,1.2,1.2);pole.applyMatrix4(group.matrixWorld);bend.subVectors(pole,origin);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const along=(leg.a*leg.a-leg.b*leg.b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,leg.a*leg.a-along*along));mid.copy(origin).addScaledVector(direction,along).addScaledVector(bend,height);
  leg.upper.parent.getWorldQuaternion(q).invert();local.subVectors(mid,origin).normalize().applyQuaternion(q);leg.upper.quaternion.setFromUnitVectors(leg.axisA,local);leg.upper.updateMatrixWorld(true);
  leg.upper.getWorldQuaternion(q).invert();local.subVectors(resolved,mid).normalize().applyQuaternion(q);leg.lower.quaternion.setFromUnitVectors(leg.axisB,local);leg.lower.updateMatrixWorld(true);leg.lower.getWorldQuaternion(q).invert();leg.foot.quaternion.copy(q).multiply(worldQ);
 }
 function pose(warning,impact,hurt){
  const breath=Math.sin(elapsed*1.5),gait=Math.sin(phase*Math.PI*2),settle=impact*.62;
  model.position.set(0,0,-hurt*.045);J.root.rotation.set(0,0,0);
  J.hips.position.set(0,2.25-.035-locomotion*.09-warning*.15-settle+Math.cos(phase*Math.PI*4)*locomotion*.015,locomotion*.035);
  J.hips.rotation.set(.035*locomotion,locomotion*gait*.023,locomotion*gait*.012);
  J.spine.rotation.set(.02+breath*.007-warning*.08+impact*.19,0,hurt*.025*recoilSide);J.chest.rotation.set(-warning*.11+impact*.21,locomotion*gait*-.025,hurt*.025*recoilSide);
  J.chest.scale.set(1+breath*.004,1,1+breath*.006);J.neck.rotation.x=warning*.08-impact*.11;J.head.rotation.set(-.045+breath*.012+warning*.09-impact*.14,Math.sin(elapsed*.47)*.035*(1-locomotion),hurt*.07*recoilSide);J.jaw.rotation.x=.025+warning*.12+impact*.15+hurt*.05;
  J.core.scale.setScalar(1+Math.sin(elapsed*2.4)*.025+warning*.09);
  for(const [s,side]of [['l',-1],['r',1]]){
   const sway=gait*locomotion*.16*side;
   J['arm_'+s].rotation.set(-.08+sway-warning*2.13-impact*.27,side*warning*.12,side*(.10+warning*.15+impact*.14));
   J['forearm_'+s].rotation.set(-.22-warning*.53+impact*.10,side*.10,0);J['hand_'+s].rotation.set(-warning*.08+impact*.15,side*.20,side*.025);
   J['eye_'+s].scale.y=1-warning*.25+Math.sin(elapsed*3)*.035;J['crown_'+s].rotation.set(breath*.007+impact*.05,0,Math.sin(elapsed*1.3+side)*.012+hurt*.035*recoilSide);
   for(let i=0;i<4;i++){J['finger_'+s+i].rotation.x=-.06+Math.sin(elapsed*1.1+i)*.025-warning*.28+impact*.22;J['tip_'+s+i].rotation.x=-.10-warning*.40+impact*.14;}
   J['thumb_'+s].rotation.set(-warning*.22,0,-side*.65);J['thumbtip_'+s].rotation.x=-.08-warning*.32;
  }
  materials.ember.emissiveIntensity=.60+Math.sin(elapsed*2.4)*.08+warning*.95+impact*.55;
  materials.wood.emissive.setRGB(hurt*.28,hurt*.11,hurt*.025);materials.bark.emissive.copy(materials.wood.emissive);
 }
 function updateDeath(dt){
  deathTime+=dt;const collapse=smooth(deathTime/1.5);pose(0,0,0);motion.state='defeat';motion.defeat=collapse;
  J.hips.position.y=2.215-collapse*1.13;J.hips.rotation.x=collapse*.12;J.spine.rotation.x=.02+collapse*.38;J.chest.rotation.x=collapse*.30;J.head.rotation.x=collapse*.32;J.jaw.rotation.x=.04+collapse*.12;
  group.updateWorldMatrix(true,false);group.getWorldQuaternion(worldQ);model.updateMatrixWorld(true);
  for(const leg of legs){leg.target.copy(rest(leg));solve(leg);}
  for(const arm of arms){arm.target.set(arm.side*1.35,1.06,.65).applyMatrix4(group.matrixWorld);solve(arm,true);}
  const transition=smooth(deathTime/.32);
  if(transition<1)bones.forEach((b,i)=>{target.copy(b.position);b.position.copy(deathStart[i].p).lerp(target,transition);q.copy(b.quaternion);b.quaternion.copy(deathStart[i].q).slerp(q,transition);target.copy(b.scale);b.scale.copy(deathStart[i].s).lerp(target,transition);});
  model.updateMatrixWorld(true);legs.forEach((leg,i)=>{target.copy(rest(leg));leg.target.copy(deathFeet[i]).lerp(target,transition);solve(leg);});
  materials.ember.emissiveIntensity=Math.max(0,1-deathTime/1.7)*1.2;
  if(deathTime>1.65){if(!fading){for(const m of Object.values(materials)){m.transparent=true;m.depthWrite=false;m.needsUpdate=true;}fading=true;}for(const m of Object.values(materials))m.opacity=clamp(1-(deathTime-1.65)/1.05);}
  if(deathTime>=2.7){model.visible=false;group.add(model);deathAnchor.removeFromParent();dying=false;}
 }
 function update(dt,e={}){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.05);elapsed+=dt;if(dying){updateDeath(dt);return;}
  if(!group.visible){if(initialized||strike||recoil)reset();return;}
  group.updateWorldMatrix(true,false);group.getWorldPosition(position);group.getWorldQuaternion(worldQ);velocity.subVectors(position,previous);const teleport=!initialized||velocity.length()>2;
  if(teleport){velocity.set(0,0,0);initialized=true;for(const leg of legs){leg.target.copy(rest(leg));leg.anchor.copy(leg.target);leg.stance=null;}}else velocity.divideScalar(Math.max(.001,dt));previous.copy(position);
  strike=Math.max(0,strike-dt);recoil=Math.max(0,recoil-dt);const speed=Math.hypot(velocity.x,velocity.z),preparing=e.windup>0,warning=preparing?smooth(1-e.windup/1.15):0,active=speed>.035&&!preparing&&strike===0;
  locomotion=mix(locomotion,active?1:0,1-Math.exp(-dt*7));const cycle=2.35,frequency=Math.min(1.8,speed/cycle);
  if(active&&!wasMoving){phase=.25;for(const leg of legs)leg.stance=null;}if(active)phase=(phase+frequency*dt)%1;wasMoving=active;
  const impact=strike>0?1-smooth((1-strike/.68)/.90):0,hurt=recoil>0?Math.sin((1-recoil/.28)*Math.PI):0;pose(warning,impact,hurt);group.updateMatrixWorld(true);
  for(const leg of legs){
   const p=(phase+(leg.side>0?.5:0))%1,stance=p<.62;
   if(!active&&locomotion<.30){leg.target.lerp(rest(leg),1-Math.exp(-dt*12));leg.target.y=position.y+.18;leg.stance=null;leg.contact=true;}
   else if(stance){if(leg.stance!==true)leg.anchor.copy(leg.stance===false?leg.landing:leg.target);leg.target.copy(leg.anchor);leg.target.y=position.y+.18;leg.stance=true;leg.contact=true;}
   else{
    const raw=(p-.62)/.38;if(leg.stance!==false){leg.takeoff.copy(leg.target);leg.offset=raw;leg.stance=false;}
    const t=clamp((raw-leg.offset)/Math.max(.01,1-leg.offset)),remaining=(1-p)/Math.max(.1,frequency);leg.landing.copy(rest(leg)).addScaledVector(velocity,.50/Math.max(.1,speed)+remaining);leg.target.lerpVectors(leg.takeoff,leg.landing,smooth(t));leg.target.y=position.y+.18+Math.sin(t*Math.PI)*.22;leg.contact=false;
   }
  }
  let supportDrop=0;for(const leg of legs)if(leg.contact){leg.upper.getWorldPosition(origin);const horizontal=Math.hypot(origin.x-leg.target.x,origin.z-leg.target.z),reach=leg.a+leg.b-.004;supportDrop=Math.max(supportDrop,origin.y-leg.target.y-Math.sqrt(Math.max(.01,reach*reach-horizontal*horizontal)));}J.hips.position.y-=clamp(supportDrop,0,.40);J.hips.updateMatrixWorld(true);for(const leg of legs)solve(leg);
  if(impact>0)for(const arm of arms){
   const chain=[arm.upper,arm.lower,arm.foot];chain.forEach((b,i)=>arm.saved[i].copy(b.quaternion));arm.target.set(arm.side*1.35,1.10,.65).applyMatrix4(group.matrixWorld);solve(arm,true);
   chain.forEach((b,i)=>{q.copy(b.quaternion);b.quaternion.copy(arm.saved[i]).slerp(q,impact);});
  }
  motion.speed=speed;motion.locomotion=locomotion;motion.warning=preparing?.15+warning*.85:0;motion.strike=impact;motion.recoil=hurt;motion.state=preparing?'windup':strike>0?'impact':hurt>.05?'hurt':locomotion>.15?'walk':'idle';legs.forEach((leg,i)=>motion.contacts[i]=leg.contact);
 }
 update(0);return {...rig,skeleton:skin,materials,meshes,legs,motion,texture:kit.texture,triangles:kit.triangles,update,reset,attack,hit,defeat,get dying(){return dying;}};
}
function fragment(T){const kit=cache.get(T)||art(T,skeleton(T).joints);return new T.Mesh(kit.chip,kit.chipMaterial);}
root.EmberThornGuardian={create,fragment};
})(typeof window==='undefined'?globalThis:window);
