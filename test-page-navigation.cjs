/* Regression: Back / Close on sections and full-screen study overlays. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html='<!doctype html><html><head></head><body>'
  +'<main><section class="section active" id="dashboard"><h1>Home</h1></section>'
  +'<section class="section" id="topics"><button class="ww-menu-back">Old Back</button><h2>Topics</h2></section>'
  +'<section class="section" id="study"><h2>Study</h2></section>'
  +'<section class="section" id="quiz"><h2>Question</h2></section>'
  +'<section class="section" id="settings"><h2>Settings</h2><div id="ww-settings-detail" hidden></div></section>'
  +'</main></body></html>';
const dom=new JSDOM(html,{url:'https://example.org/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,doc=w.document;
w.scrollTo=()=>{};
w.WortWeg={navigate:id=>{
 for(const page of doc.querySelectorAll('main > .section'))page.classList.toggle('active',page.id===id);
}};
w.eval(fs.readFileSync('page-navigation.js','utf8'));
const nav=w.WortWegPageNavigation;
assert(nav,'Navigation controller exposed');
const $=s=>doc.querySelector(s);
assert.equal($('#dashboard .ww-page-nav'),null,'No redundant Back / Close on Home');
for(const id of ['topics','study','quiz','settings']){
 assert.equal(doc.querySelectorAll('#'+id+' > .ww-page-nav').length,1,'Exactly one contextual navigation bar in '+id);
 assert($('#'+id+' .ww-page-nav-back'),'Back exists in '+id);
 assert.equal(doc.querySelectorAll('#'+id+' .ww-page-nav-close').length,0,'No duplicate Close on main '+id);
 assert($('#'+id+' .ww-page-nav-tools'),'Annotation tool integrated in '+id);
}
assert.equal($('#quiz .ww-page-nav-label').textContent,'Quiz','Quiz title replaces generic WortWeg title');
assert(doc.getElementById('wwr-launcher')===null,'No reading launcher outside passage');
w.WortWeg.navigate('topics');nav.refresh();
assert.equal(nav.getHistory().at(-1),'topics');
w.WortWeg.navigate('study');nav.refresh();
$('#study .ww-page-nav-back').click();
assert($('#topics').classList.contains('active'),'Back returns to previous learning page');
$('#topics .ww-page-nav-back').click();
assert($('#dashboard').classList.contains('active'),'A single Back returns Home');
w.WortWeg.navigate('study');nav.refresh();
w.WortWeg.navigate('quiz');nav.refresh();
$('#quiz .ww-page-nav-back').click();
assert($('#study').classList.contains('active'),'Quiz Back always returns to study setup');
w.WortWeg.navigate('settings');nav.refresh();
const detail=$('#ww-settings-detail');detail.hidden=false;
let inSettings=0;
const settingsBack=doc.createElement('button');settingsBack.id='ww-settings-back';
settingsBack.addEventListener('click',()=>{detail.hidden=true;inSettings++});
$('#settings').append(settingsBack);
$('#settings .ww-page-nav-back').click();
assert.equal(inSettings,1,'Back leaves Settings subpage before leaving Settings');
const overlay=doc.createElement('div');overlay.className='wwr-overlay';
const reader=doc.createElement('section');reader.className='wwr-window';
overlay.append(reader);doc.body.append(overlay);
let readerClosed=0;
w.WortWegReadingStudio={close:()=>{readerClosed++;overlay.remove();}};
const leaking=doc.createElement('button');leaking.id='wwr-launcher';doc.body.append(leaking);
nav.refresh();
assert.equal($('#wwr-launcher'),null,'Obsolete global launcher forcibly removed');
assert($('.wwr-window .ww-page-nav-back')&&$('.wwr-window .ww-page-nav-close'),'Both controls appear inside Reading');
$('.wwr-window .ww-page-nav-close').click();
assert.equal(readerClosed,1,'Close dismisses reader but keeps underlying view');
const grammar=doc.createElement('section');grammar.id='wg-academy';grammar.hidden=false;
const header=doc.createElement('header');const close=doc.createElement('button');close.className='wg-back';
close.addEventListener('click',()=>{grammar.hidden=true});header.append(close);grammar.append(header);
const body=doc.createElement('div');body.className='wg-body';const link=doc.createElement('button');link.className='wg-link';
let roadmap=0;link.addEventListener('click',()=>roadmap++);body.append(link);grammar.append(body);doc.body.append(grammar);
nav.refresh();
$('#wg-academy .ww-page-nav-back').click();
assert.equal(roadmap,1,'Grammar Back returns to lesson list');
$('#wg-academy .ww-page-nav-close').click();
assert.equal(grammar.hidden,true,'Grammar Close exits module');
assert($('#dashboard').classList.contains('active'),'Grammar Close returns Home');
const flash=doc.createElement('section');flash.id='ww-flashcards';flash.hidden=false;
flash.innerHTML='<header><button class="ww-flash-close">Close</button></header>';
flash.querySelector('.ww-flash-close').addEventListener('click',()=>{flash.hidden=true;});
doc.body.append(flash);nav.refresh();
assert($('#ww-flashcards .ww-page-nav'),'Flashcards includes contextual controls');
flash.replaceChildren(doc.createElement('div'));
nav.refresh();
assert($('#ww-flashcards .ww-page-nav'),'Flashcard re-render receives controls again');
assert(fs.readFileSync('sw.js','utf8').includes("'./page-navigation.js'"),'Navigation precached for offline use');
assert(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes("'page-navigation.css'"),'Navigation bundled in new Android build');
assert(fs.readFileSync('page-navigation.css','utf8').includes('#wwr-launcher{display:none!important}'),'CSS hides former global button');
dom.window.close();
console.log('PASS: single contextual Back/main navigation, Quiz→Setup, retained overlay Close, settings, offline/native integration.');
