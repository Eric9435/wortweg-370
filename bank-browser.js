/* WortWeg 370 · complete CEFR Word Bank browser (no 70-entry display cap).
   Small pages and lazy continuous scrolling keep 10,876 entries usable on phones. */
(()=>{
 'use strict';
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='./bank-browser.css';document.head.append(stylesheet);
 const $=id=>document.getElementById(id);
 const section=$('bank'),list=$('wordList'),search=$('wordSearch'),level=$('bankLevel'),counter=$('bankCount'),data=$('data');
 if(!section||!list||!search||!level||!counter||!data)return;
 let words;try{words=JSON.parse(data.textContent).bank;}catch{return;}
 if(!Array.isArray(words))return;
 const fmt=n=>Number(n).toLocaleString('en-US');
 const state={mode:'100',page:1,loaded:0,matches:[],batch:160};
 const make=(tag,cls,label)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(label!==undefined)el.textContent=label;
  return el;
 };
 const button=(label,fn)=>{const b=make('button','ww-bank-btn',label);b.type='button';b.addEventListener('click',fn);return b;};
 const toolbar=make('div','ww-bank-toolbar');toolbar.id='ww-bank-toolbar';
 const label=make('label','ww-bank-size','Display');
 const size=make('select');size.id='ww-bank-page-size';size.setAttribute('aria-label','Word Bank display mode');
 for(const [value,caption] of [['100','100 per page'],['250','250 per page'],['500','500 per page'],['continuous','All words · continuous scroll']]){
  const option=make('option','',caption);option.value=value;size.append(option);
 }
 size.value=state.mode;label.append(size);toolbar.append(label);
 const primary=make('nav','ww-bank-pager');primary.setAttribute('aria-label','Word Bank pages');
 const first=button('« First',()=>go(1)),prev=button('‹ Previous',()=>go(state.page-1)),
  next=button('Next ›',()=>go(state.page+1)),last=button('Last »',()=>go(pages()));
 const where=make('span','ww-bank-page-label');where.setAttribute('aria-live','polite');
 const pageLabel=make('label','ww-bank-jump','Page');
 const jump=make('input');jump.id='ww-bank-page';jump.type='number';jump.min='1';
 jump.setAttribute('aria-label','Go to Word Bank page');jump.inputMode='numeric';pageLabel.append(jump);
 primary.append(first,prev,where,pageLabel,next,last);toolbar.append(primary);
 counter.closest('.spread')?.after(toolbar);
 const footer=make('div','ww-bank-bottom');footer.id='ww-bank-bottom';
 const footerPrev=button('‹ Previous page',()=>go(state.page-1));
 const footerInfo=make('span','ww-bank-footer-count');footerInfo.setAttribute('aria-live','polite');
 const footerNext=button('Next page ›',()=>go(state.page+1));
 footer.append(footerPrev,footerInfo,footerNext);
 const more=button('Load more words ↓',loadMore);more.id='ww-bank-more';more.classList.add('ww-bank-more');
 list.after(footer,more);
 counter.setAttribute('role','status');counter.setAttribute('aria-live','polite');
 function pages(){return Math.max(1,Math.ceil(state.matches.length/Number(state.mode||100)));}
 function go(page){if(state.mode==='continuous')return;state.page=Math.max(1,Math.min(pages(),page));paint();toolbar.scrollIntoView?.({block:'nearest'});}
 jump.addEventListener('change',()=>{
  const n=Number(jump.value);if(Number.isSafeInteger(n))go(n);else jump.value=String(state.page);
 });
 size.addEventListener('change',()=>{state.mode=size.value;state.page=1;state.loaded=0;paint();});
 function play(word){
  if(window.WortWegAudio?.speak){window.WortWegAudio.speak(word);return;}
  if(typeof window.SpeechSynthesisUtterance==='function'&&window.speechSynthesis){
   const utterance=new window.SpeechSynthesisUtterance(word);utterance.lang='de-DE';
   window.speechSynthesis.cancel();window.speechSynthesis.speak(utterance);
  }
 }
 function wordRow(w){
  const item=make('div','item ww-bank-entry');
  item.dataset.wordId=String(w.id);
  const info=make('div','ww-bank-entry-info');
  const heading=make('div','name');
  heading.append(document.createTextNode(String(w.de||'')+' '));
  heading.append(make('span','badgetext',String(w.level||'—')));
  info.append(heading,make('div','sub',String(w.en||'—')+' · '+String(w.mm||w.my||'—')));
  if(w.type)info.append(make('span','ww-bank-word-type',String(w.type)));
  if(w.pron)info.append(make('div','muted tiny',String(w.pron)));
  const sound=button('🔊',()=>play(w.de));
  sound.classList.add('sound','small');
  sound.setAttribute('aria-label','Hear pronunciation of '+String(w.de||''));
  item.append(info,sound);return item;
 }
 function appendRows(start,end){
  const frag=document.createDocumentFragment();
  for(let i=start;i<end;i++)frag.append(wordRow(state.matches[i]));
  list.append(frag);
 }
 function updateControls(){
  const n=state.matches.length,continuous=state.mode==='continuous',pageCount=pages();
  const start=n?(continuous?1:(state.page-1)*Number(state.mode)+1):0;
  const end=continuous?state.loaded:Math.min(n,state.page*Number(state.mode));
  counter.textContent=fmt(n)+' of '+fmt(words.length)+' Word Bank entries match · showing '+fmt(start)+'–'+fmt(end);
  where.textContent='Page '+fmt(state.page)+' of '+fmt(pageCount);
  jump.value=String(state.page);jump.max=String(pageCount);
  primary.hidden=continuous;pageLabel.hidden=continuous;
  footerPrev.hidden=continuous;footerNext.hidden=continuous;
  footerInfo.textContent=continuous?fmt(state.loaded)+' / '+fmt(n)+' loaded':'Page '+fmt(state.page)+' / '+fmt(pageCount);
  first.disabled=prev.disabled=footerPrev.disabled=state.page<=1;
  next.disabled=last.disabled=footerNext.disabled=state.page>=pageCount;
  more.hidden=!continuous||state.loaded>=n;
  if(continuous&&state.loaded<n)more.textContent='Load next '+fmt(Math.min(state.batch,n-state.loaded))+' words ↓';
  if(!n)list.append(make('p','ww-bank-empty','No matching words. Try another search or CEFR level.'));
 }
 let observer=null;
 if(typeof window.IntersectionObserver==='function'){
  observer=new window.IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)&&state.mode==='continuous'&&state.loaded<state.matches.length)loadMore();
  },{rootMargin:'250px'});
 }
 function loadMore(){
  if(state.mode!=='continuous')return;
  const end=Math.min(state.matches.length,state.loaded+state.batch);
  appendRows(state.loaded,end);state.loaded=end;updateControls();
  observer?.disconnect();
  if(!more.hidden)observer?.observe(more);
 }
 function paint(){
  observer?.disconnect();
  list.replaceChildren();
  if(state.mode==='continuous'){
   state.loaded=0;
   loadMore();
  }else{
   state.page=Math.max(1,Math.min(pages(),state.page));
   const start=(state.page-1)*Number(state.mode);
   appendRows(start,Math.min(state.matches.length,start+Number(state.mode)));
   updateControls();
  }
 }
 function render(reset=false){
  if(reset){state.page=1;state.loaded=0;}
  const q=search.value.trim().toLocaleLowerCase(),l=level.value;
  state.matches=words.filter(w=>(l==='ALL'||w.level===l)&&(!q||[w.de,w.en,w.mm].some(t=>String(t||'').toLocaleLowerCase().includes(q))));
  paint();
 }
 // The legacy handlers still call showBank on navigation; showBank delegates
 // to this renderer. Re-bind filter changes to avoid the original 70-word cap.
 search.oninput=()=>render(true);
 level.onchange=()=>render(true);
 window.WortWegBank={render:()=>render(),getSummary:()=>({total:words.length,matches:state.matches.length,
  page:state.page,pages:state.mode==='continuous'?null:pages(),shown:state.mode==='continuous'?state.loaded:
   Math.min(state.matches.length,state.page*Number(state.mode)-(state.page-1)*Number(state.mode)),
  mode:state.mode})};
 render();
})();
