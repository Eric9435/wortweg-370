'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const read=path=>fs.readFileSync(path,'utf8');
const hub=read('complete-reading.html');
assert.match(hub,/<html[^>]*>/);
assert.match(hub,/overflow:hidden/,'Level selector must not scroll');
assert.match(hub,/height:100dvh/,'Level selector fits one window');
const selector=new JSDOM(hub,{url:'https://example.test/complete-reading.html'});
const links=[...selector.window.document.querySelectorAll('a.level')];
assert.deepEqual(links.map(x=>x.dataset.level),['A1','A2','B1','B2','C1','C2']);
assert.deepEqual(links.map(x=>x.getAttribute('href')),[
 './a1-complete-reader.html','./a2-complete-reader.html',
 './b1-complete-reader.html','./b2-complete-reader.html',
 './c1-complete-reader.html','./c2-complete-reader.html'
]);
assert.equal(selector.window.document.querySelectorAll('.level.ready').length,6,
 'A1/A2/B1/B2/C1/C2 are marked as complete passages');
assert.ok(!hub.includes('overflow-y:auto'),'Level picker must not be a scrolling list');
selector.window.close();
const app=read('index.html');
const match=app.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
assert.ok(match,'Original vocabulary present');
const wordBank=JSON.parse(match[1]);
const bank=wordBank.bank.filter(w=>w.level==='A2');
const curated=wordBank.curated.filter(w=>w.level==='A2');
assert.equal(bank.length,932);
assert.equal(curated.length,1);
const nounSrc=read('noun-expansion.js');
const context={window:{},Event:class {constructor(type){this.type=type}}};
vm.createContext(context);vm.runInContext(nounSrc,context);
const nouns=context.window.WortWegNounExpansion.entries.filter(w=>w.level==='A2');
assert.equal(nouns.length,243);
const chaptersSrc=read('a2-reading-chapters.js');
const scripts={window:{}};vm.createContext(scripts);vm.runInContext(chaptersSrc,scripts);
const chapters=scripts.window.WortWegA2Chapters;
assert.equal(chapters.length,14,'Provide all fourteen A2 bilingual passages');
for(let i=0;i<chapters.length;i++){
 const c=chapters[i];
 assert.ok(c.de.length>370,'Full A2 German text, chapter '+(i+1));
 assert.ok(c.translation.length>340,'Full English translation, chapter '+(i+1));
 assert.notEqual(c.de,c.translation);
 assert.ok(c.title.startsWith(String(i+1).padStart(2,'0')+' · '));
}
const a2=read('a2-complete-reader.html');
assert.match(a2,/<script src="\.\/a2-reading-chapters\.js"><\/script>/,'A2 narrative loads before renderer');
assert.match(a2,/const curated=\(original\.curated\|\|\[\]\)/,'A2 curated item must not be lost');
assert.match(a2,/complete-reading\.html/,'A2 Back leads to fixed selector');
const source=a2.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/);
assert.ok(source,'A2 reader has executable script');
new vm.Script(source[1],{filename:'a2-complete-reader.html'});
const dom=new JSDOM(a2,{url:'https://example.test/a2-complete-reader.html',runScripts:'outside-only'});
const w=dom.window;
w.WortWegA2Chapters=chapters;
w.WortWegNounExpansion={entries:nouns};
const spoken=[],synth={getVoices:()=>[{lang:'en-US'},{lang:'de-DE',localService:true}],cancel(){},pause(){},resume(){},speak(u){spoken.push(u)}};
Object.defineProperty(w,'speechSynthesis',{configurable:true,value:synth});
w.SpeechSynthesisUtterance=class {constructor(text){this.text=text}};
w.fetch=async(url)=>{assert.equal(url,'./index.html');return {ok:true,text:async()=>app};};
w.eval(source[1]);
const $=id=>w.document.getElementById(id);
setTimeout(()=>{
 try{
  assert.equal($('bankN').textContent,'932','Use the actual A2 Word Bank');
  assert.equal($('nounN').textContent,'243','Use the actual A2 noun expansion');
  assert.equal($('totalN').textContent,'1,176','Add the curated A2 word as well');
  assert.equal(w.document.querySelectorAll('#storyContent .chapter').length,14,'14 separate readable A2 stories');
  assert.equal(w.document.querySelectorAll('.german-col[lang="de"] p.german').length,14);
  assert.equal(w.document.querySelectorAll('.english-col[lang="en"] p.english').length,14);
  assert.equal(w.document.querySelectorAll('.speech-play').length,14,'Every A2 passage has German narration');
  const rendered=[...w.document.querySelectorAll('#allContent button.term strong')].map(x=>x.textContent);
  assert.equal(rendered.length,1176,'Every original, curated, and supplemental A2 entry is visible');
  for(const item of [...bank,...curated,...nouns])assert.ok(rendered.includes(item.de),'Missing exact A2 source entry: '+item.de);
  for(const key of ['die Unterschrift','Datei speichern','Anmeldung unterschreiben','das Arbeitszimmer'])
   assert.ok(rendered.includes(key),'Foundational A2 vocabulary must be listed: '+key);
  const german=w.document.querySelector('.german-col p.german').textContent;
  assert.match(german,/Ich wohne seit drei Monaten/,'Actual German story text visible');
  assert.match(w.document.querySelector('.english-col p.english').textContent,/I have been living in Germany/,'Parallel English visible');
  assert.equal(spoken.length,0,'No autoplay');
  w.document.querySelectorAll('.speech-play')[0].click();
  assert.equal(spoken.length,1);
  assert.equal(spoken[0].lang,'de-DE');
  assert.ok(german.startsWith(spoken[0].text.slice(0,20)),'Narration reads German, not English');
  w.document.querySelectorAll('.speech-stop')[0].click();
  $('search').value='Anmeldung';$('search').dispatchEvent(new w.Event('input'));
  assert.ok(w.document.querySelectorAll('#allContent button.term').length>5);
  $('search').value='';$('search').dispatchEvent(new w.Event('input'));
  assert.equal(w.document.querySelectorAll('#allContent button.term').length,1176);
  const shortcut=read('home-refresh.js');
  assert.match(shortcut,/title:'Complete Reading'/);
  assert.match(shortcut,/location\.href='\.\/complete-reading\.html'/);
  assert.ok(!shortcut.includes("title:'A1 Complete Reading'"),'No old A1-only Home label');
  const sw=read('sw.js'),native=read('mobile/scripts/prepare.mjs');
  for(const file of ['complete-reading.html','a2-complete-reader.html','a2-reading-chapters.js','b1-complete-reader.html','b1-reading-chapters.js','complete-reading-level.html']){
   assert.ok(sw.includes(file),'PWA offline cache must include '+file);
   assert.ok(native.includes(file),'Native package must include '+file);
  }
  assert.match(sw,/wortweg370-v91/);
  assert.match(sw,/selectedReader/,'Offline navigation must resolve selected level correctly');
  assert.match(read('a1-complete-reader.html'),/href="\.\/complete-reading\.html"/,
   'A1 Back must open level selector');
  dom.window.close();
  console.log('A2_COMPLETE_READING='+JSON.stringify({bank:bank.length,curated:curated.length,expansion:nouns.length,total:1176,chapters:14,selectors:6}));
  console.log('PASS: 6 level windows, non-scroll selector, full 1176-entry A2 list, 14 bilingual passages, German TTS, existing A1 and offline/native packaging.');
 }catch(error){dom.window.close();console.error(error);process.exitCode=1;}
},35);
