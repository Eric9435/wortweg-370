/* Browser behavior regression: Lifetime Sentence Builder interactive A1–C2. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const read=x=>fs.readFileSync(x,'utf8');
const dom=new JSDOM(read('sentence-builder.html'),{url:'https://localhost/sentence-builder.html',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.matchMedia=()=>({matches:false});
w.scrollTo=()=>{};
w.localStorage.setItem('wortweg370:sentence-builder:progress:v1',JSON.stringify({completed:{'present-simple':[0]},last:null}));
for(const source of ['sentence-builder-data.js','sentence-builder-lifetime-1.js','sentence-builder-lifetime-2.js','sentence-builder.js'])w.eval(read(source));
const click=x=>x.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
const query=selector=>d.querySelector(selector);
assert.equal(query('#courseFilters').children.length,8,'All/Tenses/A1–C2 filters');
assert.equal(query('#lessonGrid').children.length,36,'36 topics on initial Home screen');
assert.equal(query('#totalSolved').textContent,'1','Previous tense mastery must survive expansion');
assert.match(query('#totalAvailable').textContent,/360/,'360 total exercises displayed');
function filter(level,count){
 const target=[...query('#courseFilters').children].find(x=>x.textContent.startsWith(level+' ·'));
 assert(target,'Filter missing: '+level);click(target);
 assert.equal(query('#lessonGrid').children.length,count,'Wrong number of '+level+' topics');
}
for(const level of ['A1','A2','B1','B2','C1','C2'])filter(level,4);
filter('Tenses',12);
filter('All',36);
filter('B2',4);
click(query('#lessonGrid').children[0]);
assert.equal(query('#topicView').hidden,true,'Course chooser must hide during practice');
assert.equal(query('#practiceView').hidden,false,'Practice screen should open');
const words=[...query('#wordBank').querySelectorAll('.word-tile')];
assert(words.length>3,'Word cards must be available');
const n=words.length;
for(let i=0;i<n;i++){
 const token=[...query('#wordBank').querySelectorAll('.word-tile')].find(b=>b.dataset.wordIndex===String(i));
 assert(token,'Correct word card missing at index '+i);
 click(token);
}
assert.equal(query('#answerZone').querySelectorAll('.word-tile').length,n,'All tap-selected words must move into answer area');
assert.equal(query('#checkButton').disabled,false,'Sentence must become checkable when all cards placed');
click(query('#checkButton'));
assert.match(query('#feedback').textContent,/Correct! Exercise mastered/,'Correct sentence should be accepted');
const saved=JSON.parse(w.localStorage.getItem('wortweg370:sentence-builder:progress:v1'));
assert.deepEqual(saved.completed['present-simple'],[0],'Original tense progress must remain intact');
assert.equal(saved.completed['grammar-passive-voice'].length,1,'B2 mastery must be saved');
assert.equal(query('#lessonScore').textContent,'1 / 10 mastered');
click(query('#allTopics'));
assert.equal(query('#lessonGrid').children.length,4,'Returning should retain the B2 filter');
console.log('PASS: 36-topic filtering, complete touch-card exercise, progress persistence and old mastery protection');
