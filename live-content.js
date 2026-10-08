(()=>{
'use strict';
// Public, text-only lesson packs. No remote JavaScript or executable markup is loaded.
const REMOTE='https://eric9435.github.io/wortweg-370/content/v1/pack.json';
const BUNDLED='./content/v1/pack.json';
const PACK_KEY='wortweg370-live-pack-v1';
const PROGRESS_PREFIX='wortweg370-live-progress-v1:';
const CHECK_MS=15*60*1000;
const MAX_BYTES=2500000;
const $=id=>document.getElementById(id);
const root=document.querySelector('main'),menu=document.querySelector('#dashboard .ww-menu-options');
if(!root||!menu)return;
const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='./live-content.css';document.head.append(sheet);
const page=document.createElement('section');page.id='ww-live';page.className='section';
page.innerHTML='<button type="button" class="ww-menu-back" id="ww-live-back">‹  Main menu</button><div class="ww-live-heading"><span class="ww-menu-eyebrow">ONLINE + OFFLINE</span><h2>New lessons</h2><p>New vocabulary arrives automatically when connected. Previously saved lessons work offline.</p></div><div id="ww-live-status" class="ww-live-status" role="status" aria-live="polite">Loading saved lessons…</div><div id="ww-live-list"></div><div id="ww-live-quiz" hidden></div>';
root.append(page);
const item=document.createElement('button');item.type='button';item.className='ww-live-menu-option';item.innerHTML='<span class="ww-menu-icon" aria-hidden="true">✦</span><span><strong>New lessons</strong><small>Auto-updated · available offline</small></span><span class="ww-menu-arrow" aria-hidden="true">›</span>';
menu.append(item);
const syncCard=document.createElement('div');syncCard.className='card ww-live-settings';
syncCard.innerHTML='<h3>Lesson updates</h3><p class="muted tiny">Vocabulary and lesson content sync automatically over the internet and remain available offline. App code and Android permissions still require a new APK.</p><p id="ww-live-settings-status" class="muted tiny" role="status"></p><button class="btn secondary" type="button" id="ww-live-check">Check for new lessons</button>';
document.querySelector('#settings .settings-grid')?.append(syncCard);
let pack=null,activeUser=window.WortWegAccountSnapshot?.uid||'guest',lastCheck=0,checking=null,session=null;
const status=(message)=>{ $('ww-live-status').textContent=message;const el=$('ww-live-settings-status');if(el)el.textContent=message; };
const isStr=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
function valid(data){
 if(!data||data.schema!==1||!Number.isSafeInteger(data.version)||data.version<1||!Array.isArray(data.lessons)||data.lessons.length>370||!data.lessons.length)return false;
 if(!isStr(data.title,120))return false;
 const lessonIds=new Set(),wordIds=new Set();let words=0;
 for(const lesson of data.lessons){
  if(!lesson||!isStr(lesson.id,48)||!/^[a-z0-9-]+$/.test(lesson.id)||lessonIds.has(lesson.id)||!isStr(lesson.title,120)||!Array.isArray(lesson.words)||lesson.words.length<4||lesson.words.length>500)return false;
  lessonIds.add(lesson.id);
  for(const w of lesson.words){
   if(!w||!isStr(w.id,70)||!/^[a-z0-9-]+$/.test(w.id)||wordIds.has(w.id)||!isStr(w.de,150)||!isStr(w.en,160)||!isStr(w.my,180))return false;
   wordIds.add(w.id);words++;if(words>12000)return false;
  }
 }
 return true;
}
function readSaved(){
 try{const raw=localStorage.getItem(PACK_KEY);if(!raw||raw.length>MAX_BYTES)return null;const data=JSON.parse(raw);return valid(data)?data:null}catch{return null}
}
function adopt(candidate,from){
 if(!valid(candidate)||pack&&candidate.version<=pack.version)return false;
 pack=candidate;
 try{localStorage.setItem(PACK_KEY,JSON.stringify(candidate))}catch{status('Lessons loaded; storage is full. Future offline access is not guaranteed.')}
 if(!session)renderList();
 status('Version '+pack.version+' · '+(from==='online'?'Updated and saved for offline':'Available offline'));
 return true;
}
async function fetchPack(url,timeout=8500){
 if(typeof fetch!=='function')throw Error('Network not supported');
 const controller=typeof AbortController!=='undefined'?new AbortController():null;
 const timer=controller?setTimeout(()=>controller.abort(),timeout):null;
 try{
  const response=await fetch(url,{method:'GET',credentials:'omit',cache:'no-store',...(controller?{signal:controller.signal}:{})});
  if(!response.ok)throw Error('Network HTTP '+response.status);
  const size=Number(response.headers?.get?.('content-length')||0);if(size>MAX_BYTES)throw Error('Oversized lesson pack');
  const text=await response.text();
  if(text.length>MAX_BYTES)throw Error('Oversized lesson pack');
  const data=JSON.parse(text);
  if(!valid(data))throw Error('Invalid lesson pack');
  return data;
 }finally{if(timer)clearTimeout(timer)}
}
async function bundled(){
 try{const p=await fetchPack(BUNDLED,5000);adopt(p,'bundled');return true}catch{
  if(!pack)status('Bundled lessons unavailable. Try again online.');
  return false;
 }
}
async function sync(force=false){
 if(checking)return checking;
 if(!force&&Date.now()-lastCheck<CHECK_MS)return false;
 if(navigator.onLine===false){if(pack)status('Offline · version '+pack.version+' saved on your device');return false;}
 lastCheck=Date.now();status(pack?'Checking for lesson updates…':'Checking for lessons…');
 checking=(async()=>{
  try{
   const next=await fetchPack(REMOTE);
   if(!adopt(next,'online'))status('Up to date · version '+pack.version+' · available offline');
   return true;
  }catch{
   status(pack?'Offline or update service unavailable · using saved version '+pack.version:'Unable to check online. Bundled lessons remain available.');
   return false;
  }finally{checking=null}
 })();
 return checking;
}
function selectPage(){
 for(const p of document.querySelectorAll('.section'))p.classList.toggle('active',p===page);
 document.body.classList.remove('ww-quiz-mode');
 window.scrollTo?.(0,0);
 if(!pack)bundled().then(()=>sync());else sync();
}
function mainMenu(){
 session=null;$('ww-live-quiz').hidden=true;$('ww-live-list').hidden=false;
 renderList();
 if(window.WortWeg?.navigate)window.WortWeg.navigate('dashboard');
 else for(const p of document.querySelectorAll('.section'))p.classList.toggle('active',p.id==='dashboard');
 window.scrollTo?.(0,0);
}
function readProgress(){
 try{const p=JSON.parse(localStorage.getItem(PROGRESS_PREFIX+activeUser)||'{}');return p&&typeof p==='object'&&!Array.isArray(p)?p:{}}catch{return {}}
}
function record(id,correct){
 const progress=readProgress(),last=progress[id]||{answered:0,correct:0};
 progress[id]={answered:(Number(last.answered)||0)+1,correct:(Number(last.correct)||0)+(correct?1:0)};
 try{localStorage.setItem(PROGRESS_PREFIX+activeUser,JSON.stringify(progress))}catch{}
}
function el(tag,text,className){
 const node=document.createElement(tag);
 if(className)node.className=className;
 node.textContent=text;
 return node;
}
function renderList(){
 const list=$('ww-live-list');list.replaceChildren();
 if(!pack){list.append(el('p','No downloaded lessons yet. Internet is needed for the first content update.','muted'));return;}
 const progress=readProgress();
 const summary=el('p',pack.lessons.length+' lessons · '+pack.lessons.reduce((count,l)=>count+l.words.length,0)+' words','ww-live-summary');
 list.append(summary);
 for(const lesson of pack.lessons){
  const btn=document.createElement('button');btn.type='button';btn.className='ww-live-lesson';
  const symbol=el('span','▤','ww-live-lesson-icon');
  const middle=document.createElement('span');
  middle.append(el('strong',lesson.title),el('small',String(lesson.level||'A1')+' · '+lesson.words.length+' words'));
  const completed=lesson.words.filter(w=>(progress[w.id]?.answered||0)>0).length;
  if(completed)middle.append(el('small',completed+' of '+lesson.words.length+' practised','ww-live-completion'));
  btn.append(symbol,middle,el('span','›','ww-live-chevron'));
  btn.addEventListener('click',()=>startLesson(lesson));list.append(btn);
 }
}
function shuffle(a){const arr=[...a];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function startLesson(lesson){
 session={lesson,questions:shuffle(lesson.words),index:0,answered:false,correct:0};
 $('ww-live-list').hidden=true;$('ww-live-quiz').hidden=false;renderQuestion();
}
function pronounce(word){
 const de=word.de;
 try{if(window.WortWegAudio?.speak){window.WortWegAudio.speak(de);return}
  if(window.speechSynthesis&&window.SpeechSynthesisUtterance){const u=new SpeechSynthesisUtterance(de);u.lang='de-DE';window.speechSynthesis.speak(u)}}catch{}
}
function renderQuestion(){
 const q=$('ww-live-quiz');q.replaceChildren();
 if(!session)return;
 const {lesson,questions,index}=session;
 if(index>=questions.length){
  q.append(el('h3','Lesson complete!'),el('p',session.correct+' correct out of '+questions.length+'. Your results are saved on this device.'));
  const again=el('button','Practice again','btn primary');again.type='button';again.addEventListener('click',()=>startLesson(lesson));
  const back=el('button','All lessons','btn secondary');back.type='button';back.addEventListener('click',()=>{session=null;q.hidden=true;$('ww-live-list').hidden=false;renderList()});
  q.append(again,back);return;
 }
 const word=questions[index],options=shuffle([word,...shuffle(lesson.words.filter(w=>w.id!==word.id)).slice(0,3)]);
 q.append(el('p','Question '+(index+1)+' / '+questions.length,'ww-live-question-count'));
 const heading=el('h3',word.de,'ww-live-word');
 const speak=el('button','🔊  Hear pronunciation','ww-live-speak');speak.type='button';speak.addEventListener('click',()=>pronounce(word));
 q.append(heading,speak,el('p','Choose the English meaning:','muted'));
 const answers=document.createElement('div');answers.className='ww-live-answers';
 const answerButtons=[];
 for(const candidate of options){
  const answer=el('button',candidate.en,'ww-live-answer');answer.type='button';answerButtons.push(answer);
  answer.addEventListener('click',()=>{
   if(session.answered)return;session.answered=true;
   const correct=candidate.id===word.id;session.correct+=correct?1:0;record(word.id,correct);
   for(const b of answerButtons){b.disabled=true;if(b.textContent===word.en)b.classList.add('correct')}
   if(!correct)answer.classList.add('wrong');
   feedback.textContent=(correct?'Correct! ':'Not quite. ')+word.de+' — '+word.en+' — '+word.my;
   feedback.hidden=false;next.hidden=false;
  });answers.append(answer);
 }
 const feedback=el('p','','ww-live-feedback');feedback.setAttribute('role','status');feedback.hidden=true;
 const next=el('button','Next →','btn primary ww-live-next');next.type='button';next.hidden=true;
 next.addEventListener('click',()=>{session.index++;session.answered=false;renderQuestion()});
 q.append(answers,feedback,next);
}
page.querySelector('#ww-live-back').addEventListener('click',mainMenu);
item.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();selectPage()});
$('ww-live-check').addEventListener('click',()=>sync(true));
window.addEventListener('wortweg:account',event=>{
 const uid=event.detail?.uid||'guest';
 if(uid!==activeUser){
  activeUser=uid;session=null;
  $('ww-live-quiz').hidden=true;$('ww-live-list').hidden=false;
 }
 renderList();
});
window.addEventListener('online',()=>sync(true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
pack=readSaved();
if(pack){renderList();status('Version '+pack.version+' · saved for offline');}
else bundled().then(()=>sync(true));
if(pack)sync();
// Intentionally a text/JSON-only content channel; code and native updates require a new APK.
window.WortWegLive={getPack:()=>pack,refresh:()=>sync(true),open:selectPage,validate:valid};
})();
