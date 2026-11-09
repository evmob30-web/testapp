/* Original GLB characters, retargeted to the existing animated/equipment bones.
 * Geometry is shared; materials and skeleton bindings belong to each avatar. */
(function(root){
'use strict';
const cached=new Map();
function load(id){
 if(!cached.has(id))cached.set(id,new Promise((resolve,reject)=>{
  try{
   if(!root.EmberGLTFLoader||!root.EmberCharacterData?.[id])throw new Error('Character asset unavailable: '+id);
   const bytes=root.atob(root.EmberCharacterData[id]);
   const buffer=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)buffer[i]=bytes.charCodeAt(i);
   new root.EmberGLTFLoader().parse(buffer.buffer,'',resolve,reject);
  }catch(error){reject(error);}
 }));
 return cached.get(id);
}
function attach(T,rig,flame,appearance){
 const models=new T.Group();models.name='EmberwildGLBModels';rig.group.add(models);
 const variants=new Map();let choice={id:'classic',look:{},classId:'guardian'},status='loading',failure=null;
 const fallback=[...(flame?.baseMeshes||[]),...(flame?.costumeMeshes||[])];
 const existing=new Map(Object.values(rig.joints).map(b=>[b.name,b]));
 function apply(){
  if(status!=='ready')return;
  // These lists were captured before armor, hair, the bow and other rewards exist.
  for(const mesh of fallback)mesh.visible=false;
  for(const eye of appearance?.classicEyes||[])eye.visible=false;
  const A=root.EmberAppearance,look=choice.look||{};
  for(const [id,variant] of variants){
   variant.visible=id===choice.id;
   variant.traverse(mesh=>{
    if(!mesh.isSkinnedMesh)return;
    if(mesh.name.includes('default_hair'))mesh.visible=false;
    const material=mesh.material;
    if(material.name==='skin')material.color.set(A.skinColors[look.skinTone]||A.skinColors.warm);
    if(material.name==='iris')material.color.set(A.eyeColors[look.eyeColor]||A.eyeColors.green);
    if(material.name==='hair')material.color.set(A.hairColors[look.hairColor]||A.hairColors.auburn);
    if(id==='classic'&&material.name==='fabric')material.color.set(choice.classId==='ranger'?'#637e64':'#647b83');
    if(id==='classic'&&material.name==='cape')material.color.set(choice.classId==='ranger'?'#567357':'#69827b');
   });
  }
  rig.group.userData.characterAsset={status:'ready',skin:choice.id,format:'glTF 2.0',weighted:true};
 }
 function setLook(id,look,classId='guardian'){
  choice={id:id==='flame_guardian'?'flame_guardian':'classic',look:look||{},classId};apply();
 }
 const ready=Promise.all(['classic','flame_guardian'].map(load)).then(results=>{
  // Prepare both variants before hiding any fallback geometry.
  results.forEach((result,index)=>{
   const id=index===0?'classic':'flame_guardian',variant=new T.Group();variant.name='GLB_'+id;
   const skeletons=new Map();
   result.scene.traverse(source=>{
    if(!source.isSkinnedMesh)return;
    const bones=source.skeleton.bones.map(b=>{
     const bone=existing.get(b.name);if(!bone)throw new Error('Unknown character joint: '+b.name);return bone;
    });
    if(!skeletons.has(source.skeleton))skeletons.set(source.skeleton,new T.Skeleton(bones,source.skeleton.boneInverses.map(m=>m.clone())));
    const skeleton=skeletons.get(source.skeleton);
    const mesh=new T.SkinnedMesh(source.geometry,source.material.clone());
    mesh.name=source.name;mesh.castShadow=true;mesh.frustumCulled=false;
    mesh.bind(skeleton,new T.Matrix4());variant.add(mesh);
   });
   if(!variant.children.length)throw new Error('Character has no skinned geometry: '+id);
   variants.set(id,variant);models.add(variant);
  });
  status='ready';apply();return true;
 }).catch(error=>{
  status='fallback';failure=error;models.visible=false;
  rig.group.userData.characterAsset={status:'fallback'};
  console.warn('Emberwild: using procedural character fallback.',error);return false;
 });
 function animate(time,options={}){
  if(status!=='ready')return;
  const moving=options.moving?(options.running?1:.6):.08;
  rig.joints.back.rotation.x=.035+Math.sin(time*2.8)*(.02+moving*.08);
  rig.joints.back.rotation.z=Math.sin(time*1.9)*(.008+moving*.018);
 }
 rig.group.userData.characterAsset={status};
 return {ready,setLook,animate,models,get status(){return status;},get error(){return failure;}};
}
root.EmberModelAssets={attach};
})(typeof window==='undefined'?globalThis:window);
