(()=>{
'use strict';
const KEY='wortweg370-settings-v1', defaults={mode:'system',font:'normal',theme:'blue',notifications:false,reminder:false,time:'18:00',name:'',age:'',goal:'10 words a day',touchSound:true,backgroundMusic:true};
let s={...defaults};try{s={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{};
// One-time migration: existing users also receive the new sound-on defaults.
 // After migration, their explicit On/Off settings persist across launches.
const AUDIO_DEFAULTS_KEY='wortweg370-audio-defaults-v2';
try{
 if(localStorage.getItem(AUDIO_DEFAULTS_KEY)!=='1'){
  s.touchSound=true;s.backgroundMusic=true;
  localStorage.setItem(KEY,JSON.stringify(s));
  localStorage.setItem(AUDIO_DEFAULTS_KEY,'1');
 }
}catch{}
const main=document.querySelector('main'),page=document.createElement('section');page.id='settings';page.className='section';
page.innerHTML=`<div class="settings-grid"><div class="card"><h3>Appearance</h3><label for="pref-mode">Display mode</label><select id="pref-mode"><option value="system">Follow device</option><option value="light">Light</option><option value="dark">Dark</option></select><label for="pref-font">Font size</label><select id="pref-font"><option value="small">Small</option><option value="normal">Normal</option><option value="large">Large</option><option value="extra">Extra large</option></select><label for="pref-theme">Colour theme</label><select id="pref-theme"><option value="blue">Ocean blue</option><option value="teal">Forest teal</option><option value="purple">Soft violet</option></select></div><div class="card"><h3>My profile</h3><form id="profile-form"><label for="pref-name">Name (optional)</label><input id="pref-name" maxlength="80" autocomplete="nickname"><label for="pref-age">Age (optional)</label><input id="pref-age" type="number" min="1" max="120"><label for="pref-goal">Learning goal</label><input id="pref-goal" maxlength="120"><p class="muted tiny">Your profile and preferences stay in this browser, separate from your Google account and quiz history.</p><button class="btn primary">Save profile</button></form></div><div class="card"><h3>Notifications & reminders</h3><label class="settings-toggle"><input id="pref-notifications" type="checkbox"> Enable browser notifications</label><label class="settings-toggle"><input id="pref-reminder" type="checkbox"> Daily study reminder</label><label for="pref-time">Reminder time (device local time)</label><input id="pref-time" type="time"><p id="notification-status" class="muted tiny"></p><p class="muted tiny">Browser reminders run while WortWeg is open. Import a calendar reminder to receive alerts when the app is closed.</p><div class="flex"><button class="btn" id="test-notification">Test notification</button><button class="btn" id="calendar-reminder">Download calendar reminder</button></div></div><div class="card"><h3>Feedback & customer support</h3><form id="support-form"><label for="support-kind">Request type</label><select id="support-kind"><option>Feedback</option><option>Customer support</option><option>Report a bug</option><option>Privacy request</option></select><label for="support-email">Your email (optional)</label><input id="support-email" type="email" autocomplete="email" maxlength="254"><label for="support-subject">Subject</label><input id="support-subject" required maxlength="140"><label for="support-message">Message</label><textarea id="support-message" required maxlength="5000" rows="5"></textarea><p class="muted tiny">Opens a draft in your email app. Review it and press Send there.</p><button class="btn primary">Open email draft</button></form><a href="mailto:ericscott.de@gmail.com">ericscott.de@gmail.com</a></div><div class="card settings-wide"><h3>About WortWeg 370</h3><p>Developed by <strong>innovateX</strong></p><details><summary>Privacy</summary><p>Appearance, optional profile details, and reminder preferences are stored in this browser. Guest learning progress stays on this device. If you sign in with Google, Firebase Authentication handles sign-in and quiz progress is stored in Cloud Firestore under your account. Google and Firebase process account and service data; GitHub Pages hosts this site. Your settings profile is not uploaded by this feature.</p><p>Notification permission is optional and managed by your browser. Support messages are only sent when you send the email draft. To request help with account data or deletion, contact ericscott.de@gmail.com. Clearing browser site data removes local settings and may remove local learning progress.</p></details><details><summary>Terms of use</summary><p>WortWeg is a vocabulary practice tool. Content may contain mistakes and does not guarantee exam results. Keep a copy of important learning records; browser storage and cloud services may be unavailable. Use support respectfully and avoid sending sensitive information. Contact innovateX at ericscott.de@gmail.com for questions.</p></details></div></div><p id="settings-status" role="status" aria-live="polite"></p>`;
main.append(page);
const audioCard=document.createElement('div');audioCard.className='card audio-settings';
audioCard.innerHTML='<h3>German pronunciation</h3><p id="audio-pack-status" role="status" aria-live="polite"></p><progress id="audio-pack-progress" max="100" value="0" aria-label="German speech download progress" hidden></progress><p class="audio-detail">About 3 MB. Saved on this device for offline pronunciation, even if your phone has no German voice.</p><div class="audio-actions"><button class="btn primary" type="button" id="audio-pack-download">Download German speech</button><button class="btn" type="button" id="audio-pack-test">Test pronunciation</button></div><p class="audio-detail">Download status appears in the app. Phone alerts follow your notification setting.</p>';
page.querySelector('.settings-grid').prepend(audioCard);
function renderAudio(data){const status=audioCard.querySelector('#audio-pack-status'),bar=audioCard.querySelector('#audio-pack-progress'),button=audioCard.querySelector('#audio-pack-download');status.textContent=data.message;bar.value=data.progress;bar.hidden=data.state!=='downloading';button.disabled=['ready','downloading'].includes(data.state);button.textContent=data.state==='ready'?'German speech downloaded':data.state==='downloading'?'Downloading…':data.state==='error'?'Retry download':'Download German speech'}
audioCard.querySelector('#audio-pack-download').onclick=()=>window.WortWegAudio?.download().catch(()=>{});
audioCard.querySelector('#audio-pack-test').onclick=()=>window.WortWegAudio?.test();
window.addEventListener('wortweg:audio-status',event=>renderAudio(event.detail));
if(window.WortWegAudio)renderAudio(window.WortWegAudio.getStatus());
const button=document.createElement('button');button.className='btn small';button.dataset.nav='settings';button.textContent='⚙';button.title='Settings';button.setAttribute('aria-label','Open settings');button.classList.add('ww-settings-icon');document.querySelector('header').append(button);button.onclick=()=>window.WortWeg.navigate('settings');
// Developer information remains exclusively inside Settings → About.
const $=id=>document.getElementById(id),media=matchMedia('(prefers-color-scheme: dark)');
function apply(){document.documentElement.dataset.mode=s.mode==='system'?(media.matches?'dark':'light'):s.mode;document.documentElement.dataset.font=s.font;document.documentElement.dataset.theme=s.theme;document.querySelector('meta[name="theme-color"]').content=document.documentElement.dataset.mode==='dark'?'#111a30':'#f4f7fb'}
function status(t){$('settings-status').textContent=t}
function save(){try{localStorage.setItem(KEY,JSON.stringify(s));status('Preferences saved.')}catch{status('Unable to save. Browser storage is unavailable.')}apply();permissionStatus()}
function permissionStatus(){const p='Notification' in window?Notification.permission:'unsupported';$('notification-status').textContent='Browser permission: '+p+(s.notifications?' · notifications enabled':' · notifications off')}
for(const k of ['mode','font','theme','time']){$('pref-'+k).value=s[k];$('pref-'+k).onchange=e=>{s[k]=e.target.value;save()}}
for(const k of ['name','age','goal'])$('pref-'+k).value=s[k];
$('profile-form').onsubmit=e=>{e.preventDefault();for(const k of ['name','age','goal'])s[k]=$('pref-'+k).value.trim();save()};
$('pref-reminder').checked=s.reminder;$('pref-reminder').onchange=e=>{s.reminder=e.target.checked;save()};
$('pref-notifications').checked=s.notifications;$('pref-notifications').onchange=async e=>{if(e.target.checked){try{if(!('Notification'in window))throw Error();const p=await Notification.requestPermission();s.notifications=p==='granted'}catch{s.notifications=false}}else s.notifications=false;e.target.checked=s.notifications;save();if(!s.notifications)status('Notifications off. You can manage permission in your browser settings.')};
async function notify(){if(!s.notifications||!('Notification'in window)||Notification.permission!=='granted'){status('Enable notifications and allow browser permission first.');return}try{const reg=await navigator.serviceWorker?.getRegistration();if(reg)await reg.showNotification('WortWeg 370',{body:'Time for your German practice — '+s.goal,icon:'./icon.svg?v=11',tag:'wortweg-study'});else new Notification('WortWeg 370',{body:'Time for your German practice — '+s.goal});status('Notification sent.')}catch{status('This browser cannot show notifications here. Use the calendar reminder.')}}
$('test-notification').onclick=notify;
function tick(){if(!s.reminder)return;const d=new Date(),day=d.toLocaleDateString('en-CA'),time=d.toTimeString().slice(0,5);if(time!==s.time)return;try{if(localStorage.getItem(KEY+'-reminded')===day)return;localStorage.setItem(KEY+'-reminded',day)}catch{return}status('Time for your German practice!');if(s.notifications)notify()}
setInterval(tick,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
$('calendar-reminder').onclick=()=>{const d=new Date(),[h,m]=s.time.split(':').map(Number);d.setHours(h,m,0,0);if(d<=new Date())d.setDate(d.getDate()+1);const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const local=d=>String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+'00';const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//innovateX//WortWeg//EN','BEGIN:VEVENT','UID:wortweg-daily-'+Date.now()+'@innovatex','DTSTAMP:'+stamp(new Date()),'DTSTART:'+local(d),'DURATION:PT10M','RRULE:FREQ=DAILY','SUMMARY:WortWeg German practice','DESCRIPTION:Open https://eric9435.github.io/wortweg-370/','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:Time to practise German','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');const url=URL.createObjectURL(new Blob([content],{type:'text/calendar'})),a=document.createElement('a');a.href=url;a.download='WortWeg_Daily_Reminder.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Import the downloaded reminder into your calendar. Calendar alerts are managed separately from this switch.')};
$('support-form').onsubmit=e=>{e.preventDefault();const subject='[WortWeg '+$('support-kind').value+'] '+$('support-subject').value;const body='Reply email: '+$('support-email').value+'\n\n'+$('support-message').value;location.href='mailto:ericscott.de@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);status('Email draft requested. Send it from your email app.')};

/* Compact, game-style UI, account hub, optional sound and onboarding. */
const settingsGrid=page.querySelector('.settings-grid');
const accountHub=document.createElement('div');
accountHub.id='ww-settings-account';
accountHub.innerHTML='<h3>Account</h3><div id="ww-account-slot"><span class="muted">Guest</span></div><div id="ww-account-email" class="muted tiny"></div>';
page.insertBefore(accountHub,settingsGrid);
const soundGroup=document.createElement('div');
soundGroup.className='card ww-sound-settings';
soundGroup.innerHTML='<h3>Sound & music</h3><label class="settings-toggle"><input id="pref-touchSound" type="checkbox"> Touch sound effects</label><label class="settings-toggle"><input id="pref-backgroundMusic" type="checkbox"> Background music</label><p class="muted tiny">Sound and original ambient music start enabled. Turn either one off here. In browsers, music may wait for your first tap.</p>';
settingsGrid.insertBefore(soundGroup,settingsGrid.firstChild);
for(const k of ['touchSound','backgroundMusic']){const input=$('pref-'+k);input.checked=Boolean(s[k]);input.addEventListener('change',()=>{s[k]=input.checked;save();if(k==='backgroundMusic')updateMusic()})}
const header=document.querySelector('header');
const moveAccount=()=>{const panel=header?.querySelector('#ww-account');if(!panel)return;const slot=$('ww-account-slot');slot.querySelector('span.muted')?.remove();slot.append(panel)};
if(header){new MutationObserver(moveAccount).observe(header,{childList:true});moveAccount()}
const menu=document.createElement('div');menu.className='ww-main-menu';
menu.innerHTML='<div class="ww-menu-top"><span class="ww-menu-eyebrow">LEARN GERMAN FOR LIFE</span><h2>What would you like to do?</h2><p>Choose your next step.</p></div><div class="ww-menu-options"><button type="button" class="ww-menu-primary" data-nav="study"><span class="ww-menu-icon">▶</span><span><strong>Start learning</strong><small>Vocabulary practice</small></span><span class="ww-menu-arrow">›</span></button><button type="button" data-nav="topics"><span class="ww-menu-icon">▦</span><span><strong>Topics</strong><small>Browse German lessons</small></span><span class="ww-menu-arrow">›</span></button><button type="button" data-nav="bank"><span class="ww-menu-icon">⌕</span><span><strong>Vocabulary bank</strong><small>Find and practise words</small></span><span class="ww-menu-arrow">›</span></button><button type="button" data-nav="review"><span class="ww-menu-icon">↺</span><span><strong>Review mistakes</strong><small>Learn from your answers</small></span><span class="ww-menu-arrow">›</span></button><button type="button" data-nav="stats"><span class="ww-menu-icon">▥</span><span><strong>My progress</strong><small>Scores and learning history</small></span><span class="ww-menu-arrow">›</span></button></div>';
const home=$('dashboard');
if(home){home.prepend(menu);document.body.classList.add('ww-game-interface')}
const views=['study','topics','bank','review','stats','settings'];
for(const id of views){const view=$(id);if(!view)continue;const back=document.createElement('button');back.className='ww-menu-back';back.type='button';back.setAttribute('aria-label','Back to main menu');back.textContent='‹  Main menu';view.prepend(back);back.addEventListener('click',()=>goTo('dashboard'))}
function goTo(id){
 if(window.WortWeg?.navigate)window.WortWeg.navigate(id);
 else for(const el of document.querySelectorAll('.section'))el.classList.toggle('active',el.id===id);
 document.body.classList.remove('ww-quiz-mode');
 if(id==='study'&&document.querySelector('#quizStage #nextQuiz'))document.body.classList.add('ww-quiz-mode');
 window.scrollTo?.(0,0);
}
menu.addEventListener('click',event=>{const b=event.target.closest('button[data-nav]');if(!b)return;event.preventDefault();event.stopPropagation();goTo(b.dataset.nav)});
button.addEventListener('click',()=>goTo('settings'));
const intro=document.createElement('div');
intro.id='ww-intro-overlay';intro.hidden=true;intro.innerHTML='<div class="ww-intro-panel" role="dialog" aria-modal="true" aria-labelledby="ww-intro-heading"><span class="ww-intro-symbol" aria-hidden="true">✦</span><h2 id="ww-intro-heading">Welcome to WortWeg 370!</h2><p id="ww-intro-caption">Your German learning journey starts here.</p><div class="ww-intro-actions"><button type="button" id="ww-intro-start" class="btn primary">Start learning</button><button type="button" id="ww-intro-menu" class="btn secondary">Main menu</button></div></div>';
document.body.append(intro);
let previousFocus=null;
function closeIntro(destination){
 intro.hidden=true;document.body.classList.remove('ww-intro-open');
 if(destination)goTo(destination);else previousFocus?.focus?.();
}
$('ww-intro-start').addEventListener('click',()=>closeIntro('study'));
$('ww-intro-menu').addEventListener('click',()=>closeIntro('dashboard'));
intro.addEventListener('click',event=>{if(event.target===intro)closeIntro('dashboard')});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!intro.hidden){event.preventDefault();closeIntro('dashboard')}});
function showIntro(displayName){
 const first=(displayName||'').trim().split(/\s+/)[0];
 $('ww-intro-caption').textContent=first?'Welcome, '+first+'! Ready to practise German?':'Your German learning journey starts here.';
 previousFocus=document.activeElement;intro.hidden=false;document.body.classList.add('ww-intro-open');
 $('ww-intro-start').focus();
}
let activeProfile='guest';
function profileKey(uid){return 'wortweg370-ui-profile:'+uid}
window.addEventListener('wortweg:account',event=>{
 const data=event.detail||{},uid=data.uid||'guest',signedIn=uid!=='guest';
 if(activeProfile!==uid){
  activeProfile=uid;
  let stored={};try{stored=JSON.parse(localStorage.getItem(profileKey(uid))||'{}')}catch{}
  s.name=stored.name|| (signedIn?data.name||'':'');
  s.age=stored.age||'';
  if(stored.goal)s.goal=stored.goal;
  $('pref-name').value=s.name;$('pref-age').value=s.age;$('pref-goal').value=s.goal;
  try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}
 }
 if(signedIn&&!s.name&&data.name){s.name=data.name;$('pref-name').value=data.name;try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}}
 $('ww-account-email').textContent=signedIn?(data.email||''):'Continue learning as a guest';
 if(signedIn&&data.email&&!$('support-email').value)$('support-email').value=data.email;
 if(data.justSignedIn&&signedIn)showIntro(data.name||s.name);
});
$('profile-form').addEventListener('submit',()=>{
 try{localStorage.setItem(profileKey(activeProfile),JSON.stringify({name:s.name,age:s.age,goal:s.goal}))}catch{}
});
/* License-free, generated UI sounds and ambient game music. Shared AudioContext. */
let audioContext=null,musicTimer=null;
const activeMusic=new Set();
function audio(){
 if(!audioContext){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return null;
  try{audioContext=new Audio()}catch{return null}
 }
 return audioContext;
}
function note(ctx,hz,delay,duration,volume,type='sine',isMusic=false){
 const oscillator=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+delay;
 oscillator.type=type;oscillator.frequency.value=hz;
 gain.gain.setValueAtTime(0,start);
 gain.gain.linearRampToValueAtTime(volume,start+.045);
 gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 oscillator.connect(gain);gain.connect(ctx.destination);
 if(isMusic){
  activeMusic.add(oscillator);
  oscillator.onended=()=>activeMusic.delete(oscillator);
 }
 oscillator.start(start);oscillator.stop(start+duration+.03);
}
function unlockAudio(){
 const ctx=audio();if(!ctx)return Promise.resolve(null);
 if(ctx.state==='suspended'){
  try{return Promise.resolve(ctx.resume()).then(()=>ctx).catch(()=>ctx)}catch{return Promise.resolve(ctx)}
 }
 return Promise.resolve(ctx);
}
function touch(){
 if(!s.touchSound)return;
 const ctx=audio();if(!ctx)return;
 if(ctx.state==='suspended')unlockAudio().catch(()=>{});
 note(ctx,650,0,.065,.018);
 note(ctx,900,.045,.09,.009);
}
function chord(){
 const ctx=audio();
 if(!s.backgroundMusic||document.hidden||!ctx||ctx.state!=='running')return;
 const roots=[196,174.61,220,164.81],root=roots[Math.floor((Date.now()/6600)%roots.length)];
 [1,1.25,1.5,2].forEach((mult,i)=>note(ctx,root*mult,i*.2,3.5,.004,'sine',true));
}
function stopMusic(){
 if(musicTimer){clearInterval(musicTimer);musicTimer=null}
 for(const oscillator of activeMusic){try{oscillator.stop()}catch{}}
 activeMusic.clear();
}
function startMusic(){
 if(!s.backgroundMusic||document.hidden||audio()?.state!=='running'||musicTimer)return;
 chord();
 musicTimer=setInterval(chord,6600);
}
function updateMusic(){
 stopMusic();
 if(!s.backgroundMusic||document.hidden)return;
 unlockAudio().then(startMusic);
}
document.addEventListener('pointerdown',event=>{
 // On websites, browser autoplay policy may require this first interaction.
 if(s.backgroundMusic&&!musicTimer)unlockAudio().then(startMusic);
 if(s.touchSound&&event.target.closest('button,[role=button],a,summary,select,input[type=checkbox]'))touch();
},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopMusic();else updateMusic()});
window.addEventListener('pagehide',stopMusic);
// Try immediately at launch; Android WebView is configured to allow playback without tapping.
updateMusic();

media.addEventListener('change',apply);apply();permissionStatus();tick();
})();


// New Settings navigation only rearranges existing preference controls; it does
// not change storage keys, authentication, progress, reminders or offline speech.
(()=>{
 const css=document.createElement('link');css.rel='stylesheet';css.href='./settings-navigation.css';document.head.append(css);
 const script=document.createElement('script');script.src='./settings-navigation.js';script.defer=true;document.head.append(script);
})();

// The same local lesson-sync client is bundled into Android and served by the website.
// Only JSON content is fetched remotely; JavaScript always comes from the installed app.
(()=>{const script=document.createElement('script');script.src='./live-content.js';script.defer=true;document.head.append(script)})();


// Additive presentation layer: both web and bundled Android retain the same features.
(()=>{
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='./ios-polish.css';document.head.append(stylesheet);
 const script=document.createElement('script');script.src='./ios-polish.js';script.defer=true;document.head.append(script);
})();
