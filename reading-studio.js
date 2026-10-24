/* WortWeg 370 — Extended trilingual passage window and German TTS.
Seek is aligned to sentences, not MP3 millisecond timestamps. */
(()=>{
'use strict';
if(window.WortWegReadingStudio)return;
const st=document.createElement('style');st.textContent="\n.wwr-overlay{position:fixed;inset:0;background:#101a2dd9;z-index:99999;display:flex;align-items:center;justify-content:center;padding:12px}\n.wwr-window{background:#fff;color:#1a2c46;width:min(1220px,100%);height:min(94dvh,940px);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 100px #0008;font-family:system-ui,sans-serif}\n.wwr-header{display:flex;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid #dde5f0;align-items:center}\n.wwr-header h2{font-size:clamp(18px,2.2vw,26px);margin:4px 0 0;color:#182a44;line-height:1.3}\n.wwr-eyebrow,.wwr-label{font-size:11px;font-weight:800;letter-spacing:.11em;color:#54718d;text-transform:uppercase}\n.wwr-actions,.wwr-transport{display:flex;flex-wrap:wrap;gap:7px;align-items:center}\n.wwr-window button{border:1px solid #c6d3e2;border-radius:9px;background:white;color:#213b5e;padding:8px 12px;cursor:pointer;font-size:13px;font-weight:650}\n.wwr-window button:disabled{opacity:.4;cursor:not-allowed}\n.wwr-window button.wwr-primary,.wwr-window button[aria-pressed=true]{background:#194d93;color:white;border-color:#194d93}\n.wwr-window button:focus-visible,.wwr-window input:focus-visible{outline:3px solid #5792f8;outline-offset:2px}\n.wwr-player{background:#f3f7fc;border-bottom:1px solid #dce5f0;padding:12px 24px}\n.wwr-timeline{display:flex;align-items:center;gap:12px;margin-top:12px;font-size:12px;color:#526984}\n.wwr-timeline input{flex:1;min-width:0;accent-color:#235ca9;cursor:pointer}\n.wwr-hint{font-size:11px;color:#617891;margin:7px 0 0}\n.wwr-labels{display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:12px 25px;border-bottom:1px solid #dbe4ee;background:#f8fafc}\n.wwr-pages{overflow:auto;flex:1;overscroll-behavior:contain}\n.wwr-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;padding:18px 25px;border-bottom:1px solid #e4ebf4;scroll-margin-top:12px}\n.wwr-row.wwr-current{background:#fff8e8;box-shadow:inset 4px 0 #ebb34b}\n.wwr-de,.wwr-en,.wwr-mm{font-size:clamp(15px,1.3vw,18px);line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}\n.wwr-de{font-weight:520;color:#172943}\n.wwr-en{color:#586b81}\n.wwr-mm{grid-column:1/-1;background:#edf5ff;padding:12px 16px;border-radius:9px;border-left:3px solid #2b68b9;font-size:15px;color:#354e6e}\n.wwr-sentence{cursor:pointer;border-radius:4px}\n.wwr-sentence.wwr-active{background:#ffdf87}\n.wwr-word.wwr-active{background:#efb72b;color:#18283e;border-radius:3px}\n.wwr-footer{padding:10px 24px;border-top:1px solid #dde5ef;color:#667b94;font-size:11px}\n.wwr-speed{padding:7px;border:1px solid #ccd9e5;border-radius:8px;color:#213b5e;background:white}\n@media(max-width:720px){.wwr-overlay{padding:0}.wwr-window{height:100dvh;border-radius:0}.wwr-header{padding:12px 14px}.wwr-player{padding:10px 14px}.wwr-labels{grid-template-columns:1fr;padding:10px 14px}.wwr-labels span:last-child{display:none}.wwr-row{grid-template-columns:1fr;gap:10px;padding:15px 14px}.wwr-en{border-top:1px dashed #ced9e8;padding-top:8px;font-size:15px}.wwr-mm{grid-column:1}.wwr-footer{padding:9px 14px}}\n@media(prefers-reduced-motion:reduce){.wwr-pages{scroll-behavior:auto}}\n";st.textContent+="\n/* Reader fills the entire browser viewport, not a centered excerpt card */\n.wwr-overlay{padding:0;align-items:stretch;justify-content:stretch;background:#f8fafc}\n.wwr-window{width:100vw;max-width:none;height:100dvh;max-height:none;border-radius:0;box-shadow:none}\n.wwr-header{padding:12px clamp(14px,3vw,48px);min-height:74px}\n.wwr-header h2{font-size:clamp(18px,2.3vw,29px)}\n.wwr-player{padding:10px clamp(14px,3vw,48px)}\n.wwr-labels{padding:10px clamp(14px,3vw,48px);gap:clamp(14px,3vw,40px)}\n.wwr-pages{overflow-y:auto;overflow-x:hidden;min-height:0;max-height:none;padding-bottom:110px;scrollbar-gutter:stable}\n.wwr-row{padding:clamp(18px,2vw,30px) clamp(14px,3vw,48px);gap:clamp(14px,3vw,40px)}\n.wwr-de,.wwr-en{font-size:clamp(16px,1.24vw,21px);line-height:1.95}\n.wwr-footer{padding:8px clamp(14px,3vw,48px)}\n.wwr-floating{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(26px,env(safe-area-inset-bottom));z-index:100010;display:flex;align-items:flex-end;flex-direction:column;gap:10px;pointer-events:none}\n.wwr-floating>*{pointer-events:auto}\n.wwr-window button.wwr-fab{background:#173e78;border-color:#173e78;color:white;box-shadow:0 8px 30px #1d365857;border-radius:50px;padding:13px 20px;min-height:48px}\n.wwr-menu{width:min(370px,calc(100vw - 30px));max-height:min(71dvh,680px);overflow:auto;overscroll-behavior:contain;background:#fff;color:#17314f;border:1px solid #cedbea;border-radius:17px;box-shadow:0 16px 60px #11243e63;padding:15px}\n.wwr-menu[hidden],.wwr-index[hidden]{display:none!important}\n.wwr-menu h3{font-size:15px;margin:0 0 10px;color:#182e49}\n.wwr-menu-actions{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0 12px}\n.wwr-search{display:block;width:100%;padding:11px 12px;background:#f7f9fc;border:1px solid #c9d6e7;border-radius:10px;font:inherit;color:#203958;margin:8px 0 10px}\n.wwr-index{display:flex;flex-direction:column;gap:3px;max-height:38dvh;overflow-y:auto;border-top:1px solid #e3e9f1;border-bottom:1px solid #e3e9f1;padding:6px 0}\n.wwr-window .wwr-index button{text-align:left;border:0;background:transparent;width:100%;font-size:12px;line-height:1.4;padding:9px 10px;font-weight:500}\n.wwr-window .wwr-index button[aria-current=true]{background:#eaf2ff;color:#164e97;font-weight:800}\n.wwr-index small{display:block;color:#5b728e;font-size:11px;font-weight:400}\n.wwr-menu-status{font-size:12px;color:#63778f}\n.wwr-global{position:fixed;z-index:9000;bottom:max(22px,env(safe-area-inset-bottom));right:max(16px,env(safe-area-inset-right));border-radius:999px;border:1px solid #a5c1eb;background:#173e78;color:white;padding:14px 18px;box-shadow:0 10px 30px #10274b69;cursor:pointer;font-weight:750;font:750 14px system-ui,-apple-system,sans-serif}\n.wwr-global[hidden]{display:none!important}\n.wwr-window.wwr-de-only .wwr-row{grid-template-columns:minmax(0,900px);justify-content:center}\n.wwr-window.wwr-de-only .wwr-en{display:none}\n.wwr-window.wwr-de-only .wwr-labels{grid-template-columns:1fr}\n.wwr-window.wwr-de-only .wwr-labels span:last-child{display:none}\n.wwr-window.wwr-de-only .wwr-mm{grid-column:1}\n.wwr-window.wwr-large .wwr-de,.wwr-window.wwr-large .wwr-en{font-size:clamp(20px,1.8vw,25px)}\n.wwr-window.wwr-small .wwr-de,.wwr-window.wwr-small .wwr-en{font-size:15px}\n.wwr-progressbar{height:3px;background:#dce5f1;flex:none}\n.wwr-progressbar>div{height:100%;width:0;background:#205bb0;transition:width .15s}\n@media(max-width:720px){\n .wwr-header{min-height:0;gap:8px}\n .wwr-header h2{font-size:18px}\n .wwr-header .wwr-actions{flex-shrink:0}\n .wwr-header .wwr-actions button{padding:8px}\n .wwr-player{padding:9px 13px}\n .wwr-pages{padding-bottom:145px}\n .wwr-row{padding:18px 14px}\n .wwr-floating{right:13px;bottom:max(22px,env(safe-area-inset-bottom))}\n .wwr-window button.wwr-fab{padding:12px 16px}\n .wwr-global{bottom:max(84px,env(safe-area-inset-bottom))}\n .wwr-window.wwr-parallel-mobile .wwr-pages{overflow-x:auto}\n .wwr-window.wwr-parallel-mobile .wwr-row{grid-template-columns:minmax(300px,1fr) minmax(300px,1fr);min-width:660px}\n .wwr-window.wwr-parallel-mobile .wwr-en{margin:0;border:0;padding:0}\n .wwr-window.wwr-parallel-mobile .wwr-labels{grid-template-columns:1fr 1fr;min-width:660px}\n .wwr-window.wwr-parallel-mobile .wwr-labels span:last-child{display:block}\n}\n";st.textContent+="\n/* Synchronized parallel highlighting in all three languages. Translations are\n   aligned at paragraph level: the language blocks are not sentence-timed data. */\n.wwr-labels,.wwr-row{grid-template-columns:repeat(3,minmax(0,1fr));column-gap:clamp(12px,2vw,30px)}\n.wwr-row .wwr-mm{grid-column:auto;margin:0;background:#f4f8ff;border:1px solid #e1e9f5;border-radius:10px;padding:11px 14px;color:#384f6c;font-size:clamp(15px,1.16vw,19px)}\n.wwr-row.wwr-current .wwr-en.wwr-trans-active,.wwr-row.wwr-current .wwr-mm.wwr-trans-active{background:#fff0c4!important;border:2px solid #dea12c!important;border-radius:10px;box-shadow:0 0 0 2px #fff7de inset;color:#203148}\n.wwr-row.wwr-current .wwr-de{background:#fff9eb;border-radius:10px}\n.wwr-labels span:nth-child(3){color:#526b8d}\n.wwr-window.wwr-de-only .wwr-mm{display:none}\n.wwr-window.wwr-de-only .wwr-labels span:nth-child(3){display:none}\n.wwr-translation-legend{color:#526983;font-size:11px;line-height:1.5}\n@media(max-width:930px){\n .wwr-labels,.wwr-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}\n .wwr-row .wwr-mm{grid-column:1/-1}\n .wwr-labels span:nth-child(3){display:none}\n}\n@media(max-width:720px){\n .wwr-labels,.wwr-row{grid-template-columns:minmax(0,1fr)}\n .wwr-row .wwr-mm{grid-column:1/-1}\n .wwr-row .wwr-en{margin-top:0;border-top:1px dashed #d3dfe9;padding-top:8px}\n .wwr-row .wwr-mm{margin-top:2px}\n .wwr-window.wwr-parallel-mobile .wwr-row{grid-template-columns:repeat(3,minmax(270px,1fr));min-width:840px}\n .wwr-window.wwr-parallel-mobile .wwr-labels{grid-template-columns:repeat(3,minmax(270px,1fr));min-width:840px}\n .wwr-window.wwr-parallel-mobile .wwr-labels span:nth-child(3){display:block}\n .wwr-window.wwr-parallel-mobile .wwr-row .wwr-mm{grid-column:3;margin:0}\n .wwr-window.wwr-parallel-mobile .wwr-row .wwr-en{margin:0;border:0;padding:0}\n}\n";document.head.append(st);
const chapters=()=>window.WortWegLongReadings||{};
const synth=window.speechSynthesis;
const supported=()=>!!synth&&typeof window.SpeechSynthesisUtterance==='function';
let overlay=null,active=null,items=[],idx=0,play=false,paused=false,serial=0,rate=1,oldOverflow='';
let currentTopicId=1,menuVisible=false,readingLayout='parallel',fontScale='normal';
let floatingLauncher=null;

const q=s=>overlay?.querySelector(s);
function node(tag,cl,parent,text){
 const e=document.createElement(tag);if(cl)e.className=cl;
 if(text!==undefined)e.textContent=String(text);
 parent?.append(e);return e;
}
function sentences(s){return s.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)?.map(x=>x.trim()).filter(Boolean)||[s];}
function highlight(i){
 if(!overlay)return;
 overlay.querySelectorAll('.wwr-current').forEach(el=>el.classList.remove('wwr-current'));
 overlay.querySelectorAll('.wwr-sentence.wwr-active').forEach(el=>el.classList.remove('wwr-active'));
 overlay.querySelectorAll('.wwr-word.wwr-active').forEach(el=>el.classList.remove('wwr-active'));
 overlay.querySelectorAll('.wwr-trans-active').forEach(el=>el.classList.remove('wwr-trans-active'));
 overlay.querySelectorAll('.wwr-row[aria-current="true"]').forEach(el=>el.removeAttribute('aria-current'));
 const entry=items[i];if(!entry)return;
 entry.row.classList.add('wwr-current');entry.span.classList.add('wwr-active');
 entry.row.setAttribute('aria-current','true');
 entry.row.querySelector('.wwr-en')?.classList.add('wwr-trans-active');
 const my=entry.row.querySelector('.wwr-mm');
 if(my&&!my.hidden)my.classList.add('wwr-trans-active');
 entry.row.scrollIntoView?.({block:'nearest',behavior:'smooth'});
}
function sync(){
 if(!overlay)return;
 q('.wwr-play').textContent=play?(paused?'▶ Resume':'⏸ Pause'):'▶ Play German';
 const slider=q('.wwr-seek');slider.max=String(Math.max(0,items.length-1));slider.value=String(Math.min(idx,items.length-1));
 q('.wwr-position').textContent=items.length?(idx+1)+' / '+items.length:'0 / 0';
 q('.wwr-back').disabled=idx<1;q('.wwr-next').disabled=idx>=items.length-1;
}
function stop(reset=false){
 serial++;play=false;paused=false;
 if(supported())try{synth.cancel();}catch{}
 if(reset)idx=0;sync();highlight(-1);
}
function start(n){
 if(!items.length)return;
 if(!supported()){q('.wwr-hint').textContent='German speech is not supported by this browser. Text and translations remain available.';return;}
 serial++;const own=serial;
 try{synth.cancel();}catch{}
 idx=Math.max(0,Math.min(n,items.length-1));play=true;paused=false;sync();
 const next=()=>{
  if(!overlay||own!==serial||!play)return;
  const item=items[idx];if(!item){stop();return;}
  highlight(idx);
  const u=new SpeechSynthesisUtterance(item.text);u.lang='de-DE';u.rate=rate;
  const voices=synth.getVoices?.()||[];
  const voice=voices.find(v=>v.lang.toLowerCase()==='de-de'&&v.localService)||voices.find(v=>/^de/i.test(v.lang));
  if(voice)u.voice=voice;
  u.onboundary=e=>{
   if(own!==serial||typeof e.charIndex!=='number')return;
   item.span.querySelectorAll('.wwr-word.wwr-active').forEach(el=>el.classList.remove('wwr-active'));
   const words=[...item.span.querySelectorAll('.wwr-word')];
   const current=words.find(el=>Number(el.dataset.end)>e.charIndex)||words[words.length-1];
   current?.classList.add('wwr-active');
  };
  u.onend=()=>{
   if(own!==serial)return;
   if(idx<items.length-1){idx++;sync();next();}
   else{play=false;paused=false;sync();highlight(-1);}
  };
  u.onerror=e=>{
   if(own!==serial||['canceled','interrupted'].includes(e.error))return;
   stop();if(overlay)q('.wwr-hint').textContent='Speech stopped: the German voice may be unavailable on this device.';
  };
  try{synth.speak(u);}catch{stop();}
 };
 next();
}
function toggle(){
 if(!play){start(idx);return;}
 if(!supported())return;
 try{if(paused){synth.resume();paused=false;}else{synth.pause();paused=true;}}catch{stop();}
 sync();
}
function seek(to){stop();idx=Math.min(items.length-1,Math.max(0,to));sync();start(idx);}
function close(){
 stop();
 if(overlay){overlay.remove();overlay=null;}
 document.body.style.overflow=oldOverflow;
 document.removeEventListener('keydown',keyboard);
 items=[];active=null;
 if(floatingLauncher)floatingLauncher.hidden=false;
}
function keyboard(e){
 if(e.key==='Escape'&&overlay){e.preventDefault();close();}
}
function draw(chapter){
 items=[];const host=q('.wwr-pages');host.replaceChildren();
 for(const paragraph of chapter.rows){
  const row=node('article','wwr-row',host);
  const de=node('div','wwr-de',row);de.lang='de';
  const en=node('div','wwr-en',row,paragraph[1]);en.lang='en';
  const mm=node('div','wwr-mm',row,paragraph[2]);mm.lang='my';mm.hidden=false;
  sentences(paragraph[0]).forEach(s=>{
   const span=node('span','wwr-sentence',de);
   let offset=0;
   for(const match of s.matchAll(/\S+|\s+/gu)){
    const token=match[0];
    if(!token.trim()){span.append(document.createTextNode(token));offset+=token.length;continue;}
    const word=node('span','wwr-word',span,token);
    offset+=token.length;word.dataset.end=String(offset);
   }
   de.append(document.createTextNode(' '));
   const at=items.push({text:s,row,span})-1;
   span.title='Play this German sentence';
   span.addEventListener('click',()=>seek(at));
  });
 }
 sync();
}

function userLastReading(){
 try{
  const uid=String(window.WortWegAccountSnapshot?.uid||'guest').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
  const stored=Number(localStorage.getItem('wortweg370-long-reading-last:'+uid));
  return chapters()[stored]?stored:1;
 }catch{return 1;}
}
function rememberReading(id){
 try{
  const uid=String(window.WortWegAccountSnapshot?.uid||'guest').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
  localStorage.setItem('wortweg370-long-reading-last:'+uid,String(id));
 }catch{}
}
function changeTopic(n){if(chapters()[n])open(n);}
function updateMenu(){
 if(!overlay)return;
 const menu=q('.wwr-menu');
 menu.hidden=!menuVisible;
 q('.wwr-fab').setAttribute('aria-expanded',String(menuVisible));
 q('.wwr-floating-prev').disabled=!chapters()[currentTopicId-1];
 q('.wwr-floating-next').disabled=!chapters()[currentTopicId+1];
 const filter=(q('.wwr-search')?.value||'').trim().toLocaleLowerCase();
 let total=0;
 for(const b of menu.querySelectorAll('.wwr-index button')){
  const id=Number(b.dataset.topic);
  const chapter=chapters()[id];
  const match=String(id).includes(filter)||chapter.title.toLocaleLowerCase().includes(filter)||chapter.en.toLocaleLowerCase().includes(filter);
  b.hidden=!match;
  b.setAttribute('aria-current',String(id===currentTopicId));
  if(match)total++;
 }
 q('.wwr-menu-status').textContent=total+' reading topics · '+items.length+' German sentences in this passage';
}
function floatingMenu(panel,mmButton){
 const dock=node('aside','wwr-floating',panel);
 dock.setAttribute('aria-label','Reading navigation and controls');
 const menu=node('div','wwr-menu',dock);
 menu.hidden=true;
 node('h3','',menu,'Reading menu');
 const filters=node('input','wwr-search',menu);
 filters.type='search';filters.placeholder='Search a topic by name or number';
 filters.setAttribute('aria-label','Search reading topics');
 filters.addEventListener('input',updateMenu);
 const list=node('div','wwr-index',menu);
 list.setAttribute('aria-label','Available reading topics');
 for(let id=1;id<=24;id++){
  const chapter=chapters()[id];if(!chapter)continue;
  const b=node('button','',list,id+'. '+chapter.title);
  b.type='button';b.dataset.topic=String(id);
  node('small','',b,chapter.en);
  b.addEventListener('click',()=>changeTopic(id));
 }
 const nav=node('div','wwr-menu-actions',menu);
 const prev=node('button','wwr-floating-prev',nav,'← Previous topic');
 prev.type='button';prev.addEventListener('click',()=>changeTopic(currentTopicId-1));
 const next=node('button','wwr-floating-next',nav,'Next topic →');
 next.type='button';next.addEventListener('click',()=>changeTopic(currentTopicId+1));
 const display=node('div','wwr-menu-actions',menu);
 const parallel=node('button','wwr-parallel',display,'DE + EN + MY');
 parallel.type='button';parallel.addEventListener('click',()=>setLayout('parallel'));
 const german=node('button','wwr-german',display,'German only');
 german.type='button';german.addEventListener('click',()=>setLayout('german'));
 const mobile=node('button','wwr-mobile-pair',display,'Side-by-side on phone');
 mobile.type='button';mobile.addEventListener('click',()=>{
  panel.classList.toggle('wwr-parallel-mobile');
  mobile.setAttribute('aria-pressed',String(panel.classList.contains('wwr-parallel-mobile')));
 });
 const tools=node('div','wwr-menu-actions',menu);
 const my=node('button','wwr-toggle-my',tools,'မြန်မာ ပြ/ဖျောက်');
 my.type='button';my.addEventListener('click',()=>mmButton.click());
 const smaller=node('button','wwr-shrink',tools,'A−');smaller.type='button';smaller.addEventListener('click',()=>setFont('small'));
 const normal=node('button','wwr-normal',tools,'A');normal.type='button';normal.addEventListener('click',()=>setFont('normal'));
 const larger=node('button','wwr-grow',tools,'A+');larger.type='button';larger.addEventListener('click',()=>setFont('large'));
 const top=node('button','wwr-top',tools,'↑ Top');top.type='button';top.addEventListener('click',()=>q('.wwr-pages').scrollTo({top:0,behavior:'smooth'}));
 node('div','wwr-menu-status',menu,'');
 const fab=node('button','wwr-fab',dock,'☷ Reading menu');
 fab.type='button';fab.setAttribute('aria-expanded','false');fab.setAttribute('aria-label','Open or close floating reading menu');
 fab.addEventListener('click',()=>{menuVisible=!menuVisible;updateMenu();});
 function setLayout(next){
  readingLayout=next;panel.classList.toggle('wwr-de-only',next==='german');
  parallel.setAttribute('aria-pressed',String(next==='parallel'));
  german.setAttribute('aria-pressed',String(next==='german'));
 }
 function setFont(size){
  fontScale=size;
  panel.classList.toggle('wwr-small',size==='small');
  panel.classList.toggle('wwr-large',size==='large');
  for(const b of [smaller,normal,larger])b.setAttribute('aria-pressed',String(b===(size==='small'?smaller:size==='large'?larger:normal)));
 }
 setLayout(readingLayout);setFont(fontScale);updateMenu();
}
function installLauncher(){
 if(floatingLauncher)return;
 floatingLauncher=node('button','wwr-global',document.body,'☷ Reading passages');
 floatingLauncher.id='wwr-launcher';floatingLauncher.type='button';
 floatingLauncher.setAttribute('aria-label','Open WortWeg full-screen reading passages and floating topic menu');
 floatingLauncher.addEventListener('click',()=>{
  if(open(userLastReading())){
   menuVisible=true;updateMenu();
   q('.wwr-search')?.focus();
  }
 });
}

function open(id){
 const chapter=chapters()[Number(id)];if(!chapter)return false;
 close();active=chapter;currentTopicId=Number(id);rememberReading(currentTopicId);menuVisible=false;oldOverflow=document.body.style.overflow;
 if(floatingLauncher)floatingLauncher.hidden=true;
 overlay=node('div','wwr-overlay',document.body);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 const panel=node('section','wwr-window',overlay);
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','German reading passage');
 const header=node('header','wwr-header',panel);
 const names=node('div','',header);
 node('div','wwr-eyebrow',names,'WORTWEG 370 · FULL-SCREEN READING · TOPIC '+id);
 node('h2','',names,chapter.title+' — '+chapter.en);
 const headButtons=node('div','wwr-actions',header);
 const mmButton=node('button','',headButtons,'မြန်မာ ပြ/ဖျောက်');mmButton.type='button';mmButton.setAttribute('aria-pressed','true');
 mmButton.addEventListener('click',()=>{
  const show=mmButton.getAttribute('aria-pressed')!=='true';
  mmButton.setAttribute('aria-pressed',String(show));
  overlay.querySelectorAll('.wwr-mm').forEach(el=>{
   el.hidden=!show;
   el.classList.toggle('wwr-trans-active',show&&el.closest('.wwr-row')?.classList.contains('wwr-current'));
  });
 });
 const vocabulary=node('button','',headButtons,'Vocabulary');
 vocabulary.type='button';vocabulary.addEventListener('click',()=>{close();window.WortWegTopics?.open(Number(id));});
 const exit=node('button','',headButtons,'✕ Close');exit.type='button';exit.addEventListener('click',close);
 const player=node('div','wwr-player',panel);
 const transport=node('div','wwr-transport',player);
 const playButton=node('button','wwr-play wwr-primary',transport,'▶ Play German');playButton.type='button';playButton.addEventListener('click',toggle);
 const prev=node('button','wwr-back',transport,'⏮ Previous');prev.type='button';prev.addEventListener('click',()=>seek(idx-1));
 const next=node('button','wwr-next',transport,'Next ⏭');next.type='button';next.addEventListener('click',()=>seek(idx+1));
 const halt=node('button','',transport,'⏹ Stop');halt.type='button';halt.addEventListener('click',()=>stop(true));
 const speed=node('select','wwr-speed',transport);speed.setAttribute('aria-label','German speech speed');
 for(const [v,label] of [['0.75','0.75× Slow'],['1','1× Normal'],['1.25','1.25× Fast']]){
  const option=node('option','',speed,label);option.value=v;if(v==='1')option.selected=true;
 }
 rate=1;speed.addEventListener('change',()=>{rate=Number(speed.value);if(play)start(idx);});
 const timeline=node('div','wwr-timeline',player);
 node('span','',timeline,'Sentence');
 const slider=node('input','wwr-seek',timeline);slider.type='range';slider.min='0';slider.step='1';slider.setAttribute('aria-label','German narration sentence position');
 slider.addEventListener('change',()=>seek(Number(slider.value)));
 node('span','wwr-position',timeline,'0 / 0');
 node('p','wwr-hint',player,'German voice only · German sentence/word highlight · Matching English & Myanmar paragraphs light up together · Seek by German sentence. Word-by-word alignment of translations is not available.');
 const headings=node('div','wwr-labels',panel);
 node('span','wwr-label',headings,'Deutsch · German voice + word highlight');
 node('span','wwr-label',headings,'English · Synchronized paragraph highlight');
 node('span','wwr-label',headings,'မြန်မာ · Synchronized paragraph highlight');
 const progress=node('div','wwr-progressbar',panel);
 const fill=node('div','',progress);
 const pages=node('div','wwr-pages',panel);
 pages.addEventListener('scroll',()=>{
  const total=pages.scrollHeight-pages.clientHeight;
  fill.style.width=(total>0?Math.min(100,Math.max(0,100*pages.scrollTop/total)):100).toFixed(1)+'%';
 },{passive:true});
 node('footer','wwr-footer',panel,'German / English / Myanmar shown together · German voice only · Translation highlighting follows the current paragraph · Esc to close.');
 floatingMenu(panel,mmButton);
 document.body.style.overflow='hidden';document.addEventListener('keydown',keyboard);
 draw(chapter);exit.focus();return true;
}
function integrate(){
 const list=document.getElementById('topicList');
 if(list&&!list.dataset.wwrAttached){
  list.dataset.wwrAttached='1';
  window.addEventListener('click',e=>{
   const b=e.target.closest('#topicList button.topic');if(!b)return;
   const id=Number(b.querySelector('strong')?.textContent?.match(/\d+/)?.[0]);
   if(!chapters()[id])return;
   e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();open(id);
  },true);
 }
 const actions=document.querySelector('.ww-topic-actions');
 if(actions&&!actions.querySelector('.wwr-detail-button')){
  const b=node('button','btn secondary wwr-detail-button',actions,'Long passage window');
  b.type='button';b.addEventListener('click',()=>{
   const id=Number(document.getElementById('ww-topic-id')?.textContent?.match(/\d+/)?.[0]);
   if(chapters()[id])open(id);
  });
 }
}
installLauncher();
window.WortWegReadingStudio={open,close,getCount:()=>Object.keys(chapters()).length};
integrate();
window.addEventListener('pagehide',stop);
})();
