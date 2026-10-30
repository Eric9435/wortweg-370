'use strict';
// C1 Dialog integration: real word sources, speaking prompts, independent progress and offline assets.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html'),html=read('dialog.html'),start=index.indexOf('<script type="application/json" id="data">');
assert.ok(start>=0);
const begin=index.indexOf('>',start)+1,end=index.indexOf('</script>',begin);
const data=JSON.parse(index.slice(begin,end));
const bank=data.bank.filter(x=>x.level==='C1'),curated=(data.curated||[]).filter(x=>x.level==='C1');
assert.equal(bank.length,3088);
const nc={window:{}};vm.createContext(nc);vm.runInContext(read('noun-expansion.js'),nc);
const allNouns=nc.window.WortWegNounExpansion.entries,nouns=allNouns.filter(x=>x.level==='C1');
assert.equal(nouns.length,1827);
const script=read('dialog-situations-c1.js'),engine=read('dialog.js');
new vm.Script(script);new vm.Script(engine);
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(script,sandbox);
const scenes=sandbox.window.WortWegC1Situations,ids=new Set();
assert.equal(scenes.length,48,'48 authored advanced scenarios');
for(const s of scenes){
 assert.equal(s.length,5);assert.ok(!ids.has(s[0]),'Unique C1 scene '+s[0]);ids.add(s[0]);
 assert.equal(s[3].length,2);assert.equal(s[4].length,8,'Eight complete turns: '+s[1]);
 for(const t of s[4]){assert.equal(t.length,2);assert.ok(t[0].length>25);assert.ok(t[1].length>25);}
}
const dom=new JSDOM(html,{url:'https://localhost/dialog.html?level=C1',runScripts:'outside-only'});
const w=dom.window;w.WortWegNounExpansion={entries:allNouns};
w.fetch=async()=>({ok:true,text:async()=>index});
for(const p of ['dialog-situations.js','dialog-situations-a2.js','dialog-situations-b1.js','dialog-situations-b2.js','dialog-situations-c1.js','dialog-situations-c2.js'])w.eval(read(p));
w.eval(engine);
const $=id=>w.document.getElementById(id);
async function test(){
 for(let i=0;i<90;i++){
  if(w.WortWegDialog.getState().level==='C1'&&w.WortWegDialog.getState().wordCount>0)break;
  await new Promise(ok=>setTimeout(ok,80));
 }
 const st=w.WortWegDialog.getState(),total=bank.length+curated.length+nouns.length;
 assert.equal(st.level,'C1','C1 deep link works');
 assert.equal(st.wordCount,total);assert.equal(st.wordDialogCount,total);assert.ok(total>=4915);
 assert.equal(st.situationCount,48);
 assert.equal(w.document.querySelectorAll('.dialog-levels button').length,6);
 assert.equal($('dialogTurns').querySelectorAll('.turn-de').length,8);
 assert.equal($('dialogTurns').querySelectorAll('.turn-en').length,8);
 assert.equal($('dialogB2Challenge').hidden,false);
 assert.match($('dialogChallengeLevel').textContent,/C1/);
 assert.equal($('dialogChallengeNum').textContent,'1 / 5');
 assert.match($('dialogChallengeDe').textContent,/impliziten Annahmen/);
 $('dialogChallengeNext').click();assert.equal($('dialogChallengeNum').textContent,'2 / 5');
 assert.match($('dialogChallengeDe').textContent,/Gegenbeispiel/);
 $('dialogShowEnglish').click();assert.equal($('dialogChallengeEn').hidden,true);
 $('dialogShowEnglish').click();assert.equal($('dialogChallengeEn').hidden,false);
 $('dialogRoleplay').click();
 assert.equal($('dialogTurns').querySelectorAll('.roleplay-reveal').length,4);
 $('dialogRoleplay').click();
 const oldQuiz=w.localStorage.getItem('wortweg370-progress-v3');
 $('dialogMark').click();
 assert.ok(JSON.parse(w.localStorage.getItem('ww-c1-dialog-progress-v1'))['scene:causal-inference']);
 assert.equal(w.localStorage.getItem('wortweg370-progress-v3'),oldQuiz);
 w.document.querySelector('.dialog-tabs button[data-mode="words"]').click();
 assert.equal($('dialogB2Challenge').hidden,true);
 assert.ok($('dialogTurns').textContent.includes($('dialogTitle').textContent));
 $('dialogSearch').value=nouns[0].de;$('dialogSearch').dispatchEvent(new w.Event('input'));
 assert.ok(Number($('dialogListCount').textContent.split(' ')[0])>0,'Actual C1 word is searchable');
 $('dialogSearch').value='';$('dialogSearch').dispatchEvent(new w.Event('input'));
 assert.ok($('dialogList').querySelectorAll('button.dialog-item').length<=121);
 for(const level of ['A1','A2','B1','B2']){w.WortWegDialog.setLevel(level);assert.equal(w.WortWegDialog.getState().level,level);}
 w.WortWegDialog.setLevel('B2');assert.equal($('dialogChallengeNum').textContent,'1 / 4','B2 exam remains intact');
 w.WortWegDialog.setLevel('C1');assert.equal(w.WortWegDialog.getState().completed,1);
 const sw=read('sw.js'),native=read('mobile/scripts/prepare.mjs');
 assert.ok(sw.includes("'./dialog-situations-c1.js'"));assert.ok(sw.includes("'dialog-situations-c1.js'"));
 assert.ok(native.includes("'dialog-situations-c1.js'"));assert.ok(sw.includes("wortweg370-v91"));
 assert.ok(!html.includes('id="data"'));
 dom.window.close();
 console.log('C1_DIALOG='+JSON.stringify({scenes:48,turns:384,bank:bank.length,curated:curated.length,nouns:nouns.length,total}));
 console.log('PASS: C1 bilingual dialogue source coverage, advanced speaking tasks, separate progress, level switching and offline assets');
}
test().catch(e=>{dom.window.close();console.error(e);process.exitCode=1;});
