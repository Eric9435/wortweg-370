import {Browser} from '@capacitor/browser';
import {LocalNotifications} from '@capacitor/local-notifications';

const WEBSITE='https://eric9435.github.io/wortweg-370/';
const KEY='wortweg370-settings-v1';
const settings=()=>window.WortWegSettings.get();
function save(value){window.WortWegSettings.save();}
const panel=document.createElement('div');panel.className='ww-account';
const identity=document.createElement('span');identity.textContent='Offline mobile preview · saved on this phone';
const online=document.createElement('button');online.type='button';online.className='ww-account-btn';online.textContent='Open web account';
online.onclick=()=>Browser.open({url:WEBSITE});
panel.append(identity,online);document.querySelector('header').append(panel);
const info=document.createElement('p');info.className='mobile-note muted';
info.textContent='Vocabulary, quizzes and German pronunciation are included for offline use. This preview keeps progress on this phone. Google accounts and cloud history are available in the web version; opening it does not transfer mobile progress.';
document.querySelector('main').prepend(info);

// Use the native notification API instead of browser notification permissions.
const toggle=document.getElementById('pref-notifications');
const originalCard=toggle.closest('.card');
const card=document.createElement('div');card.className='card';
card.innerHTML='<h3>Study reminders</h3><label class="settings-toggle"><input id="mobile-notifications" type="checkbox"> Enable phone notifications</label><label class="settings-toggle"><input id="mobile-reminder" type="checkbox"> Daily study reminder</label><label for="mobile-time">Reminder time</label><input id="mobile-time" type="time"><p id="mobile-notification-status" role="status" aria-live="polite" class="muted tiny"></p><button class="btn" id="mobile-test">Test notification</button>';
originalCard.hidden=true;originalCard.before(card);
const $=id=>document.getElementById(id);
const status=text=>{$('mobile-notification-status').textContent=text};
for(const name of ['notifications','reminder'])$('mobile-'+name).checked=Boolean(settings()[name]);
$('mobile-time').value=settings().time||'18:00';
let queue=Promise.resolve();
async function reschedule(){
 const s=settings();
 await LocalNotifications.cancel({notifications:[{id:370}]});
 if(!s.notifications||!s.reminder){status('Daily reminder off.');return;}
 const permission=await LocalNotifications.checkPermissions();
 if(permission.display!=='granted'){status('Allow notifications in your phone settings to receive reminders.');return;}
 const [hour,minute]=(s.time||'18:00').split(':').map(Number);
 await LocalNotifications.schedule({notifications:[{id:370,title:'WortWeg 370',body:'Time for your German practice — '+(s.goal||'10 words a day'),schedule:{on:{hour,minute},repeats:true,allowWhileIdle:true}}]});
 status('Daily reminder set for '+s.time+'. Your phone may adjust delivery to save battery.');
}
function schedule(){queue=queue.catch(()=>{}).then(reschedule).catch(()=>status('Unable to set reminder. Check phone notification settings.'));return queue;}
$('mobile-notifications').onchange=async e=>{
 try{const p=e.target.checked?await LocalNotifications.requestPermissions():null;const s=settings();s.notifications=Boolean(p?.display==='granted');save(s);e.target.checked=s.notifications;await schedule();}
 catch{e.target.checked=false;status('Notification permission unavailable.');}
};
$('mobile-reminder').onchange=e=>{const s=settings();s.reminder=e.target.checked;save(s);schedule();};
$('mobile-time').onchange=e=>{const s=settings();s.time=e.target.value||'18:00';save(s);schedule();};
$('mobile-test').onclick=async()=>{
 try{if(!settings().notifications||(await LocalNotifications.checkPermissions()).display!=='granted'){status('Enable phone notifications first.');return;}
 await LocalNotifications.schedule({notifications:[{id:371,title:'WortWeg 370',body:'German practice is ready.',schedule:{at:new Date(Date.now()+1000)}}]});status('Test notification scheduled.');}
 catch{status('Unable to send notification.');}
};
LocalNotifications.addListener('localNotificationActionPerformed',()=>window.WortWeg.navigate('study'));
schedule();
