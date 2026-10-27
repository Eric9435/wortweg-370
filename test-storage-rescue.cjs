'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const cloud=fs.readFileSync('cloud.js','utf8');
assert.match(html,/<script src="\.\/storage-rescue\.js\?v=1"><\/script>/);
assert.match(html,/window\.WortWeg\.storageReady=restoreProfile\(\)/);
assert.match(sw,/storage-rescue\.js/);
assert.match(cloud,/await window\.WortWeg\.switchProfile\(user.uid\)/);
assert.match(html,/__wwSavedAt/);
const data=new Map();
let exists=false;
const db={
 objectStoreNames:{contains:()=>exists},
 createObjectStore:()=>{exists=true},
 close:()=>{},
 transaction:()=>{
  const tx={error:null};
  tx.objectStore=()=>({
   put:(value,key)=>{const request={};
    queueMicrotask(()=>{data.set(key,value);request.result=key;request.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});
    return request;
   },
   get:key=>{const request={};
    queueMicrotask(()=>{request.result=data.get(key);request.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});
    return request;
   }
  });
  return tx;
 }
};
const indexedDB={open:()=>{const request={};
 queueMicrotask(()=>{request.result=db;if(!exists)request.onupgradeneeded?.();request.onsuccess?.()});
 return request;
}};
const context={window:{},indexedDB,Promise,Number,JSON,Error};
vm.createContext(context);
vm.runInContext(fs.readFileSync('storage-rescue.js','utf8'),context,{filename:'storage-rescue.js'});
const backup=context.window.WortWegStorageBackup;
const make=(answers,stamp)=>JSON.stringify({answered:answers,correct:answers,items:{},seen:{},history:[],__wwSavedAt:stamp});
(async()=>{
 const key='wortweg370-progress-v3:guest';
 // Simulates both Safari localStorage quota rejection and a blocked localStorage API:
 // only the independent IndexedDB shadow can persist these writes.
 await Promise.all([backup.write(key,make(1,100)),backup.write(key,make(2,101))]);
 let restored=await backup.recover(key,0);
 assert.equal(restored.value.answered,2,'latest rapid quiz answer is preserved');
 assert.equal(restored.timestamp,101);
 assert.equal(await backup.recover(key,101),null,'up-to-date local progress is never overwritten');
 assert.equal(await backup.recover(key,105),null,'newer local progress takes priority');
 await backup.write('wortweg370-progress-v3:user2',make(6,110));
 restored=await backup.recover('wortweg370-progress-v3:user2',0);
 assert.equal(restored.value.answered,6,'accounts remain isolated');
 assert.equal((await backup.recover(key,0)).value.answered,2);
 data.set('broken','not-json');
 assert.equal(await backup.recover('broken',0),null,'invalid backup cannot reset valid progress');
 const withoutIDB={window:{},Promise,Number,JSON,Error};
 vm.runInNewContext(fs.readFileSync('storage-rescue.js','utf8'),withoutIDB);
 assert.equal(await withoutIDB.window.WortWegStorageBackup.recover(key,0),null);
 await assert.rejects(withoutIDB.window.WortWegStorageBackup.write(key,make(1,1)),/IndexedDB unavailable/);
 console.log('PASS: IndexedDB shadow saves, per-profile isolation, latest-answer recovery, and blocked-storage handling');
})().catch(e=>{console.error(e);process.exitCode=1});
