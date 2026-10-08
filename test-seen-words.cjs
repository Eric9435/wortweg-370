const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const DATA={bank:[
 {id:1,de:'der Abend',en:'evening',mm:'ညနေ',level:'A1',pron:'အာဘန်'},
 {id:2,de:'die Adresse',en:'address',mm:'လိပ်စာ',level:'A1'},
 {id:3,de:'arbeiten',en:'work',mm:'အလုပ်လုပ်',level:'A2'},
 {id:4,de:'lernen',en:'learn',mm:'သင်ယူ',level:'B1'}
],curated:[{id:'t1-1',de:'der Name',en:'name',mm:'နာမည်',level:'A1'}],topics:[]};
const html='<!doctype html><html><body class="ww-game-interface"><main>'+
 '<section id="dashboard" class="section active"><div class="ww-main-menu"><div class="ww-menu-top">Hello</div><div class="ww-menu-options"><button data-nav="study">Start learning</button><button data-nav="review">Review mistakes</button></div></div></section>'+
 '<section id="study" class="section"></section></main>'+
 '<script type="application/json" id="data">'+JSON.stringify(DATA)+'</script></body></html>';
const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only'});
const w=dom.window;w.scrollTo=()=>{};w.structuredClone=structuredClone;
let progress={
 answered:6,correct:3,history:[],seen:{'b:1':true,'b:2':true,'c:der name':true},
 items:{'b:1':{wrong:0,streak:0},'b:2':{wrong:1,streak:0},'c:der name':{wrong:2,streak:1}}
};
const livepack={lessons:[{id:'hello',title:'Hello',level:'A1',words:[
 {id:'guten-tag',de:'Guten Tag',en:'Good day',my:'မင်္ဂလာပါ'},
 {id:'danke',de:'Danke',en:'Thank you',my:'ကျေးဇူး'}]}]};
let liveprogress={'guten-tag':{answered:1,correct:0,lastCorrect:false,wrong:1}};
let sound='';
w.WortWeg={getProgress:()=>structuredClone(progress),navigate:id=>{
 for(const page of w.document.querySelectorAll('.section'))page.classList.toggle('active',page.id===id);
}};
w.WortWegLive={getPack:()=>livepack,getProgress:()=>liveprogress};
w.WortWegAudio={speak:word=>{sound=word;}};
const script=fs.readFileSync('seen-words.js','utf8');
new (require('node:vm').Script)(script,{filename:'seen-words.js'});
w.eval(script);
const $=id=>w.document.getElementById(id);
let state=w.WortWegSeenWords.getSummary();
assert.equal(state.total,7,'Bank, Topic 1 and New Lessons sources all count toward catalogue');
assert.equal(state.seen,4,'Only answered entries count as seen');
assert.equal(state.remaining,3,'Remaining subtracts seen only once');
assert.deepEqual(state.totals.get('A1'),{total:2,seen:2},'A1 refers to Word Bank, not generic quiz completion');
assert.deepEqual(state.totals.get('Topic 1'),{total:1,seen:1});
assert.deepEqual(state.totals.get('New lessons'),{total:2,seen:1});
assert.ok($('ww-seen-home').textContent.includes('3 left to explore'));
assert.ok($('ww-seen-home').textContent.includes('0 remaining · 100%'));
assert.ok($('seen'),'There is a dedicated all-words page');
assert.ok(w.document.querySelector('[data-nav="seen"]'),'Main menu has a Seen Words navigation link');
w.WortWegSeenWords.open();
assert.ok($('seen').classList.contains('active'),'Seen Words navigation uses original router');
assert.equal($('ww-seen-rows').children.length,4,'All four answered entries display in table');
assert.equal(w.document.querySelectorAll('#ww-seen-rows tr.ww-seen-missed').length,3,'Wrong answers render red');
assert.ok($('ww-seen-rows').textContent.includes('Answered correctly later'),'Recovered mistakes remain highlighted for review');
w.document.querySelector('#ww-seen-rows button[aria-label="Hear German pronunciation for der Abend"]').click();
assert.equal(sound,'der Abend','Each answer row has a real playback action');
$('ww-seen-status').value='wrong';$('ww-seen-status').dispatchEvent(new w.Event('change'));
assert.equal($('ww-seen-rows').children.length,3,'Incorrect-only filter works');
$('ww-seen-level').value='Topic 1';$('ww-seen-level').dispatchEvent(new w.Event('change'));
assert.equal($('ww-seen-rows').children.length,1,'Topic 1 category filter works');
$('ww-seen-level').value='all';$('ww-seen-status').value='all';$('ww-seen-search').value='Adresse';
$('ww-seen-search').dispatchEvent(new w.Event('input'));
assert.equal($('ww-seen-rows').children.length,1,'Search filters German vocabulary');
$('ww-seen-search').value='';$('ww-seen-search').dispatchEvent(new w.Event('input'));
progress={...progress,answered:7,correct:4,items:{...progress.items,'b:1':{wrong:0,streak:0}}};
w.dispatchEvent(new w.Event('wortweg:changed'));
assert.equal(w.WortWegSeenWords.getSummary().seen,4,'Repeating old answers does not inflate seen count');
progress={answered:0,correct:0,history:[],seen:{},items:{}};
liveprogress={};
w.dispatchEvent(new w.CustomEvent('wortweg:account',{detail:{uid:'another'}}));
setTimeout(()=>{
 try{
  state=w.WortWegSeenWords.getSummary();
  assert.equal(state.seen,0,'Switching accounts never leaks previous account entries');
  assert.equal($('ww-seen-rows').children.length,0,'Account switching clears the old visible word table');
  assert.equal($('ww-seen-empty').hidden,false,'New accounts see honest empty state');
  const css=fs.readFileSync('seen-words.css','utf8');
  const settings=fs.readFileSync('settings.js','utf8');
  const prepare=fs.readFileSync('mobile/scripts/prepare.mjs','utf8');
  const live=fs.readFileSync('live-content.js','utf8');
  assert.match(css,/ww-seen-missed/,'Missed words have their own color');
  assert.match(css,/prefers-reduced-motion/,'Reduced motion remains supported');
  assert.match(settings,/seen-words\.js/,'Web loads seen-word history');
  assert.match(prepare,/seen-words\.css/,'Offline APK includes seen-word styles');
  assert.match(prepare,/seen-words\.js/,'Offline APK includes seen-word logic');
  assert.match(live,/wortweg:live-progress-changed/,'New lessons trigger visual refresh');
  const production=fs.readFileSync('index.html','utf8');
  const json=production.match(/<script type="application\/json" id="data">([\s\S]+?)<\/script>/);
  assert.ok(json,'The bundled catalogue is accessible locally without web requests');
  const bank=JSON.parse(json[1]);
  assert.equal(bank.bank.length,10876,'All 10,876 Word Bank entries are included');
  assert.equal(bank.curated.length,41,'The 41 curated Topic 1 entries remain available');
  dom.window.close();
  console.log('PASS: Seen Words table, missed colors, playback, A1 progress, guest isolation, offline packaging and original vocabulary catalogue.');
 }catch(error){dom.window.close();console.error(error);process.exitCode=1;}
},5);