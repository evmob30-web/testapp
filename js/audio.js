/* Procedurele gevechts- en omgevingsgeluiden. Alles blijft lokaal en start na invoer. */
(function(){
let ctx=null,master=null,ambient=null,wind=null,filter=null,windGain=null,muted=false,area='valley',active=false,birdTime=1.2,dropTime=.7;
try{muted=localStorage.getItem('emberwild-muted')==='true';}catch{}
function applyEnvironment(){if(!ctx||!ambient)return;if(ambient.gain.setTargetAtTime)ambient.gain.setTargetAtTime(active?1:0,ctx.currentTime,.08);else ambient.gain.setValueAtTime(active?1:0,ctx.currentTime);if(filter)filter.frequency.setValueAtTime(area==='roots'?360:1000,ctx.currentTime);if(windGain)windGain.gain.setValueAtTime(area==='roots'?.025:.075,ctx.currentTime);}
function ensureAmbience(){
 if(!ambient){ambient=ctx.createGain();ambient.connect(master);}
 if(!wind&&ctx.createBuffer&&ctx.createBufferSource&&ctx.createBiquadFilter){
  const length=Math.floor(ctx.sampleRate*2),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<length;i++){last=(last+.025*(Math.random()*2-1))/1.025;data[i]=last*4*Math.min(1,i/(ctx.sampleRate*.12),(length-1-i)/(ctx.sampleRate*.12));}
  wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;filter=ctx.createBiquadFilter();filter.type='lowpass';windGain=ctx.createGain();wind.connect(filter);filter.connect(windGain);windGain.connect(ambient);applyEnvironment();wind.start();
 }
 applyEnvironment();
}
async function unlock(){if(muted)return false;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!ctx||ctx.state==='closed'){ctx=new Audio();master=ctx.createGain();master.connect(ctx.destination);ambient=wind=filter=windGain=null;}master.gain.setValueAtTime(1,ctx.currentTime);if(ctx.state!=='running')await ctx.resume();if(ctx.state==='running')ensureAmbience();return ctx.state==='running';}catch{return false;}}
function tone(from,to,length,volume=.1,delay=0,type='triangle',destination=master){if(muted||!ctx||ctx.state!=='running')return;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+length);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g);g.connect(destination||master);o.start(t);o.stop(t+length+.03);o.onended=()=>{o.disconnect();g.disconnect();};}
function play(name){try{if(name==='bow'){tone(280,110,.13,.09);tone(1100,700,.09,.045);}if(name==='block'){tone(900,400,.12,.09);tone(1400,700,.14,.04,.025);}if(name==='sword')tone(350,90,.16,.1,0,'sawtooth');if(name==='hit')tone(145,55,.12,.15);if(name==='magic'){tone(440,1100,.25,.12);tone(880,420,.25,.07,.08);}if(name==='dodge')tone(220,65,.24,.1);if(name==='hurt')tone(130,65,.2,.13);if(name==='heal'){tone(523,659,.28,.12);tone(784,1047,.32,.1,.13);}if(name==='loot')[523,659,784,1047].forEach((n,i)=>tone(n,n,.4,.1,i*.09));if(name==='gather'){tone(720,980,.16,.07);tone(1100,880,.15,.05,.09);}if(name==='test'){tone(659,659,.25,.12);tone(988,988,.3,.12,.14);}}catch{}}
function update(dt,nextArea,playing){try{
 const next=nextArea==='roots'?'roots':'valley';if(next!==area||active!==playing){area=next;active=playing;birdTime=1.2;dropTime=.7;applyEnvironment();}
 if(!active||muted||!ctx||ctx.state!=='running')return;
 if(area==='valley'){birdTime-=dt;if(birdTime<=0){tone(1800,2600,.13,.04,0,'sine',ambient);tone(2450,1650,.17,.033,.18,'sine',ambient);birdTime=3.5+Math.random()*4;}}
 else{dropTime-=dt;if(dropTime<=0){for(const [delay,volume] of [[0,.06],[.21,.023],[.43,.009]])tone(1600,550,.08,volume,delay,'sine',ambient);dropTime=1.4+Math.random()*2;}}
}catch{}}
window.EmberAudio={unlock,play,update,get muted(){return muted;},toggle(){muted=!muted;if(master)master.gain.setValueAtTime(muted?0:1,ctx.currentTime);try{localStorage.setItem('emberwild-muted',String(muted));}catch{}if(!muted)unlock().then(ok=>{if(ok)play('test');});return muted;}};
})();
