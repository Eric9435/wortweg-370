'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const index=fs.readFileSync('index.html','utf8');
const match=index.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
assert.ok(match,'Real app must expose its embedded Word Bank');
const original=JSON.parse(match[1]),bank=original.bank.filter(w=>w.level==='A1');
const nounsSource=fs.readFileSync('noun-expansion.js','utf8');
const context={window:{},Event:class{constructor(type){this.type=type}}};
vm.createContext(context);vm.runInContext(nounsSource,context);
const nounItems=context.window.WortWegNounExpansion.entries.filter(w=>w.level==='A1');
assert.equal(bank.length,642,'Keep all 642 historical A1 Word Bank records');
assert.equal(nounItems.length,232,'Keep all 232 current A1 expansion noun records');
const html=fs.readFileSync('a1-complete-reader.html','utf8');
new vm.Script(html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/)[1],{filename:'a1-complete-reader.html'});
assert.match(html,/12 connected beginner chapters/);
const dom=new JSDOM(html,{url:'https://localhost/a1-complete-reader.html',runScripts:'outside-only'});
const w=dom.window;w.WortWegNounExpansion={entries:nounItems};
w.fetch=async(url)=>{assert.equal(url,'./index.html');return {ok:true,text:async()=>index}};
w.eval(html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/)[1]);
const $=id=>w.document.getElementById(id);
setTimeout(()=>{
 try{
  assert.equal($('bankN').textContent,'642');
  assert.equal($('nounN').textContent,'232');
  assert.equal($('totalN').textContent,'874');
  const panels=w.document.querySelectorAll('#storyContent article.chapter');
  assert.equal(panels.length,12,'12 connected A1 reading scenes');

  // Every chapter must show German and a complete English translation by default.
  const germanBlocks=w.document.querySelectorAll('#storyContent .german-col[lang="de"] p.german');
  const englishBlocks=w.document.querySelectorAll('#storyContent .english-col[lang="en"] p.english');
  assert.equal(germanBlocks.length,12,'Every scene displays visible German text');
  assert.equal(englishBlocks.length,12,'Every scene displays an English translation');
  assert.ok(!$('storyContent').classList.contains('english-hidden'),'Bilingual view is the default');
  for(let i=0;i<panels.length;i++){
   assert.ok(germanBlocks[i].textContent.trim().length>200,'Long German chapter '+(i+1));
   assert.ok(englishBlocks[i].textContent.trim().length>200,'Full English translation, not a summary, chapter '+(i+1));
   assert.ok(germanBlocks[i].closest('.story-duo').contains(englishBlocks[i]),'Parallel language columns, chapter '+(i+1));
   assert.equal(germanBlocks[i].parentElement.getAttribute('lang'),'de','Proper German language annotation');
   assert.equal(englishBlocks[i].parentElement.getAttribute('lang'),'en','Proper English language annotation');
   assert.equal(englishBlocks[i].closest('details'),null,'English is not hidden in a collapsed panel');
  }
  assert.ok(germanBlocks[0].textContent.includes('Mein Name ist Min.'));
  assert.ok(englishBlocks[0].textContent.includes('My name is Min.'));
  assert.ok(englishBlocks[6].textContent.includes('Lunch costs ten euros.'));
  assert.ok(germanBlocks[6].textContent.includes('Das Mittagessen kostet zehn Euro.'));
  $('toggleEnglish').click();
  assert.ok($('storyContent').classList.contains('english-hidden'),'A deliberate hide button is available for self-testing');
  assert.equal($('toggleEnglish').getAttribute('aria-pressed'),'true');
  $('toggleEnglish').click();
  assert.ok(!$('storyContent').classList.contains('english-hidden'),'English translations can be restored');
  assert.equal($('toggleEnglish').getAttribute('aria-pressed'),'false');
  assert.match(html,/@media\(max-width:700px\)/,'Side-by-side language columns stack on mobile');

  const records=w.document.querySelectorAll('#allContent button.term');
  assert.equal(records.length,874,'Every single A1 source entry is visible, duplicates preserved');
  const rendered=Array.from(records).map(x=>x.querySelector('strong')?.textContent);
  for(const word of [...bank,...nounItems])
   assert.ok(rendered.includes(word.de),'No source A1 item omitted: '+word.de);
  for(const phrase of ['das alte Buch','Fahrkarte kaufen','die richtige Antwort'])
   assert.ok(rendered.includes(phrase),'All A1 fixed expressions must be included: '+phrase);
  $('search').value='fahrkarte';$('search').dispatchEvent(new w.Event('input'));
  assert.ok(w.document.querySelectorAll('#allContent button.term').length>5,'Search includes fixed noun phrases');
  assert.ok(w.document.querySelectorAll('#allContent button.term').length<874,'Search filters list');
  $('search').value='';$('search').dispatchEvent(new w.Event('input'));
  assert.equal(w.document.querySelectorAll('#allContent button.term').length,874,'Clearing search restores all entries');
  const first=w.document.querySelector('#allContent button.term');
  first.click();assert.equal(first.textContent.includes('der Abend'),true);
  assert.ok(w.localStorage.getItem('ww-a1-complete-reader-reviewed-v1'),'Local review markers save');
  $('onlyUnseen').checked=true;$('onlyUnseen').dispatchEvent(new w.Event('change'));
  assert.equal(w.document.querySelectorAll('#allContent button.term').length,873,'Reviewed-only filter operates on source IDs');
  assert.match(fs.readFileSync('home-refresh.js','utf8'),/complete-reading\.html/,'Home opens the Complete Reading level selector');
  assert.match(fs.readFileSync('sw.js','utf8'),/a1-complete-reader\.html/,'Offline bundle contains complete reader');
  assert.match(fs.readFileSync('sw.js','utf8'),/wortweg370-v90/,'PWA cache refreshes after reader addition');
  dom.window.close();
  console.log('A1_COMPLETE_READER_RESULT='+JSON.stringify({bank:bank.length,nounExpansion:nounItems.length,entries:bank.length+nounItems.length,chapters:panels.length}));
  console.log('PASS: all A1 words, complete German-English translations, default bilingual columns, mobile layout, visibility toggle and offline assets.');
 }catch(e){dom.window.close();console.error(e);process.exitCode=1;}
},25);