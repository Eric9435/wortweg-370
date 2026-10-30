/* WortWeg 370 · independent definite-article quiz covering the complete noun catalogue. */
(()=>{
 'use strict';
 const data=document.getElementById('data');
 if(!data||!document.querySelector('#dashboard .ww-main-menu .ww-menu-options'))return;
 let source;try{source=JSON.parse(data.textContent);}catch{return;}
 if(!Array.isArray(source.bank)||!Array.isArray(source.curated))return;
 const make=(tag,cls,text)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;
  return el;
 };
 const button=(label,fn,cls='')=>{
  const el=make('button',cls,label);el.type='button';el.addEventListener('click',fn);return el;
 };
 // Only definite-article entries are valid questions; verbs, adjectives and
 // ambiguous article-less nouns must not receive an invented grammatical gender.
 function noun(item,key,level,sourceName){
  if(typeof item?.de!=='string')return null;
  const text=item.de.trim().replace(/\s+/g,' ');
  const match=/^(der|die|das)\s+(.+)$/iu.exec(text);
  if(!match||!match[2].trim()||/^[,;:–—-]/.test(match[2]))return null;
  const bare=match[2].trim(),article=match[1].toLowerCase();
  return {key,article,bare,de:article+' '+bare,en:String(item.en||''),
   my:String(item.mm||item.my||''),level:level||'—',source:sourceName};
 }
 let cachedWords=null,cachedLookup=null;
 function catalogue(){
  if(cachedWords)return cachedWords;
  const all=[],seen=new Set();
  function add(raw){
   if(!raw)return;
   const fingerprint=[raw.article,raw.bare.toLocaleLowerCase('de'),raw.en.toLocaleLowerCase()].join('|');
   if(seen.has(fingerprint))return;
   seen.add(fingerprint);all.push(raw);
  }
  for(const w of source.bank)add(noun(w,'b:'+w.id,w.level,'bank'));
  for(const w of source.curated)add(noun(w,'c:'+String(w.de).toLocaleLowerCase(),w.level||'Topic 1','curated'));
  for(const lesson of window.WortWegLive?.getPack?.()?.lessons||[]){
   for(const w of lesson.words||[])add(noun(w,'l:'+w.id,lesson.level,'live'));
  }
  cachedWords=all;cachedLookup=new Map(all.map(w=>[w.key,w]));return all;
 }
 const root=make('section','ww-articles-root');
 root.id='ww-articles-quiz';root.hidden=true;root.setAttribute('role','dialog');
 root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Der Die Das vocabulary quiz');
 document.body.append(root);
 const stylesheet=make('link');stylesheet.rel='stylesheet';stylesheet.href='./articles-quiz.css';document.head.append(stylesheet);
 const levels=['A1','A2','B1','B2','C1','C2','Topic 1'];
 const preferences={level:'all',source:'all',size:'all',shuffle:false};
 let profileId='',state={records:{},session:null},previousFocus=null;
 function profile(){
  const uid=window.WortWegAccountSnapshot?.uid;
  return typeof uid==='string'&&/^[\w-]{1,128}$/.test(uid)?uid:'guest';
 }
 const storageKey=id=>'wortweg370-articles-quiz-v1-'+id;
 function load(){
  try{
   const s=JSON.parse(localStorage.getItem(storageKey(profileId))||'{}');
   if(!s||typeof s!=='object'||Array.isArray(s))return {records:{},session:null};
   return {records:s.records&&typeof s.records==='object'&&!Array.isArray(s.records)?s.records:{},
    session:s.session&&Array.isArray(s.session.keys)?s.session:null};
  }catch{return {records:{},session:null};}
 }
 function save(){
  try{localStorage.setItem(storageKey(profileId),JSON.stringify(state));}catch{}
 }
 function switchProfile(){
  profileId=profile();state=load();
 }
 switchProfile();
 function eligible(){
  return catalogue().filter(w=>(preferences.level==='all'||w.level===preferences.level)&&
   (preferences.source==='all'||w.source===preferences.source));
 }
 function errors(){
  return Object.values(state.records).filter(record=>record&&record.missed>0&&record.lastCorrect===false).length;
 }
 function summary(){
  return {total:catalogue().length,attempted:Object.keys(state.records).length,
   mistakes:errors(),answered:state.session?.cursor||0,sessionTotal:state.session?.keys?.length||0};
 }
 function launch(){
  const options=document.querySelector('#dashboard .ww-main-menu .ww-menu-options');
  if(!options||document.getElementById('ww-articles-launch'))return;
  const tile=button('',open,'ww-articles-launch');
  tile.id='ww-articles-launch';tile.setAttribute('aria-label','Open Der Die Das quiz');
  const icon=make('span','ww-menu-icon','Aa');
  const copy=make('span');
  copy.append(make('strong','','Der · Die · Das Quiz'),
   make('small','','All noun articles · choose the correct article'));
  tile.append(icon,copy,make('span','ww-menu-arrow','›'));
  const flash=document.getElementById('ww-flashcards-launch');
  if(flash)flash.after(tile);
  else options.append(tile);
 }
 function shell(title){
  root.replaceChildren();
  const header=make('header','ww-articles-header');
  const text=make('div');text.append(make('small','ww-articles-kicker','WORTWEG 370'),make('h1','',title));
  header.append(text,button('✕ Close',close,'ww-articles-secondary'));
  root.append(header);
 }
 function select(parent,title,chosen,values,change){
  const field=make('label','ww-articles-field');field.append(make('span','',title));
  const input=make('select');input.setAttribute('aria-label',title);
  for(const [value,text] of values){const option=make('option','',text);option.value=value;input.append(option);}
  input.value=chosen;input.addEventListener('change',()=>change(input.value));
  field.append(input);parent.append(field);
 }
 function renderSetup(){
  shell('Der · Die · Das Quiz');
  const panel=make('div','ww-articles-panel');
  const intro=make('p','ww-articles-intro',
   'Choose the correct article for each German noun. Includes every article-labelled word in your Word Bank, Topic 1, and downloaded lessons. Verbs and entries without a definite article are excluded.');
  panel.append(intro);
  const stats=summary(),cards=make('div','ww-articles-stats');
  for(const [value,label] of [[stats.total,'Nouns available'],[stats.attempted,'Words attempted'],[stats.mistakes,'Mistakes to review']]){
   const el=make('div','ww-articles-stat');
   el.append(make('strong','',Number(value).toLocaleString('en-US')),make('small','',label));cards.append(el);
  }
  panel.append(cards);
  const filters=make('div','ww-articles-filters');
  select(filters,'Level',preferences.level,[['all','All levels'],...levels.map(x=>[x,x])],
   x=>{preferences.level=x;renderSetup();});
  select(filters,'Source',preferences.source,[['all','All sources'],['bank','Word Bank'],['curated','Topic 1'],['live','Downloaded lessons']],
   x=>{preferences.source=x;renderSetup();});
  select(filters,'Question count',preferences.size,[['20','20 questions'],['50','50 questions'],['100','100 questions'],['all','All eligible words']],
   x=>{preferences.size=x;renderSetup();});
  panel.append(filters);
  const shuffle=make('label','ww-articles-check');
  const toggle=make('input');toggle.type='checkbox';toggle.checked=preferences.shuffle;
  toggle.addEventListener('change',()=>{preferences.shuffle=toggle.checked;});
  shuffle.append(toggle,make('span','','Shuffle the questions'));panel.append(shuffle);
  const available=eligible().length;
  panel.append(make('p','ww-articles-small',available.toLocaleString('en-US')+' nouns match these filters. “All eligible words” has no 20/50/100-question limit.'));
  const actions=make('div','ww-articles-setup-actions');
  const start=button('Start '+(preferences.size==='all'?available:Math.min(available,Number(preferences.size))).toLocaleString('en-US')+' questions',
   ()=>startSession('new'),'ww-articles-primary');
  start.disabled=!available;actions.append(start);
  const saved=state.session;
  if(saved&&saved.cursor<saved.keys.length&&saved.keys.length){
   actions.append(button('Continue '+saved.cursor+' / '+saved.keys.length,()=>resume(),'ww-articles-secondary'));
  }
  if(errors())actions.append(button('Review '+errors()+' mistakes',()=>startSession('mistakes'),'ww-articles-secondary'));
  panel.append(actions);
  panel.append(make('p','ww-articles-note',
   'Answers and your current session are saved for this profile on this device. This quiz does not change your existing WortWeg quiz, Flashcards or Seen Words progress.'));
  root.append(panel);
 }
 function startSession(mode){
  const questions=mode==='mistakes'
   ?catalogue().filter(w=>state.records[w.key]?.missed>0&&state.records[w.key]?.lastCorrect===false)
   :eligible();
  if(preferences.shuffle||mode==='mistakes'){
   for(let i=questions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[questions[i],questions[j]]=[questions[j],questions[i]];}
  }
  const amount=mode==='mistakes'||preferences.size==='all'?questions.length:Math.min(questions.length,Number(preferences.size));
  if(!amount){renderSetup();return;}
  state.session={keys:questions.slice(0,amount).map(w=>w.key),cursor:0,correct:0,wrong:0,mode,startedAt:new Date().toISOString()};
  save();renderQuestion();
 }
 function current(){
  const session=state.session;
  if(!session||session.cursor>=session.keys.length)return null;
  catalogue();
  const lookup=cachedLookup;
  // A live pack may change between saving and resuming. Skip removed keys
  // without corrupting the remaining checkpoint.
  while(session.cursor<session.keys.length){
   const word=lookup.get(session.keys[session.cursor]);
   if(word)return word;
   session.cursor++;save();
  }
  return null;
 }
 function resume(){if(!state.session)return renderSetup();renderQuestion();}
 function answer(choice,word,buttons,feedback,next){
  const session=state.session;
  if(!session||session.keys[session.cursor]!==word.key)return;
  const correct=choice===word.article,now=new Date().toISOString();
  const old=state.records[word.key]||{};
  state.records[word.key]={attempts:(old.attempts||0)+1,missed:(old.missed||0)+(correct?0:1),
   correct:(old.correct||0)+(correct?1:0),lastCorrect:correct,lastAnswered:now,
   de:word.de,en:word.en,my:word.my,level:word.level};
  session.cursor++;session.correct+=correct?1:0;session.wrong+=correct?0:1;save();
  for(const b of buttons){
   b.disabled=true;
   b.classList.toggle('ww-articles-right',b.dataset.article===word.article);
   b.classList.toggle('ww-articles-wrong',b.dataset.article===choice&&!correct);
  }
  feedback.hidden=false;feedback.replaceChildren();
  feedback.classList.toggle('ww-articles-feedback-wrong',!correct);
  feedback.append(make('strong','',correct?'✓ Correct!':'✕ Not quite'));
  const line=make('p','',word.de);feedback.append(line);
  if(word.en||word.my)feedback.append(make('p','ww-articles-small',[word.en,word.my].filter(Boolean).join(' · ')));
  next.hidden=false;next.textContent=session.cursor>=session.keys.length?'View results →':'Next word →';
  next.focus();
 }
 function renderQuestion(){
  shell('Article practice');
  const s=state.session;
  if(!s||s.cursor>=s.keys.length)return renderResults();
  const word=current();
  if(!word)return renderResults();
  const pane=make('div','ww-articles-panel');
  const top=make('div','ww-articles-top');
  top.append(make('span','',(s.cursor+1).toLocaleString('en-US')+' / '+s.keys.length.toLocaleString('en-US')),
   make('span','','✓ '+s.correct+'   ✕ '+s.wrong));
  pane.append(top);
  const bar=make('div','ww-articles-progress');
  const fill=make('span');fill.style.width=100*s.cursor/s.keys.length+'%';bar.append(fill);pane.append(bar);
  const question=make('div','ww-articles-word');
  question.append(make('small','','CHOOSE THE ARTICLE'),make('strong','',word.bare));
  if(word.en)question.append(make('span','ww-articles-meaning',word.en));
  if(word.my)question.append(make('span','ww-articles-meaning',word.my));
  if(word.level)question.append(make('span','ww-articles-level',word.level));
  pane.append(question);
  const choices=make('div','ww-articles-choices'),buttons=[];
  for(const article of ['der','die','das']){
   const b=button(article,()=>answer(article,word,buttons,feedback,next),'ww-articles-choice');
   b.dataset.article=article;choices.append(b);buttons.push(b);
  }
  pane.append(choices);
  const feedback=make('div','ww-articles-feedback');feedback.hidden=true;feedback.setAttribute('role','status');pane.append(feedback);
  const next=button('Next word →',renderQuestion,'ww-articles-primary ww-articles-next');next.hidden=true;pane.append(next);
  const actions=make('div','ww-articles-utility');
  actions.append(button('← Setup',renderSetup,'ww-articles-secondary'));
  pane.append(actions);
  root.append(pane);
 }
 function renderResults(){
  shell('Session results');
  const s=state.session,wrap=make('div','ww-articles-panel ww-articles-results');
  if(!s)return renderSetup();
  wrap.append(make('h2','',s.correct+' / '+(s.correct+s.wrong)+' correct'));
  wrap.append(make('p','',s.keys.length+' article questions completed · '+Math.round(100*s.correct/Math.max(1,s.correct+s.wrong))+'% accuracy'));
  wrap.append(make('p','',errors()+' words still need review.'));
  wrap.append(button('New quiz',()=>{state.session=null;save();renderSetup();},'ww-articles-primary'));
  if(errors())wrap.append(button('Review mistakes',()=>startSession('mistakes'),'ww-articles-secondary'));
  root.append(wrap);
 }
 function open(){
  if(!root.hidden)return;
  previousFocus=document.activeElement;profileId=profile();state=load();
  root.hidden=false;document.body.classList.add('ww-articles-open');
  renderSetup();
 }
 function close(){
  if(root.hidden)return;
  root.hidden=true;document.body.classList.remove('ww-articles-open');
  previousFocus?.focus?.();
 }
 launch();
 window.addEventListener('wortweg:account',()=>{switchProfile();if(!root.hidden)renderSetup();});
 window.addEventListener('wortweg:live-pack',()=>{cachedWords=null;cachedLookup=null;if(!root.hidden&&!state.session)renderSetup();});
 document.addEventListener('keydown',event=>{if(!root.hidden&&event.key==='Escape'){event.preventDefault();close();}});
 window.WortWegArticlesQuiz={open,close,getSummary:summary,getEligibleCount:()=>catalogue().length};
})();
