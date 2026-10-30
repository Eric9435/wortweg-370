'use strict';
// End-to-end B2 reader smoke test: original passages, real WortWeg bank,
// bilingual display, German playback, isolated review and offline packaging.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const read=path=>fs.readFileSync(path,'utf8');
const index=read('index.html');
const match=index.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
assert.ok(match,'WortWeg original Word Bank exists');
const original=JSON.parse(match[1]);
const bank=original.bank.filter(w=>w.level==='B2');
const curated=(original.curated||[]).filter(w=>w.level==='B2');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(read('noun-expansion.js'),ctx);
const nouns=ctx.window.WortWegNounExpansion.entries.filter(w=>w.level==='B2');
assert.ok(bank.length>0,'B2 vocabulary is present in the original bank');
const chapterCtx={window:{}};vm.createContext(chapterCtx);
const chapterFiles=['b2-reading-chapters.js','b2-reading-part-02.js','b2-reading-part-03.js','b2-reading-part-04.js','b2-reading-part-05.js','b2-reading-part-06.js','b2-reading-part-07.js','b2-reading-part-08.js','b2-reading-part-09.js','b2-reading-part-10.js'];
for(const file of chapterFiles)vm.runInContext(read(file),chapterCtx);
const chapters=[...(chapterCtx.window.WortWegB2Chapters||[]),...(chapterCtx.window.WortWegB2Part02||[]),...(chapterCtx.window.WortWegB2Part03||[]),...(chapterCtx.window.WortWegB2Part04||[]),...(chapterCtx.window.WortWegB2Part05||[]),...(chapterCtx.window.WortWegB2Part06||[]),...(chapterCtx.window.WortWegB2Part07||[]),...(chapterCtx.window.WortWegB2Part08||[]),...(chapterCtx.window.WortWegB2Part09||[]),...(chapterCtx.window.WortWegB2Part10||[])];
assert.equal(chapters.length,19,'B2 must have 19 complete original chapters');
for(let i=0;i<19;i++){
 const c=chapters[i];
 assert.ok(c.title.startsWith(String(i+1).padStart(2,'0')+' · '),'Ordered chapter '+(i+1));
 assert.ok(c.de.length>450,'Substantial German chapter '+(i+1));
 assert.ok(c.translation.length>450,'Full English chapter '+(i+1));
 assert.notEqual(c.de,c.translation,'Translation is not copied German text');
 assert.ok(!/^\s*$/.test(c.en),'Chapter title translated');
}
const hub=read('complete-reading.html');
const menu=new JSDOM(hub).window.document;
const link=menu.querySelector('a[data-level="B2"]');
assert.ok(link,'B2 selector exists');
assert.equal(link.getAttribute('href'),'./b2-complete-reader.html');
assert.ok(link.classList.contains('ready'));
assert.equal(menu.querySelectorAll('.level.ready').length,4,'A1, A2, B1 and B2 readers available');
const html=read('b2-complete-reader.html');
assert.match(html,/<script src="\.\/b2-reading-chapters\.js"><\/script>/);
assert.match(html,/src="\.\/noun-expansion\.js"/);
assert.match(html,/const curated=\(original\.curated\|\|\[\]\)/);
const source=html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/);
assert.ok(source,'B2 reader script is present');
new vm.Script(source[1],{filename:'b2-complete-reader.html'});
const dom=new JSDOM(html,{url:'https://example.test/b2-complete-reader.html',runScripts:'outside-only'});
const w=dom.window;
w.WortWegB2Chapters=chapters;
w.WortWegNounExpansion={entries:nouns};
const spoken=[];
const synth={getVoices:()=>[{lang:'de-DE',localService:true}],cancel(){},pause(){},resume(){},speak(u){spoken.push(u)}};
Object.defineProperty(w,'speechSynthesis',{configurable:true,value:synth});
w.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
w.fetch=async(url)=>{assert.equal(url,'./index.html');return {ok:true,text:async()=>index}};
w.eval(source[1]);
const $=id=>w.document.getElementById(id);
setTimeout(()=>{
 try{
  const total=bank.length+curated.length+nouns.length;
  assert.equal($('bankN').textContent,bank.length.toLocaleString('en-US'));
  assert.equal($('nounN').textContent,nouns.length.toLocaleString('en-US'));
  assert.equal($('totalN').textContent,total.toLocaleString('en-US'));
  assert.equal(w.document.querySelectorAll('#storyContent article.chapter').length,19);
  assert.equal(w.document.querySelectorAll('#storyContent .german-col[lang="de"] p.german').length,19);
  assert.equal(w.document.querySelectorAll('#storyContent .english-col[lang="en"] p.english').length,19);
  assert.equal(w.document.querySelectorAll('.speech-play').length,19);
  assert.equal(w.document.querySelector('.german-col p.german').textContent,chapters[0].de);
  assert.equal(w.document.querySelector('.english-col p.english').textContent,chapters[0].translation);
  assert.ok(!$('storyContent').classList.contains('english-hidden'));
  $('toggleEnglish').click();
  assert.ok($('storyContent').classList.contains('english-hidden'));
  $('toggleEnglish').click();
  assert.ok(!$('storyContent').classList.contains('english-hidden'));
  const rendered=[...w.document.querySelectorAll('#allContent button.term strong')].map(n=>n.textContent);
  assert.equal(rendered.length,total,'All original, curated and noun B2 records rendered');
  for(const item of [...bank,...curated,...nouns])assert.ok(rendered.includes(item.de),'Missing B2 word: '+item.de);
  assert.equal(spoken.length,0,'German reader must not autoplay');
  w.document.querySelector('.speech-play').click();
  assert.equal(spoken.length,1,'Play speaks the first German passage');
  assert.equal(spoken[0].lang,'de-DE');
  assert.ok(chapters[0].de.startsWith(spoken[0].text.slice(0,16)));
  w.document.querySelector('.speech-stop').click();
  const first=$('allContent').querySelector('button.term');
  first.click();
  assert.ok(w.localStorage.getItem('ww-b2-complete-reader-reviewed-v1'),'Review state saves independently');
  $('onlyUnseen').checked=true;$('onlyUnseen').dispatchEvent(new w.Event('change'));
  assert.equal(w.document.querySelectorAll('#allContent button.term').length,total-1);
  const offline=read('sw.js'),native=read('mobile/scripts/prepare.mjs');
  for(const file of ['b2-complete-reader.html',...chapterFiles]){
   assert.ok(offline.includes(file),'Offline PWA ships '+file);
   assert.ok(native.includes(file),'Android build ships '+file);
  }
  assert.ok(offline.includes("'b2-complete-reader.html','complete-reading-level.html'"),'B2 route has correct offline navigation fallback');
  dom.window.close();
  console.log('B2_READING='+JSON.stringify({chapters:19,bank:bank.length,curated:curated.length,nouns:nouns.length,total}));
  console.log('PASS: B2 full bilingual reading, word coverage, German TTS, review persistence, menu and offline assets.');
 }catch(e){dom.window.close();console.error(e);process.exitCode=1;}
},40);
