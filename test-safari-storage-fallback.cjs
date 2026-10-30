'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.match(sw,/wortweg370-v71/);
assert.match(html,/function progressCache\(mode,p,record\)/);
assert.match(html,/function persistQuizSessionBackup\(p,payload\)/);
assert.match(html,/return Promise\.all\(\[recoverIndexedProgress\(\),recoverQuizSession\(\)\]\)/);
assert.match(html,/quizCheckpointFailed=true/);
assert.match(html,/quizSession:pendingSession\(\)/);
function block(from,to){
 const a=html.indexOf(from),b=html.indexOf(to,a+from.length);
 assert(a>0&&b>a, 'source block '+from);
 return html.slice(a,b);
}
const cachesData=new Map();
const cache={put:async(req,res)=>{cachesData.set(req.url,await res.text())},
 match:async(req)=>cachesData.has(req.url)?new Response(cachesData.get(req.url)):undefined};
const caches={open:async()=>cache};
const fake={caches,location:{href:'https://example.com/wortweg-370/index.html'},
 window:{caches},Request,Response,URL,Promise,JSON,Error,Number,
 validProgress:value=>Boolean(value&&Number.isFinite(value.answered))};
vm.createContext(fake);
vm.runInContext(block('let emergencyCacheWriteQueue=Promise.resolve();', 'function saveProgressBackup('),fake);
const progressCache=vm.runInContext('progressCache',fake);
(async()=>{
 const state={data:{answered:5,correct:4,items:{},seen:{},history:[]},savedAt:1000};
 await progressCache('put','guest',state);
 assert.equal((await progressCache('get','guest')).data.answered,5);
 assert.equal(await progressCache('get','other'),null);
 const session={data:{v:1,updatedAt:2000,id:'quiz1',keys:['b:1'],i:0,score:0,label:'A1'},savedAt:2000};
 await progressCache('put','quiz-session:guest',session);
 assert.equal((await progressCache('get','quiz-session:guest')).data.id,'quiz1');

 const fallback=new Map();
 const p='guest';
 const context={JSON,Number,BANK:[{id:1}],CURATED:[],quizSessionFallback:fallback,profile:p,
 sessionKey:()=> 'session:guest',sessionCursorKey:()=> 'cursor:guest',
 localStorage:{getItem:()=>{throw new Error('QuotaDenied')}}};
 vm.createContext(context);
 vm.runInContext(block('function pendingSession(){','function refreshQuizResume('),context);
 const pending=vm.runInContext('pendingSession',context);
 const open={v:1,updatedAt:2001,finished:false,id:'quiz1',keys:['b:1'],i:0,score:0,label:'A1'};
 fallback.set('guest',open);
 assert.equal(pending().id,'quiz1','Quiz position resumes when localStorage is blocked');
 fallback.set('guest',{v:1,finished:true,updatedAt:2002});
 assert.equal(pending(),null,'completed quiz does not reappear');
 console.log('PASS: independent emergency cache, per-profile quiz resume and finished checkpoint');
})().catch(e=>{console.error(e);process.exitCode=1});
