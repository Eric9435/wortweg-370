'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
assert.match(html,/localStorage: /);
assert.match(html,/backup\/checkpoint: /);
assert.match(html,/Export progress/);
assert.match(html,/Retry saving/);
assert.match(html,/quizCheckpointFailed=false/);
assert.match(html,/clearWarningIfSafe\(\)/);
assert.match(sw,/wortweg370-v76/);
const start=html.indexOf('function quotaError('),end=html.indexOf('function progressDatabase(',start);
assert.ok(start>0&&end>start);
const body="let storageLocalError='none';\n"+html.slice(start,end)+"\nthis.tryLocalSave=tryLocalSave;this.errorName=()=>storageLocalError;";
const quota=Object.assign(new Error('Storage limit reached'),{name:'QuotaExceededError'});
const removed=[],records=new Map([['wortweg370-live-pack-v1','downloadable lesson cache']]);
const store={
 getItem:key=>records.get(key)??null,
 setItem:(key,value)=>{if(records.has('wortweg370-live-pack-v1'))throw quota;records.set(key,value)},
 removeItem:key=>{removed.push(key);records.delete(key)}
};
const ctx={localStorage:store,Error,Number,String};vm.createContext(ctx);vm.runInContext(body,ctx);
assert.equal(ctx.tryLocalSave('wortweg370-progress-v3:guest','important progress'),true,'retry after deleting only re-downloadable pack');
assert.deepEqual(removed,['wortweg370-live-pack-v1'],'never delete progress or user-owned history');
assert.equal(records.get('wortweg370-progress-v3:guest'),'important progress');
assert.equal(ctx.errorName(),'none','recovered writes clear the error status');
const failed={localStorage:{getItem:()=>null,setItem:()=>{throw quota},removeItem:()=>{throw quota}},Error,Number,String};
vm.createContext(failed);vm.runInContext(body,failed);
assert.equal(failed.tryLocalSave('wortweg370-progress-v3:guest','important progress'),false);
assert.equal(failed.errorName(),'QuotaExceededError');
console.log('PASS: Safari storage failure diagnostics, recoverable cache-only eviction, and retry UI');
