/* Verifies that GitHub Pages serves the actual current source files.
   Run from GitHub Actions (external network) after every main-branch push. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const root='https://eric9435.github.io/wortweg-370/';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function get(path){
 const url=new URL(path,root);
 url.searchParams.set('deploycheck',process.env.GITHUB_SHA||'latest');
 const res=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});
 if(!res.ok)throw Error(path+' returned HTTP '+res.status+' at '+url);
 return Buffer.from(await res.arrayBuffer());
}
async function check(){
 const homepage=(await get('index.html')).toString('utf8');
 assert(homepage.includes('WortWeg'),'The published Home is not WortWeg');
 const html=(await get('lifetime-grammar.html')).toString('utf8');
 assert(html.includes('Lifetime Grammar A1–C2'),'The Lifetime Grammar page is missing');
 assert(html.includes('lifetime-grammar-myanmar-2.js'),'The published HTML is an older version');
 const scripts=[...new Set([...html.matchAll(/<script[^>]*src="\.(\/[^"]+)"/g)].map(m=>m[1].replace(/^\//,'')))];
 assert(scripts.length>=12,'Expected Lifetime Grammar JS bundles to be referenced');
 const assets=[...new Set([...scripts,'lifetime-grammar.css','ios-polish.js','sw.js'])];
 for(const path of assets){
   const [published,local]=await Promise.all([get(path),fs.readFile(path)]);
   assert.equal(sha(published),sha(local),'Published asset is stale or differs from main: '+path);
 }
 const worker=(await get('sw.js')).toString('utf8');
 assert(worker.includes("'./lifetime-grammar.html'"),'Lifetime page missing from offline app shell');
 assert(worker.includes('wortweg370-v56')||/const CACHE='wortweg370-v\d+'/.test(worker),'No versioned PWA cache');
 console.log('PASS: GitHub Pages HTTP 200; Home, Lifetime Grammar, and '+assets.length+' published assets match the checked-out commit.');
}
(async()=>{
 let error;
 for(let i=1;i<=12;i++){
   try{await check();return;}catch(e){
     error=e;
     console.log('Verification attempt '+i+'/12: '+e.message);
     if(i<12)await sleep(10000);
   }
 }
 console.error('FAIL: Live deployment did not match the checked-out main commit:',error);
 process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
