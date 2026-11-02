/* Structural and content regression tests for the standalone Sentence Builder. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const data=read('sentence-builder-data.js');
const lifetime1=read('sentence-builder-lifetime-1.js');
const lifetime2=read('sentence-builder-lifetime-2.js');
const app=read('sentence-builder.js');
const html=read('sentence-builder.html');
const sw=read('sw.js');
const home=read('home-refresh.js');
const native=read('mobile/scripts/prepare.mjs');
new vm.Script(data,{filename:'sentence-builder-data.js'});
new vm.Script(lifetime1,{filename:'sentence-builder-lifetime-1.js'});
new vm.Script(lifetime2,{filename:'sentence-builder-lifetime-2.js'});
new vm.Script(app,{filename:'sentence-builder.js'});
new vm.Script(home,{filename:'home-refresh.js'});
const ctx={window:{}};
vm.runInNewContext(data,ctx);
vm.runInNewContext(lifetime1,ctx);
vm.runInNewContext(lifetime2,ctx);
const course=ctx.window.WortWegSentenceData;
assert.equal(course.lessons.length,36);
const levelCounts=Object.fromEntries(['A1','A2','B1','B2','C1','C2'].map(lv=>[lv,course.lessons.filter(l=>l.level===lv).length]));
assert.deepEqual(levelCounts,{A1:4,A2:4,B1:4,B2:4,C1:4,C2:4});
assert.equal(course.lessons.reduce((n,x)=>n+x.items.length,0),360);
assert.equal(new Set(course.lessons.map(x=>x.id)).size,36);
for(const lesson of course.lessons){
 assert.equal(lesson.items.length,10,'Each title must have 10 exercises');
 assert(lesson.explanation.length>25 && lesson.formula.length>10,'Missing grammar explanation');
 const translations=new Set();
 for(const item of lesson.items){
  assert(/[.!?]$/.test(item.en)&&/[.!?]$/.test(item.de),'Sentence punctuation missing');
  assert(item.de.split(/\s+/).length>=3,'Too-short word-card answer');
  assert(!translations.has(item.de),'Duplicate exercise in '+lesson.id);
  translations.add(item.de);
  const forms=course.verbs[item.verb];
  assert(Array.isArray(forms)&&forms.length===4,'Missing V1/V2/V3 for '+item.de);
  assert(forms.every(Boolean),'Incomplete principal parts');
 }
}
for(const filename of ['sentence-builder.html','sentence-builder.css','sentence-builder-data.js','sentence-builder-lifetime-1.js','sentence-builder-lifetime-2.js','sentence-builder.js']){
 assert(sw.includes("'./"+filename+"'"),filename+' not precached for offline use');
 assert(native.includes("'"+filename+"'"),filename+' not included in native bundle');
 if(filename!=='sentence-builder.html')assert(html.includes(filename),'Page missing '+filename);
}
assert(home.includes("title:'Lifetime Sentence Builder'"),'Missing home menu tile');
assert(home.includes("window.location.href='./sentence-builder.html'"),'Home tile not linked');
for(const feature of ['pointerdown','pointermove','pointerup','word-tile','localStorage','progress:v1','showAnswerButton','isTargetSentence','firstUnmastered']){
 assert(app.includes(feature),'Missing Sentence Builder feature: '+feature);
}
assert(html.includes('id="answerZone"')&&html.includes('id="wordBank"'));
console.log('PASS: Sentence Builder has 36 topics × 10 exercises, touch input, progress and native/offline integration');