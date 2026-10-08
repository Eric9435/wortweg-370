/* WortWeg 370 · progressive UI enhancements.
   No changes to progress storage, Firebase, audio, quiz selection or routing. */
(()=>{
 'use strict';
 if(!document.body.classList.contains('ww-game-interface'))return;
 const $=id=>document.getElementById(id);
 const stats=$('stats'),review=$('review');
 const icon='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18V8m5 10V4m5 14v-7m5 7V6"/><path d="M2 21h20"/></svg>';
 function snapshot(){
  try{
   const value=window.WortWeg?.getProgress?.();
   if(value&&typeof value==='object')return value;
  }catch{}
  return null;
 }
 function count(value){return Number.isFinite(value)&&value>=0?Math.floor(value):0;}
 function overview(){
  if(!stats)return;
  const state=snapshot();
  if(!state)return;
  const answered=count(state.answered),correct=Math.min(answered,count(state.correct));
  const accuracy=answered?Math.round(correct/answered*100):0;
  let panel=$('ww-ios-progress-overview');
  if(!panel){
   panel=document.createElement('div');
   panel.id='ww-ios-progress-overview';
   panel.setAttribute('role','group');
   panel.setAttribute('aria-label','Learning accuracy overview');
   panel.innerHTML='<div class="ww-ios-ring" role="img"><div class="ww-ios-ring-center"><strong id="ww-ios-ring-value">—</strong><small>Accuracy</small></div></div><div class="ww-ios-overview-copy"><strong>Keep building your vocabulary</strong><span id="ww-ios-overview-detail">Start a quiz to see your progress here.</span></div>';
   const heading=[...stats.querySelectorAll('h2,h3')].find(el=>/learning progress/i.test(el.textContent||''))||stats.querySelector('h2,h3');
   if(heading)heading.after(panel);
   else stats.prepend(panel);
  }
  const ring=panel.querySelector('.ww-ios-ring');
  ring.style.setProperty('--ww-ring-percent',accuracy+'%');
  ring.setAttribute('aria-label',answered?accuracy+' percent correct':'No questions answered');
  $('ww-ios-ring-value').textContent=answered?accuracy+'%':'—';
  $('ww-ios-overview-detail').textContent=answered
    ?correct+' correct answers out of '+answered+' questions. Keep practising to improve your accuracy.'
    :'Complete your first 10-question quiz to start tracking accuracy.';
  const heading=[...stats.querySelectorAll('h2,h3,.smalltitle')].find(el=>/recent sessions/i.test(el.textContent||''));
  if(!heading)return;
  let empty=$('ww-ios-empty-sessions');
  const hasSessions=Array.isArray(state.history)&&state.history.length>0;
  if(hasSessions){empty?.remove();return;}
  if(!empty){
   empty=document.createElement('div');empty.id='ww-ios-empty-sessions';empty.className='ww-ios-empty';
   empty.innerHTML=icon+'<span>Your completed quizzes will appear here. Start learning to create your first session.</span>';
   heading.after(empty);
  }
 }
 function reviewState(){
  if(!review)return;
  const empty=/No mistakes yet/i.test(review.textContent||'');
  const controls=[...review.querySelectorAll('button')].filter(button=>/^(?:[▶►]?\s*)?(?:review due|practice all mistakes)$/i.test(button.textContent.trim()));
  for(const button of controls){
   if(empty){
    if(!button.disabled){button.dataset.wwIosDisabled='true';button.disabled=true;}
    button.title='Finish a quiz first to create a mistake review list.';
   }else if(button.dataset.wwIosDisabled==='true'){
    button.disabled=false;delete button.dataset.wwIosDisabled;button.removeAttribute('title');
   }
  }
 }
 function refresh(){overview();reviewState();}
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-nav],.ww-menu-back,#startQuiz,#submitAnswer,#nextQuiz,#reviewNow,#reviewAll')){
   setTimeout(refresh,0);
  }
 },true);
 window.addEventListener('wortweg:changed',refresh);
 window.addEventListener('wortweg:account',refresh);
 if(review){
  // Review items are rendered asynchronously by the original app.
  new MutationObserver(()=>reviewState()).observe(review,{childList:true,subtree:true,characterData:true});
 }
 refresh();
})();