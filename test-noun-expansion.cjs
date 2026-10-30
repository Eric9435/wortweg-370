'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const expansionSource=fs.readFileSync('noun-expansion.js','utf8');
new vm.Script(expansionSource,{filename:'noun-expansion.js'});
const ctx={window:{}};
vm.createContext(ctx);vm.runInContext(expansionSource,ctx);
const pack=ctx.window.WortWegNounExpansion;
const nouns=pack.entries;
assert.ok(nouns.length>=2300,'The C1 academic noun expansion adds more than 1,200 curated entries');
const byArticle={der:0,die:0,das:0};
const keys=new Set(),wordArticles=new Map();
for(const w of nouns){
 const m=/^(der|die|das)\s+(\S.+)$/u.exec(w.de);
 assert.ok(m,'Every noun has a correct-looking definite singular article: '+w.de);
 assert.ok(!m[2].includes(' '),'Expansion is standalone noun headwords, not adjective phrases: '+w.de);
 assert.ok(/^(A1|A2|B1|B2|C1|C2)$/.test(w.level),'Valid CEFR practice label');
 assert.ok(w.en,'Every noun has an English meaning');
 assert.ok(!/[.!?]$/.test(w.de),'Headwords are not sentences');
 assert.ok(w.level,'Every word has a level');
 assert.equal(w.type,'noun');
 assert.equal(w.source,'noun-expansion');
 assert.ok(w.topic,'Every noun belongs to a topic');
 assert.ok(!keys.has(w.de.toLocaleLowerCase('de')),'No repeated article+noun in expansion: '+w.de);
 keys.add(w.de.toLocaleLowerCase('de'));
 const bare=m[2].toLocaleLowerCase('de');
 const seen=wordArticles.get(bare);
 assert.ok(!seen||seen===m[1],'A word cannot carry multiple different genders in a single-answer quiz: '+w.de);
 wordArticles.set(bare,m[1]);byArticle[m[1]]++;
}
for(const x of ['der','die','das'])assert.ok(byArticle[x]>180,'Article balance for '+x);
for(const day of ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag']){
 assert.ok(keys.has('der '+day.toLocaleLowerCase('de')),'Include article-less weekday '+day);
}
for(const variant of ['der laptop','das joghurt','der filter','das bandpassfilter']){
 assert.ok(!keys.has(variant),'Avoid words allowing more than one article: '+variant);
}
const htmlSource=fs.readFileSync('index.html','utf8');
const match=htmlSource.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
assert.ok(match,'Original Word Bank data still accessible');
const original=JSON.parse(match[1]);
assert.equal(original.bank.length,10876,'Original 10,876-entry bank not modified');
const toLemma=text=>String(text||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de');
const baseArticleForms=new Set([...original.bank,...original.curated].map(w=>toLemma(w.de)).filter(x=>/^(der|die|das)\s+/u.test(x)));
const trulyNew=nouns.filter(w=>!baseArticleForms.has(toLemma(w.de)));

const mandatory=[
 'die Bedeutung','die Konsequenz','die Vorgehensweise','die Problemstellung',
 'die Zielstellung','die Feststellung','die Erkenntnisgewinnung',
 'die Zuwanderung','die Einwanderung','die Auswanderung','die Beteiligung',
 'die Stellungnahme','die Haltung','die Überzeugung','die Auseinandersetzung',
 'die Herstellung','die Einnahme','die Ausgabe','die Ressource',
 'die Wettbewerbsfähigkeit','die Lebensbedingung',
 'der Vorteil','der Nachteil','der Bedarf','der Bestand','der Nutzen',
 'der Rückgang','der Anstieg','der Zuwachs','der Begriff','der Verlauf',
 'der Rahmen','der Aspekt','der Hintergrund',
 'das Defizit','das Mittel','das Wachstum','das Umfeld'
];
const completeInventory=new Set([...original.bank,...original.curated,...nouns]
 .map(w=>toLemma(w.de)));
for(const word of mandatory)assert.ok(completeInventory.has(toLemma(word)),
 'Core general-academic noun missing from dictionary: '+word);
const baseByLemma=new Map();
for(const w of [...original.bank,...original.curated]){
 const m=/^(der|die|das)\s+(.+)$/iu.exec(toLemma(w.de));
 if(!m)continue;
 const lemma=m[2];
 const s=baseByLemma.get(lemma)||new Set();s.add(m[1]);baseByLemma.set(lemma,s);
}
for(const w of nouns){
 const m=/^(der|die|das)\s+(.+)$/iu.exec(toLemma(w.de));
 const historical=baseByLemma.get(m[2]);
 assert.ok(!historical||historical.has(m[1]),
  'Expansion article conflicts with original bank for '+w.de);
}

assert.ok(trulyNew.length>=900,'Significant number of new standalone nouns after deduplicating against the original bank');
console.log('NOUN_EXPANSION_RESULT='+JSON.stringify({
 curated:nouns.length,newAfterOriginalDedup:trulyNew.length,
 existingAlreadyCovered:nouns.length-trulyNew.length,articleDistribution:byArticle,mandatoryGeneralNouns:mandatory.length,
 originalBank:original.bank.length
}));
const fixture={bank:[
 {id:1,de:'das Kabel',en:'cable',level:'A2'},
 {id:2,de:'die Regelung',en:'feedback control',level:'B2'},
 {id:3,de:'gehen',en:'go',level:'A1'},
 {id:4,de:'Montag',en:'Monday',level:'A1'}
],curated:[]};
const html='<!doctype html><html><body><section id="dashboard"><div class="ww-main-menu">'+
 '<div class="ww-menu-options"><button data-nav="review">Review</button></div></div></section>'+
 '<script id="data" type="application/json">'+JSON.stringify(fixture)+'</script></body></html>';
const dom=new JSDOM(html,{url:'https://example.test',runScripts:'outside-only'});
const w=dom.window;w.eval(expansionSource);
w.WortWegAccountSnapshot={uid:'articleUser'};
const $=s=>w.document.querySelector(s);
w.eval(fs.readFileSync('articles-quiz.js','utf8'));
const excluded=new Set(['das kabel','die regelung']);
assert.equal(w.WortWegArticlesQuiz.getEligibleCount(),nouns.length,
 'Quiz contains all pack nouns plus original entries, without duplicate lemma forms');
$('#ww-articles-launch').click();
assert.match($('#ww-articles-quiz').textContent,/additional noun headwords/,'New vocabulary is clearly announced');
const filter=[...w.document.querySelectorAll('.ww-articles-field select')]
 .find(s=>s.getAttribute('aria-label')==='Source');
filter.value='expansion';filter.dispatchEvent(new w.Event('change'));
const available=nouns.length-excluded.size;
assert.ok($('#ww-articles-quiz').textContent.includes(available.toLocaleString('en-US')+' nouns match'),
 'New expansion filter displays only fresh headwords');
assert.ok($('#ww-articles-quiz').textContent.includes('All eligible words'));
const start=[...$('#ww-articles-quiz').querySelectorAll('button')].find(x=>/^Start /.test(x.textContent));
start.click();
assert.equal(w.WortWegArticlesQuiz.getSummary().sessionTotal,available,
 'All words mode handles a thousand questions without truncation');
assert.equal($('#ww-articles-quiz .ww-articles-choices').children.length,3);
assert.equal(w.document.querySelectorAll('.ww-articles-word').length,1,'One question at a time');
w.WortWegArticlesQuiz.close();
w.eval(fs.readFileSync('flashcards.js','utf8'));
const expectedFlashTotal=fixture.bank.length+(nouns.length-excluded.size);
assert.equal(w.WortWegFlashcards.getCatalogCount(),expectedFlashTotal,
 'Flashcards include only pack words absent from original bank');
$('#ww-flashcards-launch').click();
const flashSource=[...w.document.querySelectorAll('.ww-flash-field select')]
 .find(s=>s.getAttribute('aria-label')==='Source');
assert.ok([...flashSource.options].some(o=>o.value==='expansion'),
 'Expanded noun source is selectable for flashcards');
for(const file of ['noun-expansion.js']){
 assert.ok(fs.readFileSync('sw.js','utf8').includes(file),'PWA cache includes '+file);
 assert.ok(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes(file),'Native package includes '+file);
 assert.ok(fs.readFileSync('ios-polish.js','utf8').includes(file),'Web loader includes '+file);
}
assert.match(fs.readFileSync('ios-polish.js','utf8'),/nouns\.onload=load/,'Noun pack loads before quiz and flashcards');
assert.match(fs.readFileSync('sw.js','utf8'),/wortweg370-v84/);
dom.window.close();
console.log('PASS: verified article-only noun expansion, bank deduplication, all-words quiz, flashcards, mobile/offline, and original data safety.');
