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
 {id:'write',icon:'✎',title:'Writing',caption:'Memorize by typing',run:()=>{if(window.WortWegWriting?.open){window.WortWegWriting.open();return true;}return clickExisting('#ww-writing-launch');}},
 {id:'review',icon:'↻',title:'Review',caption:'Words to revisit',run:()=>clickExisting('[data-nav="review"]')},
 {id:'library',icon:'▤',title:'Word Library',caption:'Your word history',run:()=>{if(window.WortWegSeenWords?.open){window.WortWegSeenWords.open();return true;}return clickExisting('[data-nav="seen"]');}},
 {id:'grammar',icon:'Aa',title:'Grammar',caption:'A1–C1 academy',run:()=>{if(window.WortWegGrammar?.open){window.WortWegGrammar.open();return true;}return clickExisting('#wg-grammar-launch');}}
];
const zone=make('section','ww-home-focus');zone.id='ww-home-focus';zone.setAttribute('aria-label','Learning shortcuts');
const heading=make('div','ww-home-focus-head');
const group=make('div','ww-home-focus-copy');group.append(make('p','ww-home-focus-kicker','YOUR LEARNING SPACE'),make('h3','','Ready to learn?'),make('p','ww-home-focus-sub','Choose what you want to practice today.'));
heading.append(group);zone.append(heading);
const primary=make('button','ww-home-focus-primary');primary.type='button';
const primaryCopy=make('span','ww-home-focus-primary-copy');primaryCopy.append(make('small','','PICK UP WHERE YOU LEFT OFF'),make('strong','','Continue vocabulary'),make('span','','Learn new German words'));
primary.append(make('span','ww-home-focus-primary-icon','↗'),primaryCopy,make('span','ww-home-focus-chevron','›'));
primary.addEventListener('click',()=>actions[0].run());zone.append(primary);
const label=make('h4','ww-home-focus-section','Learning tools');zone.append(label);
const grid=make('div','ww-home-focus-grid');for(const a of actions.slice(1)){
 const b=make('button','ww-home-focus-tile ww-home-focus-'+a.id);b.type='button';
 const icon=make('span','ww-home-focus-tile-icon',a.icon),copy=make('span','ww-home-focus-tile-copy');copy.append(make('strong','',a.title),make('small','',a.caption));b.append(icon,copy);b.addEventListener('click',()=>a.run());grid.append(b);
}zone.append(grid);
top.after(zone);
menu.classList.add('ww-home-modern');
zone.classList.remove('ww-home-focus-classic');
try{localStorage.removeItem('wortweg370-home-view');}catch{}
window.WortWegHomeRefresh={open:()=>zone.scrollIntoView({behavior:'smooth',block:'start'})};
const checklistScript=document.createElement('script');checklistScript.src='./learning-checklist.js?v=3';document.body.append(checklistScript);
})();