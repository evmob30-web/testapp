/* Drie aaneengesloten kamers; dezelfde vloerdata sturen botsingen en minimap aan. */
(function(root){
const rooms=[{x:90,z:0,w:20,d:18,name:'De Sporehal'},{x:97,z:-8,w:6,d:8},{x:87,z:-30,w:26,d:22,name:'Het Wortelarchief'},{x:97,z:-40,w:6,d:10},{x:86,z:-66,w:28,d:26,name:'Het Stille Hart'}];
function canStand(x,z,open,r=.55){
 const covered=(px,pz)=>rooms.some(b=>px>=b.x&&px<=b.x+b.w&&pz>=b.z&&pz<=b.z+b.d);
 if(!covered(x,z))return false;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;if(!covered(x+Math.cos(a)*r,z+Math.sin(a)*r))return false;}
 return open||!(x+r>96.8&&x-r<103.2&&z+r> -35.5&&z-r< -34.5);
}
function move(x,z,tx,tz,open,r=.55){if(canStand(tx,tz,open,r))return {x:tx,z:tz};if(canStand(tx,z,open,r))return {x:tx,z};if(canStand(x,tz,open,r))return {x,z:tz};return {x,z};}
function create(world){
 const T=THREE,scene=world.scene,group=new T.Group();scene.add(group);const materials={};
 const material=(color,glow)=>materials[color+glow]??=new T.MeshStandardMaterial({color,roughness:1,flatShading:true,emissive:glow||0,emissiveIntensity:glow?1.1:0});
 function mesh(geo,color,x,y,z,parent=group){const m=new T.Mesh(geo,typeof color==='string'?material(color):color);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 const cone=(r,h,c,x,y,z,p)=>mesh(new T.ConeGeometry(r,h,7),c,x,y,z,p);
 const ball=(r,c,x,y,z,p)=>mesh(new T.IcosahedronGeometry(r,1),c,x,y,z,p);
 function wall(x,z,w,d){const m=box(w,3.8,d,'#46534f',x,1.8,z);world.cameraMeshes.push(m);box(w+.1,.25,d+.1,'#697265',x,3.8,z);}
 const tiles=[[],[]];for(const r of rooms){box(r.w,.35,r.d,'#55605a',r.x+r.w/2,-.23,r.z+r.d/2);for(let x=r.x+1;x<r.x+r.w;x+=2)for(let z=r.z+1;z<r.z+r.d;z+=2)tiles[Math.round(x+z)%3?0:1].push([x,z]);}for(let i=0;i<2;i++){const batch=new T.InstancedMesh(new T.BoxGeometry(1.88,.025,1.88),material(i?'#626c60':'#5c665c'),tiles[i].length),dummy=new T.Object3D();for(let j=0;j<tiles[i].length;j++){dummy.position.set(tiles[i][j][0],-.03,tiles[i][j][1]);dummy.updateMatrix();batch.setMatrixAt(j,dummy.matrix);}batch.receiveShadow=true;group.add(batch);}
 // Side walls, with six-meter openings between chambers and corridors.
 for(const r of rooms){wall(r.x,r.z+r.d/2,.7,r.d);wall(r.x+r.w,r.z+r.d/2,.7,r.d);}
 wall(100,18,20,.7);wall(100,-66,28,.7);
 for(const [z,left,right] of [[0,90,110],[-8,87,113],[-30,87,113],[-40,86,114]]){wall((left+97)/2,z,97-left,.7);wall((103+right)/2,z,right-103,.7);}
 // Root ribs and glowing fungal clusters stay out of the walking route.
 for(let i=0;i<24;i++){const side=i%2?-1:1,z=15-i*3.3,x=100+side*(z>0?9:z> -8?2.6:z> -30?12:z> -40?2.6:13);const root=box(.5,4,.5,'#766647',x,1.6,z);root.rotation.z=side*.25;const arm=box(2.1,.45,.6,'#766647',x-side*.6,2.8,z);arm.rotation.z=side*.4;}
 for(let i=0;i<40;i++){const z=15-i*1.95,side=i%2?-1:1,room=rooms.find(r=>z>=r.z&&z<=r.z+r.d);if(!room)continue;const x=side<0?room.x+1.3:room.x+room.w-1.3,h=.45+(i%3)*.16;box(.14,h,.14,'#adc3a3',x,h/2,z);mesh(new T.SphereGeometry(.48,8,5,0,Math.PI*2,0,Math.PI/2),material(i%3?'#8ccbbd':'#c2a0c8',i%3?'#397b73':'#724779'),x,h,z);}
 for(const [x,z,c] of [[95,10,'#8bd4ba'],[109,-19,'#b1a2de'],[91,-49,'#7ddcc9'],[108,-61,'#d4bf83']]){const l=new T.PointLight(c,18,21,2);l.position.set(x,3,z);group.add(l);}
 const gate=new T.Group();gate.position.set(100,0,-35);group.add(gate);for(const x of [-2.3,-1.15,0,1.15,2.3]){const b=box(.32,3.8,.5,'#8a805a',x,1.9,0,gate);b.rotation.z=x*.07;}box(6,.4,.6,'#aea277',0,3.9,0,gate);box(.5,.7,.65,material('#e2c488','#8a6b33'),0,1.8,.25,gate);
 const key=new T.Group();key.position.set(110,1.4,-21);group.add(key);const bow=mesh(new T.TorusGeometry(.3,.09,5,12),material('#ffda85','#b48c32'),0,.25,0,key);box(.13,.65,.13,'#efc16d',0,-.3,0,key);box(.3,.12,.13,'#efc16d',.12,-.5,0,key);box(1.2,.65,1.2,'#777967',110,.3,-21);
 const altar=box(2.6,1.1,2.2,'#859180',100,.5,-63);const amulet=mesh(new T.OctahedronGeometry(.45,0),material('#b5f7d1','#4cb77f'),100,2,-63);const halo=mesh(new T.TorusGeometry(.7,.08,5,24),material('#f3df9c','#c8a75b'),100,2,-63);halo.rotation.x=Math.PI/2;
 const shrine=mesh(new T.TorusGeometry(1.4,.12,5,24),material('#b6dccc','#5a9988'),100,.07,12);shrine.rotation.x=-Math.PI/2;
 const exit=box(3.6,3.8,.3,material('#9fc9c0','#46685e'),100,1.8,17.5);
 const entrance=new T.Group();entrance.position.set(0,0,-58.5);scene.add(entrance);box(3.5,.18,2.2,'#66776b',0,0,0,entrance);const portal=box(3.2,3.5,.18,material('#8ab3b4','#355a65'),0,1.7,0,entrance);for(const x of [-1.9,1.9])box(.55,3.8,.8,'#a3af98',x,1.8,0,entrance);box(4.4,.6,.8,'#a3af98',0,3.8,0,entrance);
 const enemies=[];
 for(const data of RPG.dungeonEnemies){const g=new T.Group();g.position.set(data.x,0,data.z);scene.add(g);if(data.rootBoss){cone(2,4.5,'#786443',0,2.3,0,g);ball(1.2,'#8c9c6b',0,4,0,g);ball(.65,material('#c6edb0','#59924b'),0,2.9,1.6,g);for(const side of [-1,1]){const arm=box(.65,3.5,.7,'#8d7751',side*2,2.3,0,g);arm.rotation.z=side*.7;cone(.4,2.5,'#b7c58e',side*.7,5.3,0,g);ball(.16,material('#ffe9ae','#bc8f40'),side*.4,4.2,.95,g);}}else if(data.spirit){cone(.9,2.4,'#a294b7',0,1.7,0,g);ball(.5,material('#d1e9c9','#639a78'),0,3,0,g);for(const side of [-1,1]){ball(.15,material('#f4d9a2','#b98a42'),side*.23,3.1,.4,g);cone(.2,.9,'#c5b7ce',side*.7,2,0,g);}}else{box(1.2,1.9,.8,'#8e8260',0,1.5,0,g);ball(.55,'#a0ad7c',0,2.9,0,g);for(const side of [-1,1]){const arm=box(.3,1.5,.4,'#a4926d',side*.8,1.6,0,g);arm.rotation.z=side*.2;box(.3,.8,.4,'#7e775e',side*.35,.4,0,g);}}
 const e={...data,area:'roots',mesh:g,hp:data.hp,max:data.hp,homeX:data.x,homeZ:data.z,attack:1,windup:0,flash:0,pattern:0,lastX:data.x,lastZ:data.z};enemies.push(e);world.enemies.push(e);
 }
 const forestNodes=scene.children.filter(n=>n!==group&&n!==entrance&&n!==world.player.group&&!n.isLight&&!enemies.some(e=>e.mesh===n));
 const hemisphere=scene.children.find(n=>n.isHemisphereLight),sun=scene.children.find(n=>n.isDirectionalLight);const baseColor=scene.background.clone(),baseFog=scene.fog;
 function setArea(area){const inside=area==='roots';group.visible=inside;entrance.visible=!inside;for(const n of forestNodes)n.visible=!inside;scene.background=inside?new T.Color('#263637'):baseColor;scene.fog=inside?new T.FogExp2('#263637',.022):baseFog;if(hemisphere)hemisphere.intensity=inside?1.3:2.15;if(sun)sun.intensity=inside?.65:2.6;}
 function sync(s){gate.visible=!s.gateOpen;key.visible=!s.caveKey;amulet.visible=!s.amulet;halo.visible=amulet.visible;portal.material.emissiveIntensity=s.dungeon>0?1.5:.35;}
 function update(dt,time,s){key.rotation.y=time;amulet.rotation.y=time*.8;amulet.position.y=2+Math.sin(time*2)*.12;halo.position.y=amulet.position.y;halo.rotation.z=time*.3;}
 setArea('valley');return {group,gate,key,amulet,enemies,rooms,setArea,sync,update};
}
root.EmberDungeon={rooms,canStand,move,create};
})(typeof window==='undefined'?globalThis:window);
