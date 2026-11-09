/* Alleen voltooide pogingen tellen. Opslag is optioneel en lokaal. */
(function(){
const key='star-hopper-records-v1';let bestTime=null,bestStars=0;let persistent=true;
try{const data=JSON.parse(localStorage.getItem(key)||'null');if(data){if(Number.isFinite(data.bestTime)&&data.bestTime>0)bestTime=data.bestTime;if(Number.isInteger(data.bestStars)&&data.bestStars>=0&&data.bestStars<=12)bestStars=data.bestStars;}}catch{persistent=false;}
window.StarRecords={get(){return {bestTime,bestStars,persistent};},save(time,stars){const newTime=bestTime===null||time<bestTime,newStars=stars>bestStars;if(newTime)bestTime=time;if(newStars)bestStars=stars;try{localStorage.setItem(key,JSON.stringify({bestTime,bestStars}));}catch{persistent=false;}return {newTime,newStars};}};
})();
