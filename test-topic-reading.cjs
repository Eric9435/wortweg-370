/* Full 370-topic lesson and reading regression tests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const source=fs.readFileSync('topic-lessons.js','utf8');
new vm.Script(source,{filename:'topic-lessons.js'});
const seedNames=['topic-reading-seeds-1.js','topic-reading-seeds-2.js',
 'topic-reading-seeds-3.js','topic-reading-seeds-4.js'];
for(const name of [...seedNames,'topic-reading-engine.js'])
 new vm.Script(fs.readFileSync(name,'utf8'),{filename:name});
const errors=[];
const dom=new JSDOM(html,{
 url:'https://eric9435.github.io/wortweg-370/',runScripts:'dangerously',
 beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};
  w.addEventListener('error',e=>errors.push(e.message));}
});
const w=dom.window;
let audio='';
w.WortWegAudio={speak:de=>{audio=de;}};
for(const name of [...seedNames,'topic-reading-engine.js'])
 w.eval(fs.readFileSync(name,'utf8'));
w.eval(source);
assert.deepEqual(errors,[],'No initialization errors');
const $=id=>w.document.getElementById(id),api=w.WortWegTopics,reading=w.WortWegReading;
assert.equal(api.getCount(),370);
assert.equal(Object.keys(w.WortWegReadingSeeds).length,369,'Each additional topic has an authored bilingual scene');
const stories=new Set();
let coverage=0;
for(let id=1;id<=370;id++){
 const pack=api.getWords(id),lesson=api.getReading(id);
 assert.ok(pack&&lesson,'Reading and word bank are accessible for '+id);
 assert.ok(lesson.story.length>=6,'Every story has at least six sentences, topic '+id);
 assert.ok(lesson.story.every(r=>r.de&&r.en),'Each story sentence is bilingual, topic '+id);
 assert.ok(lesson.reinforcement.every(r=>r.de&&r.en),'Each vocabulary exercise is bilingual, topic '+id);
 assert.equal(lesson.storyVocabulary+lesson.reinforcement.length,lesson.totalVocabulary,
  'All distinct vocabulary entries accounted for in topic '+id);
 for(const word of pack.all){
  const bare=word.de.replace(/^(der|die|das)\s+/i,'').toLocaleLowerCase('de');
  assert.ok([...lesson.story,...lesson.reinforcement].some(row=>row.de.toLocaleLowerCase('de').includes(bare)),
   'Word present in reading/practice: '+id+' '+word.de);
 }
 if(id>1){
  const seed=w.WortWegReadingSeeds[id];
  assert.ok(seed&&lesson.story.some(r=>r.de===seed[0]&&r.en===seed[1]),'Distinct story scene '+id);
  stories.add(seed[0]);
 }
 coverage+=lesson.totalVocabulary;
}
assert.equal(stories.size,369,'All 369 added scenes are distinct');
const storedBefore=JSON.stringify(w.WortWeg.getProgress());
api.open(1);
$('ww-topic-read').click();
assert.equal($('ww-topic-passage').hidden,false,'Inline reader opens');
assert.ok($('ww-topic-passage').querySelectorAll('.ww-passage-row').length>=40,'Sentences rendered');
assert.ok($('ww-topic-passage').querySelectorAll('strong.ww-passage-vocab').length>20,
 'Vocabulary is bold in Topic 1');
const speak=$('ww-topic-passage').querySelector('button.ww-passage-audio');
speak.click();assert.ok(audio.startsWith('Hallo!'),'Individual German sentence audio');
const en=$('ww-topic-passage').querySelector('.ww-passage-en');
assert.equal(en.hidden,true,'English is hidden initially');
[...$('ww-topic-passage').querySelectorAll('button')].find(b=>b.textContent==='Show English').click();
assert.equal($('ww-topic-passage').querySelector('.ww-passage-en').hidden,false,'Translation toggle displays English');
const button=[...$('ww-topic-passage').querySelectorAll('button')].find(b=>b.textContent==='Mark reading complete');
assert.ok(button);button.click();
assert.equal(reading.completed(1),true,'Reading completion stored');
assert.equal(api.getReadingProgress(),1,'Overall reading progress counts completion');
assert.equal(JSON.stringify(w.WortWeg.getProgress()),storedBefore,
 'Reading completion cannot mutate vocabulary and quiz progress');
reading.setCompleted(1,false);
assert.equal(reading.completed(1),false);
const guestKey=reading.storageKey();
const initialCurriculum=w.localStorage.getItem('wortweg370-curriculum-v1:guest');
w.WortWegAccountSnapshot={uid:'reading-test-alice'};
assert.equal(reading.completed(1),false,'Signed-in user does not inherit guest progress');
reading.setCompleted(1,true);
assert.equal(reading.completed(1),true);
assert.ok(reading.storageKey().endsWith(':reading-test-alice'));
w.WortWegAccountSnapshot={uid:'reading-test-bob'};
assert.equal(reading.completed(1),false,'Different account starts with independent reading history');
reading.setCompleted(1,true);
w.WortWegAccountSnapshot={uid:'reading-test-alice'};
assert.equal(reading.completed(1),true,'Switching back restores only the correct account');
w.WortWegAccountSnapshot=null;
assert.equal(reading.completed(1),false,'Guest history remains separate from signed-in accounts');
assert.equal(reading.storageKey(),guestKey);
assert.equal(w.localStorage.getItem('wortweg370-curriculum-v1:guest'),initialCurriculum,
 'Reading never overwrites curriculum checklist data');
assert.equal(JSON.stringify(w.WortWeg.getProgress()),storedBefore,
 'Reading never overwrites original quiz mastery');
assert.match(fs.readFileSync('mobile/scripts/prepare.mjs','utf8'),/topic-reading-engine\.js/,
 'Android bundles reading data');
for(const name of seedNames){
 assert.ok(fs.readFileSync('sw.js','utf8').includes(name),'Offline cache includes '+name);
 assert.ok(fs.readFileSync('settings.js','utf8').includes(name),'Web loader includes '+name);
}
dom.window.close();
console.log('PASS: 370 bilingual topic readings, 369 unique scenes, vocabulary coverage, 40-line identity lesson, sentence audio, bold words, optional English, separate reading completion, web and offline bundle. '+coverage+' vocabulary slots checked.');
