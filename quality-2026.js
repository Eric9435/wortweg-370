/* WortWeg UI quality utilities: accessibility-only; never modifies study data. */
(()=>{'use strict';
if(document.documentElement.hasAttribute('data-ww-quality'))return;
document.documentElement.setAttribute('data-ww-quality','2026');
function applySavedAppearance(){
 /* App main route applies its own theme; do not override its settings handlers. */
 if(document.body?.classList?.contains('ww-game-interface'))return;
 try{
  const pref=JSON.parse(localStorage.getItem('wortweg370-settings-v1')||'{}');
  const mode=['system','light','dark'].includes(pref.mode)?pref.mode:'system';
  const systemDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches||false;
  document.documentElement.dataset.mode=mode==='system'?(systemDark?'dark':'light'):mode;
  if(['small','normal','large','extra'].includes(pref.font))document.documentElement.dataset.font=pref.font;
 }catch{}
}
function addSkip(){
 const target=document.querySelector('main, [role="main"], #dashboard, #app, #main');
 if(!target||document.querySelector('.wwq-skip'))return;
 if(!target.id)target.id='wwq-main-content';
 const skip=document.createElement('a');
 skip.href='#'+target.id;
 skip.className='wwq-skip';
 skip.textContent='Skip to learning content';
 skip.addEventListener('click',()=>{
   if(!target.hasAttribute('tabindex')){target.setAttribute('tabindex','-1');target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});}
   target.focus({preventScroll:true});
 });
 document.body.insertBefore(skip,document.body.firstChild);
}
function init(){if(!document.body)return;applySavedAppearance();addSkip();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();