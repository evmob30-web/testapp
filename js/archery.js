/* Boog, herbruikbare pijlen en drie oefendoelen; spelregels staan in core/combat. */
(function(){
function create(world){
 const T=THREE,wood=new T.MeshStandardMaterial({color:'#a18351',roughness:.8,flatShading:true}),metal=new T.MeshStandardMaterial({color:'#cfe0c5',metalness:.2,roughness:.5}),fletch=new T.MeshStandardMaterial({color:'#c1dfaf',roughness:.8}),glow=new T.MeshStandardMaterial({color:'#b3f2dc',emissive:'#4c9f85',emissiveIntensity:1});
 const targetsRoot=new T.Group();world.scene.add(targetsRoot);
 const template=new T.Group(),shaft=new T.Mesh(new T.BoxGeometry(.045,.045,.9),wood);template.add(shaft);const head=new T.Mesh(new T.ConeGeometry(.1,.28,5),metal);head.rotation.x=Math.PI/2;head.position.z=.55;template.add(head);const feathers=new T.Mesh(new T.BoxGeometry(.22,.035,.23),fletch);feathers.position.z=-.35;template.add(feathers);
 const bow=new T.Group();world.player.arm.add(bow);const curve=new T.QuadraticBezierCurve3(new T.Vector3(0,-.75,.25),new T.Vector3(0,0,.95),new T.Vector3(0,.75,.25));bow.add(new T.Mesh(new T.TubeGeometry(curve,14,.055,5,false),wood));
 const stringGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(0,-.75,.25),new T.Vector3(0,0,.25),new T.Vector3(0,.75,.25)]),string=new T.Line(stringGeo,new T.LineBasicMaterial({color:'#efe0b6'}));bow.add(string);const held=template.clone(true);held.position.z=.5;bow.add(held);held.visible=false;
 const targets=RPG.bowTargets.map(data=>{const group=new T.Group();group.position.set(data.x,0,data.z);targetsRoot.add(group);const stand=new T.Mesh(new T.BoxGeometry(.16,1.6,.16),wood);stand.position.y=.8;group.add(stand);const disk=new T.Mesh(new T.CylinderGeometry(.8,.8,.25,16),new T.MeshStandardMaterial({color:'#c1ac75',roughness:1}));disk.rotation.x=Math.PI/2;disk.position.y=1.7;group.add(disk);const bull=new T.Mesh(new T.TorusGeometry(.4,.1,5,20),new T.MeshStandardMaterial({color:'#b86f57'}));bull.position.set(0,1.7,.15);group.add(bull);return {...data,mesh:group,bull};});
 function sync(state){targetsRoot.visible=state.area==='valley';bow.visible=state.weapon==='bow';for(const t of targets)t.bull.material.color.set(state.bowPractice.includes(t.id)?'#9ad2b0':'#b86f57');}
 function update(charge){held.visible=bow.visible&&charge>0;held.position.z=.5-charge*.25;stringGeo.attributes.position.setXYZ(1,0,0,.25-charge*.28);stringGeo.attributes.position.needsUpdate=true;if(bow.visible)world.player.arm.rotation.x=-.2-charge*.2;}
 function arrow(x,z,dx,dz,magical=false){const m=template.clone(true);if(magical)m.children[1].material=glow;m.position.set(x,1.5,z);m.rotation.y=Math.atan2(dx,dz);world.scene.add(m);return m;}
 return {bow,targets,targetsRoot,sync,update,arrow};
}
window.EmberArchery={create};
})();
