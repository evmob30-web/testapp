/* Three local characters, one atomic roster write and a preserved legacy save. */
(function(root){
'use strict';
const key='emberwild-characters-v1',legacyKey='emberwild-save-v1',limit=3;
const copy=value=>JSON.parse(JSON.stringify(value));
function name(value){return typeof value==='string'?Array.from(value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()).slice(0,24).join('')||'Aerin':'Aerin';}
function open({storage=()=>root.localStorage,restore=root.RPG.restore}={}){
 let data={version:1,active:null,slots:[null,null,null]},expected=null,persistent=true,locked=false,message='',migrated=false;
 function unavailable(){persistent=false;message='Opslaan is geblokkeerd. Je personages blijven alleen tijdens deze sessie bewaard.';}
 function conflict(){locked=true;message='De personageopslag is in een ander tabblad gewijzigd. Herlaad de game om verder te spelen.';return false;}
 function parse(raw){
  const value=JSON.parse(raw);
  if(!value||value.version!==1||!Array.isArray(value.slots)||value.slots.length!==limit)throw Error('Invalid roster');
  const slots=value.slots.map(entry=>{if(entry===null)return null;if(!entry||typeof entry!=='object'||!entry.state)throw Error('Invalid character');return {name:name(entry.name),state:restore(entry.state)};});
  const active=Number.isInteger(value.active)&&slots[value.active]?value.active:slots.findIndex(Boolean);
  return {version:1,active:active<0?null:active,slots};
 }
 function commit(next){
  if(locked)return false;
  const raw=JSON.stringify(next);
  try{
   const target=storage();if(target.getItem(key)!==expected)return conflict();
   if(raw!==expected)target.setItem(key,raw);expected=raw;persistent=true;message='';
  }catch{unavailable();}
  data=next;return true;
 }
 try{
  expected=storage().getItem(key);
  if(expected!==null)data=parse(expected);
  else{
   const old=storage().getItem(legacyKey);
   if(old!==null){
    try{data.slots[0]={name:'Aerin',state:restore(old)};data.active=0;migrated=true;commit(copy(data));}
    catch{message='Je oude save kon niet worden gelezen. Het originele bestand is bewaard.';}
   }
  }
 }catch(error){
  if(expected!==null){locked=true;message='Je personageopslag kan niet worden gelezen. De bestaande gegevens blijven bewaard.';}
  else unavailable();
 }
 function valid(index){return Number.isInteger(index)&&index>=0&&index<limit;}
 function create(index,title,state){if(!valid(index)||data.slots[index]||locked)return false;const next=copy(data);next.slots[index]={name:name(title),state:restore(state)};next.active=index;return commit(next);}
 function activate(index){if(!valid(index)||!data.slots[index])return false;const next=copy(data);next.active=index;return commit(next);}
 function load(index=data.active){return valid(index)&&data.slots[index]?restore(copy(data.slots[index].state)):null;}
 function save(state,title){if(!valid(data.active)||!data.slots[data.active]||locked)return false;const next=copy(data);next.slots[data.active]={name:title===undefined?data.slots[data.active].name:name(title),state:restore(state)};return commit(next);}
 function remove(index){if(!valid(index)||!data.slots[index]||locked)return false;const next=copy(data);next.slots[index]=null;if(next.active===index){const first=next.slots.findIndex(Boolean);next.active=first<0?null:first;}return commit(next);}
 function external(raw){return raw===expected?false:!conflict();}
 return {create,activate,load,save,remove,external,snapshot:()=>copy(data),get active(){return data.active;},get name(){return data.slots[data.active]?.name||'Aerin';},get persistent(){return persistent;},get locked(){return locked;},get message(){return message;},get migrated(){return migrated;}};
}
root.EmberCharacters={key,legacyKey,limit,name,open};
})(typeof window==='undefined'?globalThis:window);
