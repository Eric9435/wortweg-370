'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('quiz-checkpoint.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
new vm.Script(js,{filename:'quiz-checkpoint.js'});
const start=html.indexOf("<script>\n(()=>{'use strict';\nconst DATA=");
assert.ok(start>=0,'core app script present');
new vm.Script(html.slice(start+8,html.indexOf('</script>',start)),{filename:'wortweg-app.js'});
assert.ok(html.includes('window.WortWegQuizCheckpoint.save(currentProfile,payload)'),'quiz writes to fallback');
assert.ok(html.includes('window.WortWegQuizCheckpoint.finish(profile,quiz?.id)'),'finished sessions are tombstoned');
assert.ok(html.includes('restoreQuizCheckpoint();window.WortWeg.storageReady'),'startup restores quiz');
assert.ok(sw.includes('./quiz-checkpoint.js?v=1'),'PWA precaches checkpoint module');
const rows=new Map(), db={
 objectStoreNames:{contains:()=>true},
 close:()=>{},
 transaction:()=>{
  const tx={pending:0,error:null};
  function request(op){
   tx.pending++;
   const req={result:undefined};
   queueMicrotask(()=>{
    try{req.result=op();req.onsuccess?.()}catch(error){tx.error=error;req.onerror?.()}
    if(--tx.pending===0)queueMicrotask(()=>tx.oncomplete?.());
   });
   return req;
  }
  tx.objectStore=()=>({
   put:(value,key)=>request(()=>{rows.set(key,value);return key}),
   get:key=>request(()=>rows.get(key))
  });
  return tx;
 }
};
const indexedDB={
 open:()=>{
  const req={result:db};
  queueMicrotask(()=>req.onsuccess?.());
  return req;
 }
};
function launch(){
 const window={indexedDB};
 vm.runInNewContext(js,{window,indexedDB,Promise,Error,Date,Number,String,Array},{filename:'quiz-checkpoint.js'});
 return window.WortWegQuizCheckpoint;
}
function quiz(id,i){return {v:1,id,updatedAt:100+i,finished:false,keys:['b:1','b:2','b:3'],i,score:i,wrong:[],label:'Practice',kind:'new',locked:false,chosen:-1,opts:[]};}
(async()=>{
 const first=launch();
 await first.save('guest',quiz('a',0));
 await first.save('guest',quiz('a',1));
 let restored=await first.load('guest');
 assert.equal(restored.i,1,'latest checkpoint retained');
 assert.deepEqual(Array.from(restored.keys),['b:1','b:2','b:3']);
 await first.save('user-2',quiz('b',2));
 assert.equal((await first.load('user-2')).i,2,'account-specific checkpoint retained');
 assert.equal((await first.load('guest')).i,1,'account isolation maintained');
 const reopened=launch();
 assert.equal((await reopened.load('guest')).i,1,'reload recovers quiz');
 await reopened.finish('guest','a');
 assert.equal((await reopened.load('guest')).finished,true,'finished quiz never reappears');
 assert.equal((await reopened.load('user-2')).finished,false,'other account unchanged');
 await reopened.save('guest',quiz('new-quiz',0));
 assert.equal((await reopened.load('guest')).id,'new-quiz','new quiz starts independently');
 const window={};vm.runInNewContext(js,{window,Promise,Error,Date,Number,String,Array});
 await assert.rejects(window.WortWegQuizCheckpoint.save('guest',quiz('x',0)),/IndexedDB unavailable/);
 console.log('PASS: resume checkpoints, restart, completion, account isolation and storage denial');
})().catch(error=>{console.error(error);process.exitCode=1});
