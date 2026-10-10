const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const stub='<!doctype html><html><head><meta name="theme-color" content="#f4f7fb"></head><body><header><div class="brand"></div></header><main><section id="dashboard" class="section active"></section><section id="study" class="section"></section><section id="topics" class="section"></section><section id="bank" class="section"></section><section id="review" class="section"></section><section id="stats" class="section"></section></main><div class="bottom"><nav></nav></div></body></html>';
function bootstrap(){
 const dom=new JSDOM(stub,{url:'https://eric9435.github.io/wortweg-370/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener:()=>{}});
 w.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.destination={}}
 createOscillator(){return {frequency:{value:0},connect(){},start(){},stop(){}}}
 createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
 resume(){return Promise.resolve()}
 };
 w.WortWeg={navigate(id){w.document.querySelectorAll('.section').forEach(el=>el.classList.toggle('active',el.id===id))}};
 w.eval(fs.readFileSync('settings.js','utf8'));
 w.eval(fs.readFileSync('settings-navigation.js','utf8'));
 return {dom,w,$:id=>w.document.getElementById(id)};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
(async()=>{
 const {dom,w,$}=bootstrap();
 const nav=w.WortWegSettingsNavigation;
 assert.ok(nav,'Settings navigation initializes');
 assert.equal($('ww-settings-hub').hidden,false,'First entry displays only the compact Settings hub');
 assert.equal($('ww-settings-detail').hidden,true,'Long preference forms are not visible initially');
 assert.equal(w.document.querySelectorAll('#ww-settings-hub button[data-settings-page]').length,9,'Profile and grouped navigation entries exist');
 assert.equal(w.document.querySelectorAll('#ww-settings-hub .ww-settings-group').length,3,'Three coherent settings groups');
 assert.equal($('ww-settings-back').textContent,'‹  Main menu','Single back button from the hub');
 assert.equal($('pref-touchSound').checked,true,'Existing default-on FX is preserved');
 assert.equal($('pref-backgroundMusic').checked,true,'Existing default-on music is preserved');
 $('ww-settings-profile-row').click();
 assert.equal(nav.getCurrent(),'profile');
 assert.equal($('ww-settings-hub').hidden,true);
 assert.ok($('profile-form')?.closest('[data-settings-view=profile]'),'Real profile form is reparented, not recreated');
 $('pref-name').value='Sample Learner';
 $('profile-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).name,'Sample Learner','Profile data persists under the unchanged key');
 $('ww-settings-back').click();
 assert.equal(nav.getCurrent(),null,'Back returns to the Settings hub instead of the game menu');
 assert.equal(w.document.querySelectorAll('#settings > .ww-menu-back').length,1,'Legacy back control remains functional but is hidden by CSS');
 w.document.querySelector('[data-settings-page=sound]').click();
 assert.ok($('pref-touchSound').closest('[data-settings-view=sound]'));
 assert.ok($('audio-pack-test').closest('[data-settings-view=sound]'),'Offline German speech controls retained');
 $('pref-touchSound').checked=false;
 $('pref-touchSound').dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(JSON.parse(w.localStorage.getItem('wortweg370-settings-v1')).touchSound,false,'Switch still saves prior sound preferences');
 $('ww-settings-back').click();
 w.document.querySelector('[data-settings-page=reminders]').click();
 const original=$('pref-notifications').closest('.card');
 assert.equal(original.parentElement?.dataset.settingsView,'reminders','Web notification controls are in reminders');
 // Simulate the Android app inserting a native reminder card after Settings loaded.
 const native=w.document.createElement('div');native.className='card';
 native.innerHTML='<h3>Study reminders</h3><label class="settings-toggle"><input type="checkbox" id="mobile-notifications"> Enable phone notifications</label>';
 original.before(native);
 await tick();
 assert.equal($('mobile-notifications').closest('[data-settings-view]').dataset.settingsView,'reminders','Native controls stay inside reminder subpage');
 $('ww-settings-back').click();
 const p=w.document.createElement('div');p.id='ww-account';
 p.innerHTML='<div class="ww-account-profile"><span id="ww-identity">Google Learner</span><span id="ww-account-avatar"><img id="ww-account-photo" hidden><span id="ww-account-initials">GL</span></span></div><button id="ww-login">Sign out</button>';
 w.document.querySelector('header').append(p);
 await tick();
 assert.ok($('ww-account').closest('[data-settings-view=profile]'),'Google profile and Sign out are located in the profile subpage');
 assert.equal($('ww-settings-profile-name').textContent,'Google Learner','Account name updates compact profile preview');
 w.document.querySelector('[data-settings-page=privacy]').click();
 assert.equal(w.document.querySelectorAll('[data-settings-view=privacy] details').length,2,'Privacy and Terms moved into their own view');
 $('ww-settings-back').click();
 w.document.querySelector('[data-settings-page=support]').click();
 assert.ok($('support-form').closest('[data-settings-view=support]'),'Customer support form remains available but not on landing page');
 $('ww-settings-back').click();
 w.document.querySelector('[data-settings-page=about]').click();
 assert.match(w.document.querySelector('[data-settings-view=about]').textContent,/innovateX/);
 $('ww-settings-back').click();
 const update=w.document.createElement('div');update.className='card ww-updater-settings';
 update.innerHTML='<h3>App updates</h3><button id="ww-update-check">Check now</button>';
 w.document.querySelector('#settings .settings-grid').append(update);
 const lessons=w.document.createElement('div');lessons.className='card ww-live-settings';
 lessons.innerHTML='<h3>Lesson updates</h3><button id="ww-live-check">Check for new lessons</button>';
 w.document.querySelector('#settings .settings-grid').append(lessons);
 await tick();
 assert.ok($('ww-update-check').closest('[data-settings-view=updates]'),'Late native update checker is relocated');
 assert.ok($('ww-live-check').closest('[data-settings-view=lessons]'),'Late lesson updater is relocated');
 assert.equal($('ww-settings-update-placeholder'),null,'Android update placeholder removed after real controls load');
 $('ww-settings-back').click();
 assert.equal(w.document.querySelector('#dashboard').classList.contains('active'),true,'Settings back returns to main game screen');
 // Re-enter Settings and confirm landing resets rather than reopening the last subview.
 w.document.querySelector('header .ww-settings-icon').click();
 await tick();
 assert.equal(nav.getCurrent(),null);
 assert.equal($('ww-settings-hub').hidden,false);
 dom.window.close();
 console.log('PASS: one-page Settings hub, account/profile, iOS-style switch compatibility, native reminders, late update modules, support/privacy, preserved storage and navigation.');
})().catch(error=>{console.error(error);process.exitCode=1});
