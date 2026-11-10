(function(){
'use strict';
const $=id=>document.getElementById(id),canvas=$('world');let renderer,world;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;world=EmberWorld.createWorld();}catch(error){$('fatal').hidden=false;const details=error&&error.message?error.message:String(error);$('fatal').textContent='Emberwild kon de 3D-wereld niet starten: '+details+' — Herlaad de pagina met Ctrl+F5. Als het probleem blijft, geef deze foutmelding door.';console.error('Emberwild startfout:',error);return;}
const exploration=EmberExplore.create(world);
const archery=EmberArchery.create(world);
const dungeon=EmberDungeon.create(world);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,180),keys=new Set(),raycaster=new THREE.Raycaster();let state=RPG.fresh(),storageOK=true,hasSession=false,currentSlot=null,draftSlot=null,mode='start',last=0,time=0,yaw=0,pitch=.48,distance=10,attackCD=0,magicCD=0,swing=0,healCD=0,toastTime=0,saveTime=0,hudTime=0,drag=null,moved=false,dialogAction=null,target=null,near=null;
const combat=EmberCombat.create(),combo=EmberCombat.createCombo(),projectiles=[],arrows=[];let meleeStrike=null,charging=false,charge=0,selectedClass='guardian',selectionReturn='start',editingAppearance=false,selectedSkin='classic',selectedAppearance=RPG.defaultAppearance(),creatorPreview=null;const aimMouse=new THREE.Vector2(),aimRay=new THREE.Raycaster(),aimPoint=new THREE.Vector3(),aimPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.5);let mouseX=innerWidth/2,mouseY=innerHeight/2;
const characters=EmberCharacters.open();
const characterMenu=EmberCharacterMenu.create(document,{play:begin,create:index=>chooseClass('characters',index),remove:removeCharacter,back:closeCharacters});
$('play').textContent='Kies je personage →';$('new').textContent='Personages kiezen';
$('storage-reload').onclick=()=>location.reload();updateStorageNotice();
addEventListener('storage',e=>{if((e.key===EmberCharacters.key||e.key===null)&&characters.external(e.newValue)){cancelCharge();showCharacters(false);}});
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function toast(text){$('toast').textContent=text;$('toast').style.opacity='1';toastTime=4;}
function updateStorageNotice(){
 storageOK=characters.persistent;
 $('storage-notice').hidden=!characters.message;
 $('storage-message').textContent=characters.message;
 $('storage-reload').hidden=!characters.locked;
}
function save(title){
 if(!hasSession)return false;
 const wasPersistent=storageOK,result=characters.save(state,title);updateStorageNotice();
 if(wasPersistent&&!storageOK)toast(characters.message);
 if(characters.locked&&mode!=='characters')showCharacters(false);
 return result;
}
function showCharacters(saveCurrent=true){world.setConversation(false);
 if(hasSession&&saveCurrent)save();
 cancelCharge();keys.clear();drag=null;dialogAction=null;mode='characters';
 $('overlay').hidden=true;$('class-select').hidden=true;$('dialog').hidden=true;$('inventory').hidden=true;$('hud').hidden=true;$('characters').hidden=false;
 updateStorageNotice();characterMenu.render(characters.snapshot(),{locked:characters.locked,message:characters.message,canReturn:hasSession,current:currentSlot});
}
function closeCharacters(){
 if(characters.locked)return;
 characterMenu.cancelDelete();$('characters').hidden=true;
 if(hasSession){mode='playing';$('hud').hidden=false;pause();}
 else{mode='start';$('overlay').hidden=false;$('hud').hidden=true;$('title').textContent='Emberwild';$('intro-text').textContent='Er dooft iets in het hart van het woud. Vind de vonken. Bescherm de vallei.';$('play').textContent='Kies je personage →';$('new').hidden=true;}
}
function removeCharacter(index){
 if(!characters.remove(index)){updateStorageNotice();return;}
 if(index===currentSlot){hasSession=false;currentSlot=null;target=null;}
 showCharacters(false);
}
function cancelCharge(cancelMelee=true){charging=false;charge=0;if(cancelMelee)meleeStrike=null;}
function loadout(){EmberLoot.clean(state);EmberEquipment.syncRewards(state);world.setWeapon(state.equipped,state.weapon);world.setClass(state.classId);world.setAppearance(state.skinId,state.classId,state.appearance);world.setArmor(state);archery.sync(state);}
function syncQuestObjects(){const v=RPG.questVisibility(state);dungeon.sync(state);exploration.sync(state);archery.sync(state);for(const e of world.enemies)e.mesh.visible=RPG.enemyVisible(state,e);for(const c of world.crystals)c.mesh.visible=state.area==='valley'&&v.crystals&&!state.crystals.includes(c.id);world.sigil.visible=state.area==='valley'&&(v.forestBoss||v.dungeon);if(target&&!target.mesh.visible)target=null;}
function sync(){world.resetActors();cancelCharge();for(const a of arrows)world.scene.remove(a.mesh);arrows.length=0;dungeon.setArea(state.area);dungeon.sync(state);exploration.sync(state);if(state.area==='roots'&&!EmberDungeon.canStand(state.x,state.z,state.gateOpen)){state.x=100;state.z=14;}combat.remaining=0;combat.cooldown=0;EmberCombat.resetCombo(combo);for(const p of projectiles)world.scene.remove(p.mesh);projectiles.length=0;world.player.model.rotation.x=0;loadout();world.setAmulet(state.amulet&&state.amuletEquipped);world.player.group.position.set(state.x,0,state.z);world.player.resetMotion?.();for(const e of world.enemies){e.mesh.visible=(e.area||'valley')===state.area&&!state.kills.includes(e.id);e.hp=e.max;e.mesh.position.set(e.homeX,0,e.homeZ);e.attack=1;e.windup=0;e.stagger=0;e.chill=0;if(e.chillHalo)e.chillHalo.visible=false;e.alertTimer=0;e.focusUntil=0;e.pendingAttack=null;e.telegraph=0;e.dodgeTime=0;e.dodgeCooldown=0;e.dodgeVector=null;if(e.warningMesh)e.warningMesh.visible=false;e.mesh.rotation.x=0;e.mesh.rotation.z=0;e.mesh.scale.setScalar(1);e.flash=0;e.lastX=e.homeX;e.lastZ=e.homeZ;}for(const c of world.crystals)c.mesh.visible=state.area==='valley'&&!state.crystals.includes(c.id);world.chest.visible=state.area==='valley'&&!state.chest;world.warning.visible=false;world.syncLoot(state);syncQuestObjects();}
function begin(index){
 if(!characters.activate(index)){showCharacters(false);return;}
 const next=characters.load(index);if(!next)return;
 EmberAudio.unlock();state=next;hasSession=true;currentSlot=index;
 world.clearLoot();sync();mode='playing';keys.clear();target=null;near=null;drag=null;dialogAction=null;saveTime=hudTime=0;
 $('overlay').hidden=true;$('characters').hidden=true;$('class-select').hidden=true;$('dialog').hidden=true;$('inventory').hidden=true;$('hud').hidden=false;characterMenu.cancelDelete();
 canvas.focus?.({preventScroll:true});attackCD=magicCD=healCD=swing=0;EmberCombat.resetCombo(combo);yaw=0;pitch=.48;camera.position.set(state.x,7,state.z+10);camera.lookAt(state.x,1.8,state.z);updateHud();save();
 toast('Welkom'+(state.quest>0?' terug':'')+', '+characters.name+'. '+(state.quest===0?'Zoek Elin in Lindehaard.':'Je avontuur gaat verder.'));
}
$('play').onclick=()=>mode==='paused'?resume():showCharacters();$('new').onclick=()=>showCharacters();
function selectClass(id){const c=RPG.classConfig(id);selectedClass=c.id;for(const candidate of Object.values(RPG.classes))$('class-'+candidate.id).setAttribute('aria-pressed',String(candidate.id===c.id));$('class-start').textContent='Begin als '+c.name;world.setClass(c.id);world.setWeapon('starter',c.starter);archery.bow.visible=c.starter==='bow';refreshCreator();}
function initializeCreator(){
 if(creatorPreview)return;
 try{creatorPreview=EmberAppearance.createPreview(THREE,$('creator-canvas'));}
 catch(error){console.warn('De 3D-preview is niet beschikbaar:',error);$('creator-preview-error').hidden=false;}
}
function refreshCreator(){
 if(creatorPreview)creatorPreview.select(selectedSkin,selectedAppearance,selectedClass);
}
function showCreatorValues(){
 $('appearance-skin').value=selectedSkin;
 for(const key of Object.keys(RPG.defaultAppearance()))$('appearance-'+key).value=selectedAppearance[key];
 refreshCreator();
}
function chooseClass(from,index){
 if(!Number.isInteger(index)||index<0||index>=EmberCharacters.limit||characters.snapshot().slots[index]||characters.locked)return;draftSlot=index;
 $('character-name').value='Aerin';
 editingAppearance=false;selectionReturn=from;mode='class-select';cancelCharge();keys.clear();drag=null;
 selectedSkin='classic';selectedAppearance=RPG.defaultAppearance();
 $('characters').hidden=true;
 $('class-options').hidden=false;$('class-headline').textContent='Kies je class en uiterlijk';
 $('class-caption').textContent='Je class bepaalt je vaardigheden. Je uiterlijk is cosmetisch en verandert je stats niet.';
 $('overlay').hidden=true;$('dialog').hidden=true;$('class-select').hidden=false;
 initializeCreator();selectClass('guardian');showCreatorValues();$('class-'+selectedClass).focus?.();
}
function editAppearance(){
 if(mode!=='inventory')return;
 $('character-name').value=characters.name;editingAppearance=true;selectionReturn='inventory';mode='class-select';cancelCharge();keys.clear();
 selectedSkin=state.skinId;selectedAppearance=RPG.normalizeAppearance(state.appearance);selectedClass=state.classId;
 $('inventory').hidden=true;$('class-options').hidden=true;
 $('class-headline').textContent='Pas je uiterlijk aan';
 $('class-caption').textContent='Verander je kapsel en kleuren. Je klasse en avontuur blijven hetzelfde.';
 $('class-select').hidden=false;initializeCreator();showCreatorValues();
 $('class-start').textContent='Bewaar uiterlijk';
}
function closeClass(){
 loadout();$('class-select').hidden=true;
 if(selectionReturn==='characters')showCharacters(false);
 else resume();
 editingAppearance=false;
}
for(const key of ['skin',...Object.keys(RPG.defaultAppearance())]){
 const control=$('appearance-'+key);
 control.onchange=()=>{
  if(key==='skin')selectedSkin=control.value==='flame_guardian'?'flame_guardian':'classic';
  else selectedAppearance=RPG.normalizeAppearance({...selectedAppearance,[key]:control.value});
  refreshCreator();
 };
}
$('creator-left').onclick=()=>creatorPreview?.rotate(-Math.PI/6);
$('creator-right').onclick=()=>creatorPreview?.rotate(Math.PI/6);
$('customize').onclick=editAppearance;
for(const c of Object.values(RPG.classes)){const b=document.createElement('button');b.type='button';b.id='class-'+c.id;b.className='class-card';b.setAttribute('aria-pressed','false');const name=document.createElement('strong');name.textContent=c.name;const description=document.createElement('span');description.textContent=c.description;const stats=document.createElement('small');stats.textContent=c.hp+' gezondheid · '+c.loadoutDescription;b.appendChild(name);b.appendChild(description);b.appendChild(stats);b.onclick=()=>selectClass(c.id);$('class-options').appendChild(b);}
$('class-start').onclick=()=>{
 if(mode!=='class-select'||characters.locked)return;
 if(editingAppearance){state.skinId=selectedSkin;state.appearance=RPG.normalizeAppearance(selectedAppearance);save($('character-name').value);closeClass();loadout();updateHud();return;}
 const next=RPG.fresh(selectedClass);next.skinId=selectedSkin;next.appearance=RPG.normalizeAppearance(selectedAppearance);
 if(!characters.create(draftSlot,$('character-name').value,next)){showCharacters(false);return;}
 begin(draftSlot);
};$('class-back').onclick=closeClass;
function switchWeapon(requested=null){if(mode!=='playing'&&mode!=='inventory')return;cancelCharge();EmberCombat.resetCombo(combo);drag=null;const available=RPG.weapons(state),next=typeof requested==='string'?requested:available[(available.indexOf(state.weapon)+1)%available.length];if(available.length<2||!RPG.setWeapon(state,next)){toast('Vraag Elin naar boogtraining om de boog te leren.');return;}loadout();updateHud();if(mode==='inventory')renderInventory();save();}
$('weapon-toggle').onclick=()=>switchWeapon();$('bow-equip').onclick=()=>switchWeapon(state.weapon==='bow'?(state.classId==='mage'?'staff':'sword'):'bow');
$('staff-equip').onclick=()=>{if(mode!=='inventory'||!RPG.setWeapon(state,'staff'))return;cancelCharge();EmberCombat.resetCombo(combo);loadout();renderInventory();updateHud();save();};
function pause(){if(mode!=='playing')return;cancelCharge();drag=null;mode='paused';keys.clear();save();if(characters.locked)return;$('overlay').hidden=false;$('title').textContent='Even rust';$('intro-text').textContent=characters.persistent?'De vallei wacht op je. Je voortgang is bewaard bij '+characters.name+'.':characters.message;$('play').textContent='Verder spelen →';$('new').hidden=false;$('save-info').textContent=characters.name+' · '+RPG.classConfig(state).name+' · Niveau '+state.level;}
function resume(){world.setConversation(false);if(!hasSession||characters.locked){showCharacters(false);return;}EmberAudio.unlock();$('characters').hidden=true;$('hud').hidden=false;$('class-select').hidden=true;mode='playing';keys.clear();$('overlay').hidden=true;$('dialog').hidden=true;$('inventory').hidden=true;canvas.focus?.({preventScroll:true});}
$('pause').onclick=()=>mode==='playing'?pause():mode==='paused'?resume():null;
function showDialog(speaker,title,text,action,fn){const name=speaker.split(' ·')[0].toLowerCase(),npc=world.npcActors.has(name)?name:null;world.setConversation(npc);$('dialog').setAttribute('data-speaker',npc||'other');$('hud').hidden=!!npc;if(npc){toastTime=0;$('toast').style.opacity='0';}cancelCharge();drag=null;$('dialog-extra').hidden=true;$('dialog-extra').onclick=null;mode='dialog';if(npc)updateConversationCamera(1);keys.clear();$('overlay').hidden=true;$('speaker').textContent=speaker;$('dialog-title').textContent=title;$('dialog-text').textContent=text;$('dialog-action').textContent=action;$('dialog').hidden=false;dialogAction=fn;}
$('dialog-close').onclick=resume;$('dialog-action').onclick=()=>{const action=dialogAction;dialogAction=null;resume();if(action)action();updateHud();save();};
function renderLoot(){
 const bag=$('loot-bag');bag.replaceChildren();
 $('loot-count').textContent='Verzameld: '+state.lootBag.length+' / '+EmberLoot.maxInventory+' · Kleuren geven zeldzaamheid aan';
 for(const item of state.lootBag){
  const stats=EmberLoot.itemStats(item),compare=EmberLoot.comparison(state,item);
  if(!stats||!compare)continue;
  const row=document.createElement('div');row.className='loot-entry';row.style.borderLeft='4px solid '+stats.color;
  const title=document.createElement('div');title.className='loot-title';
  title.textContent=(state.lootEquipped[stats.slot]===item.uid?'✓ ':'')+stats.name+' · '+EmberEquipment.slots[stats.slot];row.appendChild(title);
  const desc=document.createElement('div');desc.className='loot-detail';
  desc.textContent='+'+stats.hp+' HP · +'+stats.power+' schade · +'+stats.bow+' boogschade · '+stats.guard+'% bescherming';
  row.appendChild(desc);
  const diff=document.createElement('div');diff.className='loot-compare';
  const d=compare.difference;diff.textContent='Verschil met uitgerust: '+['hp','power','bow','guard'].map((k,i)=>(d[k]>=0?'+':'')+d[k]+' '+['HP','schade','boog','bescherming'][i]).join(' · ');
  row.appendChild(diff);
  const equip=document.createElement('button');equip.type='button';equip.className='armor-item';
  equip.textContent=state.lootEquipped[stats.slot]===item.uid?'Leg af':'Rust uit';
  equip.onclick=()=>{if(EmberLoot.equip(state,item.uid)){state.hp=Math.min(state.hp,RPG.maxHp(state));world.setArmor(state);renderInventory();updateHud();save();EmberAudio.play('loot');}};
  row.appendChild(equip);
  const sell=document.createElement('button');sell.type='button';sell.className='armor-item loot-sell';
  sell.textContent='Verkoop ('+({common:12,rare:35,epic:90,legendary:220}[item.rarity])+' goud)';
  sell.disabled=state.lootEquipped[stats.slot]===item.uid;
  sell.onclick=()=>{const value=EmberLoot.sell(state,item.uid);if(value){renderInventory();updateHud();save();toast('Uitrusting verkocht · +'+value+' goud');}};
  row.appendChild(sell);bag.appendChild(row);
 }
 if(!bag.children.length)bag.textContent='Nog geen buit. Versla vijanden en pak hun gloeiende drops op met E.';
}
function renderArmor(){
 EmberEquipment.syncRewards(state);
 const slots=$('armor-slots'),bag=$('armor-bag'),shop=$('armor-shop');
 slots.replaceChildren();bag.replaceChildren();shop.replaceChildren();
 const bonus=EmberEquipment.bonuses(state);
 $('armor-stats').textContent='Pantserbonus: +'+bonus.hp+' maximale gezondheid · +'+bonus.power+' schade';
 for(const [slot,title] of Object.entries(EmberEquipment.slots)){
   const id=state.armorEquipped[slot],item=id?EmberEquipment.items[id]:null;
   const button=document.createElement('button');button.type='button';button.className='armor-slot';
   button.textContent=title+' · '+(item?item.name+' (+ '+item.hp+' HP / '+item.power+' schade)':'Leeg');
   button.disabled=!id;
   button.title=id?'Klik om dit pantserstuk af te doen':'Geen pantser uitgerust';
   button.onclick=()=>toggleArmor(id);
   slots.appendChild(button);
 }
 for(const id of state.armorOwned){
   const item=EmberEquipment.items[id];if(!item)continue;
   const button=document.createElement('button');button.type='button';button.className='armor-item';
   button.textContent=(state.armorEquipped[item.slot]===id?'✓ ':'')+item.name+' · '+EmberEquipment.slots[item.slot]+' · +'+item.hp+' HP / +'+item.power+' schade';
   button.onclick=()=>toggleArmor(id);bag.appendChild(button);
 }
 for(const [id,item] of Object.entries(EmberEquipment.items)){
   if(state.armorOwned.includes(id))continue;
   const button=document.createElement('button');button.type='button';button.className='armor-item armor-buy';
   button.textContent=item.name+' · '+item.price+' goud · '+EmberEquipment.slots[item.slot];
   button.disabled=state.gold<item.price;
   button.onclick=()=>{if(EmberEquipment.buy(state,id)){EmberAudio.play('loot');save();renderInventory();updateHud();toast(item.name+' gekocht!');}};
   shop.appendChild(button);
 }
 if(!shop.children.length)shop.textContent='Alle pantserstukken verzameld!';
}
function toggleArmor(id){
 if(!EmberEquipment.equip(state,id))return;
 state.hp=Math.min(state.hp,RPG.maxHp(state));
 world.setArmor(state);renderInventory();updateHud();save();EmberAudio.play('loot');
}
function renderInventory(){
 $('items').textContent=RPG.classConfig(state).name+' · '+RPG.weaponName(state)+' · '+(state.weapon==='staff'?RPG.spellDamage(state):state.weapon==='bow'?RPG.arrowDamage(state,0)+'–'+RPG.arrowDamage(state,1.2):RPG.damage(state))+' schade';$('bow-equip').hidden=!state.bowUnlocked;$('bow-equip').textContent=state.weapon==='bow'?(state.classId==='mage'?'Rust je staf uit · F':'Rust je zwaard uit · F'):'Rust '+RPG.bowName(state)+' uit · F';
 $('staff-equip').hidden=state.classId!=='mage';$('staff-equip').disabled=state.weapon==='staff';$('staff-equip').textContent='Rust '+RPG.staffName(state)+' uit · '+RPG.spellDamage(state)+' spreukschade';
 const lines=[...state.classId==='mage'?['✧ '+RPG.staffName(state)+' · '+RPG.spellDamage(state)+' spreukschade · '+Math.floor(state.mana)+' / '+RPG.maxMana(state)+' mana','❄ Vrieskring · 24 mana · Vertraagt nabije vijanden · 8 s afkoeltijd']:[],...state.bowUnlocked?['➶ '+RPG.bowName(state)+' · '+RPG.arrowDamage(state,0)+'–'+RPG.arrowDamage(state,1.2)+' schade · Houd klik / 1 vast']:[],'🍃 Kruiden · '+state.herbs+' (Bram maakt van 3 kruiden een levensdrank)','✧ '+RPG.classConfig(state).skill.name+' · '+(RPG.classConfig(state).skill.kind==='frost'?Math.round(RPG.spellDamage(state)*.75):RPG.classConfig(state).skill.kind==='arrow'?RPG.arrowDamage(state,1.2)+RPG.classConfig(state).skill.bonus:RPG.damage(state)+RPG.classConfig(state).skill.bonus)+' schade','♥ Levensdranken · '+state.potions,'◈ Goud · '+state.gold,'◇ Lichtkristallen · '+state.crystals.length+' / 3'];
 if(state.shrineBlessing)lines.push('✺ Woudzegen · permanent +20 maximale gezondheid');
 if(state.amulet)lines.push('❖ Hartamulet · +40 maximale gezondheid · +8 schade'+(state.amuletEquipped?' · Uitgerust':''));
 $('skin-toggle').textContent=state.skinId==='flame_guardian'?'Uiterlijk: Flame Guardian ✦ (wissel naar klassiek)':'Uiterlijk: Klassiek (wissel naar Flame Guardian ✦)';
 $('amulet-equip').hidden=!state.amulet;$('amulet-equip').textContent=state.amuletEquipped?'Leg het Hartamulet af':'Rust het Hartamulet uit · +40 HP / +8 schade';
 if(state.kills.includes('boss'))lines.push('✦ Doornlicht · Uniek eindbaaswapen · +18 schade'+(state.equipped==='thorn'?' · Uitgerust':''));
 for(const text of lines){const row=document.createElement('div');row.textContent=text;$('items').appendChild(row);}
 $('equip').hidden=!state.kills.includes('boss');$('equip').textContent=state.equipped==='thorn'?'Rust je vorige zwaard uit':'Rust Doornlicht uit · +18 schade';
 renderArmor();renderLoot();
 $('records').textContent='Niveau '+state.level+' · '+state.xp+' / '+state.level*60+' ervaring. '+(storageOK?'Voortgang wordt lokaal opgeslagen.':'Opslag is geblokkeerd.');
}
function inventory(){if(mode!=='playing'&&mode!=='inventory')return;if(mode==='inventory'){resume();return;}mode='inventory';cancelCharge();drag=null;keys.clear();$('inventory').hidden=false;renderInventory();}
$('equip').onclick=()=>{if(RPG.equip(state,state.equipped==='thorn'?'starter':'thorn')){loadout();renderInventory();updateHud();save();EmberAudio.play('loot');}};
$('skin-toggle').onclick=()=>{state.skinId=state.skinId==='flame_guardian'?'classic':'flame_guardian';loadout();renderInventory();save();toast(state.skinId==='flame_guardian'?'Flame Guardian uitgerust!':'Klassiek uiterlijk uitgerust.');};
$('amulet-equip').onclick=()=>{if(RPG.equipAmulet(state,!state.amuletEquipped)){world.setAmulet(state.amuletEquipped);renderInventory();updateHud();save();EmberAudio.play('loot');}};
function soundButton(){$('sound').textContent=EmberAudio.muted?'Geluid uit':'Geluid aan';$('sound').setAttribute('aria-pressed',String(EmberAudio.muted));}
$('sound').onclick=()=>{EmberAudio.toggle();soundButton();};soundButton();
addEventListener('pointerdown',()=>{EmberAudio.unlock();},{passive:true});
$('inventory-button').onclick=inventory;$('inventory-close').onclick=resume;
function nearestEnemy(range){let found=null,best=range;for(const e of world.enemies){if(!e.mesh.visible||e.boss&&state.quest<3)continue;const d=Math.hypot(e.mesh.position.x-state.x,e.mesh.position.z-state.z);if(d<best){best=d;found=e;}}return found;}
function hit(e,amount,dx=e.mesh.position.x-state.x,dz=e.mesh.position.z-state.z,ranged=false){if(!RPG.enemyVisible(state,e))return;EmberEnemyAI.notifyHit(e,world.enemies,state.x,state.z);if(ranged){target=e;e.focusUntil=time+2.5;}const oldLevel=state.level;e.hp=Math.max(0,e.hp-amount);
 world.burst(e.mesh.position.x,e.mesh.position.z,e.spirit?'#ddc7ff':'#ffbf87',e.boss?10:7);
 world.magicImpact?.(e.mesh.position.x,e.mesh.position.z,e.spirit?'#d7b7ff':'#ffb45e',e.boss?.8:.52);
 world.damageText(amount,e.mesh.position.x,e.mesh.position.z);
 EmberAudio.play('hit');
 e.visual?.hit(dx,dz);if(e.id==='boss')world.barkBurst(e.mesh.position.x,e.mesh.position.z);e.flash=.22;e.stagger=e.boss?0:.16;if(!e.boss&&!ranged){e.pendingAttack=null;e.telegraph=0;}
 const angle=Math.atan2(dx,dz)-e.mesh.rotation.y;e.hitTiltX=Math.cos(angle);e.hitTiltZ=-Math.sin(angle);if(e.hp===0){e.visual?.defeat?.(world.scene);e.mesh.visible=false;RPG.kill(state,e.id);const drop=EmberLoot.roll(state,e);if(drop){world.syncLoot(state);world.burst(drop.x,drop.z,EmberLoot.rarity[drop.rarity].color,9);}const l=RPG.loot(e.id);toast(RPG.enemyName(e)+' verslagen · +'+l.xp+' XP · +'+l.gold+' goud');if(state.level>oldLevel){world.burst(state.x,state.z,'#b5f3d2',24);toast('Niveau '+state.level+'! Je gezondheid is volledig hersteld.');}if(e.boss){world.warning.visible=false;EmberAudio.play('loot');toast(e.rootBoss?'De Wortelmoeder is verslagen! Neem het Hartamulet van het altaar.':'Unieke buit: Doornlicht! Open je inventaris met I om het wapen uit te rusten.');save();}else save();}updateHud();}
function updateAim(){aimMouse.set(mouseX/innerWidth*2-1,-mouseY/innerHeight*2+1);aimRay.setFromCamera(aimMouse,camera);if(!aimRay.ray.intersectPlane(aimPlane,aimPoint))aimPoint.set(state.x+aimRay.ray.direction.x*20,1.5,state.z+aimRay.ray.direction.z*20);let closest=Infinity;for(const item of [...world.enemies.filter(e=>e.mesh.visible),...archery.targets.filter(t=>state.weapon==='bow'&&state.area==='valley'&&RPG.questVisibility(state).bow&&t.mesh.visible)]){const hit=aimRay.intersectObject(item.mesh,true)[0];if(hit&&hit.distance<closest){closest=hit.distance;aimPoint.set(item.mesh.position.x,1.5,item.mesh.position.z);}}}
function startCharge(){if(mode!=='playing'||state.weapon!=='bow'||combat.remaining>0||attackCD>0||charging)return;charging=true;charge=0;updateAim();}
// Start at the visible weapon, but include the hand-to-player gap in the first
// collision sweep so a nearby wall/enemy cannot be skipped by the longer rig.
function launch(mesh,start,x,z,speed,range,properties){
 let dx=x-start.x,dz=z-start.z,len=Math.hypot(dx,dz);
 if(len<.15){dx=Math.sin(world.player.group.rotation.y);dz=Math.cos(world.player.group.rotation.y);len=1;}
 dx/=len;dz/=len;mesh.position.copy(start);mesh.rotation.set(Math.atan2(start.y-1.5,len),Math.atan2(dx,dz),0,'YXZ');
 arrows.push({...properties,mesh,x:start.x,z:start.z,fromX:state.x,fromZ:state.z,vx:dx*speed,vz:dz*speed,startY:start.y,heightDistance:len,travelled:0,life:Math.max(.02,range-Math.hypot(start.x-state.x,start.z-state.z))/speed});
}
function shoot(dx,dz,power,magical=false,bonus=0){
 const len=Math.hypot(dx,dz);if(len<.01)return;
 world.player.group.position.set(state.x,0,state.z);world.player.group.rotation.y=Math.atan2(dx,dz);
 let start;
 if(state.weapon==='bow'){archery.prepareShot(power/1.2,Math.atan2(.85,Math.max(1,len)));start=archery.muzzle();}
 else start=world.player.palmWorld('l');
 const mesh=archery.arrow(start.x,start.z,dx/len,dz/len,magical);
 launch(mesh,start,state.x+dx,state.z+dz,26,28,{damage:RPG.arrowDamage(state,power)+bonus,charge:power});
 archery.release();EmberAudio.play(magical?'magic':'bow');
}
function releaseBow(){if(!charging)return;const power=charge;cancelCharge();if(mode!=='playing'||state.weapon!=='bow'||combat.remaining>0)return;updateAim();shoot(aimPoint.x-state.x,aimPoint.z-state.z,power);attackCD=.55;updateHud();}
function projectileBlock(ox,oz,x,z){
 if(state.area==='roots'){const steps=Math.max(1,Math.ceil(Math.hypot(x-ox,z-oz)/.12));for(let k=0;k<=steps;k++)if(!EmberDungeon.canStand(ox+(x-ox)*k/steps,oz+(z-oz)*k/steps,state.gateOpen,.12))return k/steps;return Infinity;}
 let block=Infinity;for(const c of world.colliders)block=Math.min(block,EmberCombat.circleT(ox,oz,x,z,c.x,c.z,c.r+.08));return block;
}
function clearSpellLine(x,z){
 if(state.area==='roots'){
  const steps=Math.max(1,Math.ceil(Math.hypot(x-state.x,z-state.z)/.14));
  for(let i=0;i<=steps;i++)if(!EmberDungeon.canStand(state.x+(x-state.x)*i/steps,state.z+(z-state.z)*i/steps,state.gateOpen,.12))return false;
  return true;
 }
 return world.colliders.every(c=>EmberCombat.circleT(state.x,state.z,x,z,c.x,c.z,c.r+.08)===Infinity);
}
function castStaff(){
 const primary=RPG.classConfig(state).primary;if(!primary)return;
 updateAim();let dx=aimPoint.x-state.x,dz=aimPoint.z-state.z,len=Math.hypot(dx,dz);
 if(len<.15){dx=Math.sin(world.player.group.rotation.y);dz=Math.cos(world.player.group.rotation.y);len=1;}
 if(!EmberMage.spend(state,primary.cost)){toast('Te weinig mana voor Vonkbol. Je mana herstelt vanzelf.');return;}
 world.player.group.position.set(state.x,0,state.z);world.player.group.rotation.y=Math.atan2(dx,dz);world.mageView.update(0,time);
 const start=world.mageView.muzzle(),mesh=world.mageBolt(start.x,start.z);
 launch(mesh,start,state.x+dx,state.z+dz,primary.speed,primary.range,{damage:RPG.spellDamage(state),charge:0,spell:true});
 attackCD=primary.cooldown;EmberCombat.resetCombo(combo);cancelCharge();world.mageView?.cast('bolt');EmberAudio.play('spell');updateHud();
}
function castFrost(){
 const skill=RPG.classConfig(state).skill;
 if(!EmberMage.spend(state,skill.cost)){toast('Vrieskring kost '+skill.cost+' mana. Je mana herstelt vanzelf.');return;}
 magicCD=skill.cooldown;EmberCombat.resetCombo(combo);cancelCharge();world.mageView?.cast('frost');world.mageNova(state.x,state.z,skill.range);EmberAudio.play('frost');
 for(const e of EmberMage.nearby(state,world.enemies,skill.range,clearSpellLine)){
  EmberMage.chill(e);EmberMage.markChilled(THREE,e);hit(e,Math.round(RPG.spellDamage(state)*.75),e.mesh.position.x-state.x,e.mesh.position.z-state.z,true);
  if(e.mesh.visible)world.damageText('VERTRAAGD',e.mesh.position.x,e.mesh.position.z,'#a6e9ff');
 }
 updateHud();
}
function attack(magic=false){
 if(mode!=='playing'||combat.remaining>0)return;
 if(!magic&&state.weapon==='staff'){if(attackCD<=0)castStaff();return;}
 if(!magic&&state.weapon==='bow'){EmberCombat.resetCombo(combo);startCharge();releaseBow();return;}
 if(magic?magicCD>0:attackCD>0)return;
 if(magic&&RPG.classConfig(state).skill.kind==='frost'){castFrost();return;}
 const skill=RPG.classConfig(state).skill,e=nearestEnemy(magic?skill.range:3.1);
 let move=null;
 if(magic){
   if(!e){toast('Geen vijand binnen bereik van '+skill.name+'.');return;}
   EmberCombat.resetCombo(combo);cancelCharge();magicCD=skill.cooldown;
   if(skill.kind==='arrow'){
     world.magicCast?.(state.x,state.z,e.mesh.position.x,e.mesh.position.z,'#9fe6dc');
     shoot(e.mesh.position.x-state.x,e.mesh.position.z-state.z,1.2,true,skill.bonus);return;
   }
   EmberAudio.play('magic');world.beam(state.x,state.z,e.mesh.position.x,e.mesh.position.z);
   world.magicCast?.(state.x,state.z,e.mesh.position.x,e.mesh.position.z,'#ffc176');
 }else{
   move=EmberCombat.nextCombo(combo);attackCD=move.cooldown;swing=move.duration;
   if(e){target=e;world.player.group.rotation.y=Math.atan2(e.mesh.position.x-state.x,e.mesh.position.z-state.z);}
   meleeStrike={remaining:move.impact,move,enemy:e};updateHud();return;
 }
 if(e){
   target=e;const dx=e.mesh.position.x-state.x,dz=e.mesh.position.z-state.z;
   world.player.group.rotation.y=Math.atan2(dx,dz);
   const base=RPG.damage(state)+(magic?skill.bonus:0);
   hit(e,base);
 }
}
function offerBowTraining(){const button=$('dialog-extra');button.hidden=false;button.disabled=false;button.textContent=state.bowQuest===2?'Over de boog':state.bowQuest===1&&state.bowPractice.length===3?'Rond boogtraining af':'Boogtraining bij Elin';button.onclick=()=>{
 if(state.bowQuest===0)showDialog('ELIN · BOOGTRAINING','Een nieuw wapen','Probeer de boog op de drie rieten oefendoelen ten noorden van het dorp. Houd links of 1 vast tot de balk vol is, richt met de muis en laat los. Raak ieder doel met een geladen pijl en kom terug. Met rechts slepen draai je de camera.','Begin de boogtraining',()=>{RPG.acceptBow(state);loadout();toast('Boogtraining · Raak drie oefendoelen met een geladen pijl. F wisselt van wapen.');});
 else if(state.bowQuest===1&&state.bowPractice.length===3)showDialog('ELIN','Een vaste hand','Alle drie de doelen geraakt! Deze Bosboog is nu van jou. Je pijlen doen meer schade. Een Schildwacht bewaakt het oostelijke woud: beweeg naar zijn zijkant of achter hem om zijn schild te omzeilen.','Ontvang Bosboog · +50 XP en 20 goud',()=>{RPG.finishBow(state);loadout();EmberAudio.play('loot');toast('Boogtraining voltooid · Bosboog verdiend!');});
 else showDialog('ELIN','Richten en loslaten',state.bowQuest===2?'Je Bosboog blijft bij je. F wisselt tussen zwaard en boog. De Schildwacht blokkeert van voren, maar draait langzaam. Raak hem van opzij.':'Je hebt '+state.bowPractice.length+' / 3 oefendoelen geraakt. Alleen geladen pijlen tellen. Houd links of 1 vast tot de balk vol is; richt en laat los.','Verder op pad',null);
};}
function heal(){if(mode!=='playing'||healCD>0)return;if(state.hp>=RPG.maxHp(state)){toast('Je gezondheid is al volledig hersteld.');return;}if(state.potions<=0){toast('Geen levensdrank. Zoek Bram in het dorp.');return;}state.potions--;state.hp=Math.min(RPG.maxHp(state),state.hp+70);healCD=1;EmberAudio.play('heal');world.burst(state.x,state.z,'#b9edbd',16);toast('Levensdrank · +70 gezondheid');save();updateHud();}
$('dodge').onclick=()=>{EmberAudio.unlock();dodge();};$('attack').onclick=()=>attack();$('magic').onclick=()=>attack(true);$('heal').onclick=heal;
function travel(area){state.area=area;state.x=area==='roots'?100:0;state.z=area==='roots'?14:-55;keys.clear();drag=null;target=null;near=null;sync();yaw=0;pitch=area==='roots'?.6:.48;camera.position.set(state.x,7,state.z+8);updateHud();save();toast(area==='roots'?'De Wortelgrotten · Rust bij de gloeiende kring. Volg de kamers naar het noorden.':'Terug in de Schemervallei.');}
function interact(){if(mode!=='playing'||!near)return;
 if(near.startsWith('loot:')){const uid=Number(near.slice(5)),drop=state.lootDrops.find(i=>i.uid===uid&&i.area===state.area);if(!drop||Math.hypot(state.x-drop.x,state.z-drop.z)>2.5)return;const item=EmberLoot.pickup(state,uid);if(item){world.syncLoot(state);EmberAudio.play('loot');toast('Buit gevonden: '+EmberLoot.itemStats(item).name);save();updateHud();}else toast('Je reistas zit vol. Verkoop eerst een item.');return;}
 if(near==='mira'){
  if(state.sideQuest===0)showDialog('MIRA · LINDEHAARD','De vermiste kruidenzoeker','Tovin is al sinds vanochtend weg. Hij zocht kruiden in het westelijke woud. Zoek zijn blauwe lantaarn en vertel hem dat ik op hem wacht. Neem onderweg goudbloesem mee; Bram maakt er levensdranken van.','Ik zoek Tovin',()=>{RPG.acceptSide(state);exploration.sync(state);toast('Zijmissie aangenomen: De vermiste kruidenzoeker');});
  else if(state.sideQuest===2)showDialog('MIRA','Weer thuis','Daar is Tovin! Dank je dat je hem de weg terug wees. Hier zijn drie kruiden voor je volgende tocht. Tovin vertelde ook over blauwe bloemen in het noordwesten. Misschien leiden die naar iets bijzonders.','Ontvang beloning · 75 XP, 35 goud, 3 kruiden',()=>{RPG.finishSide(state);exploration.sync(state);EmberAudio.play('loot');toast('Zijmissie voltooid! Bram maakt van je kruiden een levensdrank.');});
  else showDialog('MIRA',state.sideQuest===1?'Een blauwe lantaarn':'Een warm welkom',state.sideQuest===1?'Tovin ging het westelijke bos in, voorbij de eerste wolven. Zoek zijn blauwe lantaarn.':'Dank je, reiziger. Tovin is veilig thuis. Ga eens bij Bram langs als je kruiden hebt verzameld.','Verder op pad',null);return;
 }
 if(near==='tovin'){
  if(state.sideQuest===1)showDialog('TOVIN · KRUIDENZOEKER','Verdwaald tussen de bomen','Ik verloor het pad toen ik blauwe bloemen volgde. Nu herken ik de weg naar Lindehaard weer. Zeg Mira dat ik veilig ben. Verder naar het noordwesten zag ik een oud heiligdom; blauwe bloemen wijzen de weg.','Wijs Tovin de weg naar huis',()=>{RPG.rescueTovin(state);exploration.sync(state);EmberAudio.play('loot');toast('Tovin gaat naar huis. Keer terug naar Mira in Lindehaard.');});
  else showDialog('TOVIN','De taal van het woud',state.sideQuest===0?'Mira zoekt me vast. Praat eerst met haar in Lindehaard. Ik ben in ieder geval ongedeerd.':'Volg de blauwe bloemen in het noordwesten van het woud. Daar ligt het Fluisterheiligdom. Goudbloesem kun je plukken met E; Bram kent het recept voor levensdranken.','Bedankt voor de aanwijzing',null);return;
 }
 if(near==='shrine'){
  if(!state.shrineBlessing)showDialog('HET FLUISTERHEILIGDOM','De zegen van het woud','Een zachte warmte stroomt door de oude steen. Ontvang de Woudzegen: permanent 20 extra maximale gezondheid. Je wonden worden eenmaal volledig geheeld.','Ontvang de Woudzegen',()=>{if(RPG.claimShrine(state)){exploration.sync(state);world.burst(state.x,state.z,'#b9f4d9',30);EmberAudio.play('loot');toast('Woudzegen ontvangen · +20 maximale gezondheid · +50 XP · +25 goud');}});
  else showDialog('HET FLUISTERHEILIGDOM','Het woud herinnert zich je','De Woudzegen blijft bij je. Je maximale gezondheid is permanent met 20 verhoogd.','Verder op pad',null);return;
 }
 if(RPG.herbs.some(h=>h.id===near)){if(RPG.gatherHerb(state,near)){exploration.sync(state);EmberAudio.play('gather');world.burst(state.x,state.z,'#ddedb1',6);toast('Goudbloesem geplukt · '+state.herbs+' kruiden. Bram gebruikt er 3 per levensdrank.');updateHud();save();}return;}

 if(near==='entrance'){if(state.quest!==5||state.dungeon===0)toast('Vraag Elin eerst naar de Wortelgrotten.');else travel('roots');return;}
 if(near==='exit'){travel('valley');return;}
 if(near==='root-key'){if(RPG.claimKey(state)){EmberAudio.play('loot');toast('Wortelsleutel gevonden. Open de deur in de noordelijke gang.');}else toast('De Sporenwachter beschermt de sleutel. Versla hem eerst.');dungeon.sync(state);updateHud();save();return;}
 if(near==='root-gate'){if(RPG.openGate(state)){EmberAudio.play('loot');toast('De worteldeur gaat open. De Wortelmoeder wacht in de laatste kamer.');}else toast('De deur is gesloten. Zoek de gouden sleutel in het Wortelarchief.');dungeon.sync(state);updateHud();save();return;}
 if(near==='root-altar'){if(RPG.claimAmulet(state)){world.burst(state.x,state.z,'#c9ffce',30);EmberAudio.play('loot');toast('Hartamulet gevonden! Rust het uit met I en keer terug naar Elin.');}else toast('Versla de Wortelmoeder om het Hartamulet vrij te maken.');dungeon.sync(state);updateHud();save();return;}

 if(near==='ranger'){
 const q=state.quest;
 if(q===5&&state.dungeon===0)showDialog('ELIN · WACHTER','De Wortelgrotten','Onder de noordelijke ruïne is een doorgang geopend. De Wortelmoeder vergiftigt de oude wortels. Zoek de sleutel in het Wortelarchief, open de deur en bevrijd het Hartamulet. Neem deze twee levensdranken mee.','Ik daal af · +2 levensdranken',()=>{RPG.acceptDungeon(state);dungeon.sync(state);toast('Nieuwe opdracht: De Wortelgrotten. De ingang ligt onder de noordelijke ruïne.');});
 else if(q===5&&state.dungeon===2)showDialog('ELIN','Bewaker van wortel en woud','Het Hartamulet straalt weer. Je hebt het woud boven én onder de grond gered. Draag het amulet via je inventaris: het geeft je meer gezondheid en kracht. Dit hoofdstuk is voltooid.','Voltooi Wortelgrotten · +100 XP en 50 goud',()=>{RPG.finishDungeon(state);world.burst(state.x,state.z,'#cbf7bf',32);EmberAudio.play('loot');toast('Wortelgrotten voltooid! Bewaker van wortel en woud.');});
 else if(q===0)showDialog('ELIN · WACHTER VAN LINDEHAARD','Een vonk in het duister','De wolven zijn veranderd sinds de Doornwachter ontwaakte. Help ons: versla drie schemerwolven in het noorden en kom terug. Gebruik je startwapen en je classvaardigheid met 2. Met spatie rol je uit de weg.','Ik help de vallei',()=>{RPG.advance(state);toast('Opdracht aangenomen: Schaduwen tussen de bomen');});
 else if(q===1&&RPG.wolfCount(state)>=3)showDialog('ELIN','De verloren vonken','Je hebt het pad veilig gemaakt. Zoek nu de drie lichtkristallen in het woud. Ze gloeien mintgroen en staan op je kaart. Breng ze naar mij; ik smeed hun licht in je wapens.','Ontvang beloning · +40 XP, 20 goud, 1 drank',()=>RPG.advance(state));
 else if(q===2&&state.crystals.length===3)showDialog('ELIN',state.classId==='mage'?'Een staf van sterrenlicht':'Een zwaard van sterrenlicht','Daar is het oude licht! Je wapens dragen nu sterrenlicht en je wonden zijn geheeld. De Doornwachter wacht bij de noordelijke ruïne. Ontwijk zijn oranje cirkel met spatie: tijdens de rol ben je kort beschermd.','Ontvang sterrenlicht voor je wapens',()=>{RPG.advance(state);world.burst(state.x,state.z,'#ffdda4',22);});
 else if(q===4)showDialog('ELIN','Beschermer van de vallei','Het licht is terug in Lindehaard. Dankzij jou kan het woud genezen. Dit is het einde van het eerste avontuur. Je kunt vrij blijven verkennen.','Voltooi avontuur · +80 XP en 60 goud',()=>{RPG.advance(state);world.burst(state.x,state.z,'#ffde9e',32);toast('Avontuur voltooid! Jij bent de Beschermer van de vallei.');});
 else showDialog('ELIN','De vallei rekent op je',RPG.questText(state)[1],'Verder op pad',null);offerBowTraining();
 }else if(near==='merchant'){
 showDialog('BRAM · HANDELAAR','De ketel staat klaar',!RPG.questVisibility(state).herbalist&&state.herbs===0?'Een levensdrank kost 15 goud en herstelt 70 gezondheid. Je hebt '+state.gold+' goud en '+state.potions+' dranken.':'Koop een levensdrank voor 15 goud, of maak er één van 3 kruiden, zonder goud te betalen. Een drank herstelt 70 gezondheid. Je hebt '+state.gold+' goud, '+state.herbs+' kruiden en '+state.potions+' dranken.','Koop levensdrank · 15 goud',()=>{if(state.gold<15)toast('Je hebt nog niet genoeg goud.');else{state.gold-=15;state.potions++;EmberAudio.play('gather');toast('Levensdrank gekocht.');}});
 $('dialog-extra').hidden=!RPG.questVisibility(state).herbalist&&state.herbs===0;$('dialog-extra').disabled=state.herbs<3;$('dialog-extra').textContent='Maak levensdrank · 3 kruiden';$('dialog-extra').onclick=()=>{resume();if(RPG.craftPotion(state)){EmberAudio.play('heal');toast('Levensdrank gemaakt · 3 kruiden verbruikt');}else toast('Je hebt 3 kruiden nodig.');updateHud();save();};
 }
 else if(near==='chest'){state.chest=true;state.gold+=30;state.potions++;world.chest.visible=false;world.burst(24,-10);toast('Verborgen kist · +30 goud · +1 levensdrank');save();}
 else {const c=world.crystals.find(c=>c.id===near);if(c){if(state.quest!==2){toast('Vraag Elin eerst naar de lichtkristallen.');return;}state.crystals.push(c.id);c.mesh.visible=false;world.burst(c.x,c.z,'#bcf4dd');toast('Lichtkristal gevonden · '+state.crystals.length+' / 3');save();}}updateHud();
}
function getNear(){let options;const v=RPG.questVisibility(state);const drop=state.lootDrops.find(d=>d.area===state.area&&Math.hypot(state.x-d.x,state.z-d.z)<2.5);if(drop)return 'loot:'+drop.uid;
 if(state.area==='roots'&&v.dungeon)options=[['exit',100,16.5,2.7],...(!state.caveKey?[['root-key',110,-21,2.6]]:[]),...(!state.gateOpen?[['root-gate',100,-35,3]]:[]),...(!state.amulet&&state.kills.includes('rootboss')?[['root-altar',100,-63,3]]:[])];
 else if(state.area==='valley')options=[['mira',6,25,2.8],...(v.herbalist?[['tovin',state.sideQuest>=2?9:-23,state.sideQuest>=2?27:-32,2.8]]:[]),...(v.shrine?[['shrine',-26,-48,3]]:[]),...RPG.herbs.filter(h=>v.herbalist&&!state.gathered.includes(h.id)).map(h=>[h.id,h.x,h.z,2.1]),['ranger',-3,17,3],['merchant',8,19,3],...(v.dungeon?[['entrance',0,-58.5,3]]:[]),...(!state.chest?[['chest',24,-10,2.7]]:[]),...world.crystals.filter(c=>c.mesh.visible).map(c=>[c.id,c.x,c.z,2.7])];
 let result=null,best=Infinity;for(const [id,x,z,r] of (options||[])){const d=Math.hypot(state.x-x,state.z-z);if(d<r&&d<best){best=d;result=id;}}return result;}
addEventListener('keydown',e=>{EmberAudio.unlock();if(['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName)&&e.code!=='Escape')return;if(e.target instanceof HTMLButtonElement&&(e.code==='Enter'||e.code==='Space'&&mode!=='playing'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(mode==='class-select'){if(e.code==='Escape')closeClass();return;}if(mode==='characters'){if(e.code==='Escape')characterMenu.escape();else if(e.code==='Tab')characterMenu.tab(e);return;}if(e.code==='Escape'){if(mode==='playing')pause();else if(mode!=='start')resume();return;}if(e.code==='KeyI'){inventory();return;}if(mode!=='playing')return;keys.add(e.code);if(e.code==='KeyE')interact();if(e.code==='KeyF')switchWeapon();if(e.code==='Digit1'){if(state.weapon==='bow')startCharge();else attack();}if(e.code==='Space')dodge();if(e.code==='Digit2')attack(true);if(e.code==='KeyQ')heal();});addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Digit1')releaseBow();});addEventListener('blur',()=>{keys.clear();drag=null;if(mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;mouseX=e.clientX;mouseY=e.clientY;const button=e.button??0;if(button===2)cancelCharge(false);drag={x:e.clientX,y:e.clientY,button};moved=false;canvas.setPointerCapture(e.pointerId);if(button===0){if(state.weapon==='bow')startCharge();else if(state.weapon==='staff')attack();}});
canvas.addEventListener('pointermove',e=>{mouseX=e.clientX;mouseY=e.clientY;if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>1)moved=true;if(drag.button===2||state.weapon==='sword'){yaw-=dx*.005;pitch=Math.max(.2,Math.min(1.1,pitch+dy*.004));}drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(drag&&drag.button===0){if(state.weapon==='bow')releaseBow();else if(state.weapon==='sword'&&!moved)attack();}drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;cancelCharge();});canvas.addEventListener('lostpointercapture',()=>{drag=null;cancelCharge(false);});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(5,Math.min(15,distance+e.deltaY*.008));},{passive:false});
function resolve(x,z){if(state.area==='roots')return EmberDungeon.move(state.x,state.z,x,z,state.gateOpen);x=Math.max(-32,Math.min(32,x));z=Math.max(-60,Math.min(31,z));for(const b of world.colliders){const dx=x-b.x,dz=z-b.z,d=Math.hypot(dx,dz),r=b.r+.55;if(d<r){if(d>.001){x=b.x+dx/d*r;z=b.z+dz/d*r;}else x=b.x+r;}}return {x,z};}
function die(){state.hp=RPG.maxHp(state);state.mana=RPG.maxMana(state);state.x=state.area==='roots'?100:0;state.z=state.area==='roots'?14:22;state.gold=Math.max(0,state.gold-10);sync();keys.clear();target=null;save();toast((state.area==='roots'?'Terug bij de ingang':'Terug in Lindehaard')+' · Je verliest maximaal 10 goud. Opdrachten en buit blijven bewaard.');}
function movement(){let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));const len=Math.hypot(x,z);if(!len)return {x:0,z:0};x/=len;z/=len;return {x:x*Math.cos(yaw)+z*Math.sin(yaw),z:-x*Math.sin(yaw)+z*Math.cos(yaw)};}
function dodge(){if(mode!=='playing')return;let v=movement();if(!v.x&&!v.z)v={x:Math.sin(world.player.group.rotation.y),z:Math.cos(world.player.group.rotation.y)};if(EmberCombat.dodge(combat,v.x,v.z)){cancelCharge();combat.cooldown=RPG.classConfig(state).dodge;swing=0;EmberCombat.resetCombo(combo);EmberAudio.play('dodge');world.burst(state.x,state.z,'#c3ded4',6);updateHud();}}
function takeDamage(amount){const protection=EmberLoot.bonuses(state).guard;amount=Math.max(1,Math.round(amount*(1-Math.min(.55,protection/100))));if(combat.remaining>0){world.damageText('ONTWEKEN',state.x,state.z,'#a5efdb');return false;}state.hp-=amount;world.damageText('-'+amount,state.x,state.z,'#ffad9b');EmberAudio.play('hurt');return true;}
function update(dt){EmberMage.regenerate(state,dt);if(charging)charge=Math.min(1.2,charge+dt);if(state.weapon==='bow'||state.weapon==='staff')updateAim();attackCD=Math.max(0,attackCD-dt);magicCD=Math.max(0,magicCD-dt);healCD=Math.max(0,healCD-dt);swing=Math.max(0,swing-dt);EmberCombat.tickCombo(combo,dt);
 const v=movement(),rolling=combat.remaining>0,moving=!!(v.x||v.z||rolling);
 if(moving){const vx=rolling?combat.x:v.x,vz=rolling?combat.z:v.z,speed=rolling?13:RPG.classConfig(state).speed*(keys.has('ShiftLeft')||keys.has('ShiftRight')?1.5:1)*(charging?.65:1),moveDt=rolling?Math.min(dt,combat.remaining):dt;const result=resolve(state.x+vx*speed*moveDt,state.z+vz*speed*moveDt);state.x=result.x;state.z=result.z;if(rolling)world.player.group.rotation.y=Math.atan2(vx,vz);else if(swing<=0)world.player.group.rotation.y=EmberCombat.turnToward(world.player.group.rotation.y,Math.atan2(vx,vz),dt*14);}
 if(charging)world.player.group.rotation.y=Math.atan2(aimPoint.x-state.x,aimPoint.z-state.z);world.player.group.position.set(state.x,0,state.z);if(state.classId==='mage'&&(state.area==='valley'?Math.hypot(state.x,state.z-14)<5:Math.hypot(state.x-100,state.z-12)<2.5))state.mana=Math.min(RPG.maxMana(state),state.mana+20*dt);if((state.area==='valley'?Math.hypot(state.x,state.z-14)<5:Math.hypot(state.x-100,state.z-12)<2.5)&&state.hp<RPG.maxHp(state))state.hp=Math.min(RPG.maxHp(state),state.hp+(state.area==='roots'?9:16)*dt);
 if(meleeStrike){
  meleeStrike.remaining-=dt;
  if(meleeStrike.remaining<=0){
   const strike=meleeStrike;meleeStrike=null;
   if(state.weapon==='sword'&&!rolling){
    const e=strike.enemy?.mesh.visible&&Math.hypot(strike.enemy.mesh.position.x-state.x,strike.enemy.mesh.position.z-state.z)<3.1?strike.enemy:nearestEnemy(3.1);
    if(e)hit(e,Math.round(RPG.damage(state)*strike.move.multiplier));else toast('Kom dichter bij een vijand om te raken.');
    world.slash(state.x,state.z,world.player.group.rotation.y,strike.move.step);EmberAudio.play('sword');
   }
  }
 }
 world.warning.visible=false;
 for(const e of world.enemies){if(!e.mesh.visible)continue;e.attack-=dt;EmberEnemyAI.tick(e,dt);EmberMage.tickEnemy(e,dt);if(e.flash>0){e.flash=Math.max(0,e.flash-dt);const pulse=Math.sin((1-e.flash/.22)*Math.PI)*Math.exp(-(1-e.flash/.22)*2),strength=e.boss?.035:.11;if(!e.visual){e.mesh.scale.setScalar(1+pulse*(e.boss?.025:.065));e.mesh.rotation.x=pulse*strength*(e.hitTiltX||0);e.mesh.rotation.z=pulse*strength*(e.hitTiltZ||0);}}if(e.stagger>0)e.stagger=Math.max(0,e.stagger-dt);if(e.boss&&state.quest<3)continue;const pos=e.mesh.position,ex=state.x-pos.x,ez=state.z-pos.z,d=Math.hypot(ex,ez),homeDist=Math.hypot(state.x-e.homeX,state.z-e.homeZ),aggro=EmberEnemyAI.active(e,state.x,state.z);if(e.spirit){
  if(e.pendingAttack==='orb'){
   if(e.telegraph<=0){e.pendingAttack=null;e.visual?.attack('orb');const dd=Math.hypot(state.x-pos.x,state.z-pos.z);
     if(dd>.01&&dd<=25){projectiles.push({mesh:world.orb(pos.x,pos.z),x:pos.x,z:pos.z,vx:(state.x-pos.x)/dd*8,vz:(state.z-pos.z)/dd*8,life:3});world.burst(pos.x,pos.z,'#d3bbff',6);}
   }
   continue;
  }
  if(aggro){e.mesh.rotation.y=Math.atan2(ex,ez);const dir=EmberEnemyAI.movement(e,state.x,state.z);
   if(dir.d>.01){pos.x+=dir.x*1.9*dt*EmberMage.movementScale(e);pos.z+=dir.z*1.9*dt*EmberMage.movementScale(e);}
   if(e.attack<=0&&d>.01){e.attack=2.1;e.pendingAttack='orb';EmberEnemyAI.startWarning(e,.25);world.damageText('VONKSCHOT',pos.x,pos.z,'#eac9ff');}
  }else{const hx=e.homeX-pos.x,hz=e.homeZ-pos.z,h=Math.hypot(hx,hz);if(h>.1){if(e.visual)e.mesh.rotation.y=EmberCombat.turnToward(e.mesh.rotation.y,Math.atan2(hx,hz),dt*4);pos.x+=hx/h*2*dt*EmberMage.movementScale(e);pos.z+=hz/h*2*dt*EmberMage.movementScale(e);}}
  continue;
 }
 if(e.windup>0){e.windup-=dt;world.warning.position.set(pos.x,.05,pos.z);world.warning.visible=true;world.warning.scale.setScalar(e.rootBoss?(e.pattern===1?.5:5.2/4.6):1);world.warning.material.color.set(e.rootBoss&&e.pattern===1?'#c8a4ea':'#f0a167');if(e.windup<=0){e.visual?.attack(e.rootBoss&&e.pattern===1?'salvo':'slam');if(e.id==='boss')world.thornImpact(pos.x,pos.z);if(e.rootBoss&&e.pattern===1){const angle=e.castAngle;for(const offset of [-.3,0,.3]){const a=angle+offset;projectiles.push({mesh:world.orb(pos.x,pos.z),x:pos.x,z:pos.z,vx:Math.sin(a)*9,vz:Math.cos(a)*9,life:3,damage:18});}EmberAudio.play('magic');}else if(d<(e.rootBoss?5.2:4.6)){if(takeDamage(e.rootBoss?36:30))world.burst(state.x,state.z,'#da9a88',6);}}continue;}

 if(e.pendingAttack==='melee'){
  if(e.telegraph<=0){e.pendingAttack=null;e.visual?.attack();const reach=EmberEnemyAI.config(e).range+.35;
    if(Math.hypot(state.x-pos.x,state.z-pos.z)<=reach){if(takeDamage(e.damage||10))world.burst(state.x,state.z,'#dca48c',5);}
  }
  continue;
 }
 if(aggro){
  pos.y=e.boss||e.visual?0:Math.sin(time*9)*.06;
  if(e.stagger>0)continue;
  e.mesh.rotation.y=Math.atan2(ex,ez);
  if(!e.boss){
   const evade=EmberEnemyAI.dodgeArrow(e,arrows);if(evade){e.dodgeVector=evade;world.burst(pos.x,pos.z,'#b2dfd1',3);}
   if(e.dodgeTime>0&&e.dodgeVector){
    const step=4.5*dt*EmberMage.movementScale(e),nx=pos.x+e.dodgeVector.x*step,nz=pos.z+e.dodgeVector.z*step;
    if(state.area==='roots'){const p=EmberDungeon.move(pos.x,pos.z,nx,nz,state.gateOpen,.55);pos.x=p.x;pos.z=p.z;}
    else if(nx>=-31&&nx<=31&&nz>=-59&&nz<=30&&!world.colliders.some(c=>Math.hypot(nx-c.x,nz-c.z)<c.r+.5)){pos.x=nx;pos.z=nz;}
    continue;
   }
  }
  const range=EmberEnemyAI.config(e).range;
  if(d>range){
   const speed=e.speed||(e.boss?2.1:3.3),dir=EmberEnemyAI.movement(e,state.x,state.z,world.enemies);
   pos.x+=dir.x*speed*dt*EmberMage.movementScale(e);pos.z+=dir.z*speed*dt*EmberMage.movementScale(e);
  }else if(e.attack<=0){
   e.attack=e.boss?3:1.5;
   if(e.boss){
    if(e.rootBoss){e.pattern=(e.pattern+1)%2;e.windup=e.pattern===1?.95:1.25;e.castAngle=Math.atan2(ex,ez);world.damageText(e.pattern===1?'ZAADSALVO':'WORTELSLAG',pos.x,pos.z,e.pattern===1?'#e4c3ff':'#ffdb9e');}
    else e.windup=1.15;
   }else{e.pendingAttack='melee';EmberEnemyAI.startWarning(e,EmberEnemyAI.config(e).windup);world.damageText('SPRONG',pos.x,pos.z,'#ffdca1');}
  }
 }else{
  pos.y=0;const hx=e.homeX-pos.x,hz=e.homeZ-pos.z,h=Math.hypot(hx,hz);
  if(h>.1){if(e.visual)e.mesh.rotation.y=EmberCombat.turnToward(e.mesh.rotation.y,Math.atan2(hx,hz),dt*4);pos.x+=hx/h*2*dt*EmberMage.movementScale(e);pos.z+=hz/h*2*dt*EmberMage.movementScale(e);}
 }}
 for(const e of dungeon.enemies)if(e.mesh.visible){const p=EmberDungeon.move(e.lastX,e.lastZ,e.mesh.position.x,e.mesh.position.z,state.gateOpen,e.boss?1:.55);e.mesh.position.x=e.lastX=p.x;e.mesh.position.z=e.lastZ=p.z;}
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i],oldX=p.x,oldZ=p.z;p.x+=p.vx*dt;p.z+=p.vz*dt;p.life-=dt;p.mesh.position.set(p.x,1.4,p.z);const hit=EmberCombat.segmentHit(oldX,oldZ,p.x,p.z,state.x,state.z,.85),blocked=state.area==='roots'?!EmberDungeon.canStand(p.x,p.z,state.gateOpen,.18):world.colliders.some(c=>EmberCombat.segmentHit(oldX,oldZ,p.x,p.z,c.x,c.z,c.r));if(hit||blocked||p.life<=0){if(hit)takeDamage(p.damage||14);world.scene.remove(p.mesh);projectiles.splice(i,1);}}
 for(let i=arrows.length-1;i>=0;i--){const a=arrows[i],ox=a.fromX??a.x,oz=a.fromZ??a.z;delete a.fromX;delete a.fromZ;a.x+=a.vx*dt;a.z+=a.vz*dt;a.life-=dt;a.travelled+=Math.hypot(a.vx,a.vz)*dt;const height=a.startY+(1.5-a.startY)*Math.min(1,a.travelled/a.heightDistance);a.mesh.position.set(a.x,height,a.z);if(a.spell){a.mesh.rotation.y+=dt*4;a.mesh.rotation.z+=dt*2;}const block=projectileBlock(ox,oz,a.x,a.z);
 let collision=null,nearest=Infinity;for(const e of world.enemies){if(!e.mesh.visible||e.boss&&state.quest<3)continue;const t=EmberCombat.circleT(ox,oz,a.x,a.z,e.mesh.position.x,e.mesh.position.z,e.boss?1.3:.8);if(t<nearest){nearest=t;collision={enemy:e};}}
 if(state.area==='valley'&&RPG.questVisibility(state).bow)for(const t of archery.targets){const f=EmberCombat.circleT(ox,oz,a.x,a.z,t.x,t.z,.8);if(f<nearest){nearest=f;collision={practice:t};}}
 if(block!==Infinity||collision||a.life<=0){if(collision&&nearest<block){if(collision.enemy){hit(collision.enemy,a.damage,a.vx,a.vz,true);if(a.spell)world.magicImpact(a.x,a.z,'#acccff',.7);}else if(a.spell){world.magicImpact(collision.practice.x,collision.practice.z,'#acccff',.5);}else{const t=collision.practice;world.burst(t.x,t.z,'#e9d5a0',5);if(RPG.practiceHit(state,t.id,a.charge)){archery.sync(state);save();toast(state.bowPractice.length===3?'Alle doelen geraakt! Keer terug naar Elin.':'Geladen pijl raak · '+state.bowPractice.length+' / 3 doelen');}else toast(state.bowQuest===1?(state.bowPractice.includes(t.id)?'Dit doel is al voltooid. Raak een ander doel of keer terug naar Elin.':'Houd langer vast: alleen een geladen pijl telt.'):state.bowQuest===0?'Raak! Vraag Elin naar boogtraining.':'Raak!');}}world.scene.remove(a.mesh);arrows.splice(i,1);}}
 if(state.hp<=0)die();near=getNear();const nearest=nearestEnemy(state.weapon==='bow'||state.weapon==='staff'?30:14);if(target?.mesh.visible&&target.focusUntil>time){/* Keep the wounded target's HP bar visible after a ranged hit. */}else if(nearest)target=nearest;else if(target&&(!target.mesh.visible||Math.hypot(target.mesh.position.x-state.x,target.mesh.position.z-state.z)>(state.weapon==='bow'||state.weapon==='staff'?32:18)))target=null;
 if(RPG.discoverShrine(state)){exploration.sync(state);toast('Ontdekt: het Fluisterheiligdom. Een oude steen licht op tussen de bomen.');save();}
 world.update(dt,time,moving,swing,combat.remaining,moving&&!rolling&&(keys.has('ShiftLeft')||keys.has('ShiftRight')),combo.step);exploration.update(dt,time,state);archery.update(charging?charge/1.2:0,dt,rolling,Math.atan2(.85,Math.max(1,Math.hypot(aimPoint.x-state.x,aimPoint.z-state.z))));dungeon.update(dt,time,state);EmberCombat.tick(combat,dt);saveTime+=dt;if(saveTime>5){saveTime=0;save();}hudTime+=dt;if(hudTime>.08){hudTime=0;updateHud();}
}
const map=$('map').getContext('2d');
function updateHud(){EmberEquipment.syncRewards(state);syncQuestObjects();$('side-quest').hidden=!RPG.questVisibility(state).herbalist;$('player-name').textContent='✧ '+characters.name+' · '+RPG.classConfig(state).name;$('attack-name').textContent=state.weapon==='staff'?'Vonkbol':state.weapon==='bow'?'Boogschot':combo.step&&combo.window>0?EmberCombat.comboMoves[combo.step-1].name:'Zwaardslag';$('combo-indicator').hidden=state.weapon!=='sword'||combo.step===0||combo.window<=0;$('combo-indicator').textContent=combo.step?'COMBO '+combo.step+' / 3 · '+EmberCombat.comboMoves[combo.step-1].name+' · '+combo.window.toFixed(1)+'s':'';$('skill-name').textContent=RPG.classConfig(state).skill.name;$('weapon-toggle').textContent=(state.weapon==='staff'?'Staf':state.weapon==='bow'?'Boog':'Zwaard')+' · F';$('weapon-toggle').disabled=RPG.weapons(state).length<2;$('mana-wrap').hidden=state.classId!=='mage';$('mana-fill').style.width=(RPG.maxMana(state)?state.mana/RPG.maxMana(state)*100:0)+'%';$('mana-label').textContent=Math.floor(state.mana)+' / '+RPG.maxMana(state)+' mana';$('bow-objective').hidden=state.bowQuest!==1;$('bow-objective').textContent='BOOGTRAINING · '+state.bowPractice.length+' / 3 geladen treffers. '+(state.bowPractice.length===3?'Keer terug naar Elin.':'Oefendoelen ten noorden van het dorp.');const hp=RPG.maxHp(state);$('health').style.width=state.hp/hp*100+'%';$('health-label').textContent=Math.ceil(state.hp)+' / '+hp;$('level').textContent='Niveau '+state.level;$('xp').style.width=Math.min(100,state.xp/(state.level*60)*100)+'%';$('xp-label').textContent=state.xp+' / '+state.level*60+' XP · '+state.gold+' goud';const quest=RPG.questText(state);$('quest-title').textContent=quest[0];$('quest-label').textContent=state.dungeon>0?'DE WORTELGROTTEN':'HET PAD VAN DE VONK';$('map-title').textContent=state.area==='roots'?(EmberDungeon.rooms.find(r=>r.name&&state.x>=r.x&&state.x<=r.x+r.w&&state.z>=r.z&&state.z<=r.z+r.d)?.name||'De Wortelgrotten').toUpperCase():'DE SCHEMERVALLEI';$('quest-body').textContent=quest[1];const side=RPG.sideText(state);$('side-title').textContent=side[0];$('side-body').textContent=side[1];$('attack-cd').textContent=attackCD>0?'Herstellen…':state.weapon==='staff'&&state.mana<8?'Te weinig mana':'Klaar';$('magic-cd').textContent=magicCD>0?magicCD.toFixed(1)+' s':'Klaar';$('potions').textContent=state.potions+' over';$('dodge-cd').textContent=combat.cooldown>0?combat.cooldown.toFixed(1)+' s':'Klaar';$('enemy').hidden=!target||!target.mesh.visible;if(target){$('enemy-name').textContent=RPG.enemyName(target);$('enemy-health').style.width=target.hp/target.max*100+'%';}near=getNear();$('interact').textContent=near?.startsWith('loot:')?'[E] Pak buit op':near?'[E] '+(near==='mira'?'Praat met Mira':near==='tovin'?'Praat met Tovin':near==='shrine'?'Onderzoek het heiligdom':RPG.herbs.some(h=>h.id===near)?'Pluk goudbloesem':near==='ranger'?'Praat met Elin':near==='merchant'?'Handel met Bram':near==='chest'?'Open de kist':near==='entrance'?'Daal af naar de Wortelgrotten':near==='exit'?'Verlaat de grot':near==='root-key'?'Pak de wortelsleutel':near==='root-gate'?'Open de worteldeur':near==='root-altar'?'Neem het Hartamulet':'Verzamel lichtkristal'):'';world.marker.visible=state.area==='valley'&&(state.quest!==5||state.dungeon!==3);world.marker.material.color.set(state.quest===1&&RPG.wolfCount(state)<3||state.quest===2&&state.crystals.length<3?'#b0c3ab':'#ffdf83');drawMap();}
function drawMap(){map.clearRect(0,0,160,160);map.fillStyle=state.area==='roots'?'#202f2b':'#233f32';map.fillRect(0,0,160,160);const inside=state.area==='roots',px=x=>inside?80+(x-100)*4:80+x*1.65,pz=z=>inside?12+(z+66)*1.6:16+(z+60)*1.35;function dot(x,z,color,r=3){map.fillStyle=color;map.beginPath();map.arc(px(x),pz(z),r,0,Math.PI*2);map.fill();}
 if(inside){map.fillStyle='#69745a';for(const r of EmberDungeon.rooms)map.fillRect(px(r.x),pz(r.z),r.w*4,r.d*1.6);map.strokeStyle=state.gateOpen?'#9fddbd':'#e1a573';map.lineWidth=3;map.beginPath();map.moveTo(px(97),pz(-35));map.lineTo(px(103),pz(-35));map.stroke();dot(100,16.5,'#d6e7d3',3);if(!state.caveKey)dot(110,-21,'#ffe09b',3);if(!state.amulet&&state.kills.includes('rootboss'))dot(100,-63,'#a9f2c3',3);}
 else{map.strokeStyle='#a2a07988';map.lineWidth=7;map.beginPath();map.moveTo(80,16);map.lineTo(80,145);map.stroke();dot(-3,17,'#f1d192',4);dot(6,25,'#ecc2a0',3);if(state.sideQuest===1&&Math.hypot(state.x+23,state.z+32)<12)dot(-23,-32,'#9dd9e5',3);if(RPG.questVisibility(state).shrine&&state.shrineSeen)dot(-26,-48,'#c6f4db',3);for(const h of RPG.herbs)if(RPG.questVisibility(state).herbalist&&!state.gathered.includes(h.id)&&Math.hypot(state.x-h.x,state.z-h.z)<13)dot(h.x,h.z,'#d3dda1',2);dot(8,19,'#c8d4c5');if(RPG.questVisibility(state).dungeon)dot(0,-58.5,'#a9d7d1',4);for(const c of world.crystals)if(c.mesh.visible)dot(c.x,c.z,'#97e6cb');}
 if(!inside&&state.bowQuest===1)for(const t of RPG.bowTargets)dot(t.x,t.z,state.bowPractice.includes(t.id)?'#9bd4b2':'#efd795',3);for(const e of world.enemies)if(e.mesh.visible)dot(e.mesh.position.x,e.mesh.position.z,e.boss?'#eeae68':e.spirit?'#d5b1ed':'#c67c71',e.boss?4:2.5);dot(state.x,state.z,'#ffffff',4);map.fillStyle='#eee4bb';map.font='9px system-ui';map.textAlign='center';map.fillText('N',80,10);}
function updateCamera(dt){const pos=world.player.group.position,aim=new THREE.Vector3(pos.x,1.8,pos.z),offset=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);raycaster.set(aim,offset.clone().normalize());const hit=raycaster.intersectObjects(world.cameraMeshes,false)[0];if(hit&&hit.distance<offset.length())offset.setLength(Math.max(1.2,hit.distance-.5));const desired=aim.clone().add(offset);camera.position.lerp(desired,1-Math.exp(-8*dt));camera.position.y=Math.max(1,camera.position.y);camera.lookAt(aim);}
// Frame the speaking character beside the dialogue; collision checks retain a clear view.
const talkOrigin=new THREE.Vector3(),talkForward=new THREE.Vector3(),talkRight=new THREE.Vector3(),talkOffset=new THREE.Vector3(),talkAim=new THREE.Vector3(),talkDesired=new THREE.Vector3();
function updateConversationCamera(dt){
 const entry=world.conversation;if(!entry)return;const view=entry.camera;
 talkOrigin.copy(entry.actor.group.position);talkOrigin.y=1.75;
 talkForward.set(Math.sin(view.yaw),0,Math.cos(view.yaw));talkRight.set(Math.cos(view.yaw),0,-Math.sin(view.yaw));
 talkOffset.copy(talkForward).multiplyScalar(view.forward).addScaledVector(talkRight,view.side);talkOffset.y=view.height;
 raycaster.set(talkOrigin,talkDesired.copy(talkOffset).normalize());const hit=raycaster.intersectObjects(world.cameraMeshes,false)[0];
 if(hit&&hit.distance<talkOffset.length())talkOffset.setLength(Math.max(1.5,hit.distance-.45));
 talkDesired.copy(talkOrigin).add(talkOffset);camera.position.lerp(talkDesired,1-Math.exp(-dt*6));camera.position.y=Math.max(1,camera.position.y);
 talkAim.copy(talkOrigin).addScaledVector(talkRight,view.targetSide).addScaledVector(talkForward,view.targetForward);talkAim.y=1.55;camera.lookAt(talkAim);
}
function frame(ms){const dt=Math.min((ms-last)/1000||.016,.04);last=ms;time+=dt;if(mode==='playing')update(dt);else if(mode==='start'){yaw=.3+Math.sin(time*.08)*.18;world.update(dt,time,false,0);}else if(mode==='dialog'){world.updateNPC(dt);updateConversationCamera(dt);}if(mode==='playing'||mode==='start')updateCamera(dt);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').style.opacity='0';}const bowMode=mode==='playing'&&state.weapon==='bow',spellMode=mode==='playing'&&state.weapon==='staff';$('aim-reticle').hidden=!bowMode&&!spellMode;$('aim-reticle').setAttribute('data-spell',String(spellMode));$('bow-charge').hidden=!bowMode;$('aim-reticle').style.left=mouseX+'px';$('aim-reticle').style.top=mouseY+'px';$('charge-fill').style.width=charge/1.2*100+'%';$('charge-label').textContent=charging?(charge>=1.15?'Geladen! Laat los om te schieten.':'Boog spannen…'):'Richt met muis · Houd klik / 1 vast';canvas.style.cursor=bowMode||spellMode?'none':'default';renderer.render(world.scene,camera);if(mode==='class-select')creatorPreview?.update(time);requestAnimationFrame(frame);}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();toast('De 3D-weergave is onderbroken. Herlaad de pagina om verder te spelen.');});addEventListener('pagehide',()=>{if(hasSession)save();});sync();camera.position.set(10,8,33);requestAnimationFrame(frame);
})();
