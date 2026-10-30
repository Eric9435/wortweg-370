'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('articles-quiz.js','utf8');
new vm.Script(source,{filename:'articles-quiz.js'});
const articles=['der','die','das'];
const bank=Array.from({length:205},(_,i)=>({
 id:i+1,de:articles[i%3]+' Nomen'+i,en:'term '+i,mm:'မြန်မာ '+i,level:i<100?'A1':'B1'
}));
bank.push({id:900,de:'gehen',en:'to go',level:'A1'},
 {id:901,de:'schön',en:'beautiful',level:'A1'},
 {id:902,de:'Nomen ohne Artikel',en:'article absent',level:'A1'});
const catalogue={bank,curated:[
 {de:'der Nomen0',en:'term 0',mm:'duplicate'}, // duplicate is not counted
 {de:'das Haus',en:'house',mm:'အိမ်'}
]};
const pack={lessons:[{id:'lesson',level:'A2',words:[
 {id:'cat',de:'die Katze',en:'cat',my:'ကြောင်'},
 {id:'repeat',de:'der Nomen0',en:'term 0'}
]}]};
const html='<!doctype html><html><body class="ww-game-interface">'+
 '<section id="dashboard"><div class="ww-main-menu"><div class="ww-menu-options">'+
 '<button data-nav="review">Review</button></div></div></section>'+
 '<script type="application/json" id="data">'+JSON.stringify(catalogue)+'</script></body></html>';
const dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'});
const w=dom.window;
w.WortWegLive={getPack:()=>pack};
let profile='userA';
Object.defineProperty(w,'WortWegAccountSnapshot',{get:()=>({uid:profile})});
const legacy={answered:17,correct:11};
w.WortWeg={getProgress:()=>legacy};
w.eval(source);
const $=s=>w.document.querySelector(s);
function select(label,value){
 const field=[...w.document.querySelectorAll('.ww-articles-field select')]
  .find(x=>x.getAttribute('aria-label')===label);
 assert.ok(field,'Missing '+label);
 field.value=value;field.dispatchEvent(new w.Event('change'));
}
function click(label){
 const element=[...w.document.querySelectorAll('#ww-articles-quiz button')]
  .find(x=>x.textContent.trim().includes(label));
 assert.ok(element,'Missing '+label);
 element.click();return element;
}
const count=()=>$('.ww-articles-top')?.textContent||'';
const review=()=>w.WortWegArticlesQuiz.getSummary();
assert.equal(w.WortWegArticlesQuiz.getEligibleCount(),207,
 'All 205 article-labelled bank nouns plus two unique extra nouns');
assert.ok($('#ww-articles-launch'),'Original menu has a dedicated article quiz');
$('#ww-articles-launch').click();
assert.equal($('#ww-articles-quiz').hidden,false);
assert.match($('#ww-articles-quiz').textContent,/207/);
assert.ok($('#ww-articles-quiz').textContent.includes('All eligible words'));
select('Source','bank');
assert.equal(review().total,207,'Global catalogue remains available independently of filters');
assert.match($('#ww-articles-quiz').textContent,/205 nouns match/,'Word bank includes all 205 nouns');
select('Level','A1');
assert.match($('#ww-articles-quiz').textContent,/100 nouns match/,'CEFR filter works');
select('Source','all');select('Level','all');select('Question count','all');
click('Start 207');
assert.equal(review().sessionTotal,207,'All mode never truncates to 20, 50 or 100');
assert.match(count(),/1 \/ 207/);
assert.equal($('.ww-articles-word strong').textContent,'Nomen0','Prompt does not reveal the article');
assert.equal($('.ww-articles-choices').children.length,3,'Only der, die and das are available');
assert.deepEqual([...$('.ww-articles-choices').children].map(x=>x.textContent),articles);
assert.equal($('#ww-articles-quiz').querySelectorAll('.ww-articles-word').length,1,
 'No thousands of question elements mounted on mobile');
const choices=[...$('.ww-articles-choices').children];
choices[2].click();
assert.equal(review().answered,1,'Progress advances after answering');
assert.equal(review().attempted,1,'First answer is recorded separately');
assert.equal(review().mistakes,1,'Wrong article is tracked');
assert.ok($('.ww-articles-feedback').textContent.includes('der Nomen0'),'Correct noun article shown');
assert.ok(choices.every(x=>x.disabled),'Cannot answer same word twice');
assert.ok($('.ww-articles-next')&&!$('.ww-articles-next').hidden,'Next control appears');
assert.equal(legacy.answered,17,'Existing quiz data untouched');
const saved=w.localStorage.getItem('wortweg370-articles-quiz-v1-userA');
assert.ok(saved,'Per-profile checkpoint saved');
assert.equal(JSON.parse(saved).session.keys.length,207);
w.WortWegArticlesQuiz.close();
w.WortWegArticlesQuiz.open();
click('Continue 1 / 207');
assert.match(count(),/2 \/ 207/,'Resume starts from next unanswered noun');
assert.equal($('.ww-articles-word strong').textContent,'Nomen1');
click('die');
assert.equal(review().answered,2);
assert.equal(review().mistakes,1);
click('← Setup');
click('Review 1 mistakes');
assert.match(count(),/1 \/ 1/,'Mistake-only review has one question');
assert.equal($('.ww-articles-word strong').textContent,'Nomen0');
click('der');
assert.equal(review().mistakes,0,'Correct re-review clears current error');
click('View results');
assert.ok($('#ww-articles-quiz').textContent.includes('Session results'));
click('New quiz');
assert.ok(!$('#ww-articles-quiz').textContent.includes('Review 1 mistakes'));
w.WortWegArticlesQuiz.close();
profile='userB';w.dispatchEvent(new w.Event('wortweg:account'));
assert.equal(review().attempted,0,'New profile starts with clean article quiz history');
assert.equal(review().mistakes,0);
profile='userA';w.dispatchEvent(new w.Event('wortweg:account'));
assert.equal(review().attempted,2,'Original profile progress restored');
assert.equal(review().mistakes,0);
for(const path of ['articles-quiz.js','articles-quiz.css']){
 assert.ok(fs.readFileSync('sw.js','utf8').includes(path),'PWA offline cache includes '+path);
 assert.ok(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes(path),'Native app includes '+path);
}
assert.match(fs.readFileSync('ios-polish.js','utf8'),/articles-quiz\.js/,'Bootstrap loads article quiz');
assert.match(fs.readFileSync('home-refresh.js','utf8'),/WortWegArticlesQuiz/,'Home includes article shortcut');
assert.match(fs.readFileSync('sw.js','utf8'),/const CACHE='wortweg370-v75'/,'New cache version');
assert.ok(fs.readFileSync('articles-quiz.css','utf8').includes('ww-articles-word'),'Stylesheet exists');
dom.window.close();
console.log('PASS: all noun articles, no article leakage, filters, full-bank coverage, scoring, mistakes, recovery, quiz isolation, per-profile resume, mobile UI and offline assets.');
