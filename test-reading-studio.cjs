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
assert.equal(w.document.querySelectorAll('.wwr-row').length,chapters[1].rows.length);
const row=w.document.querySelector('.wwr-row');
assert(row.querySelector('.wwr-de').textContent.includes('Mein Name'));
assert(row.querySelector('.wwr-en').textContent.includes('My name'));
assert.equal(row.querySelector('.wwr-mm').hidden,true);
w.document.querySelector('.wwr-header button[aria-pressed]').click();
assert.equal(row.querySelector('.wwr-mm').hidden,false);
w.document.querySelector('.wwr-play').click();
assert.equal(utterances.length,1);
assert.equal(utterances[0].lang,'de-DE','Audio must be German');
assert.match(utterances[0].text,/Mein Name/);
assert(row.classList.contains('wwr-current'),'Current row is highlighted');
const seek=w.document.querySelector('.wwr-seek');
seek.value='3';seek.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.equal(utterances.length,2,'Seek restarts German audio');
assert.equal(seek.value,'3','Seek selects a sentence index');
assert.equal(utterances[1].lang,'de-DE');
w.document.querySelector('.wwr-header .wwr-close')?.click();
w.document.querySelector('.wwr-header button:last-child').click();
assert(!w.document.querySelector('.wwr-overlay'),'Close removes window');
w.WortWegTopics.open(10);
const detail=w.document.querySelector('.wwr-detail-button');
assert(detail,'Topic detail has long reading access');
detail.click();
assert(w.document.querySelector('.wwr-overlay'),'Detail button opens modal');
w.WortWegReadingStudio.close();
dom.window.close();
console.log('PASS: '+Object.keys(chapters).length+' complete parallel chapters, '+total+' trilingual paragraphs; modal routing, optional Myanmar, German-only audio and sentence seeking.');
