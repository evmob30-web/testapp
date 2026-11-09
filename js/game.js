(function(){
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id),keys=new Set(),jumpKeys=new Set(['Space','KeyW','ArrowUp']);let jumpPressed=false,state='start',last=0,accumulator=0,visualTime=0,toastTimer=0;
const game={level:StarLevel,player:StarPhysics.createPlayer(StarLevel.spawn),camera:0,collected:new Set(),particles:[],elapsed:0,falls:0};
function showRecords(message=''){const r=StarRecords.get();$('records').textContent=(message?message+' · ':'')+(r.bestTime===null?'Jouw eerste record wacht op je.':'Beste tijd '+formatTime(r.bestTime)+' · Meeste sterren '+r.bestStars+' / 12')+(r.persistent?'':' · Alleen deze sessie');}
function soundButton(){$('sound').textContent=StarAudio.muted?'Geluid uit':'Geluid aan';$('sound').setAttribute('aria-pressed',String(StarAudio.muted));$('sound').setAttribute('aria-label',StarAudio.muted?'Geluid inschakelen':'Geluid dempen');}
$('sound').onclick=()=>{StarAudio.toggle();soundButton();};soundButton();
function clearInput(){keys.clear();jumpPressed=false;}
function toast(message){$('toast').textContent=message;toastTimer=3;$('toast').style.opacity=1;}
function reset(){clearInput();game.player=StarPhysics.createPlayer(game.level.spawn);game.collected.clear();game.particles=[];game.camera=0;game.elapsed=0;game.falls=0;updateHud();}
function formatTime(time){return Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0');}
function updateHud(){$('stars').textContent=game.collected.size+' / '+game.level.stars.length;$('time').textContent=formatTime(game.elapsed);}
function setState(next){if(next==='playing')StarAudio.unlock();state=next;clearInput();accumulator=0;$('overlay').hidden=next==='playing';$('pause').textContent=next==='paused'?'▶':'Ⅱ';$('pause').disabled=next==='start'||next==='complete';$('secondary').hidden=next!=='paused';$('hint').hidden=next==='complete';if(next==='start')return;
 if(next==='paused'){$('eyebrow').textContent='EVEN TUSSEN DE WOLKEN';$('title').textContent='Pauze';$('description').textContent='Nova wacht op je. Ga verder wanneer je wilt.';$('primary').textContent='Verder spelen →';}
 if(next==='complete'){const result=StarRecords.save(game.elapsed,game.collected.size);showRecords(result.newTime&&result.newStars?'Nieuwe tijd én sterrenscore!':result.newTime?'Nieuw tijdrecord!':result.newStars?'Nieuwe sterrenscore!':'');StarAudio.play('portal');$('eyebrow').textContent='DROMERVELDEN VOLTOOID';$('title').textContent='Je schittert.';$('description').textContent=game.collected.size+' van '+game.level.stars.length+' sterren · '+formatTime(game.elapsed)+' · '+game.falls+' keer gevallen';$('primary').textContent='Nog een avontuur →';toastTimer=0;$('toast').style.opacity=0;}
}
function start(){showRecords();reset();setState('playing');toast('Volg de sterren naar het portaal.');}
$('primary').onclick=()=>state==='paused'?setState('playing'):start();$('secondary').onclick=start;$('pause').onclick=()=>{if(state==='playing')setState('paused');else if(state==='paused')setState('playing');};
function keyDown(code,repeat=false){if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyW','KeyA','KeyD','Escape','KeyR','Enter'].includes(code)){
 if(repeat||keys.has(code))return;
 if(code==='Escape'){if(state==='playing')setState('paused');else if(state==='paused')setState('playing');return;}
 if(code==='KeyR'&&state!=='start'){start();return;}
 if(code==='Enter'&&state!=='playing'){state==='paused'?setState('playing'):start();return;}
 const wasJump=[...jumpKeys].some(k=>keys.has(k));keys.add(code);if(jumpKeys.has(code)&&!wasJump&&state==='playing')jumpPressed=true;
}}
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();keyDown(e.code,e.repeat);});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{clearInput();if(state==='playing')setState('paused');});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')setState('paused');});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keyDown(b.dataset.key);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));}
function burst(x,y){for(let i=0;i<12&&game.particles.length<120;i++){const a=i*Math.PI/6;game.particles.push({x,y,vx:Math.cos(a)*60,vy:Math.sin(a)*60-30,life:.65,max:.65,size:2+i%3,color:i%2?'#ffe4a2':'#ebc6ff'});}}
function update(dt){game.elapsed+=dt;const p=game.player,wasGrounded=p.grounded,previousVy=p.vy;StarPhysics.step(p,{left:keys.has('KeyA')||keys.has('ArrowLeft'),right:keys.has('KeyD')||keys.has('ArrowRight'),jump:[...jumpKeys].some(k=>keys.has(k)),pressed:jumpPressed},dt,game.level.platforms,game.level.width);jumpPressed=false;
 if(p.vy<0&&previousVy>=0)StarAudio.play('jump');
 if(!wasGrounded&&p.grounded&&previousVy>100){StarAudio.play('land');for(let i=0;i<8&&game.particles.length<120;i++)game.particles.push({x:p.x+p.w/2,y:p.y+p.h-2,vx:(i-3.5)*19,vy:-20-Math.random()*30,life:.3,max:.3,size:2,color:'#c6e0cf'});}
 for(let i=0;i<game.level.stars.length;i++){const s=game.level.stars[i];if(!game.collected.has(i)&&Math.hypot(p.x+p.w/2-s.x,p.y+p.h/2-s.y)<31){game.collected.add(i);burst(s.x,s.y);StarAudio.play('star');const badge=$('stars').parentElement;badge.classList.remove('sparkle');void badge.offsetWidth;badge.classList.add('sparkle');}}
 if(p.y>game.level.height){game.falls++;game.player=StarPhysics.createPlayer(game.level.spawn);game.collected.clear();game.particles=[];game.camera=0;clearInput();toast('Een nieuwe sprong. Je kunt het!');}
 const target=Math.max(0,Math.min(game.level.width-960,game.player.x-330));game.camera+=(target-game.camera)*(1-Math.exp(-5*dt));
 for(const part of game.particles){part.x+=part.vx*dt;part.y+=part.vy*dt;part.vy+=70*dt;part.life-=dt;}game.particles=game.particles.filter(p=>p.life>0);
 if(p.x+p.w>game.level.portal.x-22&&p.x<game.level.portal.x+25&&p.grounded&&Math.abs(p.y+p.h-game.level.portal.y)<5)setState('complete');updateHud();
}
function frame(ms){const dt=Math.min((ms-last)/1000||0,0.1);last=ms;visualTime+=dt;if(state==='playing'){accumulator+=dt;while(accumulator>=1/120){update(1/120);accumulator-=1/120;if(state!=='playing'){accumulator=0;break;}}}if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').style.opacity=0;}StarRenderer.render(ctx,game,visualTime);requestAnimationFrame(frame);}
showRecords();setState('start');updateHud();requestAnimationFrame(frame);
})();
