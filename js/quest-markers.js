/* Original faceted quest symbols. Shared canvas art; readable at any camera distance. */
(function(root){
'use strict';
const WIDTH=256,HEIGHT=384,ASPECT=WIDTH/HEIGHT,cache=new WeakMap();
const exclamation=[[82,46],[128,24],[174,46],[158,216],[100,216]],diamond=[[128,244],[169,274],[128,306],[87,274]];
const question=[[35,74],[54,48],[86,28],[119,20],[153,24],[184,40],[207,68],[211,94],[200,122],[181,142],[155,156],[153,169],[148,216],[98,220],[91,178],[102,150],[121,139],[149,120],[164,102],[165,87],[154,76],[135,72],[120,74],[107,83],[100,108],[48,98]];
const palettes={
 gold:{outline:'#432405',rim:'#e9b753',glow:'#ffc037',face:['#fff4a2','#ffe134','#ffc009','#e99a00'],light:'#fff9b3',bright:'#fff05d',middle:'#ffd52b',shade:'#e7a000',deep:'#c77900'},
 silver:{outline:'#26343e',rim:'#9cabb5',glow:'#b8d2df',face:['#f6fcff','#d1e1e9','#a8bdcb','#778f9f'],light:'#f5fbff',bright:'#dfedf2',middle:'#b9ced9',shade:'#8fa8b7',deep:'#647d8d'}
};
function path(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
function facet(ctx,points,color){path(ctx,points);ctx.fillStyle=color;ctx.fill();}
function paint(canvas,symbol,palette){
 canvas.width=WIDTH;canvas.height=HEIGHT;const ctx=canvas.getContext('2d'),p=palettes[palette];ctx.translate(0,20);ctx.lineJoin='round';
 function body(points,facets){
  path(ctx,points);ctx.strokeStyle=p.rim;ctx.lineWidth=32;ctx.shadowColor=p.glow;ctx.shadowBlur=17;ctx.stroke();ctx.shadowBlur=0;
  const gradient=ctx.createLinearGradient(70,24,158,306);p.face.forEach((color,i)=>gradient.addColorStop(i/3,color));ctx.fillStyle=gradient;ctx.fill();
  ctx.save();path(ctx,points);ctx.clip();facets();ctx.restore();path(ctx,points);ctx.strokeStyle=p.outline;ctx.lineWidth=18;ctx.stroke();
 }
 body(symbol==='!'?exclamation:question,()=>{
  if(symbol==='!'){
   facet(ctx,[[82,46],[128,24],[128,70]],p.light);facet(ctx,[[128,24],[174,46],[128,70]],p.bright);
   facet(ctx,[[82,46],[128,70],[114,198],[100,216]],p.middle);facet(ctx,[[174,46],[158,216],[143,198],[128,70]],p.shade);
   facet(ctx,[[100,216],[114,198],[143,198],[158,216]],p.deep);
  }else{
   facet(ctx,[[35,74],[54,48],[80,70],[67,99]],p.bright);
   facet(ctx,[[54,48],[86,28],[119,20],[125,43],[88,50],[80,70]],p.light);
   facet(ctx,[[119,20],[153,24],[184,40],[164,58],[125,43]],p.bright);
   facet(ctx,[[184,40],[207,68],[211,94],[190,91],[164,58]],p.middle);
   facet(ctx,[[211,94],[200,122],[181,142],[155,156],[139,148],[169,121],[190,91]],p.shade);
   facet(ctx,[[139,148],[155,156],[153,169],[148,216],[128,199],[125,166]],p.shade);
   facet(ctx,[[98,220],[128,199],[148,216]],p.deep);
  }
 });
 body(diamond,()=>{
  facet(ctx,[[87,274],[128,244],[128,274]],p.light);facet(ctx,[[128,244],[169,274],[128,274]],p.bright);
  facet(ctx,[[87,274],[128,274],[128,306]],p.middle);facet(ctx,[[128,274],[169,274],[128,306]],p.shade);
 });
}
function materials(T){
 if(cache.has(T))return cache.get(T);
 const result=[['!','gold'],['?','silver'],['?','gold']].map(([symbol,palette])=>{
  const canvas=document.createElement('canvas');paint(canvas,symbol,palette);const texture=new T.CanvasTexture(canvas);texture.name='Quest '+palette+' '+symbol;texture.colorSpace=T.SRGBColorSpace;
  return new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,fog:false,toneMapped:false});
 });cache.set(T,result);return result;
}
function dimensions(depth,fov,viewportHeight){
 const h=Math.max(1,viewportHeight),focal=h/(2*Math.tan(fov*Math.PI/360)),near=h<480?48:64,far=h<480?68:86,pixels=Math.max(near,Math.min(far,1.5*focal/Math.max(.1,depth)));
 return {height:pixels*Math.max(.1,depth)/focal,pixels};
}
function create(T){
 const group=new T.Group(),anchor=new T.Vector3(),view=new T.Vector3(),symbols=materials(T).map(material=>{const sprite=new T.Sprite(material);sprite.center.set(.5,0);sprite.scale.set(ASPECT,1,1);sprite.renderOrder=300;sprite.frustumCulled=false;group.add(sprite);return sprite;});group.scale.setScalar(1.5);
 function place(position){anchor.copy(position);anchor.y+=3.9;group.position.copy(anchor);}
 function updateView(camera,viewportHeight,time=0){
  view.copy(anchor).applyMatrix4(camera.matrixWorldInverse);const depth=-view.z;group.position.copy(anchor);
  if(depth<=camera.near){group.scale.setScalar(1.5);return;}
  const size=dimensions(depth,camera.fov,viewportHeight);group.scale.setScalar(size.height);group.position.y+=Math.sin(time*1.8)*1.5*size.height/size.pixels;
 }
 return {group,symbols,place,updateView};
}
root.EmberQuestMarkers={create,dimensions};
})(typeof window==='undefined'?globalThis:window);
