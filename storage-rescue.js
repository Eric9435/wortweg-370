/* WortWeg 370 · resilient core progress shadow storage.
   Never deletes learning history, account data, or quiz checkpoints. */
(()=>{
 'use strict';
 const DB='wortweg370-core-backup-v1',STORE='progress';
 let writes=Promise.resolve();
 function transaction(mode,run){
  return new Promise((resolve,reject)=>{
   if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return}
   let request;
   try{request=indexedDB.open(DB,1)}catch(error){reject(error);return}
   request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
   };
   request.onerror=()=>reject(request.error||new Error('Cannot open progress backup'));
   request.onblocked=()=>reject(new Error('Progress backup database blocked'));
   request.onsuccess=()=>{
    const db=request.result;
    try{
     const tx=db.transaction(STORE,mode);
     let result;
     tx.oncomplete=()=>{db.close();resolve(result)};
     tx.onerror=()=>{db.close();reject(tx.error||new Error('Progress transaction failed'))};
     tx.onabort=()=>{db.close();reject(tx.error||new Error('Progress transaction aborted'))};
     const operation=run(tx.objectStore(STORE));
     operation.onsuccess=()=>{result=operation.result};
    }catch(error){db.close();reject(error)}
   };
  });
 }
 function write(key,serialized){
  // Serializing writes preserves the latest quiz answer even during rapid taps.
  const operation=writes.catch(()=>{}).then(()=>transaction('readwrite',store=>store.put(serialized,key)));
  writes=operation;
  return operation;
 }
 async function recover(key,localTimestamp){
  try{
   // Finish preceding writes before choosing the newest copy.
   await writes.catch(()=>{});
   const serialized=await transaction('readonly',store=>store.get(key));
   if(typeof serialized!=='string')return null;
   const value=JSON.parse(serialized);
   if(!value||!Number.isFinite(value.answered)||!Number.isFinite(value.correct)||
      !value.items||!value.seen||!Array.isArray(value.history))return null;
   const timestamp=Number(value.__wwSavedAt)||0;
   if(timestamp<=Number(localTimestamp||0))return null;
   return {value,timestamp};
  }catch{return null}
 }
 window.WortWegStorageBackup={write,recover};
})();
