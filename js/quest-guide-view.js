/* One reusable world marker and a camera-relative compass; no input or quest rules. */
(function(root){
'use strict';
function create(world,doc,{resolve}={}){
 const T=root.THREE,$=id=>doc.getElementById(id),group=new T.Group();group.name='QuestDestination';group.visible=false;world.scene.add(group);
 const gold=new T.MeshBasicMaterial({color:'#ffe19a',transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}),ring=new T.Mesh(new T.RingGeometry(.88,1.0,40),gold);ring.rotation.x=-Math.PI/2;group.add(ring);
 const diamond=new T.Mesh(new T.OctahedronGeometry(.18),gold);diamond.position.y=2.5;group.add(diamond);
 const vertices=new Float32Array([-.14,0,1.18,.14,0,1.18,0,0,1.0]),arrowGeometry=new T.BufferGeometry();arrowGeometry.setAttribute('position',new T.BufferAttribute(vertices,3));
 for(let i=0;i<4;i++){const arrow=new T.Mesh(arrowGeometry,gold);arrow.rotation.y=i*Math.PI/2;group.add(arrow);}
 const forward=new T.Vector3(),directions=['N','NO','O','ZO','Z','ZW','W','NW'];let plan=null,angle=0,initialized=false,lastKey=null,lastAria='';
 function write(id,text){const node=$(id);if(node.textContent!==text)node.textContent=text;}
 function describe(text){if(lastAria===text)return;lastAria=text;$('quest-compass').setAttribute('aria-label',text);}
 function setPlan(value){plan=value;}
 function update(dt,time,camera,s,playing){
  const show=playing&&!!plan&&s.questGuide?.enabled!==false;$('quest-compass').hidden=!show;group.visible=show&&!!plan.target;
  if(!show){initialized=false;return;}
  write('quest-guide-title',plan.quest.title);write('quest-guide-step',plan.step);
  $('quest-compass').dataset.questId=plan.quest.id;$('quest-compass').dataset.targetKey=plan.target?.key||'';$('quest-compass').dataset.waiting=String(!plan.target);
  $('quest-guide-arrow').hidden=!plan.target;
  if(!plan.target){write('quest-guide-distance','Open Quests om een andere opdracht te volgen');describe(plan.quest.title+' · '+plan.step);return;}
  const target=plan.target,live=resolve&&!target.key.startsWith('lesson:')?resolve(target.key):null;
  if(resolve&&!target.key.startsWith('lesson:')&&(!live||target.identity!==undefined&&live.identity!==target.identity)){group.visible=false;$('quest-guide-arrow').hidden=true;$('quest-compass').dataset.targetKey='';write('quest-guide-distance','Doel wordt bijgewerkt…');return;}
  const point=live?.position||target.position,dx=point.x-s.x,dz=point.z-s.z,d=Math.hypot(dx,dz);
  group.position.set(point.x,.14,point.z);group.userData.questId=plan.quest.id;group.userData.targetKey=target.key;
  gold.opacity=.77+Math.sin(time*1.7)*.08;diamond.rotation.y=time*.55;
  camera.getWorldDirection(forward);forward.y=0;forward.normalize();
  const raw=Math.atan2(dx*-forward.z+dz*forward.x,dx*forward.x+dz*forward.z);
  if(!initialized||lastKey!==target.key){angle=raw;initialized=true;}else angle+=Math.atan2(Math.sin(raw-angle),Math.cos(raw-angle))*(1-Math.exp(-12*dt));lastKey=target.key;
  $('quest-guide-arrow').style.transform='rotate('+angle+'rad)';
  const bearing=Math.atan2(dx,-dz),direction=directions[(Math.round(bearing/(Math.PI/4))+8)%8],text=(d<.7?'Hier':Math.round(d)+' m')+' · '+direction;
  write('quest-guide-distance',text);describe(plan.quest.title+' · '+plan.step+' · '+text+' · Open questlog');
 }
 return {setPlan,update,group,get plan(){return plan;}};
}
root.EmberQuestGuideView={create};
})(typeof window==='undefined'?globalThis:window);
