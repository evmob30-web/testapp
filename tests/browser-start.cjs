const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.waitForTimeout(2000);
 const fatal=await page.locator('#fatal').evaluate(n=>({hidden:n.hidden,text:n.textContent}));
 const overlay=await page.locator('#overlay').evaluate(n=>n.hidden);
 await page.screenshot({path:'/tmp/emberwild-start.png'});
 console.log(JSON.stringify({fatal,overlay,errors},null,2));
 await browser.close();
 if(!fatal.hidden||errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
