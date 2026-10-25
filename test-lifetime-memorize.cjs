/* Offline memorization-library coverage and live DOM regression. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const ctx={window:{}};vm.createContext(ctx);
const datasets=['lifetime-memorize-1.js','lifetime-memorize-2.js'];
for(const p of datasets){new vm.Script(fs.readFileSync(p,'utf8'),{filename:p});vm.runInContext(fs.readFileSync(p,'utf8'),ctx);}
const data=ctx.window.WWGMemoTables;
assert.equal(data.length,48,'48 memory charts expected');
assert.equal(new Set(data.map(x=>x.id)).size,48,'no duplicate IDs');
const byId=new Map(data.map(x=>[x.id,x]));
for(let i=0;i<data.length;i++){const t=data[i];assert.equal(t.id,'M'+String(i+1).padStart(3,'0'));assert(/[\u1000-\u109f]/.test(t.my));assert(t.en&&t.note&&t.category&&t.ref);assert(t.columns.length>=2&&t.rows.length>=3,t.id);for(const row of t.rows)assert.equal(row.length,t.columns.length,t.id);}
const matrix=id=>byId.get(id).rows;
assert.deepEqual(Array.from(matrix('M001')[0]),['Nominativ','der','die','das','die']);
assert.deepEqual(Array.from(matrix('M001')[1]),['Akkusativ','den','die','das','die']);
assert.deepEqual(Array.from(matrix('M001')[2]),['Dativ','dem','der','dem','den']);
assert.deepEqual(Array.from(matrix('M001')[3]),['Genitiv','des','der','des','der']);
assert(matrix('M003').find(row=>row[0]==='Dativ')[4]==='keinen');
assert(matrix('M013').find(row=>row[0]==='Dativ')[4]==='denen','Dative plural relative pronoun must be denen');
assert(matrix('M016').find(row=>row[0]==='Genitiv')[1]==='-en','strong masc gen adjective is -en');
assert(matrix('M018').find(row=>row[0]==='Dativ')[4]==='-en','mixed plural adjective is -en');
assert(matrix('M028').find(row=>row[1]==='sehen')[2]==='siehst','irregular stem vowel change');
const dom=new JSDOM(fs.readFileSync('lifetime-grammar.html','utf8'),{url:'https://example.com/wortweg-370/lifetime-grammar.html',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.scrollTo=()=>{};for(const p of ['lifetime-grammar-index-1.js','lifetime-grammar-index-2.js','lifetime-grammar-examples.js','lifetime-grammar-rules-1.js','lifetime-grammar-rules-2.js','lifetime-grammar-exact-1.js','lifetime-grammar-exact-2.js','lifetime-grammar-exact-3.js','lifetime-grammar-exact-4.js','lifetime-grammar-verified-matrices.js','lifetime-grammar-myanmar-1.js','lifetime-grammar-myanmar-2.js',...datasets,'lifetime-memorize.js','lifetime-grammar.js'])w.eval(fs.readFileSync(p,'utf8'));
const $=sel=>w.document.querySelector(sel);
assert.equal(w.WortWegLifetime.memorizationTables,48);
assert.equal(w.WortWegLifetime.tables,288);
w.WortWegLifetime.openMemorization();assert($('#wl-root').textContent.includes('Memorization Tables'));assert.equal(w.document.querySelectorAll('.wl-memo-topic').length,48);
const first=w.document.querySelector('.wl-memo-topic');first.click();assert($('#wl-root h1').textContent.includes('M001'));
assert.equal(w.document.querySelectorAll('.wl-memo-table tbody tr').length,4);
const hide=Array.from(w.document.querySelectorAll('button')).find(x=>x.textContent.includes('Hide answers'));assert(hide);hide.click();
assert(w.document.querySelectorAll('.wl-memo-reveal').length>=16);assert(!w.document.querySelector('.wl-memo-table').textContent.includes('der'));
const reveal=w.document.querySelector('.wl-memo-reveal');reveal.click();assert(reveal.classList.contains('wl-memo-revealed'));
const memo=Array.from(w.document.querySelectorAll('button')).find(x=>x.textContent==='Mark as memorized');assert(memo);memo.click();assert.equal(w.WortWegMemorization.getCount(),1);
assert(w.localStorage.getItem('wortweg:lifetime-grammar:memorized:v1'));
w.location.hash='#T025';w.dispatchEvent(new w.Event('hashchange'));assert($('#wl-root h1').textContent.includes('T025'),'existing Lifetime lesson remains available');
for(const p of ['lifetime-memorize-1.js','lifetime-memorize-2.js','lifetime-memorize.js']){const src=fs.readFileSync('sw.js','utf8');assert(src.includes("'./"+p+"'"),'offline cache missing '+p);assert(fs.readFileSync('mobile/scripts/prepare.mjs','utf8').includes("'"+p+"'"),'native packaging missing '+p);assert(fs.readFileSync('lifetime-grammar.html','utf8').includes('src="./'+p+'"'),'HTML loading missing '+p);}
dom.window.close();console.log('PASS: 48 grammatically checked memorization tables, 288 existing lessons, reveal/hide, local progress, offline assets, native packaging and navigation');
