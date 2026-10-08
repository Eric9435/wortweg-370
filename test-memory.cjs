const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const KEY='wortweg370-progress-v3';
function launch(stored={}){
 const errors=[];
 const dom=new JSDOM(html,{
  url:'https://eric9435.github.io/wortweg-370/',runScripts:'dangerously',
  beforeParse(w){
   w.scrollTo=()=>{};w.structuredClone=structuredClone;
   for(const [k,v] of Object.entries(stored))w.localStorage.setItem(k,v);
   w.addEventListener('error',e=>errors.push(e.message));
  }
 });
 assert.deepEqual(errors,[],'App initializes without errors');return dom;
}
function progress(dom){return dom.window.WortWeg.getProgress()}
function stored(dom){return Object.fromEntries(Array.from({length:dom.window.localStorage.length},(_,i)=>{
 const key=dom.window.localStorage.key(i);return [key,dom.window.localStorage.getItem(key)];
}))}
function click(dom,id){dom.window.document.getElementById(id).click()}
const first=launch();
assert.equal(first.window.document.querySelector('.section.active').id,'dashboard');
first.window.document.querySelector('#dashboard [data-nav="study"]').click();
assert.equal(first.window.document.querySelector('.section.active').id,'study');
assert.equal(progress(first).answered,0,'A new guest begins with no answers');
click(first,'startQuiz');
first.window.document.querySelector('#answerButtons .choice').click();click(first,'submitAnswer');
assert.equal(progress(first).answered,1,'Answers save immediately');
assert.equal(JSON.parse(first.window.localStorage.getItem(KEY+':guest')).answered,1);
click(first,'submitAnswer');
assert.equal(progress(first).answered,1,'Moving to the next question does not count an answer twice');
click(first,'submitAnswer');
assert.equal(progress(first).answered,1,'An unselected answer cannot be submitted');
first.window.document.querySelector('#answerButtons .choice').click();click(first,'submitAnswer');
assert.equal(progress(first).answered,2);
const saved=stored(first);first.window.close();
const second=launch(saved);
assert.equal(progress(second).answered,2,'Guest progress survives restarting the app');
second.window.WortWeg.switchProfile('test-user-a');
assert.equal(progress(second).answered,0,'A signed-in account has separate progress');
second.window.WortWeg.setProgress({answered:7,correct:6,items:{},seen:{},history:[]});
second.window.WortWeg.switchProfile('test-user-b');
assert.equal(progress(second).answered,0,'Another account cannot inherit previous account progress');
second.window.WortWeg.setProgress({answered:3,correct:2,items:{},seen:{},history:[]});
second.window.WortWeg.switchProfile('test-user-a');assert.equal(progress(second).answered,7);
second.window.WortWeg.switchProfile('guest');assert.equal(progress(second).answered,2);
const accounts=stored(second);second.window.close();
const third=launch(accounts);
third.window.WortWeg.switchProfile('test-user-a');assert.equal(progress(third).answered,7);
third.window.WortWeg.switchProfile('test-user-b');assert.equal(progress(third).answered,3);
third.window.WortWeg.setProgress({answered:'invalid'});
assert.equal(progress(third).answered,3,'Invalid imported progress cannot replace saved answers');
third.window.close();
// Regression: synced or restored history is untrusted display data.
const safety=launch();
const markup='<img src=x onerror="window.__unsafe_history=1">';
safety.window.WortWeg.setProgress({
 answered:1,correct:0,items:{
  'b:1':{de:'Test',en:'Test',mm:'',wrong:1,streak:markup,due:markup}
 },seen:{},history:[{date:'2026-10-08',label:'Test',correct:markup,total:1}]
});
assert.equal(safety.window.document.querySelector('#reviewList img'),null,'Review does not interpret stored HTML');
assert.equal(safety.window.document.querySelector('#summary img'),null,'Session history does not interpret stored HTML');
assert.ok(safety.window.document.querySelector('#reviewList').textContent.includes('<img'),'Review keeps text visible');
assert.ok(safety.window.document.querySelector('#summary').textContent.includes('<img'),'History keeps text visible');
safety.window.close();
console.log('PASS: stored progress text is escaped in review and history views');
console.log('PASS: answers auto-save, progress survives restart, account progress stays separate, and no duplicate counting');
