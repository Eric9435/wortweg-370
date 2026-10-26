/* WortWeg 370: device-independent, per-Google-account progress. No guest data is uploaded. */
const stores=[
 ['flashcards',u=>'wortweg370-flashcards-v1-'+u],
 ['writing',u=>'wortweg370-writing-v1-'+u],
 ['special',u=>'wortweg370-special-vocabulary-v1:'+u],
 ['curriculum',u=>'wortweg370-curriculum-v1:'+u],
 ['topicReading',u=>'wortweg370-topic-reading-v1:'+u],
 ['expressions',u=>'wortweg370-topic-expressions-v1:'+u],
 ['lessons',u=>'wortweg370-live-progress-v1:'+u],
 ['grammar',u=>'wortweg370-grammar-v1-'+u],
 ['lifetime',u=>'wortweg:lifetime-grammar:review:v1:'+u],
 ['memorized',u=>'wortweg:lifetime-grammar:memorized:v1:'+u],
 ['lastReading',u=>'wortweg370-long-reading-last:'+u]
];
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const stable=x=>Array.isArray(x)?x.map(stable):object(x)?Object.fromEntries(Object.keys(x).sort().filter(k=>!['__proto__','constructor','prototype'].includes(k)).map(k=>[k,stable(x[k])])):x;
const equal=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
const stamp=x=>{if(!object(x))return 0;const t=x.updatedAt||x.lastReviewedAt||x.lastPracticedAt||x.reviewedAt;return typeof t==='number'?t:Date.parse(t||'')||0;};
/* Three-way merging avoids overwriting work completed offline on either device. */
export function mergeStudyData(base,local,cloud){
 if(equal(local,cloud))return local;
 if(equal(local,base))return cloud===undefined?local:cloud;
 if(equal(cloud,base))return local===undefined?cloud:local;
 if(local===undefined)return cloud;
 if(cloud===undefined)return local;
 if(object(local)&&object(cloud)){
  const l=stamp(local),r=stamp(cloud);
  if(l&&r&&l!==r)return l>r?local:cloud;
  const result={};
  for(const key of new Set([...Object.keys(local),...Object.keys(cloud)])){
   // __proto__/constructor keys must never mutate an object's prototype.
   if(key==='__proto__'||key==='constructor'||key==='prototype')continue;
   const value=mergeStudyData(object(base)?base[key]:undefined,local[key],cloud[key]);
   if(value!==undefined)result[key]=value;
  }
  return result;
 }
 // If both devices edited the same scalar offline, preserve this device's
 // value; the pre-merge snapshot is retained in a recovery backup.
 return local;
}
export function createExtraProgressSync({readCloud,writeCloud,onStatus=()=>{}}){
 let uid=null,serial=0,working=false,again=false,interval=null,debounce=null;
 const baselineKey=u=>'wortweg370-extras-baseline-v1:'+u;
 const prefix='wortweg370-extras-backup-v1:';
 const eligible=u=>typeof u==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(u);
 function fromLocal(u){
  const data={};
  for(const [name,key] of stores){
   try{const value=localStorage.getItem(key(u));if(value!==null){data[name]=JSON.parse(value);}}catch{}
  }
  return data;
 }
 function baseline(u){try{return JSON.parse(localStorage.getItem(baselineKey(u))||'{}')||{};}catch{return {};}}
 function saveLocal(u,records){
  let changed=false;
  for(const [name,key] of stores){
   if(!(name in records))continue;
   const path=key(u),next=JSON.stringify(records[name]),previous=localStorage.getItem(path);
   if(previous===next)continue;
   // Keep the user's original device data before applying anything from cloud.
   if(previous!==null){
    try{localStorage.setItem(prefix+u+':'+name+':'+Date.now(),previous);}catch{}
   }
   try{localStorage.setItem(path,next);changed=true;}catch{onStatus('Storage full: existing progress was preserved.');}
  }
  if(changed){
   window.dispatchEvent(new CustomEvent('wortweg:account',{detail:{...window.WortWegAccountSnapshot,syncedProgress:true}}));
   window.dispatchEvent(new Event('wortweg:sync-applied'));
  }
 }
 async function sync(){
  if(!uid)return;
  if(working){again=true;return;}
  const u=uid,t=serial;working=true;
  try{
   const local=fromLocal(u),base=baseline(u);
   const payload=await readCloud(u);
   if(t!==serial)return;
   const cloud=object(payload?.extraProgress?.records)?payload.extraProgress.records:{};
   const merged=mergeStudyData(base,local,cloud)||{};
   if(!equal(merged,cloud)){
    // A recoverable pre-merge copy protects cloud-only edits during conflicts.
    if(Object.keys(cloud).length){try{localStorage.setItem(prefix+u+':cloud:'+Date.now(),JSON.stringify(cloud));}catch{}}
    await writeCloud(u,merged);
   }
   if(t!==serial)return;
   saveLocal(u,merged);
   localStorage.setItem(baselineKey(u),JSON.stringify(merged));
   if(!equal(merged,cloud)||!equal(local,merged))onStatus('Learning progress synced across devices');
  }catch(error){
   if(t===serial)onStatus('Saved on this device · account sync will retry');
  }finally{
   working=false;
   if(again&&uid){again=false;queue();}
  }
 }
 function queue(){if(!uid)return;clearTimeout(debounce);debounce=setTimeout(sync,1000);}
 function start(userId){
  stop();
  if(!eligible(userId))return;
  uid=userId;serial++;
  queue();
  interval=setInterval(()=>{if(document.visibilityState!=='hidden')void sync();},20000);
 }
 function stop(){uid=null;serial++;clearTimeout(interval);clearTimeout(debounce);interval=null;debounce=null;again=false;}
 window.addEventListener('online',queue);
 window.addEventListener('focus',queue);
 window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queue();});
 for(const event of ['wortweg:changed','wortweg:flashcards-changed','wortweg:grammar-changed','wortweg:live-progress-changed']){
  window.addEventListener(event,queue);
 }
 window.WortWegExtraProgress={sync:queue,getStores:()=>stores.map(([name])=>name)};
 return {start,stop,sync};
}
