// Regression tests for cross-device progress, account isolation and offline preservation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('extra-progress-sync.js','utf8').replace(/^export /gm,'');
const data=new Map();
const localStorage={getItem:key=>data.has(key)?data.get(key):null,setItem:(key,v)=>data.set(key,String(v)),removeItem:key=>data.delete(key)};
const events=[];
const window={WortWegAccountSnapshot:{uid:'userA'},addEventListener:()=>{},dispatchEvent:e=>events.push(e.type)};
const context={localStorage,window,document:{visibilityState:'visible'},setTimeout,clearTimeout,setInterval,clearInterval,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},Event:class{constructor(type){this.type=type}}};
vm.createContext(context);
vm.runInContext(code+'\n;globalThis.TestSync={mergeStudyData,createExtraProgressSync}',context);
const {mergeStudyData,createExtraProgressSync}=context.TestSync;
const copy=x=>JSON.parse(JSON.stringify(x));
const merge=(a,b,c)=>copy(mergeStudyData(a,b,c));
const prior={flashcards:{'b:1':{repetitions:1}},grammar:{a1:{mastered:true}}};
const mine={flashcards:{'b:1':{repetitions:2}},grammar:{a1:{mastered:true}}};
const their={flashcards:{'b:1':{repetitions:1},'b:2':{repetitions:4}},grammar:{a1:{mastered:true}}};
assert.deepEqual(merge(prior,mine,their).flashcards,{'b:1':{repetitions:2},'b:2':{repetitions:4}});
let cloud={extraProgress:{records:{flashcards:{'b:2':{repetitions:4}},special:{learned:{k1:true}}}}},writes=0,offline=false;
const readCloud=async()=>{if(offline)throw Error('offline');return copy(cloud);};
const writeCloud=async(_,records)=>{if(offline)throw Error('offline');writes++;cloud.extraProgress={version:1,records:copy(records)};};
localStorage.setItem('wortweg370-flashcards-v1-userA',JSON.stringify({'b:1':{repetitions:2}}));
localStorage.setItem('wortweg370-grammar-v1-userA',JSON.stringify({a1:{mastered:true}}));
localStorage.setItem('wortweg370-flashcards-v1-guest',JSON.stringify({'b:guest':{repetitions:7}}));
const sync=createExtraProgressSync({readCloud,writeCloud});
(async()=>{
 sync.start('userA');await sync.sync();
 assert.equal(writes,1);
 let result=JSON.parse(localStorage.getItem('wortweg370-flashcards-v1-userA'));
 assert.equal(result['b:1'].repetitions,2);assert.equal(result['b:2'].repetitions,4);
 assert.equal(JSON.parse(localStorage.getItem('wortweg370-special-vocabulary-v1:userA')).learned.k1,true);
 assert.equal(JSON.parse(localStorage.getItem('wortweg370-flashcards-v1-guest'))['b:guest'].repetitions,7);
 assert.ok(events.includes('wortweg:sync-applied'));
 // Another device with the same identity downloads the same history.
 const second=new Map();const original=localStorage.getItem;
 localStorage.getItem=k=>second.has(k)?second.get(k):null;
 localStorage.setItem=(k,v)=>second.set(k,String(v));
 await sync.sync();
 result=JSON.parse(localStorage.getItem('wortweg370-flashcards-v1-userA'));
 assert.equal(result['b:1'].repetitions,2);assert.equal(result['b:2'].repetitions,4);
 // An offline update is retained and uploaded after reconnection.
 result['b:3']={repetitions:6};localStorage.setItem('wortweg370-flashcards-v1-userA',JSON.stringify(result));
 offline=true;await sync.sync();assert.equal(JSON.parse(localStorage.getItem('wortweg370-flashcards-v1-userA'))['b:3'].repetitions,6);
 offline=false;await sync.sync();assert.equal(cloud.extraProgress.records.flashcards['b:3'].repetitions,6);
 sync.stop();localStorage.getItem=original;
 console.log('Cloud learning sync tests passed');
})().catch(error=>{sync.stop();console.error(error);process.exitCode=1});
