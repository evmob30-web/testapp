const {test}=require('node:test'),assert=require('node:assert/strict'),T=require('../vendor/three.min.js');
require('../js/terrain.js');const terrain=EmberTerrain,config=terrain.layout(),regions=terrain.partition(config),mesh=terrain.create(T);mesh.updateMatrixWorld(true);
const bounds=poly=>poly.reduce((r,p)=>({x0:Math.min(r.x0,p[0]),x1:Math.max(r.x1,p[0]),z0:Math.min(r.z0,p[1]),z1:Math.max(r.z1,p[1])}),{x0:Infinity,x1:-Infinity,z0:Infinity,z1:-Infinity});
const g=mesh.geometry,p=g.attributes.position,c=g.attributes.color,ray=new T.Raycaster(),v=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),d=new T.Vector3(),weights=new T.Vector3();
function sample(x,z){ray.set(new T.Vector3(x,2,z),new T.Vector3(0,-1,0));return ray.intersectObject(mesh,false);}
function colour(hit){return new T.Color().fromBufferAttribute(c,hit.face.a).getHexString();}
test('the original meadow designs, path widths and ground bounds are retained as coloured regions',()=>{
 assert.equal(config.overlays.filter(o=>o.id.startsWith('meadow-')).length,35);assert.equal(config.overlays.filter(o=>o.id.includes('path')).length,2);
 assert.deepEqual(bounds(config.bounds),{x0:-85,x1:85,z0:-115,z1:75});assert.deepEqual(bounds(config.overlays.find(o=>o.id==='north-path').poly),{x0:-2.5,x1:2.5,z0:-60,z1:30});
 assert.deepEqual(new Set(regions.map(r=>r.color)),new Set(['#77916a','#83986d','#6f8c67','#b2a27b']));assert.ok(regions.filter(r=>r.id.startsWith('meadow-')).length>35,'green landscape regions remain present');
});
test('terrain regions cover the original floor with no positive-area overlaps',()=>{
 assert.ok(Math.abs(regions.reduce((n,r)=>n+terrain.area(r.poly),0)-170*190)<1e-6,'there are no holes or duplicate layers');const boxes=regions.map(r=>bounds(r.poly));
 for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++){
  const a=boxes[i],b=boxes[j];if(a.x1<=b.x0||b.x1<=a.x0||a.z1<=b.z0||b.z1<=a.z0)continue;
  assert.ok(Math.abs(terrain.area(terrain.intersect(regions[i].poly,regions[j].poly)))<1e-6,'coplanar colours cannot cover the same area');
 }
});
test('the actual rendered triangles give a single surface at former stripe locations and elsewhere',()=>{
 let seed=19;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},probes=[];
 for(let i=0;i<400;i++)probes.push([-80+random()*160,-110+random()*180]);
 for(const [x,z]of [[.2,-45.55],[.2,-32.75],[-.2,-6.45],[-.2,6.35],[-28.6,-25.65],[28.6,-51.95]])for(let i=0;i<30;i++)probes.push([x+(random()-.5)*8,z+(random()-.5)*8]);
 for(const [x,z]of probes){const hits=sample(x,z);assert.ok(hits.length>0,'the floor remains closed');let interiors=0;for(const hit of hits){assert.ok(Math.abs(hit.point.y-config.level)<1e-6);a.fromBufferAttribute(p,hit.face.a);b.fromBufferAttribute(p,hit.face.b);d.fromBufferAttribute(p,hit.face.c);T.Triangle.getBarycoord(hit.point,a,b,d,weights);if(Math.min(weights.x,weights.y,weights.z)>1e-5)interiors++;}assert.ok(interiors<=1,'one depth value per interior pixel');}
});
test('the existing northbound path stays continuous and green meadows remain beside it',()=>{
 for(let z=-59.3;z<29.9;z+=1.73)for(const x of [-2.45,-.71,.13,1.9,2.45]){const hit=sample(x,z)[0];assert.ok(hit);assert.equal(colour(hit),'b2a27b');}
 for(const x of [-3.2,3.2])assert.ok(['83986d','6f8c67'].includes(colour(sample(x,-45.55)[0])));
});
test('one ordinary opaque material replaces the competing planes without camera or depth hacks',()=>{
 assert.equal(mesh.material.transparent,false);assert.equal(mesh.material.depthTest,true);assert.equal(mesh.material.depthWrite,true);assert.equal(mesh.material.polygonOffset,false);assert.equal(mesh.material.map,null);assert.ok(mesh.material.vertexColors);assert.ok(mesh.receiveShadow);
 g.computeBoundingBox();assert.ok(Math.abs(g.boundingBox.min.y+.6)<1e-6);assert.ok(Math.abs(g.boundingBox.max.y+.1)<1e-6);assert.ok(g.index.count/3<3000);
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z));}
 for(let i=0;i<g.index.count;i+=3){a.fromBufferAttribute(p,g.index.getX(i));b.fromBufferAttribute(p,g.index.getX(i+1));d.fromBufferAttribute(p,g.index.getX(i+2));assert.ok(new T.Triangle(a,b,d).getArea()>1e-10,'no degenerate faces');}
});
