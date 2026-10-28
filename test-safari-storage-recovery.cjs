'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const cloud=fs.readFileSync('cloud.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.match(html,/Promise\.allSettled\(\[progressDatabase\('get',p\),progressCache\('get',p\)\]\)/);
assert.match(html,/\+\+progressRevision;return restoreOfflineState\(\)/);
assert.match(html,/window\.WortWeg\.storageReady=restoreOfflineState\(\)/);
assert.match(cloud,/await window\.WortWeg\.storageReady/);
assert.match(cloud,/await window\.WortWeg\.switchProfile\(user.uid\)/);
assert.match(cloud,/if\(uploadNeeded\|\|hasPending\(user.uid\)\)queueCore\(\)/);
assert.match(sw,/const CACHE='wortweg370-v\d+'/,'PWA cache must use a versioned namespace');
const start=html.indexOf('function progressDatabase('),end=html.indexOf('function saveProgressBackup(',start);
assert.ok(start>0&&end>start,'backup transaction implementation exists');
const dbSource=html.slice(start,html.indexOf('let emergencyCacheWriteQueue=',start));
const values=new Map();let installed=false;
const db={
 objectStoreNames:{contains:()=>installed},
 createObjectStore:()=>{installed=true},
 close:()=>{},
 transaction:()=>{const tx={error:null};tx.objectStore=()=>({
  put:(value,key)=>{const req={};queueMicrotask(()=>{values.set(key,value);req.result=key;req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return req;},
  get:key=>{const req={};queueMicrotask(()=>{req.result=values.get(key);req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return req;}
 });return tx;}
};
const indexedDB={open:()=>{const req={};queueMicrotask(()=>{req.result=db;if(!installed)req.onupgradeneeded?.();req.onsuccess?.()});return req}};
const sandbox={indexedDB,window:{indexedDB},Promise,Error};vm.createContext(sandbox);
vm.runInContext(dbSource,sandbox,{filename:'progress-database.js'});
const progressDatabase=vm.runInContext('progressDatabase',sandbox);
(async()=>{
 const guest={data:{answered:4,correct:3,items:{},seen:{},history:[]},savedAt:600};
 const alice={data:{answered:8,correct:7,items:{},seen:{},history:[]},savedAt:700};
 await progressDatabase('put','guest',guest);
 await progressDatabase('put','alice',alice);
 assert.deepEqual(await progressDatabase('get','guest'),guest);
 assert.deepEqual(await progressDatabase('get','alice'),alice);
 assert.equal(await progressDatabase('get','missing'),undefined);
 const disabled={window:{},Promise,Error};vm.createContext(disabled);vm.runInContext(dbSource,disabled);
 await assert.rejects(vm.runInContext('progressDatabase',disabled)('get','guest'),/IndexedDB unavailable/);
 console.log('PASS: IndexedDB progress backup, account isolation, blocked storage and cloud recovery ordering');
})().catch(error=>{console.error(error);process.exitCode=1});
