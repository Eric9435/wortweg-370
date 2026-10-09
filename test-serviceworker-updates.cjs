const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const code=fs.readFileSync('sw.js','utf8');
const listeners={};
const scope='https://eric9435.github.io/wortweg-370/';
const endpoint=scope+'content/v1/pack.json';
const uiEndpoint=scope+'settings.js';
const seenEndpoint=scope+'seen-words.js';
const audioEndpoint=scope+'audio.js';
const response=(version)=>({ok:true,version,clone(){return response(version)}});
const saved=new Map([[endpoint,response(1)],[uiEndpoint,response(1)],[seenEndpoint,response(1)],[audioEndpoint,response(1)]]);
const self={registration:{scope},addEventListener(name,listener){listeners[name]=listener},clients:{claim:async()=>{}}};
const caches={
 open:async()=>({put:async(request,res)=>saved.set(request.url,res)}),
 match:async request=>saved.get(typeof request==='string'?new URL(request,scope).href:request.url),
 keys:async()=>[]
};
let offline=false;
const requests=[];
const fetch=async request=>{
 const url=typeof request==='string'?request:request.url;
 requests.push(url);
 if(offline)throw Error('offline');
 return response(url===endpoint?2:3);
};
vm.runInNewContext(code,{self,caches,fetch,URL});
async function request(url){
 const event={request:{method:'GET',url,mode:'cors'},respondWith(p){this.response=p}};
 listeners.fetch(event);
 assert.ok(event.response,'The service worker intercepts '+url);
 return event.response;
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const online=await request(endpoint);
 assert.equal(online.version,2,'Live lesson pack beats a stale cached copy');
 await flush();
 assert.equal(saved.get(endpoint).version,2,'Latest lesson data is saved for offline use');
 const freshSettings=await request(uiEndpoint);
 assert.equal(freshSettings.version,3,'Updated UI script must win over stale settings.js cache');
 const freshAudio=await request(audioEndpoint);
 assert.equal(freshAudio.version,3,'Pronunciation script must refresh without stale cache');
 const freshSeen=await request(seenEndpoint);
 assert.equal(freshSeen.version,3,'New Seen Words script is refreshed as well');
 await flush();
 assert.equal(saved.get(uiEndpoint).version,3,'Settings script is updated in offline cache');
 assert.equal(saved.get(seenEndpoint).version,3,'Seen Words script is updated in offline cache');
 assert.equal(saved.get(audioEndpoint).version,3,'German speech script stays offline-ready');
 offline=true;
 assert.equal((await request(endpoint)).version,2,'Lessons continue working offline');
 assert.equal((await request(uiEndpoint)).version,3,'Settings and main menu work offline');
 assert.equal((await request(audioEndpoint)).version,3,'German speech script still works offline');
 assert.equal((await request(seenEndpoint)).version,3,'Seen Words works offline');
 assert.equal(requests.length,8,'Every lesson/UI/audio request checks network before fallback');
 assert.match(code,/audio\.js/,'Audio script is refreshed from network before cache');
 assert.match(code,/seen-words\.js/,'Seen Words JS is installed with the offline app shell');
 assert.match(code,/seen-words\.css/,'Seen Words CSS is installed with the offline app shell');
 assert.match(code,/key\.startsWith\('wortweg370-voice-'\)/,'Downloaded speech cache is never deleted');
 assert.match(code,/self\.skipWaiting\(\)/,'New service worker activates promptly');
 assert.match(code,/self\.clients\.claim\(\)/,'New service worker takes control promptly');
 console.log('PASS: fresh UI scripts and lesson data refresh correctly, remain offline-ready, and voice cache survives upgrades.');
})().catch(e=>{console.error(e);process.exitCode=1});