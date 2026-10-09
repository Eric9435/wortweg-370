// No dependencies; validates grammar coverage and offline asset packaging.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('grammar.js','utf8');
const match=(pattern,label)=>{const v=js.match(pattern);assert(v,label+' not found');return JSON.parse(v[1]);};
const topics=match(/const TOPICS=(\{.*?\});\nconst LESSONS=/s,'TOPICS');
const base=match(/const LESSONS=(\[.*?\]);\nconst LEVELS=/s,'LESSONS');
const files=[['grammar-expanded.js','WortWegGrammarExtra'],['grammar-more-a1-a2.js','WortWegGrammarMoreA'],['grammar-more-b1.js','WortWegGrammarMoreB1'],['grammar-more-b2.js','WortWegGrammarMoreB2'],['grammar-more-c1.js','WortWegGrammarMoreC1']];
let all=[...base];const required=new Set();const seen=new Set();
for(const [path,key] of files){const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path,'utf8'),sandbox,{filename:path,timeout:1000});assert(Array.isArray(sandbox.window[key]),'Missing lesson data '+key);all=all.concat(sandbox.window[key]);}
for(const [level,raw] of Object.entries(topics)){const titles=raw.split('|');assert.equal(titles.length,40,level+' topic count');for(const title of titles)required.add(level+'|'+title);}
assert.equal(required.size,200);assert.equal(all.length,200);
for(const row of all){assert.equal(row.length,12,'Lesson shape: '+row[1]);assert(row.every(v=>typeof v==='string'&&v.trim()),'Empty field in '+row[1]);assert.equal(new Set(row.slice(8)).size,4,'Duplicate options: '+row[1]);const key=row[0]+'|'+row[1];assert(required.has(key),'Unknown grammar topic '+key);assert(!seen.has(key),'Duplicate grammar topic '+key);seen.add(key);}
assert.equal(seen.size,200);
const loader=fs.readFileSync('ios-polish.js','utf8'),sw=fs.readFileSync('sw.js','utf8'),prepare=fs.readFileSync('mobile/scripts/prepare.mjs','utf8');
for(const path of files.map(x=>x[0]).concat('grammar.js','grammar.css')){assert(loader.includes(path)||path==='grammar.css','Web bootstrap missing '+path);assert(sw.includes(path),'PWA cache missing '+path);assert(prepare.includes(path),'Native bundle missing '+path);}
console.log('PASS: 200 unique, structurally valid interactive grammar lessons across A1–C1; web/PWA/native asset references present');
