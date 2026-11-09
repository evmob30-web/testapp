/* Nieuwe dorpsbewoners, plukbare kruiden en een verborgen heiligdom. */
(function(){
function create(world){
 const T=THREE,group=new T.Group();world.scene.add(group);const materials={};
 const material=(color,glow)=>materials[color+glow]??=new T.MeshStandardMaterial({color,roughness:.9,flatShading:true,emissive:glow||0,emissiveIntensity:glow?.9:0});
 function mesh(geo,color,x,y,z,parent=group){const m=new T.Mesh(geo,typeof color==='string'?material(color):color);m.position.set(x,y,z);parent.add(m);m.receiveShadow=true;return m;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const ball=(r,c,x,y,z,p)=>mesh(new T.IcosahedronGeometry(r,0),c,x,y,z,p);
 function label(text,x,y,z,parent=group,color='#f4e9c4'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.font='32px system-ui';ctx.textAlign='center';ctx.fillStyle='#193029b0';ctx.fillRect(0,22,512,58);ctx.fillStyle=color;ctx.fillText(text,256,61);const m=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthTest:false}));m.position.set(x,y,z);m.scale.set(4.5,1.125,1);parent.add(m);return m;}
 function person(x,z,color,hair){const g=new T.Group();g.position.set(x,0,z);group.add(g);box(.75,1.05,.5,color,0,1.4,0,g);ball(.36,'#dcbd9b',0,2.2,0,g);ball(.37,hair,0,2.43,-.1,g);for(const side of [-1,1]){box(.2,.75,.22,color,side*.5,1.4,0,g);box(.23,.65,.24,'#56634e',side*.23,.4,0,g);}return g;}
 const mira=person(6,25,'#bd9986','#6c5147');mira.rotation.y=-.5;label('Mira · Dorpsbewoner',0,3.3,0,mira);const marker=label('!',0,4.25,0,mira,'#ffdb8f');
 const tovin=person(-23,-32,'#769d9d','#ada68d');tovin.rotation.y=.7;box(.6,.8,.3,'#99825b',0,1.2,-.4,tovin);box(.1,.65,.1,'#756c52',.7,1.1,.2,tovin);box(.38,.45,.38,material('#a8e6ef','#58aabc'),.7,.8,.2,tovin);label('Tovin · Kruidenzoeker',0,3.25,0,tovin);
 const herbNodes=[];for(const h of RPG.herbs){const plant=new T.Group();plant.position.set(h.x,0,h.z);group.add(plant);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;box(.07,.65,.07,'#769562',Math.cos(a)*.22,.3,Math.sin(a)*.22,plant);const leaf=ball(.23,'#a4c988',Math.cos(a)*.35,.4,Math.sin(a)*.35,plant);leaf.scale.y=.4;ball(.13,material('#edd5a0','#8b7543'),Math.cos(a)*.22,.72,Math.sin(a)*.22,plant);}herbNodes.push({...h,mesh:plant});}
 const shrine=new T.Group();shrine.position.set(-26,0,-48);group.add(shrine);const plinth=mesh(new T.CylinderGeometry(1.3,1.7,.6,8),'#8b9e89',0,.2,0,shrine);const gem=mesh(new T.OctahedronGeometry(.55,0),material('#a9e9da','#579c8f'),0,1.65,0,shrine);const ring=mesh(new T.TorusGeometry(1,.09,5,24),material('#d6e5b6','#8b9d61'),0,1.65,0,shrine);ring.rotation.x=Math.PI/2;
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const rock=ball(.4,'#829580',Math.cos(a)*2.5,.15,Math.sin(a)*2.5,shrine);rock.scale.y=.55;}
 const light=new T.PointLight('#9ed8d2',3.5,9);light.position.set(0,2,0);shrine.add(light);const title=label('Het Fluisterheiligdom',0,3.6,0,shrine,'#c7e9d7');
 const trail=new T.Group();group.add(trail);for(const [x,z] of [[-24,-36],[-25,-40],[-26,-44]])for(let i=0;i<3;i++){box(.05,.3,.05,'#749775',x+i*.25,.15,z,trail);ball(.12,material('#99cce3','#49728a'),x+i*.25,.4,z,trail);}
 function sync(s){const v=RPG.questVisibility(s);title.visible=v.shrine&&s.shrineSeen;group.visible=s.area==='valley';tovin.visible=v.herbalist;shrine.visible=v.shrine;trail.visible=v.shrine;for(const h of herbNodes)h.mesh.visible=v.herbalist&&!s.gathered.includes(h.id);tovin.position.set(s.sideQuest>=2?9:-23,0,s.sideQuest>=2?27:-32);marker.visible=s.sideQuest!==3;marker.material.color.set(s.sideQuest===1?'#a9c4b3':'#ffdb8f');gem.material=material(s.shrineBlessing?'#c6d8bd':'#a9e9da',s.shrineBlessing?'#698666':'#579c8f');}
 function update(dt,time,s){marker.position.y=4.25+Math.sin(time*2)*.1;gem.position.y=1.65+Math.sin(time*1.7)*.14;gem.rotation.y=time*.5;ring.rotation.z=time*.15;for(const h of herbNodes)if(h.mesh.visible)h.mesh.rotation.z=Math.sin(time*1.5+h.x)*.035;}
 return {group,mira,tovin,herbNodes,shrine,trail,sync,update};
}
window.EmberExplore={create};
})();
