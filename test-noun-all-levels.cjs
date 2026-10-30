'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const dataBlock=html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
assert.ok(dataBlock,'Original bank must remain bundled');
const bank=JSON.parse(dataBlock[1]);
assert.equal(bank.bank.length,10876,'Do not change existing learning progress IDs');
assert.ok(Array.isArray(bank.curated));
const sandbox={window:{},Event:class {constructor(type){this.type=type}}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('noun-expansion.js','utf8'),sandbox);
const expansion=sandbox.window.WortWegNounExpansion.entries;
const levels=['A1','A2','B1','B2','C1','C2'];
const byLevel=Object.fromEntries(levels.map(level=>[level,{pack:0,new:0,article:{der:0,die:0,das:0}}]));
const normalize=v=>String(v||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de');
const articlePattern=/^(der|die|das)\s+(.+)$/u;
const historic=new Set();
const genders=new Map();
for(const w of [...bank.bank,...bank.curated]){
 const full=normalize(w.de);
 const match=articlePattern.exec(full);
 if(!match)continue;
 historic.add(full);
 const current=genders.get(match[2])||new Set();
 current.add(match[1]);genders.set(match[2],current);
}
let clashes=0;
const seen=new Set(),crossArticle=[];
for(const w of expansion){
 const match=articlePattern.exec(normalize(w.de));
 assert.ok(match,'A noun has an article '+w.de);
 assert.ok(!/\s/.test(match[2]),'Store only one-word nominative headwords '+w.de);
 assert.ok(levels.includes(w.level),'Recognized practice CEFR band');
 assert.ok(String(w.en||'').trim(),'Every item has an English gloss');
 assert.ok(String(w.topic||'').trim(),'Every item has a topic');
 assert.equal(w.source,'noun-expansion');
 assert.equal(w.type,'noun');
 assert.ok(!seen.has(normalize(w.de)),'No duplicate row '+w.de);
 seen.add(normalize(w.de));
 const ending=match[2];
 if(/(heit|keit|schaft|tion|tät)$/.test(ending))
   assert.equal(match[1],'die','Strong feminine-ending consistency '+w.de);
 if(/lein$/.test(ending))
   assert.equal(match[1],'das','Diminutive consistency '+w.de);
 const known=genders.get(ending);
 if(known&&!known.has(match[1])){
   clashes++;
   crossArticle.push({word:w.de,history:[...known]});
 }
 const counts=byLevel[w.level];
 counts.pack++;counts.article[match[1]]++;
 if(!historic.has(normalize(w.de)))counts.new++;
}
assert.equal(clashes,0,'Expansion must not contradict existing noun article labels: '+JSON.stringify(crossArticle.slice(0,10)));
assert.ok(!seen.has('die nebenkosten'),'Plural-only housing costs must not appear as singular article quiz headword');
assert.ok(!seen.has('die lebenshaltungskosten'),'Plural-only living costs must not appear as singular article quiz headword');
// Minimum broad coverage that prevents accidental future regression; not an official
// CEFR word count, nor proof that the corpus covers every possible German noun.
for(const [lvl,min] of Object.entries({A1:200,A2:220,B1:330,B2:630,C1:1750,C2:100}))
 assert.ok(byLevel[lvl].pack>=min,'Maintain independently reviewed '+lvl+' vocabulary breadth');
const required={
 A1:['der Finger','der Daumen','die Karotte','die Hand','das Auge','das Ohr'],
 A2:['der Aufzug','die Quittung','die Verspätung','das Rezept','das Ladegerät'],
 B1:['der Bedarf','die Entsorgung','die Arbeitslosigkeit','das Vorwissen','das Stipendium'],
 B2:['der Ansatz','die Querschnittstudie','die Sozialversicherung','das Bildungswesen','das Gegenargument'],
 C1:['die Evidenz','die Längsschnittstudie','die Menschenwürde','der Gegenbeweis','das Hochschulwesen'],
 C2:['der Anachronismus','die Ambivalenz','die Gemengelage','das Ressentiment','das Ansinnen']
};
const complete=new Set([...bank.bank,...bank.curated,...expansion].map(w=>normalize(w.de)));
for(const [lvl,words] of Object.entries(required))
 for(const noun of words)assert.ok(complete.has(normalize(noun)),lvl+' missing essential checked noun: '+noun);
const originalByLevel=Object.fromEntries(levels.map(l=>[l,bank.bank.filter(w=>w.level===l).length]));
const newTotal=levels.reduce((sum,l)=>sum+byLevel[l].new,0);
console.log('ALL_LEVEL_NOUN_AUDIT='+JSON.stringify({
 originalTotal:bank.bank.length,originalByLevel,
 supplementalTotal:expansion.length,
 genuinelyNewVsOriginal:newTotal,
 alreadyPresentInOriginal:expansion.length-newTotal,
 byLevel,articleContradictions:clashes,
 note:'CEFR bands are practice estimates. Original Word Bank also contains verbs and phrases.'
}));
console.log('PASS: A1-C2 noun coverage, gender morphology, historical article consistency, source deduplication and progress safety.');
