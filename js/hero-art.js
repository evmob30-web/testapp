/* Original Emberwild heroic fantasy geometry. No external art or engine state.
 * Shared by the GLB source, hairstyles, weapons and collected armor. +Z faces forward. */
(function(root){
'use strict';
const hairCache=new WeakMap();
function create(T){
 if(!hairCache.has(T))hairCache.set(T,new Map());
 const cachedHair=hairCache.get(T);
 function paint(g,strength=.16){
  if(!g.attributes.normal)g.computeVertexNormals();
  const n=g.attributes.normal,p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
   const light=.86+strength*(n.getY(i)*.48+n.getZ(i)*.32+n.getX(i)*-.16);
   colors.push(light,light,light);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
 }
 function loft(rings,segments=20,sculpt){
  const p=[],uv=[],ix=[];
  for(let r=0;r<rings.length;r++){
   const [y,rx,rz,z=0,x=0]=rings[r];
   for(let s=0;s<=segments;s++){
    const a=s/segments*Math.PI*2,point=[Math.cos(a)*rx+x,y,Math.sin(a)*rz+z];
    if(sculpt)sculpt(point,a,r);
    p.push(...point);uv.push(s/segments,1-r/(rings.length-1));
   }
  }
  for(let r=0;r<rings.length-1;r++)for(let s=0;s<segments;s++){
   const a=r*(segments+1)+s,b=a+segments+1;ix.push(a,a+1,b,b,a+1,b+1);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return paint(g);
 }
 function plate(points,depth=.045,bevel=.012){
  const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,steps:1});g.translate(0,0,-depth/2);g.computeBoundingBox();
  const b=g.boundingBox,p=g.attributes.position,uv=[];
  for(let i=0;i<p.count;i++)uv.push((p.getX(i)-b.min.x)/(b.max.x-b.min.x),(p.getY(i)-b.min.y)/(b.max.y-b.min.y));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return paint(g,.22);
 }
 // Refine cap triangles before bending: curved armor must cover the underlying cloth.
 function curvedPlate(points,depth=.045,bow=.1,width=.46){
  const source=plate(points,depth),pos=source.attributes.position,norm=source.attributes.normal,uv=source.attributes.uv,p=[],n=[],u=[];
  function triangle(vertices,steps){
   if(steps){const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2),[a,b,c]=vertices,ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);triangle([a,ab,ca],steps-1);triangle([ab,b,bc],steps-1);triangle([ca,bc,c],steps-1);triangle([ab,bc,ca],steps-1);return;}
   for(const v of vertices){const [x,y,z,nx,ny,nz,tu,tv]=v,normal=new T.Vector3(nx+2*bow*x/(width*width)*nz,ny,nz).normalize();p.push(x,y,z+bow*(1-(x/width)**2));n.push(normal.x,normal.y,normal.z);u.push(tu,tv);}
  }
  for(let i=0;i<pos.count;i+=3){const vertices=[];for(let j=0;j<3;j++){const k=i+j;vertices.push([pos.getX(k),pos.getY(k),pos.getZ(k),norm.getX(k),norm.getY(k),norm.getZ(k),uv.getX(k),uv.getY(k)]);}triangle(vertices,Math.abs(norm.getZ(i))>.999?2:0);}
  source.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));return paint(g,.22);
 }
 function lock(points,width=.07,depth=.035,segments=14){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),frames=curve.computeFrenetFrames(segments,false),p=[],uv=[],ix=[],sides=8;
  for(let i=0;i<=segments;i++){
   const t=i/segments,center=curve.getPoint(t),profile=Math.max(.018,Math.pow(Math.sin(Math.PI*(.13+t*.87)),.65)),w=Math.max(.002,width*profile);
   for(let s=0;s<=sides;s++){
    const a=s/sides*Math.PI*2,v=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*w).addScaledVector(frames.binormals[i],Math.sin(a)*depth*profile);
    p.push(v.x,v.y,v.z);uv.push(s/sides,t);
   }
  }
  for(let i=0;i<segments;i++)for(let s=0;s<sides;s++){const a=i*(sides+1)+s,b=a+sides+1;ix.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return paint(g,.26);
 }
 function hair(style,material){
  const group=new T.Group();group.name='appearance_hair_'+style;
  if(cachedHair.has(style)){const mesh=new T.Mesh(cachedHair.get(style),material);mesh.name=style+'_cap';mesh.castShadow=true;group.add(mesh);return group;}
  const add=(name,g)=>{const mesh=new T.Mesh(g,material);mesh.name=name;mesh.castShadow=true;group.add(mesh);return mesh;};
  // Sculpted scalp with an uneven hairline, instead of an ellipsoid cap.
  const p=[],uv=[],ix=[],rows=10,cols=28;
  for(let r=0;r<=rows;r++)for(let s=0;s<=cols;s++){
   const a=s/cols*Math.PI*2,front=Math.max(0,Math.sin(a)),end=1.96-front*.76,phi=Math.max(.0005,r/rows*end);
   p.push(Math.cos(a)*Math.sin(phi)*.251,.14+Math.cos(phi)*.252,Math.sin(a)*Math.sin(phi)*.235-.035);uv.push(s/cols,r/rows);
  }
  for(let r=0;r<rows;r++)for(let s=0;s<cols;s++){const a=r*(cols+1)+s,b=a+cols+1;ix.push(a,a+1,b,b,a+1,b+1);}
  const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(p,3));cap.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cap.setIndex(ix);cap.computeVertexNormals();add(style+'_cap',paint(cap,.21));
  for(let i=0;i<8;i++){
   const a=i/8*Math.PI*2,side=Math.cos(a),back=Math.sin(a);
   add('crown_lock_'+i,lock([[side*.09,.37,back*.08-.04],[side*.20,.32,back*.18-.04],[side*.25,.16,back*.22-.035]],.046,.024,10));
  }
  for(const sign of [-1,1])add('temple_lock_'+sign,lock([[sign*.19,.29,.03],[sign*.247,.15,.015],[sign*.224,.035,.04]],.045,.023,10));
  for(let i=0;i<7;i++){
   const a=Math.PI+(i+.5)/7*Math.PI,x=Math.cos(a),z=Math.sin(a);
   add('nape_lock_'+i,lock([[x*.18,.21,z*.18-.035],[x*.235,.065,z*.225-.035],[x*.22,-.055-(i%2)*.018,z*.224-.035]],.043,.025,10));
  }
  if(style==='short'){
   for(let i=0;i<5;i++)add('swept_fringe_'+i,lock([[-.18+i*.047,.32,.14],[-.09+i*.055,.41-i*.012,.23],[.11+i*.023,.29-i*.022,.224]],.047,.025));
  }else{
   for(let i=0;i<4;i++)add('parted_fringe_'+i,lock([[-.075+i*.052,.35,.18],[.04+i*.052,.28,.246],[.12+i*.035,.16,.205]],.038,.025));
   if(style==='long')for(const sign of [-1,1])for(let i=0;i<4;i++)add('long_lock_'+sign+'_'+i,lock([[sign*(.15+i*.024),.29,-.10-i*.04],[sign*(.23+i*.02),-.04,-.14-i*.036],[sign*(.20+i*.025),-.40-i*.02,-.13-i*.045]],.065,.038,18));
   if(style==='braid'){
    for(let i=0;i<7;i++)for(const sign of [-1,1]){
     const y=.11-i*.077,w=.07*(1-i*.065);
     add('braid_weave_'+i+'_'+sign,lock([[sign*w,y,-.26],[0,y-.055,-.296],[sign*-w,y-.09,-.26]],.039*(1-i*.055),.029,8));
    }
    add('braid_tail',lock([[0,-.47,-.27],[.02,-.56,-.28],[.035,-.62,-.25]],.04,.026,8));
   }
  }
  // All clumps share a material; batch them into one reusable geometry per hairstyle.
  const positions=[],normals=[],colors=[],uvs=[],indices=[];
  for(const mesh of group.children){const g=mesh.geometry,offset=positions.length/3;positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);colors.push(...g.attributes.color.array);uvs.push(...g.attributes.uv.array);for(const i of g.index.array)indices.push(offset+i);g.dispose();}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);cachedHair.set(style,geometry);
  group.clear();add(style+'_cap',geometry);return group;
 }
 const chestOutline=[[-.35,.31],[-.17,.36],[0,.23],[.17,.36],[.35,.31],[.42,.10],[.33,-.23],[.16,-.43],[0,-.47],[-.16,-.43],[-.33,-.23],[-.42,.10]];
 function armor(slot,rare=false){
  const out=[],add=(bone,geometry,role,position=[0,0,0],rotation=[0,0,0])=>out.push({bone,geometry,role,position,rotation});
  if(slot==='chest'){
   add('chest',curvedPlate(chestOutline,.065,.10),'base',[0,-.015,.28]);
   const ridge=plate([[-.34,.29],[-.17,.32],[0,.19],[.17,.32],[.34,.29],[.32,.245],[.17,.27],[0,.13],[-.17,.27],[-.32,.245]],.02,.007);
   add('chest',ridge,'trim',[0,0,.34]);
   add('chest',plate([[-.055,.12],[0,.18],[.055,.12],[0,-.02]],.035,.007),'trim',[0,0,.35]);
  }else if(slot==='shoulders')for(const side of [-1,1]){
   const bone=side<0?'upper_arm_l':'upper_arm_r';
   add(bone,loft([[.19,.025,.04],[.13,.28,.25],[.015,.37,.31],[-.17,.35,.285],[-.28,.21,.22]],12),'base',[side*.06,0,0]);
   add(bone,loft([[-.13,.365,.30],[-.19,.34,.286],[-.205,.31,.267]],12),'trim',[side*.06,0,0]);
   if(rare)add(bone,plate([[-.06,.04],[0,.13],[.06,.04],[0,-.06]],.04,.008),'trim',[side*.08,0,.32]);
  }else if(slot==='head'){
   const shell=loft([[.43,.005,.005],[.39,.17,.19],[.30,.28,.25],[.20,.29,.26]],24);add('head',shell,'base',[0,0,-.035]);
   add('head',plate([[-.265,.22],[-.14,.265],[0,.24],[.14,.265],[.265,.22],[.24,.18],[.13,.22],[0,.195],[-.13,.22],[-.24,.18]],.025,.008),'trim',[0,0,.20]);
   if(rare)add('head',plate([[-.055,.23],[0,.42],[.055,.23],[0,.18]],.045,.008),'trim',[0,0,.24]);
  }else if(slot==='hands')for(const side of ['l','r']){
   const bone='lower_arm_'+side;
   add(bone,loft([[-.18,.15,.16],[-.25,.175,.18],[-.42,.13,.14],[-.53,.11,.12]],12),'base');
   add(bone,loft([[-.19,.16,.17],[-.23,.178,.185],[-.26,.17,.18]],12),'trim');
   add(bone,plate([[-.10,-.24],[0,-.19],[.10,-.24],[.065,-.43],[0,-.48],[-.065,-.43]],.03,.009),'trim',[0,0,.165]);
  }else if(slot==='feet')for(const side of ['l','r']){
   const bone='foot_'+side;
   add(bone,loft([[.17,.14,.16],[.09,.16,.175],[-.04,.18,.28,.10],[-.079,.18,.285,.10]],16),'base');
   add(bone,plate([[-.14,.10],[0,.18],[.14,.10],[.12,-.015],[-.12,-.015]],.03,.008),'trim',[0,0,.25]);
  }
  return out;
 }
 function swordBlade(){
  const p=[],ix=[];
  const rings=[[.51,.064],[.34,.08],[-.31,.058],[-.51,.001]];
  for(const [y,w]of rings)p.push(-w,y,0,0,y,.027,w,y,0,0,y,-.027);
  for(let r=0;r<rings.length-1;r++)for(let s=0;s<4;s++){const a=r*4+s,b=r*4+(s+1)%4;ix.push(a,a+4,b,b,a+4,b+4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 return {paint,loft,plate,curvedPlate,lock,hair,armor,swordBlade};
}
root.EmberHeroArt={create};
})(typeof window==='undefined'?globalThis:window);
