/* Emberwild armor inventory, progression rewards and visible Three.js attachments.
 * Five independent equipment slots. Only whitelisted IDs survive save restoration.
 */
(function(root){
'use strict';
const slots={head:'Hoofd',shoulders:'Schouders',chest:'Borst',hands:'Handschoenen',feet:'Laarzen'};
const items={
 wanderer_hood:{slot:'head',name:'Reizigerskap',rarity:'common',hp:4,power:0,color:'#6c8074',price:20},
 ember_helm:{slot:'head',name:'Vonkenhelm',rarity:'rare',hp:16,power:2,color:'#b76b38',price:95},
 wanderer_shoulders:{slot:'shoulders',name:'Woudschouders',rarity:'common',hp:5,power:0,color:'#607c65',price:22},
 ember_shoulders:{slot:'shoulders',name:'Sintelschouders',rarity:'rare',hp:12,power:3,color:'#b56b36',price:100},
 wanderer_chest:{slot:'chest',name:'Leren borstpantser',rarity:'common',hp:10,power:0,color:'#596c59',price:35},
 ember_chest:{slot:'chest',name:'Vuurwachtersborstplaat',rarity:'rare',hp:25,power:3,color:'#9c4b35',price:135},
 wanderer_gloves:{slot:'hands',name:'Boswachtershandschoenen',rarity:'common',hp:3,power:1,color:'#6f7c57',price:18},
 ember_gloves:{slot:'hands',name:'Vonkgrepen',rarity:'rare',hp:8,power:4,color:'#bc7a39',price:95},
 wanderer_boots:{slot:'feet',name:'Reizigerslaarzen',rarity:'common',hp:5,power:0,color:'#5d5548',price:25},
 ember_boots:{slot:'feet',name:'Aslopers',rarity:'rare',hp:12,power:2,color:'#904d3e',price:100}
};
const freeStarter=['wanderer_chest','wanderer_boots'];
const rewardItems={chest:'wanderer_hood',boss:'ember_shoulders',rootboss:'ember_chest',bowQuest:'wanderer_gloves',sideQuest:'wanderer_shoulders',shrine:'ember_gloves',dungeon:'ember_helm'};
function clean(s){
 const owned=Array.isArray(s.armorOwned)?[...new Set(s.armorOwned.filter(id=>Object.hasOwn(items,id)))].slice(0,Object.keys(items).length):[];
 for(const id of freeStarter)if(!owned.includes(id))owned.push(id);
 const equipped={};
 for(const slot of Object.keys(slots)){
  const id=s.armorEquipped&&s.armorEquipped[slot];
  equipped[slot]=typeof id==='string'&&owned.includes(id)&&items[id].slot===slot?id:null;
 }
 s.armorOwned=owned;s.armorEquipped=equipped;
 return s;
}
function grant(s,id){
 clean(s);
 if(!Object.hasOwn(items,id)||s.armorOwned.includes(id))return false;
 s.armorOwned.push(id);return true;
}
function equip(s,id){
 clean(s);
 if(!Object.hasOwn(items,id)||!s.armorOwned.includes(id))return false;
 const slot=items[id].slot;
 s.armorEquipped[slot]=s.armorEquipped[slot]===id?null:id;
 return true;
}
function buy(s,id){
 clean(s);
 if(!Object.hasOwn(items,id)||s.armorOwned.includes(id)||!Number.isFinite(s.gold)||s.gold<items[id].price)return false;
 s.gold-=items[id].price;return grant(s,id);
}
function syncRewards(s){
 clean(s);
 const unlocked=[];
 const stages=[
  [s.chest,'chest'],
  [Array.isArray(s.kills)&&s.kills.includes('boss'),'boss'],
  [Array.isArray(s.kills)&&s.kills.includes('rootboss'),'rootboss'],
  [s.bowQuest===2,'bowQuest'],
  [s.sideQuest>=3,'sideQuest'],
  [s.shrineBlessing===true,'shrine'],
  [s.dungeon>=3,'dungeon']
 ];
 for(const [ok,key] of stages)if(ok&&grant(s,rewardItems[key]))unlocked.push(rewardItems[key]);
 return unlocked;
}
function bonuses(s){
 const equipped=s.armorEquipped||{};let hp=0,power=0;
 for(const slot of Object.keys(slots)){
  const id=equipped[slot];
  if(typeof id==='string'&&Array.isArray(s.armorOwned)&&s.armorOwned.includes(id)&&items[id]&&items[id].slot===slot){
   hp+=items[id].hp;power+=items[id].power;
  }
 }
 return {hp,power};
}
function attach(T,rig){
 const groups={};
 const material=(color)=>new T.MeshStandardMaterial({color,metalness:.48,roughness:.46,flatShading:false});
 function add(parent,geo,color,name,x,y,z,sx=1,sy=1,sz=1){
  const m=new T.Mesh(geo,material(color));m.name=name;m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;
 }
 const sphere=new T.SphereGeometry(1,16,12);
 for(const [id,item] of Object.entries(items)){
  const group=new T.Group();group.name='armor_'+id;rig.model.add(group);groups[id]=group;
  const col=item.color,trim=item.rarity==='rare'?'#f4bc72':'#a8b7a1';
  const head=rig.joints.head,chest=rig.joints.chest;
  if(item.slot==='head'){
   const dome=add(head,sphere,col,'helmet_'+id,0,.45,-.05,.39,.23,.38);group.userData.meshes=[dome];
   group.userData.meshes.push(add(head,sphere,trim,'helmet_brow_'+id,0,.35,.30,.32,.065,.10));
  }else if(item.slot==='shoulders'){
   group.userData.meshes=[];
   for(const side of [-1,1]){
    const bone=rig.joints[side<0?'upper_arm_l':'upper_arm_r'];
    group.userData.meshes.push(add(bone,sphere,col,'pauldron_'+id+side,side*.14,-.08,0,.46,.25,.37));
    group.userData.meshes.push(add(bone,sphere,trim,'pauldron_trim_'+id+side,side*.15,-.21,.10,.38,.06,.34));
   }
  }else if(item.slot==='chest'){
   group.userData.meshes=[add(chest,sphere,col,'breastplate_'+id,0,-.09,.02,.49,.50,.39)];
   group.userData.meshes.push(add(chest,sphere,trim,'chest_trim_'+id,0,.24,.30,.37,.07,.10));
  }else if(item.slot==='hands'){
   group.userData.meshes=[];
   for(const side of [-1,1]){
    const bone=rig.joints[side<0?'lower_arm_l':'lower_arm_r'];
    group.userData.meshes.push(add(bone,sphere,col,'glove_'+id+side,0,-.19,.01,.19,.23,.21));
    group.userData.meshes.push(add(bone,sphere,trim,'glove_trim_'+id+side,0,-.06,.01,.20,.06,.22));
   }
  }else if(item.slot==='feet'){
   group.userData.meshes=[];
   for(const side of [-1,1]){
    const bone=rig.joints[side<0?'foot_l':'foot_r'];
    group.userData.meshes.push(add(bone,sphere,col,'boot_'+id+side,0,-.055,.12,.22,.16,.34));
    group.userData.meshes.push(add(bone,sphere,trim,'boot_trim_'+id+side,0,-.05,.36,.21,.055,.10));
   }
  }
  for(const mesh of group.userData.meshes)mesh.visible=false;
 }
 function sync(state){
  const equipped=state&&state.armorEquipped||{};
  for(const [id,group] of Object.entries(groups)){
   const visible=equipped[items[id].slot]===id;
   for(const mesh of group.userData.meshes)mesh.visible=visible;
  }
 }
 sync(null);
 return {groups,sync};
}
root.EmberEquipment={items,slots,freeStarter,rewardItems,clean,grant,equip,buy,syncRewards,bonuses,attach};
})(typeof window==='undefined'?globalThis:window);
