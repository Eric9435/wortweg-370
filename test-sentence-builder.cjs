/* Structural and content regression tests for the standalone Sentence Builder. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const data=read('sentence-builder-data.js');
const app=read('sentence-builder.js');
const html=read('sentence-builder.html');
const sw=read('sw.js');
const home=read('home-refresh.js');
const native=read('mobile/scripts/prepare.mjs');
new vm.Script(data,{filename:'sentence-builder-data.js'});
new vm.Script(app,{filename:'sentence-builder.js'});
new vm.Script(home,{filename:'home-refresh.js'});
const ctx={window:{}};
vm.runInNewContext(data,ctx);
const course=ctx.window.WortWegSentenceData;
assert.equal(course.lessons.length,12);
assert.equal(course.lessons.reduce((n,x)=>n+x.items.length,0),120);
assert.equal(new Set(course.lessons.map(x=>x.id)).size,12);
for(const lesson of course.lessons){
 assert.equal(lesson.items.length,10,'Each title must have 10 exercises');
 assert(lesson.explanation.length>25 && lesson.formula.length>10,'Missing grammar explanation');
 const translations=new Set();
 for(const item of lesson.items){
  assert(item.en.endsWith('.')&&item.de.endsWith('.'),'Sentence punctuation missing');
  assert(item.de.split(/\s+/).length>=3,'Too-short word-card answer');
  assert(!translations.has(item.de),'Duplicate exercise in '+lesson.id);
  translations.add(item.de);
  const forms=course.verbs[item.verb];
  assert(Array.isArray(forms)&&forms.length===4,'Missing V1/V2/V3 for '+item.de);
  assert(forms.every(Boolean),'Incomplete principal parts');
 }
}
for(const filename of ['sentence-builder.html','sentence-builder.css','sentence-builder-data.js','sentence-builder.js']){
 assert(sw.includes("'./"+filename+"'"),filename+' not precached for offline use');
 assert(native.includes("'"+filename+"'"),filename+' not included in native bundle');
 if(filename!=='sentence-builder.html')assert(html.includes(filename),'Page missing '+filename);
}
assert(home.includes("title:'Sentence Builder'"),'Missing home menu tile');
assert(home.includes("window.location.href='./sentence-builder.html'"),'Home tile not linked');
for(const feature of ['pointerdown','pointermove','pointerup','word-tile','localStorage','progress:v1','showAnswerButton','isTargetSentence','firstUnmastered']){
 assert(app.includes(feature),'Missing Sentence Builder feature: '+feature);
}
assert(html.includes('id="answerZone"')&&html.includes('id="wordBank"'));
console.log('PASS: Sentence Builder has 12 topics × 10 exercises, touch input, progress and native/offline integration');