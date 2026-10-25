/* Lifetime Grammar index/asset coverage regression check. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-examples.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js']){
 const code=fs.readFileSync(file,'utf8');
 new vm.Script(code,{filename:file});
 vm.runInContext(code,ctx,{timeout:5000});
}
for(const path of ['lifetime-grammar.js','ios-polish.js','sw.js'])new vm.Script(fs.readFileSync(path,'utf8'),{filename:path});
const chapters=ctx.window.WWGLifeIndex,lessons=ctx.window.WWGLifeLessons,rules=ctx.window.WWGLifeRules;
assert.equal(chapters.length,36,'36 distinct chapters required');
assert.equal(lessons.length,200,'Existing trilingual authored lessons must be retained');
assert.equal(rules.length,288,'Each table needs an authored focused rule');
assert.deepEqual([...chapters.map(x=>x.chapter)],Array.from({length:36},(_,i)=>i+1));
const entries=chapters.flatMap(x=>{assert.equal(x.topics.length,8,x.en+' must have 8 tables');assert(x.en&&x.my&&x.level);return x.topics;});
assert.equal(entries.length,288);
assert.equal(new Set(entries.map(x=>x.id)).size,288,'Duplicate table IDs');
entries.forEach((t,i)=>{assert.equal(t.id,'T'+String(i+1).padStart(3,'0'));assert(t.en.length>8);assert(/[\u1000-\u109F]/.test(t.my),'Myanmar title missing: '+t.id);assert(rules[i].length>30,'Rule too brief: '+t.id);});
assert(lessons.every(x=>x.rule&&x.pattern&&x.de&&x.en&&x.my&&x.question&&x.options.length===4),'Incomplete existing trilingual lesson');
const html=fs.readFileSync('lifetime-grammar.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const native=fs.readFileSync('mobile/scripts/prepare.mjs','utf8');
for(const f of ['lifetime-grammar.html','lifetime-grammar.css','lifetime-grammar.js','lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-examples.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js']){
 assert(fs.existsSync(f),f+' missing');
 assert(sw.includes(f),'PWA cache missing '+f);
 assert(native.includes(f),'Offline native packaging missing '+f);
 if(f.endsWith('.js'))assert(html.includes(f),'Standalone load missing '+f);
}
assert(fs.readFileSync('ios-polish.js','utf8').includes('ww-lifetime-grammar-launch'),'Lifetime home-menu launcher missing');
assert(fs.readFileSync('lifetime-grammar.js','utf8').includes('authoredRules:focusedRules.length'));
assert(sw.includes("fallback=path===lifetimePath?'./lifetime-grammar.html':'./index.html'"),'Offline subpage fallback missing');
console.log('PASS: 36 chapters, 288 unique bilingual table IDs, 288 authored rules, 200 references, isolated offline web/native workspace');
