/* Single iOS-inspired Home launcher. Existing progress, menus and quiz logic remain intact. */
(()=>{'use strict';
const dashboard=document.getElementById('dashboard');if(!dashboard)return;
const menu=dashboard.querySelector('.ww-main-menu');if(!menu)return;
const top=menu.querySelector('.ww-menu-top');
if(!top)return;
const $=(q)=>dashboard.querySelector(q);
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const clickExisting=(selector)=>{const target=$(selector);if(target){target.click();return true;}return false;};
const actions=[
 {id:'learn',icon:'↗',title:'Learn vocabulary',caption:'Continue learning',run:()=>clickExisting('.ww-menu-primary')||clickExisting('[data-nav="topics"]')},
 {id:'complete-reading',icon:'▤',title:'Complete Reading',caption:'A1–C2 levels · German & English',run:()=>{window.location.href='./complete-reading.html';return true;}},
 {id:'dialog',icon:'◉',title:'Dialog',caption:'A1–C2 conversations · source-based practice',run:()=>{window.location.href='./dialog.html';return true;}},
 {id:'write',icon:'✎',title:'Writing',caption:'Memorize by typing',run:()=>{if(window.WortWegWriting?.open){window.WortWegWriting.open();return true;}return clickExisting('#ww-writing-launch');}},
 {id:'flashcards',icon:'▣',title:'Flashcards',caption:'Flip all vocabulary words',run:()=>{if(window.WortWegFlashcards?.open){window.WortWegFlashcards.open();return true;}return clickExisting('#ww-flashcards-launch');}},
 {id:'articles',icon:'Aa',title:'Der · Die · Das Quiz',caption:'Test every noun article',run:()=>{if(window.WortWegArticlesQuiz?.open){window.WortWegArticlesQuiz.open();return true;}return clickExisting('#ww-articles-launch');}},
 {id:'review',icon:'↻',title:'Review',caption:'Words to revisit',run:()=>clickExisting('[data-nav="review"]')},
 {id:'library',icon:'▤',title:'Word Library',caption:'Your word history',run:()=>{if(window.WortWegSeenWords?.open){window.WortWegSeenWords.open();return true;}return clickExisting('[data-nav="seen"]');}},
 {id:'grammar',icon:'Aa',title:'Grammar',caption:'A1–C1 academy',run:()=>{if(window.WortWegGrammar?.open){window.WortWegGrammar.open();return true;}return clickExisting('#wg-grammar-launch');}},
 {id:'gender-lifetime',icon:'Aa',title:'Gender Lifetime',caption:'der · die · das · 14 chapters (A1–C2)',run:()=>{window.location.href='./gender-lifetime.html';return true;}},
 {id:'goethe-exam',icon:'◎',title:'Goethe Exam Prep',caption:'A1–C2 · 100 topics · exam skills',run:()=>{window.location.href='./goethe-exam.html';return true;}},
 {id:'special',icon:'Aa+',title:'Special Vocabulary',caption:'Conjunctions, numbers, time & more',run:()=>{if(window.WortWegSpecialVocabulary?.open){window.WortWegSpecialVocabulary.open();return true}return false}},
 {id:'atlas',icon:'▦',title:'Vocabulary Atlas',caption:'Static reference chart · 11,312 entries',run:()=>{window.WortWegVocabularyAtlas?.open?.();return true}}
];
const zone=make('section','ww-home-focus');zone.id='ww-home-focus';zone.setAttribute('aria-label','Learning shortcuts');
const heading=make('div','ww-home-focus-head');
const group=make('div','ww-home-focus-copy');group.append(make('p','ww-home-focus-kicker','YOUR LEARNING SPACE'),make('h3','','Ready to learn?'),make('p','ww-home-focus-sub','Choose what you want to practice today.'));
heading.append(group);zone.append(heading);
const primary=make('button','ww-home-focus-primary');primary.type='button';
const primaryCopy=make('span','ww-home-focus-primary-copy');primaryCopy.append(make('small','','PICK UP WHERE YOU LEFT OFF'),make('strong','','Continue vocabulary'),make('span','','Learn new German words'));
const pIcon=make('span','ww-home-focus-primary-icon','↗'),pChevron=make('span','ww-home-focus-chevron','›');pIcon.setAttribute('aria-hidden','true');pChevron.setAttribute('aria-hidden','true');primary.append(pIcon,primaryCopy,pChevron);
primary.addEventListener('click',()=>actions[0].run());zone.append(primary);
const label=make('h4','ww-home-focus-section','Learning tools');zone.append(label);

const finder=make('div','wwq-module-finder');
const finderLabel=make('label','wwq-module-label','Find a learning tool');
finderLabel.htmlFor='wwq-module-search';
const finderInput=make('input','wwq-module-search');
finderInput.id='wwq-module-search';finderInput.type='search';finderInput.autocomplete='off';
finderInput.placeholder='Search reading, Goethe, grammar, dialogue…';
finderInput.setAttribute('aria-controls','ww-home-learning-grid');
const finderResult=make('span','wwq-module-results');
finderResult.setAttribute('role','status');finderResult.setAttribute('aria-live','polite');
const dialogSearch=make('a','wwq-dialog-search-result','Open Dialog · A1–C2 ↗');
dialogSearch.href='./dialog.html';
dialogSearch.hidden=true;
finder.append(finderLabel,finderInput,finderResult,dialogSearch);
zone.append(finder);
const grid=make('div','ww-home-focus-grid');grid.id='ww-home-learning-grid';for(const a of actions.slice(1).filter(item=>item.id!=='dialog')){
 const b=make('button','ww-home-focus-tile ww-home-focus-'+a.id);b.type='button';b.dataset.wwqSearch=(a.title+' '+a.caption+' '+a.id).toLocaleLowerCase();
 const icon=make('span','ww-home-focus-tile-icon',a.icon),copy=make('span','ww-home-focus-tile-copy');icon.setAttribute('aria-hidden','true');copy.append(make('strong','',a.title),make('small','',a.caption));b.append(icon,copy);b.addEventListener('click',()=>a.run());grid.append(b);
 }zone.append(grid);
const tileList=Array.from(grid.querySelectorAll('button'));
function filterLearningTools(){
 const q=finderInput.value.trim().toLocaleLowerCase();
 let visible=0;
 for(const tile of tileList){const found=!q||tile.dataset.wwqSearch.includes(q);tile.hidden=!found;if(found)visible++;}
 const dialogFound=!!q&&['dialog','dialogue','conversation','sprechen','speaking','စကားပြော'].some(term=>term.includes(q)||q.includes(term));
 dialogSearch.hidden=!dialogFound;
 if(dialogFound)visible++;
 finderResult.textContent=q?(visible+' of '+(tileList.length+1)+' tools'):'';
 finderResult.textContent=q&&visible===0?'No matching learning tools':finderResult.textContent;
}
finderInput.addEventListener('input',filterLearningTools);
finderInput.addEventListener('keydown',e=>{
 if(e.key==='Escape'){finderInput.value='';filterLearningTools();return;}
 if(e.key==='Enter'){const first=tileList.find(tile=>!tile.hidden);if(first){e.preventDefault();first.click();}else if(!dialogSearch.hidden){e.preventDefault();dialogSearch.click();}}
});
document.addEventListener('keydown',e=>{
 if(e.key!=='/'||e.altKey||e.ctrlKey||e.metaKey)return;
 const tag=e.target?.tagName||'';
 if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target?.isContentEditable)return;
 const active=dashboard.classList.contains('active')||(!!dashboard.getClientRects?.().length&&!dashboard.hidden);
 if(active){e.preventDefault();finderInput.focus();}
});
const dialogLink=make('a','ww-home-dialog-link');
dialogLink.href='./dialog.html';
dialogLink.setAttribute('aria-label','Open standalone A1, A2, B1, B2, C1 and C2 German conversations');
dialogLink.append(make('span','ww-home-dialog-symbol','◉'),make('strong','','Dialog'),make('small','','A1 · A2 · B1 · B2 · C1 · C2'),make('span','ww-home-dialog-arrow','›'));
top.append(dialogLink);
top.after(zone);
menu.classList.add('ww-home-modern');
zone.classList.remove('ww-home-focus-classic');
try{localStorage.removeItem('wortweg370-home-view');}catch{}
window.WortWegHomeRefresh={open:()=>zone.scrollIntoView({behavior:'smooth',block:'start'})};
/* Shared site-wide polish and keyboard skip navigation. No chart DOM is altered. */
for(const [tag,url] of [['link','./quality-2026.css'],['script','./quality-2026.js']]){
 const el=document.createElement(tag);
 if(tag==='link')el.rel='stylesheet';else el.defer=true;
 if(tag==='link')el.href=url;else el.src=url;
 document.head.append(el);
}
const checklistScript=document.createElement('script');checklistScript.src='./learning-checklist.js?v=7';document.body.append(checklistScript);
})();
/* All six language-support categories use one independent learning collection. */
(()=>{const css=document.createElement('link');css.rel='stylesheet';css.href='./special-vocabulary.css';document.head.append(css);const js=document.createElement('script');js.src='./special-vocabulary.js';document.head.append(js);})();

/* Add the full-resolution 11,312-word SVG reference viewer (independent learning tool). */
(()=>{const js=document.createElement('script');js.src='./vocabulary-atlas.js?v=1';document.body.append(js);})();
