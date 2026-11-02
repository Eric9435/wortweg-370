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
// Only the visible top progress line is draggable: no button, overlay, or duplicate slider.
let scrub=$('.ww-flash-progress');
assert.ok(scrub,'Top progress bar is present');
assert.equal(scrub.tagName,'INPUT','The progress track itself is a native range');
assert.equal(scrub.type,'range','Native touch slider is used');
assert.equal(scrub.min,'1');
assert.equal(scrub.max,'34','Top slider reaches the entire matching deck');
assert.equal(scrub.value,'28','Selected starting card is reflected in the slider');
assert.equal($('.ww-flash-inline-seek'),null,'No popup or expandable slider exists');
assert.equal($('.ww-flash-study-seek'),null,'No large Jump to card box exists');
assert.equal(w.document.querySelectorAll('.ww-flash-study input[type="range"]').length,1,
 'Exactly one study slider is visible');
const initialWord=$('.ww-flash-word').textContent;
scrub.value='12';
scrub.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal($('.ww-flash-progress'),scrub,'Range must stay mounted while the thumb is moving');
assert.ok($('.ww-flash-study-top').textContent.includes('12 / 34'),'Position previews live during drag');
assert.notEqual($('.ww-flash-word').textContent,initialWord,'Word previews live during drag');
assert.equal(scrub.style.getPropertyValue('--ww-seek-fill').includes('%'),true,'Track fills while dragging');
scrub.value='2';
scrub.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal($('.ww-flash-progress'),scrub,'Repeated touch input never replaces the slider');
assert.ok($('.ww-flash-study-top').textContent.includes('2 / 34'),'Latest drag position previews');
scrub.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.ok($('.ww-flash-study-top').textContent.includes('2 / 34'),'Release selects new card');
assert.equal($('.ww-flash-progress').value,'2','Selected card updates the same top progress control');
scrub=$('.ww-flash-progress');
scrub.value='34';
scrub.dispatchEvent(new w.Event('input',{bubbles:true}));
scrub.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.ok($('.ww-flash-study-top').textContent.includes('34 / 34'),'Can jump to final card');
assert.equal(w.document.querySelectorAll('.ww-flash-study input[type="range"]').length,1,
 'Still exactly one slider after a long jump');
assert.equal(w.WortWegFlashcards.getSummary().reviewed,reviewedBeforeSeek,
 'Jumping never changes spaced-repetition ratings');
w.WortWegFlashcards.close();
w.WortWegFlashcards.open();
assert.equal($('#ww-flash-start-number').value,'1','Reopening does not auto-resume a previous card');
w.WortWegFlashcards.close();
assert.match(fs.readFileSync('flashcards.css','utf8'),/ww-flash-progress::-webkit-slider-thumb/,'Native slider thumb is styled for touch');
assert.match(fs.readFileSync('flashcards.css','utf8'),/touch-action:pan-x/,'Top slider allows horizontal gestures');
// Supplemental noun entries must remain available across A1-C2.
w.WortWegNounExpansion={entries:['A1','A2','B1','B2','C1','C2'].map((level,i)=>({
 id:'noun-'+level,de:i===0?'der Wochenabend':'das Fachnomen'+level,
 en:i===0?'evening':'specialized '+level,level
}))};
w.WortWegLive={getPack:()=>({lessons:[]})};
w.WortWegFlashcards.open();
set('Source','expansion');
assert.ok($('#ww-flashcards').textContent.includes('6 matching entries'));
set('Level','A1');
$('#ww-flashcards .ww-flash-primary').click();
$('.ww-flash-card').click();
assert.match($('.ww-flash-translation').textContent,/\u100A\u1014\u1031/);
w.WortWegFlashcards.close();
w.WortWegFlashcards.open();
set('Level','C2');
$('#ww-flashcards .ww-flash-primary').click();
$('.ww-flash-card').click();
assert.ok($('.ww-flash-translation').textContent.length>0);
w.WortWegFlashcards.close();
// Regression for the exact B1 screenshot: a cached old noun pack displayed
// 'မြန်မာဘာသာပြန် မရှိသေးပါ' for words that now have native meanings.
w.eval(fs.readFileSync('noun-expansion.js','utf8'));
assert.equal(w.WortWegNounExpansion.version,2,'Published noun pack has the translation-aware version');
w.WortWegFlashcards.open();
set('Source','expansion');
set('Level','B1');
set('Front of card','de');
for(const [de,my] of [
 ['Vorstellungsgespräch','အလုပ်အင်တာဗျူး'],
 ['Bewerbungsgespräch','အလုပ်လျှောက်အင်တာဗျူး']
]){
 const search=$('.ww-flash-search input');
 search.value=de;
 search.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.ok($('#ww-flashcards').textContent.includes('1 matching entries'),
  'Search finds the exact B1 noun '+de);
 $('#ww-flashcards .ww-flash-primary').click();
 $('.ww-flash-card').click();
 assert.equal($('.ww-flash-word').textContent,'job interview');
 assert.equal($('.ww-flash-translation').textContent,my,'Burmese answer missing for '+de);
 assert.ok(!$('.ww-flash-translation').textContent.includes('မရှိသေးပါ'));
 w.WortWegFlashcards.close();
 w.WortWegFlashcards.open();
}
w.WortWegFlashcards.close();
const sw=fs.readFileSync('sw.js','utf8');
const ios=fs.readFileSync('ios-polish.js','utf8');
assert.ok(ios.includes("nouns.src='./noun-expansion.js?v=2'"),'Noun URL bypasses older cache-first PWA versions');
assert.ok(Number(sw.match(/const CACHE='wortweg370-v(\d+)'/)?.[1])>=99,'Offline cache must retain or increase the version after the noun translation fix');
assert.ok(sw.slice(sw.indexOf('const freshUI=')).includes("'noun-expansion.js'"),
 'Noun pack is network-first with offline fallback, just like flashcards');
dom.window.close();
console.log('PASS: all vocabulary cards, CEFR/source filters, flip, audio, persisted per-profile SRS, existing quiz isolation, and offline assets.');
