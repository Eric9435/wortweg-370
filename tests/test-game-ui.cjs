const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html='<!doctype html><html><head><meta name="theme-color" content="#fff"></head><body><header><div class="brand"><h1>WortWeg 370</h1></div></header><main><section id="dashboard" class="section active"><div class="card">Legacy dashboard</div></section><section id="study" class="section"><div class="card">Practice</div></section><section id="topics" class="section"></section><section id="bank" class="section"></section><section id="review" class="section"></section><section id="stats" class="section"></section></main><div class="bottom"><nav></nav></div></body></html>';
const dom=new JSDOM(html,{url:'https://eric9435.github.io/wortweg-370/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener:()=>{}});
let tonesPlayed=0;
const ramps=[],gains=[];
w.AudioContext=class {
 constructor(){this.state='running';this.currentTime=0;this.destination={}}
 createOscillator(){return {frequency:{value:0},connect(){},start(){tonesPlayed++},stop(){},onended:null}}
 createGain(){return {gain:{setValueAtTime(value){gains.push(value)},linearRampToValueAtTime(value){ramps.push(value)},exponentialRampToValueAtTime(){}},connect(){}}}
 resume(){this.state='running';return Promise.resolve()}
};
w.WortWeg={navigate(id){for(const item of w.document.querySelectorAll('.section'))item.classList.toggle('active',item.id===id)}};
const source=fs.readFileSync('settings.js','utf8');w.eval(source);
const $=id=>w.document.getElementById(id);
assert.equal(w.document.querySelector('#dashboard .ww-main-menu')!==null,true,'Dashboard starts with main menu');
assert.equal(w.document.querySelectorAll('#dashboard button[data-nav]').length,5,'All five game menu destinations');
assert.equal(w.document.querySelector('header .ww-settings-icon').textContent,'⚙','Header shows icon only');
assert.equal(w.document.querySelector('.settings-credit'),null,'No developer footer');
assert.equal($('ww-intro-overlay').hidden,true,'No sign-in welcome until Google login');
assert.equal($('pref-touchSound').checked,true,'Touch FX is enabled on first launch');
assert.equal($('pref-backgroundMusic').checked,true,'Music is enabled on first launch');
for(const id of ['voiceVolume','musicVolume','fxVolume']){
 assert.equal($('pref-'+id).value,'50',id+' defaults to a balanced 50%');
 assert.equal($('pref-'+id+'-value').textContent,'50%',id+' shows an accessible numeric level');
}
assert.ok(gains.some(x=>x===1),'At default 50%, ambient-music bus preserves existing pleasant base volume');
w.document.querySelector('#dashboard button[data-nav=study]').click();
assert.equal(w.document.querySelector('.section.active').id,'study','Start learning navigates to practice');
w.document.querySelector('#study .ww-menu-back').click();
assert.equal(w.document.querySelector('.section.active').id,'dashboard','Back returns to game main menu');
w.document.querySelector('header .ww-settings-icon').click();
assert.equal(w.document.querySelector('.section.active').id,'settings','Gear opens Settings');
const panel=w.document.createElement('div');panel.id='ww-account';panel.innerHTML='<div class="ww-account-profile"><span id="ww-identity"></span></div><button id="ww-login">Sign out</button>';
w.document.querySelector('header').append(panel);
Promise.resolve().then(()=>{
 assert.ok(tonesPlayed>=4,'Background music begins when the app opens with audio permission');
 $('pref-fxVolume').value='75';$('pref-fxVolume').dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).fxVolume,75,'FX volume saves immediately');
 assert.equal($('pref-fxVolume-value').textContent,'75%','FX volume label follows slider');
 $('pref-musicVolume').value='30';$('pref-musicVolume').dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.ok(gains.some(x=>Math.abs(x-.6)<.0001),'Music bus updates live to 30%, without restarting whole app');
 $('pref-voiceVolume').value='25';$('pref-voiceVolume').dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).voiceVolume,25,'German speech volume is saved in current settings key');
 const beforeTap=tonesPlayed;
 w.document.querySelector('header .ww-settings-icon').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
 assert.ok(tonesPlayed>beforeTap,'Touch FX plays without having to enable it in settings');
 assert.ok(ramps.some(x=>Math.abs(x-.027)<.0001),'Changing FX slider scales actual oscillator gain');
 assert.ok(w.document.querySelector('#ww-settings-account #ww-account'),'Account controls move into Settings');
 w.dispatchEvent(new w.CustomEvent('wortweg:account',{detail:{uid:'google123',name:'Google Person',email:'google@example.com',justSignedIn:true}}));
 assert.equal($('pref-name').value,'Google Person','Google display name fills profile');
 assert.equal($('support-email').value,'google@example.com','Google email fills contact');
 assert.equal($('ww-intro-overlay').hidden,false,'Google login displays welcome');
 $('ww-intro-menu').click();assert.equal($('ww-intro-overlay').hidden,true,'Welcome can be dismissed to menu');
 assert.equal(w.document.querySelector('.section.active').id,'dashboard');
 w.document.querySelector('header .ww-settings-icon').click();
 $('pref-touchSound').checked=true;$('pref-touchSound').dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).touchSound,true,'Sound toggle persists');
 $('pref-touchSound').checked=false;$('pref-touchSound').dispatchEvent(new w.Event('change',{bubbles:true}));
 const beforeMutedTap=tonesPlayed;
 w.document.querySelector('header .ww-settings-icon').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
 assert.equal(tonesPlayed,beforeMutedTap,'Disabling FX stops touch sounds');
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).touchSound,false,'Muted FX preference persists');
 $('pref-backgroundMusic').checked=false;$('pref-backgroundMusic').dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).backgroundMusic,false,'Music can be switched off and stays off');
 w.dispatchEvent(new w.CustomEvent('wortweg:account',{detail:{uid:null,name:'',email:'',justSignedIn:false}}));
 assert.equal($('pref-name').value,'','Guest does not inherit Google name');

 // Confirm the same menu is injected into the actual 3 MB production HTML, not just a small fixture.
 const original=fs.readFileSync('index.html','utf8');
 const live=new JSDOM(original,{url:'https://eric9435.github.io/wortweg-370/',runScripts:'dangerously',beforeParse(w){
  w.scrollTo=()=>{};w.structuredClone=structuredClone;
  w.matchMedia=()=>({matches:false,addEventListener:()=>{}});
 }});
 live.window.eval(source);
 const liveHome=live.window.document.getElementById('dashboard');
 assert.ok(liveHome?.querySelector('.ww-main-menu'),'The real app has the game-style start menu');
 assert.equal(liveHome.querySelectorAll('.ww-menu-options button').length,5);
 liveHome.querySelector('[data-nav=study]').click();
 assert.equal(live.window.document.querySelector('.section.active')?.id,'study','Production quiz route opens from game menu');
 live.window.document.querySelector('#study .ww-menu-back').click();
 assert.equal(live.window.document.querySelector('.section.active')?.id,'dashboard','Production back button returns home');
 live.window.close();
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).backgroundMusic,false,'Music off remains saved');
 dom.window.close();console.log('PASS: default-on music at launch, immediate touch FX, persistent mute, game menu, Google welcome and profile.');
}).catch(e=>{dom.window.close();console.error(e);process.exitCode=1});
