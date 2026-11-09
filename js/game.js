(function(){
'use strict';
const $=id=>document.getElementById(id),canvas=$('world');let renderer,world;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;world=EmberWorld.createWorld();}catch(error){$('fatal').hidden=false;const details=error&&error.message?error.message:String(error);$('fatal').textContent='Emberwild kon de 3D-wereld niet starten: '+details+' — Herlaad de pagina met Ctrl+F5. Als het probleem blijft, geef deze foutmelding door.';console.error('Emberwild startfout:',error);return;}
const exploration=EmberExplore.create(world);
const archery=EmberArchery.create(world);
const dungeon=EmberDungeon.create(world);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,180),keys=new Set(),raycaster=new THREE.Raycaster(),saveKey='emberwild-save-v1';let state=RPG.fresh(),saved=null,storageOK=true,mode='start',last=0,time=0,yaw=0,pitch=.48,distance=10,attackCD=0,magicCD=0,swing=0,healCD=0,toastTime=0,saveTime=0,hudTime=0,drag=null,moved=false,dialogAction=null,target=null,near=null;
const combat=EmberCombat.create(),combo=EmberCombat.createCombo(),projectiles=[],arrows=[];let charging=false,charge=0,selectedClass='guardian',selectionReturn='start',editingAppearance=false,selectedSkin='classic',selectedAppearance=RPG.defaultAppearance(),creatorPreview=null;const aimMouse=new THREE.Vector2(),aimRay=new THREE.Raycaster(),aimPoint=new THREE.Vector3(),aimPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.5);let mouseX=innerWidth/2,mouseY=innerHeight/2;
try{const raw=localStorage.getItem(saveKey);if(raw)saved=RPG.restore(raw);}catch{storageOK=false;}
if(saved){$('play').textContent='Ga verder →';$('new').hidden=false;$('save-info').textContent=RPG.classConfig(saved).name+' · Niveau '+saved.level+' · '+RPG.questText(saved)[0]+' · Lokaal opgeslagen';}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function toast(text){$('toast').textContent=text;$('toast').style.opacity='1';toastTime=4;}
function save(){try{localStorage.setItem(saveKey,JSON.stringify(state));}catch{if(storageOK)toast('Opslaan is geblokkeerd. Je avontuur blijft alleen in deze sessie.');storageOK=false;}}
function cancelCharge(){charging=false;charge=0;}
function loadout(){EmberEquipment.syncRewards(state);world.setWeapon(state.equipped,state.weapon);world.setClass(state.classId);world.setAppearance(state.skinId,state.classId,state.appearance);world.setArmor(state);archery.sync(state);}
function syncQuestObjects(){const v=RPG.questVisibility(state);dungeon.sync(state);exploration.sync(state);archery.sync(state);for(const e of world.enemies)e.mesh.visible=RPG.enemyVisible(state,e);for(const c of world.crystals)c.mesh.visible=state.area==='valley'&&v.crystals&&!state.crystals.includes(c.id);world.sigil.visible=state.area==='valley'&&(v.forestBoss||v.dungeon);if(target&&!target.mesh.visible)target=null;}
function sync(){cancelCharge();for(const a of arrows)world.scene.remove(a.mesh);arrows.length=0;dungeon.setArea(state.area);dungeon.sync(state);exploration.sync(state);if(state.area==='roots'&&!EmberDungeon.canStand(state.x,state.z,state.gateOpen)){state.x=100;state.z=14;}combat.remaining=0;combat.cooldown=0;EmberCombat.resetCombo(combo);for(const p of projectiles)world.scene.remove(p.mesh);projectiles.length=0;world.player.model.rotation.x=0;loadout();world.setAmulet(state.amulet&&state.amuletEquipped);world.player.group.position.set(state.x,0,state.z);for(const e of world.enemies){e.mesh.visible=(e.area||'valley')===state.area&&!state.kills.includes(e.id);e.hp=e.max;e.mesh.position.set(e.homeX,0,e.homeZ);e.attack=1;e.windup=0;e.stagger=0;e.alertTimer=0;e.focusUntil=0;e.mesh.rotation.z=0;e.lastX=e.homeX;e.lastZ=e.homeZ;}for(const c of world.crystals)c.mesh.visible=state.area==='valley'&&!state.crystals.includes(c.id);world.chest.visible=state.area==='valley'&&!state.chest;world.warning.visible=false;syncQuestObjects();}
function begin(fresh=false,classId='guardian'){EmberAudio.unlock();state=fresh?RPG.fresh(classId):saved?RPG.restore(saved):RPG.fresh(classId);if(fresh){state.skinId=selectedSkin;state.appearance=RPG.normalizeAppearance(selectedAppearance);}sync();mode='playing';keys.clear();$('overlay').hidden=true;$('hud').hidden=false;canvas.focus?.({preventScroll:true});attackCD=magicCD=healCD=swing=0;EmberCombat.resetCombo(combo);yaw=0;pitch=.48;camera.position.set(state.x,7,state.z+10);updateHud();save();toast(state.quest===0?'Welkom in Lindehaard. Zoek Elin. Met spatie rol je uit de weg van aanvallen.':'Welkom terug in de Schemervallei.');if(state.sideQuest===0)toast('Nieuw in Lindehaard: Mira zoekt haar kruidenzoeker. Zoek haar ten zuidoosten van het kampvuur.');else if(state.quest===5&&state.dungeon===0)toast('Nieuw avontuur: Elin heeft een opdracht voor de Wortelgrotten.');else if(state.kills.includes('boss')&&state.equipped!=='thorn')toast('Nieuwe buit beschikbaar: open je inventaris met I en rust Doornlicht uit.');}
$('play').onclick=()=>mode==='paused'?resume():saved?begin():chooseClass('start');$('new').onclick=()=>{if(mode==='start')chooseClass('start');else showDialog('EEN NIEUW BEGIN','Opnieuw beginnen?','Je opgeslagen avontuur wordt vervangen. Je kunt ook sluiten om je huidige avontuur te behouden.','Begin opnieuw',()=>{$('dialog').hidden=true;chooseClass('playing');});};
function selectClass(id){const c=RPG.classConfig(id);selectedClass=c.id;for(const candidate of Object.values(RPG.classes))$('class-'+candidate.id).setAttribute('aria-pressed',String(candidate.id===c.id));$('class-start').textContent='Begin als '+c.name;world.setClass(c.id);world.setWeapon('starter',c.starter);archery.bow.visible=c.starter==='bow';refreshCreator();}
function initializeCreator(){
 if(creatorPreview)return;
 try{creatorPreview=EmberAppearance.createPreview(THREE,$('creator-canvas'));}
 catch(error){console.warn('De 3D-preview is niet beschikbaar:',error);$('creator-preview-error').hidden=false;}
}
function refreshCreator(){
 if(creatorPreview)creatorPreview.select(selectedSkin,selectedAppearance);
}
function showCreatorValues(){
 $('appearance-skin').value=selectedSkin;
 for(const key of Object.keys(RPG.defaultAppearance()))$('appearance-'+key).value=selectedAppearance[key];
 refreshCreator();
}
function chooseClass(from){
 editingAppearance=false;selectionReturn=from;mode='class-select';cancelCharge();keys.clear();drag=null;
 selectedSkin=state.skinId;selectedAppearance=RPG.normalizeAppearance(state.appearance);
 $('class-options').hidden=false;$('class-headline').textContent='Kies je class en uiterlijk';
 $('class-caption').textContent='Je class bepaalt je vaardigheden. Je uiterlijk is cosmetisch en verandert je stats niet.';
 $('overlay').hidden=true;$('dialog').hidden=true;$('class-select').hidden=false;
 initializeCreator();selectClass(state.classId);showCreatorValues();$('class-'+selectedClass).focus?.();
}
function editAppearance(){
 if(mode!=='inventory')return;
 editingAppearance=true;selectionReturn='inventory';mode='class-select';cancelCharge();keys.clear();
 selectedSkin=state.skinId;selectedAppearance=RPG.normalizeAppearance(state.appearance);selectedClass=state.classId;
 $('inventory').hidden=true;$('class-options').hidden=true;
 $('class-headline').textContent='Pas je uiterlijk aan';
 $('class-caption').textContent='Verander je kapsel en kleuren. Je klasse en avontuur blijven hetzelfde.';
 $('class-select').hidden=false;initializeCreator();showCreatorValues();
 $('class-start').textContent='Bewaar uiterlijk';
}
function closeClass(){
 loadout();$('class-select').hidden=true;
 if(selectionReturn==='start'){mode='start';$('overlay').hidden=false;}
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
$('class-start').onclick=()=>{if(editingAppearance){state.skinId=selectedSkin;state.appearance=RPG.normalizeAppearance(selectedAppearance);closeClass();loadout();save();return;}$('class-select').hidden=true;begin(true,selectedClass);};$('class-back').onclick=closeClass;if(!saved)$('play').textContent='Kies je class →';
function switchWeapon(){if(mode!=='playing'&&mode!=='inventory')return;cancelCharge();EmberCombat.resetCombo(combo);drag=null;if(!RPG.setWeapon(state,state.weapon==='bow'?'sword':'bow')){toast('Vraag Elin naar boogtraining om de boog te leren.');return;}loadout();updateHud();if(mode==='inventory')renderInventory();save();}
$('weapon-toggle').onclick=switchWeapon;$('bow-equip').onclick=switchWeapon;
function pause(){if(mode!=='playing')return;cancelCharge();drag=null;mode='paused';keys.clear();save();$('overlay').hidden=false;$('title').textContent='Even rust';$('intro-text').textContent='De vallei wacht op je. Je voortgang is bewaard in deze browser.';$('play').textContent='Verder spelen →';$('new').hidden=false;$('save-info').textContent=storageOK?'Automatisch opgeslagen':'Opslag geblokkeerd · alleen deze sessie';}
function resume(){EmberAudio.unlock();$('class-select').hidden=true;mode='playing';keys.clear();$('overlay').hidden=true;$('dialog').hidden=true;$('inventory').hidden=true;canvas.focus?.({preventScroll:true});}
$('pause').onclick=()=>mode==='playing'?pause():mode==='paused'?resume():null;
function showDialog(speaker,title,text,action,fn){cancelCharge();drag=null;$('dialog-extra').hidden=true;$('dialog-extra').onclick=null;mode='dialog';keys.clear();$('overlay').hidden=true;$('speaker').textContent=speaker;$('dialog-title').textContent=title;$('dialog-text').textContent=text;$('dialog-action').textContent=action;$('dialog').hidden=false;dialogAction=fn;}
$('dialog-close').onclick=resume;$('dialog-action').onclick=()=>{const action=dialogAction;dialogAction=null;resume();if(action)action();updateHud();save();};
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
 $('items').textContent=RPG.classConfig(state).name+' · '+RPG.weaponName(state)+' · '+(state.weapon==='bow'?RPG.arrowDamage(state,0)+'–'+RPG.arrowDamage(state,1.2):RPG.damage(state))+' schade';$('bow-equip').hidden=!state.bowUnlocked;$('bow-equip').textContent=state.weapon==='bow'?'Rust je zwaard uit · F':'Rust '+RPG.bowName(state)+' uit · F';
 const lines=[...state.bowUnlocked?['➶ '+RPG.bowName(state)+' · '+RPG.arrowDamage(state,0)+'–'+RPG.arrowDamage(state,1.2)+' schade · Houd klik / 1 vast']:[],'🍃 Kruiden · '+state.herbs+' (Bram maakt van 3 kruiden een levensdrank)','✧ '+RPG.classConfig(state).skill.name+' · '+(RPG.classConfig(state).skill.kind==='arrow'?RPG.arrowDamage(state,1.2)+RPG.classConfig(state).skill.bonus:RPG.damage(state)+RPG.classConfig(state).skill.bonus)+' schade','♥ Levensdranken · '+state.potions,'◈ Goud · '+state.gold,'◇ Lichtkristallen · '+state.crystals.length+' / 3'];
 if(state.shrineBlessing)lines.push('✺ Woudzegen · permanent +20 maximale gezondheid');
 if(state.amulet)lines.push('❖ Hartamulet · +40 maximale gezondheid · +8 schade'+(state.amuletEquipped?' · Uitgerust':''));
 $('skin-toggle').textContent=state.skinId==='flame_guardian'?'Uiterlijk: Flame Guardian ✦ (wissel naar klassiek)':'Uiterlijk: Klassiek (wissel naar Flame Guardian ✦)';
 $('amulet-equip').hidden=!state.amulet;$('amulet-equip').textContent=state.amuletEquipped?'Leg het Hartamulet af':'Rust het Hartamulet uit · +40 HP / +8 schade';
 if(state.kills.includes('boss'))lines.push('✦ Doornlicht · Uniek eindbaaswapen · +18 schade'+(state.equipped==='thorn'?' · Uitgerust':''));
 for(const text of lines){const row=document.createElement('div');row.textContent=text;$('items').appendChild(row);}
 $('equip').hidden=!state.kills.includes('boss');$('equip').textContent=state.equipped==='thorn'?'Rust je vorige zwaard uit':'Rust Doornlicht uit · +18 schade';
 renderArmor();
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
function hit(e,amount,dx=e.mesh.position.x-state.x,dz=e.mesh.position.z-state.z,ranged=false){if(!RPG.enemyVisible(state,e))return; if(ranged){e.alertTimer=10;e.attack=Math.min(e.attack,.5);target=e;e.focusUntil=time+2.5;}if(e.shield&&EmberCombat.shieldBlocks(e.mesh.rotation.y,dx,dz)){world.damageText('SCHILD',e.mesh.position.x,e.mesh.position.z,'#d5cfad');EmberAudio.play('block');return;}const oldLevel=state.level;e.hp=Math.max(0,e.hp-amount);
 world.burst(e.mesh.position.x,e.mesh.position.z,e.spirit?'#ddc7ff':'#ffbf87',e.boss?10:7);
 world.magicImpact?.(e.mesh.position.x,e.mesh.position.z,e.spirit?'#d7b7ff':'#ffb45e',e.boss?.8:.52);
 world.damageText(amount,e.mesh.position.x,e.mesh.position.z);
 EmberAudio.play('hit');
 e.flash=.22;e.stagger=e.boss?0:.16;
 e.mesh.scale.setScalar(e.boss?1.07:1.18);e.mesh.rotation.z=.14*(Math.sign(dx)||1);if(e.hp===0){e.mesh.visible=false;RPG.kill(state,e.id);const l=RPG.loot(e.id);toast(RPG.enemyName(e)+' verslagen · +'+l.xp+' XP · +'+l.gold+' goud');if(state.level>oldLevel){world.burst(state.x,state.z,'#b5f3d2',24);toast('Niveau '+state.level+'! Je gezondheid is volledig hersteld.');}if(e.boss){world.warning.visible=false;EmberAudio.play('loot');toast(e.rootBoss?'De Wortelmoeder is verslagen! Neem het Hartamulet van het altaar.':'Unieke buit: Doornlicht! Open je inventaris met I om het wapen uit te rusten.');save();}else save();}updateHud();}
function updateAim(){aimMouse.set(mouseX/innerWidth*2-1,-mouseY/innerHeight*2+1);aimRay.setFromCamera(aimMouse,camera);if(!aimRay.ray.intersectPlane(aimPlane,aimPoint))aimPoint.set(state.x+aimRay.ray.direction.x*20,1.5,state.z+aimRay.ray.direction.z*20);let closest=Infinity;for(const item of [...world.enemies.filter(e=>e.mesh.visible),...archery.targets.filter(t=>state.area==='valley'&&RPG.questVisibility(state).bow&&t.mesh.visible)]){const hit=aimRay.intersectObject(item.mesh,true)[0];if(hit&&hit.distance<closest){closest=hit.distance;aimPoint.set(item.mesh.position.x,1.5,item.mesh.position.z);}}}
function startCharge(){if(mode!=='playing'||state.weapon!=='bow'||combat.remaining>0||attackCD>0||charging)return;charging=true;charge=0;updateAim();}
function shoot(dx,dz,power,magical=false,bonus=0){const len=Math.hypot(dx,dz);if(len<.01)return;dx/=len;dz/=len;const x=state.x+dx*.7,z=state.z+dz*.7;world.player.group.rotation.y=Math.atan2(dx,dz);arrows.push({mesh:archery.arrow(x,z,dx,dz,magical),x,z,vx:dx*26,vz:dz*26,life:28/26,damage:RPG.arrowDamage(state,power)+bonus,charge:power});EmberAudio.play(magical?'magic':'bow');}
function releaseBow(){if(!charging)return;const power=charge;cancelCharge();if(mode!=='playing'||state.weapon!=='bow'||combat.remaining>0)return;updateAim();shoot(aimPoint.x-state.x,aimPoint.z-state.z,power);attackCD=.55;updateHud();}
function attack(magic=false){
 if(mode!=='playing'||combat.remaining>0)return;
 if(!magic&&state.weapon==='bow'){EmberCombat.resetCombo(combo);startCharge();releaseBow();return;}
 if(magic?magicCD>0:attackCD>0)return;
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
   EmberAudio.play('sword');
 }
 if(e){
   target=e;const dx=e.mesh.position.x-state.x,dz=e.mesh.position.z-state.z;
   world.player.group.rotation.y=Math.atan2(dx,dz);
   const base=RPG.damage(state)+(magic?skill.bonus:0);
   hit(e,move?Math.round(base*move.multiplier):base);
 }else if(!magic)toast('Kom dichter bij een vijand om te raken.');
 if(move){world.slash(state.x,state.z,world.player.group.rotation.y,move.step);updateHud();}
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
 else if(q===1&&RPG.wolfCount(state)>=3)showDialog('ELIN','De verloren vonken','Je hebt het pad veilig gemaakt. Zoek nu de drie lichtkristallen in het woud. Ze gloeien mintgroen en staan op je kaart. Breng ze naar mij; ik smeed hun licht in je zwaard.','Ontvang beloning · +40 XP, 20 goud, 1 drank',()=>RPG.advance(state));
 else if(q===2&&state.crystals.length===3)showDialog('ELIN','Een zwaard van sterrenlicht','Daar is het oude licht! Je wapens dragen nu sterrenlicht en je wonden zijn geheeld. De Doornwachter wacht bij de noordelijke ruïne. Ontwijk zijn oranje cirkel met spatie: tijdens de rol ben je kort beschermd.','Ontvang sterrenlicht voor je wapens',()=>{RPG.advance(state);world.burst(state.x,state.z,'#ffdda4',22);});
 else if(q===4)showDialog('ELIN','Beschermer van de vallei','Het licht is terug in Lindehaard. Dankzij jou kan het woud genezen. Dit is het einde van het eerste avontuur. Je kunt vrij blijven verkennen.','Voltooi avontuur · +80 XP en 60 goud',()=>{RPG.advance(state);world.burst(state.x,state.z,'#ffde9e',32);toast('Avontuur voltooid! Jij bent de Beschermer van de vallei.');});
 else showDialog('ELIN','De vallei rekent op je',RPG.questText(state)[1],'Verder op pad',null);offerBowTraining();
 }else if(near==='merchant'){
 showDialog('BRAM · HANDELAAR','De ketel staat klaar',!RPG.questVisibility(state).herbalist&&state.herbs===0?'Een levensdrank kost 15 goud en herstelt 70 gezondheid. Je hebt '+state.gold+' goud en '+state.potions+' dranken.':'Koop een levensdrank voor 15 goud, of maak er één van 3 kruiden, zonder goud te betalen. Een drank herstelt 70 gezondheid. Je hebt '+state.gold+' goud, '+state.herbs+' kruiden en '+state.potions+' dranken.','Koop levensdrank · 15 goud',()=>{if(state.gold<15)toast('Je hebt nog niet genoeg goud.');else{state.gold-=15;state.potions++;EmberAudio.play('gather');toast('Levensdrank gekocht.');}});
 $('dialog-extra').hidden=!RPG.questVisibility(state).herbalist&&state.herbs===0;$('dialog-extra').disabled=state.herbs<3;$('dialog-extra').textContent='Maak levensdrank · 3 kruiden';$('dialog-extra').onclick=()=>{resume();if(RPG.craftPotion(state)){EmberAudio.play('heal');toast('Levensdrank gemaakt · 3 kruiden verbruikt');}else toast('Je hebt 3 kruiden nodig.');updateHud();save();};
 }
 else if(near==='chest'){state.chest=true;state.gold+=30;state.potions++;world.chest.visible=false;world.burst(24,-10);toast('Verborgen kist · +30 goud · +1 levensdrank');save();}
 else {const c=world.crystals.find(c=>c.id===near);if(c){if(state.quest!==2){toast('Vraag Elin eerst naar de lichtkristallen.');return;}state.crystals.push(c.id);c.mesh.visible=false;world.burst(c.x,c.z,'#bcf4dd');toast('Lichtkristal gevonden · '+state.crystals.length+' / 3');save();}}updateHud();
}
function getNear(){let options;const v=RPG.questVisibility(state);
 if(state.area==='roots'&&v.dungeon)options=[['exit',100,16.5,2.7],...(!state.caveKey?[['root-key',110,-21,2.6]]:[]),...(!state.gateOpen?[['root-gate',100,-35,3]]:[]),...(!state.amulet&&state.kills.includes('rootboss')?[['root-altar',100,-63,3]]:[])];
 else if(state.area==='valley')options=[['mira',6,25,2.8],...(v.herbalist?[['tovin',state.sideQuest>=2?9:-23,state.sideQuest>=2?27:-32,2.8]]:[]),...(v.shrine?[['shrine',-26,-48,3]]:[]),...RPG.herbs.filter(h=>v.herbalist&&!state.gathered.includes(h.id)).map(h=>[h.id,h.x,h.z,2.1]),['ranger',-3,17,3],['merchant',8,19,3],...(v.dungeon?[['entrance',0,-58.5,3]]:[]),...(!state.chest?[['chest',24,-10,2.7]]:[]),...world.crystals.filter(c=>c.mesh.visible).map(c=>[c.id,c.x,c.z,2.7])];
 let result=null,best=Infinity;for(const [id,x,z,r] of (options||[])){const d=Math.hypot(state.x-x,state.z-z);if(d<r&&d<best){best=d;result=id;}}return result;}
addEventListener('keydown',e=>{EmberAudio.unlock();if(e.target instanceof HTMLButtonElement&&(e.code==='Enter'||e.code==='Space'&&mode!=='playing'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(mode==='class-select'){if(e.code==='Escape')closeClass();return;}if(e.code==='Escape'){if(mode==='playing')pause();else if(mode!=='start')resume();return;}if(e.code==='KeyI'){inventory();return;}if(mode!=='playing')return;keys.add(e.code);if(e.code==='KeyE')interact();if(e.code==='KeyF')switchWeapon();if(e.code==='Digit1'){if(state.weapon==='bow')startCharge();else attack();}if(e.code==='Space')dodge();if(e.code==='Digit2')attack(true);if(e.code==='KeyQ')heal();});addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Digit1')releaseBow();});addEventListener('blur',()=>{keys.clear();drag=null;if(mode==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
canvas.addEventListener('pointerdown',e=>{if(mode!=='playing')return;mouseX=e.clientX;mouseY=e.clientY;const button=e.button??0;if(button===2)cancelCharge();drag={x:e.clientX,y:e.clientY,button};moved=false;canvas.setPointerCapture(e.pointerId);if(state.weapon==='bow'&&button===0)startCharge();});
canvas.addEventListener('pointermove',e=>{mouseX=e.clientX;mouseY=e.clientY;if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>1)moved=true;if(drag.button===2||state.weapon!=='bow'){yaw-=dx*.005;pitch=Math.max(.2,Math.min(1.1,pitch+dy*.004));}drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(drag&&drag.button===0){if(state.weapon==='bow')releaseBow();else if(!moved)attack();}drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;cancelCharge();});canvas.addEventListener('lostpointercapture',()=>{drag=null;cancelCharge();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(5,Math.min(15,distance+e.deltaY*.008));},{passive:false});
function resolve(x,z){if(state.area==='roots')return EmberDungeon.move(state.x,state.z,x,z,state.gateOpen);x=Math.max(-32,Math.min(32,x));z=Math.max(-60,Math.min(31,z));for(const b of world.colliders){const dx=x-b.x,dz=z-b.z,d=Math.hypot(dx,dz),r=b.r+.55;if(d<r){if(d>.001){x=b.x+dx/d*r;z=b.z+dz/d*r;}else x=b.x+r;}}return {x,z};}
function die(){state.hp=RPG.maxHp(state);state.x=state.area==='roots'?100:0;state.z=state.area==='roots'?14:22;state.gold=Math.max(0,state.gold-10);sync();keys.clear();target=null;save();toast((state.area==='roots'?'Terug bij de ingang':'Terug in Lindehaard')+' · Je verliest maximaal 10 goud. Opdrachten en buit blijven bewaard.');}
function movement(){let x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));const len=Math.hypot(x,z);if(!len)return {x:0,z:0};x/=len;z/=len;return {x:x*Math.cos(yaw)+z*Math.sin(yaw),z:-x*Math.sin(yaw)+z*Math.cos(yaw)};}
function dodge(){if(mode!=='playing')return;let v=movement();if(!v.x&&!v.z)v={x:Math.sin(world.player.group.rotation.y),z:Math.cos(world.player.group.rotation.y)};if(EmberCombat.dodge(combat,v.x,v.z)){cancelCharge();combat.cooldown=RPG.classConfig(state).dodge;swing=0;EmberCombat.resetCombo(combo);EmberAudio.play('dodge');world.burst(state.x,state.z,'#c3ded4',6);updateHud();}}
function takeDamage(amount){if(combat.remaining>0){world.damageText('ONTWEKEN',state.x,state.z,'#a5efdb');return false;}state.hp-=amount;world.damageText('-'+amount,state.x,state.z,'#ffad9b');EmberAudio.play('hurt');return true;}
function update(dt){if(charging)charge=Math.min(1.2,charge+dt);if(state.weapon==='bow')updateAim();attackCD=Math.max(0,attackCD-dt);magicCD=Math.max(0,magicCD-dt);healCD=Math.max(0,healCD-dt);swing=Math.max(0,swing-dt);EmberCombat.tickCombo(combo,dt);
 const v=movement(),rolling=combat.remaining>0,moving=!!(v.x||v.z||rolling);
 if(moving){const vx=rolling?combat.x:v.x,vz=rolling?combat.z:v.z,speed=rolling?13:RPG.classConfig(state).speed*(keys.has('ShiftLeft')||keys.has('ShiftRight')?1.5:1)*(charging?.65:1),moveDt=rolling?Math.min(dt,combat.remaining):dt;const result=resolve(state.x+vx*speed*moveDt,state.z+vz*speed*moveDt);state.x=result.x;state.z=result.z;if(rolling||swing<=0)world.player.group.rotation.y=Math.atan2(vx,vz);}
 if(charging)world.player.group.rotation.y=Math.atan2(aimPoint.x-state.x,aimPoint.z-state.z);world.player.group.position.set(state.x,0,state.z);if((state.area==='valley'?Math.hypot(state.x,state.z-14)<5:Math.hypot(state.x-100,state.z-12)<2.5)&&state.hp<RPG.maxHp(state))state.hp=Math.min(RPG.maxHp(state),state.hp+(state.area==='roots'?9:16)*dt);
 world.warning.visible=false;
 for(const e of world.enemies){if(!e.mesh.visible)continue;e.attack-=dt;e.alertTimer=Math.max(0,(e.alertTimer||0)-dt);if(e.flash>0){e.flash-=dt;e.mesh.rotation.z*=Math.exp(-dt*12);if(e.flash<=0){e.mesh.scale.setScalar(1);e.mesh.rotation.z=0;}}if(e.stagger>0)e.stagger=Math.max(0,e.stagger-dt);if(e.boss&&state.quest<3)continue;const pos=e.mesh.position,ex=state.x-pos.x,ez=state.z-pos.z,d=Math.hypot(ex,ez),homeDist=Math.hypot(state.x-e.homeX,state.z-e.homeZ),aggro=(d<(e.boss?16:11)&&homeDist<(e.boss?21:17))||(e.alertTimer>0&&d<=32);if(e.spirit){if(aggro){e.mesh.rotation.y=Math.atan2(ex,ez);const direction=d>9?1:d<5?-1:0;if(direction&&d>.01){pos.x+=ex/d*1.9*dt*direction;pos.z+=ez/d*1.9*dt*direction;}if(e.attack<=0&&d>.01){e.attack=2.1;const projectile={mesh:world.orb(pos.x,pos.z),x:pos.x,z:pos.z,vx:ex/d*8,vz:ez/d*8,life:3};projectiles.push(projectile);world.damageText('✧',pos.x,pos.z,'#eac9ff');}}else{const hx=e.homeX-pos.x,hz=e.homeZ-pos.z,h=Math.hypot(hx,hz);if(h>.1){pos.x+=hx/h*2*dt;pos.z+=hz/h*2*dt;}/* Keep ranged damage when an unaggroed enemy returns home. */}continue;}
 if(e.windup>0){e.windup-=dt;world.warning.position.set(pos.x,.05,pos.z);world.warning.visible=true;world.warning.scale.setScalar(e.rootBoss?(e.pattern===1?.5:5.2/4.6):1);world.warning.material.color.set(e.rootBoss&&e.pattern===1?'#c8a4ea':'#f0a167');if(e.windup<=0){if(e.rootBoss&&e.pattern===1){const angle=e.castAngle;for(const offset of [-.3,0,.3]){const a=angle+offset;projectiles.push({mesh:world.orb(pos.x,pos.z),x:pos.x,z:pos.z,vx:Math.sin(a)*9,vz:Math.cos(a)*9,life:3,damage:18});}EmberAudio.play('magic');}else if(d<(e.rootBoss?5.2:4.6)){if(takeDamage(e.rootBoss?36:30))world.burst(state.x,state.z,'#da9a88',6);}}continue;}

 if(aggro){pos.y=e.boss?0:Math.sin(time*9)*.06;if(e.stagger>0)continue;e.mesh.rotation.y=e.shield?EmberCombat.turnToward(e.mesh.rotation.y,Math.atan2(ex,ez),dt*1.4):Math.atan2(ex,ez);const range=e.boss?3.5:1.9;if(d>range){const speed=e.speed||(e.boss?2.1:3.3);pos.x+=ex/d*speed*dt;pos.z+=ez/d*speed*dt;}else if(e.attack<=0){e.attack=e.boss?3:e.shield?1.8:1.35;if(e.boss){if(e.rootBoss){e.pattern=(e.pattern+1)%2;e.windup=e.pattern===1?.95:1.25;e.castAngle=Math.atan2(ex,ez);world.damageText(e.pattern===1?'ZAADSALVO':'WORTELSLAG',pos.x,pos.z,e.pattern===1?'#e4c3ff':'#ffdb9e');}else e.windup=1.15;}else{if(takeDamage(e.damage||10))world.burst(state.x,state.z,'#dca48c',4);}}}else{pos.y=0;const hx=e.homeX-pos.x,hz=e.homeZ-pos.z,h=Math.hypot(hx,hz);if(h>.1){pos.x+=hx/h*2*dt;pos.z+=hz/h*2*dt;}/* Keep ranged damage when an unaggroed enemy returns home. */}}
 for(const e of dungeon.enemies)if(e.mesh.visible){const p=EmberDungeon.move(e.lastX,e.lastZ,e.mesh.position.x,e.mesh.position.z,state.gateOpen,e.boss?1:.55);e.mesh.position.x=e.lastX=p.x;e.mesh.position.z=e.lastZ=p.z;}
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i],oldX=p.x,oldZ=p.z;p.x+=p.vx*dt;p.z+=p.vz*dt;p.life-=dt;p.mesh.position.set(p.x,1.4,p.z);const hit=EmberCombat.segmentHit(oldX,oldZ,p.x,p.z,state.x,state.z,.85),blocked=state.area==='roots'?!EmberDungeon.canStand(p.x,p.z,state.gateOpen,.18):world.colliders.some(c=>EmberCombat.segmentHit(oldX,oldZ,p.x,p.z,c.x,c.z,c.r));if(hit||blocked||p.life<=0){if(hit)takeDamage(p.damage||14);world.scene.remove(p.mesh);projectiles.splice(i,1);}}
 for(let i=arrows.length-1;i>=0;i--){const a=arrows[i],ox=a.x,oz=a.z;a.x+=a.vx*dt;a.z+=a.vz*dt;a.life-=dt;a.mesh.position.set(a.x,1.5,a.z);let block=Infinity;
 if(state.area==='roots'){for(let k=0;k<=4;k++)if(!EmberDungeon.canStand(ox+(a.x-ox)*k/4,oz+(a.z-oz)*k/4,state.gateOpen,.12)){block=k/4;break;}}
 else for(const c of world.colliders)block=Math.min(block,EmberCombat.circleT(ox,oz,a.x,a.z,c.x,c.z,c.r+.08));
 let collision=null,nearest=Infinity;for(const e of world.enemies){if(!e.mesh.visible||e.boss&&state.quest<3)continue;const t=EmberCombat.circleT(ox,oz,a.x,a.z,e.mesh.position.x,e.mesh.position.z,e.boss?1.3:.8);if(t<nearest){nearest=t;collision={enemy:e};}}
 if(state.area==='valley'&&RPG.questVisibility(state).bow)for(const t of archery.targets){const f=EmberCombat.circleT(ox,oz,a.x,a.z,t.x,t.z,.8);if(f<nearest){nearest=f;collision={practice:t};}}
 if(block!==Infinity||collision||a.life<=0){if(collision&&nearest<block){if(collision.enemy)hit(collision.enemy,a.damage,a.vx,a.vz,true);else{const t=collision.practice;world.burst(t.x,t.z,'#e9d5a0',5);if(RPG.practiceHit(state,t.id,a.charge)){archery.sync(state);save();toast(state.bowPractice.length===3?'Alle doelen geraakt! Keer terug naar Elin.':'Geladen pijl raak · '+state.bowPractice.length+' / 3 doelen');}else toast(state.bowQuest===1?(state.bowPractice.includes(t.id)?'Dit doel is al voltooid. Raak een ander doel of keer terug naar Elin.':'Houd langer vast: alleen een geladen pijl telt.'):state.bowQuest===0?'Raak! Vraag Elin naar boogtraining.':'Raak!');}}world.scene.remove(a.mesh);arrows.splice(i,1);}}
 if(state.hp<=0)die();near=getNear();const nearest=nearestEnemy(state.weapon==='bow'?30:14);if(target?.mesh.visible&&target.focusUntil>time){/* Keep the wounded target's HP bar visible after a ranged hit. */}else if(nearest)target=nearest;else if(target&&(!target.mesh.visible||Math.hypot(target.mesh.position.x-state.x,target.mesh.position.z-state.z)>(state.weapon==='bow'?32:18)))target=null;
 if(RPG.discoverShrine(state)){exploration.sync(state);toast('Ontdekt: het Fluisterheiligdom. Een oude steen licht op tussen de bomen.');save();}
 world.update(dt,time,moving,swing,combat.remaining,moving&&!rolling&&(keys.has('ShiftLeft')||keys.has('ShiftRight')),combo.step);exploration.update(dt,time,state);archery.update(charging?charge/1.2:0);dungeon.update(dt,time,state);EmberCombat.tick(combat,dt);saveTime+=dt;if(saveTime>5){saveTime=0;save();}hudTime+=dt;if(hudTime>.08){hudTime=0;updateHud();}
}
const map=$('map').getContext('2d');
function updateHud(){EmberEquipment.syncRewards(state);syncQuestObjects();$('side-quest').hidden=!RPG.questVisibility(state).herbalist;$('player-name').textContent='✧ Aerin · '+RPG.classConfig(state).name;$('attack-name').textContent=state.weapon==='bow'?'Boogschot':combo.step&&combo.window>0?EmberCombat.comboMoves[combo.step-1].name:'Zwaardslag';$('combo-indicator').hidden=state.weapon==='bow'||combo.step===0||combo.window<=0;$('combo-indicator').textContent=combo.step?'COMBO '+combo.step+' / 3 · '+EmberCombat.comboMoves[combo.step-1].name+' · '+combo.window.toFixed(1)+'s':'';$('skill-name').textContent=RPG.classConfig(state).skill.name;$('weapon-toggle').textContent=(state.weapon==='bow'?'Boog':'Zwaard')+' · F';$('weapon-toggle').disabled=!state.bowUnlocked;$('bow-objective').hidden=state.bowQuest!==1;$('bow-objective').textContent='BOOGTRAINING · '+state.bowPractice.length+' / 3 geladen treffers. '+(state.bowPractice.length===3?'Keer terug naar Elin.':'Oefendoelen ten noorden van het dorp.');const hp=RPG.maxHp(state);$('health').style.width=state.hp/hp*100+'%';$('health-label').textContent=Math.ceil(state.hp)+' / '+hp;$('level').textContent='Niveau '+state.level;$('xp').style.width=Math.min(100,state.xp/(state.level*60)*100)+'%';$('xp-label').textContent=state.xp+' / '+state.level*60+' XP · '+state.gold+' goud';const quest=RPG.questText(state);$('quest-title').textContent=quest[0];$('quest-label').textContent=state.dungeon>0?'DE WORTELGROTTEN':'HET PAD VAN DE VONK';$('map-title').textContent=state.area==='roots'?(EmberDungeon.rooms.find(r=>r.name&&state.x>=r.x&&state.x<=r.x+r.w&&state.z>=r.z&&state.z<=r.z+r.d)?.name||'De Wortelgrotten').toUpperCase():'DE SCHEMERVALLEI';$('quest-body').textContent=quest[1];const side=RPG.sideText(state);$('side-title').textContent=side[0];$('side-body').textContent=side[1];$('attack-cd').textContent=attackCD>0?'Herstellen…':'Klaar';$('magic-cd').textContent=magicCD>0?magicCD.toFixed(1)+' s':'Klaar';$('potions').textContent=state.potions+' over';$('dodge-cd').textContent=combat.cooldown>0?combat.cooldown.toFixed(1)+' s':'Klaar';$('enemy').hidden=!target||!target.mesh.visible;if(target){$('enemy-name').textContent=RPG.enemyName(target);$('enemy-health').style.width=target.hp/target.max*100+'%';}near=getNear();$('interact').textContent=near?'[E] '+(near==='mira'?'Praat met Mira':near==='tovin'?'Praat met Tovin':near==='shrine'?'Onderzoek het heiligdom':RPG.herbs.some(h=>h.id===near)?'Pluk goudbloesem':near==='ranger'?'Praat met Elin':near==='merchant'?'Handel met Bram':near==='chest'?'Open de kist':near==='entrance'?'Daal af naar de Wortelgrotten':near==='exit'?'Verlaat de grot':near==='root-key'?'Pak de wortelsleutel':near==='root-gate'?'Open de worteldeur':near==='root-altar'?'Neem het Hartamulet':'Verzamel lichtkristal'):'';world.marker.visible=state.area==='valley'&&(state.quest!==5||state.dungeon!==3);world.marker.material.color.set(state.quest===1&&RPG.wolfCount(state)<3||state.quest===2&&state.crystals.length<3?'#b0c3ab':'#ffdf83');drawMap();}
function drawMap(){map.clearRect(0,0,160,160);map.fillStyle=state.area==='roots'?'#202f2b':'#233f32';map.fillRect(0,0,160,160);const inside=state.area==='roots',px=x=>inside?80+(x-100)*4:80+x*1.65,pz=z=>inside?12+(z+66)*1.6:16+(z+60)*1.35;function dot(x,z,color,r=3){map.fillStyle=color;map.beginPath();map.arc(px(x),pz(z),r,0,Math.PI*2);map.fill();}
 if(inside){map.fillStyle='#69745a';for(const r of EmberDungeon.rooms)map.fillRect(px(r.x),pz(r.z),r.w*4,r.d*1.6);map.strokeStyle=state.gateOpen?'#9fddbd':'#e1a573';map.lineWidth=3;map.beginPath();map.moveTo(px(97),pz(-35));map.lineTo(px(103),pz(-35));map.stroke();dot(100,16.5,'#d6e7d3',3);if(!state.caveKey)dot(110,-21,'#ffe09b',3);if(!state.amulet&&state.kills.includes('rootboss'))dot(100,-63,'#a9f2c3',3);}
 else{map.strokeStyle='#a2a07988';map.lineWidth=7;map.beginPath();map.moveTo(80,16);map.lineTo(80,145);map.stroke();dot(-3,17,'#f1d192',4);dot(6,25,'#ecc2a0',3);if(state.sideQuest===1&&Math.hypot(state.x+23,state.z+32)<12)dot(-23,-32,'#9dd9e5',3);if(RPG.questVisibility(state).shrine&&state.shrineSeen)dot(-26,-48,'#c6f4db',3);for(const h of RPG.herbs)if(RPG.questVisibility(state).herbalist&&!state.gathered.includes(h.id)&&Math.hypot(state.x-h.x,state.z-h.z)<13)dot(h.x,h.z,'#d3dda1',2);dot(8,19,'#c8d4c5');if(RPG.questVisibility(state).dungeon)dot(0,-58.5,'#a9d7d1',4);for(const c of world.crystals)if(c.mesh.visible)dot(c.x,c.z,'#97e6cb');}
 if(!inside&&state.bowQuest===1)for(const t of RPG.bowTargets)dot(t.x,t.z,state.bowPractice.includes(t.id)?'#9bd4b2':'#efd795',3);for(const e of world.enemies)if(e.mesh.visible)dot(e.mesh.position.x,e.mesh.position.z,e.boss?'#eeae68':e.spirit?'#d5b1ed':'#c67c71',e.boss?4:2.5);dot(state.x,state.z,'#ffffff',4);map.fillStyle='#eee4bb';map.font='9px system-ui';map.textAlign='center';map.fillText('N',80,10);}
function updateCamera(dt){const pos=world.player.group.position,aim=new THREE.Vector3(pos.x,1.8,pos.z),offset=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);raycaster.set(aim,offset.clone().normalize());const hit=raycaster.intersectObjects(world.cameraMeshes,false)[0];if(hit&&hit.distance<offset.length())offset.setLength(Math.max(1.2,hit.distance-.5));const desired=aim.clone().add(offset);camera.position.lerp(desired,1-Math.exp(-8*dt));camera.position.y=Math.max(1,camera.position.y);camera.lookAt(aim);}
function frame(ms){const dt=Math.min((ms-last)/1000||.016,.04);last=ms;time+=dt;if(mode==='playing')update(dt);else if(mode==='start'){yaw=.3+Math.sin(time*.08)*.18;world.update(dt,time,false,0);}if(mode==='playing'||mode==='start')updateCamera(dt);if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').style.opacity='0';}const bowMode=mode==='playing'&&state.weapon==='bow';$('aim-reticle').hidden=!bowMode;$('bow-charge').hidden=!bowMode;$('aim-reticle').style.left=mouseX+'px';$('aim-reticle').style.top=mouseY+'px';$('charge-fill').style.width=charge/1.2*100+'%';$('charge-label').textContent=charging?(charge>=1.15?'Geladen! Laat los om te schieten.':'Boog spannen…'):'Richt met muis · Houd klik / 1 vast';canvas.style.cursor=bowMode?'none':'default';EmberAudio.update(dt,state.area,mode==='playing');renderer.render(world.scene,camera);if(mode==='class-select')creatorPreview?.update(time);requestAnimationFrame(frame);}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();toast('De 3D-weergave is onderbroken. Herlaad de pagina om verder te spelen.');});addEventListener('pagehide',()=>{if(mode!=='start')save();});sync();camera.position.set(10,8,33);requestAnimationFrame(frame);
})();
