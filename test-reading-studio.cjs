/* Regression checks: trilingual long reader, modal integration, audio-only German. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const read=name=>fs.readFileSync(name,'utf8');
const files=['reading-studio-topics-01-12.js','reading-studio-topics-13-24.js','reading-studio.js'];
for(const name of files)new Function(read(name));
const loaded={WortWegLongReadings:{}};
new Function('window',read(files[0]))(loaded);
new Function('window',read(files[1]))(loaded);
const chapters=loaded.WortWegLongReadings;
assert.equal(Object.keys(chapters).length,24);
let total=0;
for(let id=1;id<=24;id++){
 const x=chapters[id];assert(x&&x.title&&x.en);
 assert(x.rows.length>=4);
 for(const row of x.rows){
  assert.equal(row.length,3);
  row.forEach(v=>assert(v&&v.trim().length>15,'Translation missing for chapter '+id));
  total++;
 }
}
for(const f of files)assert(read('sw.js').includes("'./"+f+"'"),'Offline precache missing '+f);
for(const f of files)assert(read('mobile/scripts/prepare.mjs').includes("'"+f+"'"),'Mobile bundle missing '+f);
for(const f of files)assert(read('settings.js').includes(f),'Web loader missing '+f);
const utterances=[];
const dom=new JSDOM(html,{
 url:'https://eric9435.github.io/wortweg-370/',
 runScripts:'dangerously',
 beforeParse(w){
  w.structuredClone=structuredClone;w.scrollTo=()=>{};
  w.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
  w.speechSynthesis={
   cancel(){},pause(){},resume(){},getVoices(){return[{lang:'de-DE',name:'German test',localService:true}];},
   speak(u){utterances.push(u);}
  };
 }
});
const w=dom.window;
for(const f of ['topic-reading-seeds-1.js','topic-reading-seeds-2.js','topic-reading-seeds-3.js','topic-reading-seeds-4.js','topic-reading-engine.js',...files.slice(0,2),'topic-lessons.js',files[2]])w.eval(read(f));
assert.equal(w.WortWegReadingStudio.getCount(),24);
w.WortWeg.navigate('topics');
let button=[...w.document.querySelectorAll('#topicList button.topic')].find(b=>b.textContent.includes('Persönliche Angaben'));
assert(button,'Topic button exists');
button.click();
assert(w.document.querySelector('.wwr-overlay'),'Topic title opens modal');
assert.equal(w.document.querySelector('.wwr-header'),null,'Duplicate title header is removed');
assert.equal(w.document.querySelectorAll('.wwr-row').length,chapters[1].rows.length);
const row=w.document.querySelector('.wwr-row');
assert(row.querySelector('.wwr-de').textContent.includes('Mein Name'));
assert(row.querySelector('.wwr-en').textContent.includes('My name'));
assert.equal(row.querySelector('.wwr-mm').hidden,false,'Myanmar text must be visible by default');
assert.equal(row.querySelector('.wwr-en').lang,'en');
assert.equal(row.querySelector('.wwr-mm').lang,'my');
assert.equal(w.document.querySelectorAll('.wwr-labels span').length,3,'All language headings present');
w.document.querySelector('.wwr-toggle-my').click();
assert.equal(row.querySelector('.wwr-mm').hidden,true,'Myanmar can be hidden');
w.document.querySelector('.wwr-toggle-my').click();
assert.equal(row.querySelector('.wwr-mm').hidden,false,'Myanmar can be shown again');
w.document.querySelector('.wwr-play').click();
assert.equal(utterances.length,1);
assert.equal(utterances[0].lang,'de-DE','Audio must be German');
assert.match(utterances[0].text,/Mein Name/);
assert(row.classList.contains('wwr-current'),'German row is highlighted');
assert(row.querySelector('.wwr-sentence.wwr-active'),'German sentence is highlighted');
assert(row.querySelector('.wwr-en.wwr-trans-active'),'English translation highlights with German audio');
assert(row.querySelector('.wwr-mm.wwr-trans-active'),'Myanmar translation highlights with German audio');
assert.equal(row.getAttribute('aria-current'),'true');
const seek=w.document.querySelector('.wwr-seek');
seek.value='3';seek.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.equal(utterances.length,2,'Seek restarts German audio');
assert.equal(seek.value,'3','Seek selects a sentence index');
assert.equal(utterances[1].lang,'de-DE');
assert(w.document.querySelector('.wwr-row.wwr-current .wwr-en.wwr-trans-active'),'Translation highlight retained after seeking');
assert(w.document.querySelector('.wwr-row.wwr-current .wwr-mm.wwr-trans-active'),'Myanmar highlight retained after seeking');
assert(w.document.querySelector('.wwr-menu-current').textContent.includes('Persönliche Angaben'),'Topic label moved into floating menu');
w.document.querySelector('.wwr-close-reader').click();
assert(!w.document.querySelector('.wwr-overlay'),'Close removes window');
w.WortWegTopics.open(10);
const detail=w.document.querySelector('.wwr-detail-button');
assert(detail,'Topic detail has long reading access');
detail.click();
assert(w.document.querySelector('.wwr-overlay'),'Detail button opens modal');
w.WortWegReadingStudio.close();
const launcher=w.document.getElementById('wwr-launcher');
assert(launcher,'Global floating reading menu launcher exists');
assert.equal(launcher.hidden,false);
launcher.click();
assert(w.document.querySelector('.wwr-overlay'),'Launcher opens full reader');
assert.equal(w.document.querySelector('.wwr-menu').hidden,false,'Launcher opens floating topic index');
assert.equal(w.document.querySelectorAll('.wwr-index button').length,24,'All 24 topics available in menu');
const allRows=w.document.querySelectorAll('.wwr-row');
assert.equal(allRows.length,chapters[10].rows.length,'All paragraphs are rendered, not just a preview');
const floating=w.document.querySelector('.wwr-fab');
floating.click();
assert.equal(w.document.querySelector('.wwr-menu').hidden,true);
floating.click();
assert.equal(w.document.querySelector('.wwr-menu').hidden,false);
const topicButton=w.document.querySelector('.wwr-index button[data-topic="24"]');
topicButton.click();
assert.match(w.document.querySelector('.wwr-menu-current').textContent,/Hände und Füße/);
assert.equal(w.document.querySelectorAll('.wwr-row').length,chapters[24].rows.length);
floatingMenuCheck();
function floatingMenuCheck(){
 w.document.querySelector('.wwr-fab').click();
 const menu=w.document.querySelector('.wwr-menu');
 w.document.querySelector('.wwr-german').click();
 assert(w.document.querySelector('.wwr-window').classList.contains('wwr-de-only'),'German only layout works');
 w.document.querySelector('.wwr-parallel').click();
 assert(!w.document.querySelector('.wwr-window').classList.contains('wwr-de-only'),'Parallel layout returns');
 w.document.querySelector('.wwr-mobile-pair').click();
 assert(w.document.querySelector('.wwr-window').classList.contains('wwr-parallel-mobile'));
 w.document.querySelector('.wwr-grow').click();
 assert(w.document.querySelector('.wwr-window').classList.contains('wwr-large'));
 w.document.querySelector('.wwr-toggle-my').click();
 assert.equal(w.document.querySelector('.wwr-mm').hidden,true,'Menu hides Myanmar translation');
 w.document.querySelector('.wwr-toggle-my').click();
 assert.equal(w.document.querySelector('.wwr-mm').hidden,false,'Menu shows Myanmar translation again');
 assert(menu.querySelector('.wwr-search'),'Floating searchable index exists');
 assert(menu.querySelector('.wwr-vocabulary'),'Vocabulary action moved into menu');
 assert(menu.querySelector('.wwr-close-reader'),'Close action moved into menu');
}
w.WortWegReadingStudio.close();
assert.equal(launcher.hidden,false,'Launcher visible again after reader closes');
dom.window.close();
console.log('PASS: '+Object.keys(chapters).length+' complete parallel chapters, '+total+' trilingual paragraphs; modal routing, optional Myanmar, German-only audio and sentence seeking.');
