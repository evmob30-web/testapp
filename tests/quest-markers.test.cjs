const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),T=require('../vendor/three.min.js');
const canvases=[],ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(object,key)=>key in object?object[key]:()=>{}}),env={THREE:T,document:{createElement(){const canvas={getContext:()=>ctx};canvases.push(canvas);return canvas;}}};env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/quest-markers.js'),'utf8'),env);const markers=env.EmberQuestMarkers;
function pixelHeight(marker,camera,height){marker.group.updateMatrixWorld(true);const scale=marker.symbols[0].getWorldScale(new T.Vector3()),bottom=marker.group.getWorldPosition(new T.Vector3()),top=bottom.clone().add(new T.Vector3(0,scale.y,0).applyQuaternion(camera.quaternion));return Math.abs(top.project(camera).y-bottom.project(camera).y)*height/2;}
test('quest symbols stay legible from close range to the far side of the valley',()=>{
 const marker=markers.create(T),anchor=new T.Vector3(12,0,9),camera=new T.PerspectiveCamera(52,16/9,.1,180);marker.place(anchor);
 for(const depth of [5,10,25,50,85]){camera.position.set(12,3.9,9+depth);camera.lookAt(12,3.9,9);camera.updateMatrixWorld();marker.updateView(camera,720);const pixels=pixelHeight(marker,camera,720);assert.ok(pixels>=64-.01&&pixels<=86+.01,'64–86 CSS pixels across the valley');}
});
test('marker projection adapts to camera orbit, FOV and resized viewports',()=>{
 const marker=markers.create(T);marker.place(new T.Vector3());
 for(const height of [360,720,1080])for(const fov of [35,52,75]){
  const camera=new T.PerspectiveCamera(fov,16/9,.1,180);camera.position.set(25,14,40);camera.lookAt(0,3.9,0);camera.updateMatrixWorld();marker.updateView(camera,height);const pixels=pixelHeight(marker,camera,height);assert.ok(pixels>=(height<480?48:64)-.01);assert.ok(pixels<=(height<480?68:86)+.01);
 }
});
test('original outlined art is cached across NPCs and remains bright through fog and scene exposure',()=>{
 const a=markers.create(T),b=markers.create(T);assert.equal(canvases.length,3);assert.equal(a.symbols.length,3);
 for(let i=0;i<3;i++){const sprite=a.symbols[i],material=sprite.material;assert.strictEqual(material,b.symbols[i].material);assert.equal(material.map.image.width,256);assert.equal(material.map.image.height,384);assert.equal(material.map.colorSpace,T.SRGBColorSpace);assert.equal(material.fog,false);assert.equal(material.toneMapped,false);assert.equal(material.depthWrite,false);assert.equal(material.depthTest,false);assert.equal(sprite.center.y,0);assert.ok(sprite.renderOrder>0);}
 assert.notStrictEqual(a.symbols[1].material,a.symbols[2].material,'active silver and ready gold stay distinct');
});
test('screen sizing and subtle movement never accumulate position drift or move into the nameplate',()=>{
 const marker=markers.create(T),camera=new T.PerspectiveCamera(52,16/9,.1,180);marker.place(new T.Vector3(12,0,9));camera.position.set(12,7,70);camera.lookAt(12,3.9,9);camera.updateMatrixWorld();
 marker.updateView(camera,720,1);const position=marker.group.position.clone(),scale=marker.group.scale.clone();for(let i=0;i<100;i++)marker.updateView(camera,720,1);assert.ok(position.equals(marker.group.position));assert.ok(scale.equals(marker.group.scale));assert.ok(marker.group.position.y>3.7,'bottom anchor stays above the NPC label');
 camera.position.set(12,4,8);camera.lookAt(12,4,-10);camera.updateMatrixWorld();marker.updateView(camera,720,1);assert.ok(marker.group.scale.toArray().every(Number.isFinite),'turning away cannot create negative or infinite sizing');
});
