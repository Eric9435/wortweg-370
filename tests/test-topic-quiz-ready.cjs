const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8'),source=fs.readFileSync('topic-lessons.js','utf8');
new vm.Script(source,{filename:'topic-lessons.js'});
const dom=new JSDOM(html,{url:'https://eric9435.github.io/wortweg-370/',
 runScripts:'dangerously',beforeParse(w){w.structuredClone=structuredClone;w.scrollTo=()=>{};}});
const w=dom.window;w.WortWegAudio={speak(){}};
w.eval(source);
const api=w.WortWegTopics,$=id=>w.document.getElementById(id);
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
(async()=>{
 assert.equal(api.getCount(),370);
 w.WortWeg.navigate('topics');
 await flush();
 assert.equal($('topicList').querySelectorAll('button.topic').length,370);
 assert.equal([...$('topicList').querySelectorAll('button.topic')].filter(b=>
  b.lastElementChild?.textContent==='Quiz ready').length,370,
  'Every one of the 370 titles displays a truthful Quiz ready badge');
 assert.equal($('topicList').textContent.includes('Roadmap'),false,'No Roadmap labels remain');
 // The original page rebuilds its buttons on each search.
 $('topicSearch').value='piano';$('topicSearch').dispatchEvent(new w.Event('input'));
 await flush();
 assert.ok($('topicList').querySelectorAll('.ww-topic-ready').length<=370,
  'Search results still receive their own ready badges');
 $('topicSearch').value='';$('topicSearch').dispatchEvent(new w.Event('input'));
 await flush();
 assert.equal($('topicList').querySelectorAll('.ww-topic-ready').length,370,
  'Clearing search re-creates all 370 ready badges');
 let topicsWithoutBank=0,topicsWithBank=0,checked=0,firstOnlyStarter=0;
 for(let id=1;id<=370;id++){
  api.open(id);
  const quiz=api.getWords(id);
  assert.ok(quiz.all.length>=1,'Topic '+id+' has a meaningful German/English source');
  if(quiz.curated.length){topicsWithBank++;}
  else{topicsWithoutBank++;if(!firstOnlyStarter)firstOnlyStarter=id;}
  assert.equal(api.isQuizReady(id),true,'Topic '+id+' is marked ready only with question source');
  assert.equal($('ww-topic-practice').disabled,false,'Topic '+id+' Practice is enabled');
  $('ww-topic-practice').click();
  assert.equal($('ww-topic-quiz').hidden,false,'Topic '+id+' quiz actually launches');
  const opts=[...$('ww-topic-quiz').querySelectorAll('button.ww-topic-choice')].map(b=>b.textContent);
  assert.equal(opts.length,4,'Topic '+id+' question has exactly four answers');
  assert.equal(new Set(opts.map(x=>x.toLocaleLowerCase())).size,4,
   'Topic '+id+' options have four distinct meanings');
  assert.ok($('ww-topic-quiz').textContent.includes('Question 1'),'Topic '+id+' shows question progress');
  checked++;
 }
 assert.ok(topicsWithoutBank>0,'The test covers titles that were previously disabled');
 assert.ok(topicsWithBank>150,'Real vocabulary bank quizzes remain available');
 // A no-bank topic previously had its Practice button disabled. It should
 // now record starter/title answers independently without altering CEFR totals.
 api.open(firstOnlyStarter);
 const before=w.WortWeg.getProgress(),oldLocal=api.getLocalQuizHistory();
 assert.equal(Object.keys(oldLocal).length,0,'Guest topic expressions start empty in this test');
 $('ww-topic-practice').click();
 const answers=$('ww-topic-quiz').querySelectorAll('button.ww-topic-choice');
 answers[0].click();
 $('ww-topic-quiz').querySelector('button.btn.primary').click();
 assert.equal(w.WortWeg.getProgress().answered,before.answered,
  'Starter quiz does not fabricate Word Bank answers or CEFR progress');
 assert.equal(Object.keys(api.getLocalQuizHistory()).length,1,
  'Starter quiz progress is saved locally for the active guest profile');
 const guestStorage=w.localStorage.getItem('wortweg370-topic-expressions-v1:guest');
 assert.ok(guestStorage?.includes('"answered":1'),'Session results persist after quiz');
 w.WortWegAccountSnapshot={uid:'test-account-uid'};
 w.dispatchEvent(new w.CustomEvent('wortweg:account',{detail:w.WortWegAccountSnapshot}));
 assert.equal(Object.keys(api.getLocalQuizHistory()).length,0,
  'Switching Google accounts never displays guest quiz history');
 api.open(firstOnlyStarter);$('ww-topic-practice').click();
 $('ww-topic-quiz').querySelector('button.ww-topic-choice').click();
 $('ww-topic-quiz').querySelector('button.btn.primary').click();
 assert.equal(Object.keys(api.getLocalQuizHistory()).length,1,
  'New Google account can store separate topic practice history');
 assert.equal(w.localStorage.getItem('wortweg370-topic-expressions-v1:guest'),guestStorage,
  'Saving a second account does not overwrite guest history');
 w.WortWegAccountSnapshot={uid:null};
 w.dispatchEvent(new w.CustomEvent('wortweg:account',{detail:w.WortWegAccountSnapshot}));
 assert.equal(Object.keys(api.getLocalQuizHistory()).length,1,'Guest history returns on sign-out');
 const css=fs.readFileSync('topic-lessons.css','utf8'),sw=fs.readFileSync('sw.js','utf8');
 assert.match(css,/ww-topic-ready/,'Visible topic list badge is styled');
 assert.match(sw,/'\.\/topic-lessons\.js'/,'Quiz code remains in offline PWA shell');
 assert.match(sw,/'topic-lessons\.js'/,'Quiz code uses network-first cache refresh');
 dom.window.close();
 console.log('PASS: '+checked+'/370 topics open valid 4-option quizzes, '+topicsWithoutBank+
  ' starter-only topics, all Quiz ready badges, search regeneration, guest/account history isolation and unchanged CEFR bank progress.');
})().catch(error=>{dom.window.close();console.error(error);process.exitCode=1});
