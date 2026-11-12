/* Emberwild loot: safe item templates, one-time enemy rolls and persistent drops.
 * Stats are derived from whitelisted IDs; untrusted save data cannot create items/stats.
 */
(function(root){
'use strict';
const rarity={
 common:{name:'Gewoon',color:'#c4d2c3',factor:1,weight:55},
 rare:{name:'Zeldzaam',color:'#70b7f2',factor:1.55,weight:28},
 epic:{name:'Episch',color:'#c38cff',factor:2.25,weight:13},
 legendary:{name:'Legendarisch',color:'#ffb44f',factor:3.15,weight:4}
};
const affixes={
 vitality:{name:'Levenskracht',hp:12,power:0,bow:0,guard:0},
 fury:{name:'Woede',hp:0,power:4,bow:0,guard:0},
 marksman:{name:'Scherpschutter',hp:0,power:0,bow:5,guard:0},
 bulwark:{name:'Bescherming',hp:3,power:0,bow:0,guard:3},
 ember:{name:'Sintelvuur',hp:0,power:3,bow:3,guard:0}
};
const bases={
 wanderer_hood:{slot:'head',name:'Reizigerskap',hp:4,power:0},
 ember_helm:{slot:'head',name:'Vonkenhelm',hp:16,power:2},
 wanderer_shoulders:{slot:'shoulders',name:'Woudschouders',hp:5,power:0},
 ember_shoulders:{slot:'shoulders',name:'Sintelschouders',hp:12,power:3},
 wanderer_chest:{slot:'chest',name:'Leren borstpantser',hp:10,power:0},
 ember_chest:{slot:'chest',name:'Vuurwachtersborstplaat',hp:25,power:3},
 wanderer_gloves:{slot:'hands',name:'Boswachtershandschoenen',hp:3,power:1},
 ember_gloves:{slot:'hands',name:'Vonkgrepen',hp:8,power:4},
 wanderer_boots:{slot:'feet',name:'Reizigerslaarzen',hp:5,power:0},
 ember_boots:{slot:'feet',name:'Aslopers',hp:12,power:2}
};
const slots=['head','shoulders','chest','hands','feet'],maxInventory=32,maxDrops=32;
function isId(v){return Number.isSafeInteger(v)&&v>=1&&v<=1000000;}
function readItem(raw){
 if(!raw||typeof raw!=='object'||!isId(raw.uid)||!Object.hasOwn(bases,raw.base)||!Object.hasOwn(rarity,raw.rarity)||!Object.hasOwn(affixes,raw.affix))return null;
 return {uid:raw.uid,base:raw.base,rarity:raw.rarity,affix:raw.affix};
}
function itemStats(item){
 const p=readItem(item);if(!p)return null;
 const template=bases[p.base],r=rarity[p.rarity],affix=affixes[p.affix];
 return {slot:template.slot,hp:Math.round(template.hp*r.factor+affix.hp*r.factor),
  power:Math.round(template.power*r.factor+affix.power*r.factor),
  bow:Math.round(affix.bow*r.factor),guard:Math.round(affix.guard*r.factor),
  name:r.name+' '+template.name+' van '+affix.name,rarity:p.rarity,color:r.color,uid:p.uid,base:p.base};
}
function clean(state){
 const bag=[],seen=new Set();
 for(const raw of Array.isArray(state.lootBag)?state.lootBag:[]){
  const item=readItem(raw);
  if(item&&!seen.has(item.uid)&&bag.length<maxInventory){seen.add(item.uid);bag.push(item);}
 }
 const equipped={};
 for(const slot of slots){
  const uid=state.lootEquipped?.[slot];
  const p=bag.find(i=>i.uid===uid&&bases[i.base].slot===slot);
  equipped[slot]=p?p.uid:null;
 }
 const drops=[];
 for(const raw of Array.isArray(state.lootDrops)?state.lootDrops:[]){
  const item=readItem(raw);
  if(!item||seen.has(item.uid)||!['valley','roots'].includes(raw.area)||!Number.isFinite(raw.x)||!Number.isFinite(raw.z)||Math.abs(raw.x)>150||Math.abs(raw.z)>150||drops.length>=maxDrops)continue;
  seen.add(item.uid);drops.push({...item,x:raw.x,z:raw.z,area:raw.area});
 }
 state.lootBag=bag;state.lootEquipped=equipped;state.lootDrops=drops;
 state.lootSequence=Math.max(Number.isSafeInteger(state.lootSequence)?Math.min(1000000,Math.max(0,state.lootSequence)):0,...seen,0);
 return state;
}
function equippedItem(state,slot){
 const uid=state.lootEquipped?.[slot];
 return (state.lootBag||[]).find(i=>i.uid===uid&&bases[i.base].slot===slot)||null;
}
function bonuses(state){
 const total={hp:0,power:0,bow:0,guard:0};
 for(const slot of slots){const i=equippedItem(state,slot);const stats=i&&itemStats(i);if(stats)for(const key of Object.keys(total))total[key]+=stats[key];}
 return total;
}
function chooseWeighted(entries,random){
 const u=Math.max(0,Math.min(.999999,Number.isFinite(random)?random:0));
 const total=entries.reduce((t,e)=>t+e[1],0);let n=u*total;
 for(const [key,w] of entries){n-=w;if(n<0)return key;}
 return entries.at(-1)[0];
}
function generate(state,enemy,random=Math.random){
 clean(state);
 if(state.lootDrops.length>=maxDrops||state.lootSequence>=1000000)return null;
 const chance=enemy.boss?1:enemy.spirit?.78:.57;
 if(random()>=chance)return null;
 const weights=enemy.boss?[['common',6],['rare',26],['epic',44],['legendary',24]]:
 [['common',55],['rare',28],['epic',13],['legendary',4]];
 const rarityName=chooseWeighted(weights,random());
 const id=Object.keys(bases)[Math.floor(Math.max(0,Math.min(.999999,random()))*Object.keys(bases).length)];
 const affix=Object.keys(affixes)[Math.floor(Math.max(0,Math.min(.999999,random()))*Object.keys(affixes).length)];
 const drop={uid:++state.lootSequence,base:id,rarity:rarityName,affix,x:enemy.mesh.position.x,z:enemy.mesh.position.z,area:state.area};
 return drop;
}
function roll(state,enemy,random=Math.random){const drop=generate(state,enemy,random);if(drop)state.lootDrops.push(drop);return drop;}
function receive(state,raw){clean(state);const item=readItem(raw);if(!item||state.lootBag.length>=maxInventory||[...state.lootBag,...state.lootDrops].some(i=>i.uid===item.uid))return null;state.lootBag.push(item);state.lootSequence=Math.max(state.lootSequence,item.uid);return item;}
function pickup(state,uid){
 clean(state);
 if(state.lootBag.length>=maxInventory)return null;
 const index=state.lootDrops.findIndex(d=>d.uid===uid&&d.area===state.area);
 if(index<0)return null;
 const drop=state.lootDrops.splice(index,1)[0];const item=readItem(drop);state.lootBag.push(item);
 return item;
}
function equip(state,uid){
 clean(state);
 const i=state.lootBag.find(i=>i.uid===uid);
 if(!i)return false;
 const slot=bases[i.base].slot;
 state.lootEquipped[slot]=state.lootEquipped[slot]===uid?null:uid;
 if(state.lootEquipped[slot]!==null&&state.armorEquipped)state.armorEquipped[slot]=null;
 return true;
}
function sell(state,uid){
 clean(state);
 const index=state.lootBag.findIndex(i=>i.uid===uid);
 if(index<0)return 0;
 const item=state.lootBag[index];
 if(state.lootEquipped[bases[item.base].slot]===uid)return 0;
 const value={common:12,rare:35,epic:90,legendary:220}[item.rarity];
 state.lootBag.splice(index,1);state.gold+=value;return value;
}
function comparison(state,item){
 const next=itemStats(item);if(!next)return null;
 const current=equippedItem(state,next.slot);
 const existing=current?itemStats(current):root.EmberEquipment?.items?.[state.armorEquipped?.[next.slot]]||{hp:0,power:0,bow:0,guard:0};
 return {next,difference:{hp:next.hp-(existing.hp||0),power:next.power-(existing.power||0),bow:next.bow-(existing.bow||0),guard:next.guard-(existing.guard||0)}};
}
root.EmberLoot={rarity,affixes,bases,slots,maxInventory,clean,readItem,itemStats,equippedItem,bonuses,generate,receive,roll,pickup,equip,sell,comparison};
})(typeof window==='undefined'?globalThis:window);
