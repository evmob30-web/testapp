/* Accessible, lightweight character cards; no additional WebGL renderers. */
(function(root){
'use strict';
function create(doc,actions){
 const $=id=>doc.getElementById(id);let selectedDelete=null,snapshot=null;
 const icons={guardian:'♜',ranger:'➶',mage:'✦'};
 function element(tag,style,text){const node=doc.createElement(tag);node.className=style;if(text!==undefined)node.textContent=text;return node;}
 function button(id,style,text,fn,disabled){const node=element('button',style,text);node.type='button';node.id=id;node.disabled=disabled;node.onclick=fn;return node;}
 function cancelDelete(){const previous=selectedDelete;selectedDelete=null;$('character-delete-confirm').hidden=true;if(previous!==null)$('character-delete-'+previous)?.focus?.();}
 function askDelete(index){
  if(!snapshot?.slots[index])return;selectedDelete=index;
  $('character-delete-name').textContent=snapshot.slots[index].name;
  $('character-delete-confirm').hidden=false;$('character-delete-cancel').focus?.();
 }
 function render(data,{locked=false,message='',canReturn=false,current=null}={}){
  snapshot=data;cancelDelete();$('character-slots').replaceChildren();
  for(let index=0;index<3;index++){
   const entry=data.slots[index],card=element('article','character-slot '+(entry?entry.state.classId:'empty'));
   card.appendChild(element('small','character-number','PERSONAGE '+(index+1)));
   if(entry){
    const c=root.RPG.classConfig(entry.state);
    card.appendChild(element('div','character-emblem',icons[c.id]));card.appendChild(element('h3','',entry.name));
    card.appendChild(element('p','character-class',c.name+' · Niveau '+entry.state.level));
    card.appendChild(element('p','character-region',entry.state.area==='roots'?'De Wortelgrotten':'De Schemervallei'));
    card.appendChild(element('p','character-quest',root.RPG.questText(entry.state)[0]));
    card.appendChild(element('span','character-current',current===index?'Je huidige personage':data.active===index?'Laatst gespeeld':'Eigen avontuur'));
    card.appendChild(button('character-play-'+index,'primary','Verder spelen →',()=>actions.play(index),locked));
    card.appendChild(button('character-delete-'+index,'quiet character-delete','Verwijderen',()=>askDelete(index),locked));
   }else{
    card.appendChild(element('div','character-emblem','+'));card.appendChild(element('h3','','Een nieuw verhaal'));
    card.appendChild(element('p','character-class','Kies een class en uiterlijk'));
    card.appendChild(element('p','character-quest','Begin een eigen avontuur in de Schemervallei.'));
    card.appendChild(button('character-create-'+index,'primary','Maak personage →',()=>actions.create(index),locked));
   }
   $('character-slots').appendChild(card);
  }
  $('character-storage').textContent=message||'Elk personage heeft eigen quests, uitrusting en voortgang. Opgeslagen in deze browser.';
  $('character-back').textContent=canReturn?'Terug naar pauze':'Terug';$('character-back').disabled=locked;
  const first=data.active??0;$(data.slots[first]?'character-play-'+first:'character-create-'+first).focus?.();
 }
 $('character-back').onclick=actions.back;
 $('character-delete-cancel').onclick=cancelDelete;
 $('character-delete-accept').onclick=()=>{const index=selectedDelete;cancelDelete();if(index!==null)actions.remove(index);};
 function escape(){if(selectedDelete!==null)cancelDelete();else actions.back();}
 function tab(event){
  const panel=$(selectedDelete!==null?'character-delete-confirm':'characters'),buttons=Array.from(panel.querySelectorAll('button')).filter(b=>!b.disabled);
  if(!buttons.length)return;const first=buttons[0],last=buttons[buttons.length-1];
  if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
 }
 return {render,askDelete,cancelDelete,escape,tab};
}
root.EmberCharacterMenu={create};
})(typeof window==='undefined'?globalThis:window);
