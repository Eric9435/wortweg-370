/* WortWeg 370 · Seen Words + CEFR exploration progress.
   Read-only over the existing per-account legacy progress and live-pack history.
   No migration or reset: existing Google and guest records remain untouched. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id), dashboard=$('dashboard'), root=document.querySelector('main');
 if(!dashboard||!root||!$('data')||!window.WortWeg?.getProgress)return;
 let data;
 try{data=JSON.parse($('data').textContent);}catch{return;}
 if(!Array.isArray(data.bank)||!Array.isArray(data.curated))return;
 const levels=['A1','A2','B1','B2','C1','C2'];
 const bank=data.bank.map(w=>({key:'b:'+w.id,word:w,group:w.level,source:'Bank'}));
 // Curated Topic 1 entries use independent keys in the original quiz engine.
 // We label totals as "study entries", rather than misleadingly claiming a
 // fully de-duplicated vocabulary dictionary across different lesson sources.
 const curated=data.curated.map(w=>({key:'c:'+w.de.toLocaleLowerCase(),word:w,group:'Topic 1',source:'Topic 1'}));
 const n=v=>Number.isFinite(v)&&v>=0?Math.floor(v):0;
 const percent=(seen,total)=>total?Math.round(seen/total*100):0;
 const pretty=v=>Number(v).toLocaleString('en-US');
 const text=(parent,tag,value,className)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  el.textContent=value;
  parent.append(el);return el;
 };
 function current(){
  try{
   const p=window.WortWeg.getProgress();
   return p&&typeof p==='object'&&p.seen&&p.items?p:{seen:{},items:{}};
  }catch{return {seen:{},items:{}};}
 }
 function liveEntries(){
  const pack=window.WortWegLive?.getPack?.();
  if(!pack||!Array.isArray(pack.lessons))return [];
  const progress=window.WortWegLive?.getProgress?.()||{};
  const result=[];
  const ids=new Set();
  for(const lesson of pack.lessons){
   for(const w of lesson.words||[]){
    if(ids.has(w.id))continue;ids.add(w.id);
    result.push({key:'l:'+w.id,word:w,group:levels.includes(lesson.level)?lesson.level:'New lessons',source:'New lessons',live:progress[w.id]||null});
   }
  }
  return result;
 }
 function entryStatus(entry,p){
  if(entry.source==='New lessons'){
   const record=entry.live;
   const answered=n(record?.answered),correct=n(record?.correct);
   if(!answered)return null;
   const wrong=n(record?.wrong)||(answered-Math.min(answered,correct));
   return {wrong,correctLast:typeof record.lastCorrect==='boolean'?record.lastCorrect:(wrong===0?true:null),answered,last:record.lastAnsweredAt||null};
  }
  if(!p.seen[entry.key]&&!p.items[entry.key])return null;
  const s=p.items[entry.key]||{};
  const wrong=n(s.wrong);
  // Existing saved history records "wrong" and "streak" but not exact
  // per-word answer counts. A positive streak means the latest answer was
  // correct after a prior mistake; never fabricate a historical count.
  return {wrong,correctLast:wrong===0?(p.items[entry.key]?true:null):n(s.streak)>0,last:s.last||null};
 }
 function snapshot(){
  const p=current(),records=[...bank,...curated,...liveEntries()];
  const rows=[];
  const totals=new Map();
  for(const group of [...levels,'Topic 1','New lessons']){
   totals.set(group,{total:0,seen:0});
  }
  let seen=0;
  for(const e of records){
   const status=entryStatus(e,p),bucket=totals.get(e.group);
   if(bucket)bucket.total++;
   if(!status)continue;
   seen++;
   if(bucket)bucket.seen++;
   rows.push({...e,status});
  }
  // Stale entries from older lesson packs may still exist in saved progress.
  // Never erase that history; surface it even if its dictionary is outdated.
  const catalogKeys=new Set(records.map(e=>e.key));
  for(const [key,s] of Object.entries(p.items)){
   if(catalogKeys.has(key)||!p.seen[key]||!s||typeof s.de!=='string')continue;
   const wrong=n(s.wrong);
   rows.push({key,word:{de:s.de,en:s.en||'',mm:s.mm||'',level:'—'},group:'Archived',source:'Earlier version',
    status:{wrong,correctLast:wrong===0?true:n(s.streak)>0,last:s.last||null}});
  }
  const total=records.length;
  return {rows,totals,total,seen,remaining:Math.max(0,total-seen),pct:percent(seen,total),
   bankTotal:bank.length,curatedTotal:curated.length,liveTotal:records.length-bank.length-curated.length};
 }
 function progressBar(seen,total,label){
  const outer=document.createElement('div');outer.className='ww-seen-meter';
  outer.setAttribute('role','progressbar');
  outer.setAttribute('aria-label',label);
  outer.setAttribute('aria-valuemin','0');outer.setAttribute('aria-valuemax','100');
  outer.setAttribute('aria-valuenow',String(percent(seen,total)));
  const fill=document.createElement('div');fill.className='ww-seen-meter-fill';
  fill.style.width=percent(seen,total)+'%';
  outer.append(fill);return outer;
 }
 const menu=dashboard.querySelector('.ww-main-menu');
 if(!menu)return;
 const home=document.createElement('div');home.id='ww-seen-home';
 home.className='ww-seen-home';home.setAttribute('aria-label','Vocabulary exploration progress');
 const options=menu.querySelector('.ww-menu-options');
 if(options)menu.insertBefore(home,options);else menu.append(home);
 const seenButton=document.createElement('button');
 seenButton.type='button';seenButton.dataset.nav='seen';seenButton.className='ww-seen-menu-option';
 seenButton.innerHTML='<span class="ww-menu-icon" aria-hidden="true">▤</span><span><strong>My seen words</strong><small>Every word answered · listen and review</small></span><span class="ww-menu-arrow" aria-hidden="true">›</span>';
 const reviewButton=options?.querySelector('[data-nav=review]');
 if(reviewButton)reviewButton.before(seenButton);
 else options?.append(seenButton);
 const page=document.createElement('section');
 page.id='seen';page.className='section ww-seen-page';
 page.innerHTML='<button type="button" class="ww-menu-back" id="ww-seen-back">‹  Main menu</button>'+
  '<div class="ww-seen-heading"><span class="ww-menu-eyebrow">YOUR VOCABULARY JOURNEY</span><h2>My seen words</h2>'+
  '<p>Every vocabulary entry you have answered, including correct answers and mistakes.</p></div>'+
  '<div id="ww-seen-page-overview" class="ww-seen-page-overview"></div>'+
  '<div id="ww-seen-levels" class="ww-seen-levels"></div>'+
  '<div class="ww-seen-history-header"><h3>Your word history</h3><p>Words you missed are marked red, even when you later answer them correctly.</p></div>'+
  '<div class="ww-seen-filters"><label>Search words<input id="ww-seen-search" type="search" autocomplete="off" placeholder="German, English, Myanmar…"></label>'+
  '<label>Result<select id="ww-seen-status"><option value="all">All answers</option><option value="wrong">Missed before</option><option value="correct">Never missed</option></select></label>'+
  '<label>Level / source<select id="ww-seen-level"><option value="all">All levels</option>'+
  '<option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>'+
  '<option value="Topic 1">Topic 1</option><option value="New lessons">New lessons</option><option value="Archived">Earlier versions</option></select></label></div>'+
  '<p id="ww-seen-results" class="muted tiny" aria-live="polite"></p>'+
  '<div class="ww-seen-table-wrap" role="region" aria-label="All seen words, scroll horizontally for columns" tabindex="0">'+
  '<table class="ww-seen-table"><thead><tr><th scope="col">Word</th><th scope="col">English</th><th scope="col">မြန်မာ</th><th scope="col">Level</th><th scope="col">Result</th><th scope="col">Listen</th></tr></thead>'+
  '<tbody id="ww-seen-rows"></tbody></table></div>'+
  '<p id="ww-seen-empty" class="ww-seen-empty" hidden>No words here yet. Start a quiz to build your word history.</p>'+
  '<button type="button" id="ww-seen-more" class="btn secondary ww-seen-more" hidden>Show 50 more words</button>'+
  '<p class="ww-seen-footnote">Seen means answered at least once, not mastered. Counts cover study entries across the Word Bank, Topic 1, and downloaded New Lessons. Repeated quizzes do not increase the seen count. New Lessons progress currently remains on this device.</p>';
 root.append(page);
 const $local=id=>page.querySelector('#'+id);
 $local('ww-seen-back').addEventListener('click',()=>window.WortWeg.navigate('dashboard'));
 // The app's existing Home click handler delegates on [data-nav], so
 // the new menu option automatically uses the original navigation logic.
 const filters=['ww-seen-search','ww-seen-status','ww-seen-level'];
 let cached=null,shown=50;
 function statsHeader(node,{total,seen,remaining,pct,bankTotal,curatedTotal,liveTotal}){
  node.replaceChildren();
  const row=text(node,'div','','ww-seen-overview-top');
  const copy=text(row,'div','','ww-seen-overview-copy');
  text(copy,'span','YOUR LEARNING JOURNEY','ww-seen-overline');
  text(copy,'strong',pretty(remaining)+' left to explore','ww-seen-overview-title');
  text(copy,'span',pretty(seen)+' of '+pretty(total)+' study entries seen · '+pct+'% complete','ww-seen-overview-sub');
  text(row,'strong',pct+'%','ww-seen-overview-percent');
  node.append(progressBar(seen,total,'Overall vocabulary exploration'));
  text(node,'div',pretty(bankTotal)+' Word Bank + '+pretty(curatedTotal)+' Topic 1'+(liveTotal?' + '+pretty(liveTotal)+' New Lessons':''),'ww-seen-small-note');
 }
 function renderLevels(node,stat,compact=false){
  node.replaceChildren();
  const title=text(node,'h3',compact?'Level progress':'Your levels');
  title.className='ww-seen-levels-title';
  for(const name of [...levels,'Topic 1','New lessons']){
   const {seen=0,total=0}=stat.totals.get(name)||{};
   if(name==='New lessons'&&!total)continue;
   const item=text(node,'div','','ww-seen-level-item');
   const lead=text(item,'div','','ww-seen-level-head');
   text(lead,'strong',name==='Topic 1'?'Topic 1 · curated':name==='New lessons'?'New lessons':name+' Word Bank');
   text(lead,'span',pretty(seen)+' / '+pretty(total)+' · '+pretty(Math.max(total-seen,0))+' left · '+percent(seen,total)+'%');
   item.append(progressBar(seen,total,name+' words seen'));
  }
  if(!compact)text(node,'p','These are vocabulary-exposure goals, not official CEFR certification or proof of mastery.','ww-seen-footnote');
 }
 const mini=document.createElement('div');mini.id='ww-seen-home-levels';
 home.append(mini);
 function renderHome(stat){
  home.replaceChildren();
  const summary=document.createElement('div');summary.className='ww-seen-home-summary';
  statsHeader(summary,stat);home.append(summary);
  const a1=stat.totals.get('A1')||{seen:0,total:0};
  const preview=document.createElement('div');preview.className='ww-seen-a1-preview';
  const line=text(preview,'div','','ww-seen-level-head');
  text(line,'strong','A1 Word Bank');
  text(line,'span',pretty(Math.max(a1.total-a1.seen,0))+' remaining · '+percent(a1.seen,a1.total)+'%');
  preview.append(progressBar(a1.seen,a1.total,'A1 Word Bank seen'));
  home.append(preview);
  const cta=document.createElement('button');cta.type='button';cta.className='ww-seen-home-cta';
  cta.textContent='Explore my seen words  →';
  cta.addEventListener('click',()=>window.WortWeg.navigate('seen'));
  home.append(cta);
 }
 function pronounce(word){
  if(!word)return;
  if(window.WortWegAudio?.speak){window.WortWegAudio.speak(word);return;}
  if(window.speechSynthesis&&window.SpeechSynthesisUtterance){
   const u=new SpeechSynthesisUtterance(word);u.lang='de-DE';
   window.speechSynthesis.cancel();window.speechSynthesis.speak(u);
   return;
  }
  const label=$local('ww-seen-results');
  label.textContent='German audio is not ready on this device.';
 }
 function renderTable(){
  const {rows}=cached||snapshot(),filter=$local('ww-seen-status').value,
   level=$local('ww-seen-level').value,q=$local('ww-seen-search').value.trim().toLocaleLowerCase();
  const matches=rows.filter(r=>{
   if(filter==='wrong'&&!r.status.wrong)return false;
   if(filter==='correct'&&r.status.wrong)return false;
   if(level!=='all'&&r.group!==level)return false;
   if(q&&![r.word.de,r.word.en,r.word.my||r.word.mm,r.word.level].some(x=>String(x||'').toLocaleLowerCase().includes(q)))return false;
   return true;
  });
  const body=$local('ww-seen-rows');body.replaceChildren();
  for(const entry of matches.slice(0,shown)){
   const {word,status}=entry,hasMistakes=status.wrong>0;
   const row=document.createElement('tr');
   row.className=hasMistakes?'ww-seen-missed':'ww-seen-correct';
   const wordCell=text(row,'td','','ww-seen-word');
   text(wordCell,'strong',word.de);
   if(word.pron)text(wordCell,'small',word.pron,'ww-seen-pron');
   text(row,'td',word.en||'—');
   text(row,'td',word.my||word.mm||'—');
   text(row,'td',entry.source==='Topic 1'?'Topic 1':entry.source==='New lessons'?'New · '+entry.group:(entry.group||'—'),'ww-seen-level');
   const statusCell=text(row,'td','','ww-seen-result');
   const badge=text(statusCell,'strong',hasMistakes?'Missed '+pretty(status.wrong)+'×':status.correctLast===null?'Seen':'Correct','ww-seen-status');
   if(hasMistakes)text(statusCell,'small',status.correctLast===true?'Answered correctly later':status.correctLast===false?'Review this word':'Mistake in history');
   const soundCell=text(row,'td','','ww-seen-audio');
   const btn=text(soundCell,'button','🔊','ww-seen-play');btn.type='button';
   btn.setAttribute('aria-label','Hear German pronunciation for '+word.de);
   btn.title='Hear '+word.de;
   btn.addEventListener('click',()=>pronounce(word.de));
   body.append(row);
  }
  $local('ww-seen-results').textContent=pretty(matches.length)+' entries match · showing '+pretty(Math.min(shown,matches.length));
  $local('ww-seen-empty').hidden=matches.length>0;
  const more=$local('ww-seen-more');more.hidden=shown>=matches.length;
  more.textContent='Show '+pretty(Math.min(50,matches.length-shown))+' more words';
 }
 function render(){
  cached=snapshot();
  renderHome(cached);
  statsHeader($local('ww-seen-page-overview'),cached);
  renderLevels($local('ww-seen-levels'),cached);
  renderTable();
 }
 for(const id of filters){
  $local(id).addEventListener(id==='ww-seen-search'?'input':'change',()=>{shown=50;renderTable()});
 }
 $local('ww-seen-more').addEventListener('click',()=>{shown+=50;renderTable()});
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-nav=seen],#ww-seen-home .ww-seen-home-cta')){
   queueMicrotask(render);
  }
 },true);
 window.addEventListener('wortweg:changed',render);
 window.addEventListener('wortweg:account',()=>setTimeout(render,0));
 window.addEventListener('wortweg:live-pack',render);
 window.addEventListener('wortweg:live-progress-changed',render);
 render();
 window.WortWegSeenWords={refresh:render,getSummary:()=>snapshot(),open:()=>{window.WortWeg.navigate('seen');render();}};
})();