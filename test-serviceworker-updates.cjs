const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const code=fs.readFileSync('sw.js','utf8');
const listeners={};
const scope='https://eric9435.github.io/wortweg-370/';
const endpoint=scope+'content/v1/pack.json';
let networkVersion=2,requests=0,cachedVersion=1;
const response=version=>({ok:true,version,clone(){return response(version)}});
const self={registration:{scope},addEventListener(name,listener){listeners[name]=listener},clients:{claim:async()=>{}}};
const caches={
 open:async()=>({put:async(request,res)=>{cachedVersion=res.version}}),
 match:async()=>response(cachedVersion),
 keys:async()=>[]
};
let offline=false;
const fetch=async()=>{requests++;if(offline)throw Error('offline');return response(networkVersion)};
vm.runInNewContext(code,{self,caches,fetch,URL});
async function request(){
 const event={request:{method:'GET',url:endpoint,mode:'cors'},respondWith(p){this.response=p}};
 listeners.fetch(event);
 assert.ok(event.response,'A lesson request must be intercepted');
 return event.response;
}
(async()=>{
 const online=await request();
 assert.equal(online.version,2,'Network is preferred over the stale pre-cache');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(cachedVersion,2,'Fresh lesson response is cached for offline');
 offline=true;
 const fallback=await request();
 assert.equal(fallback.version,2,'Offline mode returns the latest saved JSON');
 assert.equal(requests,2,'Updater makes a network attempt before falling back');
 console.log('PASS: lesson feed is network-first, refreshes cached content and remains offline-capable.');
})().catch(e=>{console.error(e);process.exitCode=1});
