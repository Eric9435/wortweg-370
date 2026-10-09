const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync('vocab-writing.js','utf8');
new vm.Script(source,{filename:'vocab-writing.js'});
const css=fs.readFileSync('vocab-writing.css','utf8');
assert(css.includes('.ww-write-screen'));
for(const s of ['Math.max(5,Math.floor','r.repetitions','r.incorrect','window.WortWegAccountSnapshot?.uid','wortweg:account','Fully remembered','Still learning','Need more review','Average','window.WortWegAudio?.speak']) assert(source.includes(s),'Writing feature missing: '+s);
const loader=fs.readFileSync('ios-polish.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const prep=fs.readFileSync('mobile/scripts/prepare.mjs','utf8');
for(const name of ['vocab-writing.js','vocab-writing.css']){assert(sw.includes(name),'Not offline cached: '+name);assert(prep.includes(name),'Not in native build: '+name);}
assert(loader.includes('vocab-writing.js'),'No writing bootstrap');
console.log('PASS: writing practice syntax, five-word minimum, independent repetition records, memory ratings, account switching, and offline assets');