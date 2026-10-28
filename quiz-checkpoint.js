/* WortWeg 370 — durable account-scoped quiz checkpoints for Safari.
   Separate from learning history so quiz resume can survive localStorage quota errors.
   Never deletes progress, vocabulary data, or an existing session. */
(()=>{
 'use strict';
 const DB='wortweg370-quiz-checkpoint-v1', STORE='sessions';
 const queues=new Map(),knownManifests=new Map();
 function withStore(mode,work){
  return new Promise((resolve,reject)=>{
   if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}
   let request,settled=false;
   function fail(error){if(settled)return;settled=true;reject(error||new Error('Quiz storage unavailable'));}
   try{request=indexedDB.open(DB,1);}catch(error){fail(error);return;}
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);
   };
   request.onblocked=()=>fail(new Error('Quiz backup blocked by another tab'));
   request.onerror=()=>fail(request.error);
   request.onsuccess=()=>{
    const db=request.result;
    if(settled){db.close();return;}
    try{
     const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
     let result;
     tx.oncomplete=()=>{db.close();if(!settled){settled=true;resolve(result);}};
     tx.onerror=()=>{db.close();fail(tx.error)};
     tx.onabort=()=>{db.close();fail(tx.error)};
     work(store,value=>{result=value});
    }catch(error){db.close();fail(error);}
   };
  });
 }
 function queue(profile,run){
  const previous=queues.get(profile)||Promise.resolve();
  const task=previous.catch(()=>{}).then(run);
  queues.set(profile,task);
  task.finally(()=>{if(queues.get(profile)===task)queues.delete(profile)}).catch(()=>{});
  return task;
 }
 function keys(profile){return [String(profile)+':manifest',String(profile)+':cursor'];}
 function save(profile,payload){
  if(!payload||!Array.isArray(payload.keys)||!payload.id)return Promise.reject(new Error('Invalid quiz checkpoint'));
  const p=String(profile),id=String(payload.id),[mk,ck]=keys(p);
  return queue(p,async()=>{
   const newManifest=knownManifests.get(p)!==id;
   const {keys:wordKeys,...cursor}=payload;
   await withStore('readwrite',store=>{
    if(newManifest)store.put({...payload,i:0,score:0,wrong:[],locked:false,chosen:-1,opts:[]},mk);
    store.put(cursor,ck);
   });
   knownManifests.set(p,id);
  });
 }
 function finish(profile,id){
  const p=String(profile),[mk,ck]=keys(p);
  const marker={v:1,finished:true,id:id||'',updatedAt:Date.now()};
  return queue(p,async()=>{
   await withStore('readwrite',store=>{store.put(marker,mk);store.put(marker,ck)});
   knownManifests.delete(p);
  });
 }
 async function load(profile){
  const p=String(profile),pending=queues.get(p);
  if(pending)await pending.catch(()=>{});
  const [mk,ck]=keys(p);
  const rows=await withStore('readonly',(store,result)=>{
   const data={manifest:null,cursor:null};
   const a=store.get(mk),b=store.get(ck);
   a.onsuccess=()=>{data.manifest=a.result;};
   b.onsuccess=()=>{data.cursor=b.result;};
   // The transaction completes after both requests, so return the shared object.
   result(data);
  });
  const m=rows?.manifest,c=rows?.cursor;
  if(!m)return null;
  if(m.finished)return m;
  if(m.v!==1||!Array.isArray(m.keys)||!m.id)return null;
  if(c&&c.id===m.id&&Number(c.updatedAt)>=Number(m.updatedAt))
   return {...m,...c,keys:m.keys};
  return m;
 }
 window.WortWegQuizCheckpoint={save,finish,load};
})();
