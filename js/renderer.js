/* De Nova-renderer ontvangt alleen pose en tijd: later te vervangen door spritesheets. */
(function(){
const W=960,H=540;
function star(c,x,y,r,color='#fff2b4'){c.fillStyle=color;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,d=i%2?r*.36:r;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);}c.closePath();c.fill();}
function cloud(c,x,y,s,color){c.fillStyle=color;const pts=[[0,10,48,14],[24,0,75,28],[-22,18,147,17],[-45,28,195,12]];for(const [a,b,w,h] of pts)c.fillRect(Math.round(x+a*s),Math.round(y+b*s),w*s,h*s);}
function drawNova(c,p,t){c.save();c.translate(Math.round(p.x+p.w/2),Math.round(p.y+p.h));c.scale(p.facing,1);const run=p.animation==='run',bob=p.grounded?Math.sin(t*(run?17:3))*1.4:0;c.translate(0,bob);c.fillStyle='#6c4d93';c.fillRect(-11,-3,9,4);c.fillRect(4,-3,9,4);if(run){c.fillRect(-11+Math.sin(t*17)*4,-4,8,5);c.fillRect(3-Math.sin(t*17)*4,-4,8,5);}c.fillStyle='#d9cefa';c.fillRect(-10,-27,22,24);c.fillRect(-13,-23,28,13);c.fillRect(-10,-47,7,24);c.fillRect(6,-44,7,21);c.fillStyle='#aa91d0';c.fillRect(-8,-43,3,15);c.fillRect(8,-40,3,13);c.fillStyle='#f4e8fc';c.fillRect(-7,-24,19,12);c.fillStyle='#353252';c.fillRect(0,-22,3,5);c.fillRect(9,-22,3,5);c.fillStyle='#eca7c4';c.fillRect(-4,-16,4,2);c.fillStyle='#6bd0ef';c.fillRect(-12,-11,26,6);c.fillStyle='#4794d3';c.fillRect(-19,-9,10,5);c.fillRect(-26,-9+Math.sin(t*12)*2,10,4);c.shadowColor='#ffe8a2';c.shadowBlur=14;star(c,5,-6,5);c.restore();}
function render(c,g,t){const cam=g.camera;c.clearRect(0,0,W,H);const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#635d9e');sky.addColorStop(.45,'#bc8abb');sky.addColorStop(1,'#f7c8bb');c.fillStyle=sky;c.fillRect(0,0,W,H);
// Tiny deterministic sky lights and a haloed moon.
for(let i=0;i<65;i++){const x=((i*151.7-cam*.08)%1040+1040)%1040-30,y=25+(i*71%260);c.globalAlpha=.25+.35*(1+Math.sin(t*.9+i))/2;star(c,x,y,i%5===0?3:1.2,'#fff1df');}c.globalAlpha=1;
const mx=755-cam*.045;const glow=c.createRadialGradient(mx,112,5,mx,112,100);glow.addColorStop(0,'#fff0d363');glow.addColorStop(1,'#fff0d300');c.fillStyle=glow;c.fillRect(mx-100,12,200,200);c.fillStyle='#f9ddc7';c.beginPath();c.arc(mx,112,35,0,Math.PI*2);c.fill();c.fillStyle='#be9cb9';c.fillRect(mx-12,88,10,5);c.fillRect(mx+14,116,8,4);
for(let layer=0;layer<3;layer++){const factor=[.1,.22,.38][layer];for(let i=-1;i<9;i++){const x=i*240-((cam*factor+t*(layer+1)*2)%240);cloud(c,x,210+layer*100+Math.sin(i*8)*28,1.1+layer*.32,['#eac1d43c','#f1c6d66b','#ffe2dc9c'][layer]);}}
// Distant floating islands.
for(let i=0;i<6;i++){const x=i*360-cam*.28+100,y=252+(i*47%110);c.fillStyle='#8c78ab';c.fillRect(x,y,90,8);c.fillStyle='#8e739f';c.beginPath();c.moveTo(x,y+8);c.lineTo(x+90,y+8);c.lineTo(x+50,y+64);c.closePath();c.fill();c.fillStyle='#c3adc5';c.fillRect(x-3,y-3,96,4);}
c.save();c.translate(-Math.round(cam),0);
for(const [i,p] of g.level.platforms.entries()){
 c.fillStyle='#5e4c83';c.beginPath();c.moveTo(p.x,p.y+10);c.lineTo(p.x+p.w,p.y+10);c.lineTo(p.x+p.w-14,p.y+55);c.lineTo(p.x+p.w*.69,p.y+72);c.lineTo(p.x+p.w*.53,p.y+112);c.lineTo(p.x+p.w*.31,p.y+75);c.lineTo(p.x+10,p.y+54);c.closePath();c.fill();
 c.fillStyle='#76608f';for(let j=12;j<p.w-10;j+=29){c.fillRect(p.x+j,p.y+20+(j*7%30),12,8);c.fillStyle=j%2?'#76608f':'#a080a6';}
 c.fillStyle='#4f6274';c.fillRect(p.x,p.y,p.w,13);c.fillStyle='#83b9ad';c.fillRect(p.x-3,p.y,p.w+6,6);c.fillStyle='#b7d4b5';c.fillRect(p.x,p.y,p.w,3);
 for(let j=8;j<p.w;j+=19){c.fillStyle=j%3?'#8ec3b5':'#e4b7d1';c.fillRect(p.x+j,p.y-4,2,5);c.fillRect(p.x+j-2,p.y-6,2,3);if(j%3===0){c.fillStyle='#ffe5b4';c.fillRect(p.x+j-1,p.y-8,4,3);}}
 if(i%2===0){c.fillStyle='#6d8a9b';c.fillRect(p.x+22,p.y+16,3,38);c.fillRect(p.x+27,p.y+24,3,41);c.fillStyle='#b1c8b3';c.fillRect(p.x+19,p.y+34,5,3);c.fillRect(p.x+28,p.y+49,5,3);}
}
// Portal arch and luminous opening.
const po=g.level.portal;c.save();c.translate(po.x,po.y);c.shadowColor='#ead0ff';c.shadowBlur=25;c.fillStyle='#dcc5f5';c.fillRect(-29,-77,8,77);c.fillRect(22,-77,8,77);c.fillRect(-22,-87,44,10);c.fillStyle='#c1b6df';c.fillRect(-36,-8,73,8);c.shadowBlur=0;const pg=c.createLinearGradient(-20,-80,22,0);pg.addColorStop(0,'#e8d2ffbb');pg.addColorStop(1,'#7aa9e988');c.fillStyle=pg;c.fillRect(-20,-77,42,73);for(let i=0;i<9;i++)star(c,Math.sin(t+i*3)*17,-10-((t*13+i*9)%65),2);c.restore();
for(let i=0;i<g.level.stars.length;i++){if(g.collected.has(i))continue;const s=g.level.stars[i];c.save();c.shadowColor='#fff1a8';c.shadowBlur=18;star(c,s.x,s.y+Math.sin(t*2.5+i)*4,10);c.shadowBlur=0;star(c,s.x-2,s.y-2+Math.sin(t*2.5+i)*4,3,'#fffbe6');c.restore();}
// World-space tutorial markers.
c.fillStyle='#fff0df';c.font='10px system-ui';c.textAlign='center';c.fillText('EEN KLEINE SPRONG, EEN GROOT AVONTUUR',250,340);c.fillStyle='#fff0df99';c.fillText('Houd je springtoets langer vast om hoger te springen',715,310);c.fillText('Het sterrenportaal',po.x,po.y-112);
drawNova(c,g.player,t);
for(const p of g.particles){c.globalAlpha=p.life/p.max;star(c,p.x,p.y,p.size,p.color);}c.globalAlpha=1;c.restore();
// Sparse foreground drifting motes.
for(let i=0;i<13;i++){const x=((i*113+t*7-cam*.65)%1000+1000)%1000,y=360+Math.sin(t*.7+i*2)*90;c.globalAlpha=.3;star(c,x,y,2,'#fff2d2');}c.globalAlpha=1;
}
window.StarRenderer={render,drawNova};
})();
