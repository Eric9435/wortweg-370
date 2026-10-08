(()=>{
'use strict';
const settings=document.getElementById('settings');
const grid=settings?.querySelector('.settings-grid');
if(!settings||!grid||settings.querySelector('#ww-settings-hub'))return;
const $=id=>document.getElementById(id);
const labels={
 profile:'Profile & account',
 appearance:'Appearance',
 sound:'Sound & music',
 reminders:'Study reminders',
 updates:'App updates',
 lessons:'Lesson updates',
 support:'Help & feedback',
 privacy:'Privacy & terms',
 about:'About WortWeg 370'
};
const icons={
 user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
 palette:'<circle cx="12" cy="12" r="9"/><path d="M16 17a2 2 0 0 1-2-2c0-1 1-2 2-2h2a3 3 0 0 0 3-3M7.5 10h.01M10 6.5h.01M15 7h.01M7.5 15h.01"/>',
 volume:'<path d="M11 5 6 9H3v6h3l5 4V5ZM15.5 9a5 5 0 0 1 0 6M18.5 6a9 9 0 0 1 0 12"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3"/>',
 book:'<path d="M12 7c-2-2-5-2-9-2v14c4 0 7 0 9 2 2-2 5-2 9-2V5c-4 0-7 0-9 2Zm0 0v14"/>',
 message:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"/>',
 shield:'<path d="m12 2 8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6l8-4Zm-3 10 2 2 4-4"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'
};
const svg=name=>'<svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
const groups=[
 {heading:'PREFERENCES',entries:[
  ['appearance','Appearance','Theme, font size','palette'],
  ['sound','Sound & music','Audio, effects and pronunciation','volume'],
  ['reminders','Study reminders','Notifications and daily goals','bell']]},
 {heading:'APPLICATION',entries:[
  ['updates','App updates','Check for new versions','download'],
  ['lessons','Lesson updates','Download content for offline study','book']]},
 {heading:'SUPPORT & INFORMATION',entries:[
  ['support','Help & feedback','Contact support','message'],
  ['privacy','Privacy & terms','Your data and app usage','shield'],
  ['about','About WortWeg 370','Developer and app information','info']]}
];
const bar=document.createElement('div');bar.id='ww-settings-topbar';
bar.innerHTML='<button type="button" id="ww-settings-back" class="ww-settings-back" aria-label="Back to main menu">‹  Main menu</button><h2 id="ww-settings-heading">Settings</h2>';
const hub=document.createElement('div');hub.id='ww-settings-hub';
const profile=document.createElement('button');profile.type='button';
profile.id='ww-settings-profile-row';profile.className='ww-settings-profile-row';
profile.dataset.settingsPage='profile';
profile.innerHTML='<span id="ww-settings-avatar" class="ww-settings-avatar" aria-hidden="true">'+svg('user')+'</span><span class="ww-settings-profile-text"><strong id="ww-settings-profile-name">Your account</strong><small id="ww-settings-profile-caption">Manage profile and account</small></span><span class="ww-settings-chevron" aria-hidden="true">›</span>';
hub.append(profile);
for(const group of groups){
 const section=document.createElement('div');section.className='ww-settings-group';
 const eyebrow=document.createElement('h3');eyebrow.className='ww-settings-group-title';eyebrow.textContent=group.heading;section.append(eyebrow);
 for(const [key,title,subtitle,iconName] of group.entries){
  const button=document.createElement('button');button.type='button';button.className='ww-settings-row';
  button.dataset.settingsPage=key;
  button.innerHTML='<span class="ww-settings-row-icon">'+svg(iconName)+'</span><span class="ww-settings-row-label"><strong></strong><small></small></span><span class="ww-settings-chevron" aria-hidden="true">›</span>';
  button.querySelector('strong').textContent=title;
  button.querySelector('small').textContent=subtitle;
  section.append(button);
 }
 hub.append(section);
}
const detail=document.createElement('div');detail.id='ww-settings-detail';detail.hidden=true;
const pages={};
for(const [key,title] of Object.entries(labels)){
 const pane=document.createElement('section');pane.className='ww-settings-pane';pane.dataset.settingsView=key;pane.hidden=true;
 pane.setAttribute('aria-label',title);detail.append(pane);pages[key]=pane;
}
pages.updates.innerHTML='<p id="ww-settings-update-placeholder" class="ww-settings-helper">App update notifications and installation are available in the Android app.</p>';
pages.lessons.innerHTML='<p id="ww-settings-lessons-placeholder" class="ww-settings-helper">Your lessons remain available offline. Checking for updates requires an internet connection.</p>';
pages.about.innerHTML='<p class="ww-settings-helper">Developed by <strong>innovateX</strong></p><p class="ww-settings-helper">Contact: <a href="mailto:ericscott.de@gmail.com">ericscott.de@gmail.com</a></p>';
const existingBack=settings.querySelector(':scope > .ww-menu-back');
settings.insertBefore(bar,existingBack||settings.firstChild);
settings.insertBefore(hub,grid);
settings.insertBefore(detail,grid);
settings.classList.add('ww-settings-modern');
grid.hidden=true;

const accountHub=$('ww-settings-account');
if(accountHub){pages.profile.append(accountHub);accountHub.hidden=false}
const appStatus=$('settings-status');if(appStatus){pages.profile.append(appStatus)}
const groupFor=node=>{
 if(!node||node.nodeType!==1)return null;
 if(node.matches('#ww-settings-account'))return 'profile';
 if(node.querySelector('#pref-mode'))return 'appearance';
 if(node.matches('.ww-sound-settings')||node.querySelector('#pref-touchSound'))return 'sound';
 if(node.matches('.audio-settings')||node.querySelector('#audio-pack-test'))return 'sound';
 if(node.matches('.ww-updater-settings')||node.querySelector('#ww-update-check'))return 'updates';
 if(node.matches('.ww-live-settings')||node.querySelector('#ww-live-check'))return 'lessons';
 if(node.querySelector('#mobile-notifications')||node.querySelector('#pref-notifications'))return 'reminders';
 if(node.querySelector('#support-form'))return 'support';
 if(node.querySelector('#profile-form'))return 'profile';
 if(node.matches('.settings-wide')&&node.querySelector('details'))return 'about';
 return null;
};
function relocate(){
 // These controls are created at different times on web, Android and iOS.
 const nodes=[...grid.children,...settings.querySelectorAll(':scope > .card')];
 for(const node of nodes){
  const target=groupFor(node);
  if(!target||node.parentElement===pages[target])continue;
  pages[target].append(node);
  if(target==='updates')$('ww-settings-update-placeholder')?.remove();
  if(target==='lessons')$('ww-settings-lessons-placeholder')?.remove();
 }
 // Android inserts native reminder controls immediately before the web
 // reminder card, which may already be in the nested Reminders view.
 const nativeCard=$('mobile-notifications')?.closest('.card');
 if(nativeCard&&nativeCard.parentElement!==pages.reminders)pages.reminders.prepend(nativeCard);
 const about=pages.about.querySelector('.settings-wide');
 if(about){
  for(const block of [...about.querySelectorAll('details')])pages.privacy.append(block);
  if(!about.querySelector('a[href^="mailto:"]')){
   // The developer address is already shown in the separate About view.
  }
 }
}
relocate();
// Covers later native.js and live-content.js additions without disturbing
// their existing event listeners, storage, Firebase identity or quiz data.
const observer=new MutationObserver(mutations=>{
 if(mutations.some(m=>m.addedNodes.length>0))relocate();
});
observer.observe(settings,{childList:true,subtree:true});

let current=null;
function setHeader(){
 const back=$('ww-settings-back');
 back.textContent=current?'‹  Settings':'‹  Main menu';
 back.setAttribute('aria-label',current?'Back to Settings':'Back to main menu');
 $('ww-settings-heading').textContent=current?labels[current]:'Settings';
}
function openPage(key){
 if(!pages[key])return;
 current=key;hub.hidden=true;detail.hidden=false;
 for(const [name,node] of Object.entries(pages))node.hidden=name!==key;
 relocate();setHeader();window.scrollTo?.(0,0);
 const h=$('ww-settings-heading');h.setAttribute('tabindex','-1');h.focus({preventScroll:true});
}
function openHub(){
 current=null;detail.hidden=true;hub.hidden=false;
 for(const pane of Object.values(pages))pane.hidden=true;
 setHeader();window.scrollTo?.(0,0);
}
hub.addEventListener('click',event=>{
 const entry=event.target.closest('[data-settings-page]');
 if(entry)openPage(entry.dataset.settingsPage);
});
$('ww-settings-back').addEventListener('click',()=>{
 if(current)openHub();
 else if(window.WortWeg?.navigate)window.WortWeg.navigate('dashboard');
 else document.querySelector('#dashboard [data-nav]')?.click();
});
settings.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&current){event.preventDefault();openHub()}
});
new MutationObserver(()=>{
 if(settings.classList.contains('active'))openHub();
}).observe(settings,{attributes:true,attributeFilter:['class']});
function renderIdentity(){
 const name=$('ww-identity')?.textContent?.trim()||$('pref-name')?.value?.trim()||'Guest';
 const email=$('ww-account-email')?.textContent?.trim()||'Manage profile and account';
 $('ww-settings-profile-name').textContent=name==='On-device learning'?'Guest':name;
 $('ww-settings-profile-caption').textContent=email;
 const avatar=$('ww-settings-avatar');const photo=$('ww-account-photo');
 avatar.replaceChildren();
 if(photo&&photo.getAttribute('src')&&!photo.hidden){
  const image=document.createElement('img');image.src=photo.src;image.alt='';image.referrerPolicy='no-referrer';avatar.append(image);
 }else{
  const initials=$('ww-account-initials');
  if(initials&&!initials.hidden&&initials.textContent?.trim()){
   avatar.textContent=initials.textContent.trim();
  }else{
   avatar.innerHTML=svg('user');
  }
 }
}
renderIdentity();
window.addEventListener('wortweg:account',()=>queueMicrotask(renderIdentity));
const accountSlot=$('ww-account-slot');
if(accountSlot)new MutationObserver(renderIdentity).observe(accountSlot,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','src']});
const email=$('ww-account-email');
if(email)new MutationObserver(renderIdentity).observe(email,{childList:true,characterData:true,subtree:true});
window.WortWegSettingsNavigation={openPage,openHub,getCurrent:()=>current};
})();