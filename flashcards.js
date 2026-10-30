/* WortWeg 370 - all-catalogue flashcards. Independent per-profile SRS storage. */
(()=>{
 'use strict';
 const node=document.getElementById('data');
 if(!node||!document.querySelector('#dashboard .ww-main-menu'))return;
 let input;try{input=JSON.parse(node.textContent);}catch{return;}
 if(!Array.isArray(input.bank)||!Array.isArray(input.curated))return;
 const levels=['A1','A2','B1','B2','C1','C2'];
 const legacy=[
  ...input.bank.map(w=>({key:'b:'+w.id,de:w.de,en:w.en,my:w.mm||w.my||'',level:w.level||'—',source:'bank'})),
  ...input.curated.map(w=>({key:'c:'+w.de.toLocaleLowerCase(),de:w.de,en:w.en,my:w.mm||w.my||'',level:'Topic 1',source:'curated'}))
 ].filter(w=>typeof w.de==='string'&&w.de.trim());
 function catalogue(){
  const list=legacy.slice(),keys=new Set(list.map(w=>w.key));
  const pack=window.WortWegLive?.getPack?.();
  for(const lesson of pack?.lessons||[]){
   for(const w of lesson.words||[]){
    if(typeof w.de!=='string'||!w.de.trim())continue;
    const key='l:'+w.id;
    if(keys.has(key))continue;
    keys.add(key);
    list.push({key,de:w.de,en:w.en||'',my:w.my||w.mm||'',level:lesson.level||'—',source:'live'});
   }
  }
  return list;
 }
 const make=(tag,cls,label)=>{
  const e=document.createElement(tag);if(cls)e.className=cls;
  if(label!==undefined)e.textContent=label;
  return e;
 };
 const button=(label,cb,cls)=>{
  const e=make('button',cls,label);e.type='button';e.addEventListener('click',cb);return e;
 };
 function profile(){
  const uid=window.WortWegAccountSnapshot?.uid;
  return uid&&/^[\w-]{1,128}$/.test(uid)?uid:'guest';
 }
 const storageKey=()=> 'wortweg370-flashcards-v1-'+profile();
 function load(){
  try{
   const p=JSON.parse(localStorage.getItem(storageKey())||'{}');
   return p&&typeof p==='object'&&!Array.isArray(p)?p:{};
  }catch{return {};}
 }
 let records=load();
 function save(){try{localStorage.setItem(storageKey(),JSON.stringify(records));}catch{}}
 const today=()=>Date.now();
 const statusFor=w=>{
  const r=records[w.key];
  if(!r)return 'new';
  return Number(r.dueAt)<=today()?'due':'learned';
 };
 function summary(){
  const list=catalogue();
  return {total:list.length,reviewed:list.filter(w=>!!records[w.key]).length,
   due:list.filter(w=>statusFor(w)==='due').length,
   remembered:list.filter(w=>records[w.key]?.intervalDays>0).length};
 }
 const root=make('section','ww-flash-root');
 root.id='ww-flashcards';root.hidden=true;
 root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 root.setAttribute('aria-label','Vocabulary flashcard study');
 document.body.append(root);
 const stylesheet=document.createElement('link');
 stylesheet.rel='stylesheet';stylesheet.href='./flashcards.css';
 document.head.append(stylesheet);
 const settings={source:'all',level:'all',status:'all',search:'',direction:'de',size:'20',shuffle:false};
 let session=[],position=0,flipped=false,sessionProfile='',previousFocus=null;
 function say(german){
  if(window.WortWegAudio?.speak){window.WortWegAudio.speak(german);return;}
  if(typeof SpeechSynthesisUtterance==='undefined'||!window.speechSynthesis)return;
  const utterance=new SpeechSynthesisUtterance(german);utterance.lang='de-DE';
  window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);
 }
 function launchButton(){
  const opts=document.querySelector('#dashboard .ww-main-menu .ww-menu-options');
  if(!opts||document.getElementById('ww-flashcards-launch'))return;
  const btn=button('',open,'ww-flashcards-launch');
  btn.id='ww-flashcards-launch';btn.setAttribute('aria-label','Open all vocabulary flashcards');
  const mark=make('span','ww-menu-icon','▣');mark.setAttribute('aria-hidden','true');
  const copy=make('span');
  copy.append(make('strong','', 'Flashcards'),make('small','', 'All words · flip, listen and review'));
  btn.append(mark,copy,make('span','ww-menu-arrow','›'));
  const review=opts.querySelector('[data-nav="review"]');
  if(review)review.before(btn);else opts.append(btn);
 }
 function shell(title){
  root.replaceChildren();
  const header=make('header','ww-flash-header');
  const heading=make('div');
  heading.append(make('small','ww-flash-overline','WORTWEG 370'),make('h1','',title));
  header.append(heading,button('✕ Close',close,'ww-flash-close'));
  root.append(header);
 }
 function selectControl(parent,label,value,options,callback){
  const wrap=make('label','ww-flash-field');
  wrap.append(make('span','',label));
  const select=make('select');select.setAttribute('aria-label',label);
  for(const [v,t] of options){
   const option=make('option','',t);option.value=v;select.append(option);
  }
  select.value=value;select.addEventListener('change',()=>callback(select.value));
  wrap.append(select);parent.append(wrap);
 }
 function filtered(){
  const q=settings.search.trim().toLocaleLowerCase();
  return catalogue().filter(w=>{
   if(settings.source!=='all'&&w.source!==settings.source)return false;
   if(settings.level!=='all'&&w.level!==settings.level)return false;
   const s=statusFor(w);
   if(settings.status==='new'&&s!=='new')return false;
   if(settings.status==='due'&&s!=='due')return false;
   if(settings.status==='learned'&&s!=='learned')return false;
   if(settings.status==='missed'&&!(records[w.key]?.missed>0))return false;
   return !q||[w.de,w.en,w.my].some(t=>String(t||'').toLocaleLowerCase().includes(q));
  });
 }
 function renderSetup(){
  session=[];flipped=false;shell('Flashcards');
  const pane=make('div','ww-flash-panel');
  pane.append(make('p','ww-flash-intro','Study every German word in your vocabulary bank, Topic 1 and downloaded lessons. Tap to flip and rate your recall.'));
  const stat=summary();
  const metrics=make('div','ww-flash-metrics');
  for(const [number,label] of [[stat.total,'Available entries'],[stat.reviewed,'Reviewed'],[stat.due,'Due now'],[stat.remembered,'Remembered']]){
   const item=make('div','ww-flash-metric');item.append(make('strong','',Number(number).toLocaleString('en-US')),make('small','',label));metrics.append(item);
  }
  pane.append(metrics);
  const fields=make('div','ww-flash-fields');
  const change=(name,value)=>{settings[name]=value;renderSetup();};
  selectControl(fields,'Source',settings.source,[['all','All vocabulary'],['bank','Word Bank (A1–C2)'],['curated','Topic 1 curated'],['live','New lessons']],v=>change('source',v));
  selectControl(fields,'Level',settings.level,[['all','All levels'],...levels.map(s=>[s,s]),['Topic 1','Topic 1']],v=>change('level',v));
  selectControl(fields,'Cards to study',settings.status,[['all','All cards'],['new','Not yet reviewed'],['due','Due for review'],['missed','Previously missed'],['learned','Not due yet']],v=>change('status',v));
  selectControl(fields,'Front of card',settings.direction,[['de','German → English + Myanmar'],['en','English + Myanmar → German']],v=>change('direction',v));
  selectControl(fields,'Session size',settings.size,[['20','20 cards'],['50','50 cards'],['100','100 cards'],['all','All matching cards']],v=>change('size',v));
  pane.append(fields);
  const search=make('label','ww-flash-field ww-flash-search');
  search.append(make('span','','Find words'));
  const input=make('input');input.type='search';input.autocomplete='off';input.placeholder='Search German, English or Myanmar';
  input.value=settings.search;search.append(input);pane.append(search);
  const toggles=make('label','ww-flash-check');
  const shuffle=make('input');shuffle.type='checkbox';shuffle.checked=settings.shuffle;
  shuffle.addEventListener('change',()=>{settings.shuffle=shuffle.checked;});
  toggles.append(shuffle,make('span','','Shuffle cards'));pane.append(toggles);
  const count=make('p','ww-flash-count');pane.append(count);
  const start=button('Start flashcards',startSession,'ww-flash-primary');pane.append(start);
  function refreshCount(){
   settings.search=input.value;
   const amount=filtered().length;
   count.textContent=amount.toLocaleString('en-US')+' matching entries · no words removed from your library';
   start.disabled=amount===0;
   start.textContent='Study '+(settings.size==='all'?amount:Math.min(amount,Number(settings.size))).toLocaleString('en-US')+' cards';
  }
  input.addEventListener('input',refreshCount);refreshCount();
  pane.append(make('p','ww-flash-note','Rate a flashcard to add it to My seen words; skipped cards do not count. Your flashcard history is saved on this device for this profile. Quiz and writing records remain unchanged.'));
  root.append(pane);
 }
 function startSession(){
  const matching=filtered();
  if(!matching.length)return;
  const sorted=matching.slice();
  if(settings.shuffle){
   for(let i=sorted.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[sorted[i],sorted[j]]=[sorted[j],sorted[i]];}
  }else if(settings.status==='all'){
   // Prioritize unreviewed and due words, so short daily sessions advance through the full bank.
   const rank=w=>statusFor(w)==='due'?0:statusFor(w)==='new'?1:2;
   sorted.sort((a,b)=>rank(a)-rank(b));
  }
  session=sorted.slice(0,settings.size==='all'?sorted.length:Number(settings.size));
  position=0;flipped=false;sessionProfile=profile();renderCard();
 }
 function rate(remembered){
  if(sessionProfile!==profile())return renderSetup();
  const w=session[position],old=records[w.key]||{};
  const intervalDays=remembered?(old.intervalDays?Math.min(365,Math.round(old.intervalDays*2.5)||1):1):0;
  const dueAt=remembered?today()+intervalDays*86400000:today();
  records[w.key]={reps:(old.reps||0)+1,missed:(old.missed||0)+(remembered?0:1),
   intervalDays,dueAt,lastKnown:remembered,lastReviewed:new Date().toISOString(),
   de:w.de,en:w.en,my:w.my,level:w.level};
  save();
  // Seen Words reads the same profile's flashcard records without touching quiz history.
  window.dispatchEvent(new CustomEvent('wortweg:flashcards-changed',{detail:{key:w.key,remembered}}));
  position++;flipped=false;renderCard();
 }
 // Pointer Events work in current Android WebViews and iOS Safari. Restrict
 // gestures to the card: vertical scrolling and every existing button stay usable.
 function attachSwipe(card){
  let gesture=null,ignoreClick=false;
  const reset=()=>{
   card.classList.remove('ww-flash-dragging');
   card.style.removeProperty('transform');
   card.style.removeProperty('opacity');
  };
  card.addEventListener('pointerdown',event=>{
   if(event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
   ignoreClick=false;
   gesture={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,dy:0,dragged:false};
   try{card.setPointerCapture?.(event.pointerId);}catch{}
  });
  card.addEventListener('pointermove',event=>{
   if(!gesture||event.pointerId!==gesture.id)return;
   const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
   gesture.dx=dx;gesture.dy=dy;
   if(!gesture.dragged){
    if(Math.abs(dx)<10||Math.abs(dx)<Math.abs(dy)*1.2)return;
    gesture.dragged=true;card.classList.add('ww-flash-dragging');
   }
   const offset=Math.sign(dx)*Math.min(Math.abs(dx)*0.8,145);
   card.style.transform='translate3d('+offset+'px,0,0) rotate('+(offset/28)+'deg)';
   card.style.opacity=String(1-Math.min(Math.abs(offset)/450,0.25));
  });
  function finish(event,cancelled=false){
   if(!gesture||event.pointerId!==gesture.id)return;
   const {dx,dy,dragged}=gesture;
   gesture=null;
   reset();
   // A drag must never trigger the card's normal click-to-flip action.
   if(dragged)ignoreClick=true;
   if(cancelled||!dragged||Math.abs(dx)<60||Math.abs(dx)<=Math.abs(dy)*1.25)return;
   moveCard(dx<0?1:-1);
  }
  card.addEventListener('pointerup',event=>finish(event));
  card.addEventListener('pointercancel',event=>finish(event,true));
  card.addEventListener('lostpointercapture',event=>finish(event,true));
  card.addEventListener('click',event=>{
   if(!ignoreClick)return;
   ignoreClick=false;event.preventDefault();event.stopImmediatePropagation();
  },true);
  card.addEventListener('keydown',()=>{ignoreClick=false;});
 }
 function moveCard(step){
  const next=position+step;
  if(next<0||next>session.length)return;
  position=next;flipped=false;renderCard();
 }
 function renderCard(){
  if(sessionProfile!==profile())return renderSetup();
  shell('Flashcard review');
  if(position>=session.length){
   const wrap=make('div','ww-flash-panel ww-flash-complete');
   wrap.append(make('h2','','Session completed'),make('p','',session.length+' cards completed. Your recall ratings are saved for this profile.'));
   wrap.append(button('New session',renderSetup,'ww-flash-primary'));
   root.append(wrap);return;
  }
  const w=session[position],back=settings.direction==='de';
  const panel=make('div','ww-flash-study');
  const top=make('div','ww-flash-study-top');
  top.append(make('span','',(position+1)+' / '+session.length),
   make('span','',w.level+' · '+(w.source==='bank'?'Word Bank':w.source==='live'?'New lessons':'Topic 1')));
  panel.append(top);
  const progress=make('div','ww-flash-progress');
  const fill=make('span');fill.style.width=100*position/session.length+'%';progress.append(fill);panel.append(progress);
  const flip=button('',()=>{flipped=!flipped;renderCard();},'ww-flash-card');
  flip.setAttribute('aria-label',flipped?'Show front of flashcard':'Reveal flashcard answer');
  flip.setAttribute('aria-pressed',String(flipped));
  const face=make('div','ww-flash-face');
  const primary=flipped?(back?(w.en||'English meaning unavailable'):(w.de)):(back?w.de:(w.en||'Meaning'));
  const extra=flipped?(back?w.my:'German answer'):(back?'Tap to reveal English + မြန်မာ':(w.my?w.my+' · ':'')+'Tap to reveal German');
  face.append(make('span','ww-flash-face-caption',flipped?'ANSWER':back?'RECALL THE MEANING':'RECALL THE GERMAN'),
   make('strong','ww-flash-word',primary),make('p','ww-flash-translation',extra));
  face.append(make('small','ww-flash-flip-hint',flipped?'Tap to see the front again':'Tap card to flip'));
  flip.append(face);attachSwipe(flip);panel.append(flip);
  panel.append(make('p','ww-flash-swipe-hint','← Swipe left: next card · Swipe right: previous card →'));
  const audio=button('🔊 Listen in German',()=>say(w.de),'ww-flash-audio');
  panel.append(audio);
  const actions=make('div','ww-flash-actions');
  if(flipped){
   actions.append(button('Again · review',()=>rate(false),'ww-flash-again'),
    button('✓ I knew it',()=>rate(true),'ww-flash-know'));
  }else{
   actions.append(button('Reveal answer',()=>{flipped=true;renderCard();},'ww-flash-primary'));
  }
  panel.append(actions);
  const nav=make('div','ww-flash-navigation');
  const prev=button('← Previous',()=>moveCard(-1),'ww-flash-secondary');prev.disabled=position===0;
  const skip=button('Skip →',()=>moveCard(1),'ww-flash-secondary');
  nav.append(prev,skip);panel.append(nav);
  root.append(panel);
 }
 function open(){
  if(!root.hidden)return;
  previousFocus=document.activeElement;
  root.hidden=false;document.body.classList.add('ww-flash-open');
  records=load();renderSetup();root.querySelector('.ww-flash-close')?.focus();
 }
 function close(){
  if(root.hidden)return;
  root.hidden=true;document.body.classList.remove('ww-flash-open');
  session=[];previousFocus?.focus?.();
 }
 launchButton();
 window.addEventListener('wortweg:account',()=>{records=load();session=[];if(!root.hidden)renderSetup();});
 window.addEventListener('wortweg:live-pack',()=>{if(!root.hidden&&!session.length)renderSetup();});
 document.addEventListener('keydown',event=>{
  if(root.hidden)return;
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.target.closest('input,textarea,select'))return;
  if(event.code==='Space'&&session.length){event.preventDefault();flipped=!flipped;renderCard();}
 });
 window.WortWegFlashcards={open,close,getSummary:summary,getCatalogCount:()=>catalogue().length};
})();
