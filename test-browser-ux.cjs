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
  if(width===360){
   const info=await p.evaluate(()=>{
    const button=document.getElementById('next'),r=button.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    const front=document.elementFromPoint(x,y);
    return {button:{x:Math.round(x),y:Math.round(y),width:r.width,height:r.height},front:front?.outerHTML?.slice(0,200),scrollY:window.scrollY,viewportHeight:innerHeight};
   });
   console.log('GENDER_360_NAV_DEBUG '+JSON.stringify(info));
  }
  await p.$eval('#next',el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  if(width===360){
   const hit=await p.evaluate(()=>{
     const b=document.getElementById('next'),r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
     return {nextVisibleAt:{x,y},hit:document.elementFromPoint(x,y)?.outerHTML?.slice(0,160)};
   });
   console.log('GENDER_360_HITTEST '+JSON.stringify(hit));
  }
  if(width===360)await p.evaluate(()=>{
    window.__genderClickTrace=[];
    for(const kind of ['pointerdown','mousedown','mouseup','click','touchstart','touchend']){
      document.addEventListener(kind,e=>{
        window.__genderClickTrace.push({kind,target:e.target?.id||e.target?.className?.toString().slice(0,40)||e.target?.tagName, x:e.clientX??null,y:e.clientY??null});
      },true);
    }
  });
  await p.click('#next');
  if(width===360)console.log('GENDER_360_EVENTS '+JSON.stringify(await p.evaluate(()=>window.__genderClickTrace)));
  const nextHeading=await p.$eval('.lessonhead h2',x=>x.textContent.trim());
  check('Gender next navigation @'+width,nextHeading.includes('57 Gender Ending'),'actual heading: '+nextHeading);
  await p.click('#topics');
  const tileCount=await p.$$eval('.tile',xs=>xs.length);
  check('Gender returns to chapter menu @'+width,tileCount===14,'actual tiles: '+tileCount);
 }catch(e){check('Gender interaction @'+width,false,String(e).slice(0,270))}finally{await p.close()}
}

/* Regression for OS Dark Mode + WortWeg Light Mode. This mismatch caused
 * unreadable navy-on-navy chapter headings and alternating Gender table rows. */
async function themeContrast(browser){
 const p=await createPage(browser,1366);
 const key='wortweg370-settings-v1';
 const cases=[
  {os:'dark',saved:'light',expectLight:true},
  {os:'light',saved:'dark',expectLight:false},
  {os:'light',saved:'system',expectLight:true},
  {os:'dark',saved:'system',expectLight:false}
 ];
 let prior=null;
 try{
  await goto(p,'gender-lifetime.html');
  prior=await p.evaluate(k=>localStorage.getItem(k),key);
  for(const t of cases){
   await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:t.os}]);
   await p.evaluate(({key,mode})=>localStorage.setItem(key,JSON.stringify({mode})),{key,mode:t.saved});
   await p.reload({waitUntil:'domcontentloaded'});
   await p.waitForSelector('[data-open="1"]',{timeout:10000});
   await p.click('[data-open="1"]');
   const m=await p.evaluate(()=>{
    const rgb=x=>{
     const v=String(x).match(/[\d.]+/g)?.slice(0,3).map(Number);
     return v?.length===3?v:[0,0,0];
    };
    const lum=c=>{
     const linear=rgb(c).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});
     return .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
    };
    const ratio=(fg,bg)=>{
     const a=lum(fg),b=lum(bg);
     return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    };
    const head=document.querySelector('.lessonhead'),title=head.querySelector('h2');
    const stripe=document.querySelector('.tablewrap tbody tr:nth-child(even)');
    const stripedText=stripe?.querySelector('td');
    const th=document.querySelector('.tablewrap thead th');
    return {
     mode:document.documentElement.dataset.mode,
     headColor:getComputedStyle(head).backgroundColor,
     titleColor:getComputedStyle(title).color,
     stripeColor:getComputedStyle(stripe).backgroundColor,
     stripeTextColor:getComputedStyle(stripedText).color,
     thColor:getComputedStyle(th).backgroundColor,
     thTextColor:getComputedStyle(th).color,
     titleContrast:ratio(getComputedStyle(title).color,getComputedStyle(head).backgroundColor),
     stripeContrast:ratio(getComputedStyle(stripedText).color,getComputedStyle(stripe).backgroundColor),
     thContrast:ratio(getComputedStyle(th).color,getComputedStyle(th).backgroundColor),
     headLuminance:lum(getComputedStyle(head).backgroundColor),
     stripeLuminance:lum(getComputedStyle(stripe).backgroundColor)
    };
   });
   const id='Gender theme OS='+t.os+' setting='+t.saved;
   check(id+' effective mode',m.mode===(t.saved==='system'?t.os:t.saved),JSON.stringify(m));
   check(id+' readable contrast',m.titleContrast>=4.5&&m.stripeContrast>=4.5&&m.thContrast>=4.5,
    'title='+m.titleContrast.toFixed(1)+' stripe='+m.stripeContrast.toFixed(1)+' tableHead='+m.thContrast.toFixed(1));
   check(id+' matched backgrounds',t.expectLight?(m.headLuminance>.65&&m.stripeLuminance>.65):(m.headLuminance<.22&&m.stripeLuminance<.22),
    'headLum='+m.headLuminance.toFixed(2)+' rowLum='+m.stripeLuminance.toFixed(2));
   if(t.saved!=='system'){
     await p.$eval('.lessonhead',el=>el.scrollIntoView({block:'start',behavior:'instant'}));
     await screenshot(p,'gender-theme-os-'+t.os+'-setting-'+t.saved);
   }
  }
 }catch(e){check('Gender cross-scheme contrast regression',false,String(e).slice(0,340))}
 finally{
  try{await p.evaluate(({key,prior})=>{if(prior===null)localStorage.removeItem(key);else localStorage.setItem(key,prior)},{key,prior})}catch{}
  await p.close();
 }
}


async function comic(browser,width){
 const p=await createPage(browser,width);
 try{
  await goto(p,'a1-comic.html');
  await p.waitForSelector('[data-action="chapter"]',{timeout:12000});
  const coverage=await p.evaluate(()=>window.WortWegA1Comic?.getCoverage());
  check('A1 comic 642 records @'+width,coverage?.sourceWords===642&&coverage?.uniqueIds===642,'actual '+JSON.stringify(coverage));
  check('A1 comic 18 episodes @'+width,await p.$eval('[data-action="chapter"]',xs=>xs.length)===18);
  check('A1 comic 112 panels @'+width,coverage?.panels===112);
  await inspect(p,'A1 comic library @'+width);
  await screenshot(p,'comic-library-'+width);
  await p.click('[data-action="chapter"][data-index="0"]');
  check('A1 comic illustrated stage @'+width,!!await p.$('.comic-screen svg[role="img"]'));
  check('A1 comic 2 speech balloons @'+width,await p.$eval('.comic-bubble',xs=>xs.length)===2);
  check('A1 comic 6 vocabulary chips @'+width,await p.$eval('.comic-word',xs=>xs.length)===6);
  await inspect(p,'A1 comic reader @'+width);
  await screenshot(p,'comic-reader-'+width);
  await p.click('[data-action="meanings"]');
  check('A1 comic meaning reveal @'+width,await p.$eval('.comic-translation',x=>!x.textContent.includes('hidden')));
  await p.click('[data-action="learn-word"]');
  check('A1 comic independent progress @'+width,await p.$eval('.comic-word .tick',e=>e.textContent.includes('✓')));
  await p.click('#nextPanel');
  check('A1 comic panel navigation @'+width,await p.$eval('.comic-scene-right',e=>e.textContent.includes('2 /')));
  await p.click('[data-action="quiz"]');
  check('A1 comic quiz choices @'+width,await p.$eval('[data-action="pick"]',xs=>xs.length)===4);
  await p.click('[data-action="pick"]');
  await p.click('[data-action="submit-quiz"]');
  check('A1 comic quiz answer @'+width,!!await p.$('.comic-quiz-feedback'));
 }catch(e){check('A1 comic interaction @'+width,false,String(e).slice(0,340))}
 finally{await p.close()}
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
  if(process.env.WW_AUDIT_ONLY_GENDER==='1'){await gender(browser,360)}else{
  for(const width of [360,390,768,1366]){
   await goethe(browser,width);
   await gender(browser,width);
   await reading(browser,width);
   await comic(browser,width);
  }
  for(const width of [390,1366]){await dialog(browser,width);await home(browser,width)}
  await themeContrast(browser);
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
 const report={timestamp:new Date().toISOString(),passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,tests:results,warnings};
 fs.writeFileSync(path.join(screenshots,'report.json'),JSON.stringify(report,null,2));
 console.log('WORTWEG_CHROMIUM_AUDIT='+JSON.stringify({passed:report.passed,failed:report.failed,warnings:warnings.length}));
 if(report.failed)process.exitCode=1;
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
