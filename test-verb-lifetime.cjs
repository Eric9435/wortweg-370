/* WortWeg Lifetime V1/V2/V3 dataset regression checks. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const data=JSON.parse(fs.readFileSync('assets/german-verbs-lifetime.json','utf8'));
assert.equal(data.version,1);
assert(data.rows.length>=7900,'Expected broad Wiktionary-derived verb dictionary');
assert(data.license.includes('CC BY-SA'),'Wiktionary data attribution must be present');
const forms=new Map();
for(const row of data.rows){
 assert.equal(row.length,4,'Every dictionary row needs V1, V2, V3 and auxiliary');
 assert(row[0]&&row[1]&&row[2],'No empty principal parts');
 assert(!forms.has(row[0]),'Duplicate lemma '+row[0]);
 forms.set(row[0],row);
}
for(const [v1,v2,v3] of [
 ['gehen','ging','gegangen'],
 ['abfahren','fuhr ab','abgefahren'],
 ['abstrahieren','abstrahierte','abstrahiert'],
 ['abwiegen','wog ab','abgewogen'],
 ['bereiten','bereitete','bereitet'],
 ['anrufen','rief an','angerufen'],
 ['aufstehen','stand auf','aufgestanden']
])assert.deepEqual(forms.get(v1)?.slice(1,3),[v2,v3],'Incorrect verb: '+v1);
assert(!forms.has('angemessen'),'Adjective incorrectly included as verb');
const index=fs.readFileSync('index.html','utf8');
const start=index.indexOf('<script type="application/json" id="data">');
assert(start>0,'WortWeg Word Bank missing');
const begin=index.indexOf('>',start)+1,end=index.indexOf('</script>',begin);
const bank=JSON.parse(index.slice(begin,end)).bank;
const lemmas=[...new Map(bank.filter(w=>['verb','modal verb','verb phrase'].includes(w.type)).map(w=>[w.de,w])).values()];
assert(lemmas.length>=350,'Expected explicit WortWeg verb entries');
const script=fs.readFileSync('verb-lifetime.js','utf8');
new vm.Script(script,{filename:'verb-lifetime.js'});
const manual=['ad absurdum führen','sein','zugrunde legen','abschätzen','extrapolieren','generalisieren','attribuieren','dekonstruieren','dissimulieren','fragmentieren','kanonisieren','kontextualisieren','rekontextualisieren','vergegenwärtigen','verobjektivieren','verschränken','zuspitzen'];
const manualSet=new Set(manual);
const unresolved=lemmas.map(w=>w.de.toLowerCase().replace(/^sich /,'').replace(/ von$/,'')).filter(w=>!forms.has(w)&&!manualSet.has(w));
assert.deepEqual(unresolved,[],'Unresolved WortWeg verbs: '+unresolved);
const page=fs.readFileSync('verb-forms.html','utf8');
const home=fs.readFileSync('home-refresh.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const native=fs.readFileSync('mobile/scripts/prepare.mjs','utf8');
for(const token of ['verb-lifetime.js','id="collection"','id="level"','id="status"','CC BY-SA 4.0','Myanmar · WortWeg / Auto'])assert(page.includes(token),'Missing UI '+token);
assert(home.includes("['verb','modal verb','verb phrase'].includes(w.type)"),'Home must use explicit POS tagging');
assert(home.includes("source:v3"),'Home must send only verb rows');
assert(sw.includes("'./assets/german-verbs-lifetime.json'"),'Offline PWA dictionary missing');
assert(sw.includes("'./assets/german-verbs-myanmar.json'"),'Offline Myanmar glossary missing');
assert(native.includes("'verb-lifetime.js'"),'Offline Android/iOS code missing');
assert(native.includes("'assets/german-verbs-myanmar.json'"),'Native app must package the Myanmar glossary');
const gloss=JSON.parse(fs.readFileSync('assets/german-verbs-myanmar.json','utf8'));
assert.equal(gloss.version,1);
assert.equal(gloss.rows.length,8000,'All 8000 verbs need a Myanmar gloss or an explicit review flag');
const expected=new Set([...forms.keys(),...manual]);
const seen=new Set();
let markedForReview=0;
for(const [lemma,meaning] of gloss.rows){
 assert(!seen.has(lemma),'Duplicate Myanmar gloss '+lemma);
 assert(expected.has(lemma),'Unknown lemma '+lemma);
 assert.equal(typeof meaning,'string');
 assert(meaning.trim(),'Missing translation / status for '+lemma);
 if(meaning.includes('စစ်ဆေးရန်'))markedForReview++;
 seen.add(lemma);
}
assert.equal(seen.size,expected.size,'Myanmar translations should cover every verb lemma');
assert.equal(markedForReview,6,'Six unattested rare meanings must be flagged, not fabricated');
const exampleLemmas=new Set();let exampleCount=0,reviewExamples=0;
for(let part=1;part<=16;part++){
 const id=String(part).padStart(2,'0');
 const data=JSON.parse(fs.readFileSync('assets/verb-sentences/part-'+id+'.json','utf8'));
 assert.equal(data.version,1);assert.equal(data.part,part);
 for(const row of data.rows){
  assert.equal(row.length,11,'One lemma, 3 German, 3 English, 3 Myanmar, review status');
  const [lemma,...rest]=row;
  assert(expected.has(lemma),'Unknown example lemma '+lemma);
  assert(!exampleLemmas.has(lemma),'Duplicate example lemma '+lemma);
  assert.equal([...lemma].reduce((n,ch)=>n+ch.codePointAt(0),0)%16+1,part,'Incorrect example bucket');
  for(const field of rest.slice(0,9))assert(typeof field==='string'&&field.trim(),'Blank example for '+lemma);
  assert([0,1].includes(row[10]),'Bad review flag');
  exampleLemmas.add(lemma);exampleCount++;reviewExamples+=row[10];
 }
}
assert.equal(exampleCount,8000,'All 8000 verbs must have 3 trilingual sentences');
assert.equal(reviewExamples,44,'Keep automated translation and reconstruction review flags');
assert(page.includes('id="verb-example-dialog"'),'Trilingual modal must be in verb dictionary');
assert(script.includes('showVerbExamples(item)'),'Example action must be wired');

console.log('PASS lifetime V1/V2/V3:',data.rows.length,'dictionary lemmas,',lemmas.length,'WortWeg explicit verb headwords');
