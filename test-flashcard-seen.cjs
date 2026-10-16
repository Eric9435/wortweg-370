const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const bank=[
 {id:1,de:'der Abend',en:'evening',mm:'ညနေ',level:'A1'},
 {id:2,de:'die Adresse',en:'address',mm:'လိပ်စာ',level:'A1'},
 {id:3,de:'arbeiten',en:'work',mm:'အလုပ်လုပ်',level:'A2'}
];
const curated=[{de:'der Name',en:'name',mm:'နာမည်'}];
const live={lessons:[{id:'greetings',level:'A1',words:[
 {id:'hello',de:'Hallo',en:'Hello',my:'မင်္ဂလာပါ'},
 {id:'thanks',de:'Danke',en:'Thanks',my:'ကျေးဇူး'}]}]};
const html='<!doctype html><html><head></head><body class="ww-game-interface"><main>'+
 '<section id="dashboard" class="section active"><div class="ww-main-menu"><div class="ww-menu-options">'+
 '<button data-nav="study">Learn</button><button data-nav="review">Review</button>'+
 '</div></div></section><section id="seen" class="section"></section></main>'+
 '<script id="data" type="application/json">'+JSON.stringify({bank,curated})+'</script></body></html>';
const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only'});
const w=dom.window;w.scrollTo=()=>{};w.structuredClone=structuredClone;
let uid='accountA';
Object.defineProperty(w,'WortWegAccountSnapshot',{get:()=>({uid})});
let progress={seen:{},items:{}};
w.WortWeg={getProgress:()=>structuredClone(progress),navigate:()=>{}};
w.WortWegLive={getPack:()=>live,getProgress:()=>({})};
w.WortWegAudio={speak:()=>{}};
w.eval(fs.readFileSync('seen-words.js','utf8'));
w.eval(fs.readFileSync('flashcards.js','utf8'));
const $=s=>w.document.querySelector(s);
const summary=()=>w.WortWegSeenWords.getSummary();
const stored=()=>JSON.parse(w.localStorage.getItem('wortweg370-flashcards-v1-'+uid)||'{}');
const practiceFilter=v=>{const select=$('#ww-seen-practice');select.value=v;select.dispatchEvent(new w.Event('change'));};
function openAndStart(){
 w.WortWegFlashcards.open();
 const start=$('#ww-flashcards .ww-flash-primary');
 assert.ok(start,'Flashcard setup is present');
 start.click();
}
function rate(known){
 const flip=$('.ww-flash-card');assert.ok(flip,'Flashcard displayed');
 flip.click();
 $(known?'.ww-flash-know':'.ww-flash-again').click();
}
function reset(){w.WortWegFlashcards.close();}
assert.equal(summary().total,6,'All existing catalogue entries are included');
assert.equal(summary().seen,0,'No rated flashcards initially');
let notified=0;w.addEventListener('wortweg:flashcards-changed',()=>notified++);
openAndStart();
assert.equal(summary().seen,0,'Displaying a card does not inflate Seen Words');
$('.ww-flash-card').click();
assert.equal(summary().seen,0,'Revealing an answer without rating does not mark it seen');
$('.ww-flash-again').click();
assert.equal(notified,1,'Rating fires a live refresh event');
assert.equal(summary().seen,1,'Rating a flashcard adds word to Seen Words');
assert.equal(summary().learned,0,'Again is seen but not learned');
assert.equal(summary().needsReview,1,'Again creates a review-needed entry');
assert.equal(summary().flashcardSeen,1,'Flashcard-specific count is correct');
assert.equal(summary().totals.get('A1').seen,1,'Flashcard updates CEFR level totals');
assert.equal($('#ww-seen-rows').children.length,1,'Seen words table redraws immediately');
assert.ok($('#ww-seen-rows').textContent.includes('Flashcards'),'History displays the review method');
assert.ok($('#ww-seen-rows tr').classList.contains('ww-seen-missed'),'Again displays a red missed row');
practiceFilter('flashcards');
assert.equal($('#ww-seen-rows').children.length,1,'Flashcards method filter includes reviewed cards');
practiceFilter('quiz');
assert.equal($('#ww-seen-rows').children.length,0,'Quiz-only filter excludes flashcard-only history');
practiceFilter('all');
// A repeated rating must not increment the number of unique seen entries.
reset();openAndStart();rate(true);
assert.equal(summary().seen,1,'Repeated reviews do not double-count an entry');
assert.equal(summary().learned,1,'Successful re-review marks the entry learned');
assert.equal(summary().needsReview,0,'Recovered flashcard mistakes no longer need review');
assert.equal(summary().rows[0].status.wrong,1,'Historic missed flashcard remains visible');
assert.ok($('#ww-seen-rows').textContent.includes('Answered correctly later'),'Recovered mistake receives label');
assert.equal(stored()['b:1'].missed,1,'Flashcard history persists separately');
// A quiz answer on the same word must merge, not create a second row.
progress.seen['b:1']=true;
progress.items['b:1']={wrong:2,streak:0,last:'2020-01-01T00:00:00Z'};
w.dispatchEvent(new w.Event('wortweg:changed'));
assert.equal(summary().seen,1,'Flashcard and quiz same word count once');
assert.equal(summary().rows[0].status.wrong,3,'Quiz and flashcard mistakes are combined');
assert.equal(summary().rows[0].status.practice,'Quiz + Flashcards','Both study methods display correctly');
assert.equal(summary().learned,1,'Recent successful card outranks an old incorrect quiz');
practiceFilter('quiz');
assert.equal($('#ww-seen-rows').children.length,1,'Quiz filter includes entries studied via both');
practiceFilter('all');
// When a newer quiz is wrong, it should take precedence in current mastery.
progress.items['b:1'].last=new Date(Date.now()+86400000).toISOString();
w.dispatchEvent(new w.Event('wortweg:changed'));
assert.equal(summary().learned,0,'More recent incorrect quiz takes precedence in combined history');
assert.equal(stored()['b:1'].missed,1,'Viewing merged history leaves stored flashcards unchanged');
// Live lesson ratings must count, without changing legacy quiz or live progress.
reset();w.WortWegFlashcards.open();
const sourceSelect=[...w.document.querySelectorAll('.ww-flash-field select')]
 .find(x=>x.getAttribute('aria-label')==='Source');
sourceSelect.value='live';sourceSelect.dispatchEvent(new w.Event('change'));
$('#ww-flashcards .ww-flash-primary').click();
rate(true);
assert.equal(summary().seen,2,'A rated New Lessons card is counted');
assert.equal(summary().liveTotal,2,'Live lesson catalogue total is preserved');
assert.equal(summary().rows.find(r=>r.key==='l:hello').status.known,true,'Live rated card can be learned');
assert.deepEqual(progress.seen,{'b:1':true},'Flashcards do not write legacy quiz history');
reset();
// Verify account separation, including saved card history after switching back.
uid='accountB';w.dispatchEvent(new w.Event('wortweg:account'));
setTimeout(()=>{
 try{
  assert.equal(summary().flashcardSeen,0,'Other profile has no flashcard history');
  assert.equal(w.WortWegFlashcards.getSummary().reviewed,0,'Card deck resets on account switch');
  uid='accountA';w.dispatchEvent(new w.Event('wortweg:account'));
  setTimeout(()=>{
   try{
    assert.equal(summary().flashcardSeen,2,'Original profile restores flashcard history');
    assert.equal(summary().seen,2,'Restored history is counted without a new rating');
    const sw=fs.readFileSync('sw.js','utf8');
    assert.ok(sw.includes('seen-words.js')&&sw.includes('flashcards.js'),'Both modules cached for offline use');
    dom.window.close();
    console.log('PASS: rated flashcards in Seen Words, CEFR totals, mistakes, combined quiz status, live lessons, filters, notifications, persistence and account isolation.');
   }catch(error){console.error(error);process.exitCode=1;dom.window.close();}
  },10);
 }catch(error){console.error(error);process.exitCode=1;dom.window.close();}
},10);
