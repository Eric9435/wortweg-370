/* Complete Grammar Atlas generation and integration regression checks. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const svg=fs.readFileSync('assets/german-grammar-a1-c2-complete.svg','utf8');
const index=JSON.parse(fs.readFileSync('assets/german-grammar-a1-c2-index.json','utf8'));
const html=fs.readFileSync('grammar-atlas.html','utf8');
const pwa=fs.readFileSync('sw.js','utf8');
const lifetime=fs.readFileSync('lifetime-grammar.html','utf8');
const academy=fs.readFileSync('grammar.js','utf8');
assert(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
assert.match(svg,/<svg\b/);
assert.match(svg,/<\/svg>\s*$/);
assert.equal(index.topics,288);
assert.equal(index.chapters,36);
assert.equal(index.formMatrices,77);
assert.equal(index.reviewedMatrices,48);
assert.equal(index.topicReferences,211);
assert.equal(index.items.length,288);
assert.equal(new Set(index.items.map(t=>t.id)).size,288);
const levels=new Set(index.items.map(t=>t.level));
for(const level of ['A1','A2','B1','B2','C1','C2'])
 assert([...levels].some(x=>x.includes(level)),'Missing CEFR level '+level);
for(let i=0;i<288;i++){
 const t=index.items[i];
 assert.equal(t.id,'T'+String(i+1).padStart(3,'0'),'Topic ID sequence');
 assert(t.x>=0&&t.x+t.width<=index.width,'Out-of-bounds topic x '+t.id);
 assert(t.y>=0&&t.y+t.height<=index.height,'Out-of-bounds topic y '+t.id);
 // Wrapped long headings may span multiple SVG <text> lines; check their prefix.
 const headingPrefix=t.title.slice(0,Math.min(12,t.title.length)).replace(/&/g,'&amp;').replace(/</g,'&lt;');
 assert(svg.includes(headingPrefix),'Topic heading prefix omitted: '+t.id);
 assert(svg.includes('>'+t.id+'<'),'Topic is searchable and identified visually: '+t.id);
}
assert(svg.includes('Nominativ')&&svg.includes('Akkusativ')&&svg.includes('Dativ')&&svg.includes('Genitiv'),
 'Core case declension tables missing');
assert(svg.includes('mein Vater'),'Possessive adjective matrix missing');
assert(svg.includes('Konjunktiv')||svg.includes('Konjunktiv II'),'Advanced grammatical mood missing');
assert(svg.includes('Ich bin 25 Jahre alt.'),'Final T288 topic German example missing');
assert(svg.includes('REVIEWED MATRIX')&&svg.includes('FORM MATRIX')&&svg.includes('TOPIC REFERENCE'),
 'No differentiation between verified paradigms and explanatory reference topics');
assert(svg.includes('77 form matrices (48 reviewed)')&&svg.includes('211 topic references'));
assert(svg.length>200000,'Generated SVG unexpectedly short');
assert(index.height<50000,'Image too tall for common SVG renderers');
for(const p of ['assets/german-grammar-a1-c2-complete.svg','assets/german-grammar-a1-c2-index.json']){
 assert(html.includes(p),'Viewer missing asset '+p);
 assert(pwa.includes('./'+p),'Offline PWA missing asset '+p);
}
assert(!lifetime.includes('href="./grammar-120.html"'),'Old Lifetime toolbar SVG shortcut should move to Home');
assert(!lifetime.includes('href="./grammar-atlas.html"'),'Older 288-table launcher must be removed');
assert(academy.includes("atlasLink.href='./grammar-120.html'"),'Grammar Academy 120-table shortcut missing');
assert(html.includes('pinch')&&html.includes('setZoom')&&html.includes('jump(item)'),'Zoom and search-jump interactions missing');
assert(html.includes('download="WortWeg_Complete_Grammar_A1-C2_288_Tables.svg"'),'SVG download missing');
assert(pwa.includes("const CACHE='wortweg370-v101'"),'Offline cache version must be incremented');
const home=fs.readFileSync('home-refresh.js','utf8');
const overlay=fs.readFileSync('grammar-tables-atlas.js','utf8');
assert(home.includes("id:'grammar-120'")&&home.includes('WortWegGrammarTablesAtlas'),'120-table tile missing from Home');
assert(overlay.includes("./assets/german-grammar-a1-c1-120.svg")&&overlay.includes('pinch'),'Original SVG / pinch viewer missing');
assert(pwa.includes("'./grammar-tables-atlas.js'")&&pwa.includes("'./grammar-tables-atlas.css'"),'Grammar overlay PWA files missing');
const total=fs.statSync('assets/german-grammar-a1-c2-complete.svg').size;
console.log('PASS: WortWeg Grammar Atlas '+index.topics+' topics, '+index.chapters+' chapters, '+index.formMatrices+' form matrices ('+index.reviewedMatrices+' reviewed), '+index.topicReferences+' reference tables, '+index.width+'×'+index.height+', '+total+' bytes');
