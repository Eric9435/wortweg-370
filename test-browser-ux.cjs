/* Real Chromium audit for WortWeg 370. Runs locally in GitHub Actions.
   Checks mobile/tablet/desktop viewports, functional navigation, visible controls,
   page errors, overflow, and original Home donut. Keeps screenshots as artifacts.
   No credentials are used or modified. */
'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const puppeteer=require('puppeteer-core');
const ROOT=process.cwd(), PORT=process.env.WW_AUDIT_PORT||8787;
const BASE='http://127.0.0.1:'+PORT+'/';
const screenshots=path.join(ROOT,'audit-ux-screenshots');
fs.mkdirSync(screenshots,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.wasm':'application/wasm','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
 let decoded;
 try{decoded=decodeURIComponent(new URL(req.url,BASE).pathname)}catch{res.writeHead(400).end();return}
 const full=path.resolve(ROOT,'.'+(decoded==='/'?'/index.html':decoded));
 if(full!==ROOT&&!full.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
 fs.stat(full,(err,st)=>{
  if(err||!st.isFile()){res.writeHead(404).end('Not found');return}
  res.writeHead(200,{'Content-Type':MIME[path.extname(full)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(full).pipe(res);
 });
});
const results=[],warnings=[];
const check=(name,condition,detail)=>{results.push({name,pass:!!condition,detail:detail||''}); if(!condition)console.error('FAIL '+name+(detail?' — '+detail:'')); else console.log('PASS '+name);};
const note=(name,value)=>{warnings.push({name,detail:value});console.log('INFO '+name+' — '+value)};
async function inspect(page,id,strict=true){
 const m=await page.evaluate(()=>{
  const w=document.documentElement.scrollWidth;
  const vp=window.innerWidth;
  const imgs=[...document.images].filter(img=>!img.hasAttribute('alt')).length;
  const visible=(e)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const smallItems=[...document.querySelectorAll('button,input[type=button],input[type=submit],a[href]')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return (r.width<32||r.height<32)}).slice(0,12).map(e=>({tag:e.tagName,selector:e.id?'#'+e.id:e.className?.toString().slice(0,75),text:e.textContent?.trim().slice(0,38),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}));
  const small=smallItems.length;
  const h=document.querySelector('h1')?.textContent?.trim().slice(0,90)||'';
  return {width:vp,docWidth:w,overflow:w-vp,imagesWithoutAlt:imgs,smallControls:small,smallItems,heading:h,buttons:document.querySelectorAll('button').length}
 });
 check(id+' heading',!!m.heading,m.heading);
 if(strict)check(id+' no page horizontal overflow',m.overflow<=10,'overflow='+m.overflow+'px at '+m.width);
 else note(id+' horizontal overflow',m.overflow+'px');
 if(m.imagesWithoutAlt)note(id+' image alt audit',m.imagesWithoutAlt+' img elements missing alt');
 if(m.smallControls)note(id+' touch targets',m.smallControls+' visible interactive targets below 32px '+JSON.stringify(m.smallItems));
 return m;
}
async function createPage(browser,width,height=850){
 const page=await browser.newPage();
 await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<650,hasTouch:width<650});
 page.on('pageerror',err=>{const message=String(err).slice(0,220);warnings.push({name:'JavaScript page error @'+width,detail:message});console.warn('PAGE_ERROR '+width+' '+message)});
 return page;
}
async function screenshot(page,name){
 try{await page.screenshot({path:path.join(screenshots,name+'.png'),fullPage:false})}
 catch(e){note('screenshot '+name,String(e).slice(0,80))}
}
async function goto(page,file){await page.goto(BASE+file,{waitUntil:'domcontentloaded',timeout:20000})}
async function goethe(browser,width){
 const p=await createPage(browser,width);
 try{
  await goto(p,'goethe-exam.html');
  // Each viewport is an independent fresh exam attempt; preserve real app persistence elsewhere.
  await p.evaluate(()=>localStorage.removeItem('wortweg370-goethe-prep-local-v1'));
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForSelector('.levelcard',{timeout:10000});
  check('Goethe level choices @'+width,await p.$$eval('.levelcard',xs=>xs.length)===6);
  await inspect(p,'Goethe landing @'+width);
  await screenshot(p,'goethe-'+width);
  await p.click('[data-act="level"][data-level="A1"]');
  check('Goethe A1 7-tab navigation @'+width,await p.$$eval('[role="tab"]',xs=>xs.length)===7);
  await p.click('[data-act="tab"][data-tab="topics"]');
  check('Goethe A1 topic count @'+width,await p.$$eval('.topiccard',xs=>xs.length)===10);
  await p.click('[data-act="topic"][data-idx="0"]');
  check('Goethe topic writing field @'+width,!!await p.$('textarea[data-draft="topic"]'));
  await p.click('[data-act="tab"][data-tab="practice"]');
  await p.click('input[name="reading"][value="1"]');
  await p.click('[data-act="grade"][data-skill="reading"]');
  check('Goethe answer grading @'+width,await p.$eval('body',e=>e.textContent.includes('✓ Correct')));
  await p.click('[data-act="tab"][data-tab="official"]');
  check('Goethe official resource link @'+width,await p.$$eval('a[href*="goethe.de"]',xs=>xs.length)>=1);
  await p.click('[data-act="tab"][data-tab="checklist"]');
  check('Goethe checklist @'+width,await p.$$eval('input[type="checkbox"]',xs=>xs.length)>=8);
 }catch(e){check('Goethe page interaction @'+width,false,String(e).slice(0,280))}finally{await p.close()}
}
async function gender(browser,width){
 const p=await createPage(browser,width);
 try{
  await goto(p,'gender-lifetime.html');
  await p.waitForSelector('.tile',{timeout:10000});
  check('Gender 14 chapters @'+width,await p.$$eval('.tile',xs=>xs.length)===14);
  await inspect(p,'Gender landing @'+width);
  await screenshot(p,'gender-'+width);
  await p.click('[data-open="0"]');
  check('Gender lesson 1 opens @'+width,!!await p.$('.lesson'));
  await p.click('#next');
  const nextHeading=await p.$eval('.lessonhead h2',x=>x.textContent.trim());
  check('Gender next navigation @'+width,nextHeading.includes('57 Gender Ending'),'actual heading: '+nextHeading);
  await p.click('#topics');
  const tileCount=await p.$eval('.tile',xs=>xs.length);
  check('Gender returns to chapter menu @'+width,tileCount===14,'actual tiles: '+tileCount);
 }catch(e){check('Gender interaction @'+width,false,String(e).slice(0,270))}finally{await p.close()}
}
async function reading(browser,width){
 const p=await createPage(browser,width);
 try{
  await goto(p,'complete-reading.html');
  await p.waitForSelector('a.level',{timeout:10000});
  check('Reading A1-C2 level selector @'+width,await p.$$eval('a.level',xs=>xs.length)===6);
  await inspect(p,'Reading menu @'+width);
  await screenshot(p,'reading-'+width);
 }catch(e){check('Reading selector @'+width,false,String(e).slice(0,270))}finally{await p.close()}
}
async function dialog(browser,width){
 const p=await createPage(browser,width);
 try{
  await goto(p,'dialog.html');
  await p.waitForSelector('.dialog-app',{timeout:15000});
  const labels=await p.$$eval('[data-level]',xs=>[...new Set(xs.map(x=>x.getAttribute('data-level')))]);
  check('Dialog level controls @'+width,labels.filter(l=>/^(A1|A2|B1|B2|C1|C2)$/.test(l)).length===6,labels.join(','));
  await inspect(p,'Dialog @'+width);
  await screenshot(p,'dialog-'+width);
 }catch(e){check('Dialog interface @'+width,false,String(e).slice(0,270))}finally{await p.close()}
}
async function home(browser,width){
 const p=await createPage(browser,width);
 try{
  await goto(p,'index.html');
  await new Promise(ok=>setTimeout(ok,3000));
  const hasHome=!!await p.$('#ww-home-focus'),hasPie=!!await p.$('.ww-donut-hero');
  note('Home @'+width,'launcher='+hasHome+'; original pie='+hasPie);
  if(hasHome){
   check('Home module finder @'+width,!!await p.$('#wwq-module-search'));
   await p.click('#wwq-module-search');await p.type('#wwq-module-search','goethe');
   check('Home Goethe search @'+width,await p.$$eval('.ww-home-focus-tile:not([hidden])',xs=>xs.length)===1);
   await p.$eval('#wwq-module-search',x=>{x.value='dialog';x.dispatchEvent(new Event('input',{bubbles:true}))});
   check('Home Dialog search @'+width,await p.$eval('.wwq-dialog-search-result',x=>!x.hidden));
   check('Original pie retained @'+width,hasPie);
  }else note('Home availability','Guest/login state may hide dashboard. Home interaction cannot be fully exercised without user account.');
  await inspect(p,'Home @'+width,false);
  await screenshot(p,'home-'+width);
 }catch(e){check('Home interface @'+width,false,String(e).slice(0,270))}finally{await p.close()}
}
async function run(){
 await new Promise((resolve,reject)=>server.once('error',reject).listen(PORT,'127.0.0.1',resolve));
 let bin=process.env.CHROME_PATH;
 if(!bin){
  for(const candidate of ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/opt/google/chrome/chrome']){
   if(fs.existsSync(candidate)){bin=candidate;break}
  }
 }
 if(!bin){try{bin=execFileSync('which',['google-chrome']).toString().trim()}catch{}}
 assert(bin,'Chromium/Google Chrome is required on CI runner');
 note('Chromium binary',bin);
 const browser=await puppeteer.launch({executablePath:bin,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
  for(const width of [360,390,768,1366]){
   await goethe(browser,width);
   await gender(browser,width);
   await reading(browser,width);
  }
  for(const width of [390,1366]){await dialog(browser,width);await home(browser,width)}
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 const report={timestamp:new Date().toISOString(),passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,tests:results,warnings};
 fs.writeFileSync(path.join(screenshots,'report.json'),JSON.stringify(report,null,2));
 console.log('WORTWEG_CHROMIUM_AUDIT='+JSON.stringify({passed:report.passed,failed:report.failed,warnings:warnings.length}));
 if(report.failed)process.exitCode=1;
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
