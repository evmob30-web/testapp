/* Leveldata blijft gescheiden van logica en graphics. Coördinaten in wereldpixels. */
(function(root){
const platforms=[
[0,438,500,150],[575,408,210,150],[860,363,180,160],[1120,408,240,160],
[1440,348,190,160],[1710,298,170,170],[1960,363,260,180],[2300,313,170,170],
[2555,263,170,170],[2805,328,200,180],[3090,378,180,170],[3350,328,450,200]
].map(([x,y,w,h])=>({x,y,w,h}));
root.StarLevel={width:3800,height:780,spawn:{x:95,y:390},platforms,
stars:platforms.map((p,i)=>({x:p.x+(i===0?330:p.w/2),y:p.y-62})),portal:{x:3650,y:328}};
})(typeof window==='undefined'?globalThis:window);
