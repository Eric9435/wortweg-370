'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const bank=[
 {id:1,de:'der Abend',en:'evening',level:'A1'},
 {id:2,de:'die Adresse',en:'address',level:'A1'},
 {id:3,de:'arbeiten',en:'work',level:'A2'},
 {id:4,de:'lernen',en:'study',level:'B1'}
];
const html='<!doctype html><html><body class="ww-game-interface"><main>'+
 '<section class="section active" id="dashboard"><div class="ww-main-menu">'+
 '<div class="ww-menu-top">Home</div><div class="ww-menu-options"><button data-nav="review">Review</button></div>'+
 '</div></section><section class="section" id="seen"></section></main>'+
 '<script type="application/json" id="data">'+JSON.stringify({bank,curated:[{de:'der Name',en:'name'}]})+'</script>'+
 '</body></html>';
const dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'});
const w=dom.window;w.scrollTo=()=>{};
let profile='guest';
Object.defineProperty(w,'WortWegAccountSnapshot',{get:()=>({uid:profile})});
w.WortWeg={getProgress:()=>({seen:{},items:{}}),navigate:()=>{}};
w.WortWegGrammar={getSummary:()=>({total:200,mastered:10})};
const seenScript=fs.readFileSync('seen-words.js','utf8');
new vm.Script(seenScript,{filename:'seen-words.js'});
w.eval(seenScript);
const home=()=>w.document.getElementById('ww-seen-home');
let s=w.WortWegSeenWords.getSummary();
assert.equal(s.total,5,'Before expansion loads, original 4 bank + 1 Topic 1 remain readable');
assert.equal(s.bankTotal,4);
assert.equal(s.expansionTotal,0);
w.WortWegNounExpansion={entries:[
 {id:'noun:der|abend',de:'der Abend',en:'evening',level:'A1'}, // bank overlap
 {id:'noun:der|name',de:'der Name',en:'name',level:'A1'}, // curated overlap
 {id:'noun:der|baum',de:'der Baum',en:'tree',level:'A1'},
 {id:'noun:das|wachstum',de:'das Wachstum',en:'growth',level:'C1'},
 {id:'noun:die|zahl',de:'die Zahl',en:'number',level:'B2'},
 {id:'noun:das|ziel',de:'das Ziel',en:'goal',level:'C1'}
]};
w.dispatchEvent(new w.Event('wortweg:noun-expansion-ready'));
s=w.WortWegSeenWords.getSummary();
assert.equal(s.total,9,'Home total includes four newly unique nouns only');
assert.equal(s.bankTotal,4,'Original Bank count is preserved');
assert.equal(s.curatedTotal,1);
assert.equal(s.expansionTotal,4);
assert.deepEqual(JSON.parse(JSON.stringify(s.totals.get('A1'))),{total:3,seen:0});
assert.deepEqual(JSON.parse(JSON.stringify(s.totals.get('C1'))),{total:2,seen:0});
assert.ok(home().textContent.includes('4 Word Bank + 4 added nouns (duplicates excluded)'),
 'Legend separates original source and deduplicated noun additions');
assert.ok(home().textContent.includes('0 of 9 study entries encountered'),'Home displays the new total without falsely crediting unstudied words');
assert.ok(home().textContent.includes('CEFR vocabulary total'));
assert.ok(home().textContent.includes('0 learned'));
assert.equal(home().querySelectorAll('.ww-donut-svg path').length,5,
 'CEFR rings include added A1, B2 and C1 noun counts');

// Simulate a noun article quiz saved in its independent profile storage.
const key='wortweg370-articles-quiz-v1-guest';
const state={records:{
 'n:noun:der|baum':{attempts:1,missed:0,lastCorrect:true,lastAnswered:'2026-10-25T10:00:00Z'},
 'b:1':{attempts:1,missed:1,lastCorrect:false,lastAnswered:'2026-10-25T10:00:00Z'}
}};
w.localStorage.setItem(key,JSON.stringify(state));
w.dispatchEvent(new w.CustomEvent('wortweg:articles-changed',{detail:{key:'n:noun:der|baum',correct:true}}));
s=w.WortWegSeenWords.getSummary();
assert.equal(s.seen,2,'Article answers count as explored, including wrong answers');
assert.equal(s.learned,1,'Correct articles count as learned');
assert.equal(s.needsReview,1,'Missed articles appear as review needed');
assert.equal(s.totals.get('A1').seen,2);
assert.ok(home().textContent.includes('1 learned'));
assert.ok(home().textContent.includes('1 need review'));
assert.ok(s.rows.find(x=>x.key==='n:noun:der|baum').status.practice.includes('Der/Die/Das Quiz'));
assert.equal(s.rows.filter(x=>x.key==='n:noun:der|baum').length,1,'Not counted twice');

// Preserve independent flashcard activity and resolve current mastery by latest action.
w.localStorage.setItem('wortweg370-flashcards-v1-guest',JSON.stringify({
 'n:noun:der|baum':{reps:1,missed:1,lastKnown:false,lastReviewed:'2026-10-26T10:00:00Z'},
 'n:noun:das|wachstum':{reps:1,missed:0,lastKnown:true,intervalDays:4,lastReviewed:'2026-10-26T10:00:00Z'}
}));
w.dispatchEvent(new w.Event('wortweg:flashcards-changed'));
s=w.WortWegSeenWords.getSummary();
assert.equal(s.seen,3,'Flashcards and article answers overlap on the same entry');
assert.equal(s.learned,1,'A newer failed flashcard review supersedes an old correct article');
assert.equal(s.needsReview,2);
const flashRow=s.rows.find(x=>x.key==='n:noun:der|baum');
assert.ok(flashRow.status.flashcard&&flashRow.status.articleQuiz);
assert.ok(flashRow.status.practice.includes('Flashcards'));
assert.ok(flashRow.status.practice.includes('Der/Die/Das Quiz'));
state.records['n:noun:der|baum']={
 attempts:2,missed:0,lastCorrect:true,lastAnswered:'2026-10-27T10:00:00Z'
};
w.localStorage.setItem(key,JSON.stringify(state));
w.dispatchEvent(new w.Event('wortweg:articles-changed'));
assert.equal(w.WortWegSeenWords.getSummary().learned,2,
 'Correct newer article answer restores mastery without modifying underlying flashcard records');

// Progress on another profile never leaks between accounts.
profile='otherAccount';
w.dispatchEvent(new w.Event('wortweg:account'));
s=w.WortWegSeenWords.getSummary();
assert.equal(s.total,9);
assert.equal(s.seen,0);
assert.equal(s.learned,0);
assert.equal(s.needsReview,0);
assert.equal(w.localStorage.getItem(key),JSON.stringify(state),'Older profile records are intact');
assert.match(fs.readFileSync('noun-expansion.js','utf8'),/wortweg:noun-expansion-ready/);
assert.match(fs.readFileSync('articles-quiz.js','utf8'),/wortweg:articles-changed/);
assert.match(fs.readFileSync('sw.js','utf8'),/wortweg370-v86/);
dom.window.close();
console.log('PASS: Home CEFR totals, noun deduplication, article answers, flashcards, recent mastery and account separation.');
