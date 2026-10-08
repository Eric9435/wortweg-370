const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const KEY='wortweg370-progress-v1', BACKUP='wortweg370-progress-backup-v1';
function launch(stored={}){
 const errors=[];
 const dom=new JSDOM(html,{
  url:'https://eric9435.github.io/wortweg-370/',
  runScripts:'dangerously',
  beforeParse(w){
   w.scrollTo=()=>{};
   for(const [k,v] of Object.entries(stored))w.localStorage.setItem(k,v);
   w.addEventListener('error',e=>errors.push(e.message));
  }
 });
 assert.deepEqual(errors,[],'App must initialize without script errors');
 return dom;
}
function get(dom){return JSON.parse(dom.window.localStorage.getItem(KEY))}
function click(dom,id){dom.window.document.getElementById(id).click()}
let first=launch();
assert.equal(get(first).answered,10,'Seed data must initialize');
click(first,'startQuiz');
let s=get(first);
assert.equal(s.session.i,0);
assert.equal(s.session.opts.length,4,'First question choices saved');
first.window.document.querySelector('#answerButtons .choice').click();
click(first,'submitAnswer');
s=get(first);
assert.equal(s.answered,11,'Answer must save immediately');
assert.equal(s.session.locked,true,'Answered question must be resumable');
assert.equal(first.window.localStorage.getItem(BACKUP),first.window.localStorage.getItem(KEY),'Recovery copy must match');
const snapshot=first.window.localStorage.getItem(KEY);
first.window.close();
let second=launch({[KEY]:snapshot,[BACKUP]:snapshot});
assert.equal(get(second).answered,11,'Answered count must survive app restart');
assert.equal(second.window.document.getElementById('submitAnswer').textContent.includes('question'),true,'Restored answer must show Next question');
click(second,'submitAnswer');
assert.equal(get(second).session.i,1,'Next question index must persist');
const current=get(second);
assert.equal(current.answered,11,'Resume must not count the answer twice');
second.window.close();
let third=launch({[KEY]:'{corrupt',[BACKUP]:JSON.stringify(current)});
assert.equal(get(third).answered,11,'Valid backup must recover corrupt primary');
assert.equal(get(third).session.i,1,'Recovery must retain quiz position');
assert.match(third.window.document.getElementById('saveStatus').textContent,/Saved/);
third.window.close();
console.log('PASS: app starts, answers auto-save, session resumes without double counting, backup recovers corruption');
