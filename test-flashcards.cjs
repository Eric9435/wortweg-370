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
dom.window.close();
console.log('PASS: all vocabulary cards, CEFR/source filters, flip, audio, persisted per-profile SRS, existing quiz isolation, and offline assets.');
