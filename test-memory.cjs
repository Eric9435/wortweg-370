const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const KEY='wortweg370-progress-v1', QUIZ='wortweg370-active-quiz-v1', BACKUP=KEY+'-backup';
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
function progress(dom){return JSON.parse(dom.window.localStorage.getItem(KEY))}
function session(dom){return JSON.parse(dom.window.localStorage.getItem(QUIZ))}
function click(dom,id){dom.window.document.getElementById(id).click()}
const first=launch();
assert.equal(first.window.document.querySelector('.section.active').id,'home','Home is its own screen');
first.window.document.querySelector('#home [data-nav="study"]').click();
assert.equal(first.window.document.querySelector('.section.active').id,'study','Practice opens as a separate screen');
first.window.document.querySelector('#study [data-nav="home"]').click();
assert.equal(first.window.document.querySelector('.section.active').id,'home','Back returns to Home');

assert.equal(progress(first).answered,10,'Initial saved progress must load');
click(first,'startQuiz');
assert.equal(session(first).i,0,'First question position must save');
assert.equal(first.window.document.querySelector('.section.active').id,'quiz','Quiz uses a dedicated screen');
first.window.document.querySelector('#answerButtons .choice').click();
click(first,'submitAnswer');
assert.equal(progress(first).answered,11,'Answer must save immediately');
assert.equal(session(first).locked,true,'Checked answer must be marked');
assert.equal(first.window.localStorage.getItem(KEY),first.window.localStorage.getItem(BACKUP),'Backup must mirror saved progress');
const stored={[KEY]:first.window.localStorage.getItem(KEY),[BACKUP]:first.window.localStorage.getItem(BACKUP),[QUIZ]:first.window.localStorage.getItem(QUIZ)};
first.window.close();
const second=launch(stored);
assert.equal(progress(second).answered,11,'Answered count must survive restart');
assert.equal(second.window.document.getElementById('quizCounter').textContent,'2 / 10','Unfinished quiz resumes at next question');
assert.equal(second.window.document.querySelector('.section.active').id,'quiz','Restored quiz returns to quiz screen');
click(second,'submitAnswer');
assert.equal(progress(second).answered,11,'Unselected answer cannot be submitted');
second.window.document.querySelector('#answerButtons .choice').click();
click(second,'submitAnswer');
assert.equal(progress(second).answered,12,'Second answer is counted once');
click(second,'submitAnswer');
assert.equal(second.window.document.getElementById('quizCounter').textContent,'3 / 10');
const stored2={[KEY]:second.window.localStorage.getItem(KEY),[QUIZ]:second.window.localStorage.getItem(QUIZ)};
second.window.close();
const third=launch(stored2);
assert.equal(progress(third).answered,12,'Progress remains saved after second restart');
assert.equal(third.window.document.getElementById('quizCounter').textContent,'3 / 10','Quiz position remains saved');
assert.match(third.window.document.getElementById('saveStatus').textContent,/saved/i);
third.window.close();
const recovered=launch({[KEY]:'{invalid json',[BACKUP]:stored[BACKUP]});
assert.equal(progress(recovered).answered,11,'Backup recovers a corrupted primary save');
assert.equal(recovered.window.localStorage.getItem(KEY),recovered.window.localStorage.getItem(BACKUP),'Recovery repairs primary save');
recovered.window.close();
console.log('PASS: answers auto-save, quiz resumes after restart, no duplicate counting, backup recovers corruption');
