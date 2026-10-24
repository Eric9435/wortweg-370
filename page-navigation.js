/* WortWeg · consistent Back / Close navigation across learning screens.
   Additive only: core screen routing, study history and account state untouched. */
(()=>{
 'use strict';
 if(window.WortWegPageNavigation)return;
 const main=document.querySelector('main');
 if(!main)return;
 const pages=()=>[...main.querySelectorAll(':scope > .section')];
 const visibleMain=()=>pages().find(p=>p.classList.contains('active'))||null;
 let routeStack=[],lastRoute=null,pending=false;
 const observedRoots=new WeakSet();
 function trackRoute(){
   const id=visibleMain()?.id;
   if(!id||lastRoute===id)return;
   const prev=routeStack[routeStack.length-2];
   if(prev===id)routeStack.pop();
   else if(routeStack[routeStack.length-1]!==id)routeStack.push(id);
   if(routeStack.length>35)routeStack=routeStack.slice(-35);
   lastRoute=id;
 }
 function navigate(id){
   if(!id||!document.getElementById(id))id='dashboard';
   if(window.WortWeg?.navigate)window.WortWeg.navigate(id);
   else pages().forEach(p=>p.classList.toggle('active',p.id===id));
   window.scrollTo?.(0,0);
   trackRoute();
 }
 const clickExisting=el=>{if(!el)return false;el.click();return true;};
 function closeReader(){window.WortWegReadingStudio?.close?.();}
 function isGrammarVisible(){return !!document.querySelector('#wg-academy:not([hidden])');}
 function isFlashVisible(){return !!document.querySelector('#ww-flashcards:not([hidden])');}
 function reader(){return document.querySelector('.wwr-overlay .wwr-window');}
 function modalClose(){
   if(reader()){closeReader();return true;}
   if(isGrammarVisible()){
     clickExisting(document.querySelector('#wg-academy .wg-back'));
     return true;
   }
   if(isFlashVisible()){
     clickExisting(document.querySelector('#ww-flashcards .ww-flash-close'));
     return true;
   }
   return false;
 }
 function goBack(source){
   if(source==='reader'){
     // First dismiss an expanded word explanation; otherwise dismiss reader.
     if(clickExisting(document.querySelector('.wwr-overlay .wwx-card:not([hidden]) [aria-label="Close word detail"]')))return;
     closeReader();return;
   }
   if(source==='grammar'){
     if(clickExisting(document.querySelector('#wg-academy .wg-body .wg-link')))return;
     modalClose();return;
   }
   if(source==='flashcards'){modalClose();return;}
   const active=visibleMain();
   if(active?.id==='settings'&&document.querySelector('#ww-settings-detail:not([hidden])')){
     if(clickExisting(document.getElementById('ww-settings-back')))return;
   }
   if(active?.id==='ww-topic-detail'&&document.querySelector('#ww-topic-quiz:not([hidden])')){
     if(clickExisting(document.getElementById('ww-topic-show')))return;
   }
   if(active?.id==='ww-special-vocab'&&clickExisting(document.querySelector('#ww-special-quiz:not([hidden]) .ww-special-exit')))return;
   trackRoute();
   const previous=routeStack[routeStack.length-2];
   navigate(previous&&previous!==active?.id?previous:'dashboard');
 }
 function closePage(source){
   if(source==='reader'){closeReader();return;}
   if(source==='grammar'||source==='flashcards'){modalClose();navigate('dashboard');return;}
   navigate('dashboard');
 }
 function makeBar(source){
   const bar=document.createElement('nav');
   bar.className='ww-page-nav';
   bar.setAttribute('aria-label','Page navigation');
   bar.dataset.pageSource=source;
   const back=document.createElement('button');
   back.type='button';back.className='ww-page-nav-back';
   back.setAttribute('aria-label','Back to previous page');
   back.textContent='← Back';back.addEventListener('click',()=>goBack(source));
   const label=document.createElement('span');
   label.className='ww-page-nav-label';
   label.textContent=source==='reader'?'Reading Passage':source==='grammar'?'Grammar':source==='flashcards'?'Flashcards':'WortWeg';
   const close=document.createElement('button');
   close.type='button';close.className='ww-page-nav-close';
   close.setAttribute('aria-label','Close current page');
   close.textContent='✕ Close';close.addEventListener('click',()=>closePage(source));
   bar.append(back,label,close);
   return bar;
 }
 function ensure(target,source){
   if(!target)return;
   const existing=[...target.children].find(el=>el.classList?.contains('ww-page-nav'));
   if(existing)return;
   target.prepend(makeBar(source));
   target.classList.add('ww-has-page-nav');
 }
 function refresh(){
   pending=false;
   // The Dashboard is the navigation destination, not a closable page.
   pages().filter(p=>p.id&&p.id!=='dashboard').forEach(p=>ensure(p,'main'));
   ensure(reader(),'reader');
   const grammarRoot=document.getElementById('wg-academy');
   const flashRoot=document.getElementById('ww-flashcards');
   ensure(grammarRoot,'grammar');
   ensure(flashRoot,'flashcards');
   // Flashcards repeatedly replace their own children; subscribe even when
   // the module was dynamically added after the navigation loader.
   if(grammarRoot&&!observedRoots.has(grammarRoot)){
     observer.observe(grammarRoot,{childList:true});observedRoots.add(grammarRoot);
   }
   if(flashRoot&&!observedRoots.has(flashRoot)){
     observer.observe(flashRoot,{childList:true});observedRoots.add(flashRoot);
   }
   // The former global reader shortcut must never float over unrelated pages.
   document.getElementById('wwr-launcher')?.remove();
   trackRoute();
 }
 function queue(){
   if(pending)return;pending=true;
   requestAnimationFrame(refresh);
 }
 const style=document.createElement('link');
 style.rel='stylesheet';style.href='./page-navigation.css?v=1';document.head.append(style);
 const observer=new MutationObserver(records=>{
   if(records.some(record=>record.type==='childList'||record.target?.classList?.contains('section')))queue();
 });
 observer.observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 observer.observe(document.body,{childList:true});
 refresh();

 window.addEventListener('hashchange',queue);
 document.addEventListener('click',event=>{
   if(event.target.closest('.ww-page-nav'))return;
   queue();
 },true);
 window.WortWegPageNavigation={refresh,back:goBack,close:closePage,getHistory:()=>routeStack.slice()};
})();