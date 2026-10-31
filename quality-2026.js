/* WortWeg UI quality utilities: accessibility-only; never modifies study data. */
(()=>{'use strict';
if(document.documentElement.hasAttribute('data-ww-quality'))return;
document.documentElement.setAttribute('data-ww-quality','2026');
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
function init(){if(!document.body)return;addSkip();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();