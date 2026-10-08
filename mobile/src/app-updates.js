import {getAvailableUpdate} from './update-check.js';
const PREF_KEY='wortweg370-updates-v1';
const SNOOZE_MS=24*60*60*1000;
const CHECK_MS=30*60*1000;
const $=id=>document.getElementById(id);
function getPrefs(){
 try{
  const obj=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
  return {
   automatic:obj.automatic!==false,
   snoozeVersion:Number.isSafeInteger(obj.snoozeVersion)?obj.snoozeVersion:0,
   snoozeUntil:Number.isFinite(obj.snoozeUntil)?obj.snoozeUntil:0
  };
 }catch{return {automatic:true,snoozeVersion:0,snoozeUntil:0}}
}
function savePrefs(value){try{localStorage.setItem(PREF_KEY,JSON.stringify(value))}catch{}}
export function initNativeAppUpdates({Browser,versionCode,versionName,packageName,fetcher=fetch}){
 if(!Number.isSafeInteger(versionCode)||versionCode<1)return null;
 const prefs=getPrefs();
 const settings=$('settings')?.querySelector('.settings-grid');
 const home=$('dashboard .ww-main-menu');
 if(!settings||!home)return null;
 const section=document.createElement('div');section.className='card ww-updater-settings';
 section.innerHTML='<h3>App updates</h3><p id="ww-installed-version" class="muted tiny"></p><label class="settings-toggle"><input id="ww-update-auto" type="checkbox"> Check automatically for updates</label><p id="ww-update-status" role="status" aria-live="polite" class="muted tiny">Checks for new Android versions when online.</p><div class="ww-update-actions"><button class="btn secondary" type="button" id="ww-update-check">Check now</button><button class="btn primary" type="button" id="ww-update-settings-download" hidden>View update</button></div><p class="muted tiny">Installation is always your choice. Your learning history stays in this app during compatible updates.</p>';
 settings.append(section);
 $('ww-installed-version').textContent='Installed version: '+versionName+' ('+versionCode+')';
 const automatic=$('ww-update-auto');automatic.checked=prefs.automatic;
 const status=$('ww-update-status');
 const checkButton=$('ww-update-check');
 const downloadButton=$('ww-update-settings-download');
 const banner=document.createElement('button');banner.className='ww-update-banner';banner.type='button';banner.hidden=true;
 home.append(banner);
 const modal=document.createElement('div');modal.id='ww-update-overlay';modal.hidden=true;
 modal.innerHTML='<div class="ww-update-modal" role="dialog" aria-modal="true" aria-labelledby="ww-update-title" aria-describedby="ww-update-summary"><span class="ww-update-glyph" aria-hidden="true">↑</span><h2 id="ww-update-title">Update available</h2><p id="ww-update-summary"></p><p id="ww-update-notes"></p><div class="ww-update-buttons"><button type="button" id="ww-update-now" class="btn primary">View update</button><button type="button" id="ww-update-later" class="btn secondary">Later</button></div><p class="ww-update-detail">Opens the official GitHub APK release. Android will ask before installing.</p></div>';
 document.body.append(modal);
 const summary=$('ww-update-summary'),notes=$('ww-update-notes');
 let available=null,checking=null,lastCheck=0,previousFocus=null;
 function showModal(){
  if(!available)return;
  if(!modal.hidden)return;
  previousFocus=document.activeElement;modal.hidden=false;
  $('ww-update-now').focus();
 }
 function closeModal(snooze){
  modal.hidden=true;
  if(snooze&&available){
   prefs.snoozeVersion=available.versionCode;prefs.snoozeUntil=Date.now()+SNOOZE_MS;savePrefs(prefs);
  }
  previousFocus?.focus?.();
 }
 async function openOfficialRelease(){
  if(!available)return;
  // This destination is checked against a fixed trusted release-host path before use.
  try{await Browser.open({url:available.downloadUrl})}
  catch{status.textContent='Could not open the release. Please try again while online.'}
  closeModal(false);
 }
 function display(update,notify){
  if(!update.available){
   available=null;banner.hidden=true;downloadButton.hidden=true;
   status.textContent='You have the latest published version.';
   return;
  }
  available=update;
  status.textContent='Version '+update.versionName+' is available.';
  summary.textContent='Version '+update.versionName+' is ready.';
  notes.textContent=update.notes;
  banner.textContent='↑  Version '+update.versionName+' available · View update';
  banner.hidden=false;downloadButton.hidden=false;
  if(notify && !(prefs.snoozeVersion===update.versionCode&&Date.now()<prefs.snoozeUntil))showModal();
 }
 async function check(manual=false){
  if(checking)return checking;
  if(document.hidden)return false;
  if(!manual&&!prefs.automatic)return false;
  if(!manual&&Date.now()-lastCheck<CHECK_MS)return false;
  if(navigator.onLine===false){
   status.textContent='Offline. You can keep studying and check later.';
   return false;
  }
  lastCheck=Date.now();status.textContent='Checking for app updates…';
  checkButton.disabled=true;
  const controller=typeof AbortController!=='undefined'?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),9000):null;
  checking=(async()=>{
   try{
    const update=await getAvailableUpdate({fetcher,installedCode:versionCode,installedPackage:packageName,signal:controller?.signal});
    display(update,!manual);
    return update;
   }catch{
    status.textContent='Update check unavailable. Your offline lessons still work.';
    return false;
   }finally{
    if(timer)clearTimeout(timer);
    checkButton.disabled=false;checking=null;
   }
  })();
  return checking;
 }
 automatic.addEventListener('change',()=>{
  prefs.automatic=automatic.checked;savePrefs(prefs);
  status.textContent=prefs.automatic?'Automatic checks enabled.':'Automatic checks paused. Use Check now anytime.';
  if(prefs.automatic)check(true);
 });
 checkButton.addEventListener('click',()=>check(true));
 downloadButton.addEventListener('click',openOfficialRelease);
 banner.addEventListener('click',showModal);
 $('ww-update-now').addEventListener('click',openOfficialRelease);
 $('ww-update-later').addEventListener('click',()=>closeModal(true));
 modal.addEventListener('click',e=>{if(e.target===modal)closeModal(true)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){e.preventDefault();closeModal(true)}});
 window.addEventListener('online',()=>check());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
 if(prefs.automatic)check();
 return {check,getAvailable:()=>available};
}
