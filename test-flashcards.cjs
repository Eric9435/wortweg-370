const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('flashcards.js','utf8');
new vm.Script(source,{filename:'flashcards.js'});
const catalog={bank:[
 {id:1,de:'der Abend',en:'evening',mm:'ညနေ',level:'A1'},
 {id:2,de:'die Adresse',en:'address',mm:'လိပ်စာ',level:'A1'},
 {id:3,de:'arbeiten',en:'work',mm:'အလုပ်လုပ်',level:'A2'}
],curated:[{de:'der Name',en:'name',mm:'နာမည်'}]};
const html='<!doctype html><html><head></head><body class="ww-game-interface"><main>'+
 '<section id="dashboard"><div class="ww-main-menu"><div class="ww-menu-options">'+
 '<button data-nav="study">Study</button><button data-nav="review">Review</button>'+
 '</div></div></section></main>'+
 '<script id="data" type="application/json">'+JSON.stringify(catalog)+'</script></body></html>';
const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only'});
const w=dom.window;
w.WortWegAccountSnapshot={uid:'userA'};
w.WortWegLive={getPack:()=>({lessons:[{id:'greetings',level:'A1',words:[
 {id:'hello',de:'Hallo',en:'Hello',my:'မင်္ဂလာပါ'},
 {id:'bye',de:'Tschüss',en:'Bye',my:'နှုတ်ဆက်ပါတယ်'}]}]})};
let spoken='';
w.WortWegAudio={speak:t=>spoken=t};
const originalQuiz={answered:23,correct:20};
w.WortWeg={getProgress:()=>originalQuiz};
w.eval(source);
const $=sel=>w.document.querySelector(sel);
assert.equal(w.WortWegFlashcards.getCatalogCount(),6,'Full bank, curated entries and live lesson included');
assert.deepEqual(JSON.parse(JSON.stringify(w.WortWegFlashcards.getSummary())),{total:6,reviewed:0,due:0,remembered:0});
assert.ok($('#ww-flashcards-launch'),'Flashcards discoverable from original menu');
$('#ww-flashcards-launch').click();
assert.equal($('#ww-flashcards').hidden,false,'Flashcards overlay opens');
assert.ok($('#ww-flashcards').textContent.includes('6 matching entries'));
const select=label=>[...w.document.querySelectorAll('.ww-flash-field select')].find(e=>e.getAttribute('aria-label')===label);
function set(label,value){const s=select(label);assert.ok(s,'Missing selector '+label);s.value=value;s.dispatchEvent(new w.Event('change'));}
set('Source','bank');
assert.ok($('#ww-flashcards').textContent.includes('3 matching entries'),'Source filters Word Bank');
set('Level','A1');
assert.ok($('#ww-flashcards').textContent.includes('2 matching entries'),'CEFR level filter works');
set('Source','all');set('Level','all');
set('Session size','all');
set('Front of card','en');
$('#ww-flashcards .ww-flash-primary').click();
assert.ok($('.ww-flash-study-top').textContent.includes('1 / 6'),'All six entries selectable in one session');
// Swipe the card itself without removing or replacing the existing buttons.
const gesture=(dx,dy=0,cancel=false)=>{
 const card=$('.ww-flash-card');
 for(const [name,x,y] of [
  ['pointerdown',200,200],
  ['pointermove',200+dx,200+dy],
  [cancel?'pointercancel':'pointerup',200+dx,200+dy]
 ]){
  const e=new w.Event(name,{bubbles:true,cancelable:true});
  Object.defineProperties(e,{pointerId:{value:1},pointerType:{value:'touch'},
   isPrimary:{value:true},clientX:{value:x},clientY:{value:y}});
  card.dispatchEvent(e);
 }
};
assert.ok($('.ww-flash-swipe-hint').textContent.includes('Swipe left'),'Visible swipe guidance');
assert.match(fs.readFileSync('flashcards.css','utf8'),/touch-action:pan-y/,'Vertical page scroll remains available');
gesture(-100);
assert.ok($('.ww-flash-study-top').textContent.includes('2 / 6'),'Swipe left goes forward');
assert.equal(w.WortWegFlashcards.getSummary().reviewed,0,'Swiping does not save a rating');
gesture(100);
assert.ok($('.ww-flash-study-top').textContent.includes('1 / 6'),'Swipe right returns to previous card');
gesture(20,110);
assert.ok($('.ww-flash-study-top').textContent.includes('1 / 6'),'Vertical scrolling does not change card');
gesture(-25,3);
assert.ok($('.ww-flash-study-top').textContent.includes('1 / 6'),'Short movement is not a swipe');
gesture(-110,0,true);
assert.ok($('.ww-flash-study-top').textContent.includes('1 / 6'),'Cancelled gestures do not advance');
gesture(105);
assert.ok($('.ww-flash-study-top').textContent.includes('1 / 6'),'First card cannot go backward');
const navButtons=$('.ww-flash-navigation').querySelectorAll('button');
assert.equal(navButtons.length,2,'Previous and Skip buttons are still displayed');
navButtons[1].click();
assert.ok($('.ww-flash-study-top').textContent.includes('2 / 6'),'Skip button still advances');
$('.ww-flash-navigation button').click();
assert.ok($('.ww-flash-study-top').textContent.includes('1 / 6'),'Previous button still returns');
const word=$('.ww-flash-word').textContent;
assert.ok(word,'Reverse card displays translation on front');
$('.ww-flash-card').click();
assert.ok($('.ww-flash-word').textContent,'Card flips');
$('.ww-flash-audio').click();
assert.ok(spoken,'German pronunciation uses existing audio engine');
$('.ww-flash-know').click();
assert.equal(w.WortWegFlashcards.getSummary().reviewed,1);
assert.equal(w.WortWegFlashcards.getSummary().remembered,1);
assert.equal(originalQuiz.answered,23,'Flashcard progress never overwrites quiz data');
assert.ok(w.localStorage.getItem('wortweg370-flashcards-v1-userA'),'Ratings persist on device');
w.WortWegFlashcards.close();
assert.equal($('#ww-flashcards').hidden,true);
w.WortWegAccountSnapshot={uid:'userB'};
w.dispatchEvent(new w.Event('wortweg:account'));
assert.equal(w.WortWegFlashcards.getSummary().reviewed,0,'Second user sees isolated records');
w.WortWegAccountSnapshot={uid:'userA'};
w.dispatchEvent(new w.Event('wortweg:account'));
assert.equal(w.WortWegFlashcards.getSummary().reviewed,1,'Original review restored on account switch');
for(const path of ['flashcards.js','flashcards.css']){
 assert.ok(fs.readFileSync('sw.js','utf8').includes(path),'Offline cache includes '+path);
 assert.ok(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes(path),'Native package includes '+path);
}
assert.ok(fs.readFileSync('ios-polish.js','utf8').includes('flashcards.js'),'Web bootstrap loads flashcards');
assert.ok(fs.readFileSync('home-refresh.js','utf8').includes('WortWegFlashcards'),'Home shortcut opens flashcards');
// Manual numbered navigation must work across the full matching deck, even with a 20-card session.
w.WortWegLive={getPack:()=>({lessons:[{id:'many',level:'A1',words:
 Array.from({length:30},(_,i)=>({id:'seek'+i,de:'Wort '+(i+1),en:'Word '+(i+1)}))}]})};
const reviewedBeforeSeek=w.WortWegFlashcards.getSummary().reviewed;
w.WortWegFlashcards.open();
set('Session size','20');
const startRange=$('.ww-flash-start-seek input[type="range"]');
const startNumber=$('#ww-flash-start-number');
assert.ok(startRange&&startNumber,'Starting-card slider and number entry are available');
assert.equal(startRange.max,'34','Starting-card slider spans full filtered catalogue');
startRange.value='28';
startRange.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal(startNumber.value,'28','Drag previews the chosen start number');
$('#ww-flashcards .ww-flash-primary').click();
assert.ok($('.ww-flash-study-top').textContent.includes('28 / 34'),'Study starts at chosen card number');
assert.equal($('.ww-flash-inline-seek').hidden,true,'Number slider is collapsed by default');
assert.equal($('.ww-flash-study-seek'),null,'Large always-visible Jump to card box is gone');
const progressButton=$('.ww-flash-progress');
assert.equal(progressButton.tagName,'BUTTON','Top progress bar is a tap target');
assert.equal(progressButton.getAttribute('aria-expanded'),'false','Slider starts closed');
progressButton.click();
assert.equal($('.ww-flash-inline-seek').hidden,false,'Tapping the progress bar reveals the slider');
assert.equal(progressButton.getAttribute('aria-expanded'),'true','Disclosure state is announced');
let studyRange=$('.ww-flash-inline-seek input[type="range"]');
assert.equal(studyRange.max,'34','Compact slider reaches outside the 20-card session window');
studyRange.value='2';
studyRange.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal($('#ww-flash-jump-number').value,'2','Dragging slider previews numeric position');
studyRange.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.ok($('.ww-flash-study-top').textContent.includes('2 / 34'),'Jumping back rebases the session');
assert.equal($('.ww-flash-inline-seek').hidden,true,'Slider collapses after choosing a card');
$('.ww-flash-progress').click();
let studyNumber=$('#ww-flash-jump-number');
studyNumber.value='34';
studyNumber.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.ok($('.ww-flash-study-top').textContent.includes('34 / 34'),'Manual number entry jumps to last card');
assert.equal($('.ww-flash-inline-seek').hidden,true,'Number selection also closes the slider');
$('.ww-flash-progress').click();
$('.ww-flash-inline-seek-close').click();
assert.equal($('.ww-flash-inline-seek').hidden,true,'Close control dismisses slider');
assert.equal($('.ww-flash-progress').getAttribute('aria-expanded'),'false','Closed slider state resets');
assert.equal(w.WortWegFlashcards.getSummary().reviewed,reviewedBeforeSeek,
 'Jumping never changes spaced-repetition ratings');
w.WortWegFlashcards.close();
w.WortWegFlashcards.open();
assert.equal($('#ww-flash-start-number').value,'1','Reopening does not auto-resume a previous card');
w.WortWegFlashcards.close();
assert.match(fs.readFileSync('flashcards.css','utf8'),/ww-flash-inline-seek\[hidden\]/,'Collapsed slider has explicit hidden styling');
assert.match(fs.readFileSync('flashcards.css','utf8'),/ww-flash-progress-track/,'Progress bar has expanded touch target styling');
dom.window.close();
console.log('PASS: all vocabulary cards, CEFR/source filters, flip, audio, persisted per-profile SRS, existing quiz isolation, and offline assets.');
