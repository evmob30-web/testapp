/* Originele synthgeluiden. Hervat browseraudio uitsluitend vanuit gebruikersinvoer. */
(function(){
let context=null,master=null,muted=false,available=true;
try{muted=localStorage.getItem('star-hopper-muted')==='true';}catch{}
function remember(){try{localStorage.setItem('star-hopper-muted',String(muted));}catch{}}
async function unlock(){
 if(muted)return false;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){available=false;return false;}
  if(!context||context.state==='closed'){context=new Audio();master=context.createGain();master.connect(context.destination);}
  master.gain.setValueAtTime(1,context.currentTime);
  // Safari kan ook 'interrupted' melden nadat de app op de achtergrond stond.
  if(context.state!=='running')await context.resume();
  available=context.state==='running';return available;
 }catch{available=false;return false;}
}
function note(frequency,delay,duration,volume=.13,end=frequency){
 if(muted||!context||context.state!=='running')return;
 try{const time=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();osc.type='triangle';osc.frequency.setValueAtTime(frequency,time);osc.frequency.exponentialRampToValueAtTime(end,time+duration);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.015);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain);gain.connect(master);osc.start(time);osc.stop(time+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};}catch{}
}
function play(name){if(name==='jump')note(300,0,.22,.13,590);if(name==='land')note(180,0,.14,.09,100);if(name==='star'||name==='test'){note(784,0,.3);note(1175,.1,.38,.12);}if(name==='portal')[523,659,784,1047].forEach((f,i)=>note(f,i*.12,.6,.12));}
window.StarAudio={unlock,play,get muted(){return muted;},get available(){return available;},toggle(){muted=!muted;if(master)master.gain.setValueAtTime(muted?0:1,context.currentTime);remember();if(!muted)unlock().then(ok=>{if(ok)play('test');});return muted;},async test(){muted=false;remember();const ok=await unlock();if(ok)play('test');return ok;}};
})();
