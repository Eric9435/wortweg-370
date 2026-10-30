/* Lifetime Grammar index/asset coverage regression check. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-examples.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js','lifetime-grammar-exact-1.js','lifetime-grammar-exact-2.js','lifetime-grammar-exact-3.js','lifetime-grammar-exact-4.js','lifetime-grammar-verified-matrices.js','lifetime-grammar-myanmar-1.js','lifetime-grammar-myanmar-2.js']){
 const code=fs.readFileSync(file,'utf8');
 new vm.Script(code,{filename:file});
 vm.runInContext(code,ctx,{timeout:5000});
}
for(const path of ['lifetime-grammar.js','ios-polish.js','sw.js'])new vm.Script(fs.readFileSync(path,'utf8'),{filename:path});
const chapters=ctx.window.WWGLifeIndex,lessons=ctx.window.WWGLifeLessons,rules=ctx.window.WWGLifeRules;
const exact=ctx.window.WWGLifeExact,matrices=ctx.window.WWGLifeVerifiedMatrices;
assert.equal(exact.length,288,'288 exact-topic examples are required');
assert.equal(ctx.window.WWGLifeMyanmar.length,288,'288 Myanmar meanings required');
for(let i=0;i<288;i++){assert.equal(ctx.window.WWGLifeMyanmar[i].id,exact[i].id);assert(/[\u1000-\u109f]/.test(ctx.window.WWGLifeMyanmar[i].my));}
assert.equal(new Set(exact.map(x=>x.id)).size,288,'No duplicate example IDs');
assert(Object.keys(matrices).length>=40,'At least 40 fully tabulated priority topics');
for(let i=0;i<288;i++){assert.equal(exact[i].id,'T'+String(i+1).padStart(3,'0'));assert(exact[i].de.length>7&&exact[i].en.length>3);}
for(const [id,m] of Object.entries(matrices)){assert(m.cols.length>=2);assert(m.rows.length>=2,id+' needs multiple rows');m.rows.forEach(row=>assert.equal(row.length,m.cols.length,id+' row length mismatch'));}
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
for(const f of ['lifetime-grammar.html','lifetime-grammar.css','lifetime-grammar.js','lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-examples.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js','lifetime-grammar-exact-1.js','lifetime-grammar-exact-2.js','lifetime-grammar-exact-3.js','lifetime-grammar-exact-4.js','lifetime-grammar-verified-matrices.js']){
 assert(fs.existsSync(f),f+' missing');
 assert(sw.includes(f),'PWA cache missing '+f);
 assert(native.includes(f),'Offline native packaging missing '+f);
 if(f.endsWith('.js'))assert(html.includes(f),'Standalone load missing '+f);
}
assert(fs.readFileSync('ios-polish.js','utf8').includes('ww-lifetime-grammar-launch'),'Lifetime home-menu launcher missing');
assert(fs.readFileSync('lifetime-grammar.js','utf8').includes('authoredRules:focusedRules.length'));
assert(sw.includes("fallback=path===lifetimePath?'./lifetime-grammar.html':")&&sw.includes("path===posterPath?'./grammar-120.html':")&&sw.includes("path===dialogPath?'./dialog.html':'./index.html'"),'Offline subpage fallback missing');
console.log('PASS: 36 chapters, 288 bilingual topics/rules/topic-specific examples; verified paradigms, offline/native coverage');
