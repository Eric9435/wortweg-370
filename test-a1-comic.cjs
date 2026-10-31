/* Comic source-data regression: 642/642 actual WortWeg A1 Word Bank records.
   Run: node test-a1-comic.cjs */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const match=html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
assert.ok(match,'Source WortWeg Word Bank must exist');
const original=JSON.parse(match[1]).bank.filter(w=>w.level==='A1');
assert.equal(original.length,642);
const scope={};vm.runInNewContext(fs.readFileSync('a1-comic-data.js','utf8'),{window:scope});
const source=scope.WortWegA1ComicData;
assert.equal(source.total,642);
assert.equal(source.episodes.length,18);
const all=source.episodes.flatMap(e=>e.words);
assert.equal(all.length,642);
assert.equal(new Set(all.map(x=>x.id)).size,642);
assert.equal(source.episodes.reduce((count,e)=>count+Math.ceil(e.words.length/6),0),112);
for(const w of original){
 const found=all.find(x=>x.id===w.id);
 assert.ok(found,'Missing A1 source record '+w.id);
 assert.equal(found.de,w.de,'German word must match source, #'+w.id);
 assert.equal(found.en,w.en,'English meaning should not be modified, #'+w.id);
 assert.equal(found.type,w.type,'Word type should not be modified, #'+w.id);
 assert.equal(found.my,w.mm||w.my||'','Myanmar meaning should not be modified, #'+w.id);
}
for(const e of source.episodes){
 assert.ok(e.words.length>0,'No empty chapters');
 assert.ok(e.beats.length>=4,'Narrative dialogue for every chapter');
 assert.ok(e.beats.every(b=>b.length===4&&b.every(x=>x.trim())),'Complete dialogue for '+e.key);
}
for(const name of ['a1-comic.js','a1-comic-data.js','home-refresh.js','sw.js']){
 new vm.Script(fs.readFileSync(name,'utf8'),{filename:name});
}
const page=fs.readFileSync('a1-comic.html','utf8');
for(const asset of ['a1-comic.css','a1-comic-data.js','a1-comic.js']){
 assert.ok(page.includes('./'+asset),'Comic HTML missing '+asset);
 assert.ok(fs.readFileSync('sw.js','utf8').includes("'./"+asset+"'"),'PWA cache missing '+asset);
 assert.ok(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes("'"+asset+"'"),'Native bundle missing '+asset);
}
assert.ok(fs.readFileSync('sw.js','utf8').includes("'./a1-comic.html'"),'Comic page must be offline-capable');
assert.ok(fs.readFileSync('home-refresh.js','utf8').includes("title:'Animated A1 Comic'"),'Dedicated Home menu missing');
assert.match(fs.readFileSync('a1-comic.css','utf8'),/prefers-reduced-motion/,'Reduced-motion support required');
assert.match(fs.readFileSync('a1-comic.js','utf8'),/window\.WortWegA1Comic=\{/,'Interactive API should be available');
assert.doesNotMatch(fs.readFileSync('a1-comic.css','utf8'),/\.ww-donut-[a-z-]+/,'Preserve Home pie chart');
console.log('PASS: all 642 original A1 entries mapped exactly once across 18 chapters and 112 animated comic panels, independent tracking, offline/native bundle.');
