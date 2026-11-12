/* One opaque, non-overlapping surface for the valley's original low-poly colours.
 * Convex overlays partition the ground instead of placing coplanar meshes on it. */
(function(root){
'use strict';
const EPS=1e-9;
function area(poly){let sum=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];sum+=a[0]*b[1]-b[0]*a[1];}return sum/2;}
function clean(poly){
 const result=[];for(const p of poly)if(!result.length||Math.hypot(p[0]-result.at(-1)[0],p[1]-result.at(-1)[1])>EPS)result.push(p);
 if(result.length>1&&Math.hypot(result[0][0]-result.at(-1)[0],result[0][1]-result.at(-1)[1])<=EPS)result.pop();
 return result.length>=3&&Math.abs(area(result))>EPS?result:[];
}
function split(poly,a,b){
 const inside=[],outside=[],side=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],d=side(p),e=side(q),inP=d>=-EPS,inQ=e>=-EPS;
  (inP?inside:outside).push(p);
  if(inP!==inQ){const t=d/(d-e),point=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];inside.push(point);outside.push(point);}
 }
 return {inside:clean(inside),outside:clean(outside)};
}
function intersect(subject,clip){
 let poly=subject;for(let i=0;i<clip.length&&poly.length;i++)poly=split(poly,clip[i],clip[(i+1)%clip.length]).inside;return poly;
}
function subtract(subject,clip){
 const pieces=[];let remaining=subject;
 for(let i=0;i<clip.length&&remaining.length;i++){const cut=split(remaining,clip[i],clip[(i+1)%clip.length]);if(cut.outside.length)pieces.push(cut.outside);remaining=cut.inside;}
 return pieces;
}
function rectangle(x,z,width,depth){return [[x-width/2,z-depth/2],[x+width/2,z-depth/2],[x+width/2,z+depth/2],[x-width/2,z+depth/2]];}
function layout(){
 const overlays=[];
 for(let i=0;i<35;i++){
  const x=Math.sin(i*93.2)*33,z=-58+(i*17.3%91),radius=2+i%4,poly=[];
  // Same heptagons and orientation as the original rotated CircleGeometry.
  for(let j=6;j>=0;j--){const a=j/7*Math.PI*2;poly.push([x+Math.cos(a)*radius,z-Math.sin(a)*radius]);}
  overlays.push({id:'meadow-'+i,color:i%2?'#83986d':'#6f8c67',poly});
 }
 overlays.push({id:'north-path',color:'#b2a27b',poly:rectangle(0,-15,5,90)});
 overlays.push({id:'village-path',color:'#b2a27b',poly:rectangle(0,21,25,4)});
 return {bounds:rectangle(0,-20,170,190),level:-.1,thickness:.5,baseColor:'#77916a',overlays};
}
function bounds(poly){return poly.reduce((b,p)=>({x0:Math.min(b.x0,p[0]),x1:Math.max(b.x1,p[0]),z0:Math.min(b.z0,p[1]),z1:Math.max(b.z1,p[1])}),{x0:Infinity,x1:-Infinity,z0:Infinity,z1:-Infinity});}
function partition(config=layout()){
 let regions=[{id:'meadow-base',color:config.baseColor,poly:config.bounds}];
 for(const overlay of config.overlays){
  const poly=intersect(overlay.poly,config.bounds);if(!poly.length)continue;const b=bounds(poly),next=[];
  for(const region of regions){
   const a=bounds(region.poly);
   if(a.x1<b.x0-EPS||a.x0>b.x1+EPS||a.z1<b.z0-EPS||a.z0>b.z1+EPS||!intersect(region.poly,poly).length)next.push(region);
   else for(const piece of subtract(region.poly,poly))next.push({...region,poly:piece});
  }
  next.push({...overlay,poly});regions=next;
 }
 return regions;
}
function create(T,config=layout()){
 const regions=partition(config),positions=[],colours=[],indices=[],palette=new Map(),unique=new Map();
 const snap=v=>Math.round(v*1e6)/1e6;
 for(const region of regions){region.poly=clean(region.poly.map(p=>[snap(p[0]),snap(p[1])]));for(const p of region.poly)unique.set(p.join(','),p);}
 const vertices=[...unique.values()];
 const tint=color=>{if(!palette.has(color))palette.set(color,new T.Color(color));return palette.get(color);};
 function vertex(p,y,color){positions.push(p[0],y,p[1]);const c=tint(color);colours.push(c.r,c.g,c.b);return positions.length/3-1;}
 // Insert shared boundary vertices into neighbouring edges to avoid T-junction cracks.
 for(const region of regions){
  const poly=[];
  for(let i=0;i<region.poly.length;i++){
   const a=region.poly[i],b=region.poly[(i+1)%region.poly.length],dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz,points=[];poly.push(a);
   for(const p of vertices){const t=((p[0]-a[0])*dx+(p[1]-a[1])*dz)/length;if(t<=1e-7||t>=1-1e-7)continue;const distance=Math.abs(dx*(p[1]-a[1])-dz*(p[0]-a[0]))/Math.sqrt(length);if(distance<2e-6)points.push({p,t});}
   points.sort((a,b)=>a.t-b.t);for(const item of points)poly.push(item.p);
  }
  if(poly.length<3)continue;const center=poly.reduce((c,p)=>[c[0]+p[0]/poly.length,c[1]+p[1]/poly.length],[0,0]),origin=vertex(center,config.level,region.color),edge=poly.map(p=>vertex(p,config.level,region.color));
  for(let i=0;i<edge.length;i++)indices.push(origin,edge[(i+1)%edge.length],edge[i]);
 }
 // Retain the old ground block's edge and underside without a second top face.
 const box=config.bounds,top=box.map(p=>vertex(p,config.level,config.baseColor)),bottom=box.map(p=>vertex(p,config.level-config.thickness,config.baseColor));
 for(let i=0;i<box.length;i++){const j=(i+1)%box.length;indices.push(top[i],top[j],bottom[i],top[j],bottom[j],bottom[i]);}
 indices.push(bottom[0],bottom[1],bottom[2],bottom[0],bottom[2],bottom[3]);
 const geometry=new T.BufferGeometry();geometry.name='PartitionedValleyTerrain';geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.95,flatShading:true}));mesh.name='ValleyTerrain';mesh.receiveShadow=true;mesh.userData.terrain={meadows:35,regions:regions.length,level:config.level};return mesh;
}
root.EmberTerrain={layout,partition,intersect,area,create};
})(typeof window==='undefined'?globalThis:window);
