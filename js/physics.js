(function(root){
const C={speed:265,acceleration:1900,friction:2300,gravity:1550,jump:590,maxFall:850,coyote:.11,buffer:.13};
const approach=(a,b,d)=>a<b?Math.min(a+d,b):Math.max(a-d,b);
function createPlayer(spawn){return {x:spawn.x,y:spawn.y,w:26,h:36,vx:0,vy:0,grounded:false,coyote:0,buffer:0,facing:1,animation:'idle'};}
function step(p,input,dt,platforms,width){
 p.buffer=input.pressed?C.buffer:Math.max(0,p.buffer-dt);
 p.coyote=p.grounded?C.coyote:Math.max(0,p.coyote-dt);
 const axis=Number(input.right)-Number(input.left);
 p.vx=approach(p.vx,axis*C.speed,(axis?C.acceleration:C.friction)*dt);
 if(axis)p.facing=axis;
 if(p.buffer>0&&p.coyote>0){p.vy=-C.jump;p.grounded=false;p.coyote=0;p.buffer=0;}
 if(!input.jump&&p.vy< -220)p.vy=-220;
 p.vy=Math.min(C.maxFall,p.vy+C.gravity*dt);
 const oldX=p.x;p.x=Math.max(0,Math.min(width-p.w,p.x+p.vx*dt));
 for(const b of platforms){if(p.y+p.h>b.y+.01&&p.y<b.y+b.h&&p.x+p.w>b.x&&p.x<b.x+b.w){if(oldX+p.w<=b.x+.01)p.x=b.x-p.w;else if(oldX>=b.x+b.w-.01)p.x=b.x+b.w;p.vx=0;}}
 const oldY=p.y;p.y+=p.vy*dt;p.grounded=false;
 for(const b of platforms){if(p.x+p.w>b.x+.01&&p.x<b.x+b.w-.01){if(p.vy>=0&&oldY+p.h<=b.y+.01&&p.y+p.h>=b.y){p.y=b.y-p.h;p.vy=0;p.grounded=true;}else if(p.vy<0&&oldY>=b.y+b.h-.01&&p.y<=b.y+b.h){p.y=b.y+b.h;p.vy=0;}}}
 p.animation=p.grounded?(Math.abs(p.vx)>15?'run':'idle'):(p.vy<0?'jump':'fall');
}
root.StarPhysics={C,createPlayer,step};
})(typeof window==='undefined'?globalThis:window);
