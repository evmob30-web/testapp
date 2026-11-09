/* Originele, zachte synthgeluiden. Audio start uitsluitend na een gebruikersactie. */
(function(){
let context=null,master=null,muted=false;try{muted=localStorage.getItem('star-hopper-muted')==='true';}catch{}
function unlock(){if(muted)return;try{context??=new (window.AudioContext||window.webkitAudioContext)();if(!master){master=context.createGain();master.connect(context.destination);}master.gain.setValueAtTime(1,context.currentTime);if(context.state==='suspended')context.resume().catch(()=>{});}catch{}}
function note(frequency,delay,duration,volume=.045,end=frequency){if(muted||!context||context.state!=='running')return;try{const time=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(frequency,time);osc.frequency.exponentialRampToValueAtTime(end,time+duration);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain);gain.connect(master);osc.start(time);osc.stop(time+duration+.02);}catch{}}
function play(name){if(name==='jump')note(300,0,.17,.035,590);if(name==='land')note(150,0,.1,.025,85);if(name==='star'){note(784,0,.22);note(1175,.075,.3,.035);}if(name==='portal')[523,659,784,1047].forEach((f,i)=>note(f,i*.1,.5,.035));}
window.StarAudio={unlock,play,get muted(){return muted;},toggle(){muted=!muted;if(master)master.gain.setValueAtTime(muted?0:1,context.currentTime);try{localStorage.setItem('star-hopper-muted',String(muted));}catch{}if(!muted)unlock();return muted;}};
})();
