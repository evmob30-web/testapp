/* Pointer-based input, shared with mouse/keyboard. Menus retain native scrolling. */
(function(root){
'use strict';
const storageKey='emberwild-control-mode-v1',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function detect(info={}){
 const capable=info.maxTouchPoints>0||info.coarse,ipad=info.platform==='MacIntel'&&info.maxTouchPoints>1;
 const enabled=!!(capable&&(info.coarsePrimary||!info.hover||info.mobile||ipad));
 return {enabled,type:Math.min(info.width||1024,info.height||768)<600?'phone':'tablet',hybrid:!!(capable&&info.fine)};
}
function joystick(dx,dy,radius=48){const length=Math.hypot(dx,dy),amount=clamp(length/radius,0,1);if(amount<=.13)return {x:0,z:0,amount:0};return {x:dx/length*(amount-.13)/.87,z:dy/length*(amount-.13)/.87,amount:(amount-.13)/.87};}
function create(doc,callbacks={},env=root){
 const $=id=>doc.getElementById(id),html=doc.documentElement||$('hud'),pointers=new Map(),actions=new Map(),pad=$('joystick'),knob=$('joystick-thumb'),modeSelect=$('control-mode');
 let choice='auto',enabled=false,type='phone',active=false,lastInput='mouse',padId=null,padOrigin=null,vector={x:0,z:0,amount:0},pinch=null,latchedTouch=false,portraitDismissed=false;
 const media=q=>{try{return !!env.matchMedia?.(q).matches;}catch(_){return false;}};
 try{choice=env.localStorage?.getItem(storageKey)||'auto';}catch(_){}if(!['auto','touch','desktop'].includes(choice))choice='auto';
 function info(){return {maxTouchPoints:env.navigator?.maxTouchPoints||0,platform:env.navigator?.platform||'',coarse:media('(any-pointer: coarse)'),coarsePrimary:media('(pointer: coarse)'),fine:media('(any-pointer: fine)'),hover:media('(hover: hover)'),mobile:!!env.navigator?.userAgentData?.mobile,width:env.screen?.width||env.innerWidth,height:env.screen?.height||env.innerHeight};}
 function setPressed(node,pressed){node.dataset.pressed=String(pressed);}
 function releaseAll(){pointers.clear();pinch=null;padId=null;padOrigin=null;vector={x:0,z:0,amount:0};knob.style.transform='translate(0px,0px)';pad.dataset.active='false';for(const node of new Set(actions.values())){setPressed(node,false);callbacks.actionEnd?.(node.id,true);}actions.clear();}
 function refresh(){const detected=detect(info()),next=choice==='touch'||choice==='auto'&&(detected.enabled||latchedTouch);type=detected.type;if(enabled!==next){releaseAll();enabled=next;callbacks.modeChange?.(enabled,type);}html.dataset.controls=enabled?'touch':'desktop';html.dataset.touchDevice=type;modeSelect.value=choice;$('touch-controls').hidden=!enabled||!active;const portrait=(env.innerHeight||0)>(env.innerWidth||0);$('landscape-tip').hidden=!enabled||!active||!portrait||portraitDismissed;}
 function setMode(value){choice=['auto','touch','desktop'].includes(value)?value:'auto';latchedTouch=false;try{env.localStorage?.setItem(storageKey,choice);}catch(_){}refresh();callbacks.cancel?.('mode');}
 modeSelect.onchange=()=>setMode(modeSelect.value);
 $('landscape-dismiss').onclick=()=>{portraitDismissed=true;refresh();};
 $('touch-map').onclick=()=>{html.dataset.mapOpen=html.dataset.mapOpen==='true'?'false':'true';};
 $('auto-stop').onclick=()=>callbacks.cancel?.('manual');
 function note(kind){lastInput=kind||'mouse';if(active&&(kind==='touch'||kind==='pen')&&!portraitDismissed){portraitDismissed=true;$('landscape-tip').hidden=true;}if((kind==='touch'||kind==='pen')&&choice==='auto'&&!enabled){latchedTouch=true;refresh();}}
 function capture(node,id){try{node.setPointerCapture?.(id);}catch(_){}}
 function stop(e){e.preventDefault?.();e.stopPropagation?.();}
 function releasePointer(id){pointers.delete(id);if(padId===id){padId=null;padOrigin=null;vector={x:0,z:0,amount:0};knob.style.transform='translate(0px,0px)';pad.dataset.active='false';}pinch=null;}
 pad.addEventListener('pointerdown',e=>{if(!active||!enabled||padId!==null)return;note(e.pointerType);stop(e);padId=e.pointerId;const r=pad.getBoundingClientRect?.()||{left:0,top:0,width:120,height:120};padOrigin={x:r.left+r.width/2,y:r.top+r.height/2,radius:r.width*.34};pad.dataset.active='true';capture(pad,e.pointerId);callbacks.manual?.();movePad(e);});
 function movePad(e){if(e.pointerId!==padId||!padOrigin)return;stop(e);const dx=e.clientX-padOrigin.x,dy=e.clientY-padOrigin.y;vector=joystick(dx,dy,padOrigin.radius);const d=Math.hypot(dx,dy)||1,m=Math.min(padOrigin.radius,d);knob.style.transform='translate('+(dx/d*m)+'px,'+(dy/d*m)+'px)';if(vector.amount>0)callbacks.manual?.();}
 pad.addEventListener('pointermove',movePad);for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,e=>{if(e.pointerId===padId){stop(e);releasePointer(e.pointerId);}});
 function canvasDown(e){
  if(e.pointerType!=='touch'&&e.pointerType!=='pen'){note('mouse');return false;}note(e.pointerType);if(!enabled||!active)return true;stop(e);capture($('world'),e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,drag:false,camera:e.clientX>(env.innerWidth||800)*.40});
  if(pointers.size>1){for(const p of pointers.values())p.drag=true;const p=[...pointers.values()].filter(p=>p.camera);if(p.length>=2)pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}return true;
 }
 function canvasMove(e){
  const p=pointers.get(e.pointerId);if(!p)return e.pointerType==='touch'||e.pointerType==='pen';stop(e);const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  const cameras=[...pointers.values()].filter(p=>p.camera);if(cameras.length>=2){const distance=Math.hypot(cameras[0].x-cameras[1].x,cameras[0].y-cameras[1].y);if(pinch!==null)callbacks.zoom?.(distance-pinch);pinch=distance;return true;}
  if(Math.hypot(p.x-p.startX,p.y-p.startY)>8)p.drag=true;if(p.drag&&p.camera)callbacks.camera?.(clamp(dx,-90,90),clamp(dy,-90,90));return true;
 }
 function canvasUp(e={},cancelled=false){const p=pointers.get(e.pointerId);if(!p)return e.pointerType==='touch'||e.pointerType==='pen';stop(e);releasePointer(e.pointerId);if(!cancelled&&!p.drag)callbacks.tap?.(e.clientX,e.clientY);return true;}
 const ids=['attack','magic','barrier','blink','heal','dodge','touch-interact','touch-loot','touch-target'];
 for(const id of ids){const button=$(id);let suppressUntil=0;
  button.addEventListener('pointerdown',e=>{if(!active||!enabled||button.disabled||e.pointerType==='mouse'&&choice!=='touch')return;note(e.pointerType);stop(e);capture(button,e.pointerId);suppressUntil=Date.now()+900;const alreadyHeld=[...actions.values()].includes(button);actions.set(e.pointerId,button);setPressed(button,true);if(!alreadyHeld)callbacks.action?.(id);});
  const end=(e,cancelled)=>{if(actions.get(e.pointerId)!==button)return;stop(e);actions.delete(e.pointerId);const stillHeld=[...actions.values()].includes(button);setPressed(button,stillHeld);if(!stillHeld)callbacks.actionEnd?.(id,cancelled);};
  button.addEventListener('pointerup',e=>end(e,false));button.addEventListener('pointercancel',e=>end(e,true));button.addEventListener('lostpointercapture',e=>end(e,true));
  button.addEventListener('click',e=>{if(e.pointerType==='touch'||e.pointerType==='pen'||e.detail>0&&Date.now()<suppressUntil){e.preventDefault?.();e.stopImmediatePropagation?.();}},true);
 }
 function setActive(value){if(active===value)return;active=value;if(!active)releaseAll();refresh();}
 if(typeof env.matchMedia==='function'){for(const q of ['(pointer: coarse)','(any-pointer: coarse)','(hover: hover)'])env.matchMedia(q).addEventListener?.('change',refresh);env.addEventListener?.('resize',()=>{portraitDismissed=false;refresh();});env.addEventListener?.('blur',releaseAll);}
 refresh();
 return {canvasDown,canvasMove,canvasUp,setActive,setMode,refresh,note,releaseAll,get vector(){return vector;},get enabled(){return enabled;},get device(){return type;},get lastInput(){return lastInput;},get primaryHeld(){return [...actions.values()].some(n=>n===$('attack'));},get pointerCount(){return pointers.size+actions.size+(padId!==null?1:0);}};
}
root.EmberTouchControls={detect,joystick,create,storageKey};
})(typeof window==='undefined'?globalThis:window);
