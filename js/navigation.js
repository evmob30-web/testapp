/* Shared bounded A* and cancellable interaction orders. No renderer or combat rules. */
(function(root){
'use strict';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),states=Object.freeze({IDLE:'IDLE',MOVING_TO_TARGET:'MOVING_TO_TARGET',INTERACTING:'INTERACTING',ATTACKING:'ATTACKING',CANCELLED:'CANCELLED'});
function createField({bounds,circles=[],radius=.62,step=.75,canStand,maxNodes=9000}){
 const buckets=new Map(),cell=4,cache=new Map(),width=Math.floor((bounds.maxX-bounds.minX)/step)+1,height=Math.floor((bounds.maxZ-bounds.minZ)/step)+1;
 circles.forEach((c,id)=>{const r=c.r+radius,entry={x:c.x,z:c.z,r,id};for(let x=Math.floor((c.x-r)/cell);x<=Math.floor((c.x+r)/cell);x++)for(let z=Math.floor((c.z-r)/cell);z<=Math.floor((c.z+r)/cell);z++){const key=x+','+z;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(entry);}});
 const nearby=(x,z)=>buckets.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];
 function stand(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))return false;if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return false;if(canStand&&!canStand(x,z,radius))return false;for(const c of nearby(x,z))if((x-c.x)**2+(z-c.z)**2<c.r*c.r-1e-8)return false;return true;}
 function clear(a,b){
  if(!stand(a.x,a.z)||!stand(b.x,b.z))return false;const length=distance(a,b),steps=Math.max(1,Math.ceil(length/.18)),seen=new Set(),dx=b.x-a.x,dz=b.z-a.z;
  for(let i=0;i<=steps;i++){const t=i/steps,x=a.x+dx*t,z=a.z+dz*t;if(canStand&&!canStand(x,z,radius))return false;for(const c of nearby(x,z)){if(seen.has(c.id))continue;seen.add(c.id);const u=Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.z-a.z)*dz)/(length*length||1)));if((a.x+dx*u-c.x)**2+(a.z+dz*u-c.z)**2<c.r*c.r-1e-8)return false;}}
  return true;
 }
 const point=(x,z)=>({x:bounds.minX+x*step,z:bounds.minZ+z*step});
 function free(x,z){if(x<0||z<0||x>=width||z>=height)return false;const key=z*width+x;if(!cache.has(key)){const p=point(x,z);cache.set(key,stand(p.x,p.z));}return cache.get(key);}
 function findPath(start,goal){
  const range=Math.max(.15,goal.range||.15),inside=p=>distance(p,goal)<=range&&(!goal.canReach||goal.canReach(p,goal));if(!stand(start.x,start.z))return null;if(inside(start))return [];
  const d=distance(start,goal),stop={x:goal.x+(start.x-goal.x)/d*Math.max(.1,range-.18),z:goal.z+(start.z-goal.z)/d*Math.max(.1,range-.18)};
  if(stand(stop.x,stop.z)&&inside(stop)&&clear(start,stop))return [stop];
  const sx=Math.round((start.x-bounds.minX)/step),sz=Math.round((start.z-bounds.minZ)/step);let first=null,firstD=Infinity;
  for(let z=sz-2;z<=sz+2;z++)for(let x=sx-2;x<=sx+2;x++){if(!free(x,z))continue;const p=point(x,z),d=distance(start,p);if(d<firstD&&clear(start,p)){first={x,z,p};firstD=d;}}
  if(!first)return null;const id=(x,z)=>z*width+x,heap=[],scores=new Map(),parents=new Map(),closed=new Set(),heuristic=p=>Math.max(0,distance(p,goal)-range);
  function push(n){heap.push(n);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(heap[parent].f<=n.f)break;heap[i]=heap[parent];i=parent;}heap[i]=n;}
  function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(heap[child].f>=last.f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return top;}
  const firstId=id(first.x,first.z);scores.set(firstId,firstD);push({...first,g:firstD,f:firstD+heuristic(first.p)});let found=null,expanded=0;
  while(heap.length&&expanded<maxNodes){const n=pop(),key=id(n.x,n.z);if(closed.has(key))continue;closed.add(key);expanded++;if(inside(n.p)){found=key;break;}
   for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const x=n.x+dx,z=n.z+dz,keyNext=id(x,z);if(!free(x,z)||closed.has(keyNext))continue;const p=point(x,z);if(!clear(n.p,p))continue;const g=n.g+step*Math.hypot(dx,dz);if(g>=(scores.get(keyNext)??Infinity))continue;scores.set(keyNext,g);parents.set(keyNext,key);push({x,z,p,g,f:g+heuristic(p)});}
  }
  if(found===null)return null;const path=[];for(let key=found;key!==undefined;key=parents.get(key))path.unshift(point(key%width,Math.floor(key/width)));
  const smooth=[];let anchor=start,index=0;while(index<path.length){let next=Math.min(path.length-1,index+18);while(next>index&&!clear(anchor,path[next]))next--;smooth.push(path[next]);anchor=path[next];index=next+1;}return smooth;
 }
 return {stand,clear,findPath,bounds,step,get cachedCells(){return cache.size;}};
}
function createController({position,resolve,field,inRange,canAct=()=>true,onAct=()=>{},onCancel=()=>{},onChange=()=>{}}){
 let state=states.IDLE,order=null,path=[],index=0,age=0,replanAge=0,replans=0,stuck=0,last=null,revision=0,lastGoal=null;
 const change=value=>{if(state===value)return;state=value;onChange(state,order);};
 function cancel(reason='cancelled',silent=false){if(!order&&state===states.IDLE)return;revision++;const previous=order;order=null;path=[];index=0;change(states.CANCELLED);if(previous&&!silent)onCancel(reason,previous);}
 function plan(target){const f=field(),p=target.position;path=f.findPath(position(),{...p,range:target.range,canReach:target.canReach});index=0;lastGoal={...p};replanAge=0;replans++;return !!path;}
 function go(request){cancel('replaced',true);revision++;order={...request};age=stuck=replans=0;last={x:position().x,z:position().z};const target=resolve(order);if(!target){cancel('invalid');return false;}order.identity=order.identity??target.identity;change(states.MOVING_TO_TARGET);if(!plan(target)){cancel('unreachable');return false;}return true;}
 function update(dt){
  if(!order||!Number.isFinite(dt)||dt<=0)return {x:0,z:0};age+=dt;replanAge+=dt;const target=resolve(order),p=position();
  if(!target||target.identity!==order.identity){cancel('invalid');return {x:0,z:0};}
  if(age>(order.timeout||40)||replans>18){cancel('timeout');return {x:0,z:0};}
  const ready=inRange?inRange(p,target,order):distance(p,target.position)<=target.range&&(!target.canReach||target.canReach(p,target.position));
  if(ready){change(order.action?'ATTACKING':'INTERACTING');if(canAct(target,order)){const executing=order;order=null;path=[];index=0;revision++;onChange(state,executing);onAct(target,executing);}return {x:0,z:0};}
  if(state!==states.MOVING_TO_TARGET)change(states.MOVING_TO_TARGET);
  const traveled=last?distance(last,p):0;stuck=traveled<.005?stuck+dt:0;last={x:p.x,z:p.z};if(stuck>2.2){cancel('stuck');return {x:0,z:0};}
  if(replanAge>.7&&distance(lastGoal,target.position)>1.0||stuck>.9&&replanAge>1.0||!path.length){if(!plan(target)){cancel('unreachable');return {x:0,z:0};}}
  while(index<path.length&&distance(p,path[index])<.13)index++;
  if(index>=path.length){if(replanAge>.6&&!plan(target))cancel('unreachable');return {x:0,z:0};}
  const waypoint=path[index],d=distance(p,waypoint);return {x:(waypoint.x-p.x)/d,z:(waypoint.z-p.z)/d,remaining:d,automatic:true};
 }
 function checkStep(a,b){if(!order)return true;if(field().clear(a,b))return true;const target=resolve(order);if(target&&replanAge>.3&&plan(target))return false;cancel('blocked');return false;}
 return {go,cancel,update,checkStep,get state(){return state;},get order(){return order;},get revision(){return revision;},get route(){return path.slice(index);}};
}
root.EmberNavigation={states,createField,createController,distance};
})(typeof window==='undefined'?globalThis:window);
