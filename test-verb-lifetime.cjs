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
for(const token of ['verb-lifetime.js','id="collection"','id="level"','id="status"','CC BY-SA 4.0','Myanmar (WortWeg)'])assert(page.includes(token),'Missing UI '+token);
assert(home.includes("['verb','modal verb','verb phrase'].includes(w.type)"),'Home must use explicit POS tagging');
assert(home.includes("source:v3"),'Home must send only verb rows');
assert(sw.includes("'./assets/german-verbs-lifetime.json'"),'Offline PWA dictionary missing');
assert(native.includes("'verb-lifetime.js'"),'Offline Android/iOS code missing');
console.log('PASS lifetime V1/V2/V3:',data.rows.length,'dictionary lemmas,',lemmas.length,'WortWeg explicit verb headwords');
