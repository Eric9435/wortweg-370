/* WortWeg UI/UX regression smoke test: run with node test-quality-2026.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const home=read('home-refresh.js'),css=read('quality-2026.css'),ux=read('quality-2026.js');
const sw=read('sw.js'),native=read('mobile/scripts/prepare.mjs');
const goethe=read('goethe-exam.js'),data=read('goethe-exam-data.js');
for(const [file,source] of [['home-refresh.js',home],['quality-2026.js',ux],['goethe-exam.js',goethe],['goethe-exam-data.js',data]]){
 new vm.Script(source,{filename:file});
}
assert.match(home,/wwq-module-search/,'Home learning tool finder should exist');
assert.match(home,/filterLearningTools/,'Home search should filter modules');
assert.match(home,/goethe-exam\.html/,'Home Goethe destination should stay accessible');
assert.match(home,/gender-lifetime\.html/,'Home Gender destination should stay accessible');
assert.match(home,/top\.after\(zone\)/,'New launcher should be additive');
assert.doesNotMatch(home,/ww-home-combined-visual/,'Do not replace the original pie');
assert.doesNotMatch(css,/\.ww-donut-[a-z0-9_-]+\s*\{/i,'Quality CSS must not rewrite pie styling');
const sourcePie=read('seen-words.js'),homePie=read('home-premium.css');
assert.match(sourcePie,/ww-donut-grammar-completed/,'Keep the grammar progress ring');
assert.match(sourcePie,/r:66/,'Keep the vocabulary progress ring');
assert.match(sourcePie,/105,start\+\.2/,'Keep CEFR progress ring');
assert.match(homePie,/ww-donut-hero/,'Keep the original pie layout stylesheet');
assert.match(ux,/wwq-skip/,'Keyboard skip navigation should exist');
assert.match(css,/prefers-reduced-motion/,'Reduced-motion support is required');
assert.match(css,/focus-visible/,'Visible keyboard focus is required');
assert.match(css,/data-mode=dark/,'Standalone dark mode must be supported');
assert.match(goethe,/ArrowRight/,'Goethe tabs should support keyboard navigation');
const pages=[
 'a1-complete-reader.html','a2-complete-reader.html','b1-complete-reader.html',
 'b2-complete-reader.html','c1-complete-reader.html','c2-complete-reader.html',
 'complete-reading.html','complete-reading-level.html','dialog.html',
 'lifetime-grammar.html','grammar-120.html','gender-lifetime.html','goethe-exam.html'
];
for(const page of pages){
 const source=read(page);
 assert.match(source,/quality-2026\.css/,page+' missing quality CSS');
 assert.match(source,/quality-2026\.js/,page+' missing keyboard/theme helper');
}
for(const asset of ['quality-2026.css','quality-2026.js','goethe-exam.html','gender-lifetime.html']){
 assert(sw.includes("'./"+asset+"'"),'Offline cache missing '+asset);
 assert(native.includes("'"+asset+"'"),'Native package missing '+asset);
}
assert.match(sw,/wortweg370-v94/,'Offline cache version should be updated');
console.log('PASS: 13 learning pages, home finder, accessibility, offline/native bundles, original pie preserved.');
